import QRCode from 'qrcode';

/**
 * Encodes a string field into ZATCA TLV format:
 * [Tag (1 byte)][Length (1 byte)][Value (UTF-8 bytes)]
 */
function toTlv(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const length = valueBytes.length;
  const result = new Uint8Array(2 + length);
  result[0] = tag;
  result[1] = length;
  result.set(valueBytes, 2);
  return result;
}

/**
 * Combines multiple TLV Uint8Arrays into one
 */
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Generates ZATCA-compliant Base64 TLV payload
 */
export function generateZatcaTlvBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: number,
  vatAmount: number
): string {
  const safeSeller = String(sellerName || 'Boom Truck Services').trim();
  const safeVat = String(vatNumber || '300000000000003').trim();
  const safeTime = String(timestamp || new Date().toISOString()).trim();
  const numTotal = Math.max(0, Number(totalAmount) || 0);
  const numVat = Math.max(0, Number(vatAmount) || 0);
  const strTotal = numTotal.toFixed(2);
  const strVat = numVat.toFixed(2);

  try {
    const t1 = toTlv(1, safeSeller);
    const t2 = toTlv(2, safeVat);
    const t3 = toTlv(3, safeTime);
    const t4 = toTlv(4, strTotal);
    const t5 = toTlv(5, strVat);

    const combined = concatenateUint8Arrays([t1, t2, t3, t4, t5]);
    
    // Convert to binary string
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Failed to generate ZATCA TLV:', err);
    return `ZATCA-INV:${safeSeller}-${strTotal}`;
  }
}

/**
 * Generates QR Code Data URL from ZATCA TLV or invoice summary
 */
export async function generateQrCodeDataUrl(
  sellerName: string,
  vatNumber: string,
  invoiceDate: string,
  totalAmount: number,
  vatAmount: number
): Promise<string> {
  const timestamp = `${invoiceDate}T12:00:00Z`;
  const tlvBase64 = generateZatcaTlvBase64(sellerName, vatNumber, timestamp, totalAmount, vatAmount);

  try {
    const dataUrl = await QRCode.toDataURL(tlvBase64, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('QR code generation error, using fallback:', err);
    return '';
  }
}
