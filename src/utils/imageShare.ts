import { toPng } from 'html-to-image';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { formatDate } from './formatters';

export interface ShareImageResult {
  success: boolean;
  sharedAsFile: boolean;
  method: 'native-share' | 'download-fallback' | 'aborted' | 'error';
  error?: string;
  filename: string;
}

/**
 * Returns a standardized, safe filename for an invoice PNG image.
 * Example: "Invoice-INV-001.png"
 */
export function getInvoiceImageFilename(invoiceNumber: string): string {
  const safeNumber = (invoiceNumber || 'DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `Invoice-${safeNumber}.png`;
}

/**
 * Checks if the browser supports native Web Share API with image file attachments.
 */
export function canShareImageFile(): boolean {
  if (typeof navigator === 'undefined' || !('share' in navigator) || !('canShare' in navigator)) {
    return false;
  }
  try {
    const dummy = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'test.png', {
      type: 'image/png',
    });
    return navigator.canShare({ files: [dummy] });
  } catch {
    return false;
  }
}

/**
 * Converts a dataUrl string to a standard Blob without fetch (reliable across all environments).
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const byteCharacters = window.atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Renders the provided invoice HTML element into a high-quality PNG Blob.
 */
export async function generateInvoiceImageBlob(element: HTMLElement): Promise<Blob> {
  if (!element) {
    throw new Error('Invoice DOM element not found');
  }

  // Quickly await fonts if still loading, capped at 60ms to preserve mobile user gesture
  try {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded') {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 60)),
      ]);
    }
  } catch {}

  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
    skipFonts: true,
  });

  return dataUrlToBlob(dataUrl);
}

/**
 * Downloads an image Blob directly to the user's device.
 */
export function downloadImageBlob(blob: Blob, filename: string): boolean {
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
    console.error('Image download failed:', err);
    return false;
  }
}

/**
 * Shares the complete invoice as an image File via navigator.share.
 * If unsupported or failed, automatically downloads the PNG image so the user can attach it.
 */
export async function shareInvoiceImageFile(
  element: HTMLElement,
  invoice: Invoice
): Promise<ShareImageResult> {
  const invNumber = invoice?.invoiceNumber || 'INV-001';
  const filename = getInvoiceImageFilename(invNumber);

  try {
    const blob = await generateInvoiceImageBlob(element);
    if (!blob || blob.size === 0) {
      throw new Error('Generated image blob is empty');
    }

    const imageFile = new File([blob], filename, {
      type: 'image/png',
      lastModified: Date.now(),
    });

    console.log('[InvoiceShare Audit]', {
      invoiceId: invoice?.id,
      invoiceNumber: invNumber,
      blobSize: blob.size,
      blobType: blob.type,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      filename,
      hasNavigatorShare: typeof navigator !== 'undefined' && !!navigator.share,
      hasCanShare: typeof navigator !== 'undefined' && !!navigator.canShare,
    });

    // Check native sharing capability for this image file
    let isShareSupported = false;
    if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
      try {
        isShareSupported = navigator.canShare({ files: [imageFile] });
      } catch (canShareErr) {
        console.warn('navigator.canShare error:', canShareErr);
        isShareSupported = false;
      }
    }

    if (isShareSupported) {
      try {
        // Requirement 2: navigator.share({ files: [imageFile], title: "Invoice", text: "Invoice" })
        await navigator.share({
          files: [imageFile],
          title: `Invoice ${invNumber}`,
          text: `Invoice ${invNumber}`,
        });
        return {
          success: true,
          sharedAsFile: true,
          method: 'native-share',
          filename,
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            sharedAsFile: true,
            method: 'aborted',
            filename,
          };
        }
        console.warn('Native image share encountered error, falling back to download:', err);
      }
    }

    // Automatic download fallback when native file sharing is unavailable or fails
    downloadImageBlob(blob, filename);
    return {
      success: true,
      sharedAsFile: false,
      method: 'download-fallback',
      filename,
    };
  } catch (err: any) {
    console.error('Failed to generate or share invoice image:', err);
    return {
      success: false,
      sharedAsFile: false,
      method: 'error',
      error: err.message || 'Image generation failed',
      filename,
    };
  }
}

