/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Invoice, CompanySettings, ViewTab, Language } from './types/invoice';
import { DEFAULT_COMPANY_SETTINGS, INITIAL_INVOICES } from './utils/demoData';
import { generateNextInvoiceNumber, isInvoiceNumberDuplicate } from './utils/numbering';
import { calculateInvoiceTotals, getWhatsAppShareUrl } from './utils/formatters';
import { translations } from './translations/i18n';
import {
  generateInvoicePdfBlob,
  downloadPdfBlob,
  shareInvoicePdfFile,
  canSharePdfFile,
  getInvoicePdfFilename,
} from './utils/pdfGenerator';
import {
  shareInvoiceImageFile,
  shareInvoiceEmail,
  getInvoiceImageFilename,
} from './utils/imageShare';
import { Header } from './components/Header';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { Dashboard } from './components/Dashboard';
import { SettingsSection } from './components/SettingsModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PreviewModal } from './components/PreviewModal';
import { InvoicePreview } from './components/InvoicePreview';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { useFirebaseAuth, logOut } from './lib/auth';
import {
  saveUserCompanySettings,
  loadUserCompanySettings,
  saveUserInvoice,
  loadUserInvoices,
  deleteUserInvoice,
  subscribeUserInvoices,
  subscribeUserAdminStatus,
  recordUserSession,
  checkIsUserSuspended,
} from './lib/firestoreService';
import { Loader2, CheckCircle2, AlertCircle, Info, X, Truck } from 'lucide-react';

const STORAGE_KEYS = {
  INVOICES: 'saudi_boom_truck_invoices_v1',
  SETTINGS: 'saudi_boom_truck_settings_v1',
  LANG: 'saudi_boom_truck_lang_v1',
};

