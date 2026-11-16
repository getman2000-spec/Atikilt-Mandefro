/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Night Audit, End-of-Day Balancing, Cashier Drop Reconciliation & Business Date Roll
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  Plus,
  RefreshCw,
  ArrowRight,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Hotel,
  CashierDropRecord,
  HighBalanceAlert,
  NightAuditJournal,
} from '../../types/saas';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  DataTable,
  Modal,
  EmptyState,
  SampleDataBadge,
  VerificationNotice,
  type DataTableColumn,
  type StatusTone,
} from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { calculateHospitalityLevies } from '../../utils/taxAndPayrollCalculator';

interface NightAuditAndEodHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const NightAuditAndEodHub: React.FC<NightAuditAndEodHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<'audit_wizard' | 'trial_balance' | 'flash_reports'>(
    'audit_wizard'
  );
  const [currentBizDate, setCurrentBizDate] = useState<string>('');
  const [cashierDrops, setCashierDrops] = useState<CashierDropRecord[]>([]);
  const [highBalanceAlerts, setHighBalanceAlerts] = useState<HighBalanceAlert[]>([]);
  const [auditJournals, setAuditJournals] = useState<NightAuditJournal[]>([]);
  const [outletNames, setOutletNames] = useState<string[]>([]);

  // Live snapshot stats for wizard & trial balance
  const [liveStats, setLiveStats] = useState({
    scheduledArrivals: 0,
    checkedInCount: 0,
    pendingArrivalsCount: 0,
    openFoliosCount: 0,
    occupiedRoomsCount: 0,
    totalRoomsCount: 0,
    estimatedRoomRevenue: 0,
    fnbRevenue: 0,
    otherRevenue: 0,
    cardCollected: 0,
    telebirrCollected: 0,
  });

  // Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [postRoomRatesChecked, setPostRoomRatesChecked] = useState<boolean>(true);
  const [rollBusinessDateChecked, setRollBusinessDateChecked] = useState<boolean>(true);
  const [isExecutingAudit, setIsExecutingAudit] = useState<boolean>(false);

  // Modals
  const [showNewDropModal, setShowNewDropModal] = useState<boolean>(false);
  const [showMitigateModal, setShowMitigateModal] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<HighBalanceAlert | null>(null);
  const [mitigationAction, setMitigationAction] = useState<string>('');

  // New Drop Form State
  const [newDrop, setNewDrop] = useState({
    cashierName: currentUser?.fullName || 'Shift Cashier',
    outletName: 'Main Dining Restaurant',
    shift: 'evening' as 'morning' | 'evening' | 'graveyard',
    expectedSystemAmount: 0,
    actualDropAmount: 0,
    currency: currency,
    notes: '',
  });

  const loadData = useCallback(() => {
    if (!hotelId) {
      setCurrentBizDate('');
      setCashierDrops([]);
      setHighBalanceAlerts([]);
      setAuditJournals([]);
      return;
    }

    const bizDate = saasStorage.getCurrentBusinessDate(hotelId);
    const drops = saasStorage.getCashierDrops(hotelId);
    const alerts = saasStorage.getHighBalanceAlerts(hotelId);
    const journals = saasStorage.getNightAuditJournals(hotelId);
    const reservations = saasStorage.getReservations(hotelId);
    const rooms = saasStorage.getRooms(hotelId);
    const folios = saasStorage.getGuestFolios(hotelId);
    const reports = saasStorage.getDailyRevenueReports(hotelId);
    const outlets = saasStorage.getOutlets(hotelId);

    const openFolios = folios.filter((f) => f.status === 'open');
    const arrivingToday = reservations.filter((r) => r.checkInDate === bizDate);
    const checkedInToday = arrivingToday.filter((r) => r.status === 'checked_in').length;
    const pendingToday = arrivingToday.filter((r) => r.status === 'confirmed').length;
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const latestReport = reports[0];

    const outletList = [
      ...outlets.map((o) => o.name),
      'Front Desk Cashier Till #1',
      'Front Desk Cashier Till #2',
    ];

    const openFolioRoomEstimate = openFolios.reduce((sum, folio) => {
      const res = reservations.find((r) => r.id === folio.bookingId);
      return sum + (res?.dailyRate || folio.subtotal || 0);
    }, 0);

    setCurrentBizDate(bizDate);
    setCashierDrops(drops);
    setHighBalanceAlerts(alerts);
    setAuditJournals(journals);
    setOutletNames(Array.from(new Set(outletList)));
    setLiveStats({
      scheduledArrivals: arrivingToday.length,
      checkedInCount: checkedInToday,
      pendingArrivalsCount: pendingToday,
      openFoliosCount: openFolios.length,
      occupiedRoomsCount: Math.max(occupiedRooms, openFolios.length),
      totalRoomsCount: rooms.length || activeHotel?.operationalSettings?.totalRooms || 0,
      estimatedRoomRevenue: latestReport?.roomsRevenue ?? openFolioRoomEstimate,
      fnbRevenue: (latestReport?.foodRevenue || 0) + (latestReport?.beverageRevenue || 0),
      otherRevenue: latestReport?.otherRevenue || 0,
      cardCollected: latestReport?.cardCollected || 0,
      telebirrCollected: latestReport?.telebirrCollected || 0,
    });

    if (outletList.length > 0) {
      setNewDrop((prev) => ({
        ...prev,
        outletName: outletList.includes(prev.outletName) ? prev.outletName : outletList[0],
        currency,
      }));
    }
  }, [hotelId, currency, activeHotel]);

  useEffect(() => {
    setShowNewDropModal(false);
    setShowMitigateModal(false);
    setSelectedAlert(null);
    setWizardStep(1);
    loadData();
  }, [hotelId, loadData]);

  const handleRecordCashierDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newDrop.cashierName || !newDrop.outletName) {
      toast('Missing cashier details', {
        variant: 'error',
        description: 'Enter both cashier name and outlet.',
      });
      return;
    }

    const created = saasStorage.recordCashierDrop(
      {
        hotelId,
        cashierName: newDrop.cashierName,
        outletName: newDrop.outletName,
        shift: newDrop.shift,
        expectedSystemAmount: Number(newDrop.expectedSystemAmount) || 0,
        actualDropAmount: Number(newDrop.actualDropAmount) || 0,
        currency: newDrop.currency || currency,
        notes: newDrop.notes || undefined,
      },
      currentUser?.fullName || 'Auditor'
    );

    if (created) {
      loadData();
      setShowNewDropModal(false);
      setNewDrop({
        cashierName: currentUser?.fullName || 'Shift Cashier',
        outletName: outletNames[0] || 'Front Desk Cashier Till #1',
        shift: 'evening',
        expectedSystemAmount: 0,
        actualDropAmount: 0,
        currency,
        notes: '',
      });
      toast(`Cashier drop recorded for ${created.cashierName}`, {
        variant: created.status === 'balanced' ? 'success' : 'warning',
        description: `Status: ${created.status.toUpperCase()}`,
      });
    }
  };

  const handleMitigateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !mitigationAction) return;

    saasStorage.resolveHighBalanceAlert(
      selectedAlert.id,
      mitigationAction,
      currentUser?.fullName || 'Auditor'
    );
    loadData();
    setShowMitigateModal(false);
    toast(`High-balance alert resolved for Room ${selectedAlert.roomNumber}`, {
      variant: 'success',
    });
    setSelectedAlert(null);
    setMitigationAction('');
  };

  const handleExecuteAudit = () => {
    if (!hotelId) return;
    setIsExecutingAudit(true);
    setTimeout(() => {
      const journal = saasStorage.executeNightAudit(
        {
          hotelId,
          auditorName: currentUser?.fullName || 'Senior Night Auditor',
          auditorRole: currentUser?.role?.replace(/_/g, ' ') || 'Night Auditor',
          postRoomRates: postRoomRatesChecked,
          rollBusinessDate: rollBusinessDateChecked,
        },
        currentUser?.fullName || 'Night Auditor'
      );

      setIsExecutingAudit(false);
      loadData();
      setActiveTab('flash_reports');
      toast(`Night Audit finalized for ${journal.auditDate}`, {
        variant: 'success',
        description: `Business date rolled to ${saasStorage.getCurrentBusinessDate(hotelId)}.`,
      });
    }, 900);
  };

  const metrics = useMemo(() => {
    const totalDropExpected = cashierDrops.reduce((acc, d) => acc + d.expectedSystemAmount, 0);
    const totalDropActual = cashierDrops.reduce((acc, d) => acc + d.actualDropAmount, 0);
    const totalVariance = totalDropActual - totalDropExpected;
    const unresolvedAlertsCount = highBalanceAlerts.filter((a) => !a.actionTaken).length;

    const latestJournal = auditJournals[0];
    const roomsRev = latestJournal?.totalRoomRevenue ?? liveStats.estimatedRoomRevenue;
    const fnbRev = latestJournal?.totalFnBRevenue ?? liveStats.fnbRevenue;
    const otherRev = latestJournal?.totalOtherRevenue ?? liveStats.otherRevenue;
    const grossRev = roomsRev + fnbRev + otherRev;
    const rules = hotelId ? saasStorage.getFinancialRules(hotelId) : undefined;
    const levies = calculateHospitalityLevies(grossRev, {
      vatRatePercent: rules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
      serviceChargeRatePercent:
        rules?.serviceChargeRate ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
    });
    const serviceCharge = latestJournal?.totalServiceCharge ?? levies.serviceChargeAmount;
    const vatAmount = latestJournal?.totalVat ?? levies.vatAmount;

    return {
      totalDropExpected,
      totalDropActual,
      totalVariance,
      unresolvedAlertsCount,
      roomsRev,
      fnbRev,
      otherRev,
      grossRev,
      serviceCharge,
      vatAmount,
    };
  }, [cashierDrops, highBalanceAlerts, auditJournals, liveStats, hotelId]);

  const dropColumns: DataTableColumn<CashierDropRecord>[] = [
    {
      key: 'outlet',
      header: 'Outlet & Cashier',
      sortable: true,
      sortValue: (d) => d.outletName,
      render: (d) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{d.outletName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">{d.cashierName}</div>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (d) => <span className="capitalize">{d.shift}</span>,
    },
    {
      key: 'expected',
      header: 'Expected System',
      align: 'right',
      render: (d) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(d.expectedSystemAmount, d.currency)}
        </span>
      ),
    },
    {
      key: 'actual',
      header: 'Actual Drop',
      align: 'right',
      sortable: true,
      sortValue: (d) => d.actualDropAmount,
      render: (d) => (
        <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(d.actualDropAmount, d.currency)}
        </span>
      ),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (d) => (
        <span
          className={`font-mono font-semibold tabular-nums ${
            d.varianceAmount === 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : d.varianceAmount > 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {d.varianceAmount > 0 ? `+${d.varianceAmount}` : d.varianceAmount} {d.currency}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => {
        const tone: StatusTone =
          d.status === 'balanced' ? 'success' : d.status === 'over' ? 'warning' : 'critical';
        return <StatusBadge tone={tone} label={d.status} />;
      },
    },
  ];

  if (!activeHotel) {
    return (
      <EmptyState
        title="No property selected"
        description="Select a hotel property to run Night Audit and End-of-Day reconciliation."
      />
    );
  }

  const wizardRoomRevPreview = liveStats.estimatedRoomRevenue;
  const activeRules = hotelId ? saasStorage.getFinancialRules(hotelId) : undefined;
  const wizardLeviesPreview = calculateHospitalityLevies(wizardRoomRevPreview, {
    vatRatePercent: activeRules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
    serviceChargeRatePercent:
      activeRules?.serviceChargeRate ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
  });
  const wizardScPreview = wizardLeviesPreview.serviceChargeAmount;
  const wizardVatPreview = wizardLeviesPreview.vatAmount;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Finance & Audit', 'Night Audit & EOD']}
        title="Night Audit, End-of-Day Balancing & Rate Roll"
        subtitle="Nightly room rate posting, statutory tax calculations, cashier drop balancing, and trial balance archiving."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#173F35] dark:text-[#C6A15B]">
              <Calendar className="w-3.5 h-3.5" />
              Business Date: {currentBizDate || '—'}
            </span>
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowNewDropModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#78837D]" />
              <span>Record Cashier Drop</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit_wizard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Run Night Audit</span>
            </button>
          </>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Business Date"
          value={currentBizDate || '—'}
          helper="Next business day roll pending"
          deltaTone="forest"
          icon={Calendar}
        />
        <KpiCard
          label="Cashier Drop Total"
          value={formatCurrency(metrics.totalDropActual, currency, currencySymbol)}
          helper={
            metrics.totalVariance === 0
              ? 'Exact balanced (0.00)'
              : `Net variance: ${metrics.totalVariance > 0 ? '+' : ''}${metrics.totalVariance} ${currency}`
          }
          deltaTone={metrics.totalVariance === 0 ? 'positive' : 'warning'}
          icon={DollarSign}
        />
        <KpiCard
          label="High Balance Risks"
          value={`${metrics.unresolvedAlertsCount} Unresolved`}
          helper="Credit ceiling monitoring"
          deltaTone={metrics.unresolvedAlertsCount > 0 ? 'warning' : 'positive'}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Historical EOD Packets"
          value={`${auditJournals.length} Archives`}
          helper="Immutable flash journals"
          icon={FileText}
        />
      </div>

      <VerificationNotice />

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-1 overflow-x-auto">
        {[
          { id: 'audit_wizard', label: 'Audit Execution Wizard', icon: Moon },
          {
            id: 'trial_balance',
            label: 'Trial Balance & Revenue',
            icon: TrendingUp,
            count: cashierDrops.length,
          },
          {
            id: 'flash_reports',
            label: "Manager's Morning Flash Packets",
            icon: FileText,
            count: auditJournals.length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B]'
                  : 'border-transparent text-[#78837D] hover:text-[#202B27] dark:text-[#92A199] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUDIT EXECUTION WIZARD */}
      {activeTab === 'audit_wizard' && (
        <div className="space-y-5">
          {/* Stepper */}
          <div className="seam-surface p-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { step: 1, title: '1. Pending Arrivals' },
                { step: 2, title: '2. Cashier Balancing' },
                { step: 3, title: '3. Room & Tax Roll' },
                { step: 4, title: '4. High-Balance Risk' },
                { step: 5, title: '5. Date Rollover' },
              ].map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setWizardStep(item.step)}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors text-center ${
                    wizardStep === item.step
                      ? 'bg-[#173F35] text-white'
                      : wizardStep > item.step
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199]'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {wizardStep === 1 && (
            <div className="seam-surface p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      Step 1: Verify Pending Arrivals &amp; No-Shows
                    </h3>
                    <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                      Confirm all scheduled reservations for {currentBizDate} are checked in or resolved.
                    </p>
                  </div>
                </div>
                <StatusBadge
                  tone={liveStats.pendingArrivalsCount === 0 ? 'success' : 'warning'}
                  label={
                    liveStats.pendingArrivalsCount === 0
                      ? 'Arrivals Clear'
                      : `${liveStats.pendingArrivalsCount} Pending`
                  }
                />
              </div>

              <div className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                  <span className="text-[#78837D] dark:text-[#92A199]">
                    Reservations Scheduled for {currentBizDate}:
                  </span>
                  <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    {liveStats.scheduledArrivals} Rooms
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                  <span className="text-[#78837D] dark:text-[#92A199]">
                    Checked-In to Active Folios:
                  </span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {liveStats.checkedInCount} Rooms
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#78837D] dark:text-[#92A199]">
                    Remaining Unresolved Arrivals:
                  </span>
                  <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
                    {liveStats.pendingArrivalsCount} Rooms
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
                >
                  <span>Proceed to Step 2: Cashier Balancing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="seam-surface p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                <div>
                  <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    Step 2: Department Shift Cashier Reconciliation
                  </h3>
                  <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                    Verify that F&amp;B and Front Desk cash drawers are turned in and balanced.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewDropModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shift Drop</span>
                </button>
              </div>

              <DataTable
                data={cashierDrops}
                columns={dropColumns}
                keyExtractor={(d) => d.id}
                pageSize={8}
                emptyTitle="No cashier drops logged"
                emptyDescription="Record cashier shift turn-ins before running the business date roll."
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
                >
                  <span>Proceed to Step 3: Room &amp; Tax Roll</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="seam-surface p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                <div className="w-9 h-9 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    Step 3: Automated Room Rate &amp; Tax Roll
                  </h3>
                  <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                    Batch-posts nightly room charges, 10% Service Charge, and 15% VAT to open guest folios.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postRoomRatesChecked}
                    onChange={(e) => setPostRoomRatesChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#173F35] rounded mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      Post Room Rates &amp; Statutory Taxes across Open Folios
                    </div>
                    <div className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                      Generates itemized charges across {liveStats.openFoliosCount} open guest folios
                      for business date {currentBizDate}.
                    </div>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C]">
                    <div className="text-[#78837D] dark:text-[#92A199]">Base Room Posting</div>
                    <div className="text-base font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-1">
                      {formatCurrency(wizardRoomRevPreview, currency, currencySymbol)}
                    </div>
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                      {liveStats.openFoliosCount} active folios
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C]">
                    <div className="text-[#78837D] dark:text-[#92A199]">Service Charge (10%)</div>
                    <div className="text-base font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                      {formatCurrency(wizardScPreview, currency, currencySymbol)}
                    </div>
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                      Staff pool distribution
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C]">
                    <div className="text-[#78837D] dark:text-[#92A199]">VAT (15%)</div>
                    <div className="text-base font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] mt-1">
                      {formatCurrency(wizardVatPreview, currency, currencySymbol)}
                    </div>
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                      Tax authority accrual
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
                >
                  <span>Proceed to Step 4: High-Balance Risk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="seam-surface p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    Step 4: High-Balance &amp; Credit Limit Review
                  </h3>
                  <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                    Flag resident folios exceeding credit limits to prevent departure settlement risk.
                  </p>
                </div>
              </div>

              {highBalanceAlerts.length === 0 ? (
                <EmptyState
                  title="No high-balance alerts"
                  description="All active guest folios are within authorized credit ceilings."
                />
              ) : (
                <div className="space-y-3">
                  {highBalanceAlerts.map((alertItem) => (
                    <div
                      key={alertItem.id}
                      className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-[#202B27] dark:text-[#ECF1EE]">
                            {alertItem.guestName}
                          </span>
                          <span className="text-[11px] font-mono bg-white dark:bg-[#131D1A] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B]">
                            Room {alertItem.roomNumber}
                          </span>
                          <StatusBadge
                            tone={alertItem.riskSeverity === 'critical' ? 'critical' : 'warning'}
                            label={`${alertItem.riskSeverity} Risk`}
                          />
                        </div>
                        <div className="mt-1.5 text-xs text-[#78837D] dark:text-[#92A199] flex flex-wrap gap-4 font-mono">
                          <span>
                            Balance:{' '}
                            <strong className="text-[#202B27] dark:text-[#ECF1EE]">
                              {formatCurrency(alertItem.currentFolioBalance, currency, currencySymbol)}
                            </strong>
                          </span>
                          <span>
                            Limit: {formatCurrency(alertItem.creditLimit, currency, currencySymbol)}
                          </span>
                          <span className="font-sans">Method: {alertItem.paymentMethod}</span>
                        </div>
                        {alertItem.actionTaken && (
                          <div className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Action: {alertItem.actionTaken}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {!alertItem.actionTaken ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAlert(alertItem);
                              setShowMitigateModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#C6A15B] hover:bg-[#b59049] text-[#0D1412] text-xs font-semibold transition-colors"
                          >
                            Mitigate Risk
                          </button>
                        ) : (
                          <StatusBadge tone="success" label="Resolved" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(5)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
                >
                  <span>Proceed to Step 5: Final Execution</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="seam-surface p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                <div className="w-9 h-9 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#C6A15B] flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    Step 5: Roll Business Date &amp; Finalize Audit Packet
                  </h3>
                  <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                    Advances the operational business date and archives the official Morning Flash Packet.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rollBusinessDateChecked}
                    onChange={(e) => setRollBusinessDateChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#173F35] rounded mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      Advance Active Property Business Date
                    </div>
                    <div className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                      Rolls business date from <strong className="font-mono">{currentBizDate}</strong> forward
                      to the next operational day.
                    </div>
                  </div>
                </label>

                <div className="p-3.5 rounded-lg bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] text-xs text-[#202B27] dark:text-[#ECF1EE] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-[#173F35] dark:text-[#C6A15B]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Audit Integrity &amp; Immutability</span>
                  </div>
                  <p className="text-[#78837D] dark:text-[#92A199]">
                    Upon execution, the Night Audit Journal is stamped with the auditor identity, locks
                    today&apos;s trial balance, and publishes the Manager&apos;s Morning Flash Packet.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isExecutingAudit}
                  onClick={handleExecuteAudit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#12332B] text-white disabled:opacity-60 transition-colors"
                >
                  {isExecutingAudit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Night Audit...</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      <span>Execute Night Audit &amp; Roll Date</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRIAL BALANCE & REVENUE LEDGER */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-5">
          <div className="seam-surface p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6EBE7] dark:border-[#22322C]">
              <div>
                <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Daily Multi-Department Trial Balance
                </h3>
                <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                  Revenue postings, tax accruals, and cashier turn-ins for business date{' '}
                  <span className="font-mono">{currentBizDate}</span>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadCsvFile(
                      `SEAM_Trial_Balance_${currentBizDate}.csv`,
                      ['Ledger Line', 'Amount', 'Currency'],
                      [
                        ['Rooms Revenue', metrics.roomsRev, currency],
                        ['Food & Beverage Outlets', metrics.fnbRev, currency],
                        ['Other Operating Departments', metrics.otherRev, currency],
                        ['Total Gross Operating Revenue', metrics.grossRev, currency],
                        ['Service Charge (10%)', metrics.serviceCharge, currency],
                        ['VAT (15%)', metrics.vatAmount, currency],
                        ['Cashier Turn-In Drops', metrics.totalDropActual, currency],
                      ]
                    );
                    toast('Trial balance CSV exported', { variant: 'success' });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
                <h4 className="text-[11px] font-semibold text-[#78837D] dark:text-[#92A199] uppercase tracking-wider mb-3">
                  Departmental Revenue Centers
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      Rooms Division ({liveStats.occupiedRoomsCount} occupied)
                    </span>
                    <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                      {formatCurrency(metrics.roomsRev, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      Food &amp; Beverage Outlets
                    </span>
                    <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                      {formatCurrency(metrics.fnbRev, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      Spa, Laundry &amp; Minor Departments
                    </span>
                    <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                      {formatCurrency(metrics.otherRev, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-semibold text-[#173F35] dark:text-[#C6A15B]">
                    <span>Total Gross Operating Revenue</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(metrics.grossRev, currency, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
                <h4 className="text-[11px] font-semibold text-[#78837D] dark:text-[#92A199] uppercase tracking-wider mb-3">
                  Tax Levies &amp; Settlement Totals
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      10% Hospitality Service Charge
                    </span>
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(metrics.serviceCharge, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      15% Value Added Tax (VAT)
                    </span>
                    <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
                      {formatCurrency(metrics.vatAmount, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      Total Cashier Turn-In Drops
                    </span>
                    <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                      {formatCurrency(metrics.totalDropActual, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E6EBE7]/70 dark:border-[#22322C]">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      Telebirr &amp; Card Electronic Settled
                    </span>
                    <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                      {formatCurrency(
                        liveStats.telebirrCollected + liveStats.cardCollected,
                        currency,
                        currencySymbol
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>Cashier Variance Status</span>
                    <span className="font-mono tabular-nums">
                      {metrics.totalVariance === 0
                        ? 'Balanced (0.00)'
                        : `${metrics.totalVariance > 0 ? '+' : ''}${metrics.totalVariance} ${currency}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DataTable
            data={cashierDrops}
            columns={dropColumns}
            keyExtractor={(d) => d.id}
            searchPlaceholder="Search cashier or outlet..."
            searchFilter={(d, q) =>
              d.cashierName.toLowerCase().includes(q) || d.outletName.toLowerCase().includes(q)
            }
            emptyTitle="No cashier drops logged"
          />
        </div>
      )}

      {/* TAB 3: MANAGER'S MORNING FLASH PACKETS */}
      {activeTab === 'flash_reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#78837D] dark:text-[#92A199]">
              Immutable daily night audit records archived for executive and finance audit review.
            </p>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Archives</span>
            </button>
          </div>

          {auditJournals.length === 0 ? (
            <EmptyState
              title="No Night Audit archives yet"
              description="Run the Night Audit Execution Wizard to generate the first Morning Flash Packet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auditJournals.map((journal) => (
                <div key={journal.id} className="seam-surface p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                      <span className="text-xs font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2.5 py-1 rounded border border-[#E6EBE7] dark:border-[#22322C]">
                        {journal.auditDate}
                      </span>
                      <StatusBadge tone="success" label="Finalized" />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                      <div className="p-2.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7]/70 dark:border-[#22322C]">
                        <div className="text-[10px] text-[#78837D] dark:text-[#92A199] uppercase">
                          Occupancy
                        </div>
                        <div className="text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {journal.occupancyRate}%
                        </div>
                        <div className="text-[10px] text-[#78837D] dark:text-[#92A199] font-mono">
                          {journal.roomsOccupied}/{journal.roomsAvailable} rms
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7]/70 dark:border-[#22322C]">
                        <div className="text-[10px] text-[#78837D] dark:text-[#92A199] uppercase">
                          ADR
                        </div>
                        <div className="text-sm font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                          {journal.adr.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#78837D] dark:text-[#92A199]">{currency}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7]/70 dark:border-[#22322C]">
                        <div className="text-[10px] text-[#78837D] dark:text-[#92A199] uppercase">
                          RevPAR
                        </div>
                        <div className="text-sm font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] mt-0.5">
                          {journal.revpar.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#78837D] dark:text-[#92A199]">{currency}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#E6EBE7]/60 dark:border-[#22322C]">
                        <span className="text-[#78837D] dark:text-[#92A199]">Total Gross Revenue</span>
                        <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {formatCurrency(journal.totalGrossRevenue, currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#E6EBE7]/60 dark:border-[#22322C]">
                        <span className="text-[#78837D] dark:text-[#92A199]">Service Charge (10%)</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(journal.totalServiceCharge, currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#E6EBE7]/60 dark:border-[#22322C]">
                        <span className="text-[#78837D] dark:text-[#92A199]">VAT (15%)</span>
                        <span className="font-mono text-[#173F35] dark:text-[#C6A15B]">
                          {formatCurrency(journal.totalVat, currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#78837D] dark:text-[#92A199]">Auditor</span>
                        <span className="text-[#202B27] dark:text-[#ECF1EE]">
                          {journal.auditorName} ({journal.auditorRole})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs">
                    <span className="text-[#78837D] dark:text-[#92A199] font-mono text-[11px]">
                      {new Date(journal.executedAt).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1 text-[#173F35] dark:text-[#C6A15B] font-medium hover:underline"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Packet</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: RECORD CASHIER DROP */}
      <Modal
        open={showNewDropModal}
        onClose={() => setShowNewDropModal(false)}
        title="Record Shift Cashier Drop"
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewDropModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="cashier-drop-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Record Drop
            </button>
          </>
        }
      >
        <form id="cashier-drop-form" onSubmit={handleRecordCashierDrop} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Outlet / POS Center *
            </label>
            <select
              required
              value={newDrop.outletName}
              onChange={(e) => setNewDrop({ ...newDrop, outletName: e.target.value })}
              className="w-full p-2 seam-input"
            >
              {outletNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Cashier Name *
              </label>
              <input
                type="text"
                required
                value={newDrop.cashierName}
                onChange={(e) => setNewDrop({ ...newDrop, cashierName: e.target.value })}
                className="w-full p-2 seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Shift *
              </label>
              <select
                value={newDrop.shift}
                onChange={(e) =>
                  setNewDrop({
                    ...newDrop,
                    shift: e.target.value as 'morning' | 'evening' | 'graveyard',
                  })
                }
                className="w-full p-2 seam-input"
              >
                <option value="morning">Morning Shift</option>
                <option value="evening">Evening Shift</option>
                <option value="graveyard">Graveyard Shift</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Expected ({currency}) *
              </label>
              <input
                type="number"
                required
                value={newDrop.expectedSystemAmount}
                onChange={(e) =>
                  setNewDrop({ ...newDrop, expectedSystemAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Actual Drop ({currency}) *
              </label>
              <input
                type="number"
                required
                value={newDrop.actualDropAmount}
                onChange={(e) =>
                  setNewDrop({ ...newDrop, actualDropAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Envelope Notes &amp; Variance Rationale
            </label>
            <textarea
              rows={2}
              placeholder="Record envelope serial number or variance explanation..."
              value={newDrop.notes}
              onChange={(e) => setNewDrop({ ...newDrop, notes: e.target.value })}
              className="w-full p-2 seam-input"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: MITIGATE HIGH BALANCE RISK */}
      <Modal
        open={showMitigateModal && Boolean(selectedAlert)}
        onClose={() => setShowMitigateModal(false)}
        title="Mitigate High-Balance Risk"
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowMitigateModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="mitigate-alert-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Record Mitigation
            </button>
          </>
        }
      >
        {selectedAlert && (
          <form id="mitigate-alert-form" onSubmit={handleMitigateAlert} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                {selectedAlert.guestName} (Room {selectedAlert.roomNumber})
              </div>
              <div className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                Balance: {formatCurrency(selectedAlert.currentFolioBalance, currency, currencySymbol)}
              </div>
              <div className="font-mono text-[#78837D] dark:text-[#92A199]">
                Credit Limit: {formatCurrency(selectedAlert.creditLimit, currency, currencySymbol)}
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Mitigation Action / Resolution *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Checked signed corporate purchase order or captured additional card pre-authorization..."
                value={mitigationAction}
                onChange={(e) => setMitigationAction(e.target.value)}
                className="w-full p-2 seam-input"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
