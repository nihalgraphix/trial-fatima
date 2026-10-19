import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Printer, Clock, CheckCircle, Truck, RotateCcw, Search, ChevronRight, Filter } from 'lucide-react';
import { Order } from '../../types';
import { InvoiceModal } from '../checkout/InvoiceModal';

export const OrderHistory: React.FC = () => {
  const { orders, currentUser, setActivePage, setSelectedOrderId, showToast } = useStore();
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const handleCopyInvoiceLink = (orderId: string) => {
    const link = `${window.location.origin}/invoice/${orderId}`;
    navigator.clipboard.writeText(link);
    showToast('Invoice link copied to clipboard!', 'success');
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Processing':
      case 'Confirmed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'All' || order.orderStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717] tracking-tight">Order History</h2>
          <p className="text-xs text-[#6B6B6B]">Track and manage your past stationery purchases</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A1A1A1] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs outline-none focus:border-[#71883F] w-full sm:w-48"
            />
          </div>
          <div className="relative group">
            <button className="p-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl hover:bg-white transition-colors">
              <Filter className="w-4 h-4 text-[#171717]" />
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E8E8E3] rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-10 p-2">
              {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    filterStatus === status ? 'bg-[#EFF4E6] text-[#71883F]' : 'text-[#6B6B6B] hover:bg-[#F7F8F3]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#E8E8E3] rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-[#F7F8F3] rounded-2xl flex items-center justify-center mx-auto text-[#71883F]">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-[#171717]">No orders found</h3>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs mx-auto">
              {searchTerm || filterStatus !== 'All' 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You haven't placed any orders yet. Start shopping to see your history here!"}
            </p>
          </div>
          {!searchTerm && filterStatus === 'All' && (
            <button
              onClick={() => setActivePage('shop')}
              className="px-6 py-2.5 bg-[#71883F] text-white text-xs font-black rounded-xl shadow-xs"
            >
              Start Shopping
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-[#E8E8E3] rounded-3xl overflow-hidden hover:border-[#71883F]/30 transition-all shadow-xs group"
            >
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#F7F8F3] rounded-2xl flex items-center justify-center shrink-0 text-[#71883F]">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-[#171717]">{order.id}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6B6B6B]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {order.date}</span>
                      <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> {order.items.length} items</span>
                      <span className="font-bold text-[#71883F]">₹{order.total}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="px-3 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] hover:bg-white text-[9px] font-black uppercase tracking-wider text-[#171717] rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3 h-3 text-[#71883F]" /> Invoice
                  </button>
                  <button
                    onClick={() => handleCopyInvoiceLink(order.id)}
                    className="px-3 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] hover:bg-white text-[9px] font-black uppercase tracking-wider text-[#171717] rounded-lg flex items-center gap-1.5 transition-all"
                    title="Copy Invoice Link"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setActivePage('order-tracking');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-1.5 bg-[#171717] text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-2xs hover:bg-black transition-all"
                  >
                    Track Order
                  </button>
                </div>

              </div>

              {/* Collapsible Items Preview */}
              <div className="px-6 py-4 bg-[#F7F8F3]/50 border-t border-[#E8E8E3] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-[#E8E8E3] bg-white" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#171717] truncate">{item.name}</p>
                        <p className="text-[9px] text-[#6B6B6B]">Qty: {item.quantity} · ₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-[9px] font-bold text-[#71883F] pl-11">
                      + {order.items.length - 2} more items
                    </p>
                  )}
                </div>
                <div className="flex flex-col justify-center text-[10px] text-[#6B6B6B] space-y-1">
                  {order.trackingNumber && (
                    <p className="flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-[#71883F]" />
                      Tracking: <span className="font-mono font-bold text-[#171717]">{order.trackingNumber}</span>
                    </p>
                  )}
                  {order.estimatedDelivery && (
                    <p className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-[#71883F]" />
                      Est. Delivery: <span className="font-bold text-[#171717]">{order.estimatedDelivery}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
