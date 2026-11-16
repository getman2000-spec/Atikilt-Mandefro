/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SEAM Hotel Management System - Phase 1 Application Root
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AmharicDomBridge } from './i18n';
import { TestingBar } from './components/common/TestingBar';
import { ContextualHelpOverlay } from './components/common/ContextualHelpOverlay';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Super Admin Components
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { HotelManagement } from './components/superadmin/HotelManagement';
import { SubscriptionHub } from './components/superadmin/SubscriptionHub';
import { ModuleAccessManager } from './components/superadmin/ModuleAccessManager';
import { PlatformAnnouncements } from './components/superadmin/PlatformAnnouncements';
import { AuditLogViewer } from './components/superadmin/AuditLogViewer';
import { PlatformAccessManager } from './components/superadmin/PlatformAccessManager';

// Hotel Admin Components (Phase 1)
import { HotelAdminDashboard } from './components/hoteladmin/HotelAdminDashboard';
import { HotelProfileSettings } from './components/hoteladmin/HotelProfileSettings';
import { HotelUserManagement } from './components/hoteladmin/HotelUserManagement';
import { RolePermissionMatrixView } from './components/hoteladmin/RolePermissionMatrixView';
import { HotelSubscriptionView } from './components/hoteladmin/HotelSubscriptionView';

// Hotel Configuration Components (Phase 2)
import { DepartmentManagement } from './components/hoteladmin/DepartmentManagement';
import { OutletManagement } from './components/hoteladmin/OutletManagement';
import { RoomManagement } from './components/hoteladmin/RoomManagement';
import { EmployeeManagement } from './components/hoteladmin/EmployeeManagement';
import { FinancialApprovalConfig } from './components/hoteladmin/FinancialApprovalConfig';

// Daily Operations Components (Phase 3)
import { FrontOfficeManagement } from './components/operations/FrontOfficeManagement';
import { HousekeepingBoard } from './components/operations/HousekeepingBoard';
import { POSOutletCashier } from './components/operations/POSOutletCashier';

// Financial Management Components (Phase 4)
import { FinancialManagement } from './components/finance/FinancialManagement';

// Stores & Inventory Management Components (Phase 5)
import { InventoryManagement } from './components/inventory/InventoryManagement';

// Maintenance, Engineering & Asset Management (Phase 6)
import { MaintenanceManagement } from './components/maintenance/MaintenanceManagement';

// Conferences, Events & Banqueting (Phase 7)
import { EventManagement } from './components/events/EventManagement';

// Guest Experience, CRM, Spa & Loyalty (Phase 8)
import { GuestCRMAndSpa } from './components/crm/GuestCRMAndSpa';

// Human Resources, Shift Rosters & Payroll (Phase 9)
import { HumanResourcesManagement } from './components/hr/HumanResourcesManagement';

// Executive BI & Portfolio Analytics (Phase 10)
import { ExecutiveAnalyticsBI } from './components/analytics/ExecutiveAnalyticsBI';

// Security, Gate Access & Service Recovery (Phase 11)
import { SecurityAndServiceRecovery } from './components/security/SecurityAndServiceRecovery';

// Concierge, Fleet, Airport Transfers & Safari Excursions (Phase 12)
import { ConciergeAndFleetDispatch } from './components/concierge/ConciergeAndFleetDispatch';

// Sustainability, Energy/Water Utilities & Kitchen Waste (Phase 13)
import { SustainabilityAndUtilities } from './components/sustainability/SustainabilityAndUtilities';

// Central Reservations System (CRS), Channel Manager & Yield Rules (Phase 14)
import { ChannelManagerAndCRS } from './components/crs/ChannelManagerAndCRS';

// In-Room Digital Guest Tablet, Smart Suite & QR Compendium (Phase 15)
import { DigitalGuestTabletHub } from './components/inroom/DigitalGuestTabletHub';

// Supply Chain, Vendor Registry, Purchase Orders & Three-Way Matching (Phase 16)
import { SupplyChainAndProcurementHub } from './components/procurement/SupplyChainAndProcurementHub';

