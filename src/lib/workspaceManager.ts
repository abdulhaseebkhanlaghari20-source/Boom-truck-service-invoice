import {
  CompanyWorkspace,
  Customer,
  ServiceCatalogItem,
  BankAccount,
  Invoice,
  InvoiceNumberingSettings,
  TaxSettings,
} from '../types/invoice';

const STORAGE_KEYS = {
  ACTIVE_WORKSPACE: 'multi_tenant_active_workspace_id',
  WORKSPACES_PREFIX: 'multi_tenant_workspaces_',
  CUSTOMERS_PREFIX: 'multi_tenant_customers_',
  SERVICES_PREFIX: 'multi_tenant_services_',
  INVOICES_PREFIX: 'multi_tenant_invoices_',
};

/**
 * Creates a clean, empty business workspace for a new business tenant.
 * Zero hardcoded company details or assumptions.
 */
export function createNewWorkspace(ownerUid: string, email: string, name?: string): CompanyWorkspace {
  const workspaceId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const defaultBank: BankAccount = {
    id: `bank-${Date.now()}`,
    bankName: '',
    accountNumber: '',
    iban: '',
    isDefault: true,
  };

  const defaultTax: TaxSettings = {
    vatEnabled: true,
    vatRate: 15,
    vatNumber: '',
  };

  const defaultNumbering: InvoiceNumberingSettings = {
    prefix: 'INV-',
    startingNumber: 1,
    digits: 4,
  };

  return {
    id: workspaceId,
    ownerUid,
    name: name || '',
    nameAr: '',
    businessActivity: '',
    businessActivityAr: '',
    logoUrl: '',
    phone: '',
    whatsapp: '',
    email: email || '',
    address: '',
    addressAr: '',
    vatNumber: '',
    crNumber: '',
    bankAccounts: [defaultBank],
    taxSettings: defaultTax,
    numberingSettings: defaultNumbering,
    invoiceTemplateSettings: {
      showSeal: true,
      taglineEn: '',
      taglineAr: '',
      closingNoteEn: 'Thank you for your business',
      closingNoteAr: 'شكراً لتعاملكم معنا',
    },
    members: [
      {
        uid: ownerUid,
        email: email || '',
        role: 'owner',
        addedAt: new Date().toISOString(),
      },
    ],
    isSetupComplete: false,
    userRole: 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get active workspace ID from local storage, scoped by user ID
 */
export function getStoredActiveWorkspaceId(userId?: string): string | null {
  try {
    if (userId) {
      const userScoped = localStorage.getItem(`${STORAGE_KEYS.ACTIVE_WORKSPACE}_${userId}`);
      if (userScoped) return userScoped;
    }
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE);
  } catch {
    return null;
  }
}

/**
 * Set active workspace ID, scoped by user ID
 */
export function setStoredActiveWorkspaceId(workspaceId: string, userId?: string): void {
  try {
    if (userId) {
      localStorage.setItem(`${STORAGE_KEYS.ACTIVE_WORKSPACE}_${userId}`, workspaceId);
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE, workspaceId);
  } catch (err) {
    console.error('Failed to store active workspace ID', err);
  }
}

/**
 * Load all workspaces belonging to a user
 */
export function loadLocalUserWorkspaces(userId: string): CompanyWorkspace[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WORKSPACES_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse local workspaces', err);
  }
  return [];
}

/**
 * Save user workspaces list locally
 */
export function saveLocalUserWorkspaces(userId: string, workspaces: CompanyWorkspace[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.WORKSPACES_PREFIX}${userId}`, JSON.stringify(workspaces));
  } catch (err) {
    console.error('Failed to save local workspaces', err);
  }
}

/**
 * Load Customers for a specific Company Workspace
 */
export function loadCompanyCustomers(companyId: string): Customer[] {
  if (!companyId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CUSTOMERS_PREFIX}${companyId}`);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Failed to load company customers', err);
  }
  return [];
}

/**
 * Save Customers for a specific Company Workspace
 */
export function saveCompanyCustomers(companyId: string, customers: Customer[]): void {
  if (!companyId) return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.CUSTOMERS_PREFIX}${companyId}`, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save company customers', err);
  }
}

/**
 * Load Services Catalog for a specific Company Workspace
 */
export function loadCompanyServices(companyId: string): ServiceCatalogItem[] {
  if (!companyId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SERVICES_PREFIX}${companyId}`);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Failed to load company services', err);
  }
  return [];
}

/**
 * Save Services Catalog for a specific Company Workspace
 */
