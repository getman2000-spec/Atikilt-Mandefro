import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Users,
  Calendar,
  Plus,
  DollarSign,
  BedDouble,
  Plane,
  Receipt,
} from 'lucide-react';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Hotel,
  GroupBlockCategory,
  GroupBlockStatus,
  GroupBillingInstruction,
  GroupBlock,
  GroupRoomingGuest,
  CorporateAccount,
  Room,
} from '../../types/saas';
import { PageHeader, KpiCard, StatusBadge, Modal, DataTable, DataTableColumn, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency, maskIdNumber } from '../../utils/formatters';

interface GroupBlocksAndRoomingHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

const CATEGORY_LABELS: Record<GroupBlockCategory, string> = {
  corporate_summit: 'Corporate & UN Summit',
  tour_series: 'Tour Operator Series',
  diplomatic_delegation: 'Diplomatic Delegation',
  wedding_social: 'Wedding & Social Block',
  airline_crew: 'Airline Crew Allotment',
};

const BILLING_LABELS: Record<GroupBillingInstruction, string> = {
  master_bill_rooms_tax: 'Master Bill (Rooms & Tax)',
  master_bill_all_inclusive: 'Master Bill (All-Inclusive)',
  individual_own_account: 'Individual Own Account',
};

const STATUS_META: Record<GroupBlockStatus, { label: string; tone: 'success' | 'warning' | 'critical' | 'neutral' | 'forest' }> = {
  tentative: { label: 'Tentative', tone: 'warning' },
  definite: { label: 'Definite', tone: 'forest' },
  in_house: { label: 'In-House', tone: 'success' },
  washed_released: { label: 'Washed / Released', tone: 'neutral' },
  settled: { label: 'Settled to AR', tone: 'success' },
};

