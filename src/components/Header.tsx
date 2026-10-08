import React, { useState, useRef, useEffect } from 'react';
import { ViewTab, Language, CompanyWorkspace } from '../types/invoice';
import { translations } from '../translations/i18n';
import {
  FileText,
  List,
  BarChart3,
  Settings,
  Globe,
  Truck,
  LogOut,
  ShieldCheck,
  Users,
  Wrench,
  Building2,
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onNewInvoice: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  workspaces?: CompanyWorkspace[];
  activeWorkspace?: CompanyWorkspace | null;
  onSwitchWorkspace?: (workspaceId: string) => void;
  onAddNewWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onLogout,
  isAdmin = false,
  workspaces = [],
  activeWorkspace,
  onSwitchWorkspace,
  onAddNewWorkspace,
}) => {
  const t = translations[lang];
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    setLang(nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'create', label: t.navCreate, icon: <FileText className="w-4 h-4" /> },
    { id: 'list', label: t.navInvoices, icon: <List className="w-4 h-4" /> },
    { id: 'customers', label: t.navCustomers || (lang === 'ar' ? 'العملاء' : 'Customers'), icon: <Users className="w-4 h-4" /> },
    { id: 'services', label: t.navServices || (lang === 'ar' ? 'دليل الخدمات' : 'Services'), icon: <Wrench className="w-4 h-4" /> },
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

  const currentDisplayName = activeWorkspace
    ? lang === 'ar' && activeWorkspace.nameAr
      ? activeWorkspace.nameAr
      : activeWorkspace.name || (lang === 'ar' ? 'منشأتي التجارية' : 'My Business')
    : lang === 'ar'
    ? 'بوم ترَك إنفويس'
    : 'Saudi Boom Truck';

  const currentActivity = activeWorkspace
    ? lang === 'ar' && activeWorkspace.businessActivityAr
      ? activeWorkspace.businessActivityAr
      : activeWorkspace.businessActivity || (lang === 'ar' ? 'مساحة العمل' : 'Business Workspace')
    : lang === 'ar'
    ? 'فواتير المعدات والخدمات'
    : 'Multi-Tenant Invoicing';

  return (
    <header className="no-print sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Bar: Brand & Quick Settings */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
              onClick={() => setActiveTab('create')}
            >
              {activeWorkspace?.logoUrl ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-slate-700 overflow-hidden flex items-center justify-center">
                  <img
                    src={activeWorkspace.logoUrl}
                    alt={activeWorkspace.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-400/30">
                  <Truck className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Company Workspace Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCompanyDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors border border-transparent hover:border-slate-700 group cursor-pointer max-w-[210px] sm:max-w-xs"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white truncate leading-tight">
                      {currentDisplayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </div>
                  <span className="text-[10px] text-emerald-400/90 font-medium truncate leading-tight">
                    {currentActivity}
                  </span>
                </div>
              </button>

              {/* Workspace Switcher Menu */}
              {companyDropdownOpen && (
                <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>{t.switchWorkspace || (lang === 'ar' ? 'المنشآت ومساحات العمل' : 'Company Workspaces')}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {workspaces.length} {lang === 'ar' ? 'منشأة' : 'companies'}
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-800/50">
                    {workspaces.map((ws) => {
                      const isCurrent = activeWorkspace?.id === ws.id;
                      const displayName = lang === 'ar' && ws.nameAr ? ws.nameAr : ws.name || (lang === 'ar' ? 'منشأة بدون اسم' : 'Unnamed Company');
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            if (onSwitchWorkspace) onSwitchWorkspace(ws.id);
                            setCompanyDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/90 transition-colors cursor-pointer ${
                            isCurrent ? 'bg-emerald-950/40 text-white' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {ws.logoUrl ? (
                              <img
                                src={ws.logoUrl}
                                alt={ws.name}
                                className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                                <Building2 className="w-4 h-4 text-emerald-400" />
                              </div>
                            )}
                            <div className="truncate text-start">
                              <p className="text-xs font-bold truncate text-white leading-tight">
                                {displayName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate leading-tight">
                                {ws.businessActivity || (lang === 'ar' ? 'نشاط تجاري' : 'Business')}
                              </p>
                            </div>
                          </div>
                          {isCurrent && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 ms-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {onAddNewWorkspace && (
                    <div className="p-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setCompanyDropdownOpen(false);
                          onAddNewWorkspace();
                        }}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.addNewWorkspace || (lang === 'ar' ? '+ إضافة منشأة تجارية جديدة' : '+ Add New Business Workspace')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Tools: Language Switcher & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-xs cursor-pointer"
              title={lang === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 transition-all border border-slate-700 shadow-xs cursor-pointer"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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

