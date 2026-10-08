import React, { useState } from 'react';
import {
  CompanyWorkspace,
  Customer,
  ServiceCatalogItem,
  Language,
} from '../types/invoice';
import {
  Building2,
  Image as ImageIcon,
  FileCheck2,
  Landmark,
  FileText,
  UserPlus,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
} from 'lucide-react';

interface SetupWizardProps {
  workspace: CompanyWorkspace;
  lang: Language;
  onComplete: (
    updatedWorkspace: CompanyWorkspace,
    firstCustomer?: Customer,
    firstService?: ServiceCatalogItem
  ) => void;
  onSkip?: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  workspace,
  lang,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Company Information
  const [name, setName] = useState(workspace.name || '');
  const [nameAr, setNameAr] = useState(workspace.nameAr || '');
  const [businessActivity, setBusinessActivity] = useState(workspace.businessActivity || '');
  const [businessActivityAr, setBusinessActivityAr] = useState(workspace.businessActivityAr || '');

  // Step 2: Logo & Contact
  const [logoUrl, setLogoUrl] = useState(workspace.logoUrl || '');
  const [phone, setPhone] = useState(workspace.phone || '');
  const [whatsapp, setWhatsapp] = useState(workspace.whatsapp || '');
  const [email, setEmail] = useState(workspace.email || '');
  const [address, setAddress] = useState(workspace.address || '');
  const [addressAr, setAddressAr] = useState(workspace.addressAr || '');

  // Step 3: Tax / VAT & CR
  const [vatEnabled, setVatEnabled] = useState(workspace.taxSettings?.vatEnabled ?? true);
  const [vatRate, setVatRate] = useState(workspace.taxSettings?.vatRate ?? 15);
  const [vatNumber, setVatNumber] = useState(workspace.vatNumber || '');
  const [crNumber, setCrNumber] = useState(workspace.crNumber || '');

  // Step 4: Bank Details
  const defaultBank = workspace.bankAccounts?.[0] || {
    id: `bank-${Date.now()}`,
    bankName: '',
    accountNumber: '',
    iban: '',
    isDefault: true,
  };
  const [bankName, setBankName] = useState(defaultBank.bankName || '');
  const [accountNumber, setAccountNumber] = useState(defaultBank.accountNumber || '');
  const [iban, setIban] = useState(defaultBank.iban || '');

  // Step 5: Invoice Template & Numbering
  const [prefix, setPrefix] = useState(workspace.numberingSettings?.prefix || 'INV-');
  const [startingNumber, setStartingNumber] = useState(workspace.numberingSettings?.startingNumber || 1);
  const [closingNoteEn, setClosingNoteEn] = useState(
    workspace.invoiceTemplateSettings?.closingNoteEn || 'Thank you for your business'
  );
  const [closingNoteAr, setClosingNoteAr] = useState(
    workspace.invoiceTemplateSettings?.closingNoteAr || 'شكراً لتعاملكم معنا'
  );

