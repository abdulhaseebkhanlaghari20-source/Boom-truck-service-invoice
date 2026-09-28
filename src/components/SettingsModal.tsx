import React, { useState } from 'react';
import { CompanySettings, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { Settings, Save, Upload, RotateCcw, CheckCircle2, Building2 } from 'lucide-react';

interface SettingsModalProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  lang: Language;
}

export const SettingsSection: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  lang,
}) => {
  const t = translations[lang];
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            logoUrl: event.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPlaceholder = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {t.companySettingsTitle}
        </h2>
        <p className="text-xs text-slate-500">{t.companySettingsDesc}</p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'ar' ? 'تم حفظ بيانات المؤسسة بنجاح!' : 'Company details saved successfully!'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Logo Upload Section */}
        <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-20 h-20 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Uploaded Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-1">
                <Building2 className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-[9px] text-slate-400 font-semibold block leading-tight">
                  [LOGO]
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-start rtl:sm:text-right">
            <label className="block text-xs font-bold text-slate-800">
              {t.companyLogo}
            </label>
            <p className="text-[11px] text-slate-500">
              {lang === 'ar'
                ? 'ارفع شعار مؤسستك (PNG أو JPG أو SVG) ليظهر على رأس الفاتورة الرسمية'
                : 'Upload your company logo (PNG, JPG, SVG) to appear in the invoice header'}
            </p>
            <div className="flex items-center gap-2 justify-center sm:justify-start rtl:sm:justify-start">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{t.uploadLogo}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleResetPlaceholder}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.useDefaultLogo}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Company Identity Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.companyName} (English) *
            </label>
            <input
              type="text"
              required
              placeholder="[COMPANY NAME]"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.companyName} (العربية)
            </label>
            <input
              type="text"
              placeholder="اسم المؤسسة بالعربية"
              value={formData.companyNameAr || ''}
              onChange={(e) => setFormData({ ...formData, companyNameAr: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.vatNumber} *
            </label>
            <input
              type="text"
              required
              placeholder="[VAT NUMBER] e.g. 310XXXXXXXXXXXX"
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.crNumber}
            </label>
            <input
              type="text"
              placeholder="1010XXXXXX"
              value={formData.crNumber || ''}
              onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.phone} *
            </label>
            <input
              type="text"
              required
              placeholder="[PHONE] +966 5X XXX XXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.whatsapp}
            </label>
            <input
              type="text"
              placeholder="[WHATSAPP] +966 5X XXX XXXX"
              value={formData.whatsapp || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.email} *
            </label>
            <input
              type="email"
              required
              placeholder="[EMAIL] billing@company.sa"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.address} (English) *
            </label>
            <input
              type="text"
              required
              placeholder="[ADDRESS] Riyadh, Industrial Area, Saudi Arabia"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.address} (العربية)
            </label>
            <input
              type="text"
              placeholder="العنوان الوطني، المدينة، الحي"
              value={formData.addressAr || ''}
              onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.bankName}
            </label>
            <input
              type="text"
              placeholder="e.g. Al Rajhi Bank / مصرف الراجحي"
              value={formData.bankName || ''}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.iban}
            </label>
            <input
              type="text"
              placeholder="SA00 0000 0000 0000 0000 0000"
              value={formData.iban || ''}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
