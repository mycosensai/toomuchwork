'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { ParkingLot, BusinessLocation } from '@/types';
import { cn } from '@/lib/cn';

interface ParkingLotOverlayProps {
  className?: string;
}

export function ParkingLotOverlay({ className }: ParkingLotOverlayProps) {
  const mapRef = useStore((s) => s.mapRef);
  const { businesses } = useStore();
  const [visibleLots, setVisibleLots] = useState<(BusinessLocation & { parkingLot: ParkingLot })[]>([]);
  const [selectedLot, setSelectedLot] = useState<(BusinessLocation & { parkingLot: ParkingLot }) | null>(null);

  // Update visible lots when map moves or data changes
  useEffect(() => {
    const map = mapRef.current?.map;
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    // Filter lots within current viewport
    const visible = businesses
      .filter(b => b.parkingLot && bounds.contains([b.lng, b.lat]))
      .map(b => ({ ...b, parkingLot: b.parkingLot! }));
    
    setVisibleLots(visible);
  }, [mapRef, businesses]);

  // Add parking lot sources and layers on map load
  useEffect(() => {
    const map = mapRef.current?.map;
    if (!map || map.getSource('parking-lots')) return;

    // Add parking lot polygon source
    map.addSource('parking-lots', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Occupancy heat layer (color-coded by occupancy rate)
    map.addLayer({
      id: 'parking-lots-heat',
      type: 'fill',
      source: 'parking-lots',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'occupancyRate'],
          0, '#22c55e',    // green - empty
          0.3, '#84cc16',  // light green
          0.5, '#eab308',  // yellow - moderate
          0.7, '#f97316',  // orange - busy
          0.85, '#ef4444', // red - very busy
          1, '#a855f7'     // purple - full
        ],
        'fill-opacity': 0.6,
        'fill-outline-color': '#ffffff'
      },
      filter: ['!', ['has', 'point_count']] // Only for unclustered features
    });

    // Parking lot outlines
    map.addLayer({
      id: 'parking-lots-outline',
      type: 'line',
      source: 'parking-lots',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
        'line-opacity': 0.8
      },
      filter: ['!', ['has', 'point_count']]
    });

    // Occupancy labels (show percentage on each lot)
    map.addLayer({
      id: 'parking-lots-labels',
      type: 'symbol',
      source: 'parking-lots',
      layout: {
        'text-field': ['concat', ['number-format', ['*', ['get', 'occupancyRate'], 100], { 'max-fraction-digits': 0 }], '%'],
        'text-size': 10,
        'text-font': ['Open Sans Bold'],
        'text-anchor': 'center',
        'text-offset': [0, 0]
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      },
      minzoom: 15,
      filter: ['!', ['has', 'point_count']]
    });

    // Click handler for parking lots
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', 'parking-lots-heat', (e: any) => {
      const feature = e.features?.[0];
      if (feature) {
        const lotId = feature.properties?.id;
        const lot = visibleLots.find(l => l.parkingLot.id === lotId);
        if (lot) setSelectedLot(lot);
      }
    });

    // Change cursor on hover
    map.on('mouseenter', 'parking-lots-heat', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'parking-lots-heat', () => {
      map.getCanvas().style.cursor = '';
    });

  }, [mapRef, visibleLots, selectedLot]);

  // Update parking lot data when visible lots change
  useEffect(() => {
    const map = mapRef.current?.map;
    if (!map || !map.getSource('parking-lots')) return;

    const rate = (occ: { occupancyRate?: number } | undefined) => occ?.occupancyRate ?? 0;

    const features = visibleLots.map(biz => {
      const lot = biz.parkingLot;
      const occupancy = lot.currentOccupancy;
      const occupancyRate = rate(occupancy);
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [lot.geometry] },
        properties: {
          id: lot.id,
          businessId: biz.id,
          businessName: biz.name,
          totalSpaces: lot.totalSpaces,
          occupiedSpaces: occupancy?.occupiedSpaces || 0,
          occupancyRate,
          occupancyLevel: occupancyRate > 0.85 ? 'full' :
                          occupancyRate > 0.7 ? 'very-busy' :
                          occupancyRate > 0.5 ? 'busy' :
                          occupancyRate > 0.3 ? 'moderate' : 'light',
          lastUpdated: occupancy?.lastUpdated || new Date().toISOString()
        }
      };
    });

    const source = map.getSource('parking-lots');
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [visibleLots, mapRef]);

  // Render selected lot detail panel
  if (!selectedLot) return null;

  const lot = selectedLot.parkingLot;
  const occupancy = lot.currentOccupancy;
  const occupancyRate = occupancy?.occupancyRate ?? 0;
  const occupied = occupancy?.occupiedSpaces || 0;
  const total = lot.totalSpaces;
  const vacant = total - (occupancy?.occupiedSpaces || 0);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 0.85) return 'bg-purple-500';
    if (rate >= 0.7) return 'bg-red-500';
    if (rate >= 0.5) return 'bg-orange-500';
    if (rate >= 0.3) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4', className)}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setSelectedLot(null)}
      />
      
      {/* Detail Panel */}
      <div className="relative w-full max-w-md rounded-t-2xl bg-white shadow-2xl overflow-hidden dark:bg-zinc-950 animate-slide-up-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getOccupancyColor(occupancyRate)}`}>
              <span className="text-white font-bold text-sm">{Math.round(occupancyRate * 100)}%</span>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{selectedLot.name || 'Parking Lot'}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {total} spaces • {occupancy?.source || 'simulation'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedLot(null)}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Occupancy Visualization */}
        <div className="p-4 space-y-4">
          {/* Large occupancy circle */}
          <div className="relative h-40 w-full flex items-center justify-center">
            <svg className="w-full h-40" viewBox="0 0 200 200">
              <circle
                cx="100" cy="100" r="85"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
                className="dark:stroke-zinc-700"
              />
              <circle
                cx="100" cy="100" r="85"
                stroke={getOccupancyColor(occupancyRate)}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${occupancyRate * 534.07} 534.07`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              <text
                x="100" y="105"
                textAnchor="middle"
                fontSize="36"
                fontWeight="bold"
                fill="#1f2937"
                className="dark:fill-zinc-100"
              >
                {Math.round(occupancyRate * 100)}%
              </text>
            </svg>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 p-2 bg-zinc-50 rounded-lg dark:bg-zinc-800/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {occupied}
              </div>
              <div className="text-xs text-zinc-500">Occupied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {vacant}
              </div>
              <div className="text-xs text-zinc-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {total}
              </div>
              <div className="text-xs text-zinc-500">Total</div>
            </div>
          </div>

          {/* Vehicle Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Vehicles by Type</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {occupancy?.vehiclesByType && Object.entries(occupancy.vehiclesByType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 rounded-full dark:bg-zinc-800">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 capitalize">{type}</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white/50 px-1.5 py-0.5 rounded dark:bg-zinc-700/50">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Status */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg dark:bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${occupancy?.source === 'camera' ? 'bg-emerald-500' : occupancy?.source === 'satellite' ? 'bg-blue-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {occupancy?.source === 'camera' ? 'Live Camera' : 
                 occupancy?.source === 'satellite' ? 'Satellite' : 
                 occupancy?.source === 'sensor' ? 'Sensor' : 'Simulation'}
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              Updated {occupancy?.lastUpdated ? new Date(occupancy.lastUpdated).toLocaleTimeString() : 'just now'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
              Navigate Here
            </button>
            <button className="flex-1 py-2.5 px-4 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors">
              Set Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOccupancyColor(rate: number): string {
  if (rate >= 0.85) return 'bg-purple-500';
  if (rate >= 0.7) return 'bg-red-500';
  if (rate >= 0.5) return 'bg-orange-500';
  if (rate >= 0.3) return 'bg-yellow-500';
  return 'bg-emerald-500';
}