export const GroupBlocksAndRoomingHub: React.FC<GroupBlocksAndRoomingHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings.currency || 'ETB';
  const actorName = currentUser?.fullName || 'Reservations Manager';

  const [activeTab, setActiveTab] = useState<'allotments' | 'rooming_list' | 'master_billing'>('allotments');
  const [blocks, setBlocks] = useState<GroupBlock[]>([]);
  const [roomingList, setRoomingList] = useState<GroupRoomingGuest[]>([]);
  const [corporateAccounts, setCorporateAccounts] = useState<CorporateAccount[]>([]);
  const [hotelRooms, setHotelRooms] = useState<Room[]>([]);

  const [statusFilter, setStatusFilter] = useState<'all' | GroupBlockStatus>('all');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showNewBlockModal, setShowNewBlockModal] = useState(false);
  const [newBlockForm, setNewBlockForm] = useState<{
    blockCode: string;
    groupName: string;
    organizerName: string;
    organizerPhone: string;
    corporateAccountId: string;
    category: GroupBlockCategory;
    status: GroupBlockStatus;
    billingInstruction: GroupBillingInstruction;
    checkInDate: string;
    checkOutDate: string;
    cutoffDate: string;
    roomCategoryName: string;
    negotiatedRateEtb: number;
    contractedRooms: number;
    depositPaidEtb: number;
    notes: string;
  }>({
    blockCode: '',
    groupName: '',
    organizerName: '',
    organizerPhone: '',
    corporateAccountId: '',
    category: 'corporate_summit',
    status: 'definite',
    billingInstruction: 'master_bill_rooms_tax',
    checkInDate: '2026-11-18',
    checkOutDate: '2026-11-21',
    cutoffDate: '2026-11-15',
    roomCategoryName: 'Deluxe Lake View Room',
    negotiatedRateEtb: 3850,
    contractedRooms: 10,
    depositPaidEtb: 0,
    notes: '',
  });

  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [newGuestForm, setNewGuestForm] = useState<{
    groupBlockId: string;
    guestName: string;
    passportOrIdNumber: string;
    nationality: string;
    occupancyType: 'single' | 'double' | 'twin';
    vipFlag: boolean;
    shuttleNeeded: boolean;
    dietaryNotes: string;
  }>({
    groupBlockId: '',
    guestName: '',
    passportOrIdNumber: '',
    nationality: 'Ethiopian',
    occupancyType: 'single',
    vipFlag: false,
    shuttleNeeded: true,
    dietaryNotes: '',
  });

  const [assignGuestModal, setAssignGuestModal] = useState<GroupRoomingGuest | null>(null);
  const [assignRoomNumber, setAssignRoomNumber] = useState('');
  const [assignActionMode, setAssignActionMode] = useState<'room_assigned' | 'checked_in'>('room_assigned');

  const [depositModalBlock, setDepositModalBlock] = useState<GroupBlock | null>(null);
  const [depositAmount, setDepositAmount] = useState(25000);

  const [transferArModalBlock, setTransferArModalBlock] = useState<GroupBlock | null>(null);
  const [transferAccountId, setTransferAccountId] = useState('');
  const [transferLpoRef, setTransferLpoRef] = useState('');

  const loadData = () => {
    if (!hotelId) return;
    const blkList = saasStorage.getGroupBlocks(hotelId);
    setBlocks(blkList);
    setRoomingList(saasStorage.getGroupRoomingList(hotelId));
    setCorporateAccounts(saasStorage.getCorporateAccounts(hotelId));
    setHotelRooms(saasStorage.getRooms(hotelId));
    setNewGuestForm((prev) => ({
      ...prev,
      groupBlockId: blkList.some((b) => b.id === prev.groupBlockId)
        ? prev.groupBlockId
        : blkList[0]?.id || '',
    }));
  };

  useEffect(() => {
    loadData();
    setSelectedBlockFilter('all');
  }, [hotelId]);

  if (!activeHotel) return null;

  const totalContractedRooms = blocks.reduce((sum, b) => sum + b.contractedRooms, 0);
  const totalPickedUpRooms = blocks.reduce((sum, b) => sum + b.pickedUpRooms, 0);
  const totalWashedRooms = blocks.reduce((sum, b) => sum + b.washedRooms, 0);
  const unpickedExposure = Math.max(0, totalContractedRooms - totalPickedUpRooms - totalWashedRooms);
  const totalGroupRevenue = blocks.reduce((sum, b) => sum + b.estimatedRevenueEtb, 0);
  const totalDepositsPaid = blocks.reduce((sum, b) => sum + b.depositPaidEtb, 0);
  const pickupRatePercent =
    totalContractedRooms > 0 ? Math.round((totalPickedUpRooms / totalContractedRooms) * 100) : 0;

  const filteredBlocks = blocks.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !q ||
      b.blockCode.toLowerCase().includes(q) ||
      b.groupName.toLowerCase().includes(q) ||
      b.organizerName.toLowerCase().includes(q);
    return matchesStatus && matchesQ;
  });

  const filteredRoomingList = roomingList.filter((g) => {
    const matchesBlk = selectedBlockFilter === 'all' || g.groupBlockId === selectedBlockFilter;
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !q ||
      g.guestName.toLowerCase().includes(q) ||
      g.blockCode.toLowerCase().includes(q) ||
      g.passportOrIdNumber.toLowerCase().includes(q) ||
      (g.assignedRoomNumber || '').toLowerCase().includes(q);
    return matchesBlk && matchesQ;
  });

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockForm.blockCode.trim() || !newBlockForm.groupName.trim()) return;
    const created = saasStorage.createGroupBlock(
      {
        hotelId,
        blockCode: newBlockForm.blockCode.trim().toUpperCase(),
        groupName: newBlockForm.groupName.trim(),
        organizerName: newBlockForm.organizerName.trim() || 'Group Coordinator',
        organizerPhone: newBlockForm.organizerPhone.trim() || '+251 91 000 0000',
        corporateAccountId: newBlockForm.corporateAccountId || undefined,
        category: newBlockForm.category,
        status: newBlockForm.status,
        billingInstruction: newBlockForm.billingInstruction,
        checkInDate: newBlockForm.checkInDate,
        checkOutDate: newBlockForm.checkOutDate,
        cutoffDate: newBlockForm.cutoffDate,
        roomCategoryName: newBlockForm.roomCategoryName,
        negotiatedRateEtb: Number(newBlockForm.negotiatedRateEtb) || 3500,
        contractedRooms: Number(newBlockForm.contractedRooms) || 5,
        pickedUpRooms: 0,
        depositPaidEtb: Number(newBlockForm.depositPaidEtb) || 0,
        notes: newBlockForm.notes.trim() || undefined,
      },
      actorName
    );
    toast(`Created group allotment ${created.blockCode} (${created.contractedRooms} rooms)`, { variant: 'success' });
    setShowNewBlockModal(false);
    setNewBlockForm({
      ...newBlockForm,
      blockCode: '',
      groupName: '',
      organizerName: '',
      organizerPhone: '',
      notes: '',
    });
    loadData();
  };

  const handleWashInventory = (block: GroupBlock) => {
    const res = saasStorage.washGroupBlockInventory(block.id, actorName);
    if (res.washedCount > 0) {
      toast(`Washed ${res.washedCount} unpicked rooms from ${block.blockCode} back into general inventory`, { variant: 'success' });
    } else {
      toast(`No unpicked rooms remaining to wash on ${block.blockCode}`, { variant: 'info' });
    }
    loadData();
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const blk = blocks.find((b) => b.id === newGuestForm.groupBlockId);
    if (!blk || !newGuestForm.guestName.trim()) return;

    const added = saasStorage.addRoomingListGuest(
      {
        hotelId,
        groupBlockId: blk.id,
        blockCode: blk.blockCode,
        guestName: newGuestForm.guestName.trim(),
        passportOrIdNumber: newGuestForm.passportOrIdNumber.trim() || 'PENDING-ID',
        nationality: newGuestForm.nationality.trim() || 'Ethiopian',
        roomCategoryName: blk.roomCategoryName,
        arrivalDate: blk.checkInDate,
        departureDate: blk.checkOutDate,
        occupancyType: newGuestForm.occupancyType,
        vipFlag: newGuestForm.vipFlag,
        shuttleNeeded: newGuestForm.shuttleNeeded,
        dietaryNotes: newGuestForm.dietaryNotes.trim() || undefined,
        status: 'pending_assignment',
      },
      actorName
    );
    toast(`Added delegate ${added.guestName} to ${blk.blockCode} rooming list`, { variant: 'success' });
    setShowAddGuestModal(false);
    setNewGuestForm({
      ...newGuestForm,
      guestName: '',
      passportOrIdNumber: '',
      dietaryNotes: '',
    });
    loadData();
  };

  const handleOpenAssignModal = (guest: GroupRoomingGuest, mode: 'room_assigned' | 'checked_in') => {
    setAssignGuestModal(guest);
    setAssignActionMode(mode);
    const availableRoom = hotelRooms.find((r) => r.status === 'clean' || r.status === 'inspected');
    setAssignRoomNumber(guest.assignedRoomNumber || availableRoom?.roomNumber || '108');
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignGuestModal || !assignRoomNumber.trim()) return;
    saasStorage.assignRoomAndCheckInGuest(
      assignGuestModal.id,
      assignRoomNumber.trim(),
      assignActionMode,
      actorName
    );
    toast(
      `${assignActionMode === 'checked_in' ? 'Checked in' : 'Assigned Room ' + assignRoomNumber + ' to'} ${assignGuestModal.guestName}`,
      { variant: 'success' }
    );
    setAssignGuestModal(null);
    loadData();
  };

  const handleRecordDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalBlock || depositAmount <= 0) return;
    saasStorage.recordGroupDeposit(depositModalBlock.id, Number(depositAmount), actorName);
    toast(`Recorded ${formatCurrency(Number(depositAmount), currency)} deposit on ${depositModalBlock.blockCode}`, { variant: 'success' });
    setDepositModalBlock(null);
    loadData();
  };

  const handleOpenTransferAr = (blk: GroupBlock) => {
    setTransferArModalBlock(blk);
    setTransferAccountId(blk.corporateAccountId || corporateAccounts[0]?.id || '');
    setTransferLpoRef(`LPO-${blk.blockCode}`);
  };

  const handleTransferToCityLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferArModalBlock || !transferAccountId) return;
    const inv = saasStorage.transferGroupBalanceToCityLedger(
      transferArModalBlock.id,
      transferAccountId,
      transferLpoRef,
      actorName
    );
    if (inv) {
      toast(
        `Transferred net balance (${formatCurrency(inv.totalAmountEtb, currency)}) to City Ledger ${inv.invoiceNumber}`,
        { variant: 'success' }
      );
      setTransferArModalBlock(null);
      loadData();
    } else {
      toast('No remaining net balance to transfer for this group block.', { variant: 'warning' });
    }
  };

  const roomingColumns: DataTableColumn<GroupRoomingGuest>[] = [
    {
      key: 'block',
      header: 'Block Code',
      sortValue: (g) => g.blockCode,
      render: (g) => (
        <span className="font-mono tabular-nums font-semibold text-[#173F35] dark:text-[#C6A15B]">
          {g.blockCode}
        </span>
      ),
    },
    {
      key: 'guest',
      header: 'Delegate & ID',
      sortValue: (g) => g.guestName,
      render: (g) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
            {g.guestName}
            {g.vipFlag && (
              <span className="ml-1.5 text-[10px] font-semibold text-[#C6A15B] uppercase">· VIP</span>
            )}
          </div>
          <div className="text-[11px] text-[#78837D] font-mono">
            {maskIdNumber(g.passportOrIdNumber)} · {g.nationality}
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates & Occupancy',
      sortValue: (g) => g.arrivalDate,
      render: (g) => (
        <div>
          <div className="font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
            {g.arrivalDate.slice(5)} → {g.departureDate.slice(5)}
          </div>
          <div className="text-[11px] text-[#78837D] capitalize">
            {g.occupancyType} · {g.roomCategoryName}
          </div>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room Unit',
      sortValue: (g) => g.assignedRoomNumber || 'ZZZ',
      render: (g) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {g.assignedRoomNumber ? `Room ${g.assignedRoomNumber}` : 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'logistics',
      header: 'Logistics',
      render: (g) => (
        <div className="flex items-center gap-1.5 text-[11px] text-[#78837D]">
          {g.shuttleNeeded && (
            <span className="inline-flex items-center gap-1 text-[#173F35] dark:text-[#C6A15B]">
              <Plane className="w-3 h-3" />
              Shuttle
            </span>
          )}
          {g.dietaryNotes && <span>· {g.dietaryNotes}</span>}
          {!g.shuttleNeeded && !g.dietaryNotes && 'Standard'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (g) => g.status,
      render: (g) => (
        <StatusBadge
          label={g.status.replace('_', ' ')}
          tone={g.status === 'checked_in' ? 'success' : g.status === 'room_assigned' ? 'forest' : 'warning'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Front Desk Actions',
      align: 'right',
      render: (g) => (
        <div className="inline-flex items-center gap-1.5">
          {g.status === 'pending_assignment' && (
            <button
              onClick={() => handleOpenAssignModal(g, 'room_assigned')}
              className="px-2.5 py-1.5 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] text-[11px] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Assign Room
            </button>
          )}
          {g.status !== 'checked_in' && (
            <button
              onClick={() => handleOpenAssignModal(g, 'checked_in')}
              className="px-2.5 py-1.5 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white text-[11px] font-semibold"
            >
              Check In
            </button>
          )}
        </div>
      ),
    },
  ];

  const billingColumns: DataTableColumn<GroupBlock>[] = [
    {
      key: 'block',
      header: 'Group Block',
      sortValue: (b) => b.groupName,
      render: (b) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{b.groupName}</div>
          <div className="text-[11px] font-mono text-[#78837D]">
            {b.blockCode} · {b.pickedUpRooms} picked rooms
          </div>
        </div>
      ),
    },
    {
      key: 'instruction',
      header: 'Billing Instruction',
      render: (b) => <span className="text-[#78837D]">{BILLING_LABELS[b.billingInstruction]}</span>,
    },
    {
      key: 'estTotal',
      header: `Est. Total (${currency})`,
      align: 'right',
      sortValue: (b) => b.estimatedRevenueEtb,
      render: (b) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(b.estimatedRevenueEtb, currency)}
        </span>
      ),
    },
    {
      key: 'deposit',
      header: `Deposits (${currency})`,
      align: 'right',
      sortValue: (b) => b.depositPaidEtb,
      render: (b) => (
        <span className="font-mono tabular-nums font-semibold text-[#2F6B48] dark:text-[#66A881]">
          {formatCurrency(b.depositPaidEtb, currency)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Net Balance',
      align: 'right',
      sortValue: (b) => Math.max(0, b.estimatedRevenueEtb - b.depositPaidEtb),
      render: (b) => (
        <span className="font-mono tabular-nums font-bold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(Math.max(0, b.estimatedRevenueEtb - b.depositPaidEtb), currency)}
        </span>
      ),
    },
    {
      key: 'arStatus',
      header: 'AR Status',
      render: (b) =>
        b.cityLedgerInvoiceRef ? (
          <span className="font-mono text-[#173F35] dark:text-[#C6A15B] font-semibold inline-flex items-center gap-1 text-[11px]">
            <Receipt className="w-3.5 h-3.5" />
            {b.cityLedgerInvoiceRef}
          </span>
        ) : (
          <StatusBadge label="Open Master Folio" tone="neutral" />
        ),
    },
    {
      key: 'actions',
      header: 'Settlement Actions',
      align: 'right',
      render: (b) => {
        const netBalance = Math.max(0, b.estimatedRevenueEtb - b.depositPaidEtb);
        return (
          <div className="inline-flex items-center gap-1.5">
            <button
              onClick={() => {
                setDepositModalBlock(b);
                setDepositAmount(25000);
              }}
              className="px-2.5 py-1.5 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] text-[11px] font-medium hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              + Deposit
            </button>
            {!b.cityLedgerInvoiceRef && netBalance > 0 && (
              <button
                onClick={() => handleOpenTransferAr(b)}
                className="px-2.5 py-1.5 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white text-[11px] font-semibold"
              >
                Post to City Ledger
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Daily Operations', 'Group Room Blocks']}
        title="Group Room Blocks, Allotments & Rooming Lists"
        subtitle={`${activeHotel.name} · Conference delegations, tour series pickup, cutoff washing & master billing.`}
        meta={<SampleDataBadge />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowNewBlockModal(true)}
              className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group Block</span>
            </button>
            <button
              onClick={() => setShowAddGuestModal(true)}
              className="px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] text-xs font-semibold flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Add Rooming Delegate</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Active Group Allotments"
          value={`${blocks.length} Blocks`}
          helper={`${totalContractedRooms} contracted room units`}
          deltaTone="forest"
          icon={FolderKanban}
        />
        <KpiCard
          label="Group Pickup Velocity"
          value={`${totalPickedUpRooms} / ${totalContractedRooms} (${pickupRatePercent}%)`}
          helper={`${totalWashedRooms} washed back to general inventory`}
          deltaTone="positive"
          icon={BedDouble}
        />
        <KpiCard
          label="Cutoff Release Exposure"
          value={`${unpickedExposure} Unpicked`}
          helper="Rooms eligible for pre-arrival wash"
          deltaTone={unpickedExposure > 0 ? 'warning' : 'neutral'}
          icon={Calendar}
        />
        <KpiCard
          label="Group Revenue & Deposits"
          value={formatCurrency(totalGroupRevenue, currency)}
          helper={`Deposits: ${formatCurrency(totalDepositsPaid, currency)}`}
          deltaTone="positive"
          icon={DollarSign}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('allotments')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
            activeTab === 'allotments'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          Group Blocks &amp; Cutoffs ({blocks.length})
        </button>
        <button
          onClick={() => setActiveTab('rooming_list')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
            activeTab === 'rooming_list'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          Rooming List Manifest ({roomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('master_billing')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
            activeTab === 'master_billing'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          Master Folios &amp; Deposits
        </button>
      </div>

      {/* TAB 1: GROUP BLOCKS */}
      {activeTab === 'allotments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'tentative', 'definite', 'in_house', 'washed_released', 'settled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                    statusFilter === st
                      ? 'bg-[#173F35] text-white border-[#173F35]'
                      : 'bg-white dark:bg-[#131D1A] text-[#78837D] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {st === 'all' ? 'All Group Blocks' : STATUS_META[st].label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search block code, group, organizer..."
              className="seam-input w-full sm:w-64"
            />
          </div>

          {filteredBlocks.length === 0 ? (
            <EmptyState
              title="No group allotments match filter"
              description="Try switching the status pill or clearing your search query."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBlocks.map((blk) => {
                const unpicked = Math.max(0, blk.contractedRooms - blk.pickedUpRooms - blk.washedRooms);
                const pct = blk.contractedRooms > 0 ? Math.round((blk.pickedUpRooms / blk.contractedRooms) * 100) : 0;
                const statusMeta = STATUS_META[blk.status];
                return (
                  <div
                    key={blk.id}
                    className="seam-surface p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B]">
                          {blk.blockCode}
                        </span>
                        <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                      </div>

                      <h3 className="text-base font-bold text-[#202B27] dark:text-[#ECF1EE] mt-1">
                        {blk.groupName}
                      </h3>
                      <div className="text-xs text-[#78837D] mt-0.5">
                        {CATEGORY_LABELS[blk.category]} · {blk.organizerName} ({blk.organizerPhone})
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
                        <div>
                          <div className="text-[11px] text-[#78837D]">Stay Window</div>
                          <div className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                            {blk.checkInDate.slice(5)} → {blk.checkOutDate.slice(5)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#78837D]">Cutoff Date</div>
                          <div className="font-mono tabular-nums font-semibold text-[#9E6B1E] dark:text-[#E5B869] mt-0.5">
                            {blk.cutoffDate}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#78837D]">Group Rate</div>
                          <div className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                            {formatCurrency(blk.negotiatedRateEtb, currency)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#78837D] font-medium">
                            Room Pickup ({blk.roomCategoryName})
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {blk.pickedUpRooms}/{blk.contractedRooms} picked · {unpicked} open
                            {blk.washedRooms > 0 ? ` · ${blk.washedRooms} washed` : ''}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#E6EBE7] dark:bg-[#22322C] overflow-hidden">
                          <div
                            className="h-full bg-[#173F35] dark:bg-[#C6A15B] transition-all"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>

                      {blk.notes && (
                        <p className="text-[11px] text-[#78837D] mt-3">{blk.notes}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-[#78837D]">
                        {BILLING_LABELS[blk.billingInstruction]}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBlockFilter(blk.id);
                            setActiveTab('rooming_list');
                          }}
                          className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] text-xs font-medium"
                        >
                          Rooming List
                        </button>
                        {unpicked > 0 && (
                          <button
                            onClick={() => handleWashInventory(blk)}
                            className="px-3 py-1.5 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] text-xs font-semibold"
                          >
                            Wash {unpicked} Unpicked
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOMING LIST */}
      {activeTab === 'rooming_list' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-medium text-[#78837D]">Filter by Group Block:</label>
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="seam-input"
            >
              <option value="all">All Group Blocks ({roomingList.length} delegates)</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.blockCode} · {b.groupName}
                </option>
              ))}
            </select>
          </div>

          <DataTable
            data={filteredRoomingList}
            columns={roomingColumns}
            keyExtractor={(g) => g.id}
            searchPlaceholder="Search delegate, ID, block code, room..."
            searchFilter={(g, q) =>
              g.guestName.toLowerCase().includes(q) ||
              g.blockCode.toLowerCase().includes(q) ||
              g.passportOrIdNumber.toLowerCase().includes(q) ||
              (g.assignedRoomNumber || '').toLowerCase().includes(q)
            }
            emptyTitle="No delegates on rooming list"
            emptyDescription="Add a delegate to assign rooms and coordinate arrivals."
          />
        </div>
      )}

      {/* TAB 3: MASTER BILLING */}
      {activeTab === 'master_billing' && (
        <DataTable
          data={filteredBlocks}
          columns={billingColumns}
          keyExtractor={(b) => b.id}
          searchPlaceholder="Search group block or code..."
          searchFilter={(b, q) =>
            b.groupName.toLowerCase().includes(q) || b.blockCode.toLowerCase().includes(q)
          }
          emptyTitle="No group billing records"
          emptyDescription="Create a group block to manage deposits and City Ledger master transfers."
        />
      )}

      {/* MODAL: CREATE GROUP BLOCK */}
      <Modal
        open={showNewBlockModal}
        onClose={() => setShowNewBlockModal(false)}
        title="Create Group Room Block"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateBlock} className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Block Code</label>
              <input
                type="text"
                required
                value={newBlockForm.blockCode}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, blockCode: e.target.value })}
                placeholder="GRP-AU-2026"
                className="seam-input w-full font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Group / Delegation Name</label>
              <input
                type="text"
                required
                value={newBlockForm.groupName}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, groupName: e.target.value })}
                placeholder="African Union Forestry Summit"
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Organizer Contact</label>
              <input
                type="text"
                value={newBlockForm.organizerName}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, organizerName: e.target.value })}
                placeholder="Coordinator name"
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Billing Instruction</label>
              <select
                value={newBlockForm.billingInstruction}
                onChange={(e) =>
                  setNewBlockForm({ ...newBlockForm, billingInstruction: e.target.value as GroupBillingInstruction })
                }
                className="seam-input w-full"
              >
                <option value="master_bill_rooms_tax">Master Bill (Rooms &amp; Tax)</option>
                <option value="master_bill_all_inclusive">Master Bill (All-Inclusive)</option>
                <option value="individual_own_account">Individual Own Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Check-In</label>
              <input
                type="date"
                value={newBlockForm.checkInDate}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, checkInDate: e.target.value })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Check-Out</label>
              <input
                type="date"
                value={newBlockForm.checkOutDate}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, checkOutDate: e.target.value })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Cutoff Date</label>
              <input
                type="date"
                value={newBlockForm.cutoffDate}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, cutoffDate: e.target.value })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Contracted Rooms</label>
              <input
                type="number"
                min={1}
                value={newBlockForm.contractedRooms}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, contractedRooms: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Rate ({currency})</label>
              <input
                type="number"
                min={0}
                value={newBlockForm.negotiatedRateEtb}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, negotiatedRateEtb: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Initial Deposit</label>
              <input
                type="number"
                min={0}
                value={newBlockForm.depositPaidEtb}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, depositPaidEtb: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowNewBlockModal(false)}
              className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Save Group Block
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD ROOMING LIST DELEGATE */}
      <Modal
        open={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        title="Add Delegate to Rooming List"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleAddGuest} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Group Block</label>
            <select
              required
              value={newGuestForm.groupBlockId}
              onChange={(e) => setNewGuestForm({ ...newGuestForm, groupBlockId: e.target.value })}
              className="seam-input w-full"
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.blockCode} · {b.groupName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Delegate Full Name</label>
            <input
              type="text"
              required
              value={newGuestForm.guestName}
              onChange={(e) => setNewGuestForm({ ...newGuestForm, guestName: e.target.value })}
              placeholder="e.g. Dr. Kofi Mensah"
              className="seam-input w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Passport / ID #</label>
              <input
                type="text"
                value={newGuestForm.passportOrIdNumber}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, passportOrIdNumber: e.target.value })}
                placeholder="GH-884120"
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Nationality</label>
              <input
                type="text"
                value={newGuestForm.nationality}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, nationality: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newGuestForm.vipFlag}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, vipFlag: e.target.checked })}
                className="accent-[#173F35]"
              />
              <span>VIP Protocol</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newGuestForm.shuttleNeeded}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, shuttleNeeded: e.target.checked })}
                className="accent-[#173F35]"
              />
              <span>Airport Shuttle Required</span>
            </label>
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowAddGuestModal(false)}
              className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Add Delegate
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ASSIGN ROOM / CHECK-IN DELEGATE */}
      <Modal
        open={Boolean(assignGuestModal)}
        onClose={() => setAssignGuestModal(null)}
        title={assignActionMode === 'checked_in' ? 'Check In Delegate' : 'Assign Room'}
        maxWidthClass="max-w-sm"
      >
        {assignGuestModal && (
          <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
            <div className="text-[#78837D]">
              Delegate:{' '}
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                {assignGuestModal.guestName}
              </span>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Room Number</label>
              <input
                type="text"
                required
                value={assignRoomNumber}
                onChange={(e) => setAssignRoomNumber(e.target.value)}
                className="seam-input w-full font-mono"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setAssignGuestModal(null)}
                className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
              >
                Confirm
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: RECORD GROUP DEPOSIT */}
      <Modal
        open={Boolean(depositModalBlock)}
        onClose={() => setDepositModalBlock(null)}
        title={depositModalBlock ? `Record Deposit · ${depositModalBlock.blockCode}` : 'Record Deposit'}
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleRecordDeposit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Deposit Amount ({currency})
            </label>
            <input
              type="number"
              min={1}
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="seam-input w-full font-mono tabular-nums"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setDepositModalBlock(null)}
              className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TRANSFER MASTER BALANCE TO CITY LEDGER */}
      <Modal
        open={Boolean(transferArModalBlock)}
        onClose={() => setTransferArModalBlock(null)}
        title="Post Master Balance to City Ledger AR"
        maxWidthClass="max-w-md"
      >
        {transferArModalBlock && (
          <form onSubmit={handleTransferToCityLedger} className="space-y-3 text-xs">
            <div className="p-3 rounded-[10px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                {transferArModalBlock.groupName}
              </div>
              <div className="text-[#78837D] tabular-nums mt-0.5 font-mono">
                Net AR Amount:{' '}
                <span className="font-bold text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(
                    Math.max(0, transferArModalBlock.estimatedRevenueEtb - transferArModalBlock.depositPaidEtb),
                    currency
                  )}
                </span>
              </div>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target Corporate AR Account
              </label>
              <select
                required
                value={transferAccountId}
                onChange={(e) => setTransferAccountId(e.target.value)}
                className="seam-input w-full"
              >
                {corporateAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.accountCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                LPO / Contract Reference
              </label>
              <input
                type="text"
                value={transferLpoRef}
                onChange={(e) => setTransferLpoRef(e.target.value)}
                className="seam-input w-full font-mono"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setTransferArModalBlock(null)}
                className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
              >
                Issue City Ledger Invoice
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
