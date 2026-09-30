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
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-slate-200 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 min-h-[44px] text-xs font-bold rounded-md transition-colors ${
            mobileTab === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          {lang === 'ar' ? 'نموذج الفاتورة السريع' : 'Fast Invoice Form'}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 min-h-[44px] text-xs font-bold rounded-md transition-colors ${
            mobileTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          {lang === 'ar' ? 'معاينة الفاتورة' : 'Invoice Preview'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Exactly 3 Simple Form Sections */}
        <div className={`lg:col-span-6 space-y-4 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Top Action Ribbon */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isDuplicateInvoiceNumber}
                  className={`flex items-center justify-center gap-1.5 px-4 min-h-[42px] text-xs font-bold rounded-md text-white transition-colors shadow-xs ${
                    isDuplicateInvoiceNumber
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditingExisting ? t.updateInvoice : t.saveInvoice}</span>
                </button>

                <button
                  type="button"
                  onClick={onNew}
                  className="flex items-center justify-center gap-1.5 px-3 min-h-[42px] text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
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
                  className="flex items-center justify-center gap-1 px-3 min-h-[42px] text-xs font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => onShareWhatsApp(invoice)}
                  title={t.shareWhatsapp}
                  className="flex items-center justify-center gap-1 px-3 min-h-[42px] text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Success Notification */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isEditingExisting ? t.updatedSuccess : t.savedSuccess}</span>
              </div>
            )}

            {/* SECTION 1: Customer (Name, Phone, VAT Number) */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">{t.sectionCustomer}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
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
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
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
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Boom Truck Service (City, Capacity [1-30 Ton], Description, Quantity, Rate) */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Truck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">{t.sectionService}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* City / Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.cityLocation} *
                  </label>
                  <select
                    value={invoice.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 bg-white font-medium"
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
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 bg-white font-bold text-slate-900"
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
                      className="w-full px-3 py-2 text-xs rounded-md border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50/40"
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
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
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
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
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
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                    <span className="absolute end-3 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      SAR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Invoice (Number, Date, Due Date, VAT [15% / No VAT], Payment Status) */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">{t.sectionInvoice}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-md border ${
                      isDuplicateInvoiceNumber
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                        : 'border-slate-300 focus:ring-emerald-600'
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
                    className="w-full px-3 py-2 text-xs font-medium rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
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
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* VAT Option Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.vatSelection} *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateField('vatOption', 'VAT 15%')}
                      className={`min-h-[42px] px-3 text-xs font-bold rounded-md border transition-colors ${
                        invoice.vatOption === 'VAT 15%'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.vat15}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('vatOption', 'No VAT')}
                      className={`min-h-[42px] px-3 text-xs font-bold rounded-md border transition-colors ${
                        invoice.vatOption === 'No VAT'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.noVat}
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
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Breakdown Card: Subtotal, VAT 15%, VAT Amount, Grand Total */}
            <div className="bg-slate-900 text-white rounded-lg p-4 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>{t.subtotal}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(invoice.subtotal, lang)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>
                  {invoice.vatOption === 'VAT 15%'
                    ? `${t.vat15Label} (${t.vatAmount})`
                    : `${t.noVat} (0.00)`}
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-amber-300">
                  {formatCurrency(invoice.vatAmount, lang)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                <span className="text-sm font-bold text-white">{t.grandTotal}</span>
                <span className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(invoice.total, lang)}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isDuplicateInvoiceNumber}
                className="flex-1 min-h-[44px] px-4 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isEditingExisting ? t.updateInvoice : t.saveInvoice}</span>
              </button>

              <button
                type="button"
                onClick={onDownloadPdf}
                title={t.downloadPdf}
                className="min-h-[44px] px-3 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-4 h-4 text-emerald-700" />
                <span>{t.downloadPdf}</span>
              </button>

              <button
                type="button"
                onClick={onSharePdf}
                title={t.sharePdf}
                className="min-h-[44px] px-3 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>{t.sharePdf}</span>
              </button>

              <button
                type="button"
                onClick={() => onShareWhatsApp(invoice)}
                title={t.shareWhatsapp}
                className="min-h-[44px] px-3 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="font-bold text-[10px]">WA</span>
                <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={onEmailPdf}
                title={t.emailPdf}
                className="min-h-[44px] px-3 text-xs font-semibold rounded-md border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">{t.emailPdf}</span>
              </button>

              <button
                type="button"
                onClick={onPrint}
                title={t.print}
                className="min-h-[44px] px-3 text-xs font-semibold rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">{t.print}</span>
              </button>
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
