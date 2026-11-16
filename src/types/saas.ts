/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SEAM Hotel Management System - Core Multi-tenant Data Models & Types
 * (Phase 1 Foundation + Phase 2 Hotel Administration & Operations Configuration)
 */

export type SubscriptionPlanId = 'basic' | 'standard' | 'premium' | 'custom';
export type SubscriptionStatus = 'trial' | 'active' | 'grace_period' | 'expired' | 'suspended';
export type HotelStatus = 'active' | 'suspended' | 'pending_setup';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type PaymentStatus = 'paid' | 'pending_verification' | 'overdue' | 'waived';
export type PaymentMethod = 'bank_transfer' | 'telebirr' | 'cbe_birr' | 'credit_card' | 'manual_cash';

export type UserRole = 
  | 'super_admin'
  | 'hotel_admin'
  | 'owner'
  | 'gm'
  | 'deputy_gm'
  | 'finance_manager'
  | 'dept_head'
  | 'supervisor'
  | 'senior_staff'
  | 'staff'
  | 'viewer'
  | 'auditor'
  | 'custom';

export type UserAccountStatus = 'active' | 'invited' | 'on_leave' | 'suspended' | 'terminated';

export type SystemModuleId = 
  | 'front_office'
  | 'housekeeping'
  | 'f_and_b'
  | 'kitchen_control'
  | 'stores_inventory'
  | 'finance_accounts'
  | 'human_resources'
  | 'purchasing_approval'
  | 'conference_events'
  | 'spa_wellness'
  | 'maintenance'
  | 'security'
  | 'guest_complaints'
  | 'reporting_bi';

export interface SystemModuleInfo {
  id: SystemModuleId;
  name: string;
  nameAm: string;
  description: string;
  descriptionAm?: string;
  defaultInBasic: boolean;
  defaultInStandard: boolean;
  defaultInPremium: boolean;
}

export interface Hotel {
  id: string; // e.g. "htl_sample_a"
  name: string; // e.g. "Sample Property A"
  legalName: string;
  code: string; // e.g. "GRHR"
  logoUrl?: string;
  address: {
    street: string;
    city: string;
    stateRegion: string;
    country: string; // e.g. "Ethiopia", "Kenya", "USA"
    postalCode?: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    emergencyPhone?: string;
  };
  operationalSettings: {
    currency: string; // "ETB", "USD", "EUR", "KES", etc.
    currencySymbol: string; // "Br", "$", "€"
    timeZone: string; // "Africa/Addis_Ababa", "UTC"
    defaultLanguage: 'en' | 'am';
    fiscalYearStartMonth: number; // 1-12 (e.g. 7 for July)
    totalRooms: number;
    vatRate: number; // e.g. 15 for 15%
    serviceChargeRate: number; // e.g. 10 for 10%
  };
  subscriptionId: string;
  subscriptionPlan: SubscriptionPlanId;
  subscriptionStatus: SubscriptionStatus;
  enabledModules: SystemModuleId[];
  limits: {
    maxUsers: number;
    maxRooms: number;
    maxOutlets: number;
    storageLimitMb: number;
  };
  status: HotelStatus;
  createdAt: string; // ISO 8601
  createdBy: string; // Super Admin UID / email
  updatedAt: string;
  updatedBy: string;
}

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  nameAm?: string;
  targetAudience: string;
  targetAudienceAm?: string;
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  monthlyPriceETB: number;
  annualPriceETB: number;
  maxRooms: number;
  maxUsers: number;
  maxOutlets: number;
  includedModules: SystemModuleId[];
  features: string[];
  featuresAm?: string[];
}

