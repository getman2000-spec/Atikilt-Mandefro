/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Commercial Laundry, 4-Par Linen Circulation Control & Guest Valet Dry Cleaning Hub
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Hotel,
  LinenItem,
  LaundryWashLoad,
  GuestLaundryOrder,
  LinenCategory,
  LaundryProgramType,
  GuestLaundryItem,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Sparkles,
  Shirt,
  Layers,
  CheckCircle2,
  Plus,
  Search,
  RotateCcw,
  Check,
  X,
  Scissors,
  SlidersHorizontal,
} from 'lucide-react';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  Modal,
  EmptyState,
  SampleDataBadge,
  VerificationNotice,
  type StatusTone,
} from '../ui';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { calculateHospitalityLevies } from '../../utils/taxAndPayrollCalculator';

interface LaundryAndLinenHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const LaundryAndLinenHub: React.FC<LaundryAndLinenHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<'par_stock' | 'plant_cycles' | 'guest_valet'>(
    'par_stock'
  );

  // Data
  const [linenItems, setLinenItems] = useState<LinenItem[]>([]);
  const [washLoads, setWashLoads] = useState<LaundryWashLoad[]>([]);
  const [valetOrders, setValetOrders] = useState<GuestLaundryOrder[]>([]);

  // Filters
  const [linenCategoryFilter, setLinenCategoryFilter] = useState<string>('all');
  const [linenSearch, setLinenSearch] = useState<string>('');
  const [cycleStatusFilter, setCycleStatusFilter] = useState<string>('all');
  const [valetStatusFilter, setValetStatusFilter] = useState<string>('all');
  const [valetSearch, setValetSearch] = useState<string>('');

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedLinenItem, setSelectedLinenItem] = useState<LinenItem | null>(null);
  const [adjustCounts, setAdjustCounts] = useState<{
    inRoomsCount: number;
    inLaundryCount: number;
    cleanInPantryCount: number;
    reserveStorageCount: number;
  }>({ inRoomsCount: 0, inLaundryCount: 0, cleanInPantryCount: 0, reserveStorageCount: 0 });

  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [discardForm, setDiscardForm] = useState<{ count: number; reason: string }>({
    count: 1,
    reason: 'Permanent food/wine stains from banquet service',
  });

  const [showNewWashModal, setShowNewWashModal] = useState<boolean>(false);
  const [newWashLoad, setNewWashLoad] = useState<{
    machineId: string;
    programType: LaundryProgramType;
    weightKg: number;
    chemicalDosageNotes: string;
  }>({
    machineId: 'Girbau Industrial Washer #1 (55kg)',
    programType: 'heavy_white_cotton',
    weightKg: 50,
    chemicalDosageNotes: 'Diversey Clax 100 Ob + Clax Bright Oxygen Bleach at 65°C',
  });

  const [showValetModal, setShowValetModal] = useState<boolean>(false);
  const [newValetOrder, setNewValetOrder] = useState<{
    roomNumber: string;
    guestName: string;
    serviceType: GuestLaundryOrder['serviceType'];
    specialInstructions: string;
    postToFolio: boolean;
    items: Array<{
      garmentName: string;
      service: 'wash_press' | 'dry_clean' | 'press_only';
      quantity: number;
      unitPrice: number;
    }>;
  }>({
    roomNumber: '201',
    guestName: '',
    serviceType: 'standard_24h',
    specialInstructions: '',
    postToFolio: true,
    items: [
      {
        garmentName: 'Formal Cotton Shirt',
        service: 'wash_press',
        quantity: 2,
        unitPrice: 220,
      },
    ],
  });

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'laundry@hotel.com',
      fullName: currentUser?.fullName || 'Laundry & Housekeeping Director',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const refreshLinen = () => hotelId && setLinenItems(saasStorage.getLinenItems(hotelId));
  const refreshWashLoads = () =>
    hotelId && setWashLoads(saasStorage.getLaundryWashLoads(hotelId));
  const refreshValet = () => hotelId && setValetOrders(saasStorage.getGuestLaundryOrders(hotelId));

  useEffect(() => {
    setLinenCategoryFilter('all');
    setLinenSearch('');
    setCycleStatusFilter('all');
    setValetStatusFilter('all');
    setValetSearch('');
    setShowAdjustModal(false);
    setShowDiscardModal(false);
    setShowNewWashModal(false);
    setShowValetModal(false);
    setSelectedLinenItem(null);
    if (!hotelId) {
      setLinenItems([]);
      setWashLoads([]);
      setValetOrders([]);
      return;
    }
    setLinenItems(saasStorage.getLinenItems(hotelId));
    setWashLoads(saasStorage.getLaundryWashLoads(hotelId));
    setValetOrders(saasStorage.getGuestLaundryOrders(hotelId));
  }, [hotelId]);

  const filteredLinen = useMemo(() => {
    return linenItems.filter((item) => {
      const matchCat = linenCategoryFilter === 'all' || item.category === linenCategoryFilter;
      const q = linenSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.specification.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [linenItems, linenCategoryFilter, linenSearch]);

  const filteredWashLoads = useMemo(() => {
    return washLoads.filter((load) => {
      if (cycleStatusFilter === 'all') return true;
      return load.cycleStatus === cycleStatusFilter;
    });
  }, [washLoads, cycleStatusFilter]);

  const filteredValet = useMemo(() => {
    return valetOrders.filter((order) => {
      const matchStatus = valetStatusFilter === 'all' || order.status === valetStatusFilter;
      const q = valetSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.roomNumber.toLowerCase().includes(q) ||
        order.guestName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [valetOrders, valetStatusFilter, valetSearch]);

  // Metrics
  const totalLinenUnits = linenItems.reduce((acc, curr) => acc + curr.totalStockCount, 0);
  const totalLinenAssetValue = linenItems.reduce(
    (acc, curr) => acc + curr.totalStockCount * curr.unitCost,
    0
  );
  const activeWashBatchesCount = washLoads.filter((l) => l.cycleStatus !== 'completed').length;
  const activeWashKg = washLoads
    .filter((l) => l.cycleStatus !== 'completed')
    .reduce((acc, curr) => acc + curr.weightKg, 0);
  const totalDiscardedThisMonth = linenItems.reduce(
    (acc, curr) => acc + curr.damagedDiscardedThisMonth,
    0
  );
  const totalDiscardLossValue = linenItems.reduce(
    (acc, curr) => acc + curr.damagedDiscardedThisMonth * curr.unitCost,
    0
  );
  const totalValetRevenue = valetOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const openAdjust = (item: LinenItem) => {
    setSelectedLinenItem(item);
    setAdjustCounts({
      inRoomsCount: item.inRoomsCount,
      inLaundryCount: item.inLaundryCount,
      cleanInPantryCount: item.cleanInPantryCount,
      reserveStorageCount: item.reserveStorageCount,
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLinenItem) return;

    saasStorage.updateLinenStock(
      selectedLinenItem.id,
      {
        inRoomsCount: Number(adjustCounts.inRoomsCount),
        inLaundryCount: Number(adjustCounts.inLaundryCount),
        cleanInPantryCount: Number(adjustCounts.cleanInPantryCount),
        reserveStorageCount: Number(adjustCounts.reserveStorageCount),
        lastAuditedDate: new Date().toISOString().slice(0, 10),
      },
      actor
    );

    toast(`4-Par counts audited for ${selectedLinenItem.name}`, { variant: 'success' });
    refreshLinen();
    setShowAdjustModal(false);
    setSelectedLinenItem(null);
  };

  const openDiscard = (item: LinenItem) => {
    setSelectedLinenItem(item);
    setDiscardForm({ count: 1, reason: 'Permanent kitchen oil / wine stains' });
    setShowDiscardModal(true);
  };

  const handleSaveDiscard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLinenItem) return;

    saasStorage.recordLinenDiscard(
      selectedLinenItem.id,
      Number(discardForm.count),
      discardForm.reason,
      actor
    );

    toast(`${discardForm.count} unit(s) written off to rags`, {
      description: `${selectedLinenItem.name} balance updated.`,
      variant: 'warning',
    });
    refreshLinen();
    setShowDiscardModal(false);
    setSelectedLinenItem(null);
  };

  const handleCreateWashLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    const batchNumber = `WASH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    saasStorage.createLaundryWashLoad(
      {
        hotelId,
        batchNumber,
        machineId: newWashLoad.machineId,
        programType: newWashLoad.programType,
        weightKg: Number(newWashLoad.weightKg),
        cycleStatus: 'washing',
        operatorName: actor.fullName,
        chemicalDosageNotes: newWashLoad.chemicalDosageNotes,
      },
      actor
    );

    toast(`Wash batch ${batchNumber} started`, {
      description: `${newWashLoad.machineId} · ${newWashLoad.weightKg} kg`,
      variant: 'success',
    });
    refreshWashLoads();
    setShowNewWashModal(false);
  };

  const addValetItemRow = () => {
    setNewValetOrder((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          garmentName: 'Casual Trousers',
          service: 'wash_press',
          quantity: 1,
          unitPrice: 200,
        },
      ],
    }));
  };

  const removeValetItemRow = (idx: number) => {
    setNewValetOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateValetItemRow = (
    idx: number,
    field: keyof GuestLaundryItem,
    value: string | number
  ) => {
    setNewValetOrder((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleCreateValetOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || newValetOrder.items.length === 0) return;

    const items: GuestLaundryItem[] = newValetOrder.items.map((it) => ({
      garmentName: it.garmentName,
      service: it.service,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.quantity) * Number(it.unitPrice),
    }));

    let subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    if (newValetOrder.serviceType === 'express_4h') {
      subtotal = Math.round(subtotal * 1.5);
    }
    const rules = saasStorage.getFinancialRules(hotelId);
    const levies = calculateHospitalityLevies(subtotal, {
      vatRatePercent: rules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
      serviceChargeRatePercent:
        rules?.serviceChargeRate ?? TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
    });
    const serviceCharge = levies.serviceChargeAmount;
    const taxAmount = levies.vatAmount;
    const totalAmount = levies.total;
    const orderNumber = `VALET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    saasStorage.createGuestLaundryOrder(
      {
        hotelId,
        orderNumber,
        roomNumber: newValetOrder.roomNumber,
        guestName: newValetOrder.guestName,
        serviceType: newValetOrder.serviceType,
        status: 'received',
        items,
        subtotal,
        serviceCharge,
        taxAmount,
        totalAmount,
        specialInstructions: newValetOrder.specialInstructions,
        isBilledToFolio: newValetOrder.postToFolio,
        attendantName: `${actor.fullName} (Valet Desk)`,
      },
      newValetOrder.postToFolio,
      actor
    );

    toast(`Valet ticket ${orderNumber} created`, {
      description: newValetOrder.postToFolio
        ? `Posted ${formatCurrency(totalAmount, currency, currencySymbol)} to Room ${newValetOrder.roomNumber} folio.`
        : `Logged for Room ${newValetOrder.roomNumber}.`,
      variant: 'success',
    });
    refreshValet();
    setShowValetModal(false);
    setNewValetOrder({
      roomNumber: '201',
      guestName: '',
      serviceType: 'standard_24h',
      specialInstructions: '',
      postToFolio: true,
      items: [
        {
          garmentName: 'Formal Cotton Shirt',
          service: 'wash_press',
          quantity: 2,
          unitPrice: 220,
        },
      ],
    });
  };

  const getLinenCategoryMeta = (cat: LinenCategory): { label: string; tone: StatusTone } => {
    switch (cat) {
      case 'bed_linen':
        return { label: 'Bed Linen', tone: 'forest' };
      case 'bath_linen':
        return { label: 'Bath Terry', tone: 'success' };
      case 'fnb_linen':
        return { label: 'F&B Damask', tone: 'warning' };
      case 'pool_spa_linen':
        return { label: 'Pool & Spa', tone: 'neutral' };
      case 'uniforms':
        return { label: 'Staff Uniforms', tone: 'neutral' };
    }
  };

  const getProgramLabel = (p: LaundryProgramType) => {
    switch (p) {
      case 'heavy_white_cotton':
        return 'Heavy White Bed Sheeting (65°C Bleach)';
      case 'terry_towels':
        return 'Terry Bath Sheets & Towels (Softener Rinse)';
      case 'fnb_table_linen':
        return 'Banqueting Tablecloths & Napkins (Starch Finish)';
      case 'delicates_uniforms':
        return 'Staff Uniforms & Guest Silks (Gentle Cycle)';
      case 'eco_cold_cycle':
        return 'Eco Cold Ozone Wash (Energy Saving)';
      default:
        return p;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Laundry & Linen']}
        title="Commercial Laundry, Linen Par & Guest Valet"
        subtitle="4-Par circulation control across rooms, plant wash cycles, floor pantries, and reserve stock, plus industrial machinery batch tracking and guest valet dry cleaning."
        meta={<SampleDataBadge />}
        actions={
          <>
            {activeTab === 'plant_cycles' && (
              <button
                type="button"
                onClick={() => setShowNewWashModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Start Machine Batch
              </button>
            )}
            {activeTab === 'guest_valet' && (
              <button
                type="button"
                onClick={() => setShowValetModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Guest Valet Request
              </button>
            )}
          </>
        }
      />

      <VerificationNotice />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Linen Circulation"
          value={totalLinenUnits.toLocaleString()}
          helper={`Asset value ${formatCurrency(totalLinenAssetValue, currency, currencySymbol)}`}
          icon={Layers}
        />
        <KpiCard
          label="Active Plant Machinery"
          value={`${activeWashBatchesCount} loads`}
          delta={`${activeWashKg} kg active`}
          deltaTone="forest"
          helper="Commercial washers & ironers"
          icon={RotateCcw}
        />
        <KpiCard
          label="Rag Discards (MTD)"
          value={totalDiscardedThisMonth}
          delta={formatCurrency(totalDiscardLossValue, currency, currencySymbol)}
          deltaTone={totalDiscardedThisMonth > 0 ? 'warning' : 'positive'}
          helper="Damaged stock written off"
          icon={Scissors}
        />
        <KpiCard
          label="Guest Valet Revenue"
          value={formatCurrency(totalValetRevenue, currency, currencySymbol)}
          delta="Folio Synchronized"
          deltaTone="positive"
          helper={`${valetOrders.length} guest valet ticket(s)`}
          icon={Sparkles}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E6EBE7] dark:border-[#22322C] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('par_stock')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'par_stock'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
              : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Linen Par Stock Audit ({linenItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plant_cycles')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'plant_cycles'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
              : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Plant Batches ({washLoads.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guest_valet')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'guest_valet'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
              : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          Guest Valet & Dry Cleaning ({valetOrders.length})
        </button>
      </div>

      {/* TAB 1: LINEN PAR STOCK */}
      {activeTab === 'par_stock' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search linen item, code, or spec..."
                value={linenSearch}
                onChange={(e) => setLinenSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <select
              value={linenCategoryFilter}
              onChange={(e) => setLinenCategoryFilter(e.target.value)}
              className="seam-input px-3 py-1.5 text-xs"
            >
              <option value="all">All Linen Categories</option>
              <option value="bed_linen">Bed Linen</option>
              <option value="bath_linen">Bath Terry</option>
              <option value="fnb_linen">F&B Damask</option>
              <option value="pool_spa_linen">Pool & Spa</option>
              <option value="uniforms">Staff Uniforms</option>
            </select>
          </div>

          {filteredLinen.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No linen SKUs found"
                description="Adjust your category or search filters."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLinen.map((item) => {
                const currentPar = Number(
                  (item.totalStockCount / (item.inRoomsCount || 1)).toFixed(2)
                );
                const isParSufficient = currentPar >= item.parLevelRequirement;
                const catMeta = getLinenCategoryMeta(item.category);
                const safeTotal = item.totalStockCount || 1;

                return (
                  <div key={item.id} className="seam-surface p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C]">
                            {item.code}
                          </span>
                          <StatusBadge label={catMeta.label} tone={catMeta.tone} />
                          <StatusBadge
                            label={`${currentPar}x Par (Req ${item.parLevelRequirement}x)`}
                            tone={isParSufficient ? 'success' : 'critical'}
                          />
                        </div>

                        <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                          {item.specification} · Replacement:{' '}
                          <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(item.unitCost, currency, currencySymbol)}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end lg:self-auto">
                        <button
                          type="button"
                          onClick={() => openDiscard(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          Write Off Rags
                        </button>
                        <button
                          type="button"
                          onClick={() => openAdjust(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-xs font-medium transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                          Audit Par Counts
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#78837D] dark:text-[#92A199]">
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          4-Par Circulation ({item.totalStockCount.toLocaleString()} total units)
                        </span>
                        <span>Last audited: {formatShortDate(item.lastAuditedDate)}</span>
                      </div>

                      <div className="w-full h-2.5 bg-[#F1F4F1] dark:bg-[#192622] rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(item.inRoomsCount / safeTotal) * 100}%` }}
                          className="bg-[#173F35] dark:bg-[#246353] h-full"
                          title={`In Rooms: ${item.inRoomsCount}`}
                        />
                        <div
                          style={{ width: `${(item.inLaundryCount / safeTotal) * 100}%` }}
                          className="bg-[#C6A15B] h-full"
                          title={`In Laundry: ${item.inLaundryCount}`}
                        />
                        <div
                          style={{ width: `${(item.cleanInPantryCount / safeTotal) * 100}%` }}
                          className="bg-[#647B52] h-full"
                          title={`Clean in Pantries: ${item.cleanInPantryCount}`}
                        />
                        <div
                          style={{ width: `${(item.reserveStorageCount / safeTotal) * 100}%` }}
                          className="bg-slate-400 dark:bg-slate-500 h-full"
                          title={`Reserve Storage: ${item.reserveStorageCount}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 seam-surface-subtle">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#78837D] dark:text-[#92A199]">
                            <span className="w-2 h-2 rounded-full bg-[#173F35] dark:bg-[#246353]" />
                            1. Guest Rooms
                          </div>
                          <div className="text-sm font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                            {item.inRoomsCount}{' '}
                            <span className="text-[11px] font-normal text-[#78837D]">units</span>
                          </div>
                        </div>

                        <div className="p-2.5 seam-surface-subtle">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#78837D] dark:text-[#92A199]">
                            <span className="w-2 h-2 rounded-full bg-[#C6A15B]" />
                            2. Laundry Wash
                          </div>
                          <div className="text-sm font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                            {item.inLaundryCount}{' '}
                            <span className="text-[11px] font-normal text-[#78837D]">units</span>
                          </div>
                        </div>

                        <div className="p-2.5 seam-surface-subtle">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#78837D] dark:text-[#92A199]">
                            <span className="w-2 h-2 rounded-full bg-[#647B52]" />
                            3. Floor Pantries
                          </div>
                          <div className="text-sm font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                            {item.cleanInPantryCount}{' '}
                            <span className="text-[11px] font-normal text-[#78837D]">units</span>
                          </div>
                        </div>

                        <div className="p-2.5 seam-surface-subtle">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#78837D] dark:text-[#92A199]">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            4. Reserve Store
                          </div>
                          <div className="text-sm font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                            {item.reserveStorageCount}{' '}
                            <span className="text-[11px] font-normal text-[#78837D]">units</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLANT CYCLES */}
      {activeTab === 'plant_cycles' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#78837D] dark:text-[#92A199]">Batch Filter:</span>
              <select
                value={cycleStatusFilter}
                onChange={(e) => setCycleStatusFilter(e.target.value)}
                className="seam-input px-3 py-1.5 text-xs"
              >
                <option value="all">All Plant Cycles</option>
                <option value="washing">Washing (Extracting)</option>
                <option value="drying">Tumble Drying</option>
                <option value="ironing_pressing">Flatwork Ironing & Pressing</option>
                <option value="completed">Completed & Stored</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowNewWashModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Wash Batch
            </button>
          </div>

          {filteredWashLoads.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No plant batches match this filter"
                description="Schedule a new industrial wash batch or clear the cycle status filter."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWashLoads.map((load) => (
                <div
                  key={load.id}
                  className="seam-surface p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C]">
                        {load.batchNumber}
                      </span>
                      <StatusBadge
                        label={
                          load.cycleStatus === 'washing'
                            ? 'Washing'
                            : load.cycleStatus === 'drying'
                            ? 'Tumble Drying'
                            : load.cycleStatus === 'ironing_pressing'
                            ? 'Calender Ironing'
                            : 'Completed'
                        }
                        tone={
                          load.cycleStatus === 'completed'
                            ? 'success'
                            : load.cycleStatus === 'drying'
                            ? 'warning'
                            : 'forest'
                        }
                      />
                    </div>

                    <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-2.5">
                      {load.machineId}
                    </h3>
                    <div className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                      {getProgramLabel(load.programType)}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Load Weight</span>
                        <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          {load.weightKg} kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Operator</span>
                        <span className="text-[#202B27] dark:text-[#ECF1EE]">
                          {load.operatorName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Started</span>
                        <span className="font-mono text-[#78837D] dark:text-[#92A199]">
                          {new Date(load.startedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {load.chemicalDosageNotes && (
                        <div className="p-2.5 seam-surface-subtle text-[11px] text-[#78837D] dark:text-[#92A199]">
                          <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            Dosage:{' '}
                          </span>
                          {load.chemicalDosageNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                    <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                      Stage Control
                    </span>
                    {load.cycleStatus === 'washing' && (
                      <button
                        type="button"
                        onClick={() => {
                          saasStorage.updateLaundryWashLoadStatus(load.id, 'drying', actor);
                          toast(`${load.batchNumber} moved to drying`, { variant: 'info' });
                          refreshWashLoads();
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                      >
                        Advance to Drying
                      </button>
                    )}
                    {load.cycleStatus === 'drying' && (
                      <button
                        type="button"
                        onClick={() => {
                          saasStorage.updateLaundryWashLoadStatus(
                            load.id,
                            'ironing_pressing',
                            actor
                          );
                          toast(`${load.batchNumber} moved to ironing`, { variant: 'info' });
                          refreshWashLoads();
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                      >
                        Advance to Ironing
                      </button>
                    )}
                    {load.cycleStatus === 'ironing_pressing' && (
                      <button
                        type="button"
                        onClick={() => {
                          saasStorage.updateLaundryWashLoadStatus(load.id, 'completed', actor);
                          toast(`${load.batchNumber} completed & stored`, { variant: 'success' });
                          refreshWashLoads();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors"
                      >
                        Complete & Pack
                      </button>
                    )}
                    {load.cycleStatus === 'completed' && (
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        In Linen Pantries
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GUEST VALET */}
      {activeTab === 'guest_valet' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticket #, room, or guest name..."
                value={valetSearch}
                onChange={(e) => setValetSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <select
              value={valetStatusFilter}
              onChange={(e) => setValetStatusFilter(e.target.value)}
              className="seam-input px-3 py-1.5 text-xs"
            >
              <option value="all">All Valet Tickets</option>
              <option value="received">Received / Sorting</option>
              <option value="in_cleaning">In Dry Cleaning / Wash</option>
              <option value="ironed_packaged">Ironed & Packaged</option>
              <option value="delivered">Delivered to Suite</option>
            </select>
          </div>

          {filteredValet.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No guest valet tickets found"
                description="Create a guest valet ticket when receiving garments from housekeeping or room service."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredValet.map((order) => (
                <div key={order.id} className="seam-surface p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-[#173F35] dark:text-[#C6A15B]">
                          {order.orderNumber}
                        </span>
                        <StatusBadge label={`Room ${order.roomNumber}`} tone="neutral" />
                        <StatusBadge
                          label={
                            order.serviceType === 'express_4h'
                              ? 'Express 4-Hour (+50%)'
                              : order.serviceType === 'pressing_only'
                              ? 'Pressing Only'
                              : 'Standard 24-Hour'
                          }
                          tone={order.serviceType === 'express_4h' ? 'critical' : 'neutral'}
                        />
                        {order.isBilledToFolio && (
                          <StatusBadge label="Folio Synchronized" tone="success" />
                        )}
                      </div>

                      <div className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        Guest: {order.guestName}
                      </div>

                      <div className="text-xs text-[#78837D] dark:text-[#92A199] flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Received:{' '}
                          <span className="font-mono">
                            {new Date(order.receivedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                        <span>
                          Attendant:{' '}
                          <strong className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            {order.attendantName}
                          </strong>
                        </span>
                        {order.specialInstructions && (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            Care: {order.specialInstructions}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 self-end lg:self-auto">
                      <div className="text-right">
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                          Total (incl. 10% SC & 15% VAT)
                        </div>
                        <div className="text-lg font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(order.totalAmount, currency, currencySymbol)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === 'received' && (
                          <button
                            type="button"
                            onClick={() => {
                              saasStorage.updateGuestLaundryOrderStatus(
                                order.id,
                                'in_cleaning',
                                actor
                              );
                              toast(`${order.orderNumber} moved to cleaning`, { variant: 'info' });
                              refreshValet();
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                          >
                            Process Cleaning
                          </button>
                        )}

                        {order.status === 'in_cleaning' && (
                          <button
                            type="button"
                            onClick={() => {
                              saasStorage.updateGuestLaundryOrderStatus(
                                order.id,
                                'ironed_packaged',
                                actor
                              );
                              toast(`${order.orderNumber} pressed & packaged`, { variant: 'info' });
                              refreshValet();
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                          >
                            Mark Pressed & Packed
                          </button>
                        )}

                        {order.status === 'ironed_packaged' && (
                          <button
                            type="button"
                            onClick={() => {
                              saasStorage.updateGuestLaundryOrderStatus(
                                order.id,
                                'delivered',
                                actor
                              );
                              toast(`${order.orderNumber} delivered to Room ${order.roomNumber}`, {
                                variant: 'success',
                              });
                              refreshValet();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors"
                          >
                            Confirm Suite Delivery
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Delivered to Suite
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
                    <div className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199] mb-2 font-mono">
                      Garment Items ({order.items.length}) · Subtotal:{' '}
                      {formatCurrency(order.subtotal, currency, currencySymbol)} · SC:{' '}
                      {formatCurrency(order.serviceCharge, currency, currencySymbol)} · VAT:{' '}
                      {formatCurrency(order.taxAmount, currency, currencySymbol)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {order.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 seam-surface-subtle text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                              {it.garmentName}
                            </div>
                            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] capitalize">
                              {it.service.replace('_', ' & ')}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
                              {it.quantity}x @ {formatCurrency(it.unitPrice, currency, currencySymbol)}
                            </div>
                            <div className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
                              {formatCurrency(it.totalPrice, currency, currencySymbol)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: AUDIT 4-PAR COUNTS */}
      <Modal
        open={showAdjustModal && Boolean(selectedLinenItem)}
        onClose={() => setShowAdjustModal(false)}
        title="Audit Linen 4-Par Counts"
        subtitle={
          selectedLinenItem ? `${selectedLinenItem.name} (${selectedLinenItem.code})` : undefined
        }
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="adjust-linen-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Save Audited Counts
            </button>
          </>
        }
      >
        <form id="adjust-linen-form" onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                1. In Guest Rooms
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustCounts.inRoomsCount}
                onChange={(e) =>
                  setAdjustCounts({ ...adjustCounts, inRoomsCount: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                2. In Laundry Wash Cycle
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustCounts.inLaundryCount}
                onChange={(e) =>
                  setAdjustCounts({ ...adjustCounts, inLaundryCount: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                3. Clean in Floor Pantries
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustCounts.cleanInPantryCount}
                onChange={(e) =>
                  setAdjustCounts({
                    ...adjustCounts,
                    cleanInPantryCount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                4. Reserve Storage Backup
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustCounts.reserveStorageCount}
                onChange={(e) =>
                  setAdjustCounts({
                    ...adjustCounts,
                    reserveStorageCount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="p-3 seam-surface-subtle flex items-center justify-between">
            <span className="text-[#78837D] dark:text-[#92A199]">New Total Circulation</span>
            <span className="font-mono font-semibold text-sm text-[#173F35] dark:text-[#C6A15B]">
              {adjustCounts.inRoomsCount +
                adjustCounts.inLaundryCount +
                adjustCounts.cleanInPantryCount +
                adjustCounts.reserveStorageCount}{' '}
              units
            </span>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: WRITE OFF DAMAGED LINEN */}
      <Modal
        open={showDiscardModal && Boolean(selectedLinenItem)}
        onClose={() => setShowDiscardModal(false)}
        title="Write Off Damaged Linen to Rags"
        subtitle={
          selectedLinenItem ? `${selectedLinenItem.name} (${selectedLinenItem.code})` : undefined
        }
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDiscardModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="discard-linen-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Rag Conversion
            </button>
          </>
        }
      >
        {selectedLinenItem && (
          <form id="discard-linen-form" onSubmit={handleSaveDiscard} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Damaged Units to Discard *
              </label>
              <input
                type="number"
                min="1"
                max={selectedLinenItem.reserveStorageCount || 50}
                required
                value={discardForm.count}
                onChange={(e) => setDiscardForm({ ...discardForm, count: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Audit Reason *
              </label>
              <textarea
                rows={2}
                required
                value={discardForm.reason}
                onChange={(e) => setDiscardForm({ ...discardForm, reason: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <span className="text-rose-700 dark:text-rose-300">Asset Value Written Off</span>
              <span className="font-mono font-semibold text-rose-700 dark:text-rose-300">
                {formatCurrency(
                  discardForm.count * selectedLinenItem.unitCost,
                  currency,
                  currencySymbol
                )}
              </span>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: SCHEDULE WASH LOAD */}
      <Modal
        open={showNewWashModal}
        onClose={() => setShowNewWashModal(false)}
        title="Schedule Machine Wash Batch"
        subtitle="Assign a linen batch to an industrial washer, dryer, or flatwork ironer."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewWashModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-wash-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Dispatch Batch to Machine
            </button>
          </>
        }
      >
        <form id="new-wash-form" onSubmit={handleCreateWashLoad} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Machinery Unit *
            </label>
            <select
              required
              value={newWashLoad.machineId}
              onChange={(e) => setNewWashLoad({ ...newWashLoad, machineId: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            >
              <option value="Girbau Industrial Washer #1 (55kg)">
                Girbau Industrial Washer #1 (55kg)
              </option>
              <option value="Girbau Industrial Washer #2 (55kg)">
                Girbau Industrial Washer #2 (55kg)
              </option>
              <option value="Electrolux Tumble Dryer #1 (45kg)">
                Electrolux Tumble Dryer #1 (45kg)
              </option>
              <option value="Electrolux Tumble Dryer #2 (45kg)">
                Electrolux Tumble Dryer #2 (45kg)
              </option>
              <option value="Chicago Dryer Flatwork Calender Ironer (3.3m)">
                Chicago Dryer Flatwork Calender Ironer (3.3m)
              </option>
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Wash Cycle Program *
            </label>
            <select
              value={newWashLoad.programType}
              onChange={(e) =>
                setNewWashLoad({
                  ...newWashLoad,
                  programType: e.target.value as LaundryProgramType,
                })
              }
              className="w-full px-3 py-2 seam-input"
            >
              <option value="heavy_white_cotton">Heavy White Sheeting (65°C Bleach)</option>
              <option value="terry_towels">Terry Bath Sheets & Towels (Softener)</option>
              <option value="fnb_table_linen">Banqueting Tablecloths & Napkins (Starch)</option>
              <option value="delicates_uniforms">Staff Uniforms & Guest Silks (Gentle)</option>
              <option value="eco_cold_cycle">Eco Cold Ozone Wash (Energy Saving)</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Load Weight (kg) *
            </label>
            <input
              type="number"
              min="5"
              max="60"
              required
              value={newWashLoad.weightKg}
              onChange={(e) =>
                setNewWashLoad({ ...newWashLoad, weightKg: Number(e.target.value) })
              }
              className="w-full px-3 py-2 seam-input font-mono"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Chemical Dosage Formulation *
            </label>
            <input
              type="text"
              required
              value={newWashLoad.chemicalDosageNotes}
              onChange={(e) =>
                setNewWashLoad({ ...newWashLoad, chemicalDosageNotes: e.target.value })
              }
              className="w-full px-3 py-2 seam-input"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 4: NEW GUEST VALET REQUEST */}
      <Modal
        open={showValetModal}
        onClose={() => setShowValetModal(false)}
        title="New Guest Valet Request"
        subtitle="Log guest garment intake with automatic 10% Service Charge, 15% VAT, and optional folio posting."
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowValetModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-valet-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Generate Valet Ticket
            </button>
          </>
        }
      >
        <form id="new-valet-form" onSubmit={handleCreateValetOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Room # *
              </label>
              <input
                type="text"
                required
                value={newValetOrder.roomNumber}
                onChange={(e) =>
                  setNewValetOrder({ ...newValetOrder, roomNumber: e.target.value })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Guest Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Guest name"
                value={newValetOrder.guestName}
                onChange={(e) =>
                  setNewValetOrder({ ...newValetOrder, guestName: e.target.value })
                }
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Turnaround Tier
              </label>
              <select
                value={newValetOrder.serviceType}
                onChange={(e) =>
                  setNewValetOrder({
                    ...newValetOrder,
                    serviceType: e.target.value as GuestLaundryOrder['serviceType'],
                  })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="standard_24h">Standard (24 Hours)</option>
                <option value="express_4h">Express (4 Hours, +50%)</option>
                <option value="pressing_only">Pressing / Iron Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">Garment Items</span>
              <button
                type="button"
                onClick={addValetItemRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                <Plus className="w-3 h-3" /> Add Garment
              </button>
            </div>

            {newValetOrder.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 p-2.5 seam-surface-subtle items-end"
              >
                <div className="col-span-5">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Garment Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Garment name"
                    value={item.garmentName}
                    onChange={(e) => updateValetItemRow(idx, 'garmentName', e.target.value)}
                    className="w-full px-2.5 py-1.5 seam-input text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Service
                  </label>
                  <select
                    value={item.service}
                    onChange={(e) => updateValetItemRow(idx, 'service', e.target.value)}
                    className="w-full px-2 py-1.5 seam-input text-xs"
                  >
                    <option value="wash_press">Wash & Press</option>
                    <option value="dry_clean">Dry Clean</option>
                    <option value="press_only">Press Only</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateValetItemRow(idx, 'quantity', Number(e.target.value))}
                    className="w-full px-2 py-1.5 seam-input font-mono text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Price ({currency})
                  </label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updateValetItemRow(idx, 'unitPrice', Number(e.target.value))}
                    className="w-full px-2 py-1.5 seam-input font-mono text-xs"
                  />
                </div>
                <div className="col-span-1 text-center pb-1">
                  {newValetOrder.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeValetItemRow(idx)}
                      className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Special Garment Care Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Delicate hand press on silk collar, no starch."
              value={newValetOrder.specialInstructions}
              onChange={(e) =>
                setNewValetOrder({ ...newValetOrder, specialInstructions: e.target.value })
              }
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 seam-surface-subtle cursor-pointer">
            <input
              type="checkbox"
              checked={newValetOrder.postToFolio}
              onChange={(e) =>
                setNewValetOrder({ ...newValetOrder, postToFolio: e.target.checked })
              }
              className="rounded border-[#E6EBE7] text-[#173F35]"
            />
            <span className="text-[#202B27] dark:text-[#ECF1EE] font-medium">
              Post charge directly to Guest Room Folio (incl. 10% Service Charge + 15% VAT)
            </span>
          </label>
        </form>
      </Modal>
    </div>
  );
};
