import React from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { InvoicePreview } from './InvoicePreview';
import { Printer, FileDown, Share2, Mail, X, Edit } from 'lucide-react';

interface PreviewModalProps {
  invoice: Invoice | null;
  companySettings: CompanySettings;
  lang: Language;
  onClose: () => void;
  onEdit: (invoice: Invoice) => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onSharePdf: () => void;
  onEmailPdf: () => void;
  onShareWhatsApp: (invoice: Invoice) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  invoice,
  companySettings,
  lang,
  onClose,
  onEdit,
  onPrint,
  onDownloadPdf,
  onSharePdf,
  onEmailPdf,
  onShareWhatsApp,
}) => {
  if (!invoice) return null;
  const t = translations[lang];

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-100 rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold tracking-tight">
              {lang === 'ar' ? 'معاينة الفاتورة الرسمية' : 'Official Tax Invoice Preview'}
            </span>
            <span className="text-xs text-slate-400 font-mono">({invoice.invoiceNumber})</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">{t.editInvoice}</span>
            </button>

            <button
              onClick={onPrint}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.print}</span>
            </button>

            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{t.downloadPdf}</span>
            </button>

            <button
              onClick={onSharePdf}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.sharePdf}</span>
            </button>

            <button
              onClick={() => onShareWhatsApp(invoice)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
            >
              <span className="font-bold text-[10px]">WA</span>
              <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
            </button>

            <button
              onClick={onEmailPdf}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-indigo-700 hover:bg-indigo-600 text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.emailPdf}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ms-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-2 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 bg-slate-200/60">
          <div className="max-w-[850px] mx-auto w-full">
            <InvoicePreview
              invoice={invoice}
              companySettings={companySettings}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
