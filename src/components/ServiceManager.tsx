import React, { useState } from 'react';
import { ServiceCatalogItem, Language } from '../types/invoice';
import {
  Wrench,
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Truck,
  Box,
  PenTool,
} from 'lucide-react';

interface ServiceManagerProps {
  services: ServiceCatalogItem[];
  onSaveService: (service: ServiceCatalogItem) => void;
  onDeleteService: (serviceId: string) => void;
  lang: Language;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({
  services,
  onSaveService,
  onDeleteService,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [billingType, setBillingType] = useState<'days' | 'hours' | 'trips' | 'quantity' | 'custom'>('days');
  const [unit, setUnit] = useState('Days');
  const [rate, setRate] = useState<number>(500);
  const [vatApplicable, setVatApplicable] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setNameAr('');
    setDescription('');
    setDescriptionAr('');
    setBillingType('days');
    setUnit('Days');
    setRate(500);
    setVatApplicable(true);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (s: ServiceCatalogItem) => {
    setEditingService(s);
    setName(s.name || '');
    setNameAr(s.nameAr || '');
    setDescription(s.description || '');
    setDescriptionAr(s.descriptionAr || '');
    setBillingType(s.defaultBillingType || 'days');
    setUnit(s.defaultUnit || 'Days');
    setRate(s.defaultRate || 0);
    setVatApplicable(s.vatApplicable ?? true);
    setIsActive(s.isActive ?? true);
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !nameAr.trim()) return;

    const itemToSave: ServiceCatalogItem = {
      id: editingService?.id || `srv-${Date.now()}`,
      companyId: editingService?.companyId || '',
      name: name.trim() || nameAr.trim(),
      nameAr: nameAr.trim(),
      description: description.trim(),
      descriptionAr: descriptionAr.trim(),
      defaultBillingType: billingType,
      defaultUnit: unit.trim() || 'Days',
      defaultRate: Math.max(0, Number(rate) || 0),
      vatApplicable,
      isActive,
      createdAt: editingService?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveService(itemToSave);
    setModalOpen(false);
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nameAr && s.nameAr.includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  const getBillingBadge = (type: string) => {
    switch (type) {
      case 'days':
        return { label: lang === 'ar' ? '📅 بالأيام' : '📅 Days', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'hours':
        return { label: lang === 'ar' ? '⏱️ بالساعات' : '⏱️ Hours', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'trips':
        return { label: lang === 'ar' ? '🚚 بالمشاوير' : '🚚 Trips', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'quantity':
        return { label: lang === 'ar' ? '📦 بالكمية' : '📦 Quantity', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: lang === 'ar' ? '✍️ مخصص' : '✍️ Custom', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'ar' ? 'دليل الخدمات والأعمال' : 'Services & Items Catalog'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? 'أضف خدمات شركتك وطريقة الحساب وسعر الوحدة لتعبئتها بنقرة واحدة في الفواتير'
              : 'Configure your company services catalog, default units, and billing rates'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
        <input
          type="text"
          placeholder={lang === 'ar' ? 'بحث في دليل الخدمات أو الوصف...' : 'Search services by name or description...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
        />
      </div>

      {/* Services List / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {search ? (lang === 'ar' ? 'لا توجد خدمات مطابقة' : 'No matching services found') : (lang === 'ar' ? 'الدليل فارغ حالياً' : 'No services in catalog yet')}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === 'ar'
                ? 'أنشئ أول خدمة أو بند خاص بشركتك (تأجير، نقل، صيانة، أعمال فنية، استشارات، إلخ)'
                : 'Create your first service or equipment offering with default billing rates'}
            </p>
          </div>
          {!search && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة أول خدمة' : 'Add First Service'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((s) => {
            const badge = getBillingBadge(s.defaultBillingType);
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{s.name}</h3>
                      {s.nameAr && <div className="text-xs text-slate-500 truncate" dir="rtl">{s.nameAr}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(s)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                        title={lang === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الخدمة؟' : 'Delete this service?')) {
                            onDeleteService(s.id);
                          }
                        }}
                        className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title={lang === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {s.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {s.defaultUnit}
                    </span>
                    {s.vatApplicable && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {lang === 'ar' ? 'خاضع للضريبة' : 'Taxable'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {lang === 'ar' ? 'السعر الافتراضي' : 'Default Rate'}
                  </span>
                  <span className="font-mono font-bold text-sm text-[#0F2744]">
                    {s.defaultRate.toFixed(2)} SAR <span className="text-xs font-normal text-slate-400">/ {s.defaultUnit}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Service */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>{editingService ? (lang === 'ar' ? 'تعديل بيانات الخدمة' : 'Edit Service') : (lang === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service')}</span>
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
                    {lang === 'ar' ? 'اسم الخدمة (English) *' : 'Service Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hydraulic Crane Rental / AC Maintenance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: تأجير كرين هيدروليكي / صيانة تكييف"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الوصف والتفاصيل' : 'Description / Scope'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Includes certified operator and rigging tools"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'نوع الحساب الافتراضي' : 'Default Billing Type'}
                  </label>
                  <select
                    value={billingType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setBillingType(t);
                      if (t === 'days') setUnit('Days');
                      if (t === 'hours') setUnit('Hours');
                      if (t === 'trips') setUnit('Trip');
                      if (t === 'quantity') setUnit('Pcs');
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="days">{lang === 'ar' ? '📅 بالأيام (Days)' : '📅 Days'}</option>
                    <option value="hours">{lang === 'ar' ? '⏱️ بالساعات (Hours)' : '⏱️ Hours'}</option>
                    <option value="trips">{lang === 'ar' ? '🚚 بالمشاوير (Trips)' : '🚚 Trips'}</option>
                    <option value="quantity">{lang === 'ar' ? '📦 بالكمية (Quantity)' : '📦 Quantity'}</option>
                    <option value="custom">{lang === 'ar' ? '✍️ مخصص (Custom)' : '✍️ Custom'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الوحدة المكتوبة (Unit)' : 'Default Unit'}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'السعر الافتراضي (ر.س) *' : 'Default Rate (SAR) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatApplicable}
                      onChange={(e) => setVatApplicable(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {lang === 'ar' ? 'خاضع لضريبة القيمة المضافة' : 'VAT Applicable'}
                    </span>
                  </label>
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
                  <span>{editingService ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إضافة الخدمة' : 'Add Service')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