export interface ProfessionalEmailContent {
  subject: string;
  body: string;
}

/**
 * Generates a structured, professional email subject and message body
 * with a dynamic signature reflecting company settings.
 */
export function buildProfessionalEmailContent(
  invoice: Invoice,
  companySettings?: CompanySettings,
  lang: Language = 'en'
): ProfessionalEmailContent {
  const safeInvoice = invoice || ({} as Invoice);
  const safeSettings = companySettings || ({} as CompanySettings);
  const companyNameEn = safeSettings.companyName || 'Boom Truck Rental Services';
  const customer = safeInvoice.customerName || (lang === 'ar' ? 'العميل المحترم' : 'Valued Customer');
  const formattedDate = formatDate(safeInvoice.invoiceDate);
  const formattedTotal = Number(safeInvoice.total || 0).toFixed(2);
  const invNumber = safeInvoice.invoiceNumber || 'INV-001';

  if (lang === 'ar') {
    const subject = `فاتورة ضريبية ${invNumber} - ${safeSettings.companyNameAr || safeSettings.companyName || 'بوم ترَك'}`;

    let body = `السيد/السادة: ${customer}، المحترمين\n\n`;
    body += `السلام عليكم ورحمة الله وبركاته،\n\n`;
    body += `مرفق لكم الفاتورة الضريبية رقم ${invNumber} الخاصة بخدمات شاحنة الرافعة (بوم ترَك).\n\n`;
    body += `• رقم الفاتورة: ${invNumber}\n`;
    body += `• إجمالي الفاتورة: ${formattedTotal} ريال سعودي\n`;
    body += `• تاريخ الفاتورة: ${formattedDate}\n`;
    if (safeInvoice.dueDate) {
      body += `• تاريخ الاستحقاق: ${formatDate(safeInvoice.dueDate)}\n`;
    }
    body += `• الموقع: ${safeInvoice.city || '-'}\n\n`;
    body += `شاكرين ومقدرين حسن تعاملكم معنا.\n\n`;

    if (safeSettings.emailClosing) {
      body += `${safeSettings.emailClosing}\n\n`;
    }

    body += `مع خالص التحية والتقدير،\n`;
    if (safeSettings.contactPerson) {
      body += `${safeSettings.contactPerson}${safeSettings.jobTitle ? ` - ${safeSettings.jobTitle}` : ''}\n`;
    }
    body += `${safeSettings.companyNameAr || safeSettings.companyName || ''}\n`;
    if (safeSettings.companyName && safeSettings.companyNameAr) {
      body += `${safeSettings.companyName}\n`;
    }
    if (safeSettings.phone) body += `الجوال: ${safeSettings.phone}\n`;
    if (safeSettings.whatsapp) body += `واتساب: ${safeSettings.whatsapp}\n`;
    if (safeSettings.email) body += `البريد: ${safeSettings.email}\n`;
    if (safeSettings.website) body += `الموقع: ${safeSettings.website}\n`;
    if (safeSettings.addressAr || safeSettings.address) {
      body += `العنوان: ${safeSettings.addressAr || safeSettings.address}\n`;
    }
    if (safeSettings.vatNumber) body += `الرقم الضريبي: ${safeSettings.vatNumber}\n`;
    if (safeSettings.crNumber) body += `السجل التجاري: ${safeSettings.crNumber}\n`;

    return { subject, body };
  }

  // English (Default)
  const subject = `Tax Invoice ${invNumber} - ${companyNameEn}`;

  let body = `Dear ${customer},\n\n`;
  body += `Please find attached our Tax Invoice ${invNumber} for the Boom Truck service.\n\n`;
  body += `Invoice Details:\n`;
  body += `• Invoice Number: ${invNumber}\n`;
  body += `• Invoice Amount: SAR ${formattedTotal}\n`;
  body += `• Invoice Date: ${formattedDate}\n`;
  if (safeInvoice.dueDate) {
    body += `• Due Date: ${formatDate(safeInvoice.dueDate)}\n`;
  }
  body += `• Job Location: ${safeInvoice.city || '-'}\n\n`;
  body += `Thank you for your business.\n\n`;

  if (safeSettings.emailClosing) {
    body += `${safeSettings.emailClosing}\n\n`;
  }

  body += `Best regards,\n`;
  if (safeSettings.contactPerson) {
    body += `${safeSettings.contactPerson}${safeSettings.jobTitle ? ` - ${safeSettings.jobTitle}` : ''}\n`;
  }
  body += `${companyNameEn}\n`;
  if (safeSettings.companyNameAr) {
    body += `${safeSettings.companyNameAr}\n`;
  }
  if (safeSettings.phone) body += `Mobile: ${safeSettings.phone}\n`;
  if (safeSettings.whatsapp) body += `WhatsApp: ${safeSettings.whatsapp}\n`;
  if (safeSettings.email) body += `Email: ${safeSettings.email}\n`;
  if (safeSettings.website) body += `Website: ${safeSettings.website}\n`;
  if (safeSettings.address) body += `Address: ${safeSettings.address}\n`;
  if (safeSettings.vatNumber) body += `VAT No: ${safeSettings.vatNumber}\n`;
  if (safeSettings.crNumber) body += `CR No: ${safeSettings.crNumber}\n`;

  return { subject, body };
}

