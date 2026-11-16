/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executive Hotel Dashboard for General Managers & Hotel Administrators
 * Every KPI, trend chart, department breakdown, and alert is derived strictly
 * from authorized tenant records in saasStorage.
 */

import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  SampleDataBadge,
} from '../ui';
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  DollarSign,
  Layers,
  Percent,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

interface HotelAdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const HotelAdminDashboard: React.FC<HotelAdminDashboardProps> = ({ onNavigateTab }) => {
  const { activeHotel, hotels, switchHotel, user } = useAuth();

  if (!activeHotel) {
    return (
      <EmptyState
        icon={Building2}
        title="No active property selected"
        description="Select a property from the workspace switcher to view executive performance and operations."
      />
    );
  }

  const hotelId = activeHotel.id;
  const currency = activeHotel.operationalSettings.currency || 'ETB';
  const symbol = activeHotel.operationalSettings.currencySymbol || (currency === 'ETB' ? 'Br' : '$');
  const currentBusinessDate = saasStorage.getCurrentBusinessDate(hotelId);

  // Filters
  const [businessDate, setBusinessDate] = useState<string>(currentBusinessDate);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Authorized tenant datasets
  const subscription = useMemo(() => saasStorage.getSubscriptionByHotelId(hotelId), [hotelId]);
  const staffMembers = useMemo(() => saasStorage.getUsersByHotelId(hotelId), [hotelId]);
  const departments = useMemo(() => saasStorage.getDepartments(hotelId), [hotelId]);
  const rooms = useMemo(() => saasStorage.getRooms(hotelId), [hotelId]);
  const reservations = useMemo(() => saasStorage.getReservations(hotelId), [hotelId]);
  const folios = useMemo(() => saasStorage.getGuestFolios(hotelId), [hotelId]);
  const dailyReports = useMemo(() => saasStorage.getDailyRevenueReports(hotelId), [hotelId]);
  const requisitions = useMemo(() => saasStorage.getRequisitions(hotelId), [hotelId]);
  const cityLedgerInvoices = useMemo(() => saasStorage.getCityLedgerInvoices(hotelId), [hotelId]);
  const workOrders = useMemo(() => saasStorage.getWorkOrders(hotelId), [hotelId]);
  const leaveRequests = useMemo(() => saasStorage.getLeaveRequests(hotelId), [hotelId]);
  const complaints = useMemo(() => saasStorage.getGuestComplaints(hotelId), [hotelId]);
  const highBalanceAlerts = useMemo(() => saasStorage.getHighBalanceAlerts(hotelId), [hotelId]);
  const auditLogs = useMemo(() => saasStorage.getAuditLogs(hotelId).slice(0, 8), [hotelId]);
  const kpiTargets = useMemo(() => saasStorage.getKPITargets(hotelId), [hotelId]);

  // Filter daily reports by selected businessDate & dateRange
  const filteredReports = useMemo(() => {
    const sorted = [...dailyReports].sort((a, b) => a.date.localeCompare(b.date));
    if (dateRange === 'all') return sorted.filter((r) => !businessDate || r.date <= businessDate);

    const days = dateRange === '7d' ? 7 : 30;
    const endMs = businessDate ? new Date(businessDate).getTime() : Date.now();
    const startMs = endMs - days * 86400000;

    const within = sorted.filter((r) => {
      const t = new Date(r.date).getTime();
      return !Number.isNaN(t) && t >= startMs && t <= endMs;
    });
    return within.length > 0 ? within : sorted;
  }, [dailyReports, businessDate, dateRange]);

