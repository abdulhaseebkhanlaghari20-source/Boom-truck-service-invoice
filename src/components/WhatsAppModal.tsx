import React, { useState } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { buildWhatsAppMessage, getWhatsAppShareUrl } from '../utils/formatters';
import { canSharePdfFile } from '../utils/pdfGenerator';
import {
  Share2,
  FileDown,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertTriangle,
  Send,
  FileCheck,
} from 'lucide-react';

interface WhatsAppModalProps {
  invoice: Invoice | null;
  companySettings: CompanySettings;
  lang: Language;
  onClose: () => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onSharePdf?: (invoice: Invoice) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  invoice,
  companySettings,
  lang,
  onClose,
  onDownloadPdf,
  onSharePdf,
}) => {
  if (!invoice) return null;

  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [showAttachReminder, setShowAttachReminder] = useState(false);

  const isNativeShareSupported = canSharePdfFile();

  const messageText = buildWhatsAppMessage(
    invoice,
    companySettings.companyName || '[COMPANY NAME]',
    lang
  );
  const waUrl = getWhatsAppShareUrl(
    invoice,
    companySettings.companyName || '[COMPANY NAME]',
    lang
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    onDownloadPdf(invoice);
    setPdfDownloaded(true);
    setShowAttachReminder(true);
  };

  const handleDownloadAndOpenWhatsApp = () => {
    onDownloadPdf(invoice);
    setPdfDownloaded(true);
    setShowAttachReminder(true);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t.whatsappModalTitle}</h3>
              <p className="text-[11px] text-slate-300 font-mono">
                {invoice.invoiceNumber} · {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mobile Native Share Sheet (If Supported) */}
          {isNativeShareSupported && onSharePdf && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2">
              <div className="flex items-start gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-950 block">
                    {lang === 'ar' ? 'مشاركة ملف PDF مباشرة:' : 'Direct PDF File Share (Supported):'}
                  </span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    {lang === 'ar'
                      ? 'يمكنك مشاركة ملف الفاتورة PDF كوثيقة مباشرة واختيار واتساب من قائمة التطبيقات.'
                      : 'You can share the PDF invoice as a document directly. Select WhatsApp in your device share sheet.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSharePdf(invoice);
                }}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {lang === 'ar'
                    ? 'مشاركة ملف الـ PDF كوثيقة (اختر واتساب)'
                    : 'Share PDF File Document (Select WhatsApp)'}
                </span>
              </button>
            </div>
          )}

          {/* Attach Reminder Banner if user downloaded or clicked fallback */}
          {showAttachReminder && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {lang === 'ar' ? 'تنبيه إرفاق الملف:' : 'PDF Downloaded:'}
                </span>
                <p className="text-[11px] text-blue-800">
                  {lang === 'ar'
                    ? 'تم تحميل ملف PDF على جهازك. يرجى الضغط على زر الإرفاق (📎) داخل محادثة واتساب واختيار ملف الفاتورة.'
                    : 'PDF downloaded to your device. Please attach the PDF document (📎) in your WhatsApp chat.'}
                </p>
              </div>
            </div>
          )}

          {/* Standard 3-Step Protocol Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {lang === 'ar' ? 'طريقة مشاركة الوثيقة (PDF):' : 'Document Sharing Protocol:'}
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {lang === 'ar'
                  ? 'المتصفح لا يمكنه إجبار واتساب على إرفاق الملف تلقائياً بدون موافقتك. قم بتحميل ملف PDF ثم افتح المحادثة وأرفق الوثيقة.'
                  : 'Standard browser security requires downloading the PDF first, then attaching the document in WhatsApp.'}
              </p>
            </div>
          </div>

          {/* 3 Step Workflow */}
          <div className="space-y-2.5 text-xs text-slate-700">
            {/* Step 1 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {lang === 'ar' ? 'تحميل الفاتورة PDF' : 'Download Invoice PDF'}
                  </span>
                  <p className="text-[11px] text-slate-500">{t.whatsappStep1}</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shrink-0 ${
                  pdfDownloaded
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{pdfDownloaded ? (lang === 'ar' ? 'تم التحميل' : 'Downloaded') : t.downloadPdf}</span>
              </button>
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {lang === 'ar' ? 'فتح محادثة واتساب' : 'Open WhatsApp Chat'}
                  </span>
                  <p className="text-[11px] text-slate-500">{t.whatsappStep2}</p>
                </div>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowAttachReminder(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.openWhatsappBtn}</span>
              </a>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {lang === 'ar' ? 'إرفاق ملف الـ PDF' : 'Attach Downloaded PDF'}
                  </span>
                  <p className="text-[11px] text-slate-500">{t.whatsappStep3}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Action */}
          <button
            type="button"
            onClick={handleDownloadAndOpenWhatsApp}
            className="w-full py-2 px-3 text-xs font-semibold rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {lang === 'ar'
                ? 'تحميل الفاتورة وفتح واتساب بخطوة واحدة'
                : '1-Click: Download PDF & Open WhatsApp'}
            </span>
          </button>

          {/* Pre-composed Message Preview */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">
                {lang === 'ar' ? 'معاينة نص الرسالة المُجهزة:' : 'Pre-filled WhatsApp Message Preview:'}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t.copiedText : t.copySummaryBtn}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-100 rounded-md text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-28 overflow-y-auto border border-slate-200 leading-relaxed">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
