/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Concierge, Transport Fleet, Airport Shuttles & Safari Excursions Hub
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Plane,
  Car,
  MapPin,
  Clock,
  Users,
  Search,
  DollarSign,
  Fuel,
  Gauge,
  Navigation,
  Ship,
  Sparkles,
  Luggage,
  Coffee,
  Ticket,
} from 'lucide-react';
import {
  Hotel,
  FleetVehicle,
  FleetVehicleType,
  AirportTransferBooking,
  TransferType,
  ExcursionActivity,
  ExcursionBooking,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { PageHeader, KpiCard, StatusBadge, Modal, DataTable, DataTableColumn, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency } from '../../utils/formatters';

interface ConciergeAndFleetDispatchProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const ConciergeAndFleetDispatch: React.FC<ConciergeAndFleetDispatchProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const hotelName = activeHotel?.name || 'Hotel Lobby';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';

  const actor = {
    email: currentUser?.email || 'concierge@seam.com',
    fullName: currentUser?.fullName || 'Chief Concierge',
    role: currentUser?.role || 'hotel_admin',
  };

  const [activeTab, setActiveTab] = useState<'transfers' | 'fleet' | 'excursions' | 'catalog'>('transfers');

  const [transferStatusFilter, setTransferStatusFilter] = useState<string>('all');
  const [fleetStatusFilter, setFleetStatusFilter] = useState<string>('all');
  const [excursionStatusFilter, setExcursionStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const reloadData = () => setRefreshKey((prev) => prev + 1);

  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [showExcursionModal, setShowExcursionModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);
  const [showUpdateVehicleModal, setShowUpdateVehicleModal] = useState<boolean>(false);

  useEffect(() => {
    setTransferStatusFilter('all');
    setFleetStatusFilter('all');
    setExcursionStatusFilter('all');
    setSearchTerm('');
    setSelectedVehicle(null);
    setRefreshKey((k) => k + 1);
  }, [hotelId]);

  const transfers: AirportTransferBooking[] = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getAirportTransfers(hotelId);
  }, [hotelId, refreshKey]);

  const vehicles: FleetVehicle[] = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getFleetVehicles(hotelId);
  }, [hotelId, refreshKey]);

  const excursions: ExcursionBooking[] = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getExcursionBookings(hotelId);
  }, [hotelId, refreshKey]);

  const activities: ExcursionActivity[] = useMemo(() => {
    if (!hotelId) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    return saasStorage.getExcursionActivities(hotelId);
  }, [hotelId, refreshKey]);

  const [newTransfer, setNewTransfer] = useState<{
    guestName: string;
    roomNumber: string;
    transferType: TransferType;
    flightNumber: string;
    flightAirline: string;
    pickupLocation: string;
    dropoffLocation: string;
    scheduledDateTime: string;
    passengerCount: number;
    luggagePieces: number;
    assignedVehiclePlate: string;
    assignedDriverName: string;
    rate: number;
    currency: string;
    isComplimentaryVIP: boolean;
    chargeToFolio: boolean;
    notes: string;
  }>({
    guestName: '',
    roomNumber: '',
    transferType: 'airport_pickup',
    flightNumber: 'ET 135',
    flightAirline: 'Ethiopian Airlines',
    pickupLocation: 'Arba Minch Airport (AMH) Terminal 1',
    dropoffLocation: `${hotelName} Lobby`,
    scheduledDateTime: new Date().toISOString().slice(0, 16),
    passengerCount: 2,
    luggagePieces: 2,
    assignedVehiclePlate: 'ET-AA-3-99120',
    assignedDriverName: 'Dawit Kebede',
    rate: 850,
    currency,
    isComplimentaryVIP: false,
    chargeToFolio: true,
    notes: '',
  });

  const [newVehicle, setNewVehicle] = useState<{
    vehicleCode: string;
    makeModel: string;
    licensePlate: string;
    vehicleType: FleetVehicleType;
    passengerCapacity: number;
    assignedDriverName: string;
    currentOdometerKm: number;
    fuelLevelPercent: number;
    notes: string;
  }>({
    vehicleCode: `FLT-VAN-0${vehicles.length + 1}`,
    makeModel: '',
    licensePlate: '',
    vehicleType: 'shuttle_van',
    passengerCapacity: 14,
    assignedDriverName: '',
    currentOdometerKm: 12000,
    fuelLevelPercent: 90,
    notes: '',
  });

  const [vehicleUpdateData, setVehicleUpdateData] = useState<{
    status: FleetVehicle['status'];
    odometerKm: number;
    fuelPercent: number;
  }>({
    status: 'available',
    odometerKm: 0,
    fuelPercent: 85,
  });

  const [newExcursion, setNewExcursion] = useState<{
    activityId: string;
    guestName: string;
    roomNumber: string;
    tourDate: string;
    tourTime: string;
    participantsCount: number;
    licensedGuideName: string;
    assignedVehiclePlate: string;
    kitchenPicnicBoxesRequested: number;
    chargeToFolio: boolean;
    paymentStatus: 'charged_to_room' | 'paid_direct' | 'billed_to_agency';
    tourOperatorAgency: string;
    notes: string;
  }>({
    activityId: activities[0]?.id || 'exc_01',
    guestName: '',
    roomNumber: '',
    tourDate: new Date().toISOString().slice(0, 10),
    tourTime: '08:30',
    participantsCount: 2,
    licensedGuideName: 'Solomon Tadesse (Senior Naturalist)',
    assignedVehiclePlate: 'CHAMO-NAV-04',
    kitchenPicnicBoxesRequested: 2,
    chargeToFolio: true,
    paymentStatus: 'charged_to_room',
    tourOperatorAgency: '',
    notes: '',
  });

  const [newActivity, setNewActivity] = useState<{
    code: string;
    title: string;
    category: 'boat_safari' | 'game_drive' | 'cultural_heritage' | 'trekking_nature' | 'birdwatching';
    durationHours: number;
    pricePerPerson: number;
    maxParticipants: number;
    includesParkPermit: boolean;
    parkPermitFee: number;
    description: string;
    itinerarySummary: string;
  }>({
    code: `EXC-NEW-0${activities.length + 1}`,
    title: '',
    category: 'boat_safari',
    durationHours: 3,
    pricePerPerson: 1500,
    maxParticipants: 10,
    includesParkPermit: true,
    parkPermitFee: 300,
    description: '',
    itinerarySummary: '',
  });

  const totalTransportRevenue = useMemo(() => {
    const trfRev = transfers.reduce((sum, t) => sum + (t.status !== 'cancelled' ? t.rate : 0), 0);
    const excRev = excursions.reduce((sum, e) => sum + (e.status !== 'cancelled' ? e.totalPrice : 0), 0);
    return trfRev + excRev;
  }, [transfers, excursions]);

  if (!activeHotel) return null;

  const scheduledTransfersCount = transfers.filter(
    (t) => t.status === 'scheduled' || t.status === 'driver_dispatched'
  ).length;
  const activeVehiclesOnTrip = vehicles.filter((v) => v.status === 'on_trip').length;
  const todayExcursionsCount = excursions.filter(
    (e) => e.status === 'confirmed' || e.status === 'departed'
  ).length;

  const filteredTransfers = transfers.filter(
    (t) => transferStatusFilter === 'all' || t.status === transferStatusFilter
  );
  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus = fleetStatusFilter === 'all' || v.status === fleetStatusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      v.vehicleCode.toLowerCase().includes(q) ||
      v.makeModel.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });
  const filteredExcursions = excursions.filter(
    (e) => excursionStatusFilter === 'all' || e.status === excursionStatusFilter
  );

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.guestName || !newTransfer.flightNumber) return;

    saasStorage.createAirportTransfer(
      {
        hotelId,
        guestName: newTransfer.guestName,
        roomNumber: newTransfer.roomNumber || undefined,
        transferType: newTransfer.transferType,
        flightNumber: newTransfer.flightNumber,
        flightAirline: newTransfer.flightAirline,
        pickupLocation: newTransfer.pickupLocation,
        dropoffLocation: newTransfer.dropoffLocation,
        scheduledDateTime: newTransfer.scheduledDateTime,
        passengerCount: Number(newTransfer.passengerCount),
        luggagePieces: Number(newTransfer.luggagePieces),
        assignedVehiclePlate: newTransfer.assignedVehiclePlate,
        assignedDriverName: newTransfer.assignedDriverName,
        rate: newTransfer.isComplimentaryVIP ? 0 : Number(newTransfer.rate),
        currency,
        isComplimentaryVIP: newTransfer.isComplimentaryVIP,
        chargeToFolio: newTransfer.chargeToFolio,
        notes: newTransfer.notes,
      },
      actor
    );

    setShowTransferModal(false);
    setNewTransfer({
      guestName: '',
      roomNumber: '',
      transferType: 'airport_pickup',
      flightNumber: 'ET 135',
      flightAirline: 'Ethiopian Airlines',
      pickupLocation: 'Arba Minch Airport (AMH) Terminal 1',
      dropoffLocation: `${hotelName} Lobby`,
      scheduledDateTime: new Date().toISOString().slice(0, 16),
      passengerCount: 2,
      luggagePieces: 2,
      assignedVehiclePlate: 'ET-AA-3-99120',
      assignedDriverName: 'Dawit Kebede',
      rate: 850,
      currency,
      isComplimentaryVIP: false,
      chargeToFolio: true,
      notes: '',
    });
    reloadData();
    toast('Airport transfer scheduled and dispatched to fleet desk', { variant: 'success' });
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.makeModel || !newVehicle.licensePlate) return;

    const fullVehicle: FleetVehicle = {
      id: 'veh_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      vehicleCode: newVehicle.vehicleCode,
      makeModel: newVehicle.makeModel,
      licensePlate: newVehicle.licensePlate,
      vehicleType: newVehicle.vehicleType,
      passengerCapacity: Number(newVehicle.passengerCapacity),
      assignedDriverName: newVehicle.assignedDriverName || undefined,
      currentOdometerKm: Number(newVehicle.currentOdometerKm),
      fuelLevelPercent: Number(newVehicle.fuelLevelPercent),
      status: 'available',
      lastServicedDate: new Date().toISOString().slice(0, 10),
      notes: newVehicle.notes,
    };

    saasStorage.saveFleetVehicle(fullVehicle, actor);
    setShowVehicleModal(false);
    setNewVehicle({
      vehicleCode: `FLT-VAN-0${vehicles.length + 2}`,
      makeModel: '',
      licensePlate: '',
      vehicleType: 'shuttle_van',
      passengerCapacity: 14,
      assignedDriverName: '',
      currentOdometerKm: 12000,
      fuelLevelPercent: 90,
      notes: '',
    });
    reloadData();
    toast(`Registered ${fullVehicle.makeModel} (${fullVehicle.licensePlate}) to fleet`, { variant: 'success' });
  };

  const handleUpdateVehicleStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    saasStorage.updateFleetStatus(
      selectedVehicle.id,
      vehicleUpdateData.status,
      Number(vehicleUpdateData.odometerKm),
      Number(vehicleUpdateData.fuelPercent),
      actor
    );

    setShowUpdateVehicleModal(false);
    setSelectedVehicle(null);
    reloadData();
    toast('Vehicle telemetry & status updated', { variant: 'success' });
  };

  const handleSaveExcursion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExcursion.guestName) return;

    const selActivity = activities.find((a) => a.id === newExcursion.activityId) || activities[0];
    if (!selActivity) return;

    const parkPermitsTotal = selActivity.includesParkPermit
      ? selActivity.parkPermitFee * Number(newExcursion.participantsCount)
      : 0;
    const totalPrice = selActivity.pricePerPerson * Number(newExcursion.participantsCount) + parkPermitsTotal;

    saasStorage.createExcursionBooking(
      {
        hotelId,
        activityId: selActivity.id,
        activityTitle: selActivity.title,
        guestName: newExcursion.guestName,
        roomNumber: newExcursion.roomNumber || undefined,
        tourDate: newExcursion.tourDate,
        tourTime: newExcursion.tourTime,
        participantsCount: Number(newExcursion.participantsCount),
        licensedGuideName: newExcursion.licensedGuideName,
        assignedVehiclePlate: newExcursion.assignedVehiclePlate,
        kitchenPicnicBoxesRequested: Number(newExcursion.kitchenPicnicBoxesRequested),
        ratePerPerson: selActivity.pricePerPerson,
        parkPermitsTotal,
        totalPrice,
        currency,
        chargeToFolio: newExcursion.chargeToFolio,
        paymentStatus: newExcursion.paymentStatus,
        tourOperatorAgency: newExcursion.tourOperatorAgency || undefined,
        notes: newExcursion.notes,
      },
      actor
    );

    setShowExcursionModal(false);
    setNewExcursion({
      activityId: activities[0]?.id || 'exc_01',
      guestName: '',
      roomNumber: '',
      tourDate: new Date().toISOString().slice(0, 10),
      tourTime: '08:30',
      participantsCount: 2,
      licensedGuideName: 'Solomon Tadesse (Senior Naturalist)',
      assignedVehiclePlate: 'CHAMO-NAV-04',
      kitchenPicnicBoxesRequested: 2,
      chargeToFolio: true,
      paymentStatus: 'charged_to_room',
      tourOperatorAgency: '',
      notes: '',
    });
    reloadData();
    toast(`Booked ${selActivity.title} for ${newExcursion.guestName}`, { variant: 'success' });
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.code) return;

    const fullActivity: ExcursionActivity = {
      id: 'exc_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      code: newActivity.code,
      title: newActivity.title,
      category: newActivity.category,
      durationHours: Number(newActivity.durationHours),
      pricePerPerson: Number(newActivity.pricePerPerson),
      currency,
      maxParticipants: Number(newActivity.maxParticipants),
      includesParkPermit: newActivity.includesParkPermit,
      parkPermitFee: newActivity.includesParkPermit ? Number(newActivity.parkPermitFee) : 0,
      description: newActivity.description,
      itinerarySummary: newActivity.itinerarySummary,
      isActive: true,
    };

    saasStorage.saveExcursionActivity(fullActivity, actor);
    setShowActivityModal(false);
    setNewActivity({
      code: `EXC-NEW-0${activities.length + 2}`,
      title: '',
      category: 'boat_safari',
      durationHours: 3,
      pricePerPerson: 1500,
      maxParticipants: 10,
      includesParkPermit: true,
      parkPermitFee: 300,
      description: '',
      itinerarySummary: '',
    });
    reloadData();
    toast(`Added "${fullActivity.title}" to excursion catalog`, { variant: 'success' });
  };

  const handleUpdateTransferStatus = (transferId: string, status: AirportTransferBooking['status']) => {
    saasStorage.updateTransferStatus(transferId, status, actor);
    reloadData();
    toast(`Transfer status updated to ${status.replace(/_/g, ' ')}`, { variant: 'info' });
  };

  const handleUpdateExcursionStatus = (bookingId: string, status: ExcursionBooking['status']) => {
    saasStorage.updateExcursionStatus(bookingId, status, actor);
    reloadData();
    toast(`Excursion status updated to ${status.replace(/_/g, ' ')}`, { variant: 'info' });
  };

  const transferColumns: DataTableColumn<AirportTransferBooking>[] = [
    {
      key: 'num',
      header: 'Booking #',
      sortValue: (t) => t.bookingNumber,
      render: (trf) => <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{trf.bookingNumber}</span>,
    },
    {
      key: 'guest',
      header: 'Guest & Room',
      sortValue: (t) => t.guestName,
      render: (trf) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{trf.guestName}</div>
          <div className="text-[11px] font-mono text-[#78837D]">
            {trf.roomNumber ? `Room ${trf.roomNumber}` : 'VIP Arrival'}
          </div>
        </div>
      ),
    },
    {
      key: 'flight',
      header: 'Flight',
      sortValue: (t) => t.flightNumber,
      render: (trf) => (
        <div>
          <div className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] flex items-center gap-1">
            <Plane className="w-3.5 h-3.5" />
            <span>{trf.flightNumber}</span>
          </div>
          <div className="text-[11px] text-[#78837D]">{trf.flightAirline}</div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (trf) => (
        <div className="text-[11px] max-w-xs space-y-0.5">
          <div className="text-[#202B27] dark:text-[#ECF1EE] flex items-start gap-1">
            <MapPin className="w-3 h-3 text-[#2F6B48] shrink-0 mt-0.5" />
            <span className="break-words">{trf.pickupLocation}</span>
          </div>
          <div className="text-[#78837D] flex items-start gap-1">
            <Navigation className="w-3 h-3 text-[#C6A15B] shrink-0 mt-0.5" />
            <span className="break-words">{trf.dropoffLocation}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'Schedule',
      sortValue: (t) => t.scheduledDateTime,
      render: (trf) => (
        <div className="text-[11px] font-mono">
          <div className="text-[#202B27] dark:text-[#ECF1EE] font-medium">
            {new Date(trf.scheduledDateTime).toLocaleDateString()} ·{' '}
            {new Date(trf.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[#78837D] flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3 h-3" /> {trf.passengerCount}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Luggage className="w-3 h-3" /> {trf.luggagePieces}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Fleet & Driver',
      render: (trf) =>
        trf.assignedVehiclePlate ? (
          <div className="text-[11px]">
            <div className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              {trf.assignedVehiclePlate}
            </div>
            <div className="text-[#78837D]">{trf.assignedDriverName}</div>
          </div>
        ) : (
          <span className="text-[#78837D] text-[11px]">Unassigned</span>
        ),
    },
    {
      key: 'rate',
      header: 'Rate',
      align: 'right',
      sortValue: (t) => (t.isComplimentaryVIP ? 0 : t.rate),
      render: (trf) =>
        trf.isComplimentaryVIP ? (
          <StatusBadge label="Comp VIP" tone="warning" />
        ) : (
          <div className="text-right">
            <div className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
              {formatCurrency(trf.rate, trf.currency || currency)}
            </div>
            {trf.chargeToFolio && <span className="text-[10px] text-[#2F6B48] dark:text-[#66A881]">Room Folio</span>}
          </div>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (t) => t.status,
      render: (trf) => (
        <StatusBadge
          label={trf.status.replace(/_/g, ' ')}
          tone={
            trf.status === 'completed'
              ? 'success'
              : trf.status === 'driver_dispatched'
              ? 'forest'
              : trf.status === 'flight_delayed'
              ? 'warning'
              : trf.status === 'cancelled'
              ? 'critical'
              : 'neutral'
          }
        />
      ),
    },
    {
      key: 'actions',
      header: 'Dispatch',
      align: 'right',
      render: (trf) => (
        <div className="inline-flex items-center gap-1.5">
          {trf.status === 'scheduled' && (
            <button
              onClick={() => handleUpdateTransferStatus(trf.id, 'driver_dispatched')}
              className="px-2.5 py-1 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white text-[11px] font-semibold"
            >
              Dispatch
            </button>
          )}
          {trf.status === 'driver_dispatched' && (
            <button
              onClick={() => handleUpdateTransferStatus(trf.id, 'completed')}
              className="px-2.5 py-1 rounded-[7px] bg-[#2F6B48] hover:bg-[#25573A] text-white text-[11px] font-semibold"
            >
              Complete
            </button>
          )}
          {trf.status !== 'completed' && trf.status !== 'cancelled' && (
            <button
              onClick={() => handleUpdateTransferStatus(trf.id, 'flight_delayed')}
              className="px-2 py-1 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] text-[#9E6B1E] dark:text-[#E5B869] text-[11px] font-medium"
            >
              Delay
            </button>
          )}
        </div>
      ),
    },
  ];

  const excursionColumns: DataTableColumn<ExcursionBooking>[] = [
    {
      key: 'ref',
      header: 'Ref',
      sortValue: (e) => e.bookingRef,
      render: (exc) => <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{exc.bookingRef}</span>,
    },
    {
      key: 'activity',
      header: 'Activity',
      sortValue: (e) => e.activityTitle,
      render: (exc) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{exc.activityTitle}</div>
          <div className="text-[11px] text-[#78837D]">{exc.participantsCount} participants</div>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest / Group',
      sortValue: (e) => e.guestName,
      render: (exc) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{exc.guestName}</div>
          <div className="text-[11px] text-[#78837D] font-mono">
            {exc.roomNumber ? `Room ${exc.roomNumber}` : exc.tourOperatorAgency || 'Day Visitor'}
          </div>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'Departure',
      sortValue: (e) => `${e.tourDate} ${e.tourTime}`,
      render: (exc) => (
        <div className="font-mono text-[11px]">
          <div className="text-[#202B27] dark:text-[#ECF1EE]">{exc.tourDate}</div>
          <div className="text-[#173F35] dark:text-[#C6A15B] font-semibold">{exc.tourTime}</div>
        </div>
      ),
    },
    {
      key: 'guide',
      header: 'Guide & Vehicle',
      render: (exc) => (
        <div className="text-[11px]">
          <div className="text-[#202B27] dark:text-[#ECF1EE]">{exc.licensedGuideName}</div>
          {exc.assignedVehiclePlate && (
            <div className="font-mono text-[#78837D]">{exc.assignedVehiclePlate}</div>
          )}
        </div>
      ),
    },
    {
      key: 'picnic',
      header: 'Picnic Boxes',
      render: (exc) =>
        exc.kitchenPicnicBoxesRequested > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9E6B1E] dark:text-[#E5B869]">
            <Coffee className="w-3.5 h-3.5" />
            {exc.kitchenPicnicBoxesRequested} boxes
          </span>
        ) : (
          <span className="text-[#78837D] text-[11px]">None</span>
        ),
    },
    {
      key: 'total',
      header: 'Billing',
      align: 'right',
      sortValue: (e) => e.totalPrice,
      render: (exc) => (
        <div className="text-right">
          <div className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
            {formatCurrency(exc.totalPrice, exc.currency || currency)}
          </div>
          <div className="text-[10px] text-[#78837D] capitalize">{exc.paymentStatus.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (e) => e.status,
      render: (exc) => (
        <StatusBadge
          label={exc.status}
          tone={exc.status === 'completed' ? 'success' : exc.status === 'departed' ? 'forest' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (exc) => (
        <div className="inline-flex items-center gap-1.5">
          {exc.status === 'confirmed' && (
            <button
              onClick={() => handleUpdateExcursionStatus(exc.id, 'departed')}
              className="px-2.5 py-1 rounded-[7px] bg-[#173F35] hover:bg-[#12322A] text-white text-[11px] font-semibold"
            >
              Depart Tour
            </button>
          )}
          {exc.status === 'departed' && (
            <button
              onClick={() => handleUpdateExcursionStatus(exc.id, 'completed')}
              className="px-2.5 py-1 rounded-[7px] bg-[#2F6B48] hover:bg-[#25573A] text-white text-[11px] font-semibold"
            >
              Return Safe
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Guest Services', 'Concierge & Safaris']}
        title="Concierge, Transport Fleet & Safari Excursions"
        subtitle={`${hotelName} · Flight transfers, vehicle & boat fleet dispatch, and guided excursion bookings with folio billing.`}
        meta={<SampleDataBadge />}
        actions={
          <div>
            {activeTab === 'transfers' && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Plane className="w-4 h-4" />
                <span>Book Airport Transfer</span>
              </button>
            )}
            {activeTab === 'fleet' && (
              <button
                onClick={() => setShowVehicleModal(true)}
                className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Car className="w-4 h-4" />
                <span>Register Vehicle</span>
              </button>
            )}
            {activeTab === 'excursions' && (
              <button
                onClick={() => setShowExcursionModal(true)}
                className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>Book Safari Excursion</span>
              </button>
            )}
            {activeTab === 'catalog' && (
              <button
                onClick={() => setShowActivityModal(true)}
                className="px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Add Safari Activity</span>
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Flight Transfers"
          value={scheduledTransfersCount}
          helper="Scheduled or dispatched"
          deltaTone="forest"
          icon={Plane}
        />
        <KpiCard
          label="Fleet on Trip"
          value={`${activeVehiclesOnTrip} / ${vehicles.length}`}
          helper="Shuttle vans, SUVs & boats"
          deltaTone="neutral"
          icon={Car}
        />
        <KpiCard
          label="Active Excursions"
          value={todayExcursionsCount}
          helper="Confirmed & departed tours"
          deltaTone="positive"
          icon={Compass}
        />
        <KpiCard
          label="Transport & Tour Revenue"
          value={formatCurrency(totalTransportRevenue, currency)}
          helper="Folios & operator billing"
          deltaTone="positive"
          icon={DollarSign}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] w-fit flex-wrap">
        <button
          onClick={() => {
            setActiveTab('transfers');
            setSearchTerm('');
          }}
          className={`px-3.5 py-1.5 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            activeTab === 'transfers'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Airport Transfers ({transfers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('fleet');
            setSearchTerm('');
          }}
          className={`px-3.5 py-1.5 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            activeTab === 'fleet'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Transport Fleet ({vehicles.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('excursions');
            setSearchTerm('');
          }}
          className={`px-3.5 py-1.5 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            activeTab === 'excursions'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Tour Bookings ({excursions.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('catalog');
            setSearchTerm('');
          }}
          className={`px-3.5 py-1.5 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            activeTab === 'catalog'
              ? 'bg-[#173F35] text-white'
              : 'text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Itineraries ({activities.length})</span>
        </button>
      </div>

      {/* TAB 1: TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={transferStatusFilter}
              onChange={(e) => setTransferStatusFilter(e.target.value)}
              className="seam-input text-xs"
            >
              <option value="all">All Transfer Bookings</option>
              <option value="scheduled">Scheduled</option>
              <option value="driver_dispatched">Driver Dispatched</option>
              <option value="completed">Completed</option>
              <option value="flight_delayed">Flight Delayed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <DataTable
            data={filteredTransfers}
            columns={transferColumns}
            keyExtractor={(t) => t.id}
            searchPlaceholder="Search booking #, guest, flight, room..."
            searchFilter={(t, q) =>
              t.bookingNumber.toLowerCase().includes(q) ||
              t.guestName.toLowerCase().includes(q) ||
              t.flightNumber.toLowerCase().includes(q) ||
              (t.roomNumber || '').toLowerCase().includes(q)
            }
            emptyTitle="No airport transfers found"
            emptyDescription="Book an airport transfer or adjust the status filter."
          />
        </div>
      )}

      {/* TAB 2: FLEET */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="seam-surface p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vehicle, plate, driver..."
                  className="seam-input w-full pl-8"
                />
              </div>
              <select
                value={fleetStatusFilter}
                onChange={(e) => setFleetStatusFilter(e.target.value)}
                className="seam-input"
              >
                <option value="all">All Vehicles &amp; Boats</option>
                <option value="available">Available in Depot</option>
                <option value="on_trip">On Trip / En Route</option>
                <option value="reserved">Reserved for Safari</option>
                <option value="in_maintenance">In Maintenance</option>
              </select>
            </div>
            <span className="font-mono text-[#78837D]">
              Showing {filteredVehicles.length} of {vehicles.length} units
            </span>
          </div>

          {filteredVehicles.length === 0 ? (
            <EmptyState title="No fleet vehicles match filters" description="Register a vehicle or clear filters." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredVehicles.map((veh) => {
                const isBoat = veh.vehicleType === 'safari_boat';
                return (
                  <div key={veh.id} className="seam-surface p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-[5px]">
                          {veh.vehicleCode}
                        </span>
                        <StatusBadge
                          label={veh.status.replace(/_/g, ' ')}
                          tone={
                            veh.status === 'available'
                              ? 'success'
                              : veh.status === 'on_trip'
                              ? 'forest'
                              : veh.status === 'reserved'
                              ? 'warning'
                              : 'critical'
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2.5 mt-3">
                        <div className="p-2 rounded-[8px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B]">
                          {isBoat ? <Ship className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-xs leading-snug">
                            {veh.makeModel}
                          </h3>
                          <div className="font-mono text-[11px] text-[#78837D]">{veh.licensePlate}</div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 rounded-[8px] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#78837D]">Capacity:</span>
                          <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            {veh.passengerCapacity} seats
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#78837D]">Driver:</span>
                          <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            {veh.assignedDriverName || 'Rotational'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#78837D]">Odometer:</span>
                          <span className="font-mono text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                            {veh.currentOdometerKm.toLocaleString()} {isBoat ? 'NM' : 'km'}
                          </span>
                        </div>
                        <div className="pt-1">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#78837D] flex items-center gap-1">
                              <Fuel className="w-3 h-3" /> Fuel
                            </span>
                            <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                              {veh.fuelLevelPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-[#E6EBE7] dark:bg-[#22322C] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                veh.fuelLevelPercent < 25
                                  ? 'bg-[#B6463D]'
                                  : veh.fuelLevelPercent < 50
                                  ? 'bg-[#C6A15B]'
                                  : 'bg-[#2F6B48]'
                              }`}
                              style={{ width: `${veh.fuelLevelPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedVehicle(veh);
                          setVehicleUpdateData({
                            status: veh.status,
                            odometerKm: veh.currentOdometerKm,
                            fuelPercent: veh.fuelLevelPercent,
                          });
                          setShowUpdateVehicleModal(true);
                        }}
                        className="px-3 py-1.5 rounded-[7px] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-xs font-medium flex items-center gap-1.5"
                      >
                        <Gauge className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                        <span>Log Odo &amp; Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXCURSIONS */}
      {activeTab === 'excursions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={excursionStatusFilter}
              onChange={(e) => setExcursionStatusFilter(e.target.value)}
              className="seam-input text-xs"
            >
              <option value="all">All Safari Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="departed">Departed / On Tour</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <DataTable
            data={filteredExcursions}
            columns={excursionColumns}
            keyExtractor={(e) => e.id}
            searchPlaceholder="Search booking ref, guest, activity, room..."
            searchFilter={(e, q) =>
              e.bookingRef.toLowerCase().includes(q) ||
              e.guestName.toLowerCase().includes(q) ||
              e.activityTitle.toLowerCase().includes(q) ||
              (e.roomNumber || '').toLowerCase().includes(q)
            }
            emptyTitle="No excursion bookings found"
            emptyDescription="Book an excursion above or clear the status filter."
          />
        </div>
      )}

      {/* TAB 4: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((act) => (
            <div key={act.id} className="seam-surface p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-[5px]">
                  {act.code}
                </span>
                <StatusBadge label={act.category.replace(/_/g, ' ')} tone="neutral" />
              </div>

              <div>
                <h3 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm">{act.title}</h3>
                <p className="text-xs text-[#78837D] mt-1">{act.description}</p>
              </div>

              <div className="bg-[#F6F8F6] dark:bg-[#192622] p-3 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-2">
                <div className="text-[#78837D]">
                  <strong className="text-[#202B27] dark:text-[#ECF1EE]">Itinerary:</strong> {act.itinerarySummary}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
                  <span className="inline-flex items-center gap-1 text-[#78837D]">
                    <Clock className="w-3.5 h-3.5" /> {act.durationHours} hrs
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#78837D]">
                    <Users className="w-3.5 h-3.5" /> Max {act.maxParticipants} pax
                  </span>
                  <span className="font-mono font-bold text-[#173F35] dark:text-[#C6A15B] tabular-nums">
                    {formatCurrency(act.pricePerPerson, currency)} / pax
                  </span>
                </div>
              </div>

              {act.includesParkPermit && (
                <div className="text-[11px] text-[#2F6B48] dark:text-[#66A881] flex items-center gap-1 font-medium">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>
                    Includes National Park Wildlife Permit ({formatCurrency(act.parkPermitFee, currency)} / pax)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: BOOK AIRPORT TRANSFER */}
      <Modal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Schedule Airport & Chauffeur Transfer"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Guest Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Almaz Kebede"
                value={newTransfer.guestName}
                onChange={(e) => setNewTransfer({ ...newTransfer, guestName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Room # (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 101"
                value={newTransfer.roomNumber}
                onChange={(e) => setNewTransfer({ ...newTransfer, roomNumber: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Transfer Type</label>
              <select
                value={newTransfer.transferType}
                onChange={(e) => setNewTransfer({ ...newTransfer, transferType: e.target.value as TransferType })}
                className="seam-input w-full"
              >
                <option value="airport_pickup">Airport Pickup</option>
                <option value="airport_dropoff">Airport Dropoff</option>
                <option value="city_transfer">City Transfer</option>
                <option value="vip_chauffeur">VIP Chauffeur</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Flight # *</label>
              <input
                type="text"
                required
                value={newTransfer.flightNumber}
                onChange={(e) => setNewTransfer({ ...newTransfer, flightNumber: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Airline</label>
              <input
                type="text"
                value={newTransfer.flightAirline}
                onChange={(e) => setNewTransfer({ ...newTransfer, flightAirline: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Pickup Point *</label>
              <input
                type="text"
                required
                value={newTransfer.pickupLocation}
                onChange={(e) => setNewTransfer({ ...newTransfer, pickupLocation: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Dropoff Point *</label>
              <input
                type="text"
                required
                value={newTransfer.dropoffLocation}
                onChange={(e) => setNewTransfer({ ...newTransfer, dropoffLocation: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={newTransfer.scheduledDateTime}
                onChange={(e) => setNewTransfer({ ...newTransfer, scheduledDateTime: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Pax</label>
              <input
                type="number"
                min="1"
                value={newTransfer.passengerCount}
                onChange={(e) => setNewTransfer({ ...newTransfer, passengerCount: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Bags</label>
              <input
                type="number"
                min="0"
                value={newTransfer.luggagePieces}
                onChange={(e) => setNewTransfer({ ...newTransfer, luggagePieces: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Assign Vehicle</label>
              <select
                value={newTransfer.assignedVehiclePlate}
                onChange={(e) => {
                  const veh = vehicles.find((v) => v.licensePlate === e.target.value);
                  setNewTransfer({
                    ...newTransfer,
                    assignedVehiclePlate: e.target.value,
                    assignedDriverName: veh?.assignedDriverName || 'Dawit Kebede',
                  });
                }}
                className="seam-input w-full"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.licensePlate}>
                    {v.vehicleCode} - {v.makeModel} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Driver Name</label>
              <input
                type="text"
                value={newTransfer.assignedDriverName}
                onChange={(e) => setNewTransfer({ ...newTransfer, assignedDriverName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Rate ({currency})</label>
              <input
                type="number"
                min="0"
                disabled={newTransfer.isComplimentaryVIP}
                value={newTransfer.isComplimentaryVIP ? 0 : newTransfer.rate}
                onChange={(e) => setNewTransfer({ ...newTransfer, rate: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums font-semibold"
              />
            </div>
            <div className="space-y-1.5 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTransfer.isComplimentaryVIP}
                  onChange={(e) => setNewTransfer({ ...newTransfer, isComplimentaryVIP: e.target.checked })}
                  className="accent-[#173F35]"
                />
                <span className="font-medium text-[#9E6B1E] dark:text-[#E5B869]">Complimentary VIP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTransfer.chargeToFolio}
                  onChange={(e) => setNewTransfer({ ...newTransfer, chargeToFolio: e.target.checked })}
                  className="accent-[#173F35]"
                />
                <span>Post to Room Folio</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REGISTER FLEET VEHICLE */}
      <Modal
        open={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Register Vehicle in Transport Fleet"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Fleet Code *</label>
              <input
                type="text"
                required
                value={newVehicle.vehicleCode}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleCode: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Vehicle Type</label>
              <select
                value={newVehicle.vehicleType}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value as FleetVehicleType })}
                className="seam-input w-full"
              >
                <option value="shuttle_van">Airport Shuttle Van / Coaster</option>
                <option value="luxury_suv">Luxury 4x4 Chauffeur SUV</option>
                <option value="safari_cruiser">Custom Safari Game Cruiser</option>
                <option value="executive_sedan">Executive VIP Sedan</option>
                <option value="safari_boat">Safari Marine Boat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Make &amp; Model *</label>
            <input
              type="text"
              required
              placeholder="e.g. Toyota Land Cruiser Prado"
              value={newVehicle.makeModel}
              onChange={(e) => setNewVehicle({ ...newVehicle, makeModel: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">License Plate # *</label>
              <input
                type="text"
                required
                placeholder="ET-AA-3-99120"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="60"
                value={newVehicle.passengerCapacity}
                onChange={(e) => setNewVehicle({ ...newVehicle, passengerCapacity: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Assigned Driver</label>
              <input
                type="text"
                value={newVehicle.assignedDriverName}
                onChange={(e) => setNewVehicle({ ...newVehicle, assignedDriverName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Odometer</label>
              <input
                type="number"
                min="0"
                value={newVehicle.currentOdometerKm}
                onChange={(e) => setNewVehicle({ ...newVehicle, currentOdometerKm: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Fuel %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newVehicle.fuelLevelPercent}
                onChange={(e) => setNewVehicle({ ...newVehicle, fuelLevelPercent: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowVehicleModal(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Add to Fleet Register
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: LOG ODOMETER & STATUS */}
      <Modal
        open={showUpdateVehicleModal && Boolean(selectedVehicle)}
        onClose={() => setShowUpdateVehicleModal(false)}
        title="Update Fleet Vehicle Status"
        subtitle={
          selectedVehicle ? `${selectedVehicle.makeModel} · ${selectedVehicle.licensePlate}` : undefined
        }
        maxWidthClass="max-w-sm"
      >
        {selectedVehicle && (
          <form onSubmit={handleUpdateVehicleStatus} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Operational Status
              </label>
              <select
                value={vehicleUpdateData.status}
                onChange={(e) =>
                  setVehicleUpdateData({ ...vehicleUpdateData, status: e.target.value as FleetVehicle['status'] })
                }
                className="seam-input w-full"
              >
                <option value="available">Available in Depot</option>
                <option value="on_trip">On Trip / En Route</option>
                <option value="reserved">Reserved for Upcoming Tour</option>
                <option value="in_maintenance">In Maintenance / Workshop</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Odometer</label>
                <input
                  type="number"
                  min="0"
                  value={vehicleUpdateData.odometerKm}
                  onChange={(e) => setVehicleUpdateData({ ...vehicleUpdateData, odometerKm: Number(e.target.value) })}
                  className="seam-input w-full font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Fuel %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={vehicleUpdateData.fuelPercent}
                  onChange={(e) =>
                    setVehicleUpdateData({ ...vehicleUpdateData, fuelPercent: Number(e.target.value) })
                  }
                  className="seam-input w-full font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setShowUpdateVehicleModal(false)}
                className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
              >
                Save Log
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: BOOK SAFARI EXCURSION */}
      <Modal
        open={showExcursionModal}
        onClose={() => setShowExcursionModal(false)}
        title="Book Safari & Excursion Tour"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveExcursion} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Excursion Activity</label>
            <select
              value={newExcursion.activityId}
              onChange={(e) => setNewExcursion({ ...newExcursion, activityId: e.target.value })}
              className="seam-input w-full"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({formatCurrency(a.pricePerPerson, currency)}/pax · {a.durationHours}h)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Lead Guest Name *</label>
              <input
                type="text"
                required
                value={newExcursion.guestName}
                onChange={(e) => setNewExcursion({ ...newExcursion, guestName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Room # (Optional)</label>
              <input
                type="text"
                value={newExcursion.roomNumber}
                onChange={(e) => setNewExcursion({ ...newExcursion, roomNumber: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Date *</label>
              <input
                type="date"
                required
                value={newExcursion.tourDate}
                onChange={(e) => setNewExcursion({ ...newExcursion, tourDate: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Departure *</label>
              <input
                type="time"
                required
                value={newExcursion.tourTime}
                onChange={(e) => setNewExcursion({ ...newExcursion, tourTime: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Participants</label>
              <input
                type="number"
                min="1"
                max="30"
                value={newExcursion.participantsCount}
                onChange={(e) => setNewExcursion({ ...newExcursion, participantsCount: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Licensed Guide</label>
              <input
                type="text"
                value={newExcursion.licensedGuideName}
                onChange={(e) => setNewExcursion({ ...newExcursion, licensedGuideName: e.target.value })}
                className="seam-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Assigned Vehicle</label>
              <select
                value={newExcursion.assignedVehiclePlate}
                onChange={(e) => setNewExcursion({ ...newExcursion, assignedVehiclePlate: e.target.value })}
                className="seam-input w-full"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.licensePlate}>
                    {v.vehicleCode} - {v.makeModel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Picnic Boxes</label>
              <input
                type="number"
                min="0"
                value={newExcursion.kitchenPicnicBoxesRequested}
                onChange={(e) =>
                  setNewExcursion({ ...newExcursion, kitchenPicnicBoxesRequested: Number(e.target.value) })
                }
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Settlement</label>
              <select
                value={newExcursion.paymentStatus}
                onChange={(e) =>
                  setNewExcursion({
                    ...newExcursion,
                    paymentStatus: e.target.value as 'charged_to_room' | 'paid_direct' | 'billed_to_agency',
                    chargeToFolio: e.target.value === 'charged_to_room',
                  })
                }
                className="seam-input w-full"
              >
                <option value="charged_to_room">Charge to Guest Folio</option>
                <option value="paid_direct">Direct Cash / Card</option>
                <option value="billed_to_agency">Bill Tour Agency</option>
              </select>
            </div>
          </div>

          {newExcursion.paymentStatus === 'billed_to_agency' && (
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Tour Agency Name *</label>
              <input
                type="text"
                required
                value={newExcursion.tourOperatorAgency}
                onChange={(e) => setNewExcursion({ ...newExcursion, tourOperatorAgency: e.target.value })}
                className="seam-input w-full"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowExcursionModal(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Confirm Excursion
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ADD EXCURSION ACTIVITY */}
      <Modal
        open={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Add Excursion Activity / Itinerary"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveActivity} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Activity Code *</label>
              <input
                type="text"
                required
                value={newActivity.code}
                onChange={(e) => setNewActivity({ ...newActivity, code: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newActivity.category}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as any })}
                className="seam-input w-full"
              >
                <option value="boat_safari">Boat Safari &amp; Marine</option>
                <option value="game_drive">National Park Game Drive</option>
                <option value="cultural_heritage">Cultural &amp; Village Tour</option>
                <option value="trekking_nature">Nature Forest Trek</option>
                <option value="birdwatching">Birdwatching Expedition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lake Chamo Sunset Wildlife Cruise"
              value={newActivity.title}
              onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Duration (Hrs)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={newActivity.durationHours}
                onChange={(e) => setNewActivity({ ...newActivity, durationHours: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Rate ({currency})</label>
              <input
                type="number"
                min="100"
                value={newActivity.pricePerPerson}
                onChange={(e) => setNewActivity({ ...newActivity, pricePerPerson: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Max Capacity</label>
              <input
                type="number"
                min="1"
                value={newActivity.maxParticipants}
                onChange={(e) => setNewActivity({ ...newActivity, maxParticipants: Number(e.target.value) })}
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Description *</label>
            <textarea
              required
              rows={2}
              value={newActivity.description}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-1">Itinerary Summary *</label>
            <input
              type="text"
              required
              placeholder="Departure -> Site -> Picnic -> Return"
              value={newActivity.itinerarySummary}
              onChange={(e) => setNewActivity({ ...newActivity, itinerarySummary: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div className="flex items-center gap-4 pt-1 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newActivity.includesParkPermit}
                onChange={(e) => setNewActivity({ ...newActivity, includesParkPermit: e.target.checked })}
                className="accent-[#173F35]"
              />
              <span>Requires Wildlife Entry Permit</span>
            </label>
            {newActivity.includesParkPermit && (
              <div className="flex items-center gap-1.5">
                <span className="text-[#78837D]">Permit ({currency}):</span>
                <input
                  type="number"
                  min="0"
                  value={newActivity.parkPermitFee}
                  onChange={(e) => setNewActivity({ ...newActivity, parkPermitFee: Number(e.target.value) })}
                  className="seam-input w-24 font-mono tabular-nums"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="px-4 py-1.5 border border-[#E6EBE7] dark:border-[#22322C] rounded-[8px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#173F35] hover:bg-[#12322A] text-white rounded-[8px] font-semibold"
            >
              Publish to Catalog
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ConciergeAndFleetDispatch;