// Commercial Laundry, Linen Par Tracking & Guest Valet (Phase 17)
import { LaundryAndLinenHub } from './components/laundry/LaundryAndLinenHub';

// Kitchen Recipe Costing & Menu Engineering (Phase 18)
import { RecipeCostingAndMenuHub } from './components/kitchen/RecipeCostingAndMenuHub';

// Online Reputation & Sentiment Intelligence (Phase 19)
import { ReputationAndReviewHub } from './components/reputation/ReputationAndReviewHub';

// Energy Management System & Smart Room IoT (Phase 20)
import { EnergyAndSmartRoomHub } from './components/ems/EnergyAndSmartRoomHub';

// HACCP Food Safety, Hygiene & Pool Water Quality (Phase 21)
import { HaccpAndWaterSafetyHub } from './components/haccp/HaccpAndWaterSafetyHub';

// Valet Parking, EV Charging Stations & Smart Parking Bays (Phase 22)
import { ValetAndEvParkingHub } from './components/valet/ValetAndEvParkingHub';

// Night Audit, End-of-Day Balancing & Rate Roll (Phase 23)
import { NightAuditAndEodHub } from './components/audit/NightAuditAndEodHub';

// Staff Messaging, Shift Handover & Rapid Task Dispatch (Phase 24)
import { StaffHandoverAndDispatchHub } from './components/dispatch/StaffHandoverAndDispatchHub';

// Corporate Accounts, City Ledger (AR) & Agency Commissions (Phase 25)
import { CityLedgerAndCorporateHub } from './components/finance/CityLedgerAndCorporateHub';

// Dining Floor Plan, Table Reservations & Sommelier Wine Cellar (Phase 26)
import { RestaurantFloorAndSommelierHub } from './components/operations/RestaurantFloorAndSommelierHub';

// Group Room Blocks, Allotments & Rooming Lists (Phase 27)
import { GroupBlocksAndRoomingHub } from './components/operations/GroupBlocksAndRoomingHub';

// Auth & Lock Screens
import { LoginView } from './components/auth/LoginView';
import { SuspendedHotelScreen } from './components/auth/SuspendedHotelScreen';
import { LockScreen } from './components/auth/LockScreen';

