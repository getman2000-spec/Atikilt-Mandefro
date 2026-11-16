/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Outlets & POS Locations Management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { Outlet, OutletType } from '../../types/saas';
import { PageHeader, KpiCard, StatusBadge, Modal, EmptyState } from '../ui';
import {
  UtensilsCrossed,
  PlusCircle,
  Search,
  Clock,
  Users,
  CreditCard,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

const OUTLET_TYPE_LABELS: Record<OutletType, string> = {
  main_restaurant: 'Main Restaurant',
  bar_lounge: 'Bar & Cocktail Lounge',
  coffee_shop: 'Coffee Shop & Cafe',
  room_service: 'In-Room Dining / Room Service',
  pool_bar: 'Poolside Bar & Grill',
  banquet_hall: 'Banquet & Event Hall',
  spa_outlet: 'Spa Reception & Retail',
  other: 'Specialty Outlet',
};

export const OutletManagement: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();

  const [outlets, setOutlets] = useState<Outlet[]>(() =>
    activeHotel ? saasStorage.getOutlets(activeHotel.id) : []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'main_restaurant' as OutletType,
    openingHours: '06:30 - 23:00',
    seatingCapacity: 60,
    managerName: '',
    managerPhone: '',
    acceptsRoomCharge: true,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (activeHotel) {
      setOutlets(saasStorage.getOutlets(activeHotel.id));
    }
  }, [activeHotel?.id]);

  const filteredOutlets = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return outlets.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        OUTLET_TYPE_LABELS[o.type].toLowerCase().includes(q)
    );
  }, [outlets, searchTerm]);

  if (!activeHotel) return null;

  const refreshOutlets = () => {
    setOutlets(saasStorage.getOutlets(activeHotel.id));
  };

  const actor = {
    email: user?.email || 'admin@hotel.com',
    fullName: user?.fullName || 'Hotel Admin',
    role: user?.role || 'hotel_admin',
  };

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setForm({
      code: `OUT-0${outlets.length + 1}`,
      name: '',
      type: 'main_restaurant',
      openingHours: '07:00 - 23:00',
      seatingCapacity: 50,
      managerName: '',
      managerPhone: '',
      acceptsRoomCharge: true,
      status: 'active',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setForm({
      code: outlet.code,
      name: outlet.name,
      type: outlet.type,
      openingHours: outlet.openingHours,
      seatingCapacity: outlet.seatingCapacity,
      managerName: outlet.managerName || '',
      managerPhone: outlet.managerPhone || '',
      acceptsRoomCharge: outlet.acceptsRoomCharge,
      status: outlet.status,
    });
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    if (editingOutlet) {
      const updated: Outlet = {
        ...editingOutlet,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        openingHours: form.openingHours.trim(),
        seatingCapacity: Number(form.seatingCapacity),
        managerName: form.managerName.trim() || undefined,
        managerPhone: form.managerPhone.trim() || undefined,
        acceptsRoomCharge: form.acceptsRoomCharge,
        status: form.status,
      };
      saasStorage.saveOutlet(updated, actor);
      toast('Outlet updated', { description: `${updated.name} POS settings saved.`, variant: 'success' });
    } else {
      const newOutlet: Outlet = {
        id: `out_${activeHotel.id}_${Math.random().toString(36).substring(2, 7)}`,
        hotelId: activeHotel.id,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        openingHours: form.openingHours.trim(),
        seatingCapacity: Number(form.seatingCapacity),
        managerName: form.managerName.trim() || undefined,
        managerPhone: form.managerPhone.trim() || undefined,
        acceptsRoomCharge: form.acceptsRoomCharge,
        status: form.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saasStorage.saveOutlet(newOutlet, actor);
      toast('New outlet registered', { description: `${newOutlet.name} (${newOutlet.code}) activated.`, variant: 'success' });
    }

    refreshOutlets();
    setIsAddOpen(false);
    setEditingOutlet(null);
  };

  const handleToggleStatus = (outlet: Outlet) => {
    const next = outlet.status === 'active' ? 'inactive' : 'active';
    saasStorage.saveOutlet({ ...outlet, status: next }, actor);
    refreshOutlets();
    toast(next === 'active' ? 'Outlet activated' : 'Outlet paused', { variant: 'info' });
  };

  const activeCount = outlets.filter((o) => o.status === 'active').length;
  const totalSeats = outlets.reduce((acc, o) => acc + (o.seatingCapacity || 0), 0);
  const roomChargeCount = outlets.filter((o) => o.acceptsRoomCharge).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Outlets & POS']}
        title="Outlets & POS Revenue Centers"
        subtitle="Configure restaurants, bars, cafes, banquet venues, and in-room dining charge permissions."
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Add New Outlet</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Configured Outlets"
          value={outlets.length}
          helper={`Plan limit: ${activeHotel.limits.maxOutlets}`}
          icon={UtensilsCrossed}
        />
        <KpiCard
          label="Active Venues"
          value={activeCount}
          deltaTone="positive"
          helper="Accepting POS orders"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Combined Seating"
          value={totalSeats}
          helper="Total dining covers"
          icon={Users}
        />
        <KpiCard
          label="Folio Posting Enabled"
          value={roomChargeCount}
          helper="Direct room bill settlement"
          icon={CreditCard}
        />
      </div>

      {/* Search Toolbar */}
      <div className="p-3.5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search outlet name, code, or venue type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
          />
        </div>

        <span className="text-xs text-[#78837D]">
          Showing <strong className="text-[#202B27] dark:text-[#ECF1EE] font-mono">{filteredOutlets.length}</strong> of{' '}
          <span className="font-mono">{outlets.length}</span> outlets
        </span>
      </div>

      {filteredOutlets.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No matching outlets"
          description="Adjust your search term or add a new dining or retail revenue center."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOutlets.map((outlet) => {
            const isActive = outlet.status === 'active';

            return (
              <div
                key={outlet.id}
                className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE] truncate">
                          {outlet.name}
                        </h2>
                        <span className="text-[11px] font-mono text-[#78837D]">Code: {outlet.code}</span>
                      </div>
                    </div>

                    <button type="button" onClick={() => handleToggleStatus(outlet)} title="Toggle outlet status">
                      <StatusBadge label={outlet.status} tone={isActive ? 'success' : 'neutral'} />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#78837D]">Venue Category</span>
                      <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] text-right">
                        {OUTLET_TYPE_LABELS[outlet.type]}
                      </span>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-[#78837D] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C6A15B]" /> Operating Hours
                      </span>
                      <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">{outlet.openingHours}</span>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-[#78837D] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#647B52]" /> Seating Capacity
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                        {outlet.seatingCapacity} Seats
                      </span>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-[#78837D] flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" /> Room Postings
                      </span>
                      <span className={`font-medium ${outlet.acceptsRoomCharge ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#78837D]'}`}>
                        {outlet.acceptsRoomCharge ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    {outlet.managerName && (
                      <div className="flex justify-between gap-2">
                        <span className="text-[#78837D]">Manager</span>
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{outlet.managerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(outlet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Outlet</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isAddOpen || Boolean(editingOutlet)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingOutlet(null);
        }}
        title={editingOutlet ? `Edit Outlet: ${editingOutlet.name}` : 'Configure New Outlet'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitSave} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Outlet Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 seam-input font-mono font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Outlet Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acacia Terrace & Grill"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Category Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as OutletType })}
                className="w-full px-3 py-2 seam-input"
              >
                {Object.entries(OUTLET_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Operating Hours</label>
              <input
                type="text"
                placeholder="e.g. 06:30 - 23:00"
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Seating Capacity</label>
              <input
                type="number"
                min="1"
                value={form.seatingCapacity}
                onChange={(e) => setForm({ ...form, seatingCapacity: parseInt(e.target.value, 10) || 10 })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Outlet Manager</label>
              <input
                type="text"
                placeholder="Manager Name"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <label className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                Allow Guest Room Bill Charging
              </span>
              <span className="text-[11px] text-[#78837D]">
                Permits guests to charge dining and bar checks directly to their room folio.
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.acceptsRoomCharge}
              onChange={(e) => setForm({ ...form, acceptsRoomCharge: e.target.checked })}
              className="rounded text-[#173F35] focus:ring-[#173F35] w-4 h-4 shrink-0"
            />
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingOutlet(null);
              }}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Save Outlet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
