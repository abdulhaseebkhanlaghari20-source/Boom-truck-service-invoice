import React, { useMemo } from 'react';
import { Invoice, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  FileText,
  CalendarCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Receipt,
  TrendingUp,
  Plus,
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  lang: Language;
  onNew: () => void;
  onView: (invoice: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  lang,
  onNew,
  onView,
}) => {
  const t = translations[lang];

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let todayCount = 0;
    let monthCount = 0;
    let unpaidTotal = 0;
    let paidTotal = 0;
    let vatCollected = 0;

    invoices.forEach((inv) => {
      // Date checks
      if (inv.invoiceDate === todayStr) {
        todayCount++;
      }

      const invDate = new Date(inv.invoiceDate);
      if (
        invDate.getMonth() === currentMonth &&
        invDate.getFullYear() === currentYear
      ) {
        monthCount++;
      }

      // Money sums
      if (inv.paymentStatus === 'Paid') {
        paidTotal += inv.total;
        vatCollected += inv.vatAmount;
      } else if (inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Overdue') {
        unpaidTotal += inv.total;
      } else if (inv.paymentStatus === 'Partially Paid') {
        // Approximate 50% for partially paid
        paidTotal += inv.total * 0.5;
        unpaidTotal += inv.total * 0.5;
        vatCollected += inv.vatAmount * 0.5;
      }
    });

    return {
      totalInvoices: invoices.length,
      todayInvoices: todayCount,
      thisMonthInvoices: monthCount,
      unpaidAmount: unpaidTotal,
      paidAmount: paidTotal,
      vatCollected,
    };
  }, [invoices]);

  // Compute monthly invoice amount for the last 6 months for simple clean chart
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];

    const today = new Date();
    const data: { label: string; amount: number; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const label = lang === 'ar' ? monthsAr[mIdx] : `${months[mIdx]} '${String(yr).slice(2)}`;

      let sum = 0;
      let count = 0;

      invoices.forEach((inv) => {
        const invDate = new Date(inv.invoiceDate);
        if (invDate.getMonth() === mIdx && invDate.getFullYear() === yr) {
          sum += inv.total;
          count++;
        }
      });

      data.push({ label, amount: sum, count });
    }

    return data;
  }, [invoices, lang]);

  const maxMonthlyAmount = Math.max(...monthlyData.map((d) => d.amount), 5000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{t.dashboardTitle}</h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? 'مؤشرات أداء فواتير شاحنات الرافعة والتحصيل المالي'
              : 'Boom truck invoicing performance & financial summary'}
          </p>
        </div>

        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newInvoice}</span>
        </button>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Invoices */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">{t.totalInvoices}</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.totalInvoices}
          </div>
        </div>

        {/* Today's Invoices */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">{t.todayInvoices}</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
            {metrics.todayInvoices}
          </div>
        </div>

        {/* This Month's Invoices */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">{t.thisMonthInvoices}</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.thisMonthInvoices}
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">{t.paidAmount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono tabular-nums truncate">
            {formatCurrency(metrics.paidAmount, lang)}
          </div>
        </div>

        {/* Unpaid Amount */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">{t.unpaidAmount}</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-600 font-mono tabular-nums truncate">
            {formatCurrency(metrics.unpaidAmount, lang)}
          </div>
        </div>

        {/* VAT Collected */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-500">{t.vatCollected}</span>
            <Receipt className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums truncate">
            {formatCurrency(metrics.vatCollected, lang)}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">{t.monthlyChartTitle}</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">SAR</span>
        </div>

        {/* Responsive Bar Chart */}
        <div className="pt-2 pb-2">
          <div className="h-52 flex items-end justify-between gap-3 sm:gap-6 px-2">
            {monthlyData.map((item, idx) => {
              const heightPercent =
                maxMonthlyAmount > 0 ? Math.max(8, Math.round((item.amount / maxMonthlyAmount) * 100)) : 8;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip / Amount on top of bar */}
                  <span className="text-[10px] font-mono text-slate-600 opacity-80 group-hover:opacity-100 font-semibold tabular-nums text-center">
                    {item.amount > 0 ? `${(item.amount / 1000).toFixed(1)}k` : '0'}
                  </span>

                  {/* The Bar */}
                  <div className="w-full max-w-[48px] bg-slate-100 rounded-t-sm flex items-end overflow-hidden h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        idx === monthlyData.length - 1
                          ? 'bg-emerald-600 group-hover:bg-emerald-500'
                          : 'bg-slate-700 group-hover:bg-slate-600'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-[11px] font-medium text-slate-600 text-center whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Invoices Quick Access */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{t.recentInvoices}</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {invoices.slice(0, 4).map((inv) => (
            <div
              key={inv.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-2 rounded cursor-pointer"
              onClick={() => onView(inv)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDate(inv.invoiceDate)}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium">{inv.customerName}</div>
                <div className="text-[11px] text-slate-400">
                  {inv.city} · {inv.truckCapacity}
                </div>
              </div>

              <div className="text-right rtl:text-left">
                <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                  {formatCurrency(inv.total, lang)}
                </div>
                <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-1">
                  {inv.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
