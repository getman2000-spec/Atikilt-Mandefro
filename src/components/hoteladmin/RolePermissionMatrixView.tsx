/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive 8-Tier RBAC Role & Permission Matrix Viewer
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFINITIONS } from '../../constants/saasDefaults';
import { UserRole } from '../../types/saas';
import { PageHeader, StatusBadge } from '../ui';
import { ShieldCheck, Check, X } from 'lucide-react';

export const RolePermissionMatrixView: React.FC = () => {
  const { language } = useAuth();
  const isAm = language === 'am';
  const [selectedRole, setSelectedRole] = useState<UserRole>('hotel_admin');
  const roles = Object.values(ROLE_DEFINITIONS);
  const activeRoleConfig = ROLE_DEFINITIONS[selectedRole];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['Property Configuration', 'Role Matrix']}
        title="Role & Permission Matrix"
        subtitle="Eight-tier organizational access hierarchy and module action capabilities enforced across every tenant."
      />

      {/* Role Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] rounded-xl overflow-x-auto text-xs font-medium">
        {roles.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => setSelectedRole(r.role)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedRole === r.role
                ? 'bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#ECF1EE] shadow-xs font-semibold'
                : 'text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {(isAm && r.roleTitleAm ? r.roleTitleAm : r.roleTitle).split('(')[0].trim()}
          </button>
        ))}
      </div>

      {/* Selected Role Detail Card */}
      {activeRoleConfig && (
        <div className="p-5 rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#173F35] dark:text-[#C6A15B]" />
                <h2 className="text-base font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                  {isAm && activeRoleConfig.roleTitleAm ? activeRoleConfig.roleTitleAm : activeRoleConfig.roleTitle}
                </h2>
              </div>
              <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-1 max-w-2xl leading-relaxed">
                {isAm && activeRoleConfig.descriptionAm ? activeRoleConfig.descriptionAm : activeRoleConfig.description}
              </p>
            </div>

            <StatusBadge label={`Tier: ${activeRoleConfig.role}`} tone="forest" showIcon={false} />
          </div>

          {/* Action Capabilities Grid */}
          <div className="pt-3 border-t border-[#E6EBE7] dark:border-[#22322C]">
            <span className="text-[11px] font-medium text-[#78837D] uppercase tracking-wider block mb-2.5">
              Action Rights Matrix
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
              {Object.entries(activeRoleConfig.actionRights).map(([action, allowed]) => (
                <div
                  key={action}
                  className={`p-2.5 rounded-lg border flex items-center justify-between capitalize ${
                    allowed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'bg-[#F6F8F6] dark:bg-[#192622] border-[#E6EBE7] dark:border-[#22322C] text-[#78837D]'
                  }`}
                >
                  <span>{action}</span>
                  {allowed ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-[#78837D]/60" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full Cross-Role Matrix Table */}
      <div className="rounded-[10px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-[0_1px_2px_rgba(23,63,53,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6EBE7] dark:border-[#22322C]">
          <h2 className="text-sm font-semibold text-[#202B27] dark:text-[#ECF1EE]">
            Cross-Role Capability Comparison
          </h2>
          <p className="text-xs text-[#78837D] dark:text-[#92A199] mt-0.5">
            Architectural governance boundaries across all eight organizational levels
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F8F6] dark:bg-[#192622] border-b border-[#E6EBE7] dark:border-[#22322C] text-[#78837D] dark:text-[#92A199] font-semibold">
                <th className="py-2.5 px-4">Role Tier</th>
                <th className="py-2.5 px-4 text-center">Super Admin</th>
                <th className="py-2.5 px-4 text-center">Hotel Config</th>
                <th className="py-2.5 px-4 text-center">Staff Mgmt</th>
                <th className="py-2.5 px-4 text-center">Financials</th>
                <th className="py-2.5 px-4 text-center">PO Approvals</th>
                <th className="py-2.5 px-4 text-center">Audit Trails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
              {roles.map((r) => (
                <tr
                  key={r.role}
                  onClick={() => setSelectedRole(r.role)}
                  className={`cursor-pointer transition-colors hover:bg-[#F6F8F6]/70 dark:hover:bg-[#192622]/70 ${
                    selectedRole === r.role ? 'bg-[#F1F4F1] dark:bg-[#192622]' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      {(isAm && r.roleTitleAm ? r.roleTitleAm : r.roleTitle).split('(')[0].trim()}
                    </div>
                    <div className="text-[11px] text-[#78837D] font-mono">{r.role}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.canAccessSuperAdmin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-[#78837D]/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.canConfigureHotelSettings ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-[#78837D]/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.canManageUsers ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-[#78837D]/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.canViewFinancials ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-[#78837D]/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.canApprovePurchases ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-[#78837D]/40">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.canAudit ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-[#78837D]/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
