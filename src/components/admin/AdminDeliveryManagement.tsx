import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  UserCheck,
  Search,
  ArrowRight,
  User,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { DeliveryTrackingMap } from '../delivery/DeliveryTrackingMap';

export const AdminDeliveryManagement: React.FC = () => {
  const {
    orders,
    deliveryPersonnel,
    deliveryAssignments,
    assignDeliveryPerson,
    updateOrderStatus,
    showToast,
  } = useStore();

  const nonArchivedOrders = orders.filter((o) => !o.isArchived && o.orderStatus !== 'Cancelled');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    nonArchivedOrders[0]?.id || null
  );
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!selectedOrderId && nonArchivedOrders.length > 0) {
      setSelectedOrderId(nonArchivedOrders[0].id);
    }
  }, [nonArchivedOrders, selectedOrderId]);

  const activeAssignments = deliveryAssignments.filter(
    (a) => a.status !== 'Delivered' && a.status !== 'Failed'
  );

  // Orders that need assignment
  const unassignedOrders = nonArchivedOrders.filter(
    (o) =>
      o.orderStatus !== 'Delivered' &&
      !deliveryAssignments.find((a) => a.orderId === o.id)
  );

  const filteredOrders = nonArchivedOrders.filter((order) => {
    const assignment = deliveryAssignments.find((a) => a.orderId === order.id);
    if (filter === 'pending' && (assignment || order.orderStatus === 'Delivered')) return false;
    if (
      filter === 'active' &&
      !(
        (assignment && assignment.status !== 'Delivered') ||
        order.orderStatus === 'Out for Delivery' ||
        order.orderStatus === 'Shipped'
      )
    ) {
      return false;
    }
    if (
      filter === 'completed' &&
      order.orderStatus !== 'Delivered' &&
      assignment?.status !== 'Delivered'
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder =
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.shippingAddress?.area || '').toLowerCase().includes(q) ||
        (order.shippingAddress?.city || '').toLowerCase().includes(q) ||
        (assignment?.deliveryPersonName || '').toLowerCase().includes(q);
      if (!matchOrder) return false;
    }
    return true;
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const selectedAssignment = deliveryAssignments.find((a) => a.orderId === selectedOrderId);
  const selectedPersonnel = selectedAssignment
    ? deliveryPersonnel.find((p) => p.id === selectedAssignment.deliveryPersonId)
    : undefined;

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">
            Live Delivery Map & Route Navigation
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Locate customer delivery pins on Google Maps, calculate driving routes, and launch turn-by-turn navigation
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
            <MapPin className="w-4 h-4 text-[#71883F]" />
            <span className="text-xs font-bold text-[#171717]">
              {nonArchivedOrders.length} Customer Delivery Locations
            </span>
          </div>
          <div className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
            <UserCheck className="w-4 h-4 text-[#71883F]" />
            <span className="text-xs font-bold text-[#171717]">
              {deliveryPersonnel.filter((p) => p.status === 'available').length} Available Agents
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Left Sidebar: Customer Delivery Orders */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Tabs for Jobs */}
          <div className="grid grid-cols-4 bg-[#F7F8F3] p-1 rounded-xl border border-[#E8E8E3] gap-1">
            {[
              { id: 'all' as const, label: `All (${nonArchivedOrders.length})` },
              { id: 'pending' as const, label: `Unassigned (${unassignedOrders.length})` },
              { id: 'active' as const, label: `Active (${activeAssignments.length})` },
              {
                id: 'completed' as const,
                label: `Done (${nonArchivedOrders.filter((o) => o.orderStatus === 'Delivered').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-[#71883F] shadow-2xs'
                    : 'text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search Order ID, Customer, or Area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs outline-none focus:border-[#71883F]"
            />
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#E8E8E3] rounded-2xl">
                <p className="text-xs text-[#6B6B6B]">No matching delivery orders found.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const assignment = deliveryAssignments.find((a) => a.orderId === order.id);
                const hasPin = Boolean(order.shippingAddress?.lat && order.shippingAddress?.lng);
                const destQuery = hasPin
                  ? `${order.shippingAddress.lat},${order.shippingAddress.lng}`
                  : encodeURIComponent(
                      `${order.shippingAddress?.house || ''}, ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || 'Trivandrum'}`
                    );

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedOrderId === order.id
                        ? 'bg-white border-[#71883F] shadow-md ring-2 ring-[#71883F]/10'
                        : 'bg-white border-[#E8E8E3] hover:border-[#71883F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-black text-[#71883F]">
                        #{order.id}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          order.orderStatus === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : assignment
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {assignment ? assignment.status.replace(/_/g, ' ') : order.orderStatus}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#171717]">{order.customerName}</p>
                    <p className="text-[11px] text-[#6B6B6B] line-clamp-1 mt-0.5">
                      {order.shippingAddress?.house}, {order.shippingAddress?.street},{' '}
                      {order.shippingAddress?.area || order.shippingAddress?.city}
                    </p>

                    {hasPin && (
                      <p className="text-[10px] font-mono text-[#71883F] font-semibold mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>
                          GPS: {order.shippingAddress.lat!.toFixed(4)},{' '}
                          {order.shippingAddress.lng!.toFixed(4)}
                        </span>
                      </p>
                    )}

                    {assignment && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#E8E8E3] text-[10px] text-[#171717]">
                        <User className="w-3 h-3 text-[#71883F]" />
                        <span className="font-bold">Agent: {assignment.deliveryPersonName}</span>
                        <span className="text-[#6B6B6B] ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {assignment.estimatedMinutes || 20}m
                        </span>
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-[#E8E8E3] flex justify-between items-center gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 bg-[#EFF4E6] hover:bg-[#71883F] text-[#71883F] hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Drive in Google Maps</span>
                      </a>
                      <span className="text-[10px] font-bold text-[#71883F] flex items-center gap-1">
                        <span>Locate on Map</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Content: Detail & Interactive Route Map */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pb-10">
          {selectedOrder ? (
            <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#171717]">
                      Customer Location & Route (#{selectedOrder.id})
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4E6] text-[#71883F]">
                      {selectedOrder.deliveryMethod || 'Standard Delivery'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Full Address: {selectedOrder.shippingAddress.house},{' '}
                    {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.area},{' '}
                    {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.pinCode}
                  </p>
                </div>

                {/* Quick Dispatch / Status Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {!selectedAssignment && (
                    <select
                      className="text-xs bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl px-3 py-2 font-semibold outline-none focus:border-[#71883F] cursor-pointer"
                      onChange={async (e) => {
                        if (e.target.value) {
                          await assignDeliveryPerson(selectedOrder.id, e.target.value);
                          showToast(`Order #${selectedOrder.id} assigned to delivery partner!`);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Assign Delivery Agent...
                      </option>
                      {deliveryPersonnel.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.vehicleType} • {p.status})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedOrder.orderStatus !== 'Out for Delivery' &&
                    selectedOrder.orderStatus !== 'Delivered' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'Out for Delivery')}
                        className="px-3 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Mark Out for Delivery</span>
                      </button>
                    )}

                  {selectedOrder.orderStatus !== 'Delivered' && (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'Delivered')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E8E8E3]">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                    Customer & Contact
                  </span>
                  <p className="text-xs font-bold text-[#171717] mt-0.5">
                    {selectedOrder.customerName}
                  </p>
                  <a
                    href={`tel:${selectedOrder.phone}`}
                    className="text-[11px] font-semibold text-[#71883F] hover:underline flex items-center gap-1 mt-1"
                  >
                    <Phone className="w-3 h-3" /> {selectedOrder.phone}
                  </a>
                </div>
                <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E8E8E3]">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                    Pinned Delivery Address
                  </span>
                  <p className="text-xs font-bold text-[#171717] line-clamp-1 mt-0.5">
                    {selectedOrder.shippingAddress.house}, {selectedOrder.shippingAddress.street}
                  </p>
                  <p className="text-[10px] text-[#6B6B6B] line-clamp-1 mt-0.5">
                    {selectedOrder.shippingAddress.area}, {selectedOrder.shippingAddress.city} (
                    {selectedOrder.shippingAddress.pinCode})
                  </p>
                </div>
                <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E8E8E3]">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">
                    Delivery Status & Payment
                  </span>
                  <p className="text-xs font-bold text-[#71883F] mt-0.5">
                    {selectedOrder.orderStatus}
                  </p>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                    ₹{selectedOrder.total} • {selectedOrder.paymentMethod} (
                    {selectedOrder.paymentStatus})
                  </p>
                </div>
              </div>

              <DeliveryTrackingMap
                order={selectedOrder}
                storeAddress="Commercial Complex, MG Road, Trivandrum, Kerala 695001"
                deliveryPerson={selectedPersonnel}
              />
            </div>
          ) : (
            <div className="h-full bg-white border border-[#E8E8E3] rounded-3xl flex flex-col items-center justify-center p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#F7F8F3] text-[#71883F] flex items-center justify-center shadow-xs">
                <Truck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#171717]">Select an Order to Locate & Drive</h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm">
                  Click on any customer order on the left to locate their exact delivery pin on Google Maps, view the route, and start turn-by-turn driving directions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
