/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Conferences, Events & Banqueting Hub
 * Venue capacity inventory, booking pipeline, schedule timeline, BEO authorization, and deposit tracking.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Building,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  ShieldCheck,
  FileText,
  Utensils,
  Monitor,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import {
  Hotel,
  EventSpace,
  EventBooking,
  EventBookingStatus,
  EventSpaceSetupType,
  BanquetEventItem,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  EmptyState,
  Modal,
  DataTable,
  SampleDataBadge,
  VerificationNotice,
  type DataTableColumn,
} from '../ui';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { calculateHospitalityLevies } from '../../utils/taxAndPayrollCalculator';

interface EventManagementProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const EventManagement: React.FC<EventManagementProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'bookings' | 'spaces' | 'calendar' | 'beo_sheet'>('bookings');
  const [refreshKey, setRefreshKey] = useState(0);

  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const eventSpaces = useMemo(() => {
    return hotelId ? saasStorage.getEventSpaces(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const eventBookings = useMemo(() => {
    return hotelId ? saasStorage.getEventBookings(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [spaceFilter, setSpaceFilter] = useState<string>('all');

  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<EventBooking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBEOBookingId, setSelectedBEOBookingId] = useState<string>('');
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);

  useEffect(() => {
    setIsNewBookingModalOpen(false);
    setIsNewSpaceModalOpen(false);
    setIsDrawerOpen(false);
    setSelectedBookingForDrawer(null);
    setStatusFilter('all');
    setSpaceFilter('all');
    setPaymentAmountInput(0);
    setSelectedBEOBookingId(eventBookings[0]?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  useEffect(() => {
    if (!selectedBEOBookingId && eventBookings.length > 0) {
      setSelectedBEOBookingId(eventBookings[0].id);
    }
  }, [eventBookings, selectedBEOBookingId]);

  const [newBookingForm, setNewBookingForm] = useState({
    eventTitle: '',
    clientName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    organizationTin: '',
    eventSpaceId: '',
    setupType: 'theater' as EventSpaceSetupType,
    expectedAttendees: 50,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed' as EventBookingStatus,
    cateringMenuTitle: 'Standard Day Conference Package (Lunch + 2 Coffee Breaks)',
    specialDietaryNotes: '',
    avRequirements: ['Projector & Screen', 'Wireless Microphones'],
    venueRate: 25000,
    cateringPerPax: 400,
    depositPaid: 0,
    notes: '',
  });

  const [newSpaceForm, setNewSpaceForm] = useState({
    name: '',
    code: '',
    floorOrLocation: 'Ground Floor Conference Wing',
    areaSqMeters: 100,
    dimensionsMeters: '10m x 10m',
    theaterCap: 100,
    classroomCap: 60,
    banquetCap: 80,
    uShapeCap: 30,
    boardroomCap: 25,
    cocktailCap: 120,
    dailyRate: 20000,
    halfDayRate: 12000,
    hourlyRate: 3000,
    amenities: 'Projector, Sound System, Wi-Fi, Stage',
  });

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'events@property.local',
      fullName: currentUser?.fullName || 'Banquet Manager',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const renderStatusBadge = (status: EventBookingStatus) => {
    switch (status) {
      case 'inquiry':
        return <StatusBadge label="Inquiry" tone="neutral" />;
      case 'tentative':
        return <StatusBadge label="Tentative Hold" tone="warning" />;
      case 'confirmed':
        return <StatusBadge label="Confirmed" tone="success" />;
      case 'in_progress':
        return <StatusBadge label="In Progress" tone="forest" />;
      case 'completed':
        return <StatusBadge label="Completed" tone="neutral" />;
      case 'cancelled':
        return <StatusBadge label="Cancelled" tone="critical" />;
    }
  };

  const filteredBookings = useMemo(() => {
    return eventBookings.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchSpace = spaceFilter === 'all' || b.eventSpaceId === spaceFilter;
      return matchStatus && matchSpace;
    });
  }, [eventBookings, statusFilter, spaceFilter]);

  const handleOpenNewBooking = (spaceOverride?: EventSpace) => {
    const targetSpace = spaceOverride || eventSpaces[0];
    setNewBookingForm((prev) => ({
      ...prev,
      eventSpaceId: targetSpace ? targetSpace.id : prev.eventSpaceId,
      venueRate: targetSpace ? targetSpace.dailyRate : prev.venueRate,
    }));
    setIsNewBookingModalOpen(true);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newBookingForm.eventTitle.trim() || !newBookingForm.eventSpaceId) return;

    const space = eventSpaces.find((s) => s.id === newBookingForm.eventSpaceId);
    if (!space) return;

    const attendees = Number(newBookingForm.expectedAttendees) || 1;
    const cateringTotal = attendees * (Number(newBookingForm.cateringPerPax) || 0);
    const venueTotal = Number(newBookingForm.venueRate) || 0;

    const lineItems: BanquetEventItem[] = [
      {
        itemType: 'venue_rental',
        name: `${space.name} Venue Hire`,
        quantity: 1,
        unitPrice: venueTotal,
        totalPrice: venueTotal,
      },
    ];

    if (cateringTotal > 0) {
      lineItems.push({
        itemType: 'catering_package',
        name: newBookingForm.cateringMenuTitle,
        quantity: attendees,
        unitPrice: Number(newBookingForm.cateringPerPax) || 0,
        totalPrice: cateringTotal,
        notes: newBookingForm.specialDietaryNotes || undefined,
      });
    }

    const subtotal = venueTotal + cateringTotal;
    const rules = saasStorage.getFinancialRules(hotelId);
    const levies = calculateHospitalityLevies(subtotal, {
      vatRatePercent: rules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
      serviceChargeRatePercent:
        rules?.serviceChargeRate ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
    });
    const serviceCharge = levies.serviceChargeAmount;
    const vat = levies.vatAmount;
    const grandTotal = levies.total;
    const deposit = Math.min(grandTotal, Number(newBookingForm.depositPaid) || 0);
    const balance = grandTotal - deposit;

    const created = saasStorage.createEventBooking(
      {
        hotelId,
        eventTitle: newBookingForm.eventTitle.trim(),
        clientName: newBookingForm.clientName.trim(),
        contactPerson: newBookingForm.contactPerson.trim(),
        contactPhone: newBookingForm.contactPhone.trim(),
        contactEmail: newBookingForm.contactEmail.trim(),
        organizationTin: newBookingForm.organizationTin || undefined,
        eventSpaceId: space.id,
        eventSpaceName: space.name,
        setupType: newBookingForm.setupType,
        expectedAttendees: attendees,
        startDate: newBookingForm.startDate,
        endDate: newBookingForm.endDate,
        startTime: newBookingForm.startTime,
        endTime: newBookingForm.endTime,
        status: newBookingForm.status,
        cateringMenuTitle: newBookingForm.cateringMenuTitle,
        specialDietaryNotes: newBookingForm.specialDietaryNotes || undefined,
        avRequirements: newBookingForm.avRequirements,
        lineItems,
        subtotal,
        serviceCharge10Pct: serviceCharge,
        vat15Pct: vat,
        grandTotal,
        depositPaid: deposit,
        balanceDue: balance,
        currency,
        beoApprovedByGM: false,
        notes: newBookingForm.notes || undefined,
      },
      actor
    );

    setIsNewBookingModalOpen(false);
    setNewBookingForm((prev) => ({
      ...prev,
      eventTitle: '',
      clientName: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      specialDietaryNotes: '',
      notes: '',
    }));
    if (created?.id) {
      setSelectedBEOBookingId(created.id);
    }
    triggerRefresh();
    toast('Event booking confirmed', {
      description: `${newBookingForm.eventTitle} reserved in ${space.name}.`,
      variant: 'success',
    });
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newSpaceForm.name.trim() || !newSpaceForm.code.trim()) return;

    const newSpace: EventSpace = {
      id: 'spc_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      name: newSpaceForm.name.trim(),
      code: newSpaceForm.code.trim().toUpperCase(),
      floorOrLocation: newSpaceForm.floorOrLocation.trim(),
      areaSqMeters: Number(newSpaceForm.areaSqMeters) || 100,
      dimensionsMeters: newSpaceForm.dimensionsMeters,
      capacities: {
        theater: Number(newSpaceForm.theaterCap) || 100,
        classroom: Number(newSpaceForm.classroomCap) || 60,
        banquet: Number(newSpaceForm.banquetCap) || 80,
        u_shape: Number(newSpaceForm.uShapeCap) || 30,
        boardroom: Number(newSpaceForm.boardroomCap) || 25,
        cocktail: Number(newSpaceForm.cocktailCap) || 120,
      },
      dailyRate: Number(newSpaceForm.dailyRate) || 20000,
      halfDayRate: Number(newSpaceForm.halfDayRate) || 12000,
      hourlyRate: Number(newSpaceForm.hourlyRate) || 3000,
      currency,
      amenities: newSpaceForm.amenities
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    saasStorage.saveEventSpace(newSpace, actor);
    setIsNewSpaceModalOpen(false);
    setNewSpaceForm((prev) => ({ ...prev, name: '', code: '' }));
    triggerRefresh();
    toast('Venue space registered', {
      description: `${newSpace.name} (${newSpace.code}) added to venue inventory.`,
      variant: 'success',
    });
  };

  const handleSignBEO = (bookingId: string) => {
    saasStorage.signBEO(bookingId, actor);
    triggerRefresh();
    if (selectedBookingForDrawer?.id === bookingId) {
      setSelectedBookingForDrawer((prev) =>
        prev ? { ...prev, beoApprovedByGM: true, beoApprovedAt: new Date().toISOString() } : null
      );
    }
    toast('BEO digitally signed', {
      description: 'Banquet Event Order authorized for staging & culinary execution.',
      variant: 'success',
    });
  };

  const handleRecordPayment = (bookingId: string) => {
    if (paymentAmountInput <= 0) return;
    const updated = saasStorage.recordEventPayment(bookingId, paymentAmountInput, actor);
    if (updated) {
      setSelectedBookingForDrawer(updated);
      toast('Banquet payment posted', {
        description: `${formatCurrency(paymentAmountInput, currency, currencySymbol)} applied. Balance: ${formatCurrency(updated.balanceDue, currency, currencySymbol)}.`,
        variant: 'success',
      });
      setPaymentAmountInput(0);
      triggerRefresh();
    }
  };

  const exportBookingsCSV = () => {
    const headers = [
      'Booking Ref',
      'Event Title',
      'Client / Organizer',
      'Venue Space',
      'Setup Style',
      'Start Date',
      'End Date',
      'Time',
      'Attendees',
      'Status',
      `Grand Total (${currency})`,
      `Deposit Paid (${currency})`,
      `Balance Due (${currency})`,
      'BEO Approved',
    ];

    const rows = filteredBookings.map((b) => [
      b.bookingReference,
      b.eventTitle,
      b.clientName,
      b.eventSpaceName,
      b.setupType,
      b.startDate,
      b.endDate,
      `${b.startTime} - ${b.endTime}`,
      b.expectedAttendees,
      b.status,
      b.grandTotal,
      b.depositPaid,
      b.balanceDue,
      b.beoApprovedByGM ? 'Yes' : 'No',
    ]);

    downloadCsvFile(
      `events-banqueting-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
    toast('Event bookings exported', {
      description: `${filteredBookings.length} booking records downloaded as CSV.`,
      variant: 'info',
    });
  };

  const totalPipelineRevenue = useMemo(
    () => eventBookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.grandTotal : 0), 0),
    [eventBookings]
  );
  const confirmedCount = useMemo(
    () => eventBookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress').length,
    [eventBookings]
  );
  const pendingBEOsCount = useMemo(
    () => eventBookings.filter((b) => !b.beoApprovedByGM && b.status === 'confirmed').length,
    [eventBookings]
  );

  const currentBEOBooking = useMemo(() => {
    return eventBookings.find((b) => b.id === selectedBEOBookingId) || eventBookings[0] || null;
  }, [eventBookings, selectedBEOBookingId]);

  const bookingColumns: DataTableColumn<EventBooking>[] = [
    {
      key: 'ref',
      header: 'Reference & Event',
      sortable: true,
      sortValue: (b) => b.bookingReference,
      render: (b) => (
        <div className="min-w-[190px]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B]">
              {b.bookingReference}
            </span>
            {b.beoApprovedByGM ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> BEO Signed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                <Clock className="w-3 h-3" /> BEO Pending
              </span>
            )}
          </div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
            {b.eventTitle}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client & Contact',
      sortable: true,
      sortValue: (b) => b.clientName,
      render: (b) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{b.clientName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            {b.contactPerson} · {b.contactPhone}
          </div>
        </div>
      ),
    },
    {
      key: 'space',
      header: 'Venue & Setup',
      sortable: true,
      sortValue: (b) => b.eventSpaceName,
      render: (b) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{b.eventSpaceName}</div>
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199] capitalize font-mono">
            {b.setupType.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates & Hours',
      sortable: true,
      sortValue: (b) => b.startDate,
      render: (b) => (
        <div className="whitespace-nowrap">
          <div className="font-mono text-xs text-[#202B27] dark:text-[#ECF1EE]">
            {b.startDate}
            {b.startDate !== b.endDate ? ` → ${b.endDate}` : ''}
          </div>
          <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
            {b.startTime} – {b.endTime}
          </div>
        </div>
      ),
    },
    {
      key: 'pax',
      header: 'Pax',
      align: 'center',
      sortable: true,
      sortValue: (b) => b.expectedAttendees,
      render: (b) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {b.expectedAttendees}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (b) => b.status,
      render: (b) => renderStatusBadge(b.status),
    },
    {
      key: 'total',
      header: 'Grand Total',
      align: 'right',
      sortable: true,
      sortValue: (b) => b.grandTotal,
      render: (b) => (
        <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(b.grandTotal, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance Due',
      align: 'right',
      sortable: true,
      sortValue: (b) => b.balanceDue,
      render: (b) => (
        <span
          className={`font-mono tabular-nums font-semibold ${
            b.balanceDue > 0
              ? 'text-rose-700 dark:text-rose-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {formatCurrency(b.balanceDue, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (b) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBookingForDrawer(b);
            setIsDrawerOpen(true);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
        >
          Manage
          <ArrowRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const tabs = [
    { id: 'bookings' as const, label: 'Event Bookings', count: eventBookings.length, icon: Calendar },
    { id: 'spaces' as const, label: 'Venues & Spaces', count: eventSpaces.length, icon: Building },
    { id: 'calendar' as const, label: 'Space Schedule', count: eventSpaces.length, icon: Clock },
    { id: 'beo_sheet' as const, label: 'BEO Center', count: pendingBEOsCount, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Events & MICE', 'Conferences & Banquets']}
        title="Conferences, Events & Banqueting"
        subtitle="Ballroom and meeting space reservations, Banquet Event Orders (BEO), catering coordination, and corporate event settlements."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{activeHotel?.name || 'Active Property'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{currency}</span>
            <span aria-hidden="true">·</span>
            <span>{eventSpaces.length} Event Spaces</span>
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsNewSpaceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <Building className="w-3.5 h-3.5 text-[#78837D]" />
              Add Event Space
            </button>
            <button
              type="button"
              onClick={() => handleOpenNewBooking()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Event Booking
            </button>
          </>
        }
      />

      <VerificationNotice />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Event Pipeline Revenue"
          value={formatCurrency(totalPipelineRevenue, currency, currencySymbol, { compact: true })}
          deltaTone="forest"
          helper="Active & confirmed contracts"
          icon={Wallet}
        />
        <KpiCard
          label="Confirmed Events"
          value={confirmedCount}
          deltaTone="positive"
          helper="Ready for staging & catering"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Pending GM BEO Sign-off"
          value={pendingBEOsCount}
          delta={pendingBEOsCount > 0 ? 'Action Required' : 'All Signed'}
          deltaTone={pendingBEOsCount > 0 ? 'warning' : 'positive'}
          helper="Executive authorization queue"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Venues & Meeting Halls"
          value={eventSpaces.length}
          deltaTone="neutral"
          helper="Configured bookable spaces"
          icon={Building}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#E6EBE7] dark:border-[#22322C] flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#ECF1EE] font-semibold'
                  : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  tab.id === 'beo_sheet' && pendingBEOsCount > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-[#F1F4F1] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <DataTable
          data={filteredBookings}
          columns={bookingColumns}
          keyExtractor={(b) => b.id}
          searchPlaceholder="Search booking ref, event title, client, or space..."
          searchFilter={(b, q) =>
            b.bookingReference.toLowerCase().includes(q) ||
            b.eventTitle.toLowerCase().includes(q) ||
            b.clientName.toLowerCase().includes(q) ||
            b.eventSpaceName.toLowerCase().includes(q) ||
            b.contactPerson.toLowerCase().includes(q)
          }
          filterToolbar={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs seam-input"
              >
                <option value="all">All Statuses</option>
                <option value="inquiry">Inquiry</option>
                <option value="tentative">Tentative Hold</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={spaceFilter}
                onChange={(e) => setSpaceFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs seam-input"
              >
                <option value="all">All Event Spaces</option>
                {eventSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          }
          onExportCsv={exportBookingsCSV}
          emptyTitle="No event bookings found"
          emptyDescription="Adjust your search or filters, or create a new conference or banquet reservation."
          emptyAction={
            <button
              type="button"
              onClick={() => handleOpenNewBooking()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Event Booking
            </button>
          }
          onRowClick={(b) => {
            setSelectedBookingForDrawer(b);
            setIsDrawerOpen(true);
          }}
        />
      )}

      {/* TAB 2: VENUES & SPACES REGISTER */}
      {activeTab === 'spaces' && (
        eventSpaces.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No event spaces configured"
            description="Register ballrooms, boardrooms, or outdoor banquet spaces to accept MICE bookings."
            action={
              <button
                type="button"
                onClick={() => setIsNewSpaceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event Space
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventSpaces.map((space) => (
              <div key={space.id} className="seam-surface p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2.5 py-0.5 rounded-md">
                      {space.code}
                    </span>
                    <StatusBadge
                      label={`${space.areaSqMeters} m² · ${space.dimensionsMeters || 'Flexible'}`}
                      tone="success"
                      showIcon={false}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-[#202B27] dark:text-[#ECF1EE]">
                      {space.name}
                    </h3>
                    <p className="text-xs text-[#78837D] dark:text-[#92A199] flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>{space.floorOrLocation}</span>
                    </p>
                  </div>

                  <div className="seam-surface-subtle p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                      Seating Capacity Matrix
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {[
                        { label: 'Theater', val: space.capacities.theater },
                        { label: 'Classroom', val: space.capacities.classroom },
                        { label: 'Banquet', val: space.capacities.banquet },
                        { label: 'U-Shape', val: space.capacities.u_shape },
                        { label: 'Boardroom', val: space.capacities.boardroom },
                        { label: 'Cocktail', val: space.capacities.cocktail },
                      ].map((cap) => (
                        <div
                          key={cap.label}
                          className="bg-white dark:bg-[#131D1A] p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C]"
                        >
                          <span className="text-[10px] text-[#78837D] dark:text-[#92A199] block">
                            {cap.label}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {cap.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {space.amenities.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199] block mb-1.5">
                        Equipment &amp; Facilities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {space.amenities.map((am, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                      Full Day Rate
                    </span>
                    <div className="text-sm font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                      {formatCurrency(space.dailyRate, currency, currencySymbol)}
                      <span className="text-[11px] font-normal text-[#78837D]"> / day</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenNewBooking(space)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Book Venue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 3: VISUAL SPACE SCHEDULE */}
      {activeTab === 'calendar' && (
        <div className="seam-surface p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
            <div>
              <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                Space Occupancy &amp; Booking Schedule
              </h3>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                Prevent double-booking across convention halls and meeting rooms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label="Confirmed" tone="success" />
              <StatusBadge label="Tentative" tone="warning" />
            </div>
          </div>

          <div className="space-y-4">
            {eventSpaces.map((space) => {
              const spaceBookings = eventBookings.filter(
                (b) => b.eventSpaceId === space.id && b.status !== 'cancelled'
              );
              return (
                <div key={space.id} className="seam-surface-subtle p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
                      <h4 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                        {space.name}
                      </h4>
                      <span className="text-xs font-mono text-[#78837D] dark:text-[#92A199]">
                        ({space.code})
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
                      {spaceBookings.length} {spaceBookings.length === 1 ? 'Booking' : 'Bookings'}
                    </span>
                  </div>

                  {spaceBookings.length === 0 ? (
                    <div className="p-3 rounded-lg border border-dashed border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-center text-xs text-[#78837D] dark:text-[#92A199]">
                      No events scheduled. Venue open for reservations.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {spaceBookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBookingForDrawer(b);
                            setIsDrawerOpen(true);
                          }}
                          className="text-left p-3 rounded-lg bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] hover:border-[#647B52] transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B]">
                              {b.bookingReference}
                            </span>
                            {renderStatusBadge(b.status)}
                          </div>
                          <div className="font-semibold text-xs text-[#202B27] dark:text-[#ECF1EE]">
                            {b.eventTitle}
                          </div>
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                            {b.clientName} · {b.expectedAttendees} pax
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE] flex items-center justify-between pt-1 border-t border-[#E6EBE7]/70 dark:border-[#22322C]/70">
                            <span>
                              {b.startDate}
                              {b.startDate !== b.endDate ? ` → ${b.endDate}` : ''}
                            </span>
                            <span>
                              {b.startTime} – {b.endTime}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BANQUET EVENT ORDER (BEO) CENTER */}
      {activeTab === 'beo_sheet' && (
        !currentBEOBooking ? (
          <EmptyState
            icon={FileText}
            title="No Banquet Event Orders available"
            description="Create an event reservation to generate an official printable Banquet Event Order sheet."
            action={
              <button
                type="button"
                onClick={() => handleOpenNewBooking()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Event Booking
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="seam-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-medium text-[#78837D] dark:text-[#92A199]">
                  Select Event BEO
                </label>
                <select
                  value={currentBEOBooking.id}
                  onChange={(e) => setSelectedBEOBookingId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium seam-input min-w-[260px]"
                >
                  {eventBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingReference} — {b.eventTitle} ({b.startDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {!currentBEOBooking.beoApprovedByGM && (
                  <button
                    type="button"
                    onClick={() => handleSignBEO(currentBEOBooking.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sign BEO as General Manager
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
                >
                  <Printer className="w-3.5 h-3.5 text-[#78837D]" />
                  Print BEO
                </button>
              </div>
            </div>

            <div className="seam-surface p-6 sm:p-8 space-y-6 print:border-none print:p-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#202B27]/20 dark:border-[#22322C]">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#647B52] dark:text-[#C6A15B]">
                    {activeHotel?.name || 'Property Operations'} · Banquet Operations
                  </span>
                  <h2 className="text-xl font-bold text-[#202B27] dark:text-[#ECF1EE] mt-1">
                    BANQUET EVENT ORDER (BEO)
                  </h2>
                  <div className="text-xs text-[#78837D] dark:text-[#92A199] mt-1">
                    Venue:{' '}
                    <strong className="text-[#202B27] dark:text-[#ECF1EE]">
                      {currentBEOBooking.eventSpaceName}
                    </strong>
                  </div>
                </div>

                <div className="sm:text-right space-y-1.5">
                  <div className="font-mono text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    REF: {currentBEOBooking.bookingReference}
                  </div>
                  <div className="text-xs text-[#78837D] dark:text-[#92A199]">
                    Issued: {formatShortDate(currentBEOBooking.createdAt)}
                  </div>
                  <div>
                    <StatusBadge
                      label={currentBEOBooking.beoApprovedByGM ? 'GM Signed & Authorized' : 'Pending GM Sign-Off'}
                      tone={currentBEOBooking.beoApprovedByGM ? 'success' : 'warning'}
                    />
                  </div>
                </div>
              </div>

              <div className="seam-surface-subtle grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-xs">
                <div>
                  <span className="text-[#78837D] dark:text-[#92A199] block">Event Title</span>
                  <strong className="text-[#202B27] dark:text-[#ECF1EE] block mt-0.5">
                    {currentBEOBooking.eventTitle}
                  </strong>
                </div>
                <div>
                  <span className="text-[#78837D] dark:text-[#92A199] block">Organization / Client</span>
                  <strong className="text-[#202B27] dark:text-[#ECF1EE] block mt-0.5">
                    {currentBEOBooking.clientName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#78837D] dark:text-[#92A199] block">Contact Person</span>
                  <span className="text-[#202B27] dark:text-[#ECF1EE] block mt-0.5">
                    {currentBEOBooking.contactPerson} ({currentBEOBooking.contactPhone})
                  </span>
                </div>
                <div>
                  <span className="text-[#78837D] dark:text-[#92A199] block">Expected Attendance</span>
                  <strong className="text-[#173F35] dark:text-[#C6A15B] font-mono tabular-nums text-sm block mt-0.5">
                    {currentBEOBooking.expectedAttendees} Delegates
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="seam-surface-subtle p-4 space-y-2">
                  <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                    Timeline &amp; Schedule
                  </div>
                  <div className="space-y-1 text-[#78837D] dark:text-[#92A199]">
                    <div>
                      <strong className="text-[#202B27] dark:text-[#ECF1EE]">Dates:</strong>{' '}
                      <span className="font-mono">
                        {currentBEOBooking.startDate} to {currentBEOBooking.endDate}
                      </span>
                    </div>
                    <div>
                      <strong className="text-[#202B27] dark:text-[#ECF1EE]">Hours:</strong>{' '}
                      <span className="font-mono">
                        {currentBEOBooking.startTime} – {currentBEOBooking.endTime}
                      </span>
                    </div>
                    <div>
                      <strong className="text-[#202B27] dark:text-[#ECF1EE]">Setup:</strong>{' '}
                      <span className="capitalize">{currentBEOBooking.setupType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="seam-surface-subtle p-4 space-y-2">
                  <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                    Audio-Visual &amp; Staging
                  </div>
                  <ul className="space-y-1 text-[#78837D] dark:text-[#92A199]">
                    {currentBEOBooking.avRequirements.map((av, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-[#C6A15B]">·</span>
                        <span>{av}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="seam-surface-subtle p-4 space-y-2">
                  <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                    Catering &amp; Dietary Notes
                  </div>
                  <div className="text-[#202B27] dark:text-[#ECF1EE] font-medium">
                    {currentBEOBooking.cateringMenuTitle}
                  </div>
                  {currentBEOBooking.specialDietaryNotes && (
                    <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-medium">
                      Dietary: {currentBEOBooking.specialDietaryNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] overflow-hidden">
                <div className="bg-[#F6F8F6] dark:bg-[#192622] px-4 py-2.5 font-semibold text-xs text-[#202B27] dark:text-[#ECF1EE] border-b border-[#E6EBE7] dark:border-[#22322C]">
                  Banqueting Billing &amp; Line Items
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F6F8F6]/60 dark:bg-[#192622]/60 text-[#78837D] dark:text-[#92A199] border-b border-[#E6EBE7] dark:border-[#22322C]">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Description</th>
                        <th className="px-4 py-2 text-center font-medium">Category</th>
                        <th className="px-4 py-2 text-center font-medium">Qty</th>
                        <th className="px-4 py-2 text-right font-medium">Unit Rate</th>
                        <th className="px-4 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                      {currentBEOBooking.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            {item.name}
                          </td>
                          <td className="px-4 py-2.5 text-center capitalize text-[#78837D] dark:text-[#92A199]">
                            {item.itemType.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono tabular-nums font-semibold">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            {formatCurrency(item.unitPrice, currency, currencySymbol)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(item.totalPrice, currency, currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#F6F8F6]/70 dark:bg-[#192622]/50 p-4 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#78837D] dark:text-[#92A199]">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(currentBEOBooking.subtotal, currency, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#78837D] dark:text-[#92A199]">
                      <span>10% Service Charge</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(currentBEOBooking.serviceCharge10Pct, currency, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#78837D] dark:text-[#92A199]">
                      <span>15% VAT</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(currentBEOBooking.vat15Pct, currency, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE] pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
                      <span>Grand Total</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(currentBEOBooking.grandTotal, currency, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                      <span>Deposit Collected</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(currentBEOBooking.depositPaid, currency, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 font-semibold">
                      <span>Balance Due</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(currentBEOBooking.balanceDue, currency, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
                <div className="seam-surface-subtle p-3.5 text-center">
                  <div className="text-[#78837D] dark:text-[#92A199] mb-5">Banquet Sales &amp; Events</div>
                  <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    {actor.fullName}
                  </div>
                  <div className="text-[10px] text-[#78837D] dark:text-[#92A199]">Coordinator Sign-off</div>
                </div>
                <div className="seam-surface-subtle p-3.5 text-center">
                  <div className="text-[#78837D] dark:text-[#92A199] mb-5">Culinary Production</div>
                  <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    Executive Kitchen Lead
                  </div>
                  <div className="text-[10px] text-[#78837D] dark:text-[#92A199]">Menu &amp; Dietary Sign-off</div>
                </div>
                <div className="seam-surface-subtle p-3.5 text-center">
                  <div className="text-[#78837D] dark:text-[#92A199] mb-5">General Manager Authorization</div>
                  <div
                    className={`font-semibold ${
                      currentBEOBooking.beoApprovedByGM
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {currentBEOBooking.beoApprovedByGM ? 'APPROVED & AUTHORIZED' : 'Awaiting GM Review'}
                  </div>
                  <div className="text-[10px] text-[#78837D] dark:text-[#92A199] font-mono mt-0.5">
                    {currentBEOBooking.beoApprovedAt
                      ? formatShortDate(currentBEOBooking.beoApprovedAt)
                      : 'Pending signature'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* MODAL: MANAGE BOOKING & RECORD PAYMENT */}
      <Modal
        open={isDrawerOpen && Boolean(selectedBookingForDrawer)}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedBookingForDrawer?.eventTitle || 'Manage Event Booking'}
        subtitle={
          selectedBookingForDrawer
            ? `${selectedBookingForDrawer.bookingReference} · ${selectedBookingForDrawer.clientName}`
            : undefined
        }
        maxWidthClass="max-w-xl"
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            {selectedBookingForDrawer && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBEOBookingId(selectedBookingForDrawer.id);
                  setActiveTab('beo_sheet');
                  setIsDrawerOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                View Full BEO Sheet
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedBookingForDrawer && (
          <div className="space-y-4 text-xs">
            <div className="seam-surface-subtle p-3.5 space-y-2">
              <label className="block font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Booking Lifecycle Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  ['inquiry', 'tentative', 'confirmed', 'in_progress', 'completed', 'cancelled'] as EventBookingStatus[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      const updated = saasStorage.updateEventBookingStatus(
                        selectedBookingForDrawer.id,
                        st,
                        {},
                        actor
                      );
                      if (updated) setSelectedBookingForDrawer(updated);
                      triggerRefresh();
                      toast('Event status updated', {
                        description: `${selectedBookingForDrawer.bookingReference} marked as ${st.replace('_', ' ')}.`,
                        variant: 'success',
                      });
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                      selectedBookingForDrawer.status === st
                        ? 'bg-[#173F35] text-white font-semibold'
                        : 'bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="seam-surface-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Record Banquet Deposit / Settlement
                </span>
                <span className="font-mono tabular-nums font-semibold text-rose-700 dark:text-rose-400">
                  Balance: {formatCurrency(selectedBookingForDrawer.balanceDue, currency, currencySymbol)}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder={`Amount (${currency})`}
                  value={paymentAmountInput || ''}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="flex-1 px-3 py-2 text-xs seam-input font-mono tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => handleRecordPayment(selectedBookingForDrawer.id)}
                  disabled={paymentAmountInput <= 0}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white disabled:opacity-40"
                >
                  Post Payment
                </button>
              </div>
            </div>

            {!selectedBookingForDrawer.beoApprovedByGM && (
              <div className="flex items-center justify-between seam-surface-subtle p-3.5">
                <div>
                  <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                    GM BEO Authorization
                  </div>
                  <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                    Authorize kitchen and banquet setup execution.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSignBEO(selectedBookingForDrawer.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sign BEO
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: NEW EVENT BOOKING */}
      <Modal
        open={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        title="New Conference & Banqueting Booking"
        subtitle="Reserve ballroom or meeting space with catering packages and staging layouts."
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Regional Healthcare Directors Annual Symposium"
              value={newBookingForm.eventTitle}
              onChange={(e) => setNewBookingForm({ ...newBookingForm, eventTitle: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Client / Organization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., World Health Organization"
                value={newBookingForm.clientName}
                onChange={(e) => setNewBookingForm({ ...newBookingForm, clientName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                placeholder="Primary coordinator"
                value={newBookingForm.contactPerson}
                onChange={(e) => setNewBookingForm({ ...newBookingForm, contactPerson: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+251 91 100 2233"
                value={newBookingForm.contactPhone}
                onChange={(e) => setNewBookingForm({ ...newBookingForm, contactPhone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="events@organization.org"
                value={newBookingForm.contactEmail}
                onChange={(e) => setNewBookingForm({ ...newBookingForm, contactEmail: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Venue Space *
              </label>
              <select
                value={newBookingForm.eventSpaceId}
                onChange={(e) => {
                  const sp = eventSpaces.find((s) => s.id === e.target.value);
                  setNewBookingForm({
                    ...newBookingForm,
                    eventSpaceId: e.target.value,
                    venueRate: sp ? sp.dailyRate : newBookingForm.venueRate,
                  });
                }}
                className="w-full px-3 py-2 seam-input"
              >
                {eventSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Seating Layout
              </label>
              <select
                value={newBookingForm.setupType}
                onChange={(e) =>
                  setNewBookingForm({ ...newBookingForm, setupType: e.target.value as EventSpaceSetupType })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="theater">Theater (Auditorium)</option>
                <option value="classroom">Classroom (Desks &amp; Chairs)</option>
                <option value="banquet">Banquet (Round Tables)</option>
                <option value="u_shape">U-Shape</option>
                <option value="boardroom">Executive Boardroom</option>
                <option value="cocktail">Cocktail Standing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Expected Pax
              </label>
              <input
                type="number"
                min="1"
                value={newBookingForm.expectedAttendees}
                onChange={(e) =>
                  setNewBookingForm({ ...newBookingForm, expectedAttendees: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newBookingForm.startDate}
                onChange={(e) =>
                  setNewBookingForm({ ...newBookingForm, startDate: e.target.value, endDate: e.target.value })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={newBookingForm.endDate}
                onChange={(e) => setNewBookingForm({ ...newBookingForm, endDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Venue Hire Fee ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={newBookingForm.venueRate}
                onChange={(e) => setNewBookingForm({ ...newBookingForm, venueRate: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Catering Per Pax ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={newBookingForm.cateringPerPax}
                onChange={(e) =>
                  setNewBookingForm({ ...newBookingForm, cateringPerPax: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Catering Package / Menu
            </label>
            <input
              type="text"
              value={newBookingForm.cateringMenuTitle}
              onChange={(e) => setNewBookingForm({ ...newBookingForm, cateringMenuTitle: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Special Dietary Requests
            </label>
            <input
              type="text"
              placeholder="e.g., 6 Vegetarian, 2 Halal, 1 Gluten-free"
              value={newBookingForm.specialDietaryNotes}
              onChange={(e) => setNewBookingForm({ ...newBookingForm, specialDietaryNotes: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewBookingModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REGISTER EVENT SPACE */}
      <Modal
        open={isNewSpaceModalOpen}
        onClose={() => setIsNewSpaceModalOpen(false)}
        title="Register Venue Space"
        subtitle="Define conference halls, ballrooms, or outdoor garden venues for event reservations."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateSpace} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Venue / Hall Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Grand Convention Ballroom"
              value={newSpaceForm.name}
              onChange={(e) => setNewSpaceForm({ ...newSpaceForm, name: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Space Code *
              </label>
              <input
                type="text"
                required
                placeholder="HALL-01"
                value={newSpaceForm.code}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, code: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Floor / Wing
              </label>
              <input
                type="text"
                value={newSpaceForm.floorOrLocation}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, floorOrLocation: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Area (m²)
              </label>
              <input
                type="number"
                min="10"
                value={newSpaceForm.areaSqMeters}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, areaSqMeters: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Dimensions
              </label>
              <input
                type="text"
                value={newSpaceForm.dimensionsMeters}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, dimensionsMeters: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="seam-surface-subtle p-3 space-y-2">
            <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
              Maximum Seating Capacities
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'theaterCap', label: 'Theater', val: newSpaceForm.theaterCap },
                { key: 'classroomCap', label: 'Classroom', val: newSpaceForm.classroomCap },
                { key: 'banquetCap', label: 'Banquet', val: newSpaceForm.banquetCap },
                { key: 'uShapeCap', label: 'U-Shape', val: newSpaceForm.uShapeCap },
                { key: 'boardroomCap', label: 'Boardroom', val: newSpaceForm.boardroomCap },
                { key: 'cocktailCap', label: 'Cocktail', val: newSpaceForm.cocktailCap },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] text-[#78837D] mb-0.5">{field.label}</label>
                  <input
                    type="number"
                    value={field.val}
                    onChange={(e) =>
                      setNewSpaceForm({ ...newSpaceForm, [field.key]: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 seam-input font-mono tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Full Day Hire ({currency})
              </label>
              <input
                type="number"
                value={newSpaceForm.dailyRate}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, dailyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Half Day Hire ({currency})
              </label>
              <input
                type="number"
                value={newSpaceForm.halfDayRate}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, halfDayRate: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewSpaceModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Save Space
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
