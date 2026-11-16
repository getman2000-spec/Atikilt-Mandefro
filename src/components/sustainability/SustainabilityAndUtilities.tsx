import React, { useState, useMemo, useEffect } from 'react';
import {
  Leaf,
  Zap,
  Droplets,
  Flame,
  Sun,
  Scale,
  Award,
  Search,
  RotateCcw,
  Sparkles,
  DollarSign,
  Check,
} from 'lucide-react';
import {
  Hotel,
  UtilityConsumptionLog,
  UtilitySource,
  FoodWasteLog,
  WasteCategory,
  WasteDestination,
  EcoGuestOptIn,
  SustainabilityAuditItem,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  Modal,
  DataTable,
  DataTableColumn,
  SampleDataBadge,
} from '../ui';

interface SustainabilityAndUtilitiesProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const SustainabilityAndUtilities: React.FC<SustainabilityAndUtilitiesProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'sustainability@seam.com',
      fullName: currentUser?.fullName || 'Eco & Energy Manager',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const [activeTab, setActiveTab] = useState<'utilities' | 'food_waste' | 'eco_opt_in' | 'audits'>('utilities');

  // Filters
  const [utilityTypeFilter, setUtilityTypeFilter] = useState<string>('all');
  const [mealSessionFilter, setMealSessionFilter] = useState<string>('all');
  const [auditStandardFilter, setAuditStandardFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Refresh
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const reloadData = () => setRefreshKey((prev) => prev + 1);

  // Modals state
  const [showUtilityModal, setShowUtilityModal] = useState<boolean>(false);
  const [showWasteModal, setShowWasteModal] = useState<boolean>(false);
  const [showOptInModal, setShowOptInModal] = useState<boolean>(false);
  const [selectedAuditItem, setSelectedAuditItem] = useState<SustainabilityAuditItem | null>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Modal form states
  const [newUtility, setNewUtility] = useState<{
    logDate: string;
    utilityType: 'electricity' | 'water' | 'generator_diesel' | 'solar_generation';
    source: UtilitySource;
    meterReadingStart: number;
    meterReadingEnd: number;
    consumptionUnits: number;
    unitOfMeasure: 'kWh' | 'm3' | 'litre';
    unitCost: number;
    occupiedRoomsCount: number;
    notes: string;
  }>({
    logDate: new Date().toISOString().slice(0, 10),
    utilityType: 'electricity',
    source: 'grid_power',
    meterReadingStart: 104680,
    meterReadingEnd: 105160,
    consumptionUnits: 480,
    unitOfMeasure: 'kWh',
    unitCost: 4.8,
    occupiedRoomsCount: 48,
    notes: '',
  });

  const [newWaste, setNewWaste] = useState<{
    logDate: string;
    mealSession: 'breakfast' | 'lunch' | 'dinner' | 'banquet_event';
    kitchenOutletName: string;
    category: WasteCategory;
    weightKg: number;
    estimatedCostValue: number;
    destination: WasteDestination;
    chefSupervisor: string;
    actionTakenNotes: string;
  }>({
    logDate: new Date().toISOString().slice(0, 10),
    mealSession: 'lunch',
    kitchenOutletName: 'Main Dining Kitchen',
    category: 'prep_trimming',
    weightKg: 12.5,
    estimatedCostValue: 600,
    destination: 'composting_garden',
    chefSupervisor: actor.fullName,
    actionTakenNotes: 'Composted in organic herb garden',
  });

  const [newOptIn, setNewOptIn] = useState<{
    roomNumber: string;
    guestName: string;
    stayStartDate: string;
    stayEndDate: string;
    linenReuseFrequencyDays: number;
    towelReuseAgreed: boolean;
  }>({
    roomNumber: '104',
    guestName: '',
    stayStartDate: new Date().toISOString().slice(0, 10),
    stayEndDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    linenReuseFrequencyDays: 2,
    towelReuseAgreed: true,
  });

  const [auditScoreData, setAuditScoreData] = useState<{
    scorePercent: number;
    complianceStatus: 'compliant' | 'in_progress' | 'non_compliant';
    evidenceNotes: string;
  }>({
    scorePercent: 90,
    complianceStatus: 'compliant',
    evidenceNotes: '',
  });

  // Reset state cleanly on property switch
  useEffect(() => {
    setUtilityTypeFilter('all');
    setMealSessionFilter('all');
    setAuditStandardFilter('all');
    setSearchTerm('');
    setShowUtilityModal(false);
    setShowWasteModal(false);
    setShowOptInModal(false);
    setShowAuditModal(false);
    setSelectedAuditItem(null);
  }, [hotelId]);

  // Data
  const utilityLogs: UtilityConsumptionLog[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getUtilityLogs(hotelId);
  }, [hotelId, refreshKey]);

  const foodWasteLogs: FoodWasteLog[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getFoodWasteLogs(hotelId);
  }, [hotelId, refreshKey]);

  const ecoOptIns: EcoGuestOptIn[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getEcoOptIns(hotelId);
  }, [hotelId, refreshKey]);

  const auditItems: SustainabilityAuditItem[] = useMemo(() => {
    void refreshKey;
    if (!hotelId) return [];
    return saasStorage.getSustainabilityAudits(hotelId);
  }, [hotelId, refreshKey]);

  // KPIs
  const totalSolarGeneratedKwh = useMemo(() => {
    return utilityLogs
      .filter((u) => u.source === 'solar_photovoltaic')
      .reduce((sum, u) => sum + u.consumptionUnits, 0);
  }, [utilityLogs]);

  const averageCpor = useMemo(() => {
    const costLogs = utilityLogs.filter((u) => u.totalCost > 0);
    if (costLogs.length === 0) return 0;
    const totalCost = costLogs.reduce((sum, u) => sum + u.totalCost, 0);
    const rooms = costLogs[0]?.occupiedRoomsCount || 48;
    return Math.round((totalCost / rooms) * 10) / 10;
  }, [utilityLogs]);

  const totalFoodWasteDivertedKg = useMemo(() => {
    return foodWasteLogs
      .filter((w) => w.destination !== 'landfill')
      .reduce((sum, w) => sum + w.weightKg, 0);
  }, [foodWasteLogs]);

  const totalWaterSavedLitres = useMemo(() => {
    return ecoOptIns.reduce((sum, o) => sum + o.waterSavedEstLitres, 0);
  }, [ecoOptIns]);

  // Filtered
  const filteredUtilities = useMemo(
    () =>
      utilityLogs.filter((u) => {
        const matchesType = utilityTypeFilter === 'all' || u.utilityType === utilityTypeFilter;
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          u.source.toLowerCase().includes(q) ||
          u.loggedBy.toLowerCase().includes(q) ||
          (u.notes && u.notes.toLowerCase().includes(q));
        return matchesType && matchesSearch;
      }),
    [utilityLogs, utilityTypeFilter, searchTerm]
  );

  const filteredWaste = useMemo(
    () =>
      foodWasteLogs.filter((w) => {
        const matchesMeal = mealSessionFilter === 'all' || w.mealSession === mealSessionFilter;
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          w.kitchenOutletName.toLowerCase().includes(q) ||
          w.category.toLowerCase().includes(q) ||
          w.chefSupervisor.toLowerCase().includes(q);
        return matchesMeal && matchesSearch;
      }),
    [foodWasteLogs, mealSessionFilter, searchTerm]
  );

  const filteredAudits = useMemo(
    () =>
      auditItems.filter((a) => {
        const matchesStd = auditStandardFilter === 'all' || a.auditStandard === auditStandardFilter;
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          a.criterion.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.targetMetric.toLowerCase().includes(q);
        return matchesStd && matchesSearch;
      }),
    [auditItems, auditStandardFilter, searchTerm]
  );

  // Handlers
  const handleSaveUtility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    const units = Number(newUtility.consumptionUnits);
    const unitCost = Number(newUtility.unitCost);
    const totalCost = Math.round(units * unitCost);
    const rooms = Number(newUtility.occupiedRoomsCount) || 1;
    const cpor = Math.round((totalCost / rooms) * 10) / 10;

    saasStorage.createUtilityLog(
      {
        hotelId,
        logDate: newUtility.logDate,
        utilityType: newUtility.utilityType,
        source: newUtility.source,
        meterReadingStart: Number(newUtility.meterReadingStart),
        meterReadingEnd: Number(newUtility.meterReadingEnd),
        consumptionUnits: units,
        unitOfMeasure: newUtility.unitOfMeasure,
        unitCost,
        totalCost,
        currency,
        occupiedRoomsCount: rooms,
        costPerOccupiedRoom: cpor,
        loggedBy: actor.fullName,
        notes: newUtility.notes,
      },
      actor
    );

    setShowUtilityModal(false);
    reloadData();
    toast('Utility reading logged', {
      description: `${units.toLocaleString()} ${newUtility.unitOfMeasure} recorded for ${newUtility.logDate}.`,
      variant: 'success',
    });
  };

  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    saasStorage.createFoodWasteLog(
      {
        hotelId,
        logDate: newWaste.logDate,
        mealSession: newWaste.mealSession,
        kitchenOutletName: newWaste.kitchenOutletName,
        category: newWaste.category,
        weightKg: Number(newWaste.weightKg),
        estimatedCostValue: Number(newWaste.estimatedCostValue),
        currency,
        destination: newWaste.destination,
        chefSupervisor: newWaste.chefSupervisor,
        actionTakenNotes: newWaste.actionTakenNotes,
      },
      actor
    );

    setShowWasteModal(false);
    reloadData();
    toast('Food waste record saved', {
      description: `${newWaste.weightKg} kg logged under ${newWaste.destination.replace(/_/g, ' ')}.`,
      variant: 'success',
    });
  };

  const handleSaveOptIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newOptIn.guestName.trim() || !newOptIn.roomNumber.trim()) return;

    saasStorage.registerEcoOptIn(
      {
        hotelId,
        roomId: `rm_${newOptIn.roomNumber}`,
        roomNumber: newOptIn.roomNumber,
        guestName: newOptIn.guestName,
        stayStartDate: newOptIn.stayStartDate,
        stayEndDate: newOptIn.stayEndDate,
        linenReuseFrequencyDays: Number(newOptIn.linenReuseFrequencyDays),
        towelReuseAgreed: newOptIn.towelReuseAgreed,
        waterSavedEstLitres: 90,
        powerSavedEstKwh: 12,
        loyaltyEcoPointsAwarded: 200,
      },
      actor
    );

    setShowOptInModal(false);
    setNewOptIn({
      roomNumber: '104',
      guestName: '',
      stayStartDate: new Date().toISOString().slice(0, 10),
      stayEndDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      linenReuseFrequencyDays: 2,
      towelReuseAgreed: true,
    });
    reloadData();
    toast('Guest enrolled in Green Stay', {
      description: `Room ${newOptIn.roomNumber} enrolled (+200 eco loyalty points).`,
      variant: 'success',
    });
  };

  const handleUpdateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditItem) return;

    const updated: SustainabilityAuditItem = {
      ...selectedAuditItem,
      currentScorePercent: Number(auditScoreData.scorePercent),
      complianceStatus: auditScoreData.complianceStatus,
      evidenceNotes: auditScoreData.evidenceNotes,
      verifiedBy: actor.fullName,
      lastAuditedDate: new Date().toISOString().slice(0, 10),
    };

    saasStorage.updateSustainabilityAudit(updated, actor);
    setShowAuditModal(false);
    setSelectedAuditItem(null);
    reloadData();
    toast('Audit verification updated', {
      description: `${updated.criterion} scored at ${updated.currentScorePercent}%.`,
      variant: 'success',
    });
  };

  const handleExportUtilitiesCsv = () => {
    downloadCsvFile(
      `utility-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date', 'Type', 'Source', 'Start Reading', 'End Reading', 'Units', 'Unit', 'Total Cost', 'CPOR', 'Logged By', 'Notes'],
      filteredUtilities.map((u) => [
        u.logDate,
        u.utilityType,
        u.source,
        u.meterReadingStart,
        u.meterReadingEnd,
        u.consumptionUnits,
        u.unitOfMeasure,
        u.totalCost,
        u.costPerOccupiedRoom,
        u.loggedBy,
        u.notes || '',
      ])
    );
    toast('Utility logs exported', { variant: 'info' });
  };

  const handleExportOptInsCsv = () => {
    downloadCsvFile(
      `green-stay-opt-ins-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Room', 'Guest', 'Check-in', 'Check-out', 'Linen Days', 'Towel Reuse', 'Water Saved (L)', 'Power Saved (kWh)', 'Eco Points'],
      ecoOptIns.map((o) => [
        o.roomNumber,
        o.guestName,
        o.stayStartDate,
        o.stayEndDate,
        o.linenReuseFrequencyDays,
        o.towelReuseAgreed ? 'Yes' : 'No',
        o.waterSavedEstLitres,
        o.powerSavedEstKwh,
        o.loyaltyEcoPointsAwarded,
      ])
    );
    toast('Green Stay roster exported', { variant: 'info' });
  };

  const utilityColumns: DataTableColumn<UtilityConsumptionLog>[] = [
    {
      key: 'logDate',
      header: 'Log Date',
      sortable: true,
      sortValue: (u) => u.logDate,
      render: (u) => <span className="font-mono font-medium tabular-nums">{u.logDate}</span>,
    },
    {
      key: 'utilityType',
      header: 'Utility & Source',
      sortable: true,
      sortValue: (u) => u.utilityType,
      render: (u) => {
        const isSolar = u.source === 'solar_photovoltaic';
        const Icon = isSolar
          ? Sun
          : u.utilityType === 'electricity'
          ? Zap
          : u.utilityType === 'generator_diesel'
          ? Flame
          : Droplets;
        return (
          <div className="flex items-start gap-2">
            <Icon
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isSolar
                  ? 'text-[#C6A15B]'
                  : u.utilityType === 'generator_diesel'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-[#173F35] dark:text-[#7B9666]'
              }`}
            />
            <div>
              <div className="font-medium capitalize text-[#202B27] dark:text-[#ECF1EE]">
                {u.utilityType.replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-[#78837D] dark:text-[#92A199] capitalize">
                {u.source.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'readings',
      header: 'Meter Readings',
      render: (u) => (
        <div className="font-mono text-[11px] tabular-nums">
          <div className="text-[#78837D] dark:text-[#92A199]">Start: {u.meterReadingStart.toLocaleString()}</div>
          <div className="text-[#202B27] dark:text-[#ECF1EE] font-medium">End: {u.meterReadingEnd.toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: 'consumptionUnits',
      header: 'Consumption',
      align: 'right',
      sortable: true,
      sortValue: (u) => u.consumptionUnits,
      render: (u) => (
        <span className="font-mono font-semibold tabular-nums">
          {u.consumptionUnits.toLocaleString()} {u.unitOfMeasure}
        </span>
      ),
    },
    {
      key: 'totalCost',
      header: `Total Cost (${currency})`,
      align: 'right',
      sortable: true,
      sortValue: (u) => u.totalCost,
      render: (u) =>
        u.source === 'solar_photovoltaic' ? (
          <StatusBadge label="Clean Solar (0)" tone="success" />
        ) : (
          <div>
            <div className="font-mono font-semibold tabular-nums">
              {formatCurrency(u.totalCost, u.currency || currency, currencySymbol)}
            </div>
            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums">
              {formatCurrency(u.unitCost, u.currency || currency, currencySymbol, { decimals: 2 })}/{u.unitOfMeasure}
            </div>
          </div>
        ),
    },
    {
      key: 'costPerOccupiedRoom',
      header: 'CPOR',
      align: 'right',
      sortable: true,
      sortValue: (u) => u.costPerOccupiedRoom,
      render: (u) => (
        <div>
          <div className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
            {formatCurrency(u.costPerOccupiedRoom, u.currency || currency, currencySymbol, { decimals: 1 })}
          </div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] tabular-nums">
            {u.occupiedRoomsCount} rooms
          </div>
        </div>
      ),
    },
    {
      key: 'loggedBy',
      header: 'Logged By',
      render: (u) => <span className="text-[#78837D] dark:text-[#92A199]">{u.loggedBy}</span>,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (u) => (
        <span className="text-[#78837D] dark:text-[#92A199] max-w-xs break-words block">
          {u.notes || '—'}
        </span>
      ),
    },
  ];

  const optInColumns: DataTableColumn<EcoGuestOptIn>[] = [
    {
      key: 'roomNumber',
      header: 'Room',
      sortable: true,
      sortValue: (o) => o.roomNumber,
      render: (o) => <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">Room {o.roomNumber}</span>,
    },
    {
      key: 'guestName',
      header: 'Guest Name',
      sortable: true,
      sortValue: (o) => o.guestName,
      render: (o) => <span className="font-medium">{o.guestName}</span>,
    },
    {
      key: 'stay',
      header: 'Stay Duration',
      render: (o) => (
        <span className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199] tabular-nums">
          {o.stayStartDate} → {o.stayEndDate}
        </span>
      ),
    },
    {
      key: 'linenReuseFrequencyDays',
      header: 'Linen Cycle',
      render: (o) => <StatusBadge label={`Every ${o.linenReuseFrequencyDays} days`} tone="forest" showIcon={false} />,
    },
    {
      key: 'towelReuseAgreed',
      header: 'Towel Re-use',
      render: (o) =>
        o.towelReuseAgreed ? (
          <StatusBadge label="Hang to Dry" tone="success" />
        ) : (
          <StatusBadge label="Daily Turnover" tone="neutral" showIcon={false} />
        ),
    },
    {
      key: 'waterSavedEstLitres',
      header: 'Water Saved',
      align: 'right',
      sortable: true,
      sortValue: (o) => o.waterSavedEstLitres,
      render: (o) => <span className="font-mono font-medium tabular-nums">{o.waterSavedEstLitres} L</span>,
    },
    {
      key: 'powerSavedEstKwh',
      header: 'Power Saved',
      align: 'right',
      sortable: true,
      sortValue: (o) => o.powerSavedEstKwh,
      render: (o) => <span className="font-mono font-medium tabular-nums">{o.powerSavedEstKwh} kWh</span>,
    },
    {
      key: 'loyaltyEcoPointsAwarded',
      header: 'Eco Points',
      align: 'right',
      sortable: true,
      sortValue: (o) => o.loyaltyEcoPointsAwarded,
      render: (o) => <StatusBadge label={`+${o.loyaltyEcoPointsAwarded} pts`} tone="warning" showIcon={false} />,
    },
  ];

  const tabs = [
    { id: 'utilities' as const, label: 'Utilities & Energy', count: utilityLogs.length, icon: Zap },
    { id: 'food_waste' as const, label: 'Food Waste Tracker', count: foodWasteLogs.length, icon: Scale },
    { id: 'eco_opt_in' as const, label: 'Green Stay Roster', count: ecoOptIns.length, icon: Sparkles },
    { id: 'audits' as const, label: 'Eco-Compliance Audits', count: auditItems.length, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Green Hospitality & Utilities"
        subtitle="Grid and solar power metering, water stewardship, kitchen waste diversion, guest linen conservation, and environmental compliance audits."
        breadcrumbs={['Operations', 'Green Hospitality']}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {activeHotel && (
              <span className="inline-flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#647B52]" />
                {activeHotel.name} • Resource &amp; ESG Ledger
              </span>
            )}
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            {activeTab === 'utilities' && (
              <button
                type="button"
                onClick={() => setShowUtilityModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                Log Meter Reading
              </button>
            )}
            {activeTab === 'food_waste' && (
              <button
                type="button"
                onClick={() => setShowWasteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                Log Kitchen Waste
              </button>
            )}
            {activeTab === 'eco_opt_in' && (
              <button
                type="button"
                onClick={() => setShowOptInModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Enroll Green Stay
              </button>
            )}
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Clean Solar Generation"
          value={`${totalSolarGeneratedKwh.toLocaleString()} kWh`}
          helper="Photovoltaic metered output"
          delta="Grid offset"
          deltaTone="positive"
          icon={Sun}
        />
        <KpiCard
          label="Utility CPOR Index"
          value={formatCurrency(averageCpor, currency, currencySymbol, { decimals: 1 })}
          helper="Cost per occupied room"
          deltaTone="forest"
          icon={DollarSign}
        />
        <KpiCard
          label="Food Waste Diverted"
          value={`${totalFoodWasteDivertedKg.toFixed(1)} kg`}
          helper="Compost, biogas & feed"
          delta="Circular diversion"
          deltaTone="positive"
          icon={RotateCcw}
        />
        <KpiCard
          label="Water Conserved"
          value={`${totalWaterSavedLitres.toLocaleString()} L`}
          helper={`${ecoOptIns.length} enrolled stays`}
          delta="Linen re-use"
          deltaTone="forest"
          icon={Droplets}
        />
      </div>

      {/* Navigation Tabs & Global Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E6EBE7] dark:border-[#22322C] pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
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

        {(activeTab === 'food_waste' || activeTab === 'audits') && (
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search records..."
              className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
            />
          </div>
        )}
      </div>

      {/* TAB 1: UTILITIES LOGS */}
      {activeTab === 'utilities' && (
        <DataTable
          data={filteredUtilities}
          columns={utilityColumns}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Search utility source, engineer, or notes..."
          searchFilter={(u, q) =>
            u.source.toLowerCase().includes(q) ||
            u.utilityType.toLowerCase().includes(q) ||
            u.loggedBy.toLowerCase().includes(q) ||
            (u.notes?.toLowerCase().includes(q) ?? false)
          }
          filterToolbar={
            <select
              value={utilityTypeFilter}
              onChange={(e) => setUtilityTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs seam-input"
            >
              <option value="all">All Utility Sources</option>
              <option value="electricity">Main Grid Electricity</option>
              <option value="generator_diesel">Diesel Backup Generator</option>
              <option value="solar_generation">Solar Photovoltaic</option>
              <option value="water">Spring Water / Borehole</option>
            </select>
          }
          onExportCsv={handleExportUtilitiesCsv}
          exportLabel="Export Utilities"
          emptyTitle="No utility meter readings logged"
          emptyDescription="Record grid electricity, solar output, diesel generator, or water meter readings to track CPOR."
          emptyAction={
            <button
              type="button"
              onClick={() => setShowUtilityModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
            >
              <Zap className="w-3.5 h-3.5" />
              Log First Reading
            </button>
          }
        />
      )}

      {/* TAB 2: KITCHEN FOOD WASTE TRACKER */}
      {activeTab === 'food_waste' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#78837D] dark:text-[#92A199]">Meal Session:</span>
              <select
                value={mealSessionFilter}
                onChange={(e) => setMealSessionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Meal Sessions</option>
                <option value="breakfast">Breakfast Buffet</option>
                <option value="lunch">Lunch Service</option>
                <option value="dinner">Dinner &amp; A La Carte</option>
                <option value="banquet_event">Banquet / Conference Gala</option>
              </select>
            </div>
            <span className="text-xs text-[#78837D] dark:text-[#92A199] tabular-nums">
              Showing {filteredWaste.length} of {foodWasteLogs.length} logs
            </span>
          </div>

          {filteredWaste.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No kitchen waste records found"
              description="Log prep trimmings, buffet surplus, or spoilage to monitor circular diversion and food cost impact."
              action={
                <button
                  type="button"
                  onClick={() => setShowWasteModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Log Kitchen Waste
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWaste.map((w) => (
                <div key={w.id} className="seam-surface p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge label={w.mealSession.replace(/_/g, ' ')} tone="warning" showIcon={false} />
                      <StatusBadge label={w.category.replace(/_/g, ' ')} tone="neutral" showIcon={false} />
                    </div>

                    <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE] mt-2.5">
                      {w.kitchenOutletName}
                    </h3>

                    <div className="mt-3 seam-surface-subtle p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Weight Discarded</span>
                        <span className="font-mono font-semibold tabular-nums">{w.weightKg} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Estimated Loss</span>
                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrency(w.estimatedCostValue, w.currency || currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[#E6EBE7] dark:border-[#22322C]">
                        <span className="text-[#78837D] dark:text-[#92A199]">Diversion</span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-400 capitalize">
                          {w.destination.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {w.actionTakenNotes && (
                      <p className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-2.5 leading-relaxed">
                        {w.actionTakenNotes}
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-[#78837D] dark:text-[#92A199] pt-2.5 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-between">
                    <span>{w.chefSupervisor}</span>
                    <span className="font-mono tabular-nums">{w.logDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GUEST ECO LINEN RE-USE OPT-IN */}
      {activeTab === 'eco_opt_in' && (
        <DataTable
          data={ecoOptIns}
          columns={optInColumns}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search guest name or room number..."
          searchFilter={(o, q) =>
            o.guestName.toLowerCase().includes(q) || o.roomNumber.toLowerCase().includes(q)
          }
          onExportCsv={handleExportOptInsCsv}
          exportLabel="Export Roster"
          emptyTitle="No Green Stay enrollments yet"
          emptyDescription="Enroll staying guests into linen and towel conservation to reduce laundry boiler load and award eco points."
          emptyAction={
            <button
              type="button"
              onClick={() => setShowOptInModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Enroll First Room
            </button>
          }
        />
      )}

      {/* TAB 4: GREEN KEY & ECO-AUDITS */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#78837D] dark:text-[#92A199]">Standard:</span>
              <select
                value={auditStandardFilter}
                onChange={(e) => setAuditStandardFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Sustainability Standards</option>
                <option value="green_key_intl">Green Key International</option>
                <option value="eco_ethiopia_resort">National Eco-Resort Standard</option>
                <option value="iso_14001">ISO 14001 Environmental Management</option>
              </select>
            </div>
            <span className="text-xs text-[#78837D] dark:text-[#92A199] tabular-nums">
              Showing {filteredAudits.length} of {auditItems.length} criteria
            </span>
          </div>

          {filteredAudits.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No audit criteria match filter"
              description="Adjust your standard or search filter to review sustainability audit benchmarks."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAudits.map((item) => (
                <div key={item.id} className="seam-surface p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge
                        label={item.auditStandard.replace(/_/g, ' ')}
                        tone="forest"
                        showIcon={false}
                      />
                      <StatusBadge
                        label={item.complianceStatus.replace(/_/g, ' ')}
                        tone={
                          item.complianceStatus === 'compliant'
                            ? 'success'
                            : item.complianceStatus === 'in_progress'
                            ? 'warning'
                            : 'critical'
                        }
                      />
                    </div>

                    <h3 className="font-semibold text-sm sm:text-base text-[#202B27] dark:text-[#ECF1EE] mt-2.5">
                      {item.criterion}
                    </h3>

                    <div className="mt-3 seam-surface-subtle p-3.5 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#78837D] dark:text-[#92A199]">Benchmark Target</span>
                        <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {item.targetMetric}
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#78837D] dark:text-[#92A199]">Current Audit Score</span>
                          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {item.currentScorePercent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E6EBE7] dark:bg-[#22322C] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#173F35] dark:bg-[#647B52] rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, item.currentScorePercent))}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[#78837D] dark:text-[#92A199] pt-1.5 border-t border-[#E6EBE7] dark:border-[#22322C] text-[11px] leading-relaxed">
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">Evidence: </span>
                        {item.evidenceNotes}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2">
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                      Verified by {item.verifiedBy} (<span className="font-mono">{item.lastAuditedDate}</span>)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuditItem(item);
                        setAuditScoreData({
                          scorePercent: item.currentScorePercent,
                          complianceStatus: item.complianceStatus,
                          evidenceNotes: item.evidenceNotes,
                        });
                        setShowAuditModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
                    >
                      Update Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: LOG UTILITY READING */}
      <Modal
        open={showUtilityModal}
        onClose={() => setShowUtilityModal(false)}
        title="Log Utility Energy & Water Consumption"
        subtitle="Metered readings automatically calculate total cost and cost per occupied room."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveUtility} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Utility Type</label>
              <select
                value={newUtility.utilityType}
                onChange={(e) => {
                  const val = e.target.value as 'electricity' | 'water' | 'generator_diesel' | 'solar_generation';
                  setNewUtility({
                    ...newUtility,
                    utilityType: val,
                    source:
                      val === 'generator_diesel'
                        ? 'diesel_generator'
                        : val === 'solar_generation'
                        ? 'solar_photovoltaic'
                        : val === 'water'
                        ? 'spring_water'
                        : 'grid_power',
                    unitOfMeasure: val === 'water' ? 'm3' : val === 'generator_diesel' ? 'litre' : 'kWh',
                    unitCost:
                      val === 'generator_diesel' ? 82 : val === 'water' ? 35 : val === 'solar_generation' ? 0 : 4.8,
                  });
                }}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="electricity">Main Grid Electricity</option>
                <option value="generator_diesel">Diesel Standby Generator</option>
                <option value="solar_generation">Solar Photovoltaic Generation</option>
                <option value="water">Spring Water / Borehole</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Log Date</label>
              <input
                type="date"
                required
                value={newUtility.logDate}
                onChange={(e) => setNewUtility({ ...newUtility, logDate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Meter Start Reading</label>
              <input
                type="number"
                value={newUtility.meterReadingStart}
                onChange={(e) =>
                  setNewUtility({
                    ...newUtility,
                    meterReadingStart: Number(e.target.value),
                    consumptionUnits: Number(newUtility.meterReadingEnd) - Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Meter End Reading</label>
              <input
                type="number"
                value={newUtility.meterReadingEnd}
                onChange={(e) =>
                  setNewUtility({
                    ...newUtility,
                    meterReadingEnd: Number(e.target.value),
                    consumptionUnits: Number(e.target.value) - Number(newUtility.meterReadingStart),
                  })
                }
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Units ({newUtility.unitOfMeasure})
              </label>
              <input
                type="number"
                required
                value={newUtility.consumptionUnits}
                onChange={(e) => setNewUtility({ ...newUtility, consumptionUnits: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Unit Cost ({currency})
              </label>
              <input
                type="number"
                step="0.1"
                value={newUtility.unitCost}
                onChange={(e) => setNewUtility({ ...newUtility, unitCost: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Occupied Rooms</label>
              <input
                type="number"
                min="1"
                value={newUtility.occupiedRoomsCount}
                onChange={(e) => setNewUtility({ ...newUtility, occupiedRoomsCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Operational Notes</label>
            <input
              type="text"
              placeholder="e.g. Normal daytime chiller load, zero generator spikes"
              value={newUtility.notes}
              onChange={(e) => setNewUtility({ ...newUtility, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowUtilityModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Save Utility Log
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: LOG FOOD WASTE */}
      <Modal
        open={showWasteModal}
        onClose={() => setShowWasteModal(false)}
        title="Log Kitchen Food Waste & Diversion"
        subtitle="Track outlet kitchen waste weight, cost impact, and circular destination."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveWaste} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Meal Session</label>
              <select
                value={newWaste.mealSession}
                onChange={(e) =>
                  setNewWaste({
                    ...newWaste,
                    mealSession: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'banquet_event',
                  })
                }
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="breakfast">Breakfast Buffet</option>
                <option value="lunch">Lunch Service</option>
                <option value="dinner">Dinner Service</option>
                <option value="banquet_event">Banquet / Event Gala</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Kitchen Outlet</label>
              <input
                type="text"
                required
                value={newWaste.kitchenOutletName}
                onChange={(e) => setNewWaste({ ...newWaste, kitchenOutletName: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Waste Category</label>
              <select
                value={newWaste.category}
                onChange={(e) => setNewWaste({ ...newWaste, category: e.target.value as WasteCategory })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="prep_trimming">Prep Waste (Peels/Trimmings)</option>
                <option value="buffet_surplus">Buffet Overproduction Surplus</option>
                <option value="plate_waste">Guest Scraped Plate Waste</option>
                <option value="spoilage_expired">Dairy / Produce Spoilage</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Diversion Destination
              </label>
              <select
                value={newWaste.destination}
                onChange={(e) => setNewWaste({ ...newWaste, destination: e.target.value as WasteDestination })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="composting_garden">Organic Herb Garden Composter</option>
                <option value="livestock_feed">Local Livestock Feed Donation</option>
                <option value="biogas_digester">Anaerobic Biogas Digester</option>
                <option value="landfill">Municipal Landfill</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Measured Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={newWaste.weightKg}
                onChange={(e) => setNewWaste({ ...newWaste, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Estimated Cost Loss ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={newWaste.estimatedCostValue}
                onChange={(e) => setNewWaste({ ...newWaste, estimatedCostValue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Corrective Action Notes
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adjusted breakfast baking batch size by -20%"
              value={newWaste.actionTakenNotes}
              onChange={(e) => setNewWaste({ ...newWaste, actionTakenNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowWasteModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Save Waste Record
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ENROLL GUEST IN GREEN STAY */}
      <Modal
        open={showOptInModal}
        onClose={() => setShowOptInModal(false)}
        title="Enroll Room in Green Stay"
        subtitle="Multi-night linen & towel reuse opt-in with automatic eco loyalty points."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSaveOptIn} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Room Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 204"
                value={newOptIn.roomNumber}
                onChange={(e) => setNewOptIn({ ...newOptIn, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Yohannes Girma"
                value={newOptIn.guestName}
                onChange={(e) => setNewOptIn({ ...newOptIn, guestName: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Linen Turnover Frequency
            </label>
            <select
              value={newOptIn.linenReuseFrequencyDays}
              onChange={(e) => setNewOptIn({ ...newOptIn, linenReuseFrequencyDays: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs seam-input"
            >
              <option value={2}>Change Sheets Every 2 Days</option>
              <option value={3}>Change Sheets Every 3 Days (Maximum Conservation)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newOptIn.towelReuseAgreed}
              onChange={(e) => setNewOptIn({ ...newOptIn, towelReuseAgreed: e.target.checked })}
              className="rounded border-[#E6EBE7] text-[#173F35]"
            />
            <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
              Guest agreed to hang bath towels for multi-day reuse
            </span>
          </label>

          <div className="seam-surface-subtle p-3 space-y-1">
            <div className="font-semibold text-[#173F35] dark:text-[#C6A15B] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Automatic +200 Eco Loyalty Points Credit
            </div>
            <p className="text-[11px] text-[#78837D] dark:text-[#92A199]">
              Estimated 90 L water and 12 kWh laundry boiler energy conserved per stay.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowOptInModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Enroll Room
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: UPDATE SUSTAINABILITY AUDIT */}
      <Modal
        open={showAuditModal && Boolean(selectedAuditItem)}
        onClose={() => setShowAuditModal(false)}
        title="Update Environmental Audit Score"
        subtitle={selectedAuditItem?.criterion}
        maxWidthClass="max-w-lg"
      >
        {selectedAuditItem && (
          <form onSubmit={handleUpdateAudit} className="space-y-4 text-xs">
            <div className="seam-surface-subtle p-3">
              <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">Target Metric</div>
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                {selectedAuditItem.targetMetric}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Compliance Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={auditScoreData.scorePercent}
                  onChange={(e) => setAuditScoreData({ ...auditScoreData, scorePercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs seam-input font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Compliance Status
                </label>
                <select
                  value={auditScoreData.complianceStatus}
                  onChange={(e) =>
                    setAuditScoreData({
                      ...auditScoreData,
                      complianceStatus: e.target.value as 'compliant' | 'in_progress' | 'non_compliant',
                    })
                  }
                  className="w-full px-3 py-2 text-xs seam-input"
                >
                  <option value="compliant">Compliant (Meets Standard)</option>
                  <option value="in_progress">In Progress (Action Plan)</option>
                  <option value="non_compliant">Non Compliant</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Audited Evidence &amp; Notes
              </label>
              <textarea
                required
                rows={3}
                value={auditScoreData.evidenceNotes}
                onChange={(e) => setAuditScoreData({ ...auditScoreData, evidenceNotes: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
              >
                Confirm Audit Verification
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SustainabilityAndUtilities;
