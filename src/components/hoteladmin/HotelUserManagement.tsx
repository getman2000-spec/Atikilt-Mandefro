/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hotel Staff & User Accounts Management (Tenant Scoped)
 * Enforces RBAC canManageUsers guard, password hashing, and Firestore /accessGrants sync
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saasStorage } from '../../services/storage';
import { firestoreSync } from '../../services/firestoreSync';
import { ROLE_DEFINITIONS } from '../../constants/saasDefaults';
import { HotelUser, UserRole, UserAccountStatus } from '../../types/saas';
import { PageHeader, KpiCard, DataTable, DataTableColumn, StatusBadge, Modal } from '../ui';
import { formatShortDate, downloadCsvFile } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Ban,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Trash2,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export const HotelUserManagement: React.FC = () => {
  const { activeHotel, user } = useAuth();
  const { toast, confirmAction } = useToast();

  const [staff, setStaff] = useState<HotelUser[]>(() =>
    activeHotel ? saasStorage.getUsersByHotelId(activeHotel.id) : []
  );
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Set/Reset Password Modal
  const [passwordTarget, setPasswordTarget] = useState<HotelUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const canManageUsers = Boolean(
    user &&
      (user.isPlatformSuperAdmin ||
        ROLE_DEFINITIONS[user.role]?.canManageUsers ||
        ['hotel_admin', 'gm', 'super_admin'].includes(user.role))
  );

  useEffect(() => {
    if (activeHotel) {
      setStaff(saasStorage.getUsersByHotelId(activeHotel.id));
    }
  }, [activeHotel?.id]);

  // Invite modal form state
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: 'staff' as UserRole,
    departmentName: 'Front Office',
    initialPassword: '',
  });

  const filteredStaff = useMemo(() => {
    if (roleFilter === 'all') return staff;
    return staff.filter((u) => u.role === roleFilter);
  }, [staff, roleFilter]);

  if (!activeHotel) return null;

  const refreshStaff = () => {
    setStaff(saasStorage.getUsersByHotelId(activeHotel.id));
  };

  const actorInfo = {
    email: user?.email || 'admin@hotel.com',
    fullName: user?.fullName || 'Hotel Admin',
    role: user?.role || 'hotel_admin',
  };

  const grantedByRole: 'super_admin' | 'hotel_admin' | 'gm' | 'owner' =
    user?.role === 'super_admin' || user?.role === 'gm' || user?.role === 'owner'
      ? user.role
      : 'hotel_admin';

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    if (!newUser.fullName.trim() || !newUser.email.trim()) return;

    const normalizedEmail = newUser.email.trim().toLowerCase();
    const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const hasInitialPassword = newUser.initialPassword.trim().length > 0;

    const userDoc: HotelUser = {
      id: newId,
      uid: 'auth_' + newId,
      hotelId: activeHotel.id,
      employeeId: newUser.employeeId.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      email: normalizedEmail,
      fullName: newUser.fullName.trim(),
      phone: newUser.phone.trim() || undefined,
      role: newUser.role,
      departmentId: newUser.departmentName.toLowerCase().replace(/\s+/g, '_'),
      departmentName: newUser.departmentName,
      status: 'active',
      requirePasswordChange: !hasInitialPassword,
      invitedBy: actorInfo.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saasStorage.saveHotelUser(userDoc, actorInfo);

    if (hasInitialPassword) {
      await saasStorage.setUserPassword(newId, newUser.initialPassword.trim(), false);
    }

    await firestoreSync.upsertAccessGrant({
      email: userDoc.email,
      fullName: userDoc.fullName,
      hotelId: activeHotel.id,
      role: userDoc.role,
      departmentName: userDoc.departmentName,
      employeeId: userDoc.employeeId,
      status: 'active',
      grantedByRole,
    });

    refreshStaff();
    toast('Staff account privileged', {
      description: `${userDoc.fullName} (${userDoc.role.replace(/_/g, ' ')}) authorized for ${activeHotel.name}.`,
      variant: 'success',
    });
    setIsInviteOpen(false);
    setNewUser({
      fullName: '',
      email: '',
      phone: '',
      employeeId: '',
      role: 'staff',
      departmentName: 'Front Office',
      initialPassword: '',
    });
  };

  const handleToggleStatus = (u: HotelUser, newStatus: UserAccountStatus) => {
    if (!canManageUsers) return;
    if (u.email.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
      toast('Cannot suspend active session', {
        description: 'You cannot suspend your own signed-in administrator account.',
        variant: 'warning',
      });
      return;
    }

    const isSuspending = newStatus === 'suspended';
    confirmAction({
      title: isSuspending ? `Suspend ${u.fullName}?` : `Reactivate ${u.fullName}?`,
      description: isSuspending
        ? `Revoking access immediately prevents ${u.email} from signing into ${activeHotel.name}. Audit records remain intact.`
        : `Restoring account access allows ${u.email} to resume their assigned role.`,
      confirmLabel: isSuspending ? 'Suspend Account' : 'Activate Account',
      tone: isSuspending ? 'danger' : 'default',
      onConfirm: async () => {
        saasStorage.saveHotelUser({ ...u, status: newStatus }, actorInfo);
        await firestoreSync.upsertAccessGrant({
          email: u.email,
          fullName: u.fullName,
          hotelId: activeHotel.id,
          role: u.role,
          departmentName: u.departmentName,
          employeeId: u.employeeId,
          status: newStatus,
          grantedByRole,
        });
        refreshStaff();
        toast(isSuspending ? 'User account suspended' : 'User account activated', {
          description: `${u.fullName} (${u.email}) status updated.`,
          variant: isSuspending ? 'warning' : 'success',
        });
      },
    });
  };

  const handleRevokeStaff = (u: HotelUser) => {
    if (!canManageUsers) return;
    if (u.email.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
      toast('Cannot revoke active session', {
        description: 'You cannot remove your own currently active account.',
        variant: 'warning',
      });
      return;
    }

    confirmAction({
      title: `Revoke access for ${u.fullName}?`,
      description: `This removes ${u.email} from ${activeHotel.name} and deletes their cloud access grant.`,
      confirmLabel: 'Revoke Access',
      tone: 'danger',
      onConfirm: async () => {
        saasStorage.deleteHotelUser(u.id, actorInfo);
        await firestoreSync.revokeAccessGrant(u.email);
        refreshStaff();
        toast('Staff access revoked', {
          description: `${u.fullName} can no longer access ${activeHotel.name}.`,
          variant: 'warning',
        });
      },
    });
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers || !passwordTarget) return;
    const raw = newPasswordInput.trim();
    if (raw.length < 8) {
      toast('Password too short', {
        description: 'Enter at least 8 characters to protect staff access.',
        variant: 'warning',
      });
      return;
    }

    await saasStorage.setUserPassword(passwordTarget.id, raw, false);
    saasStorage.logAudit({
      actor: {
        uid: user?.uid || actorInfo.email,
        email: actorInfo.email,
        fullName: actorInfo.fullName,
        role: actorInfo.role,
      },
      action: 'HOTEL_USER_PASSWORD_SET',
      module: 'users',
      hotelId: activeHotel.id,
      targetId: passwordTarget.id,
      description: `Updated login password for ${passwordTarget.fullName} (${passwordTarget.email}).`,
    });

    refreshStaff();
    toast('Password updated', {
      description: `New login password saved for ${passwordTarget.email}.`,
      variant: 'success',
    });
    setPasswordTarget(null);
    setNewPasswordInput('');
  };

  const activeCount = staff.filter((s) => s.status === 'active').length;
  const suspendedCount = staff.filter((s) => s.status === 'suspended').length;
  const adminLeadershipCount = staff.filter((s) => ['hotel_admin', 'gm', 'owner'].includes(s.role)).length;

  const columns: DataTableColumn<HotelUser>[] = [
    {
      key: 'fullName',
      header: 'Staff Account',
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
      key: 'departmentName',
      header: 'ID & Department',
      sortable: true,
      sortValue: (u) => u.departmentName || '',
      render: (u) => (
        <div>
          <span className="font-mono font-medium text-[#202B27] dark:text-[#ECF1EE]">
            {u.employeeId || 'N/A'}
          </span>
          <span className="text-[11px] text-[#78837D] block">{u.departmentName || 'General'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role Tier',
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
      key: 'lastLoginAt',
      header: 'Last Activity',
      sortable: true,
      sortValue: (u) => u.lastLoginAt || '',
      render: (u) => (
        <span className="font-mono text-[11px] text-[#78837D]">
          {u.lastLoginAt ? formatShortDate(u.lastLoginAt) : 'Privileged'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => {
        if (!canManageUsers) {
          return <span className="text-[11px] text-[#78837D]">Read-only</span>;
        }
        const isSelf = u.email.trim().toLowerCase() === user?.email?.trim().toLowerCase();
        return (
          <div className="flex items-center justify-end gap-1.5">
            {!isSelf && (
              u.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(u, 'suspended')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  Suspend
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(u, 'active')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  Activate
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPasswordTarget(u)}
              className="p-1.5 rounded-md text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
              title="Set Password"
              aria-label={`Set password for ${u.fullName}`}
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            {!isSelf && (
              <button
                type="button"
                onClick={() => handleRevokeStaff(u)}
                className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Revoke Access"
                aria-label={`Revoke access for ${u.fullName}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'User Accounts']}
        title="Staff & User Account Governance"
        subtitle={`Manage privileged login accounts, passwords, and role tiers scoped strictly to ${activeHotel.name}.`}
        actions={
          canManageUsers ? (
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] text-white font-semibold text-xs transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Privilege Staff Account</span>
            </button>
          ) : undefined
        }
      />

      {!canManageUsers && (
        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Only Property Admins, General Managers, or Super Admins can grant or revoke login privileges.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Provisioned Accounts"
          value={staff.length}
          helper={`Seat limit: ${activeHotel.limits.maxUsers}`}
          icon={Users}
        />
        <KpiCard
          label="Active Accounts"
          value={activeCount}
          deltaTone="positive"
          helper="Authorized for sign-in"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Executive & Admin"
          value={adminLeadershipCount}
          helper="Admin, GM & Owner roles"
          icon={Shield}
        />
        <KpiCard
          label="Suspended"
          value={suspendedCount}
          deltaTone={suspendedCount > 0 ? 'warning' : 'neutral'}
          helper="Locked login access"
          icon={Ban}
        />
      </div>

      <DataTable
        data={filteredStaff}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchPlaceholder="Search name, email, or employee ID..."
        searchFilter={(u, q) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.employeeId ? u.employeeId.toLowerCase().includes(q) : false)
        }
        filterToolbar={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs seam-input"
            aria-label="Filter by role"
          >
            <option value="all">All Role Tiers</option>
            <option value="hotel_admin">Hotel Admin</option>
            <option value="owner">Owner / Board</option>
            <option value="gm">General Manager</option>
            <option value="deputy_gm">Deputy GM</option>
            <option value="finance_manager">Finance Manager</option>
            <option value="dept_head">Department Head</option>
            <option value="supervisor">Supervisor</option>
            <option value="senior_staff">Senior Staff</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
            <option value="auditor">Auditor</option>
          </select>
        }
        onExportCsv={() => {
          downloadCsvFile(
            `${activeHotel.code.toLowerCase()}-user-accounts.csv`,
            ['Full Name', 'Email', 'Employee ID', 'Department', 'Role', 'Status'],
            filteredStaff.map((u) => [u.fullName, u.email, u.employeeId || '', u.departmentName || '', u.role, u.status])
          );
          toast('User accounts exported', { variant: 'info' });
        }}
        emptyTitle="No matching staff accounts"
        emptyDescription="Adjust your search query or privilege a new user account for this property."
      />

      <Modal
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Privilege Hotel Staff Member"
        subtitle={`Authorize a login account scoped under ${activeHotel.name}`}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hanna Alemu"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Employee ID</label>
              <input
                type="text"
                placeholder="e.g. EMP-088"
                value={newUser.employeeId}
                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
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
                placeholder="hanna@hotel.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 seam-input"
              />
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+251 91 234 5678"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full px-3 py-2 seam-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Assign Role Tier *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 seam-input"
              >
                <option value="hotel_admin">Hotel Administrator</option>
                <option value="owner">Hotel Owner / Board (Read-only)</option>
                <option value="gm">General Manager (GM)</option>
                <option value="deputy_gm">Deputy General Manager</option>
                <option value="finance_manager">Finance Manager</option>
                <option value="dept_head">Department Head</option>
                <option value="supervisor">Shift Supervisor</option>
                <option value="senior_staff">Senior Staff</option>
                <option value="staff">Staff Member</option>
                <option value="viewer">Viewer</option>
                <option value="auditor">External Auditor</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#202B27] dark:text-[#ECF1EE] block mb-1">Department</label>
              <select
                value={newUser.departmentName}
                onChange={(e) => setNewUser({ ...newUser, departmentName: e.target.value })}
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
              value={newUser.initialPassword}
              onChange={(e) => setNewUser({ ...newUser, initialPassword: e.target.value })}
              className="w-full px-3 py-2 seam-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] font-medium text-[#202B27] dark:text-[#ECF1EE]"
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
        title="Set Staff Password"
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
