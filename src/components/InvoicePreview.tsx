import React, { useEffect, useState, useRef } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { formatDate, SAUDI_CITIES_AR, numberToWords, toTitleCase } from '../utils/formatters';
import { generateQrCodeDataUrl } from '../utils/zatcaQr';
import { DEFAULT_COMPANY_SETTINGS } from '../utils/demoData';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
} from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  lang: Language;
  isPrintOnly?: boolean;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  companySettings: globalCompanySettings,
  lang,
  isPrintOnly = false,
}) => {
  // Automatically connect to Company Settings with infallible fallback defaults (works for any normal user)
  const companySettings: CompanySettings = {
    ...DEFAULT_COMPANY_SETTINGS,
    ...(invoice?.companySnapshot || globalCompanySettings || {}),
  };

  // Safe numerical values that never throw on undefined, null, or string representation
  const safeQty = Math.max(0, Number(invoice?.quantity) || 1);
  const safeRate = Math.max(0, Number(invoice?.rate) || 0);
  const safeSubtotal = Math.max(0, Number(invoice?.subtotal) || 0);
  const safeVatAmount = Math.max(0, Number(invoice?.vatAmount) || 0);
  const safeTotal = Math.max(0, Number(invoice?.total) || (safeSubtotal + safeVatAmount));

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    generateQrCodeDataUrl(
      companySettings.companyName || 'Boom Truck Rental',
      companySettings.vatNumber || '300000000000003',
      invoice?.invoiceDate || new Date().toISOString(),
      safeTotal,
      safeVatAmount
    ).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    }).catch((err) => {
      console.warn('QR generation notice:', err);
    });
    return () => {
      isMounted = false;
    };
  }, [
    companySettings.companyName,
    companySettings.vatNumber,
    invoice?.invoiceDate,
    safeTotal,
    safeVatAmount,
  ]);

  // Responsive proportional A4 scaling for mobile screens
  useEffect(() => {
    if (isPrintOnly) return;

    const updateScale = () => {
      if (!containerRef.current || !sheetRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const targetWidth = 794; // Standard A4 width

      if (containerWidth > 0 && containerWidth < targetWidth) {
        const newScale = containerWidth / targetWidth;
        setScale(newScale);
        const actualHeight = sheetRef.current.offsetHeight || 1123;
        setScaledHeight(actualHeight * newScale);
      } else {
        setScale(1);
        setScaledHeight(undefined);
      }
    };

    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    if (containerRef.current) ro.observe(containerRef.current);
    if (sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isPrintOnly, invoice, companySettings]);

  // Clean helper: rejects empty or bracketed placeholder strings like '[VAT NUMBER]'
  const cleanVal = (val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return '';
    return trimmed;
  };

  const displayCity =
    invoice.city === 'Other' && invoice.customCity ? invoice.customCity : invoice.city;
  const cityAr = SAUDI_CITIES_AR[displayCity] || displayCity;

  const paymentMethodLabel =
    invoice.paymentStatus === 'Paid'
      ? 'Cash / نقداً'
      : invoice.paymentStatus === 'Partially Paid'
      ? 'Partially Paid / مدفوع جزئياً'
      : 'Bank Transfer / تحويل بنكي';

  // Dynamic corporate identity values
  const companyNameEn = cleanVal(companySettings.companyName) || 'Boom Truck Rental';
  const companyNameAr = cleanVal(companySettings.companyNameAr) || 'بوم ترَك لتأجير المعدات';
  const serviceEn = cleanVal(companySettings.businessServiceEn) || 'BOOM TRUCK RENTAL SERVICES';
  const serviceAr = cleanVal(companySettings.businessServiceAr) || 'لتأجير بوم ترك';
  const taglineEn = cleanVal(companySettings.taglineEn) || 'LIFT  |  TRANSPORT  |  HEAVY EQUIPMENT SOLUTIONS';
  const taglineAr = cleanVal(companySettings.taglineAr) || 'خدمات رفع ونقل ومعدات متكاملة';
  const closingEn = cleanVal(companySettings.closingNoteEn) || cleanVal(companySettings.emailClosing) || 'Thank you for your business';
  const closingAr = cleanVal(companySettings.closingNoteAr) || 'شكراً لتعاملكم معنا';

  const vatNo = cleanVal(companySettings.vatNumber);
  const crNo = cleanVal(companySettings.crNumber);
  const primaryPhone = cleanVal(companySettings.phone);
  const secondaryPhone = cleanVal(companySettings.secondaryPhone);
  const phoneVal = [primaryPhone, secondaryPhone].filter(Boolean).join(', ');
  const whatsappVal = cleanVal(companySettings.whatsapp);
  const emailVal = cleanVal(companySettings.email);
  const addressVal = cleanVal(companySettings.address);
  const addressArVal = cleanVal(companySettings.addressAr);
  const websiteVal = cleanVal(companySettings.website);
  const bankAccountVal = cleanVal(companySettings.bankAccountNumber);
  const sealNoteVal = cleanVal(companySettings.sealNote);

  // Inner A4 Sheet Content (100% Fixed Master Reference A4 Layout)
  const a4SheetContent = (
    <>
      {/* Center Background Watermark (Uses uploaded custom watermark or logo from Settings) */}
      {companySettings.enableWatermark !== false && (companySettings.watermarkUrl || companySettings.logoUrl) && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
          aria-hidden="true"
        >
          <img
            src={companySettings.watermarkUrl || companySettings.logoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-auto h-auto max-w-[420px] max-h-[420px] object-contain transition-opacity"
            style={{
              opacity: companySettings.watermarkOpacity !== undefined ? companySettings.watermarkOpacity : 0.055,
              filter: 'grayscale(100%) contrast(110%)',
            }}
          />
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-between flex-1 space-y-2.5">
        <div>
          {/* ========================================================
              1. CLEAN CORPORATE HEADER (Logo Centered, English Left, Arabic Right)
              ======================================================== */}
          <div className="bg-white text-slate-900 rounded-lg overflow-hidden relative border border-slate-200 shadow-2xs mb-2 p-3 sm:p-4">
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Left Column: English Company Information (LTR) */}
              <div className="col-span-5 text-start space-y-1 min-w-0" dir="ltr">
                <h1
                  className={`font-bold text-slate-900 tracking-tight leading-tight break-words ${
                    companyNameEn.length > 35
                      ? 'text-xs'
                      : companyNameEn.length > 22
                      ? 'text-sm'
                      : 'text-base'
                  }`}
                >
                  {toTitleCase(companyNameEn)}
                </h1>
                {serviceEn && (
                  <p className="text-[10px] font-bold text-emerald-800 tracking-wide leading-tight">
                    {serviceEn}
                  </p>
                )}
                {vatNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-slate-900">VAT: </span>
                    <span className="font-mono">{vatNo}</span>
                  </div>
                )}
                {crNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-slate-900">CR: </span>
                    <span className="font-mono">{crNo}</span>
                  </div>
                )}
                {addressVal && (
                  <div className="text-[9.5px] text-slate-700 leading-snug break-words">
                    <span className="font-bold text-slate-900">Address: </span>
                    <span>{addressVal}</span>
                  </div>
                )}
              </div>

              {/* Center Column: Company Logo */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                {companySettings.logoUrl ? (
                  <div className="w-20 h-16 rounded-md p-0.5 flex items-center justify-center">
                    <img
                      src={companySettings.logoUrl}
                      alt="Company Logo"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full w-auto h-auto object-contain object-center"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-14 bg-emerald-50 border border-emerald-300 rounded-md flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[10px] font-black tracking-tight text-slate-800">COMPANY</span>
                    <span className="text-[7.5px] font-bold text-emerald-700">LOGO</span>
                  </div>
                )}
              </div>

              {/* Right Column: Arabic Company Information (RTL) */}
              <div className="col-span-5 text-end space-y-1 min-w-0" dir="rtl">
                <h2
                  className={`font-bold text-slate-900 leading-tight break-words ${
                    companyNameAr.length > 35
                      ? 'text-sm'
                      : companyNameAr.length > 22
                      ? 'text-base'
                      : 'text-lg'
                  }`}
                >
                  {companyNameAr}
                </h2>
                {serviceAr && (
                  <div className="text-[10.5px] font-bold text-emerald-800 leading-tight">
                    {serviceAr}
                  </div>
                )}
                {vatNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-slate-900">الرقم الضريبي: </span>
                    <span className="font-mono">{vatNo}</span>
                  </div>
                )}
                {crNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-slate-900">السجل التجاري: </span>
                    <span className="font-mono">{crNo}</span>
                  </div>
                )}
                {(addressArVal || addressVal) && (
                  <div className="text-[9.5px] text-slate-700 leading-snug break-words">
                    <span className="font-bold text-slate-900">العنوان: </span>
                    <span>{addressArVal || addressVal}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="w-full h-[2px] bg-slate-200 mt-2.5" />
          </div>

          {/* 2. INVOICE TITLE: Clean Horizontal Title Bar */}
          <div className="flex justify-center my-1.5">
            <div className="w-full border border-slate-300 rounded-md py-1.5 text-center bg-slate-100/90 shadow-2xs">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-wide">
                Tax Invoice / الفاتورة الضريبية
              </span>
            </div>
          </div>

          {/* 3. CUSTOMER + INVOICE DETAILS: 2-Column Arrangement */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-2 text-xs text-slate-800">
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
                  {invoice.customerVatNumber || '-'}
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
            <div className="space-y-1 text-end rtl:text-start">
              <div className="flex items-baseline justify-end rtl:justify-start gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Invoice No. / رقم الفاتورة :
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {invoice.invoiceNumber || '0177'}
                </span>
              </div>
              <div className="flex items-baseline justify-end rtl:justify-start gap-1.5">
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  Date / تاريخ الفاتورة :
                </span>
                <span className="font-mono text-slate-800">
                  {formatDate(invoice.invoiceDate)}
                </span>
              </div>
              <div className="flex items-baseline justify-end rtl:justify-start gap-1.5">
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
            <table className="w-full text-xs text-center border-collapse border border-slate-300">
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
                    {safeQty}.00 Pcs
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-300 font-mono">
                    {safeRate.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-300 font-mono">
                    {safeVatAmount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-300 font-mono font-bold">
                    {safeTotal.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2.5 font-mono font-bold">
                    {safeTotal.toFixed(2)}
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

          {/* 5. QR CODE + TOTALS SECTION (Side by side like reference) */}
          <div className="flex flex-row justify-between items-center gap-4 py-2">
            {/* Left: Clean Bordered ZATCA QR Code */}
            <div className="p-2 border border-slate-300 rounded bg-white shrink-0 shadow-2xs">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="ZATCA QR Code"
                  className="w-28 h-28 object-contain"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  QR CODE
                </div>
              )}
            </div>

            {/* Right: Totals Table */}
            <div className="flex-1 max-w-md border border-slate-300 rounded text-xs">
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200">
                <span className="font-bold text-slate-800">
                  Subtotal / الإجمالي قبل ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {safeSubtotal.toFixed(2)} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200">
                <span className="font-bold text-slate-800">
                  Vat 15% / ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  (+) {safeVatAmount.toFixed(2)} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 bg-slate-50/70">
                <span className="font-extrabold text-slate-900">
                  Total Amount / الإجمالي شامل ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-black text-slate-900 tabular-nums">
                  {safeTotal.toFixed(2)} ر.س
                </span>
              </div>

              <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50/90">
                <span className="font-extrabold text-slate-900">
                  Total Paid / مجموع المبلغ المدفوع
                </span>
                <span className="font-mono font-black text-slate-900 tabular-nums">
                  {safeTotal.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* 6. AMOUNT IN WORDS BAR */}
          <div className="bg-slate-200/80 border-y border-slate-300 px-3 py-1.5 text-xs text-slate-900 flex flex-row items-center justify-between gap-1">
            <span className="font-bold whitespace-nowrap">
              Amount Chargeable (in words) / المبلغ الإجمالي بالكلمات :
            </span>
            <span className="font-semibold text-slate-900 italic">
              {numberToWords(safeTotal, lang)}
            </span>
          </div>

          {/* 7. NOTES + BANK DETAILS + 3 SIGNATURE COLUMNS */}
          <div className="border border-slate-300 rounded text-[11px] text-slate-800 my-2 overflow-hidden">
            {/* Seal Note */}
            <div className="px-3 py-1.5 border-b border-slate-300 bg-slate-50 font-medium text-slate-700">
              <strong className="text-slate-900 font-bold">Seal Note : </strong>
              <span>
                {invoice.notes ||
                  sealNoteVal ||
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
                  <span>{cleanVal(companySettings.bankName) || '-'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <strong className="text-slate-900 font-sans">A/C: </strong>
                  <span>{bankAccountVal || '-'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <strong className="text-slate-900 font-sans">IBAN: </strong>
                  <span>{cleanVal(companySettings.iban) || '-'}</span>
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

        {/* ========================================================
            8. MASTER CORPORATE FOOTER (Thin & Compact: Phone + Email Only)
            ======================================================== */}
        {(phoneVal || emailVal) && (
          <div className="bg-slate-900 text-white rounded-lg shadow-2xs overflow-hidden relative border border-slate-800 mt-2">
            {/* Top Thin Accent Stripe */}
            <div className="w-full h-[2px] bg-emerald-600" />

            <div className="py-1.5 px-4 flex flex-row items-center justify-between text-[10.5px]">
              {/* Phone / Mobile */}
              {phoneVal ? (
                <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-300">Phone / الجوال:</span>
                  <span className="font-mono text-slate-100">{phoneVal}</span>
                </div>
              ) : <div />}

              {/* Email */}
              {emailVal && (
                <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-300">Email / البريد:</span>
                  <span className="text-slate-100">{emailVal}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  // If rendering inside hidden print container, render directly without wrapper or scale
  if (isPrintOnly) {
    return (
      <div
        id={`invoice-preview-sheet-${invoice.id}`}
        data-invoice-sheet="true"
        className="invoice-sheet print-only bg-white text-slate-900 p-6 mx-auto leading-normal select-text relative flex flex-col justify-between overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{
          fontFamily: 'Arial, "Arial Arabic", "Noto Sans Arabic", sans-serif',
          width: '794px',
          minWidth: '794px',
          maxWidth: '794px',
          minHeight: '1123px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        {a4SheetContent}
      </div>
    );
  }

  // Interactive Live Preview: Scaled proportionally on mobile screens to preserve exact A4 proportions
  return (
    <div
      ref={containerRef}
      className="invoice-preview-scale-wrapper w-full flex justify-center overflow-hidden"
      style={{
        height: scaledHeight !== undefined ? `${scaledHeight}px` : 'auto',
      }}
    >
      <div
        ref={sheetRef}
        id={`invoice-preview-sheet-${invoice.id}`}
        data-invoice-sheet="true"
        className="invoice-sheet bg-white text-slate-900 border border-slate-300 shadow-md rounded-lg p-6 w-[794px] min-h-[1123px] shrink-0 leading-normal select-text relative flex flex-col justify-between overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{
          fontFamily: 'Arial, "Arial Arabic", "Noto Sans Arabic", sans-serif',
          width: '794px',
          minWidth: '794px',
          maxWidth: '794px',
          transform: scale < 1 ? `scale(${scale})` : 'none',
          transformOrigin: 'top center',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        {a4SheetContent}
      </div>
    </div>
  );
};
