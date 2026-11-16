/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Supply Chain, Approved Vendor Registry, Purchase Orders (PO)
 * & Three-Way Invoice Matching Engine (PO vs GRV vs Supplier Invoice)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Hotel,
  SupplierVendor,
  PurchaseOrder,
  ThreeWayInvoiceMatch,
  VendorCategory,
  PurchaseOrderItem,
} from '../../types/saas';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Truck,
  Building2,
  FileText,
  AlertTriangle,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Phone,
  Mail,
  Receipt,
  TrendingUp,
  X,
  Info,
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
import { formatCurrency, formatShortDate, maskIdNumber } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { calculateVatOnly } from '../../utils/taxAndPayrollCalculator';

interface SupplyChainAndProcurementHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const SupplyChainAndProcurementHub: React.FC<SupplyChainAndProcurementHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast, confirmAction } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<'vendors' | 'purchase_orders' | 'three_way_match'>(
    'vendors'
  );

  // Data States
  const [suppliers, setSuppliers] = useState<SupplierVendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [matches, setMatches] = useState<ThreeWayInvoiceMatch[]>([]);

  // Filters
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('all');
  const [vendorSearch, setVendorSearch] = useState<string>('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('all');
  const [poSearch, setPoSearch] = useState<string>('');
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>('all');

  // Modals
  const [showVendorModal, setShowVendorModal] = useState<boolean>(false);
  const [showPoModal, setShowPoModal] = useState<boolean>(false);
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);

  const [newVendor, setNewVendor] = useState<{
    code: string;
    name: string;
    category: VendorCategory;
    contactPerson: string;
    email: string;
    phone: string;
    tinNumber: string;
    bankName: string;
    bankAccountNumber: string;
    telebirrMerchantId: string;
    paymentTerms: SupplierVendor['paymentTerms'];
    notes: string;
  }>({
    code: `VEN-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    category: 'fresh_produce',
    contactPerson: '',
    email: '',
    phone: '+251 9',
    tinNumber: '',
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    bankAccountNumber: '',
    telebirrMerchantId: '',
    paymentTerms: 'net_30',
    notes: '',
  });

  const [newPo, setNewPo] = useState<{
    vendorId: string;
    expectedDeliveryDate: string;
    notes: string;
    items: Array<{
      itemName: string;
      itemCode: string;
      quantityOrdered: number;
      unitOfMeasure: string;
      unitPrice: number;
      storeLocationName: string;
    }>;
  }>({
    vendorId: '',
    expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    notes: '',
    items: [
      {
        itemName: '',
        itemCode: 'ITM-01',
        quantityOrdered: 10,
        unitOfMeasure: 'kg',
        unitPrice: 250,
        storeLocationName: 'Main Dry Stores',
      },
    ],
  });

  const [newMatch, setNewMatch] = useState<{
    invoiceNumber: string;
    poId: string;
    grvNumber: string;
    invoiceAmount: number;
    paymentDueDate: string;
  }>({
    invoiceNumber: '',
    poId: '',
    grvNumber: `GRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    invoiceAmount: 0,
    paymentDueDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
  });

  const actor = useMemo(
    () => ({
      email: currentUser?.email || 'procurement@hotel.com',
      fullName: currentUser?.fullName || 'Operations Director',
      role: currentUser?.role || 'hotel_admin',
    }),
    [currentUser]
  );

  const refreshSuppliers = () => hotelId && setSuppliers(saasStorage.getSuppliers(hotelId));
  const refreshPOs = () => hotelId && setPurchaseOrders(saasStorage.getPurchaseOrders(hotelId));
  const refreshMatches = () => hotelId && setMatches(saasStorage.getThreeWayMatches(hotelId));

  useEffect(() => {
    setVendorCategoryFilter('all');
    setVendorSearch('');
    setPoStatusFilter('all');
    setPoSearch('');
    setMatchStatusFilter('all');
    setShowVendorModal(false);
    setShowPoModal(false);
    setShowMatchModal(false);
    if (!hotelId) {
      setSuppliers([]);
      setPurchaseOrders([]);
      setMatches([]);
      return;
    }
    setSuppliers(saasStorage.getSuppliers(hotelId));
    setPurchaseOrders(saasStorage.getPurchaseOrders(hotelId));
    setMatches(saasStorage.getThreeWayMatches(hotelId));
  }, [hotelId]);

  const filteredVendors = useMemo(() => {
    return suppliers.filter((v) => {
      const matchesCategory =
        vendorCategoryFilter === 'all' || v.category === vendorCategoryFilter;
      const q = vendorSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.tinNumber.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [suppliers, vendorCategoryFilter, vendorSearch]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesStatus = poStatusFilter === 'all' || po.status === poStatusFilter;
      const q = poSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q) ||
        po.preparedBy.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, poStatusFilter, poSearch]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (matchStatusFilter === 'all') return true;
      return m.matchStatus === matchStatusFilter;
    });
  }, [matches, matchStatusFilter]);

  // Metrics
  const totalApprovedVendors = suppliers.filter((s) => s.status === 'active').length;
  const totalCommittedPOValue = purchaseOrders
    .filter((po) => po.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);
  const varianceHoldCount = matches.filter((m) => m.matchStatus.includes('hold')).length;
  const avgOnTimeFulfillment = Math.round(
    suppliers.reduce((acc, s) => acc + s.onTimeDeliveryRate, 0) / (suppliers.length || 1)
  );

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newVendor.name || !newVendor.tinNumber) return;

    const created = saasStorage.createSupplier(
      {
        hotelId,
        code: newVendor.code,
        name: newVendor.name,
        category: newVendor.category,
        contactPerson: newVendor.contactPerson,
        email: newVendor.email,
        phone: newVendor.phone,
        tinNumber: newVendor.tinNumber,
        bankName: newVendor.bankName,
        bankAccountNumber: newVendor.bankAccountNumber,
        telebirrMerchantId: newVendor.telebirrMerchantId || undefined,
        paymentTerms: newVendor.paymentTerms,
        qualityRating: 4.8,
        onTimeDeliveryRate: 95,
        status: 'active',
        notes: newVendor.notes,
      },
      actor
    );

    toast(`Supplier ${created.name} onboarded`, {
      description: `TIN ${created.tinNumber} recorded in approved registry.`,
      variant: 'success',
    });
    refreshSuppliers();
    setShowVendorModal(false);
    setNewVendor({
      code: `VEN-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'fresh_produce',
      contactPerson: '',
      email: '',
      phone: '+251 9',
      tinNumber: '',
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      bankAccountNumber: '',
      telebirrMerchantId: '',
      paymentTerms: 'net_30',
      notes: '',
    });
  };

  const addPoItemRow = () => {
    setNewPo((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemName: '',
          itemCode: `ITM-0${prev.items.length + 1}`,
          quantityOrdered: 1,
          unitOfMeasure: 'units',
          unitPrice: 100,
          storeLocationName: 'Main Dry Stores',
        },
      ],
    }));
  };

  const removePoItemRow = (idx: number) => {
    setNewPo((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updatePoItemRow = (
    idx: number,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => {
    setNewPo((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = suppliers.find((s) => s.id === newPo.vendorId);
    if (!hotelId || !vendor || newPo.items.length === 0) return;

    const items: PurchaseOrderItem[] = newPo.items.map((it, idx) => ({
      itemId: `item_${idx}_${Date.now()}`,
      itemCode: it.itemCode || `ITM-${idx + 1}`,
      itemName: it.itemName,
      quantityOrdered: Number(it.quantityOrdered),
      unitOfMeasure: it.unitOfMeasure,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.quantityOrdered) * Number(it.unitPrice),
      storeLocationId: 'loc_01',
      storeLocationName: it.storeLocationName,
    }));

    const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const rules = saasStorage.getFinancialRules(hotelId);
    const vatCalc = calculateVatOnly(
      subtotal,
      rules?.vatRate ?? TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent
    );
    const taxAmount = vatCalc.vatAmount;
    const totalAmount = vatCalc.total;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    saasStorage.createPurchaseOrder(
      {
        hotelId,
        poNumber,
        vendorId: vendor.id,
        vendorName: vendor.name,
        status: 'pending_approval',
        expectedDeliveryDate: newPo.expectedDeliveryDate,
        currency,
        subtotal,
        taxAmount,
        totalAmount,
        items,
        preparedBy: `${actor.fullName} (${actor.role})`,
        notes: newPo.notes,
      },
      actor
    );

    toast(`Purchase Order ${poNumber} created`, {
      description: `Submitted for authorization (${formatCurrency(totalAmount, currency, currencySymbol)}).`,
      variant: 'success',
    });
    refreshPOs();
    setShowPoModal(false);
    setNewPo({
      vendorId: '',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      notes: '',
      items: [
        {
          itemName: '',
          itemCode: 'ITM-01',
          quantityOrdered: 10,
          unitOfMeasure: 'kg',
          unitPrice: 250,
          storeLocationName: 'Main Dry Stores',
        },
      ],
    });
  };

  const handleCreateThreeWayMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find((p) => p.id === newMatch.poId);
    if (!hotelId || !po || !newMatch.invoiceNumber) return;

    const poAmount = po.totalAmount;
    const grvAmount = po.totalAmount;
    const invoiceAmount = Number(newMatch.invoiceAmount);
    const varianceAmount = invoiceAmount - grvAmount;

    let matchStatus: ThreeWayInvoiceMatch['matchStatus'] = 'matched_approved';
    if (varianceAmount > 0) {
      matchStatus = 'price_variance_hold';
    } else if (varianceAmount < 0) {
      matchStatus = 'quantity_shortage_hold';
    }

    saasStorage.createThreeWayMatch(
      {
        hotelId,
        invoiceNumber: newMatch.invoiceNumber,
        poId: po.id,
        poNumber: po.poNumber,
        grvId: 'grv_new',
        grvNumber: newMatch.grvNumber,
        vendorName: po.vendorName,
        poAmount,
        grvAmount,
        invoiceAmount,
        varianceAmount,
        currency,
        matchStatus,
        paymentDueDate: newMatch.paymentDueDate,
        paymentStatus: 'pending',
      },
      actor
    );

    toast(
      matchStatus === 'matched_approved'
        ? `Invoice ${newMatch.invoiceNumber} matched`
        : `Invoice ${newMatch.invoiceNumber} placed on variance hold`,
      {
        description:
          varianceAmount === 0
            ? 'Zero variance against PO and GRV.'
            : `Variance of ${formatCurrency(varianceAmount, currency, currencySymbol)} flagged for review.`,
        variant: varianceAmount === 0 ? 'success' : 'warning',
      }
    );
    refreshMatches();
    setShowMatchModal(false);
    setNewMatch({
      invoiceNumber: '',
      poId: '',
      grvNumber: `GRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceAmount: 0,
      paymentDueDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
    });
  };

  const getCategoryLabel = (cat: VendorCategory): string => {
    switch (cat) {
      case 'fresh_produce':
        return 'Fresh Produce & Fruit';
      case 'meat_seafood':
        return 'Meat, Poultry & Seafood';
      case 'beverages_liquor':
        return 'Beverages, Wine & Liquor';
      case 'dry_provisions':
        return 'Dry Provisions & Grains';
      case 'linen_guest_amenities':
        return 'Linen & Guest Amenities';
      case 'engineering_spares':
        return 'Engineering & Generator Spares';
      case 'chemicals_cleaning':
        return 'HACCP Chemicals & Cleaning';
      default:
        return cat;
    }
  };

  const getPoStatusMeta = (status: PurchaseOrder['status']): { label: string; tone: StatusTone } => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', tone: 'neutral' };
      case 'pending_approval':
        return { label: 'Pending Approval', tone: 'warning' };
      case 'approved':
        return { label: 'Approved', tone: 'success' };
      case 'sent_to_vendor':
        return { label: 'Sent to Vendor', tone: 'forest' };
      case 'partially_received':
        return { label: 'Partially Received', tone: 'warning' };
      case 'fully_received':
        return { label: 'Fully Received', tone: 'success' };
      case 'cancelled':
        return { label: 'Cancelled', tone: 'critical' };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Operations', 'Supply Chain & POs']}
        title="Supply Chain, Procurement & Three-Way Audit"
        subtitle="Approved supplier compliance registry, multi-store Purchase Order lifecycle, and automated three-way invoice reconciliation (PO vs GRV vs Supplier Invoice)."
        meta={<SampleDataBadge />}
        actions={
          <>
            {activeTab === 'vendors' && (
              <button
                type="button"
                onClick={() => setShowVendorModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Onboard Supplier
              </button>
            )}
            {activeTab === 'purchase_orders' && (
              <button
                type="button"
                onClick={() => setShowPoModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate PO
              </button>
            )}
            {activeTab === 'three_way_match' && (
              <button
                type="button"
                onClick={() => setShowMatchModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Audit Supplier Invoice
              </button>
            )}
          </>
        }
      />

      <VerificationNotice />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Approved Suppliers"
          value={totalApprovedVendors}
          delta="TINs Logged"
          deltaTone="positive"
          helper={`${suppliers.length} total vendor profiles`}
          icon={Building2}
        />
        <KpiCard
          label="Committed PO Pipeline"
          value={formatCurrency(totalCommittedPOValue, currency, currencySymbol)}
          helper={`${purchaseOrders.filter((p) => p.status !== 'cancelled').length} active orders`}
          icon={FileText}
        />
        <KpiCard
          label="Three-Way Variances"
          value={varianceHoldCount}
          delta={varianceHoldCount > 0 ? 'Holds Pending Review' : 'All Clear'}
          deltaTone={varianceHoldCount > 0 ? 'critical' : 'positive'}
          helper="PO vs GRV vs Invoice audit"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Avg. Vendor On-Time Rate"
          value={`${avgOnTimeFulfillment}%`}
          delta={avgOnTimeFulfillment >= 90 ? 'On Target' : 'Below SLA'}
          deltaTone={avgOnTimeFulfillment >= 90 ? 'positive' : 'warning'}
          helper="SLA benchmark > 90%"
          icon={TrendingUp}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E6EBE7] dark:border-[#22322C] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'vendors'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
              : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Approved Supplier Directory ({suppliers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('purchase_orders')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'purchase_orders'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
              : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('three_way_match')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'three_way_match'
              ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B] font-semibold'
              : 'border-transparent text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Three-Way Invoice Audit ({matches.length})
          {varianceHoldCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
              {varianceHoldCount} Hold
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: APPROVED SUPPLIERS */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search vendor, code, contact, or TIN..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <select
              value={vendorCategoryFilter}
              onChange={(e) => setVendorCategoryFilter(e.target.value)}
              className="seam-input px-3 py-1.5 text-xs"
            >
              <option value="all">All Vendor Categories</option>
              <option value="fresh_produce">Fresh Produce & Fruit</option>
              <option value="meat_seafood">Meat & Seafood</option>
              <option value="beverages_liquor">Beverages & Liquor</option>
              <option value="dry_provisions">Dry Provisions</option>
              <option value="linen_guest_amenities">Linen & Guest Amenities</option>
              <option value="engineering_spares">Engineering Spares</option>
              <option value="chemicals_cleaning">Chemicals & Cleaning</option>
            </select>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No suppliers match your search"
                description="Adjust category filters or onboard an approved supplier."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="seam-surface p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C]">
                          {vendor.code}
                        </span>
                        <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-2">
                          {vendor.name}
                        </h3>
                        <span className="text-xs text-[#78837D] dark:text-[#92A199]">
                          {getCategoryLabel(vendor.category)}
                        </span>
                      </div>
                      <StatusBadge label="Active SLA" tone="success" />
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">TIN Number</span>
                        <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                          {vendor.tinNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#78837D] dark:text-[#92A199]">Settlement Bank</span>
                        <span className="text-[#202B27] dark:text-[#ECF1EE] text-right">
                          {vendor.bankName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Account / Wallet</span>
                        <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                          {vendor.telebirrMerchantId || maskIdNumber(vendor.bankAccountNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#78837D] dark:text-[#92A199]">Credit Terms</span>
                        <span className="capitalize font-medium text-[#173F35] dark:text-[#C6A15B]">
                          {vendor.paymentTerms.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[#C6A15B]">
                          <Star className="w-3.5 h-3.5 fill-[#C6A15B]" />
                          <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                            {vendor.qualityRating.toFixed(1)}
                          </span>
                          <span className="text-[#78837D] dark:text-[#92A199] text-[11px]">/ 5.0</span>
                        </div>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                          {vendor.onTimeDeliveryRate}% on-time
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between text-xs text-[#78837D] dark:text-[#92A199]">
                    <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                      {vendor.contactPerson}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${vendor.phone}`}
                        className="p-1.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] transition-colors"
                        title={vendor.phone}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`mailto:${vendor.email}`}
                        className="p-1.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] transition-colors"
                        title={vendor.email}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#78837D] pointer-events-none" />
              <input
                type="text"
                placeholder="Search PO#, vendor name, or preparer..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
              />
            </div>

            <select
              value={poStatusFilter}
              onChange={(e) => setPoStatusFilter(e.target.value)}
              className="seam-input px-3 py-1.5 text-xs"
            >
              <option value="all">All PO Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="sent_to_vendor">Sent to Vendor</option>
              <option value="partially_received">Partially Received</option>
              <option value="fully_received">Fully Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredPOs.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No purchase orders found"
                description="Generate a new PO or adjust your status filter."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPOs.map((po) => {
                const statusMeta = getPoStatusMeta(po.status);
                return (
                  <div key={po.id} className="seam-surface p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono font-semibold text-sm text-[#173F35] dark:text-[#C6A15B]">
                            {po.poNumber}
                          </span>
                          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
                          <span className="text-xs text-[#78837D] dark:text-[#92A199]">
                            Created {formatShortDate(po.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                          Vendor: {po.vendorName}
                        </div>
                        <div className="text-xs text-[#78837D] dark:text-[#92A199] flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Prepared by:{' '}
                            <strong className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                              {po.preparedBy}
                            </strong>
                          </span>
                          {po.approvedBy && (
                            <span>
                              Approved by:{' '}
                              <strong className="font-medium text-emerald-700 dark:text-emerald-400">
                                {po.approvedBy}
                              </strong>
                            </span>
                          )}
                          <span>
                            Expected:{' '}
                            <strong className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                              {formatShortDate(po.expectedDeliveryDate)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 self-end lg:self-auto">
                        <div className="text-right">
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                            Total (incl. 15% VAT)
                          </div>
                          <div className="text-lg font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(po.totalAmount, po.currency || currency, currencySymbol)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {po.status === 'pending_approval' && (
                            <button
                              type="button"
                              onClick={() => {
                                saasStorage.updatePurchaseOrderStatus(po.id, 'approved', actor);
                                toast(`PO ${po.poNumber} approved`, { variant: 'success' });
                                refreshPOs();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors"
                            >
                              Authorize & Approve
                            </button>
                          )}

                          {po.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                saasStorage.updatePurchaseOrderStatus(
                                  po.id,
                                  'sent_to_vendor',
                                  actor
                                );
                                toast(`PO ${po.poNumber} dispatched to vendor`, { variant: 'info' });
                                refreshPOs();
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-xs font-semibold transition-colors"
                            >
                              Dispatch to Vendor
                            </button>
                          )}

                          {po.status === 'sent_to_vendor' && (
                            <button
                              type="button"
                              onClick={() => {
                                saasStorage.updatePurchaseOrderStatus(
                                  po.id,
                                  'fully_received',
                                  actor
                                );
                                toast(`PO ${po.poNumber} marked fully received`, {
                                  variant: 'success',
                                });
                                refreshPOs();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                            >
                              Receive to Store (GRV)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
                      <div className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199] mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span>Requisitioned Line Items ({po.items.length})</span>
                        <span className="font-mono tabular-nums">
                          Subtotal: {formatCurrency(po.subtotal, po.currency || currency, currencySymbol)} · VAT:{' '}
                          {formatCurrency(po.taxAmount, po.currency || currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {po.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 seam-surface-subtle text-xs flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                                {item.itemName}
                              </div>
                              <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono">
                                {item.itemCode} · {item.storeLocationName}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[#78837D] dark:text-[#92A199] font-mono text-[11px] tabular-nums">
                                {item.quantityOrdered} {item.unitOfMeasure} @{' '}
                                {formatCurrency(item.unitPrice, po.currency || currency, currencySymbol)}
                              </div>
                              <div className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                                {formatCurrency(item.totalPrice, po.currency || currency, currencySymbol)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: THREE-WAY INVOICE MATCHING */}
      {activeTab === 'three_way_match' && (
        <div className="space-y-4">
          <div className="seam-surface p-4 flex items-start gap-3 text-xs text-[#78837D] dark:text-[#92A199]">
            <ShieldCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#202B27] dark:text-[#ECF1EE]">
                Financial Integrity Control:
              </strong>{' '}
              Every supplier invoice is reconciled against the authorized Purchase Order (PO) and
              logged Goods Received Voucher (GRV). Variances in unit pricing or delivered quantities
              are placed on disbursement hold until reviewed.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#78837D] dark:text-[#92A199]">Match Status:</span>
            <select
              value={matchStatusFilter}
              onChange={(e) => setMatchStatusFilter(e.target.value)}
              className="seam-input px-3 py-1.5 text-xs"
            >
              <option value="all">All Audit Statuses</option>
              <option value="matched_approved">Matched & Approved (Zero Variance)</option>
              <option value="price_variance_hold">Price Variance Hold</option>
              <option value="quantity_shortage_hold">Quantity Shortage Hold</option>
              <option value="unmatched">Unmatched</option>
            </select>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="seam-surface p-8">
              <EmptyState
                title="No three-way match audits found"
                description="Audit a supplier invoice against a PO and GRV to verify disbursement eligibility."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <div key={match.id} className="seam-surface p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">
                          {match.invoiceNumber}
                        </span>
                        {match.matchStatus === 'matched_approved' && (
                          <StatusBadge label="Matched & Approved" tone="success" />
                        )}
                        {match.matchStatus === 'price_variance_hold' && (
                          <StatusBadge label="Price Variance Hold" tone="warning" />
                        )}
                        {match.matchStatus === 'quantity_shortage_hold' && (
                          <StatusBadge label="Shortage Variance Hold" tone="critical" />
                        )}
                        {match.matchStatus === 'unmatched' && (
                          <StatusBadge label="Unmatched" tone="neutral" />
                        )}
                        <span className="text-xs font-mono text-[#78837D] dark:text-[#92A199]">
                          Due: {formatShortDate(match.paymentDueDate)}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        Vendor: {match.vendorName}
                      </div>

                      {match.reconciledBy && (
                        <div className="text-xs text-[#78837D] dark:text-[#92A199]">
                          Audited by:{' '}
                          <strong className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                            {match.reconciledBy}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
                      <div className="text-right">
                        <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                          Disbursement Status
                        </span>
                        <StatusBadge
                          label={
                            match.paymentStatus === 'paid'
                              ? 'Paid / Settled'
                              : match.paymentStatus === 'authorized_for_payment'
                              ? 'Authorized for Bank Wire'
                              : 'Pending Review'
                          }
                          tone={
                            match.paymentStatus === 'paid'
                              ? 'success'
                              : match.paymentStatus === 'authorized_for_payment'
                              ? 'forest'
                              : 'warning'
                          }
                        />
                      </div>

                      {match.matchStatus === 'matched_approved' &&
                        match.paymentStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              saasStorage.updateThreeWayMatchStatus(
                                match.id,
                                'matched_approved',
                                'authorized_for_payment',
                                actor
                              );
                              toast(`Disbursement authorized for ${match.invoiceNumber}`, {
                                variant: 'success',
                              });
                              refreshMatches();
                            }}
                            className="px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-semibold transition-colors"
                          >
                            Authorize Disbursement
                          </button>
                        )}

                      {match.matchStatus.includes('hold') && (
                        <button
                          type="button"
                          onClick={() =>
                            confirmAction({
                              title: `Release hold on ${match.invoiceNumber}?`,
                              description: `This overrides the variance of ${formatCurrency(
                                match.varianceAmount,
                                match.currency || currency,
                                currencySymbol
                              )} and authorizes payment.`,
                              confirmLabel: 'Release & Authorize',
                              tone: 'warning',
                              onConfirm: () => {
                                saasStorage.updateThreeWayMatchStatus(
                                  match.id,
                                  'matched_approved',
                                  'authorized_for_payment',
                                  actor
                                );
                                toast(`Hold released for ${match.invoiceNumber}`, {
                                  variant: 'warning',
                                });
                                refreshMatches();
                              },
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors"
                        >
                          Release Hold (Override)
                        </button>
                      )}

                      {match.paymentStatus === 'authorized_for_payment' && (
                        <button
                          type="button"
                          onClick={() => {
                            saasStorage.updateThreeWayMatchStatus(
                              match.id,
                              'matched_approved',
                              'paid',
                              actor
                            );
                            toast(`Settlement recorded for ${match.invoiceNumber}`, {
                              variant: 'success',
                            });
                            refreshMatches();
                          }}
                          className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                        >
                          Record Bank Settlement
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
                    <div className="p-3 seam-surface-subtle">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        1. Purchase Order
                      </span>
                      <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {match.poNumber}
                      </span>
                      <div className="text-sm font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                        {formatCurrency(match.poAmount, match.currency || currency, currencySymbol)}
                      </div>
                    </div>

                    <div className="p-3 seam-surface-subtle">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        2. Goods Received (GRV)
                      </span>
                      <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {match.grvNumber}
                      </span>
                      <div className="text-sm font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-1">
                        {formatCurrency(match.grvAmount, match.currency || currency, currencySymbol)}
                      </div>
                    </div>

                    <div className="p-3 seam-surface-subtle">
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        3. Supplier Invoice
                      </span>
                      <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                        {match.invoiceNumber}
                      </span>
                      <div className="text-sm font-mono font-semibold tabular-nums text-[#173F35] dark:text-[#C6A15B] mt-1">
                        {formatCurrency(
                          match.invoiceAmount,
                          match.currency || currency,
                          currencySymbol
                        )}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-lg border ${
                        match.varianceAmount === 0
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      }`}
                    >
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199] block">
                        Net Audit Variance
                      </span>
                      <div
                        className={`text-sm font-mono font-semibold tabular-nums mt-1 ${
                          match.varianceAmount === 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {match.varianceAmount === 0
                          ? 'Exact Match (0)'
                          : `${match.varianceAmount > 0 ? '+' : ''}${formatCurrency(
                              match.varianceAmount,
                              match.currency || currency,
                              currencySymbol
                            )}`}
                      </div>
                      <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                        {match.varianceAmount === 0
                          ? 'Passed Audit'
                          : 'Shortage / Overbilling Flagged'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ONBOARD SUPPLIER */}
      <Modal
        open={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        title="Onboard Approved Supplier"
        subtitle="Verify TIN registration, settlement banking, and credit terms."
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowVendorModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="onboard-vendor-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Register Approved Supplier
            </button>
          </>
        }
      >
        <form id="onboard-vendor-form" onSubmit={handleCreateVendor} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Vendor Code *
              </label>
              <input
                type="text"
                required
                value={newVendor.code}
                onChange={(e) => setNewVendor({ ...newVendor, code: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Company / Supplier Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Awash Agro Processing Ltd"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Category *
              </label>
              <select
                value={newVendor.category}
                onChange={(e) =>
                  setNewVendor({ ...newVendor, category: e.target.value as VendorCategory })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="fresh_produce">Fresh Produce & Fruit</option>
                <option value="meat_seafood">Meat & Seafood</option>
                <option value="beverages_liquor">Beverages & Liquor</option>
                <option value="dry_provisions">Dry Provisions</option>
                <option value="linen_guest_amenities">Linen & Guest Amenities</option>
                <option value="engineering_spares">Engineering Spares</option>
                <option value="chemicals_cleaning">Chemicals & Cleaning</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                TIN Number (10 Digits) *
              </label>
              <input
                type="text"
                required
                placeholder="0039281742"
                value={newVendor.tinNumber}
                onChange={(e) => setNewVendor({ ...newVendor, tinNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Contact Representative *
              </label>
              <input
                type="text"
                required
                placeholder="Full name"
                value={newVendor.contactPerson}
                onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="supplier@company.et"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Phone *
              </label>
              <input
                type="text"
                required
                placeholder="+251 91 234 5678"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Settlement Bank *
              </label>
              <input
                type="text"
                required
                value={newVendor.bankName}
                onChange={(e) => setNewVendor({ ...newVendor, bankName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Bank Account # *
              </label>
              <input
                type="text"
                required
                placeholder="1000..."
                value={newVendor.bankAccountNumber}
                onChange={(e) => setNewVendor({ ...newVendor, bankAccountNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Payment Terms
              </label>
              <select
                value={newVendor.paymentTerms}
                onChange={(e) =>
                  setNewVendor({
                    ...newVendor,
                    paymentTerms: e.target.value as SupplierVendor['paymentTerms'],
                  })
                }
                className="w-full px-3 py-2 seam-input"
              >
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                <option value="advance_deposit">Advance Deposit Required</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: GENERATE PO */}
      <Modal
        open={showPoModal}
        onClose={() => setShowPoModal(false)}
        title="Generate Purchase Order (PO)"
        subtitle="Issue an itemized order to an approved vendor with automatic 15% VAT calculation."
        maxWidthClass="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowPoModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-po-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Submit PO for Authorization
            </button>
          </>
        }
      >
        <form id="new-po-form" onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Approved Vendor *
              </label>
              <select
                required
                value={newPo.vendorId}
                onChange={(e) => setNewPo({ ...newPo, vendorId: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="">-- Choose Vendor --</option>
                {suppliers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({getCategoryLabel(v.category)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                required
                value={newPo.expectedDeliveryDate}
                onChange={(e) => setNewPo({ ...newPo, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Requisition Items
              </span>
              <button
                type="button"
                onClick={addPoItemRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                <Plus className="w-3 h-3" /> Add Line Item
              </button>
            </div>

            {newPo.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 p-2.5 seam-surface-subtle items-end"
              >
                <div className="col-span-4">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Item Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updatePoItemRow(idx, 'itemName', e.target.value)}
                    className="w-full px-2.5 py-1.5 seam-input text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantityOrdered}
                    onChange={(e) => updatePoItemRow(idx, 'quantityOrdered', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 seam-input font-mono text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={item.unitOfMeasure}
                    onChange={(e) => updatePoItemRow(idx, 'unitOfMeasure', e.target.value)}
                    className="w-full px-2.5 py-1.5 seam-input text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-[#78837D] dark:text-[#92A199] block mb-1">
                    Unit Price ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updatePoItemRow(idx, 'unitPrice', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 seam-input font-mono text-xs"
                  />
                </div>
                <div className="col-span-1 text-center pb-1">
                  {newPo.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoItemRow(idx)}
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
              Delivery Instructions & Store Destination
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Deliver before 08:00 AM to Kitchen Cold Room on ice."
              value={newPo.notes}
              onChange={(e) => setNewPo({ ...newPo, notes: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 3: THREE-WAY AUDIT */}
      <Modal
        open={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        title="Three-Way Invoice Audit"
        subtitle="Compare supplier invoice against authorized Purchase Order and GRV figures."
        maxWidthClass="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowMatchModal(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-match-form"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white"
            >
              Perform 3-Way Match Audit
            </button>
          </>
        }
      >
        <form id="new-match-form" onSubmit={handleCreateThreeWayMatch} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Purchase Order *
            </label>
            <select
              required
              value={newMatch.poId}
              onChange={(e) => {
                const po = purchaseOrders.find((p) => p.id === e.target.value);
                setNewMatch({
                  ...newMatch,
                  poId: e.target.value,
                  invoiceAmount: po ? po.totalAmount : 0,
                });
              }}
              className="w-full px-3 py-2 seam-input"
            >
              <option value="">-- Choose Purchase Order --</option>
              {purchaseOrders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poNumber} — {p.vendorName} (
                  {formatCurrency(p.totalAmount, p.currency || currency, currencySymbol)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Supplier Invoice # *
              </label>
              <input
                type="text"
                required
                placeholder="INV-..."
                value={newMatch.invoiceNumber}
                onChange={(e) => setNewMatch({ ...newMatch, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                GRV Reference # *
              </label>
              <input
                type="text"
                required
                value={newMatch.grvNumber}
                onChange={(e) => setNewMatch({ ...newMatch, grvNumber: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Invoice Billed Total ({currency}) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newMatch.invoiceAmount}
                onChange={(e) =>
                  setNewMatch({ ...newMatch, invoiceAmount: Number(e.target.value) })
                }
                className="w-full px-3 py-2 seam-input font-mono font-semibold"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Payment Due Date *
              </label>
              <input
                type="date"
                required
                value={newMatch.paymentDueDate}
                onChange={(e) => setNewMatch({ ...newMatch, paymentDueDate: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="p-3 seam-surface-subtle flex items-start gap-2 text-[11px] text-[#78837D] dark:text-[#92A199]">
            <Info className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />
            <span>
              Discrepancies between billed invoice totals and logged GRV values automatically place
              the invoice on disbursement hold.
            </span>
          </div>
        </form>
      </Modal>
    </div>
  );
};