  // Step 6: First Customer
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custVat, setCustVat] = useState('');

  // Step 7: First Service
  const [serviceName, setServiceName] = useState('');
  const [serviceNameAr, setServiceNameAr] = useState('');
  const [billingType, setBillingType] = useState<'days' | 'hours' | 'trips' | 'quantity' | 'custom'>('days');
  const [unit, setUnit] = useState('Days');
  const [rate, setRate] = useState<number>(1000);

  const totalSteps = 7;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'ar' ? 'حجم الشعار يجب أن يكون أقل من 2 ميغابايت' : 'Logo size must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setLogoUrl(evt.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    const updatedWorkspace: CompanyWorkspace = {
      ...workspace,
      name: name.trim() || 'My Business',
      nameAr: nameAr.trim(),
      businessActivity: businessActivity.trim(),
      businessActivityAr: businessActivityAr.trim(),
      logoUrl,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim(),
      address: address.trim(),
      addressAr: addressAr.trim(),
      vatNumber: vatNumber.trim(),
      crNumber: crNumber.trim(),
      bankAccounts: [
        {
          id: defaultBank.id,
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          iban: iban.trim(),
          isDefault: true,
        },
      ],
      taxSettings: {
        vatEnabled,
        vatRate: Number(vatRate) || 15,
        vatNumber: vatNumber.trim(),
      },
      numberingSettings: {
        prefix: prefix.trim() || 'INV-',
        startingNumber: Number(startingNumber) || 1,
        digits: 4,
      },
      invoiceTemplateSettings: {
        showSeal: true,
        closingNoteEn: closingNoteEn.trim(),
        closingNoteAr: closingNoteAr.trim(),
      },
      isSetupComplete: true,
      updatedAt: new Date().toISOString(),
    };

    let firstCustomer: Customer | undefined;
    if (custName.trim()) {
      firstCustomer = {
        id: `cust-${Date.now()}`,
        companyId: workspace.id,
        name: custName.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim(),
        vatNumber: custVat.trim(),
        createdAt: new Date().toISOString(),
      };
    }

    let firstService: ServiceCatalogItem | undefined;
    if (serviceName.trim() || serviceNameAr.trim()) {
      firstService = {
        id: `srv-${Date.now()}`,
        companyId: workspace.id,
        name: serviceName.trim() || serviceNameAr.trim(),
        nameAr: serviceNameAr.trim(),
        defaultBillingType: billingType,
        defaultUnit: unit.trim() || 'Days',
        defaultRate: Number(rate) || 0,
        vatApplicable: vatEnabled,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }

    onComplete(updatedWorkspace, firstCustomer, firstService);
  };

  const stepsList = [
    { num: 1, title: lang === 'ar' ? 'معلومات الشركة' : 'Company Info', icon: Building2 },
    { num: 2, title: lang === 'ar' ? 'الشعار والتواصل' : 'Logo & Contact', icon: ImageIcon },
    { num: 3, title: lang === 'ar' ? 'الضريبة والسجل' : 'VAT & Tax', icon: FileCheck2 },
    { num: 4, title: lang === 'ar' ? 'الحساب البنكي' : 'Bank Account', icon: Landmark },
    { num: 5, title: lang === 'ar' ? 'نموذج الفاتورة' : 'Template', icon: FileText },
    { num: 6, title: lang === 'ar' ? 'العميل الأول' : 'First Customer', icon: UserPlus },
    { num: 7, title: lang === 'ar' ? 'الخدمة الأولى' : 'First Service', icon: Wrench },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-text">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm">
                🏢
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  {lang === 'ar' ? 'إعداد مساحة عمل الشركة الجديدة' : 'Business Workspace Setup'}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'ar'
                    ? 'أكمل الخطوات البسيطة للبدء بإصدار الفواتير فوراً'
                    : 'Complete a quick one-time setup to start issuing invoices immediately'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {lang === 'ar' ? `خطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Steps Indicator Icons */}
          <div className="flex items-center justify-between mt-3 overflow-x-auto gap-1">
            {stepsList.map((st) => {
              const Icon = st.icon;
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div
                  key={st.num}
                  className={`flex flex-col items-center gap-1 min-w-[50px] transition-all ${
                    isCurrent ? 'text-emerald-400 font-bold scale-105' : isPassed ? 'text-emerald-500' : 'text-slate-500'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-900 font-extrabold ring-2 ring-emerald-400/50'
                        : isPassed
                        ? 'bg-emerald-900/60 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <span className="text-[9.5px] truncate max-w-[56px] text-center hidden sm:inline">
                    {st.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-5 sm:p-7 flex-1 space-y-4">
          {/* STEP 1: Company Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '1. اسم الشركة والنشاط التجاري' : '1. Company Name & Activity'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'أدخل اسم شركتك بالإنجليزية والعربية ليظهر على رأس الفاتورة'
                    : 'Enter your business legal or trading name for the invoice header'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم الشركة (English) *' : 'Company Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Engineering & Contracting"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم الشركة (عربي) *' : 'Company Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    required
                    placeholder="مثال: شركة القمة للمقاولات العامة"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'النشاط التجاري (English)' : 'Business Activity (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HEAVY EQUIPMENT RENTAL SERVICES"
                    value={businessActivity}
                    onChange={(e) => setBusinessActivity(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'النشاط التجاري (عربي)' : 'Business Activity (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: خدمات تأجير المعدات الثقيلة والنقل"
                    value={businessActivityAr}
                    onChange={(e) => setBusinessActivityAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Logo & Contact */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '2. الشعار وبيانات الاتصال والعنوان' : '2. Logo & Contact Details'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'ارفع شعار شركتك وسيظهر بدقة في تذييل الفاتورة'
                    : 'Upload your company logo. It will automatically appear sharp in the footer'}
                </p>
              </div>

              {/* Logo Upload Box */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? (lang === 'ar' ? 'تغيير الشعار' : 'Change Logo') : (lang === 'ar' ? 'رفع الشعار' : 'Upload Logo')}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, SVG {lang === 'ar' ? '(بحد أقصى 2 ميغابايت)' : '(Max 2MB)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الهاتف / الجوال *' : 'Phone / Mobile *'}
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
                    {lang === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="+966 5X XXX XXXX"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    placeholder="info@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'العنوان الكامل' : 'Complete Business Address'}
                  </label>
                  <input
                    type="text"
                    placeholder="Dammam, King Fahd Road, Saudi Arabia"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Tax Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '3. الرقم الضريبي والسجل التجاري' : '3. VAT & Commercial Registration'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'إعدادات الضريبة والسجل التجاري لهيئة الزكاة والضريبة والجمارك (ZATCA)'
                    : 'Set up your VAT and CR for ZATCA-compliant Saudi invoices'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {lang === 'ar' ? 'تفعيل ضريبة القيمة المضافة (VAT)' : 'Enable Value Added Tax (VAT)'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'ar' ? 'تطبيق النسبة الضريبية المعتمدة في المملكة' : 'Standard Saudi VAT rate'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={vatEnabled}
                  onChange={(e) => setVatEnabled(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'نسبة الضريبة (%)' : 'VAT Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vatRate}
                    disabled={!vatEnabled}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الرقم الضريبي (15 رقماً)' : 'VAT Registration No. (15 digits)'}
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="300XXXXXXXXXXXX"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم السجل التجاري (CR Number)' : 'Commercial Registration (CR No.)'}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="205XXXXXXXX"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '4. بيانات الحساب البنكي والآيبان' : '4. Bank Account & IBAN'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'ستظهر هذه البيانات في خانة الحساب البنكي لتمكين العميل من التحويل'
                    : 'This bank information will appear in the invoice Bank Details panel'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم البنك' : 'Bank Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alinma Bank / مصرف الإنماء"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الحساب' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 68206151342000"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN (starts with SA)'}
                  </label>
                  <input
                    type="text"
                    placeholder="SA550500000XXXXXXXXXXXXX"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Invoice Numbering & Template */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '5. ترقيم الفواتير ورسالة الشكر' : '5. Invoice Numbering & Notes'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'حدد بادئة الترقيم الخاصة بشركتك ورسالة الشكر'
                    : 'Set up your custom invoice numbering prefix and footer closing'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'بادئة رقم الفاتورة (Prefix)' : 'Invoice Prefix'}
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="INV-"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم البدء' : 'Starting Number'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startingNumber}
                    onChange={(e) => setStartingNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رسالة الشكر (عربي)' : 'Thank You Message (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={closingNoteAr}
                    onChange={(e) => setClosingNoteAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رسالة الشكر (English)' : 'Thank You Message (English)'}
                  </label>
                  <input
                    type="text"
                    value={closingNoteEn}
                    onChange={(e) => setClosingNoteEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: First Customer */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '6. إضافة عميلك الأول (اختياري)' : '6. Add Your First Customer (Optional)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'يمكنك إضافة عميلك الأول الآن لتحديده فوراً عند إصدار الفاتورة'
                    : 'Add your first customer to select them immediately during invoice creation'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم العميل / الشركة' : 'Customer / Company Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saudi Aramco / شركة بن لادن"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم جوال العميل' : 'Mobile Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="+966 5X XXX XXXX"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الرقم الضريبي للعميل (إن وجد)' : 'Customer VAT No. (if any)'}
                  </label>
                  <input
                    type="text"
                    placeholder="300XXXXXXXXXXXX"
                    value={custVat}
                    onChange={(e) => setCustVat(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'عنوان العميل' : 'Client Address'}
                  </label>
                  <input
                    type="text"
                    placeholder="Riyadh, Olaya District"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: First Service */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'ar' ? '7. إضافة خدمتك أو بندك الأول (اختياري)' : '7. Add Your First Service / Item (Optional)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'أدخل نوع الخدمة التي تقدمها (تأجير، صيانة، نقل، مقاولات، إلخ) مع طريقة الحساب الافتراضية'
                    : 'Enter the service or rental you provide with its default billing method and rate'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم الخدمة (English)' : 'Service Name (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Equipment Rental / Consulting / Repair"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: خدمة تأجير معدات / أعمال صيانة"
                    value={serviceNameAr}
                    onChange={(e) => setServiceNameAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'طريقة الحساب الافتراضية' : 'Default Billing Type'}
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
                    {lang === 'ar' ? 'الوحدة الافتراضية' : 'Default Unit'}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'السعر الافتراضي (ر.س)' : 'Default Rate (SAR)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'ar' ? 'السابق' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm"
            >
              <span>{lang === 'ar' ? 'التالي' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all shadow-md ring-2 ring-emerald-400/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إكمال الإعداد وبدء الفوترة!' : 'Complete Setup & Start Invoicing!'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
