import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Wine,
  Users,
  Plus,
  Search,
  CalendarClock,
  Thermometer,
} from 'lucide-react';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Hotel,
  DiningZone,
  DiningTableStatus,
  DiningTable,
  MealPeriod,
  DiningReservation,
  WineCategory,
  WineCellarBottle,
  GuestFolio,
} from '../../types/saas';
import { PageHeader, KpiCard, StatusBadge, Modal, DataTable, DataTableColumn, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency } from '../../utils/formatters';

interface RestaurantFloorAndSommelierHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

const ZONE_LABELS: Record<DiningZone, string> = {
  abaya_panorama: 'Main Dining Room',
  lakeside_terrace: 'Lakeside Terrace',
  rift_private_dining: 'Private Tasting Room',
  sunset_lounge: 'Sunset Aperitif Lounge',
};

const TABLE_STATUS_META: Record<
  DiningTableStatus,
  { label: string; tone: 'success' | 'warning' | 'critical' | 'neutral' | 'forest' }
> = {
  available: { label: 'Available', tone: 'success' },
  reserved: { label: 'Reserved', tone: 'warning' },
  seated: { label: 'Seated', tone: 'forest' },
  dessert_check: { label: 'Check Presented', tone: 'neutral' },
  needs_bussing: { label: 'Needs Bussing', tone: 'critical' },
};

const WINE_CATEGORY_LABELS: Record<WineCategory, string> = {
  red_reserve: 'Red Reserve',
  white_crisp: 'Crisp White',
  sparkling_champagne: 'Champagne & Sparkling',
  ethiopian_tej_heritage: 'Heritage Tej',
  single_malt_spirits: 'Single Malts & Spirits',
};

