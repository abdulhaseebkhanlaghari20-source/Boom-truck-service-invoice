import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { sendPasswordResetEmail, type User } from 'firebase/auth';
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

// Supported Primary Admin UID
export const SUPPORTED_ADMIN_UID = '7N820XwPYZWjjqbQBjh5V9qeiNt1';

/**
 * Verifies whether the authenticated user has Admin privileges in Firestore.
 * Admin access is granted strictly if an authorized document exists at `admins/{user.uid}`,
 * or if the user matches the supported Admin UID `7N820XwPYZWjjqbQBjh5V9qeiNt1`.
 * No hardcoded email checks are used.
 * Any other UID is an admin ONLY if it actually exists in Firestore `admins/{uid}`.
 */
export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.uid) return false;

  // Check supported Admin UID
  if (user.uid === SUPPORTED_ADMIN_UID) {
    return true;
  }

  // Any other UID must have an existing document in Firestore admins/{uid}
  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminDocRef);
    return snap.exists();
  } catch (err) {
    console.warn('Admin check notice:', err);
    return false;
  }
}

/**
 * Real-time listener for user's Admin authorization in Firestore
 */
export function subscribeUserAdminStatus(
  userId: string,
  onUpdate: (isAdmin: boolean) => void
): Unsubscribe {
  if (userId === SUPPORTED_ADMIN_UID) {
    onUpdate(true);
  }

  const adminDocRef = doc(db, 'admins', userId);
  return onSnapshot(
    adminDocRef,
    (snap) => {
      onUpdate(snap.exists() || userId === SUPPORTED_ADMIN_UID);
    },
    (err) => {
      console.warn('Admin status listener notice:', err);
      onUpdate(userId === SUPPORTED_ADMIN_UID);
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
    // If listing all users is restricted by rules, retrieve the authenticated user and supported admin
    const targetUids = Array.from(
      new Set([auth.currentUser?.uid, SUPPORTED_ADMIN_UID])
    ).filter(Boolean) as string[];

    // Also check if any additional admins exist in Firestore `admins` collection
    try {
      const adminsSnap = await getDocs(collection(db, 'admins'));
      adminsSnap.forEach((docSnap) => {
        if (!targetUids.includes(docSnap.id)) {
          targetUids.push(docSnap.id);
        }
      });
    } catch {
      // Ignored if admins collection cannot be listed
    }

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
        lastLoginAt: uData.lastLoginAt || uData.updatedAt || uData.createdAt || '',
        status: uData.status === 'suspended' ? 'suspended' : 'active',
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
    console.warn('Admin processing notice:', error);
    return {
      users: [],
      invoices: [],
      stats: {
        totalUsers: 0,
        totalInvoices: 0,
        totalInvoiceValue: 0,
        thisMonthInvoices: 0,
        thisMonthValue: 0,
        paidValue: 0,
        unpaidValue: 0,
      },
    };
  }
}

/**
 * Records or updates the user's login activity and ensures account status field is active
 */
export async function recordUserSession(user: User): Promise<void> {
  if (!user || !user.uid) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);
    const nowIso = new Date().toISOString();

    if (!existingSnap.exists()) {
      await setDoc(
        userDocRef,
        {
          email: user.email || '',
          status: 'active',
          lastLoginAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } else {
      const existingData = existingSnap.data();
      await setDoc(
        userDocRef,
        {
          email: user.email || existingData?.email || '',
          lastLoginAt: nowIso,
          updatedAt: nowIso,
          // If status is not set, initialize as active
          status: existingData?.status || 'active',
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Session recording notice:', err);
  }
}

/**
 * Checks if a user's account has been marked as suspended in Firestore
 */
export async function checkIsUserSuspended(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return false;
    return snap.data()?.status === 'suspended';
  } catch (err) {
    console.warn('Suspension check notice:', err);
    return false;
  }
}

/**
 * Updates a user's active/suspended status in Firestore
 * (Admin Protected Action)
 */
export async function updateUserAccountStatus(
  targetUid: string,
  newStatus: 'active' | 'suspended'
): Promise<void> {
  const userPath = `users/${targetUid}`;
  try {
    const userDocRef = doc(db, 'users', targetUid);
    await updateDoc(userDocRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

/**
 * Triggers Firebase's official password reset email to the user's registered email
 * Note: Never attempts to view, retrieve, or expose any actual password.
 */
export async function sendUserPasswordReset(email: string): Promise<void> {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address provided for password reset.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Deletes all of a user's Firestore data (profile and subcollection invoices).
 * Note: Firebase Client SDK cannot delete another user's Firebase Authentication account.
 * (Admin Protected Action)
 */
export async function deleteUserFirestoreData(targetUid: string): Promise<{ deletedInvoicesCount: number }> {
  const userPath = `users/${targetUid}`;
  let deletedInvoicesCount = 0;

  try {
    // 1. Delete all invoices in /users/{targetUid}/invoices
    const invCol = collection(db, 'users', targetUid, 'invoices');
    const invSnap = await getDocs(invCol);

    const batch = writeBatch(db);
    invSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletedInvoicesCount++;
    });

    // 2. Delete the user profile document
    const userDocRef = doc(db, 'users', targetUid);
    batch.delete(userDocRef);

    await batch.commit();
    return { deletedInvoicesCount };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, userPath);
  }
}