export function saveCompanyServices(companyId: string, services: ServiceCatalogItem[]): void {
  if (!companyId) return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.SERVICES_PREFIX}${companyId}`, JSON.stringify(services));
  } catch (err) {
    console.error('Failed to save company services', err);
  }
}

/**
 * Generate Next Invoice Number based on company numbering settings and existing invoices
 */
export function generateCompanyInvoiceNumber(
  existingInvoices: Invoice[],
  settings?: InvoiceNumberingSettings
): string {
  const prefix = settings?.prefix?.trim() || 'INV-';
  const digits = Math.max(1, settings?.digits || 4);
  const startNum = Math.max(1, settings?.startingNumber || 1);

  // Filter invoices that start with this prefix
  const matchingNumbers = existingInvoices
    .map((inv) => inv.invoiceNumber)
    .filter((num) => num && num.startsWith(prefix))
    .map((num) => {
      const numPart = num.slice(prefix.length);
      const parsed = parseInt(numPart, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const highest = matchingNumbers.length > 0 ? Math.max(...matchingNumbers) : startNum - 1;
  const nextNum = Math.max(startNum, highest + 1);

  return `${prefix}${String(nextNum).padStart(digits, '0')}`;
}

/**
 * Load Invoices for a specific Company Workspace
 */
export function loadCompanyInvoices(companyId: string): Invoice[] {
  if (!companyId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.INVOICES_PREFIX}${companyId}`);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Failed to load company invoices', err);
  }
  return [];
}

/**
 * Save Invoices for a specific Company Workspace
 */
export function saveCompanyInvoices(companyId: string, invoices: Invoice[]): void {
  if (!companyId) return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.INVOICES_PREFIX}${companyId}`, JSON.stringify(invoices));
  } catch (err) {
    console.error('Failed to save company invoices', err);
  }
}

/**
 * Converts a CompanyWorkspace into standard CompanySettings for rendering and preview
 */
export function workspaceToCompanySettings(workspace: CompanyWorkspace): import('../types/invoice').CompanySettings {
  const primaryBank =
    workspace.bankAccounts?.find((b) => b.isDefault) ||
    workspace.bankAccounts?.[0] || {
      id: 'default',
      bankName: '',
      accountNumber: '',
      iban: '',
    };

  return {
    companyName: workspace.name,
    companyNameAr: workspace.nameAr,
    businessActivity: workspace.businessActivity,
    businessActivityAr: workspace.businessActivityAr,
    logoUrl: workspace.logoUrl || '',
    phone: workspace.phone,
    whatsapp: workspace.whatsapp,
    email: workspace.email,
    address: workspace.address,
    addressAr: workspace.addressAr,
    vatNumber: workspace.vatNumber || workspace.taxSettings?.vatNumber || '',
    crNumber: workspace.crNumber || '',
    bankName: primaryBank.bankName,
    bankAccountNumber: primaryBank.accountNumber,
    iban: primaryBank.iban,
    bankAccounts: workspace.bankAccounts || [primaryBank],
    taxSettings: workspace.taxSettings,
    numberingSettings: workspace.numberingSettings,
    taglineEn: workspace.invoiceTemplateSettings?.taglineEn,
    taglineAr: workspace.invoiceTemplateSettings?.taglineAr,
    closingNoteEn: workspace.invoiceTemplateSettings?.closingNoteEn || 'Thank you for your business',
    closingNoteAr: workspace.invoiceTemplateSettings?.closingNoteAr || 'شكراً لتعاملكم معنا',
    sealNote: workspace.invoiceTemplateSettings?.sealNote,
  };
}

/**
 * Updates a CompanyWorkspace from modified CompanySettings
 */
export function companySettingsToWorkspace(
  settings: import('../types/invoice').CompanySettings,
  workspace: CompanyWorkspace
): CompanyWorkspace {
  const bankAccounts = settings.bankAccounts && settings.bankAccounts.length > 0
    ? settings.bankAccounts
    : [
        {
          id: `bank-${Date.now()}`,
          bankName: settings.bankName || '',
          accountNumber: settings.bankAccountNumber || '',
          iban: settings.iban || '',
          isDefault: true,
        },
      ];

  return {
    ...workspace,
    name: settings.companyName,
    nameAr: settings.companyNameAr,
    businessActivity: settings.businessActivity,
    businessActivityAr: settings.businessActivityAr,
    logoUrl: settings.logoUrl,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    addressAr: settings.addressAr,
    vatNumber: settings.vatNumber,
    crNumber: settings.crNumber,
    bankAccounts,
    taxSettings: settings.taxSettings || {
      vatEnabled: true,
      vatRate: 15,
      vatNumber: settings.vatNumber || '',
    },
    numberingSettings: settings.numberingSettings || workspace.numberingSettings,
    invoiceTemplateSettings: {
      ...workspace.invoiceTemplateSettings,
      taglineEn: settings.taglineEn,
      taglineAr: settings.taglineAr,
      closingNoteEn: settings.closingNoteEn || 'Thank you for your business',
      closingNoteAr: settings.closingNoteAr || 'شكراً لتعاملكم معنا',
      sealNote: settings.sealNote,
    },
    updatedAt: new Date().toISOString(),
  };
}
