/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Super Admin Platform Administration Overview
 * Authoritative SaaS tenant governance without exposing tenant operational records.
 */

import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';
import { SYSTEM_MODULES } from '../../constants/saasDefaults';
import { TAX_AND_PAYROLL_CONFIG } from '../../config/taxAndPayrollConfig';
import { convertUsdToEtb } from '../../utils/taxAndPayrollCalculator';
import { PageHeader, KpiCard, StatusBadge, EmptyState, SampleDataBadge } from '../ui';
import {
  Building2,
  Clock,
  TrendingUp,
  CreditCard,
  PlusCircle,
  Megaphone,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Server,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateHotel: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigateTab,
  onOpenCreateHotel,
}) => {
  const { hotels, loginAsHotelAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'grace_period' | 'suspended'>('all');
  const subscriptions = saasStorage.getSubscriptions();
  const payments = saasStorage.getPayments();
  const auditLogs = saasStorage.getAuditLogs().slice(0, 6);

  const totalHotels = hotels.length;
  const activeHotels = hotels.filter((h) => h.status === 'active' && h.subscriptionStatus === 'active').length;
  const graceHotels = hotels.filter((h) => h.subscriptionStatus === 'grace_period');
  const suspendedHotels = hotels.filter((h) => h.status === 'suspended' || h.subscriptionStatus === 'suspended');
  const pendingPayments = payments.filter((p) => p.status === 'pending_review');

  const totalRooms = hotels.reduce((acc, h) => acc + (h.operationalSettings?.totalRooms || 0), 0);
  const totalRoomCapacity = hotels.reduce((acc, h) => acc + (h.limits?.maxRooms || 0), 0);

  const mrrETB = subscriptions
    .filter((s) => s.status === 'active' && s.currency === 'ETB')
    .reduce((acc, s) => acc + (s.billingCycle === 'annual' ? s.price / 12 : s.price), 0);

  const mrrUSD = subscriptions
    .filter((s) => s.status === 'active' && s.currency === 'USD')
    .reduce((acc, s) => acc + (s.billingCycle === 'annual' ? s.price / 12 : s.price), 0);

  const totalNormalizedMrrEtb = mrrETB + convertUsdToEtb(mrrUSD);

  const filteredHotels = useMemo(() => {
    if (statusFilter === 'all') return hotels;
    if (statusFilter === 'active') {
      return hotels.filter((h) => h.status === 'active' && h.subscriptionStatus === 'active');
    }
    if (statusFilter === 'grace_period') {
      return hotels.filter((h) => h.subscriptionStatus === 'grace_period');
    }
    return hotels.filter((h) => h.status === 'suspended' || h.subscriptionStatus === 'suspended');
  }, [hotels, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Administration', 'Overview']}
        title="Platform Governance & Tenant Health"
        subtitle="Multi-tenant SaaS provisioning, subscription contracts, payment verification queue, and platform audit logs."
        meta={<SampleDataBadge />}
        actions={
          <>
            <button
              type="button"
              onClick={() => onNavigateTab('announcements')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <Megaphone className="w-3.5 h-3.5 text-[#647B52]" />
              <span>Broadcast</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('payments')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Verify Receipts ({pendingPayments.length})</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateHotel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Onboard Property</span>
            </button>
          </>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Subscribing Properties"
          value={totalHotels}
          delta={`${activeHotels} Active`}
          deltaTone="positive"
          helper={`${totalRooms} / ${totalRoomCapacity || totalRooms} room capacity`}
          icon={Building2}
          onClick={() => onNavigateTab('hotels')}
        />
        <KpiCard
          label="Grace & Suspended Watch"
          value={graceHotels.length}
          delta={`${suspendedHotels.length} Suspended`}
          deltaTone={suspendedHotels.length > 0 ? 'critical' : graceHotels.length > 0 ? 'warning' : 'positive'}
          helper={graceHotels.length > 0 ? 'Action required on renewals' : 'All contracts nominal'}
          icon={Clock}
          onClick={() => onNavigateTab('subscriptions')}
        />
        <KpiCard
          label="Normalized Platform MRR (ETB)"
          value={formatCurrency(Math.round(totalNormalizedMrrEtb), 'ETB', 'Br')}
          delta={`${formatCurrency(Math.round(mrrETB), 'ETB', 'Br')} + ${formatCurrency(convertUsdToEtb(mrrUSD), 'ETB', 'Br')} USD eq.`}
          deltaTone="forest"
          helper={TAX_AND_PAYROLL_CONFIG.usdToEtbRateNote}
          icon={TrendingUp}
          onClick={() => onNavigateTab('subscriptions')}
        />
        <KpiCard
          label="Payment Verification Queue"
          value={pendingPayments.length}
          delta={pendingPayments.length > 0 ? 'Pending Review' : 'Cleared'}
          deltaTone={pendingPayments.length > 0 ? 'warning' : 'positive'}
          helper="Bank & mobile money receipts"
          icon={CreditCard}
          onClick={() => onNavigateTab('payments')}
          actionLabel="Review queue →"
        />
      </div>

      {/* Grace Period Monitoring Banner */}
      {graceHotels.length > 0 && (
        <div className="p-4 rounded-[10px] bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Grace Period Monitoring ({graceHotels.length} Property)
              </div>
              <div className="mt-2 divide-y divide-amber-200/70 dark:divide-amber-900/50">
                {graceHotels.map((gh) => {
                  const sub = subscriptions.find((s) => s.hotelId === gh.id);
                  return (
                    <div key={gh.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{gh.name}</span>
                        <span className="text-[#78837D] dark:text-[#92A199] ml-2 font-mono">
                          {gh.code} · {gh.subscriptionPlan}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono tabular-nums text-amber-800 dark:text-amber-300">
                          Grace ends {sub?.gracePeriodEndsAt ? sub.gracePeriodEndsAt.split('T')[0] : 'Soon'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('subscriptions')}
                          className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium"
                        >
                          Manage Sub
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Directory + System Health & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6EBE7] dark:border-[#22322C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                Tenant Portfolio Overview
              </h2>
              <p className="text-xs text-[#78837D] dark:text-[#92A199]">
                Platform-level property metadata and subscription status
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg text-[11px] font-medium">
                {(
                  [
                    { id: 'all', label: `All (${totalHotels})` },
                    { id: 'active', label: `Active (${activeHotels})` },
                    { id: 'grace_period', label: `Grace Period (${graceHotels.length})` },
                    { id: 'suspended', label: `Suspended (${suspendedHotels.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs font-semibold'
                        : 'text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('hotels')}
                className="text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:underline whitespace-nowrap"
              >
                Manage All ({hotels.length}) →
              </button>
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title={hotels.length === 0 ? 'No hotels registered' : 'No matching hotel properties'}
                description={
                  hotels.length === 0
                    ? 'Onboard your first hotel tenant to provision subscriptions and modules.'
                    : 'No hotel properties match the selected status filter.'
                }
                action={
                  hotels.length === 0 ? (
                    <button
                      type="button"
                      onClick={onOpenCreateHotel}
                      className="px-4 py-2 rounded-lg bg-[#173F35] text-white text-xs font-medium"
                    >
                      Onboard Property
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="px-3.5 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE]"
                    >
                      Reset Filters
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] text-xs">
              {filteredHotels.map((h) => {
                const sub = subscriptions.find((s) => s.hotelId === h.id);
                const maxRooms = h.limits?.maxRooms || h.operationalSettings.totalRooms || 1;
                const roomPct = Math.min(100, Math.round((h.operationalSettings.totalRooms / maxRooms) * 100));
                const effectiveTone =
                  h.status === 'suspended' || h.subscriptionStatus === 'suspended'
                    ? 'critical'
                    : h.subscriptionStatus === 'grace_period'
                    ? 'warning'
                    : 'success';
                const statusLabel =
                  h.status === 'suspended' ? 'suspended' : h.subscriptionStatus.replace('_', ' ');

                return (
                  <div
                    key={h.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F6F8F6]/70 dark:hover:bg-[#192622]/70 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {h.logoUrl ? (
                        <img
                          src={h.logoUrl}
                          alt={h.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E6EBE7] dark:border-[#22322C] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-center text-[#173F35] dark:text-[#C6A15B] shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{h.name}</span>
                          <span className="font-mono text-[11px] text-[#78837D] dark:text-[#92A199]">{h.code}</span>
                          <StatusBadge label={statusLabel} tone={effectiveTone} />
                        </div>
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>
                            {h.address.city}, {h.address.country}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{h.subscriptionPlan}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{h.operationalSettings.currency}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {h.enabledModules.length}/{SYSTEM_MODULES.length} Modules
                          </span>
                          {sub?.expiryDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {h.subscriptionStatus === 'grace_period' && sub.gracePeriodEndsAt
                                  ? `Grace ends ${sub.gracePeriodEndsAt.split('T')[0]}`
                                  : `Renews ${sub.expiryDate.split('T')[0]}`}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 max-w-xs">
                          <div className="flex-1 h-1.5 rounded-full bg-[#E6EBE7] dark:bg-[#22322C] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                roomPct >= 90 ? 'bg-[#C6A15B]' : 'bg-[#173F35] dark:bg-[#647B52]'
                              }`}
                              style={{ width: `${roomPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199] whitespace-nowrap">
                            {h.operationalSettings.totalRooms}/{maxRooms} Rooms ({roomPct}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => loginAsHotelAdmin(h.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
                      >
                        <span>Launch Property</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('hotels')}
                        className="px-2.5 py-1.5 rounded-md border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Platform Usage, System Health & Audit Trail */}
        <div className="space-y-5">
          <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B]" />
                <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  Platform Usage &amp; Isolation
                </h2>
              </div>
              <StatusBadge label="Nominal" tone="success" />
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[#78837D] dark:text-[#92A199]">Room Capacity Allocated</span>
                <span className="font-mono tabular-nums font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {totalRooms} / {totalRoomCapacity || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#78837D] dark:text-[#92A199]">Active Subscriptions</span>
                <span className="font-mono tabular-nums font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  {subscriptions.filter((s) => s.status === 'active').length} / {subscriptions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#78837D] dark:text-[#92A199]">Tenant Data Scope</span>
                <span className="font-medium text-[#173F35] dark:text-[#C6A15B]">Strict hotelId Isolation</span>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#647B52]" />
                <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">Audit Trail</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('audit_logs')}
                className="text-xs text-[#173F35] dark:text-[#C6A15B] hover:underline font-medium"
              >
                Full Ledger →
              </button>
            </div>

            <div className="divide-y divide-[#E6EBE7] dark:divide-[#22322C] text-xs">
              {auditLogs.length === 0 ? (
                <div className="p-5 text-center text-[#78837D]">No audit events recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] truncate">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#78837D] font-mono tabular-nums shrink-0">
                        {log.timestamp.split('T')[0]}
                      </span>
                    </div>
                    <p className="text-[#78837D] dark:text-[#92A199] mt-0.5 line-clamp-2 text-[11px]">
                      {log.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
