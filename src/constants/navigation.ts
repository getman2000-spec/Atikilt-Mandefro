/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Bilingual (EN / AM) Navigation Registry for SEAM Super Admin & 27 Hotel Modules
 */

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  CheckSquare,
  Layers,
  Megaphone,
  ShieldCheck,
  Settings,
  Users,
  BedDouble,
  UtensilsCrossed,
  Receipt,
  Sparkles,
  Package,
  Wrench,
  Calendar,
  Heart,
  BarChart3,
  ShieldAlert,
  Compass,
  Leaf,
  Globe,
  Tablet,
  Truck,
  Shirt,
  ChefHat,
  Star,
  Zap,
  ClipboardCheck,
  Car,
  Moon,
  Radio,
  Briefcase,
  Wine,
  FolderKanban,
  LucideIcon,
} from 'lucide-react';
import { SystemModuleId } from '../types/saas';

export interface NavItem {
  id: string;
  label: string;
  labelAm: string;
  shortLabel?: string;
  icon: LucideIcon;
  keywords?: string[];
  requiredModule?: SystemModuleId;
}

export interface NavGroup {
  id: string;
  label: string;
  labelAm: string;
  items: NavItem[];
}

export const SUPER_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: 'platform_core',
    label: 'Platform Overview',
    labelAm: 'የመድረክ አጠቃላይ እይታ',
    items: [
      { id: 'saas_overview', label: 'Executive Overview', labelAm: 'አስፈጻሚ አጠቃላይ እይታ', icon: LayoutDashboard, keywords: ['dashboard', 'mrr', 'kpi', 'ዳሽቦርድ'] },
      { id: 'hotels', label: 'Hotel Tenants', labelAm: 'የሆቴል ደንበኞች', icon: Building2, keywords: ['properties', 'onboarding', 'create', 'ሆቴል'] },
      { id: 'subscriptions', label: 'Subscriptions & Plans', labelAm: 'የደንበኝነት ምዝገባ እና ዕቅዶች', icon: CreditCard, keywords: ['tiers', 'contracts', 'grace', 'ምዝገባ'] },
      { id: 'payments', label: 'Payment Verification', labelAm: 'የክፍያ ማረጋገጫ', icon: CheckSquare, keywords: ['receipts', 'cbe', 'telebirr', 'ክፍያ'] },
    ],
  },
  {
    id: 'platform_governance',
    label: 'Platform Governance',
    labelAm: 'የመድረክ አስተዳደር',
    items: [
      { id: 'platform_access', label: 'Users & Access Control', labelAm: 'የተጠቃሚዎች እና ፈቃድ ቁጥጥር', icon: Users, keywords: ['admins', 'staff', 'privileges', 'password', 'access', 'ተጠቃሚ'] },
      { id: 'modules', label: 'Module Feature Flags', labelAm: 'የሞጁል ባህሪያት ቁጥጥር', icon: Layers, keywords: ['entitlements', 'features', 'ሞጁል'] },
      { id: 'announcements', label: 'Announcements', labelAm: 'ማስታወቂያዎች', icon: Megaphone, keywords: ['broadcast', 'notices', 'ማስታወቂያ'] },
      { id: 'audit_logs', label: 'Security Audit Trail', labelAm: 'የደህንነት ኦዲት መዝገብ', icon: ShieldCheck, keywords: ['logs', 'compliance', 'ኦዲት'] },
    ],
  },
];

