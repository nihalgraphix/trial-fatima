import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Truck, MapPin, Phone, Clock, UserCheck, Search, Filter, ArrowRight, User } from 'lucide-react';
import { DeliveryTrackingMap } from '../delivery/DeliveryTrackingMap';
import { Order, DeliveryPersonnel, DeliveryAssignment } from '../../types';

export const AdminDeliveryManagement: React.FC = () => {
  const { 
    orders, 
    deliveryPersonnel, 
    deliveryAssignments, 
    assignDeliveryPerson,
    showToast 
  } = useStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const activeAssignments = deliveryAssignments.filter(a => a.status !== 'Delivered' && a.status !== 'Failed');
  const completedAssignments = deliveryAssignments.filter(a => a.status === 'Delivered' || a.status === 'Failed');
  
  // Orders that need assignment
  const unassignedOrders = orders.filter(o => 
    (o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing') && 
    !deliveryAssignments.find(a => a.orderId === o.id)
  );

  const filteredAssignments = deliveryAssignments.filter(a => {
    if (filter === 'active' && (a.status === 'Delivered' || a.status === 'Failed')) return false;
    if (filter === 'completed' && a.status !== 'Delivered' && a.status !== 'Failed') return false;
    if (searchQuery && !a.orderId.toLowerCase().includes(searchQuery.toLowerCase()) && !a.deliveryPersonName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedAssignment = deliveryAssignments.find(a => a.orderId === selectedOrderId);
  const selectedPersonnel = selectedAssignment ? deliveryPersonnel.find(p => p.id === selectedAssignment.deliveryPersonId) : undefined;

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Delivery Management</h2>
          <p className="text-xs text-[#6B6B6B]">Track live shipments and manage delivery assignments</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
            <UserCheck className="w-4 h-4 text-[#71883F]" />
            <span className="text-xs font-bold text-[#171717]">{deliveryPersonnel.filter(p => p.status === 'available').length} Available Agents</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Left Sidebar: Unassigned & Active */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          
          {/* Tabs for Jobs */}
          <div className="flex bg-[#F7F8F3] p-1 rounded-xl border border-[#E8E8E3]">
            <button 
              onClick={() => setFilter('active')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${filter === 'active' ? 'bg-white text-[#71883F] shadow-2xs' : 'text-[#6B6B6B]'}`}
            >
              Active ({activeAssignments.length})
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${filter === 'pending' ? 'bg-white text-[#71883F] shadow-2xs' : 'text-[#6B6B6B]'}`}
            >
              Unassigned ({unassignedOrders.length})
            </button>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by Order ID or Agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs outline-none focus:border-[#71883F]"
            />
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
          </div>

          {filter === 'pending' ? (
            <div className="space-y-3">
              {unassignedOrders.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E8E8E3] rounded-2xl">
                  <p className="text-xs text-[#6B6B6B]">No pending orders need assignment.</p>
                </div>
              ) : (
                unassignedOrders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedOrderId === order.id ? 'bg-white border-[#71883F] shadow-md ring-2 ring-[#71883F]/10' : 'bg-white border-[#E8E8E3] hover:border-[#71883F]'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-black text-[#71883F]">#{order.id}</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending Assignment</span>
                    </div>
                    <p className="text-xs font-bold text-[#171717]">{order.customerName}</p>
                    <p className="text-[10px] text-[#6B6B6B] line-clamp-1">{order.shippingAddress.house}, {order.shippingAddress.street}</p>
                    <div className="mt-3 pt-2 border-t border-[#E8E8E3] flex justify-between items-center">
                       <span className="text-[10px] text-[#6B6B6B]">{order.items.length} items · ₹{order.total}</span>
                       <ArrowRight className="w-3 h-3 text-[#71883F]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E8E8E3] rounded-2xl">
                  <p className="text-xs text-[#6B6B6B]">No {filter} assignments found.</p>
                </div>
              ) : (
                filteredAssignments.map(assignment => (
                  <div 
                    key={assignment.id}
                    onClick={() => setSelectedOrderId(assignment.orderId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedOrderId === assignment.orderId ? 'bg-white border-[#71883F] shadow-md ring-2 ring-[#71883F]/10' : 'bg-white border-[#E8E8E3] hover:border-[#71883F]'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-black text-[#71883F]">#{assignment.orderId}</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{assignment.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-[#EFF4E6] flex items-center justify-center text-[#71883F]">
                         <User className="w-3 h-3" />
                      </div>
                      <p className="text-xs font-bold text-[#171717]">{assignment.deliveryPersonName}</p>
                    </div>
                    <p className="text-[10px] text-[#6B6B6B] line-clamp-1">To: {assignment.dropAddress.fullName} · {assignment.dropAddress.city}</p>
                    <div className="mt-3 pt-2 border-t border-[#E8E8E3] flex justify-between items-center text-[10px]">
                       <span className="text-[#6B6B6B] flex items-center gap-1"><Clock className="w-3 h-3" /> ETA {assignment.estimatedMinutes || 20} mins</span>
                       <span className="font-bold text-[#71883F]">Track Live</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Content: Detail & Map */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pb-10">
          {selectedOrderId ? (
            <>
              <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-[#171717]">Order Details</h3>
                    <p className="text-xs text-[#6B6B6B]">Tracking Order #{selectedOrderId}</p>
                  </div>
                  
                  {selectedOrder && !selectedAssignment && (
                    <div className="flex items-center gap-2">
                      <select 
                        className="text-xs bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl px-3 py-2 outline-none focus:border-[#71883F]"
                        onChange={async (e) => {
                          if (e.target.value) {
                            await assignDeliveryPerson(selectedOrderId, e.target.value);
                            showToast(`Order #${selectedOrderId.slice(-6)} assigned!`);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Select Delivery Agent</option>
                        {deliveryPersonnel.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                   <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E8E8E3]">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">Customer</span>
                      <p className="text-xs font-bold text-[#171717]">{selectedOrder?.customerName}</p>
                      <p className="text-[10px] text-[#6B6B6B]">{selectedOrder?.phone}</p>
                   </div>
                   <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E8E8E3]">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">Address</span>
                      <p className="text-xs font-bold text-[#171717] line-clamp-1">{selectedOrder?.shippingAddress.house}</p>
                      <p className="text-[10px] text-[#6B6B6B] line-clamp-1">{selectedOrder?.shippingAddress.street}</p>
                   </div>
                   <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E8E8E3]">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase block">Status</span>
                      <p className="text-xs font-bold text-[#71883F]">{selectedOrder?.orderStatus}</p>
                      <p className="text-[10px] text-[#6B6B6B]">{selectedAssignment?.status.replace(/_/g, ' ') || 'Awaiting Assignment'}</p>
                   </div>
                </div>

                {selectedOrder && (
                  <DeliveryTrackingMap 
                    order={selectedOrder}
                    storeAddress="Commercial Complex, MG Road, Trivandrum, Kerala 695001"
                    deliveryPerson={selectedPersonnel}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="h-full bg-white border border-[#E8E8E3] rounded-3xl flex flex-col items-center justify-center p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#F7F8F3] text-[#71883F] flex items-center justify-center shadow-xs">
                 <Truck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#171717]">Select an Order to Track</h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm">
                  Click on an active assignment or pending order from the list to see live location, route details, and management options.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
