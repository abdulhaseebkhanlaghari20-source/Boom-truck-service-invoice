import React, { useEffect, useState, useRef } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { formatDate, SAUDI_CITIES_AR, numberToWords } from '../utils/formatters';
import { generateQrCodeDataUrl } from '../utils/zatcaQr';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Building2,
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
  companySettings,
  lang,
  isPrintOnly = false,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

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
  const companyNameEn = cleanVal(companySettings.companyName) || 'BOOM TRUCK RENTAL';
  const companyNameAr = cleanVal(companySettings.companyNameAr) || 'بوم ترَك لتأجير المعدات';
  const serviceEn = cleanVal(companySettings.businessServiceEn) || 'BOOM TRUCK RENTAL SERVICES';
  const serviceAr = cleanVal(companySettings.businessServiceAr) || 'لتأجير بوم ترك';
  const taglineEn = cleanVal(companySettings.taglineEn) || 'LIFT  |  TRANSPORT  |  HEAVY EQUIPMENT SOLUTIONS';
  const taglineAr = cleanVal(companySettings.taglineAr) || 'خدمات رفع ونقل ومعدات متكاملة';
  const closingEn = cleanVal(companySettings.closingNoteEn) || cleanVal(companySettings.emailClosing) || 'Thank you for your business';
  const closingAr = cleanVal(companySettings.closingNoteAr) || 'شكراً لتعاملكم معنا';

  const vatNo = cleanVal(companySettings.vatNumber);
  const crNo = cleanVal(companySettings.crNumber);
  const phoneVal = cleanVal(companySettings.phone);
  const whatsappVal = cleanVal(companySettings.whatsapp);
  const emailVal = cleanVal(companySettings.email);
  const addressVal = cleanVal(companySettings.address);
  const addressArVal = cleanVal(companySettings.addressAr);
  const websiteVal = cleanVal(companySettings.website);

  // Dynamic header information strip items (strictly only active fields, no empty placeholders)
  const headerInfoItems = [];

  if (vatNo) {
    headerInfoItems.push({
      id: 'vat',
      icon: <FileText className="w-3.5 h-3.5 text-white" />,
      labelEn: 'VAT Number',
      labelAr: 'الرقم الضريبي',
      value: vatNo,
      isMono: true,
    });
  }

  if (crNo) {
    headerInfoItems.push({
      id: 'cr',
      icon: <Building2 className="w-3.5 h-3.5 text-white" />,
      labelEn: 'CR Number',
      labelAr: 'السجل التجاري',
      value: crNo,
      isMono: true,
    });
  }

  if (phoneVal || whatsappVal) {
    const isShared = phoneVal && whatsappVal && phoneVal === whatsappVal;
    headerInfoItems.push({
      id: 'phone',
      icon: <Phone className="w-3.5 h-3.5 text-white" />,
      labelEn: isShared ? 'Mobile / WhatsApp' : whatsappVal ? 'WhatsApp' : 'Mobile / Phone',
      labelAr: isShared ? 'الجوال / واتساب' : whatsappVal ? 'واتساب' : 'الجوال',
      value: phoneVal || whatsappVal,
      isMono: true,
    });
  }

  if (emailVal) {
    headerInfoItems.push({
      id: 'email',
      icon: <Mail className="w-3.5 h-3.5 text-white" />,
      labelEn: 'Email',
      labelAr: 'البريد',
      value: emailVal,
      isMono: false,
    });
  }

  if (addressVal) {
    headerInfoItems.push({
      id: 'address',
      icon: <MapPin className="w-3.5 h-3.5 text-white" />,
      labelEn: 'Location',
      labelAr: 'الموقع',
      value: addressVal,
      subValue: addressArVal,
      isMono: false,
    });
  }

  if (websiteVal) {
    headerInfoItems.push({
      id: 'website',
      icon: <Globe className="w-3.5 h-3.5 text-white" />,
      labelEn: 'Website',
      labelAr: 'الموقع',
      value: websiteVal,
      isMono: false,
    });
  }

  // Inner A4 Sheet Content (100% Fixed Master Reference A4 Layout)
  const a4SheetContent = (
    <>
      {/* Center Background Watermark (Uses uploaded company logo from Settings) */}
      {companySettings.logoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
          aria-hidden="true"
        >
          <img
            src={companySettings.logoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-auto h-auto max-w-[420px] max-h-[420px] object-contain transition-opacity"
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
          {/* ========================================================
              1. MASTER REFERENCE CORPORATE HEADER
              ======================================================== */}
          <div className="flex flex-row justify-between items-center gap-3 pt-1 pb-1">
            {/* Left: English Company Identity & Logo */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {companySettings.logoUrl ? (
                <img
                  src={companySettings.logoUrl}
                  alt="Company Logo"
                  referrerPolicy="no-referrer"
                  className="max-h-16 max-w-[140px] w-auto h-auto object-contain object-left rtl:object-right shrink-0"
                />
              ) : (
                <div className="w-20 h-14 border border-dashed border-slate-300 bg-slate-50 text-slate-700 rounded-md flex flex-col items-center justify-center p-1 shrink-0 text-center shadow-2xs">
                  <span className="text-[10px] font-black tracking-tight text-slate-900">BOOM TRUCK</span>
                  <span className="text-[7.5px] font-bold text-amber-600">CRANE LOGO</span>
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                <h1 className="text-xl font-black text-slate-950 tracking-tight uppercase leading-none truncate">
                  {companyNameEn}
                </h1>
                <p className="text-[11px] font-extrabold uppercase text-amber-500 tracking-wide mt-1 leading-tight">
                  {serviceEn}
                </p>
                {taglineEn && (
                  <p className="text-[8.5px] font-bold uppercase text-slate-500 tracking-wider mt-0.5 leading-tight">
                    {taglineEn}
                  </p>
                )}
              </div>
            </div>

            {/* Crisp Vertical Divider between English & Arabic Identity */}
            <div className="w-[1.5px] h-14 bg-slate-300 shrink-0 mx-2" />

            {/* Right: Arabic Company Identity */}
            <div className="text-end rtl:text-start min-w-0 flex-1 space-y-0.5 shrink-0" dir="rtl">
              <h2 className="text-xl font-black text-slate-950 leading-none truncate">
                {companyNameAr}
              </h2>
              <div className="text-sm font-extrabold text-amber-500 mt-1 leading-tight">
                {serviceAr}
              </div>
              {taglineAr && (
                <div className="text-[10px] font-bold text-slate-600 mt-0.5 leading-tight">
                  {taglineAr}
                </div>
              )}
            </div>
          </div>

          {/* Master Reference Information Strip Below Header */}
          {headerInfoItems.length > 0 && (
            <div className="mt-2 flex flex-row items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-50/90 rounded-md border border-slate-200/90 text-slate-800 shadow-2xs">
              {headerInfoItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
                      {item.icon}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-0.5">
                        <span>{item.labelEn}</span>
                        <span className="text-[7px] text-slate-400">/</span>
                        <span>{item.labelAr}</span>
                      </div>
                      <div className={`font-bold text-slate-950 text-[9.5px] truncate ${item.isMono ? 'font-mono' : ''}`}>
                        {item.value}
                      </div>
                      {item.subValue && (
                        <div className="text-[8px] text-slate-600 truncate" dir="rtl">
                          {item.subValue}
                        </div>
                      )}
                    </div>
                  </div>
                  {idx < headerInfoItems.length - 1 && (
                    <div className="h-6 w-[1.5px] bg-amber-500 shrink-0 mx-1.5" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Master Reference Signature Divider Bar (Deep Navy with Vibrant Gold/Amber Accent Line) */}
          <div className="relative mt-2 mb-2 space-y-[2px]">
            <div className="w-full h-[3px] bg-slate-950 rounded-full" />
            <div className="w-full h-[1.5px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 rounded-full" />
          </div>

          {/* 2. INVOICE TITLE: Centered Bordered Box */}
          <div className="flex justify-center my-1.5">
            <div className="border border-slate-700/80 rounded-md px-12 py-1 text-center bg-white shadow-2xs">
              <span className="text-base font-extrabold text-slate-900 tracking-wide font-sans">
                Tax Invoice الفاتورة الضريبية
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
                  {invoice.customerVatNumber || vatNo || '-'}
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
          <div className="bg-slate-200/80 border-y border-slate-300 px-3 py-1.5 text-xs text-slate-900 flex flex-row items-center justify-between gap-1">
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
            <div className="px-3 py-1.5 border-b border-slate-300 bg-slate-50 font-medium text-slate-700">
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

        {/* ========================================================
            8. MASTER REFERENCE FULL-WIDTH DARK NAVY FOOTER
            ======================================================== */}
        <div className="bg-slate-950 text-white rounded-lg shadow-sm overflow-hidden relative border border-slate-800/80 mt-2">
          {/* Top Thin Gold/Amber Decorative Accent Stripe */}
          <div className="w-full h-[2.5px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          <div className="py-2 px-3.5 sm:px-4">
            {/* Upper Row: Dynamic Contact & Company Metadata */}
            <div className="flex flex-row items-center justify-between gap-3 text-[10.5px]">
              {/* 1. Address / Location (Left) */}
              {addressVal && (
                <div className="flex items-center gap-1.5 min-w-0 max-w-[28%]">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="min-w-0 leading-tight">
                    <div className="text-slate-100 font-medium truncate text-[10px]">{addressVal}</div>
                    {addressArVal && (
                      <div className="text-[9px] text-slate-400 truncate" dir="rtl">
                        {addressArVal}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vertical Divider */}
              {addressVal && (phoneVal || emailVal || vatNo) && (
                <div className="w-[1px] h-7 bg-slate-800 shrink-0" />
              )}

              {/* 2. Mobile (Center-Left) */}
              {phoneVal && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="font-mono text-slate-100 font-semibold text-[10px]">{phoneVal}</div>
                    <div className="text-[8px] text-slate-400">Mobile / الجوال</div>
                  </div>
                </div>
              )}

              {/* WhatsApp if distinct from phone */}
              {whatsappVal && whatsappVal !== phoneVal && (
                <>
                  <div className="w-[1px] h-7 bg-slate-800 shrink-0" />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="leading-tight">
                      <div className="font-mono text-slate-100 font-semibold text-[10px]">{whatsappVal}</div>
                      <div className="text-[8px] text-slate-400">WhatsApp / واتساب</div>
                    </div>
                  </div>
                </>
              )}

              {/* Vertical Divider */}
              {emailVal && (
                <div className="w-[1px] h-7 bg-slate-800 shrink-0" />
              )}

              {/* 3. Email (Center) */}
              {emailVal && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="min-w-0 leading-tight">
                    <div className="text-slate-100 truncate text-[10px]">{emailVal}</div>
                    <div className="text-[8px] text-slate-400">Email / البريد</div>
                  </div>
                </div>
              )}

              {/* Website if available */}
              {websiteVal && (
                <>
                  <div className="w-[1px] h-7 bg-slate-800 shrink-0" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="min-w-0 leading-tight">
                      <div className="text-slate-100 truncate font-mono text-[9.5px]">{websiteVal}</div>
                      <div className="text-[8px] text-slate-400">Website / الموقع</div>
                    </div>
                  </div>
                </>
              )}

              {/* Vertical Divider */}
              {(vatNo || crNo) && (
                <div className="w-[1px] h-7 bg-slate-800 shrink-0" />
              )}

              {/* 4. VAT & CR Numbers (Right) */}
              {(vatNo || crNo) && (
                <div className="text-end shrink-0 space-y-0.5">
                  {vatNo && (
                    <div className="text-[9.5px] font-mono text-slate-200">
                      <span className="text-amber-400 font-bold font-sans">VAT: </span>
                      <span>{vatNo}</span>
                    </div>
                  )}
                  {crNo && (
                    <div className="text-[9.5px] font-mono text-slate-200">
                      <span className="text-amber-400 font-bold font-sans">CR: </span>
                      <span>{crNo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Center Bar: Closing Note with Thin Golden Lines */}
            {(closingEn || closingAr) && (
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-center gap-3 text-[10px] text-slate-300 font-medium">
                <span className="w-10 sm:w-16 h-[1px] bg-amber-500/70" />
                <span className="tracking-wide">
                  {closingEn}
                  {closingEn && closingAr && <span className="text-amber-400 mx-2 font-bold">|</span>}
                  {closingAr}
                </span>
                <span className="w-10 sm:w-16 h-[1px] bg-amber-500/70" />
              </div>
            )}
          </div>
        </div>
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