export const RestaurantFloorAndSommelierHub: React.FC<RestaurantFloorAndSommelierHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings.currency || 'ETB';
  const actorName = currentUser?.fullName || 'Maître D’ / Cellar Master';

  const [activeTab, setActiveTab] = useState<'floor_plan' | 'reservations' | 'wine_cellar'>('floor_plan');
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [reservations, setReservations] = useState<DiningReservation[]>([]);
  const [wines, setWines] = useState<WineCellarBottle[]>([]);
  const [openFolios, setOpenFolios] = useState<GuestFolio[]>([]);

  const [zoneFilter, setZoneFilter] = useState<'all' | DiningZone>('all');
  const [reservationFilter, setReservationFilter] = useState<'all' | 'confirmed' | 'waitlist' | 'seated'>('all');
  const [wineCategoryFilter, setWineCategoryFilter] = useState<'all' | WineCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [walkInTableModal, setWalkInTableModal] = useState<DiningTable | null>(null);
  const [walkInForm, setWalkInForm] = useState({ guestName: '', partySize: 2, serverName: 'Hiwot Tadesse' });

  const [showNewResModal, setShowNewResModal] = useState(false);
  const [newResForm, setNewResForm] = useState<{
    guestName: string;
    guestPhone: string;
    roomNumber: string;
    partySize: number;
    timeSlot: string;
    mealPeriod: MealPeriod;
    preferredZone: DiningZone;
    assignedTableNumber: string;
    dietaryNotes: string;
    vipOccasion: string;
    entryType: 'confirmed' | 'waitlist';
    estimatedWaitMinutes: number;
  }>({
    guestName: '',
    guestPhone: '',
    roomNumber: '',
    partySize: 2,
    timeSlot: '20:00',
    mealPeriod: 'dinner',
    preferredZone: 'abaya_panorama',
    assignedTableNumber: '',
    dietaryNotes: '',
    vipOccasion: '',
    entryType: 'confirmed',
    estimatedWaitMinutes: 15,
  });

  const [seatModalReservation, setSeatModalReservation] = useState<DiningReservation | null>(null);
  const [seatTargetTableId, setSeatTargetTableId] = useState('');
  const [seatServerName, setSeatServerName] = useState('Hiwot Tadesse');

  const [showNewWineModal, setShowNewWineModal] = useState(false);
  const [newWineForm, setNewWineForm] = useState<{
    binCode: string;
    wineName: string;
    producerRegion: string;
    vintageYear: string;
    category: WineCategory;
    bottleVolumeMl: number;
    cellarTempC: number;
    stockBottles: number;
    reorderLevel: number;
    glassPriceEtb: number;
    bottlePriceEtb: number;
    tastingNotes: string;
  }>({
    binCode: '',
    wineName: '',
    producerRegion: '',
    vintageYear: '2022',
    category: 'red_reserve',
    bottleVolumeMl: 750,
    cellarTempC: 15.0,
    stockBottles: 12,
    reorderLevel: 6,
    glassPriceEtb: 520,
    bottlePriceEtb: 2800,
    tastingNotes: '',
  });

  const [serveWineModal, setServeWineModal] = useState<WineCellarBottle | null>(null);
  const [serveForm, setServeForm] = useState({
    quantityBottles: 1,
    billingMode: 'room_folio' as 'room_folio' | 'table_check',
    targetRoomNumber: '',
    targetTableNumber: '',
  });

  const loadData = () => {
    if (!hotelId) return;
    setTables(saasStorage.getDiningTables(hotelId));
    setReservations(saasStorage.getDiningReservations(hotelId));
    setWines(saasStorage.getWineCellarBottles(hotelId));
    setOpenFolios(saasStorage.getGuestFolios(hotelId).filter((f) => f.status === 'open'));
  };

  useEffect(() => {
    loadData();
    setZoneFilter('all');
  }, [hotelId]);

  if (!activeHotel) return null;

  const availableTablesCount = tables.filter((t) => t.status === 'available').length;
  const totalSeatsCount = tables.reduce((sum, t) => sum + t.seats, 0);
  const seatedCoversCount = tables
    .filter((t) => t.status === 'seated' || t.status === 'dessert_check')
    .reduce((sum, t) => sum + (t.currentPartySize || t.seats), 0);
  const waitlistCount = reservations.filter((r) => r.status === 'waitlist').length;
  const upcomingBookingsCount = reservations.filter((r) => r.status === 'confirmed').length;
  const cellarTotalBottles = wines.reduce((sum, w) => sum + w.stockBottles, 0);
  const cellarTotalValue = wines.reduce((sum, w) => sum + w.stockBottles * w.bottlePriceEtb, 0);
  const lowStockBins = wines.filter((w) => w.stockBottles <= w.reorderLevel).length;

  const filteredTables = tables.filter((t) => {
    const matchesZone = zoneFilter === 'all' || t.zone === zoneFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      t.tableNumber.toLowerCase().includes(q) ||
      (t.currentGuestName || '').toLowerCase().includes(q) ||
      (t.assignedServer || '').toLowerCase().includes(q);
    return matchesZone && matchesQuery;
  });

  const filteredReservations = reservations.filter((r) => {
    const matchesStatus = reservationFilter === 'all' || r.status === reservationFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      r.guestName.toLowerCase().includes(q) ||
      r.reservationCode.toLowerCase().includes(q) ||
      (r.roomNumber || '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const filteredWines = wines.filter((w) => {
    const matchesCat = wineCategoryFilter === 'all' || w.category === wineCategoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      w.wineName.toLowerCase().includes(q) ||
      w.binCode.toLowerCase().includes(q) ||
      w.producerRegion.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const handleWalkInSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInTableModal || !walkInForm.guestName.trim()) return;
    saasStorage.updateDiningTableStatus(
      walkInTableModal.id,
      'seated',
      {
        currentGuestName: walkInForm.guestName.trim(),
        currentPartySize: Number(walkInForm.partySize) || 2,
        assignedServer: walkInForm.serverName.trim() || 'Hiwot Tadesse',
      },
      actorName
    );
    toast(`Seated ${walkInForm.guestName} at Table ${walkInTableModal.tableNumber}`, { variant: 'success' });
    setWalkInTableModal(null);
    setWalkInForm({ guestName: '', partySize: 2, serverName: 'Hiwot Tadesse' });
    loadData();
  };

  const handleAdvanceTableStatus = (tbl: DiningTable, nextStatus: DiningTableStatus) => {
    saasStorage.updateDiningTableStatus(tbl.id, nextStatus, undefined, actorName);
    toast(`Table ${tbl.tableNumber} marked as ${TABLE_STATUS_META[nextStatus].label}`, { variant: 'info' });
    loadData();
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResForm.guestName.trim()) return;
    const created = saasStorage.createDiningReservation(
      {
        hotelId,
        guestName: newResForm.guestName.trim(),
        guestPhone: newResForm.guestPhone.trim() || '+251 91 000 0000',
        roomNumber: newResForm.roomNumber.trim() || undefined,
        partySize: Number(newResForm.partySize) || 2,
        reservationDate: new Date().toISOString().slice(0, 10),
        timeSlot: newResForm.timeSlot,
        mealPeriod: newResForm.mealPeriod,
        preferredZone: newResForm.preferredZone,
        assignedTableNumber:
          newResForm.entryType === 'confirmed' && newResForm.assignedTableNumber
            ? newResForm.assignedTableNumber
            : undefined,
        dietaryNotes: newResForm.dietaryNotes.trim() || undefined,
        vipOccasion: newResForm.vipOccasion.trim() || undefined,
        status: newResForm.entryType,
        estimatedWaitMinutes:
          newResForm.entryType === 'waitlist' ? Number(newResForm.estimatedWaitMinutes) || 15 : undefined,
      },
      actorName
    );
    toast(
      `${created.status === 'waitlist' ? 'Added to Waitlist' : 'Confirmed Reservation'} ${created.reservationCode} for ${created.guestName}`,
      { variant: 'success' }
    );
    setShowNewResModal(false);
    setNewResForm({
      guestName: '',
      guestPhone: '',
      roomNumber: '',
      partySize: 2,
      timeSlot: '20:00',
      mealPeriod: 'dinner',
      preferredZone: 'abaya_panorama',
      assignedTableNumber: '',
      dietaryNotes: '',
      vipOccasion: '',
      entryType: 'confirmed',
      estimatedWaitMinutes: 15,
    });
    loadData();
  };

  const handleOpenSeatReservationModal = (res: DiningReservation) => {
    setSeatModalReservation(res);
    const matchingTable =
      tables.find(
        (t) =>
          t.tableNumber === res.assignedTableNumber &&
          (t.status === 'reserved' || t.status === 'available')
      ) ||
      tables.find((t) => t.status === 'available' && t.seats >= res.partySize) ||
      tables.find((t) => t.status === 'available');
    setSeatTargetTableId(matchingTable?.id || '');
    setSeatServerName(matchingTable?.assignedServer || 'Hiwot Tadesse');
  };

  const handleConfirmSeatReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatModalReservation || !seatTargetTableId) return;
    const ok = saasStorage.seatDiningReservation(
      seatModalReservation.id,
      seatTargetTableId,
      seatServerName,
      actorName
    );
    if (ok) {
      toast(`Seated ${seatModalReservation.guestName} (${seatModalReservation.reservationCode})`, { variant: 'success' });
    }
    setSeatModalReservation(null);
    loadData();
  };

  const handleCreateWineBin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWineForm.binCode.trim() || !newWineForm.wineName.trim()) return;
    const created = saasStorage.createWineCellarBottle(
      {
        hotelId,
        binCode: newWineForm.binCode.trim().toUpperCase(),
        wineName: newWineForm.wineName.trim(),
        producerRegion: newWineForm.producerRegion.trim() || 'Ethiopia / International',
        vintageYear: newWineForm.vintageYear.trim() || 'NV',
        category: newWineForm.category,
        bottleVolumeMl: Number(newWineForm.bottleVolumeMl) || 750,
        cellarTempC: Number(newWineForm.cellarTempC) || 14.0,
        stockBottles: Number(newWineForm.stockBottles) || 0,
        reorderLevel: Number(newWineForm.reorderLevel) || 4,
        glassPriceEtb: Number(newWineForm.glassPriceEtb) || 0,
        bottlePriceEtb: Number(newWineForm.bottlePriceEtb) || 0,
        tastingNotes: newWineForm.tastingNotes.trim() || 'Cellar reserve selection.',
      },
      actorName
    );
    toast(`Added wine cellar bin ${created.binCode} (${created.wineName})`, { variant: 'success' });
    setShowNewWineModal(false);
    setNewWineForm({
      binCode: '',
      wineName: '',
      producerRegion: '',
      vintageYear: '2022',
      category: 'red_reserve',
      bottleVolumeMl: 750,
      cellarTempC: 15.0,
      stockBottles: 12,
      reorderLevel: 6,
      glassPriceEtb: 520,
      bottlePriceEtb: 2800,
      tastingNotes: '',
    });
    loadData();
  };

  const handleRestockWine = (bottle: WineCellarBottle) => {
    saasStorage.restockWineCellarBottle(bottle.id, 6, actorName);
    toast(`Restocked +6 bottles into ${bottle.binCode}`, { variant: 'success' });
    loadData();
  };

  const handleOpenServeWine = (bottle: WineCellarBottle) => {
    setServeWineModal(bottle);
    setServeForm({
      quantityBottles: 1,
      billingMode: openFolios.length > 0 ? 'room_folio' : 'table_check',
      targetRoomNumber: openFolios[0]?.roomNumber || '',
      targetTableNumber: tables.find((t) => t.status === 'seated')?.tableNumber || 'P-01',
    });
  };

  const handleServeWineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serveWineModal) return;
    const result = saasStorage.serveWineToRoomOrTable(
      serveWineModal.id,
      {
        quantityBottles: Number(serveForm.quantityBottles) || 1,
        targetRoomNumber: serveForm.billingMode === 'room_folio' ? serveForm.targetRoomNumber : undefined,
        targetTableNumber: serveForm.billingMode === 'table_check' ? serveForm.targetTableNumber : undefined,
      },
      actorName
    );
    if (result.success) {
      toast(
        result.billedToFolio
          ? `Served ${serveForm.quantityBottles}× ${serveWineModal.wineName} · Posted ${formatCurrency(result.totalAmountEtb, currency)} to Room ${serveForm.targetRoomNumber}`
          : `Served ${serveForm.quantityBottles}× ${serveWineModal.wineName} to Table ${serveForm.targetTableNumber}`,
        { variant: 'success' }
      );
      setServeWineModal(null);
      loadData();
    } else {
      toast('Insufficient cellar bottle stock for this request.', { variant: 'error' });
    }
  };

  const reservationColumns: DataTableColumn<DiningReservation>[] = [
    {
      key: 'code',
      header: 'Code & Period',
      sortValue: (r) => r.reservationCode,
      render: (r) => (
        <div>
          <div className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
            {r.reservationCode}
          </div>
          <div className="text-[11px] text-[#78837D] capitalize">{r.mealPeriod.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest & Room',
      sortValue: (r) => r.guestName,
      render: (r) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{r.guestName}</div>
          <div className="text-[11px] text-[#78837D] font-mono">
            {r.roomNumber ? `Room ${r.roomNumber}` : 'External Diner'} · {r.guestPhone}
          </div>
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      align: 'right',
      sortValue: (r) => r.partySize,
      render: (r) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {r.partySize}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time & Zone',
      sortValue: (r) => r.timeSlot,
      render: (r) => (
        <div>
          <div className="font-mono tabular-nums font-medium text-[#202B27] dark:text-[#ECF1EE]">
            {r.timeSlot}
            {r.assignedTableNumber ? ` · Table ${r.assignedTableNumber}` : ''}
          </div>
          <div className="text-[11px] text-[#78837D]">{ZONE_LABELS[r.preferredZone]}</div>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes & Dietary',
      render: (r) => (
        <div className="max-w-xs text-[#78837D]">
          {r.vipOccasion || r.dietaryNotes || 'Standard dinner seating'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <StatusBadge
          label={
            r.status === 'waitlist'
              ? `Waitlist (~${r.estimatedWaitMinutes || 15}m)`
              : r.status.replace('_', ' ')
          }
          tone={
            r.status === 'confirmed'
              ? 'warning'
              : r.status === 'waitlist'
              ? 'critical'
              : r.status === 'seated'
              ? 'forest'
              : 'neutral'
          }
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1.5">
          {(r.status === 'confirmed' || r.status === 'waitlist') && (
            <button
              onClick={() => handleOpenSeatReservationModal(r)}
              className="px-2.5 py-1.5 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white text-[11px] font-semibold"
            >
              Seat Table
            </button>
          )}
          {r.status === 'seated' && (
            <button
              onClick={() => {
                saasStorage.updateDiningReservationStatus(r.id, 'completed', actorName);
                toast(`Completed dining visit for ${r.guestName}`, { variant: 'success' });
                loadData();
              }}
              className="px-2.5 py-1.5 rounded-[7px] bg-[#2F6B48] hover:bg-[#25573A] text-white text-[11px] font-semibold"
            >
              Complete
            </button>
          )}
          {(r.status === 'confirmed' || r.status === 'waitlist') && (
            <button
              onClick={() => {
                saasStorage.updateDiningReservationStatus(r.id, 'cancelled', actorName);
                toast(`Cancelled ${r.reservationCode}`, { variant: 'info' });
                loadData();
              }}
              className="px-2.5 py-1.5 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#B6463D] text-[11px] font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const wineColumns: DataTableColumn<WineCellarBottle>[] = [
    {
      key: 'bin',
      header: 'Bin & Vintage',
      sortValue: (w) => w.binCode,
      render: (w) => (
        <div>
          <div className="font-mono font-bold text-[#202B27] dark:text-[#ECF1EE]">{w.binCode}</div>
          <div className="text-[11px] text-[#78837D] font-mono">{w.vintageYear}</div>
        </div>
      ),
    },
    {
      key: 'label',
      header: 'Label & Origin',
      sortValue: (w) => w.wineName,
      render: (w) => (
        <div className="max-w-md">
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{w.wineName}</div>
          <div className="text-[11px] text-[#78837D]">
            {w.producerRegion} · {WINE_CATEGORY_LABELS[w.category]}
          </div>
          <div className="text-[11px] text-[#78837D] mt-0.5">{w.tastingNotes}</div>
        </div>
      ),
    },
    {
      key: 'temp',
      header: 'Cellar Temp',
      align: 'right',
      sortValue: (w) => w.cellarTempC,
      render: (w) => (
        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
          <Thermometer className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
          {w.cellarTempC.toFixed(1)}°C
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'In Stock',
      align: 'right',
      sortValue: (w) => w.stockBottles,
      render: (w) => {
        const isLow = w.stockBottles <= w.reorderLevel;
        return (
          <div>
            <div
              className={`font-mono font-bold tabular-nums ${
                isLow ? 'text-[#B6463D] dark:text-[#E27A71]' : 'text-[#202B27] dark:text-[#ECF1EE]'
              }`}
            >
              {w.stockBottles} btl
            </div>
            <div className="text-[11px] text-[#78837D]">
              {isLow ? `Reorder ≤ ${w.reorderLevel}` : `Par ${w.reorderLevel}+`}
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      header: `Glass / Bottle (${currency})`,
      align: 'right',
      sortValue: (w) => w.bottlePriceEtb,
      render: (w) => (
        <div>
          <div className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
            {formatCurrency(w.bottlePriceEtb, currency)}
          </div>
          <div className="text-[11px] text-[#78837D] font-mono tabular-nums">
            Glass: {w.glassPriceEtb.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Cellar Actions',
      align: 'right',
      render: (w) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={() => handleOpenServeWine(w)}
            disabled={w.stockBottles === 0}
            className="px-2.5 py-1.5 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] disabled:opacity-40 text-white text-[11px] font-semibold"
          >
            Serve / Post Folio
          </button>
          <button
            onClick={() => handleRestockWine(w)}
            className="px-2.5 py-1.5 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] text-[11px] font-medium"
          >
            +6 Bottles
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Daily Operations', 'Dining & Wine Cellar']}
        title="Dining Floor Plan, Reservations & Wine Cellar"
        subtitle={`${activeHotel.name} · Live table turns, walk-in waitlist, and cellar-to-folio billing.`}
        meta={<SampleDataBadge />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowNewResModal(true)}
              className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking / Walk-In</span>
            </button>
            <button
              onClick={() => setShowNewWineModal(true)}
              className="px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] text-xs font-semibold flex items-center gap-1.5"
            >
              <Wine className="w-4 h-4" />
              <span>Add Cellar Bin</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Open Tables Ready"
          value={`${availableTablesCount} / ${tables.length}`}
          helper={`Floor capacity: ${totalSeatsCount} covers`}
          deltaTone="positive"
          icon={UtensilsCrossed}
        />
        <KpiCard
          label="Active Seated Covers"
          value={seatedCoversCount}
          helper={`${tables.filter((t) => t.status === 'needs_bussing').length} table(s) awaiting busser`}
          deltaTone="forest"
          icon={Users}
        />
        <KpiCard
          label="Bookings & Waitlist"
          value={`${upcomingBookingsCount} · ${waitlistCount} waiting`}
          helper="Dinner & private tasting queue"
          deltaTone={waitlistCount > 0 ? 'warning' : 'neutral'}
          icon={CalendarClock}
        />
        <KpiCard
          label="Wine Cellar Stock"
          value={`${cellarTotalBottles} Bottles`}
          helper={`${formatCurrency(cellarTotalValue, currency)} · ${lowStockBins} low-par`}
          deltaTone={lowStockBins > 0 ? 'warning' : 'neutral'}
          icon={Wine}
        />
      </div>

      {/* Primary Section Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] w-fit flex-wrap">
          <button
            onClick={() => setActiveTab('floor_plan')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
              activeTab === 'floor_plan'
                ? 'bg-[#173F35] text-white'
                : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
            }`}
          >
            Interactive Floor Plan ({tables.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
              activeTab === 'reservations'
                ? 'bg-[#173F35] text-white'
                : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
            }`}
          >
            Reservations &amp; Waitlist ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('wine_cellar')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
              activeTab === 'wine_cellar'
                ? 'bg-[#173F35] text-white'
                : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
            }`}
          >
            Wine Cellar ({wines.length})
          </button>
        </div>

        {activeTab === 'floor_plan' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, guest, server..."
              className="seam-input w-full pl-8"
            />
          </div>
        )}
      </div>

      {/* TAB 1: FLOOR PLAN */}
      {activeTab === 'floor_plan' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'abaya_panorama', 'lakeside_terrace', 'rift_private_dining', 'sunset_lounge'] as const).map(
              (zone) => (
                <button
                  key={zone}
                  onClick={() => setZoneFilter(zone)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                    zoneFilter === zone
                      ? 'bg-[#173F35] text-white border-[#173F35]'
                      : 'bg-white dark:bg-[#131D1A] text-[#78837D] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {zone === 'all' ? 'All Dining Zones' : ZONE_LABELS[zone]}
                </button>
              )
            )}
          </div>

          {filteredTables.length === 0 ? (
            <EmptyState
              title="No dining tables match filter"
              description="Switch zones or clear your search query."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTables.map((tbl) => {
                const statusMeta = TABLE_STATUS_META[tbl.status];
                return (
                  <div
                    key={tbl.id}
                    className="seam-surface p-4 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-base font-bold text-[#202B27] dark:text-[#ECF1EE] font-mono tabular-nums">
                          Table {tbl.tableNumber}
                        </h3>
                        <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                      </div>

                      <div className="mt-1 text-xs text-[#78837D]">
                        {ZONE_LABELS[tbl.zone]} · <span className="font-mono tabular-nums">{tbl.seats} seats</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-1 text-xs">
                        {tbl.currentGuestName ? (
                          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {tbl.currentGuestName}{' '}
                            {tbl.currentPartySize && (
                              <span className="font-normal text-[#78837D] tabular-nums">
                                ({tbl.currentPartySize} guests)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[#78837D]">No active party seated</div>
                        )}
                        <div className="text-[#78837D]">
                          Server: <span className="text-[#202B27] dark:text-[#ECF1EE]">{tbl.assignedServer || 'Unassigned'}</span>
                          {tbl.seatedAt && <span className="tabular-nums font-mono"> · {tbl.seatedAt}</span>}
                        </div>
                        {tbl.notes && <div className="text-[11px] text-[#78837D] pt-0.5">{tbl.notes}</div>}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      {tbl.status === 'available' && (
                        <button
                          onClick={() => {
                            setWalkInTableModal(tbl);
                            setWalkInForm({
                              guestName: '',
                              partySize: Math.min(2, tbl.seats),
                              serverName: tbl.assignedServer || 'Hiwot Tadesse',
                            });
                          }}
                          className="w-full px-3 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white text-xs font-semibold transition-colors"
                        >
                          Seat Walk-In Party
                        </button>
                      )}
                      {tbl.status === 'reserved' && (
                        <>
                          <button
                            onClick={() => handleAdvanceTableStatus(tbl, 'seated')}
                            className="flex-1 px-3 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white text-xs font-semibold"
                          >
                            Mark Seated
                          </button>
                          <button
                            onClick={() => handleAdvanceTableStatus(tbl, 'available')}
                            className="px-3 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] text-xs font-medium"
                          >
                            Release
                          </button>
                        </>
                      )}
                      {tbl.status === 'seated' && (
                        <>
                          <button
                            onClick={() => handleAdvanceTableStatus(tbl, 'dessert_check')}
                            className="flex-1 px-3 py-2 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] text-xs font-semibold"
                          >
                            Present Check
                          </button>
                          <button
                            onClick={() => handleAdvanceTableStatus(tbl, 'needs_bussing')}
                            className="px-3 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] text-xs font-medium"
                          >
                            Clear
                          </button>
                        </>
                      )}
                      {tbl.status === 'dessert_check' && (
                        <button
                          onClick={() => handleAdvanceTableStatus(tbl, 'needs_bussing')}
                          className="w-full px-3 py-2 rounded-[8px] bg-[#B6463D] hover:bg-[#9C3A32] text-white text-xs font-semibold"
                        >
                          Departed · Needs Bussing
                        </button>
                      )}
                      {tbl.status === 'needs_bussing' && (
                        <button
                          onClick={() => handleAdvanceTableStatus(tbl, 'available')}
                          className="w-full px-3 py-2 rounded-[8px] bg-[#2F6B48] hover:bg-[#25573A] text-white text-xs font-semibold"
                        >
                          Sanitized &amp; Ready
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'all', label: 'All Entries' },
                { id: 'confirmed', label: 'Confirmed Bookings' },
                { id: 'waitlist', label: 'Walk-In Waitlist' },
                { id: 'seated', label: 'Currently Seated' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setReservationFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                  reservationFilter === f.id
                    ? 'bg-[#173F35] text-white border-[#173F35]'
                    : 'bg-white dark:bg-[#131D1A] text-[#78837D] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <DataTable
            data={filteredReservations}
            columns={reservationColumns}
            keyExtractor={(r) => r.id}
            searchPlaceholder="Search reservation code, guest, room #..."
            searchFilter={(r, q) =>
              r.guestName.toLowerCase().includes(q) ||
              r.reservationCode.toLowerCase().includes(q) ||
              (r.roomNumber || '').toLowerCase().includes(q)
            }
            emptyTitle="No dining reservations found"
            emptyDescription="Create a new table booking or add a walk-in party to the waitlist."
          />
        </div>
      )}

      {/* TAB 3: SOMMELIER WINE CELLAR */}
      {activeTab === 'wine_cellar' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'red_reserve', 'white_crisp', 'sparkling_champagne', 'ethiopian_tej_heritage', 'single_malt_spirits'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setWineCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                    wineCategoryFilter === cat
                      ? 'bg-[#173F35] text-white border-[#173F35]'
                      : 'bg-white dark:bg-[#131D1A] text-[#78837D] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {cat === 'all' ? 'All Cellar Bins' : WINE_CATEGORY_LABELS[cat]}
                </button>
              )
            )}
          </div>

          <DataTable
            data={filteredWines}
            columns={wineColumns}
            keyExtractor={(w) => w.id}
            searchPlaceholder="Search wine label, bin code, origin..."
            searchFilter={(w, q) =>
              w.wineName.toLowerCase().includes(q) ||
              w.binCode.toLowerCase().includes(q) ||
              w.producerRegion.toLowerCase().includes(q)
            }
            emptyTitle="No wine bins match filter"
            emptyDescription="Add a cellar bin or adjust the category filter."
          />
        </div>
      )}

      {/* MODAL: SEAT WALK-IN PARTY */}
      <Modal
        open={Boolean(walkInTableModal)}
        onClose={() => setWalkInTableModal(null)}
        title={walkInTableModal ? `Seat Walk-In · Table ${walkInTableModal.tableNumber}` : 'Seat Walk-In'}
        maxWidthClass="max-w-md"
      >
        {walkInTableModal && (
          <form onSubmit={handleWalkInSeat} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest / Party Name</label>
              <input
                type="text"
                required
                value={walkInForm.guestName}
                onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                placeholder="e.g. Samuel Bekele (Room 202)"
                className="seam-input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Covers (Max {walkInTableModal.seats})
                </label>
                <input
                  type="number"
                  min={1}
                  max={walkInTableModal.seats + 2}
                  value={walkInForm.partySize}
                  onChange={(e) => setWalkInForm({ ...walkInForm, partySize: Number(e.target.value) })}
                  className="seam-input w-full font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Assigned Server</label>
                <input
                  type="text"
                  value={walkInForm.serverName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, serverName: e.target.value })}
                  className="seam-input w-full"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setWalkInTableModal(null)}
                className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
              >
                Confirm Seating
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: NEW TABLE RESERVATION OR WAITLIST */}
      <Modal
        open={showNewResModal}
        onClose={() => setShowNewResModal(false)}
        title="New Table Booking or Waitlist Entry"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateReservation} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Entry Mode</label>
              <select
                value={newResForm.entryType}
                onChange={(e) =>
                  setNewResForm({ ...newResForm, entryType: e.target.value as 'confirmed' | 'waitlist' })
                }
                className="seam-input w-full"
              >
                <option value="confirmed">Confirmed Table Reservation</option>
                <option value="waitlist">Walk-In Waitlist Queue</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest Name</label>
              <input
                type="text"
                required
                value={newResForm.guestName}
                onChange={(e) => setNewResForm({ ...newResForm, guestName: e.target.value })}
                placeholder="Full name or group"
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Phone</label>
              <input
                type="text"
                value={newResForm.guestPhone}
                onChange={(e) => setNewResForm({ ...newResForm, guestPhone: e.target.value })}
                placeholder="+251 91..."
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Room # (Optional)</label>
              <input
                type="text"
                value={newResForm.roomNumber}
                onChange={(e) => setNewResForm({ ...newResForm, roomNumber: e.target.value })}
                placeholder="e.g. 201"
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Party Size</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newResForm.partySize}
                onChange={(e) => setNewResForm({ ...newResForm, partySize: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Time Slot</label>
              <input
                type="time"
                value={newResForm.timeSlot}
                onChange={(e) => setNewResForm({ ...newResForm, timeSlot: e.target.value })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Preferred Zone</label>
              <select
                value={newResForm.preferredZone}
                onChange={(e) => setNewResForm({ ...newResForm, preferredZone: e.target.value as DiningZone })}
                className="seam-input w-full"
              >
                <option value="abaya_panorama">Main Dining Room</option>
                <option value="lakeside_terrace">Lakeside Terrace</option>
                <option value="rift_private_dining">Private Dining</option>
                <option value="sunset_lounge">Sunset Lounge</option>
              </select>
            </div>
            {newResForm.entryType === 'confirmed' ? (
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Hold Table</label>
                <select
                  value={newResForm.assignedTableNumber}
                  onChange={(e) => setNewResForm({ ...newResForm, assignedTableNumber: e.target.value })}
                  className="seam-input w-full"
                >
                  <option value="">Assign on arrival</option>
                  {tables
                    .filter((t) => t.status === 'available')
                    .map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        {t.tableNumber} ({t.seats} seats)
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Est. Wait (Min)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={newResForm.estimatedWaitMinutes}
                  onChange={(e) => setNewResForm({ ...newResForm, estimatedWaitMinutes: Number(e.target.value) })}
                  className="seam-input w-full font-mono tabular-nums"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Dietary Notes / Special Occasion
            </label>
            <input
              type="text"
              value={newResForm.dietaryNotes}
              onChange={(e) => setNewResForm({ ...newResForm, dietaryNotes: e.target.value })}
              placeholder="e.g. Anniversary champagne setup, Vegan"
              className="seam-input w-full"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowNewResModal(false)}
              className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Save Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SEAT RESERVATION / WAITLIST */}
      <Modal
        open={Boolean(seatModalReservation)}
        onClose={() => setSeatModalReservation(null)}
        title={
          seatModalReservation
            ? `Seat ${seatModalReservation.guestName} (${seatModalReservation.partySize} covers)`
            : 'Seat Party'
        }
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleConfirmSeatReservation} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Select Floor Table
            </label>
            <select
              required
              value={seatTargetTableId}
              onChange={(e) => setSeatTargetTableId(e.target.value)}
              className="seam-input w-full"
            >
              <option value="">Choose table...</option>
              {tables
                .filter(
                  (t) =>
                    t.status === 'available' ||
                    t.tableNumber === seatModalReservation?.assignedTableNumber
                )
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} · {ZONE_LABELS[t.zone]} ({t.seats} seats)
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Assigned Dining Server
            </label>
            <input
              type="text"
              required
              value={seatServerName}
              onChange={(e) => setSeatServerName(e.target.value)}
              className="seam-input w-full"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setSeatModalReservation(null)}
              className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Seat Party Now
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD CELLAR WINE BIN */}
      <Modal
        open={showNewWineModal}
        onClose={() => setShowNewWineModal(false)}
        title="Register New Wine Cellar Bin"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateWineBin} className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Bin Code</label>
              <input
                type="text"
                required
                value={newWineForm.binCode}
                onChange={(e) => setNewWineForm({ ...newWineForm, binCode: e.target.value })}
                placeholder="BIN-D04"
                className="seam-input w-full font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Wine / Spirit Label</label>
              <input
                type="text"
                required
                value={newWineForm.wineName}
                onChange={(e) => setNewWineForm({ ...newWineForm, wineName: e.target.value })}
                placeholder="e.g. Rift Valley Reserve Chardonnay"
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newWineForm.category}
                onChange={(e) => setNewWineForm({ ...newWineForm, category: e.target.value as WineCategory })}
                className="seam-input w-full"
              >
                <option value="red_reserve">Red Reserve</option>
                <option value="white_crisp">Crisp White</option>
                <option value="sparkling_champagne">Champagne / Sparkling</option>
                <option value="ethiopian_tej_heritage">Heritage Tej</option>
                <option value="single_malt_spirits">Single Malt / Spirits</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Region</label>
              <input
                type="text"
                value={newWineForm.producerRegion}
                onChange={(e) => setNewWineForm({ ...newWineForm, producerRegion: e.target.value })}
                placeholder="Ziway, Ethiopia"
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Vintage</label>
              <input
                type="text"
                value={newWineForm.vintageYear}
                onChange={(e) => setNewWineForm({ ...newWineForm, vintageYear: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Bottles</label>
              <input
                type="number"
                min={1}
                value={newWineForm.stockBottles}
                onChange={(e) => setNewWineForm({ ...newWineForm, stockBottles: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                value={newWineForm.cellarTempC}
                onChange={(e) => setNewWineForm({ ...newWineForm, cellarTempC: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Glass ({currency})</label>
              <input
                type="number"
                min={0}
                value={newWineForm.glassPriceEtb}
                onChange={(e) => setNewWineForm({ ...newWineForm, glassPriceEtb: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Bottle ({currency})</label>
              <input
                type="number"
                min={0}
                value={newWineForm.bottlePriceEtb}
                onChange={(e) => setNewWineForm({ ...newWineForm, bottlePriceEtb: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Wine Cellar Tasting Notes</label>
            <input
              type="text"
              value={newWineForm.tastingNotes}
              onChange={(e) => setNewWineForm({ ...newWineForm, tastingNotes: e.target.value })}
              placeholder="Aroma, oak aging, and menu pairing recommendation"
              className="seam-input w-full"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowNewWineModal(false)}
              className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Save Cellar Bin
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SERVE BOTTLE */}
      <Modal
        open={Boolean(serveWineModal)}
        onClose={() => setServeWineModal(null)}
        title={serveWineModal ? `Serve Bottle · ${serveWineModal.binCode}` : 'Serve Bottle'}
        maxWidthClass="max-w-md"
      >
        {serveWineModal && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-[10px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{serveWineModal.wineName}</div>
              <div className="text-[#78837D] tabular-nums font-mono mt-0.5">
                {formatCurrency(serveWineModal.bottlePriceEtb, currency)} / bottle · {serveWineModal.stockBottles} remaining
              </div>
            </div>

            <form onSubmit={handleServeWineSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Quantity (Bottles)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={serveWineModal.stockBottles}
                    value={serveForm.quantityBottles}
                    onChange={(e) => setServeForm({ ...serveForm, quantityBottles: Number(e.target.value) })}
                    className="seam-input w-full font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Settlement Channel
                  </label>
                  <select
                    value={serveForm.billingMode}
                    onChange={(e) =>
                      setServeForm({ ...serveForm, billingMode: e.target.value as 'room_folio' | 'table_check' })
                    }
                    className="seam-input w-full"
                  >
                    <option value="room_folio">Post to Guest Room Folio</option>
                    <option value="table_check">Dining Table POS Check</option>
                  </select>
                </div>
              </div>

              {serveForm.billingMode === 'room_folio' ? (
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Select Open In-House Room Folio
                  </label>
                  <select
                    required
                    value={serveForm.targetRoomNumber}
                    onChange={(e) => setServeForm({ ...serveForm, targetRoomNumber: e.target.value })}
                    className="seam-input w-full"
                  >
                    {openFolios.length === 0 ? (
                      <option value="">No open room folios</option>
                    ) : (
                      openFolios.map((f) => (
                        <option key={f.id} value={f.roomNumber}>
                          Room {f.roomNumber} · {f.guestName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                    Table Number
                  </label>
                  <select
                    value={serveForm.targetTableNumber}
                    onChange={(e) => setServeForm({ ...serveForm, targetTableNumber: e.target.value })}
                    className="seam-input w-full"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        Table {t.tableNumber} ({t.currentGuestName || TABLE_STATUS_META[t.status].label})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] font-mono tabular-nums">
                  Total: {formatCurrency(serveWineModal.bottlePriceEtb * (serveForm.quantityBottles || 1), currency)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setServeWineModal(null)}
                    className="px-4 py-2 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
                  >
                    Confirm &amp; Deduct Stock
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
