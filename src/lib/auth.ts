import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';

/**
 * Register a new user with Email and Password
 */
export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  return await createUserWithEmailAndPassword(auth, email.trim(), password);
}

/**
 * Sign in an existing user with Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

/**
 * Sign out current authenticated user
 */
export async function logOut(): Promise<void> {
  return await signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  return await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Subscribe to Firebase Auth state changes
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Current authenticated Firebase user (or null)
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * React hook to listen to Firebase Authentication state
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  };
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(err: any, lang: 'en' | 'ar' = 'en'): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return lang === 'ar'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
        : 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return lang === 'ar'
        ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.'
        : 'An account with this email already exists. Please log in.';
    case 'auth/invalid-email':
      return lang === 'ar'
        ? 'عنوان البريد الإلكتروني غير صحيح.'
        : 'Please enter a valid email address.';
    case 'auth/weak-password':
      return lang === 'ar'
        ? 'كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل.'
        : 'Password must be at least 6 characters long.';
    case 'auth/missing-password':
      return lang === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.';
    case 'auth/too-many-requests':
      return lang === 'ar'
        ? 'محاولات دخول كثيرة غير ناجحة. يرجى المحاولة لاحقاً.'
        : 'Access temporarily disabled due to many failed login attempts. Try again later.';
    case 'auth/network-request-failed':
      return lang === 'ar'
        ? 'تعذر الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.'
        : 'Network connection issue. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return lang === 'ar'
        ? 'تسجيل الدخول بالبريد الإلكتروني غير مفعّل في لوحة Firebase. يرجى تفعيل (Email/Password) في إعدادات Firebase Console.'
        : 'Email/Password provider is not enabled in Firebase Console. Please enable Email/Password in Firebase Authentication settings.';
    default:
      if (code.includes('api-key') || err?.message?.toLowerCase().includes('api-key-not-valid')) {
        return lang === 'ar'
          ? 'مفتاح API الخاص بـ Firebase غير صالح أو ناقص. يرجى التحقق من نسخ apiKey كاملاً من Firebase Console.'
          : 'Firebase API key is invalid or truncated. Please re-copy the full apiKey from Firebase Console.';
      }
      return err?.message || (lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Authentication error. Please try again.');
  }
}
