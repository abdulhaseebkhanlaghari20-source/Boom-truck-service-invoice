import React, { useState } from 'react';
import { Invoice, CompanySettings, Language } from '../types/invoice';
import { translations } from '../translations/i18n';
import { canShareImageFile, getInvoiceImageFilename } from '../utils/imageShare';
import {
  Share2,
  FileDown,
  X,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  MessageCircle,
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const isNativeShareSupported = canShareImageFile();
  const filename = getInvoiceImageFilename(invoice.invoiceNumber);

  // Format Saudi or international number for WhatsApp Web
  const getWhatsAppWebUrl = () => {
    const raw = invoice.customerPhone || '';
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return 'https://web.whatsapp.com/';
    const intl = digits.startsWith('05') ? `966${digits.slice(1)}` : digits;
    return `https://web.whatsapp.com/send?phone=${intl}`;
  };

  const handleShareOrDownload = async () => {
    if (!onSharePdf) return;
    setIsProcessing(true);
    try {
      await onSharePdf(invoice);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {lang === 'ar' ? 'مشاركة الفاتورة عبر واتساب كصورة' : 'Share Invoice via WhatsApp (Image)'}
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                {invoice.invoiceNumber} · {invoice.customerName || (lang === 'ar' ? 'بدون اسم' : 'Customer')}
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
          {/* Status Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-emerald-900">
                {lang === 'ar' ? 'صورة الفاتورة عالية الدقة (PNG):' : 'High-Resolution Invoice Image (PNG):'}
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {lang === 'ar'
                  ? `تم تجهيز ملف صورة الفاتورة (${filename}) بجميع التفاصيل، الشعار، والرمز الضريبي لتسليمها كصورة رسمية لعميلك.`
                  : `The official invoice image (${filename}) is generated with all equipment specs, VAT breakdown, and ZATCA QR code.`}
              </p>
            </div>
          </div>

          {/* Action Step 1: Open WhatsApp Web / App */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block">
              {lang === 'ar' ? 'طريقة الإرسال المباشرة:' : 'How to Send to Customer:'}
            </span>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                {lang === 'ar'
                  ? 'افتح محادثة العميل على واتساب.'
                  : 'Open your customer conversation in WhatsApp.'}
              </li>
              <li>
                {lang === 'ar'
                  ? `اضغط على أيقونة الإرفاق (📎 أو 📷) واختر صورة الفاتورة المحمّلة (${filename}).`
                  : `Tap attach (📎 or 📷) and select the downloaded invoice image (${filename}).`}
              </li>
            </ol>

            <a
              href={getWhatsAppWebUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {invoice.customerPhone
                  ? lang === 'ar'
                    ? `فتح محادثة واتساب (${invoice.customerPhone})`
                    : `Open WhatsApp Chat (${invoice.customerPhone})`
                  : lang === 'ar'
                  ? 'فتح واتساب ويب (WhatsApp Web)'
                  : 'Open WhatsApp Web'}
              </span>
            </a>
          </div>

          {/* Action Step 2: Download / Re-share Image */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleShareOrDownload}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span>{lang === 'ar' ? 'جاري التجهيز...' : 'Preparing...'}</span>
                </>
              ) : (
                <>
                  {isNativeShareSupported ? (
                    <>
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {lang === 'ar'
                          ? 'مشاركة عبر قائمة الهاتف (اختر واتساب)'
                          : 'Share via Device Sheet (Select WhatsApp)'}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-slate-600" />
                      <span>
                        {lang === 'ar'
                          ? `إعادة تنزيل صورة الفاتورة (${filename})`
                          : `Re-download Invoice Image (${filename})`}
                      </span>
                    </>
                  )}
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
