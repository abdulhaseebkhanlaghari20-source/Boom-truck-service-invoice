import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

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

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            watermarkUrl: event.target!.result as string,
            enableWatermark: true,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetWatermark = () => {
    setFormData((prev) => ({
      ...prev,
      watermarkUrl: '',
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

        {/* Watermark Section (Reference Box 10: Watermark PNG - Transparent) */}
        <div className="pb-5 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {lang === 'ar' ? 'العلامة المائية للفاتورة (Watermark)' : 'Invoice Watermark'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'تظهر في منتصف خلفية الفاتورة بنقاء وشفافية مطابقة للنموذج المرجعي (PNG شفافة).'
                  : 'Displays centered in the background of the invoice with subtle transparency.'}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.enableWatermark !== false}
                onChange={(e) => setFormData({ ...formData, enableWatermark: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>{lang === 'ar' ? 'تفعيل العلامة المائية' : 'Enable Watermark'}</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1">
            <div className="w-16 h-16 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {formData.watermarkUrl || formData.logoUrl ? (
                <img
                  src={formData.watermarkUrl || formData.logoUrl}
                  alt="Watermark Preview"
                  className="w-full h-full object-contain opacity-40 grayscale"
                />
              ) : (
                <span className="text-[9px] text-slate-400 font-semibold block text-center">
                  WATERMARK
                </span>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'رفع علامة مائية مخصصة' : 'Upload Custom Watermark'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWatermarkUpload}
                    className="hidden"
                  />
                </label>

                {formData.watermarkUrl && (
                  <button
                    type="button"
                    onClick={handleResetWatermark}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'استخدام الشعار كعلامة مائية' : 'Use Logo as Watermark'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                  {lang === 'ar' ? 'درجة الشفافية (Opacity):' : 'Opacity:'} {Math.round((formData.watermarkOpacity !== undefined ? formData.watermarkOpacity : 0.055) * 100)}%
                </span>
                <input
                  type="range"
                  min="0.02"
                  max="0.20"
                  step="0.005"
                  value={formData.watermarkOpacity !== undefined ? formData.watermarkOpacity : 0.055}
                  onChange={(e) => setFormData({ ...formData, watermarkOpacity: parseFloat(e.target.value) })}
                  className="w-36 accent-emerald-600"
                />
              </div>
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
              placeholder="Ninth Generation Trading Est."
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
              placeholder="مؤسسة الجيل التاسع التجارية"
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
              placeholder="312777148100003"
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.crNumber} (السجل التجاري)
            </label>
            <input
              type="text"
              placeholder="2050205810"
              value={formData.crNumber || ''}
              onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.phone} (Primary Mobile) *
            </label>
            <input
              type="text"
              required
              placeholder="0597330558"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'ar' ? 'رقم الهاتف الإضافي (Secondary Phone)' : 'Secondary Mobile / Phone'}
            </label>
            <input
              type="text"
              placeholder="0596300922"
              value={formData.secondaryPhone || ''}
              onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.whatsapp}
            </label>
            <input
              type="text"
              placeholder="0596300922"
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
              placeholder="ninthgenerationtrading345@gmail.com"
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
              placeholder="7680, Al Asher, 4458, Al Adamah Dist. 32242, Dammam Kingdom of Saudi Arabia"
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
              placeholder="الدمام - حي العدامة، المملكة العربية السعودية"
              value={formData.addressAr || ''}
              onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.bankName} (اسم البنك)
            </label>
            <input
              type="text"
              placeholder="Alinma Bank / مصرف الإنماء"
              value={formData.bankName || ''}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'ar' ? 'رقم الحساب البنکی (Bank A/C Number)' : 'Bank Account No. (A/C)'}
            </label>
            <input
              type="text"
              placeholder="68206151342000"
              value={formData.bankAccountNumber || ''}
              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.iban} (الآيبان البنكي)
            </label>
            <input
              type="text"
              placeholder="SA55050000068206151342000"
              value={formData.iban || ''}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'ar' ? 'ملاحظة الختم والاعتماد (Seal Note)' : 'Company Seal / Note (Seal Note)'}
            </label>
            <textarea
              rows={2}
              placeholder="Certified boom truck crane & licensed operator. Services performed per Saudi safety standards."
              value={formData.sealNote || ''}
              onChange={(e) => setFormData({ ...formData, sealNote: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Professional Email Signature & Contact Subsection */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {lang === 'ar' ? 'التوقيع والبريد الإلكتروني المهني' : 'Professional Email Signature & Contact'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'تُدرج هذه البيانات تلقائياً في نص وتوقيع رسائل البريد الإلكتروني الرسمية المرسلة للعملاء.'
                : 'These details are automatically included in professional email sharing and signatures.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {(t as any).contactPerson}
              </label>
              <input
                type="text"
                placeholder={lang === 'ar' ? 'مثال: م. فهد الشمري' : 'e.g. Eng. Fahad Al-Shammari'}
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {(t as any).jobTitle}
              </label>
              <input
                type="text"
                placeholder={lang === 'ar' ? 'مثال: مدير العمليات والتشغيل' : 'e.g. Operations & Fleet Manager'}
                value={formData.jobTitle || ''}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {(t as any).website}
              </label>
              <input
                type="text"
                placeholder="e.g. www.boomtruckservices.sa"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {(t as any).emailClosing}
              </label>
              <input
                type="text"
                placeholder={lang === 'ar' ? 'مثال: نتطلع للتعاون معكم في مشاريعكم القادمة.' : 'e.g. Looking forward to working with you on your upcoming projects.'}
                value={formData.emailClosing || ''}
                onChange={(e) => setFormData({ ...formData, emailClosing: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Corporate Header & Footer Customization Subsection */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {lang === 'ar' ? 'تخصيص رأس وتذييل الفاتورة' : 'Header & Footer Branding'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'تخصيص المسمى التجاري، الشعارات النصية، وعبارة الشكر في أسفل الفاتورة.'
                : 'Customize business service name, taglines, and footer closing note.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'اسم الخدمة / النشاط (English)' : 'Business / Service Name (English)'}
              </label>
              <input
                type="text"
                placeholder="BOOM TRUCK RENTAL SERVICES"
                value={formData.businessServiceEn || ''}
                onChange={(e) => setFormData({ ...formData, businessServiceEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'اسم الخدمة / النشاط (العربية)' : 'Business / Service Name (Arabic)'}
              </label>
              <input
                type="text"
                placeholder="لتأجير بوم ترك"
                value={formData.businessServiceAr || ''}
                onChange={(e) => setFormData({ ...formData, businessServiceAr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'الشعار النصي (English)' : 'Tagline / Slogan (English)'}
              </label>
              <input
                type="text"
                placeholder="LIFT  |  TRANSPORT  |  HEAVY EQUIPMENT SOLUTIONS"
                value={formData.taglineEn || ''}
                onChange={(e) => setFormData({ ...formData, taglineEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'الشعار النصي (العربية)' : 'Tagline / Slogan (Arabic)'}
              </label>
              <input
                type="text"
                placeholder="خدمات رفع ونقل ومعدات متكاملة"
                value={formData.taglineAr || ''}
                onChange={(e) => setFormData({ ...formData, taglineAr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'عبارة الشكر بالتذييل (English)' : 'Footer Closing Note (English)'}
              </label>
              <input
                type="text"
                placeholder="Thank you for your business"
                value={formData.closingNoteEn || ''}
                onChange={(e) => setFormData({ ...formData, closingNoteEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'ar' ? 'عبارة الشكر بالتذييل (العربية)' : 'Footer Closing Note (Arabic)'}
              </label>
              <input
                type="text"
                placeholder="شكراً لتعاملكم معنا"
                value={formData.closingNoteAr || ''}
                onChange={(e) => setFormData({ ...formData, closingNoteAr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>
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
