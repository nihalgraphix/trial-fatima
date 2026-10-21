import React, { useRef } from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import { X, Printer, CheckCircle2, ShieldCheck, Download, FileText } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  isOpen?: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen = true, onClose }) => {
  const { storeSettings } = useStore();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    // In iframe environments (like AI Studio), window.print() can fail or print the parent frame
    // We create a clean, styled isolated iframe for 100% reliable printing
    try {
      const printContents = printAreaRef.current?.innerHTML;
      if (!printContents) {
        window.print();
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tax Invoice - ${order.id} - ${storeSettings?.storeName || 'Fathima Stores'}</title>
              <meta charset="utf-8" />
              <style>
                @page { margin: 15mm; size: auto; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #171717;
                  background: #fff;
                  margin: 0;
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.5;
                }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
                th { background-color: #f7f8f3; font-weight: 700; text-transform: uppercase; font-size: 10px; color: #555; padding: 8px 12px; border-bottom: 1px solid #e8e8e3; text-align: left; }
                td { padding: 10px 12px; border-bottom: 1px solid #e8e8e3; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .font-mono { font-family: monospace; }
                .border-b { border-bottom: 1px solid #e8e8e3; }
                .pt-4 { padding-top: 16px; }
                .pb-4 { padding-bottom: 16px; }
                .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                .badge-paid { background: #dcfce7; color: #166534; }
                .grid { display: flex; justify-content: space-between; margin-bottom: 16px; }
                .col { flex: 1; }
              </style>
            </head>
            <body>
              ${printContents}
            </body>
          </html>
        `);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
          } catch (e) {
            window.print();
          } finally {
            setTimeout(() => document.body.removeChild(iframe), 1500);
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    }
  };

  const handleDownloadBill = () => {
    const finalAmount = order.finalTotal ?? order.total ?? 0;
    const invoiceNum = `INV-${order.id.replace('ORD-', '')}`;
    const storeTitle = storeSettings?.storeName || 'FATHIMA STORES';

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e3;">
            <strong>${item.name || item.product?.name || 'Stationery Item'}</strong>
            ${item.brand ? `<br/><span style="font-size: 10px; color: #666;">Brand: ${item.brand}</span>` : ''}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e3; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e3; text-align: right;">₹${item.price ?? item.product?.price ?? 0}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e3; text-align: right; font-weight: bold;">₹${(item.price ?? item.product?.price ?? 0) * item.quantity}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice ${invoiceNum} - ${storeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px auto; max-width: 800px; padding: 20px; color: #171717; line-height: 1.5; font-size: 13px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #71883F; padding-bottom: 20px; margin-bottom: 20px; }
    .store-name { font-size: 20px; font-weight: 800; color: #71883F; text-transform: uppercase; margin: 0; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; font-size: 18px; color: #171717; }
    .badge { display: inline-block; padding: 4px 10px; background: #EFF4E6; color: #71883F; font-weight: bold; border-radius: 4px; font-size: 11px; text-transform: uppercase; margin-top: 5px; }
    .columns { display: flex; justify-content: space-between; margin-bottom: 25px; }
    .column { width: 48%; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #f7f8f3; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e8e8e3; color: #555; }
    .totals { margin-left: auto; width: 300px; }
    .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
    .totals .grand-total { border-top: 2px solid #171717; font-size: 16px; font-weight: bold; color: #71883F; margin-top: 5px; padding-top: 10px; }
    .footer { border-top: 1px solid #e8e8e3; margin-top: 30px; padding-top: 15px; text-align: center; color: #888; font-size: 11px; }
    @media print {
      body { margin: 0; padding: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #71883F; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1 class="store-name">${storeTitle}</h1>
      <p style="margin: 4px 0 0; color: #666;">${storeSettings?.tagline || 'Premium Stationery & Everyday Office Essentials'}</p>
      <p style="margin: 2px 0 0; color: #666;">${storeSettings?.address || 'MG Road, Near Maharaja Metro, Kochi, Kerala 682011'}</p>
      <p style="margin: 2px 0 0; color: #666;">GSTIN: ${storeSettings?.gstNumber || '32AABCF4521H1Z6'} | Care: ${storeSettings?.contactPhone || '+91 94470 12345'}</p>
    </div>
    <div class="invoice-title">
      <h2>TAX INVOICE</h2>
      <div class="badge">Official Bill • ${order.paymentStatus === 'Paid' ? 'PAID' : 'PAYABLE'}</div>
      <p style="margin: 6px 0 0;"><strong>Invoice #:</strong> ${invoiceNum}</p>
      <p style="margin: 2px 0 0;"><strong>Order ID:</strong> ${order.id}</p>
      <p style="margin: 2px 0 0;"><strong>Date:</strong> ${new Date(order.createdAt || order.date || Date.now()).toLocaleDateString('en-IN')}</p>
    </div>
  </div>

  <div class="columns">
    <div class="column">
      <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; color: #666; margin-bottom: 5px;">Billed & Shipped To:</div>
      <p style="margin: 0; font-weight: bold; font-size: 14px;">${order.shippingAddress?.fullName || order.customerName}</p>
      <p style="margin: 2px 0 0; color: #444;">${order.shippingAddress?.house || ''}, ${order.shippingAddress?.street || ''}</p>
      ${order.shippingAddress?.area ? `<p style="margin: 2px 0 0; color: #444;">${order.shippingAddress.area}</p>` : ''}
      <p style="margin: 2px 0 0; color: #444;">${order.shippingAddress?.city || 'Kochi'}, ${order.shippingAddress?.state || 'Kerala'} - ${order.shippingAddress?.pinCode || '682011'}</p>
      <p style="margin: 4px 0 0; color: #666;">Phone: ${order.shippingAddress?.phone || order.phone}</p>
    </div>
    <div class="column" style="text-align: right;">
      <div style="font-weight: bold; text-transform: uppercase; font-size: 11px; color: #666; margin-bottom: 5px;">Payment & Delivery Mode:</div>
      <p style="margin: 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Online Payment'}</p>
      <p style="margin: 2px 0 0; color: #71883F; font-weight: bold;">Status: ${order.paymentStatus}</p>
      ${order.transactionId ? `<p style="margin: 2px 0 0; font-family: monospace;">Txn ID: ${order.transactionId}</p>` : ''}
      ${order.utrNumber ? `<p style="margin: 2px 0 0; font-family: monospace;">Bank UTR: ${order.utrNumber}</p>` : ''}
      <p style="margin: 2px 0 0; color: #666;">Courier / Method: ${order.deliveryMethod || 'Standard Doorstep Delivery'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div>
      <span style="color: #666;">Subtotal (Incl. GST)</span>
      <span style="font-weight: 600;">₹${order.totalAmount ?? order.subtotal ?? order.total ?? 0}</span>
    </div>
    <div>
      <span style="color: #666;">Delivery Charge</span>
      <span style="font-weight: 600;">${!order.deliveryCharge || order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span>
    </div>
    <div class="grand-total">
      <span>Total Paid</span>
      <span>₹${finalAmount}</span>
    </div>
  </div>

  <div class="footer">
    <p style="margin: 0;">This is a computer-generated GST tax invoice from ${storeTitle}. No physical signature is required.</p>
    <p style="margin: 4px 0 0;">Thank you for shopping with ${storeTitle}! For queries, contact ${storeSettings?.contactEmail || 'care@fathimastores.com'}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill-${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white border border-[#E8E8E3] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8">
        {/* Top bar actions (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E8E8E3] print:hidden gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#71883F]" />
              Tax Invoice &amp; Payment Receipt
            </h3>
            {order.paymentStatus === 'Paid' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Paid
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadBill}
              className="px-3.5 py-1.5 bg-[#F7F8F3] hover:bg-[#E8E8E3] text-[#171717] border border-[#E8E8E3] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Download standalone Bill HTML document"
            >
              <Download className="w-3.5 h-3.5 text-[#71883F]" /> Download Bill (.html)
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#6B6B6B] hover:text-[#171717] rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div ref={printAreaRef} className="text-left space-y-6 text-xs text-[#171717]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#71883F] text-white font-bold flex items-center justify-center text-xs">
                  F
                </span>
                <span className="font-extrabold text-base tracking-tight uppercase">
                  {storeSettings?.storeName || 'FATHIMA STORES'}
                </span>
              </div>
              <p className="text-[#6B6B6B] mt-1">
                {storeSettings?.tagline || 'Premium Retail & Bulk Office Stationery'}
              </p>
              <p className="text-[#6B6B6B]">
                {storeSettings?.address || 'MG Road, Near Maharaja Metro, Kochi, Kerala - 682011'}
              </p>
              {storeSettings?.storeHubName && (
                <p className="text-[#6B6B6B] font-medium">
                  Dispatch Hub: {storeSettings.storeHubName} (GPS: {storeSettings.storeLat?.toFixed(4)},{' '}
                  {storeSettings.storeLng?.toFixed(4)})
                </p>
              )}
              <p className="text-[#6B6B6B]">
                GSTIN: {storeSettings?.gstNumber || '32AABCF4521H1Z6'} | Phone:{' '}
                {storeSettings?.contactPhone || '+91 94470 12345'}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-2.5 py-1 bg-[#EFF4E6] text-[#71883F] font-bold text-[10px] uppercase rounded">
                Tax Invoice
              </span>
              <p className="font-bold text-sm mt-2">Invoice #: INV-{order.id.replace('ORD-', '')}</p>
              <p className="text-[#6B6B6B]">Order ID: {order.id}</p>
              <p className="text-[#6B6B6B]">
                Date:{' '}
                {order.createdAt || order.date
                  ? new Date(order.createdAt || order.date).toLocaleDateString('en-IN')
                  : new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                Billed & Shipped To
              </span>
              <p className="font-bold text-sm">
                {order.shippingAddress?.fullName || order.customerName}
              </p>
              <p className="text-[#6B6B6B] mt-0.5">
                {order.shippingAddress?.house || ''}, {order.shippingAddress?.street || ''}
              </p>
              {order.shippingAddress?.area && (
                <p className="text-[#6B6B6B]">{order.shippingAddress.area}</p>
              )}
              <p className="text-[#6B6B6B]">
                {order.shippingAddress?.city || 'Kochi'},{' '}
                {order.shippingAddress?.state || 'Kerala'} -{' '}
                {order.shippingAddress?.pinCode || '682011'}
              </p>
              <p className="text-[#6B6B6B] mt-1">
                Phone: {order.shippingAddress?.phone || order.phone}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-1">
                Payment & Automated Verification Details
              </span>
              <p className="font-semibold">
                Payment Method:{' '}
                {typeof order.paymentMethod === 'string'
                  ? order.paymentMethod
                  : 'Online Payment'}
              </p>
              <p className="text-[#71883F] font-bold flex sm:justify-end items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Status: {order.paymentStatus}
              </p>
              {order.transactionId && (
                <p className="text-[#171717] font-mono text-[11px] mt-1">
                  Txn ID: <span className="font-bold">{order.transactionId}</span>
                </p>
              )}
              {order.utrNumber && (
                <p className="text-[#171717] font-mono text-[11px]">
                  Bank UTR / RRN: <span className="font-bold">{order.utrNumber}</span>
                </p>
              )}
              <p className="text-[#6B6B6B] mt-1">
                Courier Mode: {order.deliveryMethod || order.courierName || 'Fathima Express'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#E8E8E3] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E3]">
                {(order.items || []).map((item, idx) => {
                  const itemId = item.productId || item.product?.id || `inv-${idx}`;
                  const itemName = item.name || item.product?.name || 'Stationery Product';
                  const itemBrand = item.brand || item.product?.brand || '';
                  const itemPrice = item.price ?? item.product?.price ?? 0;
                  return (
                    <tr key={`${itemId}-${idx}`}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#171717]">{itemName}</p>
                        {itemBrand && (
                          <p className="text-[10px] text-[#6B6B6B]">{itemBrand}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-3 px-3 text-right tabular-nums">₹{itemPrice}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        ₹{itemPrice * item.quantity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal (Incl. 18% GST)</span>
                <span className="font-semibold text-[#171717] tabular-nums">
                  ₹{order.totalAmount ?? order.subtotal ?? order.total ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Shipping Charge</span>
                <span className="font-semibold text-[#171717] tabular-nums">
                  {!order.deliveryCharge || order.deliveryCharge === 0
                    ? 'FREE'
                    : `₹${order.deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#171717] pt-2 border-t border-[#E8E8E3]">
                <span>Grand Total</span>
                <span className="text-[#71883F] tabular-nums">
                  ₹{order.finalTotal ?? order.total ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-[#E8E8E3] text-center text-[11px] text-[#6B6B6B]">
            This is a computer-generated GST tax invoice from{' '}
            {storeSettings?.storeName || 'Fathima Stores'}. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  );
};
