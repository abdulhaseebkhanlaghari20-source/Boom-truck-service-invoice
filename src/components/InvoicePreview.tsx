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
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مدفوعة' : 'PAID'}
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مدفوعة جزئياً' : 'PARTIALLY PAID'}
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'متأخرة' : 'OVERDUE'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-300">
            <Ban className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'غير مدفوعة' : 'UNPAID'}
          </span>
        );
    }
  };

  return (
    <div
      id={`invoice-preview-sheet-${invoice.id}`}
      data-invoice-sheet="true"
      className={`invoice-sheet bg-white text-slate-900 border border-slate-300 shadow-sm rounded-lg p-3.5 sm:p-7 w-full max-w-[800px] mx-auto print-container leading-normal select-text ${
        isPrintOnly ? 'print-only' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      {/* 1. Top Header: Company Identity + Invoice Title + ZATCA QR */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 pb-4 sm:pb-5 border-b-2 border-slate-900">
        {/* Company Identity */}
        <div className="flex items-start gap-3 sm:gap-5 w-full sm:flex-1 min-w-0">
          {companySettings.logoUrl ? (
            <div className="shrink-0 flex items-center justify-center">
              <img
                src={companySettings.logoUrl}
                alt="Company Logo"
                referrerPolicy="no-referrer"
                className="max-h-20 sm:max-h-24 max-w-[130px] sm:max-w-[190px] w-auto h-auto object-contain object-left rtl:object-right"
              />
            </div>
          ) : (
            <div className="w-24 h-18 sm:w-32 sm:h-22 border-2 border-dashed border-slate-300 bg-slate-50/80 text-slate-500 rounded-lg flex flex-col items-center justify-center p-1.5 sm:p-2 shrink-0 text-center">
              <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase leading-tight text-slate-700">
                COMPANY LOGO
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">
                {lang === 'ar' ? 'شعار المؤسسة' : 'Upload in Settings'}
              </span>
            </div>
          )}

          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug sm:leading-tight">
              {lang === 'ar' && companySettings.companyNameAr
                ? companySettings.companyNameAr
                : companySettings.companyName || '[COMPANY NAME]'}
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-600 leading-snug">
              {lang === 'ar' && companySettings.addressAr
                ? companySettings.addressAr
                : companySettings.address || '[ADDRESS]'}
            </p>
            <div className="flex flex-wrap gap-x-2.5 sm:gap-x-3.5 gap-y-0.5 text-xs sm:text-[13px] text-slate-700">
              <span>
                <strong className="text-slate-900">{lang === 'ar' ? 'هاتف:' : 'Phone:'}</strong>{' '}
                {companySettings.phone || '[PHONE]'}
              </span>
              {companySettings.whatsapp && (
                <span>
                  <strong className="text-slate-900">WhatsApp:</strong> {companySettings.whatsapp}
                </span>
              )}
              <span>
                <strong className="text-slate-900">{lang === 'ar' ? 'بريد:' : 'Email:'}</strong>{' '}
                {companySettings.email || '[EMAIL]'}
              </span>
            </div>
            <div className="text-xs sm:text-[13px] text-slate-900 font-mono tabular-nums font-semibold">
              <strong className="text-slate-900 font-sans">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT No:'}</strong>{' '}
              {companySettings.vatNumber || '[VAT NUMBER]'}
              {companySettings.crNumber && (
                <span className="ms-2.5 sm:ms-3 text-slate-600 font-sans font-normal">
                  <strong className="text-slate-900">{lang === 'ar' ? 'س.ت:' : 'CR No:'}</strong> {companySettings.crNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Title & QR Code Container */}
        <div className="flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end text-start sm:text-end rtl:text-end rtl:sm:text-start w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0 gap-3">
          <div className="flex flex-col items-start sm:items-end rtl:items-start">
            <div className="text-xs sm:text-sm font-extrabold text-emerald-800 tracking-wider uppercase">
              {lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'TAX INVOICE'}
            </div>
            <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight mt-0.5">
              {invoice.invoiceNumber || 'INV-001'}
            </div>
            <div className="mt-1 sm:mt-1.5">{renderStatus(invoice.paymentStatus)}</div>
          </div>

          {qrCodeDataUrl ? (
            <div className="p-1 bg-white border border-slate-300 rounded-md shadow-2xs shrink-0">
              <img
                src={qrCodeDataUrl}
                alt="ZATCA QR Code"
                className="w-16 h-16 sm:w-22 sm:h-22 object-contain"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-22 sm:h-22 bg-slate-100 border border-dashed border-slate-300 rounded-md flex items-center justify-center text-xs text-slate-400 shrink-0">
              QR
            </div>
          )}
        </div>
      </div>

      {/* 2. Customer & Date Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-3.5 sm:py-4 border-b border-slate-200">
        {/* Customer Information */}
        <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'بيانات العميل:' : 'CUSTOMER DETAILS:'}
          </div>
          <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
            {invoice.customerName || (lang === 'ar' ? 'اسم العميل' : 'Customer Name')}
          </div>
          <div className="text-xs sm:text-[13px] text-slate-700">
            <strong className="text-slate-900">{lang === 'ar' ? 'الجوال:' : 'Phone:'}</strong> {invoice.customerPhone || '-'}
          </div>
          {invoice.customerVatNumber && (
            <div className="text-xs sm:text-[13px] text-slate-700 font-mono tabular-nums">
              <strong className="text-slate-900 font-sans">{lang === 'ar' ? 'الرقم الضريبي للعميل:' : 'Customer VAT:'}</strong>{' '}
              {invoice.customerVatNumber}
            </div>
          )}
        </div>

        {/* Invoice Dates & Location */}
        <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-1.5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'تفاصيل الفاتورة والموقع:' : 'INVOICE & SITE DETAILS:'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-[13px] text-slate-700">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">
                {lang === 'ar' ? 'تاريخ الفاتورة:' : 'Invoice Date:'}
              </span>
              <span className="font-bold font-mono text-slate-900">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">
                {lang === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'}
              </span>
              <span className="font-bold font-mono text-slate-900">{formatDate(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">
                {lang === 'ar' ? 'الموقع:' : 'Location:'}
              </span>
              <span className="font-bold text-slate-900">
                {lang === 'ar' ? cityAr : displayCity}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">
                {lang === 'ar' ? 'حمولة الرافعة:' : 'Capacity:'}
              </span>
              <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs inline-block">
                {invoice.truckCapacity || '20 Ton'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Service Table with dedicated horizontal scroll area on mobile */}
      <div className="py-3.5 sm:py-4">
        <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 rounded-lg">
          <table className="w-full min-w-[540px] sm:min-w-full text-xs sm:text-[13px] text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wide">
                <th className="py-2.5 px-3 rounded-s text-center w-10">#</th>
                <th className="py-2.5 px-3">
                  {lang === 'ar' ? 'وصف خدمة شاحنة الرافعة (Boom Truck)' : 'Boom Truck Service Description'}
                </th>
                <th className="py-2.5 px-2.5 text-center w-24">{lang === 'ar' ? 'الحمولة' : 'Capacity'}</th>
                <th className="py-2.5 px-2 text-center w-16">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th className="py-2.5 px-3 text-right rtl:text-left w-28">{lang === 'ar' ? 'السعر (ر.س)' : 'Rate (SAR)'}</th>
                <th className="py-2.5 px-3 text-right rtl:text-left rounded-e w-32">
                  {lang === 'ar' ? 'المجموع (ر.س)' : 'Amount (SAR)'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3.5 px-3 text-slate-500 font-mono font-bold text-center">1</td>
                <td className="py-3.5 px-3">
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                    {invoice.serviceDescription ||
                      (lang === 'ar'
                        ? 'خدمة شاحنة رافعة هيدروليكية (بوم ترَك)'
                        : 'Boom Truck Equipment Service')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {lang === 'ar'
                      ? `الموقع: ${cityAr} · حمولة ${invoice.truckCapacity} مع مشغل ومعدات رفع معتمدة`
                      : `Location: ${displayCity} · ${invoice.truckCapacity} Boom Truck with certified rigging`}
                  </div>
                </td>
                <td className="py-3.5 px-2.5 text-center font-bold text-slate-900 text-xs sm:text-sm">
                  {invoice.truckCapacity || '20 Ton'}
                </td>
                <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-900 text-xs sm:text-sm">
                  {invoice.quantity || 1}
                </td>
                <td className="py-3.5 px-3 text-right rtl:text-left font-mono font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                  {formatCurrency(invoice.rate, lang)}
                </td>
                <td className="py-3.5 px-3 text-right rtl:text-left font-mono font-extrabold text-slate-900 text-xs sm:text-sm tabular-nums">
                  {formatCurrency(invoice.subtotal, lang)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Financial Calculations & Summary Box */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4 sm:gap-5 pt-3 pb-4 border-t border-slate-200">
        {/* Left: Notes & Bank info */}
        <div className="w-full sm:w-1/2 space-y-2.5 text-xs sm:text-[13px]">
          {invoice.notes && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <strong className="block text-slate-900 mb-1 font-bold text-xs">
                {lang === 'ar' ? 'ملاحظات وشروط:' : 'Notes / Terms:'}
              </strong>
              <p className="whitespace-pre-line leading-relaxed text-xs text-slate-700">{invoice.notes}</p>
            </div>
          )}

          {companySettings.bankName && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-900 block text-xs mb-0.5">
                {lang === 'ar' ? 'التحويل البنكي:' : 'Bank Transfer Details:'}
              </span>
              <div className="text-xs font-semibold text-slate-800">{companySettings.bankName}</div>
              {companySettings.iban && (
                <div className="font-mono text-xs text-slate-900 font-bold mt-0.5">{companySettings.iban}</div>
              )}
            </div>
          )}
        </div>

        {/* Right: Calculations (Subtotal, VAT, Grand Total) */}
        <div className="w-full sm:w-5/12 bg-slate-50 p-3.5 rounded-lg border border-slate-300 space-y-2 text-xs sm:text-[13px]">
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-medium">{t.subtotal}</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {formatCurrency(invoice.subtotal, lang)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-700">
            <span className="font-medium">
              {invoice.vatOption === 'VAT 15%' ? t.vat15Label : t.noVat}
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {formatCurrency(invoice.vatAmount, lang)}
            </span>
          </div>

          <div className="pt-2 border-t-2 border-slate-400 flex justify-between items-center">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">{t.grandTotal}</span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-800 font-mono tabular-nums">
              {formatCurrency(invoice.total, lang)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 text-right rtl:text-left font-medium">
            {lang === 'ar' ? 'العملة: ريال سعودي (SAR)' : 'Currency: Saudi Riyals (SAR)'}
          </div>
        </div>
      </div>

      {/* 5. Footer: Stamp & Signature Zone */}
      <div className="pt-5 sm:pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 text-xs sm:text-[13px]">
        <div>
          <span className="text-slate-500 block text-[11px] font-semibold mb-3 sm:mb-6">
            {lang === 'ar' ? 'المستلم / المفوض:' : 'Received by:'}
          </span>
          <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-700 text-xs block sm:inline-block max-w-[200px] font-medium">
            {lang === 'ar' ? 'توقيع العميل' : 'Client Signature'}
          </div>
        </div>

        <div className="text-start sm:text-end rtl:text-start rtl:sm:text-start">
          <span className="text-slate-500 block text-[11px] font-semibold mb-3 sm:mb-6">
            {lang === 'ar' ? 'الختم والتوقيع المعتمد:' : 'Authorized Stamp & Signature:'}
          </span>
          <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-700 text-xs block sm:inline-block max-w-[200px] sm:ms-auto rtl:sm:ms-0 rtl:sm:me-auto font-medium">
            {companySettings.companyName || '[COMPANY NAME]'}
          </div>
        </div>
      </div>
    </div>
  );
};
