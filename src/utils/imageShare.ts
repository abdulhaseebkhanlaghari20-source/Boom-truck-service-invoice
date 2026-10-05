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
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
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
  // Allow layout ticks & image renderings
  await new Promise((resolve) => setTimeout(resolve, 120));

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
  const filename = getInvoiceImageFilename(invoice.invoiceNumber);

  try {
    const blob = await generateInvoiceImageBlob(element);
    const imageFile = new File([blob], filename, {
      type: 'image/png',
      lastModified: Date.now(),
    });

    // Check native sharing capability for this image file
    const isShareSupported =
      typeof navigator !== 'undefined' &&
      !!navigator.share &&
      !!navigator.canShare &&
      navigator.canShare({ files: [imageFile] });

    if (isShareSupported) {
      try {
        await navigator.share({
          files: [imageFile],
          title: `Invoice ${invoice.invoiceNumber}`,
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
  companySettings: CompanySettings,
  lang: Language = 'en'
): ProfessionalEmailContent {
  const companyNameEn = companySettings.companyName || 'Boom Truck Rental Services';
  const customer = invoice.customerName || (lang === 'ar' ? 'العميل المحترم' : 'Valued Customer');
  const formattedDate = formatDate(invoice.invoiceDate);
  const formattedTotal = invoice.total.toFixed(2);

  if (lang === 'ar') {
    const subject = `فاتورة ضريبية ${invoice.invoiceNumber} - ${companySettings.companyNameAr || companySettings.companyName}`;

    let body = `السيد/السادة: ${customer}، المحترمين\n\n`;
    body += `السلام عليكم ورحمة الله وبركاته،\n\n`;
    body += `مرفق لكم الفاتورة الضريبية رقم ${invoice.invoiceNumber} الخاصة بخدمات شاحنة الرافعة (بوم ترَك).\n\n`;
    body += `• رقم الفاتورة: ${invoice.invoiceNumber}\n`;
    body += `• إجمالي الفاتورة: ${formattedTotal} ريال سعودي\n`;
    body += `• تاريخ الفاتورة: ${formattedDate}\n`;
    if (invoice.dueDate) {
      body += `• تاريخ الاستحقاق: ${formatDate(invoice.dueDate)}\n`;
    }
    body += `• الموقع: ${invoice.city}\n\n`;
    body += `شاكرين ومقدرين حسن تعاملكم معنا.\n\n`;

    if (companySettings.emailClosing) {
      body += `${companySettings.emailClosing}\n\n`;
    }

    body += `مع خالص التحية والتقدير،\n`;
    if (companySettings.contactPerson) {
      body += `${companySettings.contactPerson}${companySettings.jobTitle ? ` - ${companySettings.jobTitle}` : ''}\n`;
    }
    body += `${companySettings.companyNameAr || companySettings.companyName}\n`;
    if (companySettings.companyName && companySettings.companyNameAr) {
      body += `${companySettings.companyName}\n`;
    }
    if (companySettings.phone) body += `الجوال: ${companySettings.phone}\n`;
    if (companySettings.whatsapp) body += `واتساب: ${companySettings.whatsapp}\n`;
    if (companySettings.email) body += `البريد: ${companySettings.email}\n`;
    if (companySettings.website) body += `الموقع: ${companySettings.website}\n`;
    if (companySettings.addressAr || companySettings.address) {
      body += `العنوان: ${companySettings.addressAr || companySettings.address}\n`;
    }
    if (companySettings.vatNumber) body += `الرقم الضريبي: ${companySettings.vatNumber}\n`;
    if (companySettings.crNumber) body += `السجل التجاري: ${companySettings.crNumber}\n`;

    return { subject, body };
  }

  // English (Default)
  const subject = `Tax Invoice ${invoice.invoiceNumber} - ${companyNameEn}`;

  let body = `Dear ${customer},\n\n`;
  body += `Please find attached our Tax Invoice ${invoice.invoiceNumber} for the Boom Truck service.\n\n`;
  body += `Invoice Details:\n`;
  body += `• Invoice Number: ${invoice.invoiceNumber}\n`;
  body += `• Invoice Amount: SAR ${formattedTotal}\n`;
  body += `• Invoice Date: ${formattedDate}\n`;
  if (invoice.dueDate) {
    body += `• Due Date: ${formatDate(invoice.dueDate)}\n`;
  }
  body += `• Job Location: ${invoice.city}\n\n`;
  body += `Thank you for your business.\n\n`;

  if (companySettings.emailClosing) {
    body += `${companySettings.emailClosing}\n\n`;
  }

  body += `Best regards,\n`;
  if (companySettings.contactPerson) {
    body += `${companySettings.contactPerson}${companySettings.jobTitle ? ` - ${companySettings.jobTitle}` : ''}\n`;
  }
  body += `${companyNameEn}\n`;
  if (companySettings.companyNameAr) {
    body += `${companySettings.companyNameAr}\n`;
  }
  if (companySettings.phone) body += `Mobile: ${companySettings.phone}\n`;
  if (companySettings.whatsapp) body += `WhatsApp: ${companySettings.whatsapp}\n`;
  if (companySettings.email) body += `Email: ${companySettings.email}\n`;
  if (companySettings.website) body += `Website: ${companySettings.website}\n`;
  if (companySettings.address) body += `Address: ${companySettings.address}\n`;
  if (companySettings.vatNumber) body += `VAT No: ${companySettings.vatNumber}\n`;
  if (companySettings.crNumber) body += `CR No: ${companySettings.crNumber}\n`;

  return { subject, body };
}

/**
 * Shares the invoice as a PNG image file via the browser's native share sheet (allowing Gmail/Email selection).
 * If native file sharing is unsupported, automatically downloads the PNG image and opens mailto with prefilled text.
 */
export async function shareInvoiceEmail(
  element: HTMLElement,
  invoice: Invoice,
  companySettings: CompanySettings,
  lang: Language = 'en'
): Promise<ShareImageResult> {
  const filename = getInvoiceImageFilename(invoice.invoiceNumber);
  const { subject, body } = buildProfessionalEmailContent(invoice, companySettings, lang);

  try {
    const blob = await generateInvoiceImageBlob(element);
    const imageFile = new File([blob], filename, {
      type: 'image/png',
      lastModified: Date.now(),
    });

    const isShareSupported =
      typeof navigator !== 'undefined' &&
      !!navigator.share &&
      !!navigator.canShare &&
      navigator.canShare({ files: [imageFile] });

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
