import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryAssignment, DeliveryPersonnel } from '../../types';
import {
  Truck,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Camera,
  FileCheck,
  RefreshCw,
  LogOut,
  Radio,
  User,
} from 'lucide-react';

export const DeliveryPortalPage: React.FC = () => {
  const {
    deliveryAssignments,
    deliveryPersonnel,
    orders,
    updateDeliveryAssignmentStatus,
    setActivePage,
    showToast,
  } = useStore();

  const [activeWorkerId, setActiveWorkerId] = useState<string>(
    localStorage.getItem('fs_v5_active_delivery_worker') || deliveryPersonnel[0]?.id || 'dp-1'
  );

  const activeWorker: DeliveryPersonnel =
    deliveryPersonnel.find((d) => d.id === activeWorkerId) || deliveryPersonnel[0];

  const [isLocationSharing, setIsLocationSharing] = useState<boolean>(true);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [signatureName, setSignatureName] = useState<string>('');
  const [failureReason, setFailureReason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');

  // Filter assignments for current logged-in worker
  const myAssignments = deliveryAssignments.filter(
    (a) => a.deliveryPersonId === activeWorker.id
  );

  const pendingJobs = myAssignments.filter((a) => a.status !== 'Delivered' && a.status !== 'Failed');
  const completedJobs = myAssignments.filter((a) => a.status === 'Delivered' || a.status === 'Failed');

  useEffect(() => {
    if (pendingJobs.length > 0 && !selectedAssignment) {
      setSelectedAssignment(pendingJobs[0]);
    }
  }, [deliveryAssignments]);

  const handleStatusChange = (
    assignmentId: string,
    newStatus: DeliveryAssignment['status'],
    notes?: string
  ) => {
    updateDeliveryAssignmentStatus(assignmentId, newStatus, {
      otpCode: otpInput,
      signatureName: signatureName || activeWorker.name,
      failureReason: failureReason,
      completedAt: newStatus === 'Delivered' ? new Date().toISOString() : undefined,
    });
    showToast(`Order status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
    setOtpInput('');
    setSignatureName('');
    setFailureReason('');
  };

  const handleOpenGoogleMapsNav = (destinationAddress: string) => {
    const encoded = encodeURIComponent(destinationAddress);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#202320] py-6 sm:py-10 text-left">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top App Bar Header */}
        <div className="bg-white border border-[#E9E5DE] rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#145A38] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-[#202320]">{activeWorker.name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#145A38]/10 text-[#145A38]">
                  {activeWorker.vehicleType} • {activeWorker.vehicleNumber}
                </span>
              </div>
              <p className="text-xs text-[#77766F]">
                Fathima Express Delivery Console • Rating ★ {activeWorker.rating} ({activeWorker.totalDeliveries} Completed)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live GPS Broadcast Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsLocationSharing(!isLocationSharing);
                showToast(`Live GPS sharing ${!isLocationSharing ? 'Activated' : 'Paused'}`, 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                isLocationSharing
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-300'
              }`}
            >
              <Radio className={`w-4 h-4 ${isLocationSharing ? 'animate-pulse text-emerald-600' : ''}`} />
              <span>{isLocationSharing ? 'GPS Broadcasting Live' : 'GPS Offline'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('delivery-login')}
              className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-[#E9E5DE] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-[#145A38] text-white shadow-xs'
                : 'bg-white text-[#77766F] hover:text-[#202320] border border-[#E9E5DE]'
            }`}
          >
            Active Deliveries ({pendingJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#145A38] text-white shadow-xs'
                : 'bg-white text-[#77766F] hover:text-[#202320] border border-[#E9E5DE]'
            }`}
          >
            Completed History ({completedJobs.length})
          </button>
        </div>

        {/* Main Content Area */}
        {activeTab === 'assigned' ? (
          pendingJobs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Jobs List */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77766F] block mb-2">
                  Assigned Route Jobs
                </span>

                {pendingJobs.map((job) => {
                  const isSelected = selectedAssignment?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedAssignment(job)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-[#145A38] ring-2 ring-[#145A38]/20 shadow-md'
                          : 'bg-white/80 border-[#E9E5DE] hover:border-[#145A38]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-[#145A38] bg-[#145A38]/10 px-2.5 py-0.5 rounded-md">
                          #{job.orderId}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="font-extrabold text-sm text-[#202320] line-clamp-1">
                        {job.dropAddress.fullName}
                      </p>
                      <p className="text-xs text-[#77766F] line-clamp-2 mt-1">
                        {job.dropAddress.house}, {job.dropAddress.street}, {job.dropAddress.city} - {job.dropAddress.pinCode}
                      </p>

                      <div className="mt-3 pt-2 border-t border-[#E9E5DE] flex items-center justify-between text-[11px] text-[#77766F]">
                        <span>Assigned {new Date(job.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold text-[#145A38]">ETA ~15 mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Detail Console */}
              {selectedAssignment && (
                <div className="lg:col-span-7 bg-white border border-[#E9E5DE] rounded-3xl p-6 shadow-sm space-y-6">
                  
                  {/* Job Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E9E5DE]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#145A38] bg-[#145A38]/10 px-2.5 py-1 rounded-lg">
                          Order #{selectedAssignment.orderId}
                        </span>
                        <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {selectedAssignment.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-[#202320] mt-2">
                        Customer: {selectedAssignment.dropAddress.fullName}
                      </h3>
                    </div>

                    <a
                      href={`tel:${selectedAssignment.dropAddress.phone}`}
                      className="px-3.5 py-2 bg-[#145A38] hover:bg-[#0E4228] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Customer</span>
                    </a>
                  </div>

                  {/* Locations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pickup Address */}
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E9E5DE] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77766F]">
                        Pickup Location
                      </span>
                      <p className="font-bold text-xs text-[#202320]">Trivandrum Central Hub</p>
                      <p className="text-[11px] text-[#77766F]">{selectedAssignment.pickupAddress}</p>
                    </div>

                    {/* Delivery Destination */}
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E9E5DE] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77766F]">
                        Delivery Destination
                      </span>
                      <p className="font-bold text-xs text-[#202320]">{selectedAssignment.dropAddress.fullName}</p>
                      <p className="text-[11px] text-[#77766F]">
                        {selectedAssignment.dropAddress.house}, {selectedAssignment.dropAddress.street}, {selectedAssignment.dropAddress.city} - {selectedAssignment.dropAddress.pinCode}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Action */}
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenGoogleMapsNav(
                        `${selectedAssignment.dropAddress.house}, ${selectedAssignment.dropAddress.street}, ${selectedAssignment.dropAddress.city} ${selectedAssignment.dropAddress.pinCode}`
                      )
                    }
                    className="w-full py-3 bg-[#145A38] hover:bg-[#0E4228] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open Turn-by-Turn Route in Google Maps</span>
                  </button>

                  {/* Status Progression Workflow Controls */}
                  <div className="space-y-4 pt-4 border-t border-[#E9E5DE]">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#202320] block">
                      Update Fulfillment Status
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'Accepted', label: '1. Accept' },
                        { id: 'Arrived_at_Pickup', label: '2. At Hub' },
                        { id: 'Picked_Up', label: '3. Picked Up' },
                        { id: 'Out_for_Delivery', label: '4. Out for Delivery' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(selectedAssignment.id, st.id as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedAssignment.status === st.id
                              ? 'bg-[#145A38] text-white border-[#145A38] shadow-2xs'
                              : 'bg-white border-[#E9E5DE] text-[#202320] hover:border-[#145A38]'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Delivery Completion & OTP Box */}
                    <div className="bg-[#EFF4E6] border border-[#145A38]/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-[#145A38] font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Delivery & Verify OTP</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#202320] block mb-1">Customer OTP Code</label>
                          <input
                            type="text"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="Enter 4-digit OTP"
                            className="w-full px-3 py-1.5 bg-white border border-[#E9E5DE] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#202320] block mb-1">Receiver Name / Signature</label>
                          <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="e.g. Received by Self / Anjali"
                            className="w-full px-3 py-1.5 bg-white border border-[#E9E5DE] rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(selectedAssignment.id, 'Delivered')}
                        className="w-full py-2.5 bg-[#145A38] hover:bg-[#0E4228] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Mark Order Delivered Successfully</span>
                      </button>
                    </div>

                    {/* Failed Reattempt Box */}
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Record Delivery Exception / Reattempt
                      </span>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={failureReason}
                          onChange={(e) => setFailureReason(e.target.value)}
                          placeholder="e.g. Customer unavailable / Address closed"
                          className="flex-1 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedAssignment.id, 'Failed')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer shrink-0"
                        >
                          Record Failed
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E9E5DE] rounded-3xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#145A38] mx-auto" />
              <h3 className="text-lg font-bold text-[#202320]">No Active Assigned Deliveries</h3>
              <p className="text-xs text-[#77766F] max-w-sm mx-auto">
                You have completed all assigned routes for today! Stand by for new order dispatches from Trivandrum Store Manager.
              </p>
            </div>
          )
        ) : (
          /* Completed History Tab */
          <div className="bg-white border border-[#E9E5DE] rounded-3xl p-6 shadow-sm divide-y divide-[#E9E5DE]">
            {completedJobs.length > 0 ? (
              completedJobs.map((job) => (
                <div key={job.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#145A38]">#{job.orderId}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          job.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-[#202320]">{job.dropAddress.fullName}</p>
                    <p className="text-xs text-[#77766F]">
                      {job.dropAddress.house}, {job.dropAddress.city}
                    </p>
                  </div>

                  <div className="text-right text-xs text-[#77766F]">
                    <p className="font-mono font-bold text-[#202320]">
                      Completed {job.completedAt ? new Date(job.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </p>
                    {job.signatureName && <p className="text-[11px]">Signed by: {job.signatureName}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-[#77766F]">No completed delivery logs yet.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
