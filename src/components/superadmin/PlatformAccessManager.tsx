/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Super Admin Users & Access Control Hub
 * Manages Platform Super Admins, Property Admins, and Cross-Property Staff Privileges
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { firestoreSync } from '../../services/firestoreSync';
import { HotelUser, PlatformUser, UserRole, UserAccountStatus } from '../../types/saas';
import { PageHeader, KpiCard, DataTable, DataTableColumn, StatusBadge, Modal } from '../ui';
import { formatShortDate } from '../../utils/formatters';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Building2,
  KeyRound,
  Ban,
  Trash2,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const BOOTSTRAP_OWNER_EMAIL = 'getman2000@gmail.com';

const PROPERTY_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'hotel_admin', label: 'Property / Hotel Admin' },
  { value: 'owner', label: 'Hotel Owner / Board' },
  { value: 'gm', label: 'General Manager (GM)' },
  { value: 'deputy_gm', label: 'Deputy General Manager' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'dept_head', label: 'Department Head' },
  { value: 'supervisor', label: 'Shift Supervisor' },
  { value: 'senior_staff', label: 'Senior Staff' },
  { value: 'staff', label: 'Operational Staff' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'auditor', label: 'External Auditor' },
];

export const PlatformAccessManager: React.FC = () => {
  const { user, hotels } = useAuth();
  const { toast, confirmAction } = useToast();

  const [activeDirectory, setActiveDirectory] = useState<'property' | 'platform'>('property');
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>(() => saasStorage.getPlatformUsers());
  const [hotelUsers, setHotelUsers] = useState<HotelUser[]>(() => saasStorage.getAllUsers());

  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Grant Super Admin modal
  const [isGrantPlatformOpen, setIsGrantPlatformOpen] = useState(false);
  const [platformForm, setPlatformForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  // Grant Property User modal
  const [isGrantPropertyOpen, setIsGrantPropertyOpen] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    hotelId: hotels[0]?.id || '',
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: 'hotel_admin' as UserRole,
    departmentName: 'Executive Office',
    password: '',
  });

  // Reset Password modal
  const [passwordTarget, setPasswordTarget] = useState<{
    id: string;
    fullName: string;
    email: string;
    isPlatform: boolean;
  } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const reloadAll = () => {
    setPlatformUsers(saasStorage.getPlatformUsers());
    setHotelUsers(saasStorage.getAllUsers());
  };

  useEffect(() => {
    const unsub = saasStorage.subscribeSync(() => {
      reloadAll();
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!propertyForm.hotelId && hotels[0]?.id) {
      setPropertyForm((prev) => ({ ...prev, hotelId: hotels[0].id }));
    }
  }, [hotels, propertyForm.hotelId]);

  const hotelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    hotels.forEach((h) => map.set(h.id, `${h.name} (${h.code})`));
    return map;
  }, [hotels]);

  const filteredHotelUsers = useMemo(() => {
    return hotelUsers.filter((u) => {
      if (hotelFilter !== 'all' && u.hotelId !== hotelFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [hotelUsers, hotelFilter, roleFilter]);

  const actorInfo = {
    email: user?.email || 'admin@seam.io',
    fullName: user?.fullName || 'Super Admin',
    role: user?.role || 'super_admin',
  };

  const handleGrantSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = platformForm.email.trim().toLowerCase();
    const fullName = platformForm.fullName.trim();
    if (!email || !fullName) return;

    const existing = platformUsers.find((p) => p.email.trim().toLowerCase() === email);
    const id = existing?.id || 'plt_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const record: PlatformUser = {
      id,
      uid: existing?.uid || 'auth_' + id,
      email,
      fullName,
      role: 'super_admin',
      status: 'active',
      passwordHash: existing?.passwordHash,
      grantedBy: actorInfo.email,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    saasStorage.savePlatformUser(record, actorInfo);
    if (platformForm.password.trim()) {
      await saasStorage.setUserPassword(id, platformForm.password.trim(), true);
    }

    await firestoreSync.upsertAccessGrant({
      email,
      fullName,
      hotelId: 'platform',
      role: 'super_admin',
      status: 'active',
      grantedByRole: 'super_admin',
    });

    reloadAll();
    setIsGrantPlatformOpen(false);
    setPlatformForm({ fullName: '', email: '', password: '' });
    toast('Super Admin privilege granted', {
      description: `${fullName} (${email}) is now authorized for platform governance.`,
      variant: 'success',
    });
  };

  const handleGrantPropertyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = propertyForm.email.trim().toLowerCase();
    const fullName = propertyForm.fullName.trim();
    const targetHotelId = propertyForm.hotelId;
    if (!email || !fullName || !targetHotelId) return;

    const existing = hotelUsers.find((u) => u.email.trim().toLowerCase() === email);
    const id = existing?.id || 'usr_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const userDoc: HotelUser = {
      id,
      uid: existing?.uid || 'auth_' + id,
      hotelId: targetHotelId,
      employeeId:
        propertyForm.employeeId.trim() ||
        existing?.employeeId ||
        `EMP-${Math.floor(100 + Math.random() * 900)}`,
      email,
      fullName,
      phone: propertyForm.phone.trim() || undefined,
      role: propertyForm.role,
      departmentId: propertyForm.departmentName.toLowerCase().replace(/\s+/g, '_'),
      departmentName: propertyForm.departmentName,
      status: 'active',
      passwordHash: existing?.passwordHash,
      requirePasswordChange: !propertyForm.password.trim(),
      invitedBy: actorInfo.email,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    saasStorage.saveHotelUser(userDoc, actorInfo);
    if (propertyForm.password.trim()) {
      await saasStorage.setUserPassword(id, propertyForm.password.trim(), false);
    }

    await firestoreSync.upsertAccessGrant({
      email,
      fullName,
      hotelId: targetHotelId,
      role: propertyForm.role,
      departmentName: propertyForm.departmentName,
      employeeId: userDoc.employeeId,
      status: 'active',
      grantedByRole: 'super_admin',
    });

    reloadAll();
    setIsGrantPropertyOpen(false);
    setPropertyForm({
      hotelId: hotels[0]?.id || '',
      fullName: '',
      email: '',
      phone: '',
      employeeId: '',
      role: 'hotel_admin',
      departmentName: 'Executive Office',
      password: '',
    });
    toast('Property account privileged', {
      description: `${fullName} granted ${propertyForm.role.replace(/_/g, ' ')} access.`,
      variant: 'success',
    });
  };

  const handleTogglePlatformStatus = (target: PlatformUser) => {
    const emailLower = target.email.trim().toLowerCase();
    if (emailLower === BOOTSTRAP_OWNER_EMAIL || emailLower === user?.email?.trim().toLowerCase()) {
      toast('Protected platform account', {
        description: 'The bootstrapped owner and currently active session cannot be suspended.',
        variant: 'warning',
      });
      return;
    }

    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    confirmAction({
      title: nextStatus === 'suspended' ? `Suspend ${target.fullName}?` : `Reactivate ${target.fullName}?`,
      description:
        nextStatus === 'suspended'
          ? `Suspending ${target.email} immediately revokes Super Admin portal access.`
          : `Restoring ${target.email} re-enables Super Admin portal sign-in.`,
      confirmLabel: nextStatus === 'suspended' ? 'Suspend Admin' : 'Activate Admin',
      tone: nextStatus === 'suspended' ? 'danger' : 'default',
      onConfirm: async () => {
        saasStorage.savePlatformUser({ ...target, status: nextStatus }, actorInfo);
        await firestoreSync.upsertAccessGrant({
          email: target.email,
          fullName: target.fullName,
          hotelId: 'platform',
          role: 'super_admin',
          status: nextStatus,
          grantedByRole: 'super_admin',
        });
        reloadAll();
        toast(nextStatus === 'suspended' ? 'Super Admin suspended' : 'Super Admin reactivated', {
          variant: nextStatus === 'suspended' ? 'warning' : 'success',
        });
      },
    });
  };

  const handleRevokePlatformUser = (target: PlatformUser) => {
    const emailLower = target.email.trim().toLowerCase();
    if (emailLower === BOOTSTRAP_OWNER_EMAIL || emailLower === user?.email?.trim().toLowerCase()) {
      toast('Cannot revoke protected Super Admin', {
        description: 'The primary owner and your active session cannot be deleted.',
        variant: 'warning',
      });
      return;
    }

    confirmAction({
      title: `Revoke Super Admin privilege for ${target.fullName}?`,
      description: `This removes ${target.email} from platform administration and deletes their cloud access grant.`,
      confirmLabel: 'Revoke Access',
      tone: 'danger',
      onConfirm: async () => {
        saasStorage.deletePlatformUser(target.id, actorInfo);
        await firestoreSync.revokeAccessGrant(target.email);
        reloadAll();
        toast('Super Admin access revoked', { variant: 'warning' });
      },
    });
  };

  const handleToggleHotelUserStatus = (target: HotelUser, nextStatus: UserAccountStatus) => {
    const isSuspending = nextStatus === 'suspended';
    confirmAction({
      title: isSuspending ? `Suspend ${target.fullName}?` : `Activate ${target.fullName}?`,
      description: isSuspending
        ? `Revoking access immediately prevents ${target.email} from signing into ${hotelNameMap.get(target.hotelId) || target.hotelId}.`
        : `Restoring access allows ${target.email} to log back in under their assigned role.`,
      confirmLabel: isSuspending ? 'Suspend Account' : 'Activate Account',
      tone: isSuspending ? 'danger' : 'default',
      onConfirm: async () => {
        saasStorage.saveHotelUser({ ...target, status: nextStatus }, actorInfo);
        await firestoreSync.upsertAccessGrant({
          email: target.email,
          fullName: target.fullName,
          hotelId: target.hotelId,
          role: target.role,
          departmentName: target.departmentName,
          employeeId: target.employeeId,
          status: nextStatus,
          grantedByRole: 'super_admin',
        });
        reloadAll();
        toast(isSuspending ? 'Property user suspended' : 'Property user activated', {
          variant: isSuspending ? 'warning' : 'success',
        });
      },
    });
  };

  const handleRevokeHotelUser = (target: HotelUser) => {
    confirmAction({
      title: `Revoke access for ${target.fullName}?`,
      description: `This removes ${target.email} from ${hotelNameMap.get(target.hotelId) || target.hotelId} and invalidates their cloud access grant.`,
      confirmLabel: 'Revoke Access',
      tone: 'danger',
      onConfirm: async () => {
        saasStorage.deleteHotelUser(target.id, actorInfo);
        await firestoreSync.revokeAccessGrant(target.email);
        reloadAll();
        toast('Property access revoked', { variant: 'warning' });
      },
    });
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    const raw = newPasswordInput.trim();
    if (raw.length < 8) {
      toast('Password too short', {
        description: 'Use at least 8 characters for strong account protection.',
        variant: 'warning',
      });
      return;
    }

    await saasStorage.setUserPassword(passwordTarget.id, raw, passwordTarget.isPlatform);
    saasStorage.logAudit({
      actor: {
        uid: user?.uid || actorInfo.email,
        email: actorInfo.email,
        fullName: actorInfo.fullName,
        role: actorInfo.role,
      },
      action: 'PASSWORD_RESET_BY_ADMIN',
      module: 'security',
      targetId: passwordTarget.id,
      description: `Super Admin updated login password for ${passwordTarget.email}.`,
    });

    reloadAll();
    toast('Password updated', {
      description: `New login password saved for ${passwordTarget.email}.`,
      variant: 'success',
    });
    setPasswordTarget(null);
    setNewPasswordInput('');
  };

  const activePlatformCount = platformUsers.filter((u) => u.status === 'active').length;
  const propertyAdminCount = hotelUsers.filter(
    (u) => ['hotel_admin', 'gm', 'owner'].includes(u.role) && u.status === 'active'
  ).length;
  const suspendedTotal =
    platformUsers.filter((u) => u.status === 'suspended').length +
    hotelUsers.filter((u) => u.status !== 'active').length;

  const platformColumns: DataTableColumn<PlatformUser>[] = [
    {
      key: 'fullName',
      header: 'Platform Administrator',
      sortable: true,
      sortValue: (u) => u.fullName,
      render: (u) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE] flex items-center gap-2">
            <span>{u.fullName}</span>
            {u.email.toLowerCase() === BOOTSTRAP_OWNER_EMAIL && (
              <span className="px-1.5 py-0.5 rounded bg-[#C6A15B]/20 text-[#9B7837] dark:text-[#C6A15B] text-[10px] font-semibold">
                Root Owner
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#78837D] flex items-center gap-1 mt-0.5" data-no-translate="true">
            <Mail className="w-3 h-3" />
            <span>{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'authMethod',
      header: 'Auth Capabilities',
      render: (u) => (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
            Google Cloud Grant
          </span>
          {u.passwordHash && (
            <span className="px-2 py-0.5 rounded-md bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] font-medium">
              Password Active
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (u) => u.status,
      render: (u) => (
        <StatusBadge label={u.status} tone={u.status === 'active' ? 'success' : 'critical'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Provisioned',
      sortable: true,
      sortValue: (u) => u.createdAt,
      render: (u) => <span className="font-mono text-[11px] text-[#78837D]">{formatShortDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => {
        const isProtected =
          u.email.toLowerCase() === BOOTSTRAP_OWNER_EMAIL ||
          u.email.toLowerCase() === user?.email?.toLowerCase();
        return (
          <div className="flex items-center justify-end gap-1.5">
            {!isProtected && (
              <button
                type="button"
                onClick={() => handleTogglePlatformStatus(u)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  u.status === 'active'
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                {u.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setPasswordTarget({
                  id: u.id,
                  fullName: u.fullName,
                  email: u.email,
                  isPlatform: true,
                })
              }
              className="p-1.5 rounded-md text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
              title="Set Password"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            {!isProtected && (
              <button
                type="button"
                onClick={() => handleRevokePlatformUser(u)}
                className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Revoke Access"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const hotelUserColumns: DataTableColumn<HotelUser>[] = [
    {
      key: 'fullName',
      header: 'Account Holder',
      sortable: true,
      sortValue: (u) => u.fullName,
      render: (u) => (
        <div>
          <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{u.fullName}</div>
          <div className="text-[11px] text-[#78837D] flex flex-wrap items-center gap-2 mt-0.5" data-no-translate="true">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {u.email}
            </span>
            {u.phone && (
              <span className="inline-flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3" />
                {u.phone}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'hotelId',
      header: 'Assigned Property',
      sortable: true,
      sortValue: (u) => hotelNameMap.get(u.hotelId) || u.hotelId,
      render: (u) => (
        <div>
          <div className="text-xs font-medium text-[#202B27] dark:text-[#ECF1EE]">
            {hotelNameMap.get(u.hotelId) || u.hotelId}
          </div>
          <div className="text-[11px] text-[#78837D]">
            {u.departmentName || 'General'} · <span className="font-mono">{u.employeeId || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Privilege Tier',
      sortable: true,
      sortValue: (u) => u.role,
      render: (u) => (
        <span className="px-2 py-0.5 rounded-md bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[11px] font-medium text-[#202B27] dark:text-[#ECF1EE] capitalize">
          {u.role.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (u) => u.status,
      render: (u) => (
        <StatusBadge
          label={u.status.replace('_', ' ')}
          tone={u.status === 'active' ? 'success' : u.status === 'on_leave' ? 'warning' : 'critical'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          {u.status === 'active' ? (
            <button
              type="button"
              onClick={() => handleToggleHotelUserStatus(u, 'suspended')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Suspend
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleHotelUserStatus(u, 'active')}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              Activate
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setPasswordTarget({
                id: u.id,
                fullName: u.fullName,
                email: u.email,
                isPlatform: false,
              })
            }
            className="p-1.5 rounded-md text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
            title="Set Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRevokeHotelUser(u)}
            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Revoke Access"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Platform Governance', 'Users & Access Control']}
        title="Users & Access Control"
        subtitle="Authorize Super Admins, Property Admins, and hotel staff. Only explicitly privileged accounts can sign into SEAM."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGrantPlatformOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131E1B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] text-[#202B27] dark:text-[#ECF1EE] font-semibold text-xs transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Privilege Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGrantPropertyOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Privilege Property Account</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Privileged Accounts"
          value={platformUsers.length + hotelUsers.length}
          helper="Verified cloud & credential seats"
          icon={Users}
        />
        <KpiCard
          label="Active Super Admins"
          value={activePlatformCount}
          deltaTone="positive"
          helper="Full SaaS governance access"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Property Admins & GMs"
          value={propertyAdminCount}
          helper="Authorized property leaders"
          icon={Building2}
        />
        <KpiCard
          label="Suspended / Revoked"
          value={suspendedTotal}
          deltaTone={suspendedTotal > 0 ? 'warning' : 'neutral'}
          helper="Blocked from system login"
          icon={Ban}
        />
      </div>

      {/* Directory Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6EBE7] dark:border-[#22322C] pb-3">
        <button
          type="button"
          onClick={() => setActiveDirectory('property')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeDirectory === 'property'
              ? 'bg-[#173F35] text-white dark:bg-[#246353]'
              : 'bg-white dark:bg-[#131E1B] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Property Admins &amp; Staff ({hotelUsers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveDirectory('platform')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeDirectory === 'platform'
              ? 'bg-[#173F35] text-white dark:bg-[#246353]'
              : 'bg-white dark:bg-[#131E1B] border border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Platform Super Admins ({platformUsers.length})</span>
        </button>
      </div>

      {activeDirectory === 'property' ? (
        <DataTable
          data={filteredHotelUsers}
          columns={hotelUserColumns}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Search property user by name, email, or ID..."
          searchFilter={(u, q) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.employeeId ? u.employeeId.toLowerCase().includes(q) : false)
          }
          filterToolbar={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={hotelFilter}
                onChange={(e) => setHotelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
                aria-label="Filter by hotel"
              >
                <option value="all">All Properties</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs seam-input"
                aria-label="Filter by role"
              >
                <option value="all">All Role Tiers</option>
                {PROPERTY_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          }
          emptyTitle="No property accounts match this filter"
          emptyDescription="Privilege a Property Admin or staff user to grant access."
        />
      ) : (
        <DataTable
          data={platformUsers}
          columns={platformColumns}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Search platform administrators..."
          searchFilter={(u, q) =>
            u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
          }
          emptyTitle="No platform administrators configured"
          emptyDescription="Add a Super Admin email to authorize governance access."
        />
      )}

      {/* Privilege Super Admin Modal */}
      <Modal
        open={isGrantPlatformOpen}
        onClose={() => setIsGrantPlatformOpen(false)}
        title="Privilege Platform Super Admin"
        subtitle="Authorize a Google email and/or password for full SEAM SaaS governance."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleGrantSuperAdmin} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Abebe Kebede"
              value={platformForm.fullName}
              onChange={(e) => setPlatformForm({ ...platformForm, fullName: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Email Address (Google or Login) *</label>
            <input
              type="email"
              required
              placeholder="admin@company.com"
              value={platformForm.email}
              onChange={(e) => setPlatformForm({ ...platformForm, email: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Login Password (Optional if signing in via Google)
            </label>
            <input
              type="password"
              minLength={8}
              placeholder="Min. 8 characters"
              value={platformForm.password}
              onChange={(e) => setPlatformForm({ ...platformForm, password: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>
          <div className="p-2.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-[11px] text-[#78837D] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#173F35] dark:text-[#647B52] shrink-0 mt-0.5" />
            <span>Writes a verified `/accessGrants` rule record so the user can also authenticate via Google Sign-In.</span>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsGrantPlatformOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Grant Privilege
            </button>
          </div>
        </form>
      </Modal>

      {/* Privilege Property Account Modal */}
      <Modal
        open={isGrantPropertyOpen}
        onClose={() => setIsGrantPropertyOpen(false)}
        title="Privilege Property Account"
        subtitle="Assign a user account to a specific hotel property and role tier."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleGrantPropertyUser} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Target Hotel Property *</label>
            <select
              required
              value={propertyForm.hotelId}
              onChange={(e) => setPropertyForm({ ...propertyForm, hotelId: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Meron Tadesse"
                value={propertyForm.fullName}
                onChange={(e) => setPropertyForm({ ...propertyForm, fullName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Employee ID</label>
              <input
                type="text"
                placeholder="e.g. EMP-101"
                value={propertyForm.employeeId}
                onChange={(e) => setPropertyForm({ ...propertyForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="user@hotel.com"
                value={propertyForm.email}
                onChange={(e) => setPropertyForm({ ...propertyForm, email: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+251 91 234 5678"
                value={propertyForm.phone}
                onChange={(e) => setPropertyForm({ ...propertyForm, phone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Privilege Role *</label>
              <select
                value={propertyForm.role}
                onChange={(e) => setPropertyForm({ ...propertyForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 seam-input"
              >
                {PROPERTY_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Department</label>
              <select
                value={propertyForm.departmentName}
                onChange={(e) => setPropertyForm({ ...propertyForm, departmentName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="Executive Office">Executive Office</option>
                <option value="Front Office">Front Office &amp; Reservations</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
                <option value="Kitchen">Kitchen &amp; Culinary</option>
                <option value="Finance">Finance &amp; Cashiering</option>
                <option value="Maintenance">Engineering &amp; Maintenance</option>
                <option value="Security">Security</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              Initial Password (Recommended for credential sign-in)
            </label>
            <input
              type="password"
              minLength={8}
              placeholder="Min. 8 characters (leave blank for Google-only)"
              value={propertyForm.password}
              onChange={(e) => setPropertyForm({ ...propertyForm, password: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsGrantPropertyOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Privilege Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Set / Reset Password Modal */}
      <Modal
        open={Boolean(passwordTarget)}
        onClose={() => {
          setPasswordTarget(null);
          setNewPasswordInput('');
        }}
        title="Set Account Password"
        subtitle={passwordTarget ? `${passwordTarget.fullName} (${passwordTarget.email})` : ''}
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handlePasswordResetSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[#78837D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Enter at least 8 characters"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 seam-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => {
                setPasswordTarget(null);
                setNewPasswordInput('');
              }}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] text-white font-semibold"
            >
              Save Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