/**
 * Shares the invoice as a PNG image file via the browser's native share sheet (allowing Gmail/Email selection).
 * If native file sharing is unsupported, automatically downloads the PNG image and opens mailto with prefilled text.
 */
export async function shareInvoiceEmail(
  element: HTMLElement,
  invoice: Invoice,
  companySettings?: CompanySettings,
  lang: Language = 'en'
): Promise<ShareImageResult> {
  const invNumber = invoice?.invoiceNumber || 'INV-001';
  const filename = getInvoiceImageFilename(invNumber);
  const { subject, body } = buildProfessionalEmailContent(invoice, companySettings, lang);

  try {
    const blob = await generateInvoiceImageBlob(element);
    if (!blob || blob.size === 0) {
      throw new Error('Generated image blob is empty');
    }

    const imageFile = new File([blob], filename, {
      type: 'image/png',
      lastModified: Date.now(),
    });

    console.log('[InvoiceEmailShare Audit]', {
      invoiceId: invoice?.id,
      invoiceNumber: invNumber,
      blobSize: blob.size,
      blobType: blob.type,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      filename,
      hasNavigatorShare: typeof navigator !== 'undefined' && !!navigator.share,
      hasCanShare: typeof navigator !== 'undefined' && !!navigator.canShare,
    });

    let isShareSupported = false;
    if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
      try {
        isShareSupported = navigator.canShare({ files: [imageFile] });
      } catch {
        isShareSupported = false;
      }
    }

    if (isShareSupported) {
      try {
        await navigator.share({
          files: [imageFile],
          title: subject,
          text: body,
        });
        return {
          success: true,
          sharedAsFile: true,
          method: 'native-share',
          filename,
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            sharedAsFile: true,
            method: 'aborted',
            filename,
          };
        }
        console.warn('Native email share failed, falling back to download + mailto:', err);
      }
    }

    // Fallback: download PNG image and open mailto
    downloadImageBlob(blob, filename);

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      const mailtoLink = document.createElement('a');
      mailtoLink.href = mailtoUrl;
      mailtoLink.target = '_blank';
      mailtoLink.rel = 'noopener noreferrer';
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);
    } catch {
      window.location.href = mailtoUrl;
    }

    return {
      success: true,
      sharedAsFile: false,
      method: 'download-fallback',
      filename,
    };
  } catch (err: any) {
    console.error('Email image share failed:', err);
    return {
      success: false,
      sharedAsFile: false,
      method: 'error',
      error: err.message || 'Email share failed',
      filename,
    };
  }
}
