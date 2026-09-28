import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Invoice } from '../types/invoice';

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
 * Generates an actual A4 PDF Blob from an HTML DOM element using html2canvas & jsPDF.
 */
export async function generateInvoicePdfBlob(element: HTMLElement): Promise<Blob> {
  // Wait a small moment to ensure all web fonts and images are ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  const canvas = await html2canvas(element, {
    scale: 2, // 2x retina print resolution
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 820,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

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

  const canvasRatio = canvas.height / canvas.width;
  const imgHeight = printableWidth * canvasRatio;

  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, imgHeight);
  } else {
    // If it slightly overflows, scale down to fit comfortably on 1 page
    const maxHeight = pageHeight - margin * 2;
    const scaledWidth = maxHeight / canvasRatio;
    const offsetX = (pageWidth - scaledWidth) / 2;
    pdf.addImage(imgData, 'JPEG', offsetX, margin, scaledWidth, maxHeight);
  }

  return pdf.output('blob');
}

/**
 * Downloads a Blob directly to the client's device with the given filename.
 */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Shares the PDF file via the Web Share API (Android Chrome, iOS Safari, etc.).
 * If unsupported, downloads the file and reports sharedAsFile = false so callers can trigger fallback.
 */
export async function shareInvoicePdfFile(
  element: HTMLElement,
  invoice: Invoice,
  shareTitle?: string,
  shareText?: string
): Promise<SharePdfResult> {
  const filename = getInvoicePdfFilename(invoice.invoiceNumber);
  const title = shareTitle || `Invoice ${invoice.invoiceNumber}`;
  const text =
    shareText ||
    `Boom Truck Service Invoice ${invoice.invoiceNumber} - Total: SAR ${invoice.total.toFixed(2)}`;

  try {
    const blob = await generateInvoicePdfBlob(element);
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
          // User closed the share menu without picking an app
          return { success: false, sharedAsFile: true, method: 'aborted' };
        }
        // If native share threw an unexpected error, fall through to download
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
