/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Stores & Stock Inventory Management — Multi-Store Valuation, GRV, SIV & Stocktake Audits
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Download,
  Warehouse,
  ShieldAlert,
  ClipboardList,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  StockItem,
  StoreLocation,
  GoodsReceivedVoucher,
  StoreIssueVoucher,
  StockAdjustment,
  StockCategory,
  Department,
  GRVItem,
  SIVItem,
} from '../../types/saas';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  DataTable,
  Modal,
  EmptyState,
  SampleDataBadge,
  type DataTableColumn,
} from '../ui';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';

export const InventoryManagement: React.FC = () => {
  const { user, activeHotel } = useAuth();
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<
    'stock_register' | 'grv' | 'siv' | 'adjustments' | 'locations'
  >('stock_register');

  // Data States
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [grvs, setGrvs] = useState<GoodsReceivedVoucher[]>([]);
  const [sivs, setSivs] = useState<StoreIssueVoucher[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filter States
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
  const [showNewGRVModal, setShowNewGRVModal] = useState<boolean>(false);
  const [showNewSIVModal, setShowNewSIVModal] = useState<boolean>(false);
  const [showNewAdjustmentModal, setShowNewAdjustmentModal] = useState<boolean>(false);
  const [showNewLocationModal, setShowNewLocationModal] = useState<boolean>(false);
  const [selectedGRVDetail, setSelectedGRVDetail] = useState<GoodsReceivedVoucher | null>(null);
  const [selectedSIVDetail, setSelectedSIVDetail] = useState<StoreIssueVoucher | null>(null);

  // Forms
  const [newItemForm, setNewItemForm] = useState({
    itemCode: '',
    name: '',
    category: 'food' as StockCategory,
    unitOfMeasure: 'kg',
    storeLocationId: '',
    currentQuantity: '0',
    reorderPoint: '10',
    reorderQuantity: '20',
    unitCost: '100',
    preferredSupplier: '',
  });

  const [newGRVForm, setNewGRVForm] = useState({
    vendorName: '',
    invoiceReference: '',
    purchaseRequisitionNumber: '',
    storeLocationId: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    items: [{ itemId: '', quantity: '1', unitCost: '100' }],
  });

  const [newSIVForm, setNewSIVForm] = useState({
    requestingDepartmentId: '',
    storeLocationId: '',
    issuedToStaffName: '',
    issueDate: new Date().toISOString().slice(0, 10),
    purpose: '',
    notes: '',
    items: [{ itemId: '', quantity: '1' }],
  });

  const [newAdjForm, setNewAdjForm] = useState({
    itemId: '',
    adjustmentType: 'breakage' as
      | 'spoilage'
      | 'breakage'
      | 'physical_count_variance'
      | 'expired'
      | 'return_to_vendor',
    newQuantity: '',
    reason: '',
  });

  const [newLocForm, setNewLocForm] = useState({
    code: '',
    name: '',
    managerName: '',
    description: '',
  });

  const actor = useMemo(
    () => ({
      email: user?.email || 'stores@hotel.com',
      fullName: user?.fullName || 'Store Manager',
      role: user?.role || 'dept_head',
    }),
    [user]
  );

  const loadData = () => {
    if (!hotelId) return;
    const items = saasStorage.getStockItems(hotelId);
    const locs = saasStorage.getStoreLocations(hotelId);
    const allGrvs = saasStorage.getGRVs(hotelId);
    const allSivs = saasStorage.getSIVs(hotelId);
    const allAdjs = saasStorage.getStockAdjustments(hotelId);
    const depts = saasStorage.getDepartments(hotelId).filter((d) => d.status === 'active');

    setStockItems(items);
    setStoreLocations(locs);
    setGrvs(allGrvs);
    setSivs(allSivs);
    setAdjustments(allAdjs);
    setDepartments(depts);

    const defaultLocId = locs[0]?.id || '';
    const defaultDeptId = depts[0]?.id || '';
    setNewItemForm((prev) => ({
      ...prev,
      storeLocationId: prev.storeLocationId && locs.some((l) => l.id === prev.storeLocationId) ? prev.storeLocationId : defaultLocId,
    }));
    setNewGRVForm((prev) => ({
      ...prev,
      storeLocationId: prev.storeLocationId && locs.some((l) => l.id === prev.storeLocationId) ? prev.storeLocationId : defaultLocId,
    }));
    setNewSIVForm((prev) => ({
      ...prev,
      storeLocationId: prev.storeLocationId && locs.some((l) => l.id === prev.storeLocationId) ? prev.storeLocationId : defaultLocId,
      requestingDepartmentId:
        prev.requestingDepartmentId && depts.some((d) => d.id === prev.requestingDepartmentId)
          ? prev.requestingDepartmentId
          : defaultDeptId,
    }));
  };

  useEffect(() => {
    setLocationFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSelectedGRVDetail(null);
    setSelectedSIVDetail(null);
    setShowNewItemModal(false);
    setShowNewGRVModal(false);
    setShowNewSIVModal(false);
    setShowNewAdjustmentModal(false);
    setShowNewLocationModal(false);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  // KPI Calculations
  const totalValuation = useMemo(
    () => stockItems.reduce((acc, item) => acc + item.totalValue, 0),
    [stockItems]
  );
  const totalItemsCount = stockItems.length;
  const lowStockCount = useMemo(
    () => stockItems.filter((i) => i.status === 'low_stock').length,
    [stockItems]
  );
  const outOfStockCount = useMemo(
    () => stockItems.filter((i) => i.status === 'out_of_stock').length,
    [stockItems]
  );

  // Filtered Stock Items
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchLoc = locationFilter === 'all' || item.storeLocationId === locationFilter;
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchLoc && matchCat && matchStatus;
    });
  }, [stockItems, locationFilter, categoryFilter, statusFilter]);

  const handleCreateStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newItemForm.name || !newItemForm.itemCode || !newItemForm.storeLocationId) {
      toast('Missing required fields', {
        description: 'Please enter an item code, description, and storage location.',
        variant: 'error',
      });
      return;
    }

    const curQty = parseFloat(newItemForm.currentQuantity) || 0;
    const reorderPt = parseFloat(newItemForm.reorderPoint) || 10;
    const reorderQty = parseFloat(newItemForm.reorderQuantity) || 20;
    const cost = parseFloat(newItemForm.unitCost) || 0;

    const loc = storeLocations.find((l) => l.id === newItemForm.storeLocationId);
    const storeLocationName = loc ? loc.name : 'Main Store';

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (curQty === 0) status = 'out_of_stock';
    else if (curQty <= reorderPt) status = 'low_stock';

    const newItem: StockItem = {
      id: 'stk_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      itemCode: newItemForm.itemCode.toUpperCase().trim(),
      name: newItemForm.name.trim(),
      category: newItemForm.category,
      unitOfMeasure: newItemForm.unitOfMeasure.trim(),
      storeLocationId: newItemForm.storeLocationId,
      storeLocationName,
      currentQuantity: curQty,
      reorderPoint: reorderPt,
      reorderQuantity: reorderQty,
      unitCost: cost,
      currency,
      totalValue: curQty * cost,
      preferredSupplier: newItemForm.preferredSupplier.trim() || undefined,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveStockItem(newItem, actor);
    toast(`Stock item ${newItem.itemCode} registered`, {
      description: `${newItem.name} added to ${storeLocationName}.`,
      variant: 'success',
    });
    setShowNewItemModal(false);
    setNewItemForm({
      itemCode: '',
      name: '',
      category: 'food',
      unitOfMeasure: 'kg',
      storeLocationId: storeLocations[0]?.id || '',
      currentQuantity: '0',
      reorderPoint: '10',
      reorderQuantity: '20',
      unitCost: '100',
      preferredSupplier: '',
    });
    loadData();
  };

  const handleCreateGRV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newGRVForm.vendorName || !newGRVForm.storeLocationId) {
      toast('Incomplete GRV details', {
        description: 'Please enter a vendor name and receiving storage depot.',
        variant: 'error',
      });
      return;
    }

    const validItems: GRVItem[] = [];
    let grandTotal = 0;

    for (const row of newGRVForm.items) {
      if (!row.itemId) continue;
      const stockItem = stockItems.find((s) => s.id === row.itemId);
      if (!stockItem) continue;

      const qty = parseFloat(row.quantity);
      const cost = parseFloat(row.unitCost);
      if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) continue;

      const totalCost = qty * cost;
      grandTotal += totalCost;

      validItems.push({
        itemId: stockItem.id,
        itemCode: stockItem.itemCode,
        itemName: stockItem.name,
        unitOfMeasure: stockItem.unitOfMeasure,
        quantity: qty,
        unitCost: cost,
        totalCost,
      });
    }

    if (validItems.length === 0) {
      toast('No valid line items', {
        description: 'Add at least one SKU with a positive received quantity.',
        variant: 'error',
      });
      return;
    }

    const loc = storeLocations.find((l) => l.id === newGRVForm.storeLocationId);
    const storeLocationName = loc ? loc.name : 'Main Store';

    const grv = saasStorage.createGRV(
      {
        hotelId,
        vendorName: newGRVForm.vendorName.trim(),
        invoiceReference: newGRVForm.invoiceReference.trim() || undefined,
        purchaseRequisitionNumber: newGRVForm.purchaseRequisitionNumber.trim() || undefined,
        storeLocationId: newGRVForm.storeLocationId,
        storeLocationName,
        receivedDate: newGRVForm.receivedDate,
        receivedBy: actor.fullName,
        items: validItems,
        grandTotal,
        currency,
        status: 'verified',
        notes: newGRVForm.notes.trim() || undefined,
      },
      actor
    );

    toast(`GRV ${grv.grvNumber} posted`, {
      description: `Received ${validItems.length} item line(s) into ${storeLocationName}.`,
      variant: 'success',
    });
    setShowNewGRVModal(false);
    setNewGRVForm({
      vendorName: '',
      invoiceReference: '',
      purchaseRequisitionNumber: '',
      storeLocationId: storeLocations[0]?.id || '',
      receivedDate: new Date().toISOString().slice(0, 10),
      notes: '',
      items: [{ itemId: '', quantity: '1', unitCost: '100' }],
    });
    loadData();
  };

  const handleCreateSIV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newSIVForm.requestingDepartmentId || !newSIVForm.issuedToStaffName || !newSIVForm.storeLocationId) {
      toast('Incomplete SIV details', {
        description: 'Please select a requesting department, recipient staff member, and issuing store.',
        variant: 'error',
      });
      return;
    }

    const validItems: SIVItem[] = [];
    let totalValue = 0;

    for (const row of newSIVForm.items) {
      if (!row.itemId) continue;
      const stockItem = stockItems.find((s) => s.id === row.itemId);
      if (!stockItem) continue;

      const qty = parseFloat(row.quantity);
      if (isNaN(qty) || qty <= 0) continue;

      if (qty > stockItem.currentQuantity) {
        toast(`Insufficient stock for ${stockItem.name}`, {
          description: `Available on hand: ${stockItem.currentQuantity} ${stockItem.unitOfMeasure}.`,
          variant: 'error',
        });
        return;
      }

      const totalCost = qty * stockItem.unitCost;
      totalValue += totalCost;

      validItems.push({
        itemId: stockItem.id,
        itemCode: stockItem.itemCode,
        itemName: stockItem.name,
        unitOfMeasure: stockItem.unitOfMeasure,
        quantity: qty,
        unitCost: stockItem.unitCost,
        totalCost,
      });
    }

    if (validItems.length === 0) {
      toast('No valid issue lines', {
        description: 'Select at least one SKU and a valid quantity to issue.',
        variant: 'error',
      });
      return;
    }

    const dept = departments.find((d) => d.id === newSIVForm.requestingDepartmentId);
    const requestingDepartmentName = dept ? dept.name : 'Operations';

    const loc = storeLocations.find((l) => l.id === newSIVForm.storeLocationId);
    const storeLocationName = loc ? loc.name : 'Main Store';

    const siv = saasStorage.createSIV(
      {
        hotelId,
        requestingDepartmentId: newSIVForm.requestingDepartmentId,
        requestingDepartmentName,
        storeLocationId: newSIVForm.storeLocationId,
        storeLocationName,
        issuedToStaffName: newSIVForm.issuedToStaffName.trim(),
        issuedBy: actor.fullName,
        issueDate: newSIVForm.issueDate,
        purpose: newSIVForm.purpose.trim() || 'Departmental operational requisition',
        items: validItems,
        totalValue,
        currency,
        status: 'issued',
        notes: newSIVForm.notes.trim() || undefined,
      },
      actor
    );

    toast(`SIV ${siv.sivNumber} issued`, {
      description: `Disbursed to ${requestingDepartmentName} (${newSIVForm.issuedToStaffName.trim()}).`,
      variant: 'success',
    });
    setShowNewSIVModal(false);
    setNewSIVForm({
      requestingDepartmentId: departments[0]?.id || '',
      storeLocationId: storeLocations[0]?.id || '',
      issuedToStaffName: '',
      issueDate: new Date().toISOString().slice(0, 10),
      purpose: '',
      notes: '',
      items: [{ itemId: '', quantity: '1' }],
    });
    loadData();
  };

  const handleRaiseQuickRequisition = (item: StockItem) => {
    if (!hotelId) return;
    const qtyToOrder = item.reorderQuantity || 20;
    const estAmount = qtyToOrder * item.unitCost;
    const storesDept =
      departments.find((d) => d.name.toLowerCase().includes('store')) || departments[0];

    const req = saasStorage.createRequisition(
      {
        hotelId,
        departmentId: storesDept?.id || 'dept_stores',
        departmentName: storesDept?.name || 'Stores & Stock Inventory',
        category:
          item.category === 'food'
            ? 'Food & Grocery Purchases'
            : item.category === 'fuel'
            ? 'Fuel & Generator Operating'
            : 'Administrative & Office Supplies',
        description: `Automated Reorder: ${qtyToOrder} ${item.unitOfMeasure} of ${item.name} (${item.itemCode}) to replenish stock above safety buffer.`,
        amount: estAmount,
        currency,
        vendorName: item.preferredSupplier || 'Authorized Hotel Distributor',
        invoiceReference: `REORDER-${item.itemCode}`,
      },
      actor
    );

    toast(`Purchase requisition ${req.requisitionNumber} raised`, {
      description: `${item.name} queued in Finance Management for GM/Finance authorization.`,
      variant: 'success',
    });
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newAdjForm.itemId || !newAdjForm.reason) {
      toast('Missing adjustment details', {
        description: 'Select an item and state an audit reason.',
        variant: 'error',
      });
      return;
    }

    const item = stockItems.find((s) => s.id === newAdjForm.itemId);
    if (!item) return;

    const newQ = parseFloat(newAdjForm.newQuantity);
    if (isNaN(newQ) || newQ < 0) {
      toast('Invalid quantity', {
        description: 'Enter a valid non-negative physical count quantity.',
        variant: 'error',
      });
      return;
    }

    const delta = newQ - item.currentQuantity;
    const impact = Math.abs(delta) * item.unitCost;

    const adj = saasStorage.createStockAdjustment(
      {
        hotelId,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        storeLocationId: item.storeLocationId,
        storeLocationName: item.storeLocationName,
        adjustmentType: newAdjForm.adjustmentType,
        previousQuantity: item.currentQuantity,
        newQuantity: newQ,
        quantityDelta: delta,
        unitCost: item.unitCost,
        totalImpactValue: impact,
        reason: newAdjForm.reason.trim(),
        authorizedBy: actor.fullName,
        date: new Date().toISOString().slice(0, 10),
      },
      actor
    );

    toast(`Adjustment ${adj.adjustmentNumber} recorded`, {
      description: `On-hand updated to ${newQ} ${item.unitOfMeasure}.`,
      variant: 'success',
    });
    setShowNewAdjustmentModal(false);
    setNewAdjForm({
      itemId: '',
      adjustmentType: 'breakage',
      newQuantity: '',
      reason: '',
    });
    loadData();
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newLocForm.name || !newLocForm.code || !newLocForm.managerName) {
      toast('Incomplete store location', {
        description: 'Location code, name, and depot custodian are required.',
        variant: 'error',
      });
      return;
    }

    const newLoc: StoreLocation = {
      id: 'loc_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      code: newLocForm.code.toUpperCase().trim(),
      name: newLocForm.name.trim(),
      managerName: newLocForm.managerName.trim(),
      description: newLocForm.description.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    saasStorage.saveStoreLocation(newLoc, actor);
    toast(`Store depot ${newLoc.code} added`, {
      description: `${newLoc.name} is now active for GRV and SIV postings.`,
      variant: 'success',
    });
    setShowNewLocationModal(false);
    setNewLocForm({ code: '', name: '', managerName: '', description: '' });
    loadData();
  };

  const handleExportStockCSV = () => {
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'Store Location',
      'On-Hand Qty',
      'UOM',
      'Reorder Point',
      `Unit Cost (${currency})`,
      `Total Valuation (${currency})`,
      'Status',
      'Preferred Supplier',
    ];
    const rows = filteredStockItems.map((i) => [
      i.itemCode,
      i.name,
      i.category.replace('_', ' '),
      i.storeLocationName,
      i.currentQuantity,
      i.unitOfMeasure,
      i.reorderPoint,
      i.unitCost,
      i.totalValue,
      i.status,
      i.preferredSupplier || 'N/A',
    ]);
    downloadCsvFile(
      `SEAM_Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
    toast('Inventory valuation exported', { variant: 'info' });
  };

  // DataTable Columns
  const stockColumns: DataTableColumn<StockItem>[] = [
    {
      key: 'item',
      header: 'SKU & Description',
      sortable: true,
      sortValue: (i) => i.name,
      render: (i) => (
        <div>
          <span className="font-mono text-[11px] font-semibold text-[#173F35] dark:text-[#C6A15B]">
            {i.itemCode}
          </span>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE] mt-0.5">{i.name}</div>
          {i.preferredSupplier && (
            <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
              Supplier: {i.preferredSupplier}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Depot & Category',
      sortable: true,
      sortValue: (i) => i.storeLocationName,
      render: (i) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{i.storeLocationName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] capitalize">
            {i.category.replace(/_/g, ' ')}
          </div>
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'On-Hand',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.currentQuantity,
      render: (i) => (
        <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
          {i.currentQuantity.toLocaleString()}{' '}
          <span className="text-[11px] font-normal text-[#78837D] dark:text-[#92A199]">
            {i.unitOfMeasure}
          </span>
        </span>
      ),
    },
    {
      key: 'reorder',
      header: 'Reorder Pt',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.reorderPoint,
      render: (i) => (
        <span className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199] tabular-nums">
          {i.reorderPoint} {i.unitOfMeasure}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.unitCost,
      render: (i) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(i.unitCost, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Valuation',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.totalValue,
      render: (i) => (
        <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(i.totalValue, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Health',
      sortable: true,
      sortValue: (i) => i.status,
      render: (i) => (
        <StatusBadge
          label={
            i.status === 'in_stock'
              ? 'In Stock'
              : i.status === 'low_stock'
              ? 'Low Stock'
              : 'Out of Stock'
          }
          tone={
            i.status === 'in_stock'
              ? 'success'
              : i.status === 'low_stock'
              ? 'warning'
              : 'critical'
          }
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5">
          {(i.status === 'low_stock' || i.status === 'out_of_stock') && (
            <button
              type="button"
              onClick={() => handleRaiseQuickRequisition(i)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#C6A15B]/15 text-[#8A6B2F] dark:text-[#D3B06B] border border-[#C6A15B]/30 hover:bg-[#C6A15B]/25 transition-colors whitespace-nowrap"
              title="Raise Purchase Requisition for approval"
            >
              <ExternalLink className="w-3 h-3" />
              Reorder
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setNewAdjForm({
                itemId: i.id,
                adjustmentType: 'physical_count_variance',
                newQuantity: i.currentQuantity.toString(),
                reason: 'Periodic cycle count reconciliation',
              });
              setShowNewAdjustmentModal(true);
            }}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
          >
            Adjust
          </button>
        </div>
      ),
    },
  ];

  const grvColumns: DataTableColumn<GoodsReceivedVoucher>[] = [
    {
      key: 'grvNumber',
      header: 'GRV #',
      sortable: true,
      sortValue: (g) => g.grvNumber,
      render: (g) => (
        <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
          {g.grvNumber}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Delivery Date',
      sortable: true,
      sortValue: (g) => g.receivedDate,
      render: (g) => <span className="font-mono text-xs">{formatShortDate(g.receivedDate)}</span>,
    },
    {
      key: 'vendor',
      header: 'Vendor & References',
      sortable: true,
      sortValue: (g) => g.vendorName,
      render: (g) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{g.vendorName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono">
            Inv: {g.invoiceReference || 'N/A'}
            {g.purchaseRequisitionNumber ? ` · Req: ${g.purchaseRequisitionNumber}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'depot',
      header: 'Receiving Depot',
      sortable: true,
      sortValue: (g) => g.storeLocationName,
      render: (g) => <span>{g.storeLocationName}</span>,
    },
    {
      key: 'lines',
      header: 'Lines',
      align: 'center',
      sortable: true,
      sortValue: (g) => g.items.length,
      render: (g) => <StatusBadge label={`${g.items.length} SKU lines`} tone="neutral" />,
    },
    {
      key: 'total',
      header: 'Grand Total',
      align: 'right',
      sortable: true,
      sortValue: (g) => g.grandTotal,
      render: (g) => (
        <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
          {formatCurrency(g.grandTotal, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'receivedBy',
      header: 'Received By',
      render: (g) => <span className="text-[#78837D] dark:text-[#92A199]">{g.receivedBy}</span>,
    },
    {
      key: 'action',
      header: 'Slip',
      align: 'right',
      render: (g) => (
        <button
          type="button"
          onClick={() => setSelectedGRVDetail(g)}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
        >
          View Slip
        </button>
      ),
    },
  ];

  const sivColumns: DataTableColumn<StoreIssueVoucher>[] = [
    {
      key: 'sivNumber',
      header: 'SIV #',
      sortable: true,
      sortValue: (s) => s.sivNumber,
      render: (s) => (
        <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
          {s.sivNumber}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Issue Date',
      sortable: true,
      sortValue: (s) => s.issueDate,
      render: (s) => <span className="font-mono text-xs">{formatShortDate(s.issueDate)}</span>,
    },
    {
      key: 'dept',
      header: 'Department & Recipient',
      sortable: true,
      sortValue: (s) => s.requestingDepartmentName,
      render: (s) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
            {s.requestingDepartmentName}
          </div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            Issued to: {s.issuedToStaffName}
          </div>
        </div>
      ),
    },
    {
      key: 'depot',
      header: 'Issuing Depot',
      render: (s) => <span>{s.storeLocationName}</span>,
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (s) => (
        <span className="text-[#78837D] dark:text-[#92A199] line-clamp-1 max-w-xs" title={s.purpose}>
          {s.purpose}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Value Issued',
      align: 'right',
      sortable: true,
      sortValue: (s) => s.totalValue,
      render: (s) => (
        <span className="font-mono font-semibold tabular-nums">
          {formatCurrency(s.totalValue, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Slip',
      align: 'right',
      render: (s) => (
        <button
          type="button"
          onClick={() => setSelectedSIVDetail(s)}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
        >
          View Slip
        </button>
      ),
    },
  ];

  const adjustmentColumns: DataTableColumn<StockAdjustment>[] = [
    {
      key: 'ref',
      header: 'Adjustment #',
      sortable: true,
      sortValue: (a) => a.adjustmentNumber,
      render: (a) => (
        <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
          {a.adjustmentNumber}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (a) => a.date,
      render: (a) => <span className="font-mono text-xs">{formatShortDate(a.date)}</span>,
    },
    {
      key: 'item',
      header: 'Item & Depot',
      sortable: true,
      sortValue: (a) => a.itemName,
      render: (a) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{a.itemName}</div>
          <div className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199]">
            {a.itemCode} · {a.storeLocationName}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Category & Reason',
      render: (a) => (
        <div className="space-y-1 max-w-xs">
          <StatusBadge label={a.adjustmentType.replace(/_/g, ' ')} tone="warning" />
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] line-clamp-1" title={a.reason}>
            {a.reason}
          </div>
        </div>
      ),
    },
    {
      key: 'prev',
      header: 'Previous',
      align: 'right',
      render: (a) => <span className="font-mono tabular-nums">{a.previousQuantity}</span>,
    },
    {
      key: 'next',
      header: 'Counted',
      align: 'right',
      render: (a) => (
        <span className="font-mono font-semibold tabular-nums">{a.newQuantity}</span>
      ),
    },
    {
      key: 'delta',
      header: 'Delta',
      align: 'right',
      sortable: true,
      sortValue: (a) => a.quantityDelta,
      render: (a) => (
        <span
          className={`font-mono font-semibold tabular-nums ${
            a.quantityDelta < 0
              ? 'text-rose-700 dark:text-rose-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {a.quantityDelta > 0 ? `+${a.quantityDelta}` : a.quantityDelta}
        </span>
      ),
    },
    {
      key: 'impact',
      header: 'Value Impact',
      align: 'right',
      sortable: true,
      sortValue: (a) => a.totalImpactValue,
      render: (a) => (
        <span className="font-mono font-semibold tabular-nums">
          {formatCurrency(a.totalImpactValue, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'auth',
      header: 'Authorized By',
      render: (a) => <span className="text-[#78837D] dark:text-[#92A199]">{a.authorizedBy}</span>,
    },
  ];

  const tabs: Array<{
    id: 'stock_register' | 'grv' | 'siv' | 'adjustments' | 'locations';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'stock_register',
      label: 'Stock Register',
      icon: Package,
      badge: lowStockCount + outOfStockCount > 0 ? lowStockCount + outOfStockCount : undefined,
    },
    { id: 'grv', label: `Goods Received (GRV) · ${grvs.length}`, icon: ArrowDownLeft },
    { id: 'siv', label: `Store Issues (SIV) · ${sivs.length}`, icon: ArrowUpRight },
    { id: 'adjustments', label: `Stocktake Audits · ${adjustments.length}`, icon: ClipboardList },
    { id: 'locations', label: `Store Depots · ${storeLocations.length}`, icon: Warehouse },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Stores & Inventory']}
        title="Stores & Stock Inventory"
        subtitle="Multi-depot inventory valuation, Goods Received Vouchers (GRV), departmental Store Issue Vouchers (SIV), and physical cycle-count audits."
        meta={<SampleDataBadge />}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowNewGRVModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Receive Stock (GRV)
            </button>
            <button
              type="button"
              onClick={() => setShowNewSIVModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#647B52]" />
              Issue Stock (SIV)
            </button>
            <button
              type="button"
              onClick={handleExportStockCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#78837D]" />
              Export CSV
            </button>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Inventory Valuation"
          value={formatCurrency(totalValuation, currency, currencySymbol)}
          helper={`Across ${storeLocations.length} active depot(s)`}
          icon={Boxes}
        />
        <KpiCard
          label="Active Catalog SKUs"
          value={totalItemsCount}
          helper="Monitored stock control lines"
          icon={Package}
        />
        <KpiCard
          label="Low Stock Warning"
          value={lowStockCount}
          delta={lowStockCount > 0 ? 'Reorder Recommended' : 'Healthy'}
          deltaTone={lowStockCount > 0 ? 'warning' : 'positive'}
          helper="At or below safety buffer"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Out of Stock (Depleted)"
          value={outOfStockCount}
          delta={outOfStockCount > 0 ? 'Critical Replenishment' : 'Clear'}
          deltaTone={outOfStockCount > 0 ? 'critical' : 'positive'}
          helper="Zero on-hand balance"
          icon={ShieldAlert}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E6EBE7] dark:border-[#22322C] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
                  : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STOCK REGISTER */}
      {activeTab === 'stock_register' && (
        <DataTable
          data={filteredStockItems}
          columns={stockColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search SKU code, item name, or supplier..."
          searchFilter={(item, q) =>
            item.name.toLowerCase().includes(q) ||
            item.itemCode.toLowerCase().includes(q) ||
            (item.preferredSupplier || '').toLowerCase().includes(q)
          }
          onExportCsv={handleExportStockCSV}
          emptyTitle="No matching stock items"
          emptyDescription="Adjust your store, category, or stock health filters, or register a new SKU."
          filterToolbar={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="seam-input px-2.5 py-1.5 text-xs"
              >
                <option value="all">All Store Locations</option>
                {storeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="seam-input px-2.5 py-1.5 text-xs"
              >
                <option value="all">All Categories</option>
                <option value="food">Food & Produce</option>
                <option value="beverage">Beverage & Liquor</option>
                <option value="linen">Linen & Textiles</option>
                <option value="cleaning_supplies">Cleaning & Sanitation</option>
                <option value="guest_amenities">Guest Amenities</option>
                <option value="fuel">Fuel & Generators</option>
                <option value="maintenance">Maintenance Spares</option>
                <option value="stationery">Stationery & Office</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="seam-input px-2.5 py-1.5 text-xs"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              <button
                type="button"
                onClick={() => setShowNewItemModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add SKU
              </button>
            </div>
          }
        />
      )}

      {/* TAB 2: GRV */}
      {activeTab === 'grv' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Goods Received Vouchers (Inward Stock Delivery)
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Document supplier deliveries into hotel depots and recalculate weighted purchase costs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewGRVModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              New GRV Delivery
            </button>
          </div>

          <DataTable
            data={grvs}
            columns={grvColumns}
            keyExtractor={(g) => g.id}
            searchPlaceholder="Search GRV #, vendor, or invoice ref..."
            searchFilter={(g, q) =>
              g.grvNumber.toLowerCase().includes(q) ||
              g.vendorName.toLowerCase().includes(q) ||
              (g.invoiceReference || '').toLowerCase().includes(q)
            }
            emptyTitle="No Goods Received Vouchers yet"
            emptyDescription="Post a GRV when a supplier delivers goods to update depot inventory."
          />
        </div>
      )}

      {/* TAB 3: SIV */}
      {activeTab === 'siv' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Store Issue Vouchers (Departmental Consumption)
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Track inventory disbursements to Kitchen, F&B outlets, Housekeeping, and Engineering.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewSIVModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              New SIV Issue
            </button>
          </div>

          <DataTable
            data={sivs}
            columns={sivColumns}
            keyExtractor={(s) => s.id}
            searchPlaceholder="Search SIV #, department, or recipient..."
            searchFilter={(s, q) =>
              s.sivNumber.toLowerCase().includes(q) ||
              s.requestingDepartmentName.toLowerCase().includes(q) ||
              s.issuedToStaffName.toLowerCase().includes(q)
            }
            emptyTitle="No Store Issue Vouchers yet"
            emptyDescription="Create an SIV to deduct stock and allocate cost to an operational department."
          />
        </div>
      )}

      {/* TAB 4: ADJUSTMENTS */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Stocktake Audits & Variance Adjustments
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Log physical count variances, breakages, expired goods, and shrinkage adjustments with audit trail.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewAdjustmentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Stock Adjustment
            </button>
          </div>

          <DataTable
            data={adjustments}
            columns={adjustmentColumns}
            keyExtractor={(a) => a.id}
            searchPlaceholder="Search adjustment #, item code, or reason..."
            searchFilter={(a, q) =>
              a.adjustmentNumber.toLowerCase().includes(q) ||
              a.itemName.toLowerCase().includes(q) ||
              a.itemCode.toLowerCase().includes(q) ||
              a.reason.toLowerCase().includes(q)
            }
            emptyTitle="No stock adjustments logged"
            emptyDescription="All physical stock counts currently match book balances."
          />
        </div>
      )}

      {/* TAB 5: STORE LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Property Storage Depots & Locations
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Central dry store, cold rooms, beverage cellar, housekeeping linen rooms, and engineering workshops.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewLocationModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Store Location
            </button>
          </div>

          {storeLocations.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No store locations configured"
                description="Add a central store or departmental depot to begin registering stock items."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeLocations.map((loc) => {
                const locItems = stockItems.filter((i) => i.storeLocationId === loc.id);
                const locValuation = locItems.reduce((acc, i) => acc + i.totalValue, 0);

                return (
                  <div
                    key={loc.id}
                    className="seam-surface p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] border border-[#E6EBE7] dark:border-[#22322C]">
                          {loc.code}
                        </span>
                        <StatusBadge label="Active Depot" tone="success" />
                      </div>

                      <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-2.5">
                        {loc.name}
                      </h3>

                      <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 leading-relaxed">
                        {loc.description || 'Dedicated storage repository for property operations.'}
                      </p>

                      <div className="mt-3 text-xs text-[#78837D] dark:text-[#92A199]">
                        Custodian:{' '}
                        <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {loc.managerName}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                          Inventory SKUs
                        </span>
                        <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                          {locItems.length} items
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                          Depot Valuation
                        </span>
                        <span className="font-mono font-semibold tabular-nums text-[#173F35] dark:text-[#C6A15B]">
                          {formatCurrency(locValuation, currency, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW STOCK ITEM */}
      <Modal
        open={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
        title="Register New Inventory SKU"
        subtitle="Define stock control parameters, storage depot, and safety reorder threshold."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewItemModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-stock-item-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Save Stock Item
            </button>
          </>
        }
      >
        <form id="new-stock-item-form" onSubmit={handleCreateStockItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                SKU / Item Code *
              </label>
              <input
                type="text"
                placeholder="e.g. FOD-TIL-01"
                value={newItemForm.itemCode}
                onChange={(e) => setNewItemForm({ ...newItemForm, itemCode: e.target.value })}
                className="w-full px-3 py-2 seam-input uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Item Category *
              </label>
              <select
                value={newItemForm.category}
                onChange={(e) =>
                  setNewItemForm({ ...newItemForm, category: e.target.value as StockCategory })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="food">Food & Produce</option>
                <option value="beverage">Beverage & Liquor</option>
                <option value="linen">Linen & Textiles</option>
                <option value="cleaning_supplies">Cleaning & Sanitation</option>
                <option value="guest_amenities">Guest Amenities</option>
                <option value="fuel">Fuel & Generators</option>
                <option value="maintenance">Maintenance Spares</option>
                <option value="stationery">Stationery & Office</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Item Description & Specifications *
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh Lake Chamo Tilapia (Whole Fillet)"
              value={newItemForm.name}
              onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
              className="w-full px-3 py-2 seam-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Storage Location *
              </label>
              <select
                value={newItemForm.storeLocationId}
                onChange={(e) => setNewItemForm({ ...newItemForm, storeLocationId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
                required
              >
                {storeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Unit of Measure *
              </label>
              <input
                type="text"
                placeholder="e.g. kg, litre, bottle, pack"
                value={newItemForm.unitOfMeasure}
                onChange={(e) => setNewItemForm({ ...newItemForm, unitOfMeasure: e.target.value })}
                className="w-full px-3 py-2 seam-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Initial Qty
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItemForm.currentQuantity}
                onChange={(e) => setNewItemForm({ ...newItemForm, currentQuantity: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Reorder Point
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={newItemForm.reorderPoint}
                onChange={(e) => setNewItemForm({ ...newItemForm, reorderPoint: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Unit Cost ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItemForm.unitCost}
                onChange={(e) => setNewItemForm({ ...newItemForm, unitCost: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Preferred Supplier / Cooperative
            </label>
            <input
              type="text"
              placeholder="e.g. Artisanal Fishery Cooperative"
              value={newItemForm.preferredSupplier}
              onChange={(e) =>
                setNewItemForm({ ...newItemForm, preferredSupplier: e.target.value })
              }
              className="w-full px-3 py-2 seam-input"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 2: NEW GRV */}
      <Modal
        open={showNewGRVModal}
        onClose={() => setShowNewGRVModal(false)}
        title="Goods Received Voucher (GRV)"
        subtitle="Record inward supplier delivery and update weighted average inventory stock."
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewGRVModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-grv-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Confirm & Post GRV
            </button>
          </>
        }
      >
        <form id="new-grv-form" onSubmit={handleCreateGRV} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Supplier / Vendor Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Chamo Artisanal Fishery"
                value={newGRVForm.vendorName}
                onChange={(e) => setNewGRVForm({ ...newGRVForm, vendorName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
                required
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Receiving Storage Depot *
              </label>
              <select
                value={newGRVForm.storeLocationId}
                onChange={(e) => setNewGRVForm({ ...newGRVForm, storeLocationId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
                required
              >
                {storeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Invoice Reference
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-90"
                value={newGRVForm.invoiceReference}
                onChange={(e) => setNewGRVForm({ ...newGRVForm, invoiceReference: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Purchase Requisition Ref
              </label>
              <input
                type="text"
                placeholder="e.g. REQ-2026-081"
                value={newGRVForm.purchaseRequisitionNumber}
                onChange={(e) =>
                  setNewGRVForm({ ...newGRVForm, purchaseRequisitionNumber: e.target.value })
                }
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                value={newGRVForm.receivedDate}
                onChange={(e) => setNewGRVForm({ ...newGRVForm, receivedDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Received Delivery Items
              </span>
              <button
                type="button"
                onClick={() =>
                  setNewGRVForm({
                    ...newGRVForm,
                    items: [...newGRVForm.items, { itemId: '', quantity: '1', unitCost: '100' }],
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                <Plus className="w-3 h-3" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {newGRVForm.items.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 seam-surface-subtle"
                >
                  <div className="flex-1">
                    <select
                      value={row.itemId}
                      onChange={(e) => {
                        const selected = stockItems.find((s) => s.id === e.target.value);
                        const updated = [...newGRVForm.items];
                        updated[idx].itemId = e.target.value;
                        if (selected) updated[idx].unitCost = selected.unitCost.toString();
                        setNewGRVForm({ ...newGRVForm, items: updated });
                      }}
                      className="w-full px-2.5 py-1.5 seam-input text-xs"
                      required
                    >
                      <option value="">Select Stock SKU...</option>
                      {stockItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.itemCode} - {item.name} ({item.unitOfMeasure})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => {
                        const updated = [...newGRVForm.items];
                        updated[idx].quantity = e.target.value;
                        setNewGRVForm({ ...newGRVForm, items: updated });
                      }}
                      className="w-full px-2.5 py-1.5 seam-input font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Unit Cost"
                      value={row.unitCost}
                      onChange={(e) => {
                        const updated = [...newGRVForm.items];
                        updated[idx].unitCost = e.target.value;
                        setNewGRVForm({ ...newGRVForm, items: updated });
                      }}
                      className="w-full px-2.5 py-1.5 seam-input font-mono text-xs"
                      required
                    />
                  </div>

                  {newGRVForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = newGRVForm.items.filter((_, i) => i !== idx);
                        setNewGRVForm({ ...newGRVForm, items: updated });
                      }}
                      className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                      aria-label="Remove item row"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Receiving Inspection Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Temperature checked on refrigerated van. All seals intact."
              value={newGRVForm.notes}
              onChange={(e) => setNewGRVForm({ ...newGRVForm, notes: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 3: NEW SIV */}
      <Modal
        open={showNewSIVModal}
        onClose={() => setShowNewSIVModal(false)}
        title="Store Issue Voucher (SIV)"
        subtitle="Disburse stock items to an authorized hotel department and deduct from store balance."
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewSIVModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-siv-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Confirm & Post SIV
            </button>
          </>
        }
      >
        <form id="new-siv-form" onSubmit={handleCreateSIV} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Requesting Department *
              </label>
              <select
                value={newSIVForm.requestingDepartmentId}
                onChange={(e) =>
                  setNewSIVForm({ ...newSIVForm, requestingDepartmentId: e.target.value })
                }
                className="w-full px-3 py-2 seam-input"
                required
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Issuing Storage Depot *
              </label>
              <select
                value={newSIVForm.storeLocationId}
                onChange={(e) => setNewSIVForm({ ...newSIVForm, storeLocationId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
                required
              >
                {storeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Issued to Staff Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Chef Solomon Mulugeta"
                value={newSIVForm.issuedToStaffName}
                onChange={(e) =>
                  setNewSIVForm({ ...newSIVForm, issuedToStaffName: e.target.value })
                }
                className="w-full px-3 py-2 seam-input"
                required
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                value={newSIVForm.issueDate}
                onChange={(e) => setNewSIVForm({ ...newSIVForm, issueDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Operational Purpose / Service *
            </label>
            <input
              type="text"
              placeholder="e.g. Daily buffet lunch preparation and dinner service"
              value={newSIVForm.purpose}
              onChange={(e) => setNewSIVForm({ ...newSIVForm, purpose: e.target.value })}
              className="w-full px-3 py-2 seam-input"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">Items to Issue</span>
              <button
                type="button"
                onClick={() =>
                  setNewSIVForm({
                    ...newSIVForm,
                    items: [...newSIVForm.items, { itemId: '', quantity: '1' }],
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                <Plus className="w-3 h-3" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {newSIVForm.items.map((row, idx) => {
                const selected = stockItems.find((s) => s.id === row.itemId);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 seam-surface-subtle">
                    <div className="flex-1">
                      <select
                        value={row.itemId}
                        onChange={(e) => {
                          const updated = [...newSIVForm.items];
                          updated[idx].itemId = e.target.value;
                          setNewSIVForm({ ...newSIVForm, items: updated });
                        }}
                        className="w-full px-2.5 py-1.5 seam-input text-xs"
                        required
                      >
                        <option value="">Select Stock Item to Issue...</option>
                        {stockItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.itemCode} - {item.name} (On hand: {item.currentQuantity}{' '}
                            {item.unitOfMeasure})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => {
                          const updated = [...newSIVForm.items];
                          updated[idx].quantity = e.target.value;
                          setNewSIVForm({ ...newSIVForm, items: updated });
                        }}
                        className="w-full px-2.5 py-1.5 seam-input font-mono text-xs"
                        required
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-[11px] text-[#78837D] dark:text-[#92A199] tabular-nums">
                      {selected
                        ? formatCurrency(
                            selected.unitCost * (parseFloat(row.quantity) || 0),
                            currency,
                            currencySymbol
                          )
                        : '—'}
                    </div>

                    {newSIVForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newSIVForm.items.filter((_, i) => i !== idx);
                          setNewSIVForm({ ...newSIVForm, items: updated });
                        }}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                        aria-label="Remove issue row"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: STOCK ADJUSTMENT */}
      <Modal
        open={showNewAdjustmentModal}
        onClose={() => setShowNewAdjustmentModal(false)}
        title="Record Stock Audit Adjustment"
        subtitle="Reconcile book stock against physical count, breakage, or expiry findings."
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewAdjustmentModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-adjustment-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Post Stock Adjustment
            </button>
          </>
        }
      >
        <form id="new-adjustment-form" onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Item to Adjust *
            </label>
            <select
              value={newAdjForm.itemId}
              onChange={(e) => {
                const sel = stockItems.find((s) => s.id === e.target.value);
                setNewAdjForm({
                  ...newAdjForm,
                  itemId: e.target.value,
                  newQuantity: sel ? sel.currentQuantity.toString() : '',
                });
              }}
              className="w-full px-3 py-2 seam-input"
              required
            >
              <option value="">Select Stock Item...</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} - {item.name} (Current: {item.currentQuantity} {item.unitOfMeasure})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Adjustment Category *
            </label>
            <select
              value={newAdjForm.adjustmentType}
              onChange={(e) =>
                setNewAdjForm({
                  ...newAdjForm,
                  adjustmentType: e.target.value as StockAdjustment['adjustmentType'],
                })
              }
              className="w-full px-3 py-2 seam-input"
            >
              <option value="physical_count_variance">Physical Count Variance</option>
              <option value="breakage">Breakage / Damage</option>
              <option value="spoilage">Kitchen Spoilage</option>
              <option value="expired">Expired Stock</option>
              <option value="return_to_vendor">Return to Vendor</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              New Physical Counted Quantity *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Counted physical units"
              value={newAdjForm.newQuantity}
              onChange={(e) => setNewAdjForm({ ...newAdjForm, newQuantity: e.target.value })}
              className="w-full px-3 py-2 seam-input font-mono"
              required
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Auditor Justification & Notes *
            </label>
            <textarea
              rows={2}
              placeholder="Specify location of damage or cycle count discrepancy..."
              value={newAdjForm.reason}
              onChange={(e) => setNewAdjForm({ ...newAdjForm, reason: e.target.value })}
              className="w-full px-3 py-2 seam-input"
              required
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ADD STORE LOCATION */}
      <Modal
        open={showNewLocationModal}
        onClose={() => setShowNewLocationModal(false)}
        title="Add Store Location / Depot"
        subtitle="Create a property storage depot for inventory segregation."
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewLocationModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-location-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Save Store Depot
            </button>
          </>
        }
      >
        <form id="new-location-form" onSubmit={handleCreateLocation} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Location Code *
              </label>
              <input
                type="text"
                placeholder="e.g. POOL-BAR-ST"
                value={newLocForm.code}
                onChange={(e) => setNewLocForm({ ...newLocForm, code: e.target.value })}
                className="w-full px-3 py-2 seam-input uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Depot Custodian *
              </label>
              <input
                type="text"
                placeholder="Supervisor name"
                value={newLocForm.managerName}
                onChange={(e) => setNewLocForm({ ...newLocForm, managerName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Store Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Pool Bar & Terrace Beverage Depot"
              value={newLocForm.name}
              onChange={(e) => setNewLocForm({ ...newLocForm, name: e.target.value })}
              className="w-full px-3 py-2 seam-input"
              required
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Chilled beverages and snack reserve inventory"
              value={newLocForm.description}
              onChange={(e) => setNewLocForm({ ...newLocForm, description: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL: GRV SLIP */}
      <Modal
        open={Boolean(selectedGRVDetail)}
        onClose={() => setSelectedGRVDetail(null)}
        title={selectedGRVDetail ? `Goods Received Voucher: ${selectedGRVDetail.grvNumber}` : ''}
        subtitle={selectedGRVDetail ? `${selectedGRVDetail.vendorName} · ${selectedGRVDetail.storeLocationName}` : undefined}
        maxWidthClass="max-w-lg"
      >
        {selectedGRVDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 seam-surface-subtle">
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">Vendor</span>
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedGRVDetail.vendorName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Receiving Depot
                </span>
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedGRVDetail.storeLocationName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Invoice Reference
                </span>
                <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedGRVDetail.invoiceReference || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Delivery Date
                </span>
                <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                  {formatShortDate(selectedGRVDetail.receivedDate)}
                </span>
              </div>
            </div>

            <div className="border border-[#E6EBE7] dark:border-[#22322C] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] text-[11px] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Cost</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                  {selectedGRVDetail.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {i.itemName}
                        </div>
                        <div className="font-mono text-[10px] text-[#78837D] dark:text-[#92A199]">
                          {i.itemCode}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {i.quantity} {i.unitOfMeasure}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {formatCurrency(i.unitCost, currency, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(i.totalCost, currency, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F6F8F6] dark:bg-[#192622] font-semibold border-t border-[#E6EBE7] dark:border-[#22322C]">
                    <td colSpan={3} className="py-2 px-3 text-right">
                      Grand Total
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(selectedGRVDetail.grandTotal, currency, currencySymbol)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedGRVDetail.notes && (
              <div className="p-3 seam-surface-subtle text-[11px] text-[#78837D] dark:text-[#92A199]">
                {selectedGRVDetail.notes}
              </div>
            )}

            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] text-right">
              Received & Audited by: {selectedGRVDetail.receivedBy}
            </div>
          </div>
        )}
      </Modal>

      {/* DETAIL MODAL: SIV SLIP */}
      <Modal
        open={Boolean(selectedSIVDetail)}
        onClose={() => setSelectedSIVDetail(null)}
        title={selectedSIVDetail ? `Store Issue Voucher: ${selectedSIVDetail.sivNumber}` : ''}
        subtitle={
          selectedSIVDetail
            ? `${selectedSIVDetail.requestingDepartmentName} · ${selectedSIVDetail.storeLocationName}`
            : undefined
        }
        maxWidthClass="max-w-lg"
      >
        {selectedSIVDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 seam-surface-subtle">
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Requesting Department
                </span>
                <span className="font-semibold text-[#173F35] dark:text-[#C6A15B]">
                  {selectedSIVDetail.requestingDepartmentName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Issued to Staff
                </span>
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedSIVDetail.issuedToStaffName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Issuing Depot
                </span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedSIVDetail.storeLocationName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                  Issue Date
                </span>
                <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                  {formatShortDate(selectedSIVDetail.issueDate)}
                </span>
              </div>
            </div>

            <div className="p-3 seam-surface-subtle">
              <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block mb-0.5">
                Operational Purpose
              </span>
              <p className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                {selectedSIVDetail.purpose}
              </p>
            </div>

            <div className="border border-[#E6EBE7] dark:border-[#22322C] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] text-[11px] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Value</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                  {selectedSIVDetail.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {i.itemName}
                        </div>
                        <div className="font-mono text-[10px] text-[#78837D] dark:text-[#92A199]">
                          {i.itemCode}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {i.quantity} {i.unitOfMeasure}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {formatCurrency(i.unitCost, currency, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums">
                        {formatCurrency(i.totalCost, currency, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F6F8F6] dark:bg-[#192622] font-semibold border-t border-[#E6EBE7] dark:border-[#22322C]">
                    <td colSpan={3} className="py-2 px-3 text-right">
                      Total Issued Value
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B]">
                      {formatCurrency(selectedSIVDetail.totalValue, currency, currencySymbol)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] text-right">
              Disbursed by Storekeeper: {selectedSIVDetail.issuedBy}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
