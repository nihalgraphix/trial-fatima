import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CreditCard,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Order } from '../../types';

type TimeRange = 'today' | '7days' | '30days' | 'month' | 'all';

export const AdminAnalyticsView: React.FC = () => {
  const { orders, verifyOrderPayment, showToast } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);

  // Filter orders by timeRange
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return orders.filter((order) => {
      if (timeRange === 'all') return true;

      const orderDate = new Date(order.date || (order as any).createdAt);
      if (isNaN(orderDate.getTime())) return true;

      const orderDateStr = orderDate.toISOString().split('T')[0];

      if (timeRange === 'today') {
        return orderDateStr === todayStr;
      }

      if (timeRange === '7days') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      if (timeRange === '30days') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }

      if (timeRange === 'month') {
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
      }

      return true;
    });
  }, [orders, timeRange]);

  // Strict calculation: ONLY orders where payment is verified are counted as income!
  const verifiedOrders = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === 'Paid' || o.paymentVerified === true),
    [filteredOrders]
  );

  const pendingVerificationOrders = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus !== 'Paid' && !o.paymentVerified),
    [filteredOrders]
  );

  const totalVerifiedIncome = useMemo(
    () =>
      verifiedOrders.reduce(
        (sum, o) => sum + (o.paidAmount !== undefined && o.paidAmount > 0 ? o.paidAmount : o.total),
        0
      ),
    [verifiedOrders]
  );

  const totalPendingIncome = useMemo(
    () => pendingVerificationOrders.reduce((sum, o) => sum + (o.total - (o.paidAmount || 0)), 0),
    [pendingVerificationOrders]
  );

  const totalGrossBooking = totalVerifiedIncome + totalPendingIncome;
  const realizationRate =
    totalGrossBooking > 0 ? Math.round((totalVerifiedIncome / totalGrossBooking) * 100) : 100;
  const avgOrderValue =
    verifiedOrders.length > 0 ? Math.round(totalVerifiedIncome / verifiedOrders.length) : 0;

  // Breakdown by payment method
  const paymentMethodStats = useMemo(() => {
    const methods: Record<
      string,
      { count: number; verifiedAmount: number; pendingAmount: number }
    > = {};

    filteredOrders.forEach((o) => {
      const m = o.paymentMethod || 'Other';
      if (!methods[m]) {
        methods[m] = { count: 0, verifiedAmount: 0, pendingAmount: 0 };
      }
      methods[m].count += 1;
      if (o.paymentStatus === 'Paid' || o.paymentVerified === true) {
        methods[m].verifiedAmount += o.paidAmount || o.total;
      } else {
        methods[m].pendingAmount += o.total - (o.paidAmount || 0);
      }
    });

    return Object.entries(methods).map(([name, data]) => ({
      name,
      ...data,
      total: data.verifiedAmount + data.pendingAmount,
    }));
  }, [filteredOrders]);

  // Order status breakdown
  const statusStats = useMemo(() => {
    const counts: Record<string, number> = {
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Cancelled: 0,
    };
    filteredOrders.forEach((o) => {
      const s = o.orderStatus || 'Confirmed';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [filteredOrders]);

  // Multi-day chart data for the selected range (7 or 14 points)
  const chartPoints = useMemo(() => {
    const days = timeRange === '7days' || timeRange === 'today' ? 7 : 14;
    const points: {
      date: string;
      label: string;
      verified: number;
      pending: number;
    }[] = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayOrders = orders.filter((o) => {
        if (!o.date) return false;
        return o.date === dateStr || o.date.startsWith(dateStr);
      });

      const dayVerified = dayOrders
        .filter((o) => o.paymentStatus === 'Paid' || o.paymentVerified === true)
        .reduce((sum, o) => sum + (o.paidAmount || o.total), 0);

      const dayPending = dayOrders
        .filter((o) => o.paymentStatus !== 'Paid' && !o.paymentVerified)
        .reduce((sum, o) => sum + (o.total - (o.paidAmount || 0)), 0);

      points.push({
        date: dateStr,
        label,
        verified: dayVerified,
        pending: dayPending,
      });
    }

    const maxVal = Math.max(1000, ...points.map((p) => p.verified + p.pending));
    return { points, maxVal };
  }, [orders, timeRange]);

  // Quick verification handler
  const handleVerify = async (orderId: string) => {
    try {
      setVerifyingOrderId(orderId);
      await verifyOrderPayment(orderId, true);
    } catch {
      showToast('Could not verify payment', 'error');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
              Orders & Income Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
              Verified Realization Rule
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Orders are strictly counted as revenue only once payment receipt is verified by the store administrator.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1 bg-white border border-[#E8E8E3] p-1 rounded-xl shadow-2xs self-start sm:self-auto text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id as TimeRange)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === tab.id
                  ? 'bg-[#71883F] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Core Financial & Order Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Verified Income */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white border border-emerald-500/30 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Verified Income
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Received
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tabular-nums tracking-tight">
            ₹{totalVerifiedIncome.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-[#6B6B6B]">
            From <strong className="text-emerald-700">{verifiedOrders.length}</strong> confirmed, paid orders
          </p>
        </div>

        {/* Card 2: Pending Unverified */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-white border border-amber-500/30 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" /> Pending Verification
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              Not in Income
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-900 tabular-nums tracking-tight">
            ₹{totalPendingIncome.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-[#6B6B6B]">
            From <strong className="text-amber-700">{pendingVerificationOrders.length}</strong> COD & unverified orders
          </p>
        </div>

        {/* Card 3: Total Orders */}
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span className="font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#71883F]" /> Total Orders
            </span>
            <span className="text-[10px] font-bold text-[#71883F] bg-[#EFF4E6] px-1.5 py-0.5 rounded">
              {filteredOrders.length} placed
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tabular-nums tracking-tight">
            {filteredOrders.length}
          </h2>
          <p className="text-[11px] text-[#6B6B6B]">
            {statusStats['Delivered']} delivered · {statusStats['Processing'] + statusStats['Shipped']} in transit
          </p>
        </div>

        {/* Card 4: Realization Rate */}
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#71883F]" /> Collection Rate
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {realizationRate}%
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tabular-nums tracking-tight">
            {realizationRate}%
          </h2>
          <div className="w-full bg-[#E8E8E3] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${realizationRate}%` }}
            />
          </div>
        </div>

        {/* Card 5: Average Order Value */}
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#71883F]" /> Avg Order Value
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
              AOV
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tabular-nums tracking-tight">
            ₹{avgOrderValue.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-[#6B6B6B]">Per verified paid order</p>
        </div>
      </div>

      {/* Visual Analytics Chart: Verified Income vs Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#171717]">
                  Income Realization & Revenue Trend
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Live Firestore Audit
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Comparing Verified Income (actually received) with Pending unverified amounts per day.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-[#171717]">Verified Income (₹)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 opacity-70" />
                <span className="text-[#6B6B6B]">Pending (₹)</span>
              </div>
            </div>
          </div>

          {/* SVG Stacked Bar Chart */}
          <div className="h-64 w-full pt-4">
            <svg viewBox="0 0 640 220" className="w-full h-full overflow-visible">
              {/* Horizontal Reference Lines */}
              <line x1="40" y1="180" x2="620" y2="180" stroke="#E8E8E3" strokeWidth="1" />
              <line x1="40" y1="120" x2="620" y2="120" stroke="#F4F4F0" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="40" y1="60" x2="620" y2="60" stroke="#F4F4F0" strokeWidth="1" strokeDasharray="3,3" />

              {/* Y-axis Labels */}
              <text x="32" y="184" textAnchor="end" className="text-[9px] fill-[#8C8C8C] font-mono">
                ₹0
              </text>
              <text x="32" y="124" textAnchor="end" className="text-[9px] fill-[#8C8C8C] font-mono">
                ₹{Math.round(chartPoints.maxVal / 2).toLocaleString('en-IN')}
              </text>
              <text x="32" y="64" textAnchor="end" className="text-[9px] fill-[#8C8C8C] font-mono">
                ₹{Math.round(chartPoints.maxVal).toLocaleString('en-IN')}
              </text>

              {/* Bars per day */}
              {chartPoints.points.map((pt, idx) => {
                const totalPoints = chartPoints.points.length;
                const slotWidth = (600 - 60) / totalPoints;
                const barWidth = Math.min(28, slotWidth - 8);
                const x = 60 + idx * slotWidth;

                const verifiedHeight =
                  pt.verified > 0
                    ? Math.max(6, Math.round((pt.verified / chartPoints.maxVal) * 140))
                    : 0;
                const pendingHeight =
                  pt.pending > 0
                    ? Math.max(6, Math.round((pt.pending / chartPoints.maxVal) * 140))
                    : 0;

                const verifiedY = 180 - verifiedHeight;
                const pendingY = verifiedY - pendingHeight;

                return (
                  <g key={pt.date} className="group cursor-pointer">
                    <title>{`${pt.label}: Verified ₹${pt.verified} · Pending ₹${pt.pending}`}</title>

                    {/* Pending Bar (stacked on top) */}
                    {pendingHeight > 0 && (
                      <rect
                        x={x}
                        y={pendingY}
                        width={barWidth}
                        height={pendingHeight}
                        rx="4"
                        className="fill-amber-400 opacity-75 group-hover:opacity-100 transition-opacity"
                      />
                    )}

                    {/* Verified Income Bar (solid base) */}
                    {verifiedHeight > 0 ? (
                      <rect
                        x={x}
                        y={verifiedY}
                        width={barWidth}
                        height={verifiedHeight}
                        rx="4"
                        className="fill-emerald-600 group-hover:fill-emerald-500 transition-colors"
                      />
                    ) : (
                      /* Zero indicator line */
                      <rect x={x} y="177" width={barWidth} height="3" rx="1.5" fill="#E8E8E3" />
                    )}

                    {/* X-axis date label */}
                    <text
                      x={x + barWidth / 2}
                      y="198"
                      textAnchor="middle"
                      className="text-[9px] fill-[#6B6B6B] font-semibold"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Payment Channels & Realization Breakdown */}
        <div className="lg:col-span-4 bg-white border border-[#E8E8E3] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#171717]">
              Payment Channels
            </h3>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">
              Income Split
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B]">
            Verified revenue received vs pending cash collection by channel.
          </p>

          <div className="space-y-3.5 pt-2">
            {paymentMethodStats.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] italic py-8 text-center">No transactions in selected range</p>
            ) : (
              paymentMethodStats.map((pm) => {
                const verifiedPct = pm.total > 0 ? Math.round((pm.verifiedAmount / pm.total) * 100) : 0;
                return (
                  <div key={pm.name} className="p-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-bold text-[#171717]">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#71883F]" /> {pm.name}
                      </span>
                      <span className="tabular-nums">₹{pm.verifiedAmount.toLocaleString('en-IN')} verified</span>
                    </div>

                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E8E8E3] flex">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-500"
                        style={{ width: `${verifiedPct}%` }}
                        title={`Verified: ₹${pm.verifiedAmount}`}
                      />
                      <div
                        className="bg-amber-400 opacity-70 h-full transition-all duration-500"
                        style={{ width: `${100 - verifiedPct}%` }}
                        title={`Pending: ₹${pm.pendingAmount}`}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#6B6B6B]">
                      <span>{pm.count} orders</span>
                      {pm.pendingAmount > 0 && (
                        <span className="text-amber-700 font-semibold">
                          ₹{pm.pendingAmount.toLocaleString('en-IN')} pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Orders Awaiting Payment Verification (Actionable List) */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#171717]">
                Orders Awaiting Payment Verification ({pendingVerificationOrders.length})
              </h3>
              {pendingVerificationOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                  Action Needed
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Confirm cash or gateway transfers when funds are received to count the order amount toward your verified income.
            </p>
          </div>
        </div>

        {pendingVerificationOrders.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#171717]">All Payments Are Up to Date</h4>
            <p className="text-xs text-[#6B6B6B]">
              Every order in the current filter has verified payment and is actively counted in store income.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F8F3] border-b border-[#E8E8E3] text-[#6B6B6B]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Payment Mode</th>
                  <th className="py-3 px-4 font-semibold">Order Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E3]">
                {pendingVerificationOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F7F8F3]/50">
                    <td className="py-3.5 px-4 font-bold text-[#171717] font-mono">
                      {order.id}
                      <span className="block text-[10px] text-[#6B6B6B] font-normal font-sans">
                        {order.date}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#171717] block">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] block">
                        {order.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#171717]">
                        {order.paymentMethod}
                      </span>
                      <span className="block text-[10px] text-amber-700 font-bold">
                        Unverified
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#171717] tabular-nums text-sm">
                      ₹{order.total}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleVerify(order.id)}
                        disabled={verifyingOrderId === order.id}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify Payment Received</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
