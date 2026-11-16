/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Subscription Health & Offline Payment Receipt Submission View
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { SubscriptionPayment, PaymentMethod } from '../../types/saas';
import { PageHeader, DataTable, DataTableColumn, StatusBadge, Modal } from '../ui';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { Receipt } from 'lucide-react';

export const HotelSubscriptionView: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast } = useToast();

  const subscription = activeHotel ? saasStorage.getSubscriptionByHotelId(activeHotel.id) : undefined;
  const [payments, setPayments] = useState<SubscriptionPayment[]>(() =>
    activeHotel ? saasStorage.getPayments().filter((p) => p.hotelId === activeHotel.id) : []
  );

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: subscription?.price || 5000,
    paymentMethod: 'cbe_birr' as PaymentMethod,
    paymentReference: '',
    notes: '',
  });

  useEffect(() => {
    if (!activeHotel) return;
    const sub = saasStorage.getSubscriptionByHotelId(activeHotel.id);
    setPayments(saasStorage.getPayments().filter((p) => p.hotelId === activeHotel.id));
    setPaymentForm((prev) => ({ ...prev, amount: sub?.price || prev.amount }));
  }, [activeHotel?.id]);

  if (!activeHotel) return null;

  const isInGrace = activeHotel.subscriptionStatus === 'grace_period';

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.paymentReference.trim() || !paymentForm.amount || !subscription) return;

    saasStorage.recordManualPayment(
      {
        subscriptionId: subscription.id,
        hotelId: activeHotel.id,
        hotelName: activeHotel.name,
        amount: Number(paymentForm.amount),
        currency: activeHotel.operationalSettings.currency,
        billingPeriodStart: new Date().toISOString(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: paymentForm.paymentMethod,
        paymentReference: paymentForm.paymentReference.trim(),
        notes: paymentForm.notes.trim() || undefined,
      },
      {
        email: user?.email || 'admin@hotel.com',
        fullName: user?.fullName || 'Hotel Admin',
        role: user?.role || 'hotel_admin',
      }
    );

    setPayments(saasStorage.getPayments().filter((p) => p.hotelId === activeHotel.id));
    setIsSubmitOpen(false);
    setPaymentForm({
      amount: subscription?.price || 5000,
      paymentMethod: 'cbe_birr',
      paymentReference: '',
      notes: '',
    });

    toast('Renewal slip submitted', {
      description: 'Platform finance team has received your deposit reference for verification.',
      variant: 'success',
    });
  };

  const columns: DataTableColumn<SubscriptionPayment>[] = [
    {
      key: 'referenceNumber',
      header: 'Receipt Reference',
      sortable: true,
      sortValue: (p) => p.referenceNumber,
      render: (p) => (
        <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">{p.referenceNumber}</span>
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
      header: 'Payment Method',
      render: (p) => (
        <span className="capitalize text-[#202B27] dark:text-[#ECF1EE]">
          {p.paymentMethod.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'paymentReference',
      header: 'Transaction / Slip ID',
      render: (p) => <span className="font-mono text-[11px] text-[#78837D]">{p.paymentReference}</span>,
    },
    {
      key: 'createdAt',
      header: 'Submitted Date',
      sortable: true,
      sortValue: (p) => p.createdAt,
      render: (p) => <span className="font-mono text-[#78837D]">{formatShortDate(p.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortable: true,
      sortValue: (p) => p.status,
      render: (p) => (
        <StatusBadge
          label={p.status.replace('_', ' ')}
          tone={p.status === 'verified' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Subscription & Billing']}
        title="Subscription Health & Billing"
        subtitle="Monitor plan renewal dates, grace period countdowns, and submit bank or mobile money renewal receipts."
        actions={
          <button
            type="button"
            onClick={() => setIsSubmitOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs whitespace-nowrap"
          >
            <Receipt className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Submit Renewal Slip</span>
          </button>
        }
      />

      {/* Active Subscription Card */}
      {subscription && (
        <div className="p-5 sm:p-6 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-[#647B52] uppercase tracking-wider block">
                Current Subscription Plan
              </span>
              <h2 className="text-2xl font-semibold text-[#202B27] dark:text-[#ECF1EE] capitalize mt-0.5">
                {subscription.planName}
              </h2>
              <p className="text-xs text-[#78837D] mt-1">
                Contract Rate:{' '}
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {formatCurrency(subscription.price, subscription.currency)}
                </span>{' '}
                / {subscription.billingCycle}
              </p>
            </div>

            <StatusBadge
              label={subscription.status.replace('_', ' ')}
              tone={isInGrace ? 'warning' : 'success'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E6EBE7] dark:border-[#22322C] text-xs">
            <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-[#E6EBE7] dark:border-[#22322C]">
              <span className="text-[11px] text-[#78837D] block">Term Expiry Date</span>
              <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm mt-1 block">
                {formatShortDate(subscription.expiryDate)}
              </span>
            </div>

            <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-[#E6EBE7] dark:border-[#22322C]">
              <span className="text-[11px] text-[#78837D] block">Configured Grace Window</span>
              <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm mt-1 block">
                {subscription.gracePeriodDays} Days
              </span>
            </div>

            <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] rounded-lg border border-[#E6EBE7] dark:border-[#22322C]">
              <span className="text-[11px] text-[#78837D] block">Grace Cutoff Date</span>
              <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] text-sm mt-1 block">
                {formatShortDate(subscription.gracePeriodEndsAt)}
              </span>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={payments}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search receipt or transaction reference..."
        searchFilter={(p, q) =>
          p.referenceNumber.toLowerCase().includes(q) ||
          p.paymentReference.toLowerCase().includes(q) ||
          p.paymentMethod.toLowerCase().includes(q)
        }
        emptyTitle="No payment receipts recorded"
        emptyDescription="Submit an offline bank deposit or Telebirr receipt whenever renewing your subscription."
      />

      <Modal
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Submit Renewal Payment Receipt"
        subtitle={activeHotel.name}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Amount Deposited ({activeHotel.operationalSettings.currency}) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 seam-input font-mono font-semibold tabular-nums"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Payment Method *
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
              className="w-full px-3 py-2 seam-input"
            >
              <option value="cbe_birr">Commercial Bank of Ethiopia (CBE Deposit/Transfer)</option>
              <option value="telebirr">Telebirr Business Payment</option>
              <option value="bank_transfer">International Bank Wire (SWIFT)</option>
              <option value="manual_cash">Cash Office Deposit</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Bank Reference Number / Transaction ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CBE-FT-99201481"
              value={paymentForm.paymentReference}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
              className="w-full px-3 py-2 seam-input font-mono"
            />
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Additional Notes
            </label>
            <input
              type="text"
              placeholder="Depositor name or branch location..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsSubmitOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium text-[#202B27] dark:text-[#ECF1EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Submit for Verification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
