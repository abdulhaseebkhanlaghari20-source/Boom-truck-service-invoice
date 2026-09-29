import { toPng } from 'html-to-image';
import { Invoice } from '../types/invoice';

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
