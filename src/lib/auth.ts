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
