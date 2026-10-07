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
  const primaryPhone = cleanVal(companySettings.phone);
  const secondaryPhone = cleanVal(companySettings.secondaryPhone);
  const phoneVal = [primaryPhone, secondaryPhone].filter(Boolean).join(', ');
  const whatsappVal = cleanVal(companySettings.whatsapp);
  const emailVal = cleanVal(companySettings.email);
  const addressVal = cleanVal(companySettings.address);
  const addressArVal = cleanVal(companySettings.addressAr);
  const bankNameVal = cleanVal(companySettings.bankName);
  const bankAccountVal = cleanVal(companySettings.bankAccountNumber);
  const ibanVal = cleanVal(companySettings.iban);

  const is15Percent = invoice?.vatOption === 'VAT 15%';

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
      <div className="relative z-10 flex flex-col justify-between flex-1 min-h-[1050px]">
        <div className="space-y-2.5">
          {/* ========================================================
              1. MASTER HEADER: English Left, Logo Centered, Arabic Right
              - Company Address REMOVED from English header
              - Arabic side keeps ONLY: Arabic Company Name & Arabic Business Activity
              - Arabic VAT, CR, Address removed from right side
              - VAT & CR remain only once in the compact English/company info area
              ======================================================== */}
          <div className="bg-white text-slate-900 rounded-md overflow-hidden relative border border-[#cbdde8] p-3 sm:p-4">
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Left Column: English Company Information (LTR) */}
              <div className="col-span-5 text-start space-y-1 min-w-0" dir="ltr">
                {companyNameEn && (
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
                )}
                {businessActivityEn && (
                  <p className="text-[10px] font-bold text-[#1e4976] tracking-wide leading-tight">
                    {businessActivityEn}
                  </p>
                )}
                {vatNo && (
                  <div className="text-[10.5px] text-slate-800 leading-tight">
                    <span className="font-bold text-[#0f2744]">VAT: </span>
                    <span className="font-mono">{vatNo}</span>
                  </div>
                )}
                {crNo && (
                  <div className="text-[10.5px] text-slate-800 leading-tight">
                    <span className="font-bold text-[#0f2744]">CR: </span>
                    <span className="font-mono">{crNo}</span>
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
                  <div className="w-16 h-14" />
                )}
              </div>

              {/* Right Column: Arabic Company Information (RTL) - ONLY Name & Activity */}
              <div className="col-span-5 text-end space-y-1 min-w-0" dir="rtl">
                {companyNameAr && (
                  <h2
                    className={`font-bold text-[#0f2744] leading-tight break-words text-end ${
                      companyNameAr.length > 35
                        ? 'text-sm'
                        : companyNameAr.length > 22
                        ? 'text-base'
                        : 'text-lg'
                    }`}
                    style={{ direction: 'rtl', textAlign: 'right' }}
                  >
                    {companyNameAr}
                  </h2>
                )}
                {businessActivityAr && (
                  <div
                    className="text-[11px] font-bold text-[#1e4976] leading-tight text-end"
                    style={{ direction: 'rtl', textAlign: 'right' }}
                  >
                    {businessActivityAr}
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
          <div className="flex justify-center my-2">
            <div className="w-full bg-[#0f2744] text-white rounded py-2 px-4 text-center shadow-xs">
              <span className="text-base font-bold tracking-wider">
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
              <div className="bg-[#f0f5fa] border-b border-[#cbdde8] px-3 py-1.5 font-bold text-[#0f2744] flex justify-between items-center">
                <span>Client Details</span>
                <span dir="rtl">بيانات العميل</span>
              </div>
              <div className="p-3 space-y-2 text-slate-800">
                {/* 1. Client Name */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Client Name / اسم العميل :
                  </span>
                  <span className="font-bold text-slate-900 truncate text-end">
                    {invoice?.customerName || '-'}
                  </span>
                </div>
                {/* 2. Mobile */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Mobile / رقم الجوال :
                  </span>
                  <span className="font-mono text-slate-900 text-end">
                    {invoice?.customerPhone || '-'}
                  </span>
                </div>
                {/* 3. Address */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Address / العنوان :
                  </span>
                  <span className="text-slate-800 truncate text-end">
                    {clientAddress || '-'}
                  </span>
                </div>
                {/* Optional Customer VAT */}
                {invoice?.customerVatNumber && (
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
              <div className="bg-[#f0f5fa] border-b border-[#cbdde8] px-3 py-1.5 font-bold text-[#0f2744] flex justify-between items-center">
                <span>Invoice Details</span>
                <span dir="rtl">بيانات الفاتورة</span>
              </div>
              <div className="p-3 space-y-2 text-slate-800">
                {/* Invoice Number */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Invoice No. / رقم الفاتورة :
                  </span>
                  <span className="font-mono font-bold text-[#0f2744] text-end">
                    {invoice?.invoiceNumber || '-'}
                  </span>
                </div>
                {/* Date */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Date / تاريخ الفاتورة :
                  </span>
                  <span className="font-mono text-slate-900 text-end">
                    {invoice?.invoiceDate ? formatDate(invoice.invoiceDate) : '-'}
                  </span>
                </div>
                {/* Due Date */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Due Date / تاريخ الاستحقاق :
                  </span>
                  <span className="font-mono text-slate-900 text-end">
                    {invoice?.dueDate ? formatDate(invoice.dueDate) : (invoice?.invoiceDate ? formatDate(invoice.invoiceDate) : '-')}
                  </span>
                </div>
                {/* Payment Method */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Payment Method / طريقة الدفع :
                  </span>
                  <span className="font-semibold text-slate-900 text-end">
                    {paymentMethodLabel}
                  </span>
                </div>
                {/* Job Location */}
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[#0f2744] whitespace-nowrap">
                    Job Location / موقع العمل :
                  </span>
                  <span className="text-slate-800 truncate text-end">
                    {invoice?.jobLocation || displayCity || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. FULLY DYNAMIC ITEMS / SERVICES TABLE (Clean & Crisp)
              - Crisp white background with sharp borders
              - No watermark behind table
              - High readability and print clarity
              ======================================================== */}
          <div className="my-2.5 overflow-hidden rounded border border-[#cbdde8] bg-white shadow-2xs">
            <table className="relative z-10 w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-[#0f2744] text-white font-bold border-b border-[#0f2744]">
                  <th className="py-2.5 px-1.5 border-r border-[#1e4976] w-9 text-center">#</th>
                  <th className="py-2.5 px-3 border-r border-[#1e4976] text-start w-2/5">
                    <div>Description</div>
                    <div className="text-[10px] text-sky-200 font-normal">الوصف</div>
                  </th>
                  <th className="py-2.5 px-2 border-r border-[#1e4976] w-16">
                    <div>Quantity</div>
                    <div className="text-[10px] text-sky-200 font-normal">الكمية</div>
                  </th>
                  <th className="py-2.5 px-2 border-r border-[#1e4976] w-20">
                    <div>Rate</div>
                    <div className="text-[10px] text-sky-200 font-normal">سعر الوحدة</div>
                  </th>
                  <th className="py-2.5 px-2 border-r border-[#1e4976] w-20">
                    <div>VAT 15%</div>
                    <div className="text-[10px] text-sky-200 font-normal">ضريبة القيمة المضافة</div>
                  </th>
                  <th className="py-2.5 px-2.5 border-r border-[#1e4976] w-24">
                    <div>Subtotal</div>
                    <div className="text-[10px] text-sky-200 font-normal">المجموع الفرعي</div>
                  </th>
                  <th className="py-2.5 px-2.5 w-24">
                    <div>Total Amount</div>
                    <div className="text-[10px] text-sky-200 font-normal">إجمالي المبلغ</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbdde8]">
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
                    <tr key={item.id || idx} className="bg-white font-normal text-slate-900 hover:bg-[#f8fafc]">
                      <td className="py-2.5 px-1.5 border-r border-[#cbdde8] font-bold font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#cbdde8] text-start">
                        {item.serviceName && (
                          <div className="font-bold text-slate-900 leading-tight">
                            {item.serviceName}
                          </div>
                        )}
                        {item.description ? (
                          <div className="text-[10.5px] text-slate-700 leading-tight">
                            {item.description}
                          </div>
                        ) : !item.serviceName ? (
                          <span className="text-slate-400">-</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 px-2 border-r border-[#cbdde8] font-mono">
                        {itemQty} {item.unit || ''}
                      </td>
                      <td className="py-2.5 px-2 border-r border-[#cbdde8] font-mono">
                        {itemRate.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 border-r border-[#cbdde8] font-mono">
                        {itemVat.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-[#cbdde8] font-mono">
                        {itemSubtotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono font-bold text-[#0f2744]">
                        {itemTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}

                {/* Empty Rows to replicate master reference spacing and proportions */}
                {rawItems.length < 5 &&
                  Array.from({ length: 5 - rawItems.length }).map((_, rIdx) => (
                    <tr key={`empty-${rIdx}`} className="h-7 bg-white">
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
          <div className="flex flex-row justify-between items-center gap-4 py-2">
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

            {/* Right: Dynamic Totals Box */}
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

              {/* VAT */}
              <div className="flex justify-between items-center px-3 py-1.5 border-b border-[#cbdde8]">
                <span className="font-bold text-slate-800">
                  {is15Percent ? 'VAT 15% / ضريبة القيمة المضافة' : 'VAT / ضريبة القيمة المضافة'}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  (+) {safeVatAmount.toFixed(2)} ر.س
                </span>
              </div>

              {/* Total Amount (Prominent Bold 700) */}
              <div className="flex justify-between items-center px-3 py-2 border-b border-[#cbdde8] bg-[#f0f5fa]">
                <span className="font-bold text-[#0f2744] text-sm">
                  Total Amount / إجمالي المبلغ
                </span>
                <span className="font-mono font-bold text-[#0f2744] tabular-nums text-base">
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
          <div className="bg-[#f0f5fa] border border-[#cbdde8] rounded px-3.5 py-2 text-xs text-slate-900 flex flex-row items-center justify-between gap-2 my-1.5">
            <span className="font-bold text-[#0f2744] whitespace-nowrap">
              Amount in Words / المبلغ بالكلمات :
            </span>
            <span className="font-normal text-slate-800 italic text-end">
              {numberToWords(safeTotal, lang)}
            </span>
          </div>

          {/* ========================================================
              7. LOWER SECTION: Bank Details & 3 Signatures
              ======================================================== */}
          <div className="border border-[#cbdde8] rounded text-[11px] text-slate-800 my-2 overflow-hidden bg-white">
            {/* 4 Equal Columns: Bank Details | Prepared By | Approved By | Received By */}
            <div className="grid grid-cols-4 divide-x divide-[#cbdde8] text-center">
              {/* Col 1: Bank Details */}
              <div className="text-start p-2.5 space-y-1 bg-[#f0f5fa]/40">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5 mb-1 text-center">
                  Bank Details / بيانات البنك
                </div>
                <div className="text-[10px] text-slate-700">
                  <span className="font-bold text-[#0f2744]">Bank Name / اسم البنك: </span>
                  <span>{bankNameVal || '-'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <span className="font-bold text-[#0f2744] font-sans">Account No. / رقم الحساب: </span>
                  <span>{bankAccountVal || '-'}</span>
                </div>
                <div className="text-[10px] text-slate-700 font-mono">
                  <span className="font-bold text-[#0f2744] font-sans">IBAN / رقم الآيبان: </span>
                  <span>{ibanVal || '-'}</span>
                </div>
              </div>

              {/* Col 2: Prepared By */}
              <div className="p-2.5 flex flex-col justify-between h-22">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5">
                  Prepared By / أعدها
                </div>
                <div className="text-[9.5px] text-slate-400 border-t border-dashed border-[#cbdde8] pt-1">
                  Sign / Stamp / التوقيع / الختم
                </div>
              </div>

              {/* Col 3: Approved By */}
              <div className="p-2.5 flex flex-col justify-between h-22">
                <div className="font-bold text-[#0f2744] border-b border-[#cbdde8] pb-0.5">
                  Approved By / اعتمدها
                </div>
                <div className="text-[9.5px] text-slate-400 border-t border-dashed border-[#cbdde8] pt-1">
                  Sign / Stamp / التوقيع / الختم
                </div>
              </div>

              {/* Col 4: Received By */}
              <div className="p-2.5 flex flex-col justify-between h-22">
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
            8. PROMINENT DARK NAVY FOOTER WITH GOLD ACCENT
            - Top footer row: Phone | WhatsApp | Email
            - Second footer row: Address (clear, spacious, full width)
            - Bilingual closing message: شكراً لكم | Thank You
            - Gold accent stripe and dark navy styling
            ======================================================== */}
        <div className="bg-[#0f2744] text-white rounded-md shadow-sm overflow-hidden relative border border-[#0f2744] mt-2.5">
          {/* Top Gold Accent Stripe */}
          <div className="w-full h-[3px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

          {/* Top Footer Row: Phone | WhatsApp | Email */}
          <div className="py-2 px-4 flex items-center justify-around text-[11px] border-b border-sky-950/70 bg-[#0f2744]">
            {/* Phone */}
            <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
              <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-bold text-slate-200">Phone:</span>
              <span className="font-mono text-white font-medium">{phoneVal || '-'}</span>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-200">WhatsApp:</span>
              <span className="font-mono text-white font-medium">{whatsappVal || phoneVal || '-'}</span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
              <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-bold text-slate-200">Email:</span>
              <span className="text-white font-medium truncate max-w-[200px]">{emailVal || '-'}</span>
            </div>
          </div>

          {/* Second Footer Row: Address */}
          {addressVal && (
            <div className="py-1.5 px-4 flex items-center justify-center gap-2 text-[11px] border-b border-sky-950/50 bg-[#0d223c]" dir="ltr">
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-bold text-slate-200 shrink-0">Address:</span>
              <span className="text-white font-medium text-center">{addressVal}</span>
            </div>
          )}

          {/* Bilingual Closing Message */}
          <div className="bg-[#0a1b2f] py-1.5 px-4 flex items-center justify-center gap-3 text-[11px] font-bold text-amber-200">
            <span dir="rtl">{companySettings.closingNoteAr || 'شكراً لكم'}</span>
            <span className="text-amber-400/60 font-normal">|</span>
            <span dir="ltr">{companySettings.closingNoteEn || 'Thank You'}</span>
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
        className="invoice-sheet print-sheet print-only bg-white text-slate-900 mx-auto select-text relative flex flex-col justify-between overflow-hidden"
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
          padding: '24px 32px',
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

