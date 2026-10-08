export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export type VatOption = 'VAT 15%' | 'No VAT';

export interface BankAccount {
  id: string;
  bankName: string;
  bankNameAr?: string;
  accountName?: string;
  accountNumber: string;
  iban: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  phone: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  crNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCatalogItem {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  defaultBillingType: 'days' | 'hours' | 'trips' | 'quantity' | 'custom';
  defaultUnit: string; // e.g. "Day", "Hour", "Trip", "Pcs"
  defaultRate: number;
  vatApplicable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceNumberingSettings {
  prefix: string; // e.g. "INV-"
  startingNumber: number; // e.g. 1
  digits: number; // e.g. 4 -> "0001"
}

export interface TaxSettings {
  vatEnabled: boolean;
  vatRate: number; // e.g. 15 for 15%
  vatNumber: string;
  taxRegistrationName?: string;
}

export type UserRole = 'owner' | 'admin' | 'staff' | 'viewer';

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  addedAt?: string;
}

export interface CompanySettings {
  companyName: string;
  companyNameAr?: string;
  businessActivity?: string; // Business Activity / Service
  businessActivityAr?: string; // Arabic Business Activity / Service
  logoUrl: string; // Base64 or URL for company logo
  watermarkUrl?: string; // Optional custom watermark (defaults to logoUrl)
  enableWatermark?: boolean; // Toggle watermark on invoice (default: true)
  watermarkOpacity?: number; // Opacity 0.01 to 0.20 (default: 0.055)
  phone: string; // Primary phone / mobile (e.g. 0597330558)
  secondaryPhone?: string; // Secondary mobile / phone (e.g. 0596300922)
  whatsapp?: string; // WhatsApp number
  email: string; // Email address
  address: string; // Full English address
  addressAr?: string; // Full Arabic address
  vatNumber: string; // VAT Number (e.g. 312777148100003)
  crNumber?: string; // Commercial Registration Number (e.g. 2050205810)
  bankName?: string; // Bank name (e.g. Alinma Bank)
  bankAccountNumber?: string; // Bank Account No.
  iban?: string; // IBAN
  sealNote?: string; // Company Seal / Disclaimer Note
  bankAccounts?: BankAccount[];
  taxSettings?: TaxSettings;
  numberingSettings?: InvoiceNumberingSettings;
  // Professional Header & Footer Branding Fields
  businessServiceEn?: string;
  businessServiceAr?: string;
  taglineEn?: string;
  taglineAr?: string;
  closingNoteEn?: string;
  closingNoteAr?: string;
  // Professional Email Signature & Contact Fields
  contactPerson?: string;
  jobTitle?: string;
  website?: string;
  emailClosing?: string;
}

export interface CompanyWorkspace {
  id: string; // Workspace ID / Company ID
  ownerUid: string;
  name: string; // English
  nameAr?: string; // Arabic
  businessActivity?: string;
  businessActivityAr?: string;
  logoUrl?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  addressAr?: string;
  vatNumber?: string;
  crNumber?: string;
  bankAccounts: BankAccount[];
  taxSettings: TaxSettings;
  numberingSettings: InvoiceNumberingSettings;
  invoiceTemplateSettings?: {
    primaryColor?: string;
    accentColor?: string;
    showSeal?: boolean;
    sealNote?: string;
    taglineEn?: string;
    taglineAr?: string;
    closingNoteEn?: string;
    closingNoteAr?: string;
  };
  members?: WorkspaceMember[];
  isSetupComplete?: boolean;
  userRole?: UserRole; // Current active user's role in this workspace
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  serviceId?: string; // Reference to catalog service
  serviceName?: string;
  description: string;
  unit?: string; // e.g. "Pcs", "Day", "Hour", "Month", "Trip"
  quantity: number;
  rate: number; // in SAR
  vatRate?: number; // 0.15 or 0
  vatAmount?: number;
  subtotal?: number;
  total?: number;
}

export interface Invoice {
  id: string;
  companyId?: string; // The tenant/business workspace ID
  customerId?: string; // Reference to saved customer
  selectedBankAccountId?: string; // Reference to specific bank account
  invoiceNumber: string; // e.g. INV-001
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentStatus: PaymentStatus;

  // 1. Customer Section
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerVatNumber?: string;

  // 2. Service & Location Section
  city: string; // Riyadh, Jeddah, Dammam, etc.
  customCity?: string;
  jobLocation?: string;
  truckCapacity: string; // e.g. "20 Ton"
  serviceDescription: string;
  quantity: number;
  rate: number; // in SAR
  unit?: string;

  // Multiple Line Items support
  items?: InvoiceItem[];

  // 3. Quantity / Column Header Customization (Days, Hours, Quantity, Custom)
  quantityColumnType?: 'quantity' | 'days' | 'hours' | 'trips' | 'period' | 'custom';
  customQuantityHeaderEn?: string; // e.g. "Days", "Duration", "Hours", "Period"
  customQuantityHeaderAr?: string; // e.g. "الأيام", "المدة", "الساعات", "الفترة"
  customRateHeaderEn?: string;     // e.g. "Daily Rate", "Hourly Rate", "Rate"
  customRateHeaderAr?: string;     // e.g. "سعر اليوم", "سعر الساعة", "سعر الوحدة"

  // 4. Invoice & Tax Calculations
  vatOption: VatOption;
  vatRatePercent?: number; // Configurable VAT rate from tax settings (e.g. 15)
  subtotal: number;
  vatAmount: number;
  total: number;
  paidAmount?: number;
  amountDue?: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;

  // 5. Company Profile Snapshot (Preserves historical company data for saved invoices)
  companySnapshot?: CompanySettings;
}

export type ViewTab = 'create' | 'list' | 'customers' | 'services' | 'dashboard' | 'settings' | 'admin';
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
  lastLoginAt?: string;
  status?: 'active' | 'suspended';
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

