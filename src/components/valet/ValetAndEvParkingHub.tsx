import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  Zap,
  Key,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Building,
  CreditCard,
} from 'lucide-react';
import { CurrentUser } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import {
  Hotel,
  ParkingBay,
  ValetTicket,
  EvChargingSession,
} from '../../types/saas';
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

interface ValetAndEvParkingHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const ValetAndEvParkingHub: React.FC<ValetAndEvParkingHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<'valet_desk' | 'parking_bays' | 'ev_fleet'>('valet_desk');
  const [valetTickets, setValetTickets] = useState<ValetTicket[]>([]);
  const [parkingBays, setParkingBays] = useState<ParkingBay[]>([]);
  const [evSessions, setEvSessions] = useState<EvChargingSession[]>([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [bayZoneFilter, setBayZoneFilter] = useState<string>('all');

  // Modals
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showNewEvModal, setShowNewEvModal] = useState(false);

  // New Valet Ticket Form State
  const [newTicket, setNewTicket] = useState({
    guestName: '',
    roomNumber: '',
    phoneNumber: '',
    vehicleMakeModel: '',
    licensePlate: '',
    assignedBayCode: '',
    keyPegSlot: '',
    conditionDamageNotes: '',
    valetAttendant: currentUser?.fullName || 'Valet Desk',
  });

  // New EV Session Form State
  const [newEvSession, setNewEvSession] = useState({
    bayCode: '',
    guestName: '',
    roomNumber: '',
    vehiclePlate: '',
    ratePerKwh: 18.0,
  });

  const loadData = useCallback(() => {
    if (!hotelId) {
      setValetTickets([]);
      setParkingBays([]);
      setEvSessions([]);
      return;
    }
    setValetTickets(saasStorage.getValetTickets(hotelId));
    setParkingBays(saasStorage.getParkingBays(hotelId));
    setEvSessions(saasStorage.getEvChargingSessions(hotelId));
  }, [hotelId]);

  useEffect(() => {
    setSearchQuery('');
    setTicketStatusFilter('all');
    setBayZoneFilter('all');
    setShowNewTicketModal(false);
    setShowNewEvModal(false);
    loadData();
  }, [hotelId, loadData]);

  // Handlers for Valet Actions
  const handleRequestRetrieval = (ticketId: string) => {
    const updated = saasStorage.requestValetRetrieval(ticketId, currentUser?.fullName || 'Front Desk Staff');
    if (updated) {
      loadData();
      toast(`Retrieval dispatched for #${updated.ticketNumber}`, {
        description: `Staging team alerted for ${updated.licensePlate}.`,
        variant: 'info',
      });
    }
  };

  const handleStageVehicle = (ticketId: string) => {
    const updated = saasStorage.stageValetVehicle(ticketId, currentUser?.fullName || 'Porte-Cochère Valet');
    if (updated) {
      loadData();
      toast(`Vehicle staged at curb (#${updated.ticketNumber})`, {
        description: `${updated.vehicleMakeModel} is ready at Porte-Cochère.`,
        variant: 'success',
      });
    }
  };

  const handleCompleteTicket = (ticketId: string) => {
    const updated = saasStorage.completeValetTicket(ticketId, currentUser?.fullName || 'Lead Valet');
    if (updated) {
      loadData();
      toast(`Handover completed (#${updated.ticketNumber})`, {
        description: `Keys released and bay ${updated.assignedBayCode} cleared.`,
        variant: 'success',
      });
    }
  };

  const handleCreateValetTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newTicket.guestName.trim() || !newTicket.licensePlate.trim() || !newTicket.assignedBayCode || !newTicket.keyPegSlot.trim()) {
      toast('Missing required valet fields', {
        description: 'Fill out Guest Name, License Plate, Assigned Bay, and Key Peg Slot.',
        variant: 'warning',
      });
      return;
    }

    const created = saasStorage.issueValetTicket({
      hotelId,
      guestName: newTicket.guestName.trim(),
      roomNumber: newTicket.roomNumber.trim() ? newTicket.roomNumber.trim() : undefined,
      phoneNumber: newTicket.phoneNumber.trim() || 'Not Provided',
      vehicleMakeModel: newTicket.vehicleMakeModel.trim() || 'Sedan / SUV',
      licensePlate: newTicket.licensePlate.trim().toUpperCase(),
      assignedBayCode: newTicket.assignedBayCode,
      keyPegSlot: newTicket.keyPegSlot.trim(),
      conditionDamageNotes: newTicket.conditionDamageNotes.trim() || undefined,
      valetAttendant: newTicket.valetAttendant || currentUser?.fullName || 'Valet Desk',
    });

    if (created) {
      loadData();
      setShowNewTicketModal(false);
      setNewTicket({
        guestName: '',
        roomNumber: '',
        phoneNumber: '',
        vehicleMakeModel: '',
        licensePlate: '',
        assignedBayCode: '',
        keyPegSlot: '',
        conditionDamageNotes: '',
        valetAttendant: currentUser?.fullName || 'Valet Desk',
      });
      toast(`Valet Ticket #${created.ticketNumber} issued`, {
        description: `Bay ${created.assignedBayCode} reserved • Key slot ${created.keyPegSlot}.`,
        variant: 'success',
      });
    }
  };

  // Handlers for EV Fleet
  const handleStartEvSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newEvSession.bayCode || !newEvSession.guestName.trim() || !newEvSession.vehiclePlate.trim()) {
      toast('Missing required EV session fields', {
        description: 'Select a Charger Bay and enter Guest Name and Vehicle Plate.',
        variant: 'warning',
      });
      return;
    }

    const created = saasStorage.startEvChargingSession({
      hotelId,
      bayCode: newEvSession.bayCode,
      guestName: newEvSession.guestName.trim(),
      roomNumber: newEvSession.roomNumber.trim() ? newEvSession.roomNumber.trim() : undefined,
      vehiclePlate: newEvSession.vehiclePlate.trim().toUpperCase(),
      ratePerKwh: newEvSession.ratePerKwh || 18.0,
    });

    if (created) {
      loadData();
      setShowNewEvModal(false);
      setNewEvSession({
        bayCode: '',
        guestName: '',
        roomNumber: '',
        vehiclePlate: '',
        ratePerKwh: 18.0,
      });
      toast(`EV charging started at ${created.bayCode}`, {
        description: `Active telemetry linked to vehicle ${created.vehiclePlate}.`,
        variant: 'success',
      });
    }
  };

  const handleBillEvToFolio = (sessionId: string) => {
    const success = saasStorage.billEvSessionToFolio(sessionId, currentUser?.fullName || 'Front Desk');
    if (success) {
      loadData();
      toast('EV session billed to folio', {
        description: 'Charging cost has been posted to the guest room folio.',
        variant: 'success',
      });
    } else {
      toast('Unable to post EV charge', {
        description: 'Verify that the guest has an active open room folio for this room.',
        variant: 'error',
      });
    }
  };

  const handleToggleBayStatus = (bayId: string, currentStatus: ParkingBay['status']) => {
    if (currentStatus === 'occupied') return;
    const newStatus: ParkingBay['status'] = currentStatus === 'available' ? 'maintenance' : 'available';
    saasStorage.updateParkingBayStatus(bayId, newStatus);
    loadData();
    toast(`Bay status updated`, {
      description: `Parking bay flagged as ${newStatus}.`,
      variant: 'info',
    });
  };

  // Metrics
  const activeTicketsCount = valetTickets.filter((t) => t.status !== 'completed').length;
  const curbStagedCount = valetTickets.filter((t) => t.status === 'staged_at_curb').length;
  const retrievalRequestedCount = valetTickets.filter((t) => t.status === 'retrieval_requested').length;
  const occupiedBaysCount = parkingBays.filter((b) => b.status === 'occupied').length;
  const totalBaysCount = parkingBays.length;
  const activeEvSessionsCount = evSessions.filter((s) => s.sessionStatus === 'charging').length;
  const totalEvKwhDelivered = evSessions.reduce((acc, curr) => acc + curr.kwhDelivered, 0);

  // Filtered lists
  const filteredTickets = valetTickets.filter((ticket) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ticket.ticketNumber.toLowerCase().includes(q) ||
      ticket.guestName.toLowerCase().includes(q) ||
      ticket.licensePlate.toLowerCase().includes(q) ||
      (ticket.roomNumber && ticket.roomNumber.toLowerCase().includes(q));
    const matchesStatus = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBays = parkingBays.filter((bay) => {
    return bayZoneFilter === 'all' || bay.zone === bayZoneFilter;
  });

  const handleExportEvCsv = () => {
    downloadCsvFile(
      `ev-charging-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Station/Bay', 'Guest', 'Room', 'Vehicle Plate', 'kWh Delivered', 'Rate/kWh', 'Total Charge', 'Status', 'Started At'],
      evSessions.map((s) => [
        s.bayCode,
        s.guestName,
        s.roomNumber || '',
        s.vehiclePlate,
        s.kwhDelivered,
        s.ratePerKwh,
        s.totalChargeEtb,
        s.sessionStatus,
        s.startedAt,
      ])
    );
    toast('EV charging ledger exported', { variant: 'info' });
  };

  const evColumns: DataTableColumn<EvChargingSession>[] = [
    {
      key: 'bayCode',
      header: 'Station / Bay',
      sortable: true,
      sortValue: (s) => s.bayCode,
      render: (s) => (
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#647B52] shrink-0" />
          <span className="font-mono font-semibold">{s.bayCode}</span>
        </div>
      ),
    },
    {
      key: 'guestName',
      header: 'Guest & Room',
      sortable: true,
      sortValue: (s) => s.guestName,
      render: (s) => (
        <div>
          <div className="font-medium">{s.guestName}</div>
          {s.roomNumber && (
            <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
              Room {s.roomNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'vehiclePlate',
      header: 'Vehicle Plate',
      render: (s) => (
        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[11px]">
          {s.vehiclePlate}
        </span>
      ),
    },
    {
      key: 'kwhDelivered',
      header: 'Energy',
      align: 'right',
      sortable: true,
      sortValue: (s) => s.kwhDelivered,
      render: (s) => (
        <div>
          <div className="font-mono font-semibold tabular-nums">{s.kwhDelivered.toFixed(1)} kWh</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums">
            {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'totalChargeEtb',
      header: `Charge (${currency})`,
      align: 'right',
      sortable: true,
      sortValue: (s) => s.totalChargeEtb,
      render: (s) => (
        <div>
          <div className="font-mono font-semibold tabular-nums">
            {formatCurrency(s.totalChargeEtb, currency, currencySymbol)}
          </div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono tabular-nums">
            {formatCurrency(s.ratePerKwh, currency, currencySymbol)}/kWh
          </div>
        </div>
      ),
    },
    {
      key: 'sessionStatus',
      header: 'Status',
      render: (s) =>
        s.sessionStatus === 'charging' ? (
          <StatusBadge label="Charging Live" tone="success" />
        ) : s.sessionStatus === 'completed' ? (
          <StatusBadge label="Ready to Bill" tone="warning" />
        ) : (
          <StatusBadge label="Billed to Folio" tone="forest" />
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end">
          {s.sessionStatus === 'charging' && (
            <button
              type="button"
              onClick={() => handleBillEvToFolio(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              Stop &amp; Bill
            </button>
          )}
          {s.sessionStatus === 'completed' && (
            <button
              type="button"
              onClick={() => handleBillEvToFolio(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white transition-colors whitespace-nowrap"
            >
              Post to Room Folio
            </button>
          )}
          {s.sessionStatus === 'billed_to_folio' && (
            <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Settled</span>
          )}
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'valet_desk' as const, label: 'Valet Dispatch Queue', count: valetTickets.length, icon: Car },
    { id: 'parking_bays' as const, label: 'Smart Parking Bays', count: parkingBays.length, icon: Building },
    { id: 'ev_fleet' as const, label: 'EV Stations & Folio Billing', count: evSessions.length, icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Valet & EV Parking Operations"
        subtitle="Porte-Cochère vehicle staging, electronic key peg locker management, bay zoning, and EV charging folio integration."
        breadcrumbs={['Operations', 'Valet & EV Parking']}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {activeHotel && (
              <span className="inline-flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#647B52]" />
                {activeHotel.name} • Arrival &amp; Fleet Desk
              </span>
            )}
            <SampleDataBadge label="Sample data & Simulator" />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowNewTicketModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Valet Ticket
            </button>
            <button
              type="button"
              onClick={() => setShowNewEvModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-[#647B52]" />
              Start EV Charge
            </button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Parked Vehicles"
          value={activeTicketsCount}
          helper={`${retrievalRequestedCount} requested • ${curbStagedCount} staged`}
          delta={retrievalRequestedCount > 0 ? 'Staging active' : undefined}
          deltaTone={retrievalRequestedCount > 0 ? 'warning' : 'forest'}
          icon={Car}
        />
        <KpiCard
          label="Parking Bay Occupancy"
          value={`${occupiedBaysCount} / ${totalBaysCount}`}
          helper="Smart zoned bays"
          delta={`${Math.round((occupiedBaysCount / (totalBaysCount || 1)) * 100)}% full`}
          deltaTone="neutral"
          icon={Building}
        />
        <KpiCard
          label="Active EV Charging"
          value={activeEvSessionsCount}
          helper="22 kW / 50 kW stations"
          delta="Telemetry live"
          deltaTone="positive"
          icon={Zap}
        />
        <KpiCard
          label="Total Energy Delivered"
          value={`${totalEvKwhDelivered.toFixed(1)} kWh`}
          helper={`Tariff ${formatCurrency(18, currency, currencySymbol)}/kWh default`}
          deltaTone="forest"
          icon={CreditCard}
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

      {/* TAB 1: VALET DISPATCH QUEUE */}
      {activeTab === 'valet_desk' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticket #, guest name, plate, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Ticket Statuses</option>
                <option value="parked">Parked in Bay</option>
                <option value="retrieval_requested">Retrieval Requested</option>
                <option value="staged_at_curb">Staged at Curb</option>
                <option value="completed">Completed / Handed Over</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE] transition-colors"
                aria-label="Refresh tickets"
                title="Refresh Tickets"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No valet tickets found"
              description="Issue a new digital valet ticket when arriving guests hand over vehicle keys at the Porte-Cochère."
              action={
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Issue Valet Ticket
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => {
                const isRetrievalRequested = ticket.status === 'retrieval_requested';
                const isStagedAtCurb = ticket.status === 'staged_at_curb';
                const isCompleted = ticket.status === 'completed';

                return (
                  <div
                    key={ticket.id}
                    className={`seam-surface p-4 flex flex-col justify-between space-y-4 ${
                      isRetrievalRequested
                        ? 'border-amber-300 dark:border-amber-800/70'
                        : isStagedAtCurb
                        ? 'border-emerald-300 dark:border-emerald-800/70'
                        : isCompleted
                        ? 'opacity-75'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                        <span className="text-xs font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C]">
                          {ticket.ticketNumber}
                        </span>
                        <StatusBadge
                          label={
                            ticket.status === 'retrieval_requested'
                              ? 'Retrieval Active'
                              : ticket.status === 'staged_at_curb'
                              ? 'Staged at Curb'
                              : ticket.status === 'completed'
                              ? 'Completed'
                              : 'Parked'
                          }
                          tone={
                            isRetrievalRequested
                              ? 'warning'
                              : isStagedAtCurb
                              ? 'success'
                              : isCompleted
                              ? 'neutral'
                              : 'forest'
                          }
                        />
                      </div>

                      <div className="mt-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE] break-words">
                            {ticket.guestName}
                          </div>
                          {ticket.roomNumber && (
                            <span className="text-[11px] font-mono font-medium text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C] shrink-0">
                              Room {ticket.roomNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#78837D] dark:text-[#92A199]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Car className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{ticket.vehicleMakeModel}</span>
                          </div>
                          <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C] text-[11px] shrink-0">
                            {ticket.licensePlate}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div className="seam-surface-subtle p-2.5">
                            <div className="text-[10px] text-[#78837D] dark:text-[#92A199] flex items-center gap-1">
                              <Building className="w-3 h-3" /> Assigned Bay
                            </div>
                            <div className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                              {ticket.assignedBayCode}
                            </div>
                          </div>

                          <div className="seam-surface-subtle p-2.5">
                            <div className="text-[10px] text-[#78837D] dark:text-[#92A199] flex items-center gap-1">
                              <Key className="w-3 h-3 text-[#C6A15B]" /> Key Peg Slot
                            </div>
                            <div className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] mt-0.5">
                              {ticket.keyPegSlot}
                            </div>
                          </div>
                        </div>

                        {ticket.conditionDamageNotes && (
                          <div className="seam-surface-subtle p-2.5 text-[11px] text-[#78837D] dark:text-[#92A199] flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>{ticket.conditionDamageNotes}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex items-center justify-between pt-1">
                          <span>Attendant: {ticket.valetAttendant}</span>
                          <span className="font-mono tabular-nums">
                            {new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
                      {ticket.status === 'parked' && (
                        <button
                          type="button"
                          onClick={() => handleRequestRetrieval(ticket.id)}
                          className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Dispatch Retrieval
                        </button>
                      )}

                      {ticket.status === 'retrieval_requested' && (
                        <button
                          type="button"
                          onClick={() => handleStageVehicle(ticket.id)}
                          className="w-full py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Car className="w-3.5 h-3.5" />
                          Stage at Porte-Cochère Curb
                        </button>
                      )}

                      {ticket.status === 'staged_at_curb' && (
                        <button
                          type="button"
                          onClick={() => handleCompleteTicket(ticket.id)}
                          className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Handover Keys &amp; Complete
                        </button>
                      )}

                      {ticket.status === 'completed' && (
                        <div className="text-center text-xs text-emerald-700 dark:text-emerald-400 font-medium py-1 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Handed Over to Guest
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SMART PARKING BAYS */}
      {activeTab === 'parking_bays' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Zones' },
                { id: 'basement_b1', label: 'Basement B1' },
                { id: 'porte_cochere', label: 'Porte-Cochère' },
                { id: 'ev_hub', label: 'EV Hub' },
                { id: 'surface_lot', label: 'Surface Lot' },
              ].map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setBayZoneFilter(zone.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    bayZoneFilter === zone.id
                      ? 'bg-[#173F35] text-white dark:bg-[#246353]'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {zone.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#78837D] dark:text-[#92A199]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#78837D]" /> Maintenance
              </span>
            </div>
          </div>

          {filteredBays.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No parking bays configured for this zone"
              description="Select another zone or check property parking bay configuration."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBays.map((bay) => {
                const isOccupied = bay.status === 'occupied';
                const isAvailable = bay.status === 'available';
                const isReserved = bay.status === 'reserved';

                return (
                  <div
                    key={bay.id}
                    className={`seam-surface p-4 flex flex-col justify-between ${
                      isOccupied
                        ? 'border-rose-300 dark:border-rose-900/60'
                        : isAvailable
                        ? 'border-emerald-300 dark:border-emerald-900/60'
                        : isReserved
                        ? 'border-amber-300 dark:border-amber-900/60'
                        : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {bay.bayCode}
                        </div>
                        <StatusBadge
                          label={bay.status}
                          tone={
                            isOccupied
                              ? 'critical'
                              : isAvailable
                              ? 'success'
                              : isReserved
                              ? 'warning'
                              : 'neutral'
                          }
                        />
                      </div>

                      <div className="mt-1.5 text-[11px] text-[#78837D] dark:text-[#92A199] capitalize">
                        {bay.zone.replace(/_/g, ' ')} • {bay.bayType.replace(/_/g, ' ')}
                      </div>

                      {bay.hasEvCharger && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 seam-surface-subtle px-2.5 py-1.5">
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          <span>EV Charger ({bay.evChargerPowerKw} kW)</span>
                        </div>
                      )}

                      {bay.currentVehiclePlate && (
                        <div className="mt-2.5 seam-surface-subtle px-2.5 py-1.5 flex items-center justify-between text-xs">
                          <span className="text-[#78837D] dark:text-[#92A199]">Vehicle</span>
                          <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {bay.currentVehiclePlate}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        disabled={isOccupied}
                        onClick={() => handleToggleBayStatus(bay.id, bay.status)}
                        className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] disabled:text-[#78837D] disabled:cursor-not-allowed hover:underline"
                      >
                        {isAvailable ? 'Flag Maintenance' : isOccupied ? 'Occupied' : 'Set Available'}
                      </button>
                      <Building className="w-3.5 h-3.5 text-[#78837D]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EV CHARGING FLEET & FOLIO BILLING */}
      {activeTab === 'ev_fleet' && (
        <DataTable
          data={evSessions}
          columns={evColumns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search station bay, guest, room, or plate..."
          searchFilter={(s, q) =>
            s.bayCode.toLowerCase().includes(q) ||
            s.guestName.toLowerCase().includes(q) ||
            s.vehiclePlate.toLowerCase().includes(q) ||
            (s.roomNumber?.toLowerCase().includes(q) ?? false)
          }
          onExportCsv={handleExportEvCsv}
          exportLabel="Export EV Ledger"
          emptyTitle="No EV charging sessions recorded"
          emptyDescription="Initiate an EV charging session to meter kWh consumption and post directly to resident room folios."
          emptyAction={
            <button
              type="button"
              onClick={() => setShowNewEvModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white"
            >
              <Zap className="w-3.5 h-3.5" />
              Start EV Charge
            </button>
          }
        />
      )}

      {/* MODAL: ISSUE NEW VALET TICKET */}
      <Modal
        open={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        title="Issue Digital Valet Ticket"
        subtitle="Assign a parking bay and electronic key peg slot for arriving guest vehicle."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateValetTicket} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Guest Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dawit Haile"
                value={newTicket.guestName}
                onChange={(e) => setNewTicket({ ...newTicket, guestName: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Room Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 504"
                value={newTicket.roomNumber}
                onChange={(e) => setNewTicket({ ...newTicket, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Vehicle License Plate *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ET-2-B48821"
                value={newTicket.licensePlate}
                onChange={(e) => setNewTicket({ ...newTicket, licensePlate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Vehicle Make &amp; Model
              </label>
              <input
                type="text"
                placeholder="e.g. Range Rover Vogue"
                value={newTicket.vehicleMakeModel}
                onChange={(e) => setNewTicket({ ...newTicket, vehicleMakeModel: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Assign Parking Bay *
              </label>
              <select
                required
                value={newTicket.assignedBayCode}
                onChange={(e) => setNewTicket({ ...newTicket, assignedBayCode: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input"
              >
                <option value="">Select Available Bay...</option>
                {parkingBays
                  .filter((b) => b.status === 'available')
                  .map((b) => (
                    <option key={b.id} value={b.bayCode}>
                      {b.bayCode} ({b.bayType.replace(/_/g, ' ')} – {b.zone.replace(/_/g, ' ')})
                    </option>
                  ))}
                {parkingBays.filter((b) => b.status === 'available').length === 0 && (
                  <option value="VIP-01">VIP-01 (Basement)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Key Peg Slot Locker *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PEG-12"
                value={newTicket.keyPegSlot}
                onChange={(e) => setNewTicket({ ...newTicket, keyPegSlot: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Damage Inspection Notes
            </label>
            <textarea
              rows={2}
              placeholder="Record any existing scratches, dents, or windshield marks..."
              value={newTicket.conditionDamageNotes}
              onChange={(e) => setNewTicket({ ...newTicket, conditionDamageNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewTicketModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Issue Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: START NEW EV CHARGING SESSION */}
      <Modal
        open={showNewEvModal}
        onClose={() => setShowNewEvModal(false)}
        title="Start EV Fast-Charging Session"
        subtitle="Connect vehicle plate and room folio for live kWh energy metering."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleStartEvSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              EV Charger Bay *
            </label>
            <select
              required
              value={newEvSession.bayCode}
              onChange={(e) => setNewEvSession({ ...newEvSession, bayCode: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            >
              <option value="">Select Charger Bay...</option>
              {parkingBays
                .filter((b) => b.hasEvCharger)
                .map((b) => (
                  <option key={b.id} value={b.bayCode}>
                    {b.bayCode} ({b.evChargerPowerKw} kW Fast-Charger)
                  </option>
                ))}
              <option value="EV-03">EV-03 (22 kW AC Post)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Guest Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sara Tekle"
              value={newEvSession.guestName}
              onChange={(e) => setNewEvSession({ ...newEvSession, guestName: e.target.value })}
              className="w-full px-3 py-2 text-xs seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Room Number
              </label>
              <input
                type="text"
                placeholder="e.g. 504"
                value={newEvSession.roomNumber}
                onChange={(e) => setNewEvSession({ ...newEvSession, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Vehicle Plate *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ET-3-A10928"
                value={newEvSession.vehiclePlate}
                onChange={(e) => setNewEvSession({ ...newEvSession, vehiclePlate: e.target.value })}
                className="w-full px-3 py-2 text-xs seam-input uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Tariff Rate ({currency} / kWh)
            </label>
            <input
              type="number"
              step="0.5"
              value={newEvSession.ratePerKwh}
              onChange={(e) => setNewEvSession({ ...newEvSession, ratePerKwh: parseFloat(e.target.value) || 18.0 })}
              className="w-full px-3 py-2 text-xs seam-input font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewEvModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white"
            >
              Initiate Charging
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