function createEmptyInvoice(invoices: Invoice[], lang: Language): Invoice {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dueStr = due.toISOString().split('T')[0];

  const qty = 1;
  const rate = 1000;
  const { subtotal, vatAmount, total } = calculateInvoiceTotals(qty, rate, 'VAT 15%');

  return {
    id: `inv-${Date.now()}`,
    invoiceNumber: generateNextInvoiceNumber(invoices),
    invoiceDate: today,
    dueDate: dueStr,
    paymentStatus: 'Unpaid',
    customerName: '',
    customerPhone: '',
    customerVatNumber: '',
    city: 'Riyadh',
    customCity: '',
    truckCapacity: '20 Ton',
    serviceDescription:
      lang === 'ar'
        ? 'تأجير شاحنة رافعة هيدروليكية (Boom Truck) حمولة 20 طن لأعمال الرفع والنقل'
        : '20 Ton Boom Truck lifting and transportation services',
    quantity: qty,
    rate: rate,
    vatOption: 'VAT 15%',
    subtotal: subtotal,
    vatAmount: vatAmount,
    total: total,
    notes:
      lang === 'ar'
        ? 'مشغل معتمد ومعدات رفع مؤهلة مشمولة. السداد خلال ١٤ يوماً من تاريخ الفاتورة.'
        : 'Includes certified operator and rigging equipment. Payment due within 14 days.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  // 1. Language State
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'ar' || saved === 'en' ? saved : 'en';
  });

  // Firebase Auth State
  const { user, loading: authLoading } = useFirebaseAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      showToast(
        lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully',
        'info'
      );
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Sync HTML dir and lang attributes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // 2. Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName === '[COMPANY NAME]' || !parsed.companyName) {
          return DEFAULT_COMPANY_SETTINGS;
        }
        return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  // 3. Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading invoices from localStorage', e);
    }
    return INITIAL_INVOICES;
  });

  // Load and synchronize user's data from Cloud Firestore
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    // Load company settings from users/{uid}
    loadUserCompanySettings(uid)
      .then((remoteSettings) => {
        if (remoteSettings && remoteSettings.companyName) {
          setCompanySettings(remoteSettings);
          localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${uid}`, JSON.stringify(remoteSettings));
        } else {
          // If first time with no Firestore document, initialize with default/current settings and email
          const initial = {
            ...companySettings,
            email: user.email || companySettings.email,
          };
          saveUserCompanySettings(uid, initial).catch((err) =>
            console.warn('Initial settings sync warning:', err)
          );
        }
      })
      .catch((err) => {
        console.warn('Could not load company settings from Firestore:', err);
      });

    // Real-time subscription to users/{uid}/invoices
    const unsubscribe = subscribeUserInvoices(
      uid,
      (remoteInvoices) => {
        if (remoteInvoices && remoteInvoices.length > 0) {
          setInvoices(remoteInvoices);
          localStorage.setItem(`${STORAGE_KEYS.INVOICES}_${uid}`, JSON.stringify(remoteInvoices));
        } else if (remoteInvoices && remoteInvoices.length === 0) {
          // Check local cache for migration if newly registered
          const cached = localStorage.getItem(`${STORAGE_KEYS.INVOICES}_${uid}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((inv) => saveUserInvoice(uid, inv).catch(console.warn));
                setInvoices(parsed);
                return;
              }
            } catch (e) {}
          }
          setInvoices([]);
        }
      },
      (err) => {
        console.warn('Firestore subscription notice:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Admin Authorization State (Real-time Firestore listener)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsSuspended(false);
      return;
    }

    // Record login activity in Firestore for Admin tracking
    recordUserSession(user);

    // Verify if non-admin user account has been suspended by Admin
    checkIsUserSuspended(user.uid).then((suspended) => {
      setIsSuspended(suspended);
    });

    const unsubscribe = subscribeUserAdminStatus(user.uid, (adminStatus) => {
      setIsAdmin(adminStatus);
      if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
        if (adminStatus) {
          setActiveTab('admin');
        } else {
          setActiveTab('create');
          window.history.replaceState(null, '', '/');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleSaveSettings = (newSettings: CompanySettings) => {
    const userEmail = user?.email || newSettings.email;
    const settingsToSave = { ...newSettings, email: userEmail };
    setCompanySettings(settingsToSave);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsToSave));
    if (user) {
      localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${user.uid}`, JSON.stringify(settingsToSave));
      saveUserCompanySettings(user.uid, settingsToSave).catch((err) => {
        console.warn('Firestore save company settings notice:', err);
      });
    }
    // If drafting a new invoice (not an existing historical invoice), update it to show new settings immediately
    if (!isEditingExisting) {
      setCurrentInvoice((prev) => ({
        ...prev,
      }));
    }
    showToast(
      lang === 'ar' ? 'تم حفظ بيانات المؤسسة بنجاح' : 'Company settings saved successfully',
      'success'
    );
  };

  const saveInvoicesToStorage = (updated: Invoice[]) => {
    setInvoices(updated);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
    if (user) {
      localStorage.setItem(`${STORAGE_KEYS.INVOICES}_${user.uid}`, JSON.stringify(updated));
    }
  };

  // 4. Current Invoice State for Form
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() =>
    createEmptyInvoice(invoices, lang)
  );
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);

  // 5. Active View Tab
  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'create';
  });

  // Sync browser URL with /admin route
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeTab === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [activeTab]);

  // 6. Modals State
  const [previewModalInvoice, setPreviewModalInvoice] = useState<Invoice | null>(null);
  const [whatsAppModalInvoice, setWhatsAppModalInvoice] = useState<Invoice | null>(null);
  const [printTargetInvoice, setPrintTargetInvoice] = useState<Invoice | null>(null);

  // 7. PDF Generation State & Refs
  const pdfOffscreenRef = useRef<HTMLDivElement>(null);
  const [pdfTargetInvoice, setPdfTargetInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [generatingLabel, setGeneratingLabel] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Helper to ensure an invoice is rendered in the dedicated 794px container or current screen
  const getInvoicePdfElement = async (inv: Invoice): Promise<HTMLElement> => {
    const targetId = inv?.id;

    // 1. If the offscreen A4 container is already mounted with this invoice, use it instantly (0ms delay to preserve user gesture!)
    const offscreenEl = pdfOffscreenRef.current?.querySelector('[data-invoice-sheet="true"]') as HTMLElement;
    if (offscreenEl && offscreenEl.id === `invoice-preview-sheet-${targetId}`) {
      return offscreenEl;
    }

    // 2. If invoice is on screen, unscaled, and window is full desktop (>= 850px), use it directly
    const onScreenEl = document.getElementById(`invoice-preview-sheet-${targetId}`);
    const isScaled = !onScreenEl || window.innerWidth < 850 || (onScreenEl.style.transform && onScreenEl.style.transform !== 'none');

    if (onScreenEl && !isScaled && onScreenEl.clientHeight > 200) {
      return onScreenEl;
    }

    // 3. Otherwise, set target invoice and wait minimally for DOM update
    setPdfTargetInvoice(inv);
    await new Promise((r) => setTimeout(r, 60));

    try {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded') {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 60))]);
      }
    } catch {}

    const updatedOffscreen = pdfOffscreenRef.current?.querySelector('[data-invoice-sheet="true"]') as HTMLElement;
    if (updatedOffscreen) return updatedOffscreen;
    if (offscreenEl) return offscreenEl;
    if (onScreenEl) return onScreenEl;
    return pdfOffscreenRef.current || document.body;
  };

  // Check if invoice number is duplicate in current list
  const isDuplicateInvoiceNumber = isInvoiceNumberDuplicate(
    currentInvoice.invoiceNumber,
    currentInvoice.id,
    invoices
  );

  // Reload invoices from Firestore when user opens the Invoice List tab
  useEffect(() => {
    if (activeTab === 'list' && user) {
      loadUserInvoices(user.uid)
        .then((remoteInvoices) => {
          if (remoteInvoices) {
            setInvoices(remoteInvoices);
            localStorage.setItem(`${STORAGE_KEYS.INVOICES}_${user.uid}`, JSON.stringify(remoteInvoices));
          }
        })
        .catch((err) => {
          console.warn('Notice loading invoices on list tab:', err);
        });
    }
  }, [activeTab, user]);

  // Save handler from form
  const handleSaveInvoice = (invToSave: Invoice) => {
    if (isInvoiceNumberDuplicate(invToSave.invoiceNumber, invToSave.id, invoices)) {
      return;
    }
    const existing = invoices.find((i) => i.id === invToSave.id);

    // If existing invoice already has a companySnapshot, PRESERVE IT (Requirement #5)!
    // If it's a newly saved invoice, snapshot the current companySettings!
    const companySnapshot = existing?.companySnapshot || invToSave.companySnapshot || { ...companySettings };

    const invoiceWithCompany: Invoice = {
      ...invToSave,
      companySnapshot,
      updatedAt: new Date().toISOString(),
    };

    let updated: Invoice[];
    if (existing) {
      updated = invoices.map((i) => (i.id === invToSave.id ? invoiceWithCompany : i));
    } else {
      updated = [invoiceWithCompany, ...invoices];
    }
    saveInvoicesToStorage(updated);
    setCurrentInvoice(invoiceWithCompany);
    setIsEditingExisting(true);

    // Save to Firestore under users/{userId}/invoices/{invoiceId}
    if (user) {
      saveUserInvoice(user.uid, invoiceWithCompany).catch((err) => {
        console.warn('Notice saving invoice to Firestore:', err);
      });
    }

    showToast(translations[lang].savedSuccess, 'success');
  };

  // New Invoice handler
  const handleNewInvoice = () => {
    const fresh = createEmptyInvoice(invoices, lang);
    setCurrentInvoice(fresh);
    setIsEditingExisting(false);
    setActiveTab('create');
  };

  // Edit from history or modal
  const handleEditInvoice = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setIsEditingExisting(true);
    setActiveTab('create');
    setPreviewModalInvoice(null);
  };

  // Delete from history
  const handleDeleteInvoice = (id: string) => {
    const updated = invoices.filter((i) => i.id !== id);
    saveInvoicesToStorage(updated);
    if (currentInvoice.id === id) {
      handleNewInvoice();
    }

    // Delete from Firestore under users/{userId}/invoices/{invoiceId}
    if (user) {
      deleteUserInvoice(user.uid, id).catch((err) => {
        console.warn('Notice deleting invoice from Firestore:', err);
      });
    }

    showToast(translations[lang].deletedSuccess, 'info');
  };

  // Print Handler
  const handlePrint = (inv?: Invoice) => {
    const target = inv || currentInvoice;
    setPrintTargetInvoice(target);
    // Short tick to ensure state is rendered before print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // 1. Download PDF Handler: Generates actual A4 PDF and downloads as Invoice-INV-001.pdf
  const handleDownloadPdf = async (inv?: Invoice) => {
    const target = inv || currentInvoice;
    try {
      setIsGeneratingPdf(true);
      setGeneratingLabel(lang === 'ar' ? 'جاري تجهيز ملف الـ PDF الرسمي...' : 'Generating official A4 PDF...');
      const el = await getInvoicePdfElement(target);
      const blob = await generateInvoicePdfBlob(el, target, companySettings);
      const filename = getInvoicePdfFilename(target.invoiceNumber);
      downloadPdfBlob(blob, filename);
      showToast(
        lang === 'ar'
          ? `تم تحميل ${filename} بنجاح`
          : `Downloaded ${filename} successfully`,
        'success'
      );
    } catch (err: any) {
      console.error('PDF Download Error:', err);
      showToast(
        lang === 'ar' ? 'فشل إنشاء ملف PDF' : 'Failed to generate PDF document',
        'error'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Share PDF Handler: Uses native Web Share API with real PDF file where supported, falls back to download
  const handleSharePdf = async (inv?: Invoice) => {
    const target = inv || currentInvoice;
    try {
      setIsGeneratingPdf(true);
      setGeneratingLabel(lang === 'ar' ? 'جاري تجهيز مشاركة المستند...' : 'Preparing PDF file share...');
      const el = await getInvoicePdfElement(target);
      const result = await shareInvoicePdfFile(el, target, companySettings);

      if (result.sharedAsFile && result.success) {
        showToast(
          lang === 'ar' ? 'تم فتح قائمة المشاركة بنجاح' : 'Opened document share sheet',
          'success'
        );
      } else if (result.downloadedFallback) {
        showToast(translations[lang].fileSharingNotSupported, 'info');
      } else if (result.error && result.method !== 'aborted') {
        showToast(result.error, 'error');
      }
    } catch (err: any) {
      console.error('PDF Share Error:', err);
      showToast(
        lang === 'ar' ? 'حدث خطأ أثناء المشاركة' : 'Error sharing PDF document',
        'error'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 4. Email Image Share Handler: Converts complete invoice to high-quality PNG image and shares via native share sheet (allowing Gmail/Email app selection with image attached), or downloads PNG and opens mailto
  const handleEmailPdf = async (inv?: Invoice) => {
    const target = inv || currentInvoice;
    try {
      setIsGeneratingPdf(true);
      setGeneratingLabel(
        lang === 'ar'
          ? 'جاري تجهيز صورة الفاتورة للبريد الإلكتروني...'
          : 'Generating invoice image for Email...'
      );
      const el = await getInvoicePdfElement(target);
      const filename = getInvoiceImageFilename(target.invoiceNumber);

      const result = await shareInvoiceEmail(el, target, companySettings, lang);

      if (result.method === 'aborted') {
        return;
      }

      if (result.sharedAsFile && result.success) {
        showToast(
          lang === 'ar'
            ? 'اختر تطبيق البريد (مثل Gmail) لإرسال الفاتورة كصورة مرفقة'
            : 'Select your email app (e.g. Gmail) to attach and send the invoice image',
          'success'
        );
      } else {
        // Fallback when native file share isn't supported (e.g. desktop browser)
        showToast(
          lang === 'ar'
            ? `تم تحميل صورة الفاتورة (${filename}) وفتح البريد. يرجى إرفاق الصورة المحمّلة بالرسالة.`
            : `Invoice image downloaded (${filename}) & email opened. Please attach the downloaded image in your email.`,
          'info'
        );
      }
    } catch (err: any) {
      console.error('Email Share Error:', err);
      showToast(
        lang === 'ar' ? 'تعذر تجهيز البريد الإلكتروني' : 'Failed to prepare email',
        'error'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 3. WhatsApp Image Handler: Converts complete rendered invoice to high-quality PNG image and shares as an IMAGE file attachment via native share, or downloads PNG automatically
  const handleWhatsAppShare = async (inv?: Invoice) => {
    const target = inv || currentInvoice;
    try {
      setIsGeneratingPdf(true);
      setGeneratingLabel(
        lang === 'ar'
          ? 'جاري تجهيز صورة الفاتورة للواتساب...'
          : 'Generating high-quality invoice image for WhatsApp...'
      );
      const el = await getInvoicePdfElement(target);
      const filename = getInvoiceImageFilename(target.invoiceNumber);

      const result = await shareInvoiceImageFile(el, target);

      if (result.method === 'aborted') {
        return;
      }

      if (result.sharedAsFile && result.success) {
        showToast(
          lang === 'ar'
            ? 'اختر واتساب من قائمة المشاركة لإرسال الفاتورة كصورة مرفقة'
            : 'Select WhatsApp in the share sheet to attach and send the invoice image',
          'success'
        );
      } else {
        // Device/browser does not support native image file sharing (e.g. Desktop Chrome)
        // Image is automatically downloaded by shareInvoiceImageFile; open helpful guidance modal
        showToast(
          lang === 'ar'
            ? `تم تحميل صورة الفاتورة (${filename}). يرجى إرفاق الصورة المحمّلة في محادثة واتساب.`
            : `Invoice image downloaded (${filename}). Please attach this downloaded image in WhatsApp.`,
          'info'
        );
        setWhatsAppModalInvoice(target);
      }
    } catch (err: any) {
      console.error('WhatsApp Image Share Error:', err);
      showToast(
        lang === 'ar' ? 'تعذر تجهيز صورة الفاتورة' : 'Failed to prepare invoice image',
        'error'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Modal Opener (for manual step review if needed)
  const handleOpenWhatsAppModal = (inv: Invoice) => {
    setWhatsAppModalInvoice(inv);
  };

  // 1. Authentication Loading state (prevents UI flicker on refresh)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-emerald-500/20">
          <Truck className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>{lang === 'ar' ? 'جاري التحقق من الحساب...' : 'Checking authentication...'}</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: Show Login / Signup / Forgot Password screen
  if (!user) {
    return <AuthScreen lang={lang} onLanguageChange={setLang} />;
  }

  // 2.5 Suspended state: Soft-lock enforcement screen
  if (isSuspended && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4 text-center selection:bg-rose-500/20">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-5 shadow-xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
          {lang === 'ar' ? 'تم تعليق هذا الحساب' : 'Account Suspended'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {lang === 'ar'
            ? 'تم إيقاف صلاحيات الوصول لهذا الحساب من قِبل إدارة النظام. يرجى التواصل مع إدارة المنصة للمزيد من المعلومات.'
            : 'Access to this account has been suspended by the platform administrator. Please contact support.'}
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>
    );
  }

  // 3. Authenticated state: Show EXISTING application
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Main Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onNewInvoice={handleNewInvoice}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      {/* Main Viewport Content */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {activeTab === 'create' && (
          <InvoiceForm
            invoice={currentInvoice}
            setInvoice={setCurrentInvoice}
            companySettings={companySettings}
            lang={lang}
            onSave={handleSaveInvoice}
            onNew={handleNewInvoice}
            onPrint={() => handlePrint(currentInvoice)}
            onDownloadPdf={() => handleDownloadPdf(currentInvoice)}
            onSharePdf={() => handleSharePdf(currentInvoice)}
            onEmailPdf={() => handleEmailPdf(currentInvoice)}
            onShareWhatsApp={() => handleWhatsAppShare(currentInvoice)}
            isDuplicateInvoiceNumber={isDuplicateInvoiceNumber}
            isEditingExisting={isEditingExisting}
          />
        )}

        {activeTab === 'list' && (
          <InvoiceList
            invoices={invoices}
            lang={lang}
            onView={(inv) => setPreviewModalInvoice(inv)}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onPrint={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            onSharePdf={handleSharePdf}
            onEmailPdf={handleEmailPdf}
            onShareWhatsApp={handleWhatsAppShare}
            onNew={handleNewInvoice}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            invoices={invoices}
            lang={lang}
            onNew={handleNewInvoice}
            onView={(inv) => setPreviewModalInvoice(inv)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsSection
            settings={companySettings}
            onSave={handleSaveSettings}
            lang={lang}
          />
        )}

        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminDashboard
              lang={lang}
              onViewInvoice={(inv) => setPreviewModalInvoice(inv)}
              onBackToApp={() => setActiveTab('create')}
            />
          ) : (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12 shadow-xs">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {lang === 'ar' ? 'غير مصرح بالدخول' : 'Access Restricted'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {lang === 'ar'
                  ? 'لوحة التحكم هذه مخصصة للمدير المعتمد فقط.'
                  : 'The Admin Dashboard is only accessible to authorized administrators.'}
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                {lang === 'ar' ? 'العودة للتطبيق' : 'Back to Invoices'}
              </button>
            </div>
          )
        )}
      </main>

      {/* Fullscreen Invoice Preview Modal */}
      <PreviewModal
        invoice={previewModalInvoice}
        companySettings={companySettings}
        lang={lang}
        onClose={() => setPreviewModalInvoice(null)}
        onEdit={handleEditInvoice}
        onPrint={() => handlePrint(previewModalInvoice!)}
        onDownloadPdf={() => handleDownloadPdf(previewModalInvoice!)}
        onSharePdf={() => handleSharePdf(previewModalInvoice!)}
        onEmailPdf={() => handleEmailPdf(previewModalInvoice!)}
        onShareWhatsApp={handleWhatsAppShare}
      />

      {/* WhatsApp Sharing Modal */}
      <WhatsAppModal
        invoice={whatsAppModalInvoice}
        companySettings={companySettings}
        lang={lang}
        onClose={() => setWhatsAppModalInvoice(null)}
        onDownloadPdf={handleDownloadPdf}
        onSharePdf={handleWhatsAppShare}
      />

      {/* 794px Fixed Offscreen PDF Rendering Container */}
      <div
        ref={pdfOffscreenRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '794px',
          background: '#ffffff',
          zIndex: -9999,
          opacity: 1,
          pointerEvents: 'none',
        }}
      >
        <InvoicePreview
          invoice={pdfTargetInvoice || previewModalInvoice || currentInvoice}
          companySettings={companySettings}
          lang={lang}
          isPrintOnly={true}
        />
      </div>

      {/* Hidden Print Container specifically targeted by @media print */}
      <div className="hidden print:block">
        <InvoicePreview
          invoice={printTargetInvoice || currentInvoice}
          companySettings={companySettings}
          lang={lang}
          isPrintOnly={true}
        />
      </div>

      {/* Loading Overlay during PDF Generation */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-3 max-w-xs text-center border border-slate-200 animate-in fade-in zoom-in-95">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-bold text-slate-800">
              {generatingLabel || translations[lang].generatingPdf}
            </span>
            <span className="text-[11px] text-slate-500">
              {lang === 'ar'
                ? 'جاري معالجة وتصدير وثيقة A4 الرسمية'
                : 'Rendering high-resolution A4 document'}
            </span>
          </div>
        </div>
      )}

      {/* Toast Notification Banner - Visible on top of modals */}
      {toast && (
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:top-auto z-[9999] max-w-md p-4 rounded-lg shadow-xl border flex items-start gap-3 animate-in slide-in-from-top-5 sm:slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs leading-relaxed">{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="no-print mt-auto py-4 border-t border-slate-200 bg-white text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {lang === 'ar'
              ? 'مُولّد فواتير شاحنات الرافعة (بوم ترَك) · المملكة العربية السعودية'
              : 'Saudi Boom Truck & Heavy Equipment Invoice Generator · Kingdom of Saudi Arabia'}
          </span>
          <span className="font-mono text-slate-400">
            {lang === 'ar' ? 'ضريبة القيمة المضافة ١٥٪ · زاتكا' : 'VAT 15% · ZATCA Compliant'}
          </span>
        </div>
      </footer>
    </div>
  );
}
