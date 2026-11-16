/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Financial Management: Multi-tier Purchase Requisitions, Daily Flash Reports,
 * Cashier Shift Audits, and Bank & Mobile Money Reconciliations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Plus,
  Download,
  Calendar,
  TrendingUp,
  ShieldCheck,
  FileCheck,
  CreditCard,
  Layers,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  PurchaseRequisition,
  DailyRevenueRecord,
  BankReconciliationItem,
  CashierShift,
  Department,
  HotelFinancialRules,
} from '../../types/saas';
import {
  PageHeader,
  KpiCard,
  StatusBadge,
  DataTable,
  Modal,
  EmptyState,
  SampleDataBadge,
  VerificationNotice,
  type DataTableColumn,
  type StatusTone,
} from '../ui';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';

export const FinancialManagement: React.FC = () => {
  const { user, activeHotel } = useAuth();
  const { toast } = useToast();

  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<
    'requisitions' | 'flash_report' | 'cashier_audits' | 'reconciliations'
  >('requisitions');

  // Data States
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyRevenueRecord[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliationItem[]>([]);
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [financialRules, setFinancialRules] = useState<HotelFinancialRules | undefined>();

  // Filter States
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Modal States
  const [showNewReqModal, setShowNewReqModal] = useState<boolean>(false);
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<PurchaseRequisition | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [settlementMethod, setSettlementMethod] = useState<string>(
    'Commercial Bank of Ethiopia (CBE) Transfer'
  );
  const [gmSignOffNotes, setGmSignOffNotes] = useState<string>('');
  const [showNewReconciliationModal, setShowNewReconciliationModal] = useState<boolean>(false);

  // New Requisition Form State
  const [newReqForm, setNewReqForm] = useState({
    departmentId: '',
    category: 'Food & Grocery Purchases',
    description: '',
    amount: '',
    vendorName: '',
    invoiceReference: '',
  });

  // New Reconciliation Form State
  const [newRecForm, setNewRecForm] = useState({
    accountName: 'Commercial Bank of Ethiopia (CBE Operating)',
    accountNumber: '1000123982341',
    date: new Date().toISOString().slice(0, 10),
    systemRecordedAmount: '',
    bankStatementAmount: '',
    notes: '',
  });

  const loadData = useCallback(() => {
    if (!hotelId) {
      setRequisitions([]);
      setDailyReports([]);
      setReconciliations([]);
      setShifts([]);
      setDepartments([]);
      setFinancialRules(undefined);
      return;
    }

    const reqs = saasStorage.getRequisitions(hotelId);
    setRequisitions(reqs);

    const reports = saasStorage.getDailyRevenueReports(hotelId);
    setDailyReports(reports);

    const recs = saasStorage.getBankReconciliations(hotelId);
    setReconciliations(recs);

    const shs = saasStorage.getCashierShifts(hotelId);
    setShifts(shs);

    const depts = saasStorage.getDepartments(hotelId).filter((d) => d.status === 'active');
    setDepartments(depts);

    const rules = saasStorage.getFinancialRules(hotelId);
    setFinancialRules(rules);

    setNewReqForm((prev) => ({
      ...prev,
      departmentId: depts.some((d) => d.id === prev.departmentId) ? prev.departmentId : depts[0]?.id || '',
    }));
  }, [hotelId]);

  useEffect(() => {
    setSelectedReqForDetail(null);
    setShowNewReqModal(false);
    setShowNewReconciliationModal(false);
    setReqStatusFilter('all');
    loadData();
  }, [hotelId, loadData]);

  const currentDailyReport = useMemo(
    () => dailyReports.find((r) => r.date === selectedDate) || dailyReports[0],
    [dailyReports, selectedDate]
  );

  const canUserApproveTier = useCallback(
    (tier: string): boolean => {
      if (!user) return false;
      const role = user.role as string;
      if (role === 'super_admin' || role === 'owner' || role === 'hotel_admin') return true;
      if (
        tier === 'dept_head' &&
        (role === 'dept_head' || role === 'gm' || role === 'deputy_gm' || role === 'finance_manager')
      ) {
        return true;
      }
      if (tier === 'finance' && (role === 'finance_manager' || role === 'gm' || role === 'deputy_gm')) {
        return true;
      }
      if (tier === 'gm' && (role === 'gm' || role === 'deputy_gm')) {
        return true;
      }
      if (tier === 'owner' && (role === 'owner' || role === 'super_admin')) {
        return true;
      }
      return false;
    },
    [user]
  );

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    if (!newReqForm.description || !newReqForm.amount || !newReqForm.vendorName) {
      toast('Missing required fields', {
        variant: 'error',
        description: 'Enter description, amount, and vendor name.',
      });
      return;
    }

    const amt = parseFloat(newReqForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast('Invalid amount', {
        variant: 'error',
        description: 'Please enter a valid positive numeric amount.',
      });
      return;
    }

    const selectedDept = departments.find((d) => d.id === newReqForm.departmentId);
    const departmentName = selectedDept ? selectedDept.name : 'General Operations';

    const actor = {
      email: user?.email || 'finance@hotel.com',
      fullName: user?.fullName || 'Finance User',
      role: user?.role || 'staff',
    };

    const created = saasStorage.createRequisition(
      {
        hotelId,
        departmentId: newReqForm.departmentId,
        departmentName,
        category: newReqForm.category,
        description: newReqForm.description,
        amount: amt,
        currency,
        vendorName: newReqForm.vendorName,
        invoiceReference: newReqForm.invoiceReference || undefined,
      },
      actor
    );

    toast(`Requisition ${created.requisitionNumber} submitted`, {
      variant: 'success',
      description: 'Queued in the multi-tier authorization workflow.',
    });
    setShowNewReqModal(false);
    setNewReqForm({
      departmentId: departments[0]?.id || '',
      category: 'Food & Grocery Purchases',
      description: '',
      amount: '',
      vendorName: '',
      invoiceReference: '',
    });
    loadData();
  };

  const handleApproveRequisition = (reqId: string) => {
    const actor = {
      email: user?.email || 'approver@hotel.com',
      fullName: user?.fullName || 'Approving Official',
      role: user?.role || 'gm',
    };

    const updated = saasStorage.approveRequisition(reqId, actor, approvalComment);
    if (updated) {
      toast(`Requisition ${updated.requisitionNumber} advanced`, {
        variant: 'success',
        description: `Status updated to ${updated.status.replace(/_/g, ' ').toUpperCase()}.`,
      });
      setApprovalComment('');
      setSelectedReqForDetail(updated);
      loadData();
    }
  };

  const handleRejectRequisition = (reqId: string) => {
    if (!rejectionReason.trim()) {
      toast('Rejection reason required', {
        variant: 'error',
        description: 'Specify a rejection reason for audit compliance.',
      });
      return;
    }

    const actor = {
      email: user?.email || 'approver@hotel.com',
      fullName: user?.fullName || 'Approving Official',
      role: user?.role || 'gm',
    };

    const updated = saasStorage.rejectRequisition(reqId, rejectionReason, actor);
    if (updated) {
      toast(`Requisition ${updated.requisitionNumber} rejected`, { variant: 'warning' });
      setRejectionReason('');
      setSelectedReqForDetail(updated);
      loadData();
    }
  };

  const handleSettleRequisition = (reqId: string) => {
    const actor = {
      email: user?.email || 'finance@hotel.com',
      fullName: user?.fullName || 'Disbursement Officer',
      role: user?.role || 'finance_manager',
    };

    const updated = saasStorage.settleRequisition(reqId, settlementMethod, actor);
    if (updated) {
      toast(`Requisition ${updated.requisitionNumber} settled`, {
        variant: 'success',
        description: `Disbursed via ${settlementMethod}.`,
      });
      setSelectedReqForDetail(updated);
      loadData();
    }
  };

  const handleGenerateFlashReport = () => {
    if (!hotelId) return;
    const actor = {
      email: user?.email || 'finance@hotel.com',
      fullName: user?.fullName || 'Night Auditor',
      role: user?.role || 'finance_manager',
    };

    const report = saasStorage.generateDailyRevenueReport(hotelId, selectedDate, actor);
    toast(`Flash Report refreshed for ${selectedDate}`, {
      variant: 'success',
      description: `Net Revenue: ${formatCurrency(report.totalNetRevenue, currency, currencySymbol)}`,
    });
    loadData();
  };

  const handleGMSignOff = (reportId: string) => {
    const actor = {
      email: user?.email || 'gm@hotel.com',
      fullName: user?.fullName || 'General Manager',
      role: user?.role || 'gm',
    };

    const notes =
      gmSignOffNotes.trim() || 'Reviewed and endorsed. Figures reconciled with Night Audit summary.';
    const updated = saasStorage.approveDailyRevenueReport(reportId, notes, actor);
    if (updated) {
      toast(`Flash Report for ${updated.date} locked`, {
        variant: 'success',
        description: 'Formally endorsed and signed by General Management.',
      });
      setGmSignOffNotes('');
      loadData();
    }
  };

  const handleExportFlashReportCSV = () => {
    if (!currentDailyReport) {
      toast('No flash report selected', { variant: 'warning' });
      return;
    }
    const rep = currentDailyReport;
    downloadCsvFile(
      `SEAM_Flash_Report_${rep.date}.csv`,
      ['Section', 'Metric / Department', 'Amount / Value'],
      [
        ['Property', activeHotel?.name || 'Hotel Workspace', rep.date],
        ['Occupancy', 'Occupied / Total Rooms', `${rep.occupiedRooms} / ${rep.totalRooms} (${rep.occupancyRate}%)`],
        ['Yield', 'ADR', `${rep.adr} ${currency}`],
        ['Yield', 'RevPAR', `${rep.revPar} ${currency}`],
        ['Revenue', 'Rooms Division', rep.roomsRevenue],
        ['Revenue', 'Food & Restaurant Outlets', rep.foodRevenue],
        ['Revenue', 'Beverage & Bar Outlets', rep.beverageRevenue],
        ['Revenue', 'Other Departmental Revenue', rep.otherRevenue],
        ['Totals', 'Total Gross Revenue', rep.totalGrossRevenue],
        ['Levies', 'VAT Levy (15%)', rep.vatCollected],
        ['Levies', 'Service Charge (10%)', rep.serviceChargeCollected],
        ['Totals', 'Total Net Revenue', rep.totalNetRevenue],
        ['Tender Audit', 'Cash Drawer Collections', rep.cashCollected],
        ['Tender Audit', 'Card POS Batches', rep.cardCollected],
        ['Tender Audit', 'Telebirr Mobile Money', rep.telebirrCollected],
        ['Tender Audit', 'Direct Room Charge Postings', rep.roomChargeCollected],
        ['Sign-Off', 'GM Endorsement', rep.approvedByGM ? 'Endorsed & Signed' : 'Pending GM Review'],
        ['Sign-Off', 'GM Notes', rep.gmNotes || 'N/A'],
      ]
    );
    toast('Flash Report CSV exported', { variant: 'success' });
  };

  const handleCreateReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    const sysAmt = parseFloat(newRecForm.systemRecordedAmount);
    const bnkAmt = parseFloat(newRecForm.bankStatementAmount);

    if (isNaN(sysAmt) || isNaN(bnkAmt)) {
      toast('Invalid numeric amounts', { variant: 'error' });
      return;
    }

    const variance = bnkAmt - sysAmt;
    const status = Math.abs(variance) < 0.01 ? 'matched' : 'discrepancy';

    const actor = {
      email: user?.email || 'finance@hotel.com',
      fullName: user?.fullName || 'Finance Accountant',
      role: user?.role || 'finance_manager',
    };

    const newItem: BankReconciliationItem = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      hotelId,
      date: newRecForm.date,
      accountName: newRecForm.accountName,
      accountNumber: newRecForm.accountNumber,
      systemRecordedAmount: sysAmt,
      bankStatementAmount: bnkAmt,
      variance,
      status,
      reconciledBy: `${actor.fullName} (${actor.role})`,
      notes: newRecForm.notes || undefined,
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveBankReconciliation(newItem, actor);
    toast(`Bank reconciliation saved (${status.toUpperCase()})`, {
      variant: status === 'matched' ? 'success' : 'warning',
    });
    setShowNewReconciliationModal(false);
    loadData();
  };

  const handleVerifyReconciliation = (id: string) => {
    const actor = {
      email: user?.email || 'finance@hotel.com',
      fullName: user?.fullName || 'Finance Controller',
      role: user?.role || 'finance_manager',
    };

    saasStorage.verifyReconciliation(id, actor);
    toast('Reconciliation matched and variance cleared', { variant: 'success' });
    loadData();
  };

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(
      (req) => reqStatusFilter === 'all' || req.status === reqStatusFilter
    );
  }, [requisitions, reqStatusFilter]);

  const metrics = useMemo(() => {
    const totalCount = requisitions.length;
    const pendingCount = requisitions.filter((r) => r.status.startsWith('pending')).length;
    const approvedCount = requisitions.filter((r) => r.status === 'approved').length;
    const settledSpend = requisitions
      .filter((r) => r.status === 'settled')
      .reduce((sum, r) => sum + r.amount, 0);
    return { totalCount, pendingCount, approvedCount, settledSpend };
  }, [requisitions]);

  const getReqStatusBadge = (status: string): { tone: StatusTone; label: string } => {
    if (status === 'approved') return { tone: 'forest', label: 'Approved' };
    if (status === 'settled') return { tone: 'success', label: 'Settled' };
    if (status === 'rejected') return { tone: 'critical', label: 'Rejected' };
    return {
      tone: 'warning',
      label: status.replace('pending_', 'Pending ').replace(/_/g, ' '),
    };
  };

  const requisitionColumns: DataTableColumn<PurchaseRequisition>[] = [
    {
      key: 'ref',
      header: 'Req Reference',
      sortable: true,
      sortValue: (r) => r.requisitionNumber,
      render: (r) => (
        <div>
          <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
            {r.requisitionNumber}
          </span>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            {formatShortDate(r.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'dept',
      header: 'Department & Category',
      sortable: true,
      sortValue: (r) => r.departmentName,
      render: (r) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{r.departmentName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">{r.category}</div>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Description & Vendor',
      render: (r) => (
        <div className="max-w-xs">
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
            {r.description}
          </div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            Vendor: <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{r.vendorName}</span>
            {r.invoiceReference && <span className="font-mono"> · Ref {r.invoiceReference}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: `Amount (${currency})`,
      align: 'right',
      sortable: true,
      sortValue: (r) => r.amount,
      render: (r) => (
        <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(r.amount, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'tier',
      header: 'Current Tier',
      render: (r) => (
        <StatusBadge tone="neutral" label={r.currentApprovalTier.replace('_', ' ')} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => {
        const badge = getReqStatusBadge(r.status);
        return <StatusBadge tone={badge.tone} label={badge.label} />;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => {
        const isPending = r.status.startsWith('pending');
        const canApprove = isPending && canUserApproveTier(r.currentApprovalTier);
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedReqForDetail(r)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            >
              View Trail
            </button>
            {canApprove && (
              <button
                type="button"
                onClick={() => setSelectedReqForDetail(r)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
              >
                Authorize
              </button>
            )}
            {r.status === 'approved' && (
              <button
                type="button"
                onClick={() => setSelectedReqForDetail(r)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#647B52] hover:bg-[#536843] text-white transition-colors"
              >
                Disburse
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const shiftColumns: DataTableColumn<CashierShift>[] = [
    {
      key: 'shiftNumber',
      header: 'Shift Ref',
      sortable: true,
      sortValue: (s) => s.shiftNumber,
      render: (s) => (
        <div>
          <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
            {s.shiftNumber}
          </span>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'outlet',
      header: 'Outlet & Cashier',
      sortable: true,
      sortValue: (s) => s.outletName,
      render: (s) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{s.outletName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">{s.cashierName}</div>
        </div>
      ),
    },
    {
      key: 'float',
      header: 'Opening Float',
      align: 'right',
      render: (s) => <span className="font-mono tabular-nums">{s.openingFloat.toLocaleString()}</span>,
    },
    {
      key: 'cash',
      header: 'Cash Sales',
      align: 'right',
      render: (s) => (
        <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
          {s.cashSales.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'card',
      header: 'Card POS',
      align: 'right',
      render: (s) => <span className="font-mono tabular-nums">{s.cardSales.toLocaleString()}</span>,
    },
    {
      key: 'telebirr',
      header: 'Telebirr',
      align: 'right',
      render: (s) => (
        <span className="font-mono tabular-nums text-[#173F35] dark:text-[#C6A15B]">
          {s.telebirrSales.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total Till',
      align: 'right',
      sortable: true,
      sortValue: (s) => s.totalRevenue,
      render: (s) => (
        <span className="font-mono font-semibold tabular-nums">
          {formatCurrency(s.totalRevenue, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'variance',
      header: 'Counted / Variance',
      align: 'right',
      render: (s) => {
        const expectedCash = s.openingFloat + s.cashSales;
        const hasVariance = s.cashVariance !== undefined && s.cashVariance !== 0;
        if (s.status !== 'closed') {
          return (
            <span className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono">
              Exp: {expectedCash.toLocaleString()}
            </span>
          );
        }
        return (
          <div>
            <div className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
              {s.actualCashCounted?.toLocaleString()}
            </div>
            <div
              className={`text-[11px] font-mono ${
                hasVariance
                  ? (s.cashVariance || 0) < 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {hasVariance
                ? `${(s.cashVariance || 0) > 0 ? '+' : ''}${s.cashVariance} ${currency}`
                : 'Balanced'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <StatusBadge
          tone={s.status === 'open' ? 'success' : 'neutral'}
          label={s.status === 'open' ? 'Open Session' : 'Closed & Audited'}
        />
      ),
    },
  ];

  const recColumns: DataTableColumn<BankReconciliationItem>[] = [
    {
      key: 'account',
      header: 'Account & Number',
      sortable: true,
      sortValue: (i) => i.accountName,
      render: (i) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{i.accountName}</div>
          <div className="text-[11px] font-mono text-[#78837D] dark:text-[#92A199]">
            {i.accountNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Batch Date',
      sortable: true,
      sortValue: (i) => i.date,
      render: (i) => <span className="font-mono">{i.date}</span>,
    },
    {
      key: 'sys',
      header: 'System Ledger',
      align: 'right',
      render: (i) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(i.systemRecordedAmount, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'bank',
      header: 'Bank Statement',
      align: 'right',
      render: (i) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(i.bankStatementAmount, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      sortable: true,
      sortValue: (i) => Math.abs(i.variance),
      render: (i) => {
        const isDiscrepancy = i.status === 'discrepancy' || Math.abs(i.variance) > 0.01;
        return (
          <span
            className={`font-mono font-semibold tabular-nums ${
              isDiscrepancy
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {i.variance > 0 ? `+${i.variance.toLocaleString()}` : i.variance.toLocaleString()} {currency}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <StatusBadge
          tone={i.status === 'matched' ? 'success' : 'critical'}
          label={i.status === 'matched' ? 'Matched' : 'Discrepancy'}
        />
      ),
    },
    {
      key: 'notes',
      header: 'Auditor & Notes',
      render: (i) => (
        <div className="max-w-xs">
          <div className="text-[11px] text-[#202B27] dark:text-[#ECF1EE]">
            {i.notes || 'Routine settlement matched'}
          </div>
          <div className="text-[10px] text-[#78837D] dark:text-[#92A199]">
            {i.reconciledBy || 'Finance Dept'}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (i) => {
        const isDiscrepancy = i.status === 'discrepancy' || Math.abs(i.variance) > 0.01;
        return isDiscrepancy ? (
          <button
            type="button"
            onClick={() => handleVerifyReconciliation(i.id)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
          >
            Match &amp; Clear
          </button>
        ) : (
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Cleared</span>
        );
      },
    },
  ];

  if (!activeHotel) {
    return (
      <EmptyState
        title="No property selected"
        description="Select a hotel property from the top property selector to manage financial operations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Finance & Audit', 'Financial Management']}
        title="Financial Management & Flash Reconciliations"
        subtitle="Multi-tier purchase requisition approvals, daily revenue flash reporting, cashier shift audits, and bank statement matching."
        meta={<SampleDataBadge />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportFlashReportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#78837D]" />
              <span>Export Flash CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewReqModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Requisition</span>
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-1 overflow-x-auto">
        {[
          {
            id: 'requisitions',
            label: 'Purchase Requisitions',
            icon: Receipt,
            count: metrics.pendingCount > 0 ? metrics.pendingCount : undefined,
          },
          { id: 'flash_report', label: 'Daily Revenue Flash', icon: TrendingUp },
          { id: 'cashier_audits', label: 'Cashier Shifts & Tills', icon: CreditCard },
          { id: 'reconciliations', label: 'Bank & Telebirr Match', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#173F35] dark:border-[#C6A15B] text-[#173F35] dark:text-[#C6A15B]'
                  : 'border-transparent text-[#78837D] hover:text-[#202B27] dark:text-[#92A199] dark:hover:text-[#ECF1EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-semibold font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PURCHASE REQUISITIONS */}
      {activeTab === 'requisitions' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Requisitions"
              value={metrics.totalCount}
              helper="Departmental vouchers"
              icon={Layers}
            />
            <KpiCard
              label="Pending Approvals"
              value={metrics.pendingCount}
              helper="Awaiting tier authorization"
              deltaTone={metrics.pendingCount > 0 ? 'warning' : 'neutral'}
              icon={Clock}
            />
            <KpiCard
              label="Approved (Pending Pay)"
              value={metrics.approvedCount}
              helper="Ready for disbursement"
              deltaTone="forest"
              icon={FileCheck}
            />
            <KpiCard
              label="Settled Disbursements"
              value={formatCurrency(metrics.settledSpend, currency, currencySymbol)}
              helper="Fully disbursed spend"
              deltaTone="positive"
              icon={CheckCircle2}
            />
          </div>

          <div className="seam-surface p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#202B27] dark:text-[#ECF1EE]">
              <ShieldCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0" />
              <span>
                <strong className="font-semibold">Approval Limits:</strong> Dept Head ≤{' '}
                {financialRules?.approvalLimits?.deptHeadLimit.toLocaleString() || '5,000'} {currency} ·
                Finance ≤ {financialRules?.approvalLimits?.financeManagerLimit.toLocaleString() || '50,000'}{' '}
                {currency} · GM ≤{' '}
                {financialRules?.approvalLimits?.gmLimit.toLocaleString() || '250,000'} {currency} · Owner
                above threshold.
              </span>
            </div>
            <span className="text-[11px] text-[#78837D] dark:text-[#92A199] capitalize shrink-0">
              Role: <strong className="text-[#202B27] dark:text-[#ECF1EE]">{user?.role.replace(/_/g, ' ')}</strong>
            </span>
          </div>

          <DataTable
            data={filteredRequisitions}
            columns={requisitionColumns}
            keyExtractor={(r) => r.id}
            searchPlaceholder="Search req #, vendor, department, description..."
            searchFilter={(r, q) =>
              r.requisitionNumber.toLowerCase().includes(q) ||
              r.vendorName.toLowerCase().includes(q) ||
              r.departmentName.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q)
            }
            filterToolbar={
              <select
                value={reqStatusFilter}
                onChange={(e) => setReqStatusFilter(e.target.value)}
                className="seam-input py-1.5 px-3 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending_dept_head">Pending Dept Head</option>
                <option value="pending_finance">Pending Finance Manager</option>
                <option value="pending_gm">Pending General Manager</option>
                <option value="approved">Approved (Pending Settlement)</option>
                <option value="settled">Settled / Disbursed</option>
                <option value="rejected">Rejected</option>
              </select>
            }
            onExportCsv={() => {
              downloadCsvFile(
                `SEAM_Requisitions_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Req #', 'Date', 'Department', 'Category', 'Vendor', 'Amount', 'Currency', 'Tier', 'Status'],
                filteredRequisitions.map((r) => [
                  r.requisitionNumber,
                  r.createdAt.slice(0, 10),
                  r.departmentName,
                  r.category,
                  r.vendorName,
                  r.amount,
                  r.currency,
                  r.currentApprovalTier,
                  r.status,
                ])
              );
              toast('Requisitions exported to CSV', { variant: 'success' });
            }}
            emptyTitle="No purchase requisitions found"
            emptyDescription="Create a new departmental requisition or adjust your status filter."
          />
        </div>
      )}

      {/* TAB 2: DAILY REVENUE FLASH REPORT */}
      {activeTab === 'flash_report' && (
        <div className="space-y-5">
          <div className="seam-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#78837D] dark:text-[#92A199] uppercase tracking-wider block">
                  Flash Report Date
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="seam-input py-1 px-2.5 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFlashReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] hover:border-[#647B52] transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recompute Date</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              {currentDailyReport?.approvedByGM ? (
                <StatusBadge tone="success" label="Endorsed & Signed by GM" />
              ) : (
                <StatusBadge tone="warning" label="Pending GM Sign-Off" />
              )}
            </div>
          </div>

          {!currentDailyReport ? (
            <EmptyState
              title="No flash report computed for this date"
              description="Click Recompute Date above to compile the daily departmental revenue flash report."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Occupancy Rate"
                  value={`${currentDailyReport.occupancyRate}%`}
                  helper={`${currentDailyReport.occupiedRooms} / ${currentDailyReport.totalRooms} rooms occupied`}
                  deltaTone="forest"
                />
                <KpiCard
                  label="ADR (Avg Daily Rate)"
                  value={formatCurrency(currentDailyReport.adr, currency, currencySymbol)}
                  helper="Per occupied room night"
                />
                <KpiCard
                  label="RevPAR"
                  value={formatCurrency(currentDailyReport.revPar, currency, currencySymbol)}
                  helper="Revenue per available room"
                />
                <KpiCard
                  label="Total Net Revenue"
                  value={formatCurrency(currentDailyReport.totalNetRevenue, currency, currencySymbol)}
                  helper="Gross + VAT 15% + SC 10%"
                  deltaTone="positive"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Departmental Revenue Breakdown */}
                <div className="seam-surface p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      Departmental Revenue Breakdown
                    </h3>
                    <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                      Night Audit Summary
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      {
                        code: 'RM',
                        label: 'Rooms Division',
                        sub: 'Room tariffs & late departures',
                        val: currentDailyReport.roomsRevenue,
                      },
                      {
                        code: 'F&B',
                        label: 'Food & Restaurant Outlets',
                        sub: 'Main dining, room service, breakfast',
                        val: currentDailyReport.foodRevenue,
                      },
                      {
                        code: 'BAR',
                        label: 'Beverage & Lounge Bar',
                        sub: 'Wines, cocktails, coffees, soft drinks',
                        val: currentDailyReport.beverageRevenue,
                      },
                      {
                        code: 'OTH',
                        label: 'Other Operating Departments',
                        sub: 'Laundry, minibar, business center',
                        val: currentDailyReport.otherRevenue,
                      },
                    ].map((row) => {
                      const pct =
                        currentDailyReport.totalGrossRevenue > 0
                          ? Math.round((row.val / currentDailyReport.totalGrossRevenue) * 100)
                          : 0;
                      return (
                        <div
                          key={row.code}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7]/70 dark:border-[#22322C]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center font-mono font-semibold text-[11px]">
                              {row.code}
                            </span>
                            <div>
                              <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                                {row.label}
                              </div>
                              <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                                {row.sub}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                              {formatCurrency(row.val, currency, currencySymbol)}
                            </div>
                            <div className="text-[10px] text-[#78837D] dark:text-[#92A199] font-mono">
                              {pct}% of gross
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-1.5">
                      <div className="flex justify-between text-[#78837D] dark:text-[#92A199]">
                        <span>Total Departmental Gross</span>
                        <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          {formatCurrency(currentDailyReport.totalGrossRevenue, currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#78837D] dark:text-[#92A199]">
                        <span>VAT (15%)</span>
                        <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          +{formatCurrency(currentDailyReport.vatCollected, currency, currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#78837D] dark:text-[#92A199]">
                        <span>Service Charge (10%)</span>
                        <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                          +
                          {formatCurrency(
                            currentDailyReport.serviceChargeCollected,
                            currency,
                            currencySymbol
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-[#173F35] dark:text-[#C6A15B] pt-2 border-t border-[#E6EBE7] dark:border-[#22322C]">
                        <span>Total Net Flash Revenue</span>
                        <span className="font-mono tabular-nums">
                          {formatCurrency(currentDailyReport.totalNetRevenue, currency, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tender Collections Audit & GM Sign-Off */}
                <div className="space-y-5">
                  <div className="seam-surface p-5">
                    <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-4">
                      Payment Tender Collections Audit
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      {[
                        { label: 'Physical Cash Drawer Tenders', val: currentDailyReport.cashCollected },
                        { label: 'Card POS Machine Batches', val: currentDailyReport.cardCollected },
                        { label: 'Telebirr Mobile Merchant', val: currentDailyReport.telebirrCollected },
                        {
                          label: 'Direct Room Folio Postings',
                          val: currentDailyReport.roomChargeCollected,
                        },
                      ].map((t) => (
                        <div
                          key={t.label}
                          className="flex justify-between items-center p-2.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7]/70 dark:border-[#22322C]"
                        >
                          <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{t.label}</span>
                          <span className="font-mono font-semibold tabular-nums text-[#202B27] dark:text-[#ECF1EE]">
                            {formatCurrency(t.val, currency, currencySymbol)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="seam-surface p-5">
                    <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mb-2 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
                      <span>Executive Sign-Off &amp; Daily Closure</span>
                    </h3>

                    {currentDailyReport.approvedByGM ? (
                      <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Report Locked by General Manager</span>
                        </div>
                        <p className="text-[#202B27] dark:text-[#ECF1EE] mt-1.5 italic">
                          &ldquo;{currentDailyReport.gmNotes || 'Audited and reviewed.'}&rdquo;
                        </p>
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-2 font-mono">
                          {new Date(currentDailyReport.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                          Night audit balancing complete. General Manager or Finance Controller endorsement
                          locks this flash report.
                        </p>
                        <textarea
                          placeholder="Enter GM executive notes..."
                          value={gmSignOffNotes}
                          onChange={(e) => setGmSignOffNotes(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 text-xs seam-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleGMSignOff(currentDailyReport.id)}
                          className="w-full py-2 px-3 text-xs font-medium text-white bg-[#173F35] hover:bg-[#12332B] rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Endorse &amp; Lock Flash Report</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <VerificationNotice />
            </>
          )}
        </div>
      )}

      {/* TAB 3: CASHIER SHIFTS & DRAWER AUDITS */}
      {activeTab === 'cashier_audits' && (
        <div className="space-y-4">
          <DataTable
            data={shifts}
            columns={shiftColumns}
            keyExtractor={(s) => s.id}
            searchPlaceholder="Search shift #, outlet, or cashier..."
            searchFilter={(s, q) =>
              s.shiftNumber.toLowerCase().includes(q) ||
              s.outletName.toLowerCase().includes(q) ||
              s.cashierName.toLowerCase().includes(q)
            }
            onExportCsv={() => {
              downloadCsvFile(
                `SEAM_Cashier_Shifts_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Shift #', 'Outlet', 'Cashier', 'Opening Float', 'Cash', 'Card', 'Telebirr', 'Total', 'Variance', 'Status'],
                shifts.map((s) => [
                  s.shiftNumber,
                  s.outletName,
                  s.cashierName,
                  s.openingFloat,
                  s.cashSales,
                  s.cardSales,
                  s.telebirrSales,
                  s.totalRevenue,
                  s.cashVariance ?? 0,
                  s.status,
                ])
              );
              toast('Cashier shifts exported to CSV', { variant: 'success' });
            }}
            emptyTitle="No cashier sessions recorded"
            emptyDescription="POS and Front Office shift sessions appear here when cashiers open their drawers."
          />
        </div>
      )}

      {/* TAB 4: BANK & TELEBIRR RECONCILIATIONS */}
      {activeTab === 'reconciliations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#78837D] dark:text-[#92A199]">
              Daily matching of bank accounts, Telebirr merchant collections, and POS card settlements.
            </p>
            <button
              type="button"
              onClick={() => setShowNewReconciliationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Bank Settlement Batch</span>
            </button>
          </div>

          <DataTable
            data={reconciliations}
            columns={recColumns}
            keyExtractor={(i) => i.id}
            searchPlaceholder="Search account name, number, or notes..."
            searchFilter={(i, q) =>
              i.accountName.toLowerCase().includes(q) ||
              i.accountNumber.toLowerCase().includes(q) ||
              (i.notes || '').toLowerCase().includes(q)
            }
            onExportCsv={() => {
              downloadCsvFile(
                `SEAM_Bank_Reconciliations_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Date', 'Account', 'Account #', 'System', 'Bank Statement', 'Variance', 'Status'],
                reconciliations.map((i) => [
                  i.date,
                  i.accountName,
                  i.accountNumber,
                  i.systemRecordedAmount,
                  i.bankStatementAmount,
                  i.variance,
                  i.status,
                ])
              );
              toast('Bank reconciliations exported to CSV', { variant: 'success' });
            }}
            emptyTitle="No bank reconciliation batches recorded"
            emptyDescription="Record a bank or mobile money settlement batch to compare against system ledgers."
          />
        </div>
      )}

      {/* MODAL 1: NEW REQUISITION */}
      <Modal
        open={showNewReqModal}
        onClose={() => setShowNewReqModal(false)}
        title="Create Purchase Requisition Voucher"
        subtitle="Submits directly into the property multi-tier expense approval workflow."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewReqModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-req-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Submit for Approval
            </button>
          </>
        }
      >
        <form id="new-req-form" onSubmit={handleCreateRequisition} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Requesting Department *
            </label>
            <select
              value={newReqForm.departmentId}
              onChange={(e) => setNewReqForm({ ...newReqForm, departmentId: e.target.value })}
              className="w-full p-2 seam-input"
              required
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Expense Category *
              </label>
              <select
                value={newReqForm.category}
                onChange={(e) => setNewReqForm({ ...newReqForm, category: e.target.value })}
                className="w-full p-2 seam-input"
              >
                <option value="Food & Grocery Purchases">Food &amp; Grocery Purchases</option>
                <option value="Beverage & Liquor Purchases">Beverage &amp; Liquor Purchases</option>
                <option value="Fuel & Generator Operating">Fuel &amp; Generator Operating</option>
                <option value="Linen & Housekeeping Supplies">Linen &amp; Housekeeping Supplies</option>
                <option value="Engineering & Spare Parts">Engineering &amp; Spare Parts</option>
                <option value="Administrative & Office Supplies">Administrative &amp; Office Supplies</option>
                <option value="IT, Internet & Software Systems">IT, Internet &amp; Software Systems</option>
                <option value="Marketing, PR & Advertising">Marketing, PR &amp; Advertising</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 15400"
                value={newReqForm.amount}
                onChange={(e) => setNewReqForm({ ...newReqForm, amount: e.target.value })}
                className="w-full p-2 seam-input font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Item Description &amp; Justification *
            </label>
            <textarea
              rows={2}
              placeholder="Specify items, quantities, or operational urgency..."
              value={newReqForm.description}
              onChange={(e) => setNewReqForm({ ...newReqForm, description: e.target.value })}
              className="w-full p-2 seam-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Vendor / Supplier Name *
              </label>
              <input
                type="text"
                placeholder="Supplier name"
                value={newReqForm.vendorName}
                onChange={(e) => setNewReqForm({ ...newReqForm, vendorName: e.target.value })}
                className="w-full p-2 seam-input"
                required
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Invoice / Quotation Ref
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-99"
                value={newReqForm.invoiceReference}
                onChange={(e) => setNewReqForm({ ...newReqForm, invoiceReference: e.target.value })}
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REQUISITION DETAIL & AUDIT TRAIL */}
      <Modal
        open={Boolean(selectedReqForDetail)}
        onClose={() => setSelectedReqForDetail(null)}
        title={selectedReqForDetail ? `Requisition ${selectedReqForDetail.requisitionNumber}` : ''}
        subtitle={selectedReqForDetail?.departmentName}
        maxWidthClass="max-w-xl"
      >
        {selectedReqForDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
              <div>
                <span className="text-[#78837D] dark:text-[#92A199] block text-[11px]">Department</span>
                <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedReqForDetail.departmentName}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] dark:text-[#92A199] block text-[11px]">Amount</span>
                <span className="font-semibold font-mono text-sm text-[#173F35] dark:text-[#C6A15B]">
                  {formatCurrency(selectedReqForDetail.amount, selectedReqForDetail.currency)}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] dark:text-[#92A199] block text-[11px]">Vendor</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedReqForDetail.vendorName}
                </span>
              </div>
              <div>
                <span className="text-[#78837D] dark:text-[#92A199] block text-[11px]">Requested By</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {selectedReqForDetail.requestedBy.name}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[#78837D] dark:text-[#92A199] block text-[11px] mb-1">
                Description &amp; Specifications
              </span>
              <p className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE]">
                {selectedReqForDetail.description}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block mb-2">
                Approval Audit Trail
              </span>
              <div className="space-y-2">
                {selectedReqForDetail.approvalHistory.length === 0 ? (
                  <div className="p-3 text-center text-[#78837D] dark:text-[#92A199] bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-dashed border-[#E6EBE7] dark:border-[#22322C]">
                    Awaiting initial {selectedReqForDetail.currentApprovalTier.replace('_', ' ')} authorization.
                  </div>
                ) : (
                  selectedReqForDetail.approvalHistory.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        step.action === 'approved'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] capitalize">
                          Tier: {step.tier.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                        Approver: <strong>{step.approverName}</strong> ·{' '}
                        <span className="uppercase font-semibold">{step.action}</span>
                      </div>
                      {step.comment && (
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199] italic mt-1">
                          &ldquo;{step.comment}&rdquo;
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedReqForDetail.status.startsWith('pending') &&
              canUserApproveTier(selectedReqForDetail.currentApprovalTier) && (
                <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-3">
                  <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] block">
                    Authorize or Reject (Tier: {selectedReqForDetail.currentApprovalTier.toUpperCase()})
                  </span>
                  <input
                    type="text"
                    placeholder="Approval comments (optional)..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    className="w-full p-2 seam-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleApproveRequisition(selectedReqForDetail.id)}
                    className="w-full py-2 font-medium text-white bg-[#173F35] hover:bg-[#12332B] rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve {selectedReqForDetail.currentApprovalTier.toUpperCase()} Tier</span>
                  </button>

                  <div className="pt-2 border-t border-[#E6EBE7] dark:border-[#22322C] flex gap-2">
                    <input
                      type="text"
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="flex-1 p-2 seam-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleRejectRequisition(selectedReqForDetail.id)}
                      className="px-3 py-2 font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-900/50 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

            {selectedReqForDetail.status === 'approved' && (
              <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] space-y-3 p-3.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622]">
                <span className="font-semibold text-[#173F35] dark:text-[#C6A15B] block">
                  Disburse &amp; Settle Approved Requisition
                </span>
                <select
                  value={settlementMethod}
                  onChange={(e) => setSettlementMethod(e.target.value)}
                  className="w-full p-2 seam-input"
                >
                  <option value="Commercial Bank of Ethiopia (CBE) Transfer">
                    Commercial Bank of Ethiopia (CBE) Transfer
                  </option>
                  <option value="Telebirr Merchant Payment">Telebirr Merchant Payment</option>
                  <option value="Cash Disbursement from Front Desk Safe">
                    Cash Disbursement from Front Desk Safe
                  </option>
                  <option value="Awash Bank Corporate Cheque">Awash Bank Corporate Cheque</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleSettleRequisition(selectedReqForDetail.id)}
                  className="w-full py-2 font-medium text-white bg-[#647B52] hover:bg-[#536843] rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment &amp; Mark Settled</span>
                </button>
              </div>
            )}

            {selectedReqForDetail.status === 'settled' && (
              <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Disbursed and Settled</span>
                </div>
                <div className="text-[11px] mt-1 text-[#202B27] dark:text-[#ECF1EE]">
                  Method: <strong>{selectedReqForDetail.settlementMethod}</strong> ·{' '}
                  {new Date(
                    selectedReqForDetail.settledAt || selectedReqForDetail.updatedAt
                  ).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 3: RECORD BANK RECONCILIATION BATCH */}
      <Modal
        open={showNewReconciliationModal}
        onClose={() => setShowNewReconciliationModal(false)}
        title="Record Bank Statement Batch"
        subtitle="Compare SEAM ledger totals against external bank or Telebirr statements."
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewReconciliationModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-rec-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Save &amp; Reconcile
            </button>
          </>
        }
      >
        <form id="new-rec-form" onSubmit={handleCreateReconciliation} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Account Name &amp; Channel *
            </label>
            <select
              value={newRecForm.accountName}
              onChange={(e) => {
                const acc = e.target.value;
                let accNum = '1000123982341';
                if (acc.includes('Telebirr')) accNum = 'MERCH-0911-88412';
                else if (acc.includes('Awash')) accNum = '0142981023910';
                setNewRecForm({ ...newRecForm, accountName: acc, accountNumber: accNum });
              }}
              className="w-full p-2 seam-input"
            >
              <option value="Commercial Bank of Ethiopia (CBE Operating)">
                Commercial Bank of Ethiopia (CBE Operating)
              </option>
              <option value="Telebirr Merchant Gateway Account">Telebirr Merchant Gateway Account</option>
              <option value="Awash Bank POS Card Machine Account">Awash Bank POS Card Machine Account</option>
              <option value="Hotel Vault Physical Safe Cash">Hotel Vault Physical Safe Cash</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Statement Batch Date *
            </label>
            <input
              type="date"
              value={newRecForm.date}
              onChange={(e) => setNewRecForm({ ...newRecForm, date: e.target.value })}
              className="w-full p-2 seam-input font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                SEAM Ledger ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 42100"
                value={newRecForm.systemRecordedAmount}
                onChange={(e) =>
                  setNewRecForm({ ...newRecForm, systemRecordedAmount: e.target.value })
                }
                className="w-full p-2 seam-input font-mono"
                required
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Bank Statement ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 42100"
                value={newRecForm.bankStatementAmount}
                onChange={(e) =>
                  setNewRecForm({ ...newRecForm, bankStatementAmount: e.target.value })
                }
                className="w-full p-2 seam-input font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Reconciliation Notes
            </label>
            <input
              type="text"
              placeholder="e.g. E-banking statement download matched."
              value={newRecForm.notes}
              onChange={(e) => setNewRecForm({ ...newRecForm, notes: e.target.value })}
              className="w-full p-2 seam-input"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
