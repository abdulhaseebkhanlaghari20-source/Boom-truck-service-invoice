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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مدفوعة' : 'PAID'}
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-700 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مدفوعة جزئياً' : 'PARTIALLY PAID'}
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded bg-rose-50 text-rose-700 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'متأخرة' : 'OVERDUE'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded bg-amber-50 text-amber-700 border border-amber-300">
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
      className={`invoice-sheet bg-white text-slate-800 border border-slate-200 shadow-sm rounded-lg p-4 sm:p-8 w-full max-w-[800px] mx-auto print-container leading-normal select-text relative flex flex-col justify-between min-h-[920px] ${
        isPrintOnly ? 'print-only' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      <div>
        {/* 1. Header: Company Brand + Title + QR Code (Sample Layout Hierarchy) */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4">
          {/* Brand & Company Details */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {companySettings.logoUrl ? (
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={companySettings.logoUrl}
                  alt="Company Logo"
                  referrerPolicy="no-referrer"
                  className="max-h-20 sm:max-h-24 max-w-[140px] sm:max-w-[190px] w-auto h-auto object-contain object-left rtl:object-right"
                />
              </div>
            ) : (
              <div className="w-24 h-18 sm:w-28 sm:h-20 border-2 border-dashed border-emerald-400 bg-emerald-50/50 text-emerald-800 rounded-lg flex flex-col items-center justify-center p-2 shrink-0 text-center">
                <span className="text-[11px] font-extrabold tracking-wider uppercase leading-tight">
                  LOGO
                </span>
                <span className="text-[8px] text-emerald-600 mt-0.5">
                  {lang === 'ar' ? 'شعار المؤسسة' : 'Company Logo'}
                </span>
              </div>
            )}

            <div className="space-y-0.5 min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {lang === 'ar' && companySettings.companyNameAr
                  ? companySettings.companyNameAr
                  : companySettings.companyName || '[COMPANY NAME]'}
              </h1>
              <p className="text-xs text-slate-500 leading-snug">
                {lang === 'ar' && companySettings.addressAr
                  ? companySettings.addressAr
                  : companySettings.address || '[ADDRESS]'}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600 pt-0.5">
                <span>
                  <strong className="text-slate-700">{lang === 'ar' ? 'هاتف:' : 'Phone:'}</strong>{' '}
                  {companySettings.phone || '[PHONE]'}
                </span>
                {companySettings.whatsapp && (
                  <span>
                    <strong className="text-slate-700">WhatsApp:</strong> {companySettings.whatsapp}
                  </span>
                )}
                <span>
                  <strong className="text-slate-700">{lang === 'ar' ? 'بريد:' : 'Email:'}</strong>{' '}
                  {companySettings.email || '[EMAIL]'}
                </span>
              </div>
              <div className="text-xs text-slate-700 font-mono tabular-nums pt-0.5">
                <strong className="text-slate-800 font-sans">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT No:'}</strong>{' '}
                {companySettings.vatNumber || '[VAT NUMBER]'}
                {companySettings.crNumber && (
                  <span className="ms-2.5 text-slate-500 font-sans">
                    <strong className="text-slate-700">{lang === 'ar' ? 'س.ت:' : 'CR No:'}</strong> {companySettings.crNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Large INVOICE Title + QR Code & Status */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto shrink-0 gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-start sm:text-end rtl:text-end rtl:sm:text-start">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider uppercase font-sans">
                {lang === 'ar' ? 'فاتورة' : 'INVOICE'}
              </h2>
              <div className="text-xs font-semibold text-emerald-800 tracking-wide mt-0.5">
                {lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'TAX INVOICE'}
              </div>
              <div className="mt-1">{renderStatus(invoice.paymentStatus)}</div>
            </div>

            {qrCodeDataUrl ? (
              <div className="p-1 bg-white border border-slate-200 rounded shadow-2xs shrink-0">
                <img
                  src={qrCodeDataUrl}
                  alt="ZATCA QR Code"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400 shrink-0">
                QR
              </div>
            )}
          </div>
        </div>

        {/* 2. Signature Ribbon Bar (Sample Layout's defining feature) */}
        <div className="my-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-100/90 rounded border border-slate-200/80 overflow-hidden text-xs">
          {/* Chevron Badge with Invoice# */}
          <div className="relative bg-emerald-700 text-white font-bold px-4 py-2 sm:py-2.5 flex items-center gap-1.5 sm:pe-7 shrink-0">
            <span className="tracking-wide uppercase font-semibold text-[11px] opacity-90">
              {lang === 'ar' ? 'رقم الفاتورة' : 'Invoice#'}
            </span>
            <span className="font-mono text-sm tracking-tight font-extrabold text-emerald-100">
              {invoice.invoiceNumber || 'INV-001'}
            </span>
            {/* Visual Chevron arrow pointer */}
            <div className="hidden sm:block absolute top-0 bottom-0 end-0 w-4 overflow-hidden pointer-events-none">
              <div
                className={`w-4 h-full bg-slate-100/90 ${
                  lang === 'ar'
                    ? 'clip-path-triangle-ar'
                    : 'clip-path-triangle-en'
                }`}
                style={{
                  clipPath: lang === 'ar'
                    ? 'polygon(100% 0, 0 50%, 100% 100%)'
                    : 'polygon(0 0, 100% 50%, 0 100%)',
                }}
              />
            </div>
          </div>

          {/* Dates & Location metadata */}
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-x-4 gap-y-1 px-3 py-2 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-normal">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span>
              <span className="font-mono font-bold text-slate-900">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-normal">{lang === 'ar' ? 'الاستحقاق:' : 'Due Date:'}</span>
              <span className="font-mono font-bold text-slate-900">{formatDate(invoice.dueDate)}</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-normal">{lang === 'ar' ? 'الموقع:' : 'Location:'}</span>
              <span className="font-bold text-slate-900">{lang === 'ar' ? cityAr : displayCity}</span>
            </div>
          </div>
        </div>

        {/* 3. Invoice To (Customer Details) & Equipment Specs (Sample 2-Column Info) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
          {/* Invoice To: */}
          <div className="space-y-1">
            <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1">
              <span>{lang === 'ar' ? 'فاتورة إلى:' : 'Invoice to:'}</span>
            </div>
            <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
              {invoice.customerName || (lang === 'ar' ? 'اسم العميل' : 'Customer Name')}
            </div>
            <div className="text-slate-600">
              <strong className="text-slate-700">{lang === 'ar' ? 'الجوال:' : 'Phone:'}</strong> {invoice.customerPhone || '-'}
            </div>
            {invoice.customerVatNumber && (
              <div className="text-slate-600 font-mono tabular-nums">
                <strong className="text-slate-700 font-sans">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT No:'}</strong>{' '}
                {invoice.customerVatNumber}
              </div>
            )}
          </div>

          {/* Equipment / Site Details */}
          <div className="space-y-1 bg-slate-50/70 p-2.5 rounded border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'ar' ? 'مواصفات المعدة والموقع:' : 'Equipment & Service Site:'}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{lang === 'ar' ? 'نوع المعدة:' : 'Equipment:'}</span>
              <span className="font-bold text-slate-900">
                {lang === 'ar' ? 'شاحنة رافعة هيدروليكية' : 'Boom Truck Crane'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{lang === 'ar' ? 'حمولة الرافعة:' : 'Boom Capacity:'}</span>
              <span className="font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded text-xs font-mono">
                {invoice.truckCapacity || '20 Ton'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{lang === 'ar' ? 'مدينة العمل:' : 'Job Location:'}</span>
              <span className="font-bold text-slate-900">{lang === 'ar' ? cityAr : displayCity}</span>
            </div>
          </div>
        </div>

        {/* 4. Service Line Items Table (Styled like sample with clean modern columns) */}
        <div className="py-4">
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 rounded-md">
            <table className="w-full min-w-[560px] sm:min-w-full text-xs text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-3 rounded-s w-12 text-center">
                    {lang === 'ar' ? 'م' : 'SL.'}
                  </th>
                  <th className="py-2.5 px-3">
                    {lang === 'ar' ? 'بيان الخدمة والمعدة' : 'Item Description'}
                  </th>
                  <th className="py-2.5 px-3 text-center w-24">
                    {lang === 'ar' ? 'الحمولة' : 'Capacity'}
                  </th>
                  <th className="py-2.5 px-3 text-right rtl:text-left w-28">
                    {lang === 'ar' ? 'السعر' : 'Price'}
                  </th>
                  <th className="py-2.5 px-3 text-center w-20">
                    {lang === 'ar' ? 'الكمية' : 'Qty.'}
                  </th>
                  <th className="py-2.5 px-3 text-right rtl:text-left rounded-e w-32">
                    {lang === 'ar' ? 'المجموع' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 text-slate-500 font-mono font-bold text-center">1</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {invoice.serviceDescription ||
                        (lang === 'ar'
                          ? 'خدمة شاحنة رافعة هيدروليكية (بوم ترَك)'
                          : 'Boom Truck Crane Equipment Service')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {lang === 'ar'
                        ? `الموقع: ${cityAr} · حمولة ${invoice.truckCapacity} مع مشغل ومعدات رفع معتمدة`
                        : `Location: ${displayCity} · ${invoice.truckCapacity} Boom Truck with certified rigging`}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">
                    {invoice.truckCapacity || '20 Ton'}
                  </td>
                  <td className="py-3 px-3 text-right rtl:text-left font-mono font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(invoice.rate, lang)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    {invoice.quantity || 1}
                  </td>
                  <td className="py-3 px-3 text-right rtl:text-left font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(invoice.subtotal, lang)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Bottom Section: Payment Info & Terms (Left) + Calculations (Right) */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-6 pt-2 pb-4">
          {/* Left Column: Payment Info + Terms & Conditions (Sample layout) */}
          <div className="w-full sm:w-1/2 space-y-3 text-xs">
            {companySettings.bankName && (
              <div className="space-y-1">
                <span className="font-extrabold text-slate-900 block uppercase tracking-wider text-[11px]">
                  {lang === 'ar' ? 'معلومات الدفع والتحويل:' : 'Payment Info:'}
                </span>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200/80 text-slate-700 text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'ar' ? 'البنك:' : 'Bank:'}</span>
                    <span className="font-semibold text-slate-900">{companySettings.bankName}</span>
                  </div>
                  {companySettings.iban && (
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">{lang === 'ar' ? 'الآيبان:' : 'IBAN:'}</span>
                      <span className="font-bold text-slate-900">{companySettings.iban}</span>
                    </div>
                  )}
                  {companySettings.vatNumber && (
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT:'}</span>
                      <span className="text-slate-700">{companySettings.vatNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="space-y-1">
                <strong className="block text-slate-900 uppercase tracking-wider font-extrabold text-[11px]">
                  {lang === 'ar' ? 'الشروط والملاحظات:' : 'Terms & Conditions:'}
                </strong>
                <p className="p-2.5 bg-slate-50 rounded border border-slate-200/80 text-slate-600 whitespace-pre-line leading-relaxed text-xs">
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Financial Breakdown with Sample's Chevron Total Badge */}
          <div className="w-full sm:w-5/12 space-y-2 text-xs">
            <div className="space-y-1.5 px-2">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">{lang === 'ar' ? 'المجموع الفرعي:' : 'Sub Total:'}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatCurrency(invoice.subtotal, lang)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">
                  {invoice.vatOption === 'VAT 15%' ? (lang === 'ar' ? 'الضريبة (١٥٪):' : 'VAT (15%):') : (lang === 'ar' ? 'الضريبة (معفاة):' : 'Tax (0.00%):')}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatCurrency(invoice.vatAmount, lang)}
                </span>
              </div>
            </div>

            {/* Signature Ribbon Total Badge (Exact visual hierarchy of the reference sample) */}
            <div className="bg-emerald-700 text-white p-2.5 rounded flex items-center justify-between font-bold text-sm shadow-xs mt-2">
              <span className="uppercase tracking-wider text-xs font-extrabold text-emerald-100">
                {lang === 'ar' ? 'الإجمالي:' : 'Total:'}
              </span>
              <span className="font-mono text-base sm:text-lg font-extrabold tracking-tight tabular-nums text-white">
                {formatCurrency(invoice.total, lang)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 text-right rtl:text-left font-medium px-2">
              {lang === 'ar' ? 'المبلغ الإجمالي بالريال السعودي (SAR)' : 'All amounts in Saudi Riyals (SAR)'}
            </div>

            {/* Authorised Sign Zone (Placed under Totals exactly like sample) */}
            <div className="pt-6 text-center sm:text-end rtl:text-center rtl:sm:text-start">
              <div className="inline-block min-w-[160px] text-center border-t border-slate-400 pt-1.5">
                <span className="text-slate-500 font-semibold text-xs block">
                  {lang === 'ar' ? 'التوقيع والختم المعتمد' : 'Authorised Sign'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {companySettings.companyName || '[COMPANY NAME]'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom Banner / Ribbon (Sample Layout's final touch) */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="bg-emerald-800 text-white text-[11px] font-bold px-3 py-1 rounded-sm tracking-wide">
          {lang === 'ar' ? 'شكراً لتعاملكم معنا' : 'Thank you for your business'}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {lang === 'ar' ? 'فاتورة معتمدة طبقاً لمتطلبات هيئة الزكاة والضريبة والجمارك' : 'Generated per ZATCA Saudi E-Invoicing Standards'}
        </div>
      </div>
    </div>
  );
};
