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
import type { User } from 'firebase/auth';
import { db, auth } from './firebase';
import {
  Invoice,
  CompanySettings,
  AdminUserData,
  AdminInvoiceSummary,
  AdminStats,
} from '../types/invoice';

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

// Authorized Admin UIDs configured for this deployment
export const AUTHORIZED_ADMIN_UIDS = [
  '7N820XwPYZWjjqbQBjh5V9qeiNt1',
  'xBcYEtdi6IfQ6y0cqYK8PiDSL3q2',
];

/**
 * Verifies whether the authenticated user has Admin privileges in Firestore.
 * Admin access is granted strictly based on authorized UID or document at `admins/{user.uid}`.
 * Does not depend on any email address.
 */
export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.uid) return false;

  // Direct UID authorization
  if (AUTHORIZED_ADMIN_UIDS.includes(user.uid)) {
    return true;
  }

  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminDocRef);

    // Document must exist at admins/{uid}
    return snap.exists();
  } catch (err) {
    console.warn('Admin check notice:', err);
    return AUTHORIZED_ADMIN_UIDS.includes(user.uid);
  }
}

/**
 * Real-time listener for user's Admin authorization in Firestore
 */
export function subscribeUserAdminStatus(
  userId: string,
  onUpdate: (isAdmin: boolean) => void
): Unsubscribe {
  if (AUTHORIZED_ADMIN_UIDS.includes(userId)) {
    onUpdate(true);
  }

  const adminDocRef = doc(db, 'admins', userId);
  return onSnapshot(
    adminDocRef,
    (snap) => {
      onUpdate(snap.exists() || AUTHORIZED_ADMIN_UIDS.includes(userId));
    },
    (err) => {
      console.warn('Admin status listener notice:', err);
      onUpdate(AUTHORIZED_ADMIN_UIDS.includes(userId));
    }
  );
}

/**
 * Fetches all registered platform users, their heavy equipment invoices,
 * and business revenue statistics (Protected Admin Query)
 */
export async function fetchAdminData(): Promise<{
  users: AdminUserData[];
  invoices: AdminInvoiceSummary[];
  stats: AdminStats;
}> {
  const usersPath = 'users';
  let usersDocs: any[] = [];

  try {
    const usersCol = collection(db, usersPath);
    const usersSnap = await getDocs(usersCol);
    usersDocs = usersSnap.docs;
  } catch (err: any) {
    console.warn('Listing /users restricted by Firestore rules, using targeted UID query fallback:', err);
    // If global list is blocked because rules are not yet published, query target UIDs individually
    const targetUids = Array.from(
      new Set([auth.currentUser?.uid, ...AUTHORIZED_ADMIN_UIDS])
    ).filter(Boolean) as string[];

    for (const uid of targetUids) {
      try {
        const uDoc = await getDoc(doc(db, 'users', uid));
        if (uDoc.exists()) {
          usersDocs.push(uDoc);
        } else {
          usersDocs.push({
            id: uid,
            data: () => ({
              email: uid === auth.currentUser?.uid ? auth.currentUser?.email || '' : '',
              companyName: uid === auth.currentUser?.uid ? 'المشغل الرئيسي / Admin' : 'مستخدم مسجل بالمنصة',
              createdAt: new Date().toISOString(),
            }),
          });
        }
      } catch (innerErr) {
        console.warn(`Fallback user fetch notice for ${uid}:`, innerErr);
      }
    }
  }

  try {
    const userList: AdminUserData[] = [];
    const allInvoices: AdminInvoiceSummary[] = [];

    // Current month identifier YYYY-MM
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalInvoiceValue = 0;
    let thisMonthInvoices = 0;
    let thisMonthValue = 0;
    let paidValue = 0;
    let unpaidValue = 0;

    for (const userDoc of usersDocs) {
      const uData = userDoc.data();
      const uid = userDoc.id;

      let userInvoiceCount = 0;
      let userTotalInvoiced = 0;

      try {
        const invCol = collection(db, 'users', uid, 'invoices');
        const invSnap = await getDocs(invCol);

        invSnap.forEach((invDoc) => {
          const inv = invDoc.data() as Invoice;
          const invoiceItem: AdminInvoiceSummary = {
            ...inv,
            id: invDoc.id,
            userUid: uid,
            userEmail: uData.email || '',
            userCompanyName: uData.companyName || uData.companyNameAr || '',
          };
          allInvoices.push(invoiceItem);

          userInvoiceCount++;
          const val = Number(inv.total) || 0;
          userTotalInvoiced += val;
          totalInvoiceValue += val;

          // Check monthly stats
          if (inv.invoiceDate && inv.invoiceDate.startsWith(currentMonthKey)) {
            thisMonthInvoices++;
            thisMonthValue += val;
          }

          if (inv.paymentStatus === 'Paid') {
            paidValue += val;
          } else {
            unpaidValue += val;
          }
        });
      } catch (e) {
        console.warn(`Could not load invoices for user ${uid}:`, e);
      }

      userList.push({
        uid,
        email: uData.email || (uid === auth.currentUser?.uid ? auth.currentUser?.email || '' : ''),
        companyName: uData.companyName || '',
        companyNameAr: uData.companyNameAr || '',
        phone: uData.phone || '',
        vatNumber: uData.vatNumber || '',
        address: uData.address || '',
        createdAt: uData.createdAt || '',
        updatedAt: uData.updatedAt || '',
        invoiceCount: userInvoiceCount,
        totalInvoiced: userTotalInvoiced,
      });
    }

    // Sort users by highest total invoiced or invoice count
    userList.sort((a, b) => b.totalInvoiced - a.totalInvoiced || b.invoiceCount - a.invoiceCount);

    // Sort all invoices newest first
    allInvoices.sort(
      (a, b) =>
        new Date(b.createdAt || b.invoiceDate || 0).getTime() -
        new Date(a.createdAt || a.invoiceDate || 0).getTime()
    );

    const stats: AdminStats = {
      totalUsers: userList.length,
      totalInvoices: allInvoices.length,
      totalInvoiceValue,
      thisMonthInvoices,
      thisMonthValue,
      paidValue,
      unpaidValue,
    };

    return {
      users: userList,
      invoices: allInvoices,
      stats,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, usersPath);
  }
}

