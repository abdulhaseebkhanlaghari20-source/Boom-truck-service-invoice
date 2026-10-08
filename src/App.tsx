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
import { CustomerManager } from './components/CustomerManager';
import { ServiceManager } from './components/ServiceManager';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { SettingsSection } from './components/SettingsModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PreviewModal } from './components/PreviewModal';
import { InvoicePreview } from './components/InvoicePreview';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { useFirebaseAuth, logOut } from './lib/auth';
import {
  CompanyWorkspace,
  Customer,
  ServiceCatalogItem,
} from './types/invoice';
import {
  createNewWorkspace,
  getStoredActiveWorkspaceId,
  setStoredActiveWorkspaceId,
  loadLocalUserWorkspaces,
  saveLocalUserWorkspaces,
  loadCompanyCustomers,
  saveCompanyCustomers,
  loadCompanyServices,
  saveCompanyServices,
  loadCompanyInvoices,
  saveCompanyInvoices,
  generateCompanyInvoiceNumber,
  workspaceToCompanySettings,
  companySettingsToWorkspace,
} from './lib/workspaceManager';
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

function createEmptyInvoice(
  invoices: Invoice[],
  lang: Language,
  workspace?: CompanyWorkspace | null,
  customer?: Customer,
  service?: ServiceCatalogItem
): Invoice {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dueStr = due.toISOString().split('T')[0];

  const qty = 1;
  const rate = service ? service.defaultRate : 1000;
  const vatEnabled = workspace?.taxSettings?.vatEnabled ?? true;
  const vatPercent = workspace?.taxSettings?.vatRate ?? 15;
  const vatOption = vatEnabled ? 'VAT 15%' : 'No VAT';
  const { subtotal, vatAmount, total } = calculateInvoiceTotals(qty, rate, vatOption);

  const invNumber = workspace
    ? generateCompanyInvoiceNumber(invoices, workspace.numberingSettings)
    : generateNextInvoiceNumber(invoices);

  const defaultUnit = service?.defaultUnit || 'Day';
  const defaultDesc = service
    ? (lang === 'ar' && service.descriptionAr ? service.descriptionAr : service.description || service.name)
    : lang === 'ar'
    ? 'تأجير شاحنة رافعة هيدروليكية (Boom Truck) حمولة 20 طن لأعمال الرفع والنقل'
    : '20 Ton Boom Truck lifting and transportation services';

  const defaultServiceName = service
    ? (lang === 'ar' && service.nameAr ? service.nameAr : service.name)
    : lang === 'ar'
    ? 'تأجير بوم ترك'
    : 'Boom Truck Rental';

  const selectedBankId =
    workspace?.bankAccounts?.find((b) => b.isDefault)?.id ||
    workspace?.bankAccounts?.[0]?.id;

  return {
    id: `inv-${Date.now()}`,
    companyId: workspace?.id,
    customerId: customer?.id,
    selectedBankAccountId: selectedBankId,
    invoiceNumber: invNumber,
    invoiceDate: today,
    dueDate: dueStr,
    paymentStatus: 'Unpaid',
    customerName: customer?.name || '',
    customerPhone: customer?.phone || '',
    customerAddress: customer?.address || '',
    customerVatNumber: customer?.vatNumber || '',
    city: 'Riyadh',
    customCity: '',
    jobLocation: 'Riyadh',
    truckCapacity: '20 Ton',
    serviceDescription: defaultDesc,
    quantity: qty,
    rate: rate,
    unit: defaultUnit,
    quantityColumnType: service?.defaultBillingType || 'days',
    items: [
      {
        id: `item-${Date.now()}`,
        serviceId: service?.id,
        serviceName: defaultServiceName,
        description: defaultDesc,
        unit: defaultUnit,
        quantity: qty,
        rate: rate,
        vatRate: vatEnabled ? (vatPercent / 100) : 0,
        vatAmount: vatAmount,
        subtotal: subtotal,
        total: total,
      },
    ],
    vatOption: vatOption,
    vatRatePercent: vatPercent,
    subtotal: subtotal,
    vatAmount: vatAmount,
    total: total,
    paidAmount: 0,
    amountDue: total,
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

  // 2. Multi-Company / Business Workspace State
  const [workspaces, setWorkspaces] = useState<CompanyWorkspace[]>(() => {
    if (!user) return [];
    return loadLocalUserWorkspaces(user.uid);
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    return getStoredActiveWorkspaceId();
  });
  const [showSetupWizard, setShowSetupWizard] = useState<boolean>(false);
  const [wizardWorkspace, setWizardWorkspace] = useState<CompanyWorkspace | null>(null);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

  // 3. Company Settings State (Derived from active workspace or local storage)
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    if (activeWorkspace) {
      return workspaceToCompanySettings(activeWorkspace);
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName && parsed.companyName !== '[COMPANY NAME]') {
          return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  // 4. Customers & Services Catalog State (Strictly Isolated per Company Workspace)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (activeWorkspace?.id) {
      return loadCompanyCustomers(activeWorkspace.id);
    }
    return [];
  });

  const [services, setServices] = useState<ServiceCatalogItem[]>(() => {
    if (activeWorkspace?.id) {
      return loadCompanyServices(activeWorkspace.id);
    }
    return [];
  });

  // 5. Invoices State (Isolated per Company Workspace)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (activeWorkspace?.id) {
      const companyInvs = loadCompanyInvoices(activeWorkspace.id);
      if (companyInvs.length > 0) return companyInvs;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading invoices from localStorage', e);
    }
    return INITIAL_INVOICES;
  });

  // Initialize and synchronize multi-company workspaces on user authentication
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const existingWorkspaces = loadLocalUserWorkspaces(uid);
    if (existingWorkspaces && existingWorkspaces.length > 0) {
      setWorkspaces(existingWorkspaces);
      const storedId = getStoredActiveWorkspaceId(uid);
      const matched = existingWorkspaces.find((w) => w.id === storedId) || existingWorkspaces[0];
      setActiveWorkspaceId(matched.id);
      setStoredActiveWorkspaceId(matched.id, uid);
      setCompanySettings(workspaceToCompanySettings(matched));
      setCustomers(loadCompanyCustomers(matched.id));
      setServices(loadCompanyServices(matched.id));
      const companyInvs = loadCompanyInvoices(matched.id);
      setInvoices(companyInvs);

      if (!matched.isSetupComplete) {
        setShowSetupWizard(true);
      }
    } else {
      // First-time business setup detection
      loadUserCompanySettings(uid)
        .then((remoteSettings) => {
          if (remoteSettings && remoteSettings.companyName && remoteSettings.companyName !== '[COMPANY NAME]') {
            // Migrate single-company account to first workspace
            const migratedWs: CompanyWorkspace = {
              id: `comp-${uid.slice(0, 8)}`,
              ownerUid: uid,
              name: remoteSettings.companyName,
              nameAr: remoteSettings.companyNameAr || '',
              businessActivity: remoteSettings.businessActivity || '',
              businessActivityAr: remoteSettings.businessActivityAr || '',
              logoUrl: remoteSettings.logoUrl || '',
              phone: remoteSettings.phone || '',
              whatsapp: remoteSettings.whatsapp || '',
              email: remoteSettings.email || user.email || '',
              address: remoteSettings.address || '',
              addressAr: remoteSettings.addressAr || '',
              vatNumber: remoteSettings.vatNumber || '',
              crNumber: remoteSettings.crNumber || '',
              bankAccounts: remoteSettings.bankAccounts || [
                {
                  id: 'bank-1',
                  bankName: remoteSettings.bankName || '',
                  accountNumber: remoteSettings.bankAccountNumber || '',
                  iban: remoteSettings.iban || '',
                  isDefault: true,
                },
              ],
              taxSettings: remoteSettings.taxSettings || {
                vatEnabled: true,
                vatRate: 15,
                vatNumber: remoteSettings.vatNumber || '',
              },
              numberingSettings: remoteSettings.numberingSettings || {
                prefix: 'INV-',
                startingNumber: 1,
                digits: 4,
              },
              invoiceTemplateSettings: {
                showSeal: true,
                taglineEn: remoteSettings.taglineEn || '',
                taglineAr: remoteSettings.taglineAr || '',
                closingNoteEn: remoteSettings.closingNoteEn || 'Thank you for your business',
                closingNoteAr: remoteSettings.closingNoteAr || 'شكراً لتعاملكم معنا',
              },
              isSetupComplete: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            const list = [migratedWs];
            setWorkspaces(list);
            saveLocalUserWorkspaces(uid, list);
            setActiveWorkspaceId(migratedWs.id);
            setStoredActiveWorkspaceId(migratedWs.id, uid);
            setCompanySettings(remoteSettings);
          } else {
            // Brand new business account: create clean workspace and show Setup Wizard
            const brandNewWs = createNewWorkspace(uid, user.email || '');
            const list = [brandNewWs];
            setWorkspaces(list);
            saveLocalUserWorkspaces(uid, list);
            setActiveWorkspaceId(brandNewWs.id);
            setStoredActiveWorkspaceId(brandNewWs.id, uid);
            setWizardWorkspace(brandNewWs);
            setShowSetupWizard(true);
          }
        })
        .catch(() => {
          const brandNewWs = createNewWorkspace(uid, user.email || '');
          const list = [brandNewWs];
          setWorkspaces(list);
          saveLocalUserWorkspaces(uid, list);
          setActiveWorkspaceId(brandNewWs.id);
          setStoredActiveWorkspaceId(brandNewWs.id, uid);
          setWizardWorkspace(brandNewWs);
          setShowSetupWizard(true);
        });
    }

    // Real-time subscription to user invoices
    const unsubscribe = subscribeUserInvoices(
      uid,
      (remoteInvoices) => {
        if (remoteInvoices && remoteInvoices.length > 0) {
          // If active workspace is known, filter invoices belonging to this company workspace
          const activeId = getStoredActiveWorkspaceId();
          if (activeId) {
            const companyOnly = remoteInvoices.filter((inv) => !inv.companyId || inv.companyId === activeId);
            setInvoices(companyOnly);
            saveCompanyInvoices(activeId, companyOnly);
          } else {
            setInvoices(remoteInvoices);
          }
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

    if (activeWorkspace) {
      const updatedWs = companySettingsToWorkspace(settingsToSave, activeWorkspace);
      const nextList = workspaces.map((w) => (w.id === updatedWs.id ? updatedWs : w));
      setWorkspaces(nextList);
      if (user) {
        saveLocalUserWorkspaces(user.uid, nextList);
      }
    }

    if (user) {
      localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${user.uid}`, JSON.stringify(settingsToSave));
      saveUserCompanySettings(user.uid, settingsToSave).catch((err) => {
        console.warn('Firestore save company settings notice:', err);
      });
    }

    if (!isEditingExisting) {
      setCurrentInvoice((prev) => ({
        ...prev,
      }));
    }
    showToast(
      lang === 'ar' ? 'تم حفظ بيانات المنشأة بنجاح' : 'Company profile saved successfully',
      'success'
    );
  };

  const saveInvoicesToStorage = (updated: Invoice[]) => {
    setInvoices(updated);
    if (activeWorkspace) {
      saveCompanyInvoices(activeWorkspace.id, updated);
    }
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
    if (user) {
      localStorage.setItem(`${STORAGE_KEYS.INVOICES}_${user.uid}`, JSON.stringify(updated));
    }
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setStoredActiveWorkspaceId(workspaceId, user?.uid);
    const targetWs = workspaces.find((w) => w.id === workspaceId);
    if (targetWs) {
      const wsInvoices = loadCompanyInvoices(targetWs.id);
      const wsCustomers = loadCompanyCustomers(targetWs.id);
      const wsServices = loadCompanyServices(targetWs.id);
      setInvoices(wsInvoices);
      setCustomers(wsCustomers);
      setServices(wsServices);
      const wsSettings = workspaceToCompanySettings(targetWs);
      setCompanySettings(wsSettings);
      const fresh = createEmptyInvoice(wsInvoices, lang, targetWs);
      setCurrentInvoice(fresh);
      setIsEditingExisting(false);
      showToast(
        lang === 'ar'
          ? `تم الانتقال إلى: ${targetWs.nameAr || targetWs.name}`
          : `Switched to workspace: ${targetWs.name || 'Company'}`,
        'info'
      );
    }
  };

  const handleAddNewWorkspace = () => {
    if (!user) return;
    const newWs = createNewWorkspace(user.uid, user.email || '');
    setWizardWorkspace(newWs);
    setShowSetupWizard(true);
  };

  const handleWizardComplete = (
    updatedWorkspace: CompanyWorkspace,
    firstCustomer?: Customer,
    firstService?: ServiceCatalogItem
  ) => {
    if (!user) return;
    const markedWs: CompanyWorkspace = { ...updatedWorkspace, isSetupComplete: true };
    const existingIdx = workspaces.findIndex((w) => w.id === markedWs.id);
    let updatedWorkspaces: CompanyWorkspace[];
    if (existingIdx >= 0) {
      updatedWorkspaces = [...workspaces];
      updatedWorkspaces[existingIdx] = markedWs;
    } else {
      updatedWorkspaces = [...workspaces, markedWs];
    }

    setWorkspaces(updatedWorkspaces);
    saveLocalUserWorkspaces(user.uid, updatedWorkspaces);
    setActiveWorkspaceId(markedWs.id);
    setStoredActiveWorkspaceId(markedWs.id, user.uid);

    // Save first customer if created
    let newCustomersList = loadCompanyCustomers(markedWs.id);
    if (firstCustomer && firstCustomer.name) {
      newCustomersList = [firstCustomer, ...newCustomersList];
      saveCompanyCustomers(markedWs.id, newCustomersList);
      setCustomers(newCustomersList);
    }

    // Save first service if created
    let newServicesList = loadCompanyServices(markedWs.id);
    if (firstService && firstService.name) {
      newServicesList = [firstService, ...newServicesList];
      saveCompanyServices(markedWs.id, newServicesList);
      setServices(newServicesList);
    }

    const newSettings = workspaceToCompanySettings(markedWs);
    setCompanySettings(newSettings);

    const existingInvoices = loadCompanyInvoices(markedWs.id);
    const freshInv = createEmptyInvoice(
      existingInvoices,
      lang,
      markedWs,
      firstCustomer,
      firstService
    );
    setCurrentInvoice(freshInv);
    setIsEditingExisting(false);
    setActiveTab('create');
    setShowSetupWizard(false);
    setWizardWorkspace(null);

    showToast(
      lang === 'ar'
        ? 'تم إعداد المنشأة بنجاح! يمكنك الآن إصدار فواتيرك فوراً.'
        : 'Business setup complete! You can now create your invoices.',
      'success'
    );
  };

  const handleSaveCustomer = (customer: Customer) => {
    if (!activeWorkspace) return;
    const existingIdx = customers.findIndex((c) => c.id === customer.id);
    let updated: Customer[];
    if (existingIdx >= 0) {
      updated = customers.map((c) => (c.id === customer.id ? customer : c));
    } else {
      updated = [customer, ...customers];
    }
    setCustomers(updated);
    saveCompanyCustomers(activeWorkspace.id, updated);
    showToast(
      lang === 'ar' ? 'تم حفظ بيانات العميل بنجاح' : 'Customer saved successfully',
      'success'
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (!activeWorkspace) return;
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    saveCompanyCustomers(activeWorkspace.id, updated);
    showToast(
      lang === 'ar' ? 'تم حذف العميل' : 'Customer deleted',
      'info'
    );
  };

  const handleSelectCustomerForInvoice = (customer: Customer) => {
    const fresh = createEmptyInvoice(invoices, lang, activeWorkspace, customer);
    setCurrentInvoice(fresh);
    setIsEditingExisting(false);
    setActiveTab('create');
  };

  const handleSaveService = (service: ServiceCatalogItem) => {
    if (!activeWorkspace) return;
    const existingIdx = services.findIndex((s) => s.id === service.id);
    let updated: ServiceCatalogItem[];
    if (existingIdx >= 0) {
      updated = services.map((s) => (s.id === service.id ? service : s));
    } else {
      updated = [service, ...services];
    }
    setServices(updated);
    saveCompanyServices(activeWorkspace.id, updated);
    showToast(
      lang === 'ar' ? 'تم حفظ الخدمة في دليل الخدمات بنجاح' : 'Service saved to catalog successfully',
      'success'
    );
  };

  const handleDeleteService = (serviceId: string) => {
    if (!activeWorkspace) return;
    const updated = services.filter((s) => s.id !== serviceId);
    setServices(updated);
    saveCompanyServices(activeWorkspace.id, updated);
    showToast(
      lang === 'ar' ? 'تم حذف الخدمة من الدليل' : 'Service deleted from catalog',
      'info'
    );
  };

  // 4. Current Invoice State for Form
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() =>
    createEmptyInvoice(invoices, lang, activeWorkspace)
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
      companyId: activeWorkspace?.id,
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
    const fresh = createEmptyInvoice(invoices, lang, activeWorkspace);
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
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={handleSwitchWorkspace}
        onAddNewWorkspace={handleAddNewWorkspace}
      />

      {/* Main Viewport Content */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {activeTab === 'create' && (
          <InvoiceForm
            invoice={currentInvoice}
            setInvoice={setCurrentInvoice}
            companySettings={companySettings}
            companyWorkspace={activeWorkspace || undefined}
            customers={customers}
            services={services}
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

        {activeTab === 'customers' && (
          <CustomerManager
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForInvoice={handleSelectCustomerForInvoice}
            lang={lang}
          />
        )}

        {activeTab === 'services' && (
          <ServiceManager
            services={services}
            onSaveService={handleSaveService}
            onDeleteService={handleDeleteService}
            lang={lang}
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

      {/* First-Time Setup Wizard Modal */}
      {showSetupWizard && (wizardWorkspace || activeWorkspace) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <SetupWizard
              workspace={wizardWorkspace || activeWorkspace!}
              lang={lang}
              onComplete={handleWizardComplete}
              onSkip={workspaces.some((w) => w.isSetupComplete) ? () => setShowSetupWizard(false) : undefined}
            />
          </div>
        </div>
      )}

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
