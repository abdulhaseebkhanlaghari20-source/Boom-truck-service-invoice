import React from 'react';
import { ViewTab, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { FileText, List, BarChart3, Settings, Globe, Plus, Truck } from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onNewInvoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onNewInvoice,
}) => {
  const t = translations[lang];

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    setLang(nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'create', label: t.navCreate, icon: <FileText className="w-4 h-4" /> },
    { id: 'list', label: t.navInvoices, icon: <List className="w-4 h-4" /> },
    { id: 'dashboard', label: t.navDashboard, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: t.navSettings, icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="no-print sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('create')}>
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                {lang === 'ar' ? 'بوم ترَك إنفويس' : 'Saudi Boom Truck'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 leading-tight">
                {lang === 'ar' ? 'فاتورة رافعات ومعدات ثقيلة' : 'Heavy Equipment Invoicing'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Segmented Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Language Toggle & New Invoice) */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
              title={lang === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button
              onClick={onNewInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.newInvoice}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-800/80 py-2 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
