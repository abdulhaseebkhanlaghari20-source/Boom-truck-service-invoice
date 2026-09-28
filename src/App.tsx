/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Invoice, CompanySettings, ViewTab, Language } from './types/invoice';
import { DEFAULT_COMPANY_SETTINGS, INITIAL_INVOICES } from './utils/demoData';
import { generateNextInvoiceNumber, isInvoiceNumberDuplicate } from './utils/numbering';
import { calculateInvoiceTotals } from './utils/formatters';
import { translations } from './translations/i18n';
import {
  generateInvoicePdfBlob,
  downloadPdfBlob,
  shareInvoicePdfFile,
  canSharePdfFile,
  getInvoicePdfFilename,
} from './utils/pdfGenerator';
import { Header } from './components/Header';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { Dashboard } from './components/Dashboard';
import { SettingsSection } from './components/SettingsModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PreviewModal } from './components/PreviewModal';
import { InvoicePreview } from './components/InvoicePreview';
import { Loader2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

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

  const saveInvoicesToStorage = (updated: Invoice[]) => {
    setInvoices(updated);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
  };

  // 4. Current Invoice State for Form
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() =>
    createEmptyInvoice(invoices, lang)
  );
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);

  // 5. Active View Tab
  const [activeTab, setActiveTab] = useState<ViewTab>('create');

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

  // Helper to ensure an invoice is rendered in the dedicated 794px offscreen container
  const getInvoicePdfElement = async (inv: Invoice): Promise<HTMLElement> => {
    setPdfTargetInvoice(inv);
    // Wait for React to render and QRCode to complete inside offscreen container
    await new Promise((r) => setTimeout(r, 160));
    const offscreenEl = pdfOffscreenRef.current?.querySelector('[data-invoice-sheet="true"]') as HTMLElement;
    if (offscreenEl) return offscreenEl;
    const onScreenEl = document.getElementById(`invoice-preview-sheet-${inv.id}`);
    if (onScreenEl) return onScreenEl;
    return pdfOffscreenRef.current || document.body;
  };

  // Check if invoice number is duplicate in current list
  const isDuplicateInvoiceNumber = isInvoiceNumberDuplicate(
    currentInvoice.invoiceNumber,
    currentInvoice.id,
    invoices
  );

  // Save handler from form
  const handleSaveInvoice = (invToSave: Invoice) => {
    if (isInvoiceNumberDuplicate(invToSave.invoiceNumber, invToSave.id, invoices)) {
      return;
    }
    const exists = invoices.some((i) => i.id === invToSave.id);
    let updated: Invoice[];
    if (exists) {
      updated = invoices.map((i) => (i.id === invToSave.id ? invToSave : i));
    } else {
      updated = [invToSave, ...invoices];
    }
    saveInvoicesToStorage(updated);
    setIsEditingExisting(true);
    showToast(
      lang === 'ar' ? translations[lang].savedSuccess : translations[lang].savedSuccess,
      'success'
    );
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
      const blob = await generateInvoicePdfBlob(el);
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
      const result = await shareInvoicePdfFile(el, target);

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

  // 4. Email PDF Handler: Shares via native file share if available, or downloads PDF & opens email compose
  const handleEmailPdf = async (inv?: Invoice) => {
    const target = inv || currentInvoice;
    try {
      setIsGeneratingPdf(true);
      setGeneratingLabel(lang === 'ar' ? 'جاري إعداد الفاتورة للإرسال بالبريد...' : 'Preparing invoice email...');
      const el = await getInvoicePdfElement(target);
      const filename = getInvoicePdfFilename(target.invoiceNumber);

      const subject = `Invoice ${target.invoiceNumber} - ${companySettings.companyName || 'Boom Truck Service'}`;
      const body =
        lang === 'ar'
          ? `السلام عليكم ورحمة الله وبركاته،\n\nمرفق لكم فاتورة خدمة شاحنة رافعة (بوم ترَك) رقم ${target.invoiceNumber}.\n\nالعميل: ${target.customerName}\nالحمولة: ${target.truckCapacity}\nالموقع: ${target.city}\nالإجمالي: ${target.total} ر.س\n\nشاكرين لتعاملكم معنا.`
          : `Dear Customer,\n\nPlease find the attached Boom Truck service invoice ${target.invoiceNumber}.\n\nCustomer: ${target.customerName}\nCapacity: ${target.truckCapacity}\nLocation: ${target.city}\nTotal Amount: SAR ${target.total.toFixed(2)}\n\nThank you for your business.`;

      // If native file share is supported, attempt to open share sheet so user can select their email app
      if (canSharePdfFile()) {
        const result = await shareInvoicePdfFile(el, target, subject, body);
        if (result.sharedAsFile && result.success) {
          showToast(
            lang === 'ar' ? 'اختر تطبيق البريد لإرفاق الملف' : 'Select your email app to attach PDF',
            'success'
          );
          return;
        }
      }

      // Fallback: download PDF and open mailto
      const blob = await generateInvoicePdfBlob(el);
      downloadPdfBlob(blob, filename);
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      showToast(translations[lang].pdfEmailNotice, 'info');
    } catch (err: any) {
      console.error('Email PDF Error:', err);
      showToast(
        lang === 'ar' ? 'تعذر تجهيز البريد' : 'Failed to prepare email',
        'error'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Handler
  const handleOpenWhatsAppModal = (inv: Invoice) => {
    setWhatsAppModalInvoice(inv);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Main Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onNewInvoice={handleNewInvoice}
      />

      {/* Main Viewport Content */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            onShareWhatsApp={handleOpenWhatsAppModal}
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
            onShareWhatsApp={handleOpenWhatsAppModal}
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
        onShareWhatsApp={handleOpenWhatsAppModal}
      />

      {/* WhatsApp Sharing Modal */}
      <WhatsAppModal
        invoice={whatsAppModalInvoice}
        companySettings={companySettings}
        lang={lang}
        onClose={() => setWhatsAppModalInvoice(null)}
        onDownloadPdf={handleDownloadPdf}
        onSharePdf={handleSharePdf}
      />

      {/* 794px Fixed Offscreen PDF Rendering Container */}
      <div
        ref={pdfOffscreenRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          background: '#ffffff',
          zIndex: -999,
          pointerEvents: 'none',
        }}
      >
        <InvoicePreview
          invoice={pdfTargetInvoice || currentInvoice}
          companySettings={companySettings}
          lang={lang}
          isPrintOnly={false}
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
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

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 max-w-md p-4 rounded-lg shadow-lg border flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
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
