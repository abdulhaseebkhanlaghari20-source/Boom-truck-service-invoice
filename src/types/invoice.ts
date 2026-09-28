export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export type VatOption = 'VAT 15%' | 'No VAT';

export interface CompanySettings {
  companyName: string;
  companyNameAr?: string;
  logoUrl: string; // Base64 or empty string (displays COMPANY LOGO placeholder)
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  addressAr?: string;
  vatNumber: string;
  crNumber?: string;
  bankName?: string;
  iban?: string;
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
}

export type ViewTab = 'create' | 'list' | 'dashboard' | 'settings';
export type Language = 'en' | 'ar';