const MainAppContent: React.FC = () => {
  const { user, activeHotel, isLocked } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('saas_overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Global keyboard shortcut (? or F1) for contextual help documentation overlay
  useEffect(() => {
    if (!user || isLocked) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.key === '?' && !isTypingField) || e.key === 'F1') {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [user, isLocked]);

  // Automatically switch default tab when switching between Super Admin and Hotel Admin
  useEffect(() => {
    const hotelAdminTabs = [
      'hotel_dashboard',
      'hotel_profile',
      'hotel_users',
      'role_matrix',
      'hotel_subscription',
      'rooms',
      'departments',
      'outlets',
      'employees',
      'financial_rules',
      // Phase 3 tabs
      'front_office',
      'housekeeping',
      'pos_cashier',
      // Phase 4 tabs
      'financial_management',
      // Phase 5 tabs
      'inventory',
      // Phase 6 tabs
      'maintenance',
      // Phase 7 tabs
      'events',
      // Phase 8 tabs
      'crm_spa',
      // Phase 9 tabs
      'human_resources',
      // Phase 10 tabs
      'reporting_bi',
      // Phase 11 tabs
      'security_recovery',
      // Phase 12 tabs
      'concierge_fleet',
      // Phase 13 tabs
      'sustainability',
      // Phase 14 tabs
      'channel_manager',
      // Phase 15 tabs
      'in_room_tablet',
      // Phase 16 tabs
      'procurement',
      // Phase 17 tabs
      'laundry',
      // Phase 18 tabs
      'recipes_menu',
      // Phase 19 tabs
      'reputation',
      // Phase 20 tabs
      'energy_iot',
      // Phase 21 tabs
      'haccp_safety',
      // Phase 22 tabs
      'valet_parking',
      // Phase 23 tabs
      'night_audit',
      // Phase 24 tabs
      'staff_dispatch',
      // Phase 25 tabs
      'city_ledger',
      // Phase 26 tabs
      'restaurant_floor',
      // Phase 27 tabs
      'group_blocks',
    ];
    if (user?.role === 'super_admin') {
      if (hotelAdminTabs.includes(currentTab)) {
        setCurrentTab('saas_overview');
      }
    } else {
      if (['saas_overview', 'hotels', 'subscriptions', 'payments', 'platform_access', 'modules', 'announcements', 'audit_logs'].includes(currentTab)) {
        setCurrentTab('hotel_dashboard');
      }
    }
  }, [user?.role]);

  // If not authenticated, render standalone login view without persona switcher
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] dark:bg-[#0D1412]">
        <LoginView />
      </div>
    );
  }

  // If hotel is suspended and current persona is NOT Super Admin, display courteous suspension guard
  const isHotelSuspended =
    user.role !== 'super_admin' &&
    activeHotel &&
    (activeHotel.status === 'suspended' || activeHotel.subscriptionStatus === 'suspended');

  return (
    <div className="min-h-screen bg-[#F6F8F6] dark:bg-[#0D1412] text-[#202B27] dark:text-[#ECF1EE] flex flex-col font-sans transition-colors">
      {/* Top Persona Switcher */}
      <TestingBar />

      {/* Main Application Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Contextual Help Documentation Overlay */}
      <ContextualHelpOverlay
        open={helpOpen}
        currentTab={currentTab}
        onClose={() => setHelpOpen(false)}
        onNavigateTab={setCurrentTab}
      />

      {/* Session Lock Screen if triggered */}
      {isLocked && <LockScreen />}

      {/* App Shell: Sidebar + Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1440px] mx-auto">
            {isHotelSuspended ? (
              <SuspendedHotelScreen />
            ) : (
              <>
                {/* SUPER ADMIN PORTAL TABS */}
                {user.role === 'super_admin' && (
                  <>
                    {currentTab === 'saas_overview' && (
                      <SuperAdminDashboard
                        onNavigateTab={setCurrentTab}
                        onOpenCreateHotel={() => setCurrentTab('hotels')}
                      />
                    )}
                    {currentTab === 'hotels' && <HotelManagement />}
                    {currentTab === 'subscriptions' && <SubscriptionHub initialTab="contracts" />}
                    {currentTab === 'payments' && <SubscriptionHub initialTab="verification" />}
                    {currentTab === 'platform_access' && <PlatformAccessManager />}
                    {currentTab === 'modules' && <ModuleAccessManager />}
                    {currentTab === 'announcements' && <PlatformAnnouncements />}
                    {currentTab === 'audit_logs' && <AuditLogViewer />}
                  </>
                )}

                {/* HOTEL ADMIN WORKSPACE TABS */}
                {user.role !== 'super_admin' && (
                  <>
                    {/* Phase 1 Core Views */}
                    {currentTab === 'hotel_dashboard' && (
                      <HotelAdminDashboard onNavigateTab={setCurrentTab} />
                    )}
                    {currentTab === 'hotel_profile' && <HotelProfileSettings />}
                    {currentTab === 'hotel_users' && <HotelUserManagement />}
                    {currentTab === 'role_matrix' && <RolePermissionMatrixView />}
                    {currentTab === 'hotel_subscription' && <HotelSubscriptionView />}

                    {/* Phase 2 Hotel Configuration Views */}
                    {currentTab === 'rooms' && <RoomManagement />}
                    {currentTab === 'departments' && <DepartmentManagement />}
                    {currentTab === 'outlets' && <OutletManagement />}
                    {currentTab === 'employees' && <EmployeeManagement />}
                    {currentTab === 'financial_rules' && <FinancialApprovalConfig />}

                    {/* Phase 3 Daily Operations Views */}
                    {currentTab === 'front_office' && <FrontOfficeManagement />}
                    {currentTab === 'housekeeping' && <HousekeepingBoard />}
                    {currentTab === 'pos_cashier' && <POSOutletCashier />}

                    {/* Phase 4 Financial Management Views */}
                    {currentTab === 'financial_management' && <FinancialManagement />}

                    {/* Phase 5 Stores & Stock Inventory Views */}
                    {currentTab === 'inventory' && <InventoryManagement />}

                    {/* Phase 6 Maintenance, Engineering & Asset Work Orders */}
                    {currentTab === 'maintenance' && (
                      <MaintenanceManagement
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 7 Conferences, Events & Banqueting */}
                    {currentTab === 'events' && (
                      <EventManagement
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 8 Guest Experience, CRM, Spa & Loyalty */}
                    {currentTab === 'crm_spa' && (
                      <GuestCRMAndSpa
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 9 Human Resources, Shift Rosters & Payroll */}
                    {currentTab === 'human_resources' && (
                      <HumanResourcesManagement
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 10 Executive BI & Portfolio Analytics */}
                    {currentTab === 'reporting_bi' && (
                      <ExecutiveAnalyticsBI
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 11 Security, Gate Access & Service Recovery */}
                    {currentTab === 'security_recovery' && (
                      <SecurityAndServiceRecovery
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 12 Concierge, Transport Fleet & Safari Excursions */}
                    {currentTab === 'concierge_fleet' && (
                      <ConciergeAndFleetDispatch
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 13 Sustainability, Energy/Water Utilities & Kitchen Waste */}
                    {currentTab === 'sustainability' && (
                      <SustainabilityAndUtilities
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 14 CRS, Channel Manager & Dynamic Pricing */}
                    {currentTab === 'channel_manager' && (
                      <ChannelManagerAndCRS
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 15 Digital In-Room Tablet, Smart Room & QR Compendium */}
                    {currentTab === 'in_room_tablet' && (
                      <DigitalGuestTabletHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 16 Supply Chain, Vendor Registry & Three-Way Invoice Matching */}
                    {currentTab === 'procurement' && (
                      <SupplyChainAndProcurementHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 17 Commercial Laundry, Linen Par Tracking & Guest Valet */}
                    {currentTab === 'laundry' && (
                      <LaundryAndLinenHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 18 Kitchen Recipe Costing & Menu Engineering */}
                    {currentTab === 'recipes_menu' && (
                      <RecipeCostingAndMenuHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 19 Online Reputation & Sentiment Intelligence */}
                    {currentTab === 'reputation' && (
                      <ReputationAndReviewHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 20 Energy Management System & Smart Room IoT */}
                    {currentTab === 'energy_iot' && (
                      <EnergyAndSmartRoomHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 21 HACCP Food Safety, Hygiene & Pool Water Quality */}
                    {currentTab === 'haccp_safety' && (
                      <HaccpAndWaterSafetyHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 22 Valet Parking, EV Charging Stations & Smart Parking Bays */}
                    {currentTab === 'valet_parking' && (
                      <ValetAndEvParkingHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 23 Night Audit, End-of-Day Balancing & Rate Roll */}
                    {currentTab === 'night_audit' && (
                      <NightAuditAndEodHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 24 Staff Messaging, Shift Handover & Rapid Dispatch */}
                    {currentTab === 'staff_dispatch' && (
                      <StaffHandoverAndDispatchHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 25 Corporate Accounts, City Ledger (AR) & Agency Commissions */}
                    {currentTab === 'city_ledger' && (
                      <CityLedgerAndCorporateHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 26 Dining Floor Plan, Table Reservations & Sommelier Wine Cellar */}
                    {currentTab === 'restaurant_floor' && (
                      <RestaurantFloorAndSommelierHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}

                    {/* Phase 27 Group Room Blocks, Allotments & Rooming Lists */}
                    {currentTab === 'group_blocks' && (
                      <GroupBlocksAndRoomingHub
                        activeHotel={activeHotel}
                        currentUser={user}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AmharicDomBridge />
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
