import { Invoice } from '../types/invoice';

/**
 * Parses existing invoice numbers like "INV-001", "INV-042", "INV-1"
 * and returns the next sequential number formatted as "INV-00X".
 * Guarantees no duplicates within the list.
 */
export function generateNextInvoiceNumber(invoices: Invoice[]): string {
  const existingNumbers = new Set(invoices.map((inv) => inv.invoiceNumber.trim().toUpperCase()));

  let maxNum = 0;
  for (const inv of invoices) {
    const match = inv.invoiceNumber.match(/INV-?(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `INV-${String(nextNum).padStart(3, '0')}`;

  // Ensure strict uniqueness in case non-standard numbers exist
  while (existingNumbers.has(candidate.toUpperCase())) {
    nextNum++;
    candidate = `INV-${String(nextNum).padStart(3, '0')}`;
  }

  return candidate;
}

/**
 * Checks if an invoice number already exists in other invoices
 */
export function isInvoiceNumberDuplicate(
  invoiceNumber: string,
  currentId: string,
  invoices: Invoice[]
): boolean {
  const normalized = invoiceNumber.trim().toUpperCase();
  return invoices.some(
    (inv) => inv.id !== currentId && inv.invoiceNumber.trim().toUpperCase() === normalized
  );
}
