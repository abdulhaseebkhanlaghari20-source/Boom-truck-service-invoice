/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Invoice, CompanySettings, ViewTab, Language } from './types/invoice';
import { DEFAULT_COMPANY_SETTINGS, INITIAL_INVOICES } from './utils/demoData';
import { generateNextInvoiceNumber, isInvoiceNumberDuplicate } from './utils/numbering';
import { calculateInvoiceTotals } from './utils/formatters';
import { translations } from './translations/i18n';
import { Header } from './components/Header';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { Dashboard } from './components/Dashboard';
import { SettingsSection } from './components/SettingsModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { PreviewModal } from './components/PreviewModal';
import { InvoicePreview } from './components/InvoicePreview';

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

  // Download PDF Handler
  const handleDownloadPdf = (inv?: Invoice) => {
    const target = inv || currentInvoice;
    setPrintTargetInvoice(target);
    setTimeout(() => {
      window.print();
    }, 150);
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
        onShareWhatsApp={handleOpenWhatsAppModal}
      />

      {/* WhatsApp Sharing 3-Step Modal */}
      <WhatsAppModal
        invoice={whatsAppModalInvoice}
        companySettings={companySettings}
        lang={lang}
        onClose={() => setWhatsAppModalInvoice(null)}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Hidden Print Container specifically targeted by @media print */}
      <div className="hidden print:block">
        <InvoicePreview
          invoice={printTargetInvoice || currentInvoice}
          companySettings={companySettings}
          lang={lang}
          isPrintOnly={true}
        />
      </div>

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