  // Real KPI calculations strictly from stored property records
  const kpis = useMemo(() => {
    const totalRoomsCount = rooms.length > 0 ? rooms.length : activeHotel.operationalSettings.totalRooms || 0;
    const occupiedRoomsLive = rooms.filter((r) => r.status === 'occupied').length;

    const totalRevenueFromReports = filteredReports.reduce((acc, r) => acc + r.totalGrossRevenue, 0);
    const roomsRevFromReports = filteredReports.reduce((acc, r) => acc + r.roomsRevenue, 0);
    const foodRevFromReports = filteredReports.reduce((acc, r) => acc + r.foodRevenue, 0);
    const bevRevFromReports = filteredReports.reduce((acc, r) => acc + r.beverageRevenue, 0);
    const otherRevFromReports = filteredReports.reduce((acc, r) => acc + r.otherRevenue, 0);
    const roomsSoldReports = filteredReports.reduce((acc, r) => acc + r.occupiedRooms, 0);
    const availableRoomNights = filteredReports.reduce((acc, r) => acc + (r.totalRooms || totalRoomsCount), 0);

    // Fallback to live folio/reservation totals only if there are no daily revenue reports yet
    const liveFolioGross = folios.reduce((acc, f) => acc + f.grandTotal, 0);
    const totalRevenue = filteredReports.length > 0 ? totalRevenueFromReports : liveFolioGross;

    const occupancyPct =
      filteredReports.length > 0 && availableRoomNights > 0
        ? (roomsSoldReports / availableRoomNights) * 100
        : totalRoomsCount > 0
        ? (occupiedRoomsLive / totalRoomsCount) * 100
        : 0;

    const roomsSold = filteredReports.length > 0 ? roomsSoldReports : occupiedRoomsLive;

    const adr =
      filteredReports.length > 0 && roomsSoldReports > 0
        ? roomsRevFromReports / roomsSoldReports
        : occupiedRoomsLive > 0
        ? reservations
            .filter((res) => res.status === 'checked_in')
            .reduce((acc, res) => acc + res.dailyRate, 0) / occupiedRoomsLive
        : 0;

    const revPar =
      filteredReports.length > 0 && availableRoomNights > 0
        ? roomsRevFromReports / availableRoomNights
        : totalRoomsCount > 0
        ? (adr * occupiedRoomsLive) / totalRoomsCount
        : 0;

    const folioReceivables = folios
      .filter((f) => f.status === 'open')
      .reduce((acc, f) => acc + Math.max(0, f.balanceDue), 0);
    const cityLedgerReceivables = cityLedgerInvoices
      .filter((inv) => inv.status !== 'settled')
      .reduce((acc, inv) => acc + Math.max(0, inv.balanceDueEtb), 0);

    const outstandingReceivables = folioReceivables + cityLedgerReceivables;

    const roomStatusCounts = {
      occupied: occupiedRoomsLive,
      vacantClean: rooms.filter((r) => r.status === 'clean' || r.status === 'inspected').length,
      vacantDirty: rooms.filter((r) => r.status === 'dirty').length,
      outOfOrder: rooms.filter((r) => r.status === 'out_of_order').length,
    };

    return {
      totalRevenue,
      occupancyPct,
      adr,
      revPar,
      roomsSold,
      totalRoomsCount,
      outstandingReceivables,
      folioReceivables,
      cityLedgerReceivables,
      roomsRevFromReports,
      foodRevFromReports,
      bevRevFromReports,
      otherRevFromReports,
      roomStatusCounts,
    };
  }, [filteredReports, rooms, folios, reservations, cityLedgerInvoices, activeHotel.operationalSettings.totalRooms]);

