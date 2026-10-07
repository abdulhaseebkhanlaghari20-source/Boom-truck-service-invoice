import React, { useState } from 'react';
import { Invoice, CompanySettings, Language, PaymentStatus, VatOption, InvoiceItem } from '../types/invoice';
import { translations } from '../translations/i18n';
import {
  SAUDI_CITIES,
  SAUDI_CITIES_AR,
  BOOM_TRUCK_CAPACITIES,
  formatCurrency,
  calculateInvoiceTotals,
  calculateMultiItemTotals,
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
  Trash2,
  Layers,
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

// Preset services catalogue for quick selection
const SERVICE_PRESETS = [
  {
    name: 'Boom Truck Rental (Daily)',
    nameAr: 'تأجير بوم ترك (يومي)',
    description: 'Boom Truck Crane rental with certified operator and rigging accessories',
    unit: 'Day',
    rate: 1000,
  },
  {
    name: 'Boom Truck Rental (Monthly)',
    nameAr: 'تأجير بوم ترك (شهري)',
    description: 'Monthly boom truck hire including licensed operator for project site',
    unit: 'Month',
    rate: 18000,
  },
  {
    name: 'Mobile Crane Lifting Service',
    nameAr: 'خدمة رفع كرين متحرك',
    description: 'Heavy hydraulic mobile crane lifting service for structural installation',
    unit: 'Shift',
    rate: 2500,
  },
  {
    name: 'Heavy Equipment Transport',
    nameAr: 'نقل معدات ثقيلة',
    description: 'Lowbed trailer and flatbed haulage for machinery and heavy materials',
    unit: 'Trip',
    rate: 1500,
  },
  {
    name: 'Certified Operator & Rigger',
    nameAr: 'مشغل رافعة وريجر معتمد',
    description: 'Licensed equipment operator and certified rigger for site operations',
    unit: 'Day',
    rate: 350,
  },
];

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

      const is15 = (field === 'vatOption' ? value : prev.vatOption) === 'VAT 15%';
      const currentItems: InvoiceItem[] = (next.items && next.items.length > 0)
        ? next.items
        : [
            {
              id: 'item-1',
              serviceName: '',
              description: next.serviceDescription || '',
              unit: next.unit || 'Pcs',
              quantity: Math.max(1, Number(next.quantity) || 1),
              rate: Math.max(0, Number(next.rate) || 0),
              vatRate: is15 ? 0.15 : 0,
            },
          ];

      if (field === 'vatOption' || field === 'quantity' || field === 'rate') {
        const { subtotal, vatAmount, total } = calculateMultiItemTotals(currentItems, next.vatOption);
        next.subtotal = subtotal;
        next.vatAmount = vatAmount;
        next.total = total;
        if (next.paymentStatus === 'Paid') {
          next.paidAmount = total;
          next.amountDue = 0;
        } else if (next.paymentStatus === 'Unpaid') {
          next.paidAmount = 0;
          next.amountDue = total;
        }
      }

      if (field === 'paymentStatus') {
        const stat = value as PaymentStatus;
        if (stat === 'Paid') {
          next.paidAmount = next.total;
          next.amountDue = 0;
        } else if (stat === 'Unpaid') {
          next.paidAmount = 0;
          next.amountDue = next.total;
        } else if (stat === 'Partially Paid') {
          next.paidAmount = Math.round((next.total / 2) * 100) / 100;
          next.amountDue = Math.max(0, Math.round((next.total - next.paidAmount) * 100) / 100);
        }
      }

      return next;
    });
  };

  // Line item helpers
  const getItemsList = (): InvoiceItem[] => {
    if (invoice.items && invoice.items.length > 0) return invoice.items;
    return [
      {
        id: 'item-1',
        serviceName: '',
        description: invoice.serviceDescription || '',
        unit: invoice.unit || 'Pcs',
        quantity: Math.max(1, Number(invoice.quantity) || 1),
        rate: Math.max(0, Number(invoice.rate) || 0),
        vatRate: invoice.vatOption === 'VAT 15%' ? 0.15 : 0,
      },
    ];
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const list = [...getItemsList()];
    list[index] = { ...list[index], ...updates };

    const { subtotal, vatAmount, total } = calculateMultiItemTotals(list, invoice.vatOption);

    setInvoice((prev) => ({
      ...prev,
      items: list,
      serviceDescription: list[0]?.description || list[0]?.serviceName || '',
      quantity: list[0]?.quantity || 1,
      rate: list[0]?.rate || 0,
      unit: list[0]?.unit || 'Pcs',
      subtotal,
      vatAmount,
      total,
      paidAmount: prev.paymentStatus === 'Paid' ? total : prev.paymentStatus === 'Unpaid' ? 0 : prev.paidAmount,
      amountDue: prev.paymentStatus === 'Paid' ? 0 : prev.paymentStatus === 'Unpaid' ? total : Math.max(0, total - (prev.paidAmount || 0)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddItem = (preset?: typeof SERVICE_PRESETS[0]) => {
    const list = [...getItemsList()];
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      serviceName: preset ? (lang === 'ar' ? preset.nameAr : preset.name) : '',
      description: preset?.description || '',
      unit: preset?.unit || 'Pcs',
      quantity: 1,
      rate: preset?.rate || 0,
      vatRate: invoice.vatOption === 'VAT 15%' ? 0.15 : 0,
    };
    list.push(newItem);

    const { subtotal, vatAmount, total } = calculateMultiItemTotals(list, invoice.vatOption);

    setInvoice((prev) => ({
      ...prev,
      items: list,
      subtotal,
      vatAmount,
      total,
      paidAmount: prev.paymentStatus === 'Paid' ? total : prev.paymentStatus === 'Unpaid' ? 0 : prev.paidAmount,
      amountDue: prev.paymentStatus === 'Paid' ? 0 : prev.paymentStatus === 'Unpaid' ? total : Math.max(0, total - (prev.paidAmount || 0)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRemoveItem = (index: number) => {
    const list = [...getItemsList()];
    if (list.length <= 1) return;
    list.splice(index, 1);

    const { subtotal, vatAmount, total } = calculateMultiItemTotals(list, invoice.vatOption);

    setInvoice((prev) => ({
      ...prev,
      items: list,
      serviceDescription: list[0]?.description || list[0]?.serviceName || '',
      quantity: list[0]?.quantity || 1,
      rate: list[0]?.rate || 0,
      unit: list[0]?.unit || 'Pcs',
      subtotal,
      vatAmount,
      total,
      paidAmount: prev.paymentStatus === 'Paid' ? total : prev.paymentStatus === 'Unpaid' ? 0 : prev.paidAmount,
      amountDue: prev.paymentStatus === 'Paid' ? 0 : prev.paymentStatus === 'Unpaid' ? total : Math.max(0, total - (prev.paidAmount || 0)),
      updatedAt: new Date().toISOString(),
    }));
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

            {/* SECTION 1: Customer (Name, Mobile, Address, VAT Number) */}
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
                {/* 1. Client Name */}
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

                {/* 2. Client Mobile */}
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

                {/* 3. Client Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'عنوان العميل' : 'Client Address'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'المدينة / الحي / الموقع' : 'e.g. Dammam, Al Adamah Dist.'}
                    value={invoice.customerAddress || ''}
                    onChange={(e) => updateField('customerAddress', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs font-medium"
                  />
                </div>

                {/* Customer VAT Number */}
                <div className="sm:col-span-2">
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

            {/* SECTION 2: Dynamic Services & Multiple Line Items */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {lang === 'ar' ? 'البنود والخدمات' : 'Items & Services'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {lang === 'ar' ? 'اختر خدمة جاهزة أو أضف بنوداً متعددة' : 'Select a preset service or add multiple line items'}
                    </p>
                  </div>
                </div>

                {/* Service Preset Catalogue Quick Add */}
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (!isNaN(idx) && SERVICE_PRESETS[idx]) {
                        handleAddItem(SERVICE_PRESETS[idx]);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="" disabled>
                      {lang === 'ar' ? '+ إضافة من دليل الخدمات...' : '+ Add from Services Catalogue...'}
                    </option>
                    {SERVICE_PRESETS.map((p, i) => (
                      <option key={p.name} value={i}>
                        {lang === 'ar' ? p.nameAr : p.name} ({p.rate} SAR / {p.unit})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'بند جديد' : 'Add Item'}</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {getItemsList().map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        #{idx + 1} {item.serviceName ? `· ${item.serviceName}` : ''}
                      </span>
                      {getItemsList().length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                          title={lang === 'ar' ? 'حذف البند' : 'Delete Item'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      {/* Service Name */}
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          {lang === 'ar' ? 'اسم الخدمة / البند' : 'Service Name'}
                        </label>
                        <input
                          type="text"
                          placeholder={lang === 'ar' ? 'مثال: تأجير بوم ترك' : 'e.g. Boom Truck Rental'}
                          value={item.serviceName || ''}
                          onChange={(e) => handleUpdateItem(idx, { serviceName: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-7">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          {lang === 'ar' ? 'الوصف التفصيلي' : 'Description'}
                        </label>
                        <input
                          type="text"
                          placeholder={lang === 'ar' ? 'تفاصيل الخدمة أو الرافعة' : 'Service or equipment details'}
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(idx, { description: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          {lang === 'ar' ? 'الوحدة' : 'Unit'}
                        </label>
                        <input
                          type="text"
                          placeholder="Day / Shift / Trip / Pcs"
                          value={item.unit || 'Pcs'}
                          onChange={(e) => handleUpdateItem(idx, { unit: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          {lang === 'ar' ? 'الكمية' : 'Quantity'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity || ''}
                          onChange={(e) => handleUpdateItem(idx, { quantity: Math.max(0, Number(e.target.value)) })}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Rate */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          {lang === 'ar' ? 'سعر الوحدة (ر.س)' : 'Rate (SAR)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate || ''}
                          onChange={(e) => handleUpdateItem(idx, { rate: Math.max(0, Number(e.target.value)) })}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Line Subtotal Preview */}
                      <div className="sm:col-span-3 flex flex-col justify-end">
                        <div className="text-[10px] text-slate-500 font-medium">
                          {lang === 'ar' ? 'الإجمالي' : 'Total'}
                        </div>
                        <div className="text-xs font-bold text-[#0f2744] font-mono py-1.5">
                          {((Number(item.quantity || 0) * Number(item.rate || 0))).toFixed(2)} SAR
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: Invoice Details (Number, Dates, Payment, Job Location, VAT) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.sectionInvoice}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'بيانات الفاتورة وموقع العمل وطريقة الدفع' : 'Invoice Number, Dates, Location & Payment'}
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

                {/* Job Location */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'موقع العمل' : 'Job Location'} *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={invoice.city}
                      onChange={(e) => {
                        updateField('city', e.target.value);
                        if (e.target.value !== 'Other') {
                          updateField('jobLocation', e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300/90 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {SAUDI_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {lang === 'ar' ? SAUDI_CITIES_AR[c] || c : c}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'الموقع بالتفصيل (مشروع / حي / موقع)' : 'Detailed Job Location / Site'}
                      value={invoice.jobLocation || ''}
                      onChange={(e) => updateField('jobLocation', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* If Partially Paid: Paid Amount & Amount Due */}
                {invoice.paymentStatus === 'Partially Paid' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'ar' ? 'المبلغ المدفوع (ر.س)' : 'Paid Amount (SAR)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={invoice.paidAmount ?? ''}
                        onChange={(e) => {
                          const paid = Math.max(0, Number(e.target.value) || 0);
                          setInvoice((prev) => ({
                            ...prev,
                            paidAmount: paid,
                            amountDue: Math.max(0, Math.round((prev.total - paid) * 100) / 100),
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-300/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === 'ar' ? 'المبلغ المستحق (ر.س)' : 'Amount Due (SAR)'}
                      </label>
                      <input
                        type="number"
                        disabled
                        value={invoice.amountDue ?? Math.max(0, invoice.total - (invoice.paidAmount || 0))}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 bg-slate-100 text-slate-700"
                      />
                    </div>
                  </>
                )}

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
                onClick={() => onShareWhatsApp(invoice)}
                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300 transition-colors flex items-center gap-1"
              >
                <span className="font-bold text-[9px] px-1 py-0.2 rounded bg-emerald-700 text-white">WA</span>
                <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
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