export const HOTEL_NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview_admin',
    label: 'Overview & Governance',
    labelAm: 'አጠቃላይ እይታ እና አስተዳደር',
    items: [
      { id: 'hotel_dashboard', label: 'Executive Dashboard', labelAm: 'የአስፈጻሚ ዳሽቦርድ', icon: LayoutDashboard, keywords: ['kpi', 'revenue', 'adr', 'revpar', 'ዳሽቦርድ'] },
      { id: 'hotel_profile', label: 'Organization Settings', labelAm: 'የድርጅት ቅንብሮች', icon: Settings, keywords: ['branding', 'currency', 'timezone', 'ቅንብር'] },
      { id: 'hotel_users', label: 'Staff Accounts & Roles', labelAm: 'የሰራተኞች መለያ እና ሚናዎች', icon: Users, keywords: ['users', 'access', 'invite', 'ሰራተኛ'] },
      { id: 'role_matrix', label: 'RBAC Permissions Matrix', labelAm: 'የሚና እና ፈቃድ ሰንጠረዥ', icon: ShieldCheck, keywords: ['rbac', 'security', 'roles', 'ፈቃድ'] },
      { id: 'hotel_subscription', label: 'Subscription & Billing', labelAm: 'ምዝገባ እና ክፍያ', icon: CreditCard, keywords: ['plan', 'renewal', 'payment', 'ክፍያ'] },
    ],
  },
  {
    id: 'property_setup',
    label: 'Property Configuration',
    labelAm: 'የሆቴል ማዋቀሪያ',
    items: [
      { id: 'rooms', label: 'Rooms & Categories', labelAm: 'ክፍሎች እና ምድቦች', icon: BedDouble, keywords: ['inventory', 'rates', 'suites', 'ክፍል'], requiredModule: 'front_office' },
      { id: 'departments', label: 'Departments Setup', labelAm: 'የክፍለ ሥራዎች ማዋቀሪያ', icon: Layers, keywords: ['cost centers', 'budgets', 'ክፍል'] },
      { id: 'outlets', label: 'Outlets & POS Centers', labelAm: 'መሸጫዎች እና የPOS ማዕከላት', icon: UtensilsCrossed, keywords: ['restaurants', 'bars', 'ምግብ ቤት'], requiredModule: 'f_and_b' },
      { id: 'employees', label: 'Employee Directory', labelAm: 'የሰራተኞች ማውጫ', icon: Users, keywords: ['staff', 'csv', 'directory', 'ሰራተኞች'] },
      { id: 'financial_rules', label: 'Financial Rules & Limits', labelAm: 'የፋይናንስ ሕጎች እና ገደቦች', icon: Receipt, keywords: ['vat', 'service charge', 'usali', 'ፋይናንስ'], requiredModule: 'finance_accounts' },
    ],
  },
  {
    id: 'guest_front_office',
    label: 'Front Office & Guest Journey',
    labelAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    items: [
      { id: 'front_office', label: 'Front Desk & Folios', labelAm: 'እንግዳ መቀበያ እና ሂሳቦች', icon: BedDouble, keywords: ['check-in', 'reservations', 'folios', 'እንግዳ'], requiredModule: 'front_office' },
      { id: 'housekeeping', label: 'Housekeeping Board', labelAm: 'የቤት አያያዝ ሰሌዳ', icon: Sparkles, keywords: ['turnover', 'cleaning', 'minibar', 'ጽዳት'], requiredModule: 'housekeeping' },
      { id: 'group_blocks', label: 'Group Room Blocks', labelAm: 'የቡድን ክፍል ምደባዎች', icon: FolderKanban, keywords: ['allotments', 'rooming list', 'cutoff', 'ቡድን'], requiredModule: 'front_office' },
      { id: 'in_room_tablet', label: 'Digital In-Room Hub', labelAm: 'የክፍል ውስጥ ዲጂታል ማዕከል', icon: Tablet, keywords: ['dnd', 'mur', 'suite tablet', 'ታብሌት'], requiredModule: 'front_office' },
      { id: 'concierge_fleet', label: 'Concierge & Safaris', labelAm: 'ኮንሲየርጅ እና ጉዞዎች', icon: Compass, keywords: ['transfers', 'shuttles', 'excursions', 'ጉዞ'], requiredModule: 'front_office' },
      { id: 'crm_spa', label: 'Guest CRM, Spa & Loyalty', labelAm: 'የእንግዳ CRM፣ ስፓ እና ታማኝነት', icon: Heart, keywords: ['vip', 'wellness', 'points', 'ስፓ'], requiredModule: 'spa_wellness' },
      { id: 'reputation', label: 'Reputation & CSAT', labelAm: 'ስም እና የእንግዳ እርካታ', icon: Star, keywords: ['reviews', 'nps', 'surveys', 'እርካታ'], requiredModule: 'guest_complaints' },
    ],
  },
  {
    id: 'fnb_venues',
    label: 'F&B, Culinary & Venues',
    labelAm: 'ምግብና መጠጥ፣ ወጥ ቤት እና አዳራሾች',
    items: [
      { id: 'pos_cashier', label: 'POS & Cashier Sessions', labelAm: 'POS እና የገንዘብ ተቀባይ ክፍለ ጊዜዎች', icon: UtensilsCrossed, keywords: ['orders', 'till', 'dining', 'ገንዘብ ተቀባይ'], requiredModule: 'f_and_b' },
      { id: 'restaurant_floor', label: 'Dining & Wine Cellar', labelAm: 'ምግብ ቤት እና የወይን ማከማቻ', icon: Wine, keywords: ['tables', 'wine cellar', 'waitlist', 'ጠረጴዛ'], requiredModule: 'f_and_b' },
      { id: 'recipes_menu', label: 'Recipe & Menu Matrix', labelAm: 'የምግብ አዘገጃጀት እና ሜኑ ማትሪክስ', icon: ChefHat, keywords: ['food cost', 'variance', 'culinary', 'ሜኑ'], requiredModule: 'kitchen_control' },
      { id: 'events', label: 'Conferences & Events', labelAm: 'ስብሰባዎች እና ዝግጅቶች', icon: Calendar, keywords: ['banqueting', 'beo', 'ballroom', 'ስብሰባ'], requiredModule: 'conference_events' },
    ],
  },
  {
    id: 'finance_revenue',
    label: 'Finance, Audit & Revenue',
    labelAm: 'ፋይናንስ፣ ኦዲት እና ገቢ',
    items: [
      { id: 'financial_management', label: 'Financial Management', labelAm: 'የፋይናንስ አስተዳደር', icon: Receipt, keywords: ['requisitions', 'flash', 'bank', 'ፋይናንስ'], requiredModule: 'finance_accounts' },
      { id: 'city_ledger', label: 'City Ledger & AR', labelAm: 'የድርጅት ሂሳብ እና ተሰብሳቢ', icon: Briefcase, keywords: ['corporate', 'invoices', 'commissions', 'ተሰብሳቢ'], requiredModule: 'finance_accounts' },
      { id: 'night_audit', label: 'Night Audit & EOD', labelAm: 'የምሽት ኦዲት እና የቀን መዝጊያ', icon: Moon, keywords: ['rate roll', 'drops', 'closing', 'ምሽት ኦዲት'], requiredModule: 'finance_accounts' },
      { id: 'channel_manager', label: 'CRS & Yield Management', labelAm: 'CRS እና የዋጋ አስተዳደር', icon: Globe, keywords: ['ota', 'rate parity', 'ari', 'ቻናል'], requiredModule: 'front_office' },
      { id: 'reporting_bi', label: 'Executive BI & Vault', labelAm: 'አስፈጻሚ BI እና ማህደር', icon: BarChart3, keywords: ['analytics', 'exports', 'targets', 'ሪፖርት'], requiredModule: 'reporting_bi' },
    ],
  },
  {
    id: 'boh_facilities',
    label: 'Stores, Supply & Facilities',
    labelAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    items: [
      { id: 'inventory', label: 'Stores & Inventory', labelAm: 'ዕቃ ግምጃ ቤት እና ክምችት', icon: Package, keywords: ['grv', 'siv', 'stock', 'ክምችት'], requiredModule: 'stores_inventory' },
      { id: 'procurement', label: 'Supply Chain & POs', labelAm: 'አቅርቦት ሰንሰለት እና የግዥ ትዕዛዞች', icon: Truck, keywords: ['vendors', 'purchase orders', '3-way', 'ግዥ'], requiredModule: 'purchasing_approval' },
      { id: 'laundry', label: 'Laundry & Linen', labelAm: 'ልብስ ማጠቢያ እና ሊነን', icon: Shirt, keywords: ['par', 'wash', 'valet', 'ማጠቢያ'], requiredModule: 'housekeeping' },
      { id: 'maintenance', label: 'Engineering & Assets', labelAm: 'ኢንጂነሪንግ እና ንብረቶች', icon: Wrench, keywords: ['work orders', 'ppm', 'ooo', 'ጥገና'], requiredModule: 'maintenance' },
      { id: 'energy_iot', label: 'Energy & Room IoT', labelAm: 'ኢነርጂ እና ዘመናዊ ክፍል IoT', icon: Zap, keywords: ['hvac', 'ems', 'submeters', 'ኢነርጂ'], requiredModule: 'maintenance' },
      { id: 'sustainability', label: 'Green Hospitality', labelAm: 'አረንጓዴ መስተንግዶ', icon: Leaf, keywords: ['utilities', 'waste', 'green key', 'አረንጓዴ'], requiredModule: 'reporting_bi' },
      { id: 'haccp_safety', label: 'Food Safety & Pool', labelAm: 'የምግብ ደህንነት እና መዋኛ', icon: ClipboardCheck, keywords: ['haccp', 'hygiene', 'pool', 'ንጽህና'], requiredModule: 'kitchen_control' },
      { id: 'valet_parking', label: 'Valet & EV Parking', labelAm: 'ቫሌት እና የEV ማቆሚያ', icon: Car, keywords: ['bays', 'charging', 'tickets', 'ማቆሚያ'], requiredModule: 'front_office' },
    ],
  },
  {
    id: 'workforce_security',
    label: 'Workforce, Safety & Dispatch',
    labelAm: 'የሰው ኃይል፣ ደህንነት እና ስርጭት',
    items: [
      { id: 'human_resources', label: 'HR, Rosters & Payroll', labelAm: 'የሰው ኃይል፣ ፈረቃ እና ደመወዝ', icon: Users, keywords: ['attendance', 'leave', 'service charge', 'ደመወዝ'], requiredModule: 'human_resources' },
      { id: 'staff_dispatch', label: 'Staff Tasks & Handover', labelAm: 'የሰራተኞች ተግባራት እና ርክክብ', icon: Radio, keywords: ['mod log', 'dispatch', 'broadcast', 'ርክክብ'] },
      { id: 'security_recovery', label: 'Security & Recovery', labelAm: 'ደህንነት እና አገልግሎት ማገገሚያ', icon: ShieldAlert, keywords: ['incidents', 'gate pass', 'sla', 'ደህንነት'], requiredModule: 'security' },
    ],
  },
];

export function findNavContext(
  tabId: string,
  isSuperAdmin: boolean,
  language: 'en' | 'am' = 'en'
): { groupLabel: string; item: NavItem & { displayLabel: string } } | null {
  const groups = isSuperAdmin ? SUPER_ADMIN_NAV_GROUPS : HOTEL_NAV_GROUPS;
  for (const group of groups) {
    const found = group.items.find((i) => i.id === tabId);
    if (found) {
      return {
        groupLabel: language === 'am' ? group.labelAm : group.label,
        item: {
          ...found,
          displayLabel: language === 'am' ? found.labelAm : found.label,
        },
      };
    }
  }
  return null;
}

export function getAllNavItems(
  isSuperAdmin: boolean,
  language: 'en' | 'am' = 'en'
): Array<NavItem & { groupLabel: string; displayLabel: string }> {
  const groups = isSuperAdmin ? SUPER_ADMIN_NAV_GROUPS : HOTEL_NAV_GROUPS;
  return groups.flatMap((g) =>
    g.items.map((item) => ({
      ...item,
      groupLabel: language === 'am' ? g.labelAm : g.label,
      displayLabel: language === 'am' ? item.labelAm : item.label,
    }))
  );
}
