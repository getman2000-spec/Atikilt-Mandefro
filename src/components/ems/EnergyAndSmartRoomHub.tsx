/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Energy Management System (EMS) & Smart Room IoT Hub
 * In-room VRF climate telemetry, keycard/window interlock monitoring,
 * electrical submetering zones, and automated BACnet energy optimization policies.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Gauge,
  Thermometer,
  ShieldAlert,
  Leaf,
  Sun,
  Flame,
  Snowflake,
  Sliders,
  Power,
  RefreshCw,
  Search,
  TrendingDown,
  Building,
  Key,
  DoorOpen,
  DoorClosed,
} from 'lucide-react';
import {
  Hotel,
  SmartRoomDevice,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storageService } from '../../services/storage';
import { PageHeader, KpiCard, StatusBadge, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency } from '../../utils/formatters';

interface EnergyAndSmartRoomHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const EnergyAndSmartRoomHub: React.FC<EnergyAndSmartRoomHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<'smart_rooms' | 'submetering' | 'policies'>('smart_rooms');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setOccupancyFilter('all');
    setSearchQuery('');
  }, [hotelId]);

  const currentActor = useMemo(
    () => ({
      email: currentUser?.email || 'engineering@property.local',
      fullName: currentUser?.fullName || 'Chief Engineer',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const devices = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? storageService.getSmartRoomDevices(hotelId) : [];
  }, [hotelId, refreshKey]);

  const submeters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? storageService.getEnergySubmeters(hotelId) : [];
  }, [hotelId, refreshKey]);

  const policies = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return hotelId ? storageService.getEmsPolicies(hotelId) : [];
  }, [hotelId, refreshKey]);

  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (occupancyFilter !== 'all' && dev.occupancyState !== occupancyFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRoom = dev.roomNumber.toLowerCase().includes(query);
        const matchesName = dev.deviceName.toLowerCase().includes(query);
        if (!matchesRoom && !matchesName) return false;
      }
      return true;
    });
  }, [devices, occupancyFilter, searchQuery]);

  const aggregateMetrics = useMemo(() => {
    const totalKw = submeters.reduce((sum, s) => sum + s.currentKwDemand, 0);
    const totalDailyKwh = submeters.reduce((sum, s) => sum + s.dailyKwhTotal, 0);
    const totalCarbon = submeters.reduce((sum, s) => sum + s.carbonFootprintKgCo2, 0);
    const totalSavingsEtb = policies
      .filter((p) => p.enabled)
      .reduce((sum, p) => sum + p.estimatedMonthlySavingsEtb, 0);
    const warningDevices = devices.filter((d) => d.status === 'warning' || !d.windowClosed).length;

    return {
      currentKwDemand: Math.round(totalKw * 10) / 10,
      dailyKwh: Math.round(totalDailyKwh),
      monthlyCarbonKg: Math.round(totalCarbon),
      totalSavingsEtb,
      warningDevices,
    };
  }, [submeters, policies, devices]);

  const handleUpdateClimate = (deviceId: string, updates: Partial<SmartRoomDevice>) => {
    storageService.updateSmartRoomDevice(deviceId, updates, currentActor);
    setRefreshKey((k) => k + 1);
  };

  const handleBulkSetback = () => {
    if (!hotelId) return;
    const count = storageService.setAllUnoccupiedToEcoSetback(hotelId, currentActor);
    setRefreshKey((k) => k + 1);
    toast('Eco-setback dispatched', {
      description: `Applied 26°C eco standby setpoint to ${count} unoccupied suite(s).`,
      variant: 'success',
    });
  };

  const handleTogglePolicy = (policyId: string, policyName: string, currentEnabled: boolean) => {
    storageService.toggleEmsPolicy(policyId, !currentEnabled, currentActor);
    setRefreshKey((k) => k + 1);
    toast(currentEnabled ? 'Policy disabled' : 'Policy enabled', {
      description: policyName,
      variant: currentEnabled ? 'warning' : 'success',
    });
  };

  const handleToggleWindow = (device: SmartRoomDevice) => {
    const nextWindow = !device.windowClosed;
    const nextOccupancy = nextWindow
      ? 'window_open_alert'
      : device.keycardInserted
      ? 'occupied'
      : 'unoccupied';
    const nextHvac = nextWindow ? 'eco_standby' : device.hvacMode;
    const nextStatus = nextWindow ? 'warning' : 'online';

    storageService.updateSmartRoomDevice(
      device.id,
      {
        windowClosed: nextWindow,
        occupancyState: nextOccupancy,
        hvacMode: nextHvac,
        status: nextStatus,
        powerDrawWatts: nextWindow ? 45 : 320,
      },
      currentActor
    );
    setRefreshKey((k) => k + 1);
    toast(nextWindow ? 'Window interlock triggered' : 'Window sealed', {
      description: `Room ${device.roomNumber} ${nextWindow ? 'placed into eco standby due to open window' : 'returned to normal telemetry'}.`,
      variant: nextWindow ? 'warning' : 'info',
    });
  };

  const tabs = [
    { id: 'smart_rooms' as const, label: 'Smart Suite IoT & Climate', count: devices.length, icon: Building },
    { id: 'submetering' as const, label: 'Electrical Submetering', count: submeters.length, icon: Gauge },
    { id: 'policies' as const, label: 'Automated EMS Policies', count: policies.length, icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Engineering', 'Energy & IoT', 'Energy Management System']}
        title="Energy Management & Smart Room IoT"
        subtitle="Real-time in-room VRF climate control, keycard & window interlock monitoring, zone submetering, and automated load-shaving policies."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{activeHotel?.name || 'Active Property'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{devices.length} Smart Rooms</span>
            <span aria-hidden="true">·</span>
            <span>{policies.filter((p) => p.enabled).length} Active Policies</span>
            <SampleDataBadge label="Sample data & Simulator" />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setRefreshKey((k) => k + 1);
                toast('Telemetry refreshed', { variant: 'info' });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#78837D]" />
              Refresh Telemetry
            </button>
            <button
              type="button"
              onClick={handleBulkSetback}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shadow-xs"
            >
              <Leaf className="w-3.5 h-3.5" />
              Engage Unoccupied Eco-Setback
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Hotel kW Demand"
          value={`${aggregateMetrics.currentKwDemand} kW`}
          deltaTone="forest"
          helper="Live metered facility load"
          icon={Gauge}
        />
        <KpiCard
          label="Daily Consumption"
          value={`${aggregateMetrics.dailyKwh.toLocaleString()} kWh`}
          deltaTone="neutral"
          helper="Across active submeter zones"
          icon={Zap}
        />
        <KpiCard
          label="Est. Policy Savings"
          value={formatCurrency(aggregateMetrics.totalSavingsEtb, currency, currencySymbol, { compact: true })}
          deltaTone="positive"
          helper="Monthly projected reduction"
          icon={TrendingDown}
        />
        <KpiCard
          label="Carbon Footprint"
          value={`${aggregateMetrics.monthlyCarbonKg.toLocaleString()} kg`}
          deltaTone="neutral"
          helper="Monthly CO₂e across meters"
          icon={Sun}
        />
        <KpiCard
          label="IoT Anomaly Alerts"
          value={aggregateMetrics.warningDevices}
          delta={aggregateMetrics.warningDevices > 0 ? 'Attention' : 'Nominal'}
          deltaTone={aggregateMetrics.warningDevices > 0 ? 'warning' : 'positive'}
          helper="Open windows or sensor alerts"
          icon={ShieldAlert}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#ECF1EE] font-semibold'
                  : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#F1F4F1] dark:bg-[#192622] text-[10px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SMART SUITE IOT & CLIMATE */}
      {activeTab === 'smart_rooms' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'occupied', 'unoccupied', 'window_open_alert'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setOccupancyFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    occupancyFilter === filter
                      ? 'bg-[#173F35] text-white font-semibold'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE] border border-[#E6EBE7] dark:border-[#22322C]'
                  }`}
                >
                  {filter === 'all'
                    ? 'All Rooms'
                    : filter === 'occupied'
                    ? 'Occupied'
                    : filter === 'unoccupied'
                    ? 'Unoccupied'
                    : 'Window Open Alert'}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search room # or device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>
          </div>

          {filteredDevices.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No smart room controllers match"
              description="Adjust your occupancy filter or search query to view connected room HVAC & sensor nodes."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((dev) => {
                const hasAlert = dev.status === 'warning' || !dev.windowClosed;
                return (
                  <div
                    key={dev.id}
                    className={`seam-surface p-4 space-y-3.5 ${
                      hasAlert ? 'border-amber-300 dark:border-amber-800/70' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold font-mono text-[#202B27] dark:text-[#ECF1EE]">
                          Room {dev.roomNumber}
                        </span>
                        <StatusBadge
                          label={
                            dev.occupancyState === 'window_open_alert'
                              ? 'Window Open'
                              : dev.occupancyState === 'occupied'
                              ? 'Occupied'
                              : 'Unoccupied'
                          }
                          tone={
                            dev.occupancyState === 'window_open_alert'
                              ? 'warning'
                              : dev.occupancyState === 'occupied'
                              ? 'success'
                              : 'neutral'
                          }
                        />
                      </div>
                      <span className="text-xs font-mono tabular-nums font-medium text-[#78837D] dark:text-[#92A199] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#647B52]" />
                        {dev.powerDrawWatts} W
                      </span>
                    </div>

                    <div className="text-xs text-[#78837D] dark:text-[#92A199] break-words">
                      {dev.deviceName}
                    </div>

                    <div className="seam-surface-subtle grid grid-cols-2 gap-2 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Key
                          className={`w-3.5 h-3.5 shrink-0 ${
                            dev.keycardInserted ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#78837D]'
                          }`}
                        />
                        <span className="text-[#202B27] dark:text-[#ECF1EE]">
                          {dev.keycardInserted ? 'Keycard Inserted' : 'Card Removed'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleWindow(dev)}
                        className="flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity"
                        title="Toggle window interlock sensor"
                      >
                        {dev.windowClosed ? (
                          <>
                            <DoorClosed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Window Sealed
                            </span>
                          </>
                        ) : (
                          <>
                            <DoorOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                              Window Open
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="seam-surface-subtle p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-medium uppercase text-[#78837D] dark:text-[#92A199] flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Current Temp
                        </span>
                        <div className="text-xl font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                          {dev.currentTemperatureC?.toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-medium uppercase text-[#78837D] dark:text-[#92A199]">
                          Target Setpoint
                        </span>
                        <div className="text-xl font-semibold font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B] mt-0.5">
                          {dev.targetTemperatureC?.toFixed(1)}°C
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#78837D] dark:text-[#92A199]">
                        <span>HVAC Mode</span>
                        <span className="font-mono uppercase font-semibold text-[#173F35] dark:text-[#C6A15B]">
                          {dev.hvacMode.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { mode: 'cool' as const, label: 'Cool', icon: Snowflake, watts: 340 },
                          { mode: 'heat' as const, label: 'Heat', icon: Flame, watts: 380 },
                          {
                            mode: 'eco_standby' as const,
                            label: 'Eco',
                            icon: Leaf,
                            watts: 35,
                            temp: 26.0,
                          },
                          { mode: 'off' as const, label: 'Off', icon: Power, watts: 5 },
                        ].map((btn) => {
                          const Icon = btn.icon;
                          const active = dev.hvacMode === btn.mode;
                          return (
                            <button
                              key={btn.mode}
                              type="button"
                              onClick={() =>
                                handleUpdateClimate(dev.id, {
                                  hvacMode: btn.mode,
                                  powerDrawWatts: btn.watts,
                                  ...(btn.temp !== undefined ? { targetTemperatureC: btn.temp } : {}),
                                })
                              }
                              className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border transition-colors ${
                                active
                                  ? 'bg-[#173F35] text-white border-[#173F35]'
                                  : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#E6EBE7] dark:border-[#22322C]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#78837D] dark:text-[#92A199]">Adjust Setpoint</span>
                        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {dev.targetTemperatureC}°C
                        </span>
                      </div>
                      <input
                        type="range"
                        min="18"
                        max="28"
                        step="0.5"
                        value={dev.targetTemperatureC || 22}
                        onChange={(e) =>
                          handleUpdateClimate(dev.id, { targetTemperatureC: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[#173F35] dark:accent-[#C6A15B] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#78837D] dark:text-[#92A199] mt-0.5">
                        <span>18°C Cool</span>
                        <span>23°C Comfort</span>
                        <span>28°C Eco</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMETERING */}
      {activeTab === 'submetering' && (
        <div className="space-y-4">
          {submeters.length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="No submeter zones configured"
              description="Electrical submeters will appear once property power zones are connected."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submeters.map((meter) => {
                const demandPercentage = Math.round(
                  (meter.currentKwDemand / Math.max(1, meter.demandThresholdKw)) * 100
                );
                const tone =
                  meter.status === 'optimal'
                    ? 'success'
                    : demandPercentage >= 95
                    ? 'critical'
                    : 'warning';

                return (
                  <div key={meter.id} className="seam-surface p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#647B52] dark:text-[#C6A15B]">
                          {meter.category.replace(/_/g, ' ')}
                        </span>
                        <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                          {meter.zoneName}
                        </h4>
                      </div>
                      <StatusBadge label={meter.status.replace(/_/g, ' ')} tone={tone} />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-[#78837D] dark:text-[#92A199]">Current Demand</span>
                        <div className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          <span className="text-base">{meter.currentKwDemand}</span>{' '}
                          <span className="text-[#78837D] font-normal">/ {meter.demandThresholdKw} kW</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#F1F4F1] dark:bg-[#192622] overflow-hidden mt-1.5">
                        <div
                          className={`h-full transition-all ${
                            demandPercentage > 90
                              ? 'bg-rose-600'
                              : demandPercentage > 75
                              ? 'bg-amber-500'
                              : 'bg-[#173F35] dark:bg-[#C6A15B]'
                          }`}
                          style={{ width: `${Math.min(demandPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-[#78837D] dark:text-[#92A199] mt-1">
                        <span>Load: {demandPercentage}%</span>
                        <span>Peak: {meter.peakDemandKw} kW</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
                      <div className="seam-surface-subtle p-2.5">
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">Daily Usage</div>
                        <div className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                          {meter.dailyKwhTotal.toLocaleString()} kWh
                        </div>
                      </div>
                      <div className="seam-surface-subtle p-2.5">
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">Monthly Total</div>
                        <div className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                          {meter.monthlyKwhTotal.toLocaleString()} kWh
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#78837D] dark:text-[#92A199]">
                      <span className="flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-[#647B52]" />
                        Carbon: {meter.carbonFootprintKgCo2} kg CO₂e
                      </span>
                      <span className="font-mono">{meter.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTOMATED EMS POLICIES */}
      {activeTab === 'policies' && (
        <div className="seam-surface p-5 space-y-4">
          <div className="pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
            <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              Automated Building Energy Policies
            </h3>
            <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
              Autonomous setback and peak-shaving rules balancing efficiency and guest comfort.
            </p>
          </div>

          {policies.length === 0 ? (
            <EmptyState
              icon={Sliders}
              title="No EMS policies configured"
              description="Automated HVAC and tariff-shaving policies will appear here once provisioned."
            />
          ) : (
            <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {policy.policyName}
                      </span>
                      <StatusBadge
                        label={policy.enabled ? 'Enabled' : 'Disabled'}
                        tone={policy.enabled ? 'success' : 'neutral'}
                      />
                    </div>
                    <div className="text-xs text-[#78837D] dark:text-[#92A199]">
                      <strong className="text-[#202B27] dark:text-[#ECF1EE]">Trigger:</strong>{' '}
                      {policy.triggerCondition}
                    </div>
                    <div className="text-xs text-[#78837D] dark:text-[#92A199]">
                      <strong className="text-[#173F35] dark:text-[#C6A15B]">Action:</strong>{' '}
                      {policy.actionSummary}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#78837D] dark:text-[#92A199] pt-1 font-mono tabular-nums">
                      <span>Executions today: {policy.activeExecutionsToday}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Est. savings: +{formatCurrency(policy.estimatedMonthlySavingsEtb, currency, currencySymbol)}/mo
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePolicy(policy.id, policy.policyName, policy.enabled)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 whitespace-nowrap ${
                      policy.enabled
                        ? 'border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50'
                        : 'bg-[#173F35] hover:bg-[#113028] text-white'
                    }`}
                  >
                    {policy.enabled ? 'Disable Policy' : 'Enable Policy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
