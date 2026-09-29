import React, { useState } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { canShareImageFile } from '../utils/imageShare';
import {
  Share2,
  FileDown,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface WhatsAppModalProps {
  invoice: Invoice | null;
  companySettings: CompanySettings;
  lang: Language;
  onClose: () => void;
  onDownloadPdf: (invoice: Invoice) => void | Promise<void>;
  onSharePdf?: (invoice: Invoice) => void | Promise<void>;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  invoice,
  lang,
  onClose,
  onSharePdf,
}) => {
  if (!invoice) return null;

  const t = translations[lang];
  const [imageDownloaded, setImageDownloaded] = useState(false);
  const [showAttachReminder, setShowAttachReminder] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isNativeShareSupported = canShareImageFile();

  const handleShare = async () => {
    if (!onSharePdf) return;
    setIsProcessing('share');
    try {
      await onSharePdf(invoice);
      setImageDownloaded(true);
      setShowAttachReminder(true);
    } finally {
      setIsProcessing(null);
    }
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
              <h3 className="text-sm font-bold">
                {lang === 'ar' ? 'مشاركة الفاتورة عبر واتساب كصورة' : 'Share Invoice on WhatsApp as Image'}
              </h3>
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
                <ImageIcon className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-950 block">
                    {lang === 'ar' ? 'مشاركة صورة الفاتورة مباشرة:' : 'Direct Image File Share (Supported):'}
                  </span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    {lang === 'ar'
                      ? 'يمكنك مشاركة صورة الفاتورة مباشرة واختيار واتساب من قائمة التطبيقات لإرسالها كمرفق صورة عالي الجودة.'
                      : 'You can share the invoice as an image directly. Select WhatsApp in your device share sheet to send it as an image attachment.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessing !== null}
                onClick={handleShare}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                {isProcessing === 'share' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'ar' ? 'جاري فتح المشاركة...' : 'Opening Share Sheet...'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>
                      {lang === 'ar'
                        ? 'مشاركة صورة الفاتورة (اختر واتساب)'
                        : 'Share Invoice Image (Select WhatsApp)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Attach Reminder Banner if user downloaded or clicked fallback */}
          {showAttachReminder && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-900">
                  {lang === 'ar' ? 'تم تجهيز صورة الفاتورة:' : 'Invoice Image Ready:'}
                </span>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  {lang === 'ar'
                    ? 'يرجى الضغط على زر الإرفاق (📎) داخل محادثة واتساب واختيار صورة الفاتورة.'
                    : 'Please attach the downloaded invoice image (📎) in your WhatsApp chat.'}
                </p>
              </div>
            </div>
          )}

          {/* Standard Protocol Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {lang === 'ar' ? 'إرسال الفاتورة كصورة رسمية:' : 'Official Invoice Image Attachment:'}
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {lang === 'ar'
                  ? 'يتم تحويل الفاتورة الكاملة (بما فيها الشعار، العلامة المائية، جدول المعدة، الحسابات والرمز الضريبي) إلى صورة PNG عالية الدقة لإرسالها كمرفق في واتساب بدلاً من النصوص العادية.'
                  : 'The complete invoice (including logo, watermark, equipment table, totals, and QR code) is converted into a high-resolution PNG image attachment instead of plain text.'}
              </p>
            </div>
          </div>

          {/* Action Button: Share / Download Image */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isProcessing !== null}
              onClick={handleShare}
              className="w-full py-3 px-4 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {isProcessing === 'share' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جاري تجهيز الصورة...' : 'Processing Invoice Image...'}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'إرسال الفاتورة عبر واتساب (صورة PNG)'
                      : 'Send Invoice via WhatsApp (PNG Image)'}
                  </span>
                </>
              )}
            </button>
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