  // Department budget vs actual requisitions spend
  const departmentSummary = useMemo(() => {
    const filteredDepts =
      departmentFilter === 'all'
        ? departments
        : departments.filter((d) => d.id === departmentFilter);

    return filteredDepts.map((dept) => {
      const deptReqs = requisitions.filter(
        (r) => r.departmentId === dept.id && r.status !== 'rejected'
      );
      const actualSpend = deptReqs.reduce((acc, r) => acc + r.amount, 0);
      const pendingSpend = deptReqs
        .filter((r) => r.status !== 'approved' && r.status !== 'settled')
        .reduce((acc, r) => acc + r.amount, 0);
      const budget = dept.operatingBudget || 0;
      const utilizationPct = budget > 0 ? (actualSpend / budget) * 100 : 0;

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        head: dept.headOfDepartmentName || 'Unassigned',
        budget,
        actualSpend,
        pendingSpend,
        utilizationPct,
        status: dept.status,
      };
    });
  }, [departments, requisitions, departmentFilter]);

  // Pending approvals queue from real data
  const pendingApprovals = useMemo(() => {
    const reqs = requisitions
      .filter((r) => r.status === 'pending_dept_head' || r.status === 'pending_finance' || r.status === 'pending_gm')
      .map((r) => ({
        id: r.id,
        type: 'Purchase Requisition',
        title: `${r.requisitionNumber} · ${r.departmentName}`,
        detail: `${r.description} (${formatCurrency(r.amount, currency, symbol)})`,
        stage: r.status.replace(/_/g, ' '),
        tab: 'financial_management',
      }));

    const leaves = leaveRequests
      .filter((l) => l.status === 'pending')
      .map((l) => ({
        id: l.id,
        type: 'Leave Request',
        title: `${l.employeeName} · ${l.departmentName}`,
        detail: `${l.leaveType} (${l.daysCount} days)`,
        stage: 'pending',
        tab: 'human_resources',
      }));

    return [...reqs, ...leaves];
  }, [requisitions, leaveRequests, currency, symbol]);

  // Critical operational alerts
  const operationalAlerts = useMemo(() => {
    const list: Array<{ id: string; severity: 'critical' | 'warning'; title: string; detail: string; tab: string }> = [];

    if (activeHotel.subscriptionStatus === 'grace_period') {
      list.push({
        id: 'sub_grace',
        severity: 'warning',
        title: 'Subscription Grace Period Active',
        detail: `Grace period ends ${subscription?.gracePeriodEndsAt?.split('T')[0] || 'soon'}.`,
        tab: 'hotel_subscription',
      });
    }

    const oooRooms = rooms.filter((r) => r.status === 'out_of_order');
    if (oooRooms.length > 0) {
      list.push({
        id: 'ooo_rooms',
        severity: 'warning',
        title: `${oooRooms.length} Room(s) Out of Order`,
        detail: `Rooms ${oooRooms.map((r) => r.roomNumber).join(', ')} locked from inventory.`,
        tab: 'maintenance',
      });
    }

    const urgentWOs = workOrders.filter((w) => w.status !== 'resolved' && w.status !== 'closed' && (w.priority === 'critical' || w.priority === 'high'));
    if (urgentWOs.length > 0) {
      list.push({
        id: 'urgent_wo',
        severity: 'critical',
        title: `${urgentWOs.length} High/Critical Engineering Ticket(s)`,
        detail: urgentWOs[0].title,
        tab: 'maintenance',
      });
    }

    const openHighBal = highBalanceAlerts.filter((a) => !a.actionTaken && a.currentFolioBalance > a.creditLimit);
    if (openHighBal.length > 0) {
      list.push({
        id: 'high_bal',
        severity: 'warning',
        title: `${openHighBal.length} Folio High-Balance Alert(s)`,
        detail: `${openHighBal[0].guestName} (Room ${openHighBal[0].roomNumber}) exceeds limit.`,
        tab: 'night_audit',
      });
    }

    const openComplaints = complaints.filter((c) => c.status === 'open' || c.status === 'investigating');
    if (openComplaints.length > 0) {
      list.push({
        id: 'open_complaints',
        severity: 'critical',
        title: `${openComplaints.length} Active Service Recovery Ticket(s)`,
        detail: `${openComplaints[0].ticketNumber} · ${openComplaints[0].description}`,
        tab: 'security_recovery',
      });
    }

    return list;
  }, [activeHotel.subscriptionStatus, subscription, rooms, workOrders, highBalanceAlerts, complaints]);

  // SVG chart bounds for Revenue & Occupancy Trends
  const maxDailyRev = useMemo(
    () => Math.max(1, ...filteredReports.map((r) => r.totalGrossRevenue)),
    [filteredReports]
  );

  const deptRevenueTotal =
    kpis.roomsRevFromReports + kpis.foodRevFromReports + kpis.bevRevFromReports + kpis.otherRevFromReports;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', activeHotel.name, 'Executive Dashboard']}
        title="Executive Operations & Financial Command"
        subtitle={`${activeHotel.legalName} · Real-time property KPIs, revenue trends, departmental budgets, and approvals.`}
        meta={
          <>
            <StatusBadge
              label={activeHotel.subscriptionStatus.replace('_', ' ')}
              tone={
                activeHotel.subscriptionStatus === 'active'
                  ? 'success'
                  : activeHotel.subscriptionStatus === 'grace_period'
                  ? 'warning'
                  : 'critical'
              }
            />
            <span>{activeHotel.address.city}, {activeHotel.address.country}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{kpis.totalRoomsCount} Rooms</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{currency} ({symbol})</span>
            <span aria-hidden="true">·</span>
            <span>{staffMembers.length} Staff Accounts</span>
            <SampleDataBadge />
          </>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => onNavigateTab('front_office')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <BedDouble className="w-3.5 h-3.5 text-[#647B52]" />
              <span>Front Desk</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('hotel_profile')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Property Settings</span>
            </button>
          </>
        }
      />

      {/* Executive Filter Strip */}
      <div className="p-3.5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#78837D]" />
            <label htmlFor="exec-bdate" className="text-[#78837D] dark:text-[#92A199] font-medium">
              Business Date
            </label>
            <input
              id="exec-bdate"
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono seam-input"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
            {(
              [
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Recorded' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDateRange(opt.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  dateRange === opt.id
                    ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] shadow-xs'
                    : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hotels.length > 1 && user?.role !== 'staff' && (
            <select
              value={activeHotel.id}
              onChange={(e) => switchHotel(e.target.value)}
              aria-label="Filter by property"
              className="px-2.5 py-1 text-xs seam-input"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
            className="px-2.5 py-1 text-xs seam-input"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} · {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-[#78837D] dark:text-[#92A199] tabular-nums">
          {filteredReports.length} flash report period(s) analyzed
        </div>
      </div>

      {/* 6 Primary Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(kpis.totalRevenue, currency, symbol, { compact: true })}
          helper={`${filteredReports.length || 1} period(s) gross`}
          icon={DollarSign}
          onClick={() => onNavigateTab('financial_management')}
        />
        <KpiCard
          label="Occupancy %"
          value={`${kpis.occupancyPct.toFixed(1)}%`}
          delta={kpis.occupancyPct >= 70 ? 'Healthy' : kpis.occupancyPct > 0 ? 'Moderate' : 'No stays'}
          deltaTone={kpis.occupancyPct >= 70 ? 'positive' : kpis.occupancyPct > 0 ? 'warning' : 'neutral'}
          helper={`${kpis.totalRoomsCount} total rooms`}
          icon={Percent}
          onClick={() => onNavigateTab('rooms')}
        />
        <KpiCard
          label="ADR"
          value={formatCurrency(kpis.adr, currency, symbol)}
          helper="Avg Daily Rate"
          icon={TrendingUp}
          onClick={() => onNavigateTab('channel_manager')}
        />
        <KpiCard
          label="RevPAR"
          value={formatCurrency(kpis.revPar, currency, symbol)}
          helper="Rev Per Available Room"
          icon={Layers}
          onClick={() => onNavigateTab('reporting_bi')}
        />
        <KpiCard
          label="Rooms Sold"
          value={kpis.roomsSold.toLocaleString()}
          helper="Occupied room-nights"
          icon={BedDouble}
          onClick={() => onNavigateTab('front_office')}
        />
        <KpiCard
          label="Outstanding Receivables"
          value={formatCurrency(kpis.outstandingReceivables, currency, symbol, { compact: true })}
          delta={kpis.outstandingReceivables > 0 ? 'Open AR' : 'Settled'}
          deltaTone={kpis.outstandingReceivables > 0 ? 'warning' : 'positive'}
          helper={`Folios + City Ledger`}
          icon={CreditCard}
          onClick={() => onNavigateTab('city_ledger')}
        />
      </div>

      {/* Live Property & Room Inventory Status Strip */}
      <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE]">
            <BedDouble className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
            <span>Rooms Live Status</span>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
            {rooms.length} / {kpis.totalRoomsCount} Inventory Rooms
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EBE7] dark:divide-[#22322C]">
          {[
            {
              label: 'Occupied',
              count: kpis.roomStatusCounts.occupied,
              tone: 'text-[#173F35] dark:text-[#C6A15B]',
              tab: 'front_office',
            },
            {
              label: 'Vacant Ready',
              count: kpis.roomStatusCounts.vacantClean,
              tone: 'text-emerald-700 dark:text-emerald-400',
              tab: 'rooms',
            },
            {
              label: 'Dirty Turnover',
              count: kpis.roomStatusCounts.vacantDirty,
              tone: 'text-amber-700 dark:text-amber-400',
              tab: 'housekeeping',
            },
            {
              label: 'Out of Order',
              count: kpis.roomStatusCounts.outOfOrder,
              tone: 'text-rose-700 dark:text-rose-400',
              tab: 'maintenance',
            },
          ].map((bucket) => {
            const pct = rooms.length > 0 ? Math.round((bucket.count / rooms.length) * 100) : 0;
            return (
              <button
                key={bucket.label}
                type="button"
                onClick={() => onNavigateTab(bucket.tab)}
                className="px-5 py-3.5 text-left hover:bg-[#F6F8F6]/70 dark:hover:bg-[#192622]/70 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199]">{bucket.label}</div>
                  <div className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${bucket.tone}`}>
                    {bucket.count}
                  </div>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts Row 1: Revenue Trend + Department Revenue Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily & Period Revenue Performance Chart */}
        <div className="lg:col-span-2 p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Revenue &amp; Occupancy Trend
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                Daily gross revenue ({currency}) alongside room occupancy percentage from Night Audit records.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#78837D] dark:text-[#92A199] shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#173F35] dark:bg-[#246353]" />
                Gross Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#C6A15B]" />
                Occupancy %
              </span>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No revenue flash periods in selected range"
              description="Close a day in Night Audit & EOD or adjust the date filter to view daily revenue and occupancy trends."
              action={
                <button
                  type="button"
                  onClick={() => onNavigateTab('night_audit')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#173F35] text-white text-xs font-medium"
                >
                  Open Night Audit
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="h-52 flex items-end gap-2 sm:gap-3 pt-4 pb-1 border-b border-[#E6EBE7] dark:border-[#22322C]">
                {filteredReports.slice(-14).map((rep) => {
                  const barHeightPct = Math.max(6, Math.round((rep.totalGrossRevenue / maxDailyRev) * 100));
                  return (
                    <div key={rep.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-2 bg-[#202B27] text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 font-mono tabular-nums">
                        {rep.date}: {formatCurrency(rep.totalGrossRevenue, currency, symbol)} · {rep.occupancyRate.toFixed(0)}%
                      </div>
                      <div className="w-full max-w-[36px] flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-[10px] font-mono tabular-nums text-[#C6A15B] font-semibold">
                          {rep.occupancyRate.toFixed(0)}%
                        </span>
                        <div
                          className="w-full rounded-t-md bg-[#173F35] dark:bg-[#246353] group-hover:bg-[#647B52] transition-colors"
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#78837D] dark:text-[#92A199] overflow-x-auto">
                {filteredReports.slice(-14).map((rep) => (
                  <span key={rep.id} className="flex-1 text-center truncate">
                    {rep.date.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Department Revenue Comparison */}
        <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              Department Revenue Mix
            </h2>
            <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
              Revenue contribution across core hotel streams.
            </p>
          </div>

          {deptRevenueTotal === 0 ? (
            <div className="py-8 text-center text-xs text-[#78837D]">
              No departmental revenue breakdowns logged for this period.
            </div>
          ) : (
            <div className="space-y-4 my-4">
              {[
                { label: 'Rooms Division', amount: kpis.roomsRevFromReports, barColor: 'bg-[#173F35] dark:bg-[#246353]' },
                { label: 'Kitchen & Dining (Food)', amount: kpis.foodRevFromReports, barColor: 'bg-[#647B52]' },
                { label: 'Bar & Wine Cellar (Beverage)', amount: kpis.bevRevFromReports, barColor: 'bg-[#C6A15B]' },
                { label: 'Spa, Events & Ancillary', amount: kpis.otherRevFromReports, barColor: 'bg-[#78837D]' },
              ].map((stream) => {
                const pct = deptRevenueTotal > 0 ? (stream.amount / deptRevenueTotal) * 100 : 0;
                return (
                  <div key={stream.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{stream.label}</span>
                      <span className="font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE] font-semibold">
                        {formatCurrency(stream.amount, currency, symbol)}{' '}
                        <span className="text-[#78837D] font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F6F8F6] dark:bg-[#192622] overflow-hidden">
                      <div className={`h-full rounded-full ${stream.barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs">
            <span className="text-[#78837D]">Folio AR vs City Ledger</span>
            <span className="font-mono tabular-nums font-medium text-[#202B27] dark:text-[#ECF1EE]">
              {formatCurrency(kpis.folioReceivables, currency, symbol, { compact: true })} /{' '}
              {formatCurrency(kpis.cityLedgerReceivables, currency, symbol, { compact: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Budget vs Actual & KPI Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Department Performance & Budget vs Actual Summary */}
        <div className="lg:col-span-2 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Department Budget vs Actual Spend
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Operating budget allocation compared with recorded purchase requisitions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('departments')}
              className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:underline whitespace-nowrap"
            >
              Manage Departments →
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#F6F8F6] dark:bg-[#192622] border-b border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] dark:text-[#92A199]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Department</th>
                  <th className="px-4 py-2.5 font-semibold">Lead</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Budget</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Actual Spend</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Utilization</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                {departmentSummary.slice(0, 8).map((d) => (
                  <tr key={d.id} className="hover:bg-[#F6F8F6]/70 dark:hover:bg-[#192622]/70">
                    <td className="px-4 py-2.5 font-medium text-[#202B27] dark:text-[#ECF1EE]">
                      <span className="font-mono text-[11px] text-[#78837D] mr-2">{d.code}</span>
                      {d.name}
                    </td>
                    <td className="px-4 py-2.5 text-[#78837D] dark:text-[#92A199]">{d.head}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(d.budget, currency, symbol)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(d.actualSpend, currency, symbol)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {d.utilizationPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={d.utilizationPct > 95 ? 'Near Cap' : d.status === 'active' ? 'Nominal' : 'Inactive'}
                        tone={d.utilizationPct > 95 ? 'warning' : d.status === 'active' ? 'success' : 'neutral'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Target Benchmarks (from BI KPI Targets) */}
        <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                KPI Target Attainment
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">Property targets vs actuals</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reporting_bi')}
              className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:underline"
            >
              BI Hub →
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {kpiTargets.slice(0, 5).map((item) => (
              <div
                key={item.kpiKey}
                className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] break-words">{item.label}</div>
                  <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums mt-0.5">
                    Actual: {item.actualValue}{item.unit === '%' ? '%' : ''} / Target: {item.targetValue}{item.unit === '%' ? '%' : ''}
                  </div>
                </div>
                <StatusBadge
                  label={item.status.replace('_', ' ')}
                  tone={item.status === 'exceeded' || item.status === 'on_track' ? 'success' : 'warning'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Governance Row: Pending Approvals, Critical Alerts, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending Approvals */}
        <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Pending Approvals ({pendingApprovals.length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] max-h-72 overflow-y-auto">
            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#78837D]">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                All requisitions and leave approvals are up to date.
              </div>
            ) : (
              pendingApprovals.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab(item.tab)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] break-words">{item.title}</div>
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199] break-words mt-0.5">{item.detail}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#78837D] shrink-0 mt-0.5" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Critical Operational Alerts */}
        <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Critical Operational Alerts ({operationalAlerts.length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] max-h-72 overflow-y-auto">
            {operationalAlerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#78837D]">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                No critical operational exceptions detected.
              </div>
            ) : (
              operationalAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => onNavigateTab(alert.tab)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors flex items-start justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] break-words">{alert.title}</div>
                      <div className="text-[11px] text-[#78837D] dark:text-[#92A199] break-words mt-0.5">{alert.detail}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#78837D] shrink-0 mt-0.5" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#647B52]" />
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Recent Property Activity
              </h2>
            </div>
          </div>
          <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] max-h-72 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#78837D]">
                No recent audit activity recorded for this property.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] truncate">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[#78837D] shrink-0">
                      {log.timestamp.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5 line-clamp-2">
                    {log.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