export interface Subscription {
  id: string;
  hotelId: string;
  hotelName: string;
  planId: SubscriptionPlanId;
  planName: string;
  billingCycle: BillingCycle;
  price: number;
  currency: string;
  startDate: string;
  expiryDate: string;
  gracePeriodDays: number;
  gracePeriodEndsAt: string;
  paymentStatus: PaymentStatus;
  status: SubscriptionStatus;
  suspensionReason?: string;
  autoRenew: boolean;
  history: Array<{
    action: 'created' | 'renewed' | 'grace_entered' | 'suspended' | 'reactivated' | 'plan_changed';
    performedBy: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  referenceNumber: string;
  subscriptionId: string;
  hotelId: string;
  hotelName: string;
  amount: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paymentMethod: PaymentMethod;
  paymentReference: string; // Bank slip or transaction ID
  attachmentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  status: 'pending_review' | 'verified' | 'rejected';
  notes?: string;
  createdAt: string;
}

export interface HotelUser {
  id: string;
  uid: string;
  hotelId: string;
  employeeId?: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  status: UserAccountStatus;
  passwordHash?: string;
  requirePasswordChange: boolean;
  temporaryPermissions?: {
    grantedDepartments: string[];
    expiresAt: string;
    grantedBy: string;
  };
  lastLoginAt?: string;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUser {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: 'super_admin';
  status: 'active' | 'suspended';
  passwordHash?: string;
  grantedBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AccessGrantRecord {
  grantId: string;
  emailLower: string;
  fullName: string;
  hotelId: string;
  role: UserRole;
  departmentName?: string;
  employeeId?: string;
  status: UserAccountStatus;
  grantedByUid: string;
  grantedByRole: 'super_admin' | 'hotel_admin' | 'gm' | 'owner';
}

export interface AuditLog {
  id: string;
  hotelId?: string;
  hotelName?: string;
  actor: {
    uid: string;
    email: string;
    fullName: string;
    role: string;
    ipAddress?: string;
  };
  action: string;
  module: 'auth' | 'hotels' | 'subscriptions' | 'users' | 'settings' | 'security' | 'rooms' | 'departments' | 'outlets' | 'employees' | 'finance';
  targetId: string;
  description: string;
  descriptionAm?: string;
  changes?: {
    field: string;
    previousValue: unknown;
    newValue: unknown;
  }[];
  reason?: string;
  timestamp: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  titleAm?: string;
  content: string;
  contentAm?: string;
  severity: 'info' | 'important' | 'critical';
  targetHotelId?: string;
  targetRole?: UserRole | 'all';
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

export interface RolePermissionConfig {
  role: UserRole;
  roleTitle: string;
  roleTitleAm?: string;
  description: string;
  descriptionAm?: string;
  canAccessSuperAdmin: boolean;
  canConfigureHotelSettings: boolean;
  canManageUsers: boolean;
  canViewFinancials: boolean;
  canApprovePurchases: boolean;
  canAudit: boolean;
  allowedModules: SystemModuleId[];
  actionRights: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
}

// ==========================================
// PHASE 2: HOTEL CONFIGURATION ENTITIES
// ==========================================

export interface Department {
  id: string;
  hotelId: string;
  code: string; // e.g. "FO", "HK", "FB", "FIN"
  name: string; // "Front Office"
  nameAm?: string; // "የፊት ቢሮ"
  description: string;
  descriptionAm?: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  operatingBudget?: number;
  reportingDeadlineHour?: number; // 0-23 (e.g. 23 for 23:00)
  createdAt: string;
  updatedAt: string;
}

export type OutletType =
  | 'main_restaurant'
  | 'bar_lounge'
  | 'coffee_shop'
  | 'room_service'
  | 'pool_bar'
  | 'banquet_hall'
  | 'spa_outlet'
  | 'other';

export interface Outlet {
  id: string;
  hotelId: string;
  code: string; // e.g. "REST-01"
  name: string; // "Abaya View Restaurant"
  type: OutletType;
  openingHours: string; // "06:30 - 23:00"
  seatingCapacity: number;
  managerName?: string;
  managerPhone?: string;
  status: 'active' | 'inactive';
  acceptsRoomCharge: boolean;
  printerIpOrLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  code: string; // "STD", "DLX", "SUI", "VIL"
  name: string; // "Deluxe Lakeview Suite"
  description: string;
  standardRate: number; // e.g. 2800 ETB or $140 USD
  baseRateCurrency: string;
  capacityAdults: number;
  capacityChildren: number;
  bedType: 'Single' | 'Double' | 'King' | 'Twin' | 'Suite';
  amenities: string[];
  totalUnitsCount: number;
  colorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomOperationalStatus =
  | 'clean'
  | 'dirty'
  | 'inspected'
  | 'occupied'
  | 'out_of_order'
  | 'maintenance';

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string; // "101", "204B"
  floor: number; // 1, 2, 3...
  roomTypeId: string;
  roomTypeName: string;
  standardRate: number;
  capacity: number;
  status: RoomOperationalStatus;
  amenities: string[];
  keyCardUid?: string;
  notes?: string;
  lastCleanedAt?: string;
  lastCleanedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  hotelId: string;
  employeeId: string; // "EMP-001"
  fullName: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  position: string; // "Front Desk Officer", "Executive Chef"
  employmentDate: string; // "2025-03-01"
  employmentStatus: 'active' | 'on_leave' | 'suspended' | 'terminated';
  salary?: number;
  bankAccountNumber?: string;
  bankName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  userAccountId?: string;
  role?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface HotelFinancialRules {
  id: string;
  hotelId: string;
  currency: string;
  currencySymbol: string;
  vatRate: number; // 15
  serviceChargeRate: number; // 10
  fiscalYearStartMonth: number; // 7
  financialPeriods: Array<{
    periodName: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
  }>;
  accountCodes: Array<{
    code: string;
    name: string;
    category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  }>;
  expenseCategories: string[];
  acceptedPaymentMethods: string[];
  approvalLimits: {
    deptHeadLimit: number;
    financeManagerLimit: number;
    gmLimit: number;
  };
  reportingDeadlines: {
    dailyClosingTime: string; // "23:30"
    lateNotificationGraceMinutes: number; // 30
    notifyGMOnMissing: boolean;
    notifyOwnerOnWeeklySummary: boolean;
  };
  updatedAt: string;
}

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'amount'
  | 'dropdown'
  | 'date'
  | 'boolean'
  | 'photo'
  | 'attachment';

export interface CustomField {
  id: string;
  hotelId: string;
  module: SystemModuleId | 'general' | 'guest_profile';
  fieldName: string; // e.g. "car_plate_number"
  fieldLabel: string; // "Vehicle License Plate"
  fieldType: CustomFieldType;
  options?: string[]; // for dropdown
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// PHASE 3: FRONT OFFICE, HOUSEKEEPING & POS CASHIER
// ==========================================

export type BookingStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export interface Reservation {
  id: string;
  bookingReference: string; // "BK-2026-104"
  hotelId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdOrPassport?: string;
  nationality?: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId?: string;
  roomNumber?: string;
  checkInDate: string; // "2026-11-06"
  checkOutDate: string; // "2026-11-08"
  nights: number;
  dailyRate: number;
  totalRoomCharge: number;
  status: BookingStatus;
  source: 'walk_in' | 'phone' | 'website' | 'booking_com' | 'corporate';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  specialRequests?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolioChargeItem {
  id: string;
  date: string;
  category: 'room_rate' | 'restaurant' | 'bar' | 'room_service' | 'laundry' | 'minibar' | 'spa' | 'tax' | 'other';
  description: string;
  outletName?: string;
  amount: number;
  postedBy: string;
}

export interface FolioPaymentItem {
  id: string;
  date: string;
  amount: number;
  method: string; // 'Cash', 'Telebirr', 'Commercial Bank of Ethiopia (CBE)', 'Credit Card'
  reference: string;
  receivedBy: string;
}

export interface GuestFolio {
  id: string;
  bookingId: string;
  bookingReference: string;
  hotelId: string;
  guestName: string;
  roomNumber: string;
  charges: FolioChargeItem[];
  payments: FolioPaymentItem[];
  vatAmount: number;
  serviceChargeAmount: number;
  subtotal: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  status: 'open' | 'settled';
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  roomTypeName: string;
  priority: 'high' | 'normal' | 'low';
  cleaningType: 'departure_clean' | 'stayover_service' | 'deep_clean' | 'touch_up';
  status: 'dirty' | 'in_progress' | 'clean' | 'inspected';
  assignedStaffId?: string;
  assignedStaffName?: string;
  linenReplaced: boolean;
  minibarRestocked: boolean;
  minibarItemsCount?: number;
  minibarChargeAmount?: number;
  maintenanceIssue?: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  updatedAt: string;
}

export interface CashierShift {
  id: string;
  hotelId: string;
  outletId: string;
  outletName: string;
  cashierUserId: string;
  cashierName: string;
  shiftNumber: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  telebirrSales: number;
  roomChargeSales: number;
  totalRevenue: number;
  actualCashCounted?: number;
  cashVariance?: number;
  notes?: string;
}

export interface OutletMenuItem {
  id: string;
  hotelId: string;
  outletId: string;
  name: string;
  category: 'food' | 'beverage' | 'dessert' | 'snack';
  price: number;
  currency: string;
  isAvailable: boolean;
}

// ==========================================
// PHASE 4: FINANCIAL MANAGEMENT & RECONCILIATIONS
// ==========================================

export type RequisitionStatus =
  | 'pending_dept_head'
  | 'pending_finance'
  | 'pending_gm'
  | 'approved'
  | 'rejected'
  | 'settled';

export interface PurchaseRequisition {
  id: string;
  hotelId: string;
  requisitionNumber: string; // "REQ-2026-081"
  departmentId: string;
  departmentName: string;
  category: string; // Food, Maintenance, Linen, Utilities, etc.
  description: string;
  amount: number;
  currency: string;
  vendorName: string;
  invoiceReference?: string;
  requestedBy: {
    name: string;
    email: string;
    role: string;
  };
  status: RequisitionStatus;
  currentApprovalTier: 'dept_head' | 'finance' | 'gm' | 'owner';
  approvalHistory: Array<{
    tier: string;
    approverName: string;
    action: 'approved' | 'rejected';
    comment?: string;
    timestamp: string;
  }>;
  rejectionReason?: string;
  settlementMethod?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyRevenueRecord {
  id: string;
  hotelId: string;
  date: string; // "2026-11-05"
  roomsRevenue: number;
  foodRevenue: number;
  beverageRevenue: number;
  otherRevenue: number;
  totalGrossRevenue: number;
  vatCollected: number;
  serviceChargeCollected: number;
  totalNetRevenue: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number; // percentage e.g. 78
  adr: number; // Average Daily Rate e.g. 2850 ETB
  revPar: number; // Revenue Per Available Room e.g. 2223 ETB
  cashCollected: number;
  cardCollected: number;
  telebirrCollected: number;
  roomChargeCollected: number;
  approvedByGM: boolean;
  gmNotes?: string;
  submittedAt: string;
}

export interface BankReconciliationItem {
  id: string;
  hotelId: string;
  date: string;
  accountName: string; // "CBE Commercial Bank", "Telebirr Merchant", "Awash Bank"
  accountNumber: string;
  systemRecordedAmount: number;
  bankStatementAmount: number;
  variance: number; // bankStatementAmount - systemRecordedAmount
  status: 'matched' | 'discrepancy' | 'pending';
  reconciledBy?: string;
  notes?: string;
  updatedAt: string;
}

// ==========================================
// PHASE 5: STORES & STOCK INVENTORY MANAGEMENT
// ==========================================

export type StockCategory =
  | 'food'
  | 'beverage'
  | 'linen'
  | 'cleaning_supplies'
  | 'guest_amenities'
  | 'maintenance'
  | 'stationery'
  | 'fuel';

export interface StoreLocation {
  id: string;
  hotelId: string;
  code: string;
  name: string;
  managerName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockItem {
  id: string;
  hotelId: string;
  itemCode: string;
  name: string;
  category: StockCategory;
  unitOfMeasure: string;
  storeLocationId: string;
  storeLocationName: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  currency: string;
  totalValue: number;
  preferredSupplier?: string;
  lastRestockedAt?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface GRVItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unitOfMeasure: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface GoodsReceivedVoucher {
  id: string;
  hotelId: string;
  grvNumber: string;
  vendorName: string;
  invoiceReference?: string;
  purchaseRequisitionNumber?: string;
  storeLocationId: string;
  storeLocationName: string;
  receivedDate: string;
  receivedBy: string;
  items: GRVItem[];
  grandTotal: number;
  currency: string;
  status: 'verified' | 'draft';
  notes?: string;
  createdAt: string;
}

export interface SIVItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unitOfMeasure: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface StoreIssueVoucher {
  id: string;
  hotelId: string;
  sivNumber: string;
  requestingDepartmentId: string;
  requestingDepartmentName: string;
  storeLocationId: string;
  storeLocationName: string;
  issuedToStaffName: string;
  issuedBy: string;
  issueDate: string;
  purpose: string;
  items: SIVItem[];
  totalValue: number;
  currency: string;
  status: 'issued' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  hotelId: string;
  adjustmentNumber: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  storeLocationId: string;
  storeLocationName: string;
  adjustmentType: 'spoilage' | 'breakage' | 'physical_count_variance' | 'expired' | 'return_to_vendor';
  previousQuantity: number;
  newQuantity: number;
  quantityDelta: number;
  unitCost: number;
  totalImpactValue: number;
  reason: string;
  authorizedBy: string;
  date: string;
  createdAt: string;
}

// ==========================================
// PHASE 6: MAINTENANCE, ENGINEERING & ASSET WORK ORDERS
// ==========================================

export type MaintenanceCategory =
  | 'hvac'
  | 'electrical'
  | 'plumbing'
  | 'generator_power'
  | 'kitchen_appliance'
  | 'carpentry_masonry'
  | 'fire_safety'
  | 'pool_spa'
  | 'telecom_it';

export type WorkOrderPriority = 'critical' | 'high' | 'medium' | 'low';

export type WorkOrderStatus =
  | 'reported'
  | 'assigned'
  | 'in_progress'
  | 'parts_pending'
  | 'resolved'
  | 'closed';

export interface AssetRecord {
  id: string;
  hotelId: string;
  assetCode: string; // e.g. "AST-GEN-01"
  name: string;
  category: MaintenanceCategory;
  location: string;
  manufacturer: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry?: string;
  operatingStatus: 'operational' | 'degraded' | 'under_maintenance' | 'critical_failure' | 'decommissioned';
  lastServicedDate?: string;
  nextScheduledServiceDate: string;
  serviceIntervalDays: number;
  criticality: 'vital' | 'essential' | 'desirable';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderPartItem {
  itemId?: string;
  itemCode?: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface WorkOrder {
  id: string;
  hotelId: string;
  ticketNumber: string; // e.g. "WO-2026-142"
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  source: 'housekeeping' | 'front_desk' | 'guest_complaint' | 'routine_inspection' | 'preventive_schedule';
  targetType: 'room' | 'outlet' | 'equipment_asset' | 'public_area';
  roomId?: string;
  roomNumber?: string;
  outletId?: string;
  outletName?: string;
  assetId?: string;
  assetName?: string;
  roomOutOfOrder: boolean;
  reportedBy: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  reportedAt: string;
  startedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  inspectedBy?: string;
  rootCause?: string;
  resolutionNotes?: string;
  laborHours?: number;
  partsUsed: WorkOrderPartItem[];
  totalPartsCost: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreventiveChecklistItem {
  id: string;
  task: string;
  isMandatory: boolean;
}

export interface PreventiveSchedule {
  id: string;
  hotelId: string;
  scheduleCode: string; // e.g. "PPM-GEN-250"
  title: string;
  assetId?: string;
  assetName: string;
  category: MaintenanceCategory;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  checklist: PreventiveChecklistItem[];
  estimatedHours: number;
  assignedRoleOrTech: string;
  lastRunDate?: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// PHASE 7: CONFERENCES, EVENTS & BANQUETING
// ==========================================

export type EventSpaceSetupType =
  | 'theater'
  | 'classroom'
  | 'banquet'
  | 'u_shape'
  | 'boardroom'
  | 'cocktail';

export type EventBookingStatus =
  | 'inquiry'
  | 'tentative'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface EventSpace {
  id: string;
  hotelId: string;
  code: string; // e.g. "HALL-BALLROOM"
  name: string; // "Grand Abaya Ballroom"
  floorOrLocation: string;
  dimensionsMeters?: string;
  areaSqMeters: number;
  capacities: {
    theater: number;
    classroom: number;
    banquet: number;
    u_shape: number;
    boardroom: number;
    cocktail: number;
  };
  dailyRate: number;
  halfDayRate: number;
  hourlyRate: number;
  currency: string;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
}

export interface BanquetEventItem {
  itemType: 'venue_rental' | 'catering_package' | 'beverage_break' | 'av_equipment' | 'decor' | 'other';
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface EventBooking {
  id: string;
  hotelId: string;
  bookingReference: string; // e.g. "EVT-2026-088"
  eventTitle: string;
  clientName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  organizationTin?: string;
  eventSpaceId: string;
  eventSpaceName: string;
  setupType: EventSpaceSetupType;
  expectedAttendees: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // "08:30"
  endTime: string; // "17:30"
  status: EventBookingStatus;
  cateringMenuTitle?: string;
  specialDietaryNotes?: string;
  avRequirements: string[];
  lineItems: BanquetEventItem[];
  subtotal: number;
  serviceCharge10Pct: number;
  vat15Pct: number;
  grandTotal: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  linkedFolioId?: string;
  beoApprovedByGM: boolean;
  beoApprovedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 8: GUEST CRM, SPA & LOYALTY
// ==========================================

export type VIPTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'presidential';

export interface GuestProfile {
  id: string;
  hotelId: string;
  guestCode: string; // e.g. "GST-8819"
  fullName: string;
  email: string;
  phone: string;
  nationality?: string;
  idOrPassportNumber?: string;
  companyAffiliation?: string;
  vipTier: VIPTier;
  loyaltyPointsBalance: number;
  lifetimeStaysCount: number;
  lifetimeSpend: number;
  currency: string;
  preferences: {
    roomLocation?: 'high_floor' | 'low_floor' | 'quiet_corner' | 'near_elevator';
    pillowType?: 'feather' | 'foam' | 'memory_foam' | 'hypoallergenic';
    dietaryRestrictions?: string[];
    favoriteDrink?: string;
    specialNotes?: string;
  };
  lastStayDate?: string;
  status: 'active' | 'blacklisted' | 'vip_flagged';
  satisfactionScore?: number; // 1-5 stars
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyReward {
  id: string;
  hotelId: string;
  title: string;
  category: 'room_upgrade' | 'spa_treatment' | 'f_and_b' | 'airport_transfer' | 'late_checkout';
  pointsRequired: number;
  description: string;
  isActive: boolean;
}

export interface LoyaltyTransaction {
  id: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  type: 'accrual' | 'redemption' | 'tier_bonus' | 'manual_adjustment';
  points: number;
  description: string;
  referenceId?: string;
  date: string;
  performedBy: string;
}

export interface SpaTreatment {
  id: string;
  hotelId: string;
  code: string; // e.g. "SPA-SWED-60"
  name: string;
  category: 'massage' | 'body_scrub' | 'facial' | 'sauna_thermal' | 'wellness_package';
  durationMinutes: number; // 30, 45, 60, 90, 120
  price: number;
  currency: string;
  therapistCommissionRate: number; // percentage e.g. 15
  description: string;
  isAvailable: boolean;
}

export interface SpaAppointment {
  id: string;
  hotelId: string;
  appointmentNumber: string; // e.g. "SPA-2026-081"
  guestId?: string;
  guestName: string;
  roomId?: string;
  roomNumber?: string;
  treatmentId: string;
  treatmentName: string;
  durationMinutes: number;
  therapistName: string;
  treatmentRoom: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  endTime: string; // "15:00"
  price: number;
  currency: string;
  status: 'scheduled' | 'in_service' | 'completed' | 'no_show' | 'cancelled';
  chargeToRoomFolio: boolean;
  linkedFolioId?: string;
  paymentStatus: 'paid' | 'charged_to_room' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface GuestFeedback {
  id: string;
  hotelId: string;
  guestId?: string;
  guestName: string;
  roomNumber?: string;
  stayReference?: string;
  overallRating: number; // 1-5
  cleanlinessRating: number; // 1-5
  staffFriendlinessRating: number; // 1-5
  foodQualityRating: number; // 1-5
  amenitiesRating: number; // 1-5
  npsScore: number; // 0-10
  comments: string;
  status: 'new' | 'reviewed' | 'resolved' | 'escalated';
  managementResponse?: string;
  date: string;
}

// ==========================================
// PHASE 9: HUMAN RESOURCES, SHIFT ROSTERING & PAYROLL
// ==========================================

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'split' | 'off';

export interface ShiftSchedule {
  id: string;
  hotelId: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "15:30"
  notes?: string;
  status: 'scheduled' | 'completed' | 'absent' | 'swapped';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  hotelId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // "06:55"
  clockOutTime?: string; // "15:35"
  totalHours: number; // e.g. 8.5
  overtimeHours: number; // e.g. 0.5
  status: 'on_time' | 'late' | 'overtime' | 'incomplete';
  notes?: string;
}

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'compassionate';

export interface LeaveRequest {
  id: string;
  hotelId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface PayrollPeriod {
  id: string;
  hotelId: string;
  periodName: string; // e.g. "October 2026"
  startDate: string;
  endDate: string;
  totalGrossWages: number;
  totalServiceChargePool: number;
  totalTaxDeductions: number;
  totalPensionDeductions: number;
  totalNetPay: number;
  eligibleStaffCount: number;
  currency: string;
  status: 'draft' | 'approved' | 'disbursed';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface EmployeePayrollItem {
  id: string;
  payrollPeriodId: string;
  hotelId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  baseSalary: number;
  serviceChargeShare: number;
  overtimeHours: number;
  overtimePay: number;
  bonuses: number;
  grossPay: number;
  pensionEmployee: number; // 7%
  pensionEmployer: number; // 11%
  incomeTax: number; // progressive tax
  otherDeductions: number;
  netPay: number;
  currency: string;
  status: 'pending' | 'paid';
}

// ==========================================
// PHASE 10: EXECUTIVE BUSINESS INTELLIGENCE (BI) & PORTFOLIO ANALYTICS
// ==========================================

export interface PortfolioMetric {
  hotelId: string;
  hotelName: string;
  hotelCode: string;
  city: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number; // percentage e.g. 78
  adr: number; // Average Daily Rate
  revPar: number; // Revenue Per Available Room
  grossRevenue: number;
  netRevenue: number;
  roomsRevenue: number;
  fAndBRevenue: number;
  otherRevenue: number;
  gop: number; // Gross Operating Profit
  gopMargin: number; // e.g. 48.2%
  currency: string;
}

export interface ChannelDistribution {
  channel: 'direct' | 'ota_booking' | 'corporate' | 'walk_in' | 'events_banquet';
  channelLabel: string;
  percentage: number;
  revenue: number;
  bookingsCount: number;
  adr: number;
}

export type ExportReportType =
  | 'daily_revenue_flash'
  | 'vat_service_charge_tax'
  | 'occupancy_statistics'
  | 'general_ledger_trial_balance'
  | 'employee_payroll_summary'
  | 'full_tenant_backup';

export interface ExportJob {
  id: string;
  hotelId: string;
  reportType: ExportReportType;
  title: string;
  format: 'csv' | 'json' | 'excel';
  fileSizeBytes: number;
  recordsCount: number;
  generatedBy: string;
  generatedAt: string;
  downloadUrl?: string;
}

export interface KPITargetItem {
  kpiKey: string;
  label: string;
  targetValue: number;
  actualValue: number;
  unit: '%' | 'currency' | 'ratio';
  variance: number;
  status: 'on_track' | 'at_risk' | 'exceeded';
}

// ==========================================
// PHASE 11: SECURITY, LOSS PREVENTION, VISITOR PASSES & GUEST SERVICE RECOVERY
// ==========================================

export type SecurityIncidentCategory =
  | 'noise_disturbance'
  | 'theft_loss'
  | 'unauthorized_entry'
  | 'property_damage'
  | 'medical_emergency'
  | 'safe_override'
  | 'fire_alarm';

export interface SecurityIncident {
  id: string;
  hotelId: string;
  incidentNumber: string; // e.g. "SEC-2026-039"
  category: SecurityIncidentCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string; // e.g. "Room 204", "Pool Terrace", "Main Lobby"
  reportedBy: string;
  investigatingOfficer: string;
  description: string;
  cctvReviewed: boolean;
  policeNotified: boolean;
  status: 'open' | 'under_investigation' | 'resolved' | 'escalated';
  resolutionNotes?: string;
  timestamp: string;
}

export type VisitorType =
  | 'guest_visitor'
  | 'vendor_supplier'
  | 'contractor'
  | 'event_attendee'
  | 'official';

export interface VisitorGatePass {
  id: string;
  hotelId: string;
  passNumber: string; // e.g. "GP-2026-104"
  visitorName: string;
  visitorPhone: string;
  visitorType: VisitorType;
  visitingRoomOrDept: string; // e.g. "Room 302", "Kitchen Store", "GM Office"
  vehiclePlate?: string; // e.g. "AA 3-B12948"
  vehicleModel?: string; // e.g. "Toyota Hilux White"
  badgeNumber: string; // "VISITOR-08"
  entryTime: string; // "09:30"
  exitTime?: string; // "14:15"
  date: string; // "2026-11-08"
  status: 'active' | 'cleared';
  authorizedBy: string;
}

export type LostAndFoundCategory =
  | 'electronics'
  | 'documents_passport'
  | 'jewelry'
  | 'clothing'
  | 'luggage'
  | 'other';

export interface LostAndFoundItem {
  id: string;
  hotelId: string;
  itemNumber: string; // e.g. "LF-2026-081"
  category: LostAndFoundCategory;
  itemName: string;
  description: string;
  foundLocation: string; // e.g. "Room 204 beside bedside lamp"
  foundBy: string; // e.g. "Meron Tadesse (Housekeeping)"
  foundDate: string; // YYYY-MM-DD
  storageLocker: string; // e.g. "Security Safe Locker #4"
  status: 'in_safekeeping' | 'claimed' | 'disposed' | 'donated';
  claimedBy?: string;
  claimedDate?: string;
  claimNotes?: string;
  guestIdOrPhone?: string;
}

export type ComplaintCategory =
  | 'room_comfort'
  | 'noise'
  | 'food_beverage'
  | 'staff_service'
  | 'billing'
  | 'maintenance'
  | 'wifi_amenity';

export interface GuestComplaintTicket {
  id: string;
  hotelId: string;
  ticketNumber: string; // e.g. "SR-2026-042"
  guestId?: string;
  guestName: string;
  roomNumber?: string;
  category: ComplaintCategory;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  departmentAttribution: string; // "Housekeeping", "Kitchen", "Maintenance", "Front Desk"
  description: string;
  slaMinutes: number; // target resolution e.g. 30 mins
  timeElapsedMinutes: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo: string;
  compensationOffered?: {
    type: 'loyalty_points' | 'complimentary_meal' | 'room_discount' | 'apology_amenity';
    detail: string;
    value: number;
  };
  resolutionNotes?: string;
  guestSatisfied: boolean;
  createdAt: string;
  resolvedAt?: string;
}

// ==========================================
// PHASE 12: CONCIERGE, TRANSPORT FLEET, AIRPORT TRANSFERS & EXCURSIONS
// ==========================================

export type FleetVehicleType = 'shuttle_van' | 'luxury_suv' | 'safari_cruiser' | 'executive_sedan' | 'safari_boat';

export interface FleetVehicle {
  id: string;
  hotelId: string;
  vehicleCode: string; // "FLT-VAN-01", "FLT-BOAT-01"
  makeModel: string; // "Toyota Coaster 22-Seater", "Land Cruiser 4x4", "Yamaha Chamo Safari Boat"
  licensePlate: string; // "ET-AA-3-99120"
  vehicleType: FleetVehicleType;
  passengerCapacity: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  currentOdometerKm: number;
  fuelLevelPercent: number; // 0 - 100
  status: 'available' | 'on_trip' | 'in_maintenance' | 'reserved';
  lastServicedDate: string;
  notes?: string;
}

export type TransferType = 'airport_pickup' | 'airport_dropoff' | 'city_transfer' | 'vip_chauffeur';

export interface AirportTransferBooking {
  id: string;
  hotelId: string;
  bookingNumber: string; // "TRF-2026-081"
  guestId?: string;
  guestName: string;
  roomId?: string;
  roomNumber?: string;
  transferType: TransferType;
  flightNumber: string; // "ET 135"
  flightAirline: string; // "Ethiopian Airlines"
  pickupLocation: string; // "Arba Minch Airport (AMH) Terminal 1"
  dropoffLocation: string; // "Sample Property A Lobby"
  scheduledDateTime: string; // "2026-11-08T14:30:00Z"
  passengerCount: number;
  luggagePieces: number;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  assignedDriverName?: string;
  rate: number;
  currency: string;
  isComplimentaryVIP: boolean;
  chargeToFolio: boolean;
  status: 'scheduled' | 'driver_dispatched' | 'completed' | 'cancelled' | 'flight_delayed';
  notes?: string;
  createdAt: string;
}

export interface ExcursionActivity {
  id: string;
  hotelId: string;
  code: string; // "EXC-CHAMO-01"
  title: string; // "Lake Chamo Giant Crocodile & Hippo Boat Safari"
  category: 'boat_safari' | 'game_drive' | 'cultural_heritage' | 'trekking_nature' | 'birdwatching';
  durationHours: number; // 3.5
  pricePerPerson: number;
  currency: string;
  maxParticipants: number;
  includesParkPermit: boolean;
  parkPermitFee: number;
  description: string;
  itinerarySummary: string;
  isActive: boolean;
}

export interface ExcursionBooking {
  id: string;
  hotelId: string;
  bookingRef: string; // "EXC-2026-042"
  activityId: string;
  activityTitle: string;
  guestId?: string;
  guestName: string;
  roomId?: string;
  roomNumber?: string;
  tourDate: string; // "2026-11-09"
  tourTime: string; // "08:30"
  participantsCount: number;
  licensedGuideName: string;
  assignedVehiclePlate?: string;
  kitchenPicnicBoxesRequested: number;
  ratePerPerson: number;
  parkPermitsTotal: number;
  totalPrice: number;
  currency: string;
  chargeToFolio: boolean;
  paymentStatus: 'charged_to_room' | 'paid_direct' | 'billed_to_agency';
  tourOperatorAgency?: string; // e.g. "Tour Operator A", "Tour Operator B"
  status: 'confirmed' | 'departed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

// ==========================================
// PHASE 13: SUSTAINABILITY, UTILITIES, FOOD WASTE & ECO-AUDITS
// ==========================================

export type UtilitySource =
  | 'grid_power'
  | 'diesel_generator'
  | 'solar_photovoltaic'
  | 'borehole_water'
  | 'spring_water'
  | 'recycled_greywater';

export interface UtilityConsumptionLog {
  id: string;
  hotelId: string;
  logDate: string; // "2026-11-07"
  utilityType: 'electricity' | 'water' | 'generator_diesel' | 'solar_generation';
  source: UtilitySource;
  meterReadingStart: number;
  meterReadingEnd: number;
  consumptionUnits: number; // kWh, Litres, or m³
  unitOfMeasure: 'kWh' | 'm3' | 'litre';
  unitCost: number; // Cost in ETB per unit
  totalCost: number;
  currency: string;
  occupiedRoomsCount: number; // for Cost Per Occupied Room (CPOR)
  costPerOccupiedRoom: number; // totalCost / occupiedRoomsCount
  loggedBy: string;
  notes?: string;
  createdAt: string;
}

export type WasteCategory = 'prep_trimming' | 'buffet_surplus' | 'plate_waste' | 'spoilage_expired';
export type WasteDestination = 'composting_garden' | 'livestock_feed' | 'biogas_digester' | 'landfill';

export interface FoodWasteLog {
  id: string;
  hotelId: string;
  logDate: string; // "2026-11-07"
  mealSession: 'breakfast' | 'lunch' | 'dinner' | 'banquet_event';
  kitchenOutletName: string; // "Abaya View Restaurant Kitchen", "Pastry Bakery"
  category: WasteCategory;
  weightKg: number;
  estimatedCostValue: number; // ETB loss
  currency: string;
  destination: WasteDestination;
  chefSupervisor: string;
  actionTakenNotes: string;
  createdAt: string;
}

export interface EcoGuestOptIn {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  stayStartDate: string;
  stayEndDate: string;
  linenReuseFrequencyDays: number; // 2 or 3
  towelReuseAgreed: boolean;
  waterSavedEstLitres: number;
  powerSavedEstKwh: number;
  loyaltyEcoPointsAwarded: number;
  optInDate: string;
}

export interface SustainabilityAuditItem {
  id: string;
  hotelId: string;
  auditStandard: 'green_key_intl' | 'eco_ethiopia_resort' | 'iso_14001';
  category: 'energy_efficiency' | 'water_conservation' | 'waste_plastic_zero' | 'local_organic_procurement' | 'biodiversity';
  criterion: string;
  targetMetric: string;
  currentScorePercent: number; // 0 - 100
  complianceStatus: 'compliant' | 'in_progress' | 'non_compliant';
  verifiedBy: string;
  lastAuditedDate: string;
  evidenceNotes: string;
}

// ==========================================
// Phase 14: Central Reservations System (CRS), Channel Manager & Dynamic Pricing Engine
// ==========================================

export type DistributionChannelType = 'ota' | 'direct_web' | 'metasearch' | 'gds' | 'corporate_portal';
export type ChannelCode = 'booking_com' | 'expedia' | 'agoda' | 'hotel_direct' | 'tripadvisor' | 'gds_sabre';

export interface ChannelConnection {
  id: string;
  hotelId: string;
  channelCode: ChannelCode;
  channelName: string;
  channelType: DistributionChannelType;
  status: 'connected' | 'syncing' | 'error' | 'paused';
  commissionPercent: number;
  lastSyncTimestamp: string;
  activeReservationsCount: number;
  monthlyRevenueETB: number;
  twoWaySyncEnabled: boolean;
  inventoryPushEnabled: boolean;
  ratesPushEnabled: boolean;
  channelManagerNotes?: string;
}

export interface RateParityCheck {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomTypeName: string;
  targetDate: string;
  directWebRate: number;
  bookingComRate: number;
  expediaRate: number;
  agodaRate: number;
  currency: string;
  parityStatus: 'in_parity' | 'ota_undercut' | 'direct_cheaper';
  varianceAmount: number;
  lastCheckedAt: string;
  recommendedAction: string;
}

export interface DynamicYieldRule {
  id: string;
  hotelId: string;
  ruleName: string;
  ruleType: 'occupancy_surge' | 'last_minute_flash' | 'early_bird' | 'length_of_stay_min' | 'weekend_peak';
  condition: string;
  adjustmentType: 'percentage_increase' | 'percentage_discount' | 'fixed_surcharge' | 'min_los';
  adjustmentValue: number;
  targetChannels: ChannelCode[];
  isActive: boolean;
  autoApplyToOta: boolean;
  updatedAt: string;
}

export interface RatePlan {
  id: string;
  hotelId: string;
  code: string;
  name: string;
  description: string;
  mealPlan: 'room_only' | 'bed_and_breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  cancellationPolicy: 'free_cancellation_24h' | 'non_refundable' | 'moderate_72h' | 'flexible';
  baseDiscountPercent: number;
  includedPerks: string[];
  isActive: boolean;
}

export interface DirectWebBookingRequest {
  id: string;
  hotelId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeId: string;
  ratePlanId: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
  totalPrice: number;
  currency: string;
  promoCodeUsed?: string;
  paymentStatus: 'guaranteed_card' | 'paid_telebirr' | 'pay_at_hotel';
  createdAt: string;
}

// ==========================================
// Phase 15: Digital Guest In-Room Tablet, Smart Room Automation & QR Compendium Hub
// ==========================================

export interface RoomServiceOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface RoomServiceOrder {
  id: string;
  hotelId: string;
  roomNumber: string;
  guestName: string;
  items: RoomServiceOrderItem[];
  subtotal: number;
  serviceCharge: number;
  vat: number;
  totalPrice: number;
  currency: string;
  orderStatus: 'pending_kitchen' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  placedAt: string;
  estimatedDeliveryMinutes: number;
  specialDietaryNotes?: string;
  postedToFolio: boolean;
}

export interface GuestServiceRequest {
  id: string;
  hotelId: string;
  roomNumber: string;
  guestName: string;
  requestType: 'dnd_toggle' | 'mur_toggle' | 'extra_amenities' | 'luggage_assistance' | 'turndown_service' | 'maintenance_issue';
  details: string;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedStaffName?: string;
  requestedAt: string;
  completedAt?: string;
  guestRating?: number;
}

export interface ExpressCheckOutRequest {
  id: string;
  hotelId: string;
  roomNumber: string;
  guestName: string;
  folioId: string;
  outstandingBalance: number;
  preferredPaymentMethod: 'card_on_file' | 'telebirr' | 'desk_settlement';
  departureTime: string;
  luggageAssistanceNeeded: boolean;
  flightTransferNeeded: boolean;
  status: 'pending_review' | 'folio_closed' | 'settled';
  createdAt: string;
  guestNotes?: string;
}

// ==========================================
// Phase 16: Supply Chain, Vendor Portal, Purchase Orders (PO) & Three-Way Invoice Matching
// ==========================================

export type VendorCategory = 
  | 'fresh_produce'
  | 'meat_seafood'
  | 'beverages_liquor'
  | 'dry_provisions'
  | 'linen_guest_amenities'
  | 'engineering_spares'
  | 'chemicals_cleaning';

export interface SupplierVendor {
  id: string;
  hotelId: string;
  code: string;
  name: string;
  category: VendorCategory;
  contactPerson: string;
  email: string;
  phone: string;
  tinNumber: string;
  bankName: string;
  bankAccountNumber: string;
  telebirrMerchantId?: string;
  paymentTerms: 'cod' | 'net_7' | 'net_15' | 'net_30' | 'advance_deposit';
  qualityRating: number;
  onTimeDeliveryRate: number;
  status: 'active' | 'under_review' | 'blacklisted';
  notes?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityOrdered: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  storeLocationId: string;
  storeLocationName: string;
}

export interface PurchaseOrder {
  id: string;
  hotelId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  requisitionId?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent_to_vendor' | 'partially_received' | 'fully_received' | 'cancelled';
  expectedDeliveryDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: PurchaseOrderItem[];
  preparedBy: string;
  approvedBy?: string;
  createdAt: string;
  notes?: string;
}

export interface ThreeWayInvoiceMatch {
  id: string;
  hotelId: string;
  invoiceNumber: string;
  poId: string;
  poNumber: string;
  grvId: string;
  grvNumber: string;
  vendorName: string;
  poAmount: number;
  grvAmount: number;
  invoiceAmount: number;
  varianceAmount: number;
  currency: string;
  matchStatus: 'matched_approved' | 'price_variance_hold' | 'quantity_shortage_hold' | 'unmatched';
  paymentDueDate: string;
  paymentStatus: 'pending' | 'authorized_for_payment' | 'paid';
  reconciledBy?: string;
  createdAt: string;
}

// ==========================================
// PHASE 17: COMMERCIAL LAUNDRY, LINEN PAR & GUEST VALET
// ==========================================

export type LinenCategory =
  | 'bed_linen'
  | 'bath_linen'
  | 'fnb_linen'
  | 'pool_spa_linen'
  | 'uniforms';

export interface LinenItem {
  id: string;
  hotelId: string;
  code: string;
  name: string;
  category: LinenCategory;
  specification: string;
  parLevelRequirement: number; // Standard multiplier, e.g. 3.5 Par
  totalStockCount: number;
  inRoomsCount: number;
  inLaundryCount: number;
  cleanInPantryCount: number;
  reserveStorageCount: number;
  damagedDiscardedThisMonth: number;
  unitCost: number; // ETB
  lastAuditedDate: string;
}

export type LaundryProgramType =
  | 'heavy_white_cotton'
  | 'terry_towels'
  | 'fnb_table_linen'
  | 'delicates_uniforms'
  | 'eco_cold_cycle';

export interface LaundryWashLoad {
  id: string;
  hotelId: string;
  batchNumber: string;
  machineId: string;
  programType: LaundryProgramType;
  weightKg: number;
  cycleStatus: 'queued' | 'washing' | 'drying' | 'ironing_pressing' | 'completed';
  startedAt: string;
  completedAt?: string;
  operatorName: string;
  chemicalDosageNotes?: string;
}

export interface GuestLaundryItem {
  garmentName: string;
  service: 'wash_press' | 'dry_clean' | 'press_only';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface GuestLaundryOrder {
  id: string;
  hotelId: string;
  orderNumber: string;
  roomNumber: string;
  guestName: string;
  reservationId?: string;
  serviceType: 'standard_24h' | 'express_4h' | 'pressing_only';
  status: 'received' | 'in_cleaning' | 'ironed_packaged' | 'delivered' | 'cancelled';
  items: GuestLaundryItem[];
  subtotal: number;
  serviceCharge: number;
  taxAmount: number;
  totalAmount: number;
  specialInstructions?: string;
  isBilledToFolio: boolean;
  folioChargeId?: string;
  receivedAt: string;
  deliveredAt?: string;
  attendantName: string;
}

// ==========================================
// PHASE 18: KITCHEN RECIPE COSTING & MENU ENGINEERING
// ==========================================

export type RecipeCategory =
  | 'appetizer'
  | 'main_course'
  | 'dessert'
  | 'beverage'
  | 'banquet_buffet'
  | 'bakery_pastry';

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number; // ETB
  yieldPercentage: number; // e.g. 85 for 85% usable yield
  costContribution: number; // ETB
}

export type MenuEngineeringClass = 'star' | 'plowhorse' | 'puzzle' | 'dog';

export interface RecipeCard {
  id: string;
  hotelId: string;
  recipeCode: string;
  dishName: string;
  outletId: string;
  category: RecipeCategory;
  servingPortions: number;
  prepTimeMinutes: number;
  sellingPrice: number; // ETB
  totalCost: number; // ETB
  portionCost: number; // ETB
  foodCostPercentage: number; // %
  targetFoodCostPercentage: number; // %
  grossProfit: number; // ETB
  ingredients: RecipeIngredient[];
  allergens: string[];
  chefInstructions: string;
  menuClassification: MenuEngineeringClass;
  monthlyUnitsSold: number;
  lastCostedDate: string;
}

export interface FoodCostVarianceRecord {
  id: string;
  hotelId: string;
  outletId: string;
  periodMonth: string;
  totalFoodSales: number;
  theoreticalCost: number;
  theoreticalCostPercentage: number;
  actualFoodCost: number;
  actualCostPercentage: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'acceptable' | 'warning' | 'critical_investigation';
  notes: string;
  auditedBy: string;
}

// ==========================================
// PHASE 19: ONLINE REPUTATION & SENTIMENT INTELLIGENCE
// ==========================================

export type ReviewChannel = 
  | 'google_reviews' 
  | 'tripadvisor' 
  | 'booking_com' 
  | 'expedia' 
  | 'direct_post_stay_survey';

export type DepartmentSentimentCategory = 
  | 'front_desk' 
  | 'housekeeping' 
  | 'fnb_dining' 
  | 'room_comfort' 
  | 'value_service';

export type ReviewSentimentPolarity = 'positive' | 'neutral' | 'negative';

export interface ManagementResponse {
  responseText: string;
  respondedBy: string;
  respondedAt: string;
  publishedToChannel: boolean;
}

export interface GuestReview {
  id: string;
  hotelId: string;
  channel: ReviewChannel;
  externalReviewId?: string;
  guestName: string;
  roomNumber?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  reviewDate: string;
  stayDate: string;
  sentimentCategory: DepartmentSentimentCategory;
  sentimentPolarity: ReviewSentimentPolarity;
  sentimentScore: number; // -1.0 to 1.0
  managementResponse?: ManagementResponse;
  isEscalatedToHOD: boolean;
  hodDepartment?: string;
  hodEscalationStatus?: 'pending' | 'investigating' | 'resolved';
  hodResolutionNotes?: string;
  isVerifiedStay: boolean;
}

export interface PostStaySurveyCampaign {
  id: string;
  hotelId: string;
  campaignName: string;
  channel: 'email' | 'sms_telebirr';
  triggerHoursAfterCheckout: number;
  active: boolean;
  sentCount: number;
  responseCount: number;
  avgNpsScore: number;
  questionPrompt: string;
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  hotelId: string;
  campaignId: string;
  guestName: string;
  roomNumber: string;
  npsScore: number; // 0-10
  csatRating: number; // 1-5
  feedback: string;
  submittedAt: string;
}

// ==========================================
// PHASE 20: ENERGY MANAGEMENT & SMART ROOM IOT
// ==========================================

export type SmartDeviceType = 
  | 'thermostat_hvac' 
  | 'keycard_motion_sensor' 
  | 'smart_door_lock' 
  | 'energy_submeter' 
  | 'curtain_actuator';

export type SmartDeviceStatus = 'online' | 'offline' | 'warning';
export type RoomOccupancyState = 'occupied' | 'unoccupied' | 'window_open_alert';
export type HvacOperatingMode = 'cool' | 'heat' | 'eco_standby' | 'off';

export interface SmartRoomDevice {
  id: string;
  hotelId: string;
  roomNumber: string;
  deviceType: SmartDeviceType;
  deviceName: string;
  status: SmartDeviceStatus;
  currentTemperatureC?: number;
  targetTemperatureC?: number;
  occupancyState: RoomOccupancyState;
  keycardInserted: boolean;
  powerDrawWatts: number;
  hvacMode: HvacOperatingMode;
  fanSpeed?: 'low' | 'med' | 'high' | 'auto';
  windowClosed: boolean;
  lastHeartbeat: string;
}

export type SubmeterCategory = 
  | 'hvac_chillers' 
  | 'commercial_laundry' 
  | 'kitchen_culinary' 
  | 'guest_wings' 
  | 'lighting_common';

export interface EnergySubmeterZone {
  id: string;
  hotelId: string;
  zoneName: string;
  category: SubmeterCategory;
  currentKwDemand: number;
  dailyKwhTotal: number;
  monthlyKwhTotal: number;
  peakDemandKw: number;
  demandThresholdKw: number;
  carbonFootprintKgCo2: number;
  status: 'optimal' | 'high_demand' | 'peak_alert';
  lastUpdated: string;
}

export interface EmsAutomatedPolicy {
  id: string;
  hotelId: string;
  policyName: string;
  category: 'temperature_setback' | 'window_interlock' | 'peak_shaving' | 'generator_shedding';
  triggerCondition: string;
  actionSummary: string;
  enabled: boolean;
  estimatedMonthlySavingsEtb: number;
  activeExecutionsToday: number;
}

// ==========================================
// PHASE 21: HACCP FOOD SAFETY & WATER QUALITY
// ==========================================

export type HaccpLogType = 
  | 'walk_in_chiller' 
  | 'walk_in_freezer' 
  | 'hot_holding_buffet' 
  | 'food_core_cooking' 
  | 'dishwasher_sanitizing';

export type HaccpComplianceStatus = 'compliant' | 'warning' | 'critical_breach';

export interface HaccpTemperatureRecord {
  id: string;
  hotelId: string;
  outletId: string;
  logType: HaccpLogType;
  unitName: string;
  temperatureC: number;
  targetMinC: number;
  targetMaxC: number;
  status: HaccpComplianceStatus;
  loggedBy: string;
  loggedAt: string;
  correctiveActionTaken?: string;
}

export type PoolLocationType = 
  | 'infinity_main_pool' 
  | 'villa_private_plunge' 
  | 'kids_splash_pool' 
  | 'spa_hydrotherapy_pool';

export type PoolSafetyStatus = 
  | 'safe_for_swimming' 
  | 'chemical_adjustment_needed' 
  | 'closed_for_shock_treatment';

export interface PoolWaterQualityLog {
  id: string;
  hotelId: string;
  poolLocation: PoolLocationType;
  waterTemperatureC: number;
  phLevel: number; // target 7.2 - 7.6
  freeChlorinePpm: number; // target 1.0 - 3.0 ppm
  totalAlkalinityPpm: number; // target 80 - 120 ppm
  turbidityNtu: number; // target < 0.5 NTU
  status: PoolSafetyStatus;
  testedBy: string;
  testedAt: string;
  chemicalDosageNotes?: string;
}

export type HygieneAuditStatus = 'passed' | 're_inspection_required' | 'critical_fail';

export interface HygieneAuditChecklist {
  id: string;
  hotelId: string;
  area: string;
  auditDate: string;
  auditorName: string;
  overallScore: number; // 0 - 100%
  criticalNonConformances: number;
  status: HygieneAuditStatus;
  findings: string;
}

// ==========================================
// PHASE 22: VALET PARKING & EV CHARGING FLEET
// ==========================================

export type ParkingBayType = 
  | 'vip_presidential' 
  | 'hotel_resident' 
  | 'ev_charging' 
  | 'banquet_visitor' 
  | 'accessible';

export type ParkingBayStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface ParkingBay {
  id: string;
  hotelId: string;
  bayCode: string;
  zone: string;
  bayType: ParkingBayType;
  status: ParkingBayStatus;
  currentVehiclePlate?: string;
  hasEvCharger: boolean;
  evChargerPowerKw?: number;
}

export type ValetTicketStatus = 
  | 'parked' 
  | 'retrieval_requested' 
  | 'staged_at_curb' 
  | 'completed';

export interface ValetTicket {
  id: string;
  hotelId: string;
  ticketNumber: string;
  guestName: string;
  roomNumber?: string;
  phoneNumber: string;
  vehicleMakeModel: string;
  licensePlate: string;
  assignedBayCode: string;
  keyPegSlot: string;
  status: ValetTicketStatus;
  conditionDamageNotes?: string;
  checkedInAt: string;
  retrievalRequestedAt?: string;
  valetAttendant: string;
}

export interface EvChargingSession {
  id: string;
  hotelId: string;
  bayCode: string;
  guestName: string;
  roomNumber?: string;
  vehiclePlate: string;
  kwhDelivered: number;
  ratePerKwh: number;
  totalChargeEtb: number;
  sessionStatus: 'charging' | 'completed' | 'billed_to_folio';
  startedAt: string;
  endedAt?: string;
}

// ==========================================
// PHASE 23: NIGHT AUDIT, EOD BALANCING & RATE ROLL
// ==========================================

export type CashierDropStatus = 'balanced' | 'over' | 'short';

export interface CashierDropRecord {
  id: string;
  hotelId: string;
  cashierName: string;
  outletName: string;
  shift: 'morning' | 'evening' | 'graveyard';
  expectedSystemAmount: number;
  actualDropAmount: number;
  varianceAmount: number;
  currency: string;
  status: CashierDropStatus;
  notes?: string;
}

export interface HighBalanceAlert {
  id: string;
  hotelId: string;
  guestName: string;
  roomNumber: string;
  currentFolioBalance: number;
  creditLimit: number;
  paymentMethod: string;
  riskSeverity: 'moderate' | 'high' | 'critical';
  actionTaken?: string;
}

export interface NightAuditJournal {
  id: string;
  hotelId: string;
  auditDate: string; // Business date being closed
  executedAt: string; // Timestamp of execution
  auditorName: string;
  auditorRole: string;
  roomsAvailable: number;
  roomsOccupied: number;
  occupancyRate: number; // Percentage, e.g. 84.5
  complimentaryRooms: number;
  outOfOrderRooms: number;
  totalRoomRevenue: number;
  totalFnBRevenue: number;
  totalOtherRevenue: number;
  totalGrossRevenue: number;
  totalServiceCharge: number;
  totalVat: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
  guestFoliosPostedCount: number;
  cashierDiscrepancyTotal: number;
  status: 'finalized' | 'draft';
}

// ==========================================
// PHASE 24: SHIFT HANDOVER & RAPID TASK DISPATCH
// ==========================================

export type HandoverShiftType = 'morning' | 'evening' | 'graveyard';
export type HandoverLogCategory = 
  | 'vip_movement' 
  | 'maintenance_defect' 
  | 'guest_incident' 
  | 'cash_accounting' 
  | 'gm_directive' 
  | 'general_operations';

export type HandoverPriority = 'critical' | 'high_attention' | 'routine';

export interface ShiftHandoverEntry {
  id: string;
  hotelId: string;
  date: string;
  shift: HandoverShiftType;
  outgoingSupervisor: string;
  incomingSupervisor?: string;
  acknowledgedAt?: string;
  category: HandoverLogCategory;
  priority: HandoverPriority;
  roomNumber?: string;
  subject: string;
  description: string;
  actionRequired: string;
  status: 'pending_action' | 'in_progress' | 'resolved';
  createdAt: string;
}

export type RapidTaskDepartment = 
  | 'housekeeping' 
  | 'front_office' 
  | 'engineering' 
  | 'concierge_bell' 
  | 'room_service' 
  | 'security';

export type RapidTaskPriority = 'urgent_10m' | 'high_20m' | 'standard_30m' | 'routine_60m';
export type RapidTaskStatus = 'dispatched' | 'accepted' | 'in_transit' | 'completed' | 'verified';

export interface RapidServiceTask {
  id: string;
  hotelId: string;
  taskCode: string;
  roomNumber: string;
  guestName?: string;
  targetDepartment: RapidTaskDepartment;
  taskDescription: string;
  priority: RapidTaskPriority;
  slaMinutes: number;
  dispatchedBy: string;
  assignedRunner?: string;
  status: RapidTaskStatus;
  dispatchedAt: string;
  completedAt?: string;
  resolutionNotes?: string;
}

export interface StaffBroadcastAlert {
  id: string;
  hotelId: string;
  title: string;
  message: string;
  category: 'operations' | 'security' | 'vip_protocol' | 'weather_alert';
  senderName: string;
  senderRole: string;
  targetAudience: string; // 'All Departments' or specific
  isPinned: boolean;
  createdAt: string;
  acknowledgedCount: number;
}

// ==========================================
// PHASE 25: CORPORATE ACCOUNTS, CITY LEDGER (AR) & AGENCY COMMISSIONS
// ==========================================

export type CorporateAccountType =
  | 'corporate'
  | 'embassy_diplomatic'
  | 'airline_crew'
  | 'travel_agency'
  | 'ngo_un'
  | 'tour_operator';

export type CorporateAccountStatus = 'active' | 'credit_hold' | 'under_review' | 'suspended';

export interface CorporateAccount {
  id: string;
  hotelId: string;
  accountCode: string;
  companyName: string;
  accountType: CorporateAccountType;
  taxTinNumber: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  creditLimitEtb: number;
  currentBalanceEtb: number;
  paymentTermsDays: number;
  negotiatedRateDiscountPercent: number;
  contractedRoomRateEtb: number;
  status: CorporateAccountStatus;
  contractExpiryDate: string;
  notes?: string;
}

export type CityLedgerInvoiceStatus = 'open' | 'partially_paid' | 'settled' | 'overdue' | 'disputed';

export interface CityLedgerPayment {
  id: string;
  date: string;
  amountEtb: number;
  method: string;
  reference: string;
  recordedBy: string;
}

export interface CityLedgerInvoice {
  id: string;
  hotelId: string;
  invoiceNumber: string;
  accountId: string;
  companyName: string;
  guestOrGroupName: string;
  folioReference?: string;
  issueDate: string;
  dueDate: string;
  agingDays: number;
  totalAmountEtb: number;
  paidAmountEtb: number;
  balanceDueEtb: number;
  status: CityLedgerInvoiceStatus;
  lpoReference?: string;
  lastReminderSentAt?: string;
  payments: CityLedgerPayment[];
}

export type AgencyCommissionStatus = 'pending_checkout' | 'approved_payable' | 'paid' | 'disputed';

export interface AgencyCommissionRecord {
  id: string;
  hotelId: string;
  agencyAccountId: string;
  agencyName: string;
  bookingReference: string;
  guestName: string;
  stayDates: string;
  roomRevenueEtb: number;
  commissionRatePercent: number;
  commissionAmountEtb: number;
  withholdingTaxEtb: number;
  netPayableEtb: number;
  status: AgencyCommissionStatus;
  payoutReference?: string;
  paidAt?: string;
}

// ==========================================
// PHASE 26: DINING FLOOR PLAN, TABLE RESERVATIONS & SOMMELIER WINE CELLAR
// ==========================================

export type DiningZone =
  | 'abaya_panorama'
  | 'lakeside_terrace'
  | 'rift_private_dining'
  | 'sunset_lounge';

export type DiningTableStatus =
  | 'available'
  | 'reserved'
  | 'seated'
  | 'dessert_check'
  | 'needs_bussing';

export interface DiningTable {
  id: string;
  hotelId: string;
  tableNumber: string;
  zone: DiningZone;
  seats: number;
  status: DiningTableStatus;
  assignedServer?: string;
  currentGuestName?: string;
  currentPartySize?: number;
  seatedAt?: string;
  reservationId?: string;
  notes?: string;
}

export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'sunday_brunch';

export type TableReservationStatus =
  | 'confirmed'
  | 'waitlist'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface DiningReservation {
  id: string;
  hotelId: string;
  reservationCode: string;
  guestName: string;
  guestPhone: string;
  roomNumber?: string;
  partySize: number;
  reservationDate: string;
  timeSlot: string;
  mealPeriod: MealPeriod;
  preferredZone: DiningZone;
  assignedTableNumber?: string;
  dietaryNotes?: string;
  vipOccasion?: string;
  status: TableReservationStatus;
  estimatedWaitMinutes?: number;
  createdAt: string;
}

export type WineCategory =
  | 'red_reserve'
  | 'white_crisp'
  | 'sparkling_champagne'
  | 'ethiopian_tej_heritage'
  | 'single_malt_spirits';

export interface WineCellarBottle {
  id: string;
  hotelId: string;
  binCode: string;
  wineName: string;
  producerRegion: string;
  vintageYear: string;
  category: WineCategory;
  bottleVolumeMl: number;
  cellarTempC: number;
  stockBottles: number;
  reorderLevel: number;
  glassPriceEtb: number;
  bottlePriceEtb: number;
  tastingNotes: string;
  lastInventoriedAt: string;
}

// ==========================================
// PHASE 27: GROUP ROOM BLOCKS, ALLOTMENTS & ROOMING LISTS
// ==========================================

export type GroupBlockCategory =
  | 'corporate_summit'
  | 'tour_series'
  | 'diplomatic_delegation'
  | 'wedding_social'
  | 'airline_crew';

export type GroupBlockStatus =
  | 'tentative'
  | 'definite'
  | 'in_house'
  | 'washed_released'
  | 'settled';

export type GroupBillingInstruction =
  | 'master_bill_rooms_tax'
  | 'master_bill_all_inclusive'
  | 'individual_own_account';

export interface GroupBlock {
  id: string;
  hotelId: string;
  blockCode: string;
  groupName: string;
  organizerName: string;
  organizerPhone: string;
  corporateAccountId?: string;
  category: GroupBlockCategory;
  status: GroupBlockStatus;
  billingInstruction: GroupBillingInstruction;
  checkInDate: string;
  checkOutDate: string;
  cutoffDate: string;
  roomCategoryName: string;
  negotiatedRateEtb: number;
  contractedRooms: number;
  pickedUpRooms: number;
  washedRooms: number;
  estimatedRevenueEtb: number;
  depositPaidEtb: number;
  cityLedgerInvoiceRef?: string;
  notes?: string;
}

export type RoomingListStatus =
  | 'pending_assignment'
  | 'room_assigned'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export interface GroupRoomingGuest {
  id: string;
  hotelId: string;
  groupBlockId: string;
  blockCode: string;
  guestName: string;
  passportOrIdNumber: string;
  nationality: string;
  roomCategoryName: string;
  assignedRoomNumber?: string;
  arrivalDate: string;
  departureDate: string;
  occupancyType: 'single' | 'double' | 'twin';
  vipFlag: boolean;
  shuttleNeeded: boolean;
  dietaryNotes?: string;
  status: RoomingListStatus;
}

