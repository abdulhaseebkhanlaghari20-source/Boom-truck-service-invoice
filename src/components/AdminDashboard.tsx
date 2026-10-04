import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminUserData,
  AdminInvoiceSummary,
  AdminStats,
  Language,
  Invoice,
} from '../types/invoice';
import { formatCurrency, formatDate } from '../utils/formatters';
import { fetchAdminData } from '../lib/firestoreService';
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
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Filter,
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
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');

  // Selected user drill-down
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);

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
      console.error('Admin data load error:', err);
      setError(
        isAr
          ? 'تعذر تحميل بيانات الإدارة. يرجى التحقق من أذونات السيرفر أو الاتصال.'
          : 'Could not load admin platform data. Please check Firestore permissions.'
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
    if (!userSearchTerm.trim()) return users;
    const term = userSearchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.companyName?.toLowerCase().includes(term) ||
        u.companyNameAr?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.vatNumber?.toLowerCase().includes(term) ||
        u.uid.toLowerCase().includes(term)
    );
  }, [users, userSearchTerm]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // If a user drill-down is selected
      if (selectedUser && inv.userUid !== selectedUser.uid) {
        return false;
      }

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
  }, [invoices, selectedUser, invoiceStatusFilter, invoiceSearchTerm]);

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

  const handleSelectUser = (user: AdminUserData) => {
    setSelectedUser(user);
    setSubTab('invoices');
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-sm animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {isAr ? 'جاري تحميل لوحة تحكم الإدارة...' : 'Loading Admin Portal & Analytics...'}
        </p>
        <span className="text-xs text-slate-400 mt-1">
          {isAr ? 'جمع بيانات المستخدمين والفواتير من السيرفر' : 'Aggregating registered users and invoices'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {isAr ? 'لوحة تحكم الإدارة العامة' : 'Central Admin Dashboard'}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'مدير النظام' : 'Authorized Admin'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {isAr
                ? 'إحصائيات المنصة، متابعة المستخدمين، وسجل فواتير شاحنات الرافعة'
                : 'Platform analytics, registered businesses, and total heavy equipment invoicing'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
          </button>

          <button
            onClick={onBackToApp}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            <span>{isAr ? 'العودة للفواتير' : 'Back to App'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* KPI Statistic Cards (Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Registered Users */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isAr ? 'إجمالي المستخدمين' : 'Total Registered Users'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalUsers}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-500" />
            <span>{isAr ? 'حسابات مسجلة ونشطة' : 'Active user accounts'}</span>
          </p>
        </div>

        {/* 2. Total Invoices */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
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
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{isAr ? 'منشأة عبر المنصة' : 'Generated across system'}</span>
          </p>
        </div>

        {/* 3. Total Invoice Value (SAR) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isAr ? 'إجمالي المبالغ' : 'Total Volume'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {formatCurrency(stats.totalInvoiceValue, lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span>{isAr ? 'شامل ضريبة القيمة المضافة' : 'Gross invoiced volume'}</span>
          </p>
        </div>

        {/* 4. This Month's Invoices */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isAr ? 'فواتير هذا الشهر' : "This Month's Invoices"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.thisMonthInvoices}
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-1 truncate">
            {formatCurrency(stats.thisMonthValue, lang)}
          </p>
        </div>
      </div>

      {/* Segmented Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              subTab === 'overview'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'نظرة عامة وإحصائيات' : 'Overview & Monthly Stats'}
          </button>
          <button
            onClick={() => setSubTab('users')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'users'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل المستخدمين' : 'Users Directory'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'invoices'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل الفواتير العام' : 'Platform Invoices'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {invoices.length}
            </span>
          </button>
        </div>

        {selectedUser && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
            <span>
              {isAr ? 'تصفية حسب:' : 'Filtered user:'}{' '}
              <strong>{selectedUser.companyName || selectedUser.email}</strong>
            </span>
            <button
              onClick={handleClearSelectedUser}
              className="text-amber-800 hover:text-amber-950 font-bold ml-1 underline cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Clear'}
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: OVERVIEW & MONTHLY STATS */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Breakdown */}
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
                          <span className="font-bold text-slate-900">
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
              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-800 block">
                  {isAr ? 'الفواتير المدفوعة (مسددة)' : 'Paid Invoices'}
                </span>
                <span className="text-base font-extrabold text-emerald-900">
                  {formatCurrency(stats.paidValue, lang)}
                </span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                <span className="text-[11px] font-semibold text-amber-800 block">
                  {isAr ? 'المبالغ غير المسددة / المعلقة' : 'Unpaid / Pending'}
                </span>
                <span className="text-base font-extrabold text-amber-900">
                  {formatCurrency(stats.unpaidValue, lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Business Roster summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'أعلى الشركات نشاطاً' : 'Top Active Users'}
                </h3>
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>

              <div className="divide-y divide-slate-100">
                {users.slice(0, 5).map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => handleSelectUser(u)}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {u.companyName || u.companyNameAr || (isAr ? 'مستخدم جديد' : 'New User')}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                    <div className="text-right shrink-0">
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
              className="mt-4 w-full py-2 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>{isAr ? 'عرض كافة المستخدمين' : 'View all registered users'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: USERS DIRECTORY */}
      {subTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Search Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث بالاسم، البريد الإلكتروني، الجوال، الرقم الضريبي...'
                    : 'Search users by name, email, phone, VAT...'
                }
                className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div className="text-xs text-slate-500 self-end sm:self-auto font-medium">
              {filteredUsers.length} {isAr ? 'مستخدم مسجل' : 'users found'}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-semibold">
                  <th className="py-3 px-4">{isAr ? 'المستخدم / الشركة' : 'User / Company'}</th>
                  <th className="py-3 px-4">{isAr ? 'البريد والتواصل' : 'Email & Phone'}</th>
                  <th className="py-3 px-4">{isAr ? 'الرقم الضريبي' : 'VAT / CR'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'عدد الفواتير' : 'Invoices'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? 'إجمالي المبالغ' : 'Total Invoiced'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {isAr ? 'لم يتم العثور على مستخدمين مطابقين للبحث' : 'No matching users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {u.companyName || u.companyNameAr || (isAr ? 'مؤسسة غير مسماة' : 'Untitled Company')}
                        </div>
                        {u.companyNameAr && u.companyName && (
                          <div className="text-[11px] text-slate-500">{u.companyNameAr}</div>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">UID: {u.uid.slice(0, 10)}...</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{u.email || '-'}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        <div>{u.vatNumber ? `VAT: ${u.vatNumber}` : '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {u.invoiceCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(u.totalInvoiced, lang)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleSelectUser(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isAr ? 'عرض فواتيره' : 'Invoices'}</span>
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

      {/* VIEW 3: RECENT & PLATFORM INVOICES */}
      {subTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Invoices Filters Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
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
                  className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
                {['ALL', 'Paid', 'Unpaid', 'Overdue'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
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

            <div className="text-xs text-slate-500 font-medium self-end md:self-auto">
              {filteredInvoices.length} {isAr ? 'فاتورة' : 'invoices'}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-semibold">
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
                    <td colSpan={7} className="py-12 text-center text-slate-400">
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

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(inv.total, lang)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title={isAr ? 'معاينة تفاصيل الفاتورة كاملة' : 'Preview Full Invoice'}
                        >
                          <Eye className="w-3.5 h-3.5" />
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
    </div>
  );
};
