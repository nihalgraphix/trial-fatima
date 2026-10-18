import React, { useState } from 'react';
import { Order } from '../../types';
import { X, Printer, Download, BookOpen, FileText, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-invoice');
    if (!element) return;

    setIsGeneratingPdf(true);

    const opt = {
      margin: 8,
      filename: `Fathima_Stores_Invoice_${order.id}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export failed, using HTML invoice download fallback:', err);
      
      // Fallback HTML invoice document download
      const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id} - Fathima Stores</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; color: #171717; background: #ffffff; }
    .header { border-bottom: 2px solid #171717; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 22px; font-weight: 800; color: #71883F; }
    .details { margin: 24px 0; display: flex; justify-content: space-between; font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { font-weight: 700; background: #FAF7F2; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #171717; }
    td { border-bottom: 1px solid #E8E8E3; padding: 12px; text-align: left; font-size: 13px; }
    .total-box { margin-top: 24px; text-align: right; font-size: 13px; line-height: 1.8; }
    .grand-total { font-size: 18px; font-weight: 800; color: #71883F; border-top: 2px solid #171717; padding-top: 8px; margin-top: 8px; }
    .footer { margin-top: 40px; font-size: 12px; color: #6B6B6B; text-align: center; border-top: 1px solid #E8E8E3; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">FATHIMA STORES</div>
      <p style="margin:4px 0; font-size:12px; color:#6B6B6B;">Quality Stationery & Everyday Essentials</p>
      <p style="margin:2px 0; font-size:12px; color:#6B6B6B;">Commercial Complex, MG Road, Trivandrum, Kerala 695001</p>
      <p style="margin:2px 0; font-size:12px; color:#6B6B6B;">GSTIN: 32AABCF1234F1Z8 · care@fathimastores.com</p>
    </div>
    <div style="text-align: right;">
      <span style="background: #EFF4E6; color: #71883F; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px;">OFFICIAL RECEIPT</span>
      <h3 style="margin: 8px 0 2px 0; font-size: 16px;">INVOICE #${order.id}</h3>
      <p style="margin:2px 0; font-size:12px; color:#6B6B6B;">Date: ${order.date}</p>
      <p style="margin:2px 0; font-size:12px; color:#6B6B6B;">Payment: ${order.paymentMethod} (${order.paymentStatus})</p>
    </div>
  </div>

  <div class="details">
    <div>
      <strong style="text-transform: uppercase; color: #6B6B6B; font-size: 11px;">Billed To:</strong><br/>
      <span style="font-weight: bold; font-size: 14px;">${order.customerName}</span><br/>
      Phone: ${order.phone || 'N/A'}<br/>
      Email: ${order.email || 'N/A'}
    </div>
    <div style="text-align: right;">
      <strong style="text-transform: uppercase; color: #6B6B6B; font-size: 11px;">Shipped / Delivered To:</strong><br/>
      ${order.shippingAddress?.house || 'Outlet Counter'}, ${order.shippingAddress?.street || 'MG Road'}<br/>
      ${order.shippingAddress?.area || ''}, ${order.shippingAddress?.city || 'Trivandrum'} - ${order.shippingAddress?.pinCode || '695001'}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th>SKU</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item) => `
        <tr>
          <td style="font-weight: 600;">${item.name}</td>
          <td style="font-family: monospace; color: #6B6B6B;">${item.sku || 'N/A'}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">₹${item.price}</td>
          <td style="text-align:right; font-weight: bold;">₹${item.price * item.quantity}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <p style="margin:2px 0;">Subtotal: <strong>₹${order.subtotal}</strong></p>
    ${order.discount ? `<p style="margin:2px 0; color:#71883F;">Discount (${order.couponCode || 'Applied'}): <strong>-₹${order.discount}</strong></p>` : ''}
    <p style="margin:2px 0;">Delivery Charge: <strong>${order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</strong></p>
    <div class="grand-total">
      Grand Total: ₹${order.total}
    </div>
  </div>

  <div class="footer">
    <p style="font-weight: bold; margin-bottom: 4px;">Thank you for shopping with Fathima Stores!</p>
    <p style="margin:0;">For inquiries, call +91 98450 12345 or email care@fathimastores.com</p>
  </div>
</body>
</html>`;

      const blob = new Blob([invoiceHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Fathima_Stores_Invoice_${order.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar with Print and PDF Download Buttons */}
        <div className="px-6 py-3.5 bg-[#F7F8F3] border-b border-[#E8E8E3] flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#71883F]" />
            <span>Tax Invoice · #{order.id}</span>
          </span>

          <div className="flex items-center gap-2">
            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] hover:bg-[#FAF7F2] rounded-lg text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 text-[#71883F] animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#71883F]" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-[#E8E8E3] rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 overflow-y-auto space-y-6 text-left bg-white">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E8E8E3] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded bg-[#71883F] text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-[#171717]">FATHIMA STORES</h2>
              </div>
              <p className="text-xs text-[#6B6B6B]">Quality Stationery & Everyday Supplies</p>
              <p className="text-xs text-[#6B6B6B]">Commercial Complex, MG Road, Trivandrum, Kerala 695001</p>
              <p className="text-xs text-[#6B6B6B]">GSTIN: 32AABCF1234F1Z8 · care@fathimastores.com</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EFF4E6] text-[#71883F]">
                OFFICIAL RECEIPT
              </span>
              <h3 className="text-sm font-extrabold text-[#171717] mt-2">INVOICE #{order.id}</h3>
              <p className="text-xs text-[#6B6B6B]">Date: {order.date}</p>
              <p className="text-xs text-[#6B6B6B]">Payment: {order.paymentMethod} ({order.paymentStatus})</p>
            </div>
          </div>

          {/* Customer & Shipping info */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b border-[#E8E8E3] pb-6">
            <div>
              <h4 className="font-bold text-[#171717] uppercase tracking-wider mb-1">Billed To:</h4>
              <p className="font-semibold text-[#171717]">{order.customerName}</p>
              <p className="text-[#6B6B6B]">{order.phone}</p>
              <p className="text-[#6B6B6B]">{order.email}</p>
            </div>

            <div>
              <h4 className="font-bold text-[#171717] uppercase tracking-wider mb-1">Shipped To:</h4>
              <p className="text-[#6B6B6B]">
                {order.shippingAddress.house}, {order.shippingAddress.street}
              </p>
              <p className="text-[#6B6B6B]">
                {order.shippingAddress.area}, {order.shippingAddress.city}
              </p>
              <p className="text-[#6B6B6B]">
                {order.shippingAddress.district}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#171717] text-[#171717]">
                  <th className="py-2 font-bold">Item Description</th>
                  <th className="py-2 font-bold">SKU</th>
                  <th className="py-2 font-bold text-center">Qty</th>
                  <th className="py-2 font-bold text-right">Price</th>
                  <th className="py-2 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E3]">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium text-[#171717]">{item.name}</td>
                    <td className="py-2.5 text-[#6B6B6B] font-mono">{item.sku}</td>
                    <td className="py-2.5 text-center text-[#171717] tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right text-[#171717] tabular-nums">₹{item.price}</td>
                    <td className="py-2.5 text-right font-semibold text-[#171717] tabular-nums">
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t border-[#E8E8E3]">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#171717] tabular-nums">₹{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#71883F]">
                  <span>Discount ({order.couponCode || 'Promo'})</span>
                  <span className="font-semibold tabular-nums">-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Delivery Charge</span>
                <span className="font-semibold text-[#171717] tabular-nums">
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#171717] pt-2 border-t border-[#171717]">
                <span>Grand Total</span>
                <span className="text-[#71883F] tabular-nums">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-[#6B6B6B] text-center pt-6 border-t border-[#E8E8E3]">
            <p>Thank you for shopping with Fathima Stores!</p>
            <p>For inquiries or support, call +91 98450 12345 or visit www.fathimastores.com</p>
          </div>

        </div>

      </div>
    </div>
  );
};
