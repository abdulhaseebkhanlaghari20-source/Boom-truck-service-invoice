import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Invoice, CompanySettings } from '../types/invoice';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Standardized error reporter conforming to Firebase guidelines
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strips undefined properties recursively so Firestore does not throw
 * "Function DocumentReference.set() called with invalid data. Unsupported field value: undefined"
 */
function sanitizeForFirestore<T>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  if (!data || typeof data !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Save user company settings to users/{userId}
 */
export async function saveUserCompanySettings(
  userId: string,
  settings: CompanySettings
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const sanitized = sanitizeForFirestore({
      ...settings,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDocRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user company settings from users/{userId}
 */
export async function loadUserCompanySettings(
  userId: string
): Promise<CompanySettings | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return data as CompanySettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save or update a single invoice in users/{userId}/invoices/{invoiceId}
 */
export async function saveUserInvoice(
  userId: string,
  invoice: Invoice
): Promise<void> {
  const path = `users/${userId}/invoices/${invoice.id}`;
  try {
    const invoiceDocRef = doc(db, 'users', userId, 'invoices', invoice.id);
    const sanitized = sanitizeForFirestore({
      ...invoice,
      updatedAt: invoice.updatedAt || new Date().toISOString(),
    });
    await setDoc(invoiceDocRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load all invoices for the authenticated user from users/{userId}/invoices
 */
export async function loadUserInvoices(userId: string): Promise<Invoice[]> {
  const path = `users/${userId}/invoices`;
  try {
    const invoicesColRef = collection(db, 'users', userId, 'invoices');
    const snap = await getDocs(invoicesColRef);
    const list: Invoice[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Invoice;
      list.push({
        ...data,
        id: docSnap.id,
      });
    });
    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete an invoice from users/{userId}/invoices/{invoiceId}
 */
export async function deleteUserInvoice(
  userId: string,
  invoiceId: string
): Promise<void> {
  const path = `users/${userId}/invoices/${invoiceId}`;
  try {
    const invoiceDocRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await deleteDoc(invoiceDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time listener for user's invoices
 */
export function subscribeUserInvoices(
  userId: string,
  onUpdate: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = `users/${userId}/invoices`;
  const invoicesColRef = collection(db, 'users', userId, 'invoices');
  const q = query(invoicesColRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Invoice;
        list.push({
          ...data,
          id: docSnap.id,
        });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore subscription notice (users/' + userId + '/invoices):', error.message);
      if (onError) {
        onError(error);
      }
    }
  );
}
