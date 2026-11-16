/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Central Reservations System (CRS), Channel Manager Engine,
 * Dynamic Pricing Yield Rules, Rate Parity Monitor & Direct Booking Simulator
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Hotel,
  ChannelConnection,
  RateParityCheck,
  DynamicYieldRule,
  RatePlan,
  DirectWebBookingRequest,
  RoomType,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Globe,
  RefreshCw,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Calendar,
  Sparkles,
  Zap,
  Tag,
  ShieldCheck,
  CreditCard,
  Plus,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  DataTable,
  Modal,
  EmptyState,
  SampleDataBadge,
  type DataTableColumn,
  type StatusTone,
} from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';

interface ChannelManagerAndCRSProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const ChannelManagerAndCRS: React.FC<ChannelManagerAndCRSProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<
    'channels' | 'parity' | 'yield' | 'rate_plans' | 'booking_engine'
  >('channels');
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);

  // Storage state
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [parityChecks, setParityChecks] = useState<RateParityCheck[]>([]);
  const [yieldRules, setYieldRules] = useState<DynamicYieldRule[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [directBookings, setDirectBookings] = useState<DirectWebBookingRequest[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Dynamic Yield Simulator state
  const [simulatedOccupancy, setSimulatedOccupancy] = useState<number>(85);

  // New Rule Modal state
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    ruleName: '',
    ruleType: 'occupancy_surge' as DynamicYieldRule['ruleType'],
    condition: '',
    adjustmentType: 'percentage_increase' as DynamicYieldRule['adjustmentType'],
    adjustmentValue: 10,
    autoApplyToOta: true,
  });

  // Direct Booking Simulator state
  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    roomTypeId: '',
    ratePlanId: '',
    checkInDate: new Date().toISOString().slice(0, 10),
    checkOutDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    adultsCount: 2,
    childrenCount: 0,
    specialRequests: '',
    promoCode: '',
    paymentStatus: 'guaranteed_card' as 'guaranteed_card' | 'paid_telebirr' | 'pay_at_hotel',
  });

  const loadData = useCallback(() => {
    if (!hotelId) {
      setChannels([]);
      setParityChecks([]);
      setYieldRules([]);
      setRatePlans([]);
      setDirectBookings([]);
      setRoomTypes([]);
      return;
    }

    const fetchedChannels = saasStorage.getChannelConnections(hotelId);
    const fetchedParity = saasStorage.getRateParityChecks(hotelId);
    const fetchedRules = saasStorage.getDynamicYieldRules(hotelId);
    const fetchedPlans = saasStorage.getRatePlans(hotelId);
    const fetchedBookings = saasStorage.getDirectWebBookings(hotelId);
    const fetchedRoomTypes = saasStorage.getRoomTypes(hotelId);

    setChannels(fetchedChannels);
    setParityChecks(fetchedParity);
    setYieldRules(fetchedRules);
    setRatePlans(fetchedPlans);
    setDirectBookings(fetchedBookings);
    setRoomTypes(fetchedRoomTypes);

    setBookingForm((prev) => ({
      ...prev,
      roomTypeId: fetchedRoomTypes.some((rt) => rt.id === prev.roomTypeId)
        ? prev.roomTypeId
        : fetchedRoomTypes[0]?.id || 'rt_01',
      ratePlanId: fetchedPlans.some((rp) => rp.id === prev.ratePlanId)
        ? prev.ratePlanId
        : fetchedPlans[0]?.id || 'rp_01',
    }));
  }, [hotelId]);

  useEffect(() => {
    setIsNewRuleOpen(false);
    setSyncingChannelId(null);
    loadData();
  }, [hotelId, loadData]);

  const metrics = useMemo(() => {
    const totalRev = channels.reduce((acc, c) => acc + c.monthlyRevenueETB, 0);
    const directChannel = channels.find((c) => c.channelCode === 'hotel_direct');
    const directRev = directChannel ? directChannel.monthlyRevenueETB : 0;
    const directShare = totalRev > 0 ? Math.round((directRev / totalRev) * 100) : 0;
    const activeBookings = channels.reduce((acc, c) => acc + c.activeReservationsCount, 0);

    const nonDirect = channels.filter((c) => c.channelCode !== 'hotel_direct');
    const blendedCommission =
      nonDirect.length > 0
        ? (nonDirect.reduce((acc, c) => acc + c.commissionPercent, 0) / nonDirect.length).toFixed(1)
        : '0';

    return {
      totalRev,
      directRev,
      directShare,
      activeBookings,
      blendedCommission,
      connectedChannelsCount: channels.filter((c) => c.status === 'connected').length,
    };
  }, [channels]);

  const handleTriggerSync = (channel: ChannelConnection) => {
    setSyncingChannelId(channel.id);
    setTimeout(() => {
      try {
        const actor = {
          email: currentUser?.email || 'admin@hotel.com',
          fullName: currentUser?.fullName || 'Hotel Admin',
          role: currentUser?.role || 'hotel_admin',
        };
        const updated = saasStorage.triggerChannelSync(channel.id, actor);
        setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast(`ARI pushed to ${channel.channelName}`, {
          variant: 'success',
          description: 'Live Availability, Rates & Inventory synchronized.',
        });
      } catch (err: unknown) {
        toast('Channel sync failed', {
          variant: 'error',
          description: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setSyncingChannelId(null);
      }
    }, 800);
  };

  const handleToggleYieldRule = (ruleId: string) => {
    const actor = {
      email: currentUser?.email || 'admin@hotel.com',
      fullName: currentUser?.fullName || 'Hotel Admin',
      role: currentUser?.role || 'hotel_admin',
    };
    saasStorage.toggleDynamicYieldRule(ruleId, actor);
    setYieldRules(saasStorage.getDynamicYieldRules(hotelId));
    toast('Yield rule status updated', { variant: 'info' });
  };

  const handleCreateYieldRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newRuleForm.ruleName || !newRuleForm.condition) return;

    const actor = {
      email: currentUser?.email || 'admin@hotel.com',
      fullName: currentUser?.fullName || 'Hotel Admin',
      role: currentUser?.role || 'hotel_admin',
    };

    const created = saasStorage.createDynamicYieldRule(
      {
        hotelId,
        ruleName: newRuleForm.ruleName,
        ruleType: newRuleForm.ruleType,
        condition: newRuleForm.condition,
        adjustmentType: newRuleForm.adjustmentType,
        adjustmentValue: Number(newRuleForm.adjustmentValue),
        targetChannels: ['hotel_direct', 'booking_com', 'expedia'],
        isActive: true,
        autoApplyToOta: newRuleForm.autoApplyToOta,
      },
      actor
    );

    setYieldRules((prev) => [created, ...prev]);
    setIsNewRuleOpen(false);
    setNewRuleForm({
      ruleName: '',
      ruleType: 'occupancy_surge',
      condition: '',
      adjustmentType: 'percentage_increase',
      adjustmentValue: 10,
      autoApplyToOta: true,
    });
    toast(`Dynamic Yield Rule "${created.ruleName}" activated`, { variant: 'success' });
  };

  const handleSimulateDirectBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !bookingForm.guestName || !bookingForm.guestEmail) return;

    const start = new Date(bookingForm.checkInDate);
    const end = new Date(bookingForm.checkOutDate);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

    const selectedRt = roomTypes.find((rt) => rt.id === bookingForm.roomTypeId);
    let baseDailyRate = selectedRt?.standardRate ?? 4200;
    if (!selectedRt) {
      if (bookingForm.roomTypeId === 'rt_02') baseDailyRate = 7500;
      if (bookingForm.roomTypeId === 'rt_03') baseDailyRate = 14000;
    }

    let discountMultiplier = 1.0;
    if (bookingForm.promoCode.toUpperCase() === 'SEAMDIRECT') discountMultiplier = 0.9;
    if (bookingForm.promoCode.toUpperCase() === 'DIPLOMATIC_VIP') discountMultiplier = 0.85;

    const total = Math.round(baseDailyRate * nights * discountMultiplier);

    const actor = {
      email: currentUser?.email || 'guest@directweb.com',
      fullName: currentUser?.fullName || 'Online Booking Guest',
      role: 'guest',
    };

    const newBooking = saasStorage.submitDirectWebBooking(
      {
        hotelId,
        guestName: bookingForm.guestName,
        guestEmail: bookingForm.guestEmail,
        guestPhone: bookingForm.guestPhone || '+251 90 000 0000',
        roomTypeId: bookingForm.roomTypeId,
        ratePlanId: bookingForm.ratePlanId,
        checkInDate: bookingForm.checkInDate,
        checkOutDate: bookingForm.checkOutDate,
        adultsCount: bookingForm.adultsCount,
        childrenCount: bookingForm.childrenCount,
        specialRequests: bookingForm.specialRequests,
        totalPrice: total,
        currency,
        promoCodeUsed: bookingForm.promoCode || undefined,
        paymentStatus: bookingForm.paymentStatus,
      },
      actor
    );

    setDirectBookings((prev) => [newBooking, ...prev]);
    toast(`Direct booking #${newBooking.id.toUpperCase()} confirmed`, {
      variant: 'success',
      description: `Total ${formatCurrency(total, currency, currencySymbol)} · 0% OTA commission.`,
    });
    setBookingForm({
      ...bookingForm,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      specialRequests: '',
      promoCode: '',
    });
  };

  const channelColumns: DataTableColumn<ChannelConnection>[] = [
    {
      key: 'channel',
      header: 'Channel Name & Code',
      sortable: true,
      sortValue: (c) => c.channelName,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center font-mono font-semibold text-xs shrink-0">
            {c.channelCode.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
              <span>{c.channelName}</span>
              {c.channelCode === 'hotel_direct' && (
                <StatusBadge tone="success" label="0% Comm" />
              )}
            </div>
            <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
              {c.channelCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Distribution Type',
      render: (c) => (
        <StatusBadge tone="neutral" label={c.channelType.replace(/_/g, ' ')} />
      ),
    },
    {
      key: 'commission',
      header: 'Commission',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.commissionPercent,
      render: (c) => <span className="font-mono font-semibold">{c.commissionPercent}%</span>,
    },
    {
      key: 'status',
      header: 'Sync Status',
      render: (c) => (
        <StatusBadge
          tone={c.status === 'connected' ? 'success' : 'warning'}
          label={c.status}
        />
      ),
    },
    {
      key: 'stays',
      header: 'Active Stays',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.activeReservationsCount,
      render: (c) => <span className="font-mono">{c.activeReservationsCount} Bookings</span>,
    },
    {
      key: 'revenue',
      header: 'Monthly Revenue',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.monthlyRevenueETB,
      render: (c) => (
        <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
          {formatCurrency(c.monthlyRevenueETB, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => {
        const isSyncing = syncingChannelId === c.id;
        return (
          <button
            type="button"
            onClick={() => handleTriggerSync(c)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] hover:border-[#647B52] text-[#173F35] dark:text-[#C6A15B] text-[11px] font-medium disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Push ARI'}</span>
          </button>
        );
      },
    },
  ];

  if (!activeHotel) {
    return (
      <EmptyState
        title="No property selected"
        description="Select a hotel property to manage OTA channel connectors, yield rules, and rate parity."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Revenue & Channels', 'CRS & Yield Management']}
        title="Channel Manager, Rate Parity & Dynamic Yield Engine"
        subtitle="Two-way ARI synchronization with OTA partners, automated rate parity monitoring, and brand direct booking controls."
        meta={<SampleDataBadge label="Sample data & Simulator" />}
        actions={
          <button
            type="button"
            onClick={() => channels.forEach((c) => handleTriggerSync(c))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync All OTAs (ARI Push)</span>
          </button>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Connected Channels"
          value={`${metrics.connectedChannelsCount} / ${channels.length}`}
          helper="Two-way XML sync active"
          deltaTone="forest"
          icon={Globe}
        />
        <KpiCard
          label="Monthly OTA Revenue"
          value={formatCurrency(metrics.totalRev, currency, currencySymbol, { compact: true })}
          helper={`${metrics.activeBookings} active reservations`}
          deltaTone="positive"
          icon={DollarSign}
        />
        <KpiCard
          label="Direct Booking Share"
          value={`${metrics.directShare}% Direct`}
          helper="0% OTA commission retained"
          deltaTone="positive"
          icon={Sparkles}
        />
        <KpiCard
          label="Blended OTA Margin"
          value={`${metrics.blendedCommission}%`}
          helper="Average OTA commission cost"
          icon={Percent}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-1 overflow-x-auto">
        {[
          { id: 'channels', label: 'OTA Channels & ARI Sync', icon: Globe, count: channels.length },
          { id: 'parity', label: 'Rate Parity Monitor', icon: ShieldCheck, count: parityChecks.length },
          { id: 'yield', label: 'Dynamic Yield Rules', icon: TrendingUp, count: yieldRules.length },
          { id: 'rate_plans', label: 'Rate Plans & Packages', icon: Tag, count: ratePlans.length },
          { id: 'booking_engine', label: 'Direct Booking Simulator', icon: ExternalLink },
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

      {/* TAB 1: OTA CHANNELS */}
      {activeTab === 'channels' && (
        <DataTable
          data={channels}
          columns={channelColumns}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search channel name or code..."
          searchFilter={(c, q) =>
            c.channelName.toLowerCase().includes(q) || c.channelCode.toLowerCase().includes(q)
          }
          onExportCsv={() => {
            downloadCsvFile(
              `SEAM_Channel_Distribution_${new Date().toISOString().slice(0, 10)}.csv`,
              ['Channel', 'Code', 'Type', 'Commission %', 'Status', 'Active Bookings', 'Monthly Revenue'],
              channels.map((c) => [
                c.channelName,
                c.channelCode,
                c.channelType,
                c.commissionPercent,
                c.status,
                c.activeReservationsCount,
                c.monthlyRevenueETB,
              ])
            );
            toast('Channel distribution report exported', { variant: 'success' });
          }}
          emptyTitle="No distribution channels configured"
        />
      )}

      {/* TAB 2: RATE PARITY MONITOR */}
      {activeTab === 'parity' && (
        <div className="space-y-4">
          <div className="seam-surface p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Rate Parity Surveillance Active
              </div>
              <p className="text-[#78837D] dark:text-[#92A199] mt-0.5">
                Monitors OTA Channel A, OTA Channel B, and OTA Channel C rate parity against direct hotel web BAR to
                prevent unauthorized OTA undercutting.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {parityChecks.map((p) => {
              const isUndercut = p.parityStatus === 'ota_undercut';
              const isDirectCheaper = p.parityStatus === 'direct_cheaper';
              const tone: StatusTone = isUndercut ? 'critical' : isDirectCheaper ? 'forest' : 'success';
              const label = isUndercut
                ? 'OTA Undercut'
                : isDirectCheaper
                ? 'Direct Cheaper'
                : 'In Parity';

              return (
                <div key={p.id} className="seam-surface p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-medium text-[#78837D] dark:text-[#92A199]">
                        {p.targetDate}
                      </span>
                      <StatusBadge tone={tone} label={label} />
                    </div>

                    <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-3">
                      {p.roomTypeName}
                    </h3>

                    <div className="space-y-2 bg-[#F6F8F6] dark:bg-[#192622] p-3 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-mono">
                      <div className="flex items-center justify-between font-semibold text-[#173F35] dark:text-[#C6A15B]">
                        <span className="font-sans">Direct Hotel Web:</span>
                        <span>{formatCurrency(p.directWebRate, currency, currencySymbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#78837D] dark:text-[#92A199]">
                        <span className="font-sans">OTA Channel A:</span>
                        <span>{formatCurrency(p.bookingComRate, currency, currencySymbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#78837D] dark:text-[#92A199]">
                        <span className="font-sans">OTA Channel B:</span>
                        <span>{formatCurrency(p.expediaRate, currency, currencySymbol)}</span>
                      </div>
                      <div
                        className={`flex items-center justify-between ${
                          p.agodaRate < p.directWebRate
                            ? 'text-rose-700 dark:text-rose-400 font-semibold'
                            : 'text-[#78837D] dark:text-[#92A199]'
                        }`}
                      >
                        <span className="font-sans">OTA Channel C:</span>
                        <span>{formatCurrency(p.agodaRate, currency, currencySymbol)}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-[#78837D] dark:text-[#92A199]">
                      <strong className="text-[#202B27] dark:text-[#ECF1EE]">Action:</strong>{' '}
                      {p.recommendedAction}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
                      {new Date(p.lastCheckedAt).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toast(`Parity audit notice dispatched for ${p.roomTypeName}`, {
                          variant: 'info',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
                    >
                      Audit Feed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC YIELD RULES */}
      {activeTab === 'yield' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#78837D] dark:text-[#92A199]">
              Automated channel pricing adjustments driven by occupancy compression and booking windows.
            </p>
            <button
              type="button"
              onClick={() => setIsNewRuleOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Yield Rule</span>
            </button>
          </div>

          <div className="seam-surface p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Interactive Yield Simulation</span>
                </h3>
                <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                  Adjust simulated occupancy to preview BAR dynamic surge pricing above 80%.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={simulatedOccupancy}
                  onChange={(e) => setSimulatedOccupancy(Number(e.target.value))}
                  className="w-36 accent-[#173F35] cursor-pointer"
                />
                <span className="font-mono font-semibold text-sm text-[#173F35] dark:text-[#C6A15B] w-12 text-right">
                  {simulatedOccupancy}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
              {(roomTypes.length > 0
                ? roomTypes.slice(0, 3).map((rt) => ({ name: rt.name, base: rt.standardRate }))
                : [
                    { name: 'Standard Deluxe', base: 4200 },
                    { name: 'Executive Suite', base: 7500 },
                    { name: 'Presidential Villa', base: 14000 },
                  ]
              ).map((tier) => {
                const surged = simulatedOccupancy > 80;
                const price = surged ? Math.round(tier.base * 1.15) : tier.base;
                return (
                  <div
                    key={tier.name}
                    className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]"
                  >
                    <div className="text-[#78837D] dark:text-[#92A199]">{tier.name}</div>
                    <div className="text-base font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                      {formatCurrency(price, currency, currencySymbol)}
                    </div>
                    <div className="text-[11px] text-[#173F35] dark:text-[#C6A15B] font-medium">
                      {surged ? '+15% Compression Surge' : 'Standard BAR Rate'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yieldRules.map((r) => (
              <div key={r.id} className="seam-surface p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge tone="neutral" label={r.ruleType.replace(/_/g, ' ')} />
                    <button
                      type="button"
                      onClick={() => handleToggleYieldRule(r.id)}
                      className="cursor-pointer"
                    >
                      <StatusBadge
                        tone={r.isActive ? 'success' : 'neutral'}
                        label={r.isActive ? 'Active' : 'Disabled'}
                      />
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    {r.ruleName}
                  </h3>
                  <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1">
                    <strong className="text-[#202B27] dark:text-[#ECF1EE]">Trigger:</strong>{' '}
                    {r.condition}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#173F35] dark:text-[#C6A15B]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {r.adjustmentType === 'min_los'
                        ? `${r.adjustmentValue} Nights Min Stay`
                        : `${r.adjustmentValue}% ${r.adjustmentType.replace(/_/g, ' ')}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-[11px] text-[#78837D] dark:text-[#92A199]">
                  <span>Channels: {r.targetChannels.join(', ')}</span>
                  <span>{r.autoApplyToOta ? 'Auto-Push OTAs' : 'Direct Only'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RATE PLANS */}
      {activeTab === 'rate_plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ratePlans.map((rp) => (
            <div key={rp.id} className="seam-surface p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C]">
                    {rp.code}
                  </span>
                  <StatusBadge tone="neutral" label={rp.mealPlan.replace(/_/g, ' ')} />
                </div>

                <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {rp.name}
                </h3>
                <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1">{rp.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rp.includedPerks.map((perk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] bg-[#F6F8F6] dark:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] border border-[#E6EBE7] dark:border-[#22322C]"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs">
                <span className="text-[#78837D] dark:text-[#92A199] capitalize">
                  Policy: {rp.cancellationPolicy.replace(/_/g, ' ')}
                </span>
                {rp.baseDiscountPercent > 0 && (
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    -{rp.baseDiscountPercent}% Base Discount
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: DIRECT WEB BOOKING SIMULATOR */}
      {activeTab === 'booking_engine' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 seam-surface p-5">
            <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
              <span>Direct Web Reservation Intake</span>
            </h3>

            <form onSubmit={handleSimulateDirectBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.checkInDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })}
                    className="w-full p-2 seam-input font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.checkOutDate}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, checkOutDate: e.target.value })
                    }
                    className="w-full p-2 seam-input font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Room Category
                  </label>
                  <select
                    value={bookingForm.roomTypeId}
                    onChange={(e) => setBookingForm({ ...bookingForm, roomTypeId: e.target.value })}
                    className="w-full p-2 seam-input"
                  >
                    {roomTypes.length > 0 ? (
                      roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} ({rt.standardRate.toLocaleString()} {currency}/night)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="rt_01">Deluxe Room (4,200 {currency}/night)</option>
                        <option value="rt_02">Executive Suite (7,500 {currency}/night)</option>
                        <option value="rt_03">Presidential Villa (14,000 {currency}/night)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Rate Plan
                  </label>
                  <select
                    value={bookingForm.ratePlanId}
                    onChange={(e) => setBookingForm({ ...bookingForm, ratePlanId: e.target.value })}
                    className="w-full p-2 seam-input"
                  >
                    {ratePlans.map((rp) => (
                      <option key={rp.id} value={rp.id}>
                        {rp.name} ({rp.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Guest full name"
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                    className="w-full p-2 seam-input"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={bookingForm.guestEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                    className="w-full p-2 seam-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    placeholder="SEAMDIRECT (-10%)"
                    value={bookingForm.promoCode}
                    onChange={(e) => setBookingForm({ ...bookingForm, promoCode: e.target.value })}
                    className="w-full p-2 seam-input uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Payment Guarantee
                  </label>
                  <select
                    value={bookingForm.paymentStatus}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        paymentStatus: e.target.value as
                          | 'guaranteed_card'
                          | 'paid_telebirr'
                          | 'pay_at_hotel',
                      })
                    }
                    className="w-full p-2 seam-input"
                  >
                    <option value="guaranteed_card">Credit Card Guarantee</option>
                    <option value="paid_telebirr">Telebirr Instant Settlement</option>
                    <option value="pay_at_hotel">Pay Upon Check-in</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Special Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="High floor, airport pickup, quiet wing..."
                  value={bookingForm.specialRequests}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, specialRequests: e.target.value })
                  }
                  className="w-full p-2 seam-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Confirm Direct Web Booking (0% Commission)</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 seam-surface p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Recent Direct Web Bookings
                </h3>
                <StatusBadge tone="forest" label={`${directBookings.length} Ingested`} />
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
                {directBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      <span>{b.guestName}</span>
                      <span className="font-mono text-[#173F35] dark:text-[#C6A15B]">
                        {formatCurrency(b.totalPrice, b.currency)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5 font-mono">
                      {b.checkInDate} → {b.checkOutDate} · {b.paymentStatus.replace(/_/g, ' ')}
                    </div>
                    {b.promoCodeUsed && (
                      <div className="mt-1.5">
                        <StatusBadge tone="success" label={`Code: ${b.promoCodeUsed}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-[11px] flex items-center justify-between font-mono">
              <span className="text-[#78837D] dark:text-[#92A199]">
                Direct:{' '}
                {formatCurrency(
                  directBookings.reduce((acc, b) => acc + b.totalPrice, 0),
                  currency,
                  currencySymbol
                )}
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Saved ~
                {formatCurrency(
                  Math.round(directBookings.reduce((acc, b) => acc + b.totalPrice, 0) * 0.18),
                  currency,
                  currencySymbol
                )}{' '}
                OTA fees
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW DYNAMIC YIELD RULE */}
      <Modal
        open={isNewRuleOpen}
        onClose={() => setIsNewRuleOpen(false)}
        title="Create Dynamic Yield Pricing Rule"
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsNewRuleOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-yield-rule-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Activate Rule
            </button>
          </>
        }
      >
        <form id="new-yield-rule-form" onSubmit={handleCreateYieldRule} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Festival Weekend Surge (+20%)"
              value={newRuleForm.ruleName}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, ruleName: e.target.value })}
              className="w-full p-2 seam-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Rule Type
              </label>
              <select
                value={newRuleForm.ruleType}
                onChange={(e) =>
                  setNewRuleForm({
                    ...newRuleForm,
                    ruleType: e.target.value as DynamicYieldRule['ruleType'],
                  })
                }
                className="w-full p-2 seam-input"
              >
                <option value="occupancy_surge">Occupancy Surge</option>
                <option value="last_minute_flash">Last-Minute Flash</option>
                <option value="early_bird">Early Bird</option>
                <option value="length_of_stay_min">Min Length of Stay</option>
                <option value="weekend_peak">Weekend Peak</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Adjustment Type
              </label>
              <select
                value={newRuleForm.adjustmentType}
                onChange={(e) =>
                  setNewRuleForm({
                    ...newRuleForm,
                    adjustmentType: e.target.value as DynamicYieldRule['adjustmentType'],
                  })
                }
                className="w-full p-2 seam-input"
              >
                <option value="percentage_increase">% Surcharge (+)</option>
                <option value="percentage_discount">% Discount (-)</option>
                <option value="min_los">Min Nights (LOS)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Adjustment Value
              </label>
              <input
                type="number"
                value={newRuleForm.adjustmentValue}
                onChange={(e) =>
                  setNewRuleForm({ ...newRuleForm, adjustmentValue: Number(e.target.value) })
                }
                className="w-full p-2 seam-input font-mono"
                required
              />
            </div>

            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={newRuleForm.autoApplyToOta}
                onChange={(e) =>
                  setNewRuleForm({ ...newRuleForm, autoApplyToOta: e.target.checked })
                }
                className="accent-[#173F35] rounded"
              />
              <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                Auto-Push to OTAs
              </span>
            </label>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Trigger Condition *
            </label>
            <input
              type="text"
              placeholder="e.g. Occupancy > 85% or booking within 48h"
              value={newRuleForm.condition}
              onChange={(e) => setNewRuleForm({ ...newRuleForm, condition: e.target.value })}
              className="w-full p-2 seam-input"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
