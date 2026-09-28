import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Invoice, CompanySettings } from '../types/invoice';

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
  await new Promise((resolve) => setTimeout(resolve, 80));

  let imgData: string | null = null;

  try {
    imgData = await toPng(element, {
      quality: 0.96,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: false,
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
  const margin = 8; // 8mm margins
  const printableWidth = pageWidth - margin * 2; // 194mm

  if (imgData) {
    try {
      const imgProps = pdf.getImageProperties(imgData);
      const canvasRatio = imgProps.height / imgProps.width;
      const imgHeight = printableWidth * canvasRatio;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, imgHeight, undefined, 'FAST');
      } else {
        const maxHeight = pageHeight - margin * 2;
        const scaledWidth = maxHeight / canvasRatio;
        const offsetX = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', offsetX, margin, scaledWidth, maxHeight, undefined, 'FAST');
      }
    } catch (addErr) {
      console.warn('Failed to place image on PDF, falling back to vector layout:', addErr);
      if (invoice) {
        renderDirectVectorInvoice(pdf, invoice, companySettings);
      }
    }
  } else if (invoice) {
    renderDirectVectorInvoice(pdf, invoice, companySettings);
  }

  return pdf.output('blob');
}

/**
 * Direct vector invoice renderer used as an infallible fallback.
 */
function renderDirectVectorInvoice(
  pdf: jsPDF,
  invoice: Invoice,
  companySettings?: CompanySettings
): void {
  const company = companySettings?.companyName || 'Boom Truck Rental Services';
  const vatNo = companySettings?.vatNumber || '300000000000003';
  const phone = companySettings?.phone || '+966 50 000 0000';

  // Title Box
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(10, 10, 190, 22, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text('TAX INVOICE / فاتورة ضريبية', 15, 22);
  pdf.setFontSize(10);
  pdf.text(`No: ${invoice.invoiceNumber}`, 150, 22);

  // Company & Customer Details
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.text(company, 15, 40);
  pdf.setFontSize(9);
  pdf.text(`VAT No: ${vatNo} | Phone: ${phone}`, 15, 46);
  pdf.text(`Date: ${invoice.invoiceDate} | Due: ${invoice.dueDate || invoice.invoiceDate}`, 15, 52);

  pdf.setDrawColor(203, 213, 225);
  pdf.line(10, 58, 200, 58);

  // Customer block
  pdf.setFontSize(10);
  pdf.text('Billed To / العميل:', 15, 66);
  pdf.setFontSize(11);
  pdf.text(invoice.customerName || 'Valued Customer', 15, 73);
  pdf.setFontSize(9);
  pdf.text(`Location: ${invoice.city} | Truck: ${invoice.truckCapacity}`, 15, 80);

  // Service Table Header
  pdf.setFillColor(241, 245, 249);
  pdf.rect(10, 90, 190, 8, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  pdf.text('Description / الخدمة', 15, 95);
  pdf.text('Qty', 110, 95);
  pdf.text('Rate (SAR)', 140, 95);
  pdf.text('Total (SAR)', 175, 95);

  // Line item
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Boom Truck Service (${invoice.truckCapacity})`, 15, 105);
  pdf.text(`${invoice.quantity}`, 112, 105);
  pdf.text(`${invoice.rate.toFixed(2)}`, 142, 105);
  pdf.text(`${invoice.subtotal.toFixed(2)}`, 175, 105);

  pdf.line(10, 112, 200, 112);

  // Totals Box
  pdf.setFontSize(10);
  pdf.text('Subtotal / المجموع:', 120, 122);
  pdf.text(`SAR ${invoice.subtotal.toFixed(2)}`, 175, 122);

  pdf.text(`VAT (${invoice.vatOption}) / الضريبة:`, 120, 130);
  pdf.text(`SAR ${invoice.vatAmount.toFixed(2)}`, 175, 130);

  pdf.setFillColor(240, 253, 244);
  pdf.rect(115, 136, 85, 12, 'F');
  pdf.setTextColor(21, 128, 61);
  pdf.setFontSize(12);
  pdf.text('Grand Total / الإجمالي:', 120, 144);
  pdf.text(`SAR ${invoice.total.toFixed(2)}`, 170, 144);

  // Payment Status
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(9);
  pdf.text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`, 15, 144);
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
 * Opens a PDF Blob directly in a new tab (useful as a 100% reliable mobile viewer).
 */
export function openPdfBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
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
  const text =
    shareText ||
    `Boom Truck Service Invoice ${invoice.invoiceNumber} - Total: SAR ${invoice.total.toFixed(2)}`;

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
