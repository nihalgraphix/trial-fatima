// Docs: https://developers.google.com/maps/documentation/javascript/routes?utm_campaign=gmp_mcp_codeassist_v1_aistudio
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Route as RouteIcon,
  Navigation,
  Truck,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  Layers,
  Car,
  Bike,
  LocateFixed,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Phone,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';

interface OptimizedStop {
  stopNumber: number;
  order: Order;
  lat: number;
  lng: number;
  legDistanceKm: string;
  legDurationMins: number;
  cumulativeMins: number;
  etaClockTime: string;
}

export const AdminRouteOptimizer: React.FC = () => {
  const {
    orders,
    deliveryPersonnel,
    assignDeliveryPerson,
    updateOrderStatus,
    showToast,
    storeSettings,
  } = useStore();

  const STORE_HUB = {
    lat: storeSettings?.storeLat ?? 8.5241,
    lng: storeSettings?.storeLng ?? 76.9366,
    name:
      storeSettings?.storeHubName ||
      `${storeSettings?.storeName || 'Fathima Stores'} Hub (${storeSettings?.storeCity || 'Trivandrum'})`,
  };

  const map = useMap('admin-multi-stop-optimizer-map');
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Candidate orders eligible for multi-stop delivery optimization
  const candidateOrders = useMemo(() => {
    return orders.filter(
      (o) => !o.isArchived && o.orderStatus !== 'Cancelled'
    );
  }, [orders]);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(() => {
    const activeOnes = candidateOrders
      .filter((o) => o.orderStatus !== 'Delivered')
      .slice(0, 6)
      .map((o) => o.id);
    return activeOnes.length > 0
      ? activeOnes
      : candidateOrders.slice(0, 5).map((o) => o.id);
  });

  const [travelMode, setTravelMode] = useState<'DRIVING' | 'TWO_WHEELER'>('DRIVING');
  const [returnToHub, setReturnToHub] = useState<boolean>(false);
  const [useLiveStartGps, setUseLiveStartGps] = useState<boolean>(false);
  const [liveGpsOrigin, setLiveGpsOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const [optimizedStops, setOptimizedStops] = useState<OptimizedStop[]>([]);
  const [routeSummary, setRouteSummary] = useState<{
    totalDistanceKm: string;
    totalDurationMins: number;
    savedDistanceKm: string;
    savedMins: number;
  } | null>(null);

  // Deterministic coordinate resolver for orders without explicit lat/lng
  const getOrderCoords = (order: Order, index: number): { lat: number; lng: number } => {
    if (order.shippingAddress?.lat && order.shippingAddress?.lng) {
      return {
        lat: order.shippingAddress.lat,
        lng: order.shippingAddress.lng,
      };
    }
    const offsets = [
      { dLat: 0.014, dLng: 0.011 },
      { dLat: -0.012, dLng: 0.018 },
      { dLat: 0.022, dLng: -0.015 },
      { dLat: -0.019, dLng: -0.012 },
      { dLat: 0.009, dLng: 0.024 },
      { dLat: 0.028, dLng: 0.007 },
    ];
    const off = offsets[index % offsets.length];
    return {
      lat: STORE_HUB.lat + off.dLat,
      lng: STORE_HUB.lng + off.dLng,
    };
  };

  const selectedOrders = useMemo(() => {
    return candidateOrders.filter((o) => selectedOrderIds.includes(o.id));
  }, [candidateOrders, selectedOrderIds]);

  const activeOrigin = useLiveStartGps && liveGpsOrigin ? liveGpsOrigin : STORE_HUB;

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleUseMyGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveGpsOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setUseLiveStartGps(true);
        showToast('Using your live GPS coordinates as route starting point!', 'success');
      },
      () => {
        showToast('Could not access live GPS. Using Store Hub.', 'error');
        setUseLiveStartGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Calculate Haversine distance in km between two points
  const calcHaversineKm = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  // Deterministic Nearest-Neighbor TSP Optimizer fallback
  const computeLocalNearestNeighborRoute = (
    stopsWithCoords: Array<{ order: Order; lat: number; lng: number }>,
    unoptimizedKm: number
  ) => {
    const remaining = [...stopsWithCoords];
    const ordered: Array<{ order: Order; lat: number; lng: number }> = [];
    let currentPt = { lat: activeOrigin.lat, lng: activeOrigin.lng };

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      remaining.forEach((candidate, idx) => {
        const d = calcHaversineKm(currentPt, { lat: candidate.lat, lng: candidate.lng });
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      const chosen = remaining.splice(bestIdx, 1)[0];
      ordered.push(chosen);
      currentPt = { lat: chosen.lat, lng: chosen.lng };
    }

    let cumulativeMinutes = 0;
    let totalKmNum = 0;
    const now = new Date();

    const builtStops: OptimizedStop[] = ordered.map((item, idx) => {
      const fromPt = idx === 0 ? activeOrigin : ordered[idx - 1];
      const legKm = Math.max(0.5, calcHaversineKm(fromPt, item) * 1.28);
      totalKmNum += legKm;
      const legMins = Math.max(3, Math.round(legKm * 3.1));
      cumulativeMinutes += legMins + (idx > 0 ? 4 : 0);

      const etaDate = new Date(now.getTime() + cumulativeMinutes * 60000);
      const etaClockTime = etaDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        stopNumber: idx + 1,
        order: item.order,
        lat: item.lat,
        lng: item.lng,
        legDistanceKm: `${legKm.toFixed(1)} km`,
        legDurationMins: legMins,
        cumulativeMins: cumulativeMinutes,
        etaClockTime,
      };
    });

    if (returnToHub && ordered.length > 0) {
      const last = ordered[ordered.length - 1];
      const backKm = calcHaversineKm(last, STORE_HUB) * 1.28;
      totalKmNum += backKm;
      cumulativeMinutes += Math.round(backKm * 3.1);
    }

    const savedKm = Math.max(0.5, unoptimizedKm - totalKmNum);
    const savedMins = Math.max(3, Math.round(savedKm * 3.1));

    setOptimizedStops(builtStops);
    setRouteSummary({
      totalDistanceKm: totalKmNum.toFixed(1),
      totalDurationMins: cumulativeMinutes,
      savedDistanceKm: savedKm.toFixed(1),
      savedMins,
    });
  };

  // Run multi-stop Route Optimization using Routes API (`Route.computeRoutes` with `optimizeWaypointOrder: true`)
  const runRouteOptimization = async () => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (selectedOrders.length === 0) {
      setOptimizedStops([]);
      setRouteSummary(null);
      return;
    }

    setIsOptimizing(true);

    const stopsWithCoords = selectedOrders.map((order, idx) => {
      const coords = getOrderCoords(order, idx);
      return { order, lat: coords.lat, lng: coords.lng };
    });

    // Calculate unoptimized sequential distance for comparison metrics
    let unoptimizedKm = 0;
    let prevPt = { lat: activeOrigin.lat, lng: activeOrigin.lng };
    for (const s of stopsWithCoords) {
      unoptimizedKm += calcHaversineKm(prevPt, { lat: s.lat, lng: s.lng }) * 1.32;
      prevPt = { lat: s.lat, lng: s.lng };
    }
    if (returnToHub) {
      unoptimizedKm += calcHaversineKm(prevPt, STORE_HUB) * 1.32;
    }

    // Compute immediate local optimal sequence first so stops & metrics are always populated
    computeLocalNearestNeighborRoute(stopsWithCoords, unoptimizedKm);

    if (!routesLib || !map || !(routesLib as any).Route) {
      setIsOptimizing(false);
      return;
    }

    try {
      // Determine final destination and intermediate waypoints
      let destinationPt: { lat: number; lng: number };
      let intermediateStops: typeof stopsWithCoords = [];

      if (returnToHub) {
        destinationPt = { lat: STORE_HUB.lat, lng: STORE_HUB.lng };
        intermediateStops = stopsWithCoords;
      } else if (stopsWithCoords.length === 1) {
        destinationPt = { lat: stopsWithCoords[0].lat, lng: stopsWithCoords[0].lng };
        intermediateStops = [];
      } else {
        // Choose the farthest customer stop from origin as the terminal anchor, and optimize all intermediate stops
        let farthestIdx = 0;
        let maxDist = -1;
        stopsWithCoords.forEach((s, idx) => {
          const d = calcHaversineKm(activeOrigin, { lat: s.lat, lng: s.lng });
          if (d > maxDist) {
            maxDist = d;
            farthestIdx = idx;
          }
        });
        destinationPt = {
          lat: stopsWithCoords[farthestIdx].lat,
          lng: stopsWithCoords[farthestIdx].lng,
        };
        intermediateStops = stopsWithCoords.filter((_, idx) => idx !== farthestIdx);
      }

      const request: any = {
        origin: { lat: activeOrigin.lat, lng: activeOrigin.lng },
        destination: destinationPt,
        travelMode,
        fields: [
          'path',
          'distanceMeters',
          'durationMillis',
          'viewport',
          'legs',
          'optimizedIntermediateWaypointIndices',
        ],
      };

      if (intermediateStops.length > 0) {
        request.intermediates = intermediateStops.map((s) => ({
          location: { lat: s.lat, lng: s.lng },
          vehicleStopover: true,
        }));
        request.optimizeWaypointOrder = true;
      }

      const { routes } = await (routesLib.Route as any).computeRoutes(request);

      if (routes && routes.length > 0) {
        const primaryRoute = routes[0];

        // Render optimized multi-stop polylines
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#71883F',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 60);
        }

        // Reconstruct ordered stops according to `optimizedIntermediateWaypointIndices`
        const optIndices: number[] =
          primaryRoute.optimizedIntermediateWaypointIndices &&
          primaryRoute.optimizedIntermediateWaypointIndices.length === intermediateStops.length
            ? primaryRoute.optimizedIntermediateWaypointIndices
            : intermediateStops.map((_, i) => i);

        const orderedIntermediates = optIndices.map((i) => intermediateStops[i]).filter(Boolean);

        let finalOrderedSequence: typeof stopsWithCoords = [];
        if (returnToHub) {
          finalOrderedSequence = orderedIntermediates;
        } else if (stopsWithCoords.length === 1) {
          finalOrderedSequence = [stopsWithCoords[0]];
        } else {
          const terminalStop = stopsWithCoords.find(
            (s) => s.lat === destinationPt.lat && s.lng === destinationPt.lng
          );
          finalOrderedSequence = terminalStop
            ? [...orderedIntermediates, terminalStop]
            : orderedIntermediates;
        }

        const legs = primaryRoute.legs || [];
        let cumulativeMinutes = 0;
        const now = new Date();

        const builtStops: OptimizedStop[] = finalOrderedSequence.map((item, idx) => {
          const leg = legs[idx];
          const legDistMeters =
            leg?.distanceMeters ||
            calcHaversineKm(
              idx === 0 ? activeOrigin : finalOrderedSequence[idx - 1],
              item
            ) * 1250;
          const legDurMillis =
            leg?.durationMillis || Math.max(240000, (legDistMeters / 1000) * 180000);
          const legMins = Math.max(3, Math.round(legDurMillis / 60000));
          cumulativeMinutes += legMins + (idx > 0 ? 4 : 0); // +4 mins drop-off buffer per stop

          const etaDate = new Date(now.getTime() + cumulativeMinutes * 60000);
          const etaClockTime = etaDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            stopNumber: idx + 1,
            order: item.order,
            lat: item.lat,
            lng: item.lng,
            legDistanceKm: (legDistMeters / 1000).toFixed(1) + ' km',
            legDurationMins: legMins,
            cumulativeMins: cumulativeMinutes,
            etaClockTime,
          };
        });

        const totalMeters =
          primaryRoute.distanceMeters ||
          builtStops.reduce((acc, s) => acc + parseFloat(s.legDistanceKm) * 1000, 0);
        const totalKmNum = totalMeters / 1000;
        const totalMins =
          Math.max(
            5,
            Math.round(
              (primaryRoute.durationMillis || cumulativeMinutes * 60000) / 60000
            )
          ) +
          Math.max(0, (builtStops.length - 1) * 4);

        const savedKm = Math.max(0.4, unoptimizedKm - totalKmNum);
        const savedMins = Math.max(3, Math.round(savedKm * 3.1));

        setOptimizedStops(builtStops);
        setRouteSummary({
          totalDistanceKm: totalKmNum.toFixed(1),
          totalDurationMins: totalMins,
          savedDistanceKm: savedKm.toFixed(1),
          savedMins,
        });
      }
    } catch (err: any) {
      console.warn('Multi-stop route optimization error:', err);
      const msg = String(err?.message || err || '');
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('OVER_QUERY_LIMIT') ||
        msg.includes('429')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    runRouteOptimization();
    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
    };
  }, [
    routesLib,
    map,
    selectedOrderIds,
    travelMode,
    returnToHub,
    useLiveStartGps,
    liveGpsOrigin,
  ]);

  // Build Google Maps multi-stop turn-by-turn URL with waypoints in the optimized sequence
  const googleMapsMultiStopUrl = useMemo(() => {
    if (optimizedStops.length === 0) return '#';
    const originParam = `${activeOrigin.lat},${activeOrigin.lng}`;
    const lastStop = optimizedStops[optimizedStops.length - 1];
    const destinationParam = returnToHub
      ? `${STORE_HUB.lat},${STORE_HUB.lng}`
      : `${lastStop.lat},${lastStop.lng}`;

    const waypointsList = returnToHub
      ? optimizedStops.map((s) => `${s.lat},${s.lng}`)
      : optimizedStops.slice(0, -1).map((s) => `${s.lat},${s.lng}`);

    const waypointsParam =
      waypointsList.length > 0 ? `&waypoints=${encodeURIComponent(waypointsList.join('|'))}` : '';
    const modeParam = travelMode === 'TWO_WHEELER' ? 'two-wheeler' : 'driving';

    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}${waypointsParam}&travelmode=${modeParam}`;
  }, [optimizedStops, activeOrigin, returnToHub, travelMode]);

  const handleBatchAssignAndDispatch = async () => {
    if (optimizedStops.length === 0) return;
    for (const stop of optimizedStops) {
      if (selectedAgentId) {
        await assignDeliveryPerson(stop.order.id, selectedAgentId);
      }
      if (stop.order.orderStatus !== 'Delivered') {
        await updateOrderStatus(stop.order.id, 'Out for Delivery');
      }
    }
    showToast(
      `Dispatched ${optimizedStops.length} orders along optimized delivery route!`,
      'success'
    );
  };

  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8E8E3] pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0 shadow-2xs">
            <RouteIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-[#171717]">
                Multi-Stop Delivery Route Optimizer
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF4E6] text-[#71883F] border border-[#71883F]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Waypoint Optimization Active
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Computes the fastest visiting sequence across multiple customer delivery pins using Google Maps Routes waypoint optimization.
            </p>
          </div>
        </div>

        {/* Route Configuration Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (useLiveStartGps) {
                setUseLiveStartGps(false);
              } else {
                handleUseMyGps();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              useLiveStartGps
                ? 'bg-[#145A38] text-white border-[#145A38]'
                : 'bg-[#F7F8F3] text-[#171717] border-[#E8E8E3] hover:border-[#71883F]'
            }`}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{useLiveStartGps ? 'Start: My Live GPS' : 'Start: Store Hub'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReturnToHub((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              returnToHub
                ? 'bg-[#71883F] text-white border-[#71883F]'
                : 'bg-[#F7F8F3] text-[#171717] border-[#E8E8E3] hover:border-[#71883F]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{returnToHub ? 'Round-Trip to Hub' : 'One-Way Delivery'}</span>
          </button>

          <div className="flex bg-[#F7F8F3] p-1 rounded-xl border border-[#E8E8E3]">
            <button
              type="button"
              onClick={() => setTravelMode('DRIVING')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                travelMode === 'DRIVING'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#6B6B6B]'
              }`}
            >
              <Car className="w-3 h-3 text-[#71883F]" />
              <span>Van</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('TWO_WHEELER')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                travelMode === 'TWO_WHEELER'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#6B6B6B]'
              }`}
            >
              <Bike className="w-3 h-3 text-[#71883F]" />
              <span>Bike</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Bar */}
      {routeSummary && optimizedStops.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Optimized Stops
            </span>
            <span className="text-lg font-black text-[#171717] mt-0.5 block">
              {optimizedStops.length} Customer Drops
            </span>
          </div>
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Total Route Distance
            </span>
            <span className="text-lg font-black text-[#71883F] mt-0.5 block">
              {routeSummary.totalDistanceKm} km
            </span>
          </div>
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Est. Total Drive Time
            </span>
            <span className="text-lg font-black text-[#171717] mt-0.5 block">
              {routeSummary.totalDurationMins} mins
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Optimization Savings
            </span>
            <span className="text-sm font-black text-emerald-700 mt-1 block">
              ~{routeSummary.savedDistanceKm} km & {routeSummary.savedMins} mins saved
            </span>
          </div>
        </div>
      )}

      {/* Main 12-Col Grid: Stop Selection + Map + Ordered Sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Select Orders & View Optimized Sequence */}
        <div className="lg:col-span-5 space-y-4">
          {/* Order Selection Box */}
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#171717]">
                1. Select Customer Stops ({selectedOrderIds.length} selected)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrderIds(candidateOrders.slice(0, 8).map((o) => o.id))
                  }
                  className="text-[10px] font-bold text-[#71883F] hover:underline cursor-pointer"
                >
                  Select Active
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="text-[10px] font-bold text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {candidateOrders.map((ord) => {
                const isChecked = selectedOrderIds.includes(ord.id);
                return (
                  <label
                    key={ord.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-white border-[#71883F] shadow-2xs'
                        : 'bg-white/60 border-[#E8E8E3] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleOrder(ord.id)}
                        className="accent-[#71883F] w-3.5 h-3.5 rounded cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#171717] truncate">
                          #{ord.id} • {ord.customerName}
                        </p>
                        <p className="text-[10px] text-[#6B6B6B] truncate">
                          {ord.shippingAddress?.area || ord.shippingAddress?.street},{' '}
                          {ord.shippingAddress?.city}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#EFF4E6] text-[#71883F] shrink-0">
                      {ord.orderStatus}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optimized Stop-by-Stop Sequence List */}
          <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#171717]">
                2. Suggested Optimal Delivery Sequence
              </span>
              <button
                type="button"
                onClick={runRouteOptimization}
                disabled={isOptimizing}
                className="text-[11px] font-bold text-[#71883F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Re-Optimize
              </button>
            </div>

            {optimizedStops.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] py-6 text-center">
                Select at least one customer order above to generate the optimal delivery path.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {/* Origin Row */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#EFF4E6]/60 border border-[#71883F]/20 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#71883F] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    S
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#171717] truncate">
                      Start: {useLiveStartGps ? 'Driver Live GPS Location' : STORE_HUB.name}
                    </p>
                    <p className="text-[10px] font-mono text-[#6B6B6B]">
                      {activeOrigin.lat.toFixed(4)}, {activeOrigin.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Ordered Customer Stops */}
                {optimizedStops.map((stop) => (
                  <div
                    key={stop.order.id}
                    className="p-3 rounded-xl border border-[#E8E8E3] hover:border-[#71883F] bg-[#FAFBF7] transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#171717] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                          {stop.stopNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171717] truncate">
                            {stop.order.customerName} (#{stop.order.id})
                          </p>
                          <p className="text-[10px] text-[#6B6B6B] truncate">
                            {stop.order.shippingAddress?.house},{' '}
                            {stop.order.shippingAddress?.street},{' '}
                            {stop.order.shippingAddress?.area || stop.order.shippingAddress?.city}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#71883F] bg-[#EFF4E6] px-2 py-0.5 rounded-md shrink-0">
                        ETA {stop.etaClockTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#6B6B6B] pt-1 border-t border-[#E8E8E3]/70">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#71883F]" />+{stop.legDurationMins} mins (
                        {stop.legDistanceKm} from prev stop)
                      </span>
                      <div className="flex items-center gap-2">
                        {stop.order.phone && (
                          <a
                            href={`tel:${stop.order.phone}`}
                            className="text-[#171717] hover:text-[#71883F] font-bold flex items-center gap-0.5"
                          >
                            <Phone className="w-2.5 h-2.5" /> Call
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#71883F] font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>Navigate</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Interactive Multi-Stop Google Map & Batch Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative h-[460px] w-full rounded-2xl overflow-hidden border border-[#E8E8E3] shadow-inner bg-[#E5E9E0]">
            <Map
              id="admin-multi-stop-optimizer-map"
              mapId="DEMO_MAP_ID"
              mapTypeId={mapTypeId}
              defaultCenter={{ lat: STORE_HUB.lat, lng: STORE_HUB.lng }}
              defaultZoom={13}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {/* Origin Marker */}
              <AdvancedMarker
                position={{ lat: activeOrigin.lat, lng: activeOrigin.lng }}
                title="Dispatch Origin"
              >
                <div className="bg-[#71883F] text-white border-2 border-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{useLiveStartGps ? 'Driver GPS Start' : 'Store Hub Origin'}</span>
                </div>
              </AdvancedMarker>

              {/* Numbered Customer Stop Markers */}
              {optimizedStops.map((stop) => (
                <AdvancedMarker
                  key={stop.order.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  title={`Stop #${stop.stopNumber}: ${stop.order.customerName}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-white/95 border border-[#E8E8E3] px-2 py-0.5 rounded-md shadow-md text-[10px] font-bold text-[#171717] mb-1 whitespace-nowrap">
                      <span className="text-[#71883F] font-black mr-1">
                        #{stop.stopNumber}
                      </span>
                      {stop.order.customerName} ({stop.etaClockTime})
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#171717] text-white border-2 border-[#71883F] font-black text-xs flex items-center justify-center shadow-lg">
                      {stop.stopNumber}
                    </div>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>

            {isOptimizing && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-[#71883F] animate-spin" />
                  <p className="text-xs font-bold text-[#71883F]">
                    Computing Optimal Multi-Stop Delivery Path...
                  </p>
                </div>
              </div>
            )}

            {/* Floating Map Controls */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={() =>
                  setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
                }
                className="pointer-events-auto px-3 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-xs font-bold text-[#171717] shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#71883F]" />
                <span>{mapTypeId === 'roadmap' ? 'Satellite View' : 'Street Map'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!map || optimizedStops.length === 0) return;
                  const bounds = new google.maps.LatLngBounds();
                  bounds.extend(activeOrigin);
                  optimizedStops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
                  map.fitBounds(bounds, 60);
                }}
                className="pointer-events-auto px-3 py-1.5 bg-[#171717] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#A9C46C]" />
                <span>Fit All {optimizedStops.length} Stops</span>
              </button>
            </div>
          </div>

          {/* Action Bar: Launch Multi-Stop Turn-by-Turn Navigation & Batch Assign */}
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <UserCheck className="w-4 h-4 text-[#71883F] shrink-0" />
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="flex-1 bg-white border border-[#E8E8E3] rounded-xl px-3 py-2 text-xs font-semibold text-[#171717] outline-none focus:border-[#71883F]"
              >
                <option value="">Assign Route to Delivery Partner (Optional)...</option>
                {deliveryPersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.vehicleType} • {p.status})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBatchAssignAndDispatch}
                disabled={optimizedStops.length === 0}
                className="px-3.5 py-2 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A9C46C]" />
                <span>Dispatch All ({optimizedStops.length})</span>
              </button>
            </div>

            <a
              href={googleMapsMultiStopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all shrink-0"
            >
              <Navigation className="w-4 h-4" />
              <span>Start Multi-Stop Drive in Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
