import React, { useState, useMemo } from 'react';
import { Invoice, PaymentStatus, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import {
  formatCurrency,
  formatDate,
  SAUDI_CITIES,
  SAUDI_CITIES_AR,
  BOOM_TRUCK_CAPACITIES,
} from '../utils/formatters';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  FileDown,
  Share2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  lang: Language;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice) => void;
  onShareWhatsApp: (invoice: Invoice) => void;
  onNew: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  lang,
  onView,
  onEdit,
  onDelete,
  onDownloadPdf,
  onPrint,
  onShareWhatsApp,
  onNew,
}) => {
  const t = translations[lang];

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [capacityFilter, setCapacityFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  // Unique customers for the customer filter dropdown
  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.customerName.trim()) set.add(inv.customerName.trim());
    });
    return Array.from(set).sort();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        inv.city.toLowerCase().includes(term) ||
        (inv.customCity && inv.customCity.toLowerCase().includes(term)) ||
        inv.serviceDescription.toLowerCase().includes(term) ||
        inv.truckCapacity.toLowerCase().includes(term);

      // 2. Status filter
      const matchStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;

      // 3. City filter
      const matchCity = cityFilter === 'ALL' || inv.city === cityFilter;

      // 4. Capacity filter
      const matchCapacity = capacityFilter === 'ALL' || inv.truckCapacity === capacityFilter;

      // 5. Customer filter
      const matchCustomer = customerFilter === 'ALL' || inv.customerName === customerFilter;

      // 6. Date filter
      let matchDate = true;
      if (dateFilter !== 'ALL') {
        const invDate = new Date(inv.invoiceDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'TODAY') {
          matchDate = inv.invoiceDate === today.toISOString().split('T')[0];
        } else if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchDate = invDate >= sevenDaysAgo;
        } else if (dateFilter === 'THIS_MONTH') {
          matchDate =
            invDate.getMonth() === today.getMonth() &&
            invDate.getFullYear() === today.getFullYear();
        }
      }

      return matchSearch && matchStatus && matchCity && matchCapacity && matchCustomer && matchDate;
    });
  }, [invoices, searchTerm, statusFilter, cityFilter, capacityFilter, customerFilter, dateFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('ALL');
    setStatusFilter('ALL');
    setCityFilter('ALL');
    setCapacityFilter('ALL');
    setCustomerFilter('ALL');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    dateFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    cityFilter !== 'ALL' ||
    capacityFilter !== 'ALL' ||
    customerFilter !== 'ALL';

  const renderStatus = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {t.paid}
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <Clock className="w-3 h-3" />
            {t.partiallyPaid}
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            {t.overdue}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Ban className="w-3 h-3" />
            {t.unpaid}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t.invoiceHistoryTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? `عرض ${filteredInvoices.length} من إجمالي ${invoices.length} فاتورة`
              : `Showing ${filteredInvoices.length} of ${invoices.length} invoices`}
          </p>
        </div>

        <button
          onClick={onNew}
          className="flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newInvoice}</span>
        </button>
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 min-h-[40px] text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
          />
        </div>

        {/* 5 Filters Grid: Date, Customer, Status, City, Capacity */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {t.filterDate}
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2 py-1.5 min-h-[38px] text-xs rounded-md border border-slate-300 bg-white"
            >
              <option value="ALL">{t.allDates}</option>
              <option value="TODAY">{t.today}</option>
              <option value="LAST_7_DAYS">{t.last7Days}</option>
              <option value="THIS_MONTH">{t.thisMonth}</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {t.filterCustomer}
            </label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-2 py-1.5 min-h-[38px] text-xs rounded-md border border-slate-300 bg-white truncate"
            >
              <option value="ALL">{t.all}</option>
              {uniqueCustomers.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {t.filterStatus}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 min-h-[38px] text-xs rounded-md border border-slate-300 bg-white"
            >
              <option value="ALL">{t.allStatuses}</option>
              <option value="Unpaid">{t.unpaid}</option>
              <option value="Partially Paid">{t.partiallyPaid}</option>
              <option value="Paid">{t.paid}</option>
              <option value="Overdue">{t.overdue}</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {t.filterCity}
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-2 py-1.5 min-h-[38px] text-xs rounded-md border border-slate-300 bg-white"
            >
              <option value="ALL">{t.allCities}</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>
                  {lang === 'ar' ? SAUDI_CITIES_AR[c] || c : c}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity Filter */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              {t.filterCapacity}
            </label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="w-full px-2 py-1.5 min-h-[38px] text-xs rounded-md border border-slate-300 bg-white"
            >
              <option value="ALL">{t.allCapacities}</option>
              {BOOM_TRUCK_CAPACITIES.map((cap) => (
                <option key={cap} value={cap}>
                  {lang === 'ar' ? cap.replace('Ton', 'طن') : cap}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {filteredInvoices.length} {lang === 'ar' ? 'نتائج مطابقة' : 'matching records'}
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'ar' ? 'إعادة ضبط التصفية' : 'Reset Filters'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Columns: Invoice No. | Date | Customer | Location | Capacity | Subtotal | VAT | Total | Status | Actions */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{t.noInvoicesFound}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.createYourFirst}</p>
          <button
            onClick={onNew}
            className="px-4 py-2 min-h-[40px] text-xs font-bold rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newInvoice}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                  <th className="py-3 px-3">Invoice No.</th>
                  <th className="py-3 px-2.5">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-2.5">Location</th>
                  <th className="py-3 px-2.5 text-center">Capacity</th>
                  <th className="py-3 px-2.5 text-right rtl:text-left">Subtotal</th>
                  <th className="py-3 px-2.5 text-right rtl:text-left">VAT</th>
                  <th className="py-3 px-2.5 text-right rtl:text-left">Total</th>
                  <th className="py-3 px-2.5 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => {
                  const city =
                    inv.city === 'Other' && inv.customCity ? inv.customCity : inv.city;
                  const displayCity = lang === 'ar' ? SAUDI_CITIES_AR[city] || city : city;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice No */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-2.5 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(inv.invoiceDate)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-[170px] truncate">
                        {inv.customerName}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-2.5 text-slate-600 whitespace-nowrap">
                        {displayCity}
                      </td>

                      {/* Capacity */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 font-bold text-[10px] bg-amber-100 text-amber-900 rounded">
                          {inv.truckCapacity}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-2.5 text-right rtl:text-left font-mono tabular-nums text-slate-600">
                        {formatCurrency(inv.subtotal, lang)}
                      </td>

                      {/* VAT */}
                      <td className="py-3 px-2.5 text-right rtl:text-left font-mono tabular-nums text-slate-600">
                        {formatCurrency(inv.vatAmount, lang)}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-2.5 text-right rtl:text-left font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(inv.total, lang)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {renderStatus(inv.paymentStatus)}
                      </td>

                      {/* Actions: View | Edit | PDF | WhatsApp | Delete */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onView(inv)}
                            title={t.viewInvoice}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(inv)}
                            title={t.editInvoice}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDownloadPdf(inv)}
                            title={t.downloadPdf}
                            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onShareWhatsApp(inv)}
                            title={t.shareWhatsapp}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  lang === 'ar'
                                    ? `هل تريد حذف الفاتورة ${inv.invoiceNumber}؟`
                                    : `Delete invoice ${inv.invoiceNumber}?`
                                )
                              ) {
                                onDelete(inv.id);
                              }
                            }}
                            title={t.deleteInvoice}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
