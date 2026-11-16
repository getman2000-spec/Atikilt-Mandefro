/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Subscriptions & Payment Verification Hub
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { Subscription, SubscriptionPayment } from '../../types/saas';
import { SUBSCRIPTION_PLANS } from '../../constants/saasDefaults';
import { PageHeader, KpiCard, DataTable, DataTableColumn, StatusBadge, Modal, SampleDataBadge } from '../ui';
import { formatCurrency, formatShortDate, downloadCsvFile } from '../../utils/formatters';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface SubscriptionHubProps {
  initialTab?: 'contracts' | 'verification' | 'plans';
}

export const SubscriptionHub: React.FC<SubscriptionHubProps> = ({ initialTab = 'contracts' }) => {
  const { user, refreshHotels, language } = useAuth();
  const isAm = language === 'am';
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'contracts' | 'verification' | 'plans'>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => saasStorage.getSubscriptions());
  const [payments, setPayments] = useState<SubscriptionPayment[]>(() => saasStorage.getPayments());
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'grace_period' | 'suspended'>('all');

  // Modal states
  const [extendingSub, setExtendingSub] = useState<Subscription | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendNotes, setExtendNotes] = useState<string>('');

  const [verifyingPayment, setVerifyingPayment] = useState<SubscriptionPayment | null>(null);
  const [verifyExtendDays, setVerifyExtendDays] = useState<number>(30);

  const refreshData = () => {
    setSubscriptions(saasStorage.getSubscriptions());
    setPayments(saasStorage.getPayments());
    refreshHotels();
  };

  const handleConfirmExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingSub) return;

    saasStorage.extendSubscription(
      extendingSub.id,
      extendDays,
      {
        email: user?.email || 'admin@seam.io',
        fullName: user?.fullName || 'Super Admin',
        role: 'super_admin',
      },
      extendNotes
    );

    refreshData();
    toast('Subscription extended', {
      description: `${extendingSub.hotelName} extended by +${extendDays} days.`,
      variant: 'success',
    });
    setExtendingSub(null);
    setExtendNotes('');
  };

  const handleConfirmVerification = (payment: SubscriptionPayment) => {
    saasStorage.verifyPayment(
      payment.id,
      verifyExtendDays,
      {
        email: user?.email || 'admin@seam.io',
        fullName: user?.fullName || 'Super Admin',
        role: 'super_admin',
      }
    );
    refreshData();
    toast('Payment verified & term renewed', {
      description: `${payment.hotelName} subscription advanced by +${verifyExtendDays} days.`,
      variant: 'success',
    });
    setVerifyingPayment(null);
  };

  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending_review').length;
  const activeSubsCount = subscriptions.filter((s) => s.status === 'active').length;
  const graceSubsCount = subscriptions.filter((s) => s.status === 'grace_period').length;
  const mrrETB = subscriptions
    .filter((s) => s.status === 'active' && s.currency === 'ETB')
    .reduce((acc, s) => acc + (s.billingCycle === 'annual' ? s.price / 12 : s.price), 0);

  const filteredContracts = useMemo(() => {
    if (statusFilter === 'all') return subscriptions;
    return subscriptions.filter((s) => s.status === statusFilter);
  }, [subscriptions, statusFilter]);

  const contractColumns: DataTableColumn<Subscription>[] = [
    {
      key: 'hotelName',
      header: 'Hotel Property',
      sortable: true,
      sortValue: (s) => s.hotelName,
      render: (s) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{s.hotelName}</div>
          <div className="text-[11px] text-[#78837D] font-mono">Tenant {s.hotelId}</div>
        </div>
      ),
    },
    {
      key: 'planName',
      header: 'Plan & Cadence',
      sortable: true,
      sortValue: (s) => s.planName,
      render: (s) => (
        <div>
          <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] capitalize">{s.planName}</span>
          <span className="text-[11px] text-[#78837D] block capitalize">{s.billingCycle}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Contract Rate',
      align: 'right',
      sortable: true,
      sortValue: (s) => s.price,
      render: (s) => (
        <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(s.price, s.currency)}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Term Expiry',
      sortable: true,
      sortValue: (s) => s.expiryDate,
      render: (s) => {
        const isExpired = new Date(s.expiryDate) < new Date();
        return (
          <div>
            <div className={`font-mono tabular-nums ${isExpired ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
              {formatShortDate(s.expiryDate)}
            </div>
            {isExpired && <span className="text-[10px] text-amber-600 dark:text-amber-400">Term Ended</span>}
          </div>
        );
      },
    },
    {
      key: 'grace',
      header: 'Grace Window',
      render: (s) => (
        <div>
          <span className="font-medium tabular-nums">{s.gracePeriodDays} Days</span>
          <span className="text-[11px] text-[#78837D] block font-mono">
            Ends {formatShortDate(s.gracePeriodEndsAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (s) => s.status,
      render: (s) => (
        <StatusBadge
          label={s.status.replace('_', ' ')}
          tone={s.status === 'active' ? 'success' : s.status === 'grace_period' ? 'warning' : 'critical'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <button
          type="button"
          onClick={() => {
            setExtendingSub(s);
            setExtendDays(30);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] font-medium text-[11px] transition-colors"
        >
          Extend Term
        </button>
      ),
    },
  ];

  const paymentColumns: DataTableColumn<SubscriptionPayment>[] = [
    {
      key: 'referenceNumber',
      header: 'Reference No.',
      sortable: true,
      sortValue: (p) => p.referenceNumber,
      render: (p) => <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">{p.referenceNumber}</span>,
    },
    {
      key: 'hotelName',
      header: 'Hotel Tenant',
      sortable: true,
      sortValue: (p) => p.hotelName,
      render: (p) => (
        <div>
          <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{p.hotelName}</span>
          {p.notes && <span className="text-[11px] text-[#78837D] block">{p.notes}</span>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.amount,
      render: (p) => (
        <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
          {formatCurrency(p.amount, p.currency)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method & Tx Ref',
      render: (p) => (
        <div>
          <span className="capitalize font-medium text-[#202B27] dark:text-[#ECF1EE] block">
            {p.paymentMethod.replace('_', ' ')}
          </span>
          <span className="font-mono text-[11px] text-[#78837D]">{p.paymentReference}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      sortable: true,
      sortValue: (p) => p.createdAt,
      render: (p) => <span className="font-mono text-[#78837D]">{formatShortDate(p.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (p) => p.status,
      render: (p) => (
        <StatusBadge
          label={p.status.replace('_', ' ')}
          tone={p.status === 'pending_review' ? 'warning' : 'success'}
        />
      ),
    },
    {
      key: 'action',
      header: 'Verification',
      align: 'right',
      render: (p) =>
        p.status === 'pending_review' ? (
          <button
            type="button"
            onClick={() => {
              setVerifyingPayment(p);
              setVerifyExtendDays(30);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-medium text-[11px] ml-auto"
          >
            <Check className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Verify &amp; Renew</span>
          </button>
        ) : (
          <span className="text-[11px] text-[#78837D] inline-flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified by {p.verifiedBy?.split('@')[0] || 'Admin'}</span>
          </span>
        ),
    },
  ];

  const handleExportContracts = () => {
    downloadCsvFile(
      'seam-subscriptions.csv',
      ['Hotel', 'Tenant ID', 'Plan', 'Cycle', 'Price', 'Currency', 'Expiry', 'Status'],
      filteredContracts.map((s) => [
        s.hotelName,
        s.hotelId,
        s.planName,
        s.billingCycle,
        s.price,
        s.currency,
        s.expiryDate.split('T')[0],
        s.status,
      ])
    );
    toast('Subscription ledger exported', { variant: 'info' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Administration', 'Billing & Subscriptions']}
        title="Subscription & Billing Engine"
        subtitle="Manage SaaS contracts, monitor grace periods, and verify B2B offline bank or mobile money deposits."
        meta={<SampleDataBadge />}
        actions={
          <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveSubTab('contracts')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === 'contracts'
                  ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs font-semibold'
                  : 'text-[#78837D] dark:text-[#92A199]'
              }`}
            >
              Contracts ({subscriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('verification')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'verification'
                  ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs font-semibold'
                  : 'text-[#78837D] dark:text-[#92A199]'
              }`}
            >
              <span>Payment Queue</span>
              {pendingPaymentsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[#C6A15B]/20 text-[#173F35] dark:text-[#C6A15B] font-mono text-[10px] font-bold">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('plans')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === 'plans'
                  ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs font-semibold'
                  : 'text-[#78837D] dark:text-[#92A199]'
              }`}
            >
              Plan Tiers
            </button>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Contracts"
          value={activeSubsCount}
          helper={`${subscriptions.length} total tenant agreements`}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Normalized ETB MRR"
          value={formatCurrency(Math.round(mrrETB), 'ETB', 'Br')}
          helper="Recurring monthly base"
          icon={TrendingUp}
        />
        <KpiCard
          label="Grace Period Watch"
          value={graceSubsCount}
          deltaTone={graceSubsCount > 0 ? 'warning' : 'neutral'}
          helper="Expiring agreements"
          icon={Clock}
        />
        <KpiCard
          label="Pending Receipts"
          value={pendingPaymentsCount}
          deltaTone={pendingPaymentsCount > 0 ? 'warning' : 'positive'}
          helper="Bank & Telebirr submissions"
          icon={CreditCard}
          onClick={() => setActiveSubTab('verification')}
        />
      </div>

      {/* TAB 1: HOTEL CONTRACTS */}
      {activeSubTab === 'contracts' && (
        <DataTable
          data={filteredContracts}
          columns={contractColumns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search property name or plan..."
          searchFilter={(s, q) =>
            s.hotelName.toLowerCase().includes(q) ||
            s.planName.toLowerCase().includes(q) ||
            s.hotelId.toLowerCase().includes(q)
          }
          filterToolbar={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'grace_period' | 'suspended')}
              className="px-3 py-1.5 text-xs seam-input"
              aria-label="Filter contracts by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="grace_period">Grace Period</option>
              <option value="suspended">Suspended</option>
            </select>
          }
          onExportCsv={handleExportContracts}
          emptyTitle="No matching subscription contracts"
          emptyDescription="Adjust your search or status filter to inspect other property contracts."
        />
      )}

      {/* TAB 2: PAYMENT VERIFICATION QUEUE */}
      {activeSubTab === 'verification' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] flex items-start gap-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                B2B Offline Payment Verification Queue
              </p>
              <p className="mt-0.5 text-[#78837D] dark:text-[#92A199]">
                Properties paying via Commercial Bank of Ethiopia (CBE), Telebirr, or bank transfer submit transaction references here. Verifying automatically extends subscription expiry and restores suspended tenants.
              </p>
            </div>
          </div>

          <DataTable
            data={payments}
            columns={paymentColumns}
            keyExtractor={(p) => p.id}
            searchPlaceholder="Search receipt reference, hotel, or tx ID..."
            searchFilter={(p, q) =>
              p.referenceNumber.toLowerCase().includes(q) ||
              p.hotelName.toLowerCase().includes(q) ||
              p.paymentReference.toLowerCase().includes(q)
            }
            emptyTitle="Payment queue is clear"
            emptyDescription="No offline deposit receipts have been submitted yet."
          />
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION PLAN DEFINITIONS */}
      {activeSubTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SUBSCRIPTION_PLANS.filter((p) => p.id !== 'custom').map((plan) => (
            <div
              key={plan.id}
              className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h2 className="font-semibold text-base text-[#202B27] dark:text-[#ECF1EE] capitalize">
                      {isAm && plan.nameAm ? plan.nameAm : plan.name}
                    </h2>
                    <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
                      {isAm && plan.targetAudienceAm ? plan.targetAudienceAm : plan.targetAudience}
                    </p>
                  </div>
                  <StatusBadge label="Standard Tier" tone="forest" showIcon={false} />
                </div>

                <div className="mt-4 pb-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
                  <div className="text-xl font-semibold font-mono text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                    {formatCurrency(plan.monthlyPriceETB, 'ETB', 'Br')}{' '}
                    <span className="text-xs font-sans font-normal text-[#78837D]">/ month</span>
                  </div>
                  <div className="text-xs font-mono font-medium text-[#173F35] dark:text-[#C6A15B] tabular-nums mt-0.5">
                    {formatCurrency(plan.monthlyPriceUSD, 'USD', '$')} USD / month
                  </div>
                  <div className="text-[10px] text-[#78837D] mt-0.5">
                    {TAX_AND_PAYROLL_CONFIG.usdToEtbRateNote}
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-[#202B27] dark:text-[#ECF1EE]">
                  {(isAm && plan.featuresAm ? plan.featuresAm : plan.features).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#647B52] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] text-[11px] text-[#78837D] font-mono flex justify-between">
                <span>{isAm ? `ከፍተኛ ${plan.maxRooms} ክፍሎች` : `Max ${plan.maxRooms} Rooms`}</span>
                <span>{isAm ? `ከፍተኛ ${plan.maxUsers} ተጠቃሚዎች` : `Max ${plan.maxUsers} Users`}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extend Subscription Term Modal */}
      <Modal
        open={Boolean(extendingSub)}
        onClose={() => setExtendingSub(null)}
        title="Extend Subscription Term"
        subtitle={extendingSub?.hotelName}
        maxWidthClass="max-w-md"
      >
        {extendingSub && (
          <form onSubmit={handleConfirmExtension} className="space-y-4 text-xs">
            <div className="p-3 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{extendingSub.hotelName}</div>
              <div className="text-[11px] text-[#78837D] mt-0.5">
                Current Expiry: <span className="font-mono">{formatShortDate(extendingSub.expiryDate)}</span>
              </div>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1.5">
                Extension Duration *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 90, 365].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExtendDays(days)}
                    className={`p-2 rounded-lg border font-semibold text-xs transition-colors ${
                      extendDays === days
                        ? 'border-[#173F35] dark:border-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B]'
                        : 'border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] dark:text-[#92A199]'
                    }`}
                  >
                    +{days} Days {days === 365 && '(1 Yr)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Audit Notes / Justification
              </label>
              <input
                type="text"
                placeholder="e.g. Contract renewed under annual agreement."
                value={extendNotes}
                onChange={(e) => setExtendNotes(e.target.value)}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
              <button
                type="button"
                onClick={() => setExtendingSub(null)}
                className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium text-[#202B27] dark:text-[#ECF1EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
              >
                Confirm Extension
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Verify Payment Modal */}
      <Modal
        open={Boolean(verifyingPayment)}
        onClose={() => setVerifyingPayment(null)}
        title="Verify Payment Receipt"
        subtitle={verifyingPayment?.referenceNumber}
        maxWidthClass="max-w-md"
        footer={
          verifyingPayment && (
            <>
              <button
                type="button"
                onClick={() => setVerifyingPayment(null)}
                className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmVerification(verifyingPayment)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white text-xs font-semibold"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Confirm &amp; Extend</span>
              </button>
            </>
          )
        }
      >
        {verifyingPayment && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg space-y-1.5">
              <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{verifyingPayment.hotelName}</div>
              <div className="text-[#78837D] flex justify-between">
                <span>Amount</span>
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(verifyingPayment.amount, verifyingPayment.currency)}
                </span>
              </div>
              <div className="text-[#78837D] flex justify-between">
                <span>Method</span>
                <span className="capitalize text-[#202B27] dark:text-[#ECF1EE]">
                  {verifyingPayment.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[#78837D] flex justify-between">
                <span>Bank / Tx Ref</span>
                <span className="font-mono text-[#202B27] dark:text-[#ECF1EE]">
                  {verifyingPayment.paymentReference}
                </span>
              </div>
            </div>

            <p className="text-[#78837D] dark:text-[#92A199] leading-relaxed">
              Confirming verification marks this payment settled, advances the subscription expiry by the selected term, and immediately restores access if suspended.
            </p>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Advance Subscription Term By
              </label>
              <select
                value={verifyExtendDays}
                onChange={(e) => setVerifyExtendDays(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 seam-input"
              >
                <option value={30}>+30 Days (1 Month)</option>
                <option value={90}>+90 Days (1 Quarter)</option>
                <option value={365}>+365 Days (1 Year)</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
