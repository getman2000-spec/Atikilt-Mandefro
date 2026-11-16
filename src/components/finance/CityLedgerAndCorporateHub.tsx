/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * City Ledger (AR), Corporate & Diplomatic Credit Lines, and Travel Agency Commissions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Receipt,
  DollarSign,
  AlertTriangle,
  Plus,
  Send,
  ShieldAlert,
  Percent,
  Phone,
  Mail,
} from 'lucide-react';
import { CurrentUser } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import {
  Hotel,
  CorporateAccount,
  CorporateAccountType,
  CityLedgerInvoice,
  AgencyCommissionRecord,
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
  type StatusTone,
} from '../ui';
import { formatCurrency, downloadCsvFile } from '../../utils/formatters';

interface CityLedgerAndCorporateHubProps {
  activeHotel: Hotel | null;
  currentUser: CurrentUser | null;
}

export const CityLedgerAndCorporateHub: React.FC<CityLedgerAndCorporateHubProps> = ({
  activeHotel,
  currentUser,
}) => {
  const { toast } = useToast();
  const hotelId = activeHotel?.id || '';
  const currency = activeHotel?.operationalSettings?.currency || 'ETB';
  const currencySymbol = activeHotel?.operationalSettings?.currencySymbol;

  const [activeTab, setActiveTab] = useState<
    'city_ledger' | 'corporate_accounts' | 'agency_commissions'
  >('city_ledger');
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [invoices, setInvoices] = useState<CityLedgerInvoice[]>([]);
  const [commissions, setCommissions] = useState<AgencyCommissionRecord[]>([]);

  // Filters
  const [agingFilter, setAgingFilter] = useState<
    'all' | 'current_30' | '31_60' | '61_plus' | 'settled'
  >('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');

  // Modals
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<CityLedgerInvoice | null>(null);
  const [payoutModalCommission, setPayoutModalCommission] = useState<AgencyCommissionRecord | null>(
    null
  );

  // Forms
  const [newAccount, setNewAccount] = useState({
    accountCode: '',
    companyName: '',
    accountType: 'corporate' as CorporateAccountType,
    taxTinNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    creditLimitEtb: 500000,
    paymentTermsDays: 30,
    negotiatedRateDiscountPercent: 15,
    contractedRoomRateEtb: 4675,
    contractExpiryDate: '2027-12-31',
    notes: '',
  });

  const [newInvoice, setNewInvoice] = useState({
    accountId: '',
    guestOrGroupName: '',
    folioReference: '',
    totalAmountEtb: 45000,
    lpoReference: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amountEtb: 0,
    method: 'Commercial Bank of Ethiopia (CBE)',
    reference: '',
  });

  const [commissionPayoutRef, setCommissionPayoutRef] = useState('');

  const loadData = useCallback(() => {
    if (!hotelId) {
      setAccounts([]);
      setInvoices([]);
      setCommissions([]);
      return;
    }
    setAccounts(saasStorage.getCorporateAccounts(hotelId));
    setInvoices(saasStorage.getCityLedgerInvoices(hotelId));
    setCommissions(saasStorage.getAgencyCommissions(hotelId));
  }, [hotelId]);

  useEffect(() => {
    setShowNewAccountModal(false);
    setShowNewInvoiceModal(false);
    setPaymentModalInvoice(null);
    setPayoutModalCommission(null);
    setAgingFilter('all');
    setAccountTypeFilter('all');
    loadData();
  }, [hotelId, loadData]);

  const metrics = useMemo(() => {
    const totalArOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDueEtb, 0);
    const openReceivablesCount = invoices.filter((i) => i.balanceDueEtb > 0).length;
    const overdueInvoices = invoices.filter(
      (inv) => inv.status === 'overdue' && inv.balanceDueEtb > 0
    );
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDueEtb, 0);
    const activeContractsCount = accounts.filter((a) => a.status === 'active').length;
    const creditHoldCount = accounts.filter((a) => a.status === 'credit_hold').length;
    const pendingCommissionsTotal = commissions
      .filter((c) => c.status !== 'paid')
      .reduce((sum, c) => sum + c.netPayableEtb, 0);

    return {
      totalArOutstanding,
      openReceivablesCount,
      overdueInvoicesCount: overdueInvoices.length,
      overdueAmount,
      activeContractsCount,
      creditHoldCount,
      pendingCommissionsTotal,
    };
  }, [invoices, accounts, commissions]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newAccount.companyName || !newAccount.accountCode || !newAccount.contactPerson) {
      return;
    }

    const created = saasStorage.createCorporateAccount(
      {
        hotelId,
        accountCode: newAccount.accountCode.toUpperCase(),
        companyName: newAccount.companyName,
        accountType: newAccount.accountType,
        taxTinNumber: newAccount.taxTinNumber || 'PENDING-TIN',
        contactPerson: newAccount.contactPerson,
        contactEmail: newAccount.contactEmail || 'accounts@partner.org',
        contactPhone: newAccount.contactPhone || '+251 11 000 0000',
        creditLimitEtb: Number(newAccount.creditLimitEtb) || 500000,
        paymentTermsDays: Number(newAccount.paymentTermsDays) || 30,
        negotiatedRateDiscountPercent: Number(newAccount.negotiatedRateDiscountPercent) || 15,
        contractedRoomRateEtb: Number(newAccount.contractedRoomRateEtb) || 4675,
        contractExpiryDate: newAccount.contractExpiryDate,
        notes: newAccount.notes || undefined,
      },
      currentUser?.fullName || 'Finance Manager'
    );

    if (created) {
      loadData();
      setShowNewAccountModal(false);
      setNewAccount({
        accountCode: '',
        companyName: '',
        accountType: 'corporate',
        taxTinNumber: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        creditLimitEtb: 500000,
        paymentTermsDays: 30,
        negotiatedRateDiscountPercent: 15,
        contractedRoomRateEtb: 4675,
        contractExpiryDate: '2027-12-31',
        notes: '',
      });
      toast(`Corporate account ${created.companyName} onboarded`, {
        variant: 'success',
        description: `Code: ${created.accountCode}`,
      });
    }
  };

  const handleToggleAccountHold = (acc: CorporateAccount) => {
    const nextStatus = acc.status === 'credit_hold' ? 'active' : 'credit_hold';
    saasStorage.updateCorporateAccountStatus(
      acc.id,
      nextStatus,
      currentUser?.fullName || 'Finance Controller'
    );
    loadData();
    toast(`${acc.companyName} updated to ${nextStatus.replace('_', ' ').toUpperCase()}`, {
      variant: nextStatus === 'credit_hold' ? 'warning' : 'success',
    });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !newInvoice.accountId || !newInvoice.guestOrGroupName || newInvoice.totalAmountEtb <= 0) {
      return;
    }

    const created = saasStorage.createCityLedgerInvoice(
      {
        hotelId,
        accountId: newInvoice.accountId,
        guestOrGroupName: newInvoice.guestOrGroupName,
        folioReference: newInvoice.folioReference || undefined,
        totalAmountEtb: Number(newInvoice.totalAmountEtb),
        lpoReference: newInvoice.lpoReference || undefined,
      },
      currentUser?.fullName || 'AR Accountant'
    );

    if (created) {
      loadData();
      setShowNewInvoiceModal(false);
      setNewInvoice({
        accountId: '',
        guestOrGroupName: '',
        folioReference: '',
        totalAmountEtb: 45000,
        lpoReference: '',
      });
      toast(`City Ledger Invoice ${created.invoiceNumber} issued`, {
        variant: 'success',
        description: `Direct-billed to ${created.companyName}.`,
      });
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentForm.amountEtb <= 0 || !paymentForm.reference) return;

    const updated = saasStorage.recordCityLedgerPayment(
      paymentModalInvoice.id,
      {
        amountEtb: Number(paymentForm.amountEtb),
        method: paymentForm.method,
        reference: paymentForm.reference,
        recordedBy: currentUser?.fullName || 'AR Accountant',
      },
      currentUser?.fullName || 'AR Accountant'
    );

    if (updated) {
      loadData();
      setPaymentModalInvoice(null);
      setPaymentForm({
        amountEtb: 0,
        method: 'Commercial Bank of Ethiopia (CBE)',
        reference: '',
      });
      toast(`AR receipt posted to ${updated.invoiceNumber}`, {
        variant: 'success',
        description: `Remaining balance: ${formatCurrency(updated.balanceDueEtb, currency, currencySymbol)}`,
      });
    }
  };

  const handleSendReminder = (inv: CityLedgerInvoice) => {
    saasStorage.sendCityLedgerReminder(inv.id, currentUser?.fullName || 'AR Collections');
    loadData();
    toast(`Statement reminder dispatched`, {
      variant: 'info',
      description: `Sent to ${inv.companyName} for ${inv.invoiceNumber}.`,
    });
  };

  const handleApproveCommission = (comm: AgencyCommissionRecord) => {
    saasStorage.approveAgencyCommission(comm.id, currentUser?.fullName || 'Finance Manager');
    loadData();
    toast(`Commission ${comm.bookingReference} approved for payout`, { variant: 'success' });
  };

  const handlePayCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalCommission || !commissionPayoutRef) return;

    saasStorage.markCommissionPaid(
      payoutModalCommission.id,
      commissionPayoutRef,
      currentUser?.fullName || 'Finance Controller'
    );
    loadData();
    setPayoutModalCommission(null);
    setCommissionPayoutRef('');
    toast(`Commission settled for ${payoutModalCommission.agencyName}`, { variant: 'success' });
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (agingFilter === 'settled') return inv.status === 'settled';
      if (agingFilter === 'current_30') return inv.balanceDueEtb > 0 && inv.agingDays <= 30;
      if (agingFilter === '31_60')
        return inv.balanceDueEtb > 0 && inv.agingDays > 30 && inv.agingDays <= 60;
      if (agingFilter === '61_plus') return inv.balanceDueEtb > 0 && inv.agingDays > 60;
      return true;
    });
  }, [invoices, agingFilter]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(
      (acc) => accountTypeFilter === 'all' || acc.accountType === accountTypeFilter
    );
  }, [accounts, accountTypeFilter]);

  const invoiceColumns: DataTableColumn<CityLedgerInvoice>[] = [
    {
      key: 'invoice',
      header: 'Invoice & LPO',
      sortable: true,
      sortValue: (i) => i.invoiceNumber,
      render: (i) => (
        <div>
          <span className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
            {i.invoiceNumber}
          </span>
          {i.lpoReference && (
            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] font-mono">
              LPO: {i.lpoReference}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Corporate Account & Group',
      sortable: true,
      sortValue: (i) => i.companyName,
      render: (i) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{i.companyName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">{i.guestOrGroupName}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Issue / Due Date',
      sortable: true,
      sortValue: (i) => i.agingDays,
      render: (i) => (
        <div className="text-xs">
          <div className="text-[#78837D] dark:text-[#92A199]">Issued: {i.issueDate}</div>
          <div
            className={
              i.status === 'overdue'
                ? 'text-rose-700 dark:text-rose-400 font-semibold'
                : 'text-[#78837D] dark:text-[#92A199]'
            }
          >
            Due: {i.dueDate} ({i.agingDays}d)
          </div>
        </div>
      ),
    },
    {
      key: 'totalPaid',
      header: 'Total / Paid',
      align: 'right',
      render: (i) => (
        <div className="font-mono text-xs tabular-nums">
          <div className="text-[#202B27] dark:text-[#ECF1EE]">
            {formatCurrency(i.totalAmountEtb, currency, currencySymbol)}
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 text-[11px]">
            Paid: {formatCurrency(i.paidAmountEtb, currency, currencySymbol)}
          </div>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance Due',
      align: 'right',
      sortable: true,
      sortValue: (i) => i.balanceDueEtb,
      render: (i) => (
        <span
          className={`font-mono font-semibold tabular-nums ${
            i.balanceDueEtb > 0
              ? 'text-[#202B27] dark:text-[#ECF1EE]'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {formatCurrency(i.balanceDueEtb, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => {
        const tone: StatusTone =
          i.status === 'settled'
            ? 'success'
            : i.status === 'overdue'
            ? 'critical'
            : i.status === 'partially_paid'
            ? 'warning'
            : 'forest';
        const label =
          i.status === 'overdue'
            ? `Overdue (${i.agingDays}d)`
            : i.status.replace('_', ' ');
        return <StatusBadge tone={tone} label={label} />;
      },
    },
    {
      key: 'actions',
      header: 'AR Actions',
      align: 'right',
      render: (i) =>
        i.balanceDueEtb > 0 ? (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleSendReminder(i)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Remind</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentModalInvoice(i);
                setPaymentForm({
                  amountEtb: i.balanceDueEtb,
                  method: 'Commercial Bank of Ethiopia (CBE)',
                  reference: '',
                });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white text-[11px] font-medium transition-colors"
            >
              <DollarSign className="w-3 h-3" />
              <span>Receive Pay</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Paid in Full</span>
        ),
    },
  ];

  const commissionColumns: DataTableColumn<AgencyCommissionRecord>[] = [
    {
      key: 'agency',
      header: 'Agency & Ref',
      sortable: true,
      sortValue: (c) => c.agencyName,
      render: (c) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{c.agencyName}</div>
          <div className="text-[11px] font-mono text-[#173F35] dark:text-[#C6A15B]">
            {c.bookingReference}
          </div>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest & Stay',
      render: (c) => (
        <div>
          <div className="font-medium text-[#202B27] dark:text-[#ECF1EE]">{c.guestName}</div>
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">{c.stayDates}</div>
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Room Revenue',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.roomRevenueEtb,
      render: (c) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(c.roomRevenueEtb, currency, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'grossComm',
      header: 'Comm % / Gross',
      align: 'right',
      render: (c) => (
        <div className="font-mono text-xs tabular-nums">
          <span className="text-[#C6A15B] font-semibold">{c.commissionRatePercent}%</span> ·{' '}
          {formatCurrency(c.commissionAmountEtb, currency, currencySymbol)}
        </div>
      ),
    },
    {
      key: 'netPayable',
      header: '2% WHT / Net Payable',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.netPayableEtb,
      render: (c) => (
        <div className="font-mono tabular-nums">
          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
            WHT: -{c.withholdingTaxEtb.toLocaleString()}
          </div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
            {formatCurrency(c.netPayableEtb, currency, currencySymbol)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const tone: StatusTone =
          c.status === 'paid' ? 'success' : c.status === 'approved_payable' ? 'warning' : 'neutral';
        const label =
          c.status === 'paid'
            ? `Paid (${c.payoutReference})`
            : c.status === 'approved_payable'
            ? 'Approved Payable'
            : 'Pending Checkout';
        return <StatusBadge tone={tone} label={label} />;
      },
    },
    {
      key: 'actions',
      header: 'Settlement',
      align: 'right',
      render: (c) =>
        c.status === 'pending_checkout' ? (
          <button
            type="button"
            onClick={() => handleApproveCommission(c)}
            className="px-2.5 py-1 rounded-lg bg-[#173F35] hover:bg-[#12332B] text-white text-[11px] font-medium transition-colors"
          >
            Approve Payable
          </button>
        ) : c.status === 'approved_payable' ? (
          <button
            type="button"
            onClick={() => {
              setPayoutModalCommission(c);
              setCommissionPayoutRef('CBE-COM-' + Math.floor(10000 + Math.random() * 90000));
            }}
            className="px-2.5 py-1 rounded-lg bg-[#647B52] hover:bg-[#536843] text-white text-[11px] font-medium transition-colors"
          >
            Settle &amp; Pay
          </button>
        ) : (
          <span className="text-[11px] text-[#78837D] dark:text-[#92A199]">Remitted</span>
        ),
    },
  ];

  if (!activeHotel) {
    return (
      <EmptyState
        title="No property selected"
        description="Select a hotel property to view corporate credit lines and City Ledger accounts receivable."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Finance & Audit', 'City Ledger & AR']}
        title="Corporate Accounts, City Ledger (AR) & Agency Commissions"
        subtitle="Direct-bill corporate and diplomatic credit lines, AR invoice aging schedules, LPO tracking, and OTA commission payouts."
        meta={<SampleDataBadge />}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowNewAccountModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-[#173F35] dark:text-[#C6A15B]" />
              <span>Onboard Corp Account</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewInvoiceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Transfer Folio to AR</span>
            </button>
          </>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total City Ledger (AR)"
          value={formatCurrency(metrics.totalArOutstanding, currency, currencySymbol)}
          helper={`${metrics.openReceivablesCount} open receivables`}
          deltaTone="forest"
          icon={Receipt}
        />
        <KpiCard
          label="Overdue Receivables"
          value={formatCurrency(metrics.overdueAmount, currency, currencySymbol)}
          helper={`${metrics.overdueInvoicesCount} past-due statements`}
          deltaTone={metrics.overdueAmount > 0 ? 'critical' : 'positive'}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Corporate & Diplomatic"
          value={`${metrics.activeContractsCount} Active`}
          helper={
            metrics.creditHoldCount > 0
              ? `${metrics.creditHoldCount} on credit hold`
              : 'All credit lines healthy'
          }
          deltaTone={metrics.creditHoldCount > 0 ? 'warning' : 'positive'}
          icon={Building2}
        />
        <KpiCard
          label="Agency Commissions Due"
          value={formatCurrency(metrics.pendingCommissionsTotal, currency, currencySymbol)}
          helper="Net after 2% WHT deduction"
          icon={Percent}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6EBE7] dark:border-[#22322C] gap-1 overflow-x-auto">
        {[
          { id: 'city_ledger', label: 'City Ledger (AR) & Aging', icon: Receipt, count: invoices.length },
          {
            id: 'corporate_accounts',
            label: 'Corporate & Diplomatic Lines',
            icon: Building2,
            count: accounts.length,
          },
          {
            id: 'agency_commissions',
            label: 'Travel Agency Commissions',
            icon: Percent,
            count: commissions.length,
          },
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
              <span className="px-1.5 py-0.5 rounded-full bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] text-[10px] font-mono">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CITY LEDGER INVOICES */}
      {activeTab === 'city_ledger' && (
        <DataTable
          data={filteredInvoices}
          columns={invoiceColumns}
          keyExtractor={(i) => i.id}
          searchPlaceholder="Search invoice #, company, guest/group, or LPO..."
          searchFilter={(i, q) =>
            i.invoiceNumber.toLowerCase().includes(q) ||
            i.companyName.toLowerCase().includes(q) ||
            i.guestOrGroupName.toLowerCase().includes(q) ||
            (i.lpoReference || '').toLowerCase().includes(q)
          }
          filterToolbar={
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Invoices' },
                { id: 'current_30', label: '0–30 Days' },
                { id: '31_60', label: '31–60 Days' },
                { id: '61_plus', label: '61+ Overdue' },
                { id: 'settled', label: 'Settled' },
              ].map((bucket) => (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={() => setAgingFilter(bucket.id as typeof agingFilter)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    agingFilter === bucket.id
                      ? 'bg-[#173F35] text-white'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          }
          onExportCsv={() => {
            downloadCsvFile(
              `SEAM_City_Ledger_AR_${new Date().toISOString().slice(0, 10)}.csv`,
              ['Invoice #', 'Company', 'Guest / Group', 'Issue Date', 'Due Date', 'Aging (Days)', 'Total', 'Paid', 'Balance Due', 'Status'],
              filteredInvoices.map((i) => [
                i.invoiceNumber,
                i.companyName,
                i.guestOrGroupName,
                i.issueDate,
                i.dueDate,
                i.agingDays,
                i.totalAmountEtb,
                i.paidAmountEtb,
                i.balanceDueEtb,
                i.status,
              ])
            );
            toast('City Ledger AR aging schedule exported', { variant: 'success' });
          }}
          emptyTitle="No City Ledger invoices match"
          emptyDescription="Adjust aging filters or transfer a guest folio to Accounts Receivable."
        />
      )}

      {/* TAB 2: CORPORATE & DIPLOMATIC ACCOUNTS */}
      {activeTab === 'corporate_accounts' && (
        <div className="space-y-4">
          <div className="seam-surface p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Partners' },
                { id: 'ngo_un', label: 'UN / NGO' },
                { id: 'embassy_diplomatic', label: 'Embassies' },
                { id: 'airline_crew', label: 'Airline Crew' },
                { id: 'corporate', label: 'Corporate' },
                { id: 'tour_operator', label: 'Tour Operators' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAccountTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    accountTypeFilter === t.id
                      ? 'bg-[#173F35] text-white'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowNewAccountModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Corporate Contract</span>
            </button>
          </div>

          {filteredAccounts.length === 0 ? (
            <EmptyState
              title="No corporate partners found"
              description="Onboard a corporate, diplomatic, or NGO direct-bill account to manage credit limits."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAccounts.map((acc) => {
                const utilizationPct = Math.min(
                  100,
                  Math.round((acc.currentBalanceEtb / (acc.creditLimitEtb || 1)) * 100)
                );
                const isHold = acc.status === 'credit_hold';

                return (
                  <div
                    key={acc.id}
                    className={`seam-surface p-5 flex flex-col justify-between ${
                      isHold ? 'border-rose-300 dark:border-rose-900/60' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] px-2 py-0.5 rounded border border-[#E6EBE7] dark:border-[#22322C]">
                              {acc.accountCode}
                            </span>
                            <span className="text-[11px] uppercase tracking-wider text-[#78837D] dark:text-[#92A199] font-medium">
                              {acc.accountType.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] mt-1.5">
                            {acc.companyName}
                          </h3>
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5 font-mono">
                            TIN: {acc.taxTinNumber} · Net {acc.paymentTermsDays} Days
                          </div>
                        </div>
                        <StatusBadge
                          tone={isHold ? 'critical' : 'success'}
                          label={isHold ? 'Credit Hold' : 'Active Credit'}
                        />
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#78837D] dark:text-[#92A199]">
                            Balance:{' '}
                            <strong className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                              {formatCurrency(acc.currentBalanceEtb, currency, currencySymbol)}
                            </strong>
                          </span>
                          <span className="text-[#78837D] dark:text-[#92A199] font-mono">
                            Limit: {formatCurrency(acc.creditLimitEtb, currency, currencySymbol)} ({utilizationPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#F6F8F6] dark:bg-[#192622] rounded-full overflow-hidden border border-[#E6EBE7] dark:border-[#22322C]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilizationPct >= 90
                                ? 'bg-rose-600'
                                : utilizationPct >= 70
                                ? 'bg-[#C6A15B]'
                                : 'bg-[#173F35] dark:bg-[#647B52]'
                            }`}
                            style={{ width: `${utilizationPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
                        <div className="bg-[#F6F8F6] dark:bg-[#192622] p-2.5 rounded-lg border border-[#E6EBE7]/70 dark:border-[#22322C]">
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                            Contracted Rate
                          </div>
                          <div className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {formatCurrency(acc.contractedRoomRateEtb, currency, currencySymbol)} (-
                            {acc.negotiatedRateDiscountPercent}%)
                          </div>
                        </div>
                        <div className="bg-[#F6F8F6] dark:bg-[#192622] p-2.5 rounded-lg border border-[#E6EBE7]/70 dark:border-[#22322C]">
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199]">
                            Contract Expiry
                          </div>
                          <div className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE] mt-0.5">
                            {acc.contractExpiryDate}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-[#78837D] dark:text-[#92A199] space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {acc.contactPerson} · {acc.contactEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">{acc.contactPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleAccountHold(acc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                          isHold
                            ? 'bg-[#647B52] hover:bg-[#536843] text-white'
                            : 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{isHold ? 'Lift Credit Hold' : 'Place on Credit Hold'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewInvoice({ ...newInvoice, accountId: acc.id });
                          setShowNewInvoiceModal(true);
                        }}
                        className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:underline"
                      >
                        + Direct-Bill Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRAVEL AGENCY & OTA COMMISSIONS */}
      {activeTab === 'agency_commissions' && (
        <DataTable
          data={commissions}
          columns={commissionColumns}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search agency, booking ref, or guest..."
          searchFilter={(c, q) =>
            c.agencyName.toLowerCase().includes(q) ||
            c.bookingReference.toLowerCase().includes(q) ||
            c.guestName.toLowerCase().includes(q)
          }
          onExportCsv={() => {
            downloadCsvFile(
              `SEAM_Agency_Commissions_${new Date().toISOString().slice(0, 10)}.csv`,
              ['Agency', 'Booking Ref', 'Guest', 'Stay Dates', 'Room Revenue', 'Comm %', 'Gross Comm', '2% WHT', 'Net Payable', 'Status'],
              commissions.map((c) => [
                c.agencyName,
                c.bookingReference,
                c.guestName,
                c.stayDates,
                c.roomRevenueEtb,
                c.commissionRatePercent,
                c.commissionAmountEtb,
                c.withholdingTaxEtb,
                c.netPayableEtb,
                c.status,
              ])
            );
            toast('Agency commission ledger exported to CSV', { variant: 'success' });
          }}
          emptyTitle="No agency commission records"
          emptyDescription="Post-checkout travel agency and tour operator commissions appear here for WHT calculation and settlement."
        />
      )}

      {/* MODAL: ONBOARD NEW CORPORATE ACCOUNT */}
      <Modal
        open={showNewAccountModal}
        onClose={() => setShowNewAccountModal(false)}
        title="Onboard Corporate / Diplomatic Account"
        subtitle="Configure negotiated BAR contract rates and City Ledger credit ceiling."
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewAccountModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-corp-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Create Account
            </button>
          </>
        }
      >
        <form id="new-corp-form" onSubmit={handleCreateAccount} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Account Code *
              </label>
              <input
                type="text"
                required
                placeholder="CORP-AU-01"
                value={newAccount.accountCode}
                onChange={(e) => setNewAccount({ ...newAccount, accountCode: e.target.value })}
                className="w-full p-2 seam-input font-mono uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="African Union Commission"
                value={newAccount.companyName}
                onChange={(e) => setNewAccount({ ...newAccount, companyName: e.target.value })}
                className="w-full p-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Category *
              </label>
              <select
                value={newAccount.accountType}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, accountType: e.target.value as CorporateAccountType })
                }
                className="w-full p-2 seam-input"
              >
                <option value="corporate">Corporate Enterprise</option>
                <option value="ngo_un">UN / International NGO</option>
                <option value="embassy_diplomatic">Embassy / Diplomatic Mission</option>
                <option value="airline_crew">Airline Crew Contract</option>
                <option value="tour_operator">Tour Operator / DMC</option>
                <option value="travel_agency">Travel Agency / OTA</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                TIN / Tax ID
              </label>
              <input
                type="text"
                placeholder="0049128831"
                value={newAccount.taxTinNumber}
                onChange={(e) => setNewAccount({ ...newAccount, taxTinNumber: e.target.value })}
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Billing Contact *
              </label>
              <input
                type="text"
                required
                placeholder="Contact full name"
                value={newAccount.contactPerson}
                onChange={(e) => setNewAccount({ ...newAccount, contactPerson: e.target.value })}
                className="w-full p-2 seam-input"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Billing Email
              </label>
              <input
                type="email"
                placeholder="finance@partner.org"
                value={newAccount.contactEmail}
                onChange={(e) => setNewAccount({ ...newAccount, contactEmail: e.target.value })}
                className="w-full p-2 seam-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Credit Limit ({currency})
              </label>
              <input
                type="number"
                value={newAccount.creditLimitEtb}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, creditLimitEtb: Number(e.target.value) })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Terms (Days)
              </label>
              <input
                type="number"
                value={newAccount.paymentTermsDays}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, paymentTermsDays: Number(e.target.value) })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Contract Rate ({currency})
              </label>
              <input
                type="number"
                value={newAccount.contractedRoomRateEtb}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, contractedRoomRateEtb: Number(e.target.value) })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: ISSUE CITY LEDGER INVOICE */}
      <Modal
        open={showNewInvoiceModal}
        onClose={() => setShowNewInvoiceModal(false)}
        title="Transfer Folio to City Ledger (AR)"
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewInvoiceModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-ar-invoice-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Post AR Invoice
            </button>
          </>
        }
      >
        <form id="new-ar-invoice-form" onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Corporate Direct-Bill Account *
            </label>
            <select
              required
              value={newInvoice.accountId}
              onChange={(e) => setNewInvoice({ ...newInvoice, accountId: e.target.value })}
              className="w-full p-2 seam-input"
            >
              <option value="">Select Account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.companyName} ({a.accountCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
              Guest or Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Regional Health Conference (8 Rooms)"
              value={newInvoice.guestOrGroupName}
              onChange={(e) => setNewInvoice({ ...newInvoice, guestOrGroupName: e.target.value })}
              className="w-full p-2 seam-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={newInvoice.totalAmountEtb}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, totalAmountEtb: Number(e.target.value) })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                LPO / Voucher Ref
              </label>
              <input
                type="text"
                placeholder="LPO-2026-991"
                value={newInvoice.lpoReference}
                onChange={(e) => setNewInvoice({ ...newInvoice, lpoReference: e.target.value })}
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECEIVE AR PAYMENT */}
      <Modal
        open={Boolean(paymentModalInvoice)}
        onClose={() => setPaymentModalInvoice(null)}
        title="Receive AR Payment"
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPaymentModalInvoice(null)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="ar-payment-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Post AR Receipt
            </button>
          </>
        }
      >
        {paymentModalInvoice && (
          <form id="ar-payment-form" onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1">
              <div className="text-[#78837D] dark:text-[#92A199]">
                Invoice:{' '}
                <strong className="font-mono text-[#173F35] dark:text-[#C6A15B]">
                  {paymentModalInvoice.invoiceNumber}
                </strong>
              </div>
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                {paymentModalInvoice.companyName}
              </div>
              <div className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                Balance Due: {formatCurrency(paymentModalInvoice.balanceDueEtb, currency, currencySymbol)}
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Payment Amount ({currency}) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={paymentModalInvoice.balanceDueEtb}
                value={paymentForm.amountEtb}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amountEtb: Number(e.target.value) })
                }
                className="w-full p-2 seam-input font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Settlement Method *
              </label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                className="w-full p-2 seam-input"
              >
                <option value="Commercial Bank of Ethiopia (CBE)">
                  Commercial Bank of Ethiopia (CBE)
                </option>
                <option value="Telebirr Corporate">Telebirr Corporate</option>
                <option value="Awash Bank Transfer">Awash Bank Transfer</option>
                <option value="SWIFT International Wire">SWIFT International Wire</option>
                <option value="Certified Company Cheque (CPO)">Certified Company Cheque (CPO)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Bank / Receipt Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FT2631109283"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: SETTLE COMMISSION PAYOUT */}
      <Modal
        open={Boolean(payoutModalCommission)}
        onClose={() => setPayoutModalCommission(null)}
        title="Settle Agency Commission"
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPayoutModalCommission(null)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="comm-payout-form"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#173F35] hover:bg-[#12332B] text-white"
            >
              Confirm Payout
            </button>
          </>
        }
      >
        {payoutModalCommission && (
          <form id="comm-payout-form" onSubmit={handlePayCommission} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] space-y-1">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                {payoutModalCommission.agencyName}
              </div>
              <div className="text-[#78837D] dark:text-[#92A199] font-mono">
                Booking: {payoutModalCommission.bookingReference}
              </div>
              <div className="font-mono font-semibold text-[#173F35] dark:text-[#C6A15B]">
                Net Payable (after 2% WHT):{' '}
                {formatCurrency(payoutModalCommission.netPayableEtb, currency, currencySymbol)}
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B27] dark:text-[#ECF1EE] mb-1">
                Bank Transfer / Wire Reference *
              </label>
              <input
                type="text"
                required
                value={commissionPayoutRef}
                onChange={(e) => setCommissionPayoutRef(e.target.value)}
                className="w-full p-2 seam-input font-mono"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
