/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Tenants Management Directory and 3-Step Registration Wizard
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { firestoreSync } from '../../services/firestoreSync';
import { Hotel, SubscriptionPlanId, SystemModuleId } from '../../types/saas';
import { SUBSCRIPTION_PLANS, SYSTEM_MODULES } from '../../constants/saasDefaults';
import { PageHeader, KpiCard, StatusBadge, Modal, EmptyState, SampleDataBadge } from '../ui';
import { formatCurrency } from '../../utils/formatters';
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Globe,
  Layers,
} from 'lucide-react';

interface HotelManagementProps {
  onOpenCreateHotel?: () => void;
}

export const HotelManagement: React.FC<HotelManagementProps> = () => {
  const { hotels, refreshHotels, user, loginAsHotelAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'grace_period' | 'suspended'>('all');
  const subscriptions = saasStorage.getSubscriptions();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectHotel, setInspectHotel] = useState<Hotel | null>(null);
  const [suspendingHotel, setSuspendingHotel] = useState<Hotel | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // 3-step wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newHotelIdentity, setNewHotelIdentity] = useState({
    name: '',
    legalName: '',
    code: '',
    logoUrl: '',
    street: '',
    city: '',
    stateRegion: '',
    country: 'Ethiopia',
    phone: '',
    email: '',
    website: '',
    currency: 'ETB',
    currencySymbol: 'Br',
    timeZone: 'Africa/Addis_Ababa',
    totalRooms: 50,
  });

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('standard');
  const [selectedModules, setSelectedModules] = useState<SystemModuleId[]>([
    'front_office',
    'housekeeping',
    'f_and_b',
    'kitchen_control',
    'stores_inventory',
    'finance_accounts',
    'purchasing_approval',
    'maintenance',
    'security',
    'guest_complaints',
    'reporting_bi',
  ]);

  const [newAdminInfo, setNewAdminInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    initialPassword: 'TempPassword2026!',
  });

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        h.name.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        h.address.city.toLowerCase().includes(q) ||
        h.address.country.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || h.subscriptionStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [hotels, searchTerm, statusFilter]);

  const activeCount = hotels.filter((h) => h.subscriptionStatus === 'active').length;
  const graceCount = hotels.filter((h) => h.subscriptionStatus === 'grace_period').length;
  const suspendedCount = hotels.filter((h) => h.status === 'suspended' || h.subscriptionStatus === 'suspended').length;
  const totalRooms = hotels.reduce((sum, h) => sum + (h.operationalSettings?.totalRooms || 0), 0);

  // Handle plan select in wizard
  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    setSelectedPlanId(planId);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (plan) {
      setSelectedModules(plan.includedModules);
    }
  };

  const handleToggleModule = (modId: SystemModuleId) => {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Submit new hotel creation
  const handleCreateHotelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelIdentity.name.trim() || !newHotelIdentity.code.trim() || !newAdminInfo.email.trim() || !newAdminInfo.fullName.trim()) {
      toast('Missing required fields', {
        description: 'Complete hotel identity and initial administrator email and name before registering.',
        variant: 'error',
      });
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];

    const created = saasStorage.createHotelWithAdmin(
      {
        name: newHotelIdentity.name.trim(),
        legalName: newHotelIdentity.legalName.trim() || newHotelIdentity.name.trim(),
        code: newHotelIdentity.code.trim().toUpperCase(),
        logoUrl: newHotelIdentity.logoUrl.trim() || undefined,
        address: {
          street: newHotelIdentity.street.trim(),
          city: newHotelIdentity.city.trim(),
          stateRegion: newHotelIdentity.stateRegion.trim(),
          country: newHotelIdentity.country.trim(),
        },
        contact: {
          phone: newHotelIdentity.phone.trim(),
          email: newHotelIdentity.email.trim() || newAdminInfo.email.trim(),
          website: newHotelIdentity.website.trim() || undefined,
        },
        operationalSettings: {
          currency: newHotelIdentity.currency,
          currencySymbol: newHotelIdentity.currencySymbol,
          timeZone: newHotelIdentity.timeZone,
          defaultLanguage: 'en',
          fiscalYearStartMonth: 7,
          totalRooms: Number(newHotelIdentity.totalRooms) || 30,
          vatRate: 15,
          serviceChargeRate: 10,
        },
        subscriptionPlan: selectedPlanId,
        subscriptionStatus: 'active',
        enabledModules: selectedModules,
        limits: {
          maxUsers: plan.maxUsers,
          maxRooms: plan.maxRooms,
          maxOutlets: plan.maxOutlets,
          storageLimitMb: 5000,
        },
        status: 'active',
      },
      newAdminInfo,
      {
        email: user?.email || 'admin@seam.io',
        fullName: user?.fullName || 'Super Admin',
        role: 'super_admin',
      }
    );

    void firestoreSync.upsertAccessGrant({
      email: created.adminUser.email,
      fullName: created.adminUser.fullName,
      hotelId: created.hotel.id,
      role: 'hotel_admin',
      departmentName: created.adminUser.departmentName,
      employeeId: created.adminUser.employeeId,
      status: 'active',
      grantedByRole: 'super_admin',
    });

    refreshHotels();
    toast('Hotel property onboarded', {
      description: `${newHotelIdentity.name} (${newHotelIdentity.code.toUpperCase()}) provisioned with ${selectedModules.length} modules.`,
      variant: 'success',
    });
    setIsCreateOpen(false);
    setWizardStep(1);
    setNewHotelIdentity({
      name: '',
      legalName: '',
      code: '',
      logoUrl: '',
      street: '',
      city: '',
      stateRegion: '',
      country: 'Ethiopia',
      phone: '',
      email: '',
      website: '',
      currency: 'ETB',
      currencySymbol: 'Br',
      timeZone: 'Africa/Addis_Ababa',
      totalRooms: 50,
    });
    setNewAdminInfo({
      fullName: '',
      email: '',
      phone: '',
      initialPassword: 'TempPassword2026!',
    });
  };

  // Toggle Suspend / Reactivate
  const handleConfirmSuspension = () => {
    if (!suspendingHotel) return;
    if (!suspendReason.trim()) {
      toast('Audit reason required', {
        description: 'Provide a clear governance reason before changing tenant status.',
        variant: 'warning',
      });
      return;
    }

    const actor = {
      email: user?.email || 'admin@seam.io',
      fullName: user?.fullName || 'Super Admin',
      role: 'super_admin',
    };

    const wasSuspended = suspendingHotel.status === 'suspended';

    saasStorage.updateSubscriptionStatus(
      suspendingHotel.subscriptionId,
      wasSuspended ? 'active' : 'suspended',
      suspendReason.trim(),
      actor
    );

    refreshHotels();
    toast(wasSuspended ? 'Property access restored' : 'Property tenant suspended', {
      description: `${suspendingHotel.name} status updated and logged to audit trail.`,
      variant: wasSuspended ? 'success' : 'warning',
    });
    setSuspendingHotel(null);
    setSuspendReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Administration', 'Hotel Tenants']}
        title="Hotel Tenant Directory"
        subtitle="Onboard independent hotel properties, enforce multi-tenant boundaries, and govern subscription lifecycles."
        meta={<SampleDataBadge />}
        actions={
          <button
            type="button"
            onClick={() => {
              setWizardStep(1);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Register New Hotel</span>
          </button>
        }
      />

      {/* Tenant Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Registered Tenants"
          value={hotels.length}
          helper={`${totalRooms} configured guest rooms`}
          icon={Building2}
        />
        <KpiCard
          label="Active Subscriptions"
          value={activeCount}
          delta={`${hotels.length ? Math.round((activeCount / hotels.length) * 100) : 0}%`}
          deltaTone="positive"
          helper="Full operational access"
          icon={CheckCircle2}
        />
        <KpiCard
          label="In Grace Period"
          value={graceCount}
          deltaTone={graceCount > 0 ? 'warning' : 'neutral'}
          helper="Renewal confirmation pending"
          icon={Clock}
        />
        <KpiCard
          label="Suspended Tenants"
          value={suspendedCount}
          deltaTone={suspendedCount > 0 ? 'critical' : 'neutral'}
          helper="Data preserved, login locked"
          icon={Ban}
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3.5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search hotel name, code, city, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs seam-input"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg text-xs font-medium overflow-x-auto">
          {(
            [
              { id: 'all', label: `All (${hotels.length})` },
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'grace_period', label: `Grace Period (${graceCount})` },
              { id: 'suspended', label: `Suspended (${suspendedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs font-semibold'
                  : 'text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hotel Cards Grid */}
      {filteredHotels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No matching hotel properties"
          description="Adjust your search term or status filter, or onboard a new property tenant."
          action={
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHotels.map((h) => {
            const sub = subscriptions.find((s) => s.hotelId === h.id);
            const maxRooms = h.limits?.maxRooms || h.operationalSettings.totalRooms || 1;
            const roomPct = Math.min(100, Math.round((h.operationalSettings.totalRooms / maxRooms) * 100));
            const effectiveStatus = h.status === 'suspended' ? 'suspended' : h.subscriptionStatus;
            const tone =
              effectiveStatus === 'active'
                ? 'success'
                : effectiveStatus === 'grace_period'
                ? 'warning'
                : 'critical';

            return (
              <div
                key={h.id}
                className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] hover:border-[#647B52]/60 dark:hover:border-[#7B9666]/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {h.logoUrl ? (
                        <img
                          src={h.logoUrl}
                          alt={h.name}
                          className="w-11 h-11 rounded-lg object-cover border border-[#E6EBE7] dark:border-[#22322C] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE] break-words">
                          {h.name}
                        </h2>
                        <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5">
                          <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">{h.code}</span> ·{' '}
                          {h.address.city}, {h.address.country}
                        </div>
                      </div>
                    </div>
                    <StatusBadge label={effectiveStatus.replace('_', ' ')} tone={tone} />
                  </div>

                  {/* Specs overview */}
                  <div className="mt-4 pt-3.5 border-t border-[#E6EBE7] dark:border-[#22322C] grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#F6F8F6] dark:bg-[#192622]">
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199] block">
                        Plan
                      </span>
                      <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] capitalize mt-0.5 block">
                        {h.subscriptionPlan}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F6F8F6] dark:bg-[#192622]">
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199] block">
                        Rooms
                      </span>
                      <span className="font-semibold font-mono tabular-nums text-[#202B27] dark:text-[#ECF1EE] mt-0.5 block">
                        {h.operationalSettings.totalRooms} / {maxRooms}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F6F8F6] dark:bg-[#192622]">
                      <span className="text-[10px] text-[#78837D] dark:text-[#92A199] block">
                        Currency
                      </span>
                      <span className="font-semibold font-mono text-[#202B27] dark:text-[#ECF1EE] mt-0.5 block">
                        {h.operationalSettings.currency}
                      </span>
                    </div>
                  </div>

                  {/* Room Capacity & Module Provisioning */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#78837D] dark:text-[#92A199]">
                      <span>Room Capacity</span>
                      <span className="font-mono tabular-nums font-medium text-[#202B27] dark:text-[#ECF1EE]">
                        {roomPct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#E6EBE7] dark:bg-[#22322C] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          roomPct >= 90 ? 'bg-[#C6A15B]' : 'bg-[#173F35] dark:bg-[#647B52]'
                        }`}
                        style={{ width: `${roomPct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-[#78837D] dark:text-[#92A199] flex items-center justify-between pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#647B52]" />
                        <span>Modules Provisioned</span>
                      </span>
                      <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                        {h.enabledModules.length} / {SYSTEM_MODULES.length}
                      </span>
                    </div>
                    {sub?.expiryDate && (
                      <div className="text-[11px] font-mono tabular-nums text-[#78837D] dark:text-[#92A199] flex items-center justify-between">
                        <span className="capitalize">{sub.billingCycle}</span>
                        <span>
                          {h.subscriptionStatus === 'grace_period' && sub.gracePeriodEndsAt
                            ? `Grace ends ${sub.gracePeriodEndsAt.split('T')[0]}`
                            : `Renews ${sub.expiryDate.split('T')[0]}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsHotelAdmin(h.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#173F35] dark:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                    title="Inspect operational workspace as this property's Hotel Admin"
                  >
                    <span>Launch Property</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setInspectHotel(h)}
                      className="p-1.5 rounded-lg text-[#78837D] hover:text-[#202B27] dark:hover:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                      title="Inspect Tenant Record"
                      aria-label={`Inspect ${h.name}`}
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSuspendingHotel(h);
                        setSuspendReason('');
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        h.status === 'suspended'
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                      title={h.status === 'suspended' ? 'Reactivate Tenant' : 'Suspend Tenant'}
                      aria-label={h.status === 'suspended' ? `Reactivate ${h.name}` : `Suspend ${h.name}`}
                    >
                      {h.status === 'suspended' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3-Step Create Hotel Wizard Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Hotel Property"
        subtitle={`Step ${wizardStep} of 3: ${
          wizardStep === 1
            ? 'Property Identity & Localization'
            : wizardStep === 2
            ? 'Subscription Tier & Module Entitlements'
            : 'Initial Hotel Administrator Provisioning'
        }`}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateHotelSubmit} className="space-y-5">
          {/* Step Progress Bar */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { step: 1, label: '1. Property Identity' },
              { step: 2, label: '2. Plan & Modules' },
              { step: 3, label: '3. Admin Account' },
            ].map((s) => (
              <div key={s.step} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    wizardStep >= s.step ? 'bg-[#173F35] dark:bg-[#C6A15B]' : 'bg-[#E6EBE7] dark:bg-[#22322C]'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium block ${
                    wizardStep === s.step
                      ? 'text-[#173F35] dark:text-[#C6A15B] font-semibold'
                      : 'text-[#78837D] dark:text-[#92A199]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: IDENTITY & LOCATION */}
          {wizardStep === 1 && (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Hotel Commercial Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Highland Ridge Sanctuary"
                    value={newHotelIdentity.name}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, name: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Unique Property Code (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HRS01"
                    value={newHotelIdentity.code}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 seam-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Legal Business Entity Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Highland Hospitality PLC"
                    value={newHotelIdentity.legalName}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, legalName: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Property Logo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newHotelIdentity.logoUrl}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Addis Ababa"
                    value={newHotelIdentity.city}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, city: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHotelIdentity.country}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, country: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Total Guest Rooms *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newHotelIdentity.totalRooms}
                    onChange={(e) =>
                      setNewHotelIdentity({ ...newHotelIdentity, totalRooms: parseInt(e.target.value, 10) || 10 })
                    }
                    className="w-full px-3 py-2 seam-input font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Operating Currency *
                  </label>
                  <select
                    value={newHotelIdentity.currency}
                    onChange={(e) => {
                      const curr = e.target.value;
                      const sym = curr === 'ETB' ? 'Br' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr;
                      setNewHotelIdentity({ ...newHotelIdentity, currency: curr, currencySymbol: sym });
                    }}
                    className="w-full px-3 py-2 seam-input"
                  >
                    <option value="ETB">Ethiopian Birr (ETB - Br)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                    <option value="EUR">Euro (EUR - €)</option>
                    <option value="KES">Kenyan Shilling (KES)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Time Zone *
                  </label>
                  <select
                    value={newHotelIdentity.timeZone}
                    onChange={(e) => setNewHotelIdentity({ ...newHotelIdentity, timeZone: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  >
                    <option value="Africa/Addis_Ababa">East Africa Time (Africa/Addis_Ababa, UTC+3)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option>
                    <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUBSCRIPTION PLAN & MODULES */}
          {wizardStep === 2 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-2">
                  Select Subscription Tier *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SUBSCRIPTION_PLANS.filter((p) => p.id !== 'custom').map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`p-3.5 rounded-[10px] border text-left transition-colors ${
                        selectedPlanId === plan.id
                          ? 'border-[#173F35] dark:border-[#C6A15B] bg-[#F6F8F6] dark:bg-[#192622]'
                          : 'border-[#E6EBE7] dark:border-[#22322C] hover:border-[#647B52]'
                      }`}
                    >
                      <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] capitalize">{plan.name}</div>
                      <div className="text-[11px] font-mono font-semibold text-[#173F35] dark:text-[#C6A15B] mt-1 tabular-nums">
                        {newHotelIdentity.currency === 'ETB'
                          ? `${formatCurrency(plan.monthlyPriceETB, 'ETB', 'Br')}/mo`
                          : `${formatCurrency(plan.monthlyPriceUSD, 'USD', '$')}/mo`}
                      </div>
                      <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-1">
                        Up to {plan.maxRooms} Rooms · {plan.maxUsers} Users
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE]">
                    Enabled Operational Modules ({selectedModules.length} selected)
                  </label>
                  <span className="text-[11px] text-[#78837D]">Customizable per contract</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto p-2.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C]">
                  {SYSTEM_MODULES.map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white dark:hover:bg-[#131D1A] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(mod.id)}
                        onChange={() => handleToggleModule(mod.id)}
                        className="rounded border-[#E6EBE7] text-[#173F35] focus:ring-[#173F35]"
                      />
                      <span className="text-[#202B27] dark:text-[#ECF1EE] text-xs font-medium">{mod.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FIRST HOTEL ADMIN USER */}
          {wizardStep === 3 && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#173F35] dark:text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">Initial Hotel Administrator Account</p>
                  <p className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5">
                    Provisioned with full Hotel Admin privileges to configure departments, staff, outlets, and room inventory.
                  </p>
                </div>
              </div>

              <div>
                <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meron Tadesse"
                  value={newAdminInfo.fullName}
                  onChange={(e) => setNewAdminInfo({ ...newAdminInfo, fullName: e.target.value })}
                  className="w-full px-3 py-2 seam-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Admin Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@property.com"
                    value={newAdminInfo.email}
                    onChange={(e) => setNewAdminInfo({ ...newAdminInfo, email: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+251 91 123 4567"
                    value={newAdminInfo.phone}
                    onChange={(e) => setNewAdminInfo({ ...newAdminInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 seam-input"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                  Temporary Provisioning Password *
                </label>
                <input
                  type="text"
                  required
                  value={newAdminInfo.initialPassword}
                  onChange={(e) => setNewAdminInfo({ ...newAdminInfo, initialPassword: e.target.value })}
                  className="w-full px-3 py-2 seam-input font-mono"
                />
                <span className="text-[11px] text-[#78837D] mt-1 block">
                  First-login password rotation is enforced for tenant security.
                </span>
              </div>
            </div>
          )}

          {/* Step Navigation Footer */}
          <div className="pt-4 border-t border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
            {wizardStep > 1 ? (
              <button
                type="button"
                onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div />
            )}

            {wizardStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (wizardStep === 1 && (!newHotelIdentity.name.trim() || !newHotelIdentity.code.trim())) {
                    toast('Required fields missing', {
                      description: 'Enter both the commercial property name and unique hotel code to proceed.',
                      variant: 'warning',
                    });
                    return;
                  }
                  setWizardStep((prev) => (prev + 1) as 2 | 3);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs"
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs"
              >
                <Check className="w-4 h-4 text-[#C6A15B]" /> Finalize Registration
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Inspect Hotel Organization Modal */}
      <Modal
        open={Boolean(inspectHotel)}
        onClose={() => setInspectHotel(null)}
        title="Hotel Organization Record"
        subtitle={inspectHotel ? `${inspectHotel.legalName} · Code ${inspectHotel.code}` : undefined}
        maxWidthClass="max-w-lg"
        footer={
          inspectHotel && (
            <>
              <button
                type="button"
                onClick={() => {
                  const id = inspectHotel.id;
                  setInspectHotel(null);
                  loginAsHotelAdmin(id);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white text-xs font-semibold"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setInspectHotel(null)}
                className="px-4 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              >
                Close
              </button>
            </>
          )
        }
      >
        {inspectHotel && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {inspectHotel.logoUrl ? (
                  <img
                    src={inspectHotel.logoUrl}
                    alt={inspectHotel.name}
                    className="w-11 h-11 rounded-lg object-cover border border-[#E6EBE7] dark:border-[#22322C]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-center text-[#173F35] dark:text-[#C6A15B]">
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm text-[#202B27] dark:text-[#ECF1EE]">{inspectHotel.name}</h3>
                  <p className="text-[#78837D] dark:text-[#92A199]">
                    Tenant ID: <span className="font-mono">{inspectHotel.id}</span>
                  </p>
                </div>
              </div>
              <StatusBadge
                label={inspectHotel.subscriptionStatus.replace('_', ' ')}
                tone={
                  inspectHotel.subscriptionStatus === 'active'
                    ? 'success'
                    : inspectHotel.subscriptionStatus === 'grace_period'
                    ? 'warning'
                    : 'critical'
                }
              />
            </div>

            <div className="p-3.5 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-lg space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-[#78837D]">Address</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] text-right">
                  {[inspectHotel.address.street, inspectHotel.address.city, inspectHotel.address.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#78837D]">Contact</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] text-right">
                  {inspectHotel.contact.phone} · {inspectHotel.contact.email}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#78837D]">Operating Currency</span>
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {inspectHotel.operationalSettings.currency} ({inspectHotel.operationalSettings.currencySymbol})
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#78837D]">Configured Guest Rooms</span>
                <span className="font-mono font-semibold text-[#202B27] dark:text-[#ECF1EE] tabular-nums">
                  {inspectHotel.operationalSettings.totalRooms} Rooms
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#78837D]">Time Zone</span>
                <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#647B52]" />
                  {inspectHotel.operationalSettings.timeZone}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#78837D]">Fiscal Year Start</span>
                <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
                  Month {inspectHotel.operationalSettings.fiscalYearStartMonth}
                </span>
              </div>
            </div>

            <div>
              <span className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-2">
                Active Modules ({inspectHotel.enabledModules.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectHotel.enabledModules.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-1 rounded-md bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[11px] text-[#202B27] dark:text-[#ECF1EE] capitalize"
                  >
                    {m.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Suspend / Reactivate Confirmation Modal */}
      <Modal
        open={Boolean(suspendingHotel)}
        onClose={() => setSuspendingHotel(null)}
        title={suspendingHotel?.status === 'suspended' ? 'Reactivate Hotel Tenant' : 'Suspend Hotel Tenant'}
        subtitle={suspendingHotel?.name}
        maxWidthClass="max-w-md"
        footer={
          suspendingHotel && (
            <>
              <button
                type="button"
                onClick={() => setSuspendingHotel(null)}
                className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] text-xs font-medium text-[#202B27] dark:text-[#ECF1EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspension}
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold ${
                  suspendingHotel.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {suspendingHotel.status === 'suspended' ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </>
          )
        }
      >
        {suspendingHotel && (
          <div className="space-y-4 text-xs">
            <p className="text-[#78837D] dark:text-[#92A199] leading-relaxed">
              {suspendingHotel.status === 'suspended'
                ? `Restoring platform access for "${suspendingHotel.name}". Staff will immediately be able to log in and resume daily operations.`
                : `Suspending "${suspendingHotel.name}" locks property login access while keeping all financial ledgers, folios, and audit records 100% intact.`}
            </p>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
                Governance Reason / Audit Note *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Reason for suspension or reactivation..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
