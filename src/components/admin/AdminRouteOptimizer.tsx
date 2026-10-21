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
  Split,
  PlusCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore, DEFAULT_DISPATCH_ORDERS } from '../../context/StoreContext';
import { Order } from '../../types';

export interface OptimizedStop {
  stopNumber: number;
  order: Order;
  lat: number;
  lng: number;
  legDistanceKm: string;
  legDurationMins: number;
  cumulativeMins: number;
  etaClockTime: string;
  routeId?: string;
  routeColor?: string;
}

export interface FormedRouteCluster {
  id: string;
  routeNumber: number;
  name: string;
  zone: string;
  color: string;
  polylineHex: string;
  assignedDriverId: string;
  stops: OptimizedStop[];
  totalDistanceKm: string;
  totalDurationMins: number;
  savedDistanceKm: string;
  savedMins: number;
  googleMapsUrl: string;
}

const ROUTE_PALETTE = [
  { color: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-500', hex: '#10B981', light: 'bg-emerald-50' },
  { color: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-500', hex: '#3B82F6', light: 'bg-blue-50' },
  { color: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-500', hex: '#8B5CF6', light: 'bg-purple-50' },
  { color: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-500', hex: '#F59E0B', light: 'bg-amber-50' },
];

export const AdminRouteOptimizer: React.FC = () => {
  const {
    orders,
    allOrders,
    deliveryPersonnel,
    assignDeliveryPerson,
    updateOrderStatus,
    showToast,
    storeSettings,
    seedSampleDispatchOrders,
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

  // Route Formation Mode: Single master vehicle route vs Multiple delivery route formation (fleet dispatch)
  const [formationMode, setFormationMode] = useState<'single' | 'multiple'>('multiple');
  const [numRoutes, setNumRoutes] = useState<number>(2); // 2, 3, or 4 routes
  const [activeFilterRoute, setActiveFilterRoute] = useState<string>('all'); // 'all', 'route-1', 'route-2', etc.

  // Candidate orders eligible for multi-stop delivery optimization
  const candidateOrders = useMemo<Order[]>(() => {
    const poolMap = new globalThis.Map<string, Order>();
    (orders || []).forEach((o) => poolMap.set(o.id, o));
    (allOrders || []).forEach((o) => {
      if (!poolMap.has(o.id)) poolMap.set(o.id, o);
    });

    // Ensure candidate orders always contain ready dispatch items
    if (poolMap.size === 0 || !Array.from(poolMap.values()).some((o) => o.orderStatus !== 'Delivered')) {
      DEFAULT_DISPATCH_ORDERS.forEach((d) => {
        if (!poolMap.has(d.id)) poolMap.set(d.id, d);
      });
    }

    const list = Array.from(poolMap.values()).filter(
      (o) => !o.isArchived && o.orderStatus !== 'Cancelled'
    );
    return list.length > 0 ? list : DEFAULT_DISPATCH_ORDERS;
  }, [orders, allOrders]);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(() => {
    const activeOnes = candidateOrders
      .filter((o) => o.orderStatus !== 'Delivered')
      .slice(0, 8)
      .map((o) => o.id);
    return activeOnes.length > 0
      ? activeOnes
      : candidateOrders.slice(0, 6).map((o) => o.id);
  });

  const [travelMode, setTravelMode] = useState<'DRIVING' | 'TWO_WHEELER'>('TWO_WHEELER');
  const [returnToHub, setReturnToHub] = useState<boolean>(false);
  const [useLiveStartGps, setUseLiveStartGps] = useState<boolean>(false);
  const [liveGpsOrigin, setLiveGpsOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Single Route Assignment state
  const [selectedSingleAgentId, setSelectedSingleAgentId] = useState<string>('');
  const [singleOptimizedStops, setSingleOptimizedStops] = useState<OptimizedStop[]>([]);
  const [singleRouteSummary, setSingleRouteSummary] = useState<{
    totalDistanceKm: string;
    totalDurationMins: number;
    savedDistanceKm: string;
    savedMins: number;
  } | null>(null);

  // Multiple Route Clusters state
  const [formedRoutes, setFormedRoutes] = useState<FormedRouteCluster[]>([]);
  const [routeDriverMap, setRouteDriverMap] = useState<Record<string, string>>({});

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

  // Build sequential local nearest neighbor stops
  const buildNearestNeighborStops = (
    stopsWithCoords: Array<{ order: Order; lat: number; lng: number }>,
    originPt: { lat: number; lng: number },
    routeTag: string,
    colorHex: string
  ): { stops: OptimizedStop[]; totalKm: number; totalMins: number; savedKm: number } => {
    const remaining = [...stopsWithCoords];
    const ordered: Array<{ order: Order; lat: number; lng: number }> = [];
    let currentPt = { lat: originPt.lat, lng: originPt.lng };

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
      const fromPt = idx === 0 ? originPt : ordered[idx - 1];
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
        routeId: routeTag,
        routeColor: colorHex,
      };
    });

    if (returnToHub && ordered.length > 0) {
      const last = ordered[ordered.length - 1];
      const backKm = calcHaversineKm(last, STORE_HUB) * 1.28;
      totalKmNum += backKm;
      cumulativeMinutes += Math.round(backKm * 3.1);
    }

    return {
      stops: builtStops,
      totalKm: totalKmNum,
      totalMins: cumulativeMinutes,
      savedKm: Math.max(0.6, totalKmNum * 0.22),
    };
  };

  // Partition stops geographically or into balanced subsets for Multiple Delivery Route Formation
  const generateMultipleDeliveryRoutes = () => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (selectedOrders.length === 0) {
      setFormedRoutes([]);
      setSingleOptimizedStops([]);
      return;
    }

    setIsOptimizing(true);

    const allStopsWithCoords = selectedOrders.map((order, idx) => {
      const coords = getOrderCoords(order, idx);
      return { order, lat: coords.lat, lng: coords.lng };
    });

    // 1. Single Route Calculation
    const singleResult = buildNearestNeighborStops(
      allStopsWithCoords,
      activeOrigin,
      'single',
      '#10B981'
    );
    setSingleOptimizedStops(singleResult.stops);
    setSingleRouteSummary({
      totalDistanceKm: singleResult.totalKm.toFixed(1),
      totalDurationMins: singleResult.totalMins,
      savedDistanceKm: singleResult.savedKm.toFixed(1),
      savedMins: Math.round(singleResult.savedKm * 3.1),
    });

    // 2. Multiple Delivery Route Formation (Fleet Partitioning)
    const effectiveCount = Math.min(numRoutes, allStopsWithCoords.length);
    const clusters: Array<typeof allStopsWithCoords> = Array.from({ length: effectiveCount }, () => []);

    // Sort by polar angle / bearing from hub to form contiguous geographic sectors
    const sortedGeographically = [...allStopsWithCoords].sort((a, b) => {
      const angleA = Math.atan2(a.lat - STORE_HUB.lat, a.lng - STORE_HUB.lng);
      const angleB = Math.atan2(b.lat - STORE_HUB.lat, b.lng - STORE_HUB.lng);
      return angleA - angleB;
    });

    // Distribute into routes
    sortedGeographically.forEach((stop, idx) => {
      const bucketIdx = idx % effectiveCount;
      clusters[bucketIdx].push(stop);
    });

    const zoneNames = [
      'North & Central Commercial Hub',
      'West Coast & Technopark Corridor',
      'East & Kowdiar Residential Enclave',
      'South Bypass & Suburban Delivery Ring',
    ];

    const newFormedRoutes: FormedRouteCluster[] = clusters.map((clusterStops, rIdx) => {
      const routeId = `route-${rIdx + 1}`;
      const palette = ROUTE_PALETTE[rIdx % ROUTE_PALETTE.length];
      const result = buildNearestNeighborStops(clusterStops, activeOrigin, routeId, palette.hex);

      // Multi-stop Google Maps URL
      const originParam = `${activeOrigin.lat},${activeOrigin.lng}`;
      const lastStop = result.stops[result.stops.length - 1];
      const destinationParam = returnToHub
        ? `${STORE_HUB.lat},${STORE_HUB.lng}`
        : lastStop
        ? `${lastStop.lat},${lastStop.lng}`
        : `${STORE_HUB.lat},${STORE_HUB.lng}`;

      const waypointsList = returnToHub
        ? result.stops.map((s) => `${s.lat},${s.lng}`)
        : result.stops.slice(0, -1).map((s) => `${s.lat},${s.lng}`);

      const waypointsParam =
        waypointsList.length > 0 ? `&waypoints=${encodeURIComponent(waypointsList.join('|'))}` : '';
      const modeParam = travelMode === 'TWO_WHEELER' ? 'two-wheeler' : 'driving';
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}${waypointsParam}&travelmode=${modeParam}`;

      const autoDriver =
        routeDriverMap[routeId] ||
        (deliveryPersonnel[rIdx] ? deliveryPersonnel[rIdx].id : '');

      return {
        id: routeId,
        routeNumber: rIdx + 1,
        name: `Route ${rIdx + 1}: ${zoneNames[rIdx] || `Zone ${rIdx + 1}`}`,
        zone: zoneNames[rIdx] || `Zone ${rIdx + 1}`,
        color: palette.color,
        polylineHex: palette.hex,
        assignedDriverId: autoDriver,
        stops: result.stops,
        totalDistanceKm: result.totalKm.toFixed(1),
        totalDurationMins: result.totalMins,
        savedDistanceKm: result.savedKm.toFixed(1),
        savedMins: Math.round(result.savedKm * 3.1),
        googleMapsUrl: mapsUrl,
      };
    });

    setFormedRoutes(newFormedRoutes);

    // Draw polylines on Google Map for each route
    if (map) {
      newFormedRoutes.forEach((route) => {
        if (route.stops.length === 0) return;
        const pathCoords = [
          { lat: activeOrigin.lat, lng: activeOrigin.lng },
          ...route.stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        ];
        if (returnToHub) {
          pathCoords.push({ lat: STORE_HUB.lat, lng: STORE_HUB.lng });
        }

        const poly = new google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: route.polylineHex,
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map,
        });
        polylinesRef.current.push(poly);
      });
    }

    setIsOptimizing(false);
  };

  useEffect(() => {
    generateMultipleDeliveryRoutes();
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
    numRoutes,
  ]);

  // Batch Assign & Dispatch an Individual Formed Route
  const handleDispatchRoute = async (route: FormedRouteCluster) => {
    const driverId = routeDriverMap[route.id] || route.assignedDriverId;
    const worker = deliveryPersonnel.find((p) => p.id === driverId);

    for (const stop of route.stops) {
      if (driverId) {
        await assignDeliveryPerson(stop.order.id, driverId);
      }
      if (stop.order.orderStatus !== 'Delivered') {
        await updateOrderStatus(stop.order.id, 'Out for Delivery');
      }
    }
    showToast(
      `Dispatched ${route.stops.length} orders on ${route.name}${worker ? ` to ${worker.name}` : ''}!`,
      'success'
    );
  };

  // Dispatch All Formed Routes in 1 click
  const handleDispatchAllRoutes = async () => {
    if (formedRoutes.length === 0) return;
    let totalStops = 0;
    for (const route of formedRoutes) {
      const driverId = routeDriverMap[route.id] || route.assignedDriverId;
      for (const stop of route.stops) {
        if (driverId) {
          await assignDeliveryPerson(stop.order.id, driverId);
        }
        if (stop.order.orderStatus !== 'Delivered') {
          await updateOrderStatus(stop.order.id, 'Out for Delivery');
        }
        totalStops += 1;
      }
    }
    showToast(
      `All ${formedRoutes.length} delivery routes (${totalStops} orders) successfully dispatched to fleet!`,
      'success'
    );
  };

  // Filtered stops for map display based on activeFilterRoute
  const visibleStops = useMemo(() => {
    if (formationMode === 'single') return singleOptimizedStops;
    if (activeFilterRoute === 'all') {
      return formedRoutes.flatMap((r) => r.stops);
    }
    const target = formedRoutes.find((r) => r.id === activeFilterRoute);
    return target ? target.stops : [];
  }, [formationMode, singleOptimizedStops, formedRoutes, activeFilterRoute]);

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
                Driver Dispatch Console & Route Optimizer
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Multi-Route Formation Active
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Form multiple delivery routes across multiple drivers, balance zone stops, and optimize visiting sequence with Google Maps.
            </p>
          </div>
        </div>

        {/* Action Controls & Formation Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-[#F7F8F3] p-1 rounded-xl border border-[#E8E8E3]">
            <button
              type="button"
              onClick={() => setFormationMode('multiple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                formationMode === 'multiple'
                  ? 'bg-[#71883F] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Multiple Delivery Routes</span>
            </button>
            <button
              type="button"
              onClick={() => setFormationMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                formationMode === 'single'
                  ? 'bg-[#71883F] text-white shadow-2xs'
                  : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Single Route</span>
            </button>
          </div>

          {/* If Multiple Routes: Number of Routes Selector */}
          {formationMode === 'multiple' && (
            <div className="flex items-center gap-1.5 bg-[#EFF4E6] border border-[#71883F]/30 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-[11px] font-bold text-[#71883F]">Routes:</span>
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumRoutes(num)}
                  className={`w-6 h-6 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    numRoutes === num
                      ? 'bg-[#71883F] text-white shadow-xs'
                      : 'bg-white text-[#171717] hover:bg-neutral-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}

          {/* Restock sample orders if needed */}
          <button
            type="button"
            onClick={seedSampleDispatchOrders}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAFBF7] hover:bg-white text-[#171717] border border-[#E8E8E3] flex items-center gap-1.5 cursor-pointer"
            title="Load 6 ready-to-deliver sample orders into the dispatch console"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#71883F]" />
            <span>Generate Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Orders Ready to Deliver
          </span>
          <span className="text-lg font-black text-[#171717] mt-0.5 block">
            {selectedOrderIds.length} Selected ({candidateOrders.length} Available)
          </span>
        </div>
        <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Formed Fleet Routes
          </span>
          <span className="text-lg font-black text-[#71883F] mt-0.5 block">
            {formationMode === 'multiple' ? `${formedRoutes.length} Routes Formed` : '1 Master Route'}
          </span>
        </div>
        <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
            Fleet Drivers Available
          </span>
          <span className="text-lg font-black text-[#171717] mt-0.5 block">
            {deliveryPersonnel.length} Active Fleet Drivers
          </span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Multi-Route Dispatch
          </span>
          <span className="text-xs font-bold text-emerald-800 mt-1 block">
            {formationMode === 'multiple'
              ? `Balanced across ${formedRoutes.length} geographic sectors`
              : 'Sequential single driver loop'}
          </span>
        </div>
      </div>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Orders Selection & Formed Routes Details */}
        <div className="lg:col-span-5 space-y-4">
          {/* Order Selection Box */}
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#171717]">
                1. Candidate Orders for Dispatch ({selectedOrderIds.length} selected)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrderIds(candidateOrders.slice(0, 10).map((o) => o.id))
                  }
                  className="text-[10px] font-bold text-[#71883F] hover:underline cursor-pointer"
                >
                  Select All
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

          {/* Multiple Delivery Routes Formation Cards */}
          {formationMode === 'multiple' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717]">
                  2. Formed Delivery Routes ({formedRoutes.length} Routes Formed)
                </span>
                <button
                  type="button"
                  onClick={generateMultipleDeliveryRoutes}
                  className="text-[11px] font-bold text-[#71883F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Re-Partition
                </button>
              </div>

              {formedRoutes.map((route) => {
                const driverId = routeDriverMap[route.id] || route.assignedDriverId;
                const assignedDriver = deliveryPersonnel.find((p) => p.id === driverId);

                return (
                  <div
                    key={route.id}
                    className="bg-white border border-[#E8E8E3] rounded-2xl p-4 space-y-3 shadow-2xs hover:border-[#71883F] transition-all"
                  >
                    {/* Route Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E8E8E3]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: route.polylineHex }}
                        />
                        <span className="font-extrabold text-xs text-[#171717]">
                          {route.name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4E6] text-[#71883F]">
                        {route.stops.length} Stops • {route.totalDistanceKm} km
                      </span>
                    </div>

                    {/* Driver Assignment for this Route */}
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-[#71883F] shrink-0" />
                      <select
                        value={driverId}
                        onChange={(e) =>
                          setRouteDriverMap((prev) => ({ ...prev, [route.id]: e.target.value }))
                        }
                        className="flex-1 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#171717] outline-none focus:border-[#71883F]"
                      >
                        <option value="">Select Delivery Driver for this Route...</option>
                        {deliveryPersonnel.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.vehicleType} • {p.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stops List */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {route.stops.map((stop) => (
                        <div
                          key={stop.order.id}
                          className="p-2 rounded-lg bg-[#FAFBF7] border border-[#E8E8E3] flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-5 h-5 rounded-full text-white font-black text-[10px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: route.polylineHex }}
                            >
                              {stop.stopNumber}
                            </span>
                            <span className="font-bold text-[#171717] truncate">
                              #{stop.order.id} • {stop.order.customerName}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#6B6B6B] font-mono shrink-0">
                            ETA {stop.etaClockTime}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons for this individual route */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <a
                        href={route.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#F7F8F3] hover:bg-neutral-200 text-[#171717] rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-[#71883F]" />
                        <span>Navigate Route</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDispatchRoute(route)}
                        className="px-3 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Dispatch Route {route.routeNumber}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Route Sequence */
            <div className="bg-white border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717]">
                  2. Single Optimized Delivery Sequence ({singleOptimizedStops.length} stops)
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {singleOptimizedStops.map((stop) => (
                  <div
                    key={stop.order.id}
                    className="p-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAFBF7] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[#171717] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        {stop.stopNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#171717] truncate">
                          {stop.order.customerName} (#{stop.order.id})
                        </p>
                        <p className="text-[10px] text-[#6B6B6B] truncate">
                          {stop.order.shippingAddress?.area || stop.order.shippingAddress?.city}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#71883F]">
                      ETA {stop.etaClockTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Multi-Stop Google Map & Fleet Action Bar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-[#E8E8E3] shadow-inner bg-[#E5E9E0]">
            <Map
              id="admin-multi-stop-optimizer-map"
              mapId="DEMO_MAP_ID"
              mapTypeId={mapTypeId}
              defaultCenter={{ lat: STORE_HUB.lat, lng: STORE_HUB.lng }}
              defaultZoom={12}
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
              {visibleStops.map((stop) => (
                <AdvancedMarker
                  key={stop.order.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  title={`Stop #${stop.stopNumber}: ${stop.order.customerName}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-white/95 border border-[#E8E8E3] px-2 py-0.5 rounded-md shadow-md text-[10px] font-bold text-[#171717] mb-1 whitespace-nowrap">
                      <span className="font-black mr-1" style={{ color: stop.routeColor || '#71883F' }}>
                        {stop.routeId ? `R${stop.routeId.replace('route-', '')}-#${stop.stopNumber}` : `#${stop.stopNumber}`}
                      </span>
                      {stop.order.customerName} ({stop.etaClockTime})
                    </div>
                    <div
                      className="w-7 h-7 rounded-full text-white border-2 border-white font-black text-xs flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: stop.routeColor || '#171717' }}
                    >
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
                    Computing Optimal Multiple Delivery Routes...
                  </p>
                </div>
              </div>
            )}

            {/* Route Filter Pills on Top of Map */}
            {formationMode === 'multiple' && formedRoutes.length > 0 && (
              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
                <button
                  type="button"
                  onClick={() => setActiveFilterRoute('all')}
                  className={`pointer-events-auto px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-md transition-all cursor-pointer ${
                    activeFilterRoute === 'all'
                      ? 'bg-[#171717] text-white'
                      : 'bg-white/95 text-[#171717] hover:bg-white'
                  }`}
                >
                  All Fleet Routes ({formedRoutes.length})
                </button>
                {formedRoutes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveFilterRoute(r.id)}
                    className={`pointer-events-auto px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeFilterRoute === r.id
                        ? 'text-white'
                        : 'bg-white/95 text-[#171717] hover:bg-white'
                    }`}
                    style={activeFilterRoute === r.id ? { backgroundColor: r.polylineHex } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: r.polylineHex }}
                    />
                    <span>Route {r.routeNumber} ({r.stops.length})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Floating Map Controls at Bottom */}
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
                  if (!map || visibleStops.length === 0) return;
                  const bounds = new google.maps.LatLngBounds();
                  bounds.extend(activeOrigin);
                  visibleStops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
                  map.fitBounds(bounds, 60);
                }}
                className="pointer-events-auto px-3 py-1.5 bg-[#171717] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#A9C46C]" />
                <span>Fit All {visibleStops.length} Stops</span>
              </button>
            </div>
          </div>

          {/* Action Bar: Dispatch All Formed Routes */}
          <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-[#171717]">
                Fleet Multi-Route Dispatch Console
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                {formationMode === 'multiple'
                  ? `${formedRoutes.length} Delivery Routes formed with ${formedRoutes.reduce((acc, r) => acc + r.stops.length, 0)} total customer delivery orders.`
                  : `${singleOptimizedStops.length} Orders organized in a sequential delivery circuit.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {formationMode === 'multiple' && (
                <button
                  type="button"
                  onClick={handleDispatchAllRoutes}
                  disabled={formedRoutes.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispatch All {formedRoutes.length} Formed Routes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
