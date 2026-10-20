import React from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  isOpen?: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen = true, onClose }) => {
  const { storeSettings } = useStore();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white border border-[#E8E8E3] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8">
        {/* Top bar actions (hidden on print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E8E8E3] print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider">
              Tax Invoice & Payment Receipt
            </h3>
            {order.paymentStatus === 'Paid' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Paid
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#6B6B6B] hover:text-[#171717] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="text-left space-y-6 text-xs text-[#171717]">
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
                {storeSettings?.address || 'MG Road, Opposite Secretariat, Trivandrum, Kerala - 695001'}
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
                {order.shippingAddress?.city || 'Trivandrum'},{' '}
                {order.shippingAddress?.state || 'Kerala'} -{' '}
                {order.shippingAddress?.pinCode || '695001'}
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
