import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminUserData,
  AdminInvoiceSummary,
  AdminStats,
  Language,
  Invoice,
} from '../types/invoice';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  fetchAdminData,
  updateUserAccountStatus,
  sendUserPasswordReset,
  deleteUserFirestoreData,
} from '../lib/firestoreService';
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Search,
  Eye,
  RefreshCw,
  Building2,
  TrendingUp,
  ShieldCheck,
  Phone,
  Mail,
  Receipt,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Filter,
  KeyRound,
  Trash2,
  Ban,
  Check,
  Copy,
  ExternalLink,
  Info,
  X,
  Lock,
} from 'lucide-react';

interface AdminDashboardProps {
  lang: Language;
  onViewInvoice: (invoice: Invoice) => void;
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  onViewInvoice,
  onBackToApp,
}) => {
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoiceSummary[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInvoices: 0,
    totalInvoiceValue: 0,
    thisMonthInvoices: 0,
    thisMonthValue: 0,
    paidValue: 0,
    unpaidValue: 0,
  });

  // Navigation tab inside Admin: 'overview' | 'users' | 'invoices'
  const [subTab, setSubTab] = useState<'overview' | 'users' | 'invoices'>('overview');

  // Search and filter states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');

  // Modal drill-downs and confirmation dialogs
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserData | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'activate' | 'reset-password' | 'delete-data';
    user: AdminUserData;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
    showToast(isAr ? 'تم نسخ UID بنجاح' : 'UID copied to clipboard', 'info');
  };

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetchAdminData();
      setUsers(res.users);
      setInvoices(res.invoices);
      setStats(res.stats);
    } catch (err: any) {
      console.warn('Admin data load notice:', err);
      setError(
        isAr
          ? 'تعذر تحميل كامل بيانات الإدارة من السيرفر. تم تفعيل نمط الاسترجاع الآمن.'
          : 'Could not load complete admin data. Secure fallback mode active.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) {
        return false;
      }

      // Search term
      if (userSearchTerm.trim()) {
        const term = userSearchTerm.toLowerCase();
        const matchEmail = u.email?.toLowerCase().includes(term);
        const matchUid = u.uid.toLowerCase().includes(term);
        const matchCompany = u.companyName?.toLowerCase().includes(term) || u.companyNameAr?.toLowerCase().includes(term);
        const matchPhone = u.phone?.toLowerCase().includes(term);
        const matchVat = u.vatNumber?.toLowerCase().includes(term);
        if (!matchEmail && !matchUid && !matchCompany && !matchPhone && !matchVat) {
          return false;
        }
      }

      return true;
    });
  }, [users, userSearchTerm, userStatusFilter]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (invoiceStatusFilter !== 'ALL' && inv.paymentStatus !== invoiceStatusFilter) {
        return false;
      }

      // Search term
      if (invoiceSearchTerm.trim()) {
        const term = invoiceSearchTerm.toLowerCase();
        const matchNumber = inv.invoiceNumber?.toLowerCase().includes(term);
        const matchCustomer = inv.customerName?.toLowerCase().includes(term);
        const matchUser = inv.userEmail?.toLowerCase().includes(term) || inv.userCompanyName?.toLowerCase().includes(term);
        const matchCity = inv.city?.toLowerCase().includes(term);
        if (!matchNumber && !matchCustomer && !matchUser && !matchCity) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, invoiceStatusFilter, invoiceSearchTerm]);

  // Invoices belonging to currently viewed user in Details Modal
  const selectedUserInvoices = useMemo(() => {
    if (!selectedUserDetails) return [];
    return invoices.filter((inv) => inv.userUid === selectedUserDetails.uid);
  }, [invoices, selectedUserDetails]);

  // Monthly breakdown statistics
  const monthlyStats = useMemo(() => {
    const map: { [month: string]: { count: number; value: number } } = {};
    invoices.forEach((inv) => {
      const monthKey = inv.invoiceDate ? inv.invoiceDate.substring(0, 7) : 'Unknown';
      if (!map[monthKey]) {
        map[monthKey] = { count: 0, value: 0 };
      }
      map[monthKey].count += 1;
      map[monthKey].value += Number(inv.total) || 0;
    });

    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6);
  }, [invoices]);

  // Perform confirmed admin actions
  const handleExecuteAction = async () => {
    if (!actionModal) return;
    const { type, user } = actionModal;
    setIsProcessingAction(true);

    try {
      if (type === 'suspend') {
        await updateUserAccountStatus(user.uid, 'suspended');
        showToast(
          isAr
            ? `تم تعليق حساب المستخدم (${user.email}) بنجاح`
            : `User account (${user.email}) suspended successfully`,
          'success'
        );
      } else if (type === 'activate') {
        await updateUserAccountStatus(user.uid, 'active');
        showToast(
          isAr
            ? `تمت إعادة تفعيل حساب المستخدم (${user.email}) بنجاح`
            : `User account (${user.email}) activated successfully`,
          'success'
        );
      } else if (type === 'reset-password') {
        await sendUserPasswordReset(user.email);
        showToast(
          isAr
            ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد: ${user.email}`
            : `Password reset link sent successfully to: ${user.email}`,
          'success'
        );
      } else if (type === 'delete-data') {
        const result = await deleteUserFirestoreData(user.uid);
        showToast(
          isAr
            ? `تم حذف بيانات Firestore بنجاح (تم حذف ${result.deletedInvoicesCount} فاتورة)`
            : `Firestore data deleted (${result.deletedInvoicesCount} invoices removed)`,
          'success'
        );
        if (selectedUserDetails?.uid === user.uid) {
          setSelectedUserDetails(null);
        }
      }

      setActionModal(null);
      await loadData(true);
    } catch (err: any) {
      console.error('Admin action error:', err);
      showToast(
        err.message || (isAr ? 'فشل تنفيذ الإجراء المطلوب' : 'Failed to execute requested action'),
        'error'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-sm animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {isAr ? 'جاري تحميل لوحة تحكم وإدارة المستخدمين...' : 'Loading User Management Portal...'}
        </p>
        <span className="text-xs text-slate-400 mt-1">
          {isAr ? 'جمع بيانات الحسابات، الصلاحيات، وسجلات الفواتير' : 'Aggregating registered accounts and records'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {isAr ? 'لوحة تحكم وإدارة المستخدمين' : 'User Management & Admin Portal'}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'مدير النظام' : 'Authorized Admin'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة حسابات المنصة، تفعيل وتعليق المستخدمين، إعادة تعيين كلمات المرور، ومتابعة الفواتير'
                : 'Manage platform users, suspend/activate access, trigger password resets, and monitor invoices'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all border border-slate-700 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
          </button>

          <button
            onClick={onBackToApp}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-xs"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            <span>{isAr ? 'العودة للتطبيق' : 'Back to Invoices'}</span>
          </button>
        </div>
      </div>

      {/* Notice / Limitation Clarification Banner */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-start gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-900">
            {isAr ? 'إشعار المعمارية التقنية: ' : 'Architectural Note: '}
          </span>
          {isAr
            ? 'تتيح هذه اللوحة إدارة سجلات المستخدمين وفواتيرهم، تعليق الحسابات وحظر صلاحياتها فوراً، وإرسال روابط إعادة تعيين كلمات المرور عبر بريد Firebase الرسمي. لا يمكن عرض كلمة مرور أي مستخدم لحماية الخصوصية.'
            : 'This portal manages Firestore user profiles, suspends access via security rules, and triggers official Firebase password reset emails. Actual passwords can never be viewed or retrieved.'}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center bg-slate-200/90 p-1 rounded-xl shadow-inner border border-slate-300/60 max-w-md">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex-1 min-h-[38px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'نظرة عامة' : 'Overview'}</span>
        </button>

        <button
          onClick={() => setSubTab('users')}
          className={`flex-1 min-h-[38px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'users'
              ? 'bg-white text-slate-900 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'دليل المستخدمين' : 'Users Directory'}</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('invoices')}
          className={`flex-1 min-h-[38px] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'invoices'
              ? 'bg-white text-slate-900 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'الفواتير' : 'Invoices'}</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full font-bold">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: OVERVIEW & PLATFORM STATS */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Statistic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Registered Users */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? 'إجمالي المستخدمين' : 'Total Users'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.totalUsers}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-500" />
                <span>
                  {users.filter((u) => u.status !== 'suspended').length} {isAr ? 'حساب نشط' : 'active accounts'}
                </span>
              </p>
            </div>

            {/* 2. Total Invoices Generated */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? 'إجمالي الفواتير' : 'Total Invoices'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.totalInvoices}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {stats.thisMonthInvoices} {isAr ? 'فاتورة هذا الشهر' : 'invoices this month'}
                </span>
              </p>
            </div>

            {/* 3. Total Billed Volume (SAR) */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? 'إجمالي المبالغ' : 'Total Billed'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-emerald-700 tracking-tight font-mono">
                {formatCurrency(stats.totalInvoiceValue, lang)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{isAr ? 'شامل ضريبة القيمة المضافة' : 'VAT 15% Included'}</span>
              </p>
            </div>

            {/* 4. This Month's Revenue Volume */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? 'مبالغ هذا الشهر' : 'This Month Value'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-purple-700 tracking-tight font-mono">
                {formatCurrency(stats.thisMonthValue, lang)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span>{isAr ? 'الشهر الجاري' : 'Current calendar month'}</span>
              </p>
            </div>
          </div>

          {/* Monthly Invoicing Volume & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAr ? 'الإحصائيات الشهرية للفواتير' : 'Monthly Invoicing & Revenue'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAr ? 'تطور الفواتير والمبالغ خلال الأشهر الأخيرة' : 'Recent monthly volume and performance'}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>

              {monthlyStats.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {isAr ? 'لا توجد فواتير كافية لعرض الإحصائيات' : 'No invoices available yet'}
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyStats.map(([month, data]) => {
                    const percentOfTotal =
                      stats.totalInvoiceValue > 0
                        ? Math.min(100, Math.round((data.value / stats.totalInvoiceValue) * 100))
                        : 0;
                    return (
                      <div key={month} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-800">{month}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">
                              {data.count} {isAr ? 'فاتورة' : 'invoices'}
                            </span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatCurrency(data.value, lang)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentOfTotal}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paid vs Unpaid Settlement Ratio */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-800 block">
                    {isAr ? 'الفواتير المدفوعة (مسددة)' : 'Paid Invoices'}
                  </span>
                  <span className="text-base font-extrabold text-emerald-900 font-mono">
                    {formatCurrency(stats.paidValue, lang)}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-800 block">
                    {isAr ? 'المبالغ غير المسددة / المعلقة' : 'Unpaid / Pending'}
                  </span>
                  <span className="text-base font-extrabold text-amber-900 font-mono">
                    {formatCurrency(stats.unpaidValue, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick User Roster */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    {isAr ? 'أعلى الحسابات نشاطاً' : 'Top Active Accounts'}
                  </h3>
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>

                <div className="divide-y divide-slate-100">
                  {users.slice(0, 5).map((u) => (
                    <div
                      key={u.uid}
                      onClick={() => setSelectedUserDetails(u)}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {u.companyName || u.companyNameAr || (isAr ? 'مستخدم جديد' : 'New User')}
                          </p>
                          {u.status === 'suspended' && (
                            <span className="text-[9px] px-1 bg-rose-100 text-rose-700 rounded font-bold">
                              {isAr ? 'معلق' : 'Suspended'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-mono">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-xs font-semibold text-emerald-700 block">
                          {formatCurrency(u.totalInvoiced, lang)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {u.invoiceCount} {isAr ? 'فاتورة' : 'inv.'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSubTab('users')}
                className="mt-4 w-full py-2.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <span>{isAr ? 'عرض وإدارة كافة المستخدمين' : 'View & Manage All Users'}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL USERS DIRECTORY & MANAGEMENT */}
      {subTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          {/* Search & Filters Ribbon */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث بالبريد الإلكتروني، UID، اسم الشركة، الجوال...'
                    : 'Search by Email, UID, Company, Phone...'
                }
                className="w-full pl-9 pr-4 py-2.5 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs font-medium"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setUserStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  userStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({users.length})
              </button>
              <button
                onClick={() => setUserStatusFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  userStatusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{isAr ? 'نشط' : 'Active'}</span>
              </button>
              <button
                onClick={() => setUserStatusFilter('suspended')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  userStatusFilter === 'suspended'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>{isAr ? 'معلق' : 'Suspended'}</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                  <th className="py-3 px-4">{isAr ? 'المستخدم / الشركة' : 'User / Company'}</th>
                  <th className="py-3 px-4">{isAr ? 'البريد الإلكتروني و UID' : 'Email & UID'}</th>
                  <th className="py-3 px-4">{isAr ? 'التسجيل وآخر دخول' : 'Registered / Last Login'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'الفواتير' : 'Invoices'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? 'المبالغ' : 'Total SAR'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات الإدارة' : 'Admin Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      {isAr ? 'لم يتم العثور على مستخدمين مطابقين لمعايير البحث' : 'No users match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuspended = u.status === 'suspended';
                    return (
                      <tr key={u.uid} className={`hover:bg-slate-50/80 transition-colors ${isSuspended ? 'bg-rose-50/20' : ''}`}>
                        {/* Company & Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {u.companyName || u.companyNameAr || (isAr ? 'حساب مستخدم' : 'User Account')}
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Email & UID with copy */}
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-medium text-slate-900 flex items-center gap-1.5 font-mono">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.email || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                            <span>UID: {u.uid.slice(0, 12)}...</span>
                            <button
                              onClick={() => handleCopyUid(u.uid)}
                              title="Copy full UID"
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                            >
                              {copiedUid === u.uid ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Registered Date & Last Login */}
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          <div>
                            <span className="text-slate-400">{isAr ? 'انضم: ' : 'Reg: '}</span>
                            <span>{u.createdAt ? formatDate(u.createdAt.substring(0, 10)) : '-'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            <span>{isAr ? 'آخر دخول: ' : 'Login: '}</span>
                            <span>{u.lastLoginAt ? formatDate(u.lastLoginAt.substring(0, 10)) : '-'}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            />
                            <span>{isSuspended ? (isAr ? 'معلق' : 'Suspended') : isAr ? 'نشط' : 'Active'}</span>
                          </span>
                        </td>

                        {/* Invoices Count */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs">
                            {u.invoiceCount}
                          </span>
                        </td>

                        {/* Total SAR */}
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono">
                          {formatCurrency(u.totalInvoiced, lang)}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => setSelectedUserDetails(u)}
                              title={isAr ? 'عرض تفاصيل الحساب' : 'View User Details'}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password Email */}
                            <button
                              onClick={() => setActionModal({ type: 'reset-password', user: u })}
                              title={isAr ? 'إرسال رابط إعادة تعيين كلمة المرور' : 'Send Password Reset Email'}
                              className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspend / Activate Toggle */}
                            {isSuspended ? (
                              <button
                                onClick={() => setActionModal({ type: 'activate', user: u })}
                                title={isAr ? 'إلغاء التعليق وتفعيل الحساب' : 'Activate User'}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionModal({ type: 'suspend', user: u })}
                                title={isAr ? 'تعليق حساب المستخدم' : 'Suspend User'}
                                className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Firestore Data */}
                            <button
                              onClick={() => setActionModal({ type: 'delete-data', user: u })}
                              title={isAr ? 'حذف بيانات الـ Firestore للمستخدم' : 'Delete Firestore Data'}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {isAr ? 'لم يتم العثور على مستخدمين' : 'No users found.'}
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSuspended = u.status === 'suspended';
                return (
                  <div key={u.uid} className={`p-4 space-y-3 ${isSuspended ? 'bg-rose-50/20' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {u.companyName || u.companyNameAr || (isAr ? 'حساب مستخدم' : 'User Account')}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSuspended ? (isAr ? 'معلق' : 'Suspended') : isAr ? 'نشط' : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'عدد الفواتير' : 'Invoices'}</span>
                        <span className="font-bold text-slate-900">{u.invoiceCount}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'إجمالي المبالغ' : 'Total Invoiced'}</span>
                        <span className="font-bold text-emerald-700 font-mono">{formatCurrency(u.totalInvoiced, lang)}</span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        onClick={() => setSelectedUserDetails(u)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'عرض' : 'View'}</span>
                      </button>

                      <button
                        onClick={() => setActionModal({ type: 'reset-password', user: u })}
                        className="py-1.5 px-2 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{isAr ? 'استعادة' : 'Reset'}</span>
                      </button>

                      {isSuspended ? (
                        <button
                          onClick={() => setActionModal({ type: 'activate', user: u })}
                          className="py-1.5 px-2 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تفعيل' : 'Active'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionModal({ type: 'suspend', user: u })}
                          className="py-1.5 px-2 bg-amber-50 text-amber-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تعليق' : 'Suspend'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActionModal({ type: 'delete-data', user: u })}
                        className="py-1.5 px-2 bg-rose-50 text-rose-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: INVOICES REPOSITORY */}
      {subTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Invoices Filters Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  placeholder={
                    isAr
                      ? 'بحث برقم الفاتورة، العميل، الشركة، المدينة...'
                      : 'Search by invoice #, customer, user, city...'
                  }
                  className="w-full pl-9 pr-4 py-2.5 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs font-medium"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 w-full sm:w-auto overflow-x-auto shadow-2xs">
                {['ALL', 'Paid', 'Unpaid', 'Overdue'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      invoiceStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL'
                      ? isAr
                        ? 'الكل'
                        : 'All'
                      : st === 'Paid'
                      ? isAr
                        ? 'مدفوعة'
                        : 'Paid'
                      : st === 'Unpaid'
                      ? isAr
                        ? 'غير مدفوعة'
                        : 'Unpaid'
                      : isAr
                      ? 'متأخرة'
                      : 'Overdue'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-bold self-end md:self-auto font-mono">
              {filteredInvoices.length} {isAr ? 'فاتورة' : 'invoices'}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                  <th className="py-3 px-4">{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="py-3 px-4">{isAr ? 'المستخدم / المُنشئ' : 'Created By (User)'}</th>
                  <th className="py-3 px-4">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="py-3 px-4">{isAr ? 'التاريخ والمدينة' : 'Date & City'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'حالة السداد' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? 'المبلغ الإجمالي' : 'Total (SAR)'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'معاينة' : 'Preview'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      {isAr ? 'لم يتم العثور على فواتير مطابقة' : 'No matching invoices found.'}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {inv.userCompanyName || (isAr ? 'مستخدم' : 'User')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                          {inv.userEmail}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{inv.customerName || '-'}</div>
                        {inv.customerPhone && (
                          <div className="text-[11px] text-slate-500">{inv.customerPhone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div>{formatDate(inv.invoiceDate)}</div>
                        <div className="text-slate-400">{inv.city || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentStatus === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono">
                        {formatCurrency(inv.total, lang)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title={isAr ? 'معاينة تفاصيل الفاتورة كاملة' : 'Preview Full Invoice'}
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isAr ? 'معاينة' : 'View'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL (DRILL-DOWN) */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedUserDetails.companyName || selectedUserDetails.companyNameAr || (isAr ? 'ملف المستخدم' : 'User Account')}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedUserDetails.status === 'suspended'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedUserDetails.status === 'suspended' ? (isAr ? 'معلق' : 'Suspended') : isAr ? 'نشط' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                  <span>{selectedUserDetails.email}</span>
                  <span>•</span>
                  <span>UID: {selectedUserDetails.uid}</span>
                  <button
                    onClick={() => handleCopyUid(selectedUserDetails.uid)}
                    title="Copy UID"
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    {copiedUid === selectedUserDetails.uid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6">
              {/* Account Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">{isAr ? 'عدد الفواتير' : 'Invoices Count'}</span>
                  <span className="text-lg font-extrabold text-slate-900">{selectedUserDetails.invoiceCount}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">{isAr ? 'إجمالي المبالغ' : 'Total Invoiced'}</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {formatCurrency(selectedUserDetails.totalInvoiced, lang)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">{isAr ? 'تاريخ التسجيل' : 'Registered Date'}</span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedUserDetails.createdAt ? formatDate(selectedUserDetails.createdAt.substring(0, 10)) : '-'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">{isAr ? 'آخر تسجيل دخول' : 'Last Login'}</span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedUserDetails.lastLoginAt ? formatDate(selectedUserDetails.lastLoginAt.substring(0, 10)) : '-'}
                  </span>
                </div>
              </div>

              {/* Profile Details */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  {isAr ? 'بيانات الملف التجاري' : 'Business Profile Data'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'اسم الشركة (English):' : 'Company Name (EN):'}</span>
                    <span className="font-medium text-slate-800">{selectedUserDetails.companyName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'اسم الشركة (العربية):' : 'Company Name (AR):'}</span>
                    <span className="font-medium text-slate-800">{selectedUserDetails.companyNameAr || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'رقم الجوال:' : 'Phone Number:'}</span>
                    <span className="font-medium text-slate-800">{selectedUserDetails.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'الرقم الضريبي:' : 'VAT Number:'}</span>
                    <span className="font-medium text-slate-800 font-mono">{selectedUserDetails.vatNumber || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">{isAr ? 'العنوان / الموقع:' : 'Address:'}</span>
                    <span className="font-medium text-slate-800">{selectedUserDetails.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside User Details */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                {/* Reset Password */}
                <button
                  onClick={() => setActionModal({ type: 'reset-password', user: selectedUserDetails })}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال رابط استعادة كلمة المرور' : 'Send Password Reset Email'}</span>
                </button>

                {/* Suspend / Activate Toggle */}
                {selectedUserDetails.status === 'suspended' ? (
                  <button
                    onClick={() => setActionModal({ type: 'activate', user: selectedUserDetails })}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تفعيل الحساب' : 'Activate Account'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActionModal({ type: 'suspend', user: selectedUserDetails })}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تعليق الحساب' : 'Suspend Account'}</span>
                  </button>
                )}

                {/* Delete Firestore Data */}
                <button
                  onClick={() => setActionModal({ type: 'delete-data', user: selectedUserDetails })}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حذف بيانات Firestore' : 'Delete Firestore Data'}</span>
                </button>
              </div>

              {/* User Invoices Table */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                  <span>{isAr ? 'فواتير هذا المستخدم' : "User's Invoices"}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {selectedUserInvoices.length} {isAr ? 'فاتورة' : 'invoices'}
                  </span>
                </h4>

                {selectedUserInvoices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                    {isAr ? 'لم يقم هذا المستخدم بإنشاء أي فواتير بعد' : 'No invoices created by this user yet.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'العميل' : 'Customer'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                          <th className="py-2.5 px-3 text-right">{isAr ? 'المبلغ' : 'Amount'}</th>
                          <th className="py-2.5 px-3 text-center">{isAr ? 'معاينة' : 'Preview'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedUserInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold">{inv.invoiceNumber}</td>
                            <td className="py-2.5 px-3 font-medium">{inv.customerName || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{formatDate(inv.invoiceDate)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inv.paymentStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono">
                              {formatCurrency(inv.total, lang)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => onViewInvoice(inv)}
                                className="p-1 text-slate-500 hover:text-emerald-700"
                                title="View Invoice"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION DIALOG (SUSPEND / ACTIVATE / RESET-PASSWORD / DELETE) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Dialog Icon */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                actionModal.type === 'delete-data'
                  ? 'bg-rose-100 text-rose-600'
                  : actionModal.type === 'suspend'
                  ? 'bg-amber-100 text-amber-600'
                  : actionModal.type === 'activate'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {actionModal.type === 'delete-data' && <Trash2 className="w-6 h-6" />}
              {actionModal.type === 'suspend' && <Ban className="w-6 h-6" />}
              {actionModal.type === 'activate' && <CheckCircle2 className="w-6 h-6" />}
              {actionModal.type === 'reset-password' && <KeyRound className="w-6 h-6" />}
            </div>

            {/* Dialog Title & Message */}
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {actionModal.type === 'suspend' && (isAr ? 'تأكيد تعليق الحساب' : 'Confirm Account Suspension')}
                {actionModal.type === 'activate' && (isAr ? 'تأكيد تفعيل الحساب' : 'Confirm Account Activation')}
                {actionModal.type === 'reset-password' && (isAr ? 'إرسال رابط إعادة تعيين كلمة المرور' : 'Send Password Reset Email')}
                {actionModal.type === 'delete-data' && (isAr ? 'حذف بيانات Firestore للمستخدم' : 'Delete User Firestore Data')}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {actionModal.type === 'suspend' &&
                  (isAr
                    ? `هل أنت متأكد من تعليق حساب المستخدم (${actionModal.user.email})؟ سيتم منعه من قراءة أو كتابة أي فواتير عبر سیکیورٹی رولز فائر بیس فوراً.`
                    : `Are you sure you want to suspend (${actionModal.user.email})? Security rules will immediately block them from creating or accessing invoices.`)}

                {actionModal.type === 'activate' &&
                  (isAr
                    ? `هل ترغب في إعادة تفعيل حساب المستخدم (${actionModal.user.email}) واستعادة كامل صلاحياته؟`
                    : `Do you want to re-activate account (${actionModal.user.email}) and restore full access?`)}

                {actionModal.type === 'reset-password' &&
                  (isAr
                    ? `سيتم إرسال رابط آمن ومباشر من خوادم Firebase إلى البريد الإلكتروني: ${actionModal.user.email} لتمكينه من تعيين كلمة مرور جديدة.`
                    : `An official secure Firebase password reset link will be emailed to: ${actionModal.user.email}.`)}

                {actionModal.type === 'delete-data' && (
                  <span className="block text-rose-600 font-semibold">
                    {isAr
                      ? `⚠️ تحذير: سيتم حذف ملف هذا المستخدم في Firestore وكافة فواتيره (${actionModal.user.invoiceCount} فاتورة) بشكل دائم. ملاحظة: هذا الإجراء لا يحذف حساب الدخول في Firebase Auth.`
                      : `⚠️ Warning: This permanently deletes this user's profile and all (${actionModal.user.invoiceCount}) invoices from Firestore. Note: Due to Client SDK boundaries, their Firebase Auth login account remains in Firebase Console.`}
                  </span>
                )}
              </p>
            </div>

            {/* Dialog Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isProcessingAction}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl text-white transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  actionModal.type === 'delete-data'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : actionModal.type === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isProcessingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionModal.type === 'delete-data'
                    ? isAr
                      ? 'نعم، احذف البيانات'
                      : 'Yes, Delete Data'
                    : actionModal.type === 'suspend'
                    ? isAr
                      ? 'نعم، علّق الحساب'
                      : 'Yes, Suspend'
                    : actionModal.type === 'activate'
                    ? isAr
                      ? 'نعم، فعّل الحساب'
                      : 'Yes, Activate'
                    : isAr
                    ? 'إرسال الرابط'
                    : 'Send Link'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
