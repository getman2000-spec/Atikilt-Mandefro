/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Top Navigation Bar with breadcrumbs, Global Search (Ctrl+K),
 * Business Date, Real Alert Notifications, Property Context, and Quick Actions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saasStorage } from '../../services/storage';
import { findNavContext, getAllNavItems } from '../../constants/navigation';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  Moon,
  Sun,
  Globe,
  ChevronRight,
  Plus,
  AlertTriangle,
  X,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onToggleMobileMenu: () => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onToggleMobileMenu,
  onOpenHelp,
}) => {
  const { user, activeHotel, hotels, switchHotel, isDark, language, toggleDarkMode, toggleLanguage } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navContext = useMemo(() => findNavContext(currentTab, isSuperAdmin, language), [currentTab, isSuperAdmin, language]);
  const allNavItems = useMemo(() => getAllNavItems(isSuperAdmin, language), [isSuperAdmin, language]);

  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allNavItems.slice(0, 8);
    return allNavItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.labelAm.toLowerCase().includes(q) ||
        item.groupLabel.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  }, [searchQuery, allNavItems]);

  const businessDate = useMemo(() => {
    if (isSuperAdmin || !activeHotel) {
      return new Date().toISOString().slice(0, 10);
    }
    return saasStorage.getCurrentBusinessDate(activeHotel.id);
  }, [isSuperAdmin, activeHotel, currentTab]);

  // Real notifications derived from application data
  const alerts = useMemo(() => {
    const list: Array<{ id: string; title: string; detail: string; tone: 'warning' | 'critical' | 'info'; tab: string }> = [];

    if (isSuperAdmin) {
      const pendingPayments = saasStorage.getPayments().filter((p) => p.status === 'pending_review');
      if (pendingPayments.length > 0) {
        list.push({
          id: 'notif_payments',
          title: `${pendingPayments.length} payment receipt(s) awaiting verification`,
          detail: 'Review B2B bank/Telebirr transfers to extend subscriptions.',
          tone: 'warning',
          tab: 'payments',
        });
      }
      const graceHotels = hotels.filter((h) => h.subscriptionStatus === 'grace_period');
      if (graceHotels.length > 0) {
        list.push({
          id: 'notif_grace',
          title: `${graceHotels.length} hotel tenant(s) in grace period`,
          detail: graceHotels.map((h) => h.name).join(', '),
          tone: 'warning',
          tab: 'subscriptions',
        });
      }
      const suspended = hotels.filter((h) => h.status === 'suspended' || h.subscriptionStatus === 'suspended');
      if (suspended.length > 0) {
        list.push({
          id: 'notif_suspended',
          title: `${suspended.length} suspended property account(s)`,
          detail: 'All records preserved; reactivate once billing settles.',
          tone: 'critical',
          tab: 'hotels',
        });
      }
      return list;
    }

    if (!activeHotel) return list;

    if (activeHotel.subscriptionStatus === 'grace_period') {
      list.push({
        id: 'hotel_grace',
        title: 'Subscription Grace Period Active',
        detail: 'Submit renewal receipt to avoid workspace suspension.',
        tone: 'warning',
        tab: 'hotel_subscription',
      });
    }

    const pendingReqs = saasStorage
      .getRequisitions(activeHotel.id)
      .filter((r) => r.status === 'pending_dept_head' || r.status === 'pending_finance' || r.status === 'pending_gm');
    if (pendingReqs.length > 0) {
      list.push({
        id: 'hotel_reqs',
        title: `${pendingReqs.length} purchase requisition(s) awaiting approval`,
        detail: 'Review departmental spend requests in Financial Management.',
        tone: 'info',
        tab: 'financial_management',
      });
    }

    const highBal = saasStorage
      .getHighBalanceAlerts(activeHotel.id)
      .filter((a) => !a.actionTaken && a.currentFolioBalance > a.creditLimit);
    if (highBal.length > 0) {
      list.push({
        id: 'hotel_highbal',
        title: `${highBal.length} high-balance guest folio alert(s)`,
        detail: 'Verify credit limit / pre-authorization in Night Audit.',
        tone: 'warning',
        tab: 'night_audit',
      });
    }

    const lowStock = saasStorage
      .getStockItems(activeHotel.id)
      .filter((item) => item.currentQuantity <= item.reorderPoint);
    if (lowStock.length > 0) {
      list.push({
        id: 'hotel_stock',
        title: `${lowStock.length} store item(s) below reorder threshold`,
        detail: 'Replenish stock via Stores & Inventory or Supply Chain.',
        tone: 'warning',
        tab: 'inventory',
      });
    }

    return list;
  }, [isSuperAdmin, activeHotel, hotels, currentTab]);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white dark:bg-[#131D1A] border-b border-[#E6EBE7] dark:border-[#22322C]">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Zone 1: Mobile Menu + Breadcrumb & Current Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-1 text-[#78837D] hover:text-[#202B27] dark:hover:text-white rounded-lg hover:bg-[#F6F8F6] dark:hover:bg-[#192622]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <span className="hidden sm:inline text-[#78837D] dark:text-[#92A199] whitespace-nowrap">
                {isSuperAdmin ? (language === 'am' ? 'SEAM መድረክ' : 'SEAM Platform') : activeHotel?.code || (language === 'am' ? 'ሆቴል' : 'Property')}
              </span>
              {navContext && (
                <>
                  <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[#78837D]/60 shrink-0" />
                  <span className="hidden md:inline text-[#78837D] dark:text-[#92A199] truncate max-w-[160px]">
                    {navContext.groupLabel}
                  </span>
                  <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-[#78837D]/60 shrink-0" />
                  <span className="font-semibold text-[#202B27] dark:text-[#ECF1EE] truncate">
                    {navContext.item.displayLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Zone 2: Global Search + Business Date + Property Selector */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] text-xs text-[#78837D] dark:text-[#92A199] hover:border-[#647B52] transition-colors w-40 sm:w-56"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Jump to module...</span>
              </span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] rounded">
                Ctrl K
              </kbd>
            </button>

            <div
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] border border-[#E6EBE7] dark:border-[#22322C] text-xs text-[#202B27] dark:text-[#ECF1EE] tabular-nums font-mono whitespace-nowrap"
              title="Active Property Business Date"
            >
              <Calendar className="w-3.5 h-3.5 text-[#647B52]" />
              <span>{businessDate}</span>
            </div>

            {isSuperAdmin && hotels.length > 0 && (
              <select
                value={activeHotel?.id || ''}
                onChange={(e) => switchHotel(e.target.value)}
                aria-label="Inspect property"
                className="hidden xl:block px-2.5 py-1.5 text-xs seam-input max-w-[190px]"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    Inspect: {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Zone 3: Quick Action, Notifications, Language, Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeHotel?.subscriptionStatus === 'grace_period' && !isSuperAdmin && (
              <button
                type="button"
                onClick={() => onSelectTab('hotel_subscription')}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Grace Period</span>
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-lg text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C6A15B]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E6EBE7] dark:border-[#22322C] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#202B27] dark:text-[#ECF1EE]">
                      Operational Alerts ({alerts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[#78837D] hover:text-[#202B27] dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
                    {alerts.length === 0 ? (
                      <div className="p-5 text-center text-xs text-[#78837D] dark:text-[#92A199]">
                        No active operational alerts right now.
                      </div>
                    ) : (
                      alerts.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            onSelectTab(a.tab);
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left p-3.5 hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors flex items-start justify-between gap-2"
                        >
                          <div className="text-xs">
                            <div className="font-semibold text-[#202B27] dark:text-[#ECF1EE]">{a.title}</div>
                            <div className="text-[11px] text-[#78837D] dark:text-[#92A199] mt-0.5">{a.detail}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#78837D] shrink-0 mt-0.5" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              data-no-translate="true"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#E6EBE7] dark:border-[#22322C] bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] hover:border-[#647B52] transition-colors whitespace-nowrap"
              title="Switch Language (English / አማርኛ)"
              aria-label="Switch Language (English / አማርኛ)"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'am' ? 'አማ' : 'EN'}</span>
            </button>

            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                className="p-2 rounded-lg text-[#78837D] hover:text-[#173F35] dark:hover:text-[#C6A15B] hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                title={language === 'am' ? 'መመሪያ እና እገዛ (?)' : 'Help & Guides (?)'}
                aria-label={language === 'am' ? 'የገጽ እገዛ መመሪያ ክፈት' : 'Open contextual help'}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-[#78837D] hover:text-[#202B27] dark:hover:text-white hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#C6A15B]" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab(isSuperAdmin ? 'hotels' : 'front_office')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#113028] dark:bg-[#246353] dark:hover:bg-[#1D5244] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>
                {isSuperAdmin
                  ? language === 'am'
                    ? 'አዲስ ሆቴል አስገባ'
                    : 'Onboard Hotel'
                  : language === 'am'
                  ? 'እንግዳ መቀበያ'
                  : 'Front Desk'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Search / Command Palette Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#0D1412]/60 backdrop-blur-xs"
          onClick={() => setSearchOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-[12px] bg-white dark:bg-[#131D1A] border border-[#E6EBE7] dark:border-[#22322C] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E6EBE7] dark:border-[#22322C]">
              <Search className="w-4 h-4 text-[#78837D]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any of the 27 operational modules, reports, or settings..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#202B27] dark:text-[#ECF1EE] placeholder-[#78837D] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-[#78837D] hover:text-[#202B27] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#E6EBE7] dark:divide-[#22322C]">
              {filteredSearchItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#78837D]">
                  No modules matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredSearchItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F8F6] dark:hover:bg-[#192622] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F6F8F6] dark:bg-[#192622] text-[#173F35] dark:text-[#C6A15B] flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#202B27] dark:text-[#ECF1EE] truncate">
                            {item.displayLabel}
                          </div>
                          <div className="text-[11px] text-[#78837D] dark:text-[#92A199] truncate">
                            {item.groupLabel}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#78837D] shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
