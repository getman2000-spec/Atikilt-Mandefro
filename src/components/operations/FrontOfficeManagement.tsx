/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Front Office, Guest Reservations, Check-In/Out & Folio Engine
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { Reservation, GuestFolio } from '../../types/saas';
import { PageHeader, KpiCard, StatusBadge, Modal, DataTable, DataTableColumn, SampleDataBadge, VerificationNotice } from '../ui';
import { formatCurrency, downloadCsvFile, maskIdNumber } from '../../utils/formatters';
import {
  BedDouble,
  UserCheck,
  UserX,
  PlusCircle,
  Printer,
  Receipt,
  FileText,
  Plus,
  Clock,
  Wallet,
} from 'lucide-react';

export const FrontOfficeManagement: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings.currency || 'ETB';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [folios, setFolios] = useState<GuestFolio[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'in_house' | 'arrivals' | 'departures' | 'confirmed'>('in_house');

  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedFolio, setSelectedFolio] = useState<GuestFolio | null>(null);
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [checkOutBooking, setCheckOutBooking] = useState<Reservation | null>(null);

  const rooms = useMemo(() => (hotelId ? saasStorage.getRooms(hotelId) : []), [hotelId]);
  const roomTypes = useMemo(() => (hotelId ? saasStorage.getRoomTypes(hotelId) : []), [hotelId]);

  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '+251 9',
    guestIdOrPassport: '',
    nationality: 'Ethiopian',
    roomTypeId: '',
    roomId: '',
    checkInDate: new Date().toISOString().slice(0, 10),
    checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    nights: 2,
    dailyRate: 2500,
    source: 'walk_in' as 'walk_in' | 'phone' | 'website' | 'booking_com' | 'corporate',
    specialRequests: '',
    isImmediateCheckIn: true,
  });

  const [chargeForm, setChargeForm] = useState({
    category: 'other' as any,
    description: '',
    amount: 500,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 1000,
    method: 'Telebirr QR & Mobile Pay',
    reference: `TB-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  const refreshData = () => {
    if (!hotelId) return;
    setReservations(saasStorage.getReservations(hotelId));
    setFolios(saasStorage.getGuestFolios(hotelId));
  };

  useEffect(() => {
    refreshData();
    setSelectedFolio(null);
    setCheckOutBooking(null);
  }, [hotelId]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      if (activeTab === 'in_house') return res.status === 'checked_in';
      if (activeTab === 'arrivals') return res.status === 'confirmed' && res.checkInDate <= todayStr;
      if (activeTab === 'departures') return res.status === 'checked_in' && res.checkOutDate <= todayStr;
      if (activeTab === 'confirmed') return res.status === 'confirmed';
      return true;
    });
  }, [reservations, activeTab, todayStr]);

  const stats = useMemo(
    () => ({
      inHouse: reservations.filter((r) => r.status === 'checked_in').length,
      todayArrivals: reservations.filter((r) => r.status === 'confirmed' && r.checkInDate === todayStr).length,
      todayDepartures: reservations.filter((r) => r.status === 'checked_in' && r.checkOutDate === todayStr).length,
      openFolioBalance: folios
        .filter((f) => f.status === 'open')
        .reduce((acc, f) => acc + f.balanceDue, 0),
    }),
    [reservations, folios, todayStr]
  );

  const availableRoomsForType = rooms.filter(
    (r) =>
      (!bookingForm.roomTypeId || r.roomTypeId === bookingForm.roomTypeId) &&
      (r.status === 'inspected' || r.status === 'clean')
  );

  if (!activeHotel) return null;

  const actor = {
    email: user?.email || 'reception@hotel.com',
    fullName: user?.fullName || 'Front Desk Officer',
    role: user?.role || 'staff',
  };

  const handleOpenNewBooking = () => {
    const defaultType = roomTypes[0];
    setBookingForm({
      guestName: '',
      guestEmail: '',
      guestPhone: '+251 9',
      guestIdOrPassport: '',
      nationality: 'Ethiopian',
      roomTypeId: defaultType?.id || '',
      roomId: '',
      checkInDate: new Date().toISOString().slice(0, 10),
      checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      nights: 2,
      dailyRate: defaultType?.standardRate || 2500,
      source: 'walk_in',
      specialRequests: '',
      isImmediateCheckIn: true,
    });
    setIsNewBookingOpen(true);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.guestName.trim()) return;

    const selectedType = roomTypes.find((t) => t.id === bookingForm.roomTypeId) || roomTypes[0];
    const totalRoomCharge = bookingForm.dailyRate * bookingForm.nights;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const bookingReference = `BK-${dateStr}-${rand}`;

    const newRes: Reservation = {
      id: `res_${Math.random().toString(36).substring(2, 8)}`,
      bookingReference,
      hotelId: activeHotel.id,
      guestName: bookingForm.guestName.trim(),
      guestEmail: bookingForm.guestEmail.trim() || `${bookingReference.toLowerCase()}@guest.hotel`,
      guestPhone: bookingForm.guestPhone.trim(),
      guestIdOrPassport: bookingForm.guestIdOrPassport.trim() || undefined,
      nationality: bookingForm.nationality,
      roomTypeId: selectedType?.id || 'standard',
      roomTypeName: selectedType?.name || 'Standard Room',
      roomId: bookingForm.roomId || undefined,
      roomNumber: bookingForm.roomId
        ? rooms.find((r) => r.id === bookingForm.roomId)?.roomNumber
        : undefined,
      checkInDate: bookingForm.checkInDate,
      checkOutDate: bookingForm.checkOutDate,
      nights: bookingForm.nights,
      dailyRate: bookingForm.dailyRate,
      totalRoomCharge,
      status: bookingForm.isImmediateCheckIn && bookingForm.roomId ? 'checked_in' : 'confirmed',
      source: bookingForm.source,
      paymentStatus: 'unpaid',
      specialRequests: bookingForm.specialRequests || undefined,
      checkedInAt: bookingForm.isImmediateCheckIn && bookingForm.roomId ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveReservation(newRes, actor);
    if (bookingForm.isImmediateCheckIn && bookingForm.roomId) {
      saasStorage.checkInGuest(newRes.id, bookingForm.roomId, actor);
    }

    refreshData();
    setIsNewBookingOpen(false);
    toast(
      newRes.status === 'checked_in'
        ? `Checked in ${newRes.guestName} to Room ${newRes.roomNumber}`
        : `Reservation ${newRes.bookingReference} saved for ${newRes.guestName}`,
      { variant: 'success' }
    );
  };

  const handleCheckInExisting = (res: Reservation) => {
    const matchRooms = rooms.filter(
      (r) => r.roomTypeId === res.roomTypeId && (r.status === 'inspected' || r.status === 'clean')
    );
    const targetRoom = matchRooms[0] || rooms.find((r) => r.status === 'inspected' || r.status === 'clean');

    if (!targetRoom) {
      toast('No clean or inspected rooms available in inventory. Please verify with Housekeeping.', { variant: 'warning' });
      return;
    }

    saasStorage.checkInGuest(res.id, targetRoom.id, actor);
    refreshData();
    toast(`Checked in ${res.guestName} to Room ${targetRoom.roomNumber}`, { variant: 'success' });
  };

  const handleOpenCheckOut = (res: Reservation) => {
    setCheckOutBooking(res);
    const folio = saasStorage.getGuestFolioByBookingId(res.id);
    setSelectedFolio(folio || null);
  };

  const handleConfirmCheckOut = () => {
    if (!checkOutBooking) return;
    saasStorage.checkOutGuest(checkOutBooking.id, actor);
    toast(`${checkOutBooking.guestName} checked out · Room ${checkOutBooking.roomNumber} sent to Housekeeping`, { variant: 'success' });
    refreshData();
    setCheckOutBooking(null);
    setSelectedFolio(null);
  };

  const handleOpenFolio = (res: Reservation) => {
    let folio = saasStorage.getGuestFolioByBookingId(res.id);
    if (!folio && res.status === 'checked_in' && res.roomId) {
      folio = saasStorage.checkInGuest(res.id, res.roomId, actor);
    }
    setCheckOutBooking(null);
    setSelectedFolio(folio || null);
  };

  const handleAddFolioCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio || !chargeForm.description) return;

    const updated = saasStorage.addChargeToFolio(
      selectedFolio.id,
      {
        category: chargeForm.category,
        description: chargeForm.description,
        amount: Number(chargeForm.amount),
        postedBy: actor.fullName,
      },
      actor
    );

    setSelectedFolio(updated);
    refreshData();
    setIsAddChargeOpen(false);
    setChargeForm({ category: 'other', description: '', amount: 500 });
    toast(`Posted charge to Room ${selectedFolio.roomNumber} folio`, { variant: 'success' });
  };

  const handleAddFolioPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio || !paymentForm.amount) return;

    const updated = saasStorage.addPaymentToFolio(
      selectedFolio.id,
      {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        receivedBy: actor.fullName,
      },
      actor
    );

    setSelectedFolio(updated);
    refreshData();
    setIsAddPaymentOpen(false);
    toast(`Payment of ${formatCurrency(Number(paymentForm.amount), currency)} recorded`, { variant: 'success' });
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'checked_in':
        return <StatusBadge label="In-House" tone="forest" />;
      case 'confirmed':
        return <StatusBadge label="Confirmed" tone="warning" />;
      case 'checked_out':
        return <StatusBadge label="Checked Out" tone="neutral" />;
      default:
        return <StatusBadge label={status.replace(/_/g, ' ')} tone="critical" />;
    }
  };

  const columns: DataTableColumn<Reservation>[] = [
    {
      key: 'ref',
      header: 'Booking Ref',
      sortValue: (r) => r.bookingReference,
      render: (res) => (
        <div>
          <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
            {res.bookingReference}
          </span>
          <span className="block text-[11px] text-[#78837D] capitalize">{res.source.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest Details',
      sortValue: (r) => r.guestName,
      render: (res) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{res.guestName}</div>
          <div className="text-[11px] text-[#78837D] flex flex-wrap items-center gap-2 font-mono">
            <span>{res.guestPhone}</span>
            {res.guestIdOrPassport && (
              <span className="px-1.5 py-0.5 rounded bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
                ID {maskIdNumber(res.guestIdOrPassport)}
              </span>
            )}
            {res.nationality && (
              <span className="font-sans px-1.5 py-0.5 rounded bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
                {res.nationality}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room & Category',
      sortValue: (r) => r.roomNumber || 'ZZZ',
      render: (res) => (
        <div>
          {res.roomNumber ? (
            <span className="inline-flex px-2 py-0.5 rounded-[6px] font-mono font-semibold text-[11px] bg-[#173F35]/10 text-[#173F35] dark:bg-[#173F35]/40 dark:text-[#C6A15B] border border-[#173F35]/20">
              Room {res.roomNumber}
            </span>
          ) : (
            <span className="text-[#9E6B1E] dark:text-[#E5B869] font-medium text-[11px]">Unassigned</span>
          )}
          <div className="text-[11px] text-[#78837D] mt-0.5">{res.roomTypeName}</div>
        </div>
      ),
    },
    {
      key: 'stay',
      header: 'Stay Duration',
      sortValue: (r) => r.checkInDate,
      render: (res) => (
        <div>
          <div className="font-mono text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
            {res.checkInDate} → {res.checkOutDate}
          </div>
          <div className="text-[11px] text-[#78837D]">
            {res.nights} {res.nights === 1 ? 'Night' : 'Nights'}
          </div>
        </div>
      ),
    },
    {
      key: 'rate',
      header: 'Room Total',
      align: 'right',
      sortValue: (r) => r.totalRoomCharge,
      render: (res) => (
        <div>
          <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
            {formatCurrency(res.totalRoomCharge, currency)}
          </span>
          <span className="block text-[10px] text-[#78837D] font-mono tabular-nums">
            ({formatCurrency(res.dailyRate, currency)} / night)
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (res) => getStatusBadge(res.status),
    },
    {
      key: 'actions',
      header: 'Front Desk Actions',
      align: 'right',
      render: (res) => {
        const isInHouse = res.status === 'checked_in';
        const isConfirmed = res.status === 'confirmed';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isConfirmed && (
              <button
                onClick={() => handleCheckInExisting(res)}
                className="px-2.5 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Check-In</span>
              </button>
            )}
            {isInHouse && (
              <>
                <button
                  onClick={() => handleOpenFolio(res)}
                  className="px-2.5 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] font-medium flex items-center gap-1 text-[11px]"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                  <span>Folio</span>
                </button>
                <button
                  onClick={() => handleOpenCheckOut(res)}
                  className="px-2.5 py-1.5 rounded-[8px] bg-[#C6A15B] hover:bg-[#B28D49] text-[#173F35] font-semibold flex items-center gap-1 text-[11px]"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Check-Out</span>
                </button>
              </>
            )}
            {res.status === 'checked_out' && (
              <button
                onClick={() => handleOpenFolio(res)}
                className="px-2.5 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE] font-medium flex items-center gap-1 text-[11px]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Archived Folio</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const handleExportCsv = () => {
    downloadCsvFile(
      `${activeHotel.code || 'hotel'}-front-office-reservations.csv`,
      ['Reference', 'Guest', 'Phone', 'Room', 'Category', 'Check-In', 'Check-Out', 'Nights', 'Total Charge', 'Currency', 'Status'],
      filteredReservations.map((r) => [
        r.bookingReference,
        r.guestName,
        r.guestPhone,
        r.roomNumber || 'Unassigned',
        r.roomTypeName,
        r.checkInDate,
        r.checkOutDate,
        r.nights,
        r.totalRoomCharge,
        currency,
        r.status,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Daily Operations', 'Front Office']}
        title="Front Desk, Reservations & Guest Folios"
        subtitle={`${activeHotel.name} · Manage live arrivals, check-ins, room folios, and checkout settlement.`}
        meta={<SampleDataBadge />}
        actions={
          <button
            onClick={handleOpenNewBooking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Reservation / Walk-In</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="In-House Guests"
          value={stats.inHouse}
          helper="Occupied rooms active"
          deltaTone="forest"
          icon={BedDouble}
        />
        <KpiCard
          label="Today's Arrivals"
          value={stats.todayArrivals}
          helper="Expected check-ins"
          deltaTone={stats.todayArrivals > 0 ? 'warning' : 'neutral'}
          icon={UserCheck}
        />
        <KpiCard
          label="Today's Departures"
          value={stats.todayDepartures}
          helper="Scheduled check-outs"
          deltaTone="neutral"
          icon={Clock}
        />
        <KpiCard
          label="Open Guest Ledger"
          value={formatCurrency(stats.openFolioBalance, currency)}
          helper="Unsettled in-house balance"
          deltaTone="positive"
          icon={Wallet}
        />
      </div>

      {/* View Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          [
            { id: 'in_house', label: `In-House (${stats.inHouse})` },
            { id: 'arrivals', label: `Arrivals (${stats.todayArrivals})` },
            { id: 'departures', label: `Departures (${stats.todayDepartures})` },
            { id: 'confirmed', label: 'Upcoming Reservations' },
            { id: 'all', label: `All Bookings (${reservations.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors border ${
              activeTab === t.id
                ? 'bg-[#173F35] text-white border-[#173F35]'
                : 'bg-white dark:bg-[#131D1A] text-[#78837D] border-[#E6EBE7] dark:border-[#22322C] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredReservations}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search guest name, room #, booking ref, phone..."
        searchFilter={(r, q) =>
          r.guestName.toLowerCase().includes(q) ||
          r.bookingReference.toLowerCase().includes(q) ||
          (r.roomNumber || '').toLowerCase().includes(q) ||
          r.guestPhone.toLowerCase().includes(q)
        }
        onExportCsv={handleExportCsv}
        emptyTitle="No reservations in this view"
        emptyDescription="Switch tabs or create a new walk-in reservation to get started."
      />

      {/* MODAL 1: NEW RESERVATION / WALK-IN CHECK-IN */}
      <Modal
        open={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        title="New Reservation & Guest Check-In"
        subtitle="Create a direct booking or immediate walk-in arrival."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Guest Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ato Girma Wolde"
                value={bookingForm.guestName}
                onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                className="seam-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+251 9..."
                value={bookingForm.guestPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="guest@mail.com"
                value={bookingForm.guestEmail}
                onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                className="seam-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                National ID / Passport
              </label>
              <input
                type="text"
                placeholder="ETH-PASS-..."
                value={bookingForm.guestIdOrPassport}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, guestIdOrPassport: e.target.value.toUpperCase() })
                }
                className="seam-input w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Room Category *
              </label>
              <select
                value={bookingForm.roomTypeId}
                onChange={(e) => {
                  const type = roomTypes.find((t) => t.id === e.target.value);
                  setBookingForm({
                    ...bookingForm,
                    roomTypeId: e.target.value,
                    dailyRate: type?.standardRate || 2500,
                    roomId: '',
                  });
                }}
                className="seam-input w-full"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.standardRate} {t.baseRateCurrency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Assign Room ({availableRoomsForType.length} Available)
              </label>
              <select
                value={bookingForm.roomId}
                onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                className="seam-input w-full font-mono"
              >
                <option value="">-- Assign Room Later --</option>
                {availableRoomsForType.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} (Floor {r.floor} · {r.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Check-In *
              </label>
              <input
                type="date"
                required
                value={bookingForm.checkInDate}
                onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Check-Out *
              </label>
              <input
                type="date"
                required
                value={bookingForm.checkOutDate}
                onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Nights
              </label>
              <input
                type="number"
                min="1"
                value={bookingForm.nights}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, nights: parseInt(e.target.value) || 1 })
                }
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Daily Rate ({currency})
              </label>
              <input
                type="number"
                min="1"
                value={bookingForm.dailyRate}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, dailyRate: parseFloat(e.target.value) || 0 })
                }
                className="seam-input w-full font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Booking Source
              </label>
              <select
                value={bookingForm.source}
                onChange={(e) => setBookingForm({ ...bookingForm, source: e.target.value as any })}
                className="seam-input w-full"
              >
                <option value="walk_in">Walk-In (Front Desk)</option>
                <option value="phone">Direct Phone Call</option>
                <option value="website">Hotel Website</option>
                <option value="corporate">Corporate Contract</option>
                <option value="booking_com">Online Travel Agency (OTA)</option>
              </select>
            </div>
          </div>

          <label className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                Immediate Walk-In Check-In
              </span>
              <span className="text-[11px] text-[#78837D]">
                Marks assigned room Occupied and opens the guest folio immediately.
              </span>
            </div>
            <input
              type="checkbox"
              checked={bookingForm.isImmediateCheckIn}
              onChange={(e) => setBookingForm({ ...bookingForm, isImmediateCheckIn: e.target.checked })}
              className="rounded accent-[#173F35] w-4 h-4"
            />
          </label>

          <div className="p-3 bg-[#173F35]/5 dark:bg-[#173F35]/30 border border-[#173F35]/15 rounded-[10px] flex items-center justify-between">
            <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">Estimated Room Charge:</span>
            <span className="text-sm font-bold tabular-nums font-mono text-[#173F35] dark:text-[#C6A15B]">
              {formatCurrency(bookingForm.dailyRate * bookingForm.nights, currency)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewBookingOpen(false)}
              className="px-3.5 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Confirm &amp; Save Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: GUEST FOLIO & BILLING DETAIL */}
      <Modal
        open={Boolean(selectedFolio)}
        onClose={() => {
          setSelectedFolio(null);
          setCheckOutBooking(null);
        }}
        title={selectedFolio ? `Guest Folio: Room ${selectedFolio.roomNumber}` : 'Guest Folio'}
        subtitle={
          selectedFolio
            ? `${selectedFolio.guestName} · Ref ${selectedFolio.bookingReference}`
            : undefined
        }
        maxWidthClass="max-w-2xl"
      >
        {selectedFolio && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <StatusBadge
                label={selectedFolio.status === 'settled' ? 'Settled & Paid' : 'Open Balance'}
                tone={selectedFolio.status === 'settled' ? 'success' : 'warning'}
              />
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] font-medium flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>

            {/* Charges Table */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Itemized Charges &amp; Services
                </span>
                {selectedFolio.status !== 'settled' && (
                  <button
                    onClick={() => setIsAddChargeOpen(true)}
                    className="text-xs text-[#173F35] dark:text-[#C6A15B] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Charge</span>
                  </button>
                )}
              </div>

              <div className="rounded-[10px] border border-[#E6EBE7] dark:border-[#22322C] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D]">
                    <tr>
                      <th className="p-2.5 font-semibold">Date</th>
                      <th className="p-2.5 font-semibold">Category</th>
                      <th className="p-2.5 font-semibold">Description</th>
                      <th className="p-2.5 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                    {selectedFolio.charges.map((chg) => (
                      <tr key={chg.id}>
                        <td className="p-2.5 font-mono text-[#78837D] text-[11px]">{chg.date}</td>
                        <td className="p-2.5 capitalize font-medium text-[#173F35] dark:text-[#C6A15B] text-[11px]">
                          {chg.category.replace(/_/g, ' ')}
                        </td>
                        <td className="p-2.5 text-[#202B27] dark:text-[#ECF1EE]">{chg.description}</td>
                        <td className="p-2.5 font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] text-right">
                          {formatCurrency(chg.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Table */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Payments &amp; Deposits Received
                </span>
                {selectedFolio.status !== 'settled' && (
                  <button
                    onClick={() => {
                      setPaymentForm({
                        amount: Math.max(0, Math.round(selectedFolio.balanceDue)),
                        method: 'Telebirr QR & Mobile Pay',
                        reference: `TB-${Math.floor(100000 + Math.random() * 900000)}`,
                      });
                      setIsAddPaymentOpen(true);
                    }}
                    className="text-xs text-[#2F6B48] dark:text-[#66A881] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Receive Payment</span>
                  </button>
                )}
              </div>

              <div className="rounded-[10px] border border-[#E6EBE7] dark:border-[#22322C] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D]">
                    <tr>
                      <th className="p-2.5 font-semibold">Date</th>
                      <th className="p-2.5 font-semibold">Method</th>
                      <th className="p-2.5 font-semibold">Transaction Ref</th>
                      <th className="p-2.5 font-semibold text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                    {selectedFolio.payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-[#78837D]">
                          No payments received yet.
                        </td>
                      </tr>
                    ) : (
                      selectedFolio.payments.map((pmt) => (
                        <tr key={pmt.id}>
                          <td className="p-2.5 font-mono text-[#78837D] text-[11px]">{pmt.date}</td>
                          <td className="p-2.5 text-[#202B27] dark:text-[#ECF1EE] font-medium">{pmt.method}</td>
                          <td className="p-2.5 font-mono text-[#78837D] text-[11px]">{pmt.reference}</td>
                          <td className="p-2.5 font-mono font-semibold tabular-nums text-[#2F6B48] dark:text-[#66A881] text-right">
                            {formatCurrency(pmt.amount, currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 bg-[#F6F8F6] dark:bg-[#192622] rounded-[10px] space-y-2 border border-[#E6EBE7] dark:border-[#22322C]">
              <div className="flex justify-between text-[#78837D]">
                <span>Subtotal (Room &amp; Outlets):</span>
                <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(selectedFolio.subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>VAT (15%):</span>
                <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(selectedFolio.vatAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#78837D]">
                <span>Service Charge (10%):</span>
                <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(selectedFolio.serviceChargeAmount, currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-between font-bold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                <span>Grand Total:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(selectedFolio.grandTotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#2F6B48] dark:text-[#66A881] font-semibold">
                <span>Total Paid:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(selectedFolio.totalPaid, currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-between font-bold text-base text-[#B6463D] dark:text-[#E27A71]">
                <span>Balance Due:</span>
                <span className="tabular-nums font-mono">
                  {formatCurrency(selectedFolio.balanceDue, currency)}
                </span>
              </div>
            </div>

            <VerificationNotice />

            {checkOutBooking && (
              <div className="p-3.5 bg-[#FDF7EC] dark:bg-[#2A2012] border border-[#E9D6B0] dark:border-[#4A381D] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-[#9E6B1E] dark:text-[#E5B869] block">
                    Ready to complete check-out?
                  </span>
                  <span className="text-[11px] text-[#78837D]">
                    Room {selectedFolio.roomNumber} will be marked Dirty and dispatched to Housekeeping.
                  </span>
                </div>
                <button
                  disabled={selectedFolio.balanceDue > 0.5}
                  onClick={handleConfirmCheckOut}
                  className="px-4 py-2 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] disabled:opacity-45 text-white font-semibold text-xs shrink-0"
                >
                  {selectedFolio.balanceDue > 0.5 ? 'Settle Balance to Check-Out' : 'Confirm Check-Out'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 3: POST CHARGE TO FOLIO */}
      <Modal
        open={isAddChargeOpen && Boolean(selectedFolio)}
        onClose={() => setIsAddChargeOpen(false)}
        title={selectedFolio ? `Post Charge · Room ${selectedFolio.roomNumber}` : 'Post Charge'}
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleAddFolioCharge} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Charge Category
            </label>
            <select
              value={chargeForm.category}
              onChange={(e) => setChargeForm({ ...chargeForm, category: e.target.value as any })}
              className="seam-input w-full"
            >
              <option value="laundry">Laundry &amp; Dry Cleaning</option>
              <option value="minibar">Minibar Consumption</option>
              <option value="restaurant">Food &amp; Beverage / Restaurant</option>
              <option value="spa">Spa &amp; Wellness Treatment</option>
              <option value="other">Airport Shuttle / Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Item Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2x Shirts Pressed, Express Laundry"
              value={chargeForm.description}
              onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
              className="seam-input w-full"
            />
          </div>

          <div>
            <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={chargeForm.amount}
              onChange={(e) =>
                setChargeForm({ ...chargeForm, amount: parseFloat(e.target.value) || 0 })
              }
              className="seam-input w-full font-mono tabular-nums font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsAddChargeOpen(false)}
              className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
            >
              Post to Folio
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: RECORD PAYMENT TO FOLIO */}
      <Modal
        open={isAddPaymentOpen && Boolean(selectedFolio)}
        onClose={() => setIsAddPaymentOpen(false)}
        title={selectedFolio ? `Record Payment · Room ${selectedFolio.roomNumber}` : 'Record Payment'}
        maxWidthClass="max-w-sm"
      >
        {selectedFolio && (
          <form onSubmit={handleAddFolioPayment} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Payment Amount ({currency}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                }
                className="seam-input w-full font-mono tabular-nums font-bold text-base"
              />
              <span className="text-[11px] text-[#78837D] mt-1 block font-mono">
                Balance Due: {formatCurrency(selectedFolio.balanceDue, currency)}
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Settlement Method *
              </label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                className="seam-input w-full"
              >
                <option value="Cash (ETB)">Cash (ETB)</option>
                <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                <option value="Telebirr QR & Mobile Pay">Telebirr QR &amp; Mobile Pay</option>
                <option value="Awash Bank Transfer">Awash Bank Transfer</option>
                <option value="Visa & Mastercard Credit Card">Visa &amp; Mastercard Credit Card</option>
                <option value="US Dollar Cash (USD)">US Dollar Cash (USD)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Bank Reference / Transaction ID *
              </label>
              <input
                type="text"
                required
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="seam-input w-full font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setIsAddPaymentOpen(false)}
                className="px-3 py-1.5 rounded-[8px] border border-[#E6EBE7] dark:border-[#22322C] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[8px] bg-[#173F35] hover:bg-[#12322A] text-white font-semibold"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
