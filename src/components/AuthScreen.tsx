import React, { useState } from 'react';
import {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  getAuthErrorMessage,
} from '../lib/auth';
import { Language } from '../types/invoice';
import { Truck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Globe, ArrowLeft, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ lang, onLanguageChange }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isRtl = lang === 'ar';

  const resetFields = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    resetFields();
    setMode(newMode);
  };

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    onLanguageChange(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetPassword(email);
        setSuccessMessage(
          lang === 'ar'
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            : 'Password reset link has been sent to your email.'
        );
      } catch (err: any) {
        setError(getAuthErrorMessage(err, lang));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError(lang === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError(
          lang === 'ar'
            ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.'
            : 'Password must be at least 6 characters long.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setError(
          lang === 'ar'
            ? 'كلمتا المرور غير متطابقتين.'
            : 'Passwords do not match. Please verify.'
        );
        return;
      }

      try {
        setLoading(true);
        await signUpWithEmail(email, password);
        // Firebase onAuthStateChanged will automatically authenticate and transition the app
      } catch (err: any) {
        setError(getAuthErrorMessage(err, lang));
        setLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      try {
        setLoading(true);
        await signInWithEmail(email, password);
        // Firebase onAuthStateChanged will automatically authenticate and transition the app
      } catch (err: any) {
        setError(getAuthErrorMessage(err, lang));
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top right language switch */}
      <div className="absolute top-4 end-4">
        <button
          onClick={toggleLanguage}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg ring-4 ring-emerald-500/20">
            <Truck className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          {mode === 'login' && (lang === 'ar' ? 'تسجيل الدخول للنظام' : 'Sign in to your account')}
          {mode === 'signup' && (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create your account')}
          {mode === 'forgot' && (lang === 'ar' ? 'استعادة كلمة المرور' : 'Reset your password')}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-400">
          {lang === 'ar'
            ? 'نظام إصدار وإدارة فواتير رافعات بوم ترَك المعتمد'
            : 'Saudi Boom Truck Crane Invoicing & Management System'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 border border-slate-700/80 py-7 px-6 shadow-xl rounded-xl sm:px-8 backdrop-blur-xs">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'ar' ? 'name@company.com' : 'name@company.com'}
                  className="block w-full ps-9 pe-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field (only for login & signup) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot')}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full ps-9 pe-10 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (only for signup) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full ps-9 pe-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' && (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                {mode === 'signup' && (lang === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
                {mode === 'forgot' && (lang === 'ar' ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}
              </button>
            </div>
          </form>

          {/* Mode Switchers / Links */}
          <div className="mt-6 pt-5 border-t border-slate-700/80 text-center text-xs">
            {mode === 'login' && (
              <p className="text-slate-400">
                {lang === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signup')}
                  className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up'}
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-slate-400">
                {lang === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p className="text-slate-400">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}</span>
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security Note */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          {lang === 'ar'
            ? 'اتصال مشفر وآمن عبر Firebase Authentication'
            : 'Encrypted & secured via Firebase Authentication'}
        </p>
      </div>
    </div>
  );
};
