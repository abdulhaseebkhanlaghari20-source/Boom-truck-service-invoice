import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Invoice, CompanySettings } from '../types/invoice';
import { generateQrCodeDataUrl } from './zatcaQr';
import { formatDate, formatCurrency, SAUDI_CITIES_AR } from './formatters';

export interface SharePdfResult {
  success: boolean;
  sharedAsFile: boolean;
  method: 'native-share-file' | 'download-fallback' | 'aborted' | 'error';
  error?: string;
  downloadedFallback?: boolean;
}

/**
 * Returns a standardized, safe filename for an invoice PDF.
 * Example: "Invoice-INV-001.pdf"
 */
export function getInvoicePdfFilename(invoiceNumber: string): string {
  const safeNumber = (invoiceNumber || 'DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `Invoice-${safeNumber}.pdf`;
}

/**
 * Checks if the browser environment supports native Web Share API with file attachments.
 */
export function canSharePdfFile(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const dummy = new File(['%PDF-1.4 test'], 'test.pdf', { type: 'application/pdf' });
    return navigator.canShare({ files: [dummy] });
  } catch {
    return false;
  }
}

/**
 * Generates an actual A4 PDF Blob from an HTML DOM element using html-to-image & jsPDF.
 * If DOM snapshot fails for any reason, falls back to direct jsPDF vector rendering.
 */
export async function generateInvoicePdfBlob(
  element: HTMLElement,
  invoice?: Invoice,
  companySettings?: CompanySettings
): Promise<Blob> {
  // Allow pending font renders and layout ticks
  try {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
  } catch {
    // ignore
  }
  await new Promise((resolve) => setTimeout(resolve, 80));

  let imgData: string | null = null;

  try {
    imgData = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true, // Prevents CORS or font fetch errors on mobile devices
    });
  } catch (canvasErr) {
    console.warn('html-to-image capture encountered error, attempting fallback:', canvasErr);
  }

  // Standard A4 portrait: 210mm x 297mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;

  let usedVector = false;

  if (imgData && imgData.length > 200) {
    try {
      // The element already incorporates true print-safe margins internally,
      // mapping 1:1 onto the exact 210 x 297 mm A4 canvas eliminates blur, distortion, and double margins.
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } catch (addErr) {
      console.warn('Failed to place snapshot image on PDF, using direct vector layout:', addErr);
      usedVector = true;
    }
  } else {
    usedVector = true;
  }

  if (usedVector && invoice) {
    await renderDirectVectorInvoice(pdf, invoice, companySettings);
  }

  return pdf.output('blob');
}

/**
 * Direct comprehensive vector invoice renderer used as an infallible fallback.
 * Contains ALL required invoice fields, QR code, bank info, and signature/stamp lines.
 */
