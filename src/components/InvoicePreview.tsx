import React, { useEffect, useState } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { formatDate, SAUDI_CITIES_AR, numberToWords } from '../utils/formatters';
import { generateQrCodeDataUrl } from '../utils/zatcaQr';
import { MapPin, Phone, Mail } from 'lucide-react';

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

  const paymentMethodLabel =
    invoice.paymentStatus === 'Paid'
      ? 'Cash / نقداً'
      : invoice.paymentStatus === 'Partially Paid'
      ? 'Partially Paid / مدفوع جزئياً'
      : 'Bank Transfer / تحويل بنكي';

  return (
    <div
      id={`invoice-preview-sheet-${invoice.id}`}
      data-invoice-sheet="true"
      className={`invoice-sheet bg-white text-slate-900 border border-slate-300 shadow-md rounded-lg p-3 sm:p-6 w-full max-w-[800px] mx-auto print-container leading-normal select-text relative flex flex-col justify-between overflow-hidden min-h-[960px] ${
        isPrintOnly ? 'print-only' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      {/* 1. Large Center Background Watermark (Uses uploaded company logo from Settings) */}
      {companySettings.logoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
          aria-hidden="true"
        >
          <img
            src={companySettings.logoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-auto h-auto max-w-[360px] sm:max-w-[440px] max-h-[360px] sm:max-h-[440px] object-contain transition-opacity"
            style={{
              opacity: 0.055,
              filter: 'grayscale(100%) contrast(110%)',
            }}
          />
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-between flex-1 space-y-2.5">
        <div>
          {/* 1. TOP HEADER: English Identity (Left) + Logo + Arabic Identity (Right) */}
          <div className="flex flex-row justify-between items-center gap-3 pt-1 pb-1">
            {/* Left: English Company Identity & Logo */}
            <div className="flex items-center gap-3 min-w-0">
              {companySettings.logoUrl ? (
                <img
                  src={companySettings.logoUrl}
                  alt="Company Logo"
                  referrerPolicy="no-referrer"
                  className="max-h-14 sm:max-h-18 max-w-[130px] sm:max-w-[180px] w-auto h-auto object-contain object-left rtl:object-right shrink-0"
                />
              ) : (
                <div className="w-16 h-12 sm:w-20 sm:h-14 border border-dashed border-slate-400 bg-slate-50 text-slate-600 rounded flex flex-col items-center justify-center p-1 shrink-0 text-center">
                  <span className="text-[10px] font-bold tracking-tight">BOOM TRUCK</span>
                  <span className="text-[7.5px] text-slate-400">LOGO</span>
                </div>
              )}

              <div className="space-y-0.5 min-w-0">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight truncate">
                  {companySettings.companyName || 'BOOM TRUCK'}
                </h1>
                <p className="text-[9px] sm:text-[10px] tracking-wider font-extrabold uppercase text-amber-600">
                  BOOM TRUCK RENTAL SERVICES
                </p>
                {companySettings.vatNumber && (
                  <p className="text-[9.5px] text-slate-500 font-mono">
                    VAT: {companySettings.vatNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Arabic Company Identity */}
            <div className="text-end rtl:text-start space-y-0.5 shrink-0" dir="rtl">
              <h2 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                {companySettings.companyNameAr || 'بومكس السعودية'}
              </h2>
              <div className="text-xs sm:text-sm font-bold text-amber-600">
                لتأجير بوم تراك
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                خدمات رافعات وونشات متكاملة
              </div>
            </div>
          </div>

          {/* Dark Blue / Slate Divider Bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full my-2" />

          {/* 2. INVOICE TITLE: Centered Bordered Box */}
          <div className="flex justify-center my-1.5">
            <div className="border border-slate-700/80 rounded-md px-6 sm:px-12 py-1 text-center bg-white shadow-2xs">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide font-sans">
                Tax Invoice الفاتورة الضريبية
              </span>
            </div>
          </div>

          {/* 3. CUSTOMER + INVOICE DETAILS: 2-Column Arrangement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-2 text-xs text-slate-800">
            {/* Left Column: Customer Information */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Client Name / اسم العميل :
                </span>
                <span className="font-bold text-slate-900 truncate">
                  {invoice.customerName || '-'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  VAT No. / الرقم الضريبي :
                </span>
                <span className="font-mono text-slate-800">
                  {invoice.customerVatNumber || companySettings.vatNumber || '-'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Address / عنوان العميل :
                </span>
                <span className="text-slate-700 truncate">
                  {displayCity} ({cityAr})
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Mobile / جوال :
                </span>
                <span className="font-mono text-slate-800">
                  {invoice.customerPhone || '-'}
                </span>
              </div>
            </div>

            {/* Right Column: Invoice Metadata */}
            <div className="space-y-1 text-start sm:text-end rtl:text-end rtl:sm:text-start">
              <div className="flex items-baseline justify-start sm:justify-end rtl:justify-end rtl:sm:justify-start gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Invoice No. / رقم الفاتورة :
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.invoiceNumber || '0177'}
                </span>
              </div>
              <div className="flex items-baseline justify-start sm:justify-end rtl:justify-end rtl:sm:justify-start gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Date / تاريخ الفاتورة :
                </span>
                <span className="font-mono text-slate-800">
                  {formatDate(invoice.invoiceDate)}
                </span>
              </div>
              <div className="flex items-baseline justify-start sm:justify-end rtl:justify-end rtl:sm:justify-start gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Pay Via / طريقة الدفع :
                </span>
                <span className="font-semibold text-slate-900">
                  {paymentMethodLabel}
                </span>
              </div>
            </div>
          </div>

          {/* 4. SERVICE TABLE (Reference Table Design with Clean Grid & Empty Rows) */}
          <div className="my-2">
            <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[620px] sm:min-w-full text-[11px] sm:text-xs text-center border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <th className="py-2 px-1.5 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="py-2 px-3 border-r border-slate-300 text-start w-2/5">
                      <div>Descriptions</div>
                      <div className="text-[10px] text-slate-600 font-semibold">بيان الصنف</div>
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 w-16">
                      <div>QTY</div>
                      <div className="text-[10px] text-slate-600 font-semibold">الكمية</div>
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 w-20">
                      <div>Rate</div>
                      <div className="text-[10px] text-slate-600 font-semibold">السعر</div>
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 w-20">
                      <div>VAT 15%</div>
                      <div className="text-[10px] text-slate-600 font-semibold">الضريبة</div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-slate-300 w-24">
                      <div>Amount Inc. Vat</div>
                      <div className="text-[10px] text-slate-600 font-semibold">المبلغ شامل الضريبة</div>
                    </th>
                    <th className="py-2 px-2.5 w-24">
                      <div>Subtotal</div>
                      <div className="text-[10px] text-slate-600 font-semibold">المجموع الفرعي</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {/* Line 1: Primary Boom Truck Service Data */}
                  <tr className="bg-white/80 font-medium text-slate-900">
                    <td className="py-2.5 px-1.5 border-r border-slate-300 font-bold font-mono">1</td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-start font-semibold">
                      <div>
                        {invoice.serviceDescription ||
                          `Boom Truck For One Day (${displayCity})`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {invoice.truckCapacity || '20 Ton'} Boom Truck Crane with licensed operator
                      </div>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 font-mono">
                      {invoice.quantity}.00 Pcs
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 font-mono">
                      {invoice.rate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-300 font-mono">
                      {invoice.vatAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-300 font-mono font-bold">
                      {invoice.total.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono font-bold">
                      {invoice.total.toFixed(2)}
                    </td>
                  </tr>

                  {/* 5 Empty Rows to replicate the professional height/spacing of the reference */}
                  {[2, 3, 4, 5, 6].map((rowNum) => (
                    <tr key={rowNum} className="h-7 bg-white/40">
                      <td className="py-1 px-1.5 border-r border-slate-300 font-mono text-slate-300"></td>
                      <td className="py-1 px-3 border-r border-slate-300"></td>
                      <td className="py-1 px-2 border-r border-slate-300"></td>
                      <td className="py-1 px-2 border-r border-slate-300"></td>
                      <td className="py-1 px-2 border-r border-slate-300"></td>
                      <td className="py-1 px-2.5 border-r border-slate-300"></td>
                      <td className="py-1 px-2.5"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. QR CODE + TOTALS SECTION (Side by side like reference) */}
          <div className="flex flex-row justify-between items-center gap-4 py-2">
            {/* Left: Clean Bordered ZATCA QR Code */}
            <div className="p-2 border border-slate-300 rounded bg-white shrink-0 shadow-2xs">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="ZATCA QR Code"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  QR CODE
                </div>
              )}
            </div>

            {/* Right: Totals Table */}
            <div className="flex-1 max-w-sm sm:max-w-md border border-slate-300 rounded text-xs">
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200">
                <span className="font-bold text-slate-800">
                  Subtotal / الإجمالي قبل ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {invoice.subtotal.toFixed(2)} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200">
                <span className="font-bold text-slate-800">
                  Vat 15% / ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  (+) {invoice.vatAmount.toFixed(2)} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 bg-slate-50/70">
                <span className="font-extrabold text-slate-900">
                  Total Amount / الإجمالي شامل ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-black text-slate-900 tabular-nums">
                  {invoice.total.toFixed(2)} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50/90">
                <span className="font-extrabold text-slate-900">
                  Total Paid / مجموع المبلغ المدفوع
                </span>
                <span className="font-mono font-black text-slate-900 tabular-nums">
                  {invoice.total.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* 6. AMOUNT IN WORDS BAR */}
          <div className="bg-slate-200/80 border-y border-slate-300 px-3 py-1.5 text-xs text-slate-900 flex flex-wrap items-center justify-between gap-1">
            <span className="font-bold whitespace-nowrap">
              Amount Chargeable (in words) / المبلغ الإجمالي بالكلمات :
            </span>
            <span className="font-semibold text-slate-900 italic">
              {numberToWords(invoice.total, lang)}
            </span>
          </div>

          {/* 7. NOTES + BANK DETAILS + 3 SIGNATURE COLUMNS */}
          <div className="border border-slate-300 rounded text-[11px] text-slate-800 my-2 overflow-hidden">
            {/* Seal Note */}
            <div className="px-3 py-1 border-b border-slate-300 bg-slate-50 font-medium text-slate-700">
              <strong className="text-slate-900 font-bold">Seal Note : </strong>
              <span>
                {invoice.notes ||
                  'Certified boom truck crane & licensed operator. Services performed per Saudi safety standards.'}
              </span>
            </div>

            {/* 4 Equal Columns: Bank Details | Prepared By | Approved By | Received By */}
            <div className="grid grid-cols-4 divide-x divide-slate-300 text-center">
              {/* Col 1: Bank Details */}
              <div className="text-start p-2 space-y-0.5">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5 mb-1 text-center">
                  Bank Details
                </div>
                <div className="text-[10px] text-slate-700">
                  <strong className="text-slate-900">Bank: </strong>
                  <span>{companySettings.bankName || 'Alinma Bank'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <strong className="text-slate-900 font-sans">A/C: </strong>
                  <span>{companySettings.crNumber || '68206151342000'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <strong className="text-slate-900 font-sans">IBAN: </strong>
                  <span>{companySettings.iban || 'SA55050000068206151342000'}</span>
                </div>
              </div>

              {/* Col 2: Prepared By */}
              <div className="p-2 flex flex-col justify-between h-20">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">
                  Prepared By
                </div>
                <div className="text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-1">
                  Sign/Stamp
                </div>
              </div>

              {/* Col 3: Approved By */}
              <div className="p-2 flex flex-col justify-between h-20">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">
                  Approved By
                </div>
                <div className="text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-1">
                  Sign/Stamp
                </div>
              </div>

              {/* Col 4: Received By */}
              <div className="p-2 flex flex-col justify-between h-20">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">
                  Received By
                </div>
                <div className="text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-1">
                  Sign/Stamp
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. FULL-WIDTH DARK FOOTER BAR */}
        <div className="bg-slate-900 text-white py-2.5 px-3 sm:px-4 rounded-md flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] font-medium tracking-tight">
          {/* Address */}
          <div className="flex items-center gap-1.5 text-slate-200 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {companySettings.address || 'Dammam, Kingdom Of Saudi Arabia'}
            </span>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Mob: {companySettings.phone || '0597330558'}</span>
            {companySettings.whatsapp && (
              <span className="text-slate-400">/ {companySettings.whatsapp}</span>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center gap-1.5 text-slate-200 truncate">
            <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Mail: {companySettings.email || 'info@boomtruckservices.sa'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
