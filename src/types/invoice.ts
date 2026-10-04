export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export type VatOption = 'VAT 15%' | 'No VAT';

export interface CompanySettings {
  companyName: string;
  companyNameAr?: string;
  logoUrl: string; // Base64 or URL for company logo
  watermarkUrl?: string; // Optional custom watermark (defaults to logoUrl)
  enableWatermark?: boolean; // Toggle watermark on invoice (default: true)
  watermarkOpacity?: number; // Opacity 0.01 to 0.20 (default: 0.055)
  phone: string; // Primary phone / mobile (e.g. 0597330558)
  secondaryPhone?: string; // Secondary mobile / phone (e.g. 0596300922)
  whatsapp?: string; // WhatsApp number
  email: string; // Email address (e.g. ninthgenerationtrading345@gmail.com)
  address: string; // Full English address
  addressAr?: string; // Full Arabic address
  vatNumber: string; // VAT Number (e.g. 312777148100003)
  crNumber?: string; // Commercial Registration Number (e.g. 2050205810)
  bankName?: string; // Bank name (e.g. Alinma Bank)
  bankAccountNumber?: string; // Bank Account No. (A/C: 68206151342000)
  iban?: string; // IBAN (e.g. SA55050000068206151342000)
  sealNote?: string; // Company Seal / Disclaimer Note
  // Professional Header & Footer Branding Fields
  businessServiceEn?: string; // e.g. "BOOM TRUCK RENTAL SERVICES"
  businessServiceAr?: string; // e.g. "لتأجير بوم ترك"
  taglineEn?: string; // e.g. "LIFT | TRANSPORT | HEAVY EQUIPMENT SOLUTIONS"
  taglineAr?: string; // e.g. "خدمات رفع ونقل ومعدات متكاملة"
  closingNoteEn?: string; // e.g. "Thank you for your business"
  closingNoteAr?: string; // e.g. "شكراً لتعاملكم معنا"
  // Professional Email Signature & Contact Fields
  contactPerson?: string;
  jobTitle?: string;
  website?: string;
  emailClosing?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-001
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentStatus: PaymentStatus;

  // 1. Customer Section
  customerName: string;
  customerPhone: string;
  customerVatNumber?: string;

  // 2. Boom Truck Service Section
  city: string; // Riyadh, Jeddah, Dammam, etc.
  customCity?: string;
  truckCapacity: string; // e.g. "20 Ton" (1 Ton through 30 Ton)
  serviceDescription: string;
  quantity: number;
  rate: number; // in SAR

  // 3. Invoice & Tax Calculations
  vatOption: VatOption;
  subtotal: number;
  vatAmount: number;
  total: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;

  // 4. Company Profile Snapshot (Preserves historical company data for saved invoices)
  companySnapshot?: CompanySettings;
}

export type ViewTab = 'create' | 'list' | 'dashboard' | 'settings' | 'admin';
export type Language = 'en' | 'ar';

export interface AdminUserData {
  uid: string;
  email: string;
  companyName?: string;
  companyNameAr?: string;
  phone?: string;
  vatNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  invoiceCount: number;
  totalInvoiced: number;
}

export interface AdminInvoiceSummary extends Invoice {
  userUid: string;
  userEmail?: string;
  userCompanyName?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalInvoices: number;
  totalInvoiceValue: number;
  thisMonthInvoices: number;
  thisMonthValue: number;
  paidValue: number;
  unpaidValue: number;
}

