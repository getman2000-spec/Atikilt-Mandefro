import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Thermometer,
  Waves,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Award,
} from 'lucide-react';
import {
  Hotel,
  HaccpTemperatureRecord,
  PoolWaterQualityLog,
  HygieneAuditChecklist,
  HaccpLogType,
  PoolLocationType,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { formatShortDate } from '../../utils/formatters';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  Modal,
  SampleDataBadge,
} from '../ui';

interface HaccpAndWaterSafetyHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const HaccpAndWaterSafetyHub: React.FC<HaccpAndWaterSafetyHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';

  const [activeTab, setActiveTab] = useState<'haccp_temps' | 'pool_water' | 'hygiene_audits'>('haccp_temps');
  const [outletFilter, setOutletFilter] = useState<string>('all');
  const [haccpStatusFilter, setHaccpStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal States
  const [showLogTempModal, setShowLogTempModal] = useState(false);
  const [showLogPoolModal, setShowLogPoolModal] = useState(false);

  const outlets = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return storageService.getOutlets(hotelId);
  }, [hotelId, refreshKey]);

  // Form State: New HACCP Log
  const [newHaccpData, setNewHaccpData] = useState({
    outletId: '',
    logType: 'walk_in_chiller' as HaccpLogType,
    unitName: '',
    temperatureC: 2.5,
    targetMinC: 0.0,
    targetMaxC: 4.0,
    correctiveActionTaken: '',
  });

  // Form State: New Pool Water Log
  const [newPoolData, setNewPoolData] = useState({
    poolLocation: 'infinity_main_pool' as PoolLocationType,
    waterTemperatureC: 28.0,
    phLevel: 7.4,
    freeChlorinePpm: 2.0,
    totalAlkalinityPpm: 100,
    turbidityNtu: 0.2,
    chemicalDosageNotes: '',
  });

  // Reset on property change
  useEffect(() => {
    setOutletFilter('all');
    setHaccpStatusFilter('all');
    setSearchQuery('');
    setShowLogTempModal(false);
    setShowLogPoolModal(false);
    setNewHaccpData((prev) => ({
      ...prev,
      outletId: outlets[0]?.id || 'out_main_dining',
    }));
  }, [hotelId, outlets]);

  // Actor
  const currentActor = useMemo(
    () => ({
      email: currentUser?.email || 'hygiene@seamhotel.com',
      fullName: currentUser?.fullName || 'Hygiene Officer',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  // Data
  const haccpLogs: HaccpTemperatureRecord[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return storageService.getHaccpLogs(hotelId);
  }, [hotelId, refreshKey]);

  const poolLogs: PoolWaterQualityLog[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return storageService.getPoolWaterLogs(hotelId);
  }, [hotelId, refreshKey]);

  const hygieneAudits: HygieneAuditChecklist[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return storageService.getHygieneAudits(hotelId);
  }, [hotelId, refreshKey]);

  // Unique outlets represented across configured outlets and logged CCP entries
  const outletOptions = useMemo(() => {
    const map = new Map<string, string>();
    outlets.forEach((o) => map.set(o.id, o.name));
    haccpLogs.forEach((l) => {
      if (l.outletId && !map.has(l.outletId)) {
        map.set(
          l.outletId,
          l.outletId === 'out_main_dining'
            ? 'Main Dining Kitchen'
            : l.outletId === 'out_banquets'
            ? 'Banquet Kitchen'
            : l.outletId.replace(/^out_/, '').replace(/_/g, ' ')
        );
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [outlets, haccpLogs]);

  // Filtered HACCP logs
  const filteredHaccpLogs = useMemo(() => {
    return haccpLogs.filter((log) => {
      if (outletFilter !== 'all' && log.outletId !== outletFilter) return false;
      if (haccpStatusFilter !== 'all' && log.status !== haccpStatusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!log.unitName.toLowerCase().includes(query) && !log.loggedBy.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [haccpLogs, outletFilter, haccpStatusFilter, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalHaccp = haccpLogs.length;
    const compliantHaccp = haccpLogs.filter((l) => l.status === 'compliant').length;
    const breachHaccp = haccpLogs.filter((l) => l.status === 'critical_breach').length;
    const passRate = totalHaccp > 0 ? Math.round((compliantHaccp / totalHaccp) * 100) : 100;

    const safePoolsCount = poolLogs.filter((p) => p.status === 'safe_for_swimming').length;
    const avgAuditScore =
      hygieneAudits.length > 0
        ? Math.round(hygieneAudits.reduce((sum, a) => sum + a.overallScore, 0) / hygieneAudits.length)
        : 0;

    return {
      passRate,
      breachHaccp,
      safePoolsCount,
      totalPools: poolLogs.length,
      avgAuditScore,
    };
  }, [haccpLogs, poolLogs, hygieneAudits]);

  // Handle Log Temp Presets
  const handleLogTypePreset = (type: HaccpLogType) => {
    switch (type) {
      case 'walk_in_chiller':
        setNewHaccpData((prev) => ({
          ...prev,
          logType: type,
          unitName: prev.unitName || 'Dairy & Vegetable Chiller #2',
          temperatureC: 2.8,
          targetMinC: 0.0,
          targetMaxC: 4.0,
        }));
        break;
      case 'walk_in_freezer':
        setNewHaccpData((prev) => ({
          ...prev,
          logType: type,
          unitName: prev.unitName || 'Central Bakery Deep Freezer',
          temperatureC: -20.0,
          targetMinC: -22.0,
          targetMaxC: -18.0,
        }));
        break;
      case 'hot_holding_buffet':
        setNewHaccpData((prev) => ({
          ...prev,
          logType: type,
          unitName: prev.unitName || 'Lunch Carvery Hot Holding Unit',
          temperatureC: 68.0,
          targetMinC: 63.0,
          targetMaxC: 85.0,
        }));
        break;
      case 'food_core_cooking':
        setNewHaccpData((prev) => ({
          ...prev,
          logType: type,
          unitName: prev.unitName || 'Hot Kitchen Core Probe',
          temperatureC: 76.0,
          targetMinC: 74.0,
          targetMaxC: 90.0,
        }));
        break;
      case 'dishwasher_sanitizing':
        setNewHaccpData((prev) => ({
          ...prev,
          logType: type,
          unitName: prev.unitName || 'Main Kitchen Pass-Through Dishwasher Rinse',
          temperatureC: 85.0,
          targetMinC: 82.0,
          targetMaxC: 90.0,
        }));
        break;
    }
  };

  const handleSubmitHaccp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newHaccpData.unitName.trim()) return;

    const record = storageService.recordHaccpLog(
      {
        hotelId,
        outletId: newHaccpData.outletId || outlets[0]?.id || 'out_main_dining',
        logType: newHaccpData.logType,
        unitName: newHaccpData.unitName,
        temperatureC: Number(newHaccpData.temperatureC),
        targetMinC: Number(newHaccpData.targetMinC),
        targetMaxC: Number(newHaccpData.targetMaxC),
        loggedBy: currentActor.fullName,
        correctiveActionTaken: newHaccpData.correctiveActionTaken || undefined,
      },
      currentActor
    );

    setShowLogTempModal(false);
    setNewHaccpData({
      outletId: outlets[0]?.id || 'out_main_dining',
      logType: 'walk_in_chiller',
      unitName: '',
      temperatureC: 2.5,
      targetMinC: 0.0,
      targetMaxC: 4.0,
      correctiveActionTaken: '',
    });
    setRefreshKey((k) => k + 1);
    toast('CCP temperature recorded', {
      description: `${record.unitName}: ${record.temperatureC}°C (${record.status.replace(/_/g, ' ')}).`,
      variant: record.status === 'critical_breach' ? 'warning' : 'success',
    });
  };

  const handleSubmitPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;

    const log = storageService.recordPoolWaterLog(
      {
        hotelId,
        poolLocation: newPoolData.poolLocation,
        waterTemperatureC: Number(newPoolData.waterTemperatureC),
        phLevel: Number(newPoolData.phLevel),
        freeChlorinePpm: Number(newPoolData.freeChlorinePpm),
        totalAlkalinityPpm: Number(newPoolData.totalAlkalinityPpm),
        turbidityNtu: Number(newPoolData.turbidityNtu),
        testedBy: currentActor.fullName,
        chemicalDosageNotes: newPoolData.chemicalDosageNotes || undefined,
      },
      currentActor
    );

    setShowLogPoolModal(false);
    setNewPoolData({
      poolLocation: 'infinity_main_pool',
      waterTemperatureC: 28.0,
      phLevel: 7.4,
      freeChlorinePpm: 2.0,
      totalAlkalinityPpm: 100,
      turbidityNtu: 0.2,
      chemicalDosageNotes: '',
    });
    setRefreshKey((k) => k + 1);
    toast('Pool water test logged', {
      description: `${log.poolLocation.replace(/_/g, ' ')} — pH ${log.phLevel.toFixed(2)}, ${log.freeChlorinePpm} ppm Cl.`,
      variant: log.status === 'safe_for_swimming' ? 'success' : 'warning',
    });
  };

  const tabs = [
    { id: 'haccp_temps' as const, label: 'CCP Temperature Logs', count: haccpLogs.length, icon: Thermometer },
    { id: 'pool_water' as const, label: 'Pool & Spa Water', count: poolLogs.length, icon: Waves },
    { id: 'hygiene_audits' as const, label: 'Hygiene Audits', count: hygieneAudits.length, icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Safety & Pool Water Quality"
        subtitle="ISO 22000 critical control point (CCP) cold and hot holding logs, automated breach tracking, aquatic chemical safety, and hygiene audit certifications."
        breadcrumbs={['Operations', 'Food Safety & Pool']}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {activeHotel && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#647B52]" />
                {activeHotel.name} • ISO 22000 &amp; HACCP Compliance
              </span>
            )}
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                handleLogTypePreset('walk_in_chiller');
                setShowLogTempModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Log CCP Temp
            </button>
            <button
              type="button"
              onClick={() => setShowLogPoolModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
            >
              <Waves className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
              Test Pool Chemistry
            </button>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE] transition-colors"
              aria-label="Refresh compliance records"
              title="Refresh Compliance Records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="HACCP Pass Rate"
          value={`${summaryMetrics.passRate}%`}
          helper={`${haccpLogs.length} CCP checks logged`}
          delta={summaryMetrics.passRate >= 95 ? 'Compliant' : 'Review needed'}
          deltaTone={summaryMetrics.passRate >= 95 ? 'positive' : 'warning'}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Critical Breaches"
          value={summaryMetrics.breachHaccp}
          helper={summaryMetrics.breachHaccp > 0 ? 'Remedial action documented' : 'Zero active breaches'}
          deltaTone={summaryMetrics.breachHaccp > 0 ? 'critical' : 'positive'}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Pool Safety Rating"
          value={`${summaryMetrics.safePoolsCount} / ${summaryMetrics.totalPools}`}
          helper="Target pH 7.2 – 7.6"
          delta="Safe for bathers"
          deltaTone="forest"
          icon={Waves}
        />
        <KpiCard
          label="Hygiene Audit Score"
          value={hygieneAudits.length > 0 ? `${summaryMetrics.avgAuditScore}%` : '—'}
          helper={`${hygieneAudits.length} certified inspections`}
          delta={summaryMetrics.avgAuditScore >= 90 ? 'Grade A' : undefined}
          deltaTone="positive"
          icon={Award}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E6EBE7] dark:border-[#22322C] pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#173F35] text-white dark:bg-[#246353]'
                  : 'text-[#78837D] dark:text-[#92A199] hover:bg-[#F1F4F1] dark:hover:bg-[#192622] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HACCP TEMPERATURE LOGS */}
      {activeTab === 'haccp_temps' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Kitchen Outlets</option>
                {outletOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>

              <select
                value={haccpStatusFilter}
                onChange={(e) => setHaccpStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Statuses</option>
                <option value="compliant">Compliant Only</option>
                <option value="warning">Warning Only</option>
                <option value="critical_breach">Critical Breaches</option>
              </select>
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search unit or chef..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>
          </div>

          {filteredHaccpLogs.length === 0 ? (
            <EmptyState
              icon={Thermometer}
              title="No CCP temperature logs match filters"
              description="Log a cold-chain or hot-holding probe temperature reading to track ISO 22000 compliance."
              action={
                <button
                  type="button"
                  onClick={() => {
                    handleLogTypePreset('walk_in_chiller');
                    setShowLogTempModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log CCP Temperature
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHaccpLogs.map((log) => (
                <div
                  key={log.id}
                  className={`seam-surface p-4 space-y-3 ${
                    log.status === 'critical_breach'
                      ? 'border-rose-300 dark:border-rose-800/70'
                      : log.status === 'warning'
                      ? 'border-amber-300 dark:border-amber-800/70'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#647B52] dark:text-[#C6A15B]">
                        {log.logType.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5 truncate">
                        {log.unitName}
                      </h4>
                    </div>

                    <StatusBadge
                      label={log.status.replace(/_/g, ' ')}
                      tone={
                        log.status === 'compliant'
                          ? 'success'
                          : log.status === 'warning'
                          ? 'warning'
                          : 'critical'
                      }
                    />
                  </div>

                  <div className="seam-surface-subtle p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-medium text-[#78837D] dark:text-[#92A199]">
                        Actual Temperature
                      </span>
                      <div
                        className={`text-xl font-mono font-semibold tabular-nums mt-0.5 ${
                          log.status === 'critical_breach'
                            ? 'text-rose-600 dark:text-rose-400'
                            : log.status === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {log.temperatureC > 0 ? `+${log.temperatureC}` : log.temperatureC}°C
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-medium text-[#78837D] dark:text-[#92A199]">
                        Safe Range
                      </span>
                      <div className="text-xs font-mono font-medium text-[#202B27] dark:text-[#ECF1EE] tabular-nums mt-1">
                        {log.targetMinC}°C to {log.targetMaxC}°C
                      </div>
                    </div>
                  </div>

                  {log.correctiveActionTaken && (
                    <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs">
                      <div className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400 text-[11px] mb-0.5">
                        <AlertTriangle className="w-3 h-3" /> Corrective Action Recorded
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#202B27] dark:text-[#ECF1EE]">
                        {log.correctiveActionTaken}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#78837D] dark:text-[#92A199] pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
                    <span>
                      Logged by <strong className="text-[#202B27] dark:text-[#ECF1EE]">{log.loggedBy}</strong>
                    </span>
                    <span className="font-mono tabular-nums">
                      {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POOL & SPA WATER CHEMISTRY */}
      {activeTab === 'pool_water' && (
        <div className="space-y-4">
          {poolLogs.length === 0 ? (
            <EmptyState
              icon={Waves}
              title="No pool water chemistry tests recorded"
              description="Record pH, free chlorine, turbidity, and water temperature readings for resort pools and spa basins."
              action={
                <button
                  type="button"
                  onClick={() => setShowLogPoolModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Waves className="w-3.5 h-3.5" />
                  Test Pool Chemistry
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poolLogs.map((pool) => (
                <div
                  key={pool.id}
                  className={`seam-surface p-5 space-y-4 ${
                    pool.status === 'safe_for_swimming'
                      ? ''
                      : pool.status === 'chemical_adjustment_needed'
                      ? 'border-amber-300 dark:border-amber-800/70'
                      : 'border-rose-300 dark:border-rose-800/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                        <Waves className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] capitalize">
                          {pool.poolLocation.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                          Tested {new Date(pool.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by{' '}
                          {pool.testedBy}
                        </span>
                      </div>
                    </div>

                    <StatusBadge
                      label={pool.status.replace(/_/g, ' ')}
                      tone={
                        pool.status === 'safe_for_swimming'
                          ? 'success'
                          : pool.status === 'chemical_adjustment_needed'
                          ? 'warning'
                          : 'critical'
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="seam-surface-subtle p-2.5">
                      <span className="text-[10px] font-medium text-[#78837D] dark:text-[#92A199]">pH Level</span>
                      <div
                        className={`text-base font-mono font-semibold tabular-nums mt-0.5 ${
                          pool.phLevel >= 7.2 && pool.phLevel <= 7.6
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {pool.phLevel.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">7.2 – 7.6</span>
                    </div>

                    <div className="seam-surface-subtle p-2.5">
                      <span className="text-[10px] font-medium text-[#78837D] dark:text-[#92A199]">Free Chlorine</span>
                      <div
                        className={`text-base font-mono font-semibold tabular-nums mt-0.5 ${
                          pool.freeChlorinePpm >= 1.0 && pool.freeChlorinePpm <= 3.0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {pool.freeChlorinePpm} ppm
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">1.0 – 3.0 ppm</span>
                    </div>

                    <div className="seam-surface-subtle p-2.5">
                      <span className="text-[10px] font-medium text-[#78837D] dark:text-[#92A199]">Turbidity</span>
                      <div
                        className={`text-base font-mono font-semibold tabular-nums mt-0.5 ${
                          pool.turbidityNtu <= 0.5
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {pool.turbidityNtu} NTU
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">&lt; 0.5 NTU</span>
                    </div>

                    <div className="seam-surface-subtle p-2.5">
                      <span className="text-[10px] font-medium text-[#78837D] dark:text-[#92A199]">Water Temp</span>
                      <div className="text-base font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums mt-0.5">
                        {pool.waterTemperatureC}°C
                      </div>
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199]">Comfort</span>
                    </div>
                  </div>

                  {pool.chemicalDosageNotes && (
                    <div className="seam-surface-subtle p-2.5 text-xs text-[#202B27] dark:text-[#ECF1EE]">
                      <span className="font-semibold text-[#173F35] dark:text-[#C6A15B]">Dosing Notes: </span>
                      {pool.chemicalDosageNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HYGIENE AUDITS */}
      {activeTab === 'hygiene_audits' && (
        <div className="seam-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              Kitchen &amp; Outlets Hygiene Audit Certifications
            </h3>
            <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
              Certified health inspection scores conducted under ISO 22000 and Codex Alimentarius standards.
            </p>
          </div>

          {hygieneAudits.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No hygiene audits recorded"
              description="Certified inspection records will appear here once health audits are conducted for this property."
            />
          ) : (
            <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
              {hygieneAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {audit.area}
                      </span>
                      <StatusBadge
                        label={audit.status.replace(/_/g, ' ')}
                        tone={audit.status === 'passed' ? 'success' : 'warning'}
                      />
                    </div>

                    <p className="text-xs text-[#78837D] dark:text-[#92A199] leading-relaxed">
                      {audit.findings}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#78837D] dark:text-[#92A199]">
                      <span>
                        Auditor: <strong className="text-[#202B27] dark:text-[#ECF1EE]">{audit.auditorName}</strong>
                      </span>
                      <span>
                        Date: <strong className="font-mono text-[#202B27] dark:text-[#ECF1EE]">{formatShortDate(audit.auditDate)}</strong>
                      </span>
                      <span>
                        Critical Non-Conformances:{' '}
                        <strong
                          className={`font-mono ${
                            audit.criticalNonConformances > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {audit.criticalNonConformances}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 md:text-right">
                    <div className="text-2xl font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
                      {audit.overallScore}%
                    </div>
                    <span className="text-[10px] uppercase font-medium text-[#78837D] dark:text-[#92A199]">
                      Hygiene Score
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: LOG CCP TEMPERATURE */}
      <Modal
        open={showLogTempModal}
        onClose={() => setShowLogTempModal(false)}
        title="Log Critical Control Point (CCP) Temperature"
        subtitle="Verify cold-chain or hot-holding compliance against legal safe thresholds."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitHaccp} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1.5">
              Quick Equipment Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { type: 'walk_in_chiller' as const, label: 'Chiller (0–4°C)' },
                { type: 'walk_in_freezer' as const, label: 'Deep Freezer (-18°C)' },
                { type: 'hot_holding_buffet' as const, label: 'Hot Holding (>63°C)' },
                { type: 'dishwasher_sanitizing' as const, label: 'Dishwasher Rinse (82°C+)' },
              ].map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleLogTypePreset(preset.type)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                    newHaccpData.logType === preset.type
                      ? 'bg-[#173F35] text-white border-[#173F35] dark:bg-[#246353] dark:border-[#246353]'
                      : 'border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Kitchen / Outlet
              </label>
              <select
                value={newHaccpData.outletId}
                onChange={(e) => setNewHaccpData({ ...newHaccpData, outletId: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                {outletOptions.length === 0 && <option value="out_main_dining">Main Dining Kitchen</option>}
                {outletOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Unit / Station Name *
              </label>
              <input
                type="text"
                required
                value={newHaccpData.unitName}
                onChange={(e) => setNewHaccpData({ ...newHaccpData, unitName: e.target.value })}
                placeholder="e.g. Walk-in Meat Chiller #1"
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Actual Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newHaccpData.temperatureC}
                onChange={(e) => setNewHaccpData({ ...newHaccpData, temperatureC: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Min Target (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newHaccpData.targetMinC}
                onChange={(e) => setNewHaccpData({ ...newHaccpData, targetMinC: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Max Target (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newHaccpData.targetMaxC}
                onChange={(e) => setNewHaccpData({ ...newHaccpData, targetMaxC: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Corrective Action (Required if outside safe limits)
            </label>
            <textarea
              rows={2}
              value={newHaccpData.correctiveActionTaken}
              onChange={(e) => setNewHaccpData({ ...newHaccpData, correctiveActionTaken: e.target.value })}
              placeholder="e.g. Thermostat adjusted, gasket seal inspected..."
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowLogTempModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Save Temperature Log
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TEST POOL CHEMISTRY */}
      <Modal
        open={showLogPoolModal}
        onClose={() => setShowLogPoolModal(false)}
        title="Record Pool & Spa Water Chemistry"
        subtitle="Log aquatic pH, free chlorine, turbidity, and temperature telemetry."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitPool} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Pool Location</label>
            <select
              value={newPoolData.poolLocation}
              onChange={(e) => setNewPoolData({ ...newPoolData, poolLocation: e.target.value as PoolLocationType })}
              className="w-full px-3 py-2 text-xs seam-input"
            >
              <option value="infinity_main_pool">Infinity Main Pool (Resort Deck)</option>
              <option value="villa_private_plunge">Villa Private Plunge Pool</option>
              <option value="kids_splash_pool">Kids Splash Pool</option>
              <option value="spa_hydrotherapy_pool">Spa Hydrotherapy Vitality Pool</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                pH Level (7.2 – 7.6)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newPoolData.phLevel}
                onChange={(e) => setNewPoolData({ ...newPoolData, phLevel: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Free Chlorine (ppm)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={newPoolData.freeChlorinePpm}
                onChange={(e) => setNewPoolData({ ...newPoolData, freeChlorinePpm: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Turbidity (&lt; 0.5 NTU)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newPoolData.turbidityNtu}
                onChange={(e) => setNewPoolData({ ...newPoolData, turbidityNtu: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Water Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={newPoolData.waterTemperatureC}
                onChange={(e) => setNewPoolData({ ...newPoolData, waterTemperatureC: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Chemical Dosage Notes
            </label>
            <textarea
              rows={2}
              value={newPoolData.chemicalDosageNotes}
              onChange={(e) => setNewPoolData({ ...newPoolData, chemicalDosageNotes: e.target.value })}
              placeholder="e.g. Added sodium hypochlorite, adjusted acid dosing..."
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowLogPoolModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Record Water Test
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
