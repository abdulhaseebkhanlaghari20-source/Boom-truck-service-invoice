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
  companyName: string = 'Boom Truck Services',
  lang: Language = 'en'
): string {
  if (lang === 'ar') {
    return `فاتورة شاحنة رافعة رقم: ${invoice.invoiceNumber} (مستند PDF)
المنشأة: ${companyName}
العميل: ${invoice.customerName}

مرفق لكم ملف الفاتورة الرسمية بصيغة PDF. شكراً لتعاملكم معنا.`;
  }

  return `Invoice ${invoice.invoiceNumber} (PDF Document)
From: ${companyName}
Customer: ${invoice.customerName}

Please find the attached official Boom Truck service invoice PDF document.`;
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

/**
 * Converts numeric amounts into formal words for invoices (English & Arabic)
 */
export function numberToWords(amount: number, lang: Language = 'en'): string {
  const whole = Math.floor(Math.abs(amount) || 0);
  const fraction = Math.round(((Math.abs(amount) || 0) - whole) * 100);

  if (lang === 'ar') {
    const onesAr = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tensAr = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundredsAr = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    const convertChunkAr = (num: number): string => {
      let str = '';
      const h = Math.floor(num / 100);
      const rem = num % 100;
      if (h > 0) str += hundredsAr[h];
      if (rem > 0) {
        if (str) str += ' و';
        if (rem < 10) {
          str += onesAr[rem];
        } else if (rem === 10) {
          str += 'عشرة';
        } else if (rem === 11) {
          str += 'أحد عشر';
        } else if (rem === 12) {
          str += 'اثنا عشر';
        } else if (rem < 20) {
          str += `${onesAr[rem % 10]} عشر`;
        } else {
          const t = Math.floor(rem / 10);
          const o = rem % 10;
          if (o > 0) str += `${onesAr[o]} و`;
          str += tensAr[t];
        }
      }
      return str;
    };

    let result = '';
    if (whole === 0) {
      result = 'صفر';
    } else {
      const thousands = Math.floor(whole / 1000);
      const remainder = whole % 1000;
      if (thousands > 0) {
        if (thousands === 1) result += 'ألف';
        else if (thousands === 2) result += 'ألفان';
        else if (thousands >= 3 && thousands <= 10) result += `${convertChunkAr(thousands)} آلاف`;
        else result += `${convertChunkAr(thousands)} ألف`;
      }
      if (remainder > 0) {
        if (result) result += ' و';
        result += convertChunkAr(remainder);
      }
    }

    result = `فقط ${result} ريالاً سعودياً`;
    if (fraction > 0) {
      result += ` و${convertChunkAr(fraction)} هللة`;
    }
    return `${result} لا غير`;
  }

  // English
  const onesEn = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensEn = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertChunkEn = (num: number): string => {
    let str = '';
    const h = Math.floor(num / 100);
    const rem = num % 100;
    if (h > 0) str += `${onesEn[h]} Hundred`;
    if (rem > 0) {
      if (str) str += ' ';
      if (rem < 20) {
        str += onesEn[rem];
      } else {
        const t = Math.floor(rem / 10);
        const o = rem % 10;
        str += tensEn[t];
        if (o > 0) str += `-${onesEn[o]}`;
      }
    }
    return str;
  };

  let resEn = '';
  if (whole === 0) {
    resEn = 'Zero';
  } else {
    const thousands = Math.floor(whole / 1000);
    const rem = whole % 1000;
    if (thousands > 0) {
      resEn += `${convertChunkEn(thousands)} Thousand`;
    }
    if (rem > 0) {
      if (resEn) resEn += ' ';
      resEn += convertChunkEn(rem);
    }
  }

  let finalEn = `${resEn} Riyals`;
  if (fraction > 0) {
    finalEn += ` and ${convertChunkEn(fraction)} Halalas`;
  }
  return `${finalEn} Only`;
}
