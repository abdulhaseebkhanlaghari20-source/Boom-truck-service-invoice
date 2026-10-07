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

  const vatNo = cleanVal(companySettings.vatNumber);
  const crNo = cleanVal(companySettings.crNumber);
  const primaryPhone = cleanVal(companySettings.phone);
  const secondaryPhone = cleanVal(companySettings.secondaryPhone);
  const phoneVal = [primaryPhone, secondaryPhone].filter(Boolean).join(', ');
  const emailVal = cleanVal(companySettings.email);
  const addressVal = cleanVal(companySettings.address);
  const addressArVal = cleanVal(companySettings.addressAr);
  const bankAccountVal = cleanVal(companySettings.bankAccountNumber);
  const sealNoteVal = cleanVal(companySettings.sealNote);

  // Paid and Due amounts calculated safely
  const paidAmount = invoice.paymentStatus === 'Paid'
    ? safeTotal
    : invoice.paymentStatus === 'Partially Paid'
    ? safeTotal / 2
    : 0;
  const amountDue = Math.max(0, safeTotal - paidAmount);

  // Inner A4 Sheet Content (100% Fixed Master Reference A4 Layout)
  const a4SheetContent = (
    <>
      {/* Center Background Watermark */}
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
              opacity: companySettings.watermarkOpacity !== undefined ? companySettings.watermarkOpacity : 0.05,
              filter: 'grayscale(100%) contrast(110%)',
            }}
          />
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-between flex-1 space-y-2">
        <div>
          {/* ========================================================
              1. MASTER HEADER: English Left, Logo Centered, Arabic Right
              ======================================================== */}
          <div className="bg-white text-slate-900 rounded-md overflow-hidden relative border border-[#cbdde8] mb-2 p-3 sm:p-3.5">
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Left Column: English Company Information (LTR) */}
              <div className="col-span-5 text-start space-y-0.5 min-w-0" dir="ltr">
                <h1
                  className={`font-bold text-[#0f2744] tracking-tight leading-tight break-words ${
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
                  <p className="text-[10px] font-bold text-[#1e4976] tracking-wide leading-tight">
                    {serviceEn}
                  </p>
                )}
                {vatNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-[#0f2744]">VAT: </span>
                    <span className="font-mono">{vatNo}</span>
                  </div>
                )}
                {crNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-[#0f2744]">CR: </span>
                    <span className="font-mono">{crNo}</span>
                  </div>
                )}
                {addressVal && (
                  <div className="text-[9.5px] text-slate-700 leading-snug break-words">
                    <span className="font-bold text-[#0f2744]">Address: </span>
                    <span>{addressVal}</span>
                  </div>
                )}
              </div>

              {/* Center Column: Company Logo */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                {companySettings.logoUrl ? (
                  <div className="w-20 h-16 rounded p-0.5 flex items-center justify-center">
                    <img
                      src={companySettings.logoUrl}
                      alt="Company Logo"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full w-auto h-auto object-contain object-center"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-14 bg-[#f0f5fa] border border-[#cbdde8] rounded flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[10px] font-bold tracking-tight text-[#0f2744]">COMPANY</span>
                    <span className="text-[7.5px] font-bold text-[#1e4976]">LOGO</span>
                  </div>
                )}
              </div>

              {/* Right Column: Arabic Company Information (RTL) */}
              <div className="col-span-5 text-end space-y-0.5 min-w-0" dir="rtl">
                <h2
                  className={`font-bold text-[#0f2744] leading-tight break-words ${
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
                  <div className="text-[10.5px] font-bold text-[#1e4976] leading-tight">
                    {serviceAr}
                  </div>
                )}
                {vatNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-[#0f2744]">الرقم الضريبي: </span>
                    <span className="font-mono">{vatNo}</span>
                  </div>
                )}
                {crNo && (
                  <div className="text-[10px] text-slate-800 leading-tight">
                    <span className="font-bold text-[#0f2744]">السجل التجاري: </span>
                    <span className="font-mono">{crNo}</span>
                  </div>
                )}
                {(addressArVal || addressVal) && (
                  <div className="text-[9.5px] text-slate-700 leading-snug break-words">
                    <span className="font-bold text-[#0f2744]">العنوان: </span>
                    <span>{addressArVal || addressVal}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtle Divider Line */}
            <div className="w-full h-[2px] bg-[#e2ecf3] mt-2.5" />
          </div>

          {/* ========================================================
              2. INVOICE TITLE: Master Tax Invoice Title Bar
              ======================================================== */}
          <div className="flex justify-center my-1.5">
            <div className="w-full bg-[#0f2744] text-white rounded py-1.5 px-4 text-center shadow-xs">
              <span className="text-sm sm:text-base font-bold tracking-wider">
                Tax Invoice / الفاتورة الضريبية
              </span>
            </div>
          </div>

          {/* ========================================================
              3. TWO-COLUMN DETAILS: Client Details (Left) + Invoice Details (Right)
              ======================================================== */}
          <div className="grid grid-cols-2 gap-3 my-2 text-xs">
            {/* Left Column: Client Details */}
            <div className="border border-[#cbdde8] rounded overflow-hidden bg-white">
              <div className="bg-[#f0f5fa] border-b border-[#cbdde8] px-3 py-1 font-bold text-[#0f2744] flex justify-between items-center">
                <span>Client Details</span>
                <span dir="rtl">بيانات العميل</span>
              </div>
              <div className="p-2.5 space-y-1.5 text-slate-800">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Client Name / اسم العميل :
                  </span>
                  <span className="font-bold text-slate-900 truncate text-end">
                    {invoice.customerName || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Mobile / رقم الجوال :
                  </span>
                  <span className="font-mono text-slate-900 text-end">
                    {invoice.customerPhone || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Address / العنوان :
                  </span>
                  <span className="text-slate-800 truncate text-end">
                    {displayCity} ({cityAr})
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Job Location / موقع العمل :
                  </span>
                  <span className="text-slate-800 truncate text-end">
                    {displayCity}
                  </span>
                </div>
                {invoice.customerVatNumber && (
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-[#0f2744] whitespace-nowrap">
                      VAT No. / الرقم الضريبي :
                    </span>
                    <span className="font-mono text-slate-900 text-end">
                      {invoice.customerVatNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Invoice Details */}
            <div className="border border-[#cbdde8] rounded overflow-hidden bg-white">
              <div className="bg-[#f0f5fa] border-b border-[#cbdde8] px-3 py-1 font-bold text-[#0f2744] flex justify-between items-center">
                <span>Invoice Details</span>
                <span dir="rtl">بيانات الفاتورة</span>
              </div>
              <div className="p-2.5 space-y-1.5 text-slate-800">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Invoice No. / رقم الفاتورة :
                  </span>
                  <span className="font-mono font-bold text-[#0f2744] text-end">
                    {invoice.invoiceNumber || '0177'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Date / تاريخ الفاتورة :
                  </span>
                  <span className="font-mono text-slate-900 text-end">
                    {formatDate(invoice.invoiceDate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Due Date / تاريخ الاستحقاق :
                  </span>
                  <span className="font-mono text-slate-900 text-end">
                    {formatDate(invoice.dueDate || invoice.invoiceDate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Payment Method / طريقة الدفع :
                  </span>
                  <span className="font-semibold text-slate-900 text-end">
                    {paymentMethodLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. LARGE BILINGUAL SERVICE TABLE
              ======================================================== */}
          <div className="my-2">
            <table className="w-full text-xs text-center border-collapse border border-[#cbdde8]">
              <thead>
                <tr className="bg-[#0f2744] text-white font-bold border-b border-[#0f2744]">
                  <th className="py-2 px-1.5 border-r border-[#1e4976] w-9 text-center">#</th>
                  <th className="py-2 px-3 border-r border-[#1e4976] text-start w-2/5">
                    <div>Description</div>
                    <div className="text-[10px] text-sky-200 font-normal">الوصف</div>
                  </th>
                  <th className="py-2 px-2 border-r border-[#1e4976] w-16">
                    <div>Quantity</div>
                    <div className="text-[10px] text-sky-200 font-normal">الكمية</div>
                  </th>
                  <th className="py-2 px-2 border-r border-[#1e4976] w-20">
                    <div>Rate</div>
                    <div className="text-[10px] text-sky-200 font-normal">سعر الوحدة</div>
                  </th>
                  <th className="py-2 px-2 border-r border-[#1e4976] w-20">
                    <div>VAT 15%</div>
                    <div className="text-[10px] text-sky-200 font-normal">ضريبة القيمة المضافة</div>
                  </th>
                  <th className="py-2 px-2.5 border-r border-[#1e4976] w-24">
                    <div>Subtotal</div>
                    <div className="text-[10px] text-sky-200 font-normal">المجموع الفرعي</div>
                  </th>
                  <th className="py-2 px-2.5 w-24">
                    <div>Total Amount</div>
                    <div className="text-[10px] text-sky-200 font-normal">إجمالي المبلغ</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbdde8]">
                {/* Line 1: Service Record */}
                <tr className="bg-white font-normal text-slate-900">
                  <td className="py-2 px-1.5 border-r border-[#cbdde8] font-bold font-mono">1</td>
                  <td className="py-2 px-3 border-r border-[#cbdde8] text-start">
                    <div className="font-semibold text-slate-900">
                      {invoice.serviceDescription ||
                        `Boom Truck For One Day (${displayCity})`}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {invoice.truckCapacity || '20 Ton'} Boom Truck Crane with licensed operator
                    </div>
                  </td>
                  <td className="py-2 px-2 border-r border-[#cbdde8] font-mono">
                    {safeQty}.00 Pcs
                  </td>
                  <td className="py-2 px-2 border-r border-[#cbdde8] font-mono">
                    {safeRate.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 border-r border-[#cbdde8] font-mono">
                    {safeVatAmount.toFixed(2)}
                  </td>
                  <td className="py-2 px-2.5 border-r border-[#cbdde8] font-mono">
                    {safeSubtotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-2.5 font-mono font-bold text-[#0f2744]">
                    {safeTotal.toFixed(2)}
                  </td>
                </tr>

                {/* Empty Rows to replicate master reference spacing and proportions */}
                {[2, 3, 4, 5, 6].map((rowNum) => (
                  <tr key={rowNum} className="h-6.5 bg-[#fbfdff]">
                    <td className="py-1 px-1.5 border-r border-[#cbdde8] font-mono text-slate-300"></td>
                    <td className="py-1 px-3 border-r border-[#cbdde8]"></td>
                    <td className="py-1 px-2 border-r border-[#cbdde8]"></td>
                    <td className="py-1 px-2 border-r border-[#cbdde8]"></td>
                    <td className="py-1 px-2 border-r border-[#cbdde8]"></td>
                    <td className="py-1 px-2.5 border-r border-[#cbdde8]"></td>
                    <td className="py-1 px-2.5"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================
              5. QR CODE + TOTALS SECTION
              ======================================================== */}
          <div className="flex flex-row justify-between items-center gap-4 py-1.5">
            {/* Left: Clean Bordered ZATCA QR Code */}
            <div className="p-2 border border-[#cbdde8] rounded bg-white shrink-0 shadow-2xs">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="ZATCA QR Code"
                  className="w-28 h-28 object-contain"
                />
              ) : (
                <div className="w-28 h-28 bg-[#f0f5fa] flex items-center justify-center text-xs text-slate-400">
                  QR CODE
                </div>
              )}
            </div>

            {/* Right: Totals Box */}
            <div className="flex-1 max-w-md border border-[#cbdde8] rounded overflow-hidden text-xs bg-white">
              {/* Subtotal */}
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-[#cbdde8]">
                <span className="font-bold text-slate-800">
                  Subtotal / المجموع الفرعي
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {safeSubtotal.toFixed(2)} ر.س
                </span>
              </div>

              {/* VAT 15% */}
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-[#cbdde8]">
                <span className="font-bold text-slate-800">
                  VAT 15% / ضريبة القيمة المضافة
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  (+) {safeVatAmount.toFixed(2)} ر.س
                </span>
              </div>

              {/* Total Amount (Prominent Bold 700) */}
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-[#cbdde8] bg-[#f0f5fa]">
                <span className="font-bold text-[#0f2744]">
                  Total Amount / إجمالي المبلغ
                </span>
                <span className="font-mono font-bold text-[#0f2744] tabular-nums text-sm">
                  {safeTotal.toFixed(2)} ر.س
                </span>
              </div>

              {/* Paid Amount */}
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-[#cbdde8]/50">
                <span className="font-bold text-slate-700">
                  Paid Amount / المبلغ المدفوع
                </span>
                <span className="font-mono font-bold text-slate-800 tabular-nums">
                  {paidAmount.toFixed(2)} ر.س
                </span>
              </div>

              {/* Amount Due */}
              <div className="flex justify-between items-center px-3 py-1.5 bg-[#fbfdff]">
                <span className="font-bold text-slate-700">
                  Amount Due / المبلغ المستحق
                </span>
                <span className="font-mono font-bold text-slate-800 tabular-nums">
                  {amountDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              6. AMOUNT IN WORDS SECTION
              ======================================================== */}
          <div className="bg-[#f0f5fa] border border-[#cbdde8] rounded px-3 py-1.5 text-xs text-slate-900 flex flex-row items-center justify-between gap-2 my-1">
            <span className="font-bold text-[#0f2744] whitespace-nowrap">
              Amount in Words / المبلغ بالكلمات :
            </span>
            <span className="font-normal text-slate-800 italic text-end">
              {numberToWords(safeTotal, lang)}
            </span>
          </div>

          {/* ========================================================
              7. LOWER SECTION: Bank Details & Signatures
              ======================================================== */}
          <div className="border border-[#cbdde8] rounded text-[11px] text-slate-800 my-1.5 overflow-hidden bg-white">
            {/* Notes / Seal Note */}
            <div className="px-3 py-1.5 border-b border-[#cbdde8] bg-[#fbfdff] font-normal text-slate-700">
              <span className="text-[#0f2744] font-bold">Notes / ملاحظات : </span>
              <span>
                {invoice.notes ||
                  sealNoteVal ||
                  'Certified boom truck crane & licensed operator. Services performed per Saudi safety standards.'}
              </span>
            </div>

            {/* 4 Equal Columns: Bank Details | Prepared By | Approved By | Received By */}
            <div className="grid grid-cols-4 divide-x divide-[#cbdde8] text-center">
              {/* Col 1: Bank Details */}
              <div className="text-start p-2 space-y-0.5 bg-[#f0f5fa]/40">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5 mb-1 text-center">
                  Bank Details / بيانات البنك
                </div>
                <div className="text-[10px] text-slate-700">
                  <span className="font-bold text-[#0f2744]">Bank Name / اسم البنك: </span>
                  <span>{cleanVal(companySettings.bankName) || '-'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <span className="font-bold text-[#0f2744] font-sans">Account No. / رقم الحساب: </span>
                  <span>{bankAccountVal || '-'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <span className="font-bold text-[#0f2744] font-sans">IBAN / رقم الآيبان: </span>
                  <span>{cleanVal(companySettings.iban) || '-'}</span>
                </div>
              </div>

              {/* Col 2: Prepared By */}
              <div className="p-2 flex flex-col justify-between h-20">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5">
                  Prepared By / أعدها
                </div>
                <div className="text-[9.5px] text-slate-400 border-t border-dashed border-[#cbdde8] pt-1">
                  Sign / Stamp / التوقيع / الختم
                </div>
              </div>

              {/* Col 3: Approved By */}
              <div className="p-2 flex flex-col justify-between h-20">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5">
                  Approved By / اعتمدها
                </div>
                <div className="text-[9.5px] text-slate-400 border-t border-dashed border-[#cbdde8] pt-1">
                  Sign / Stamp / التوقيع / الختم
                </div>
              </div>

              {/* Col 4: Received By */}
              <div className="p-2 flex flex-col justify-between h-20">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5">
                  Received By / استلمها
                </div>
                <div className="text-[9.5px] text-slate-400 border-t border-dashed border-[#cbdde8] pt-1">
                  Sign / Stamp / التوقيع / الختم
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            8. CONTACT FOOTER: Dark Navy, Phone + Email Only
            ======================================================== */}
        {(phoneVal || emailVal) && (
          <div className="bg-[#0f2744] text-white rounded shadow-2xs overflow-hidden relative border border-[#0f2744] mt-1.5">
            {/* Top Accent Stripe */}
            <div className="w-full h-[2px] bg-sky-400" />

            <div className="py-1.5 px-4 flex flex-row items-center justify-between text-[10.5px]">
              {/* Phone / Mobile */}
              {phoneVal ? (
                <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span className="font-bold text-sky-100">Mobile / رقم الجوال:</span>
                  <span className="font-mono text-white">{phoneVal}</span>
                </div>
              ) : <div />}

              {/* Email */}
              {emailVal && (
                <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
                  <Mail className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span className="font-bold text-sky-100">Email / البريد:</span>
                  <span className="text-white">{emailVal}</span>
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
