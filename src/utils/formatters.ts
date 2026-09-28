import { Invoice, Language, VatOption } from '../types/invoice';

export const SAUDI_CITIES = [
  'Riyadh',
  'Jeddah',
  'Dammam',
  'Khobar',
  'Dhahran',
  'Jubail',
  'Mecca',
  'Medina',
  'Taif',
  'Yanbu',
  'Abha',
  'Other',
];

export const SAUDI_CITIES_AR: Record<string, string> = {
  Riyadh: 'الرياض',
  Jeddah: 'جدة',
  Dammam: 'الدمام',
  Khobar: 'الخبر',
  Dhahran: 'الظهران',
  Jubail: 'الجبيل',
  Mecca: 'مكة المكرمة',
  Medina: 'المدينة المنورة',
  Taif: 'الطائف',
  Yanbu: 'ينبع',
  Abha: 'أبها',
  Other: 'أخرى / موقع آخر',
};

// 1 Ton through 30 Ton capacities as required by user prompt
export const BOOM_TRUCK_CAPACITIES = Array.from({ length: 30 }, (_, i) => `${i + 1} Ton`);

export function formatCurrency(amount: number, lang: Language = 'en'): string {
  const formatted = (amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === 'ar' ? `${formatted} ر.س` : `SAR ${formatted}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    return `${year}/${month}/${day}`;
  } catch {
    return dateString;
  }
}

/**
 * Calculates exact subtotal, VAT, and grand total without floating point inaccuracies
 */
export function calculateInvoiceTotals(
  quantity: number,
  rate: number,
  vatOption: VatOption
): { subtotal: number; vatAmount: number; total: number } {
  const cleanQty = Math.max(0, Number(quantity) || 0);
  const cleanRate = Math.max(0, Number(rate) || 0);

  // Exact math rounded to 2 decimals
  const subtotal = Math.round(cleanQty * cleanRate * 100) / 100;
  const is15Percent = vatOption === 'VAT 15%';
  const vatAmount = is15Percent ? Math.round(subtotal * 15) / 100 : 0;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  return { subtotal, vatAmount, total };
}

/**
 * Builds the WhatsApp message text matching the user prompt's format:
 *
 * Invoice No: INV-001
 * Customer: Customer Name
 * Service: Boom Truck
 * Capacity: 20 Ton
 * Location: Dammam
 * Subtotal: SAR 1,000
 * VAT 15%: SAR 150
 * Total: SAR 1,150
 */
export function buildWhatsAppMessage(
  invoice: Invoice,
  companyName: string = '[COMPANY NAME]',
  lang: Language = 'en'
): string {
  const city = invoice.city === 'Other' && invoice.customCity ? invoice.customCity : invoice.city;
  const isAr = lang === 'ar';
  const subtotalFormatted = formatCurrency(invoice.subtotal, 'en');
  const vatFormatted = formatCurrency(invoice.vatAmount, 'en');
  const totalFormatted = formatCurrency(invoice.total, 'en');
  const vatLabel = invoice.vatOption === 'VAT 15%' ? 'VAT 15%' : 'No VAT (0%)';

  if (isAr) {
    const cityAr = SAUDI_CITIES_AR[city] || city;
    const vatLabelAr = invoice.vatOption === 'VAT 15%' ? 'ضريبة القيمة المضافة ١٥٪' : 'بدون ضريبة (٠٪)';
    return `فاتورة شاحنة رافعة (بوم ترَك)
المنشأة: ${companyName}
-------------------------
رقم الفاتورة: ${invoice.invoiceNumber}
العميل: ${invoice.customerName}
الخدمة: شاحنة رافعة (Boom Truck)
الحمولة: ${invoice.truckCapacity.replace('Ton', 'طن')}
الموقع: ${cityAr}
المجموع الفرعي: ${subtotalFormatted}
${vatLabelAr}: ${vatFormatted}
الإجمالي النهائي: ${totalFormatted}
-------------------------
مرفق نسخة الفاتورة الرسمية PDF. شكراً لتعاملكم معنا.`;
  }

  return `Invoice No: ${invoice.invoiceNumber}
Customer: ${invoice.customerName}
Service: Boom Truck
Capacity: ${invoice.truckCapacity}
Location: ${city}
Subtotal: ${subtotalFormatted}
${vatLabel}: ${vatFormatted}
Total: ${totalFormatted}

Official PDF invoice attached. Thank you for your business.`;
}

/**
 * Creates clean wa.me link with URL encoded text
 */
export function getWhatsAppShareUrl(
  invoice: Invoice,
  companyName: string = '[COMPANY NAME]',
  lang: Language = 'en'
): string {
  const message = buildWhatsAppMessage(invoice, companyName, lang);
  const cleanPhone = (invoice.customerPhone || '').replace(/[^0-9]/g, '');

  if (cleanPhone && cleanPhone.length >= 9) {
    let phoneWithCountry = cleanPhone;
    if (phoneWithCountry.startsWith('05')) {
      phoneWithCountry = '966' + phoneWithCountry.substring(1);
    } else if (phoneWithCountry.startsWith('5')) {
      phoneWithCountry = '966' + phoneWithCountry;
    }
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
