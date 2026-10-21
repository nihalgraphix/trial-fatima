import React, { useState } from 'react';
import { Order, ShippingAddress } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  Crown,
  UserCheck,
  Clock,
  Package,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';

export interface AdminCustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  role?: string;
  isDriver?: boolean;
  deliveryPortalAccess?: boolean;
  permissionDocId?: string;
  city?: string;
  state?: string;
  bio?: string;
  addresses?: ShippingAddress[];
  defaultAddress?: ShippingAddress;
  createdAt?: string;
  totalSpent: number;
  ordersCount: number;
  lastOrderDate?: string;
  orders: Order[];
  isRegistered: boolean;
  status: 'VIP' | 'Regular' | 'New';
}

interface AdminCustomerModalProps {
  customer: AdminCustomerRecord;
  onClose: () => void;
  onViewOrder: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
  onCreateOrder?: (customer: AdminCustomerRecord) => void;
}

export const AdminCustomerModal: React.FC<AdminCustomerModalProps> = ({
  customer,
  onClose,
  onViewOrder,
  onViewInvoice,
  onCreateOrder,
}) => {
  const {
    toggleCustomerVIP,
    grantCustomerAdmin,
    grantCustomerDriver,
    revokeCustomerDeliveryPortalAccess,
    userPermissions,
    storeSettings,
    deleteCustomer,
  } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'products' | 'profile'>('orders');

  const linkedPermissionDoc = React.useMemo(() => {
    const emailNorm = (customer.email || '').toLowerCase().trim();
    return (userPermissions || []).find(
      (p) =>
        (customer.permissionDocId && p.id === customer.permissionDocId) ||
        (customer.id && (p.userId === customer.id || p.id === customer.id)) ||
        (emailNorm && p.email?.toLowerCase().trim() === emailNorm)
    );
  }, [customer, userPermissions]);

  const isCustomerDriver = React.useMemo(() => {
    const emailNorm = (customer.email || '').toLowerCase().trim();
    const removedEmails = new Set(
      (storeSettings?.removedDriverEmails || []).map((e) => e.toLowerCase().trim())
    );
    const removedIds = new Set(storeSettings?.removedDriverIds || []);
    if (removedEmails.has(emailNorm) || (customer.id && removedIds.has(customer.id))) {
      return false;
    }
    if (linkedPermissionDoc) {
      return Boolean(
        linkedPermissionDoc.deliveryPortalAccess ||
          linkedPermissionDoc.isDriver ||
          linkedPermissionDoc.role === 'delivery' ||
          linkedPermissionDoc.accessLevels?.includes('delivery_portal')
      );
    }
    const driverEmailSet = new Set(
      (storeSettings?.customDriverEmails || []).map((e) => e.toLowerCase().trim())
    );
    const driverIdSet = new Set(storeSettings?.customDriverIds || []);
    return (
      driverEmailSet.has(emailNorm) ||
      (customer.id && driverIdSet.has(customer.id)) ||
      customer.role === 'delivery' ||
      Boolean(customer.isDriver) ||
      Boolean(customer.deliveryPortalAccess)
    );
  }, [
    customer,
    linkedPermissionDoc,
    storeSettings?.customDriverEmails,
    storeSettings?.customDriverIds,
    storeSettings?.removedDriverEmails,
    storeSettings?.removedDriverIds,
  ]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Aggregate purchased products across all customer orders
  const purchasedProducts = React.useMemo(() => {
    const map = new Map<string, { productId: string; name: string; image?: string; quantity: number; totalSpent: number; price: number }>();
    customer.orders.forEach((order) => {
      order.items?.forEach((item) => {
        const existing = map.get(item.productId) || {
          productId: item.productId,
          name: item.name,
          image: item.image,
          quantity: 0,
          totalSpent: 0,
          price: item.price,
        };
        existing.quantity += item.quantity;
        existing.totalSpent += item.price * item.quantity;
        map.set(item.productId, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customer.orders]);

  const aov = customer.ordersCount > 0 ? Math.round(customer.totalSpent / customer.ordersCount) : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E8E3] bg-[#FAFBF7] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/50 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {customer.photoURL ? (
                <img
                  src={customer.photoURL}
                  alt={customer.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#71883F] to-[#4D6026] text-white flex items-center justify-center text-xl font-bold tracking-wider shadow-md">
                  {getInitials(customer.name)}
                </div>
              )}
              {customer.status === 'VIP' && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs" title="VIP Customer">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#171717]">{customer.name}</h2>
                
                {/* Status Badges */}
                {customer.status === 'VIP' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-600 fill-amber-600" /> VIP Customer
                  </span>
                )}
                {customer.status === 'Regular' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF4E6] text-[#71883F] border border-[#71883F]/30">
                    Regular Customer
                  </span>
                )}
                {customer.status === 'New' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3 h-3" /> New Customer
                  </span>
                )}

                {customer.isRegistered ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <UserCheck className="w-3 h-3" /> Registered User
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                    Guest Checkout
                  </span>
                )}

                {customer.role && customer.role !== 'customer' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> {customer.role}
                  </span>
                )}

                {isCustomerDriver && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                    <Truck className="w-3 h-3" /> Authorized Driver
                  </span>
                )}
              </div>

              {/* Contact info snippets */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B6B6B]">
                {customer.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#71883F]" />
                    <a href={`mailto:${customer.email}`} className="hover:text-[#71883F] hover:underline">
                      {customer.email}
                    </a>
                    <button
                      onClick={() => handleCopy(customer.email, 'email')}
                      className="p-1 hover:text-[#171717] rounded"
                      title="Copy email"
                    >
                      {copiedKey === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                    </button>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#71883F]" />
                    <a href={`tel:${customer.phone}`} className="hover:text-[#71883F] hover:underline">
                      {customer.phone}
                    </a>
                    <button
                      onClick={() => handleCopy(customer.phone, 'phone')}
                      className="p-1 hover:text-[#171717] rounded"
                      title="Copy phone"
                    >
                      {copiedKey === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                    </button>
                  </div>
                )}

                {(customer.city || customer.state) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* VIP & Admin Management Controls */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCustomerVIP(customer.email || customer.id, customer.status !== 'VIP')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    customer.status === 'VIP'
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>{customer.status === 'VIP' ? 'Remove VIP Status' : 'Make VIP Customer'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (isCustomerDriver) {
                      await revokeCustomerDeliveryPortalAccess(customer.email || customer.id, customer.id);
                    } else {
                      await grantCustomerDriver(customer.email || customer.id, true, {
                        userId: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    isCustomerDriver
                      ? 'bg-emerald-100 text-emerald-900 hover:bg-rose-100 hover:text-rose-900 border border-emerald-300'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                  title={
                    isCustomerDriver
                      ? `Delete Delivery Portal Permission Doc (${linkedPermissionDoc?.id || customer.permissionDocId || 'user_permissions'})`
                      : 'Grant Delivery Portal Access'
                  }
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>
                    {isCustomerDriver
                      ? 'Delete Delivery Portal Access'
                      : 'Make Driver (Grant Driver Portal)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => grantCustomerAdmin(customer.email || customer.id, customer.role !== 'admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    customer.role === 'admin'
                      ? 'bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300'
                      : 'bg-purple-700 hover:bg-purple-800 text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{customer.role === 'admin' ? 'Revoke Admin Access' : 'Grant Admin Access'}</span>
                </button>

                {confirmingDelete ? (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                    <span className="text-xs text-rose-700 font-bold px-1">Confirm Delete?</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (isCustomerDriver) {
                          await revokeCustomerDeliveryPortalAccess(
                            customer.email || customer.id,
                            customer.id
                          );
                        }
                        await deleteCustomer(customer.email || customer.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#E8E8E3]">
            <div className="bg-white p-3 rounded-xl border border-[#E8E8E3] shadow-2xs">
              <span className="text-[11px] font-medium text-[#6B6B6B] block">Total Spent</span>
              <span className="text-lg font-extrabold text-[#71883F] tabular-nums">
                ₹{customer.totalSpent.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E8E8E3] shadow-2xs">
              <span className="text-[11px] font-medium text-[#6B6B6B] block">Orders Placed</span>
              <span className="text-lg font-bold text-[#171717] tabular-nums">
                {customer.ordersCount}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E8E8E3] shadow-2xs">
              <span className="text-[11px] font-medium text-[#6B6B6B] block">Avg Order Value (AOV)</span>
              <span className="text-lg font-bold text-[#171717] tabular-nums">
                ₹{aov.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E8E8E3] shadow-2xs">
              <span className="text-[11px] font-medium text-[#6B6B6B] block">Last Activity</span>
              <span className="text-xs font-semibold text-[#171717] truncate block mt-1" title={customer.lastOrderDate || customer.createdAt || 'N/A'}>
                {customer.lastOrderDate || customer.createdAt ? new Date(customer.lastOrderDate || customer.createdAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-6 border-b border-[#E8E8E3] bg-white flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'orders'
                ? 'border-[#71883F] text-[#71883F]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Order History ({customer.orders.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'addresses'
                ? 'border-[#71883F] text-[#71883F]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Shipping Addresses ({customer.addresses?.length || (customer.defaultAddress ? 1 : 0)})
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'products'
                ? 'border-[#71883F] text-[#71883F]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Purchased Products ({purchasedProducts.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#71883F] text-[#71883F]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Profile & Details
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {customer.orders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#171717]">No Orders Placed Yet</h4>
                  <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto">
                    This customer has an account created, but hasn't completed any store purchases yet.
                  </p>
                  {onCreateOrder && (
                    <button
                      onClick={() => onCreateOrder(customer)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#71883F] text-white rounded-lg text-xs font-semibold hover:bg-[#5b6f32]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Order for Customer
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#E8E8E3] border border-[#E8E8E3] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {customer.orders.map((order) => {
                    const statusColor = 
                      order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800';

                    return (
                      <div key={order.id} className="p-4 hover:bg-[#F9FAF6]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#171717]">{order.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                              {order.orderStatus}
                            </span>
                            <span className="text-[11px] text-[#6B6B6B]">{order.date}</span>
                          </div>
                          
                          <div className="text-xs text-[#6B6B6B] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span>{order.items?.length || 0} items</span>
                            <span>•</span>
                            <span>Payment: <strong className="text-neutral-700 font-medium">{order.paymentMethod}</strong> ({order.paymentStatus})</span>
                            {order.deliveryMethod && (
                              <>
                                <span>•</span>
                                <span>Delivery: {order.deliveryMethod}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="text-base font-extrabold text-[#71883F] tabular-nums">
                            ₹{order.total.toLocaleString('en-IN')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {onViewInvoice && (
                              <button
                                onClick={() => onViewInvoice(order)}
                                className="px-2.5 py-1 bg-white border border-[#E8E8E3] hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 flex items-center gap-1 shadow-2xs"
                                title="View / Print Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-neutral-500" /> Invoice
                              </button>
                            )}
                            <button
                              onClick={() => onViewOrder(order)}
                              className="px-3 py-1 bg-[#71883F] text-white hover:bg-[#5b6f32] rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              {(!customer.addresses || customer.addresses.length === 0) && !customer.defaultAddress ? (
                <div className="py-12 text-center text-xs text-[#6B6B6B]">
                  No delivery address saved for this customer yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(customer.addresses && customer.addresses.length > 0 ? customer.addresses : [customer.defaultAddress!]).map((addr, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-[#E8E8E3] rounded-2xl relative shadow-2xs space-y-2 hover:border-[#71883F]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#71883F]" />
                          Address #{idx + 1}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4E6] text-[#71883F] border border-[#71883F]/30">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#171717] space-y-0.5 leading-relaxed">
                        <p className="font-semibold">{addr.fullName}</p>
                        <p className="text-[#6B6B6B]">{[addr.house, addr.street].filter(Boolean).join(', ')}</p>
                        {addr.area && <p className="text-[#6B6B6B]">{addr.area}</p>}
                        <p className="font-medium text-neutral-800">
                          {[addr.city, addr.district, addr.state].filter(Boolean).join(', ')} - {addr.pinCode}
                        </p>
                        {addr.phone && (
                          <p className="text-[#6B6B6B] pt-1">Phone: {addr.phone}</p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const fullAddr = `${addr.fullName}\n${[addr.house, addr.street, addr.area].filter(Boolean).join(', ')}\n${[addr.city, addr.district, addr.state].filter(Boolean).join(', ')} - ${addr.pinCode}\nPhone: ${addr.phone}`;
                          handleCopy(fullAddr, `addr-${idx}`);
                        }}
                        className="text-[11px] font-medium text-[#71883F] hover:underline flex items-center gap-1 pt-1"
                      >
                        {copiedKey === `addr-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copied Address
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Address Text
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PURCHASED PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              {purchasedProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B6B6B]">
                  No items purchased yet.
                </div>
              ) : (
                <div className="border border-[#E8E8E3] rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-[#E8E8E3]">
                  {purchasedProducts.map((item) => (
                    <div key={item.productId} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-[#E8E8E3] overflow-hidden flex items-center justify-center shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-semibold text-[#171717]">{item.name}</h5>
                          <span className="text-[11px] text-[#6B6B6B]">
                            {item.quantity} unit{item.quantity > 1 ? 's' : ''} purchased · ₹{item.price} each
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[#71883F] tabular-nums block">
                          ₹{item.totalSpent.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-neutral-400">Total Spent</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE & SYSTEM DETAILS */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#FAFBF7] border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-sm text-[#171717]">Customer Profile Summary</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Customer Identification (UID)</span>
                    <span className="font-mono text-xs text-[#171717] break-all">{customer.id}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Account Status</span>
                    <span className="font-semibold text-[#171717]">
                      {customer.isRegistered ? 'Registered User Account' : 'Guest Buyer (Order Based)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Email Address</span>
                    <span className="font-semibold text-[#171717]">{customer.email || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Contact Phone</span>
                    <span className="font-semibold text-[#171717]">{customer.phone || 'N/A'}</span>
                  </div>

                  {customer.createdAt && (
                    <div>
                      <span className="text-[11px] text-[#6B6B6B] block">Registered On</span>
                      <span className="font-semibold text-[#171717]">
                        {new Date(customer.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                      </span>
                    </div>
                  )}

                  {customer.lastOrderDate && (
                    <div>
                      <span className="text-[11px] text-[#6B6B6B] block">Most Recent Order</span>
                      <span className="font-semibold text-[#171717]">{customer.lastOrderDate}</span>
                    </div>
                  )}

                  {customer.bio && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-[#6B6B6B] block">Customer Notes / Bio</span>
                      <p className="text-neutral-700 bg-white p-2.5 rounded-lg border border-[#E8E8E3] mt-1">
                        {customer.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E8E8E3] bg-[#FAFBF7] flex items-center justify-between">
          <div className="text-xs text-[#6B6B6B]">
            Showing records for <strong className="text-[#171717]">{customer.name}</strong>
          </div>

          <div className="flex items-center gap-2">
            {onCreateOrder && (
              <button
                onClick={() => onCreateOrder(customer)}
                className="px-3.5 py-2 bg-white border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-semibold text-[#71883F] flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Direct Order
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#71883F] hover:bg-[#5b6f32] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
