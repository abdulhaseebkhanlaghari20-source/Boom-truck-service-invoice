import React, { useEffect, useState } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { formatCurrency, formatDate, SAUDI_CITIES_AR } from '../utils/formatters';
import { generateQrCodeDataUrl } from '../utils/zatcaQr';
import { CheckCircle2, AlertCircle, Clock, Ban } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  lang: Language;
  isPrintOnly?: boolean;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  companySettings,
  lang,
  isPrintOnly = false,
}) => {
  const t = translations[lang];
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    generateQrCodeDataUrl(
      companySettings.companyName || '[COMPANY NAME]',
      companySettings.vatNumber || '[VAT NUMBER]',
      invoice.invoiceDate,
      invoice.total,
      invoice.vatAmount
    ).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [
    companySettings.companyName,
    companySettings.vatNumber,
    invoice.invoiceDate,
    invoice.total,
    invoice.vatAmount,
  ]);

  const displayCity =
    invoice.city === 'Other' && invoice.customCity ? invoice.customCity : invoice.city;
  const cityAr = SAUDI_CITIES_AR[displayCity] || displayCity;

  const renderStatus = (status: Invoice['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'ar' ? 'مدفوعة' : 'PAID'}
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-300">
            <Clock className="w-3 h-3" />
            {lang === 'ar' ? 'مدفوعة جزئياً' : 'PARTIALLY PAID'}
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-300">
            <AlertCircle className="w-3 h-3" />
            {lang === 'ar' ? 'متأخرة' : 'OVERDUE'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-300">
            <Ban className="w-3 h-3" />
            {lang === 'ar' ? 'غير مدفوعة' : 'UNPAID'}
          </span>
        );
    }
  };

  return (
    <div
      id={`invoice-preview-sheet-${invoice.id}`}
      data-invoice-sheet="true"
      className={`invoice-sheet bg-white text-slate-900 border border-slate-300 shadow-sm rounded-lg p-6 max-w-[800px] mx-auto print-container leading-normal select-text ${
        isPrintOnly ? 'print-only' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      {/* 1. Top Header: Company Identity + Invoice Title + ZATCA QR */}
      <div className="flex flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
        {/* Company Identity */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {companySettings.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt="Company Logo"
              referrerPolicy="no-referrer"
              className="w-16 h-16 object-contain rounded border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-20 h-16 border-2 border-dashed border-slate-400 bg-slate-50 text-slate-500 rounded flex flex-col items-center justify-center p-1 shrink-0 text-center">
              <span className="text-[10px] font-bold tracking-wider uppercase leading-tight text-slate-700">
                COMPANY
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase leading-tight text-slate-700">
                LOGO
              </span>
            </div>
          )}

          <div className="space-y-0.5 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {lang === 'ar' && companySettings.companyNameAr
                ? companySettings.companyNameAr
                : companySettings.companyName || '[COMPANY NAME]'}
            </h1>
            <p className="text-[11px] text-slate-600 truncate">
              {lang === 'ar' && companySettings.addressAr
                ? companySettings.addressAr
                : companySettings.address || '[ADDRESS]'}
            </p>
            <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-600">
              <span>
                <strong className="text-slate-800">{lang === 'ar' ? 'هاتف:' : 'Phone:'}</strong>{' '}
                {companySettings.phone || '[PHONE]'}
              </span>
              {companySettings.whatsapp && (
                <span>
                  <strong className="text-slate-800">WhatsApp:</strong> {companySettings.whatsapp}
                </span>
              )}
              <span>
                <strong className="text-slate-800">{lang === 'ar' ? 'بريد:' : 'Email:'}</strong>{' '}
                {companySettings.email || '[EMAIL]'}
              </span>
            </div>
            <div className="text-[11px] text-slate-800 font-mono tabular-nums">
              <strong className="text-slate-900">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT No:'}</strong>{' '}
              {companySettings.vatNumber || '[VAT NUMBER]'}
            </div>
          </div>
        </div>

        {/* Invoice Title & QR Code */}
        <div className="flex flex-col items-end text-end rtl:text-start rtl:items-start shrink-0">
          <div className="text-xs font-bold text-emerald-800 tracking-wider">
            {lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'TAX INVOICE'}
          </div>
          <div className="text-base font-bold font-mono text-slate-900 tracking-tight">
            {invoice.invoiceNumber || 'INV-001'}
          </div>
          <div className="mt-1">{renderStatus(invoice.paymentStatus)}</div>

          {qrCodeDataUrl ? (
            <div className="mt-2 p-1 bg-white border border-slate-300 rounded shadow-2xs">
              <img
                src={qrCodeDataUrl}
                alt="ZATCA QR Code"
                className="w-18 h-18 object-contain"
              />
            </div>
          ) : (
            <div className="mt-2 w-18 h-18 bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
              QR
            </div>
          )}
        </div>
      </div>

      {/* 2. Customer & Date Meta Grid */}
      <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-xs">
        {/* Customer Information */}
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200/80 space-y-0.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'بيانات العميل:' : 'CUSTOMER DETAILS:'}
          </div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            {invoice.customerName || (lang === 'ar' ? 'اسم العميل' : 'Customer Name')}
          </div>
          <div className="text-[11px] text-slate-700">
            <strong>{lang === 'ar' ? 'الجوال:' : 'Phone:'}</strong> {invoice.customerPhone || '-'}
          </div>
          {invoice.customerVatNumber && (
            <div className="text-[11px] text-slate-700 font-mono tabular-nums">
              <strong>{lang === 'ar' ? 'الرقم الضريبي للعميل:' : 'Customer VAT:'}</strong>{' '}
              {invoice.customerVatNumber}
            </div>
          )}
        </div>

        {/* Invoice Dates & Location */}
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200/80 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'تفاصيل الفاتورة والموقع:' : 'INVOICE & SITE DETAILS:'}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
            <div>
              <span className="text-slate-500 block text-[10px]">
                {lang === 'ar' ? 'تاريخ الفاتورة:' : 'Invoice Date:'}
              </span>
              <span className="font-semibold font-mono">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">
                {lang === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'}
              </span>
              <span className="font-semibold font-mono">{formatDate(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">
                {lang === 'ar' ? 'الموقع:' : 'Location:'}
              </span>
              <span className="font-bold text-slate-900">
                {lang === 'ar' ? cityAr : displayCity}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">
                {lang === 'ar' ? 'حمولة الرافعة:' : 'Capacity:'}
              </span>
              <span className="font-bold text-amber-900 bg-amber-100 px-1 py-0.2 rounded text-[10px] inline-block">
                {invoice.truckCapacity || '20 Ton'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Service Table */}
      <div className="py-3">
        <table className="w-full text-xs text-left rtl:text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold text-[11px]">
              <th className="py-2 px-2.5 rounded-s">#</th>
              <th className="py-2 px-2.5">
                {lang === 'ar' ? 'وصف خدمة شاحنة الرافعة (Boom Truck)' : 'Boom Truck Service Description'}
              </th>
              <th className="py-2 px-2 text-center">{lang === 'ar' ? 'الحمولة' : 'Capacity'}</th>
              <th className="py-2 px-2 text-center">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
              <th className="py-2 px-2.5 text-right rtl:text-left">{lang === 'ar' ? 'السعر (ر.س)' : 'Rate (SAR)'}</th>
              <th className="py-2 px-2.5 text-right rtl:text-left rounded-e">
                {lang === 'ar' ? 'المجموع (ر.س)' : 'Amount (SAR)'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-3 px-2.5 text-slate-500 font-mono text-center">1</td>
              <td className="py-3 px-2.5">
                <div className="font-bold text-slate-900 text-xs">
                  {invoice.serviceDescription ||
                    (lang === 'ar'
                      ? 'خدمة شاحنة رافعة هيدروليكية (بوم ترَك)'
                      : 'Boom Truck Equipment Service')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {lang === 'ar'
                    ? `الموقع: ${cityAr} · حمولة ${invoice.truckCapacity} مع مشغل ومعدات رفع معتمدة`
                    : `Location: ${displayCity} · ${invoice.truckCapacity} Boom Truck with certified rigging`}
                </div>
              </td>
              <td className="py-3 px-2 text-center font-bold text-slate-800">
                {invoice.truckCapacity || '20 Ton'}
              </td>
              <td className="py-3 px-2 text-center font-mono font-bold">{invoice.quantity || 1}</td>
              <td className="py-3 px-2.5 text-right rtl:text-left font-mono tabular-nums">
                {formatCurrency(invoice.rate, lang)}
              </td>
              <td className="py-3 px-2.5 text-right rtl:text-left font-mono font-bold text-slate-900 tabular-nums">
                {formatCurrency(invoice.subtotal, lang)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Financial Calculations & Summary Box */}
      <div className="flex flex-row justify-between items-start gap-4 pt-2 pb-3 border-t border-slate-200">
        {/* Left: Notes & Bank info */}
        <div className="w-1/2 space-y-2 text-xs">
          {invoice.notes && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 text-[10px]">
              <strong className="block text-slate-900 mb-0.5 font-bold">
                {lang === 'ar' ? 'ملاحظات وشروط:' : 'Notes / Terms:'}
              </strong>
              <p className="whitespace-pre-line leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          {companySettings.bankName && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-700">
              <span className="font-bold text-slate-900 block">
                {lang === 'ar' ? 'التحويل البنكي:' : 'Bank Transfer:'}
              </span>
              <div>{companySettings.bankName}</div>
              {companySettings.iban && <div className="font-mono">{companySettings.iban}</div>}
            </div>
          )}
        </div>

        {/* Right: Calculations (Subtotal, VAT, Grand Total) */}
        <div className="w-5/12 bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-600 text-[11px]">
            <span>{t.subtotal}</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatCurrency(invoice.subtotal, lang)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600 text-[11px]">
            <span>
              {invoice.vatOption === 'VAT 15%' ? t.vat15Label : t.noVat}
            </span>
            <span className="font-mono font-semibold tabular-nums text-slate-800">
              {formatCurrency(invoice.vatAmount, lang)}
            </span>
          </div>

          <div className="pt-1.5 border-t-2 border-slate-400 flex justify-between items-center">
            <span className="text-xs sm:text-sm font-bold text-slate-900">{t.grandTotal}</span>
            <span className="text-sm sm:text-base font-bold text-emerald-800 font-mono tabular-nums">
              {formatCurrency(invoice.total, lang)}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 text-right rtl:text-left">
            {lang === 'ar' ? 'العملة: ريال سعودي (SAR)' : 'Currency: SAR'}
          </div>
        </div>
      </div>

      {/* 5. Footer: Stamp & Signature Zone */}
      <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[9px] mb-4">
            {lang === 'ar' ? 'المستلم / المفوض:' : 'Received by:'}
          </span>
          <div className="border-t border-dashed border-slate-400 pt-1 text-slate-600 text-[10px] inline-block min-w-[140px]">
            {lang === 'ar' ? 'توقيع العميل' : 'Client Signature'}
          </div>
        </div>

        <div className="text-end rtl:text-start">
          <span className="text-slate-400 block text-[9px] mb-4">
            {lang === 'ar' ? 'الختم والتوقيع المعتمد:' : 'Authorized Stamp & Signature:'}
          </span>
          <div className="border-t border-dashed border-slate-400 pt-1 text-slate-600 text-[10px] inline-block min-w-[140px]">
            {companySettings.companyName || '[COMPANY NAME]'}
          </div>
        </div>
      </div>
    </div>
  );
};
