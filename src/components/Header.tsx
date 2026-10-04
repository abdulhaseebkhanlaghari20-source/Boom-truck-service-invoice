import React from 'react';
import { ViewTab, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { FileText, List, BarChart3, Settings, Globe, Truck, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onNewInvoice: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onLogout,
  isAdmin = false,
}) => {
  const t = translations[lang];

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    setLang(nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'create', label: t.navCreate, icon: <FileText className="w-4 h-4" /> },
    { id: 'list', label: t.navInvoices, icon: <List className="w-4 h-4" /> },
    { id: 'dashboard', label: t.navDashboard, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: t.navSettings, icon: <Settings className="w-4 h-4" /> },
    ...(isAdmin
      ? [
          {
            id: 'admin' as ViewTab,
            label: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard',
            icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
            badge: lang === 'ar' ? 'مدير' : 'Admin',
          },
        ]
      : []),
  ];

  return (
    <header className="no-print sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Bar: Brand & Quick Settings */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => setActiveTab('create')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-400/30">
              <Truck className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
                  {lang === 'ar' ? 'بوم ترَك إنفويس' : 'Saudi Boom Truck'}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {lang === 'ar' ? 'إدارة' : 'ADMIN'}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight">
                {lang === 'ar' ? 'فواتير المعدات الثقيلة والرافعات' : 'Heavy Equipment Invoicing'}
              </span>
            </div>
          </div>

          {/* Right Action Tools: Language Switcher & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-xs"
              title={lang === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 transition-all border border-slate-700 shadow-xs"
                title={lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Logout'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar: Responsive Segmented Tabs */}
      <div className="bg-slate-950/70 border-t border-slate-800/90 px-2 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center overflow-x-auto gap-1 sm:gap-2 scrollbar-none py-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isAdminTab = item.id === 'admin';

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? isAdminTab
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : isAdminTab
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
