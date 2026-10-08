import React, { useState } from 'react';
import { Customer, Language } from '../types/invoice';
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Building,
} from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSelectCustomerForInvoice?: (customer: Customer) => void;
  lang: Language;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerForInvoice,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setNameAr('');
    setPhone('');
    setEmail('');
    setAddress('');
    setVatNumber('');
    setCrNumber('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name || '');
    setNameAr(c.nameAr || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setVatNumber(c.vatNumber || '');
    setCrNumber(c.crNumber || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !nameAr.trim()) return;

    const customerToSave: Customer = {
      id: editingCustomer?.id || `cust-${Date.now()}`,
      companyId: editingCustomer?.companyId || '',
      name: name.trim() || nameAr.trim(),
      nameAr: nameAr.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      vatNumber: vatNumber.trim(),
      crNumber: crNumber.trim(),
      notes: notes.trim(),
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(customerToSave);
    setModalOpen(false);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameAr && c.nameAr.includes(q)) ||
      c.phone.includes(q) ||
      (c.vatNumber && c.vatNumber.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'ar' ? 'إدارة العملاء' : 'Customer Database'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? 'قاعدة بيانات عملاء الشركة - اختر العميل بضغطة زر عند إصدار الفاتورة'
              : 'Isolated customer directory for your company workspace'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
        <input
          type="text"
          placeholder={lang === 'ar' ? 'بحث بالاسم، رقم الجوال، أو الرقم الضريبي...' : 'Search by customer name, phone, or VAT...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
        />
      </div>

      {/* Customers Grid / List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {search ? (lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching customers found') : (lang === 'ar' ? 'لا يوجد عملاء مضافون بعد' : 'No customers yet')}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === 'ar'
                ? 'أضف عملاءك لتعبئة الفواتير تلقائياً وتسهيل إصدار الفواتير المتكررة'
                : 'Add customers to automatically populate invoice forms in 1-click'}
            </p>
          </div>
          {!search && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة أول عميل' : 'Add First Customer'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{c.name}</h3>
                    {c.nameAr && <div className="text-xs text-slate-500 truncate" dir="rtl">{c.nameAr}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                      title={lang === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Delete this customer?')) {
                          onDeleteCustomer(c.id);
                        }
                      }}
                      className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title={lang === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  {c.phone && (
                    <div className="flex items-center gap-2 truncate font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                  {c.vatNumber && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold mt-1">
                      <span>VAT:</span>
                      <span>{c.vatNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {onSelectCustomerForInvoice && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectCustomerForInvoice(c)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إصدار فاتورة لهذا العميل' : 'Create Invoice for Customer'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{editingCustomer ? (lang === 'ar' ? 'تعديل بيانات العميل' : 'Edit Customer') : (lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم العميل / الشركة (English) *' : 'Customer Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Construction Co."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم العميل (عربي)' : 'Customer Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: شركة الإنشاءات الحديثة"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الجوال *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+966 5X XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الرقم الضريبي (15 رقم)' : 'Customer VAT No. (15 digits)'}
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="300XXXXXXXXXXXX"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم السجل التجاري' : 'CR Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="205XXXXXXXX"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'العنوان / الموقع' : 'Address / Location'}
                  </label>
                  <input
                    type="text"
                    placeholder="Riyadh, Saudi Arabia"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'ملاحظات إضافية' : 'Internal Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'شروط خاصة، أرقام تواصل، إلخ...' : 'Payment terms, site contacts, etc...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCustomer ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إضافة العميل' : 'Add Customer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
