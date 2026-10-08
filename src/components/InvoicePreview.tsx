import React, { useEffect, useState, useRef } from 'react';
import { Invoice, CompanySettings, Language, InvoiceItem } from '../types/invoice';
import { formatDate, SAUDI_CITIES_AR, numberToWords, toTitleCase } from '../utils/formatters';
import { generateQrCodeDataUrl } from '../utils/zatcaQr';
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';

/**
 * Authentic Boom Truck Crane SVG Watermark representing the master reference's
 * heavy transport & crane equipment watermark, centered and spread across the table area.
 */
const TruckWatermarkSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg
    viewBox="0 0 620 240"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    {/* Ground baseline */}
    <rect x="25" y="214" width="570" height="3" rx="1.5" opacity="0.4" />

    {/* Wheels: 1 front axle, 2 heavy-duty rear tandem axles */}
    <g>
      {/* Front Wheel */}
      <circle cx="110" cy="202" r="23" />
      <circle cx="110" cy="202" r="14" fill="#ffffff" opacity="0.3" />
      <circle cx="110" cy="202" r="6" />

      {/* Rear Wheel 1 */}
      <circle cx="410" cy="202" r="23" />
      <circle cx="410" cy="202" r="14" fill="#ffffff" opacity="0.3" />
      <circle cx="410" cy="202" r="6" />

      {/* Rear Wheel 2 */}
      <circle cx="475" cy="202" r="23" />
      <circle cx="475" cy="202" r="14" fill="#ffffff" opacity="0.3" />
      <circle cx="475" cy="202" r="6" />
    </g>

    {/* Truck Heavy Frame / Chassis */}
    <rect x="65" y="174" width="455" height="18" rx="3" />

    {/* Truck Cabin (Left-facing commercial heavy truck) */}
    <path d="M60 174 L60 138 L72 110 L130 110 L152 138 L152 174 Z" />
    {/* Cabin windshield & window */}
    <path d="M76 134 L84 116 L124 116 L142 134 Z" fill="#ffffff" opacity="0.35" />
    {/* Headlight and front bumper */}
    <rect x="52" y="158" width="10" height="24" rx="2" />
    <rect x="48" y="172" width="18" height="14" rx="2" />
    <circle cx="58" cy="165" r="3.5" fill="#ffffff" opacity="0.4" />
    {/* Vertical exhaust stack */}
    <rect x="148" y="85" width="6" height="55" rx="2" />
    <path d="M148 85 L156 78" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

    {/* Fuel tank & battery box underneath */}
    <rect x="165" y="177" width="55" height="22" rx="3" />
    <rect x="235" y="177" width="65" height="22" rx="3" />
    <rect x="315" y="178" width="70" height="20" rx="3" />

    {/* Front & Rear Outriggers (Hydraulic stabilizer legs) */}
    <rect x="150" y="185" width="14" height="26" rx="2" />
    <rect x="142" y="209" width="30" height="5" rx="1.5" />
    <rect x="515" y="185" width="14" height="26" rx="2" />
    <rect x="507" y="209" width="30" height="5" rx="1.5" />

    {/* Flatbed Deck & Rear Bumper */}
    <rect x="160" y="162" width="370" height="14" rx="2" />
    <rect x="528" y="152" width="8" height="24" rx="2" />

    {/* Crane Turret / Swivel Pedestal */}
    <rect x="175" y="125" width="46" height="38" rx="3" />
    <circle cx="198" cy="120" r="15" />
    <rect x="210" y="112" width="18" height="32" rx="2" />

    {/* Hydraulic Lift Cylinders */}
    <line x1="198" y1="126" x2="285" y2="76" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
    <line x1="280" y1="78" x2="330" y2="52" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />

    {/* Telescopic Boom Assembly (Spanning diagonally upwards across the canvas) */}
    {/* Base boom */}
    <polygon points="190,118 205,110 395,44 386,28" />
    {/* Second boom extension */}
    <polygon points="380,36 392,29 480, -2 470,-12" />
    <circle cx="484" cy="5" r="9" />

    {/* Hoist Cable hanging from boom tip sheave */}
    <line x1="484" y1="14" x2="484" y2="95" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />

    {/* Heavy Crane Block & Hook */}
    <rect x="476" y="95" width="16" height="20" rx="3" />
    <circle cx="484" cy="103" r="3.5" fill="#ffffff" opacity="0.4" />
    <path
      d="M484 115 C484 126 474 130 474 122 C474 118 478 117 480 120 C481 122 483 123 484 121 C485 119 484 115 484 115 Z"
      stroke="currentColor"
      strokeWidth="2.5"
      fill="currentColor"
    />
  </svg>
);

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
  // Dynamic Company Settings from current invoice snapshot or global settings without hardcoded dummy strings
  const companySettings: CompanySettings = {
    ...(globalCompanySettings || {}),
    ...(invoice?.companySnapshot || {}),
  };

  // Safe helper to reject bracketed placeholders or undefined strings
  const cleanVal = (val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return '';
    return trimmed;
  };

  // Dynamic corporate identity values
  const companyNameEn = cleanVal(companySettings.companyName);
  const companyNameAr = cleanVal(companySettings.companyNameAr);
  const businessActivityEn = cleanVal(companySettings.businessActivity || companySettings.businessServiceEn);
  const businessActivityAr = cleanVal(companySettings.businessActivityAr || companySettings.businessServiceAr);

  const vatNo = cleanVal(companySettings.vatNumber);
  const crNo = cleanVal(companySettings.crNumber);
  const primaryPhone = cleanVal(companySettings.phone) || cleanVal(invoice?.customerPhone);
  const secondaryPhone = cleanVal(companySettings.secondaryPhone);
  const phoneVal = [primaryPhone, secondaryPhone].filter(Boolean).join(', ');
  const whatsappVal = cleanVal(companySettings.whatsapp) || primaryPhone;
  const emailVal = cleanVal(companySettings.email);
  const addressVal = cleanVal(companySettings.address);
  const addressArVal = cleanVal(companySettings.addressAr);
  const fullCompanyAddress = [
    addressVal,
    addressArVal && addressArVal !== addressVal ? addressArVal : ''
  ].filter(Boolean).join('  |  ') || addressVal || addressArVal || 'Kingdom of Saudi Arabia';

  const footerCompanyName = companyNameEn || companyNameAr || 'Company Name';
  const footerTagline = cleanVal(
    companySettings.taglineEn ||
    companySettings.businessActivity ||
    companySettings.businessServiceEn ||
    companySettings.taglineAr ||
    companySettings.businessActivityAr
  );
  const footerClosingAr = cleanVal(companySettings.closingNoteAr) || 'شكراً لكم';
  const footerClosingEn = cleanVal(companySettings.closingNoteEn) || 'Thank you for your business';

  const selectedBank =
    companySettings.bankAccounts?.find((b) => b.id === invoice?.selectedBankAccountId) ||
    companySettings.bankAccounts?.find((b) => b.isDefault) ||
    companySettings.bankAccounts?.[0];

  const bankNameVal = cleanVal(selectedBank?.bankName || companySettings.bankName);
  const bankAccountVal = cleanVal(selectedBank?.accountNumber || companySettings.bankAccountNumber);
  const ibanVal = cleanVal(selectedBank?.iban || companySettings.iban);
  const displayIban = ibanVal
    ? (ibanVal.includes(' ') ? ibanVal : ibanVal.replace(/(.{4})/g, '$1 ').trim())
    : '';

  const vatPercentage = invoice?.vatRatePercent ?? (invoice?.vatOption === 'VAT 15%' ? 15 : 0);
  const isVatActive = vatPercentage > 0 && invoice?.vatOption !== 'No VAT';
  const is15Percent = isVatActive;

  // Resolve dynamic line items from current invoice
  const rawItems: InvoiceItem[] = (invoice?.items && invoice.items.length > 0)
    ? invoice.items
    : [
        {
          id: 'item-1',
          serviceName: '',
          description: invoice?.serviceDescription || '',
          unit: invoice?.unit || 'Pcs',
          quantity: Math.max(0, Number(invoice?.quantity) || 1),
          rate: Math.max(0, Number(invoice?.rate) || 0),
          vatRate: is15Percent ? 0.15 : 0,
          vatAmount: Math.max(0, Number(invoice?.vatAmount) || 0),
          subtotal: Math.max(0, Number(invoice?.subtotal) || 0),
          total: Math.max(0, Number(invoice?.total) || 0),
        },
      ];

  // Dynamically calculate subtotal, VAT, and total
  const safeSubtotal = invoice?.subtotal !== undefined
    ? Number(invoice.subtotal)
    : rawItems.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.rate || 0)), 0);

  const safeVatAmount = invoice?.vatAmount !== undefined
    ? Number(invoice.vatAmount)
    : (is15Percent ? Math.round(safeSubtotal * 15) / 100 : 0);

  const safeTotal = invoice?.total !== undefined
    ? Number(invoice.total)
    : (safeSubtotal + safeVatAmount);

  // Dynamic payment tracking
  const paidAmount = invoice?.paidAmount !== undefined
    ? Number(invoice.paidAmount)
    : invoice?.paymentStatus === 'Paid'
    ? safeTotal
    : invoice?.paymentStatus === 'Partially Paid'
    ? Math.round((safeTotal / 2) * 100) / 100
    : 0;

  const amountDue = invoice?.amountDue !== undefined
    ? Number(invoice.amountDue)
    : Math.max(0, Math.round((safeTotal - paidAmount) * 100) / 100);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  // Dynamic ZATCA QR Code generation using actual company settings and invoice data
  useEffect(() => {
    let isMounted = true;
    const sellerName = companyNameEn || companyNameAr || 'Company';
    const vatNumber = vatNo || '300000000000003';
    const invoiceTimestamp = invoice?.invoiceDate ? `${invoice.invoiceDate}T12:00:00Z` : new Date().toISOString();

    generateQrCodeDataUrl(
      sellerName,
      vatNumber,
      invoiceTimestamp,
      safeTotal,
      safeVatAmount
    ).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    }).catch((err) => {
      console.warn('Dynamic QR generation notice:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [
    companyNameEn,
    companyNameAr,
    vatNo,
    invoice?.invoiceDate,
    safeTotal,
    safeVatAmount,
  ]);

  // Proportional A4 preview scaling for smaller viewports
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

  const displayCity =
    invoice?.city === 'Other' && invoice?.customCity ? invoice.customCity : (invoice?.city || '');
  const cityAr = displayCity ? (SAUDI_CITIES_AR[displayCity] || displayCity) : '';

  const clientAddress = cleanVal(invoice?.customerAddress) || (displayCity ? (cityAr ? `${displayCity} (${cityAr})` : displayCity) : '');

  const paymentMethodLabel =
    invoice?.paymentStatus === 'Paid'
      ? 'Cash / نقداً'
      : invoice?.paymentStatus === 'Partially Paid'
      ? 'Partially Paid / مدفوع جزئياً'
      : invoice?.paymentStatus === 'Overdue'
      ? 'Overdue / متأخر'
      : 'Bank Transfer / تحويل بنكي';

  // Inner A4 Sheet Content (100% Dynamic Content with Master Reference Layout)
  const a4SheetContent = (
    <>
      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div className="space-y-2">
          {/* ========================================================
              1. MASTER HEADER: English Left, Arabic Right
              - NO company logo in the header
              - Left side (LTR): English Company Name, Business Activity, VAT No., CR No.
              - Right side (RTL): Arabic Company Name, Arabic Business Activity
              - No Address, Phone, WhatsApp, or Email in header
              - VAT & CR appear only once in the header (styled shape badges)
              - Clean thin navy divider at bottom of header
              ======================================================== */}
          <div className="bg-[#FFFFFF] text-slate-900 rounded-md overflow-hidden relative border border-[#CBDDE8] p-3.5 sm:p-4 shadow-xs">
            {/* Top Corporate Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F2744]" />

            <div className={`${companySettings.logoUrl ? 'grid grid-cols-12 gap-3 items-center' : 'grid grid-cols-2 gap-4 items-start'} pt-1.5`}>
              {/* Left Side: English Company Information (LTR) */}
              <div className={`${companySettings.logoUrl ? 'col-span-5' : ''} text-start space-y-1.5 min-w-0`} dir="ltr">
                {companyNameEn && (
                  <h1
                    className={`font-bold text-[#0F2744] tracking-tight leading-tight break-words ${
                      companyNameEn.length > 35
                        ? 'text-base sm:text-lg'
                        : companyNameEn.length > 22
                        ? 'text-lg sm:text-xl'
                        : 'text-xl sm:text-2xl'
                    }`}
                  >
                    {toTitleCase(companyNameEn)}
                  </h1>
                )}
                {businessActivityEn && (
                  <p className="text-[12px] sm:text-[13px] font-normal text-[#0F2744]/85 tracking-wide leading-tight">
                    {businessActivityEn}
                  </p>
                )}

                {/* Styled Shape Badges for VAT No. and CR No. */}
                {(vatNo || crNo) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    {vatNo && (
                      <div className="inline-flex items-center rounded border border-[#CBDDE8] bg-[#F0F5FA] overflow-hidden shadow-2xs">
                        <span className="bg-[#0F2744] text-[#FFFFFF] text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase">
                          VAT No.
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#0F2744] px-2.5 py-1 tracking-wide">
                          {vatNo}
                        </span>
                      </div>
                    )}
                    {crNo && (
                      <div className="inline-flex items-center rounded border border-[#CBDDE8] bg-[#F0F5FA] overflow-hidden shadow-2xs">
                        <span className="bg-[#08233F] text-[#FFFFFF] text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase">
                          CR No.
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#0F2744] px-2.5 py-1 tracking-wide">
                          {crNo}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Company Logo (Preserving original proportions) */}
              {companySettings.logoUrl && (
                <div className="col-span-2 flex items-center justify-center p-1">
                  <img
                    src={companySettings.logoUrl}
                    alt={companyNameEn || 'Company Logo'}
                    className="max-h-14 max-w-full object-contain"
                  />
                </div>
              )}

              {/* Right Side: Arabic Company Information (RTL) - ONLY Name & Activity */}
              <div className={`${companySettings.logoUrl ? 'col-span-5' : ''} text-end space-y-1.5 min-w-0`} dir="rtl">
                {companyNameAr && (
                  <h2
                    className={`font-bold text-[#0F2744] leading-tight break-words text-end ${
                      companyNameAr.length > 35
                        ? 'text-lg sm:text-xl'
                        : companyNameAr.length > 22
                        ? 'text-xl sm:text-2xl'
                        : 'text-2xl sm:text-[26px]'
                    }`}
                    style={{ direction: 'rtl', textAlign: 'right' }}
                  >
                    {companyNameAr}
                  </h2>
                )}
                {businessActivityAr && (
                  <p
                    className="text-[13px] sm:text-[14px] font-normal text-[#0F2744]/85 leading-tight text-end mt-0.5"
                    style={{ direction: 'rtl', textAlign: 'right' }}
                  >
                    {businessActivityAr}
                  </p>
                )}
              </div>
            </div>

            {/* Clean thin navy divider at the bottom of the header */}
            <div className="w-full h-[1.5px] bg-[#0F2744] mt-3" />
          </div>

          {/* ========================================================
              2. INVOICE TITLE: Master Tax Invoice Title Bar
              Keep this title bar visually separate from the main header
              ======================================================== */}
          <div className="flex justify-center my-1.5">
            <div className="w-full bg-[#0F2744] text-[#FFFFFF] rounded py-2 px-4 text-center shadow-xs">
              <span className="text-sm sm:text-base font-bold tracking-wider">
                Tax Invoice / الفاتورة الضريبية
              </span>
            </div>
          </div>

          {/* ========================================================
              3. TWO-COLUMN DETAILS: Client Details (Left) + Invoice Details (Right)
              ======================================================== */}
          <div className="grid grid-cols-2 gap-2.5 my-1 text-xs">
            {/* Left Column: Client Details */}
            <div className="border border-[#CBDDE8] rounded overflow-hidden bg-[#FFFFFF]">
              <div className="bg-[#F0F5FA] border-b border-[#CBDDE8] px-3.5 py-1.5 font-bold text-[#0F2744] flex justify-between items-center">
                <span>Client Details</span>
                <span dir="rtl">بيانات العميل</span>
              </div>
              <div className="p-3 space-y-2 text-[#0F2744]">
                {/* 1. Client Name */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Client Name / اسم العميل :
                  </span>
                  <span className="font-bold text-[#0F2744] truncate text-end">
                    {invoice?.customerName || '-'}
                  </span>
                </div>
                {/* 2. Mobile */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Mobile / رقم الجوال :
                  </span>
                  <span className="font-mono text-[#0F2744] text-end">
                    {invoice?.customerPhone || '-'}
                  </span>
                </div>
                {/* 3. Address */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Address / العنوان :
                  </span>
                  <span className="text-[#0F2744] truncate text-end">
                    {clientAddress || '-'}
                  </span>
                </div>
                {/* Optional Customer VAT */}
                {invoice?.customerVatNumber && (
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-[#0F2744] whitespace-nowrap">
                      VAT No. / الرقم الضريبي :
                    </span>
                    <span className="font-mono text-[#0F2744] text-end">
                      {invoice.customerVatNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Invoice Details */}
            <div className="border border-[#CBDDE8] rounded overflow-hidden bg-[#FFFFFF]">
              <div className="bg-[#F0F5FA] border-b border-[#CBDDE8] px-3.5 py-1.5 font-bold text-[#0F2744] flex justify-between items-center">
                <span>Invoice Details</span>
                <span dir="rtl">بيانات الفاتورة</span>
              </div>
              <div className="p-3 space-y-2 text-[#0F2744]">
                {/* Invoice Number */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Invoice No. / رقم الفاتورة :
                  </span>
                  <span className="font-mono font-bold text-[#0F2744] text-end">
                    {invoice?.invoiceNumber || '-'}
                  </span>
                </div>
                {/* Date */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Date / تاريخ الفاتورة :
                  </span>
                  <span className="font-mono text-[#0F2744] text-end">
                    {invoice?.invoiceDate ? formatDate(invoice.invoiceDate) : '-'}
                  </span>
                </div>
                {/* Due Date */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Due Date / تاريخ الاستحقاق :
                  </span>
                  <span className="font-mono text-[#0F2744] text-end">
                    {invoice?.dueDate ? formatDate(invoice.dueDate) : (invoice?.invoiceDate ? formatDate(invoice.invoiceDate) : '-')}
                  </span>
                </div>
                {/* Payment Method */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Payment Method / طريقة الدفع :
                  </span>
                  <span className="font-semibold text-[#0F2744] text-end">
                    {paymentMethodLabel}
                  </span>
                </div>
                {/* Job Location */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0F2744] whitespace-nowrap">
                    Job Location / موقع العمل :
                  </span>
                  <span className="text-[#0F2744] truncate text-end">
                    {invoice?.jobLocation || displayCity || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. FULLY DYNAMIC ITEMS / SERVICES TABLE (Clean & Crisp)
              - Crisp white background with sharp borders
              - Dynamic column headers: Quantity / Days / Duration / Hours / Custom
              - High readability and print clarity
              ======================================================== */}
          {(() => {
            // Dynamic Quantity / Days / Duration & Rate Column Headers
            const qtyColumnInfo = (() => {
              if (invoice?.quantityColumnType === 'days') {
                return {
                  qtyEn: invoice.customQuantityHeaderEn?.trim() || 'Days / Period',
                  qtyAr: invoice.customQuantityHeaderAr?.trim() || 'الأيام / المدة',
                  rateEn: invoice.customRateHeaderEn?.trim() || 'Daily Rate',
                  rateAr: invoice.customRateHeaderAr?.trim() || 'سعر اليوم',
                };
              }
              if (invoice?.quantityColumnType === 'hours') {
                return {
                  qtyEn: invoice.customQuantityHeaderEn?.trim() || 'Hours',
                  qtyAr: invoice.customQuantityHeaderAr?.trim() || 'الساعات',
                  rateEn: invoice.customRateHeaderEn?.trim() || 'Hourly Rate',
                  rateAr: invoice.customRateHeaderAr?.trim() || 'سعر الساعة',
                };
              }
              if (invoice?.quantityColumnType === 'trips') {
                return {
                  qtyEn: invoice.customQuantityHeaderEn?.trim() || 'Trips',
                  qtyAr: invoice.customQuantityHeaderAr?.trim() || 'المشاوير',
                  rateEn: invoice.customRateHeaderEn?.trim() || 'Trip Rate',
                  rateAr: invoice.customRateHeaderAr?.trim() || 'سعر المشوار',
                };
              }
              if (invoice?.quantityColumnType === 'period') {
                return {
                  qtyEn: invoice.customQuantityHeaderEn?.trim() || 'Duration / Days',
                  qtyAr: invoice.customQuantityHeaderAr?.trim() || 'المدة / الأيام',
                  rateEn: invoice.customRateHeaderEn?.trim() || 'Rate',
                  rateAr: invoice.customRateHeaderAr?.trim() || 'سعر الوحدة',
                };
              }
              if (invoice?.quantityColumnType === 'custom' && (invoice?.customQuantityHeaderEn || invoice?.customQuantityHeaderAr)) {
                return {
                  qtyEn: invoice.customQuantityHeaderEn?.trim() || 'Quantity',
                  qtyAr: invoice.customQuantityHeaderAr?.trim() || 'الكمية',
                  rateEn: invoice.customRateHeaderEn?.trim() || 'Rate',
                  rateAr: invoice.customRateHeaderAr?.trim() || 'سعر الوحدة',
                };
              }

              // Smart auto-detection based on line items' units
              const hasDays = rawItems.some((it) => {
                const u = (it.unit || '').toLowerCase().trim();
                return u === 'day' || u === 'days' || u.includes('يوم') || u.includes('أيام') || u.includes('ايام');
              });
              const hasHours = rawItems.some((it) => {
                const u = (it.unit || '').toLowerCase().trim();
                return u === 'hour' || u === 'hours' || u.includes('ساعة') || u.includes('ساعات');
              });
              const hasTrips = rawItems.some((it) => {
                const u = (it.unit || '').toLowerCase().trim();
                return u === 'trip' || u === 'trips' || u.includes('مشوار') || u.includes('مشاوير') || u.includes('رحلة');
              });

              if (hasDays && !hasHours && !hasTrips) {
                return {
                  qtyEn: 'Days / Qty',
                  qtyAr: 'الأيام / الكمية',
                  rateEn: 'Daily Rate',
                  rateAr: 'سعر اليوم',
                };
              }
              if (hasHours && !hasDays) {
                return {
                  qtyEn: 'Hours / Qty',
                  qtyAr: 'الساعات / الكمية',
                  rateEn: 'Hourly Rate',
                  rateAr: 'سعر الساعة',
                };
              }
              if (hasTrips && !hasDays) {
                return {
                  qtyEn: 'Trips / Qty',
                  qtyAr: 'المشاوير / الكمية',
                  rateEn: 'Trip Rate',
                  rateAr: 'سعر المشوار',
                };
              }

              return {
                qtyEn: 'Quantity',
                qtyAr: 'الكمية',
                rateEn: 'Rate',
                rateAr: 'سعر الوحدة',
              };
            })();

            return (
              <div className="my-2 overflow-hidden rounded border border-[#CBDDE8] bg-[#FFFFFF] shadow-2xs">
                <table className="relative z-10 w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-[#0F2744] text-[#FFFFFF] font-bold border-b border-[#0F2744]">
                      <th className="py-2.5 px-1.5 border-r border-[#CBDDE8]/30 w-9 text-center">#</th>
                      <th className="py-2.5 px-3 border-r border-[#CBDDE8]/30 text-start w-2/5">
                        <div>Description</div>
                        <div className="text-[10px] text-white/80 font-normal">الوصف</div>
                      </th>
                      <th className="py-2.5 px-2 border-r border-[#CBDDE8]/30 w-20">
                        <div>{qtyColumnInfo.qtyEn}</div>
                        <div className="text-[10px] text-white/80 font-normal">{qtyColumnInfo.qtyAr}</div>
                      </th>
                      <th className="py-2.5 px-2 border-r border-[#CBDDE8]/30 w-20">
                        <div>{qtyColumnInfo.rateEn}</div>
                        <div className="text-[10px] text-white/80 font-normal">{qtyColumnInfo.rateAr}</div>
                      </th>
                      <th className="py-2.5 px-2 border-r border-[#CBDDE8]/30 w-20">
                        <div>{isVatActive ? `VAT ${vatPercentage}%` : 'VAT'}</div>
                        <div className="text-[10px] text-white/80 font-normal">ضريبة القيمة المضافة</div>
                      </th>
                      <th className="py-2.5 px-2.5 border-r border-[#CBDDE8]/30 w-24">
                        <div>Subtotal</div>
                        <div className="text-[10px] text-white/80 font-normal">المجموع الفرعي</div>
                      </th>
                      <th className="py-2.5 px-2.5 w-24">
                        <div>Total Amount</div>
                        <div className="text-[10px] text-white/80 font-normal">إجمالي المبلغ</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBDDE8]">
                    {/* Dynamic Line Items with clean white background */}
                    {rawItems.map((item, idx) => {
                      const itemQty = Math.max(0, Number(item.quantity) || 0);
                      const itemRate = Math.max(0, Number(item.rate) || 0);
                      const itemSubtotal = item.subtotal !== undefined
                        ? Number(item.subtotal)
                        : Math.round(itemQty * itemRate * 100) / 100;
                      const itemVat = item.vatAmount !== undefined
                        ? Number(item.vatAmount)
                        : (is15Percent ? Math.round(itemSubtotal * 15) / 100 : 0);
                      const itemTotal = item.total !== undefined
                        ? Number(item.total)
                        : (itemSubtotal + itemVat);

                      return (
                        <tr key={item.id || idx} className="bg-[#FFFFFF] font-normal text-[#0F2744] hover:bg-[#F0F5FA]/50">
                          <td className="py-2.5 px-1.5 border-r border-[#CBDDE8] font-bold font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-[#CBDDE8] text-start">
                            {item.serviceName && (
                              <div className="font-bold text-[#0F2744] leading-tight">
                                {item.serviceName}
                              </div>
                            )}
                            {item.description ? (
                              <div className="text-[10.5px] text-[#0F2744] leading-tight opacity-90 mt-0.5">
                                {item.description}
                              </div>
                            ) : !item.serviceName ? (
                              <span className="text-slate-400">-</span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#CBDDE8] font-mono">
                            <div className="font-bold text-[#0F2744] text-[11.5px]">{itemQty}</div>
                            {item.unit && (
                              <div className="text-[9px] text-[#0F2744]/75 font-sans font-semibold tracking-tight">
                                {item.unit}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#CBDDE8] font-mono">
                            {itemRate.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 border-r border-[#CBDDE8] font-mono">
                            {itemVat.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2.5 border-r border-[#CBDDE8] font-mono">
                            {itemSubtotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono font-bold text-[#0F2744]">
                            {itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty Rows to replicate master reference spacing and proportions */}
                    {rawItems.length < 4 &&
                      Array.from({ length: 4 - rawItems.length }).map((_, rIdx) => (
                        <tr key={`empty-${rIdx}`} className="h-8 bg-[#FFFFFF]">
                          <td className="py-1 px-1.5 border-r border-[#CBDDE8] font-mono text-slate-300"></td>
                          <td className="py-1 px-3 border-r border-[#CBDDE8]"></td>
                          <td className="py-1 px-2 border-r border-[#CBDDE8]"></td>
                          <td className="py-1 px-2 border-r border-[#CBDDE8]"></td>
                          <td className="py-1 px-2 border-r border-[#CBDDE8]"></td>
                          <td className="py-1 px-2.5 border-r border-[#CBDDE8]"></td>
                          <td className="py-1 px-2.5"></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* ========================================================
              5. QR CODE + TOTALS SECTION
              ======================================================== */}
          <div className="flex flex-row justify-between items-center gap-4 py-1.5">
            {/* Left: Clean Bordered ZATCA QR Code */}
            <div className="p-2 border border-[#CBDDE8] rounded bg-[#FFFFFF] shrink-0 shadow-2xs">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="ZATCA QR Code"
                  className="w-28 h-28 object-contain"
                />
              ) : (
                <div className="w-28 h-28 bg-[#F0F5FA] flex items-center justify-center text-xs text-[#0F2744]/40 font-bold">
                  QR CODE
                </div>
              )}
            </div>

            {/* Right: Dynamic Totals Box */}
            <div className="flex-1 max-w-md border border-[#CBDDE8] rounded overflow-hidden text-xs bg-[#FFFFFF]">
              {/* Subtotal */}
              <div className="flex justify-between items-center px-3.5 py-1.5 border-b border-[#CBDDE8]">
                <span className="font-bold text-[#0F2744]">
                  Subtotal / المجموع الفرعي
                </span>
                <span className="font-mono font-bold text-[#0F2744] tabular-nums">
                  {safeSubtotal.toFixed(2)} ر.س
                </span>
              </div>

              {/* VAT */}
              <div className="flex justify-between items-center px-3.5 py-1.5 border-b border-[#CBDDE8]">
                <span className="font-bold text-[#0F2744]">
                  {isVatActive ? `VAT ${vatPercentage}% / ضريبة القيمة المضافة` : 'VAT / ضريبة القيمة المضافة'}
                </span>
                <span className="font-mono font-bold text-[#0F2744] tabular-nums">
                  (+) {safeVatAmount.toFixed(2)} ر.س
                </span>
              </div>

              {/* Total Amount (Prominent Bold 700 with Light Blue Section Background #F0F5FA) */}
              <div className="flex justify-between items-center px-3.5 py-2 border-b border-[#CBDDE8] bg-[#F0F5FA]">
                <span className="font-bold text-[#0F2744] text-[13px]">
                  Total Amount / إجمالي المبلغ
                </span>
                <span className="font-mono font-bold text-[#0F2744] tabular-nums text-sm">
                  {safeTotal.toFixed(2)} ر.س
                </span>
              </div>

              {/* Paid Amount */}
              <div className="flex justify-between items-center px-3.5 py-1.5 border-b border-[#CBDDE8]/60">
                <span className="font-bold text-[#0F2744]/90">
                  Paid Amount / المبلغ المدفوع
                </span>
                <span className="font-mono font-bold text-[#0F2744] tabular-nums">
                  {paidAmount.toFixed(2)} ر.س
                </span>
              </div>

              {/* Amount Due */}
              <div className="flex justify-between items-center px-3.5 py-1.5 bg-[#FFFFFF]">
                <span className="font-bold text-[#0F2744]/90">
                  Amount Due / المبلغ المستحق
                </span>
                <span className="font-mono font-bold text-[#0F2744] tabular-nums">
                  {amountDue.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              6. AMOUNT IN WORDS SECTION
              ======================================================== */}
          <div className="bg-[#F0F5FA] border border-[#CBDDE8] rounded px-3.5 py-2 text-xs text-[#0F2744] flex flex-row items-center justify-between gap-2 my-1.5 min-h-[34px]">
            <span className="font-bold text-[#0F2744] whitespace-nowrap text-[11px]">
              Amount in Words / المبلغ بالكلمات :
            </span>
            <span className="font-normal text-[#0F2744] italic text-end text-[11px]">
              {numberToWords(safeTotal, lang)}
            </span>
          </div>

          {/* ========================================================
              7. LOWER SECTION: Bank Details (Left) & Authorizations (Right)
              ======================================================== */}
          <div className="grid grid-cols-12 gap-2.5 my-1.5 text-xs">
            {/* Left Panel: Bank Details (Prominent Shape Badges matching CR & VAT) */}
            <div className="col-span-6 border border-[#CBDDE8] rounded overflow-hidden bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
              <div className="bg-[#F0F5FA] border-b border-[#CBDDE8] px-3.5 py-1.5 font-bold text-[#0F2744] flex justify-between items-center text-xs">
                <span>Bank Details</span>
                <span dir="rtl">بيانات الحساب البنكي</span>
              </div>

              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-around">
                {/* 1. Bank Name Shape Badge */}
                <div className="flex items-stretch rounded border border-[#CBDDE8] bg-[#F0F5FA] overflow-hidden shadow-xs">
                  <span className="bg-[#0F2744] text-[#FFFFFF] text-[9px] font-bold px-2.5 py-1 flex items-center shrink-0 uppercase tracking-wide">
                    Bank / البنك
                  </span>
                  <span className="text-[10.5px] font-bold text-[#0F2744] px-2.5 py-1 flex items-center flex-1 break-words">
                    {bankNameVal || '-'}
                  </span>
                </div>

                {/* 2. Account Number Shape Badge */}
                <div className="flex items-stretch rounded border border-[#CBDDE8] bg-[#F0F5FA] overflow-hidden shadow-xs">
                  <span className="bg-[#0F2744] text-[#FFFFFF] text-[9px] font-bold px-2.5 py-1 flex items-center shrink-0 uppercase tracking-wide">
                    Account / الحساب
                  </span>
                  <span className="font-mono text-[10.5px] font-bold text-[#0F2744] px-2.5 py-1 flex items-center flex-1 tracking-wider">
                    {bankAccountVal || '-'}
                  </span>
                </div>

                {/* 3. IBAN Shape Badge */}
                <div className="flex items-stretch rounded border border-[#CBDDE8] bg-[#F0F5FA] overflow-hidden shadow-xs">
                  <span className="bg-[#08233F] text-[#FFFFFF] text-[9px] font-bold px-2.5 py-1 flex items-center shrink-0 uppercase tracking-wide">
                    IBAN / الآيبان
                  </span>
                  <span className="font-mono text-[10.5px] font-black text-[#0F2744] px-2.5 py-1 flex items-center flex-1 tracking-wider select-all">
                    {displayIban || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel: Signatures & Authorizations (3 Equal Boxes) */}
            <div className="col-span-6 border border-[#CBDDE8] rounded overflow-hidden bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
              <div className="bg-[#F0F5FA] border-b border-[#CBDDE8] px-3.5 py-1.5 font-bold text-[#0F2744] flex justify-between items-center text-xs">
                <span>Authorizations & Signatures</span>
                <span dir="rtl">الاعتماد والتوقيع</span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[#CBDDE8] flex-1 text-center">
                {/* 1. Prepared By */}
                <div className="p-2 flex flex-col justify-between min-h-[86px]">
                  <div className="font-bold text-[#0F2744] text-[9.5px] pb-0.5">
                    <div>Prepared By</div>
                    <div className="text-[9px]" dir="rtl">أعدها</div>
                  </div>
                  <div className="text-[8.5px] text-[#0F2744]/50 border-t border-dashed border-[#CBDDE8] pt-1">
                    Sign / Stamp / الختم
                  </div>
                </div>

                {/* 2. Approved By */}
                <div className="p-2 flex flex-col justify-between min-h-[86px]">
                  <div className="font-bold text-[#0F2744] text-[9.5px] pb-0.5">
                    <div>Approved By</div>
                    <div className="text-[9px]" dir="rtl">اعتمدها</div>
                  </div>
                  <div className="text-[8.5px] text-[#0F2744]/50 border-t border-dashed border-[#CBDDE8] pt-1">
                    Sign / Stamp / الختم
                  </div>
                </div>

                {/* 3. Received By */}
                <div className="p-2 flex flex-col justify-between min-h-[86px]">
                  <div className="font-bold text-[#0F2744] text-[9.5px] pb-0.5">
                    <div>Received By</div>
                    <div className="text-[9px]" dir="rtl">استلمها</div>
                  </div>
                  <div className="text-[8.5px] text-[#0F2744]/50 border-t border-dashed border-[#CBDDE8] pt-1">
                    Sign / Stamp / الختم
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              8. MASTER REUSABLE LIGHT/NEUTRAL INVOICE FOOTER
              - Master Visual Reference: Clean corporate light/neutral footer
              - Solid clean navy divider line on top matching header (4px bg-[#0F2744])
              - High-clarity, professional icons for Phone, WhatsApp, Email, and Location
              - 3 rows: Contact Info, Address Line, Centered Closing Note
              - Solid clean navy divider line on bottom matching header (4px bg-[#0F2744])
              ======================================================== */}
          <div className="bg-[#FFFFFF] text-[#0F2744] rounded-md shadow-xs overflow-hidden border border-[#CBDDE8] mt-3">
            {/* Top Solid Navy Divider Line matching the exact header top bar (#0F2744) */}
            <div className="w-full h-1 bg-[#0F2744]" />

          {/* ROW 1 — CONTACT INFORMATION (3 Balanced Sections) */}
          <div className="grid grid-cols-3 divide-x divide-[#CBDDE8] bg-[#F0F5FA] border-b border-[#CBDDE8] py-2 px-2.5 text-[10px]">
            {/* 1. Phone / الهاتف */}
            <div className="px-2 flex items-center justify-center gap-2 min-w-0" dir="ltr">
              <span className="w-6 h-6 rounded-full bg-[#0F2744] text-white flex items-center justify-center shrink-0 shadow-xs">
                {/* Clean Professional Solid Phone Icon */}
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.29 21 3 13.71 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
                </svg>
              </span>
              <div className="min-w-0 text-left">
                <div className="text-[7.5px] font-extrabold text-[#0F2744] uppercase tracking-wider leading-none">
                  Phone / الهاتف
                </div>
                <div className="font-mono text-[10.5px] font-extrabold text-[#0F2744] tracking-tight leading-tight truncate mt-0.5">
                  {phoneVal || '-'}
                </div>
              </div>
            </div>

            {/* 2. WhatsApp / واتساب */}
            <div className="px-2 flex items-center justify-center gap-2 min-w-0" dir="ltr">
              <span className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                {/* Official Clean WhatsApp Silhouette Icon */}
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.79 14.07c-.24.68-1.2 1.26-1.68 1.32-.45.06-1.02.1-3.29-.84-2.73-1.13-4.52-3.89-4.66-4.07-.13-.19-1.12-1.49-1.12-2.84 0-1.35.71-2.01.96-2.28.25-.26.54-.33.72-.33.18 0 .37 0 .53.01.17.01.4.06.61.57.22.53.75 1.83.82 1.96.07.14.11.3.02.48-.09.18-.14.29-.27.45-.14.16-.29.35-.41.47-.14.13-.28.28-.12.56.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.59-.07.16-.18.69-.8 87-1.07.18-.27.37-.22.61-.13.25.09 1.57.74 1.84.87.27.13.45.2.52.31.06.11.06.66-.18 1.34z" />
                </svg>
              </span>
              <div className="min-w-0 text-left">
                <div className="text-[7.5px] font-extrabold text-[#0F2744] uppercase tracking-wider leading-none">
                  WhatsApp / واتساب
                </div>
                <div className="font-mono text-[10.5px] font-extrabold text-[#0F2744] tracking-tight leading-tight truncate mt-0.5">
                  {whatsappVal || phoneVal || '-'}
                </div>
              </div>
            </div>

            {/* 3. Email / البريد الإلكتروني */}
            <div className="px-2 flex items-center justify-center gap-2 min-w-0" dir="ltr">
              <span className="w-6 h-6 rounded-full bg-[#0F2744] text-white flex items-center justify-center shrink-0 shadow-xs">
                {/* Clean Professional Mail / Envelope Icon */}
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </span>
              <div className="min-w-0 text-left">
                <div className="text-[7.5px] font-extrabold text-[#0F2744] uppercase tracking-wider leading-none">
                  Email / البريد الإلكتروني
                </div>
                <div className="text-[9.5px] font-extrabold text-[#0F2744] truncate max-w-[190px] leading-tight mt-0.5">
                  {emailVal || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2 — ADDRESS (Complete Address in One Clean Horizontal Line) */}
          <div className="py-1.5 px-3 sm:px-4 flex items-center justify-center gap-2 text-[#0F2744] bg-[#FFFFFF] border-b border-[#CBDDE8]">
            <span className="w-5 h-5 rounded-full bg-[#0F2744] text-white flex items-center justify-center shrink-0 shadow-xs">
              {/* Clean Professional Solid Location Pin */}
              <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </span>
            <span className="text-[8.5px] font-extrabold text-[#0F2744] shrink-0 uppercase tracking-wide">
              Address / العنوان:
            </span>
            <span className="text-[9.5px] font-bold text-[#0F2744] truncate">
              {fullCompanyAddress}
            </span>
          </div>

          {/* ROW 3 — THANK YOU (Prominent, High-Contrast & Centered) */}
          <div className="py-2 px-3 sm:px-4 flex flex-col items-center justify-center text-center bg-[#F8FAFC]">
            <div
              className="font-bold text-[#0F2744] text-[13px] sm:text-[13.5px] leading-tight tracking-wide"
              dir="rtl"
              style={{ fontFamily: 'Arial, "Arial Arabic", "Noto Sans Arabic", sans-serif' }}
            >
              {footerClosingAr}
            </div>
            <div
              dir="ltr"
              className="text-[10px] font-bold text-[#0F2744] uppercase tracking-widest leading-tight mt-0.5"
            >
              {footerClosingEn}
            </div>
          </div>

          {/* Bottom Solid Navy Accent Bar matching the header top bar */}
          <div className="w-full h-1 bg-[#0F2744]" />
        </div>
      </div>
      </div>
    </>
  );

  // If rendering inside hidden print container, render directly without wrapper or scale
  if (isPrintOnly) {
    return (
      <div
        id={`invoice-preview-sheet-${invoice?.id || 'temp'}`}
        data-invoice-sheet="true"
        className="invoice-sheet print-sheet print-only bg-white text-slate-900 mx-auto select-text relative flex flex-col overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{
          fontFamily: 'Arial, "Arial Arabic", "Noto Sans Arabic", sans-serif',
          width: '794px',
          minWidth: '794px',
          maxWidth: '794px',
          height: '1123px',
          minHeight: '1123px',
          maxHeight: '1123px',
          boxSizing: 'border-box',
          padding: '20px 28px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          pageBreakAfter: 'avoid',
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
        id={`invoice-preview-sheet-${invoice?.id || 'temp'}`}
        data-invoice-sheet="true"
        className="invoice-sheet bg-white text-slate-900 border border-slate-300 shadow-md rounded-lg p-5 w-[794px] min-h-[1123px] shrink-0 leading-normal select-text relative flex flex-col overflow-hidden"
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

