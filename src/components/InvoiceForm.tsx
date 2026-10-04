import React, { useState } from 'react';
import { Invoice, CompanySettings, Language, PaymentStatus, VatOption } from '../types/invoice';
import { translations } from '../translations/i18n';
import {
  SAUDI_CITIES,
  SAUDI_CITIES_AR,
  BOOM_TRUCK_CAPACITIES,
  formatCurrency,
  calculateInvoiceTotals,
} from '../utils/formatters';
import { InvoicePreview } from './InvoicePreview';
import {
  Save,
  Printer,
  FileDown,
  Share2,
  Mail,
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  User,
  Truck,
  FileText,
} from 'lucide-react';

interface InvoiceFormProps {
  invoice: Invoice;
  setInvoice: React.Dispatch<React.SetStateAction<Invoice>>;
  companySettings: CompanySettings;
  lang: Language;
  onSave: (invoice: Invoice) => void;
  onNew: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onSharePdf: () => void;
  onEmailPdf: () => void;
  onShareWhatsApp: (invoice: Invoice) => void;
  isDuplicateInvoiceNumber: boolean;
  isEditingExisting?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  setInvoice,
  companySettings,
  lang,
  onSave,
  onNew,
  onPrint,
  onDownloadPdf,
  onSharePdf,
  onEmailPdf,
  onShareWhatsApp,
  isDuplicateInvoiceNumber,
  isEditingExisting = false,
}) => {
  const t = translations[lang];
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Helper for immediate auto-calculation without rounding bugs
  const updateField = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setInvoice((prev) => {
      const next = { ...prev, [field]: value, updatedAt: new Date().toISOString() };

      const qty = field === 'quantity' ? Number(value) : prev.quantity;
      const rate = field === 'rate' ? Number(value) : prev.rate;
      const vat = field === 'vatOption' ? (value as VatOption) : prev.vatOption;

      if (field === 'quantity' || field === 'rate' || field === 'vatOption') {
        const { subtotal, vatAmount, total } = calculateInvoiceTotals(qty, rate, vat);
        next.subtotal = subtotal;
        next.vatAmount = vatAmount;
        next.total = total;
      }

      return next;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateInvoiceNumber) return;
    onSave(invoice);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Mobile Segmented View Switcher */}
      <div className="lg:hidden flex items-center bg-slate-200/90 p-1 rounded-xl shadow-inner border border-slate-300/60">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 min-h-[42px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'form' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'ar' ? 'نموذج الفاتورة السريع' : 'Fast Invoice Form'}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 min-h-[42px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'preview' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'ar' ? 'معاينة الفاتورة' : 'Invoice Preview'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Exactly 3 Simple Form Sections */}
        <div className={`lg:col-span-6 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Top Action Ribbon */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isDuplicateInvoiceNumber}
                  className={`flex items-center justify-center gap-1.5 px-4 min-h-[42px] text-xs font-bold rounded-lg text-white transition-all shadow-xs ${
                    isDuplicateInvoiceNumber
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-sm'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditingExisting ? t.updateInvoice : t.saveInvoice}</span>
                </button>

                <button
                  type="button"
                  onClick={onNew}
                  className="flex items-center justify-center gap-1.5 px-3 min-h-[42px] text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>{t.newInvoice}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  title={t.downloadPdf}
                  className="flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
                >
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShareWhatsApp(invoice)}
                  title={t.shareWhatsapp}
                  className="flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300/80 hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Success Notification */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isEditingExisting ? t.updatedSuccess : t.savedSuccess}</span>
              </div>
            )}

            {/* SECTION 1: Customer (Name, Phone, VAT Number) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.sectionCustomer}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'بيانات العميل أو جهة التعاقد' : 'Customer & Contracting Party'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.customerName} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'اسم العميل أو شركة المقاولات' : 'Customer or Contracting Company Name'}
                    value={invoice.customerName}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.customerPhone} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+966 5X XXX XXXX"
                    value={invoice.customerPhone}
                    onChange={(e) => updateField('customerPhone', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.customerVatNumber}
                  </label>
                  <input
                    type="text"
                    placeholder="3XXXXXXXXXXXXX3"
                    value={invoice.customerVatNumber || ''}
                    onChange={(e) => updateField('customerVatNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Boom Truck Service (City, Capacity [1-30 Ton], Description, Quantity, Rate) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.sectionService}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'مواصفات الرافعة والموقع والتعرفة' : 'Boom Truck Specs, Location & Tariff'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {/* City / Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.cityLocation} *
                  </label>
                  <select
                    value={invoice.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white transition-all shadow-2xs"
                  >
                    {SAUDI_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {lang === 'ar' ? SAUDI_CITIES_AR[c] || c : c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Boom Truck Capacity (1 Ton through 30 Ton) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.boomTruckCapacity} *
                  </label>
                  <select
                    value={invoice.truckCapacity}
                    onChange={(e) => updateField('truckCapacity', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white text-slate-900 transition-all shadow-2xs"
                  >
                    {BOOM_TRUCK_CAPACITIES.map((cap) => (
                      <option key={cap} value={cap}>
                        {lang === 'ar' ? cap.replace('Ton', 'طن') : cap}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom City if "Other" is chosen */}
                {invoice.city === 'Other' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ar' ? 'حدد الموقع المخصص' : 'Custom City / Site Location'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.customLocationPlaceholder}
                      value={invoice.customCity || ''}
                      onChange={(e) => updateField('customCity', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-amber-50/40 shadow-2xs"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.serviceDescription} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.serviceDescriptionPlaceholder}
                    value={invoice.serviceDescription}
                    onChange={(e) => updateField('serviceDescription', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs font-medium"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.quantity} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={invoice.quantity || ''}
                    onChange={(e) => updateField('quantity', Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                  />
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.rate} *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={invoice.rate || ''}
                      onChange={(e) => updateField('rate', Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                    />
                    <span className="absolute end-3 top-2.5 text-[10px] sm:text-xs font-bold text-slate-400 pointer-events-none">
                      SAR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Invoice (Number, Date, Due Date, VAT [15% / No VAT], Payment Status) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.sectionInvoice}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'رقم الفاتورة والتواريخ والضريبة' : 'Invoice Number, Dates & Tax Options'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {/* Invoice Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.invoiceNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoice.invoiceNumber}
                    onChange={(e) => updateField('invoiceNumber', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-lg border transition-all shadow-2xs ${
                      isDuplicateInvoiceNumber
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/50'
                        : 'border-slate-300/90 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                  />
                  {isDuplicateInvoiceNumber && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t.duplicateError}
                    </p>
                  )}
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.paymentStatus} *
                  </label>
                  <select
                    value={invoice.paymentStatus}
                    onChange={(e) => updateField('paymentStatus', e.target.value as PaymentStatus)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white transition-all shadow-2xs"
                  >
                    <option value="Unpaid">{t.unpaid}</option>
                    <option value="Partially Paid">{t.partiallyPaid}</option>
                    <option value="Paid">{t.paid}</option>
                    <option value="Overdue">{t.overdue}</option>
                  </select>
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.invoiceDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoice.invoiceDate}
                    onChange={(e) => updateField('invoiceDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.dueDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoice.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
                  />
                </div>

                {/* VAT Option Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.vatSelection} *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateField('vatOption', 'VAT 15%')}
                      className={`min-h-[44px] px-3 text-xs sm:text-sm font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        invoice.vatOption === 'VAT 15%'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-900 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>{t.vat15}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('vatOption', 'No VAT')}
                      className={`min-h-[44px] px-3 text-xs sm:text-sm font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        invoice.vatOption === 'No VAT'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-900 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>{t.noVat}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.notes}
                  </label>
                  <input
                    type="text"
                    placeholder={t.notesPlaceholder}
                    value={invoice.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Breakdown Card: Subtotal, VAT 15%, VAT Amount, Grand Total */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-md border border-slate-700/60 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="font-medium">{t.subtotal}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(invoice.subtotal, lang)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="font-medium">
                  {invoice.vatOption === 'VAT 15%'
                    ? `${t.vat15Label} (${t.vatAmount})`
                    : `${t.noVat} (0.00)`}
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-amber-300">
                  {formatCurrency(invoice.vatAmount, lang)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-700/80 flex justify-between items-center">
                <span className="text-sm sm:text-base font-extrabold text-white">{t.grandTotal}</span>
                <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                  {formatCurrency(invoice.total, lang)}
                </span>
              </div>
            </div>

            {/* Bottom Actions: Organized responsive layout */}
            <div className="space-y-2 pt-1">
              {/* Primary Row */}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isDuplicateInvoiceNumber}
                  className="flex-1 min-h-[46px] px-4 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditingExisting ? t.updateInvoice : t.saveInvoice}</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadPdf}
                  title={t.downloadPdf}
                  className="min-h-[46px] px-4 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span>{t.downloadPdf}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShareWhatsApp(invoice)}
                  title={t.shareWhatsapp}
                  className="min-h-[46px] px-4 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                </button>
              </div>

              {/* Secondary Row: Share, Email, Print */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={onSharePdf}
                  title={t.sharePdf}
                  className="min-h-[42px] px-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.sharePdf}</span>
                </button>

                <button
                  type="button"
                  onClick={onEmailPdf}
                  title={t.emailPdf}
                  className="min-h-[42px] px-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t.emailPdf}</span>
                </button>

                <button
                  type="button"
                  onClick={onPrint}
                  title={t.print}
                  className="min-h-[42px] px-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.print}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Instant Invoice Preview */}
        <div className={`lg:col-span-6 sticky top-20 w-full max-w-full overflow-hidden ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              {lang === 'ar' ? 'معاينة الفاتورة الفورية (A4)' : 'Live Invoice Preview (A4)'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={onPrint}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1"
              >
                <Printer className="w-3 h-3 text-slate-500" />
                <span>{t.print}</span>
              </button>
              <button
                type="button"
                onClick={onDownloadPdf}
                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition-colors flex items-center gap-1"
              >
                <FileDown className="w-3 h-3 text-emerald-600" />
                <span>{t.downloadPdf}</span>
              </button>
              <button
                type="button"
                onClick={onSharePdf}
                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition-colors flex items-center gap-1"
              >
                <Share2 className="w-3 h-3 text-blue-600" />
                <span>{t.sharePdf}</span>
              </button>
              <button
                type="button"
                onClick={onEmailPdf}
                className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors flex items-center gap-1"
              >
                <Mail className="w-3 h-3 text-indigo-600" />
                <span>{t.emailPdf}</span>
              </button>
            </div>
          </div>

          <div className="w-full max-w-full pb-4">
            <InvoicePreview
              invoice={invoice}
              companySettings={companySettings}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