async function renderDirectVectorInvoice(
  pdf: jsPDF,
  invoice: Invoice,
  companySettings?: CompanySettings
): Promise<void> {
  const company = companySettings?.companyName || 'Boom Truck Rental Services';
  const address = companySettings?.address || 'Kingdom of Saudi Arabia';
  const vatNo = companySettings?.vatNumber || '300000000000003';
  const phone = companySettings?.phone || '+966 50 000 0000';
  const email = companySettings?.email || 'info@boomtruckservices.sa';
  const crNo = companySettings?.crNumber || '';
  const city = invoice.city === 'Other' && invoice.customCity ? invoice.customCity : invoice.city;

  // 1. Top Header Bar: Primary Navy (#0F2744) with Title
  pdf.setFillColor(15, 39, 68); // #0F2744
  pdf.rect(10, 10, 190, 24, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('TAX INVOICE / فاتورة ضريبية', 16, 22);
  pdf.setFontSize(11);
  pdf.text(`No: ${invoice.invoiceNumber}`, 148, 22);

  // 2. Company Details (Left) + ZATCA QR Code (Right)
  const textStartX = 12;

  // Primary Navy: #0F2744 -> [15, 39, 68]
  // Dark Navy: #08233F -> [8, 35, 63]
  // Light Blue: #F0F5FA -> [240, 245, 250]
  // Border Blue: #CBDDE8 -> [203, 221, 232]
  // Subtle Gold Accent: #D9A62E -> [217, 166, 46]

  pdf.setTextColor(15, 39, 68);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(company, textStartX, 43);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 39, 68);
  pdf.text(companySettings?.businessActivity || 'Heavy Equipment & Machinery Rental', textStartX, 49);
  pdf.text(`VAT No: ${vatNo}${crNo ? ` | CR No: ${crNo}` : ''}`, textStartX, 54);

  // Generate & draw ZATCA QR Code on top right
  try {
    const qrDataUrl = await generateQrCodeDataUrl(
      company,
      vatNo,
      invoice.invoiceDate,
      invoice.total,
      invoice.vatAmount
    );
    if (qrDataUrl) {
      pdf.addImage(qrDataUrl, 'PNG', 164, 35, 28, 28);
    }
  } catch (qrErr) {
    console.warn('QR code render skipped in vector fallback:', qrErr);
  }

  // Horizontal divider
  pdf.setDrawColor(203, 221, 232);
  pdf.line(10, 65, 200, 65);

  // 3. Bill To (Customer) & Invoice Metadata Zone
  pdf.setFillColor(240, 245, 250);
  pdf.rect(10, 68, 92, 32, 'F');
  pdf.rect(106, 68, 94, 32, 'F');
  pdf.setDrawColor(203, 221, 232);
  pdf.rect(10, 68, 92, 32, 'S');
  pdf.rect(106, 68, 94, 32, 'S');

  // Customer Details Box
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 39, 68);
  pdf.text('BILLED TO / العميل:', 14, 74);
  pdf.setFontSize(11);
  pdf.setTextColor(15, 39, 68);
  pdf.text(invoice.customerName || 'Valued Customer', 14, 81);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 39, 68);
  pdf.text(`Phone: ${invoice.customerPhone || 'N/A'}`, 14, 88);
  pdf.text(`VAT No: ${invoice.customerVatNumber || 'N/A'}`, 14, 94);

  // Invoice Details Box
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 39, 68);
  pdf.text('INVOICE DETAILS / بيانات الفاتورة:', 110, 74);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 39, 68);
  pdf.text(`Date: ${formatDate(invoice.invoiceDate)}`, 110, 81);
  pdf.text(`Due Date: ${formatDate(invoice.dueDate)}`, 110, 88);
  pdf.text(`Location: ${city} | Capacity: ${invoice.truckCapacity}`, 110, 94);

  // 4. Service Line Items Table
  pdf.setFillColor(15, 39, 68);
  pdf.rect(10, 105, 190, 9, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('#', 13, 111);
  pdf.text('Service Description / بيان الخدمة', 22, 111);
  pdf.text('Capacity', 105, 111);
  pdf.text('Qty', 128, 111);
  pdf.text('Rate (SAR)', 146, 111);
  pdf.text('Amount (SAR)', 175, 111);

  // Table Row
  pdf.setTextColor(15, 39, 68);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('1', 13, 121);
  const desc = invoice.serviceDescription || `Boom Truck Equipment Rental (${city})`;
  pdf.setFont('helvetica', 'bold');
  pdf.text(desc, 22, 121);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.truckCapacity, 105, 121);
  const safeRate = Math.max(0, Number(invoice.rate) || 0);
  const safeSubtotal = Math.max(0, Number(invoice.subtotal) || 0);
  const safeVat = Math.max(0, Number(invoice.vatAmount) || 0);
  const safeTotal = Math.max(0, Number(invoice.total) || (safeSubtotal + safeVat));

  pdf.text(`${invoice.quantity || 1}`, 130, 121);
  pdf.text(`${safeRate.toFixed(2)}`, 150, 121);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${safeSubtotal.toFixed(2)}`, 180, 121);

  pdf.setDrawColor(203, 221, 232);
  pdf.line(10, 127, 200, 127);

  // 5. Notes & Bank Info (Left) + Calculations (Right)
  const calcTop = 133;

  // Notes & Bank details (Left)
  if (invoice.notes) {
    pdf.setFillColor(240, 245, 250);
    pdf.rect(10, calcTop, 90, 18, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 39, 68);
    pdf.text('Notes / Terms:', 13, calcTop + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 39, 68);
    pdf.text(invoice.notes, 13, calcTop + 11);
  }

  if (companySettings?.bankName) {
    const bankY = invoice.notes ? calcTop + 22 : calcTop;
    pdf.setFillColor(240, 245, 250);
    pdf.rect(10, bankY, 90, 16, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 39, 68);
    pdf.text('Bank Transfer Details:', 13, bankY + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 39, 68);
    pdf.text(`Bank: ${companySettings.bankName}`, 13, bankY + 10);
    if (companySettings.iban) {
      pdf.text(`IBAN: ${companySettings.iban}`, 13, bankY + 14);
    }
  }

  // Calculations Box (Right)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(106, calcTop, 94, 38, 'F');
  pdf.setDrawColor(203, 221, 232);
  pdf.rect(106, calcTop, 94, 38, 'S');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 39, 68);
  pdf.text('Subtotal / المجموع الفرعي:', 110, calcTop + 8);
  pdf.text(`SAR ${safeSubtotal.toFixed(2)}`, 175, calcTop + 8);

  const vatLabel = invoice.vatOption === 'VAT 15%' ? 'VAT 15% / ضريبة ١٥٪:' : 'VAT (No VAT):';
  pdf.text(vatLabel, 110, calcTop + 16);
  pdf.text(`SAR ${safeVat.toFixed(2)}`, 175, calcTop + 16);

  // Grand Total Highlight with #F0F5FA background
  pdf.setFillColor(240, 245, 250);
  pdf.rect(108, calcTop + 22, 90, 12, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 39, 68);
  pdf.text('Grand Total / الإجمالي:', 112, calcTop + 30);
  pdf.text(`SAR ${safeTotal.toFixed(2)}`, 166, calcTop + 30);

  // 6. Signature & Stamp Footer Area
  const footerY = 186;
  pdf.setDrawColor(203, 221, 232);
  pdf.line(10, footerY, 200, footerY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 39, 68);
  pdf.text('Received By / توقيع المستلم:', 14, footerY + 8);
  pdf.setDrawColor(203, 221, 232);
  pdf.line(14, footerY + 22, 70, footerY + 22);

  pdf.text('Authorized Stamp & Signature / الختم والتوقيع:', 130, footerY + 8);
  pdf.line(130, footerY + 22, 190, footerY + 22);

  // Payment Status Badge
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 39, 68);
  if (invoice.paymentStatus === 'Paid') {
    pdf.text('[ STATUS: PAID / مدفوعة ]', 14, footerY + 28);
  } else if (invoice.paymentStatus === 'Partially Paid') {
    pdf.text('[ STATUS: PARTIALLY PAID ]', 14, footerY + 28);
  } else {
    pdf.text('[ STATUS: UNPAID / غير مدفوعة ]', 14, footerY + 28);
  }

  // Bottom Full-Width Dark Footer (#0F2744 + gold #D9A62E accent)
  pdf.setFillColor(15, 39, 68); // #0F2744
  pdf.rect(10, footerY + 32, 190, 11, 'F');
  // Accent gold stripe #D9A62E on top of footer
  pdf.setFillColor(217, 166, 46); // #D9A62E
  pdf.rect(10, footerY + 32, 190, 0.8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  const phones = [phone, companySettings?.secondaryPhone].filter(Boolean).join(', ');
  pdf.text(`${address}  |  Mob: ${phones}  |  Mail: ${email}`, 14, footerY + 37.5);
  pdf.setFontSize(6.8);
  pdf.setTextColor(217, 166, 46); // #D9A62E
  pdf.text('Thank you for your business  |  شكراً لتعاملكم معنا', 75, footerY + 41.5);
}

/**
 * Downloads a Blob directly to the client's device with the given filename.
 */
export function downloadPdfBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch (err) {
    console.error('Download failed:', err);
    return false;
  }
}

/**
 * Shares the PDF file via the Web Share API (Android Chrome, iOS Safari, etc.).
 * If unsupported, downloads the file and reports sharedAsFile = false so callers can trigger fallback.
 */
export async function shareInvoicePdfFile(
  element: HTMLElement,
  invoice: Invoice,
  companySettings?: CompanySettings,
  shareTitle?: string,
  shareText?: string
): Promise<SharePdfResult> {
  const filename = getInvoicePdfFilename(invoice.invoiceNumber);
  const title = shareTitle || `Invoice ${invoice.invoiceNumber}`;
  // DO NOT put invoice data in the text body - keep it as a clean attachment note
  const text = shareText || `Boom Truck Service Invoice ${invoice.invoiceNumber} (PDF Document)`;

  try {
    const blob = await generateInvoicePdfBlob(element, invoice, companySettings);
    const pdfFile = new File([blob], filename, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    const isShareSupported =
      typeof navigator !== 'undefined' &&
      !!navigator.share &&
      !!navigator.canShare &&
      navigator.canShare({ files: [pdfFile] });

    if (isShareSupported) {
      try {
        await navigator.share({
          files: [pdfFile],
          title,
          text,
        });
        return { success: true, sharedAsFile: true, method: 'native-share-file' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, sharedAsFile: true, method: 'aborted' };
        }
        console.warn('Native share threw error, falling back to download:', err);
      }
    }

    // Fallback: download PDF directly to device
    downloadPdfBlob(blob, filename);
    return {
      success: true,
      sharedAsFile: false,
      method: 'download-fallback',
      downloadedFallback: true,
    };
  } catch (err: any) {
    console.error('Failed to generate or share PDF:', err);
    return {
      success: false,
      sharedAsFile: false,
      method: 'error',
      error: err.message || 'PDF generation failed',
    };
  }
}
