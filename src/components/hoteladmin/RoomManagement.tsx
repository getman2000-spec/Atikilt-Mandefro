/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Room Management & Inventory Configuration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { Room, RoomType, RoomOperationalStatus } from '../../types/saas';
import { DEFAULT_ROOM_AMENITIES } from '../../constants/saasDefaults';
import { PageHeader, KpiCard, DataTable, DataTableColumn, StatusBadge, StatusTone, Modal, EmptyState } from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';
import {
  BedDouble,
  PlusCircle,
  Search,
  Layers,
  Grid,
  List,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Wrench,
} from 'lucide-react';

const STATUS_META: Record<
  RoomOperationalStatus,
  { label: string; tone: StatusTone }
> = {
  clean: { label: 'Clean', tone: 'success' },
  inspected: { label: 'Inspected', tone: 'forest' },
  dirty: { label: 'Dirty', tone: 'warning' },
  occupied: { label: 'Occupied', tone: 'neutral' },
  maintenance: { label: 'Maintenance', tone: 'warning' },
  out_of_order: { label: 'Out of Order', tone: 'critical' },
};

export const RoomManagement: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'inventory' | 'types'>('inventory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [rooms, setRooms] = useState<Room[]>(() =>
    activeHotel ? saasStorage.getRooms(activeHotel.id) : []
  );
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(() =>
    activeHotel ? saasStorage.getRoomTypes(activeHotel.id) : []
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RoomOperationalStatus | 'all'>('all');

  // Modals
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isBatchRoomOpen, setIsBatchRoomOpen] = useState(false);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    floor: 1,
    roomTypeId: roomTypes[0]?.id || '',
    status: 'clean' as RoomOperationalStatus,
    keyCardUid: '',
    notes: '',
  });

  const [batchForm, setBatchForm] = useState({
    floor: 1,
    startNumber: 101,
    endNumber: 110,
    roomTypeId: roomTypes[0]?.id || '',
    initialStatus: 'inspected' as RoomOperationalStatus,
  });

  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    standardRate: 2500,
    capacityAdults: 2,
    capacityChildren: 1,
    bedType: 'King' as 'Single' | 'Double' | 'King' | 'Twin' | 'Suite',
    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'En-suite Bathroom'] as string[],
  });

  useEffect(() => {
    if (!activeHotel) return;
    const nextRooms = saasStorage.getRooms(activeHotel.id);
    const nextTypes = saasStorage.getRoomTypes(activeHotel.id);
    setRooms(nextRooms);
    setRoomTypes(nextTypes);
    setRoomForm((prev) => ({ ...prev, roomTypeId: nextTypes[0]?.id || '' }));
    setBatchForm((prev) => ({ ...prev, roomTypeId: nextTypes[0]?.id || '' }));
  }, [activeHotel?.id]);

  const availableFloors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b),
    [rooms]
  );

  const filteredRooms = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rooms.filter((r) => {
      const matchSearch =
        r.roomNumber.toLowerCase().includes(q) ||
        r.roomTypeName.toLowerCase().includes(q);
      const matchFloor = floorFilter === 'all' || r.floor === floorFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchFloor && matchStatus;
    });
  }, [rooms, searchTerm, floorFilter, statusFilter]);

  if (!activeHotel) return null;

  const currency = activeHotel.operationalSettings.currency;
  const symbol = activeHotel.operationalSettings.currencySymbol;

  const refreshData = () => {
    setRooms(saasStorage.getRooms(activeHotel.id));
    setRoomTypes(saasStorage.getRoomTypes(activeHotel.id));
  };

  const stats = {
    total: rooms.length,
    ready: rooms.filter((r) => r.status === 'clean' || r.status === 'inspected').length,
    dirty: rooms.filter((r) => r.status === 'dirty').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance' || r.status === 'out_of_order').length,
    occupancyPct: rooms.length > 0 ? Math.round((rooms.filter((r) => r.status === 'occupied').length / rooms.length) * 100) : 0,
  };

  const actor = {
    email: user?.email || 'admin@hotel.com',
    fullName: user?.fullName || 'Hotel Admin',
    role: user?.role || 'hotel_admin',
  };

  const handleStatusChange = (roomId: string, newStatus: RoomOperationalStatus) => {
    saasStorage.updateRoomStatus(roomId, newStatus, actor);
    refreshData();
    toast('Room status updated', {
      description: `Status transitioned to ${STATUS_META[newStatus].label}.`,
      variant: 'info',
    });
  };

  const handleSaveSingleRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.roomNumber.trim()) return;

    const selectedType = roomTypes.find((t) => t.id === roomForm.roomTypeId) || roomTypes[0];
    const newRoom: Room = {
      id: `rm_${activeHotel.id}_${roomForm.roomNumber.trim().replace(/\s+/g, '_')}`,
      hotelId: activeHotel.id,
      roomNumber: roomForm.roomNumber.trim(),
      floor: Number(roomForm.floor),
      roomTypeId: selectedType?.id || 'standard',
      roomTypeName: selectedType?.name || 'Standard Room',
      standardRate: selectedType?.standardRate || 2000,
      capacity: (selectedType?.capacityAdults || 2) + (selectedType?.capacityChildren || 0),
      status: roomForm.status,
      amenities: selectedType?.amenities || [],
      keyCardUid: roomForm.keyCardUid.trim() || undefined,
      notes: roomForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveRoom(newRoom, actor);
    refreshData();
    toast('Room registered', { description: `Room ${newRoom.roomNumber} (${newRoom.roomTypeName}) added.`, variant: 'success' });
    setIsAddRoomOpen(false);
    setRoomForm({
      roomNumber: '',
      floor: 1,
      roomTypeId: roomTypes[0]?.id || '',
      status: 'clean',
      keyCardUid: '',
      notes: '',
    });
  };

  const handleBatchGenerateRooms = (e: React.FormEvent) => {
    e.preventDefault();
    const start = Math.min(batchForm.startNumber, batchForm.endNumber);
    const end = Math.max(batchForm.startNumber, batchForm.endNumber);
    const selectedType = roomTypes.find((t) => t.id === batchForm.roomTypeId) || roomTypes[0];

    let createdCount = 0;
    for (let num = start; num <= end; num++) {
      const roomNum = num.toString();
      if (!rooms.some((r) => r.roomNumber === roomNum)) {
        const newRoom: Room = {
          id: `rm_${activeHotel.id}_${roomNum}`,
          hotelId: activeHotel.id,
          roomNumber: roomNum,
          floor: Number(batchForm.floor),
          roomTypeId: selectedType?.id || 'standard',
          roomTypeName: selectedType?.name || 'Standard Room',
          standardRate: selectedType?.standardRate || 2000,
          capacity: (selectedType?.capacityAdults || 2) + (selectedType?.capacityChildren || 0),
          status: batchForm.initialStatus,
          amenities: selectedType?.amenities || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saasStorage.saveRoom(newRoom, actor);
        createdCount++;
      }
    }

    refreshData();
    toast('Batch generation complete', {
      description: `${createdCount} new room(s) instantiated on Floor ${batchForm.floor}.`,
      variant: 'success',
    });
    setIsBatchRoomOpen(false);
  };

  const handleSaveRoomType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim() || !typeForm.code.trim()) return;

    if (editingType) {
      const updated: RoomType = {
        ...editingType,
        code: typeForm.code.trim().toUpperCase(),
        name: typeForm.name.trim(),
        description: typeForm.description.trim(),
        standardRate: Number(typeForm.standardRate),
        capacityAdults: Number(typeForm.capacityAdults),
        capacityChildren: Number(typeForm.capacityChildren),
        bedType: typeForm.bedType,
        amenities: typeForm.amenities,
        updatedAt: new Date().toISOString(),
      };
      saasStorage.saveRoomType(updated, actor);
      toast('Room category updated', { description: `${updated.name} rate & amenities saved.`, variant: 'success' });
    } else {
      const newType: RoomType = {
        id: `rt_${activeHotel.id}_${Math.random().toString(36).substring(2, 7)}`,
        hotelId: activeHotel.id,
        code: typeForm.code.trim().toUpperCase(),
        name: typeForm.name.trim(),
        description: typeForm.description.trim(),
        standardRate: Number(typeForm.standardRate),
        baseRateCurrency: currency,
        capacityAdults: Number(typeForm.capacityAdults),
        capacityChildren: Number(typeForm.capacityChildren),
        bedType: typeForm.bedType,
        amenities: typeForm.amenities,
        totalUnitsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saasStorage.saveRoomType(newType, actor);
      toast('Room category created', { description: `${newType.name} added to inventory catalog.`, variant: 'success' });
    }

    refreshData();
    setIsAddTypeOpen(false);
    setEditingType(null);
  };

  const handleOpenEditType = (type: RoomType) => {
    setEditingType(type);
    setTypeForm({
      code: type.code,
      name: type.name,
      description: type.description,
      standardRate: type.standardRate,
      capacityAdults: type.capacityAdults,
      capacityChildren: type.capacityChildren,
      bedType: type.bedType,
      amenities: type.amenities || [],
    });
    setIsAddTypeOpen(true);
  };

  const toggleAmenity = (amenity: string) => {
    setTypeForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const roomColumns: DataTableColumn<Room>[] = [
    {
      key: 'roomNumber',
      header: 'Room No.',
      sortable: true,
      sortValue: (r) => r.roomNumber,
      render: (r) => <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">{r.roomNumber}</span>,
    },
    {
      key: 'floor',
      header: 'Floor',
      sortable: true,
      sortValue: (r) => r.floor,
      render: (r) => <span className="font-mono text-[#78837D]">Floor {r.floor}</span>,
    },
    {
      key: 'roomTypeName',
      header: 'Category',
      sortable: true,
      sortValue: (r) => r.roomTypeName,
      render: (r) => <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{r.roomTypeName}</span>,
    },
    {
      key: 'standardRate',
      header: 'Rack Rate',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.standardRate,
      render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.standardRate, currency, symbol)}</span>,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      align: 'right',
      render: (r) => <span className="font-mono text-[#78837D]">{r.capacity} Guests</span>,
    },
    {
      key: 'status',
      header: 'Operational Status',
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => <StatusBadge label={STATUS_META[r.status].label} tone={STATUS_META[r.status].tone} />,
    },
    {
      key: 'quickUpdate',
      header: 'Quick Update',
      align: 'right',
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleStatusChange(r.id, e.target.value as RoomOperationalStatus)}
          className="text-xs py-1 px-2 seam-input"
          aria-label={`Update status for room ${r.roomNumber}`}
        >
          <option value="clean">Clean</option>
          <option value="inspected">Inspected</option>
          <option value="dirty">Dirty</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_order">Out of Order</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Rooms & Categories']}
        title="Rooms & Inventory Management"
        subtitle="Configure room categories, rack rates, floor-by-floor room units, and live housekeeping statuses."
        actions={
          activeTab === 'inventory' ? (
            <>
              <button
                type="button"
                onClick={() => setIsBatchRoomOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] font-medium text-xs whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5 text-[#647B52]" />
                <span>Batch Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddRoomOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Add Room</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingType(null);
                setTypeForm({
                  code: '',
                  name: '',
                  description: '',
                  standardRate: 2500,
                  capacityAdults: 2,
                  capacityChildren: 1,
                  bedType: 'King',
                  amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'En-suite Bathroom'],
                });
                setIsAddTypeOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Add Room Category</span>
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-xs font-semibold transition-colors border-b-2 shrink-0 flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B]'
              : 'border-transparent text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          <span>Room Inventory ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('types')}
          className={`pb-3 text-xs font-semibold transition-colors border-b-2 shrink-0 flex items-center gap-2 ${
            activeTab === 'types'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B]'
              : 'border-transparent text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Room Categories &amp; Rack Rates ({roomTypes.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              label="Total Inventory"
              value={stats.total}
              helper={`Contract cap: ${activeHotel.limits.maxRooms}`}
              icon={BedDouble}
            />
            <KpiCard
              label="Ready to Sell"
              value={stats.ready}
              delta={`${stats.total ? Math.round((stats.ready / stats.total) * 100) : 0}%`}
              deltaTone="positive"
              helper="Clean & inspected"
              icon={CheckCircle2}
            />
            <KpiCard
              label="Occupied"
              value={stats.occupied}
              delta={`${stats.occupancyPct}%`}
              deltaTone="forest"
              helper="In-house guests"
              icon={Sparkles}
            />
            <KpiCard
              label="Dirty / Turnover"
              value={stats.dirty}
              deltaTone={stats.dirty > 0 ? 'warning' : 'neutral'}
              helper="Awaiting housekeeping"
              icon={AlertTriangle}
            />
            <KpiCard
              label="Maintenance / OOO"
              value={stats.maintenance}
              deltaTone={stats.maintenance > 0 ? 'critical' : 'neutral'}
              helper="Blocked from sell"
              icon={Wrench}
            />
          </div>

          {/* Filter Toolbar */}
          <div className="p-3.5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search room number or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 seam-input"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] p-1 rounded-lg overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFloorFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    floorFilter === 'all'
                      ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] font-semibold shadow-xs'
                      : 'text-[#78837D]'
                  }`}
                >
                  All Floors
                </button>
                {availableFloors.map((floor) => (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setFloorFilter(floor)}
                    className={`px-2.5 py-1 rounded-md font-mono font-medium ${
                      floorFilter === floor
                        ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] font-semibold shadow-xs'
                        : 'text-[#78837D]'
                    }`}
                  >
                    F{floor}
                  </button>
                ))}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RoomOperationalStatus | 'all')}
                className="px-3 py-1.5 seam-input"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="clean">Clean</option>
                <option value="inspected">Inspected</option>
                <option value="dirty">Dirty</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_order">Out of Order</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] p-1 rounded-lg shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] font-semibold shadow-xs'
                    : 'text-[#78837D]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Floor Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] font-semibold shadow-xs'
                    : 'text-[#78837D]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            filteredRooms.length === 0 ? (
              <EmptyState
                icon={BedDouble}
                title="No matching rooms"
                description="Adjust your floor or status filter, or register rooms using Add Room or Batch Generator."
              />
            ) : (
              <div className="space-y-5">
                {availableFloors
                  .filter((f) => floorFilter === 'all' || floorFilter === f)
                  .map((floor) => {
                    const floorRooms = filteredRooms.filter((r) => r.floor === floor);
                    if (floorRooms.length === 0) return null;

                    return (
                      <div
                        key={floor}
                        className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)]"
                      >
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E6EBE7] dark:border-[#22322C]">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] font-mono font-semibold text-xs flex items-center justify-center text-[#173F35] dark:text-[#C6A15B]">
                              F{floor}
                            </span>
                            <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                              Floor {floor} Inventory
                            </h2>
                            <span className="text-xs text-[#78837D]">({floorRooms.length} units)</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {floorRooms.map((room) => {
                            const meta = STATUS_META[room.status];
                            return (
                              <div
                                key={room.id}
                                className="p-3 rounded-[10px] bg-[#F6F8F6]/70 dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] flex flex-col justify-between gap-2.5"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-mono text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                                    {room.roomNumber}
                                  </span>
                                  <StatusBadge label={meta.label} tone={meta.tone} showIcon={false} />
                                </div>

                                <div>
                                  <span className="text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] block truncate">
                                    {room.roomTypeName}
                                  </span>
                                  <span className="text-[11px] font-mono tabular-nums text-[#78837D]">
                                    {formatCurrency(room.standardRate, currency, symbol)}
                                  </span>
                                </div>

                                <select
                                  value={room.status}
                                  onChange={(e) =>
                                    handleStatusChange(room.id, e.target.value as RoomOperationalStatus)
                                  }
                                  className="w-full text-[11px] py-1 px-2 seam-input"
                                  aria-label={`Change status of room ${room.roomNumber}`}
                                >
                                  <option value="clean">Clean</option>
                                  <option value="inspected">Inspected</option>
                                  <option value="dirty">Dirty</option>
                                  <option value="occupied">Occupied</option>
                                  <option value="maintenance">Maintenance</option>
                                  <option value="out_of_order">Out of Order</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          ) : (
            <DataTable
              data={filteredRooms}
              columns={roomColumns}
              keyExtractor={(r) => r.id}
              onExportCsv={() => {
                downloadCsvFile(
                  `${activeHotel.code.toLowerCase()}-rooms.csv`,
                  ['Room Number', 'Floor', 'Category', 'Rate', 'Currency', 'Capacity', 'Status'],
                  filteredRooms.map((r) => [r.roomNumber, r.floor, r.roomTypeName, r.standardRate, currency, r.capacity, r.status])
                );
                toast('Room inventory exported', { variant: 'info' });
              }}
              emptyTitle="No matching rooms"
              emptyDescription="Adjust your search or status filter."
            />
          )}
        </>
      )}

      {/* ROOM TYPES TAB */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomTypes.map((type) => {
            const countForType = rooms.filter((r) => r.roomTypeId === type.id).length;

            return (
              <div
                key={type.id}
                className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-[#647B52] uppercase tracking-wider">
                        {type.code}
                      </span>
                      <h2 className="text-base font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                        {type.name}
                      </h2>
                    </div>
                    <StatusBadge label={`${countForType} Units`} tone="forest" showIcon={false} />
                  </div>

                  <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-2 line-clamp-2">
                    {type.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#78837D]">Standard Daily Rate</span>
                      <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                        {formatCurrency(type.standardRate, type.baseRateCurrency)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#78837D]">Bed Configuration</span>
                      <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{type.bedType} Bed</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#78837D]">Max Occupancy</span>
                      <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                        {type.capacityAdults} Adults, {type.capacityChildren} Kids
                      </span>
                    </div>

                    {type.amenities && type.amenities.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-medium text-[#78837D] block mb-1.5">
                          Included Amenities
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {type.amenities.map((am) => (
                            <span
                              key={am}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenEditType(type)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Rate &amp; Amenities</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD SINGLE ROOM */}
      <Modal
        open={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        title="Register Single Room Unit"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSaveSingleRoom} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 204"
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Floor Level *</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Room Category *</label>
            <select
              value={roomForm.roomTypeId}
              onChange={(e) => setRoomForm({ ...roomForm, roomTypeId: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            >
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code}) — {formatCurrency(t.standardRate, t.baseRateCurrency)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Initial Status</label>
              <select
                value={roomForm.status}
                onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as RoomOperationalStatus })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="clean">Clean</option>
                <option value="inspected">Inspected (Ready)</option>
                <option value="dirty">Dirty</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Keycard UID</label>
              <input
                type="text"
                placeholder="RFID / Card ID"
                value={roomForm.keyCardUid}
                onChange={(e) => setRoomForm({ ...roomForm, keyCardUid: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Room Notes</label>
            <input
              type="text"
              placeholder="e.g. Garden facing, connecting door with 205"
              value={roomForm.notes}
              onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsAddRoomOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Create Room
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: BATCH ROOM GENERATOR */}
      <Modal
        open={isBatchRoomOpen}
        onClose={() => setIsBatchRoomOpen(false)}
        title="Batch Room Generator"
        subtitle="Instantiate a sequential numerical range of rooms on a floor"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleBatchGenerateRooms} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Floor *</label>
              <input
                type="number"
                min="1"
                required
                value={batchForm.floor}
                onChange={(e) => setBatchForm({ ...batchForm, floor: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Start No. *</label>
              <input
                type="number"
                min="1"
                required
                value={batchForm.startNumber}
                onChange={(e) => setBatchForm({ ...batchForm, startNumber: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">End No. *</label>
              <input
                type="number"
                min="1"
                required
                value={batchForm.endNumber}
                onChange={(e) => setBatchForm({ ...batchForm, endNumber: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Assign Room Category *</label>
            <select
              value={batchForm.roomTypeId}
              onChange={(e) => setBatchForm({ ...batchForm, roomTypeId: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            >
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Default Status</label>
            <select
              value={batchForm.initialStatus}
              onChange={(e) => setBatchForm({ ...batchForm, initialStatus: e.target.value as RoomOperationalStatus })}
              className="w-full px-3 py-2 seam-input"
            >
              <option value="inspected">Inspected (Ready for Guests)</option>
              <option value="clean">Clean</option>
              <option value="dirty">Dirty</option>
            </select>
          </div>

          <div className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg text-[11px] text-[#78837D]">
            Generating rooms <span className="font-mono font-semibold">{batchForm.startNumber}</span> through{' '}
            <span className="font-mono font-semibold">{batchForm.endNumber}</span> (up to{' '}
            {Math.max(0, batchForm.endNumber - batchForm.startNumber + 1)} units). Existing room numbers remain untouched.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsBatchRoomOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Generate Range
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD / EDIT ROOM TYPE */}
      <Modal
        open={isAddTypeOpen}
        onClose={() => {
          setIsAddTypeOpen(false);
          setEditingType(null);
        }}
        title={editingType ? `Edit Room Category: ${editingType.name}` : 'Create Room Category'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveRoomType} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Code *</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="e.g. DLX"
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Deluxe Suite"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Spacious suite with private balcony and workspace..."
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Daily Rate ({currency}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={typeForm.standardRate}
                onChange={(e) => setTypeForm({ ...typeForm, standardRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold tabular-nums"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Bed Type</label>
              <select
                value={typeForm.bedType}
                onChange={(e) => setTypeForm({ ...typeForm, bedType: e.target.value as RoomType['bedType'] })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="King">King Size</option>
                <option value="Twin">Twin Beds</option>
                <option value="Suite">Master Suite</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Adults / Children</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={typeForm.capacityAdults}
                  onChange={(e) => setTypeForm({ ...typeForm, capacityAdults: parseInt(e.target.value, 10) || 1 })}
                  title="Max Adults"
                  className="px-2 py-2 seam-input font-mono tabular-nums"
                />
                <input
                  type="number"
                  min="0"
                  value={typeForm.capacityChildren}
                  onChange={(e) => setTypeForm({ ...typeForm, capacityChildren: parseInt(e.target.value, 10) || 0 })}
                  title="Max Children"
                  className="px-2 py-2 seam-input font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1.5">
              Included Room Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-[#E6EBE7] dark:border-[#22322C]">
              {DEFAULT_ROOM_AMENITIES.map((am: string) => {
                const isSelected = typeForm.amenities.includes(am);
                return (
                  <label
                    key={am}
                    className={`flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] font-medium'
                        : 'text-[#78837D] hover:bg-white/60 dark:hover:bg-[#131D1A]/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAmenity(am)}
                      className="rounded text-[#173F35] focus:ring-[#173F35] w-3.5 h-3.5"
                    />
                    <span className="text-[11px] truncate">{am}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => {
                setIsAddTypeOpen(false);
                setEditingType(null);
              }}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
