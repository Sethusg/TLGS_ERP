import React, { useState } from 'react';
import {
  Bus,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Fuel,
  ShieldCheck,
} from 'lucide-react';
import { BusRoute } from '../types';

interface TransportModuleProps {
  busRoutes: BusRoute[];
  subItem?: string;
}

export const TransportModule: React.FC<TransportModuleProps> = ({
  busRoutes,
  subItem = 'transport-bus-locations',
}) => {
  const [activeTab, setActiveTab] = useState<'locations' | 'routes' | 'reports'>(() => {
    if (subItem === 'transport-routes') return 'routes';
    if (subItem === 'transport-reports') return 'reports';
    return 'locations';
  });

  const [selectedBus, setSelectedBus] = useState<BusRoute>(busRoutes[0]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bus className="w-6 h-6 text-amber-600" />
            <span>School Transport & Fleet GPS Telemetry</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            12 Operational Routes · 782 Daily Student Commuters · Real-Time Speed & Geofencing
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'locations' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Live Bus Locations
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'routes' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Routes & Stops
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'reports' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fleet Reports
          </button>
        </div>
      </div>

      {/* VIEW: LIVE LOCATIONS WITH MAP SIMULATOR */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Fleet List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
              Active Fleet Status ({busRoutes.length} Buses)
            </h3>
            {busRoutes.map((bus) => {
              const isSelected = selectedBus.id === bus.id;
              return (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBus(bus)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900">{bus.busNo}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        bus.status === 'In Transit'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1 font-medium">{bus.routeTitle}</p>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Navigation className="w-3 h-3 text-amber-600" />
                      {bus.speedKmh} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      {bus.studentsOnBoard} / {bus.capacity} onboard
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Live Simulation Map View */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{selectedBus.busNo}</h4>
                <p className="text-xs text-gray-500">Driver: {selectedBus.driverName} ({selectedBus.driverPhone})</p>
              </div>
              <a
                href={`tel:${selectedBus.driverPhone}`}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            </div>

            {/* Visual Simulated Route Map */}
            <div className="relative h-72 w-full bg-slate-900 rounded-xl overflow-hidden p-4 border border-slate-700 flex flex-col justify-between text-white">
              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Map Info Header */}
              <div className="relative z-10 flex items-center justify-between bg-black/40 backdrop-blur-xs p-2.5 rounded-lg border border-white/10 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">CURRENT LOCATION:</span>
                  <span className="font-bold text-amber-300">{selectedBus.currentLocationName}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px]">CURRENT SPEED:</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedBus.speedKmh} KM/H</span>
                </div>
              </div>

              {/* Simulated Roadmap graphic */}
              <div className="relative z-10 my-auto py-4">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 right-0 h-1.5 bg-amber-500/40 rounded-full" />
                  <div
                    className="absolute left-0 h-1.5 bg-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: selectedBus.status === 'Arrived at School' ? '100%' : '65%' }}
                  />

                  {/* Stops */}
                  {selectedBus.stops.map((stop, idx) => (
                    <div key={idx} className="relative z-20 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 shadow-md flex items-center justify-center text-[8px] font-bold text-slate-900">
                        {idx + 1}
                      </div>
                      <span className="text-[10px] text-gray-300 mt-1 font-medium max-w-[80px] text-center leading-tight truncate">
                        {stop.stopName}
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono">{stop.morningTime}</span>
                    </div>
                  ))}

                  {/* Destination */}
                  <div className="relative z-20 flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-md flex items-center justify-center text-[10px] font-bold text-slate-900">
                      ★
                    </div>
                    <span className="text-[10px] text-emerald-300 font-bold mt-1">Campus</span>
                    <span className="text-[9px] text-gray-400">07:55 AM</span>
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-gray-300 bg-black/40 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>CCTV & Speed Governor Verified</span>
                </span>
                <span className="text-gray-400 font-mono">GPS Sync: Live (2s ago)</span>
              </div>
            </div>

            {/* Route Stops Table */}
            <div>
              <h5 className="text-xs font-bold text-gray-800 mb-2">Designated Pick-up & Drop Points</h5>
              <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-3.5 py-2">Stop Name</th>
                      <th className="px-3.5 py-2 font-mono">Morning Pickup</th>
                      <th className="px-3.5 py-2 font-mono">Evening Drop</th>
                      <th className="px-3.5 py-2 text-right">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedBus.stops.map((stop, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-3.5 py-2 font-medium text-gray-900">{stop.stopName}</td>
                        <td className="px-3.5 py-2 font-mono text-gray-700">{stop.morningTime}</td>
                        <td className="px-3.5 py-2 font-mono text-gray-700">{stop.eveningTime}</td>
                        <td className="px-3.5 py-2 text-right font-bold text-blue-700">
                          {stop.studentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ROUTES */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">All Scheduled School Transport Routes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {busRoutes.map((bus) => (
              <div key={bus.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900">{bus.busNo}</h4>
                  <span className="text-xs font-medium text-blue-700">{bus.capacity} Seater</span>
                </div>
                <p className="text-xs font-medium text-gray-700">{bus.routeTitle}</p>
                <div className="text-xs text-gray-500">
                  Driver: <strong>{bus.driverName}</strong> ({bus.driverPhone})
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{bus.stops.length} Stops</span>
                  <span className="font-bold text-emerald-800">{bus.studentsOnBoard} Registered Pass-Holders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Vehicle Compliance & Fuel Efficiency Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">RTO Fitness Certifications</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">100% Valid (All 12 Buses)</div>
              <span className="text-[11px] text-gray-500">Next renewal cycle: March 2027</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">Monthly Fuel Efficiency</span>
              <div className="text-xl font-bold text-gray-900 mt-1">4.8 km / Litre (Diesel)</div>
              <span className="text-[11px] text-emerald-600 font-semibold">+6% optimization with GPS route routing</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">On-Time Arrival Index</span>
              <div className="text-xl font-bold text-blue-700 mt-1">98.6%</div>
              <span className="text-[11px] text-gray-500">Arrives before 07:50 AM morning assembly</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
