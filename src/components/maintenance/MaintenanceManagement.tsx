/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Maintenance, Work Orders & Asset Management
 * Defect ticketing, plant equipment register, Preventive Maintenance (PPM) schedules,
 * Room Out-of-Order (OOO) coordination, and engineering spare parts integration.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ShieldAlert,
  ArrowRight,
  CheckSquare,
  Zap,
  Droplets,
  Wind,
  Flame,
  Building,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  Hotel,
  AssetRecord,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  MaintenanceCategory,
  PreventiveSchedule,
  PreventiveChecklistItem,
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
  type DataTableColumn,
} from '../ui';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';

interface MaintenanceManagementProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'work_orders' | 'assets' | 'preventive' | 'analytics'>('work_orders');
  const [refreshKey, setRefreshKey] = useState(0);

  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const workOrders = useMemo(() => {
    return hotelId ? saasStorage.getWorkOrders(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const assets = useMemo(() => {
    return hotelId ? saasStorage.getAssets(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const preventiveSchedules = useMemo(() => {
    return hotelId ? saasStorage.getPreventiveSchedules(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const rooms = useMemo(() => {
    return hotelId ? saasStorage.getRooms(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const stockItems = useMemo(() => {
    return hotelId ? saasStorage.getStockItems(hotelId) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, refreshKey]);

  const [woStatusFilter, setWoStatusFilter] = useState<string>('all');
  const [woPriorityFilter, setWoPriorityFilter] = useState<string>('all');
  const [woCategoryFilter, setWoCategoryFilter] = useState<string>('all');

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);

  const defaultTechName = currentUser?.fullName ? `${currentUser.fullName} (Engineering)` : 'Duty Engineer';

  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    category: 'hvac' as MaintenanceCategory,
    priority: 'medium' as WorkOrderPriority,
    source: 'front_desk' as WorkOrder['source'],
    targetType: 'room' as WorkOrder['targetType'],
    roomId: '',
    assetId: '',
    outletId: '',
    roomOutOfOrder: false,
    assignedTechnicianName: defaultTechName,
  });

  const [ticketStatusUpdate, setTicketStatusUpdate] = useState<WorkOrderStatus>('reported');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [laborHours, setLaborHours] = useState(0);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [partQty, setPartQty] = useState(1);

  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    assetCode: '',
    category: 'generator_power' as MaintenanceCategory,
    location: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: 50000,
    warrantyExpiry: '',
    criticality: 'essential' as AssetRecord['criticality'],
    serviceIntervalDays: 30,
    nextScheduledServiceDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    operatingStatus: 'operational' as AssetRecord['operatingStatus'],
    notes: '',
  });

  const [newScheduleForm, setNewScheduleForm] = useState({
    title: '',
    assetId: '',
    category: 'generator_power' as MaintenanceCategory,
    frequency: 'monthly' as PreventiveSchedule['frequency'],
    nextDueDate: new Date().toISOString().slice(0, 10),
    estimatedHours: 2,
    assignedRoleOrTech: defaultTechName,
    checklistTasks: [
      'Visual inspection for oil leaks and belt tension',
      'Test electrical contactors and terminal torque',
    ],
  });

  useEffect(() => {
    setWoStatusFilter('all');
    setWoPriorityFilter('all');
    setWoCategoryFilter('all');
    setAssetSearch('');
    setAssetCategoryFilter('all');
    setIsNewTicketModalOpen(false);
    setIsNewAssetModalOpen(false);
    setIsNewScheduleModalOpen(false);
    setIsDetailDrawerOpen(false);
    setSelectedWorkOrder(null);
  }, [hotelId]);

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'engineering@property.local',
      fullName: currentUser?.fullName || 'Chief Engineer',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const renderPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'critical':
        return <StatusBadge label="Critical" tone="critical" />;
      case 'high':
        return <StatusBadge label="High" tone="warning" />;
      case 'medium':
        return <StatusBadge label="Medium" tone="forest" showIcon={false} />;
      case 'low':
        return <StatusBadge label="Low" tone="neutral" showIcon={false} />;
    }
  };

  const renderWorkOrderStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'reported':
        return <StatusBadge label="Reported" tone="neutral" />;
      case 'assigned':
        return <StatusBadge label="Assigned" tone="forest" />;
      case 'in_progress':
        return <StatusBadge label="In Progress" tone="warning" />;
      case 'parts_pending':
        return <StatusBadge label="Parts Pending" tone="warning" />;
      case 'resolved':
        return <StatusBadge label="Resolved" tone="success" />;
      case 'closed':
        return <StatusBadge label="Closed" tone="neutral" />;
    }
  };

  const getCategoryIcon = (category: MaintenanceCategory) => {
    switch (category) {
      case 'generator_power':
        return <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'hvac':
        return <Wind className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />;
      case 'plumbing':
        return <Droplets className="w-3.5 h-3.5 text-[#647B52]" />;
      case 'kitchen_appliance':
        return <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'pool_spa':
        return <Droplets className="w-3.5 h-3.5 text-[#647B52]" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-[#78837D]" />;
    }
  };

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchStatus = woStatusFilter === 'all' || wo.status === woStatusFilter;
      const matchPriority = woPriorityFilter === 'all' || wo.priority === woPriorityFilter;
      const matchCategory = woCategoryFilter === 'all' || wo.category === woCategoryFilter;
      return matchStatus && matchPriority && matchCategory;
    });
  }, [workOrders, woStatusFilter, woPriorityFilter, woCategoryFilter]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const q = assetSearch.toLowerCase();
      const matchSearch =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.assetCode.toLowerCase().includes(q) ||
        asset.location.toLowerCase().includes(q) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(q));
      const matchCategory = assetCategoryFilter === 'all' || asset.category === assetCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [assets, assetSearch, assetCategoryFilter]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newTicketForm.title.trim()) return;

    let targetName = '';
    let roomNum = '';
    if (newTicketForm.targetType === 'room' && newTicketForm.roomId) {
      const r = rooms.find((rm) => rm.id === newTicketForm.roomId);
      roomNum = r ? r.roomNumber : '';
      targetName = `Room ${roomNum}`;
    } else if (newTicketForm.targetType === 'equipment_asset' && newTicketForm.assetId) {
      const a = assets.find((ast) => ast.id === newTicketForm.assetId);
      targetName = a ? `${a.name} (${a.assetCode})` : '';
    }

    const initialStatus: WorkOrderStatus = newTicketForm.assignedTechnicianName ? 'assigned' : 'reported';

    const created = saasStorage.createWorkOrder(
      {
        hotelId,
        title: newTicketForm.title.trim(),
        description: newTicketForm.description,
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        status: initialStatus,
        source: newTicketForm.source,
        targetType: newTicketForm.targetType,
        roomId: newTicketForm.roomId || undefined,
        roomNumber: roomNum || undefined,
        assetId: newTicketForm.assetId || undefined,
        assetName: targetName || undefined,
        outletId: newTicketForm.outletId || undefined,
        roomOutOfOrder: newTicketForm.roomOutOfOrder,
        reportedBy: `${actor.fullName} (${actor.role})`,
        assignedTechnicianName: newTicketForm.assignedTechnicianName || undefined,
        reportedAt: new Date().toISOString(),
        partsUsed: [],
        totalPartsCost: 0,
        currency,
      },
      actor
    );

    setIsNewTicketModalOpen(false);
    setNewTicketForm({
      title: '',
      description: '',
      category: 'hvac',
      priority: 'medium',
      source: 'front_desk',
      targetType: 'room',
      roomId: '',
      assetId: '',
      outletId: '',
      roomOutOfOrder: false,
      assignedTechnicianName: defaultTechName,
    });
    triggerRefresh();
    toast('Work order created', {
      description: `${created.ticketNumber}: ${created.title}`,
      variant: created.roomOutOfOrder ? 'warning' : 'success',
    });
  };

  const handleOpenTicketDrawer = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo);
    setTicketStatusUpdate(wo.status);
    setResolutionNotes(wo.resolutionNotes || '');
    setLaborHours(wo.laborHours || 0);
    setIsDetailDrawerOpen(true);
  };

  const handleSaveTicketUpdate = () => {
    if (!selectedWorkOrder) return;
    const updates: Partial<WorkOrder> = {
      resolutionNotes,
      laborHours: Number(laborHours) || undefined,
    };
    const updated = saasStorage.updateWorkOrderStatus(
      selectedWorkOrder.id,
      ticketStatusUpdate,
      updates,
      actor
    );
    if (updated) {
      setSelectedWorkOrder(updated);
      toast('Work order updated', {
        description: `${updated.ticketNumber} moved to ${ticketStatusUpdate.replace('_', ' ')}.`,
        variant: 'success',
      });
    }
    triggerRefresh();
  };

  const handleAddPartToWorkOrder = () => {
    if (!selectedWorkOrder || !selectedStockId) return;
    const stock = stockItems.find((s) => s.id === selectedStockId);
    if (!stock) return;

    const qty = Math.max(1, Number(partQty) || 1);
    const cost = stock.unitCost * qty;

    const newPart = {
      itemCode: stock.itemCode,
      itemName: stock.name,
      quantity: qty,
      unitCost: stock.unitCost,
      totalCost: cost,
    };

    const updatedParts = [...(selectedWorkOrder.partsUsed || []), newPart];
    const totalCost = updatedParts.reduce((acc, p) => acc + p.totalCost, 0);

    const updated = saasStorage.updateWorkOrderStatus(
      selectedWorkOrder.id,
      selectedWorkOrder.status,
      {
        partsUsed: updatedParts,
        totalPartsCost: totalCost,
      },
      actor
    );

    stock.currentQuantity = Math.max(0, stock.currentQuantity - qty);
    saasStorage.saveStockItem(stock, actor);

    if (updated) setSelectedWorkOrder(updated);
    setSelectedStockId('');
    setPartQty(1);
    triggerRefresh();
    toast('Spare part issued', {
      description: `${qty} × ${stock.name} deducted from inventory and charged to ticket.`,
      variant: 'success',
    });
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newAssetForm.name.trim() || !newAssetForm.assetCode.trim()) return;

    const newAsset: AssetRecord = {
      id: 'ast_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      name: newAssetForm.name.trim(),
      assetCode: newAssetForm.assetCode.trim().toUpperCase(),
      category: newAssetForm.category,
      location: newAssetForm.location.trim(),
      manufacturer: newAssetForm.manufacturer,
      modelNumber: newAssetForm.modelNumber,
      serialNumber: newAssetForm.serialNumber,
      purchaseDate: newAssetForm.purchaseDate,
      purchaseCost: Number(newAssetForm.purchaseCost) || 0,
      warrantyExpiry: newAssetForm.warrantyExpiry || undefined,
      operatingStatus: newAssetForm.operatingStatus,
      serviceIntervalDays: Number(newAssetForm.serviceIntervalDays) || 30,
      nextScheduledServiceDate:
        newAssetForm.nextScheduledServiceDate || new Date().toISOString().slice(0, 10),
      criticality: newAssetForm.criticality,
      notes: newAssetForm.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveAsset(newAsset, actor);
    setIsNewAssetModalOpen(false);
    setNewAssetForm({
      name: '',
      assetCode: '',
      category: 'generator_power',
      location: '',
      manufacturer: '',
      modelNumber: '',
      serialNumber: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseCost: 50000,
      warrantyExpiry: '',
      criticality: 'essential',
      serviceIntervalDays: 30,
      nextScheduledServiceDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      operatingStatus: 'operational',
      notes: '',
    });
    triggerRefresh();
    toast('Asset registered', {
      description: `${newAsset.name} (${newAsset.assetCode}) added to plant register.`,
      variant: 'success',
    });
  };

  const handleRunPPM = (scheduleId: string) => {
    const createdWO = saasStorage.triggerPreventiveWorkOrder(scheduleId, actor);
    if (createdWO) {
      triggerRefresh();
      handleOpenTicketDrawer(createdWO);
      toast('PPM work order generated', {
        description: `Ticket ${createdWO.ticketNumber} created with inspection checklist.`,
        variant: 'info',
      });
    }
  };

  const handleCreatePPM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newScheduleForm.title.trim()) return;

    const asset = assets.find((a) => a.id === newScheduleForm.assetId);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const scheduleCode = `PPM-${year}-${rand}`;

    const checklist: PreventiveChecklistItem[] = newScheduleForm.checklistTasks
      .filter((t) => t.trim().length > 0)
      .map((t, idx) => ({
        id: `c_${idx + 1}`,
        task: t,
        isMandatory: true,
      }));

    const newPPM: PreventiveSchedule = {
      id: 'ppm_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      scheduleCode,
      title: newScheduleForm.title.trim(),
      assetId: newScheduleForm.assetId || undefined,
      assetName: asset?.name || 'Hotel Facility Equipment',
      category: newScheduleForm.category,
      frequency: newScheduleForm.frequency,
      checklist,
      estimatedHours: Number(newScheduleForm.estimatedHours) || 2,
      assignedRoleOrTech: newScheduleForm.assignedRoleOrTech,
      nextDueDate: newScheduleForm.nextDueDate,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    saasStorage.savePreventiveSchedule(newPPM, actor);
    setIsNewScheduleModalOpen(false);
    setNewScheduleForm((prev) => ({ ...prev, title: '' }));
    triggerRefresh();
    toast('PPM schedule saved', {
      description: `${newPPM.scheduleCode}: ${newPPM.title}`,
      variant: 'success',
    });
  };

  const exportWorkOrdersCSV = () => {
    const headers = [
      'Ticket Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Target Room/Asset',
      'Assigned Technician',
      'Reported By',
      'Reported Date',
      'Resolved Date',
      'Labor Hours',
      `Parts Cost (${currency})`,
    ];

    const rows = filteredWorkOrders.map((w) => [
      w.ticketNumber,
      w.title,
      w.category,
      w.priority,
      w.status,
      w.roomNumber ? `Room ${w.roomNumber}` : w.assetName || 'General Facility',
      w.assignedTechnicianName || 'Unassigned',
      w.reportedBy,
      formatShortDate(w.reportedAt),
      w.resolvedAt ? formatShortDate(w.resolvedAt) : 'N/A',
      w.laborHours || 0,
      w.totalPartsCost || 0,
    ]);

    downloadCsvFile(
      `maintenance-work-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
    toast('Work orders exported', {
      description: `${filteredWorkOrders.length} tickets downloaded to CSV.`,
      variant: 'info',
    });
  };

  const activeDefectsCount = useMemo(
    () => workOrders.filter((w) => w.status !== 'resolved' && w.status !== 'closed').length,
    [workOrders]
  );
  const criticalDefectsCount = useMemo(
    () =>
      workOrders.filter(
        (w) => w.priority === 'critical' && w.status !== 'resolved' && w.status !== 'closed'
      ).length,
    [workOrders]
  );
  const oooWorkOrders = useMemo(
    () =>
      workOrders.filter((w) => w.roomOutOfOrder && w.status !== 'resolved' && w.status !== 'closed'),
    [workOrders]
  );
  const totalAssetValuation = useMemo(
    () => assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0),
    [assets]
  );

  const workOrderColumns: DataTableColumn<WorkOrder>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket #',
      sortable: true,
      sortValue: (w) => w.ticketNumber,
      render: (w) => (
        <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B]">
          {w.ticketNumber}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title & Target',
      sortable: true,
      sortValue: (w) => w.title,
      render: (w) => (
        <div className="min-w-[210px]">
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] line-clamp-1">{w.title}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-[#78837D] dark:text-[#92A199]">
            {w.roomNumber && (
              <span className="font-mono font-medium text-[#173F35] dark:text-[#C6A15B]">
                Room {w.roomNumber}
              </span>
            )}
            {w.roomOutOfOrder && <StatusBadge label="OOO Locked" tone="critical" showIcon={false} />}
            {w.assetName && <span>{w.assetName}</span>}
            {!w.roomNumber && !w.assetName && <span>General Facility</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (w) => w.category,
      render: (w) => (
        <div className="inline-flex items-center gap-1.5 capitalize whitespace-nowrap">
          {getCategoryIcon(w.category)}
          <span>{w.category.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      sortValue: (w) => w.priority,
      render: (w) => renderPriorityBadge(w.priority),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (w) => w.status,
      render: (w) => renderWorkOrderStatusBadge(w.status),
    },
    {
      key: 'tech',
      header: 'Assigned Tech',
      sortable: true,
      sortValue: (w) => w.assignedTechnicianName || '',
      render: (w) =>
        w.assignedTechnicianName ? (
          <span className="text-[#202B27] dark:text-[#ECF1EE]">{w.assignedTechnicianName}</span>
        ) : (
          <span className="text-[#78837D] italic">Unassigned</span>
        ),
    },
    {
      key: 'reported',
      header: 'Reported',
      sortable: true,
      sortValue: (w) => w.reportedAt,
      render: (w) => (
        <span className="font-mono text-[#78837D] dark:text-[#92A199] whitespace-nowrap">
          {formatShortDate(w.reportedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (w) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenTicketDrawer(w);
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
    { id: 'work_orders' as const, label: 'Work Orders & Tickets', count: workOrders.length, icon: Wrench },
    { id: 'assets' as const, label: 'Asset Register', count: assets.length, icon: Building },
    { id: 'preventive' as const, label: 'Preventive (PPM)', count: preventiveSchedules.length, icon: RotateCcw },
    { id: 'analytics' as const, label: 'Performance & OOO Board', count: oooWorkOrders.length, icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Engineering', 'Facilities & Assets', 'Maintenance & Assets']}
        title="Engineering, Work Orders & Asset Register"
        subtitle="Defect ticketing, HVAC & generator plant health, preventive maintenance routines (PPM), and Room Out-of-Order locks."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{activeHotel?.name || 'Active Property'}</span>
            <span aria-hidden="true">·</span>
            <span>{assets.length} Tracked Assets</span>
            <span aria-hidden="true">·</span>
            <span>{oooWorkOrders.length} Rooms OOO</span>
            <SampleDataBadge />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsNewAssetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <Building className="w-3.5 h-3.5 text-[#78837D]" />
              Register Asset
            </button>
            <button
              type="button"
              onClick={() => setIsNewTicketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Report Defect
            </button>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Work Orders"
          value={activeDefectsCount}
          deltaTone={activeDefectsCount > 0 ? 'warning' : 'positive'}
          helper="Reported, assigned & in progress"
          icon={Wrench}
        />
        <KpiCard
          label="Critical Priority"
          value={criticalDefectsCount}
          delta={criticalDefectsCount > 0 ? 'Immediate Action' : 'Clear'}
          deltaTone={criticalDefectsCount > 0 ? 'critical' : 'positive'}
          helper="Guest-impacting defects"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Rooms Out-of-Order"
          value={oooWorkOrders.length}
          deltaTone={oooWorkOrders.length > 0 ? 'critical' : 'positive'}
          helper="Locked from reservations"
          icon={ShieldAlert}
        />
        <KpiCard
          label="Tracked Plant Assets"
          value={assets.length}
          delta={formatCurrency(totalAssetValuation, currency, currencySymbol, { compact: true })}
          deltaTone="forest"
          helper="Registered equipment value"
          icon={Building}
        />
      </div>

      {/* Tabs */}
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
              <span className="px-1.5 py-0.5 rounded bg-[#F1F4F1] dark:bg-[#192622] text-[10px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199]">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORK ORDERS */}
      {activeTab === 'work_orders' && (
        <DataTable
          data={filteredWorkOrders}
          columns={workOrderColumns}
          keyExtractor={(w) => w.id}
          searchPlaceholder="Search ticket #, title, room, asset, or tech..."
          searchFilter={(wo, q) =>
            wo.ticketNumber.toLowerCase().includes(q) ||
            wo.title.toLowerCase().includes(q) ||
            Boolean(wo.roomNumber && wo.roomNumber.toLowerCase().includes(q)) ||
            Boolean(wo.assetName && wo.assetName.toLowerCase().includes(q)) ||
            Boolean(wo.assignedTechnicianName && wo.assignedTechnicianName.toLowerCase().includes(q))
          }
          filterToolbar={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={woStatusFilter}
                onChange={(e) => setWoStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs seam-input"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="parts_pending">Parts Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={woPriorityFilter}
                onChange={(e) => setWoPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs seam-input"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={woCategoryFilter}
                onChange={(e) => setWoCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs seam-input"
              >
                <option value="all">All Categories</option>
                <option value="generator_power">Generator &amp; Power</option>
                <option value="hvac">HVAC &amp; AC</option>
                <option value="plumbing">Plumbing &amp; Boilers</option>
                <option value="electrical">Electrical</option>
                <option value="kitchen_appliance">Kitchen Appliances</option>
                <option value="pool_spa">Pool &amp; Spa</option>
                <option value="carpentry">Carpentry &amp; Furniture</option>
                <option value="civil_painting">Painting &amp; Civil</option>
              </select>
            </div>
          }
          onExportCsv={exportWorkOrdersCSV}
          emptyTitle="No maintenance tickets found"
          emptyDescription="No work orders match the active filters. Create a defect ticket when equipment needs attention."
          emptyAction={
            <button
              type="button"
              onClick={() => setIsNewTicketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] text-white hover:bg-[#113028]"
            >
              <Plus className="w-3.5 h-3.5" />
              Report Defect
            </button>
          }
          onRowClick={(w) => handleOpenTicketDrawer(w)}
        />
      )}

      {/* TAB 2: ASSET REGISTER */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <input
                type="text"
                placeholder="Search asset name, code, serial, or location..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="flex-1 min-w-[200px] max-w-sm px-3 py-1.5 text-xs seam-input"
              />
              <select
                value={assetCategoryFilter}
                onChange={(e) => setAssetCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
              >
                <option value="all">All Categories</option>
                <option value="generator_power">Generators &amp; Power</option>
                <option value="hvac">HVAC &amp; Chillers</option>
                <option value="plumbing">Boilers &amp; Water Heating</option>
                <option value="electrical">Laundry &amp; Electrical</option>
                <option value="pool_spa">Pool Filtration &amp; Pumps</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsNewAssetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Asset
            </button>
          </div>

          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No matching assets"
              description="Register generators, chillers, boilers, or laundry equipment to monitor preventive intervals."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const statusTone =
                  asset.operatingStatus === 'operational'
                    ? 'success'
                    : asset.operatingStatus === 'degraded'
                    ? 'warning'
                    : 'critical';
                return (
                  <div key={asset.id} className="seam-surface p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-md">
                          {asset.assetCode}
                        </span>
                        <StatusBadge
                          label={asset.operatingStatus.replace('_', ' ')}
                          tone={statusTone}
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-[#78837D] dark:text-[#92A199] flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 shrink-0" />
                          <span>{asset.location || 'Property Plant'}</span>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-1.5 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="text-[#78837D] dark:text-[#92A199]">Model</span>
                          <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] text-right">
                            {asset.manufacturer || '—'} {asset.modelNumber}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#78837D] dark:text-[#92A199]">Serial #</span>
                          <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                            {asset.serialNumber || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#78837D] dark:text-[#92A199]">Valuation</span>
                          <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(asset.purchaseCost || 0, currency, currencySymbol)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#78837D] dark:text-[#92A199]">Criticality</span>
                          <span
                            className={`font-semibold capitalize ${
                              asset.criticality === 'vital'
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-[#173F35] dark:text-[#C6A15B]'
                            }`}
                          >
                            {asset.criticality}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#78837D] dark:text-[#92A199]">Next Service</span>
                          <span className="font-mono text-amber-700 dark:text-amber-400">
                            {asset.nextScheduledServiceDate || 'Not set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs">
                      <span className="text-[#78837D] dark:text-[#92A199] font-mono">
                        Last: {asset.lastServicedDate || '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTicketForm((prev) => ({
                            ...prev,
                            title: `Maintenance: ${asset.name}`,
                            category: asset.category,
                            targetType: 'equipment_asset',
                            assetId: asset.id,
                            priority: asset.criticality === 'vital' ? 'high' : 'medium',
                          }));
                          setIsNewTicketModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Create Ticket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PREVENTIVE MAINTENANCE (PPM) */}
      {activeTab === 'preventive' && (
        <div className="space-y-4">
          <div className="seam-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                  Preventive Maintenance (PPM) Routines
                </h3>
                <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                  Scheduled inspection routines generate work orders with standardized engineering checklists.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              New PPM Routine
            </button>
          </div>

          {preventiveSchedules.length === 0 ? (
            <EmptyState
              icon={RotateCcw}
              title="No PPM routines scheduled"
              description="Define recurring daily, weekly, or monthly inspection checklists for critical plant systems."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preventiveSchedules.map((schedule) => (
                <div key={schedule.id} className="seam-surface p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F1F4F1] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] px-2 py-0.5 rounded-md">
                          {schedule.scheduleCode}
                        </span>
                        <StatusBadge
                          label={schedule.frequency.replace('_', ' ')}
                          tone="forest"
                          showIcon={false}
                        />
                      </div>
                      <span className="text-xs text-[#78837D] dark:text-[#92A199] font-mono">
                        Due: <strong className="text-[#202B27] dark:text-[#ECF1EE]">{schedule.nextDueDate}</strong>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                        {schedule.title}
                      </h3>
                      {schedule.assetName && (
                        <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                          Equipment: <strong className="text-[#202B27] dark:text-[#ECF1EE]">{schedule.assetName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="seam-surface-subtle p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
                        Inspection Checklist ({schedule.checklist.length} points)
                      </div>
                      <ul className="space-y-1 text-xs text-[#78837D] dark:text-[#92A199]">
                        {schedule.checklist.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#647B52] font-bold">·</span>
                            <span>
                              {c.task}{' '}
                              {c.isMandatory && (
                                <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                                  (Mandatory)
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#78837D] dark:text-[#92A199]">
                      Assigned:{' '}
                      <strong className="text-[#202B27] dark:text-[#ECF1EE]">
                        {schedule.assignedRoleOrTech || 'Maintenance Lead'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRunPPM(schedule.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Run PPM Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PERFORMANCE & OOO BOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="seam-surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
              <div>
                <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Rooms Currently Out-of-Order (OOO)
                </h3>
                <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                  Locked from Front Desk arrivals and reservations until maintenance resolution.
                </p>
              </div>
              <StatusBadge
                label={`${oooWorkOrders.length} Rooms Blocked`}
                tone={oooWorkOrders.length > 0 ? 'critical' : 'success'}
              />
            </div>

            {oooWorkOrders.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All guestrooms operational"
                description="No rooms are currently flagged Out-of-Order. 100% of active room inventory is available."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] border-b border-[#E6EBE7] dark:border-[#22322C]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Room #</th>
                      <th className="px-4 py-2.5 text-left font-medium">Blocking Work Order</th>
                      <th className="px-4 py-2.5 text-left font-medium">Category</th>
                      <th className="px-4 py-2.5 text-left font-medium">Priority</th>
                      <th className="px-4 py-2.5 text-left font-medium">Reported</th>
                      <th className="px-4 py-2.5 text-left font-medium">Technician</th>
                      <th className="px-4 py-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                    {oooWorkOrders.map((wo) => (
                      <tr key={wo.id} className="hover:bg-[#F6F8F6]/60 dark:hover:bg-[#192622]/60">
                        <td className="px-4 py-3 font-mono font-semibold text-rose-700 dark:text-rose-400">
                          Room {wo.roomNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{wo.title}</div>
                          <span className="font-mono text-[11px] text-[#78837D]">{wo.ticketNumber}</span>
                        </td>
                        <td className="px-4 py-3 capitalize">{wo.category.replace('_', ' ')}</td>
                        <td className="px-4 py-3">{renderPriorityBadge(wo.priority)}</td>
                        <td className="px-4 py-3 font-mono text-[#78837D]">{formatShortDate(wo.reportedAt)}</td>
                        <td className="px-4 py-3">{wo.assignedTechnicianName || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenTicketDrawer(wo)}
                            className="font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline"
                          >
                            Resolve &amp; Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="seam-surface p-5 space-y-3">
              <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Defects by Category
              </h4>
              <div className="space-y-2.5 text-xs">
                {['generator_power', 'hvac', 'plumbing', 'electrical', 'kitchen_appliance'].map((cat) => {
                  const count = workOrders.filter((w) => w.category === cat).length;
                  const pct = workOrders.length > 0 ? Math.round((count / workOrders.length) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[#202B27] dark:text-[#ECF1EE]">
                        <span className="capitalize">{cat.replace('_', ' ')}</span>
                        <span className="font-mono tabular-nums text-[#78837D]">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F1F4F1] dark:bg-[#192622] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#173F35] dark:bg-[#C6A15B] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="seam-surface p-5 space-y-3">
              <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Resolution Turnaround
              </h4>
              <div className="text-2xl font-semibold font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B]">
                {workOrders.filter((w) => w.status === 'resolved' || w.status === 'closed').length}{' '}
                <span className="text-xs font-sans font-normal text-[#78837D]">
                  of {workOrders.length} tickets resolved
                </span>
              </div>
              <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#78837D] dark:text-[#92A199]">Total Labor Logged</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {workOrders.reduce((acc, w) => acc + (w.laborHours || 0), 0)} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78837D] dark:text-[#92A199]">Open Critical Tickets</span>
                  <span className="font-mono tabular-nums font-semibold text-rose-700 dark:text-rose-400">
                    {criticalDefectsCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="seam-surface p-5 space-y-3">
              <h4 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Engineering Spares Consumed
              </h4>
              <div className="text-2xl font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                {formatCurrency(
                  workOrders.reduce((acc, w) => acc + (w.totalPartsCost || 0), 0),
                  currency,
                  currencySymbol
                )}
              </div>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Issued directly from Stores &amp; Inventory spare stock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW WORK ORDER */}
      <Modal
        open={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="Report Defect / New Work Order"
        subtitle="Submit maintenance ticket for guestrooms, plant equipment, or public facilities."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Defect Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Room 204 HVAC split unit blowing warm air"
              value={newTicketForm.title}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target Type
              </label>
              <select
                value={newTicketForm.targetType}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, targetType: e.target.value as WorkOrder['targetType'] })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="room">Guest Room</option>
                <option value="equipment_asset">Plant / Asset Equipment</option>
                <option value="outlet">Outlet / POS Area</option>
                <option value="public_area">Public Area / Facility</option>
              </select>
            </div>

            {newTicketForm.targetType === 'room' && (
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Select Room
                </label>
                <select
                  value={newTicketForm.roomId}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, roomId: e.target.value })}
                  className="w-full px-3 py-2 seam-input"
                >
                  <option value="">Choose Room...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomTypeName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newTicketForm.targetType === 'equipment_asset' && (
              <div>
                <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                  Select Asset
                </label>
                <select
                  value={newTicketForm.assetId}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, assetId: e.target.value })}
                  className="w-full px-3 py-2 seam-input"
                >
                  <option value="">Choose Asset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {newTicketForm.targetType === 'room' && (
            <label className="seam-surface-subtle p-3 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={newTicketForm.roomOutOfOrder}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, roomOutOfOrder: e.target.checked })}
                className="mt-0.5 rounded accent-[#173F35]"
              />
              <div>
                <span className="font-semibold text-amber-800 dark:text-amber-300 block">
                  Flag Room Out-of-Order (OOO)
                </span>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                  Blocks Front Desk check-ins until this ticket is resolved.
                </span>
              </div>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newTicketForm.category}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, category: e.target.value as MaintenanceCategory })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="generator_power">Generator &amp; Power</option>
                <option value="hvac">HVAC &amp; Air Con</option>
                <option value="plumbing">Plumbing &amp; Boilers</option>
                <option value="electrical">Electrical</option>
                <option value="kitchen_appliance">Kitchen Appliance</option>
                <option value="pool_spa">Pool &amp; Spa</option>
                <option value="carpentry">Carpentry &amp; Locks</option>
                <option value="civil_painting">Painting / Civil</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Priority</label>
              <select
                value={newTicketForm.priority}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, priority: e.target.value as WorkOrderPriority })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="critical">Critical (Immediate)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Assign Technician
            </label>
            <input
              type="text"
              value={newTicketForm.assignedTechnicianName}
              onChange={(e) =>
                setNewTicketForm({ ...newTicketForm, assignedTechnicianName: e.target.value })
              }
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Detailed Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe failure symptoms or observed damage..."
              value={newTicketForm.description}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewTicketModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Create Work Order
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MANAGE WORK ORDER & PARTS CONSUMPTION */}
      <Modal
        open={isDetailDrawerOpen && Boolean(selectedWorkOrder)}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedWorkOrder?.title || 'Work Order Details'}
        subtitle={
          selectedWorkOrder
            ? `${selectedWorkOrder.ticketNumber} · Reported ${formatShortDate(selectedWorkOrder.reportedAt)} by ${selectedWorkOrder.reportedBy}`
            : undefined
        }
        maxWidthClass="max-w-2xl"
        footer={
          <button
            type="button"
            onClick={() => setIsDetailDrawerOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
          >
            Close
          </button>
        }
      >
        {selectedWorkOrder && (
          <div className="space-y-4 text-xs">
            <div className="seam-surface-subtle p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[#78837D] block">Category</span>
                <span className="font-semibold capitalize text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedWorkOrder.category.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] block mb-0.5">Priority</span>
                {renderPriorityBadge(selectedWorkOrder.priority)}
              </div>
              <div>
                <span className="text-[#78837D] block">Target</span>
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedWorkOrder.roomNumber
                    ? `Room ${selectedWorkOrder.roomNumber}`
                    : selectedWorkOrder.assetName || 'General Facility'}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] block">Room OOO</span>
                <span
                  className={`font-semibold ${
                    selectedWorkOrder.roomOutOfOrder
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {selectedWorkOrder.roomOutOfOrder ? 'Room Locked' : 'Normal'}
                </span>
              </div>
            </div>

            {selectedWorkOrder.description && (
              <div className="seam-surface-subtle p-3.5">
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Issue Description
                </span>
                <p className="text-[#78837D] dark:text-[#92A199] whitespace-pre-line">
                  {selectedWorkOrder.description}
                </p>
              </div>
            )}

            <div className="seam-surface-subtle p-4 space-y-3">
              <h4 className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Technician Action &amp; Status Lifecycle
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#78837D] mb-1">Status</label>
                  <select
                    value={ticketStatusUpdate}
                    onChange={(e) => setTicketStatusUpdate(e.target.value as WorkOrderStatus)}
                    className="w-full px-3 py-2 seam-input"
                  >
                    <option value="reported">Reported</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="parts_pending">Parts Pending</option>
                    <option value="resolved">Resolved (Fix Complete)</option>
                    <option value="closed">Closed &amp; Verified</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#78837D] mb-1">Labor Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={laborHours}
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                    className="w-full px-3 py-2 seam-input font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-[#78837D] mb-1">Resolution Notes</label>
                <textarea
                  rows={2}
                  placeholder="Record root cause and corrective service notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 seam-input"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveTicketUpdate}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
                >
                  Save Status &amp; Notes
                </button>
              </div>
            </div>

            <div className="border border-[#E6EBE7] dark:border-[#22322C] rounded-[10px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#78837D]" />
                  Spare Parts Consumed
                </h4>
                <span className="font-mono tabular-nums font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Total: {formatCurrency(selectedWorkOrder.totalPartsCost || 0, currency, currencySymbol)}
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 seam-input"
                >
                  <option value="">Select spare part from Stores...</option>
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.itemCode}) — {item.currentQuantity} {item.unitOfMeasure} (
                      {formatCurrency(item.unitCost, currency, currencySymbol)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={partQty}
                  onChange={(e) => setPartQty(Number(e.target.value))}
                  className="w-16 px-2.5 py-1.5 seam-input font-mono tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleAddPartToWorkOrder}
                  disabled={!selectedStockId}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] text-white disabled:opacity-40 whitespace-nowrap"
                >
                  Issue Part
                </button>
              </div>

              {selectedWorkOrder.partsUsed && selectedWorkOrder.partsUsed.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-[#78837D] border-b border-[#E6EBE7] dark:border-[#22322C]">
                      <tr>
                        <th className="text-left py-1.5 font-medium">Code</th>
                        <th className="text-left py-1.5 font-medium">Item</th>
                        <th className="text-center py-1.5 font-medium">Qty</th>
                        <th className="text-right py-1.5 font-medium">Unit</th>
                        <th className="text-right py-1.5 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                      {selectedWorkOrder.partsUsed.map((p, i) => (
                        <tr key={i}>
                          <td className="py-1.5 font-mono text-[#78837D]">{p.itemCode}</td>
                          <td className="py-1.5 font-medium">{p.itemName}</td>
                          <td className="py-1.5 text-center font-mono tabular-nums font-semibold">
                            {p.quantity}
                          </td>
                          <td className="py-1.5 text-right font-mono tabular-nums">
                            {formatCurrency(p.unitCost, currency, currencySymbol)}
                          </td>
                          <td className="py-1.5 text-right font-mono tabular-nums font-semibold">
                            {formatCurrency(p.totalCost, currency, currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#78837D] italic">No spare parts logged on this work order.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: REGISTER ASSET */}
      <Modal
        open={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        title="Register Plant Equipment / Asset"
        subtitle="Add heavy machinery, HVAC, boilers, or laundry equipment to the central asset register."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 350kVA Standby Generator"
              value={newAssetForm.name}
              onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Asset Code *
              </label>
              <input
                type="text"
                required
                placeholder="AST-GEN-02"
                value={newAssetForm.assetCode}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, assetCode: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Category</label>
              <select
                value={newAssetForm.category}
                onChange={(e) =>
                  setNewAssetForm({ ...newAssetForm, category: e.target.value as MaintenanceCategory })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="generator_power">Generators &amp; Power</option>
                <option value="hvac">HVAC &amp; Chillers</option>
                <option value="plumbing">Plumbing &amp; Boilers</option>
                <option value="electrical">Laundry &amp; Electrical</option>
                <option value="pool_spa">Pool Filtration &amp; Spa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Physical Location
              </label>
              <input
                type="text"
                placeholder="e.g., Rooftop Plant Room"
                value={newAssetForm.location}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, location: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                placeholder="e.g., Cummins, Daikin"
                value={newAssetForm.manufacturer}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, manufacturer: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Model #</label>
              <input
                type="text"
                value={newAssetForm.modelNumber}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, modelNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Serial #</label>
              <input
                type="text"
                value={newAssetForm.serialNumber}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, serialNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Purchase Valuation ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={newAssetForm.purchaseCost}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, purchaseCost: Number(e.target.value) })}
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Criticality
              </label>
              <select
                value={newAssetForm.criticality}
                onChange={(e) =>
                  setNewAssetForm({
                    ...newAssetForm,
                    criticality: e.target.value as AssetRecord['criticality'],
                  })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="vital">Vital (Core Operations)</option>
                <option value="essential">Essential (High Impact)</option>
                <option value="desirable">Desirable (Standard)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Service Interval (Days)
              </label>
              <input
                type="number"
                min="1"
                value={newAssetForm.serviceIntervalDays}
                onChange={(e) =>
                  setNewAssetForm({ ...newAssetForm, serviceIntervalDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Next Service Date
              </label>
              <input
                type="date"
                value={newAssetForm.nextScheduledServiceDate}
                onChange={(e) =>
                  setNewAssetForm({ ...newAssetForm, nextScheduledServiceDate: e.target.value })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewAssetModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Register Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NEW PPM ROUTINE */}
      <Modal
        open={isNewScheduleModalOpen}
        onClose={() => setIsNewScheduleModalOpen(false)}
        title="New Preventive Maintenance (PPM) Routine"
        subtitle="Establish automated inspection checklists on a recurring schedule."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreatePPM} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Routine Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Weekly Standby Generator Load & Oil Test"
              value={newScheduleForm.title}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, title: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Target Asset
              </label>
              <select
                value={newScheduleForm.assetId}
                onChange={(e) => setNewScheduleForm({ ...newScheduleForm, assetId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="">Select Asset...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assetCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">Frequency</label>
              <select
                value={newScheduleForm.frequency}
                onChange={(e) =>
                  setNewScheduleForm({
                    ...newScheduleForm,
                    frequency: e.target.value as PreventiveSchedule['frequency'],
                  })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                First Scheduled Date
              </label>
              <input
                type="date"
                value={newScheduleForm.nextDueDate}
                onChange={(e) => setNewScheduleForm({ ...newScheduleForm, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Assigned Role / Tech
              </label>
              <input
                type="text"
                value={newScheduleForm.assignedRoleOrTech}
                onChange={(e) =>
                  setNewScheduleForm({ ...newScheduleForm, assignedRoleOrTech: e.target.value })
                }
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE]">Checklist Tasks</label>
              <button
                type="button"
                onClick={() =>
                  setNewScheduleForm({
                    ...newScheduleForm,
                    checklistTasks: [...newScheduleForm.checklistTasks, ''],
                  })
                }
                className="text-xs font-semibold text-[#173F35] dark:text-[#C6A15B] hover:underline"
              >
                + Add Task
              </button>
            </div>
            <div className="space-y-2">
              {newScheduleForm.checklistTasks.map((task, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="font-mono text-[#78837D] w-4">{i + 1}.</span>
                  <input
                    type="text"
                    placeholder="Inspection task description"
                    value={task}
                    onChange={(e) => {
                      const updated = [...newScheduleForm.checklistTasks];
                      updated[i] = e.target.value;
                      setNewScheduleForm({ ...newScheduleForm, checklistTasks: updated });
                    }}
                    className="flex-1 px-2.5 py-1.5 seam-input"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsNewScheduleModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] text-white"
            >
              Save PPM Routine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
