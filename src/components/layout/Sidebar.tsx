/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Left Sidebar with collapsible domain groups, compact rail mode,
 * configurable property selector, and bottom user profile.
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { SUPER_ADMIN_NAV_GROUPS, HOTEL_NAV_GROUPS, NavGroup } from '../../constants/navigation';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  X,
} from 'lucide-react';
import { SeamCipherLogo } from '../common/SeamCipherLogo';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, firebaseUser, signInWithGoogle, activeHotel, hotels, switchHotel, logout, lockScreen, hasPermission, language } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAm = language === 'am';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const pendingPaymentsCount = useMemo(() => {
    return saasStorage.getPayments().filter((p) => p.status === 'pending_review').length;
  }, [currentTab]);

  const navGroups: NavGroup[] = useMemo(() => {
    if (isSuperAdmin) return SUPER_ADMIN_NAV_GROUPS;
    // Filter items respectfully according to RBAC permissions when module is mapped
    return HOTEL_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.requiredModule) return true;
        // Hotel admin / GM / Owner / Super Admin see full workspace, while department/staff roles respect allowedModules
        if (user?.role === 'hotel_admin' || user?.role === 'gm' || user?.role === 'owner' || user?.role === 'deputy_gm') {
          return activeHotel ? activeHotel.enabledModules.includes(item.requiredModule) : true;
        }
        return hasPermission(item.requiredModule, 'view');
      }),
    })).filter((g) => g.items.length > 0);
  }, [isSuperAdmin, user?.role, activeHotel, hasPermission]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#0D1412]/60 lg:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-[#131D1A] border-r border-[#E6EBE7] dark:border-[#22322C] text-[#202B27] dark:text-[#ECF1EE] flex flex-col transition-all duration-200 ease-out lg:translate-x-0 lg:static lg:h-[calc(100vh-3.5rem)] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[68px]' : 'w-64'}`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6EBE7] dark:border-[#22322C] lg:hidden">
          <SeamCipherLogo variant="compact" size="xs" showTagline={false} />
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-[#78837D] hover:text-[#202B27] dark:hover:text-white rounded-lg"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand / Property Identity + Compact Toggle */}
        <div className="p-3 border-b border-[#E6EBE7] dark:border-[#22322C] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 min-w-0">
                {!isSuperAdmin && activeHotel?.logoUrl ? (
                  <img
                    src={activeHotel.logoUrl}
                    alt={activeHotel.name}
                    className="w-8 h-8 rounded-lg object-cover border border-[#E6EBE7] dark:border-[#22322C] shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#173F35] text-[#C6A15B] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE] truncate">
                    {isSuperAdmin ? 'SEAM Platform' : activeHotel?.name || 'Property Workspace'}
                  </div>
                  <div className="text-[11px] text-[#78837D] dark:text-[#92A199] truncate">
                    {isSuperAdmin
                      ? 'SaaS Governance'
                      : `${activeHotel?.code || 'PROP'} · ${activeHotel?.operationalSettings.currency || 'ETB'}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#173F35] text-[#C6A15B] flex items-center justify-center mx-auto">
                <Building2 className="w-4 h-4" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors shrink-0"
              title={isCollapsed ? 'Expand sidebar' : 'Compact sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Compact sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Multi-property selector for authorized multi-property users */}
          {!isCollapsed && !isSuperAdmin && hotels.length > 1 && (
            <div>
              <label className="sr-only" htmlFor="sidebar-property-select">
                Active Property
              </label>
              <select
                id="sidebar-property-select"
                value={activeHotel?.id || ''}
                onChange={(e) => switchHotel(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-medium seam-input bg-[#F6F8F6] dark:bg-[#192622]"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.operationalSettings.currency})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Collapsible Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navGroups.map((group) => {
            const groupClosed = !!collapsedGroups[group.id] && !isCollapsed;

            return (
              <div key={group.id}>
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-[#78837D] dark:text-[#92A199] hover:text-[#202B27] dark:hover:text-[#ECF1EE] transition-colors"
                  >
                    <span className="truncate">{isAm ? group.labelAm : group.label}</span>
                    {groupClosed ? (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    )}
                  </button>
                )}

                {!groupClosed && (
                  <nav className="mt-1 space-y-0.5" aria-label={isAm ? group.labelAm : group.label}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      const showBadge = item.id === 'payments' && pendingPaymentsCount > 0;
                      const displayLabel = isAm ? item.labelAm : item.label;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item.id)}
                          title={isCollapsed ? displayLabel : undefined}
                          className={`w-full flex items-center ${
                            isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2'
                          } rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#173F35] text-white dark:bg-[#246353] shadow-xs'
                              : 'text-[#202B27] dark:text-[#ECF1EE]/85 hover:bg-[#F6F8F6] dark:hover:bg-[#192622]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? 'text-[#C6A15B]'
                                  : 'text-[#78837D] dark:text-[#92A199]'
                              }`}
                            />
                            {!isCollapsed && <span className="truncate">{displayLabel}</span>}
                          </div>

                          {!isCollapsed && showBadge && (
                            <span
                              className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-[#C6A15B] text-[#173F35] font-semibold'
                                  : 'bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] border border-[#E6EBE7] dark:border-[#22322C]'
                              }`}
                            >
                              {pendingPaymentsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile & Session Controls at Bottom */}
        <div className="p-3 border-t border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6]/60 dark:bg-[#0D1412]/50">
          {!isCollapsed ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#173F35] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE] truncate">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="text-[11px] text-[#78837D] dark:text-[#92A199] capitalize truncate">
                    {user?.role.replace('_', ' ')}
                  </div>
                  {firebaseUser?.email && (
                    <div className="text-[10px] text-[#78837D] dark:text-[#92A199] truncate" data-no-translate="true">
                      {firebaseUser.email}
                    </div>
                  )}
                </div>
              </div>

              {!firebaseUser && (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] hover:border-[#173F35] dark:hover:border-[#C6A15B] transition-colors whitespace-nowrap"
                >
                  <Shield className="w-3 h-3 shrink-0" />
                  <span>Sign in with Google</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={lockScreen}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#202B27] dark:text-[#ECF1EE] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors whitespace-nowrap"
                >
                  <Lock className="w-3 h-3 text-[#78837D]" />
                  <span>Lock</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {!firebaseUser && (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  title="Sign in with Google"
                  className="p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#173F35] dark:text-[#C6A15B] hover:border-[#173F35] dark:hover:border-[#C6A15B]"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={lockScreen}
                title="Lock session"
                className="p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-[#78837D] hover:text-[#202B27] dark:hover:text-white"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-white dark:bg-[#131D1A] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
