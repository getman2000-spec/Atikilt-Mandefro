/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent Storage and Multi-tenant Data Management Service
 * Phase 1 + Phase 2 Hotel Administration, Departments, Outlets, Rooms, Employees & Financial Rules
 */

import {
  Hotel,
  Subscription,
  SubscriptionPayment,
  HotelUser,
  PlatformUser,
  AuditLog,
  PlatformAnnouncement,
  SubscriptionPlanId,
  SubscriptionStatus,
  Department,
  Outlet,
  RoomType,
  Room,
  Employee,
  HotelFinancialRules,
  CustomField,
  RoomOperationalStatus,
  Reservation,
  BookingStatus,
  GuestFolio,
  FolioChargeItem,
  FolioPaymentItem,
  HousekeepingTask,
  CashierShift,
  OutletMenuItem,
  PurchaseRequisition,
  RequisitionStatus,
  DailyRevenueRecord,
  BankReconciliationItem,
  StoreLocation,
  StockItem,
  GoodsReceivedVoucher,
  StoreIssueVoucher,
  StockAdjustment,
  StockCategory,
  GRVItem,
  SIVItem,
  AssetRecord,
  WorkOrder,
  PreventiveSchedule,
  MaintenanceCategory,
  WorkOrderPriority,
  WorkOrderStatus,
  EventSpace,
  BanquetEventItem,
  EventBooking,
  EventSpaceSetupType,
  EventBookingStatus,
  GuestProfile,
  VIPTier,
  LoyaltyReward,
  LoyaltyTransaction,
  SpaTreatment,
  SpaAppointment,
  GuestFeedback,
  ShiftType,
  ShiftSchedule,
  AttendanceRecord,
  LeaveType,
  LeaveRequest,
  PayrollPeriod,
  EmployeePayrollItem,
  PortfolioMetric,
  ChannelDistribution,
  ExportReportType,
  ExportJob,
  KPITargetItem,
  SecurityIncident,
  SecurityIncidentCategory,
  VisitorGatePass,
  VisitorType,
  LostAndFoundItem,
  GuestComplaintTicket,
  ComplaintCategory,
  FleetVehicle,
  FleetVehicleType,
  AirportTransferBooking,
  TransferType,
  ExcursionActivity,
  ExcursionBooking,
  UtilityConsumptionLog,
  UtilitySource,
  FoodWasteLog,
  WasteCategory,
  WasteDestination,
  EcoGuestOptIn,
  SustainabilityAuditItem,
  ChannelConnection,
  ChannelCode,
  RateParityCheck,
  DynamicYieldRule,
  RatePlan,
  DirectWebBookingRequest,
  RoomServiceOrder,
  GuestServiceRequest,
  ExpressCheckOutRequest,
  SupplierVendor,
  PurchaseOrder,
  ThreeWayInvoiceMatch,
  LinenItem,
  LaundryWashLoad,
  GuestLaundryOrder,
  LinenCategory,
  LaundryProgramType,
  RecipeCard,
  FoodCostVarianceRecord,
  RecipeCategory,
  RecipeIngredient,
  MenuEngineeringClass,
  GuestReview,
  PostStaySurveyCampaign,
  SurveyResponse,
  ReviewChannel,
  DepartmentSentimentCategory,
  ReviewSentimentPolarity,
  ManagementResponse,
  SmartRoomDevice,
  EnergySubmeterZone,
  EmsAutomatedPolicy,
  SmartDeviceType,
  SmartDeviceStatus,
  RoomOccupancyState,
  HvacOperatingMode,
  SubmeterCategory,
  HaccpTemperatureRecord,
  PoolWaterQualityLog,
  HygieneAuditChecklist,
  HaccpLogType,
  HaccpComplianceStatus,
  PoolLocationType,
  PoolSafetyStatus,
  HygieneAuditStatus,
  ParkingBay,
  ValetTicket,
  EvChargingSession,
  ParkingBayType,
  ParkingBayStatus,
  ValetTicketStatus,
  CashierDropStatus,
  CashierDropRecord,
  HighBalanceAlert,
  NightAuditJournal,
  ShiftHandoverEntry,
  RapidServiceTask,
  StaffBroadcastAlert,
  HandoverShiftType,
  HandoverLogCategory,
  HandoverPriority,
  RapidTaskDepartment,
  RapidTaskPriority,
  RapidTaskStatus,
  CorporateAccountType,
  CorporateAccountStatus,
  CorporateAccount,
  CityLedgerInvoiceStatus,
  CityLedgerPayment,
  CityLedgerInvoice,
  AgencyCommissionStatus,
  AgencyCommissionRecord,
  DiningZone,
  DiningTableStatus,
  DiningTable,
  MealPeriod,
  TableReservationStatus,
  DiningReservation,
  WineCategory,
  WineCellarBottle,
  GroupBlockCategory,
  GroupBlockStatus,
  GroupBillingInstruction,
  GroupBlock,
  RoomingListStatus,
  GroupRoomingGuest,
} from '../types/saas';
import {
  SUBSCRIPTION_PLANS,
  SYSTEM_MODULES,
  DEFAULT_DEPARTMENTS_CONFIG,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  STANDARD_ROOM_AMENITIES,
} from '../constants/saasDefaults';
import { TAX_AND_PAYROLL_CONFIG } from '../config/taxAndPayrollConfig';
import {
  calculateHospitalityLevies,
  calculateEthiopianPayrollItem,
  convertUsdToEtb,
} from '../utils/taxAndPayrollCalculator';
import { firestoreSync } from './firestoreSync';
import { hashSecret } from '../utils/crypto';

const STORAGE_KEYS = {
  HOTELS: 'seam_hotels_v1',
  SUBSCRIPTIONS: 'seam_subscriptions_v1',
  PAYMENTS: 'seam_payments_v1',
  USERS: 'seam_users_v1',
  PLATFORM_USERS: 'seam_platform_users_v1',
  AUDIT_LOGS: 'seam_audit_logs_v1',
  ANNOUNCEMENTS: 'seam_announcements_v1',
  ACTIVE_HOTEL_ID: 'seam_active_hotel_id_v1',
  // Phase 2 keys
  DEPARTMENTS: 'seam_departments_v2',
  OUTLETS: 'seam_outlets_v2',
  ROOM_TYPES: 'seam_room_types_v2',
  ROOMS: 'seam_rooms_v2',
  EMPLOYEES: 'seam_employees_v2',
  FINANCIAL_RULES: 'seam_financial_rules_v2',
  CUSTOM_FIELDS: 'seam_custom_fields_v2',
  // Phase 3 keys
  RESERVATIONS: 'seam_reservations_v3',
  GUEST_FOLIOS: 'seam_guest_folios_v3',
  HOUSEKEEPING_TASKS: 'seam_housekeeping_tasks_v3',
  CASHIER_SHIFTS: 'seam_cashier_shifts_v3',
  OUTLET_MENU_ITEMS: 'seam_outlet_menu_items_v3',
  // Phase 4 keys
  REQUISITIONS: 'seam_requisitions_v4',
  DAILY_REVENUE_REPORTS: 'seam_daily_revenue_reports_v4',
  BANK_RECONCILIATIONS: 'seam_bank_reconciliations_v4',
  // Phase 5 keys
  STORE_LOCATIONS: 'seam_store_locations_v5',
  STOCK_ITEMS: 'seam_stock_items_v5',
  GRVS: 'seam_grvs_v5',
  SIVS: 'seam_sivs_v5',
  STOCK_ADJUSTMENTS: 'seam_stock_adjustments_v5',
  // Phase 6 keys
  ASSETS: 'seam_assets_v6',
  WORK_ORDERS: 'seam_work_orders_v6',
  PREVENTIVE_SCHEDULES: 'seam_preventive_schedules_v6',
  // Phase 7 keys
  EVENT_SPACES: 'seam_event_spaces_v7',
  EVENT_BOOKINGS: 'seam_event_bookings_v7',
  // Phase 8 keys
  GUEST_PROFILES: 'seam_guest_profiles_v8',
  LOYALTY_REWARDS: 'seam_loyalty_rewards_v8',
  LOYALTY_TRANSACTIONS: 'seam_loyalty_transactions_v8',
  SPA_TREATMENTS: 'seam_spa_treatments_v8',
  SPA_APPOINTMENTS: 'seam_spa_appointments_v8',
  GUEST_FEEDBACK: 'seam_guest_feedback_v8',
  // Phase 9 keys
  SHIFT_SCHEDULES: 'seam_shift_schedules_v9',
  ATTENDANCE_RECORDS: 'seam_attendance_records_v9',
  LEAVE_REQUESTS: 'seam_leave_requests_v9',
  PAYROLL_PERIODS: 'seam_payroll_periods_v9',
  PAYROLL_ITEMS: 'seam_payroll_items_v9',
  // Phase 10 keys
  EXPORT_JOBS: 'seam_export_jobs_v10',
  KPI_TARGETS: 'seam_kpi_targets_v10',
  // Phase 11 keys
  SECURITY_INCIDENTS: 'seam_security_incidents_v11',
  VISITOR_PASSES: 'seam_visitor_passes_v11',
  LOST_AND_FOUND: 'seam_lost_and_found_v11',
  GUEST_COMPLAINTS: 'seam_guest_complaints_v11',
  // Phase 12 keys
  FLEET_VEHICLES: 'seam_fleet_vehicles_v12',
  AIRPORT_TRANSFERS: 'seam_airport_transfers_v12',
  EXCURSION_ACTIVITIES: 'seam_excursion_activities_v12',
  EXCURSION_BOOKINGS: 'seam_excursion_bookings_v12',
  // Phase 13 keys
  UTILITY_LOGS: 'seam_utility_logs_v13',
  FOOD_WASTE_LOGS: 'seam_food_waste_logs_v13',
  ECO_GUEST_OPT_INS: 'seam_eco_guest_opt_ins_v13',
  SUSTAINABILITY_AUDITS: 'seam_sustainability_audits_v13',
  // Phase 14 keys
  CHANNEL_CONNECTIONS: 'seam_channel_connections_v14',
  RATE_PARITY_CHECKS: 'seam_rate_parity_checks_v14',
  DYNAMIC_YIELD_RULES: 'seam_dynamic_yield_rules_v14',
  RATE_PLANS: 'seam_rate_plans_v14',
  DIRECT_WEB_BOOKINGS: 'seam_direct_web_bookings_v14',
  // Phase 15 keys
  ROOM_SERVICE_ORDERS: 'seam_room_service_orders_v15',
  GUEST_SERVICE_REQUESTS: 'seam_guest_service_requests_v15',
  EXPRESS_CHECKOUTS: 'seam_express_checkouts_v15',
  // Phase 16 keys
  SUPPLIERS: 'seam_suppliers_v16',
  PURCHASE_ORDERS: 'seam_purchase_orders_v16',
  THREE_WAY_MATCHES: 'seam_three_way_matches_v16',
  // Phase 17 keys
  LINEN_ITEMS: 'seam_linen_items_v17',
  LAUNDRY_WASH_LOADS: 'seam_laundry_wash_loads_v17',
  GUEST_LAUNDRY_ORDERS: 'seam_guest_laundry_orders_v17',
  // Phase 18 keys
  RECIPE_CARDS: 'seam_recipe_cards_v18',
  FOOD_COST_VARIANCES: 'seam_food_cost_variances_v18',
  // Phase 19 keys
  GUEST_REVIEWS: 'seam_guest_reviews_v19',
  SURVEY_CAMPAIGNS: 'seam_survey_campaigns_v19',
  SURVEY_RESPONSES: 'seam_survey_responses_v19',
  // Phase 20 keys
  SMART_ROOM_DEVICES: 'seam_smart_room_devices_v20',
  ENERGY_SUBMETERS: 'seam_energy_submeters_v20',
  EMS_POLICIES: 'seam_ems_policies_v20',
  // Phase 21 keys
  HACCP_TEMP_LOGS: 'seam_haccp_temp_logs_v21',
  POOL_WATER_LOGS: 'seam_pool_water_logs_v21',
  HYGIENE_AUDITS: 'seam_hygiene_audits_v21',
  // Phase 22 keys
  PARKING_BAYS: 'seam_parking_bays_v22',
  VALET_TICKETS: 'seam_valet_tickets_v22',
  EV_CHARGING_SESSIONS: 'seam_ev_charging_sessions_v22',
  // Phase 23 keys
  CASHIER_DROPS: 'seam_cashier_drops_v23',
  HIGH_BALANCE_ALERTS: 'seam_high_balance_alerts_v23',
  NIGHT_AUDIT_JOURNALS: 'seam_night_audit_journals_v23',
  BUSINESS_DATE_PREFIX: 'seam_business_date_',
  // Phase 24 keys
  SHIFT_HANDOVERS: 'seam_shift_handovers_v24',
  RAPID_SERVICE_TASKS: 'seam_rapid_service_tasks_v24',
  STAFF_BROADCAST_ALERTS: 'seam_staff_broadcast_alerts_v24',
  // Phase 25 keys
  CORPORATE_ACCOUNTS: 'seam_corporate_accounts_v25',
  CITY_LEDGER_INVOICES: 'seam_city_ledger_invoices_v25',
  AGENCY_COMMISSIONS: 'seam_agency_commissions_v25',
  // Phase 26 keys
  DINING_TABLES: 'seam_dining_tables_v26',
  DINING_RESERVATIONS: 'seam_dining_reservations_v26',
  WINE_CELLAR_BOTTLES: 'seam_wine_cellar_bottles_v26',
  // Phase 27 keys
  GROUP_BLOCKS: 'seam_group_blocks_v27',
  GROUP_ROOMING_GUESTS: 'seam_group_rooming_guests_v27',
};

// Seed 15 Standard Departments for a hotel
function generateSeedDepartments(hotelId: string): Department[] {
  return DEFAULT_DEPARTMENTS_CONFIG.map((d, index) => ({
    id: `dept_${hotelId}_${d.code.toLowerCase()}`,
    hotelId,
    code: d.code,
    name: d.name,
    nameAm: d.nameAm,
    description: d.description,
    descriptionAm: d.descriptionAm,
    status: 'active',
    isDefault: true,
    operatingBudget: index === 0 ? 150000 : index === 2 ? 350000 : 75000,
    reportingDeadlineHour: 23,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  }));
}

// Seed Outlets
const SEED_OUTLETS: Outlet[] = [
  // Sample Property A Outlets
  {
    id: 'out_gr_01',
    hotelId: 'htl_grand_rift',
    code: 'REST-01',
    name: 'Main Dining Restaurant',
    type: 'main_restaurant',
    openingHours: '06:00 - 23:00',
    seatingCapacity: 120,
    managerName: 'Solomon Bekele',
    managerPhone: '+251 91 222 3344',
    status: 'active',
    acceptsRoomCharge: true,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'out_gr_02',
    hotelId: 'htl_grand_rift',
    code: 'BAR-01',
    name: 'Sunset Lounge & Bar',
    type: 'bar_lounge',
    openingHours: '16:00 - 02:00',
    seatingCapacity: 60,
    managerName: 'Abebe Desta',
    status: 'active',
    acceptsRoomCharge: true,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'out_gr_03',
    hotelId: 'htl_grand_rift',
    code: 'CAFE-01',
    name: 'Garden Coffee Corner',
    type: 'coffee_shop',
    openingHours: '07:00 - 22:00',
    seatingCapacity: 40,
    status: 'active',
    acceptsRoomCharge: true,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  // Sample Property B Outlets
  {
    id: 'out_bm_01',
    hotelId: 'htl_bale_lodge',
    code: 'REST-BM',
    name: 'Highland Canopy Dining Room',
    type: 'main_restaurant',
    openingHours: '06:30 - 22:00',
    seatingCapacity: 45,
    managerName: 'Dawit Haile',
    status: 'active',
    acceptsRoomCharge: true,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'out_bm_02',
    hotelId: 'htl_bale_lodge',
    code: 'BAR-BM',
    name: 'Fireplace Alpine Bar',
    type: 'bar_lounge',
    openingHours: '17:00 - 23:30',
    seatingCapacity: 30,
    status: 'active',
    acceptsRoomCharge: true,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
];

// Seed Room Types
const SEED_ROOM_TYPES: RoomType[] = [
  // Sample Property A Room Types (ETB)
  {
    id: 'rt_gr_01',
    hotelId: 'htl_grand_rift',
    code: 'STD-KNG',
    name: 'Standard King Room',
    description: 'Spacious 28 sqm room with plush king bed, en-suite walk-in shower and garden view.',
    standardRate: 3500,
    baseRateCurrency: 'ETB',
    capacityAdults: 2,
    capacityChildren: 1,
    bedType: 'King',
    amenities: ['High-speed Wi-Fi', 'Smart Flat TV', 'Air Conditioning', 'In-room Safe', 'Tea & Coffee Maker'],
    totalUnitsCount: 35,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'rt_gr_02',
    hotelId: 'htl_grand_rift',
    code: 'DLX-LKE',
    name: 'Deluxe Lakeview Suite',
    description: 'Premium 42 sqm suite with panoramic lake views, private balcony and jacuzzi bathtub.',
    standardRate: 5800,
    baseRateCurrency: 'ETB',
    capacityAdults: 2,
    capacityChildren: 2,
    bedType: 'King',
    amenities: ['High-speed Wi-Fi', 'Private Balcony', 'Smart Flat TV', 'Air Conditioning', 'Minibar & Refrigerator', 'En-suite Jacuzzi', 'Lake / Mountain View'],
    totalUnitsCount: 30,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'rt_gr_03',
    hotelId: 'htl_grand_rift',
    code: 'EXEC-STE',
    name: 'Executive Presidential Suite',
    description: 'Luxury 85 sqm two-room suite with dining salon, kitchenette, guest powder room and 24/7 butler service.',
    standardRate: 11500,
    baseRateCurrency: 'ETB',
    capacityAdults: 4,
    capacityChildren: 2,
    bedType: 'Suite',
    amenities: ['High-speed Wi-Fi', 'Private Balcony', 'Smart Flat TV', 'Air Conditioning', 'Minibar & Refrigerator', 'Work Desk & Chair', 'En-suite Jacuzzi', 'Daily Mineral Water'],
    totalUnitsCount: 20,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  // Sample Property B Room Types (ETB, converted at 1 USD = 125 ETB)
  {
    id: 'rt_bm_01',
    hotelId: 'htl_bale_lodge',
    code: 'ECO-CHLT',
    name: 'Eco Forest Chalet',
    description: 'Immersive wooden chalet in cloud forest reserve with cast-iron wood burner and solar heated spring water.',
    standardRate: convertUsdToEtb(280),
    baseRateCurrency: 'ETB',
    capacityAdults: 2,
    capacityChildren: 1,
    bedType: 'King',
    amenities: ['High-speed Wi-Fi', 'Private Balcony', 'Tea & Coffee Maker', 'Lake / Mountain View'],
    totalUnitsCount: 20,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'rt_bm_02',
    hotelId: 'htl_bale_lodge',
    code: 'VIL-TREE',
    name: 'Treehouse Panorama Villa',
    description: 'Elevated canopy treehouse suite offering birdwatching platforms and stargazing skylights.',
    standardRate: convertUsdToEtb(450),
    baseRateCurrency: 'ETB',
    capacityAdults: 2,
    capacityChildren: 1,
    bedType: 'King',
    amenities: ['High-speed Wi-Fi', 'Private Balcony', 'Minibar & Refrigerator', 'Lake / Mountain View', 'Daily Mineral Water'],
    totalUnitsCount: 12,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
];

// Seed Rooms
function generateSeedRooms(): Room[] {
  const rooms: Room[] = [];

  // Sample Property A Rooms (Floor 1-3)
  const grRoomConfigs = [
    { num: '101', floor: 1, typeId: 'rt_gr_01', typeName: 'Standard King Room', rate: 3500, cap: 2, status: 'clean' as RoomOperationalStatus },
    { num: '102', floor: 1, typeId: 'rt_gr_01', typeName: 'Standard King Room', rate: 3500, cap: 2, status: 'occupied' as RoomOperationalStatus },
    { num: '103', floor: 1, typeId: 'rt_gr_01', typeName: 'Standard King Room', rate: 3500, cap: 2, status: 'dirty' as RoomOperationalStatus },
    { num: '104', floor: 1, typeId: 'rt_gr_01', typeName: 'Standard King Room', rate: 3500, cap: 2, status: 'inspected' as RoomOperationalStatus },
    { num: '105', floor: 1, typeId: 'rt_gr_01', typeName: 'Standard King Room', rate: 3500, cap: 2, status: 'clean' as RoomOperationalStatus },
    { num: '201', floor: 2, typeId: 'rt_gr_02', typeName: 'Deluxe Lakeview Suite', rate: 5800, cap: 2, status: 'occupied' as RoomOperationalStatus },
    { num: '202', floor: 2, typeId: 'rt_gr_02', typeName: 'Deluxe Lakeview Suite', rate: 5800, cap: 2, status: 'clean' as RoomOperationalStatus },
    { num: '203', floor: 2, typeId: 'rt_gr_02', typeName: 'Deluxe Lakeview Suite', rate: 5800, cap: 2, status: 'maintenance' as RoomOperationalStatus },
    { num: '204', floor: 2, typeId: 'rt_gr_02', typeName: 'Deluxe Lakeview Suite', rate: 5800, cap: 2, status: 'inspected' as RoomOperationalStatus },
    { num: '301', floor: 3, typeId: 'rt_gr_03', typeName: 'Executive Presidential Suite', rate: 11500, cap: 4, status: 'occupied' as RoomOperationalStatus },
    { num: '302', floor: 3, typeId: 'rt_gr_03', typeName: 'Executive Presidential Suite', rate: 11500, cap: 4, status: 'clean' as RoomOperationalStatus },
    { num: '303', floor: 3, typeId: 'rt_gr_03', typeName: 'Executive Presidential Suite', rate: 11500, cap: 4, status: 'out_of_order' as RoomOperationalStatus },
  ];

  grRoomConfigs.forEach((c) => {
    rooms.push({
      id: `rm_gr_${c.num}`,
      hotelId: 'htl_grand_rift',
      roomNumber: c.num,
      floor: c.floor,
      roomTypeId: c.typeId,
      roomTypeName: c.typeName,
      standardRate: c.rate,
      capacity: c.cap,
      status: c.status,
      amenities: ['High-speed Wi-Fi', 'Smart Flat TV', 'Air Conditioning'],
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-11-05T08:00:00.000Z',
    });
  });

  // Sample Property B Rooms (ETB)
  const bmRoomConfigs = [
    { num: 'C-01', floor: 1, typeId: 'rt_bm_01', typeName: 'Eco Forest Chalet', rate: convertUsdToEtb(280), cap: 2, status: 'clean' as RoomOperationalStatus },
    { num: 'C-02', floor: 1, typeId: 'rt_bm_01', typeName: 'Eco Forest Chalet', rate: convertUsdToEtb(280), cap: 2, status: 'occupied' as RoomOperationalStatus },
    { num: 'C-03', floor: 1, typeId: 'rt_bm_01', typeName: 'Eco Forest Chalet', rate: convertUsdToEtb(280), cap: 2, status: 'dirty' as RoomOperationalStatus },
    { num: 'T-10', floor: 2, typeId: 'rt_bm_02', typeName: 'Treehouse Panorama Villa', rate: convertUsdToEtb(450), cap: 2, status: 'clean' as RoomOperationalStatus },
    { num: 'T-11', floor: 2, typeId: 'rt_bm_02', typeName: 'Treehouse Panorama Villa', rate: convertUsdToEtb(450), cap: 2, status: 'inspected' as RoomOperationalStatus },
  ];

  bmRoomConfigs.forEach((c) => {
    rooms.push({
      id: `rm_bm_${c.num.replace('-', '_')}`,
      hotelId: 'htl_bale_lodge',
      roomNumber: c.num,
      floor: c.floor,
      roomTypeId: c.typeId,
      roomTypeName: c.typeName,
      standardRate: c.rate,
      capacity: c.cap,
      status: c.status,
      amenities: ['High-speed Wi-Fi', 'Private Balcony', 'Tea & Coffee Maker'],
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-11-05T08:00:00.000Z',
    });
  });

  return rooms;
}

// Seed Employees
const SEED_EMPLOYEES: Employee[] = [
  // Sample Property A Employees
  {
    id: 'emp_gr_001',
    hotelId: 'htl_grand_rift',
    employeeId: 'EMP-GR-001',
    fullName: 'Meron Tadesse',
    phone: '+251 91 123 4567',
    email: 'meron.tadesse@property-a.example',
    departmentId: 'dept_htl_grand_rift_fo',
    departmentName: 'Front Office',
    position: 'Hotel Administrator & Operations Director',
    employmentDate: '2024-06-01',
    employmentStatus: 'active',
    salary: 38000,
    role: 'hotel_admin',
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-01-15T08:30:00.000Z',
  },
  {
    id: 'emp_gr_002',
    hotelId: 'htl_grand_rift',
    employeeId: 'EMP-GR-002',
    fullName: 'Solomon Bekele',
    phone: '+251 91 234 5678',
    email: 'solomon.bekele@property-a.example',
    departmentId: 'dept_htl_grand_rift_fn',
    departmentName: 'Finance & Accounts',
    position: 'General Manager',
    employmentDate: '2023-01-10',
    employmentStatus: 'active',
    salary: 55000,
    role: 'gm',
    createdAt: '2026-01-16T09:00:00.000Z',
    updatedAt: '2026-01-16T09:00:00.000Z',
  },
  {
    id: 'emp_gr_003',
    hotelId: 'htl_grand_rift',
    employeeId: 'EMP-GR-009',
    fullName: 'Hanna Alemu',
    phone: '+251 91 345 6789',
    email: 'hanna.alemu@property-a.example',
    departmentId: 'dept_htl_grand_rift_fo',
    departmentName: 'Front Office',
    position: 'Front Desk Supervisor',
    employmentDate: '2025-02-15',
    employmentStatus: 'active',
    salary: 16000,
    role: 'dept_head',
    createdAt: '2026-01-20T11:00:00.000Z',
    updatedAt: '2026-01-20T11:00:00.000Z',
  },
  {
    id: 'emp_gr_004',
    hotelId: 'htl_grand_rift',
    employeeId: 'EMP-GR-014',
    fullName: 'Kassahun Worku',
    phone: '+251 91 456 7890',
    email: 'kassahun.worku@property-a.example',
    departmentId: 'dept_htl_grand_rift_hk',
    departmentName: 'Housekeeping',
    position: 'Executive Housekeeper',
    employmentDate: '2024-09-01',
    employmentStatus: 'active',
    salary: 22000,
    role: 'dept_head',
    createdAt: '2026-01-22T08:00:00.000Z',
    updatedAt: '2026-01-22T08:00:00.000Z',
  },
  {
    id: 'emp_gr_005',
    hotelId: 'htl_grand_rift',
    employeeId: 'EMP-GR-022',
    fullName: 'Tigist Gebre',
    phone: '+251 91 567 8901',
    email: 'tigist.gebre@property-a.example',
    departmentId: 'dept_htl_grand_rift_fb',
    departmentName: 'Food & Beverage',
    position: 'Restaurant Captain',
    employmentDate: '2025-05-10',
    employmentStatus: 'active',
    salary: 14500,
    role: 'supervisor',
    createdAt: '2026-02-05T09:00:00.000Z',
    updatedAt: '2026-02-05T09:00:00.000Z',
  },
  // Sample Property B Employees (Salary standardized to ETB at 1 USD = 125 ETB)
  {
    id: 'emp_bm_001',
    hotelId: 'htl_bale_lodge',
    employeeId: 'EMP-BM-001',
    fullName: 'Dawit Haile',
    phone: '+251 92 456 7890',
    email: 'dawit.haile@property-b.example',
    departmentId: 'dept_htl_bale_lodge_fo',
    departmentName: 'Front Office',
    position: 'Resident General Manager',
    employmentDate: '2024-01-01',
    employmentStatus: 'active',
    salary: 65000,
    role: 'hotel_admin',
    createdAt: '2026-02-01T10:30:00.000Z',
    updatedAt: '2026-02-01T10:30:00.000Z',
  },
];

// Seed Financial Rules & Limits (ETB standardized; converted from legacy USD thresholds at 1 USD = 125 ETB)
function generateSeedFinancialRules(hotelId: string, currency: string = 'ETB', useConvertedUsdLimits = false): HotelFinancialRules {
  const effectiveCurrency = currency || 'ETB';
  const approvalLimits = useConvertedUsdLimits
    ? { ...TAX_AND_PAYROLL_CONFIG.convertedLegacyUsdApprovalLimitsEtb }
    : { ...TAX_AND_PAYROLL_CONFIG.defaultApprovalLimitsEtb };

  return {
    id: `fin_${hotelId}`,
    hotelId,
    currency: effectiveCurrency,
    currencySymbol: effectiveCurrency === 'ETB' ? 'Br' : '$',
    vatRate: TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
    serviceChargeRate: TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
    fiscalYearStartMonth: 7,
    financialPeriods: [
      { periodName: 'Q1 Period (July - Sept)', startDate: '2026-07-01', endDate: '2026-09-30', isClosed: true },
      { periodName: 'Q2 Period (Oct - Dec)', startDate: '2026-10-01', endDate: '2026-12-31', isClosed: false },
    ],
    accountCodes: [
      { code: '1010', name: 'Cash on Hand - Front Desk Safe', category: 'Asset' },
      { code: '1020', name: 'CBE Commercial Bank Account', category: 'Asset' },
      { code: '1030', name: 'Telebirr Merchant Account', category: 'Asset' },
      { code: '2010', name: 'Accounts Payable - Food Vendors', category: 'Liability' },
      { code: '2020', name: 'VAT Withheld Payable', category: 'Liability' },
      { code: '4010', name: 'Guest Room Revenue', category: 'Revenue' },
      { code: '4020', name: 'Restaurant & Outlets Food Sales', category: 'Revenue' },
      { code: '4030', name: 'Bar & Wine Cellar Beverage Sales', category: 'Revenue' },
      { code: '5010', name: 'Cost of Goods Sold - Kitchen Food', category: 'Expense' },
      { code: '5020', name: 'Electricity & Generator Fuel', category: 'Expense' },
      { code: '5030', name: 'Staff Salaries & Wages', category: 'Expense' },
    ],
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    acceptedPaymentMethods: DEFAULT_PAYMENT_METHODS,
    approvalLimits,
    reportingDeadlines: {
      dailyClosingTime: '23:30',
      lateNotificationGraceMinutes: 30,
      notifyGMOnMissing: true,
      notifyOwnerOnWeeklySummary: true,
    },
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

// Seed Custom Fields
const SEED_CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'cf_01',
    hotelId: 'htl_grand_rift',
    module: 'front_office',
    fieldName: 'vehicle_license_plate',
    fieldLabel: 'Guest Vehicle License Plate No.',
    fieldType: 'text',
    isRequired: false,
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'cf_02',
    hotelId: 'htl_grand_rift',
    module: 'front_office',
    fieldName: 'airport_shuttle_required',
    fieldLabel: 'Airport Transfer Requested',
    fieldType: 'boolean',
    isRequired: false,
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'cf_03',
    hotelId: 'htl_grand_rift',
    module: 'housekeeping',
    fieldName: 'pillow_preference',
    fieldLabel: 'Guest Pillow Preference',
    fieldType: 'dropdown',
    options: ['Hypoallergenic Feather', 'Firm Memory Foam', 'Soft Down', 'Orthopedic'],
    isRequired: false,
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
  },
];

// Phase 3 Seed Data
const SEED_RESERVATIONS: Reservation[] = [
  {
    id: 'res_01',
    bookingReference: 'BK-2026-0841',
    hotelId: 'htl_grand_rift',
    guestName: 'Dr. Yohannes Gebre',
    guestEmail: 'yohannes.g@aau.edu.et',
    guestPhone: '+251 91 145 6789',
    guestIdOrPassport: 'ETH-PASS-784910',
    nationality: 'Ethiopian',
    roomTypeId: 'rt_dlx',
    roomTypeName: 'Deluxe Lakeview Suite',
    roomId: 'rm_htl_grand_rift_101',
    roomNumber: '101',
    checkInDate: '2026-11-05',
    checkOutDate: '2026-11-08',
    nights: 3,
    dailyRate: 3200,
    totalRoomCharge: 9600,
    status: 'checked_in',
    source: 'website',
    paymentStatus: 'partial',
    specialRequests: 'High floor, lake view, extra feather pillow',
    checkedInAt: '2026-11-05T14:30:00.000Z',
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-05T14:30:00.000Z',
  },
  {
    id: 'res_02',
    bookingReference: 'BK-2026-0842',
    hotelId: 'htl_grand_rift',
    guestName: 'Ms. Betelhem Tadesse',
    guestEmail: 'betelhem.t@unicef.org',
    guestPhone: '+251 92 345 6789',
    guestIdOrPassport: 'UN-LP-44910',
    nationality: 'Ethiopian',
    roomTypeId: 'rt_std',
    roomTypeName: 'Standard King Room',
    roomId: 'rm_htl_grand_rift_102',
    roomNumber: '102',
    checkInDate: '2026-11-06',
    checkOutDate: '2026-11-08',
    nights: 2,
    dailyRate: 2200,
    totalRoomCharge: 4400,
    status: 'confirmed',
    source: 'corporate',
    paymentStatus: 'unpaid',
    specialRequests: 'Arriving late evening around 19:30',
    createdAt: '2026-11-03T11:20:00.000Z',
    updatedAt: '2026-11-03T11:20:00.000Z',
  },
  {
    id: 'res_03',
    bookingReference: 'BK-2026-0843',
    hotelId: 'htl_grand_rift',
    guestName: 'Ambassador Pierre Dubois',
    guestEmail: 'pierre.dubois@diplomatie.gouv.fr',
    guestPhone: '+33 6 12 34 56 78',
    guestIdOrPassport: 'FRA-DIP-009182',
    nationality: 'French',
    roomTypeId: 'rt_sui',
    roomTypeName: 'Executive Presidential Villa',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    checkInDate: '2026-11-07',
    checkOutDate: '2026-11-10',
    nights: 3,
    dailyRate: 5800,
    totalRoomCharge: 17400,
    status: 'confirmed',
    source: 'phone',
    paymentStatus: 'paid',
    specialRequests: 'VIP protocol, airport shuttle pickup at 11:00 AM',
    createdAt: '2026-11-01T09:15:00.000Z',
    updatedAt: '2026-11-01T09:15:00.000Z',
  },
  {
    id: 'res_04',
    bookingReference: 'BK-2026-0839',
    hotelId: 'htl_grand_rift',
    guestName: 'Ato Solomon Mengesha',
    guestEmail: 'solomon.m@awashbank.com',
    guestPhone: '+251 91 222 3344',
    guestIdOrPassport: 'ETH-ID-99210',
    nationality: 'Ethiopian',
    roomTypeId: 'rt_std',
    roomTypeName: 'Standard King Room',
    roomId: 'rm_htl_grand_rift_103',
    roomNumber: '103',
    checkInDate: '2026-11-04',
    checkOutDate: '2026-11-06',
    nights: 2,
    dailyRate: 2200,
    totalRoomCharge: 4400,
    status: 'checked_out',
    source: 'walk_in',
    paymentStatus: 'paid',
    checkedInAt: '2026-11-04T12:00:00.000Z',
    checkedOutAt: '2026-11-06T10:15:00.000Z',
    createdAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-06T10:15:00.000Z',
  },
];

const SEED_GUEST_FOLIOS: GuestFolio[] = [
  {
    id: 'folio_res_01',
    bookingId: 'res_01',
    bookingReference: 'BK-2026-0841',
    hotelId: 'htl_grand_rift',
    guestName: 'Dr. Yohannes Gebre',
    roomNumber: '101',
    charges: [
      {
        id: 'chg_01',
        date: '2026-11-05 14:30',
        category: 'room_rate',
        description: 'Room Charge - Night 1 (Deluxe Lakeview Suite)',
        amount: 3200,
        postedBy: 'System Auto Night Post',
      },
      {
        id: 'chg_02',
        date: '2026-11-05 19:45',
        category: 'restaurant',
        description: 'Abaya View Restaurant - Grilled Chamo Tilapia & Ambo Water',
        outletName: 'Abaya View Restaurant',
        amount: 870,
        postedBy: 'Cashier Almaz',
      },
      {
        id: 'chg_03',
        date: '2026-11-06 08:30',
        category: 'minibar',
        description: 'Minibar Consumption - Soda & Mineral Water restock',
        amount: 240,
        postedBy: 'Maid Sara',
      },
    ],
    payments: [
      {
        id: 'pmt_01',
        date: '2026-11-05 14:35',
        amount: 3000,
        method: 'Commercial Bank of Ethiopia (CBE)',
        reference: 'CBE-TRX-88192301',
        receivedBy: 'Dawit Front Desk',
      },
    ],
    subtotal: 4310,
    vatAmount: 646.5,
    serviceChargeAmount: 431,
    grandTotal: 5387.5,
    totalPaid: 3000,
    balanceDue: 2387.5,
    status: 'open',
    createdAt: '2026-11-05T14:30:00.000Z',
    updatedAt: '2026-11-06T08:30:00.000Z',
  },
  {
    id: 'folio_res_04',
    bookingId: 'res_04',
    bookingReference: 'BK-2026-0839',
    hotelId: 'htl_grand_rift',
    guestName: 'Ato Solomon Mengesha',
    roomNumber: '103',
    charges: [
      {
        id: 'chg_04',
        date: '2026-11-04 12:00',
        category: 'room_rate',
        description: 'Room Charge - 2 Nights Stay (Standard King)',
        amount: 4400,
        postedBy: 'Front Desk',
      },
    ],
    payments: [
      {
        id: 'pmt_02',
        date: '2026-11-06 10:15',
        amount: 5500,
        method: 'Telebirr QR & Mobile Pay',
        reference: 'TB-991204123',
        receivedBy: 'Dawit Front Desk',
      },
    ],
    subtotal: 4400,
    vatAmount: 660,
    serviceChargeAmount: 440,
    grandTotal: 5500,
    totalPaid: 5500,
    balanceDue: 0,
    status: 'settled',
    closedAt: '2026-11-06T10:15:00.000Z',
    createdAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-06T10:15:00.000Z',
  },
];

const SEED_HOUSEKEEPING_TASKS: HousekeepingTask[] = [
  {
    id: 'hk_01',
    hotelId: 'htl_grand_rift',
    roomId: 'rm_htl_grand_rift_103',
    roomNumber: '103',
    floor: 1,
    roomTypeName: 'Standard King Room',
    priority: 'high',
    cleaningType: 'departure_clean',
    status: 'dirty',
    assignedStaffId: 'emp_02',
    assignedStaffName: 'Sara Tesfaye',
    linenReplaced: false,
    minibarRestocked: false,
    notes: 'Guest checked out at 10:15 AM. Full linen turnaround required for next guest.',
    updatedAt: '2026-11-06T10:20:00.000Z',
  },
  {
    id: 'hk_02',
    hotelId: 'htl_grand_rift',
    roomId: 'rm_htl_grand_rift_101',
    roomNumber: '101',
    floor: 1,
    roomTypeName: 'Deluxe Lakeview Suite',
    priority: 'normal',
    cleaningType: 'stayover_service',
    status: 'in_progress',
    assignedStaffId: 'emp_02',
    assignedStaffName: 'Sara Tesfaye',
    linenReplaced: true,
    minibarRestocked: true,
    minibarItemsCount: 2,
    minibarChargeAmount: 240,
    notes: 'In-house guest Dr. Yohannes requested cleaning while at breakfast.',
    startedAt: '2026-11-06T08:15:00.000Z',
    updatedAt: '2026-11-06T08:30:00.000Z',
  },
  {
    id: 'hk_03',
    hotelId: 'htl_grand_rift',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    floor: 2,
    roomTypeName: 'Executive Presidential Villa',
    priority: 'high',
    cleaningType: 'deep_clean',
    status: 'inspected',
    assignedStaffId: 'emp_02',
    assignedStaffName: 'Sara Tesfaye',
    linenReplaced: true,
    minibarRestocked: true,
    inspectedBy: 'Tigist Supervisor',
    inspectedAt: '2026-11-06T09:00:00.000Z',
    notes: 'Villa fully prepared and VIP amenities set for French Ambassador arrival.',
    updatedAt: '2026-11-06T09:00:00.000Z',
  },
];

const SEED_OUTLET_MENU_ITEMS: OutletMenuItem[] = [
  { id: 'menu_01', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Grilled Chamo Tilapia with Steamed Vegetables', category: 'food', price: 750, currency: 'ETB', isAvailable: true },
  { id: 'menu_02', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Special Beef Tibs with Fresh Injera', category: 'food', price: 680, currency: 'ETB', isAvailable: true },
  { id: 'menu_03', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Club Sandwich with Crispy Potato Fries', category: 'food', price: 520, currency: 'ETB', isAvailable: true },
  { id: 'menu_04', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Traditional Ethiopian Coffee Ceremony (Jebena)', category: 'beverage', price: 180, currency: 'ETB', isAvailable: true },
  { id: 'menu_05', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Fresh Avocado Mango Layered Juice', category: 'beverage', price: 220, currency: 'ETB', isAvailable: true },
  { id: 'menu_06', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Bedele Special Ethiopian Premium Lager', category: 'beverage', price: 150, currency: 'ETB', isAvailable: true },
  { id: 'menu_07', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Ambo Sparkling Mineral Water (500ml)', category: 'beverage', price: 120, currency: 'ETB', isAvailable: true },
  { id: 'menu_08', hotelId: 'htl_grand_rift', outletId: 'out_01', name: 'Warm Chocolate Lava Cake with Ice Cream', category: 'dessert', price: 340, currency: 'ETB', isAvailable: true },
];

const SEED_CASHIER_SHIFTS: CashierShift[] = [
  {
    id: 'shift_01',
    hotelId: 'htl_grand_rift',
    outletId: 'out_01',
    outletName: 'Abaya View Restaurant',
    cashierUserId: 'usr_cashier_01',
    cashierName: 'Almaz Cashier',
    shiftNumber: 'SHIFT-20261106-01',
    startTime: '2026-11-06T06:30:00.000Z',
    status: 'open',
    openingFloat: 1500,
    cashSales: 3450,
    cardSales: 2100,
    telebirrSales: 1850,
    roomChargeSales: 870,
    totalRevenue: 8270,
    notes: 'Morning and lunch shift in progress.',
  },
];

// Phase 4 Seed Data
const SEED_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'req_01',
    hotelId: 'htl_grand_rift',
    requisitionNumber: 'REQ-2026-081',
    departmentId: 'dept_htl_grand_rift_kt',
    departmentName: 'Kitchen',
    category: 'Food & Grocery Purchases',
    description: 'Weekly Fresh Lake Chamo Tilapia (40kg) & Organic Vegetables',
    amount: 4800,
    currency: 'ETB',
    vendorName: 'Chamo Artisanal Fishery Cooperative',
    invoiceReference: 'INV-CHAMO-2026-90',
    requestedBy: {
      name: 'Chef Solomon Mulugeta',
      email: 'chef@property-a.example',
      role: 'dept_head',
    },
    status: 'pending_dept_head',
    currentApprovalTier: 'dept_head',
    approvalHistory: [],
    createdAt: '2026-11-06T08:00:00.000Z',
    updatedAt: '2026-11-06T08:00:00.000Z',
  },
  {
    id: 'req_02',
    hotelId: 'htl_grand_rift',
    requisitionNumber: 'REQ-2026-082',
    departmentId: 'dept_htl_grand_rift_em',
    departmentName: 'Engineering & Maintenance',
    category: 'Fuel & Generator Operating',
    description: 'Generator Diesel Reserve Fuel (1,200 Litres for load-shedding backup)',
    amount: 38500,
    currency: 'ETB',
    vendorName: 'TotalEnergies Arba Minch Station',
    invoiceReference: 'TOT-AM-88192',
    requestedBy: {
      name: 'Eng. Worku Tsegaye',
      email: 'maintenance@property-a.example',
      role: 'dept_head',
    },
    status: 'pending_finance',
    currentApprovalTier: 'finance',
    approvalHistory: [
      {
        tier: 'dept_head',
        approverName: 'Eng. Worku Tsegaye (Chief Engineer)',
        action: 'approved',
        comment: 'Checked fuel level below 20% in reserve storage tank.',
        timestamp: '2026-11-05T16:00:00.000Z',
      },
    ],
    createdAt: '2026-11-05T15:30:00.000Z',
    updatedAt: '2026-11-05T16:00:00.000Z',
  },
  {
    id: 'req_03',
    hotelId: 'htl_grand_rift',
    requisitionNumber: 'REQ-2026-083',
    departmentId: 'dept_htl_grand_rift_fo',
    departmentName: 'Front Office',
    category: 'Administrative & Office Supplies',
    description: 'RFID Keycard Encoder Unit & 500x SEAM Branded Guest Contactless Room Cards',
    amount: 14500,
    currency: 'ETB',
    vendorName: 'Addis Smart Security Solutions',
    invoiceReference: 'AD-SEC-4412',
    requestedBy: {
      name: 'Dawit Haile',
      email: 'reception.lead@property-a.example',
      role: 'dept_head',
    },
    status: 'pending_gm',
    currentApprovalTier: 'gm',
    approvalHistory: [
      {
        tier: 'dept_head',
        approverName: 'Dawit Haile (Front Office Mgr)',
        action: 'approved',
        comment: 'Key card stock depleted down to 35 remaining units.',
        timestamp: '2026-11-04T10:00:00.000Z',
      },
      {
        tier: 'finance',
        approverName: 'Helen Tadesse (Finance Manager)',
        action: 'approved',
        comment: 'Budget checked against monthly FO administrative allocation. Approved.',
        timestamp: '2026-11-04T14:30:00.000Z',
      },
    ],
    createdAt: '2026-11-04T09:15:00.000Z',
    updatedAt: '2026-11-04T14:30:00.000Z',
  },
  {
    id: 'req_04',
    hotelId: 'htl_grand_rift',
    requisitionNumber: 'REQ-2026-079',
    departmentId: 'dept_htl_grand_rift_hk',
    departmentName: 'Housekeeping',
    category: 'Linen & Housekeeping Supplies',
    description: '60x Premium 400-Thread Count Egyptian Cotton Duvet Covers & 120x Bath Sheets',
    amount: 68000,
    currency: 'ETB',
    vendorName: 'Almeda Textile Mills PLC',
    invoiceReference: 'ALM-TEX-00912',
    requestedBy: {
      name: 'Sara Tesfaye',
      email: 'housekeeping@property-a.example',
      role: 'dept_head',
    },
    status: 'approved',
    currentApprovalTier: 'gm',
    approvalHistory: [
      {
        tier: 'dept_head',
        approverName: 'Sara Tesfaye (Executive Housekeeper)',
        action: 'approved',
        comment: 'Required for high season occupancy preparations.',
        timestamp: '2026-11-02T11:00:00.000Z',
      },
      {
        tier: 'finance',
        approverName: 'Helen Tadesse (Finance Manager)',
        action: 'approved',
        comment: 'Linen amortization schedule reviewed by Finance.',
        timestamp: '2026-11-02T15:00:00.000Z',
      },
      {
        tier: 'gm',
        approverName: 'Kibreab Wolde (General Manager)',
        action: 'approved',
        comment: 'Approved for procurement. Proceed with payment settlement.',
        timestamp: '2026-11-03T09:30:00.000Z',
      },
    ],
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-03T09:30:00.000Z',
  },
];

const SEED_DAILY_REVENUE_REPORTS: DailyRevenueRecord[] = [
  {
    id: 'rev_20261105',
    hotelId: 'htl_grand_rift',
    date: '2026-11-05',
    roomsRevenue: 48600,
    foodRevenue: 26450,
    beverageRevenue: 18200,
    otherRevenue: 3500,
    totalGrossRevenue: 96750,
    vatCollected: 14512.5,
    serviceChargeCollected: 9675,
    totalNetRevenue: 120937.5,
    totalRooms: 45,
    occupiedRooms: 37,
    occupancyRate: 82,
    adr: 2700,
    revPar: 2214,
    cashCollected: 42100,
    cardCollected: 31500,
    telebirrCollected: 27800,
    roomChargeCollected: 19537.5,
    approvedByGM: true,
    gmNotes: 'Solid Thursday corporate conference revenue. Beverage margin strong.',
    submittedAt: '2026-11-05T23:45:00.000Z',
  },
  {
    id: 'rev_20261104',
    hotelId: 'htl_grand_rift',
    date: '2026-11-04',
    roomsRevenue: 42000,
    foodRevenue: 21500,
    beverageRevenue: 14800,
    otherRevenue: 2400,
    totalGrossRevenue: 80700,
    vatCollected: 12105,
    serviceChargeCollected: 8070,
    totalNetRevenue: 100875,
    totalRooms: 45,
    occupiedRooms: 32,
    occupancyRate: 71,
    adr: 2625,
    revPar: 1863.75,
    cashCollected: 35000,
    cardCollected: 26800,
    telebirrCollected: 24500,
    roomChargeCollected: 14575,
    approvedByGM: true,
    gmNotes: 'Balanced and reviewed by Finance.',
    submittedAt: '2026-11-04T23:35:00.000Z',
  },
];

const SEED_BANK_RECONCILIATIONS: BankReconciliationItem[] = [
  {
    id: 'rec_01',
    hotelId: 'htl_grand_rift',
    date: '2026-11-05',
    accountName: 'Commercial Bank of Ethiopia (CBE)',
    accountNumber: '1000293849102',
    systemRecordedAmount: 142500,
    bankStatementAmount: 142500,
    variance: 0,
    status: 'matched',
    reconciledBy: 'Helen Tadesse (Finance)',
    notes: 'Direct API & statement settlement matched CBE CBE-TRX batch.',
    updatedAt: '2026-11-06T09:00:00.000Z',
  },
  {
    id: 'rec_02',
    hotelId: 'htl_grand_rift',
    date: '2026-11-05',
    accountName: 'Telebirr Merchant QR Account',
    accountNumber: 'TB-MERCH-881920',
    systemRecordedAmount: 48200,
    bankStatementAmount: 48200,
    variance: 0,
    status: 'matched',
    reconciledBy: 'Helen Tadesse (Finance)',
    notes: 'Daily merchant payout received into linked CBE account.',
    updatedAt: '2026-11-06T09:15:00.000Z',
  },
  {
    id: 'rec_03',
    hotelId: 'htl_grand_rift',
    date: '2026-11-05',
    accountName: 'Awash Bank POS Card Machine',
    accountNumber: '0142981023910',
    systemRecordedAmount: 22000,
    bankStatementAmount: 21500,
    variance: -500,
    status: 'discrepancy',
    reconciledBy: 'Helen Tadesse (Finance)',
    notes: '500 ETB variance: 1 transaction batch settlement from Restaurant till delayed until next banking day.',
    updatedAt: '2026-11-06T09:30:00.000Z',
  },
];

// Phase 5 Seed Data: Stores & Stock Inventory
const SEED_STORE_LOCATIONS: StoreLocation[] = [
  {
    id: 'loc_01',
    hotelId: 'htl_grand_rift',
    code: 'MAIN',
    name: 'Main Central Hotel Store',
    managerName: 'Alemayehu Storekeeper',
    description: 'Central receiving, bulk non-perishables, dry goods, and corporate supplies repository.',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'loc_02',
    hotelId: 'htl_grand_rift',
    code: 'KT-STORE',
    name: 'Kitchen Cold Room & Dry Store',
    managerName: 'Chef Solomon Mulugeta',
    description: 'Refrigerated walk-in chillers, freezer meat depot, fresh Lake Tilapia, and daily produce store.',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'loc_03',
    hotelId: 'htl_grand_rift',
    code: 'BAR-CELLAR',
    name: 'Wine Cellar',
    managerName: 'Nebiyu Wine Cellar Lead',
    description: 'Temperature-controlled wine cellar, craft beer crates, spirits, sodas, and Ambo mineral water.',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'loc_04',
    hotelId: 'htl_grand_rift',
    code: 'HK-DEPOT',
    name: 'Housekeeping Linen & Guest Amenities Depot',
    managerName: 'Sara Tesfaye',
    description: 'Fresh Egyptian cotton linen, towel packs, eco guest toiletries, detergents, and guestroom supplies.',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'loc_05',
    hotelId: 'htl_grand_rift',
    code: 'ENG-STORE',
    name: 'Engineering & Maintenance Workshop Store',
    managerName: 'Eng. Worku Tsegaye',
    description: 'Generator diesel reserve stock, HVAC spares, electrical fixtures, smart RFID keycard stock.',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

const SEED_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk_01',
    hotelId: 'htl_grand_rift',
    itemCode: 'FOD-TIL-01',
    name: 'Fresh Lake Chamo Tilapia (Whole Fillet)',
    category: 'food',
    unitOfMeasure: 'kg',
    storeLocationId: 'loc_02',
    storeLocationName: 'Kitchen Cold Room & Dry Store',
    currentQuantity: 45,
    reorderPoint: 20,
    reorderQuantity: 50,
    unitCost: 120,
    currency: 'ETB',
    totalValue: 5400,
    preferredSupplier: 'Chamo Artisanal Fishery Cooperative',
    lastRestockedAt: '2026-11-05T10:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'stk_02',
    hotelId: 'htl_grand_rift',
    itemCode: 'FOD-BEF-02',
    name: 'Prime Beef Fillet (Aged Beef Cuts for Tibs)',
    category: 'food',
    unitOfMeasure: 'kg',
    storeLocationId: 'loc_02',
    storeLocationName: 'Kitchen Cold Room & Dry Store',
    currentQuantity: 12,
    reorderPoint: 15,
    reorderQuantity: 30,
    unitCost: 380,
    currency: 'ETB',
    totalValue: 4560,
    preferredSupplier: 'Arba Minch Highland Abattoir',
    lastRestockedAt: '2026-11-03T11:00:00.000Z',
    status: 'low_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-03T11:00:00.000Z',
  },
  {
    id: 'stk_03',
    hotelId: 'htl_grand_rift',
    itemCode: 'FOD-COF-03',
    name: 'Yirgacheffe Single-Origin Green Coffee Beans',
    category: 'food',
    unitOfMeasure: 'kg',
    storeLocationId: 'loc_01',
    storeLocationName: 'Main Central Hotel Store',
    currentQuantity: 80,
    reorderPoint: 25,
    reorderQuantity: 60,
    unitCost: 260,
    currency: 'ETB',
    totalValue: 20800,
    preferredSupplier: 'Sidama Coffee Union',
    lastRestockedAt: '2026-11-02T09:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'stk_04',
    hotelId: 'htl_grand_rift',
    itemCode: 'BEV-BED-01',
    name: 'Bedele Special Ethiopian Premium Beer (330ml Bottles)',
    category: 'beverage',
    unitOfMeasure: 'crate',
    storeLocationId: 'loc_03',
    storeLocationName: 'Wine Cellar',
    currentQuantity: 24,
    reorderPoint: 10,
    reorderQuantity: 20,
    unitCost: 480,
    currency: 'ETB',
    totalValue: 11520,
    preferredSupplier: 'Heineken Breweries Ethiopia',
    lastRestockedAt: '2026-11-04T14:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-04T14:00:00.000Z',
  },
  {
    id: 'stk_05',
    hotelId: 'htl_grand_rift',
    itemCode: 'BEV-AMB-02',
    name: 'Ambo Sparkling Mineral Water (500ml Glass Bottles)',
    category: 'beverage',
    unitOfMeasure: 'crate',
    storeLocationId: 'loc_03',
    storeLocationName: 'Wine Cellar',
    currentQuantity: 6,
    reorderPoint: 8,
    reorderQuantity: 15,
    unitCost: 240,
    currency: 'ETB',
    totalValue: 1440,
    preferredSupplier: 'Ambo Mineral Water SC',
    lastRestockedAt: '2026-11-01T15:00:00.000Z',
    status: 'low_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-06T12:00:00.000Z',
  },
  {
    id: 'stk_06',
    hotelId: 'htl_grand_rift',
    itemCode: 'BEV-WIN-03',
    name: 'Rift Valley Merlot Reserve (750ml Premium Wine)',
    category: 'beverage',
    unitOfMeasure: 'bottle',
    storeLocationId: 'loc_03',
    storeLocationName: 'Wine Cellar',
    currentQuantity: 0,
    reorderPoint: 12,
    reorderQuantity: 24,
    unitCost: 450,
    currency: 'ETB',
    totalValue: 0,
    preferredSupplier: 'Castel Winery Ethiopia',
    lastRestockedAt: '2026-10-25T11:00:00.000Z',
    status: 'out_of_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-06T09:00:00.000Z',
  },
  {
    id: 'stk_07',
    hotelId: 'htl_grand_rift',
    itemCode: 'LIN-DUV-01',
    name: 'Premium Egyptian Cotton Duvet Covers (King Size)',
    category: 'linen',
    unitOfMeasure: 'piece',
    storeLocationId: 'loc_04',
    storeLocationName: 'Housekeeping Linen & Guest Amenities Depot',
    currentQuantity: 65,
    reorderPoint: 20,
    reorderQuantity: 40,
    unitCost: 850,
    currency: 'ETB',
    totalValue: 55250,
    preferredSupplier: 'Almeda Textile Mills PLC',
    lastRestockedAt: '2026-11-03T09:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-03T09:00:00.000Z',
  },
  {
    id: 'stk_08',
    hotelId: 'htl_grand_rift',
    itemCode: 'CLN-DET-01',
    name: 'Hospital-Grade Commercial Multi-Surface Disinfectant',
    category: 'cleaning_supplies',
    unitOfMeasure: 'litre',
    storeLocationId: 'loc_04',
    storeLocationName: 'Housekeeping Linen & Guest Amenities Depot',
    currentQuantity: 18,
    reorderPoint: 25,
    reorderQuantity: 50,
    unitCost: 95,
    currency: 'ETB',
    totalValue: 1710,
    preferredSupplier: 'Ethio Chemicals Enterprise',
    lastRestockedAt: '2026-10-28T16:00:00.000Z',
    status: 'low_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-05T14:00:00.000Z',
  },
  {
    id: 'stk_09',
    hotelId: 'htl_grand_rift',
    itemCode: 'AMN-SOP-01',
    name: 'SEAM Branded Luxury Botanical Guest Soap (40g Bars)',
    category: 'guest_amenities',
    unitOfMeasure: 'pack',
    storeLocationId: 'loc_04',
    storeLocationName: 'Housekeeping Linen & Guest Amenities Depot',
    currentQuantity: 320,
    reorderPoint: 100,
    reorderQuantity: 200,
    unitCost: 35,
    currency: 'ETB',
    totalValue: 11200,
    preferredSupplier: 'Addis Aromatics PLC',
    lastRestockedAt: '2026-11-04T12:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
  },
  {
    id: 'stk_10',
    hotelId: 'htl_grand_rift',
    itemCode: 'FUE-DSL-01',
    name: 'Generator Low-Sulfur Diesel Fuel (Backup Reserve)',
    category: 'fuel',
    unitOfMeasure: 'litre',
    storeLocationId: 'loc_05',
    storeLocationName: 'Engineering & Maintenance Workshop Store',
    currentQuantity: 1450,
    reorderPoint: 500,
    reorderQuantity: 1000,
    unitCost: 82,
    currency: 'ETB',
    totalValue: 118900,
    preferredSupplier: 'TotalEnergies Arba Minch Station',
    lastRestockedAt: '2026-11-05T16:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-05T16:00:00.000Z',
  },
  {
    id: 'stk_11',
    hotelId: 'htl_grand_rift',
    itemCode: 'MNT-KEY-01',
    name: 'Smart RFID Contactless Room Keycards (SEAM Branded)',
    category: 'maintenance',
    unitOfMeasure: 'piece',
    storeLocationId: 'loc_05',
    storeLocationName: 'Engineering & Maintenance Workshop Store',
    currentQuantity: 450,
    reorderPoint: 100,
    reorderQuantity: 300,
    unitCost: 28,
    currency: 'ETB',
    totalValue: 12600,
    preferredSupplier: 'Addis Smart Security Solutions',
    lastRestockedAt: '2026-11-04T15:00:00.000Z',
    status: 'in_stock',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-04T15:00:00.000Z',
  },
];

const SEED_GRVS: GoodsReceivedVoucher[] = [
  {
    id: 'grv_01',
    hotelId: 'htl_grand_rift',
    grvNumber: 'GRV-2026-101',
    vendorName: 'Chamo Artisanal Fishery Cooperative',
    invoiceReference: 'INV-CHAMO-2026-90',
    purchaseRequisitionNumber: 'REQ-2026-081',
    storeLocationId: 'loc_02',
    storeLocationName: 'Kitchen Cold Room & Dry Store',
    receivedDate: '2026-11-05',
    receivedBy: 'Alemayehu Storekeeper',
    items: [
      {
        itemId: 'stk_01',
        itemCode: 'FOD-TIL-01',
        itemName: 'Fresh Lake Chamo Tilapia (Whole Fillet)',
        unitOfMeasure: 'kg',
        quantity: 40,
        unitCost: 120,
        totalCost: 4800,
      },
    ],
    grandTotal: 4800,
    currency: 'ETB',
    status: 'verified',
    notes: 'Delivered in chilled ice boxes. Inspected and approved by Executive Chef.',
    createdAt: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'grv_02',
    hotelId: 'htl_grand_rift',
    grvNumber: 'GRV-2026-102',
    vendorName: 'TotalEnergies Arba Minch Station',
    invoiceReference: 'TOT-AM-88192',
    purchaseRequisitionNumber: 'REQ-2026-082',
    storeLocationId: 'loc_05',
    storeLocationName: 'Engineering & Maintenance Workshop Store',
    receivedDate: '2026-11-05',
    receivedBy: 'Eng. Worku Tsegaye',
    items: [
      {
        itemId: 'stk_10',
        itemCode: 'FUE-DSL-01',
        itemName: 'Generator Low-Sulfur Diesel Fuel (Backup Reserve)',
        unitOfMeasure: 'litre',
        quantity: 1200,
        unitCost: 82,
        totalCost: 98400,
      },
    ],
    grandTotal: 98400,
    currency: 'ETB',
    status: 'verified',
    notes: 'Fuel bowser metered discharge into underground reserve tank #2.',
    createdAt: '2026-11-05T16:00:00.000Z',
  },
];

const SEED_SIVS: StoreIssueVoucher[] = [
  {
    id: 'siv_01',
    hotelId: 'htl_grand_rift',
    sivNumber: 'SIV-2026-081',
    requestingDepartmentId: 'dept_htl_grand_rift_kt',
    requestingDepartmentName: 'Kitchen',
    storeLocationId: 'loc_02',
    storeLocationName: 'Kitchen Cold Room & Dry Store',
    issuedToStaffName: 'Chef Solomon Mulugeta',
    issuedBy: 'Alemayehu Storekeeper',
    issueDate: '2026-11-06',
    purpose: 'Banquet dinner tilapia prep and lunch service buffet',
    items: [
      {
        itemId: 'stk_01',
        itemCode: 'FOD-TIL-01',
        itemName: 'Fresh Lake Chamo Tilapia (Whole Fillet)',
        unitOfMeasure: 'kg',
        quantity: 15,
        unitCost: 120,
        totalCost: 1800,
      },
    ],
    totalValue: 1800,
    currency: 'ETB',
    status: 'issued',
    notes: 'Daily requisition issued to hot kitchen station.',
    createdAt: '2026-11-06T07:30:00.000Z',
  },
  {
    id: 'siv_02',
    hotelId: 'htl_grand_rift',
    sivNumber: 'SIV-2026-082',
    requestingDepartmentId: 'dept_htl_grand_rift_hk',
    requestingDepartmentName: 'Housekeeping',
    storeLocationId: 'loc_04',
    storeLocationName: 'Housekeeping Linen & Guest Amenities Depot',
    issuedToStaffName: 'Sara Tesfaye',
    issuedBy: 'Alemayehu Storekeeper',
    issueDate: '2026-11-06',
    purpose: 'Daily departure room turnover replenishment',
    items: [
      {
        itemId: 'stk_09',
        itemCode: 'AMN-SOP-01',
        itemName: 'SEAM Branded Luxury Botanical Guest Soap (40g Bars)',
        unitOfMeasure: 'pack',
        quantity: 80,
        unitCost: 35,
        totalCost: 2800,
      },
    ],
    totalValue: 2800,
    currency: 'ETB',
    status: 'issued',
    notes: 'Floor maids trolleys restocking for 2nd and 3rd floors.',
    createdAt: '2026-11-06T08:00:00.000Z',
  },
];

const SEED_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj_01',
    hotelId: 'htl_grand_rift',
    adjustmentNumber: 'ADJ-2026-009',
    itemId: 'stk_05',
    itemCode: 'BEV-AMB-02',
    itemName: 'Ambo Sparkling Mineral Water (500ml Glass Bottles)',
    storeLocationId: 'loc_03',
    storeLocationName: 'Wine Cellar',
    adjustmentType: 'breakage',
    previousQuantity: 8,
    newQuantity: 6,
    quantityDelta: -2,
    unitCost: 240,
    totalImpactValue: 480,
    reason: 'Two crates fell during delivery unloading on stairs.',
    authorizedBy: 'Helen Tadesse (Finance)',
    date: '2026-11-06',
    createdAt: '2026-11-06T12:00:00.000Z',
  },
];

// Phase 6 Seed Data: Maintenance, Engineering & Asset Work Orders
const SEED_ASSETS: AssetRecord[] = [
  {
    id: 'ast_01',
    hotelId: 'htl_grand_rift',
    assetCode: 'AST-GEN-01',
    name: 'Cummins 500kVA Standby Power Generator',
    category: 'generator_power',
    location: 'Main Generator Shed',
    manufacturer: 'Cummins Power Generation',
    modelNumber: 'C500D5e',
    serialNumber: 'CUM-ET-2024-8841',
    purchaseDate: '2024-03-15',
    purchaseCost: 2850000,
    warrantyExpiry: '2027-03-15',
    operatingStatus: 'operational',
    lastServicedDate: '2026-10-15',
    nextScheduledServiceDate: '2026-11-15',
    serviceIntervalDays: 30,
    criticality: 'vital',
    notes: 'Primary emergency power generation plant for guest villas, kitchen, and water pumps.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-04T13:00:00.000Z',
  },
  {
    id: 'ast_02',
    hotelId: 'htl_grand_rift',
    assetCode: 'AST-CHL-01',
    name: 'Daikin Central Water-Cooled Chiller Unit #1',
    category: 'hvac',
    location: 'Rooftop Mechanical Plant',
    manufacturer: 'Daikin Applied',
    modelNumber: 'EWAD-TZ-B',
    serialNumber: 'DKN-2024-99120',
    purchaseDate: '2024-05-10',
    purchaseCost: 1950000,
    warrantyExpiry: '2027-05-10',
    operatingStatus: 'operational',
    lastServicedDate: '2026-09-20',
    nextScheduledServiceDate: '2026-12-20',
    serviceIntervalDays: 90,
    criticality: 'vital',
    notes: 'Circulates chilled water to all guest rooms, conference halls, and lobby fan coil units.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'ast_03',
    hotelId: 'htl_grand_rift',
    assetCode: 'AST-BLR-01',
    name: 'Viessmann Commercial Hot Water Heating Boiler',
    category: 'plumbing',
    location: 'Basement Boiler Plant Room',
    manufacturer: 'Viessmann Group',
    modelNumber: 'Vitomax 200-LW',
    serialNumber: 'VSM-HW-44102',
    purchaseDate: '2024-02-01',
    purchaseCost: 820000,
    warrantyExpiry: '2026-02-01',
    operatingStatus: 'degraded',
    lastServicedDate: '2026-10-01',
    nextScheduledServiceDate: '2026-11-10',
    serviceIntervalDays: 60,
    criticality: 'vital',
    notes: 'Pressure safety valve slight seepage detected. Scheduled for seal replacement.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'ast_04',
    hotelId: 'htl_grand_rift',
    assetCode: 'AST-LND-01',
    name: 'Girbau 28kg Industrial Barrier Washer-Extractor',
    category: 'electrical',
    location: 'Central Laundry Basement',
    manufacturer: 'Girbau Global Laundry',
    modelNumber: 'HS-6028',
    serialNumber: 'GB-6028-0914',
    purchaseDate: '2024-06-12',
    purchaseCost: 650000,
    warrantyExpiry: '2026-06-12',
    operatingStatus: 'operational',
    lastServicedDate: '2026-10-25',
    nextScheduledServiceDate: '2026-11-25',
    serviceIntervalDays: 30,
    criticality: 'essential',
    notes: 'High-speed spin extractor for Egyptian cotton linen and bath towels.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'ast_05',
    hotelId: 'htl_grand_rift',
    assetCode: 'AST-POL-01',
    name: 'AstralPool Commercial Sand Filtration & Chlorination Pump',
    category: 'pool_spa',
    location: 'Resort Swimming Pool Plant Room',
    manufacturer: 'Fluidra / AstralPool',
    modelNumber: 'Kivu Commercial 5.5HP',
    serialNumber: 'AST-KV-8819',
    purchaseDate: '2024-08-20',
    purchaseCost: 340000,
    warrantyExpiry: '2026-08-20',
    operatingStatus: 'operational',
    lastServicedDate: '2026-11-01',
    nextScheduledServiceDate: '2026-11-08',
    serviceIntervalDays: 7,
    criticality: 'essential',
    notes: 'Dual sand filters with automatic pH dosing and UV water clarifier.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
];

const SEED_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo_01',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'WO-2026-041',
    title: 'Room 102 Air Conditioning Inverter Condensate Leak',
    description: 'Water dripping from bedroom wall split unit onto wooden credenza. Escrow drip tray clogged.',
    category: 'hvac',
    priority: 'high',
    status: 'in_progress',
    source: 'housekeeping',
    targetType: 'room',
    roomId: 'rm_htl_grand_rift_102',
    roomNumber: '102',
    roomOutOfOrder: true,
    reportedBy: 'Sara Tesfaye (Executive Housekeeper)',
    assignedTechnicianId: 'emp_01',
    assignedTechnicianName: 'Eng. Worku Tsegaye (Chief Engineer)',
    reportedAt: '2026-11-06T09:30:00.000Z',
    startedAt: '2026-11-06T10:15:00.000Z',
    partsUsed: [
      {
        itemCode: 'HVAC-DRN-01',
        itemName: 'Clear Condensate Drain Hose (2m Heavy Duty)',
        quantity: 1,
        unitCost: 350,
        totalCost: 350,
      },
    ],
    totalPartsCost: 350,
    currency: 'ETB',
    createdAt: '2026-11-06T09:30:00.000Z',
    updatedAt: '2026-11-06T10:15:00.000Z',
  },
  {
    id: 'wo_02',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'WO-2026-042',
    title: 'Executive Villa 201 Jacuzzi Thermostatic Mixer Valve Sticking',
    description: 'Guest reported hot water fluctuating during evening whirlpool bath. Requires cartridge cleaning or replacement.',
    category: 'plumbing',
    priority: 'critical',
    status: 'assigned',
    source: 'front_desk',
    targetType: 'room',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    roomOutOfOrder: false,
    reportedBy: 'Dawit Haile (Front Office Manager)',
    assignedTechnicianId: 'emp_01',
    assignedTechnicianName: 'Eng. Worku Tsegaye (Chief Engineer)',
    reportedAt: '2026-11-06T14:15:00.000Z',
    partsUsed: [],
    totalPartsCost: 0,
    currency: 'ETB',
    createdAt: '2026-11-06T14:15:00.000Z',
    updatedAt: '2026-11-06T14:30:00.000Z',
  },
  {
    id: 'wo_03',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'WO-2026-039',
    title: 'Abaya View Restaurant Undercounter Beverage Cooler Door Gasket',
    description: 'Rubber door seal split on left compartment causing compressor to run continuously and frost build-up.',
    category: 'kitchen_appliance',
    priority: 'medium',
    status: 'resolved',
    source: 'routine_inspection',
    targetType: 'outlet',
    outletId: 'out_01',
    outletName: 'Abaya View Restaurant',
    roomOutOfOrder: false,
    reportedBy: 'Chef Solomon Mulugeta (Executive Chef)',
    assignedTechnicianId: 'emp_01',
    assignedTechnicianName: 'Eng. Worku Tsegaye (Chief Engineer)',
    reportedAt: '2026-11-05T11:00:00.000Z',
    startedAt: '2026-11-05T13:00:00.000Z',
    resolvedAt: '2026-11-05T15:30:00.000Z',
    resolutionNotes: 'Fitted food-grade magnetic gasket seal. Temperature stabilized at +3°C.',
    laborHours: 2.5,
    partsUsed: [
      {
        itemCode: 'GSK-FRG-02',
        itemName: 'Food-grade Magnetic Undercounter Door Gasket',
        quantity: 1,
        unitCost: 650,
        totalCost: 650,
      },
    ],
    totalPartsCost: 650,
    currency: 'ETB',
    createdAt: '2026-11-05T11:00:00.000Z',
    updatedAt: '2026-11-05T15:30:00.000Z',
  },
  {
    id: 'wo_04',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'WO-2026-038',
    title: 'Main Standby Generator 250-Hour Lube & Filtration Overhaul',
    description: 'Completed scheduled monthly PPM service: drained engine oil, replaced oil filters and secondary fuel water separators.',
    category: 'generator_power',
    priority: 'medium',
    status: 'closed',
    source: 'preventive_schedule',
    targetType: 'equipment_asset',
    assetId: 'ast_01',
    assetName: 'Cummins 500kVA Standby Power Generator',
    roomOutOfOrder: false,
    reportedBy: 'Chief Engineer PPM Scheduler',
    assignedTechnicianId: 'emp_01',
    assignedTechnicianName: 'Eng. Worku Tsegaye (Chief Engineer)',
    reportedAt: '2026-11-04T08:00:00.000Z',
    startedAt: '2026-11-04T08:30:00.000Z',
    resolvedAt: '2026-11-04T12:00:00.000Z',
    closedAt: '2026-11-04T13:00:00.000Z',
    inspectedBy: 'Kibreab Wolde (General Manager)',
    resolutionNotes: 'Automatic Transfer Switch (ATS) off-load and on-load test completed. Generator back to 100% standby capacity.',
    laborHours: 4,
    partsUsed: [
      {
        itemCode: 'FLT-OIL-01',
        itemName: 'Cummins Fleetguard Heavy Oil Filters',
        quantity: 2,
        unitCost: 1200,
        totalCost: 2400,
      },
    ],
    totalPartsCost: 2400,
    currency: 'ETB',
    createdAt: '2026-11-04T08:00:00.000Z',
    updatedAt: '2026-11-04T13:00:00.000Z',
  },
];

const SEED_PREVENTIVE_SCHEDULES: PreventiveSchedule[] = [
  {
    id: 'ppm_01',
    hotelId: 'htl_grand_rift',
    scheduleCode: 'PPM-GEN-250',
    title: 'Standby Generator Monthly 250-Hour Inspection & Lube',
    assetId: 'ast_01',
    assetName: 'Cummins 500kVA Standby Power Generator',
    category: 'generator_power',
    frequency: 'monthly',
    estimatedHours: 3,
    assignedRoleOrTech: 'Chief Engineer Worku Tsegaye',
    lastRunDate: '2026-11-04',
    nextDueDate: '2026-11-15',
    isActive: true,
    checklist: [
      { id: 'c1', task: 'Check engine oil level, color and viscosity', isMandatory: true },
      { id: 'c2', task: 'Inspect radiator coolant hoses and corrosion inhibitor', isMandatory: true },
      { id: 'c3', task: 'Test starter battery electrolyte density and trickle charger', isMandatory: true },
      { id: 'c4', task: 'Conduct 15-minute test run and verify ATS sensor contactors', isMandatory: true },
    ],
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'ppm_02',
    hotelId: 'htl_grand_rift',
    scheduleCode: 'PPM-CHL-QRT',
    title: 'Central Chiller Condenser Descaling & Refrigerant Pressure Test',
    assetId: 'ast_02',
    assetName: 'Daikin Central Water-Cooled Chiller Unit #1',
    category: 'hvac',
    frequency: 'quarterly',
    estimatedHours: 6,
    assignedRoleOrTech: 'Senior HVAC Technician',
    lastRunDate: '2026-09-20',
    nextDueDate: '2026-12-20',
    isActive: true,
    checklist: [
      { id: 'c5', task: 'Log suction and discharge operating refrigerant pressures', isMandatory: true },
      { id: 'c6', task: 'Flush and descale shell-and-tube water condenser', isMandatory: true },
      { id: 'c7', task: 'Inspect high-voltage electrical contactors and terminal torque', isMandatory: false },
    ],
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'ppm_03',
    hotelId: 'htl_grand_rift',
    scheduleCode: 'PPM-POOL-WK',
    title: 'Swimming Pool Sand Filtration Backwash & Water Chemistry Test',
    assetId: 'ast_05',
    assetName: 'AstralPool Commercial Sand Filtration & Chlorination Pump',
    category: 'pool_spa',
    frequency: 'weekly',
    estimatedHours: 1.5,
    assignedRoleOrTech: 'Pool Maintenance Technician',
    lastRunDate: '2026-11-01',
    nextDueDate: '2026-11-08',
    isActive: true,
    checklist: [
      { id: 'c8', task: 'Backwash and rinse commercial silica sand filter bed', isMandatory: true },
      { id: 'c9', task: 'Test free chlorine, total chlorine, and pH levels (7.2-7.6)', isMandatory: true },
      { id: 'c10', task: 'Clean pump hair & lint strainer basket', isMandatory: true },
    ],
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

// Phase 7 Seed Data: Conferences, Events & Banqueting
const SEED_EVENT_SPACES: EventSpace[] = [
  {
    id: 'spc_01',
    hotelId: 'htl_grand_rift',
    code: 'HALL-BALLROOM',
    name: 'Grand Abaya Ballroom & Conference Center',
    floorOrLocation: 'Convention Wing - Ground Floor',
    dimensionsMeters: '30m x 15m (4.5m ceiling height)',
    areaSqMeters: 450,
    capacities: {
      theater: 450,
      classroom: 260,
      banquet: 300,
      u_shape: 90,
      boardroom: 60,
      cocktail: 500,
    },
    dailyRate: 45000,
    halfDayRate: 28000,
    hourlyRate: 6500,
    currency: 'ETB',
    amenities: [
      'Dual 4K Laser Projectors & Motorized Screens',
      'JBL Pro Line Array Sound System',
      'Wireless Lapel & Handheld Microphones (6 Units)',
      'Simultaneous 4-Language Translation Booths',
      'Modular Hydraulic Stage & Executive Podium',
      'Dedicated High-Speed 1Gbps Fiber Wi-Fi',
      'Adjustable Intelligent Stage Lighting Rig',
      'Private VIP Delegate Green Room',
    ],
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'spc_02',
    hotelId: 'htl_grand_rift',
    code: 'ROOM-BOARDROOM',
    name: 'Rift Valley Executive Boardroom',
    floorOrLocation: 'Executive Club Level - 3rd Floor',
    dimensionsMeters: '10m x 7.5m',
    areaSqMeters: 75,
    capacities: {
      theater: 40,
      classroom: 25,
      banquet: 30,
      u_shape: 22,
      boardroom: 24,
      cocktail: 40,
    },
    dailyRate: 18000,
    halfDayRate: 11000,
    hourlyRate: 3000,
    currency: 'ETB',
    amenities: [
      '85-inch 4K Interactive Touch Smart Screen',
      'Polycom Studio 4K Video Conference Bar',
      'Ergonomic Leather Executive Armchairs',
      'Concealed In-Desk HDMI, Type-C & Power Pods',
      'Private Nespresso Espresso & Mineral Water Bar',
      'Soundproof Acoustic Paneling & Automated Blinds',
    ],
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'spc_03',
    hotelId: 'htl_grand_rift',
    code: 'GARDEN-PAVILION',
    name: 'Lakeview Garden Pavilion & Marquee',
    floorOrLocation: 'Lakeside Lawn Promenade',
    dimensionsMeters: '25m x 14m Outdoor Canopy',
    areaSqMeters: 350,
    capacities: {
      theater: 300,
      classroom: 180,
      banquet: 250,
      u_shape: 70,
      boardroom: 40,
      cocktail: 400,
    },
    dailyRate: 35000,
    halfDayRate: 22000,
    hourlyRate: 5000,
    currency: 'ETB',
    amenities: [
      'Direct Unobstructed Views of Lake Chamo & Abaya',
      'All-Weather Heavy Duty Translucent Marquee Canopy',
      'Integrated Outdoor Ambient Mood Lighting',
      'Dedicated Outdoor Banquet Serving Buffet Stations',
      'Portable High-Definition Sound Rig & Wireless Mics',
      'Open-Air Cocktail & Mocktail Bar Setup',
    ],
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'spc_04',
    hotelId: 'htl_grand_rift',
    code: 'CONF-SIMIEN-B',
    name: 'Nechisar Seminar Hall B',
    floorOrLocation: 'Convention Wing - Mezzanine Floor',
    dimensionsMeters: '12m x 10m',
    areaSqMeters: 120,
    capacities: {
      theater: 110,
      classroom: 70,
      banquet: 80,
      u_shape: 35,
      boardroom: 30,
      cocktail: 120,
    },
    dailyRate: 22000,
    halfDayRate: 14000,
    hourlyRate: 3500,
    currency: 'ETB',
    amenities: [
      'Ceiling-Mounted Full HD Projector & Electric Screen',
      'Surround Sound Audio with Lapel Mics',
      'Magnetic Writing Whiteboards & Flipcharts',
      'Acoustic Movable Partition Walls (Can Combine with Hall A)',
      'High-Speed Wi-Fi & Presenter Clicker',
    ],
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

const SEED_EVENT_BOOKINGS: EventBooking[] = [
  {
    id: 'evt_01',
    hotelId: 'htl_grand_rift',
    bookingReference: 'EVT-2026-081',
    eventTitle: 'UN-ECA Horn of Africa Sustainable Tourism & Hospitality Summit',
    clientName: 'United Nations Economic Commission for Africa',
    contactPerson: 'Dr. Almaz Kebede (Programme Director)',
    contactPhone: '+251 91 123 4567',
    contactEmail: 'almaz.kebede@uneca.org',
    organizationTin: '0019283741',
    eventSpaceId: 'spc_01',
    eventSpaceName: 'Grand Abaya Ballroom & Conference Center',
    setupType: 'classroom',
    expectedAttendees: 220,
    startDate: '2026-11-12',
    endDate: '2026-11-14',
    startTime: '08:30',
    endTime: '17:30',
    status: 'confirmed',
    cateringMenuTitle: '3-Day VIP Continental Buffet + Morning/Afternoon Specialty Coffee & Pastry Breaks',
    specialDietaryNotes: '15 Strict Vegetarian, 8 Halal Certified, 3 Gluten-free delegates',
    avRequirements: [
      'Dual 4K Laser Projectors & Motorized Screens',
      'Simultaneous 4-Language Translation Booths',
      'Wireless Lapel & Handheld Microphones (6 Units)',
      'Dedicated High-Speed 1Gbps Fiber Wi-Fi',
    ],
    lineItems: [
      {
        itemType: 'venue_rental',
        name: 'Grand Ballroom Venue Rental (3 Full Days)',
        quantity: 3,
        unitPrice: 45000,
        totalPrice: 135000,
      },
      {
        itemType: 'catering_package',
        name: 'Deluxe Conference Package (Buffet Lunch + 2 Tea Breaks)',
        quantity: 660,
        unitPrice: 450,
        totalPrice: 297000,
        notes: '220 delegates across 3 days',
      },
      {
        itemType: 'av_equipment',
        name: '4-Language Simultaneous Translation System & Receivers',
        quantity: 3,
        unitPrice: 12000,
        totalPrice: 36000,
      },
    ],
    subtotal: 468000,
    serviceCharge10Pct: 46800,
    vat15Pct: 77220,
    grandTotal: 592020,
    depositPaid: 300000,
    balanceDue: 292020,
    currency: 'ETB',
    beoApprovedByGM: true,
    beoApprovedAt: '2026-11-04T14:30:00.000Z',
    notes: 'Opening keynote by Ministry of Tourism delegation. Official UN flags required on stage podium.',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-04T14:30:00.000Z',
  },
  {
    id: 'evt_02',
    hotelId: 'htl_grand_rift',
    bookingReference: 'EVT-2026-082',
    eventTitle: 'Ethiopian Airlines Regional Executive Leadership Retreat',
    clientName: 'Ethiopian Airlines Group',
    contactPerson: 'Yohannes Girma (VP Corporate Strategy)',
    contactPhone: '+251 92 334 5566',
    contactEmail: 'yohannesg@ethiopianairlines.com',
    organizationTin: '0001002938',
    eventSpaceId: 'spc_02',
    eventSpaceName: 'Rift Valley Executive Boardroom',
    setupType: 'boardroom',
    expectedAttendees: 20,
    startDate: '2026-11-10',
    endDate: '2026-11-10',
    startTime: '09:00',
    endTime: '18:00',
    status: 'confirmed',
    cateringMenuTitle: 'Executive Plated Luncheon & All-Day Espresso & Fresh Tropical Fruit Bar',
    specialDietaryNotes: '2 Pescatarian, 1 Diabetic meal required',
    avRequirements: [
      '85-inch 4K Interactive Touch Smart Screen',
      'Polycom Studio 4K Video Conference Bar',
    ],
    lineItems: [
      {
        itemType: 'venue_rental',
        name: 'Executive Boardroom Full Day Rental',
        quantity: 1,
        unitPrice: 18000,
        totalPrice: 18000,
      },
      {
        itemType: 'catering_package',
        name: 'VIP Executive 3-Course Plated Luncheon & Continuous Coffee Bar',
        quantity: 20,
        unitPrice: 650,
        totalPrice: 13000,
      },
    ],
    subtotal: 31000,
    serviceCharge10Pct: 3100,
    vat15Pct: 5115,
    grandTotal: 39215,
    depositPaid: 39215,
    balanceDue: 0,
    currency: 'ETB',
    beoApprovedByGM: true,
    beoApprovedAt: '2026-11-05T11:00:00.000Z',
    notes: 'Secure board meeting with strict privacy requirements. Service staff on-demand bell only.',
    createdAt: '2026-11-03T09:00:00.000Z',
    updatedAt: '2026-11-05T11:00:00.000Z',
  },
  {
    id: 'evt_03',
    hotelId: 'htl_grand_rift',
    bookingReference: 'EVT-2026-083',
    eventTitle: 'TechEthio Annual Developers Gala Dinner & Innovation Awards',
    clientName: 'TechEthio Innovation Hub',
    contactPerson: 'Selamawit Fekadu (Event Manager)',
    contactPhone: '+251 94 455 6677',
    contactEmail: 'selam@techethio.org',
    organizationTin: '0029384756',
    eventSpaceId: 'spc_03',
    eventSpaceName: 'Lakeview Garden Pavilion & Marquee',
    setupType: 'cocktail',
    expectedAttendees: 180,
    startDate: '2026-11-20',
    endDate: '2026-11-20',
    startTime: '17:00',
    endTime: '23:30',
    status: 'tentative',
    cateringMenuTitle: 'Gourmet Finger-Food Canapés & Lake Tilapia Sliders + Sunset Mocktail Bar',
    specialDietaryNotes: 'General international and Ethiopian fasting food selection',
    avRequirements: [
      'Integrated Outdoor Ambient Mood Lighting',
      'Portable High-Definition Sound Rig & Wireless Mics',
    ],
    lineItems: [
      {
        itemType: 'venue_rental',
        name: 'Lakeview Garden Pavilion Evening Session',
        quantity: 1,
        unitPrice: 35000,
        totalPrice: 35000,
      },
      {
        itemType: 'catering_package',
        name: 'Premium Cocktail Reception Package (Canapés + Mocktails)',
        quantity: 180,
        unitPrice: 500,
        totalPrice: 90000,
      },
      {
        itemType: 'decor',
        name: 'Ambient LED Fairy Lighting & Acoustic Stage Setup',
        quantity: 1,
        unitPrice: 15000,
        totalPrice: 15000,
      },
    ],
    subtotal: 140000,
    serviceCharge10Pct: 14000,
    vat15Pct: 23100,
    grandTotal: 177100,
    depositPaid: 50000,
    balanceDue: 127100,
    currency: 'ETB',
    beoApprovedByGM: false,
    notes: 'Client considering acoustic live jazz band. Pending final contract signature.',
    createdAt: '2026-11-05T16:00:00.000Z',
    updatedAt: '2026-11-05T16:00:00.000Z',
  },
];

// Phase 8 Seed Data: Guest CRM, Loyalty, Spa & Wellness
const SEED_GUEST_PROFILES: GuestProfile[] = [
  {
    id: 'gst_01',
    hotelId: 'htl_grand_rift',
    guestCode: 'GST-VIP-001',
    fullName: 'Dr. Almaz Kebede',
    email: 'almaz.kebede@uneca.org',
    phone: '+251 91 123 4567',
    nationality: 'Ethiopian',
    idOrPassportNumber: 'EP-9918239',
    companyAffiliation: 'United Nations Economic Commission for Africa',
    vipTier: 'platinum',
    loyaltyPointsBalance: 4850,
    lifetimeStaysCount: 8,
    lifetimeSpend: 680000,
    currency: 'ETB',
    preferences: {
      roomLocation: 'high_floor',
      pillowType: 'feather',
      dietaryRestrictions: ['Vegetarian', 'No Bell Peppers'],
      favoriteDrink: 'Sparkling Mineral Water with Lime slice',
      specialNotes: 'VIP Presidential protocol. Requires quiet lakeview wing and early morning international newspapers.',
    },
    lastStayDate: '2026-11-04',
    status: 'vip_flagged',
    satisfactionScore: 5,
    createdAt: '2025-06-15T08:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'gst_02',
    hotelId: 'htl_grand_rift',
    guestCode: 'GST-VIP-002',
    fullName: 'Yohannes Girma',
    email: 'yohannesg@ethiopianairlines.com',
    phone: '+251 92 334 5566',
    nationality: 'Ethiopian',
    idOrPassportNumber: 'EP-4410291',
    companyAffiliation: 'Ethiopian Airlines Group',
    vipTier: 'gold',
    loyaltyPointsBalance: 2400,
    lifetimeStaysCount: 5,
    lifetimeSpend: 185000,
    currency: 'ETB',
    preferences: {
      roomLocation: 'quiet_corner',
      pillowType: 'memory_foam',
      dietaryRestrictions: ['Pescatarian'],
      favoriteDrink: 'Double Macchiato (Ethiopian Yirgacheffe Roast)',
      specialNotes: 'Frequent corporate guest. Prefers express checkout and electronic billing direct to corporate account.',
    },
    lastStayDate: '2026-10-28',
    status: 'active',
    satisfactionScore: 4.8,
    createdAt: '2025-08-20T08:00:00.000Z',
    updatedAt: '2026-11-02T14:00:00.000Z',
  },
  {
    id: 'gst_03',
    hotelId: 'htl_grand_rift',
    guestCode: 'GST-VIP-003',
    fullName: 'Sample Guest A',
    email: 'guest.a@example.com',
    phone: '+44 7911 123456',
    nationality: 'British',
    idOrPassportNumber: 'GB-9920192',
    companyAffiliation: 'Sample Travel Media Partner',
    vipTier: 'silver',
    loyaltyPointsBalance: 950,
    lifetimeStaysCount: 2,
    lifetimeSpend: 72000,
    currency: 'ETB',
    preferences: {
      roomLocation: 'high_floor',
      pillowType: 'hypoallergenic',
      dietaryRestrictions: ['Gluten-free'],
      favoriteDrink: 'Fresh Lake Papaya & Mango Smoothie',
      specialNotes: 'Sample VIP guest inspecting resort facilities and spa treatments. Ensure fruit basket & botanical amenities.',
    },
    lastStayDate: '2026-11-06',
    status: 'active',
    satisfactionScore: 5,
    createdAt: '2026-04-10T08:00:00.000Z',
    updatedAt: '2026-11-06T12:00:00.000Z',
  },
  {
    id: 'gst_04',
    hotelId: 'htl_grand_rift',
    guestCode: 'GST-004',
    fullName: 'Dawit Hailemariam',
    email: 'dawit.h@cbe.com.et',
    phone: '+251 93 456 7890',
    nationality: 'Ethiopian',
    idOrPassportNumber: 'NAT-881920',
    companyAffiliation: 'Commercial Bank of Ethiopia',
    vipTier: 'standard',
    loyaltyPointsBalance: 350,
    lifetimeStaysCount: 1,
    lifetimeSpend: 28000,
    currency: 'ETB',
    preferences: {
      roomLocation: 'near_elevator',
      pillowType: 'foam',
      dietaryRestrictions: ['Standard Ethiopian Fasting'],
      favoriteDrink: 'Ambo Mineral Water',
      specialNotes: 'Attending regional financial conference.',
    },
    lastStayDate: '2026-11-01',
    status: 'active',
    satisfactionScore: 4.5,
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-11-01T15:00:00.000Z',
  },
];

const SEED_LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: 'rew_01',
    hotelId: 'htl_grand_rift',
    title: 'Complimentary Lakeview Suite Upgrade',
    category: 'room_upgrade',
    pointsRequired: 750,
    description: 'Upgrade your standard or deluxe booking to an Executive Lakeview Jacuzzi Suite (Subject to availability).',
    isActive: true,
  },
  {
    id: 'rew_02',
    hotelId: 'htl_grand_rift',
    title: '60-Minute Aromatherapy Botanical Spa Massage',
    category: 'spa_treatment',
    pointsRequired: 500,
    description: 'Full-body relaxation massage with wild-harvested Ethiopian flora essential oils.',
    isActive: true,
  },
  {
    id: 'rew_03',
    hotelId: 'htl_grand_rift',
    title: 'Main Dining 3-Course Gourmet Dinner for Two',
    category: 'f_and_b',
    pointsRequired: 400,
    description: 'Chef signature fresh Lake Chamo fish fillet dinner with bottle of Rift Valley Reserve Wine.',
    isActive: true,
  },
  {
    id: 'rew_04',
    hotelId: 'htl_grand_rift',
    title: 'VIP Private Airport Chauffeur Transfer',
    category: 'airport_transfer',
    pointsRequired: 250,
    description: 'One-way luxury private SUV transfer between Arba Minch Airport and Hotel.',
    isActive: true,
  },
  {
    id: 'rew_05',
    hotelId: 'htl_grand_rift',
    title: 'Guaranteed 4:00 PM Late Departure Check-Out',
    category: 'late_checkout',
    pointsRequired: 150,
    description: 'Extend your guestroom use until late afternoon without standard hourly surcharge.',
    isActive: true,
  },
];

const SEED_SPA_TREATMENTS: SpaTreatment[] = [
  {
    id: 'spa_01',
    hotelId: 'htl_grand_rift',
    code: 'SPA-COF-60',
    name: 'Traditional Ethiopian Coffee & Honey Body Polish',
    category: 'body_scrub',
    durationMinutes: 60,
    price: 1400,
    currency: 'ETB',
    therapistCommissionRate: 15,
    description: 'Gentle full-body exfoliation using freshly roasted highland Arabica coffee granules and wild acacia forest honey.',
    isAvailable: true,
  },
  {
    id: 'spa_02',
    hotelId: 'htl_grand_rift',
    code: 'SPA-STN-90',
    name: 'Deep Tissue Tension Relief Thermal Stone Massage',
    category: 'massage',
    durationMinutes: 90,
    price: 2200,
    currency: 'ETB',
    therapistCommissionRate: 18,
    description: 'Heated volcanic basalt stones combined with deep muscular pressure to release chronic tension and fatigue.',
    isAvailable: true,
  },
  {
    id: 'spa_03',
    hotelId: 'htl_grand_rift',
    code: 'SPA-SWED-60',
    name: 'Aromatherapy Swedish Essential Oils Massage',
    category: 'massage',
    durationMinutes: 60,
    price: 1600,
    currency: 'ETB',
    therapistCommissionRate: 15,
    description: 'Light to medium pressure rhythmic strokes with pure lavender, eucalyptus, and rosehip therapeutic oils.',
    isAvailable: true,
  },
  {
    id: 'spa_04',
    hotelId: 'htl_grand_rift',
    code: 'SPA-FAC-45',
    name: 'Hydrating Organic Botanical Facial Rejuvenation',
    category: 'facial',
    durationMinutes: 45,
    price: 1200,
    currency: 'ETB',
    therapistCommissionRate: 12,
    description: 'Deep pore cleansing, botanical serum hydration, and rejuvenating clay mask for glowing, refreshed skin.',
    isAvailable: true,
  },
  {
    id: 'spa_05',
    hotelId: 'htl_grand_rift',
    code: 'SPA-STM-45',
    name: 'Hydrotherapy Mineral Salt Jacuzzi & Herbal Eucalyptus Steam',
    category: 'sauna_thermal',
    durationMinutes: 45,
    price: 850,
    currency: 'ETB',
    therapistCommissionRate: 10,
    description: 'Private immersion whirlpool bath followed by restorative eucalyptus-infused herbal steam chamber.',
    isAvailable: true,
  },
];

const SEED_SPA_APPOINTMENTS: SpaAppointment[] = [
  {
    id: 'appt_01',
    hotelId: 'htl_grand_rift',
    appointmentNumber: 'SPA-2026-041',
    guestId: 'gst_01',
    guestName: 'Dr. Almaz Kebede',
    roomId: 'rm_htl_grand_rift_101',
    roomNumber: '101',
    treatmentId: 'spa_01',
    treatmentName: 'Traditional Ethiopian Coffee & Honey Body Polish',
    durationMinutes: 60,
    therapistName: 'Tigist Assefa (Senior Spa Therapist)',
    treatmentRoom: 'Lotus Sanctuary Suite #1',
    date: '2026-11-06',
    startTime: '16:00',
    endTime: '17:00',
    price: 1400,
    currency: 'ETB',
    status: 'completed',
    chargeToRoomFolio: true,
    paymentStatus: 'charged_to_room',
    notes: 'Guest requested extra honey moisturizer on arms.',
    createdAt: '2026-11-05T14:00:00.000Z',
  },
  {
    id: 'appt_02',
    hotelId: 'htl_grand_rift',
    appointmentNumber: 'SPA-2026-042',
    guestId: 'gst_03',
    guestName: 'Sample Guest A',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    treatmentId: 'spa_03',
    treatmentName: 'Aromatherapy Swedish Essential Oils Massage',
    durationMinutes: 60,
    therapistName: 'Makeda Bekele (Aromatherapist)',
    treatmentRoom: 'Jasmine Wellness Room #2',
    date: '2026-11-07',
    startTime: '15:30',
    endTime: '16:30',
    price: 1600,
    currency: 'ETB',
    status: 'scheduled',
    chargeToRoomFolio: true,
    paymentStatus: 'charged_to_room',
    notes: 'Journalist review booking. Prepared with fresh herbal tea.',
    createdAt: '2026-11-06T11:00:00.000Z',
  },
  {
    id: 'appt_03',
    hotelId: 'htl_grand_rift',
    appointmentNumber: 'SPA-2026-043',
    guestName: 'Marcus Thorne (Walk-in)',
    treatmentId: 'spa_02',
    treatmentName: 'Deep Tissue Tension Relief Thermal Stone Massage',
    durationMinutes: 90,
    therapistName: 'Tigist Assefa (Senior Spa Therapist)',
    treatmentRoom: 'Basalt Hot Stone Suite',
    date: '2026-11-07',
    startTime: '17:30',
    endTime: '19:00',
    price: 2200,
    currency: 'ETB',
    status: 'scheduled',
    chargeToRoomFolio: false,
    paymentStatus: 'paid',
    notes: 'Paid cash at Spa Reception Till.',
    createdAt: '2026-11-06T15:30:00.000Z',
  },
];

const SEED_GUEST_FEEDBACK: GuestFeedback[] = [
  {
    id: 'fb_01',
    hotelId: 'htl_grand_rift',
    guestId: 'gst_01',
    guestName: 'Dr. Almaz Kebede',
    roomNumber: '101',
    stayReference: 'RES-2026-081',
    overallRating: 5,
    cleanlinessRating: 5,
    staffFriendlinessRating: 5,
    foodQualityRating: 5,
    amenitiesRating: 5,
    npsScore: 10,
    comments: 'Exceptional hospitality during our UN summit. The catering and conference AV staff were world-class, and the spa treatment after long sessions was magnificent.',
    status: 'reviewed',
    managementResponse: 'Thank you Dr. Kebede! It was an absolute privilege hosting the UN-ECA summit. We look forward to welcoming you back.',
    date: '2026-11-05',
  },
  {
    id: 'fb_02',
    hotelId: 'htl_grand_rift',
    guestId: 'gst_02',
    guestName: 'Yohannes Girma',
    roomNumber: '204',
    stayReference: 'RES-2026-079',
    overallRating: 5,
    cleanlinessRating: 5,
    staffFriendlinessRating: 5,
    foodQualityRating: 4,
    amenitiesRating: 5,
    npsScore: 9,
    comments: 'The executive boardroom setup was flawless. Fast Wi-Fi and silent air conditioning allowed our leadership team to focus entirely on strategy.',
    status: 'reviewed',
    managementResponse: 'Delighted to hear this Mr. Girma! Ethiopian Airlines leadership is always our top priority.',
    date: '2026-10-29',
  },
  {
    id: 'fb_03',
    hotelId: 'htl_grand_rift',
    guestId: 'gst_03',
    guestName: 'Sample Guest A',
    roomNumber: '201',
    stayReference: 'RES-2026-088',
    overallRating: 5,
    cleanlinessRating: 5,
    staffFriendlinessRating: 5,
    foodQualityRating: 5,
    amenitiesRating: 5,
    npsScore: 10,
    comments: 'The Lake Chamo sunset view from Villa 201 is truly unmatched anywhere in East Africa. The coffee body polish was a highlight of my Ethiopian trip.',
    status: 'new',
    date: '2026-11-06',
  },
  {
    id: 'fb_04',
    hotelId: 'htl_grand_rift',
    guestId: 'gst_04',
    guestName: 'Dawit Hailemariam',
    roomNumber: '108',
    stayReference: 'RES-2026-072',
    overallRating: 4,
    cleanlinessRating: 4,
    staffFriendlinessRating: 5,
    foodQualityRating: 4,
    amenitiesRating: 4,
    npsScore: 8,
    comments: 'Great room comfort and friendly front desk team. Buffet breakfast was delicious, would love earlier gym opening hours starting at 05:30.',
    status: 'resolved',
    managementResponse: 'Thank you Mr. Hailemariam. We have updated fitness center hours to 05:30 AM starting this month based on your feedback!',
    date: '2026-11-02',
  },
];

// Phase 9 Seed Data: Shift Rosters, Time & Attendance, Leave Management & Payroll
const SEED_SHIFT_SCHEDULES: ShiftSchedule[] = [
  {
    id: 'sft_01',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_01',
    employeeName: 'Selamawit Desta',
    departmentId: 'dept_htl_grand_rift_front_desk',
    departmentName: 'Front Office',
    date: '2026-11-07',
    shiftType: 'morning',
    startTime: '07:00',
    endTime: '15:30',
    notes: 'Front desk morning check-out rush lead',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_02',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_02',
    employeeName: 'Meron Tadesse',
    departmentId: 'dept_htl_grand_rift_housekeeping',
    departmentName: 'Housekeeping',
    date: '2026-11-07',
    shiftType: 'morning',
    startTime: '08:00',
    endTime: '16:30',
    notes: '2nd Floor VIP turnaround inspection and linen distribution',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_03',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_03',
    employeeName: 'Berhanu Kebede',
    departmentId: 'dept_htl_grand_rift_kitchen',
    departmentName: 'Kitchen & Production',
    date: '2026-11-07',
    shiftType: 'split',
    startTime: '11:00',
    endTime: '22:00',
    notes: 'Lunch buffet oversight & Banqueting dinner prep',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_04',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_04',
    employeeName: 'Abel Tesfaye',
    departmentId: 'dept_htl_grand_rift_f_and_b',
    departmentName: 'Restaurant & Bar',
    date: '2026-11-07',
    shiftType: 'afternoon',
    startTime: '15:00',
    endTime: '23:30',
    notes: 'Panorama lounge evening service & till balance',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_05',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_05',
    employeeName: 'Tigist Haile',
    departmentId: 'dept_htl_grand_rift_maintenance',
    departmentName: 'Maintenance & Engineering',
    date: '2026-11-07',
    shiftType: 'morning',
    startTime: '08:00',
    endTime: '17:00',
    notes: 'Chiller plant monthly check & generator fuel audit',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_06',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_06',
    employeeName: 'Daniel Alemayehu',
    departmentId: 'dept_htl_grand_rift_security',
    departmentName: 'Security & Safety',
    date: '2026-11-07',
    shiftType: 'night',
    startTime: '23:00',
    endTime: '07:30',
    notes: 'Perimeter patrol & overnight barrier control',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_07',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_07',
    employeeName: 'Tigist Assefa',
    departmentId: 'dept_htl_grand_rift_spa',
    departmentName: 'Spa & Wellness',
    date: '2026-11-07',
    shiftType: 'afternoon',
    startTime: '13:00',
    endTime: '21:00',
    notes: 'Lotus Sanctuary appointments roster',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'sft_08',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_08',
    employeeName: 'Fitsum Gebre',
    departmentId: 'dept_htl_grand_rift_stores',
    departmentName: 'Stores & Stock',
    date: '2026-11-07',
    shiftType: 'morning',
    startTime: '07:30',
    endTime: '16:00',
    notes: 'Inward vegetable supplier GRV inspection and milk receipt',
    status: 'scheduled',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

const SEED_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att_01',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_01',
    employeeName: 'Selamawit Desta',
    departmentName: 'Front Office',
    date: '2026-11-07',
    clockInTime: '06:52',
    totalHours: 4.5,
    overtimeHours: 0,
    status: 'on_time',
    notes: 'Shift currently in progress',
  },
  {
    id: 'att_02',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_02',
    employeeName: 'Meron Tadesse',
    departmentName: 'Housekeeping',
    date: '2026-11-07',
    clockInTime: '07:56',
    totalHours: 3.5,
    overtimeHours: 0,
    status: 'on_time',
    notes: 'Shift currently in progress',
  },
  {
    id: 'att_03',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_05',
    employeeName: 'Tigist Haile',
    departmentName: 'Maintenance & Engineering',
    date: '2026-11-07',
    clockInTime: '08:12',
    totalHours: 3.2,
    overtimeHours: 0,
    status: 'late',
    notes: 'Late arrival due to public transport delay',
  },
  {
    id: 'att_04',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_08',
    employeeName: 'Fitsum Gebre',
    departmentName: 'Stores & Stock',
    date: '2026-11-07',
    clockInTime: '07:28',
    totalHours: 4.0,
    overtimeHours: 0,
    status: 'on_time',
    notes: 'Shift currently in progress',
  },
  {
    id: 'att_05',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_01',
    employeeName: 'Selamawit Desta',
    departmentName: 'Front Office',
    date: '2026-11-06',
    clockInTime: '06:55',
    clockOutTime: '16:00',
    totalHours: 9.0,
    overtimeHours: 0.5,
    status: 'overtime',
    notes: 'Completed 30 mins overtime due to delayed flight arrivals',
  },
  {
    id: 'att_06',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_04',
    employeeName: 'Abel Tesfaye',
    departmentName: 'Restaurant & Bar',
    date: '2026-11-06',
    clockInTime: '14:50',
    clockOutTime: '23:45',
    totalHours: 8.9,
    overtimeHours: 0.25,
    status: 'on_time',
    notes: 'Shift completed with till reconciliation signed off',
  },
];

const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lv_01',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_01',
    employeeName: 'Selamawit Desta',
    departmentName: 'Front Office',
    leaveType: 'annual',
    startDate: '2026-11-15',
    endDate: '2026-11-19',
    daysCount: 5,
    reason: 'Annual family leave scheduled after peak conference week',
    status: 'approved',
    approvedBy: 'General Manager (Solomon Haile)',
    appliedAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-02T14:30:00.000Z',
  },
  {
    id: 'lv_02',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_04',
    employeeName: 'Abel Tesfaye',
    departmentName: 'Restaurant & Bar',
    leaveType: 'sick',
    startDate: '2026-11-03',
    endDate: '2026-11-04',
    daysCount: 2,
    reason: 'Acute dental infection with certified medical note',
    status: 'approved',
    approvedBy: 'F&B Manager (Dawit Tadesse)',
    appliedAt: '2026-11-03T07:15:00.000Z',
    updatedAt: '2026-11-03T08:00:00.000Z',
  },
  {
    id: 'lv_03',
    hotelId: 'htl_grand_rift',
    employeeId: 'emp_gr_08',
    employeeName: 'Fitsum Gebre',
    departmentName: 'Stores & Stock',
    leaveType: 'compassionate',
    startDate: '2026-11-12',
    endDate: '2026-11-14',
    daysCount: 3,
    reason: 'Family bereavement ceremony in Hawassa',
    status: 'pending',
    appliedAt: '2026-11-06T15:20:00.000Z',
    updatedAt: '2026-11-06T15:20:00.000Z',
  },
];

const SEED_PAYROLL_INPUTS = [
  { id: 'pi_01', employeeId: 'emp_gr_01', employeeName: 'Selamawit Desta', departmentName: 'Front Office', designation: 'Front Office Supervisor', baseSalary: 32000, serviceChargeShare: 15000, overtimeHours: 6, overtimePay: 1800, bonuses: 2000 },
  { id: 'pi_02', employeeId: 'emp_gr_02', employeeName: 'Meron Tadesse', departmentName: 'Housekeeping', designation: 'Executive Housekeeper', baseSalary: 28000, serviceChargeShare: 15000, overtimeHours: 4, overtimePay: 1050, bonuses: 1000 },
  { id: 'pi_03', employeeId: 'emp_gr_03', employeeName: 'Berhanu Kebede', departmentName: 'Kitchen & Production', designation: 'Executive Head Chef', baseSalary: 38000, serviceChargeShare: 15000, overtimeHours: 10, overtimePay: 3560, bonuses: 3000 },
  { id: 'pi_04', employeeId: 'emp_gr_04', employeeName: 'Abel Tesfaye', departmentName: 'Restaurant & Bar', designation: 'Senior Bartender & Till Lead', baseSalary: 22000, serviceChargeShare: 15000, overtimeHours: 8, overtimePay: 1650, bonuses: 500 },
  { id: 'pi_05', employeeId: 'emp_gr_05', employeeName: 'Tigist Haile', departmentName: 'Maintenance & Engineering', designation: 'Chief Plant Engineer', baseSalary: 35000, serviceChargeShare: 15000, overtimeHours: 12, overtimePay: 3940, bonuses: 1500 },
  { id: 'pi_06', employeeId: 'emp_gr_06', employeeName: 'Daniel Alemayehu', departmentName: 'Security & Safety', designation: 'Senior Security Officer', baseSalary: 18000, serviceChargeShare: 15000, overtimeHours: 6, overtimePay: 1010, bonuses: 500 },
  { id: 'pi_07', employeeId: 'emp_gr_07', employeeName: 'Tigist Assefa', departmentName: 'Spa & Wellness', designation: 'Senior Spa & Thermal Therapist', baseSalary: 24000, serviceChargeShare: 15000, overtimeHours: 4, overtimePay: 900, bonuses: 2500 },
  { id: 'pi_08', employeeId: 'emp_gr_08', employeeName: 'Fitsum Gebre', departmentName: 'Stores & Stock', designation: 'Head Storekeeper', baseSalary: 20000, serviceChargeShare: 15000, overtimeHours: 5, overtimePay: 940, bonuses: 500 },
];

const SEED_PAYROLL_ITEMS: EmployeePayrollItem[] = SEED_PAYROLL_INPUTS.map((row) => {
  const calc = calculateEthiopianPayrollItem({
    baseSalaryEtb: row.baseSalary,
    serviceChargeShareEtb: row.serviceChargeShare,
    overtimePayEtb: row.overtimePay,
    bonusesEtb: row.bonuses,
  });
  return {
    id: row.id,
    payrollPeriodId: 'pay_oct_2026',
    hotelId: 'htl_grand_rift',
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    departmentName: row.departmentName,
    designation: row.designation,
    baseSalary: calc.baseSalary,
    serviceChargeShare: calc.serviceChargeShare,
    overtimeHours: row.overtimeHours,
    overtimePay: calc.overtimePay,
    bonuses: calc.bonuses,
    grossPay: calc.grossPay,
    pensionEmployee: calc.pensionEmployee,
    pensionEmployer: calc.pensionEmployer,
    incomeTax: calc.incomeTax,
    otherDeductions: calc.otherDeductions,
    netPay: calc.netPay,
    currency: 'ETB',
    status: 'paid',
  };
});

const SEED_PAYROLL_PERIODS: PayrollPeriod[] = [
  {
    id: 'pay_oct_2026',
    hotelId: 'htl_grand_rift',
    periodName: 'October 2026 Sample Payroll',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    totalGrossWages: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.grossPay, 0),
    totalServiceChargePool: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.serviceChargeShare, 0),
    totalTaxDeductions: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.incomeTax, 0),
    totalPensionDeductions: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.pensionEmployee, 0),
    totalNetPay: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.netPay, 0),
    eligibleStaffCount: SEED_PAYROLL_ITEMS.length,
    currency: 'ETB',
    status: 'disbursed',
    approvedBy: 'General Manager (Solomon Haile)',
    approvedAt: '2026-11-01T11:00:00.000Z',
    createdAt: '2026-10-31T18:00:00.000Z',
  },
  {
    id: 'pay_nov_2026',
    hotelId: 'htl_grand_rift',
    periodName: 'November 2026 Projected Payroll (Sample)',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    totalGrossWages: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.grossPay, 0) + 20000,
    totalServiceChargePool: 140000,
    totalTaxDeductions: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.incomeTax, 0) + 7000,
    totalPensionDeductions: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.pensionEmployee, 0),
    totalNetPay: SEED_PAYROLL_ITEMS.reduce((s, i) => s + i.netPay, 0) + 13000,
    eligibleStaffCount: SEED_PAYROLL_ITEMS.length,
    currency: 'ETB',
    status: 'draft',
    createdAt: '2026-11-06T09:00:00.000Z',
  },
];

// Phase 10 Seed Data: BI, Channel Analytics & Compliance Exports
const SEED_EXPORT_JOBS: ExportJob[] = [
  {
    id: 'exp_01',
    hotelId: 'htl_grand_rift',
    reportType: 'daily_revenue_flash',
    title: 'Daily Revenue Flash Audit Report (Nov 06, 2026)',
    format: 'csv',
    fileSizeBytes: 42300,
    recordsCount: 48,
    generatedBy: 'Solomon Haile (General Manager)',
    generatedAt: '2026-11-07T06:30:00.000Z',
    downloadUrl: '#',
  },
  {
    id: 'exp_02',
    hotelId: 'htl_grand_rift',
    reportType: 'vat_service_charge_tax',
    title: 'Monthly 15% VAT & 10% Service Charge Tax Filing Summary',
    format: 'excel',
    fileSizeBytes: 85400,
    recordsCount: 124,
    generatedBy: 'Helen Teshome (Finance Director)',
    generatedAt: '2026-11-01T14:15:00.000Z',
    downloadUrl: '#',
  },
  {
    id: 'exp_03',
    hotelId: 'htl_grand_rift',
    reportType: 'occupancy_statistics',
    title: 'Ministry of Tourism National Lodging Occupancy Statistics (Q3)',
    format: 'csv',
    fileSizeBytes: 61200,
    recordsCount: 92,
    generatedBy: 'Solomon Haile (General Manager)',
    generatedAt: '2026-10-15T09:00:00.000Z',
    downloadUrl: '#',
  },
  {
    id: 'exp_04',
    hotelId: 'htl_grand_rift',
    reportType: 'full_tenant_backup',
    title: 'Complete Hotel Tenant Offline JSON Data Vault Backup',
    format: 'json',
    fileSizeBytes: 412000,
    recordsCount: 840,
    generatedBy: 'System Super Admin',
    generatedAt: '2026-11-05T00:00:00.000Z',
    downloadUrl: '#',
  },
];

const SEED_KPI_TARGETS: KPITargetItem[] = [
  {
    kpiKey: 'occupancy_rate',
    label: 'Monthly Average Occupancy Rate',
    targetValue: 75,
    actualValue: 78.4,
    unit: '%',
    variance: 3.4,
    status: 'exceeded',
  },
  {
    kpiKey: 'adr',
    label: 'Average Daily Rate (ADR)',
    targetValue: 2600,
    actualValue: 2850,
    unit: 'currency',
    variance: 250,
    status: 'exceeded',
  },
  {
    kpiKey: 'revpar',
    label: 'Revenue Per Available Room (RevPAR)',
    targetValue: 1950,
    actualValue: 2234,
    unit: 'currency',
    variance: 284,
    status: 'exceeded',
  },
  {
    kpiKey: 'staff_cost_ratio',
    label: 'Labor Cost to Gross Revenue Ratio',
    targetValue: 22.0,
    actualValue: 20.8,
    unit: '%',
    variance: -1.2,
    status: 'on_track',
  },
  {
    kpiKey: 'gop_margin',
    label: 'Gross Operating Profit (GOP) Margin',
    targetValue: 45.0,
    actualValue: 48.2,
    unit: '%',
    variance: 3.2,
    status: 'exceeded',
  },
  {
    kpiKey: 'direct_booking_ratio',
    label: 'Direct & Walk-in Booking Share',
    targetValue: 55.0,
    actualValue: 58.0,
    unit: '%',
    variance: 3.0,
    status: 'on_track',
  },
];

// Phase 11 Seed Data: Security Incidents, Visitor Gate Passes, Lost & Found & Service Recovery
const SEED_SECURITY_INCIDENTS: SecurityIncident[] = [
  {
    id: 'sec_01',
    hotelId: 'htl_grand_rift',
    incidentNumber: 'SEC-2026-039',
    category: 'noise_disturbance',
    severity: 'low',
    location: '2nd Floor Lakeview Terrace Wing',
    reportedBy: 'Room 205 Guest (Phone Call)',
    investigatingOfficer: 'Daniel Alemayehu (Senior Security Lead)',
    description: 'Report of loud television audio from Room 204 at 23:45. Duty guard attended courteously; occupant apologized and lowered volume immediately.',
    cctvReviewed: true,
    policeNotified: false,
    status: 'resolved',
    resolutionNotes: 'No further disturbance noted during 02:00 and 04:00 night rounds.',
    timestamp: '2026-11-07T23:50:00.000Z',
  },
  {
    id: 'sec_02',
    hotelId: 'htl_grand_rift',
    incidentNumber: 'SEC-2026-040',
    category: 'safe_override',
    severity: 'medium',
    location: 'Presidential Suite 301',
    reportedBy: 'Dr. Almaz Kebede (VIP Guest)',
    investigatingOfficer: 'Daniel Alemayehu (with Duty Manager)',
    description: 'In-room digital safe keypad battery died with personal diplomatic credentials inside. Safe opened using dual-key master bypass in the presence of guest.',
    cctvReviewed: false,
    policeNotified: false,
    status: 'resolved',
    resolutionNotes: 'Safe unit batteries replaced with new Duracell 9V. Guest confirmed all belongings intact.',
    timestamp: '2026-11-06T15:20:00.000Z',
  },
  {
    id: 'sec_03',
    hotelId: 'htl_grand_rift',
    incidentNumber: 'SEC-2026-041',
    category: 'unauthorized_entry',
    severity: 'medium',
    location: 'Southern Perimeter Lakeshore Gate',
    reportedBy: 'Perimeter Guard Post #2',
    investigatingOfficer: 'Daniel Alemayehu (Senior Security Lead)',
    description: 'Individual attempting to access hotel private lakeshore gardens from adjacent public trail. Turned away politely by security officer.',
    cctvReviewed: true,
    policeNotified: false,
    status: 'resolved',
    resolutionNotes: 'Perimeter infrared sensor re-calibrated; fence signage refreshed.',
    timestamp: '2026-11-05T19:30:00.000Z',
  },
];

const SEED_VISITOR_PASSES: VisitorGatePass[] = [
  {
    id: 'gp_01',
    hotelId: 'htl_grand_rift',
    passNumber: 'GP-2026-104',
    visitorName: 'Tadesse Mengistu (Highland Farms)',
    visitorPhone: '+251 91 223 8899',
    visitorType: 'vendor_supplier',
    visitingRoomOrDept: 'Main Kitchen Cold Storage',
    vehiclePlate: 'AA 3-A44910',
    vehicleModel: 'Isuzu NPR Refrigerated Truck',
    badgeNumber: 'VENDOR-03',
    entryTime: '07:15',
    exitTime: '08:45',
    date: '2026-11-07',
    status: 'cleared',
    authorizedBy: 'Berhanu Kebede (Head Chef)',
  },
  {
    id: 'gp_02',
    hotelId: 'htl_grand_rift',
    passNumber: 'GP-2026-105',
    visitorName: 'Alemayehu Wolde (UN Protocol Liaison)',
    visitorPhone: '+251 92 445 7711',
    visitorType: 'official',
    visitingRoomOrDept: 'Presidential Suite 301',
    vehiclePlate: 'CD 12-088',
    vehicleModel: 'Toyota Land Cruiser V8 Black',
    badgeNumber: 'OFFICIAL-01',
    entryTime: '09:30',
    date: '2026-11-08',
    status: 'active',
    authorizedBy: 'Front Desk Duty Manager',
  },
  {
    id: 'gp_03',
    hotelId: 'htl_grand_rift',
    passNumber: 'GP-2026-106',
    visitorName: 'Engineer Kibreab Zewde (Daikin HVAC)',
    visitorPhone: '+251 93 112 0044',
    visitorType: 'contractor',
    visitingRoomOrDept: 'Central Rooftop Chiller Plant',
    vehiclePlate: 'AA 2-C99812',
    vehicleModel: 'Toyota Hilux Double Cab',
    badgeNumber: 'CONTRACTOR-05',
    entryTime: '10:00',
    date: '2026-11-08',
    status: 'active',
    authorizedBy: 'Tigist Haile (Chief Engineer)',
  },
];

const SEED_LOST_AND_FOUND: LostAndFoundItem[] = [
  {
    id: 'lf_01',
    hotelId: 'htl_grand_rift',
    itemNumber: 'LF-2026-081',
    category: 'jewelry',
    itemName: 'Gold Rolex Oyster Perpetual Wristwatch',
    description: 'Men gold wrist watch with champagne dial and jubilee bracelet. In pristine condition.',
    foundLocation: 'Room 201 Master Bedroom bedside drawer',
    foundBy: 'Meron Tadesse (Executive Housekeeper)',
    foundDate: '2026-11-06',
    storageLocker: 'Security Master Safe Vault Box #1',
    status: 'in_safekeeping',
    guestIdOrPhone: 'Sample Guest A (+251 93 556 7788)',
  },
  {
    id: 'lf_02',
    hotelId: 'htl_grand_rift',
    itemNumber: 'LF-2026-082',
    category: 'documents_passport',
    itemName: 'Diplomatic Passport & ID Pouch',
    description: 'Black leather passport case with UN Diplomatic laissez-passer credentials.',
    foundLocation: 'Lobby Lounge Executive Seating',
    foundBy: 'Selamawit Desta (Front Desk Supervisor)',
    foundDate: '2026-11-05',
    storageLocker: 'Front Office Safe #2',
    status: 'claimed',
    claimedBy: 'Dr. Almaz Kebede (ID checked on pickup)',
    claimedDate: '2026-11-05T18:00:00.000Z',
    claimNotes: 'Returned to guest within 2 hours of discovery with formal receipt signed.',
  },
  {
    id: 'lf_03',
    hotelId: 'htl_grand_rift',
    itemNumber: 'LF-2026-083',
    category: 'clothing',
    itemName: 'Ray-Ban Aviator Polarized Sunglasses',
    description: 'Gold metal frame sunglasses with green G-15 lenses in brown leather case.',
    foundLocation: 'Lakeview Infinity Pool Deck Sunlounger #14',
    foundBy: 'Pool Attendant Abel',
    foundDate: '2026-11-07',
    storageLocker: 'Security Safe Locker #3',
    status: 'in_safekeeping',
  },
  {
    id: 'lf_04',
    hotelId: 'htl_grand_rift',
    itemNumber: 'LF-2026-084',
    category: 'electronics',
    itemName: 'Apple 96W USB-C MacBook Pro Power Adapter',
    description: 'White USB-C charging brick with 2-meter braided cable.',
    foundLocation: 'Grand Abaya Ballroom Stage AV Table',
    foundBy: 'Banqueting Setup Crew',
    foundDate: '2026-11-04',
    storageLocker: 'Security Safe Locker #4',
    status: 'in_safekeeping',
  },
];

const SEED_GUEST_COMPLAINTS: GuestComplaintTicket[] = [
  {
    id: 'sr_01',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'SR-2026-042',
    guestId: 'gst_02',
    guestName: 'Yohannes Girma',
    roomNumber: '204',
    category: 'room_comfort',
    priority: 'urgent',
    departmentAttribution: 'Maintenance & Engineering',
    description: 'Thermostat in Room 204 showing room temperature at 26°C despite setting at 19°C.',
    slaMinutes: 30,
    timeElapsedMinutes: 18,
    status: 'resolved',
    assignedTo: 'Tigist Haile (Chief Engineer)',
    compensationOffered: {
      type: 'complimentary_meal',
      detail: 'Complimentary Panorama Sunset Dinner Cocktail & Dessert',
      value: 650,
    },
    resolutionNotes: 'Air handler valve actuator reset; temperature lowered to 19.5°C within 18 minutes. Guest thanked technician personally.',
    guestSatisfied: true,
    createdAt: '2026-11-07T14:10:00.000Z',
    resolvedAt: '2026-11-07T14:28:00.000Z',
  },
  {
    id: 'sr_02',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'SR-2026-043',
    guestName: 'Marcus Thorne',
    roomNumber: '106',
    category: 'food_beverage',
    priority: 'high',
    departmentAttribution: 'Kitchen & Production',
    description: 'Room service dinner delivery delayed by 35 minutes past estimated 30-minute window.',
    slaMinutes: 30,
    timeElapsedMinutes: 14,
    status: 'resolved',
    assignedTo: 'Berhanu Kebede (Head Chef)',
    compensationOffered: {
      type: 'loyalty_points',
      detail: 'Awarded 500 Goodwill Loyalty Points + Waived room service tray fee',
      value: 500,
    },
    resolutionNotes: 'Chef personally visited room with hot meal and fresh fruit platter. Charge waived.',
    guestSatisfied: true,
    createdAt: '2026-11-06T20:15:00.000Z',
    resolvedAt: '2026-11-06T20:29:00.000Z',
  },
  {
    id: 'sr_03',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'SR-2026-044',
    guestName: 'Dr. Almaz Kebede',
    roomNumber: '301',
    category: 'wifi_amenity',
    priority: 'medium',
    departmentAttribution: 'Engineering & IT',
    description: 'Occasional packet drop on terrace workstation during Zoom diplomatic meeting.',
    slaMinutes: 60,
    timeElapsedMinutes: 25,
    status: 'investigating',
    assignedTo: 'IT Network Officer',
    createdAt: '2026-11-08T02:30:00.000Z',
    guestSatisfied: false,
  },
];

// Phase 12 Seed Data: Fleet Vehicles, Airport Transfers & Excursion Safaris
const SEED_FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'veh_01',
    hotelId: 'htl_grand_rift',
    vehicleCode: 'FLT-VAN-01',
    makeModel: 'Toyota Coaster 22-Seater Executive Coach',
    licensePlate: 'ET-AA-3-99120',
    vehicleType: 'shuttle_van',
    passengerCapacity: 22,
    assignedDriverId: 'emp_drv_01',
    assignedDriverName: 'Dawit Kebede (Senior Fleet Driver)',
    currentOdometerKm: 48250,
    fuelLevelPercent: 85,
    status: 'available',
    lastServicedDate: '2026-10-20',
    notes: 'Primary airport shuttle for scheduled flight arrivals from Addis Ababa Bole (AMH). Air-conditioned.',
  },
  {
    id: 'veh_02',
    hotelId: 'htl_grand_rift',
    vehicleCode: 'FLT-SUV-01',
    makeModel: 'Toyota Land Cruiser 4x4 Prado (V6 Chauffeur)',
    licensePlate: 'ET-AA-3-44182',
    vehicleType: 'luxury_suv',
    passengerCapacity: 6,
    assignedDriverId: 'emp_drv_02',
    assignedDriverName: 'Tamrat Bekele (VIP Chauffeur)',
    currentOdometerKm: 31200,
    fuelLevelPercent: 90,
    status: 'on_trip',
    lastServicedDate: '2026-10-28',
    notes: 'Diplomatic and presidential VIP chauffeur unit. Leather interior with chilled minibar cooler.',
  },
  {
    id: 'veh_03',
    hotelId: 'htl_grand_rift',
    vehicleCode: 'FLT-CRU-01',
    makeModel: 'Custom Safari Game Cruiser 4x4 (Pop-Up Roof)',
    licensePlate: 'ET-AA-3-88219',
    vehicleType: 'safari_cruiser',
    passengerCapacity: 8,
    assignedDriverId: 'emp_drv_03',
    assignedDriverName: 'Mulugeta Haile (Safari Field Guide & Driver)',
    currentOdometerKm: 62400,
    fuelLevelPercent: 70,
    status: 'reserved',
    lastServicedDate: '2026-10-15',
    notes: 'Fitted with heavy-duty suspension, dual spare tires, binoculars, and charging sockets for photographic safaris.',
  },
  {
    id: 'veh_04',
    hotelId: 'htl_grand_rift',
    vehicleCode: 'FLT-BOAT-01',
    makeModel: 'Yamaha 12-Passenger Twin-Engine Safari Cruiser Boat',
    licensePlate: 'CHAMO-NAV-04',
    vehicleType: 'safari_boat',
    passengerCapacity: 12,
    assignedDriverId: 'emp_drv_04',
    assignedDriverName: 'Captain Berhanu Tsegaye (Certified Marine Skipper)',
    currentOdometerKm: 1420,
    fuelLevelPercent: 95,
    status: 'available',
    lastServicedDate: '2026-11-01',
    notes: 'Moored at private hotel lakeside jetty. Full life jackets, sunshade canopy, and navigation sonar.',
  },
];

const SEED_AIRPORT_TRANSFERS: AirportTransferBooking[] = [
  {
    id: 'trf_01',
    hotelId: 'htl_grand_rift',
    bookingNumber: 'TRF-2026-081',
    guestId: 'gst_01',
    guestName: 'Dr. Almaz Kebede',
    roomId: 'rm_htl_grand_rift_101',
    roomNumber: '101',
    transferType: 'airport_pickup',
    flightNumber: 'ET 135',
    flightAirline: 'Ethiopian Airlines',
    pickupLocation: 'Arba Minch Airport (AMH) Terminal 1',
    dropoffLocation: 'Sample Property A VIP Pavilion',
    scheduledDateTime: '2026-11-08T14:30:00Z',
    passengerCount: 2,
    luggagePieces: 3,
    assignedVehicleId: 'veh_02',
    assignedVehiclePlate: 'ET-AA-3-44182',
    assignedDriverName: 'Tamrat Bekele',
    rate: 0,
    currency: 'ETB',
    isComplimentaryVIP: true,
    chargeToFolio: false,
    status: 'driver_dispatched',
    notes: 'VIP name signboard at arrival gate. Chilled mineral water and cold eucalyptus towels prepared.',
    createdAt: '2026-11-07T09:00:00.000Z',
  },
  {
    id: 'trf_02',
    hotelId: 'htl_grand_rift',
    bookingNumber: 'TRF-2026-082',
    guestId: 'gst_02',
    guestName: 'Yohannes Girma',
    roomId: 'rm_htl_grand_rift_204',
    roomNumber: '204',
    transferType: 'airport_dropoff',
    flightNumber: 'ET 136',
    flightAirline: 'Ethiopian Airlines',
    pickupLocation: 'Sample Property A Front Porch',
    dropoffLocation: 'Arba Minch Airport (AMH) Departure Gate',
    scheduledDateTime: '2026-11-08T16:00:00Z',
    passengerCount: 1,
    luggagePieces: 2,
    assignedVehicleId: 'veh_01',
    assignedVehiclePlate: 'ET-AA-3-99120',
    assignedDriverName: 'Dawit Kebede',
    rate: 850,
    currency: 'ETB',
    isComplimentaryVIP: false,
    chargeToFolio: true,
    status: 'scheduled',
    notes: 'Express flight departure. Direct folio room charge.',
    createdAt: '2026-11-07T14:30:00.000Z',
  },
  {
    id: 'trf_03',
    hotelId: 'htl_grand_rift',
    bookingNumber: 'TRF-2026-083',
    guestId: 'gst_03',
    guestName: 'Sample Guest A',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    transferType: 'vip_chauffeur',
    flightNumber: 'Charter C208',
    flightAirline: 'National Airways Charter',
    pickupLocation: 'Arba Minch Airstrip Apron',
    dropoffLocation: 'Sample Property A Executive Villa 201',
    scheduledDateTime: '2026-11-07T11:00:00Z',
    passengerCount: 2,
    luggagePieces: 4,
    assignedVehicleId: 'veh_02',
    assignedVehiclePlate: 'ET-AA-3-44182',
    assignedDriverName: 'Tamrat Bekele',
    rate: 1200,
    currency: 'ETB',
    isComplimentaryVIP: true,
    chargeToFolio: false,
    status: 'completed',
    notes: 'Condé Nast journalist private arrival. Escorted by GM.',
    createdAt: '2026-11-06T10:00:00.000Z',
  },
];

const SEED_EXCURSION_ACTIVITIES: ExcursionActivity[] = [
  {
    id: 'exc_01',
    hotelId: 'htl_grand_rift',
    code: 'EXC-CHAMO-01',
    title: 'Lake Chamo Giant Crocodile & Hippo Boat Safari',
    category: 'boat_safari',
    durationHours: 3.5,
    pricePerPerson: 1800,
    currency: 'ETB',
    maxParticipants: 12,
    includesParkPermit: true,
    parkPermitFee: 350,
    description: 'Scenic morning or sunset cruise along Lake Chamo exploring Africa largest Nile crocodile colony and hippo pods.',
    itinerarySummary: 'Hotel pier departure -> Crocodile market -> Pelican island bird sanctuary -> Refreshment stop -> Return pier.',
    isActive: true,
  },
  {
    id: 'exc_02',
    hotelId: 'htl_grand_rift',
    code: 'EXC-NECH-02',
    title: 'Nechisar National Park Plains Game Drive 4x4 Safari',
    category: 'game_drive',
    durationHours: 5.0,
    pricePerPerson: 2600,
    currency: 'ETB',
    maxParticipants: 6,
    includesParkPermit: true,
    parkPermitFee: 500,
    description: 'Expedition through the savanna plains encountering Burchell zebras, Swayne hartebeests, and gazelles.',
    itinerarySummary: 'Hotel 4x4 departure -> Park Gate permit check -> Nechisar savanna plains -> Ridge picnic -> Return.',
    isActive: true,
  },
  {
    id: 'exc_03',
    hotelId: 'htl_grand_rift',
    code: 'EXC-DORZ-03',
    title: 'Dorze High-Altitude Bamboo Weaving Village Cultural Tour',
    category: 'cultural_heritage',
    durationHours: 4.0,
    pricePerPerson: 1500,
    currency: 'ETB',
    maxParticipants: 14,
    includesParkPermit: false,
    parkPermitFee: 0,
    description: 'Ascend the Guge Mountain range to 2,600m to visit Dorze beehive bamboo architects and taste fresh Kocho bread.',
    itinerarySummary: 'Scenic mountain drive -> Traditional Dorze compound -> Enset harvesting demo -> Honey wine tasting -> Return.',
    isActive: true,
  },
  {
    id: 'exc_04',
    hotelId: 'htl_grand_rift',
    code: 'EXC-SPR-04',
    title: 'Arba Minch Forty Springs Ground Water Forest Trek',
    category: 'trekking_nature',
    durationHours: 2.5,
    pricePerPerson: 950,
    currency: 'ETB',
    maxParticipants: 15,
    includesParkPermit: false,
    parkPermitFee: 0,
    description: 'Guided shaded walk through the lush subterranean spring-fed canopy from which Arba Minch takes its name.',
    itinerarySummary: 'Trailhead departure -> Natural spring crystal headwaters -> Canopy monkey spotting -> Forest stream bridge -> Return.',
    isActive: true,
  },
];

const SEED_EXCURSION_BOOKINGS: ExcursionBooking[] = [
  {
    id: 'bk_exc_01',
    hotelId: 'htl_grand_rift',
    bookingRef: 'EXC-2026-041',
    activityId: 'exc_01',
    activityTitle: 'Lake Chamo Giant Crocodile & Hippo Boat Safari',
    guestId: 'gst_01',
    guestName: 'Dr. Almaz Kebede',
    roomId: 'rm_htl_grand_rift_101',
    roomNumber: '101',
    tourDate: '2026-11-09',
    tourTime: '08:30',
    participantsCount: 2,
    licensedGuideName: 'Solomon Tadesse (Senior Naturalist)',
    assignedVehiclePlate: 'CHAMO-NAV-04',
    kitchenPicnicBoxesRequested: 2,
    ratePerPerson: 1800,
    parkPermitsTotal: 700,
    totalPrice: 4300,
    currency: 'ETB',
    chargeToFolio: true,
    paymentStatus: 'charged_to_room',
    status: 'confirmed',
    notes: 'VIP excursion. Kitchen fruit and mineral water hampers required.',
    createdAt: '2026-11-06T15:00:00.000Z',
  },
  {
    id: 'bk_exc_02',
    hotelId: 'htl_grand_rift',
    bookingRef: 'EXC-2026-042',
    activityId: 'exc_03',
    activityTitle: 'Dorze High-Altitude Bamboo Weaving Village Cultural Tour',
    guestId: 'gst_03',
    guestName: 'Sample Guest A',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    tourDate: '2026-11-08',
    tourTime: '13:30',
    participantsCount: 2,
    licensedGuideName: 'Makeda Hailu (Dorze Cultural Specialist)',
    assignedVehiclePlate: 'ET-AA-3-44182',
    kitchenPicnicBoxesRequested: 0,
    ratePerPerson: 1500,
    parkPermitsTotal: 0,
    totalPrice: 3000,
    currency: 'ETB',
    chargeToFolio: true,
    paymentStatus: 'charged_to_room',
    status: 'departed',
    notes: 'Sample cultural tour booking.',
    createdAt: '2026-11-07T11:00:00.000Z',
  },
  {
    id: 'bk_exc_03',
    hotelId: 'htl_grand_rift',
    bookingRef: 'EXC-2026-043',
    activityId: 'exc_02',
    activityTitle: 'Nechisar National Park Plains Game Drive 4x4 Safari',
    guestName: 'Tour Operator A Group (Leader: Mark Henderson)',
    tourDate: '2026-11-10',
    tourTime: '06:30',
    participantsCount: 6,
    licensedGuideName: 'Abebe Worku (Wildlife Ranger)',
    assignedVehiclePlate: 'ET-AA-3-88219',
    kitchenPicnicBoxesRequested: 6,
    ratePerPerson: 2600,
    parkPermitsTotal: 3000,
    totalPrice: 18600,
    currency: 'ETB',
    chargeToFolio: false,
    paymentStatus: 'billed_to_agency',
    tourOperatorAgency: 'Tour Operator A',
    status: 'confirmed',
    notes: 'Early 06:00 breakfast box dispatch from hot kitchen.',
    createdAt: '2026-11-05T12:00:00.000Z',
  },
];

// Phase 13 Seed Data: Sustainability, Utilities & Food Waste Tracker
const SEED_UTILITY_LOGS: UtilityConsumptionLog[] = [
  {
    id: 'utl_01',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    utilityType: 'electricity',
    source: 'grid_power',
    meterReadingStart: 104200,
    meterReadingEnd: 104680,
    consumptionUnits: 480,
    unitOfMeasure: 'kWh',
    unitCost: 4.8,
    totalCost: 2304,
    currency: 'ETB',
    occupiedRoomsCount: 48,
    costPerOccupiedRoom: 48.0,
    loggedBy: 'Eng. Worku Tsegaye (Chief Engineer)',
    notes: 'Main Ethiopian Electric Power (EEP) grid supply. Stable voltage throughout day.',
    createdAt: '2026-11-07T23:30:00.000Z',
  },
  {
    id: 'utl_02',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    utilityType: 'generator_diesel',
    source: 'diesel_generator',
    meterReadingStart: 820,
    meterReadingEnd: 940,
    consumptionUnits: 120,
    unitOfMeasure: 'litre',
    unitCost: 82,
    totalCost: 9840,
    currency: 'ETB',
    occupiedRoomsCount: 48,
    costPerOccupiedRoom: 205.0,
    loggedBy: 'Eng. Worku Tsegaye (Chief Engineer)',
    notes: '2.5-hour emergency backup operation during afternoon regional grid maintenance window.',
    createdAt: '2026-11-07T16:30:00.000Z',
  },
  {
    id: 'utl_03',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    utilityType: 'solar_generation',
    source: 'solar_photovoltaic',
    meterReadingStart: 31200,
    meterReadingEnd: 31440,
    consumptionUnits: 240,
    unitOfMeasure: 'kWh',
    unitCost: 0,
    totalCost: 0,
    currency: 'ETB',
    occupiedRoomsCount: 48,
    costPerOccupiedRoom: 0,
    loggedBy: 'Senior Maintenance Electrician',
    notes: 'Rooftop 50kW solar PV array generated clean power, offsetting grid consumption and hot water boilers.',
    createdAt: '2026-11-07T18:00:00.000Z',
  },
  {
    id: 'utl_04',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    utilityType: 'water',
    source: 'spring_water',
    meterReadingStart: 4210,
    meterReadingEnd: 4248,
    consumptionUnits: 38,
    unitOfMeasure: 'm3',
    unitCost: 35,
    totalCost: 1330,
    currency: 'ETB',
    occupiedRoomsCount: 48,
    costPerOccupiedRoom: 27.7,
    loggedBy: 'Plumbing Supervisor',
    notes: 'Gravity-fed natural spring water from Forty Springs reserve. Treated through UV sand filtration.',
    createdAt: '2026-11-07T23:45:00.000Z',
  },
];

const SEED_FOOD_WASTE_LOGS: FoodWasteLog[] = [
  {
    id: 'fw_01',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    mealSession: 'breakfast',
    kitchenOutletName: 'Abaya View Restaurant Kitchen',
    category: 'buffet_surplus',
    weightKg: 8.5,
    estimatedCostValue: 1450,
    currency: 'ETB',
    destination: 'livestock_feed',
    chefSupervisor: 'Chef Solomon Mulugeta (Executive Chef)',
    actionTakenNotes: 'Donated surplus pastries & boiled eggs to local community dairy cooperative under safe hygiene protocol.',
    createdAt: '2026-11-07T11:00:00.000Z',
  },
  {
    id: 'fw_02',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    mealSession: 'lunch',
    kitchenOutletName: 'Hot Production Kitchen',
    category: 'prep_trimming',
    weightKg: 14.2,
    estimatedCostValue: 680,
    currency: 'ETB',
    destination: 'composting_garden',
    chefSupervisor: 'Berhanu Kebede (Sous Chef)',
    actionTakenNotes: 'Vegetable peels and cabbage trimmings deposited into organic herb garden compost tumbler.',
    createdAt: '2026-11-07T15:30:00.000Z',
  },
  {
    id: 'fw_03',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    mealSession: 'dinner',
    kitchenOutletName: 'Banqueting Prep Kitchen',
    category: 'plate_waste',
    weightKg: 11.0,
    estimatedCostValue: 2200,
    currency: 'ETB',
    destination: 'biogas_digester',
    chefSupervisor: 'Chef Solomon Mulugeta (Executive Chef)',
    actionTakenNotes: 'UN summit buffet dinner scraped plates fed into anaerobic biogas digester producing cooking gas.',
    createdAt: '2026-11-07T22:30:00.000Z',
  },
  {
    id: 'fw_04',
    hotelId: 'htl_grand_rift',
    logDate: '2026-11-07',
    mealSession: 'dinner',
    kitchenOutletName: 'Pastry & Bakery Unit',
    category: 'spoilage_expired',
    weightKg: 3.0,
    estimatedCostValue: 750,
    currency: 'ETB',
    destination: 'composting_garden',
    chefSupervisor: 'Head Pastry Chef',
    actionTakenNotes: 'Excess yeast dough from earlier batch. Re-calibrated daily dinner roll bake count by -15%.',
    createdAt: '2026-11-07T23:00:00.000Z',
  },
];

const SEED_ECO_GUEST_OPT_INS: EcoGuestOptIn[] = [
  {
    id: 'opt_01',
    hotelId: 'htl_grand_rift',
    roomId: 'rm_htl_grand_rift_201',
    roomNumber: '201',
    guestName: 'Sample Guest A',
    stayStartDate: '2026-11-06',
    stayEndDate: '2026-11-10',
    linenReuseFrequencyDays: 3,
    towelReuseAgreed: true,
    waterSavedEstLitres: 120,
    powerSavedEstKwh: 14,
    loyaltyEcoPointsAwarded: 300,
    optInDate: '2026-11-06T14:00:00.000Z',
  },
  {
    id: 'opt_02',
    hotelId: 'htl_grand_rift',
    roomId: 'rm_htl_grand_rift_101',
    roomNumber: '101',
    guestName: 'Dr. Almaz Kebede',
    stayStartDate: '2026-11-05',
    stayEndDate: '2026-11-09',
    linenReuseFrequencyDays: 2,
    towelReuseAgreed: true,
    waterSavedEstLitres: 90,
    powerSavedEstKwh: 10,
    loyaltyEcoPointsAwarded: 200,
    optInDate: '2026-11-05T12:00:00.000Z',
  },
  {
    id: 'opt_03',
    hotelId: 'htl_grand_rift',
    roomId: 'rm_htl_grand_rift_302',
    roomNumber: '302',
    guestName: 'Dawit Hailemariam',
    stayStartDate: '2026-11-07',
    stayEndDate: '2026-11-11',
    linenReuseFrequencyDays: 2,
    towelReuseAgreed: true,
    waterSavedEstLitres: 60,
    powerSavedEstKwh: 8,
    loyaltyEcoPointsAwarded: 150,
    optInDate: '2026-11-07T09:00:00.000Z',
  },
];

const SEED_SUSTAINABILITY_AUDITS: SustainabilityAuditItem[] = [
  {
    id: 'aud_01',
    hotelId: 'htl_grand_rift',
    auditStandard: 'green_key_intl',
    category: 'energy_efficiency',
    criterion: '100% LED Low-Energy Lighting Conversion Across All Guest Rooms and Public Corridors',
    targetMetric: '100% LED Luminaires',
    currentScorePercent: 98,
    complianceStatus: 'compliant',
    verifiedBy: 'Eco-Audit Officer',
    lastAuditedDate: '2026-10-15',
    evidenceNotes: 'All villas, hallways, and kitchen luminaires retrofitted with warm 3000K LED bulbs.',
  },
  {
    id: 'aud_02',
    hotelId: 'htl_grand_rift',
    auditStandard: 'eco_ethiopia_resort',
    category: 'waste_plastic_zero',
    criterion: 'Zero Single-Use Plastic Water Bottles in Rooms with In-House UV Glass Bottling Plant',
    targetMetric: '100% Glass / 0 PET Plastic',
    currentScorePercent: 100,
    complianceStatus: 'compliant',
    verifiedBy: 'Kibreab Wolde (GM)',
    lastAuditedDate: '2026-10-25',
    evidenceNotes: 'Sterilized glass water carafes refilled daily from Forty Springs pure water station.',
  },
  {
    id: 'aud_03',
    hotelId: 'htl_grand_rift',
    auditStandard: 'iso_14001',
    category: 'local_organic_procurement',
    criterion: 'Local Organic Produce Sourcing from Farmers Within 50km Rift Valley Radius',
    targetMetric: '> 70% Food Sourcing Local',
    currentScorePercent: 76,
    complianceStatus: 'compliant',
    verifiedBy: 'Executive Chef Solomon Mulugeta',
    lastAuditedDate: '2026-11-01',
    evidenceNotes: 'Fresh Lake Chamo tilapia, Dorze highland potatoes, and Chencha apples sourced direct.',
  },
  {
    id: 'aud_04',
    hotelId: 'htl_grand_rift',
    auditStandard: 'green_key_intl',
    category: 'water_conservation',
    criterion: 'Greywater Bio-Filtration System for Resort Landscape & Lawn Irrigation',
    targetMetric: '80% Irrigation Recycled',
    currentScorePercent: 85,
    complianceStatus: 'compliant',
    verifiedBy: 'Eng. Worku Tsegaye',
    lastAuditedDate: '2026-10-30',
    evidenceNotes: 'Laundry and shower runoff treated through reed-bed bio-filter for botanical garden irrigation.',
  },
];

// Phase 14 Seed Data: CRS, Channel Manager & Dynamic Yield Rules
const SEED_CHANNEL_CONNECTIONS: ChannelConnection[] = [
  {
    id: 'chn_01',
    hotelId: 'htl_grand_rift',
    channelCode: 'hotel_direct',
    channelName: 'Brand Website Direct Engine (SEAM Direct)',
    channelType: 'direct_web',
    status: 'connected',
    commissionPercent: 0,
    lastSyncTimestamp: '2026-11-08T11:15:00.000Z',
    activeReservationsCount: 42,
    monthlyRevenueETB: 920000,
    twoWaySyncEnabled: true,
    inventoryPushEnabled: true,
    ratesPushEnabled: true,
    channelManagerNotes: 'Zero commission direct channel with best rate guarantee and instant payment gateway.',
  },
  {
    id: 'chn_02',
    hotelId: 'htl_grand_rift',
    channelCode: 'booking_com',
    channelName: 'OTA Channel A (Two-Way XML)',
    channelType: 'ota',
    status: 'connected',
    commissionPercent: 18,
    lastSyncTimestamp: '2026-11-08T11:12:00.000Z',
    activeReservationsCount: 24,
    monthlyRevenueETB: 485000,
    twoWaySyncEnabled: true,
    inventoryPushEnabled: true,
    ratesPushEnabled: true,
    channelManagerNotes: 'Preferred Partner sample feed. Member discounts mapped to Derived Rates.',
  },
  {
    id: 'chn_03',
    hotelId: 'htl_grand_rift',
    channelCode: 'expedia',
    channelName: 'OTA Channel B (Partner API)',
    channelType: 'ota',
    status: 'connected',
    commissionPercent: 19,
    lastSyncTimestamp: '2026-11-08T11:10:00.000Z',
    activeReservationsCount: 16,
    monthlyRevenueETB: 340000,
    twoWaySyncEnabled: true,
    inventoryPushEnabled: true,
    ratesPushEnabled: true,
    channelManagerNotes: 'Sample distribution across OTA Channel B and affiliated partner network.',
  },
  {
    id: 'chn_04',
    hotelId: 'htl_grand_rift',
    channelCode: 'agoda',
    channelName: 'OTA Channel C (Global Connect)',
    channelType: 'ota',
    status: 'connected',
    commissionPercent: 15,
    lastSyncTimestamp: '2026-11-08T11:08:00.000Z',
    activeReservationsCount: 11,
    monthlyRevenueETB: 215000,
    twoWaySyncEnabled: true,
    inventoryPushEnabled: true,
    ratesPushEnabled: true,
    channelManagerNotes: 'Sample international leisure and business traveler distribution feed.',
  },
  {
    id: 'chn_05',
    hotelId: 'htl_grand_rift',
    channelCode: 'gds_sabre',
    channelName: 'GDS Corporate Network (Sample)',
    channelType: 'gds',
    status: 'connected',
    commissionPercent: 10,
    lastSyncTimestamp: '2026-11-08T10:45:00.000Z',
    activeReservationsCount: 8,
    monthlyRevenueETB: 280000,
    twoWaySyncEnabled: true,
    inventoryPushEnabled: true,
    ratesPushEnabled: true,
    channelManagerNotes: 'Sample GDS feed for international corporate travel managers and IATA travel agents.',
  },
];

const SEED_RATE_PARITY_CHECKS: RateParityCheck[] = [
  {
    id: 'par_01',
    hotelId: 'htl_grand_rift',
    roomTypeId: 'rt_01',
    roomTypeName: 'Deluxe Lake View Room',
    targetDate: '2026-11-08',
    directWebRate: 4200,
    bookingComRate: 4200,
    expediaRate: 4200,
    agodaRate: 4050,
    currency: 'ETB',
    parityStatus: 'ota_undercut',
    varianceAmount: 150,
    lastCheckedAt: '2026-11-08T10:30:00.000Z',
    recommendedAction: 'OTA Channel C is applying unapproved 150 ETB promo subsidy. Contact market manager or restrict B2B feed.',
  },
  {
    id: 'par_02',
    hotelId: 'htl_grand_rift',
    roomTypeId: 'rt_02',
    roomTypeName: 'Executive Rift Jacuzzi Suite',
    targetDate: '2026-11-08',
    directWebRate: 7500,
    bookingComRate: 7500,
    expediaRate: 7800,
    agodaRate: 7500,
    currency: 'ETB',
    parityStatus: 'in_parity',
    varianceAmount: 0,
    lastCheckedAt: '2026-11-08T10:30:00.000Z',
    recommendedAction: 'Perfect rate parity maintained across all connected channel distribution partners.',
  },
  {
    id: 'par_03',
    hotelId: 'htl_grand_rift',
    roomTypeId: 'rt_03',
    roomTypeName: 'Presidential Royal Villa',
    targetDate: '2026-11-08',
    directWebRate: 14000,
    bookingComRate: 14900,
    expediaRate: 15200,
    agodaRate: 15000,
    currency: 'ETB',
    parityStatus: 'direct_cheaper',
    varianceAmount: 900,
    lastCheckedAt: '2026-11-08T10:30:00.000Z',
    recommendedAction: 'Direct Web Best Rate Guarantee active. Includes complimentary private airport chauffeur transfer.',
  },
];

const SEED_DYNAMIC_YIELD_RULES: DynamicYieldRule[] = [
  {
    id: 'rul_01',
    hotelId: 'htl_grand_rift',
    ruleName: 'High Occupancy Compression Surge (+15%)',
    ruleType: 'occupancy_surge',
    condition: 'Current Hotel Occupancy exceeds 80%',
    adjustmentType: 'percentage_increase',
    adjustmentValue: 15,
    targetChannels: ['booking_com', 'expedia', 'agoda'],
    isActive: true,
    autoApplyToOta: true,
    updatedAt: '2026-11-07T14:00:00.000Z',
  },
  {
    id: 'rul_02',
    hotelId: 'htl_grand_rift',
    ruleName: 'Same-Day Last-Minute Flash Saver (-20%)',
    ruleType: 'last_minute_flash',
    condition: 'Same-day after 16:00 and Occupancy under 50%',
    adjustmentType: 'percentage_discount',
    adjustmentValue: 20,
    targetChannels: ['hotel_direct'],
    isActive: true,
    autoApplyToOta: false,
    updatedAt: '2026-11-06T11:00:00.000Z',
  },
  {
    id: 'rul_03',
    hotelId: 'htl_grand_rift',
    ruleName: 'Weekend Minimum 2-Night Stay Restriction',
    ruleType: 'length_of_stay_min',
    condition: 'Check-in on Friday or Saturday during peak safari season',
    adjustmentType: 'min_los',
    adjustmentValue: 2,
    targetChannels: ['booking_com', 'expedia', 'agoda', 'hotel_direct'],
    isActive: true,
    autoApplyToOta: true,
    updatedAt: '2026-11-05T08:00:00.000Z',
  },
  {
    id: 'rul_04',
    hotelId: 'htl_grand_rift',
    ruleName: 'Early Bird 30-Day Advance Booking (-10%)',
    ruleType: 'early_bird',
    condition: 'Reservations booked more than 30 days prior to arrival',
    adjustmentType: 'percentage_discount',
    adjustmentValue: 10,
    targetChannels: ['hotel_direct', 'booking_com'],
    isActive: true,
    autoApplyToOta: true,
    updatedAt: '2026-11-04T12:00:00.000Z',
  },
];

const SEED_RATE_PLANS: RatePlan[] = [
  {
    id: 'rp_01',
    hotelId: 'htl_grand_rift',
    code: 'BAR',
    name: 'Best Available Rate (Room Only)',
    description: 'Standard flexible room rate with complimentary high-speed WiFi and welcome mineral water.',
    mealPlan: 'room_only',
    cancellationPolicy: 'free_cancellation_24h',
    baseDiscountPercent: 0,
    includedPerks: ['Free High-Speed WiFi', 'Welcome Botanical Drink', 'Free Swimming Pool Access'],
    isActive: true,
  },
  {
    id: 'rp_02',
    hotelId: 'htl_grand_rift',
    code: 'BB',
    name: 'Bed & Breakfast Gourmet Package',
    description: 'Includes full international & Ethiopian breakfast buffet at Main Dining Restaurant.',
    mealPlan: 'bed_and_breakfast',
    cancellationPolicy: 'free_cancellation_24h',
    baseDiscountPercent: 0,
    includedPerks: ['Daily Gourmet Buffet Breakfast', 'Espresso / Macchiato Station', 'Fresh Tropical Fruit Basket'],
    isActive: true,
  },
  {
    id: 'rp_03',
    hotelId: 'htl_grand_rift',
    code: 'ADV_NONREF',
    name: 'Advance Purchase Non-Refundable (-10%)',
    description: 'Pay in full at booking and save 10% on your stay. Strictly non-refundable.',
    mealPlan: 'room_only',
    cancellationPolicy: 'non_refundable',
    baseDiscountPercent: 10,
    includedPerks: ['10% Instant Room Discount', 'Guaranteed Room Reservation'],
    isActive: true,
  },
  {
    id: 'rp_04',
    hotelId: 'htl_grand_rift',
    code: 'CORP_ECA',
    name: 'UN-ECA & Diplomatic Preferred Rate',
    description: 'Negotiated corporate partner rate for UN agencies, African Union, and diplomatic delegations.',
    mealPlan: 'bed_and_breakfast',
    cancellationPolicy: 'flexible',
    baseDiscountPercent: 15,
    includedPerks: ['Complimentary Airport Transfer', 'Laundry 2 Pieces/Day', 'Late Check-out 16:00'],
    isActive: true,
  },
];

const SEED_DIRECT_WEB_BOOKINGS: DirectWebBookingRequest[] = [
  {
    id: 'dwb_01',
    hotelId: 'htl_grand_rift',
    guestName: 'Ambassador Pierre Dupont',
    guestEmail: 'pierre.dupont@delegation-eu.org',
    guestPhone: '+251 91 123 4567',
    roomTypeId: 'rt_02',
    ratePlanId: 'rp_04',
    checkInDate: '2026-11-12',
    checkOutDate: '2026-11-15',
    adultsCount: 2,
    childrenCount: 0,
    specialRequests: 'Quiet upper floor suite with clear Lake Abaya view.',
    totalPrice: 19125,
    currency: 'ETB',
    promoCodeUsed: 'DIPLOMATIC_VIP',
    paymentStatus: 'guaranteed_card',
    createdAt: '2026-11-08T09:30:00.000Z',
  },
  {
    id: 'dwb_02',
    hotelId: 'htl_grand_rift',
    guestName: 'Sara Mengistu',
    guestEmail: 'sara.mengistu@techafrica.io',
    guestPhone: '+251 92 884 1122',
    roomTypeId: 'rt_01',
    ratePlanId: 'rp_02',
    checkInDate: '2026-11-10',
    checkOutDate: '2026-11-12',
    adultsCount: 1,
    childrenCount: 0,
    specialRequests: 'Early check-in at 11:00 AM if available.',
    totalPrice: 9800,
    currency: 'ETB',
    promoCodeUsed: 'SEAMDIRECT',
    paymentStatus: 'paid_telebirr',
    createdAt: '2026-11-08T08:15:00.000Z',
  },
];

// Phase 15 Seed Data: Digital In-Room Tablet, Smart Room & Service Requests
const SEED_ROOM_SERVICE_ORDERS: RoomServiceOrder[] = [
  {
    id: 'rso_01',
    hotelId: 'htl_grand_rift',
    roomNumber: '201',
    guestName: 'Sample Guest A',
    items: [
      {
        menuItemId: 'mi_01',
        name: 'Pan-Seared Lake Chamo Tilapia Fillet (Lemon Herb Butter)',
        quantity: 1,
        unitPrice: 850,
        notes: 'Extra lemon slices on side',
      },
      {
        menuItemId: 'mi_02',
        name: 'Chamo Sunrise Hibiscus & Ginger Mocktail',
        quantity: 2,
        unitPrice: 200,
      },
      {
        menuItemId: 'mi_03',
        name: 'Fresh Passion Fruit & Mango Bavarian Tart',
        quantity: 1,
        unitPrice: 320,
      },
    ],
    subtotal: 1570,
    serviceCharge: 157,
    vat: 259,
    totalPrice: 1986,
    currency: 'ETB',
    orderStatus: 'preparing',
    placedAt: '2026-11-09T09:40:00.000Z',
    estimatedDeliveryMinutes: 25,
    specialDietaryNotes: 'No peanuts. Garlic on side.',
    postedToFolio: true,
  },
  {
    id: 'rso_02',
    hotelId: 'htl_grand_rift',
    roomNumber: '101',
    guestName: 'Dr. Almaz Kebede',
    items: [
      {
        menuItemId: 'mi_04',
        name: 'Special Traditional Beyaynetu Vegan Fasting Platter',
        quantity: 1,
        unitPrice: 650,
        notes: 'Highland Teff Injera',
      },
      {
        menuItemId: 'mi_05',
        name: 'Cardamom & Cinnamon Spiced Ethiopian Black Tea Pot',
        quantity: 1,
        unitPrice: 180,
      },
    ],
    subtotal: 830,
    serviceCharge: 83,
    vat: 137,
    totalPrice: 1050,
    currency: 'ETB',
    orderStatus: 'delivered',
    placedAt: '2026-11-09T08:15:00.000Z',
    estimatedDeliveryMinutes: 20,
    postedToFolio: true,
  },
];

const SEED_GUEST_SERVICE_REQUESTS: GuestServiceRequest[] = [
  {
    id: 'req_01',
    hotelId: 'htl_grand_rift',
    roomNumber: '201',
    guestName: 'Sample Guest A',
    requestType: 'dnd_toggle',
    details: 'Digital Do Not Disturb sign activated by guest on in-room tablet.',
    status: 'completed',
    requestedAt: '2026-11-09T09:00:00.000Z',
    completedAt: '2026-11-09T09:00:05.000Z',
  },
  {
    id: 'req_02',
    hotelId: 'htl_grand_rift',
    roomNumber: '101',
    guestName: 'Dr. Almaz Kebede',
    requestType: 'extra_amenities',
    details: 'Requesting 2 extra hypoallergenic down pillows and UK 3-pin power adapter.',
    status: 'in_progress',
    assignedStaffName: 'Mulugeta Bekele (Housekeeping)',
    requestedAt: '2026-11-09T09:15:00.000Z',
  },
  {
    id: 'req_03',
    hotelId: 'htl_grand_rift',
    roomNumber: '302',
    guestName: 'Dawit Hailemariam',
    requestType: 'mur_toggle',
    details: 'Make Up Room requested before departure to Lake Chamo boat safari at 10:30 AM.',
    status: 'completed',
    assignedStaffName: 'Tigist Hailu (Housekeeping)',
    requestedAt: '2026-11-09T08:30:00.000Z',
    completedAt: '2026-11-09T09:10:00.000Z',
  },
  {
    id: 'req_04',
    hotelId: 'htl_grand_rift',
    roomNumber: '201',
    guestName: 'Sample Guest A',
    requestType: 'turndown_service',
    details: 'Evening botanical aromatherapy turndown with lavender pillow mist requested for 19:30.',
    status: 'requested',
    requestedAt: '2026-11-09T09:45:00.000Z',
  },
];

const SEED_EXPRESS_CHECKOUTS: ExpressCheckOutRequest[] = [
  {
    id: 'eco_01',
    hotelId: 'htl_grand_rift',
    roomNumber: '302',
    guestName: 'Dawit Hailemariam',
    folioId: 'fol_htl_grand_rift_03',
    outstandingBalance: 3420,
    preferredPaymentMethod: 'telebirr',
    departureTime: '11:45 AM',
    luggageAssistanceNeeded: true,
    flightTransferNeeded: true,
    status: 'pending_review',
    guestNotes: 'Flying on Ethiopian Airlines ET 135 to Addis Ababa. Porter assistance needed at 11:30 AM.',
    createdAt: '2026-11-09T09:20:00.000Z',
  },
];

// Phase 16 Seed Data: Supply Chain, Vendor Portal, Purchase Orders & Three-Way Matching
const SEED_SUPPLIERS: SupplierVendor[] = [
  {
    id: 'sup_01',
    hotelId: 'htl_grand_rift',
    code: 'VEN-FISH-01',
    name: 'Lake Chamo Fishermen Artisanal Cooperative',
    category: 'meat_seafood',
    contactPerson: 'Ato Mulugeta Desta',
    email: 'chamo.fishery@arbaminch.et',
    phone: '+251 91 184 9201',
    tinNumber: '0048192011',
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    bankAccountNumber: '1000192837482',
    telebirrMerchantId: 'MERCH-CHAMO-FISH',
    paymentTerms: 'net_15',
    qualityRating: 4.9,
    onTimeDeliveryRate: 98,
    status: 'active',
    notes: 'Daily sunrise sustainable catch delivery directly to resort kitchen cold room.',
  },
  {
    id: 'sup_02',
    hotelId: 'htl_grand_rift',
    code: 'VEN-FARM-02',
    name: 'Dorze Highland Organic Produce & Dairy Cooperative',
    category: 'fresh_produce',
    contactPerson: 'W/ro Roman Kebede',
    email: 'dorze.organic@farms.et',
    phone: '+251 92 384 1092',
    tinNumber: '0059123847',
    bankName: 'Awash International Bank',
    bankAccountNumber: '01428394857200',
    telebirrMerchantId: 'MERCH-DORZE-ORG',
    paymentTerms: 'net_7',
    qualityRating: 4.8,
    onTimeDeliveryRate: 95,
    status: 'active',
    notes: 'Highland organic potatoes, curly kale, baby carrots, and fresh pasteurized morning milk.',
  },
  {
    id: 'sup_03',
    hotelId: 'htl_grand_rift',
    code: 'VEN-BEV-01',
    name: 'BGI Ethiopia Breweries & Awash Winery Distribution',
    category: 'beverages_liquor',
    contactPerson: 'Yonas Tsegaye (Sales Manager)',
    email: 'y.tsegaye@bgi-ethiopia.com',
    phone: '+251 91 293 8471',
    tinNumber: '0010293847',
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    bankAccountNumber: '1000849201948',
    paymentTerms: 'net_30',
    qualityRating: 5.0,
    onTimeDeliveryRate: 99,
    status: 'active',
    notes: 'Official wholesale distributor for St. George Draft kegs, Castel, and Awash Rift Valley reserves.',
  },
  {
    id: 'sup_04',
    hotelId: 'htl_grand_rift',
    code: 'VEN-CHEM-01',
    name: 'Diversey East Africa Hygiene & Chemical Solutions',
    category: 'chemicals_cleaning',
    contactPerson: 'Dawit Mengesha',
    email: 'dawit.m@diversey-ea.com',
    phone: '+251 91 384 7291',
    tinNumber: '0081293840',
    bankName: 'Dashen Bank',
    bankAccountNumber: '5019283748291',
    paymentTerms: 'net_30',
    qualityRating: 4.7,
    onTimeDeliveryRate: 92,
    status: 'active',
    notes: 'HACCP-compliant commercial kitchen sanitizers, laundry chemicals, and swimming pool chlorine.',
  },
  {
    id: 'sup_05',
    hotelId: 'htl_grand_rift',
    code: 'VEN-ENG-01',
    name: 'Cummins & Daikin Engineering Spares Direct (Addis Motors)',
    category: 'engineering_spares',
    contactPerson: 'Eng. Solomon Worku',
    email: 'spares@addismotors-plant.et',
    phone: '+251 91 192 8374',
    tinNumber: '0038291048',
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    bankAccountNumber: '1000293847561',
    paymentTerms: 'advance_deposit',
    qualityRating: 4.9,
    onTimeDeliveryRate: 94,
    status: 'active',
    notes: 'OEM spare parts and maintenance consumables for 500kVA generator and rooftop chillers.',
  },
];

const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po_01',
    hotelId: 'htl_grand_rift',
    poNumber: 'PO-2026-088',
    vendorId: 'sup_01',
    vendorName: 'Lake Chamo Fishermen Artisanal Cooperative',
    requisitionId: 'req_01',
    status: 'approved',
    expectedDeliveryDate: '2026-11-10',
    currency: 'ETB',
    subtotal: 57000,
    taxAmount: 8550,
    totalAmount: 65550,
    items: [
      {
        itemId: 'stk_01',
        itemCode: 'SEA-TIL-01',
        itemName: 'Fresh Lake Chamo Tilapia (Whole Cleaned)',
        quantityOrdered: 80,
        unitOfMeasure: 'kg',
        unitPrice: 450,
        totalPrice: 36000,
        storeLocationId: 'loc_02',
        storeLocationName: 'Kitchen Cold Room',
      },
      {
        itemId: 'stk_02',
        itemCode: 'SEA-PER-01',
        itemName: 'Nile Perch Fillet (Grade A Skinless)',
        quantityOrdered: 30,
        unitOfMeasure: 'kg',
        unitPrice: 700,
        totalPrice: 21000,
        storeLocationId: 'loc_02',
        storeLocationName: 'Kitchen Cold Room',
      },
    ],
    preparedBy: 'Executive Chef Solomon Mulugeta',
    approvedBy: 'Helen Tadesse (Finance Manager)',
    createdAt: '2026-11-08T14:30:00.000Z',
    notes: 'Deliver early morning before 07:00 AM on ice crates for weekend banquets.',
  },
  {
    id: 'po_02',
    hotelId: 'htl_grand_rift',
    poNumber: 'PO-2026-089',
    vendorId: 'sup_03',
    vendorName: 'BGI Ethiopia Breweries & Awash Winery Distribution',
    status: 'fully_received',
    expectedDeliveryDate: '2026-11-07',
    currency: 'ETB',
    subtotal: 96000,
    taxAmount: 14400,
    totalAmount: 110400,
    items: [
      {
        itemId: 'stk_03',
        itemCode: 'BEV-DRF-01',
        itemName: 'St. George Draft Beer (50L Stainless Steel Kegs)',
        quantityOrdered: 10,
        unitOfMeasure: 'kegs',
        unitPrice: 4200,
        totalPrice: 42000,
        storeLocationId: 'loc_03',
        storeLocationName: 'Wine Cellar',
      },
      {
        itemId: 'stk_04',
        itemCode: 'BEV-WIN-01',
        itemName: 'Awash Rift Valley Reserve Cabernet Sauvignon (12 Bottles/Case)',
        quantityOrdered: 15,
        unitOfMeasure: 'cases',
        unitPrice: 3600,
        totalPrice: 54000,
        storeLocationId: 'loc_03',
        storeLocationName: 'Wine Cellar',
      },
    ],
    preparedBy: 'Food & Beverage Director Dawit Haile',
    approvedBy: 'Kibreab Wolde (General Manager)',
    createdAt: '2026-11-05T10:00:00.000Z',
    notes: 'Received and inspected at Wine Cellar under GRV-2026-041.',
  },
  {
    id: 'po_03',
    hotelId: 'htl_grand_rift',
    poNumber: 'PO-2026-090',
    vendorId: 'sup_04',
    vendorName: 'Diversey East Africa Hygiene & Chemical Solutions',
    status: 'sent_to_vendor',
    expectedDeliveryDate: '2026-11-12',
    currency: 'ETB',
    subtotal: 34000,
    taxAmount: 5100,
    totalAmount: 39100,
    items: [
      {
        itemId: 'stk_05',
        itemCode: 'CHM-DIS-01',
        itemName: 'Suma Dify Commercial Dishwashing Detergent Tablets (5kg Drum)',
        quantityOrdered: 5,
        unitOfMeasure: 'drums',
        unitPrice: 6800,
        totalPrice: 34000,
        storeLocationId: 'loc_01',
        storeLocationName: 'Main Dry Stores',
      },
    ],
    preparedBy: 'Executive Housekeeper Tigist Mengistu',
    approvedBy: 'Helen Tadesse (Finance Manager)',
    createdAt: '2026-11-08T16:00:00.000Z',
  },
];

const SEED_THREE_WAY_MATCHES: ThreeWayInvoiceMatch[] = [
  {
    id: 'twm_01',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'INV-BGI-9921',
    poId: 'po_02',
    poNumber: 'PO-2026-089',
    grvId: 'grv_01',
    grvNumber: 'GRV-2026-041',
    vendorName: 'BGI Ethiopia Breweries & Awash Winery Distribution',
    poAmount: 110400,
    grvAmount: 110400,
    invoiceAmount: 110400,
    varianceAmount: 0,
    currency: 'ETB',
    matchStatus: 'matched_approved',
    paymentDueDate: '2026-12-07',
    paymentStatus: 'authorized_for_payment',
    reconciledBy: 'Helen Tadesse (Finance Manager)',
    createdAt: '2026-11-07T16:30:00.000Z',
  },
  {
    id: 'twm_02',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'INV-FISH-4402',
    poId: 'po_01',
    poNumber: 'PO-2026-088',
    grvId: 'grv_02',
    grvNumber: 'GRV-2026-042',
    vendorName: 'Lake Chamo Fishermen Artisanal Cooperative',
    poAmount: 65550,
    grvAmount: 62100,
    invoiceAmount: 65550,
    varianceAmount: 3450,
    currency: 'ETB',
    matchStatus: 'quantity_shortage_hold',
    paymentDueDate: '2026-11-25',
    paymentStatus: 'pending',
    reconciledBy: 'Amanuel Girma (Internal Auditor)',
    createdAt: '2026-11-08T18:00:00.000Z',
  },
];

// Phase 17 Seed Data: Commercial Laundry, Linen Par Stock & Guest Valet Orders
const SEED_LINEN_ITEMS: LinenItem[] = [
  {
    id: 'lin_01',
    hotelId: 'htl_grand_rift',
    code: 'LIN-BED-01',
    name: 'King 400TC Egyptian Cotton Flat Sheet (White Satin Stripe)',
    category: 'bed_linen',
    specification: '400 Thread Count 100% Egyptian Cotton 280x300cm',
    parLevelRequirement: 3.5,
    totalStockCount: 420,
    inRoomsCount: 120,
    inLaundryCount: 95,
    cleanInPantryCount: 135,
    reserveStorageCount: 70,
    damagedDiscardedThisMonth: 4,
    unitCost: 1850,
    lastAuditedDate: '2026-11-05',
  },
  {
    id: 'lin_02',
    hotelId: 'htl_grand_rift',
    code: 'LIN-TOW-01',
    name: 'Luxury Plush Terry Bath Sheet 700 GSM (Pure White)',
    category: 'bath_linen',
    specification: '700 GSM 100% Ring Spun Turkish Cotton 100x150cm',
    parLevelRequirement: 4.0,
    totalStockCount: 560,
    inRoomsCount: 150,
    inLaundryCount: 140,
    cleanInPantryCount: 180,
    reserveStorageCount: 90,
    damagedDiscardedThisMonth: 6,
    unitCost: 950,
    lastAuditedDate: '2026-11-05',
  },
  {
    id: 'lin_03',
    hotelId: 'htl_grand_rift',
    code: 'LIN-ROB-01',
    name: 'Embroidered Kimono Waffle Bathrobe (Navy Monogram)',
    category: 'bath_linen',
    specification: '380 GSM Diamond Waffle Poly-Cotton with Soft Velour Collar',
    parLevelRequirement: 2.5,
    totalStockCount: 210,
    inRoomsCount: 80,
    inLaundryCount: 45,
    cleanInPantryCount: 55,
    reserveStorageCount: 30,
    damagedDiscardedThisMonth: 1,
    unitCost: 2200,
    lastAuditedDate: '2026-11-04',
  },
  {
    id: 'lin_04',
    hotelId: 'htl_grand_rift',
    code: 'LIN-FNB-01',
    name: 'Banquet Heavyweight Damask Round Tablecloth (Champagne Gold)',
    category: 'fnb_linen',
    specification: '240 GSM Spun Polyester Circular 330cm for 72" Banquet Tables',
    parLevelRequirement: 3.0,
    totalStockCount: 180,
    inRoomsCount: 40,
    inLaundryCount: 50,
    cleanInPantryCount: 60,
    reserveStorageCount: 30,
    damagedDiscardedThisMonth: 3,
    unitCost: 1600,
    lastAuditedDate: '2026-11-06',
  },
  {
    id: 'lin_05',
    hotelId: 'htl_grand_rift',
    code: 'LIN-CAB-01',
    name: 'Pool & Lakeside Cabana Striped Sun Towel (Cyan / White)',
    category: 'pool_spa_linen',
    specification: '550 GSM Yarn-Dyed Colorfast Chlorine-Resistant 90x180cm',
    parLevelRequirement: 3.0,
    totalStockCount: 320,
    inRoomsCount: 60,
    inLaundryCount: 110,
    cleanInPantryCount: 110,
    reserveStorageCount: 40,
    damagedDiscardedThisMonth: 5,
    unitCost: 780,
    lastAuditedDate: '2026-11-07',
  },
  {
    id: 'lin_06',
    hotelId: 'htl_grand_rift',
    code: 'LIN-UNI-01',
    name: 'Executive Chef Double-Breasted Master White Jacket',
    category: 'uniforms',
    specification: 'Egyptian Cotton Twill with Breathable Mesh Back & Cloth Knots',
    parLevelRequirement: 2.5,
    totalStockCount: 45,
    inRoomsCount: 18,
    inLaundryCount: 12,
    cleanInPantryCount: 10,
    reserveStorageCount: 5,
    damagedDiscardedThisMonth: 0,
    unitCost: 2400,
    lastAuditedDate: '2026-11-03',
  },
];

const SEED_LAUNDRY_WASH_LOADS: LaundryWashLoad[] = [
  {
    id: 'load_01',
    hotelId: 'htl_grand_rift',
    batchNumber: 'WASH-2026-041',
    machineId: 'Girbau Industrial Washer #1 (55kg)',
    programType: 'heavy_white_cotton',
    weightKg: 52,
    cycleStatus: 'washing',
    startedAt: '2026-11-09T08:30:00.000Z',
    operatorName: 'Tewodros Alemu (Laundry Supervisor)',
    chemicalDosageNotes: 'Diversey Clax 100 Ob + Clax Bright Oxygen Bleach at 65°C',
  },
  {
    id: 'load_02',
    hotelId: 'htl_grand_rift',
    batchNumber: 'WASH-2026-042',
    machineId: 'Electrolux Tumble Dryer #2 (45kg)',
    programType: 'terry_towels',
    weightKg: 44,
    cycleStatus: 'drying',
    startedAt: '2026-11-09T08:00:00.000Z',
    operatorName: 'Tigist Worku (Dryer Attendant)',
    chemicalDosageNotes: 'Fabric softening rinse with Diversey Clax Deosoft Floral',
  },
  {
    id: 'load_03',
    hotelId: 'htl_grand_rift',
    batchNumber: 'WASH-2026-040',
    machineId: 'Chicago Dryer Flatwork Calender Ironer (3.3m)',
    programType: 'fnb_table_linen',
    weightKg: 38,
    cycleStatus: 'completed',
    startedAt: '2026-11-09T06:30:00.000Z',
    completedAt: '2026-11-09T07:45:00.000Z',
    operatorName: 'Abebe Kebede (Ironing Specialist)',
    chemicalDosageNotes: 'Starch dip formulation for crisp banqueting presentation',
  },
];

const SEED_GUEST_LAUNDRY_ORDERS: GuestLaundryOrder[] = [
  {
    id: 'glo_01',
    hotelId: 'htl_grand_rift',
    orderNumber: 'VALET-2026-019',
    roomNumber: '201',
    guestName: 'Sample Guest A',
    reservationId: 'res_201_active',
    serviceType: 'express_4h',
    status: 'delivered',
    items: [
      { garmentName: 'Italian Wool 2-Piece Suit', service: 'dry_clean', quantity: 1, unitPrice: 850, totalPrice: 850 },
      { garmentName: 'Silk Evening Blouse', service: 'dry_clean', quantity: 2, unitPrice: 420, totalPrice: 840 },
      { garmentName: 'Formal Cotton Shirt', service: 'wash_press', quantity: 3, unitPrice: 220, totalPrice: 660 },
    ],
    subtotal: 2350,
    serviceCharge: 235,
    taxAmount: 388,
    totalAmount: 2973,
    specialInstructions: 'Gentle hand finish on silk collar. Express 4-hour return before gala.',
    isBilledToFolio: true,
    folioChargeId: 'chg_valet_01',
    receivedAt: '2026-11-08T11:00:00.000Z',
    deliveredAt: '2026-11-08T14:40:00.000Z',
    attendantName: 'Senait Hailu (Valet Attendant)',
  },
  {
    id: 'glo_02',
    hotelId: 'htl_grand_rift',
    orderNumber: 'VALET-2026-020',
    roomNumber: '104',
    guestName: 'Marcus Vance',
    serviceType: 'standard_24h',
    status: 'in_cleaning',
    items: [
      { garmentName: 'Safari Khaki Trousers', service: 'wash_press', quantity: 2, unitPrice: 280, totalPrice: 560 },
      { garmentName: 'Linen Casual Shirt', service: 'wash_press', quantity: 2, unitPrice: 220, totalPrice: 440 },
      { garmentName: 'Traditional Embroidered Habesha Kemis', service: 'dry_clean', quantity: 1, unitPrice: 650, totalPrice: 650 },
    ],
    subtotal: 1650,
    serviceCharge: 165,
    taxAmount: 272,
    totalAmount: 2087,
    specialInstructions: 'Delicate hand wash for Habesha embroidery gold threads.',
    isBilledToFolio: false,
    receivedAt: '2026-11-09T07:15:00.000Z',
    attendantName: 'Tewodros Alemu (Valet Supervisor)',
  },
];

// Phase 18 Seed Data: Kitchen Recipe Cards, Ingredient Costing & Menu Engineering
const SEED_RECIPE_CARDS: RecipeCard[] = [
  {
    id: 'rcp_01',
    hotelId: 'htl_grand_rift',
    recipeCode: 'RCP-TIL-01',
    dishName: 'Pan-Seared Lake Chamo Tilapia with Ginger Chili Glaze',
    outletId: 'out_main_dining',
    category: 'main_course',
    servingPortions: 1,
    prepTimeMinutes: 22,
    sellingPrice: 780,
    totalCost: 218,
    portionCost: 218,
    foodCostPercentage: 27.9,
    targetFoodCostPercentage: 29.0,
    grossProfit: 562,
    allergens: ['Fish', 'Sesame'],
    chefInstructions: 'Scale and fillet fresh Lake Chamo Tilapia. Score skin lightly. Sear on high cast iron with ginger-infused sesame oil until crisp. Finish in oven with sweet chili tamarind reduction. Serve with jasmine rice and steamed baby bok choy.',
    menuClassification: 'star',
    monthlyUnitsSold: 384,
    lastCostedDate: '2026-11-06',
    ingredients: [
      { ingredientId: 'stk_01', name: 'Fresh Lake Chamo Tilapia (Cleaned)', quantity: 0.35, unit: 'kg', unitCost: 450, yieldPercentage: 88, costContribution: 179 },
      { ingredientId: 'stk_oil', name: 'Toasted Sesame Oil & Aromatics', quantity: 0.04, unit: 'liters', unitCost: 350, yieldPercentage: 100, costContribution: 14 },
      { ingredientId: 'stk_glz', name: 'Ginger Chili Tamarind Glaze', quantity: 0.05, unit: 'liters', unitCost: 220, yieldPercentage: 100, costContribution: 11 },
      { ingredientId: 'stk_veg', name: 'Jasmine Rice & Baby Greens Garnish', quantity: 0.2, unit: 'kg', unitCost: 70, yieldPercentage: 100, costContribution: 14 },
    ],
  },
  {
    id: 'rcp_02',
    hotelId: 'htl_grand_rift',
    recipeCode: 'RCP-DOR-01',
    dishName: 'Traditional Doro Wat with Farm Boiled Eggs & Injera',
    outletId: 'out_main_dining',
    category: 'main_course',
    servingPortions: 1,
    prepTimeMinutes: 45,
    sellingPrice: 850,
    totalCost: 272,
    portionCost: 272,
    foodCostPercentage: 32.0,
    targetFoodCostPercentage: 30.0,
    grossProfit: 578,
    allergens: ['Eggs', 'Dairy'],
    chefInstructions: 'Slowly caramelize Dorze red onions without oil for 4 hours. Stir in authentic berbere and spiced niter kibbeh. Simmer organic chicken drumstick and thigh until tender. Score organic farm egg and steep in wat. Serve warm on two fresh teff injeras.',
    menuClassification: 'star',
    monthlyUnitsSold: 460,
    lastCostedDate: '2026-11-05',
    ingredients: [
      { ingredientId: 'stk_chk', name: 'Free-Range Organic Country Chicken', quantity: 0.45, unit: 'kg', unitCost: 360, yieldPercentage: 90, costContribution: 180 },
      { ingredientId: 'stk_kib', name: 'Spiced Clarified Butter (Niter Kibbeh)', quantity: 0.06, unit: 'kg', unitCost: 650, yieldPercentage: 100, costContribution: 39 },
      { ingredientId: 'stk_ber', name: 'Artisanal Aged Berbere Spice', quantity: 0.05, unit: 'kg', unitCost: 280, yieldPercentage: 100, costContribution: 14 },
      { ingredientId: 'stk_egg', name: 'Organic Farm Egg (Graded A)', quantity: 1, unit: 'pcs', unitCost: 15, yieldPercentage: 100, costContribution: 15 },
      { ingredientId: 'stk_inj', name: '100% Pure Teff Injera (Fresh Baked)', quantity: 2, unit: 'pcs', unitCost: 12, yieldPercentage: 100, costContribution: 24 },
    ],
  },
  {
    id: 'rcp_03',
    hotelId: 'htl_grand_rift',
    recipeCode: 'RCP-STK-01',
    dishName: 'Aged Rift Valley Prime Ribeye Steak (350g) with Truffle Jus',
    outletId: 'out_main_dining',
    category: 'main_course',
    servingPortions: 1,
    prepTimeMinutes: 25,
    sellingPrice: 1450,
    totalCost: 492.5,
    portionCost: 492.5,
    foodCostPercentage: 34.0,
    targetFoodCostPercentage: 32.0,
    grossProfit: 957.5,
    allergens: ['Dairy'],
    chefInstructions: '28-day dry aged Borana prime beef ribeye. Season with sea salt and coarse Kampot peppercorns. Sear over acacia wood charcoal grill to medium-rare. Rest 8 minutes. Serve with roasted garlic mash and bone marrow truffle jus.',
    menuClassification: 'puzzle',
    monthlyUnitsSold: 112,
    lastCostedDate: '2026-11-04',
    ingredients: [
      { ingredientId: 'stk_bef', name: 'Borana Prime Ribeye Steak (350g net)', quantity: 0.35, unit: 'kg', unitCost: 1100, yieldPercentage: 88, costContribution: 437.5 },
      { ingredientId: 'stk_jus', name: 'Veal Bone Reduction with Truffle Essence', quantity: 0.06, unit: 'liters', unitCost: 450, yieldPercentage: 100, costContribution: 27 },
      { ingredientId: 'stk_msh', name: 'Yukon Gold Potato & Local Cream Mash', quantity: 0.25, unit: 'kg', unitCost: 112, yieldPercentage: 100, costContribution: 28 },
    ],
  },
  {
    id: 'rcp_04',
    hotelId: 'htl_grand_rift',
    recipeCode: 'RCP-SAL-01',
    dishName: 'Organic Wondo Genet Avocado & Roasted Beetroot Salad',
    outletId: 'out_main_dining',
    category: 'appetizer',
    servingPortions: 1,
    prepTimeMinutes: 12,
    sellingPrice: 420,
    totalCost: 98,
    portionCost: 98,
    foodCostPercentage: 23.3,
    targetFoodCostPercentage: 25.0,
    grossProfit: 322,
    allergens: ['Nuts'],
    chefInstructions: 'Fan ripe Hass avocado slices around slow-roasted beetroot rounds. Toss wild rocket with passionfruit vinaigrette. Top with toasted pumpkin seeds, crumbled goat cheese, and edible flower petals.',
    menuClassification: 'plowhorse',
    monthlyUnitsSold: 310,
    lastCostedDate: '2026-11-07',
    ingredients: [
      { ingredientId: 'stk_avo', name: 'Fresh Hass Avocado (Wondo Genet)', quantity: 0.2, unit: 'kg', unitCost: 180, yieldPercentage: 75, costContribution: 48 },
      { ingredientId: 'stk_bet', name: 'Roasted Organic Baby Beetroots', quantity: 0.15, unit: 'kg', unitCost: 120, yieldPercentage: 90, costContribution: 20 },
      { ingredientId: 'stk_che', name: 'Artisanal Crumbled Goat Cheese', quantity: 0.04, unit: 'kg', unitCost: 450, yieldPercentage: 100, costContribution: 18 },
      { ingredientId: 'stk_vin', name: 'Passionfruit Honey Vinaigrette & Seeds', quantity: 0.03, unit: 'liters', unitCost: 400, yieldPercentage: 100, costContribution: 12 },
    ],
  },
  {
    id: 'rcp_05',
    hotelId: 'htl_grand_rift',
    recipeCode: 'RCP-DES-01',
    dishName: 'Habesha Tej & Wild Forest Honey Poached Pears',
    outletId: 'out_main_dining',
    category: 'dessert',
    servingPortions: 1,
    prepTimeMinutes: 18,
    sellingPrice: 380,
    totalCost: 84,
    portionCost: 84,
    foodCostPercentage: 22.1,
    targetFoodCostPercentage: 24.0,
    grossProfit: 296,
    allergens: ['Dairy'],
    chefInstructions: 'Poach firm Bartlett pears in spiced Ethiopian mead (Tej) with cinnamon quills and star anise until tender. Reduce poaching liquor to a rich syrup. Serve warm with vanilla mascarpone gelato.',
    menuClassification: 'star',
    monthlyUnitsSold: 245,
    lastCostedDate: '2026-11-06',
    ingredients: [
      { ingredientId: 'stk_pea', name: 'Fresh Bartlett Pears (Hand Selected)', quantity: 0.25, unit: 'kg', unitCost: 160, yieldPercentage: 80, costContribution: 50 },
      { ingredientId: 'stk_tej', name: 'Authentic Fermented Tej & Wild Honey', quantity: 0.08, unit: 'liters', unitCost: 250, yieldPercentage: 100, costContribution: 20 },
      { ingredientId: 'stk_gel', name: 'Vanilla Bean Mascarpone Gelato', quantity: 0.05, unit: 'kg', unitCost: 280, yieldPercentage: 100, costContribution: 14 },
    ],
  },
];

const SEED_FOOD_COST_VARIANCES: FoodCostVarianceRecord[] = [
  {
    id: 'fcv_01',
    hotelId: 'htl_grand_rift',
    outletId: 'out_main_dining',
    periodMonth: '2026-10',
    totalFoodSales: 1845000,
    theoreticalCost: 516600,
    theoreticalCostPercentage: 28.0,
    actualFoodCost: 538740,
    actualCostPercentage: 29.2,
    varianceAmount: 22140,
    variancePercentage: 1.2,
    status: 'acceptable',
    notes: 'Variance is within 1.5% target tolerance. Tilapia and Doro Wat sales were strong; minimal trimming spoilage reported in cold stores.',
    auditedBy: 'Dawit Mengesha (F&B Cost Controller)',
  },
  {
    id: 'fcv_02',
    hotelId: 'htl_grand_rift',
    outletId: 'out_banquets',
    periodMonth: '2026-10',
    totalFoodSales: 2150000,
    theoreticalCost: 645000,
    theoreticalCostPercentage: 30.0,
    actualFoodCost: 718100,
    actualCostPercentage: 33.4,
    varianceAmount: 73100,
    variancePercentage: 3.4,
    status: 'warning',
    notes: 'AU Summit banquets experienced 3.4% food cost variance. Over-prep on breakfast buffet stations and unaccounted chafing dish replenishment identified. Executive Chef implementing batch cooking schedule.',
    auditedBy: 'Helen Tadesse (Finance Manager)',
  },
];

const SEED_GUEST_REVIEWS: GuestReview[] = [
  {
    id: 'rev_01',
    hotelId: 'htl_grand_rift',
    channel: 'google_reviews',
    externalReviewId: 'goog_rev_98124',
    guestName: 'Ambassador Marcus Vance',
    roomNumber: '402',
    rating: 5,
    title: 'Flawless VIP delegation stay & breathtaking Rift Valley sunset',
    comment: 'From the VIP airport tarmac transfer to the private presidential dinner at the Crater Lounge, everything was seamless. Concierge Solomon arranged our boat safari flawlessly. The lakeside sunset from the suite balcony is truly unforgettable.',
    reviewDate: '2026-11-08',
    stayDate: '2026-11-05',
    sentimentCategory: 'front_desk',
    sentimentPolarity: 'positive',
    sentimentScore: 0.96,
    isVerifiedStay: true,
    isEscalatedToHOD: false,
    managementResponse: {
      responseText: 'Dear Ambassador Vance, It was our utmost privilege hosting your delegation at Sample Property A. We have shared your compliments directly with Solomon and our Executive Chef. We look forward to welcoming you back on your next diplomatic mission.',
      respondedBy: 'General Manager (Executive Office)',
      respondedAt: '2026-11-09T08:30:00Z',
      publishedToChannel: true,
    },
  },
  {
    id: 'rev_02',
    hotelId: 'htl_grand_rift',
    channel: 'tripadvisor',
    externalReviewId: 'ta_rev_55410',
    guestName: 'Sample Guest A',
    roomNumber: '205',
    rating: 4,
    title: 'Peaceful escape with splendid breakfast, minor WiFi drop',
    comment: 'The grounds are gorgeous, peacocks roaming near the infinity pool, and the traditional Ethiopian breakfast spread with fresh honey and teff injera was great. Only minor complaint was WiFi signal dipping during evening rain showers in Room 205.',
    reviewDate: '2026-11-06',
    stayDate: '2026-11-03',
    sentimentCategory: 'fnb_dining',
    sentimentPolarity: 'positive',
    sentimentScore: 0.78,
    isVerifiedStay: true,
    isEscalatedToHOD: false,
    managementResponse: {
      responseText: 'Thank you for your generous review! We are thrilled you loved our traditional breakfast and garden setting. Our IT engineering team has recently reinforced our fiber access points across the East Wing to prevent weather interference.',
      respondedBy: 'Guest Relations Director',
      respondedAt: '2026-11-07T11:15:00Z',
      publishedToChannel: true,
    },
  },
  {
    id: 'rev_03',
    hotelId: 'htl_grand_rift',
    channel: 'booking_com',
    externalReviewId: 'bk_rev_77192',
    guestName: 'Kaleb Bekele',
    roomNumber: '314',
    rating: 2,
    title: 'Air conditioning thermostat issue took 3 hours to inspect',
    comment: 'Checked in late after a long road trip from Hawassa. The AC in room 314 was stuck blowing hot air at 28C. Called front desk twice; engineering took 3 hours to arrive and fix the condenser fuse. Unacceptable response time for a 5-star resort.',
    reviewDate: '2026-11-09',
    stayDate: '2026-11-08',
    sentimentCategory: 'room_comfort',
    sentimentPolarity: 'negative',
    sentimentScore: -0.82,
    isVerifiedStay: true,
    isEscalatedToHOD: true,
    hodDepartment: 'Maintenance & Front Office',
    hodEscalationStatus: 'investigating',
    hodResolutionNotes: 'Chief Engineer dispatched team to replace smart thermostat relay. Duty Manager phoned Mr. Bekele, credited the minibar charges, and offered 20% future stay certificate.',
  },
  {
    id: 'rev_04',
    hotelId: 'htl_grand_rift',
    channel: 'expedia',
    externalReviewId: 'exp_rev_33219',
    guestName: 'Dr. Sarah Jenkins',
    roomNumber: '101',
    rating: 5,
    title: 'Exceptional housekeeping turndown & soothing spa ritual',
    comment: 'The botanical aroma at check-in set the tone. Housekeeping team Tigist left thoughtful lavender pillow mist and handwritten welcome card. The Ethiopian coffee scrub at the spa melted away weeks of jet lag. Truly attached operations!',
    reviewDate: '2026-11-07',
    stayDate: '2026-11-04',
    sentimentCategory: 'housekeeping',
    sentimentPolarity: 'positive',
    sentimentScore: 0.94,
    isVerifiedStay: true,
    isEscalatedToHOD: false,
  },
  {
    id: 'rev_05',
    hotelId: 'htl_grand_rift',
    channel: 'direct_post_stay_survey',
    externalReviewId: 'srv_sms_4401',
    guestName: 'Yonas Gebre-Meskel',
    roomNumber: '118',
    rating: 5,
    title: 'Instant Telebirr payment checkout & courteous bell desk',
    comment: 'The mobile QR checkout was done in 45 seconds directly through Telebirr. No front desk queues on Sunday morning rush. Valet luggage transfer was immediate. High standard of hospitality.',
    reviewDate: '2026-11-10',
    stayDate: '2026-11-09',
    sentimentCategory: 'value_service',
    sentimentPolarity: 'positive',
    sentimentScore: 0.88,
    isVerifiedStay: true,
    isEscalatedToHOD: false,
    managementResponse: {
      responseText: 'Thank you Ato Yonas! We invested heavily into frictionless digital folios and Telebirr integrations so our guests can spend more time enjoying their stay and zero time waiting in lines.',
      respondedBy: 'Front Office Manager',
      respondedAt: '2026-11-10T12:00:00Z',
      publishedToChannel: true,
    },
  },
  {
    id: 'rev_06',
    hotelId: 'htl_grand_rift',
    channel: 'booking_com',
    externalReviewId: 'bk_rev_88204',
    guestName: 'Sophie Van Der Meer',
    roomNumber: '104',
    rating: 3,
    title: 'Beautiful pool but DJ music played too loud after 10 PM',
    comment: 'The villa pool is gorgeous, but Friday night poolside DJ continued blasting loud bass until 11:30 PM making it difficult for our toddler to sleep. Better acoustic zoning needed between bar and villas.',
    reviewDate: '2026-11-05',
    stayDate: '2026-11-04',
    sentimentCategory: 'room_comfort',
    sentimentPolarity: 'neutral',
    sentimentScore: -0.15,
    isVerifiedStay: true,
    isEscalatedToHOD: true,
    hodDepartment: 'F&B Outlets & Security',
    hodEscalationStatus: 'resolved',
    hodResolutionNotes: 'Sound limiter installed on pool bar amplifiers at 75dB post-9:30 PM. Relocated subwoofers away from villa wing boundary.',
  },
];

const SEED_SURVEY_CAMPAIGNS: PostStaySurveyCampaign[] = [
  {
    id: 'camp_01',
    hotelId: 'htl_grand_rift',
    campaignName: 'Automated Post-Checkout SMS Survey (Sample)',
    channel: 'sms_telebirr',
    triggerHoursAfterCheckout: 2,
    active: true,
    sentCount: 184,
    responseCount: 122,
    avgNpsScore: 8.9,
    questionPrompt: 'On a scale of 0-10, how likely are you to recommend Sample Property A to friends or business colleagues?',
    createdAt: '2026-10-01',
  },
  {
    id: 'camp_02',
    hotelId: 'htl_grand_rift',
    campaignName: 'Executive VIP Post-Departure Email Questionnaire (Sample)',
    channel: 'email',
    triggerHoursAfterCheckout: 4,
    active: true,
    sentCount: 96,
    responseCount: 68,
    avgNpsScore: 9.3,
    questionPrompt: 'Thank you for choosing Sample Property A. Please rate your overall satisfaction and share how our concierge, dining, or housekeeping made a difference.',
    createdAt: '2026-10-15',
  },
];

const SEED_SURVEY_RESPONSES: SurveyResponse[] = [
  {
    id: 'sr_01',
    hotelId: 'htl_grand_rift',
    campaignId: 'camp_01',
    guestName: 'Tewodros Kassahun',
    roomNumber: '210',
    npsScore: 10,
    csatRating: 5,
    feedback: 'Splendid weekend get-away. Concierge arranged lakeside boat tour flawlessly.',
    submittedAt: '2026-11-09T14:30:00Z',
  },
  {
    id: 'sr_02',
    hotelId: 'htl_grand_rift',
    campaignId: 'camp_01',
    guestName: 'Bethlehem Desta',
    roomNumber: '115',
    npsScore: 9,
    csatRating: 5,
    feedback: 'Clean rooms, fresh linen fragrance, and rapid room service delivery.',
    submittedAt: '2026-11-09T16:15:00Z',
  },
  {
    id: 'sr_03',
    hotelId: 'htl_grand_rift',
    campaignId: 'camp_01',
    guestName: 'Henok Girma',
    roomNumber: '308',
    npsScore: 6,
    csatRating: 3,
    feedback: 'Check-in took 15 minutes due to front desk terminal reboot. Otherwise good dining.',
    submittedAt: '2026-11-08T11:20:00Z',
  },
  {
    id: 'sr_04',
    hotelId: 'htl_grand_rift',
    campaignId: 'camp_02',
    guestName: 'Claire Dubois',
    roomNumber: '401',
    npsScore: 10,
    csatRating: 5,
    feedback: 'Outstanding hospitality, five-star French & Ethiopian fusion cuisine at Crater Lounge.',
    submittedAt: '2026-11-07T18:40:00Z',
  },
];

const SEED_SMART_ROOM_DEVICES: SmartRoomDevice[] = [
  {
    id: 'dev_101',
    hotelId: 'htl_grand_rift',
    roomNumber: '101',
    deviceType: 'thermostat_hvac',
    deviceName: 'Presidential Villa Smart Climate & BACnet Hub',
    status: 'online',
    currentTemperatureC: 21.5,
    targetTemperatureC: 21.0,
    occupancyState: 'occupied',
    keycardInserted: true,
    powerDrawWatts: 380,
    hvacMode: 'cool',
    fanSpeed: 'auto',
    windowClosed: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'dev_104',
    hotelId: 'htl_grand_rift',
    roomNumber: '104',
    deviceType: 'keycard_motion_sensor',
    deviceName: 'Pool Villa Dual-PIR Motion & Keycard Sensor',
    status: 'online',
    currentTemperatureC: 22.0,
    targetTemperatureC: 22.0,
    occupancyState: 'occupied',
    keycardInserted: true,
    powerDrawWatts: 310,
    hvacMode: 'cool',
    fanSpeed: 'med',
    windowClosed: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'dev_205',
    hotelId: 'htl_grand_rift',
    roomNumber: '205',
    deviceType: 'thermostat_hvac',
    deviceName: 'Deluxe King Smart Thermostat (East Wing)',
    status: 'online',
    currentTemperatureC: 23.0,
    targetTemperatureC: 22.5,
    occupancyState: 'occupied',
    keycardInserted: true,
    powerDrawWatts: 290,
    hvacMode: 'cool',
    fanSpeed: 'auto',
    windowClosed: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'dev_314',
    hotelId: 'htl_grand_rift',
    roomNumber: '314',
    deviceType: 'thermostat_hvac',
    deviceName: 'Standard King Thermostat & Window Magnetic Sensor',
    status: 'warning',
    currentTemperatureC: 25.5,
    targetTemperatureC: 26.0,
    occupancyState: 'window_open_alert',
    keycardInserted: false,
    powerDrawWatts: 45,
    hvacMode: 'eco_standby',
    fanSpeed: 'low',
    windowClosed: false,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'dev_402',
    hotelId: 'htl_grand_rift',
    roomNumber: '402',
    deviceType: 'thermostat_hvac',
    deviceName: 'Lake View Suite Smart VRF Climate Controller',
    status: 'online',
    currentTemperatureC: 21.0,
    targetTemperatureC: 20.5,
    occupancyState: 'occupied',
    keycardInserted: true,
    powerDrawWatts: 410,
    hvacMode: 'cool',
    fanSpeed: 'high',
    windowClosed: true,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'dev_118',
    hotelId: 'htl_grand_rift',
    roomNumber: '118',
    deviceType: 'thermostat_hvac',
    deviceName: 'Deluxe Twin Eco Standby Thermostat',
    status: 'online',
    currentTemperatureC: 26.0,
    targetTemperatureC: 26.0,
    occupancyState: 'unoccupied',
    keycardInserted: false,
    powerDrawWatts: 35,
    hvacMode: 'eco_standby',
    fanSpeed: 'low',
    windowClosed: true,
    lastHeartbeat: new Date().toISOString(),
  },
];

const SEED_ENERGY_SUBMETERS: EnergySubmeterZone[] = [
  {
    id: 'sub_01',
    hotelId: 'htl_grand_rift',
    zoneName: 'Central Chiller Plant & Primary Circulation Pumps',
    category: 'hvac_chillers',
    currentKwDemand: 142.5,
    dailyKwhTotal: 1850,
    monthlyKwhTotal: 54200,
    peakDemandKw: 178.0,
    demandThresholdKw: 180.0,
    carbonFootprintKgCo2: 1240,
    status: 'optimal',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'sub_02',
    hotelId: 'htl_grand_rift',
    zoneName: 'Commercial Laundry Steam Dryers & Ironers',
    category: 'commercial_laundry',
    currentKwDemand: 88.0,
    dailyKwhTotal: 720,
    monthlyKwhTotal: 21600,
    peakDemandKw: 96.0,
    demandThresholdKw: 100.0,
    carbonFootprintKgCo2: 520,
    status: 'optimal',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'sub_03',
    hotelId: 'htl_grand_rift',
    zoneName: 'Main Culinary Kitchen Induction & Blast Freezers',
    category: 'kitchen_culinary',
    currentKwDemand: 68.5,
    dailyKwhTotal: 595,
    monthlyKwhTotal: 17850,
    peakDemandKw: 79.2,
    demandThresholdKw: 75.0,
    carbonFootprintKgCo2: 430,
    status: 'high_demand',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'sub_04',
    hotelId: 'htl_grand_rift',
    zoneName: 'Guest Wing Suites (East, West & Lake Villas)',
    category: 'guest_wings',
    currentKwDemand: 95.8,
    dailyKwhTotal: 1140,
    monthlyKwhTotal: 34200,
    peakDemandKw: 122.0,
    demandThresholdKw: 130.0,
    carbonFootprintKgCo2: 780,
    status: 'optimal',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'sub_05',
    hotelId: 'htl_grand_rift',
    zoneName: 'Ballroom, Lobby Atrium & Exterior Architectural Lighting',
    category: 'lighting_common',
    currentKwDemand: 32.4,
    dailyKwhTotal: 390,
    monthlyKwhTotal: 11700,
    peakDemandKw: 44.0,
    demandThresholdKw: 45.0,
    carbonFootprintKgCo2: 260,
    status: 'optimal',
    lastUpdated: new Date().toISOString(),
  },
];

const SEED_EMS_POLICIES: EmsAutomatedPolicy[] = [
  {
    id: 'pol_01',
    hotelId: 'htl_grand_rift',
    policyName: 'Unoccupied Suite Eco-Setback (26°C Cooling / 19°C Heating)',
    category: 'temperature_setback',
    triggerCondition: 'Keycard removed AND zero PIR motion detected for > 15 minutes',
    actionSummary: 'Automatically ramp thermostat target to 26°C and switch fan speed to Low',
    enabled: true,
    estimatedMonthlySavingsEtb: 48500,
    activeExecutionsToday: 38,
  },
  {
    id: 'pol_02',
    hotelId: 'htl_grand_rift',
    policyName: 'Balcony Door & Window HVAC Interlock Cutoff',
    category: 'window_interlock',
    triggerCondition: 'Magnetic window/balcony door sensor indicates open > 90 seconds',
    actionSummary: 'Cut off VRF refrigerant valve to prevent wasted outdoor cooling',
    enabled: true,
    estimatedMonthlySavingsEtb: 32000,
    activeExecutionsToday: 14,
  },
  {
    id: 'pol_03',
    hotelId: 'htl_grand_rift',
    policyName: 'Chiller Peak Demand Shaving (18:00 - 21:00 Peak Tariff)',
    category: 'peak_shaving',
    triggerCondition: 'Total hotel instantaneous demand exceeds 420 kW during peak tariff window',
    actionSummary: 'Stagger chiller stage-2 compressor ramp-up and utilize chilled water thermal storage',
    enabled: true,
    estimatedMonthlySavingsEtb: 74000,
    activeExecutionsToday: 3,
  },
  {
    id: 'pol_04',
    hotelId: 'htl_grand_rift',
    policyName: 'Emergency Generator Smart Load Shedding',
    category: 'generator_shedding',
    triggerCondition: 'Grid utility failure and automatic transfer switch (ATS) engaged',
    actionSummary: 'Instantly isolate commercial laundry dryers, heated pools, and architectural spotlights',
    enabled: true,
    estimatedMonthlySavingsEtb: 51200,
    activeExecutionsToday: 0,
  },
];

const SEED_HACCP_TEMP_LOGS: HaccpTemperatureRecord[] = [
  {
    id: 'haccp_01',
    hotelId: 'htl_grand_rift',
    outletId: 'out_main_dining',
    logType: 'walk_in_chiller',
    unitName: 'Walk-In Butchery Meat Chiller #1',
    temperatureC: 2.4,
    targetMinC: 0.0,
    targetMaxC: 4.0,
    status: 'compliant',
    loggedBy: 'Chef Dawit Mengesha',
    loggedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'haccp_02',
    hotelId: 'htl_grand_rift',
    outletId: 'out_main_dining',
    logType: 'walk_in_freezer',
    unitName: 'Walk-In Seafood Deep Freezer #2',
    temperatureC: -19.5,
    targetMinC: -22.0,
    targetMaxC: -18.0,
    status: 'compliant',
    loggedBy: 'Sous Chef Aster',
    loggedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'haccp_03',
    hotelId: 'htl_grand_rift',
    outletId: 'out_main_dining',
    logType: 'hot_holding_buffet',
    unitName: 'Crater Lake Breakfast Buffet Hot Holding #A',
    temperatureC: 68.5,
    targetMinC: 63.0,
    targetMaxC: 85.0,
    status: 'compliant',
    loggedBy: 'Demi Chef Tilahun',
    loggedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'haccp_04',
    hotelId: 'htl_grand_rift',
    outletId: 'out_banquets',
    logType: 'hot_holding_buffet',
    unitName: 'Grand Ballroom Banquet Chafing Line #3',
    temperatureC: 59.0,
    targetMinC: 63.0,
    targetMaxC: 85.0,
    status: 'critical_breach',
    loggedBy: 'Banquet Steward Henok',
    loggedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    correctiveActionTaken: 'Temperature below 63°C legal threshold. Water pan refilled with boiling water, sterno burners doubled. Temperature reached 67.5°C within 12 minutes.',
  },
  {
    id: 'haccp_05',
    hotelId: 'htl_grand_rift',
    outletId: 'out_main_dining',
    logType: 'dishwasher_sanitizing',
    unitName: 'Winterhalter Flight Dishwasher Final Rinse Cycle',
    temperatureC: 84.5,
    targetMinC: 82.0,
    targetMaxC: 90.0,
    status: 'compliant',
    loggedBy: 'Chief Steward Michael',
    loggedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'haccp_06',
    hotelId: 'htl_grand_rift',
    outletId: 'out_main_dining',
    logType: 'food_core_cooking',
    unitName: 'Roasted Borana Prime Ribeye Core Probe',
    temperatureC: 75.0,
    targetMinC: 72.0,
    targetMaxC: 85.0,
    status: 'compliant',
    loggedBy: 'Executive Chef Samuel',
    loggedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const SEED_POOL_WATER_LOGS: PoolWaterQualityLog[] = [
  {
    id: 'pool_01',
    hotelId: 'htl_grand_rift',
    poolLocation: 'infinity_main_pool',
    waterTemperatureC: 27.5,
    phLevel: 7.35,
    freeChlorinePpm: 1.8,
    totalAlkalinityPpm: 105,
    turbidityNtu: 0.25,
    status: 'safe_for_swimming',
    testedBy: 'Pool Supervisor Solomon',
    testedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    chemicalDosageNotes: 'Water crystal clear. Automated sodium hypochlorite dosing active. Ideal bather safety.',
  },
  {
    id: 'pool_02',
    hotelId: 'htl_grand_rift',
    poolLocation: 'villa_private_plunge',
    waterTemperatureC: 29.0,
    phLevel: 7.42,
    freeChlorinePpm: 2.1,
    totalAlkalinityPpm: 95,
    turbidityNtu: 0.18,
    status: 'safe_for_swimming',
    testedBy: 'Pool Attendant Binyam',
    testedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'pool_03',
    hotelId: 'htl_grand_rift',
    poolLocation: 'kids_splash_pool',
    waterTemperatureC: 28.5,
    phLevel: 7.82,
    freeChlorinePpm: 0.8,
    totalAlkalinityPpm: 130,
    turbidityNtu: 0.42,
    status: 'chemical_adjustment_needed',
    testedBy: 'Pool Supervisor Solomon',
    testedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    chemicalDosageNotes: 'pH elevated at 7.82 and free chlorine low at 0.8 ppm. Added 1.2 kg sodium bisulfate dry acid and 400ml liquid chlorine. Re-testing scheduled in 60 mins.',
  },
  {
    id: 'pool_04',
    hotelId: 'htl_grand_rift',
    poolLocation: 'spa_hydrotherapy_pool',
    waterTemperatureC: 36.5,
    phLevel: 7.40,
    freeChlorinePpm: 2.5,
    totalAlkalinityPpm: 100,
    turbidityNtu: 0.22,
    status: 'safe_for_swimming',
    testedBy: 'Spa Hydrotherapist Helen',
    testedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    chemicalDosageNotes: 'Bromine / chlorine combination sanitized. Temperature maintained at therapeutic 36.5°C.',
  },
];

const SEED_HYGIENE_AUDITS: HygieneAuditChecklist[] = [
  {
    id: 'aud_01',
    hotelId: 'htl_grand_rift',
    area: 'Main Kitchen Butchery & Cold Larder',
    auditDate: '2026-11-08',
    auditorName: 'Dr. Almaz Bekele (HACCP Lead Auditor)',
    overallScore: 96,
    criticalNonConformances: 0,
    status: 'passed',
    findings: 'Impeccable color-coded cutting board protocol, FIFO stock rotation active, sanitized stainless steel workbenches, calibrated probe thermometers.',
  },
  {
    id: 'aud_02',
    hotelId: 'htl_grand_rift',
    area: 'Pastry & Continental Bakery Kitchen',
    auditDate: '2026-11-05',
    auditorName: 'Dr. Almaz Bekele (HACCP Lead Auditor)',
    overallScore: 92,
    criticalNonConformances: 0,
    status: 'passed',
    findings: 'All flour silos sealed, egg refrigeration logged at +3°C, clean proofing cabinets. Flour dust extraction ventilation filter cleaned.',
  },
  {
    id: 'aud_03',
    hotelId: 'htl_grand_rift',
    area: 'Poolside Grill & Bar Service Counter',
    auditDate: '2026-11-02',
    auditorName: 'Dr. Almaz Bekele (HACCP Lead Auditor)',
    overallScore: 84,
    criticalNonConformances: 1,
    status: 're_inspection_required',
    findings: '1 critical non-conformance: Ice scoop left directly inside ice maker bin without protective bracket. Corrected immediately on-site; re-inspection passed.',
  },
];

const SEED_PARKING_BAYS: ParkingBay[] = [
  {
    id: 'bay_01',
    hotelId: 'htl_grand_rift',
    bayCode: 'VIP-01',
    zone: 'Porte-Cochère Front',
    bayType: 'vip_presidential',
    status: 'occupied',
    currentVehiclePlate: 'ET-3-A49201',
    hasEvCharger: false,
  },
  {
    id: 'bay_02',
    hotelId: 'htl_grand_rift',
    bayCode: 'VIP-02',
    zone: 'Porte-Cochère Front',
    bayType: 'vip_presidential',
    status: 'available',
    hasEvCharger: false,
  },
  {
    id: 'bay_03',
    hotelId: 'htl_grand_rift',
    bayCode: 'EV-01',
    zone: 'Main Resort Entrance Lot',
    bayType: 'ev_charging',
    status: 'occupied',
    currentVehiclePlate: 'ET-2-B88102',
    hasEvCharger: true,
    evChargerPowerKw: 22.0,
  },
  {
    id: 'bay_04',
    hotelId: 'htl_grand_rift',
    bayCode: 'EV-02',
    zone: 'Main Resort Entrance Lot',
    bayType: 'ev_charging',
    status: 'available',
    hasEvCharger: true,
    evChargerPowerKw: 22.0,
  },
  {
    id: 'bay_05',
    hotelId: 'htl_grand_rift',
    bayCode: 'RES-05',
    zone: 'East Guest Wing Canopy',
    bayType: 'hotel_resident',
    status: 'occupied',
    currentVehiclePlate: 'ET-3-C11940',
    hasEvCharger: false,
  },
  {
    id: 'bay_06',
    hotelId: 'htl_grand_rift',
    bayCode: 'RES-06',
    zone: 'East Guest Wing Canopy',
    bayType: 'hotel_resident',
    status: 'available',
    hasEvCharger: false,
  },
  {
    id: 'bay_07',
    hotelId: 'htl_grand_rift',
    bayCode: 'BANQ-10',
    zone: 'Convention Center South',
    bayType: 'banquet_visitor',
    status: 'available',
    hasEvCharger: false,
  },
  {
    id: 'bay_08',
    hotelId: 'htl_grand_rift',
    bayCode: 'ACC-01',
    zone: 'Main Entrance Ramp',
    bayType: 'accessible',
    status: 'available',
    hasEvCharger: false,
  },
];

const SEED_VALET_TICKETS: ValetTicket[] = [
  {
    id: 'val_01',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'VAL-8821',
    guestName: 'Ambassador Marcus Vance',
    roomNumber: '402',
    phoneNumber: '+251 911 234567',
    vehicleMakeModel: 'Toyota Land Cruiser V8 (Black Metallic)',
    licensePlate: 'ET-3-A49201',
    assignedBayCode: 'VIP-01',
    keyPegSlot: 'Key Box Slot #01',
    status: 'parked',
    conditionDamageNotes: 'Vehicle immaculate. VIP Diplomatic flag mount on right fender.',
    checkedInAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    valetAttendant: 'Kassahun (Lead Valet)',
  },
  {
    id: 'val_02',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'VAL-8822',
    guestName: 'Dr. Sarah Jenkins',
    roomNumber: '101',
    phoneNumber: '+251 912 345678',
    vehicleMakeModel: 'Mercedes-Benz GLE 450 (White)',
    licensePlate: 'ET-2-B88102',
    assignedBayCode: 'EV-01',
    keyPegSlot: 'Key Box Slot #04',
    status: 'staged_at_curb',
    conditionDamageNotes: 'Minor stone chip on front passenger bumper pre-existing.',
    checkedInAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    retrievalRequestedAt: new Date(Date.now() - 600000).toISOString(),
    valetAttendant: 'Desta (Valet Runner)',
  },
  {
    id: 'val_03',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'VAL-8823',
    guestName: 'Ato Yonas Gebre',
    roomNumber: '118',
    phoneNumber: '+251 920 887766',
    vehicleMakeModel: 'Range Rover Velar (Silver)',
    licensePlate: 'ET-3-C11940',
    assignedBayCode: 'RES-05',
    keyPegSlot: 'Key Box Slot #08',
    status: 'retrieval_requested',
    conditionDamageNotes: 'Clean condition.',
    checkedInAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    retrievalRequestedAt: new Date(Date.now() - 300000).toISOString(),
    valetAttendant: 'Kassahun (Lead Valet)',
  },
  {
    id: 'val_04',
    hotelId: 'htl_grand_rift',
    ticketNumber: 'VAL-8819',
    guestName: 'Sample Guest A',
    roomNumber: '205',
    phoneNumber: '+251 930 112233',
    vehicleMakeModel: 'Audi Q7 (Dark Blue)',
    licensePlate: 'ET-2-D44550',
    assignedBayCode: 'RES-02',
    keyPegSlot: 'Key Box Slot #12',
    status: 'completed',
    checkedInAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    valetAttendant: 'Desta (Valet Runner)',
  },
];

const SEED_EV_CHARGING_SESSIONS: EvChargingSession[] = [
  {
    id: 'ev_01',
    hotelId: 'htl_grand_rift',
    bayCode: 'EV-01',
    guestName: 'Dr. Sarah Jenkins',
    roomNumber: '101',
    vehiclePlate: 'ET-2-B88102',
    kwhDelivered: 34.5,
    ratePerKwh: 18.0,
    totalChargeEtb: 621.0,
    sessionStatus: 'billed_to_folio',
    startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ev_02',
    hotelId: 'htl_grand_rift',
    bayCode: 'EV-02',
    guestName: 'Tewodros Kassahun',
    roomNumber: '210',
    vehiclePlate: 'ET-3-E99014',
    kwhDelivered: 48.0,
    ratePerKwh: 18.0,
    totalChargeEtb: 864.0,
    sessionStatus: 'charging',
    startedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'ev_03',
    hotelId: 'htl_grand_rift',
    bayCode: 'EV-01',
    guestName: 'Sophie Van Der Meer',
    roomNumber: '104',
    vehiclePlate: 'ET-2-F12300',
    kwhDelivered: 28.0,
    ratePerKwh: 18.0,
    totalChargeEtb: 504.0,
    sessionStatus: 'completed',
    startedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

const SEED_CASHIER_DROPS: CashierDropRecord[] = [
  {
    id: 'drop_01',
    hotelId: 'htl_grand_rift',
    cashierName: 'Alemayehu Tadesse',
    outletName: 'Rift Valley Main Dining Room',
    shift: 'morning',
    expectedSystemAmount: 48200,
    actualDropAmount: 48200,
    varianceAmount: 0,
    currency: 'ETB',
    status: 'balanced',
    notes: 'Shift closed without discrepancy. Envelope signed by Head Waiter.',
  },
  {
    id: 'drop_02',
    hotelId: 'htl_grand_rift',
    cashierName: 'Meron Hailu',
    outletName: 'Highland Lounge & Terrace',
    shift: 'evening',
    expectedSystemAmount: 32450,
    actualDropAmount: 32450,
    varianceAmount: 0,
    currency: 'ETB',
    status: 'balanced',
    notes: 'POS shift balanced against terminal settlement slips.',
  },
  {
    id: 'drop_03',
    hotelId: 'htl_grand_rift',
    cashierName: 'Binyam Assefa',
    outletName: 'Front Desk Cashier Till #1',
    shift: 'graveyard',
    expectedSystemAmount: 15000,
    actualDropAmount: 14800,
    varianceAmount: -200,
    currency: 'ETB',
    status: 'short',
    notes: 'Discrepancy investigated: 200 ETB change discrepancy on late check-in payment.',
  },
  {
    id: 'drop_04',
    hotelId: 'htl_grand_rift',
    cashierName: 'Hiwot Kebede',
    outletName: 'Oasis Poolside Bar & Grill',
    shift: 'evening',
    expectedSystemAmount: 19800,
    actualDropAmount: 19950,
    varianceAmount: 150,
    currency: 'ETB',
    status: 'over',
    notes: 'Unclaimed cash tip rounded in till drawer.',
  },
];

const SEED_HIGH_BALANCE_ALERTS: HighBalanceAlert[] = [
  {
    id: 'hb_01',
    hotelId: 'htl_grand_rift',
    guestName: 'Amb. Haile Gebrselassie',
    roomNumber: '501',
    currentFolioBalance: 142500,
    creditLimit: 100000,
    paymentMethod: 'CBE Direct Corporate Bill',
    riskSeverity: 'high',
    actionTaken: 'Corporate LPO checked with Ministry protocol officer.',
  },
  {
    id: 'hb_02',
    hotelId: 'htl_grand_rift',
    guestName: 'Diplomatic Delegation (UN ECA)',
    roomNumber: '408',
    currentFolioBalance: 88400,
    creditLimit: 50000,
    paymentMethod: 'Visa International',
    riskSeverity: 'critical',
  },
  {
    id: 'hb_03',
    hotelId: 'htl_grand_rift',
    guestName: 'Dr. Mark Lindqvist',
    roomNumber: '304',
    currentFolioBalance: 54200,
    creditLimit: 40000,
    paymentMethod: 'Telebirr SuperApp',
    riskSeverity: 'moderate',
    actionTaken: 'Sent courtesy WhatsApp payment prompt to guest.',
  },
];

const SEED_NIGHT_AUDIT_JOURNALS: NightAuditJournal[] = [
  {
    id: 'naj_01',
    hotelId: 'htl_grand_rift',
    auditDate: '2026-11-10',
    executedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    auditorName: 'Dawit Mengistu',
    auditorRole: 'Senior Night Auditor',
    roomsAvailable: 100,
    roomsOccupied: 84,
    occupancyRate: 84.0,
    complimentaryRooms: 2,
    outOfOrderRooms: 3,
    totalRoomRevenue: 462000,
    totalFnBRevenue: 198400,
    totalOtherRevenue: 64200,
    totalGrossRevenue: 724600,
    totalServiceCharge: 72460,
    totalVat: 108690,
    adr: 5500,
    revpar: 4620,
    guestFoliosPostedCount: 84,
    cashierDiscrepancyTotal: -50,
    status: 'finalized',
  },
  {
    id: 'naj_02',
    hotelId: 'htl_grand_rift',
    auditDate: '2026-11-09',
    executedAt: new Date(Date.now() - 3600000 * 46).toISOString(),
    auditorName: 'Dawit Mengistu',
    auditorRole: 'Senior Night Auditor',
    roomsAvailable: 100,
    roomsOccupied: 81,
    occupancyRate: 81.0,
    complimentaryRooms: 2,
    outOfOrderRooms: 3,
    totalRoomRevenue: 445500,
    totalFnBRevenue: 187200,
    totalOtherRevenue: 59300,
    totalGrossRevenue: 692000,
    totalServiceCharge: 69200,
    totalVat: 103800,
    adr: 5500,
    revpar: 4455,
    guestFoliosPostedCount: 81,
    cashierDiscrepancyTotal: 0,
    status: 'finalized',
  },
];

const SEED_SHIFT_HANDOVERS: ShiftHandoverEntry[] = [
  {
    id: 'sho_01',
    hotelId: 'htl_grand_rift',
    date: '2026-11-11',
    shift: 'morning',
    outgoingSupervisor: 'Dawit Haile (Morning Duty Mgr)',
    incomingSupervisor: 'Bethlehem Kebede (Evening Duty Mgr)',
    acknowledgedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    category: 'vip_movement',
    priority: 'critical',
    roomNumber: '501',
    subject: 'VIP Diplomatic Convoy - Amb. Gebrselassie Suite Inspection',
    description: 'Ambassador and 6 aides checked in. Requested strict privacy. Fresh floral arrangement & bespoke honey pastries placed in salon.',
    actionRequired: 'Ensure 24/7 designated butler on standby and keep Porte-Cochère lane 1 reserved for motorcade.',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'sho_02',
    hotelId: 'htl_grand_rift',
    date: '2026-11-11',
    shift: 'morning',
    outgoingSupervisor: 'Dawit Haile (Morning Duty Mgr)',
    incomingSupervisor: 'Bethlehem Kebede (Evening Duty Mgr)',
    acknowledgedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    category: 'maintenance_defect',
    priority: 'high_attention',
    roomNumber: '304',
    subject: 'VRF Climate Valve Calibration Delay',
    description: 'Guest noted slight cooling latency during peak afternoon sun. Maintenance swapped actuator valve.',
    actionRequired: 'Follow up with guest at 18:00 to verify room ambient holds at 21.5°C comfortably.',
    status: 'pending_action',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'sho_03',
    hotelId: 'htl_grand_rift',
    date: '2026-11-10',
    shift: 'graveyard',
    outgoingSupervisor: 'Yonas Tsegaye (Night Auditor)',
    incomingSupervisor: 'Dawit Haile (Morning Duty Mgr)',
    acknowledgedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    category: 'general_operations',
    priority: 'routine',
    subject: 'Airport Shuttle #2 Brake Pad Scheduled Servicing Complete',
    description: 'Mercedes Sprinter returned from authorized dealer workshop with new ceramic pads and full inspection stamp.',
    actionRequired: 'Vehicle released to active fleet rotation for 10:00 airport shuttle run.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const SEED_RAPID_SERVICE_TASKS: RapidServiceTask[] = [
  {
    id: 'rst_01',
    hotelId: 'htl_grand_rift',
    taskCode: 'TASK-4091',
    roomNumber: '402',
    guestName: 'Madame Charlotte Dubois',
    targetDepartment: 'housekeeping',
    taskDescription: 'Deliver 2 extra hypoallergenic down pillows & luxury bath linen set',
    priority: 'high_20m',
    slaMinutes: 20,
    dispatchedBy: 'Front Desk (Hanna)',
    assignedRunner: 'Sara M. (Floor 4 Housekeeper)',
    status: 'in_transit',
    dispatchedAt: new Date(Date.now() - 60000 * 11).toISOString(),
  },
  {
    id: 'rst_02',
    hotelId: 'htl_grand_rift',
    taskCode: 'TASK-4092',
    roomNumber: '215',
    guestName: 'Prof. Almaz Wondimu',
    targetDepartment: 'concierge_bell',
    taskDescription: 'Luggage porter assistance for airport express departure & load into taxi',
    priority: 'urgent_10m',
    slaMinutes: 10,
    dispatchedBy: 'Concierge Desk',
    assignedRunner: 'Desta K. (Bell Staff)',
    status: 'dispatched',
    dispatchedAt: new Date(Date.now() - 60000 * 4).toISOString(),
  },
  {
    id: 'rst_03',
    hotelId: 'htl_grand_rift',
    taskCode: 'TASK-4089',
    roomNumber: '304',
    guestName: 'Dr. Mark Lindqvist',
    targetDepartment: 'housekeeping',
    taskDescription: 'Install wooden baby cot with organic cotton nursery sheets',
    priority: 'standard_30m',
    slaMinutes: 30,
    dispatchedBy: 'Front Desk',
    assignedRunner: 'Bethlehem T. (Housekeeping Lead)',
    status: 'completed',
    dispatchedAt: new Date(Date.now() - 60000 * 35).toISOString(),
    completedAt: new Date(Date.now() - 60000 * 8).toISOString(),
    resolutionNotes: 'Crib placed in master suite corner, guest inspected and expressed gratitude.',
  },
  {
    id: 'rst_04',
    hotelId: 'htl_grand_rift',
    taskCode: 'TASK-4088',
    roomNumber: '501',
    guestName: 'Amb. Haile Gebrselassie',
    targetDepartment: 'engineering',
    taskDescription: 'Provide high-speed HDMI 2.1 cable & presentation remote for suite boardroom display',
    priority: 'high_20m',
    slaMinutes: 20,
    dispatchedBy: 'Duty Manager (Dawit)',
    assignedRunner: 'Yosef B. (AV Tech)',
    status: 'accepted',
    dispatchedAt: new Date(Date.now() - 60000 * 16).toISOString(),
  },
  {
    id: 'rst_05',
    hotelId: 'htl_grand_rift',
    taskCode: 'TASK-4085',
    roomNumber: '108',
    guestName: 'Abebe Bikila Jr.',
    targetDepartment: 'room_service',
    taskDescription: 'Thermos of hot spiced milk, raw Wenchi honey, and ginger oat biscuits',
    priority: 'standard_30m',
    slaMinutes: 30,
    dispatchedBy: 'In-Room Dining Order Desk',
    assignedRunner: 'Henok G. (Butler)',
    status: 'verified',
    dispatchedAt: new Date(Date.now() - 60000 * 55).toISOString(),
    completedAt: new Date(Date.now() - 60000 * 25).toISOString(),
    resolutionNotes: 'Delivered and signed on room folio.',
  },
];

const SEED_STAFF_BROADCAST_ALERTS: StaffBroadcastAlert[] = [
  {
    id: 'sba_01',
    hotelId: 'htl_grand_rift',
    title: 'VIP Ministerial Delegation Convoy Arriving at 14:30',
    message: 'Porte-Cochère lane 1 must remain completely cleared of valet parking. Security guards to be stationed at North Gate. Executive chef tasting platter ready for Presidential Suite.',
    category: 'vip_protocol',
    senderName: 'General Manager (Solomon K.)',
    senderRole: 'General Manager',
    targetAudience: 'All Departments',
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    acknowledgedCount: 38,
  },
  {
    id: 'sba_02',
    hotelId: 'htl_grand_rift',
    title: 'Primary Boiler Loop Preventive De-scaling Tonight at 23:30',
    message: 'Secondary backup calorifier will maintain 55°C domestic hot water across East Guest Wing. Minimal pressure drop expected for 15 minutes.',
    category: 'operations',
    senderName: 'Chief Engineer (Eng. Girma)',
    senderRole: 'Director of Engineering',
    targetAudience: 'Front Office & Maintenance',
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    acknowledgedCount: 16,
  },
  {
    id: 'sba_03',
    hotelId: 'htl_grand_rift',
    title: 'Severe Afternoon Rain Warning - Secure Outdoor Terrace Furniture',
    message: 'Rift valley squall forecasted between 16:00 and 17:30. Pool attendants and lounge stewards please stow cushions, fold canvas umbrellas, and secure lakeside marquee.',
    category: 'weather_alert',
    senderName: 'Security & Safety Lead',
    senderRole: 'Security Director',
    targetAudience: 'F&B, Housekeeping & Security',
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    acknowledgedCount: 42,
  },
];

const SEED_CORPORATE_ACCOUNTS: CorporateAccount[] = [
  {
    id: 'corp_01',
    hotelId: 'htl_grand_rift',
    accountCode: 'UN-ECA-001',
    companyName: 'UN Economic Commission for Africa (UNECA)',
    accountType: 'ngo_un',
    taxTinNumber: 'ET-NGO-0049128',
    contactPerson: 'Amina Mohammed (Protocol Desk)',
    contactEmail: 'protocol.travel@uneca.org',
    contactPhone: '+251 11 544 5000',
    creditLimitEtb: 1500000,
    currentBalanceEtb: 485000,
    paymentTermsDays: 30,
    negotiatedRateDiscountPercent: 20,
    contractedRoomRateEtb: 4400,
    status: 'active',
    contractExpiryDate: '2027-06-30',
    notes: 'Standing LPO master agreement for visiting delegates and symposium conferences.',
  },
  {
    id: 'corp_02',
    hotelId: 'htl_grand_rift',
    accountCode: 'AIR-ET-002',
    companyName: 'Ethiopian Airlines Group — Flight Crew Ops',
    accountType: 'airline_crew',
    taxTinNumber: '0000419283',
    contactPerson: 'Capt. Tewodros Bekele',
    contactEmail: 'crew.accomm@ethiopianairlines.com',
    contactPhone: '+251 11 517 8900',
    creditLimitEtb: 2000000,
    currentBalanceEtb: 612000,
    paymentTermsDays: 45,
    negotiatedRateDiscountPercent: 35,
    contractedRoomRateEtb: 3575,
    status: 'active',
    contractExpiryDate: '2027-12-31',
    notes: 'Daily guaranteed 12-room crew block + early breakfast buffet allowance.',
  },
  {
    id: 'corp_03',
    hotelId: 'htl_grand_rift',
    accountCode: 'EMB-UK-003',
    companyName: 'British Embassy Addis Ababa',
    accountType: 'embassy_diplomatic',
    taxTinNumber: 'DIP-UK-9910',
    contactPerson: 'Claire Whitmore (First Secretary Ops)',
    contactEmail: 'accounts.addis@fcdo.gov.uk',
    contactPhone: '+251 11 617 0100',
    creditLimitEtb: 800000,
    currentBalanceEtb: 142500,
    paymentTermsDays: 30,
    negotiatedRateDiscountPercent: 15,
    contractedRoomRateEtb: 4675,
    status: 'active',
    contractExpiryDate: '2027-03-31',
    notes: 'VAT-exempt diplomatic protocol letter on file.',
  },
  {
    id: 'corp_04',
    hotelId: 'htl_grand_rift',
    accountCode: 'TO-SAF-004',
    companyName: 'Abyssinia Heritage & Rift Tours',
    accountType: 'tour_operator',
    taxTinNumber: '0048192044',
    contactPerson: 'Mekonnen Abebe',
    contactEmail: 'bookings@abyssiniaheritage.com',
    contactPhone: '+251 911 234 890',
    creditLimitEtb: 400000,
    currentBalanceEtb: 386000,
    paymentTermsDays: 15,
    negotiatedRateDiscountPercent: 18,
    contractedRoomRateEtb: 4510,
    status: 'credit_hold',
    contractExpiryDate: '2026-12-31',
    notes: '96.5% credit limit utilized; settle Invoice CL-2026-0812 before next group check-in.',
  },
  {
    id: 'corp_05',
    hotelId: 'htl_grand_rift',
    accountCode: 'OTA-CHN-005',
    companyName: 'OTA Channel A (Agency Account)',
    accountType: 'travel_agency',
    taxTinNumber: 'NL-805734958B01',
    contactPerson: 'Partner Finance Support',
    contactEmail: 'finance@ota-channel-a.example',
    contactPhone: '+31 20 712 5600',
    creditLimitEtb: 1200000,
    currentBalanceEtb: 94000,
    paymentTermsDays: 30,
    negotiatedRateDiscountPercent: 0,
    contractedRoomRateEtb: 5500,
    status: 'active',
    contractExpiryDate: '2028-01-01',
  },
];

const SEED_CITY_LEDGER_INVOICES: CityLedgerInvoice[] = [
  {
    id: 'cli_01',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'CL-2026-0841',
    accountId: 'corp_01',
    companyName: 'UN Economic Commission for Africa (UNECA)',
    guestOrGroupName: 'African Climate Policy Symposium (14 Delegates)',
    folioReference: 'GRP-ECA-409',
    issueDate: '2026-10-28',
    dueDate: '2026-11-27',
    agingDays: 15,
    totalAmountEtb: 485000,
    paidAmountEtb: 0,
    balanceDueEtb: 485000,
    status: 'open',
    lpoReference: 'LPO-UNECA-2026-883',
    payments: [],
  },
  {
    id: 'cli_02',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'CL-2026-0835',
    accountId: 'corp_02',
    companyName: 'Ethiopian Airlines Group — Flight Crew Ops',
    guestOrGroupName: 'October Layover Crew Block (Batch B)',
    folioReference: 'BLK-ET-102',
    issueDate: '2026-10-18',
    dueDate: '2026-12-02',
    agingDays: 25,
    totalAmountEtb: 812000,
    paidAmountEtb: 200000,
    balanceDueEtb: 612000,
    status: 'partially_paid',
    lpoReference: 'ET-CREW-OCT-26',
    payments: [
      {
        id: 'clp_01',
        date: '2026-11-01',
        amountEtb: 200000,
        method: 'Commercial Bank of Ethiopia (CBE)',
        reference: 'FT2630599182',
        recordedBy: 'Finance Controller',
      },
    ],
  },
  {
    id: 'cli_03',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'CL-2026-0812',
    accountId: 'corp_04',
    companyName: 'Abyssinia Heritage & Rift Tours',
    guestOrGroupName: 'Danakil & Omo Valley Photo Expedition (9 Guests)',
    folioReference: 'GRP-ABY-118',
    issueDate: '2026-08-25',
    dueDate: '2026-09-09',
    agingDays: 79,
    totalAmountEtb: 386000,
    paidAmountEtb: 0,
    balanceDueEtb: 386000,
    status: 'overdue',
    lpoReference: 'ABY-VOUCH-771',
    lastReminderSentAt: '2026-11-05T10:15:00.000Z',
    payments: [],
  },
  {
    id: 'cli_04',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'CL-2026-0829',
    accountId: 'corp_03',
    companyName: 'British Embassy Addis Ababa',
    guestOrGroupName: 'Visiting Trade Envoy Suite & Conference Lunch',
    folioReference: 'FOL-501-UK',
    issueDate: '2026-10-05',
    dueDate: '2026-11-04',
    agingDays: 38,
    totalAmountEtb: 142500,
    paidAmountEtb: 0,
    balanceDueEtb: 142500,
    status: 'overdue',
    lpoReference: 'FCDO-PO-4410',
    payments: [],
  },
  {
    id: 'cli_05',
    hotelId: 'htl_grand_rift',
    invoiceNumber: 'CL-2026-0798',
    accountId: 'corp_05',
    companyName: 'OTA Channel A (Agency Account)',
    guestOrGroupName: 'Monthly Prepaid Agency Settlement',
    folioReference: 'OTA-OCT-SETTLE',
    issueDate: '2026-10-01',
    dueDate: '2026-10-31',
    agingDays: 42,
    totalAmountEtb: 294000,
    paidAmountEtb: 294000,
    balanceDueEtb: 0,
    status: 'settled',
    payments: [
      {
        id: 'clp_02',
        date: '2026-10-29',
        amountEtb: 294000,
        method: 'SWIFT International Wire',
        reference: 'OTA-WIRE-99402',
        recordedBy: 'AR Accountant',
      },
    ],
  },
];

const SEED_AGENCY_COMMISSIONS: AgencyCommissionRecord[] = [
  {
    id: 'agcom_01',
    hotelId: 'htl_grand_rift',
    agencyAccountId: 'corp_05',
    agencyName: 'OTA Channel A',
    bookingReference: 'OTA-49201847',
    guestName: 'Sample Guest A',
    stayDates: 'Nov 02 – Nov 06, 2026 (4 Nights)',
    roomRevenueEtb: 34000,
    commissionRatePercent: 15,
    commissionAmountEtb: 5100,
    withholdingTaxEtb: 102,
    netPayableEtb: 4998,
    status: 'approved_payable',
  },
  {
    id: 'agcom_02',
    hotelId: 'htl_grand_rift',
    agencyAccountId: 'corp_04',
    agencyName: 'Abyssinia Heritage & Rift Tours',
    bookingReference: 'ABY-2026-991',
    guestName: 'Hans & Ingrid Muller',
    stayDates: 'Nov 04 – Nov 09, 2026 (5 Nights)',
    roomRevenueEtb: 42500,
    commissionRatePercent: 10,
    commissionAmountEtb: 4250,
    withholdingTaxEtb: 85,
    netPayableEtb: 4165,
    status: 'pending_checkout',
  },
  {
    id: 'agcom_03',
    hotelId: 'htl_grand_rift',
    agencyAccountId: 'corp_05',
    agencyName: 'OTA Channel B',
    bookingReference: 'OTB-77829104',
    guestName: 'Marcus Vance',
    stayDates: 'Oct 21 – Oct 25, 2026 (4 Nights)',
    roomRevenueEtb: 28000,
    commissionRatePercent: 18,
    commissionAmountEtb: 5040,
    withholdingTaxEtb: 100.8,
    netPayableEtb: 4939.2,
    status: 'paid',
    payoutReference: 'CBE-WIRE-88412',
    paidAt: '2026-11-02T14:20:00.000Z',
  },
];

// Phase 26 Seed Data: Dining Floor Plan, Table Reservations & Wine Cellar
const SEED_DINING_TABLES: DiningTable[] = [
  {
    id: 'tbl_01',
    hotelId: 'htl_grand_rift',
    tableNumber: 'P-01',
    zone: 'abaya_panorama',
    seats: 2,
    status: 'seated',
    assignedServer: 'Hiwot Tadesse',
    currentGuestName: 'Sample Guest A',
    currentPartySize: 2,
    seatedAt: '19:15',
    notes: 'Window panorama seat · Room 201 resident',
  },
  {
    id: 'tbl_02',
    hotelId: 'htl_grand_rift',
    tableNumber: 'P-02',
    zone: 'abaya_panorama',
    seats: 4,
    status: 'available',
    assignedServer: 'Hiwot Tadesse',
    notes: 'Clear Lake Abaya sunset view',
  },
  {
    id: 'tbl_03',
    hotelId: 'htl_grand_rift',
    tableNumber: 'P-03',
    zone: 'abaya_panorama',
    seats: 4,
    status: 'reserved',
    assignedServer: 'Dawit Bekele',
    currentGuestName: 'Amb. Pierre Dupont',
    currentPartySize: 3,
    reservationId: 'dres_01',
    notes: 'Reserved for 20:00 VIP Diplomatic dinner',
  },
  {
    id: 'tbl_04',
    hotelId: 'htl_grand_rift',
    tableNumber: 'T-01',
    zone: 'lakeside_terrace',
    seats: 4,
    status: 'dessert_check',
    assignedServer: 'Bruk Tesfaye',
    currentGuestName: 'Yohannes Girma',
    currentPartySize: 3,
    seatedAt: '18:40',
    notes: 'Room 204 · Waiting on espresso & bill settlement',
  },
  {
    id: 'tbl_05',
    hotelId: 'htl_grand_rift',
    tableNumber: 'T-02',
    zone: 'lakeside_terrace',
    seats: 6,
    status: 'needs_bussing',
    assignedServer: 'Bruk Tesfaye',
    notes: 'Recently departed 5-top · Reset silverware & linen',
  },
  {
    id: 'tbl_06',
    hotelId: 'htl_grand_rift',
    tableNumber: 'T-03',
    zone: 'lakeside_terrace',
    seats: 2,
    status: 'available',
    assignedServer: 'Sara Alemu',
    notes: 'Firepit terrace corner',
  },
  {
    id: 'tbl_07',
    hotelId: 'htl_grand_rift',
    tableNumber: 'R-01',
    zone: 'rift_private_dining',
    seats: 10,
    status: 'reserved',
    assignedServer: 'Wine Cellar Lead Yohannes',
    currentGuestName: 'UNECA Executive Delegation',
    currentPartySize: 8,
    reservationId: 'dres_02',
    notes: 'Private wine tasting menu · Preset 20:30',
  },
  {
    id: 'tbl_08',
    hotelId: 'htl_grand_rift',
    tableNumber: 'L-01',
    zone: 'sunset_lounge',
    seats: 4,
    status: 'seated',
    assignedServer: 'Sara Alemu',
    currentGuestName: 'Dr. Almaz Kebede',
    currentPartySize: 2,
    seatedAt: '19:30',
    notes: 'Room 101 · Aperitif & tapas board',
  },
];

const SEED_DINING_RESERVATIONS: DiningReservation[] = [
  {
    id: 'dres_01',
    hotelId: 'htl_grand_rift',
    reservationCode: 'TBL-2026-401',
    guestName: 'Amb. Pierre Dupont',
    guestPhone: '+251 91 123 4567',
    roomNumber: '301',
    partySize: 3,
    reservationDate: '2026-11-12',
    timeSlot: '20:00',
    mealPeriod: 'dinner',
    preferredZone: 'abaya_panorama',
    assignedTableNumber: 'P-03',
    dietaryNotes: 'One pescatarian · No shellfish',
    vipOccasion: 'Diplomatic Protocol Dinner',
    status: 'confirmed',
    createdAt: '2026-11-12T10:15:00.000Z',
  },
  {
    id: 'dres_02',
    hotelId: 'htl_grand_rift',
    reservationCode: 'TBL-2026-402',
    guestName: 'UNECA Executive Delegation',
    guestPhone: '+251 11 544 5000',
    roomNumber: '101',
    partySize: 8,
    reservationDate: '2026-11-12',
    timeSlot: '20:30',
    mealPeriod: 'dinner',
    preferredZone: 'rift_private_dining',
    assignedTableNumber: 'R-01',
    dietaryNotes: '2 Gluten-Free, 1 Vegan',
    vipOccasion: 'Corporate Tasting & City Ledger Charge',
    status: 'confirmed',
    createdAt: '2026-11-12T08:30:00.000Z',
  },
  {
    id: 'dres_03',
    hotelId: 'htl_grand_rift',
    reservationCode: 'WL-2026-089',
    guestName: 'Marcus Vance & Party',
    guestPhone: '+251 92 778 4410',
    partySize: 4,
    reservationDate: '2026-11-12',
    timeSlot: '19:45',
    mealPeriod: 'dinner',
    preferredZone: 'lakeside_terrace',
    dietaryNotes: 'Prefers outdoor breeze',
    status: 'waitlist',
    estimatedWaitMinutes: 15,
    createdAt: '2026-11-12T19:35:00.000Z',
  },
  {
    id: 'dres_04',
    hotelId: 'htl_grand_rift',
    reservationCode: 'WL-2026-090',
    guestName: 'Sara Mengistu',
    guestPhone: '+251 92 884 1122',
    roomNumber: '105',
    partySize: 2,
    reservationDate: '2026-11-12',
    timeSlot: '19:50',
    mealPeriod: 'dinner',
    preferredZone: 'abaya_panorama',
    status: 'waitlist',
    estimatedWaitMinutes: 10,
    createdAt: '2026-11-12T19:40:00.000Z',
  },
];

const SEED_WINE_CELLAR_BOTTLES: WineCellarBottle[] = [
  {
    id: 'win_01',
    hotelId: 'htl_grand_rift',
    binCode: 'BIN-A01',
    wineName: 'Castel Grand Reserve Cabernet Sauvignon',
    producerRegion: 'Ziway Rift Valley, Ethiopia',
    vintageYear: '2021',
    category: 'red_reserve',
    bottleVolumeMl: 750,
    cellarTempC: 15.5,
    stockBottles: 28,
    reorderLevel: 10,
    glassPriceEtb: 480,
    bottlePriceEtb: 2450,
    tastingNotes: 'Blackcurrant, toasted Rift oak, velvety tannins pairing with prime ribeye.',
    lastInventoriedAt: '2026-11-12',
  },
  {
    id: 'win_02',
    hotelId: 'htl_grand_rift',
    binCode: 'BIN-A08',
    wineName: 'Awash Gebeta Reserve Syrah',
    producerRegion: 'Upper Awash Valley, Ethiopia',
    vintageYear: '2022',
    category: 'red_reserve',
    bottleVolumeMl: 750,
    cellarTempC: 15.5,
    stockBottles: 36,
    reorderLevel: 12,
    glassPriceEtb: 420,
    bottlePriceEtb: 1950,
    tastingNotes: 'Spiced plum, cracked black pepper, bright mineral finish.',
    lastInventoriedAt: '2026-11-12',
  },
  {
    id: 'win_03',
    hotelId: 'htl_grand_rift',
    binCode: 'BIN-B03',
    wineName: 'Domaine Vacheron Sancerre Blanc',
    producerRegion: 'Loire Valley, France',
    vintageYear: '2023',
    category: 'white_crisp',
    bottleVolumeMl: 750,
    cellarTempC: 9.0,
    stockBottles: 14,
    reorderLevel: 6,
    glassPriceEtb: 750,
    bottlePriceEtb: 4800,
    tastingNotes: 'Citrus zest, white peach, chalky minerality ideal for Lake Chamo tilapia.',
    lastInventoriedAt: '2026-11-12',
  },
  {
    id: 'win_04',
    hotelId: 'htl_grand_rift',
    binCode: 'BIN-C01',
    wineName: 'Moët & Chandon Impérial Brut',
    producerRegion: 'Épernay, Champagne, France',
    vintageYear: 'NV',
    category: 'sparkling_champagne',
    bottleVolumeMl: 750,
    cellarTempC: 7.5,
    stockBottles: 9,
    reorderLevel: 5,
    glassPriceEtb: 1650,
    bottlePriceEtb: 11800,
    tastingNotes: 'Green apple, brioche, crisp fine mousse for VIP celebrations.',
    lastInventoriedAt: '2026-11-12',
  },
  {
    id: 'win_05',
    hotelId: 'htl_grand_rift',
    binCode: 'BIN-E02',
    wineName: 'Royal Tigray White Blossom Barrel-Aged Tej',
    producerRegion: 'Northern Highlands, Ethiopia',
    vintageYear: '2024',
    category: 'ethiopian_tej_heritage',
    bottleVolumeMl: 750,
    cellarTempC: 11.0,
    stockBottles: 22,
    reorderLevel: 8,
    glassPriceEtb: 390,
    bottlePriceEtb: 1750,
    tastingNotes: 'Wildflower honey fermented with sun-dried Gesho hops in clay-lined oak.',
    lastInventoriedAt: '2026-11-12',
  },
  {
    id: 'win_06',
    hotelId: 'htl_grand_rift',
    binCode: 'BIN-S04',
    wineName: 'Glenfiddich 18 Year Small Batch Reserve',
    producerRegion: 'Speyside, Scotland',
    vintageYear: '18 YO',
    category: 'single_malt_spirits',
    bottleVolumeMl: 700,
    cellarTempC: 17.0,
    stockBottles: 4,
    reorderLevel: 5,
    glassPriceEtb: 1450,
    bottlePriceEtb: 18900,
    tastingNotes: 'Baked orchard apple, cinnamon oak, Oloroso sherry warmth.',
    lastInventoriedAt: '2026-11-12',
  },
];

// Phase 27 Seed Data: Group Room Blocks & Rooming Lists
const SEED_GROUP_BLOCKS: GroupBlock[] = [
  {
    id: 'grp_01',
    hotelId: 'htl_grand_rift',
    blockCode: 'GRP-UNECA-26',
    groupName: 'UNECA Regional Climate Summit Delegation',
    organizerName: 'Alemayehu Wolde (Protocol Liaison)',
    organizerPhone: '+251 11 544 5000',
    corporateAccountId: 'corp_01',
    category: 'corporate_summit',
    status: 'in_house',
    billingInstruction: 'master_bill_rooms_tax',
    checkInDate: '2026-11-11',
    checkOutDate: '2026-11-15',
    cutoffDate: '2026-11-08',
    roomCategoryName: 'Deluxe Lake View Room',
    negotiatedRateEtb: 3800,
    contractedRooms: 18,
    pickedUpRooms: 15,
    washedRooms: 3,
    estimatedRevenueEtb: 228000,
    depositPaidEtb: 90000,
    notes: 'Master Folio covers room & taxes; delegates settle bar/spa extras individually.',
  },
  {
    id: 'grp_02',
    hotelId: 'htl_grand_rift',
    blockCode: 'GRP-ABY-TOUR11',
    groupName: 'Abyssinia Heritage Rift Valley Safari Series',
    organizerName: 'Dawit Bekele (Tour Director)',
    organizerPhone: '+251 91 440 2290',
    corporateAccountId: 'corp_04',
    category: 'tour_series',
    status: 'definite',
    billingInstruction: 'master_bill_all_inclusive',
    checkInDate: '2026-11-14',
    checkOutDate: '2026-11-17',
    cutoffDate: '2026-11-13',
    roomCategoryName: 'Executive Rift Jacuzzi Suite',
    negotiatedRateEtb: 5800,
    contractedRooms: 12,
    pickedUpRooms: 9,
    washedRooms: 0,
    estimatedRevenueEtb: 156600,
    depositPaidEtb: 65000,
    notes: 'Includes half-board dining & packed Nechisar picnic hampers.',
  },
  {
    id: 'grp_03',
    hotelId: 'htl_grand_rift',
    blockCode: 'GRP-ET-CREW-NOV',
    groupName: 'Ethiopian Airlines Daily Flight Crew Rotation',
    organizerName: 'Capt. Meron Assefa (Crew Scheduling)',
    organizerPhone: '+251 11 517 8900',
    corporateAccountId: 'corp_02',
    category: 'airline_crew',
    status: 'in_house',
    billingInstruction: 'master_bill_rooms_tax',
    checkInDate: '2026-11-12',
    checkOutDate: '2026-11-13',
    cutoffDate: '2026-11-12',
    roomCategoryName: 'Standard Garden Wing',
    negotiatedRateEtb: 2900,
    contractedRooms: 8,
    pickedUpRooms: 8,
    washedRooms: 0,
    estimatedRevenueEtb: 23200,
    depositPaidEtb: 0,
    notes: 'Quiet wing rooms guaranteed · Late 15:00 checkout & airport shuttle.',
  },
  {
    id: 'grp_04',
    hotelId: 'htl_grand_rift',
    blockCode: 'GRP-ZWD-WED',
    groupName: 'Zewdu & Selamawit Lakeside Wedding Block',
    organizerName: 'Selamawit Tekle',
    organizerPhone: '+251 91 200 7788',
    category: 'wedding_social',
    status: 'tentative',
    billingInstruction: 'individual_own_account',
    checkInDate: '2026-11-20',
    checkOutDate: '2026-11-23',
    cutoffDate: '2026-11-15',
    roomCategoryName: 'Deluxe Lake View Room',
    negotiatedRateEtb: 3950,
    contractedRooms: 14,
    pickedUpRooms: 7,
    washedRooms: 0,
    estimatedRevenueEtb: 82950,
    depositPaidEtb: 25000,
    notes: '7 rooms still unpicked ahead of Nov 15 cutoff wash date.',
  },
];

const SEED_GROUP_ROOMING_GUESTS: GroupRoomingGuest[] = [
  {
    id: 'grm_01',
    hotelId: 'htl_grand_rift',
    groupBlockId: 'grp_01',
    blockCode: 'GRP-UNECA-26',
    guestName: 'Dr. Almaz Kebede',
    passportOrIdNumber: 'UNLP-884120',
    nationality: 'Ethiopian',
    roomCategoryName: 'Deluxe Lake View Room',
    assignedRoomNumber: '101',
    arrivalDate: '2026-11-11',
    departureDate: '2026-11-15',
    occupancyType: 'single',
    vipFlag: true,
    shuttleNeeded: true,
    dietaryNotes: 'Vegetarian options',
    status: 'checked_in',
  },
  {
    id: 'grm_02',
    hotelId: 'htl_grand_rift',
    groupBlockId: 'grp_01',
    blockCode: 'GRP-UNECA-26',
    guestName: 'Jean-Luc Moreau',
    passportOrIdNumber: 'FR-2291048',
    nationality: 'French',
    roomCategoryName: 'Deluxe Lake View Room',
    assignedRoomNumber: '104',
    arrivalDate: '2026-11-11',
    departureDate: '2026-11-15',
    occupancyType: 'single',
    vipFlag: false,
    shuttleNeeded: true,
    status: 'checked_in',
  },
  {
    id: 'grm_03',
    hotelId: 'htl_grand_rift',
    groupBlockId: 'grp_02',
    blockCode: 'GRP-ABY-TOUR11',
    guestName: 'Hans & Ingrid Muller',
    passportOrIdNumber: 'DE-C884129',
    nationality: 'German',
    roomCategoryName: 'Executive Rift Jacuzzi Suite',
    assignedRoomNumber: '203',
    arrivalDate: '2026-11-14',
    departureDate: '2026-11-17',
    occupancyType: 'double',
    vipFlag: true,
    shuttleNeeded: true,
    dietaryNotes: 'No shellfish',
    status: 'room_assigned',
  },
  {
    id: 'grm_04',
    hotelId: 'htl_grand_rift',
    groupBlockId: 'grp_02',
    blockCode: 'GRP-ABY-TOUR11',
    guestName: 'Claire & Thomas Bennett',
    passportOrIdNumber: 'UK-5541920',
    nationality: 'British',
    roomCategoryName: 'Executive Rift Jacuzzi Suite',
    arrivalDate: '2026-11-14',
    departureDate: '2026-11-17',
    occupancyType: 'twin',
    vipFlag: false,
    shuttleNeeded: true,
    status: 'pending_assignment',
  },
  {
    id: 'grm_05',
    hotelId: 'htl_grand_rift',
    groupBlockId: 'grp_04',
    blockCode: 'GRP-ZWD-WED',
    guestName: 'Bereket & Rahel Tadesse',
    passportOrIdNumber: 'ET-992014',
    nationality: 'Ethiopian',
    roomCategoryName: 'Deluxe Lake View Room',
    arrivalDate: '2026-11-20',
    departureDate: '2026-11-23',
    occupancyType: 'double',
    vipFlag: true,
    shuttleNeeded: false,
    status: 'pending_assignment',
  },
];

// Helper to safely read and write JSON to localStorage
function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    firestoreSync.pushBucketWrite(key, value);
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export class SaaSStorageService {
  private static instance: SaaSStorageService;
  private syncListeners = new Set<() => void>();
  private hashesReadyPromise: Promise<void> | null = null;
  private currentLanguage: 'en' | 'am' =
    typeof localStorage !== 'undefined' && localStorage.getItem('seam_lang') === 'am' ? 'am' : 'en';

  private constructor() {
    this.ensureInitialized();
    this.hashesReadyPromise = this.ensureDefaultPasswordHashes();
    firestoreSync.registerHydrator((key, records) => {
      try {
        localStorage.setItem(key, JSON.stringify(records));
        this.notifySyncListeners();
      } catch (err) {
        console.error(`Error hydrating ${key} from Firestore:`, err);
      }
    });
  }

  public async ensureCredentialHashesReady(): Promise<void> {
    if (!this.hashesReadyPromise) {
      this.hashesReadyPromise = this.ensureDefaultPasswordHashes();
    }
    await this.hashesReadyPromise;
  }

  private async ensureDefaultPasswordHashes(): Promise<void> {
    try {
      const superHash = await hashSecret('SeamSuper#2026');
      const hotelHash = await hashSecret('SeamHotel#2026');

      const platformUsers = readStorage<PlatformUser[]>(STORAGE_KEYS.PLATFORM_USERS, []);
      let platformChanged = false;
      const updatedPlatform = platformUsers.map((pu) => {
        if (pu.email.toLowerCase() === 'admin@seam.io' && !pu.passwordHash) {
          platformChanged = true;
          return { ...pu, passwordHash: superHash };
        }
        return pu;
      });
      if (platformChanged) {
        localStorage.setItem(STORAGE_KEYS.PLATFORM_USERS, JSON.stringify(updatedPlatform));
      }

      const hotelUsers = readStorage<HotelUser[]>(STORAGE_KEYS.USERS, []);
      let hotelChanged = false;
      const updatedHotelUsers = hotelUsers.map((hu) => {
        if (!hu.passwordHash && hu.id.startsWith('usr_')) {
          hotelChanged = true;
          return { ...hu, passwordHash: hotelHash };
        }
        return hu;
      });
      if (hotelChanged) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedHotelUsers));
      }
    } catch (err) {
      console.error('Failed to backfill credential hashes:', err);
    }
  }

  public static getInstance(): SaaSStorageService {
    if (!SaaSStorageService.instance) {
      SaaSStorageService.instance = new SaaSStorageService();
    }
    return SaaSStorageService.instance;
  }

  public subscribeSync(listener: () => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifySyncListeners(): void {
    this.syncListeners.forEach((cb) => cb());
  }

  public getAllBucketKeys(): string[] {
    return Object.values(STORAGE_KEYS).filter((k) => !k.endsWith('_'));
  }

  public readRawBucket(key: string): unknown {
    return readStorage<unknown>(key, []);
  }

  public getCurrentLanguage(): 'en' | 'am' {
    return this.currentLanguage;
  }

  public setCurrentLanguage(lang: 'en' | 'am'): void {
    this.currentLanguage = lang;
  }

  public ensureInitialized(): void {
    if (!localStorage.getItem(STORAGE_KEYS.HOTELS)) {
      const seedHotels: Hotel[] = [
        {
          id: 'htl_grand_rift',
          name: 'Sample Property A',
          legalName: 'Sample Property A Hospitality PLC',
          code: 'SPA',
          address: {
            street: 'Lakeside Boulevard 14',
            city: 'Arba Minch',
            stateRegion: 'South Ethiopia',
            country: 'Ethiopia',
          },
          contact: {
            phone: '+251 46 881 2400',
            email: 'info@property-a.example',
            website: 'https://property-a.example',
          },
          operationalSettings: {
            currency: 'ETB',
            currencySymbol: 'Br',
            timeZone: 'Africa/Addis_Ababa',
            defaultLanguage: 'en',
            fiscalYearStartMonth: 7,
            totalRooms: 85,
            vatRate: TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
            serviceChargeRate: TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
          },
          subscriptionId: 'sub_grand_rift',
          subscriptionPlan: 'premium',
          subscriptionStatus: 'active',
          enabledModules: SYSTEM_MODULES.map((m) => m.id),
          limits: { maxUsers: 60, maxRooms: 250, maxOutlets: 8, storageLimitMb: 5120 },
          status: 'active',
          createdAt: '2026-01-10T08:00:00.000Z',
          createdBy: 'admin@seam.io',
          updatedAt: '2026-11-01T08:00:00.000Z',
          updatedBy: 'admin@seam.io',
        },
        {
          id: 'htl_bale_lodge',
          name: 'Sample Property B',
          legalName: 'Sample Property B Eco-Lodge Ltd',
          code: 'SPB',
          address: {
            street: 'Forest Trail 1',
            city: 'Dinsho',
            stateRegion: 'Oromia',
            country: 'Ethiopia',
          },
          contact: {
            phone: '+251 22 665 1120',
            email: 'reservations@property-b.example',
          },
          operationalSettings: {
            currency: 'ETB',
            currencySymbol: 'Br',
            timeZone: 'Africa/Addis_Ababa',
            defaultLanguage: 'en',
            fiscalYearStartMonth: 7,
            totalRooms: 32,
            vatRate: TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
            serviceChargeRate: TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
          },
          subscriptionId: 'sub_bale_lodge',
          subscriptionPlan: 'standard',
          subscriptionStatus: 'active',
          enabledModules: SUBSCRIPTION_PLANS[1].includedModules,
          limits: { maxUsers: 20, maxRooms: 80, maxOutlets: 3, storageLimitMb: 2048 },
          status: 'active',
          createdAt: '2026-02-01T09:00:00.000Z',
          createdBy: 'admin@seam.io',
          updatedAt: '2026-11-01T09:00:00.000Z',
          updatedBy: 'admin@seam.io',
        },
        {
          id: 'htl_simien_view',
          name: 'Sample Property C',
          legalName: 'Sample Property C Tourism PLC',
          code: 'SPC',
          address: {
            street: 'Ridge Road 8',
            city: 'Debark',
            stateRegion: 'Amhara',
            country: 'Ethiopia',
          },
          contact: {
            phone: '+251 58 117 0455',
            email: 'desk@property-c.example',
          },
          operationalSettings: {
            currency: 'ETB',
            currencySymbol: 'Br',
            timeZone: 'Africa/Addis_Ababa',
            defaultLanguage: 'en',
            fiscalYearStartMonth: 7,
            totalRooms: 22,
            vatRate: TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
            serviceChargeRate: TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
          },
          subscriptionId: 'sub_simien_view',
          subscriptionPlan: 'basic',
          subscriptionStatus: 'grace_period',
          enabledModules: SUBSCRIPTION_PLANS[0].includedModules,
          limits: { maxUsers: 6, maxRooms: 25, maxOutlets: 1, storageLimitMb: 1024 },
          status: 'active',
          createdAt: '2026-03-15T10:00:00.000Z',
          createdBy: 'admin@seam.io',
          updatedAt: '2026-11-05T10:00:00.000Z',
          updatedBy: 'admin@seam.io',
        },
        {
          id: 'htl_red_sea',
          name: 'Sample Property D',
          legalName: 'Sample Property D Hospitality PLC',
          code: 'SPD',
          address: {
            street: 'Lakeside Promenade 21',
            city: 'Bishoftu',
            stateRegion: 'Oromia',
            country: 'Ethiopia',
          },
          contact: {
            phone: '+251 11 433 8800',
            email: 'admin@property-d.example',
          },
          operationalSettings: {
            currency: 'ETB',
            currencySymbol: 'Br',
            timeZone: 'Africa/Addis_Ababa',
            defaultLanguage: 'en',
            fiscalYearStartMonth: 7,
            totalRooms: 48,
            vatRate: TAX_AND_PAYROLL_CONFIG.defaultVatRatePercent,
            serviceChargeRate: TAX_AND_PAYROLL_CONFIG.defaultServiceChargeRatePercent,
          },
          subscriptionId: 'sub_red_sea',
          subscriptionPlan: 'standard',
          subscriptionStatus: 'suspended',
          enabledModules: SUBSCRIPTION_PLANS[1].includedModules,
          limits: { maxUsers: 20, maxRooms: 80, maxOutlets: 3, storageLimitMb: 2048 },
          status: 'suspended',
          createdAt: '2026-04-01T08:00:00.000Z',
          createdBy: 'admin@seam.io',
          updatedAt: '2026-10-20T08:00:00.000Z',
          updatedBy: 'admin@seam.io',
        },
      ];
      writeStorage(STORAGE_KEYS.HOTELS, seedHotels);

      const seedSubs: Subscription[] = [
        {
          id: 'sub_grand_rift',
          hotelId: 'htl_grand_rift',
          hotelName: 'Sample Property A',
          planId: 'premium',
          planName: 'Premium Enterprise',
          billingCycle: 'annual',
          price: 200000,
          currency: 'ETB',
          startDate: '2026-01-10T00:00:00.000Z',
          expiryDate: '2027-01-10T00:00:00.000Z',
          gracePeriodDays: 7,
          gracePeriodEndsAt: '2027-01-17T00:00:00.000Z',
          paymentStatus: 'paid',
          status: 'active',
          autoRenew: true,
          history: [{ action: 'created', performedBy: 'admin@seam.io', timestamp: '2026-01-10T08:00:00.000Z', notes: 'Annual Enterprise contract activated.' }],
          createdAt: '2026-01-10T08:00:00.000Z',
          updatedAt: '2026-01-10T08:00:00.000Z',
        },
        {
          id: 'sub_bale_lodge',
          hotelId: 'htl_bale_lodge',
          hotelName: 'Sample Property B',
          planId: 'standard',
          planName: 'Standard Commercial',
          billingCycle: 'monthly',
          price: 11000,
          currency: 'ETB',
          startDate: '2026-11-01T00:00:00.000Z',
          expiryDate: '2026-12-01T00:00:00.000Z',
          gracePeriodDays: 7,
          gracePeriodEndsAt: '2026-12-08T00:00:00.000Z',
          paymentStatus: 'paid',
          status: 'active',
          autoRenew: true,
          history: [{ action: 'renewed', performedBy: 'admin@seam.io', timestamp: '2026-11-01T08:00:00.000Z', notes: 'Monthly ETB renewal logged.' }],
          createdAt: '2026-02-01T09:00:00.000Z',
          updatedAt: '2026-11-01T08:00:00.000Z',
        },
        {
          id: 'sub_simien_view',
          hotelId: 'htl_simien_view',
          hotelName: 'Sample Property C',
          planId: 'basic',
          planName: 'Basic Operations',
          billingCycle: 'monthly',
          price: 5000,
          currency: 'ETB',
          startDate: '2026-10-10T00:00:00.000Z',
          expiryDate: '2026-11-10T00:00:00.000Z',
          gracePeriodDays: 7,
          gracePeriodEndsAt: '2026-11-17T00:00:00.000Z',
          paymentStatus: 'pending_verification',
          status: 'grace_period',
          autoRenew: false,
          history: [{ action: 'grace_entered', performedBy: 'system', timestamp: '2026-11-10T00:00:00.000Z', notes: 'Term ended; 7-day grace window active.' }],
          createdAt: '2026-03-15T10:00:00.000Z',
          updatedAt: '2026-11-10T00:00:00.000Z',
        },
        {
          id: 'sub_red_sea',
          hotelId: 'htl_red_sea',
          hotelName: 'Sample Property D',
          planId: 'standard',
          planName: 'Standard Commercial',
          billingCycle: 'monthly',
          price: 11000,
          currency: 'ETB',
          startDate: '2026-09-01T00:00:00.000Z',
          expiryDate: '2026-10-01T00:00:00.000Z',
          gracePeriodDays: 7,
          gracePeriodEndsAt: '2026-10-08T00:00:00.000Z',
          paymentStatus: 'overdue',
          status: 'suspended',
          suspensionReason: 'Unpaid monthly renewal beyond 7-day grace period.',
          autoRenew: false,
          history: [{ action: 'suspended', performedBy: 'admin@seam.io', timestamp: '2026-10-09T09:00:00.000Z', notes: 'Suspended pending settlement.' }],
          createdAt: '2026-04-01T08:00:00.000Z',
          updatedAt: '2026-10-09T09:00:00.000Z',
        },
      ];
      writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, seedSubs);

      if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
        const seedPayments: SubscriptionPayment[] = [
          {
            id: 'pay_seed_01',
            referenceNumber: 'SEAM-PAY-20261111-4821',
            subscriptionId: 'sub_simien_view',
            hotelId: 'htl_simien_view',
            hotelName: 'Sample Property C',
            amount: 5000,
            currency: 'ETB',
            billingPeriodStart: '2026-11-10T00:00:00.000Z',
            billingPeriodEnd: '2026-12-10T00:00:00.000Z',
            paymentMethod: 'telebirr',
            paymentReference: 'TB-994820194',
            status: 'pending_review',
            notes: 'Telebirr transfer submitted by Sample Property C GM.',
            createdAt: '2026-11-11T14:20:00.000Z',
          },
        ];
        writeStorage(STORAGE_KEYS.PAYMENTS, seedPayments);
      }

      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const seedUsers: HotelUser[] = [
          {
            id: 'usr_gr_admin',
            uid: 'auth_usr_gr_admin',
            hotelId: 'htl_grand_rift',
            employeeId: 'EMP-GR-001',
            email: 'meron.tadesse@property-a.example',
            fullName: 'Meron Tadesse',
            phone: '+251 91 123 4567',
            role: 'hotel_admin',
            departmentId: 'dept_htl_grand_rift_fo',
            departmentName: 'Front Office',
            status: 'active',
            requirePasswordChange: false,
            invitedBy: 'admin@seam.io',
            createdAt: '2026-01-15T08:30:00.000Z',
            updatedAt: '2026-01-15T08:30:00.000Z',
          },
          {
            id: 'usr_gr_gm',
            uid: 'auth_usr_gr_gm',
            hotelId: 'htl_grand_rift',
            employeeId: 'EMP-GR-002',
            email: 'solomon.bekele@property-a.example',
            fullName: 'Solomon Bekele',
            phone: '+251 91 234 5678',
            role: 'gm',
            departmentId: 'dept_htl_grand_rift_fn',
            departmentName: 'Finance & Accounts',
            status: 'active',
            requirePasswordChange: false,
            invitedBy: 'meron.tadesse@property-a.example',
            createdAt: '2026-01-16T09:00:00.000Z',
            updatedAt: '2026-01-16T09:00:00.000Z',
          },
          {
            id: 'usr_bm_admin',
            uid: 'auth_usr_bm_admin',
            hotelId: 'htl_bale_lodge',
            employeeId: 'EMP-BM-001',
            email: 'dawit.haile@property-b.example',
            fullName: 'Dawit Haile',
            phone: '+251 92 456 7890',
            role: 'hotel_admin',
            departmentId: 'dept_htl_bale_lodge_fo',
            departmentName: 'Front Office',
            status: 'active',
            requirePasswordChange: false,
            invitedBy: 'admin@seam.io',
            createdAt: '2026-02-01T10:30:00.000Z',
            updatedAt: '2026-02-01T10:30:00.000Z',
          },
          {
            id: 'usr_sv_admin',
            uid: 'auth_usr_sv_admin',
            hotelId: 'htl_simien_view',
            employeeId: 'EMP-SV-001',
            email: 'admin@property-c.example',
            fullName: 'Abebe Kebede',
            role: 'hotel_admin',
            departmentId: 'dept_htl_simien_view_fo',
            departmentName: 'Front Office',
            status: 'active',
            requirePasswordChange: false,
            invitedBy: 'admin@seam.io',
            createdAt: '2026-03-15T10:00:00.000Z',
            updatedAt: '2026-03-15T10:00:00.000Z',
          },
          {
            id: 'usr_rs_admin',
            uid: 'auth_usr_rs_admin',
            hotelId: 'htl_red_sea',
            employeeId: 'EMP-RS-001',
            email: 'admin@property-d.example',
            fullName: 'Selamawit Tesfaye',
            role: 'hotel_admin',
            departmentId: 'dept_htl_red_sea_fo',
            departmentName: 'Front Office',
            status: 'active',
            requirePasswordChange: false,
            invitedBy: 'admin@seam.io',
            createdAt: '2026-04-01T08:00:00.000Z',
            updatedAt: '2026-04-01T08:00:00.000Z',
          },
        ];
        writeStorage(STORAGE_KEYS.USERS, seedUsers);
      }

      if (!localStorage.getItem(STORAGE_KEYS.PLATFORM_USERS)) {
        const seedPlatformUsers: PlatformUser[] = [
          {
            id: 'usr_superadmin_owner',
            uid: 'usr_superadmin_owner',
            email: 'getman2000@gmail.com',
            fullName: 'Platform Owner (Super Admin)',
            role: 'super_admin',
            status: 'active',
            grantedBy: 'system_bootstrap',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'usr_superadmin_01',
            uid: 'usr_superadmin_01',
            email: 'admin@seam.io',
            fullName: 'SEAM Super Admin',
            role: 'super_admin',
            status: 'active',
            grantedBy: 'system_bootstrap',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ];
        writeStorage(STORAGE_KEYS.PLATFORM_USERS, seedPlatformUsers);
      }

      if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
        const seedAudit: AuditLog[] = [
          {
            id: 'log_seed_01',
            hotelId: 'htl_grand_rift',
            hotelName: 'Sample Property A',
            actor: { uid: 'usr_gr_gm', email: 'solomon.bekele@property-a.example', fullName: 'Solomon Bekele', role: 'gm' },
            action: 'DAILY_FLASH_APPROVED',
            module: 'finance',
            targetId: 'flash_gr_latest',
            description: 'Approved Daily Revenue Flash Report and bank settlement batch.',
            descriptionAm: 'የዕለት ገቢ ሪፖርት እና የባንክ ማስታረቂያ ባች ጸድቋል።',
            timestamp: '2026-11-11T22:15:00.000Z',
          },
          {
            id: 'log_seed_02',
            hotelId: 'htl_simien_view',
            hotelName: 'Sample Property C',
            actor: { uid: 'usr_superadmin_01', email: 'admin@seam.io', fullName: 'SEAM Super Admin', role: 'super_admin' },
            action: 'SUBSCRIPTION_GRACE_ENTERED',
            module: 'subscriptions',
            targetId: 'sub_simien_view',
            description: 'Grace period monitoring activated while Telebirr renewal receipt is reviewed.',
            descriptionAm: 'የቴሌብር እድሳት ደረሰኝ እስኪረጋገጥ ድረስ የችሮታ ጊዜ ክትትል ተጀምሯል።',
            timestamp: '2026-11-10T08:00:00.000Z',
          },
        ];
        writeStorage(STORAGE_KEYS.AUDIT_LOGS, seedAudit);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      const allDepts = [
        ...generateSeedDepartments('htl_grand_rift'),
        ...generateSeedDepartments('htl_bale_lodge'),
        ...generateSeedDepartments('htl_simien_view'),
        ...generateSeedDepartments('htl_red_sea'),
      ];
      writeStorage(STORAGE_KEYS.DEPARTMENTS, allDepts);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OUTLETS)) {
      writeStorage(STORAGE_KEYS.OUTLETS, SEED_OUTLETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROOM_TYPES)) {
      writeStorage(STORAGE_KEYS.ROOM_TYPES, SEED_ROOM_TYPES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      writeStorage(STORAGE_KEYS.ROOMS, generateSeedRooms());
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      writeStorage(STORAGE_KEYS.EMPLOYEES, SEED_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FINANCIAL_RULES)) {
      const allRules = [
        generateSeedFinancialRules('htl_grand_rift', 'ETB', false),
        generateSeedFinancialRules('htl_bale_lodge', 'ETB', true),
        generateSeedFinancialRules('htl_simien_view', 'ETB', false),
        generateSeedFinancialRules('htl_red_sea', 'ETB', false),
      ];
      writeStorage(STORAGE_KEYS.FINANCIAL_RULES, allRules);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_FIELDS)) {
      writeStorage(STORAGE_KEYS.CUSTOM_FIELDS, SEED_CUSTOM_FIELDS);
    }
    // Phase 3 initializations
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      writeStorage(STORAGE_KEYS.RESERVATIONS, SEED_RESERVATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_FOLIOS)) {
      writeStorage(STORAGE_KEYS.GUEST_FOLIOS, SEED_GUEST_FOLIOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOUSEKEEPING_TASKS)) {
      writeStorage(STORAGE_KEYS.HOUSEKEEPING_TASKS, SEED_HOUSEKEEPING_TASKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CASHIER_SHIFTS)) {
      writeStorage(STORAGE_KEYS.CASHIER_SHIFTS, SEED_CASHIER_SHIFTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OUTLET_MENU_ITEMS)) {
      writeStorage(STORAGE_KEYS.OUTLET_MENU_ITEMS, SEED_OUTLET_MENU_ITEMS);
    }
    // Phase 4 initializations
    if (!localStorage.getItem(STORAGE_KEYS.REQUISITIONS)) {
      writeStorage(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DAILY_REVENUE_REPORTS)) {
      writeStorage(STORAGE_KEYS.DAILY_REVENUE_REPORTS, SEED_DAILY_REVENUE_REPORTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BANK_RECONCILIATIONS)) {
      writeStorage(STORAGE_KEYS.BANK_RECONCILIATIONS, SEED_BANK_RECONCILIATIONS);
    }
    // Phase 5 initializations
    if (!localStorage.getItem(STORAGE_KEYS.STORE_LOCATIONS)) {
      writeStorage(STORAGE_KEYS.STORE_LOCATIONS, SEED_STORE_LOCATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS)) {
      writeStorage(STORAGE_KEYS.STOCK_ITEMS, SEED_STOCK_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GRVS)) {
      writeStorage(STORAGE_KEYS.GRVS, SEED_GRVS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SIVS)) {
      writeStorage(STORAGE_KEYS.SIVS, SEED_SIVS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_ADJUSTMENTS)) {
      writeStorage(STORAGE_KEYS.STOCK_ADJUSTMENTS, SEED_STOCK_ADJUSTMENTS);
    }
    // Phase 6 initializations
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      writeStorage(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORK_ORDERS)) {
      writeStorage(STORAGE_KEYS.WORK_ORDERS, SEED_WORK_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PREVENTIVE_SCHEDULES)) {
      writeStorage(STORAGE_KEYS.PREVENTIVE_SCHEDULES, SEED_PREVENTIVE_SCHEDULES);
    }
    // Phase 7 initializations
    if (!localStorage.getItem(STORAGE_KEYS.EVENT_SPACES)) {
      writeStorage(STORAGE_KEYS.EVENT_SPACES, SEED_EVENT_SPACES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENT_BOOKINGS)) {
      writeStorage(STORAGE_KEYS.EVENT_BOOKINGS, SEED_EVENT_BOOKINGS);
    }
    // Phase 8 initializations
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_PROFILES)) {
      writeStorage(STORAGE_KEYS.GUEST_PROFILES, SEED_GUEST_PROFILES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOYALTY_REWARDS)) {
      writeStorage(STORAGE_KEYS.LOYALTY_REWARDS, SEED_LOYALTY_REWARDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPA_TREATMENTS)) {
      writeStorage(STORAGE_KEYS.SPA_TREATMENTS, SEED_SPA_TREATMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPA_APPOINTMENTS)) {
      writeStorage(STORAGE_KEYS.SPA_APPOINTMENTS, SEED_SPA_APPOINTMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_FEEDBACK)) {
      writeStorage(STORAGE_KEYS.GUEST_FEEDBACK, SEED_GUEST_FEEDBACK);
    }
    // Phase 9 initializations
    if (!localStorage.getItem(STORAGE_KEYS.SHIFT_SCHEDULES)) {
      writeStorage(STORAGE_KEYS.SHIFT_SCHEDULES, SEED_SHIFT_SCHEDULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS)) {
      writeStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, SEED_ATTENDANCE_RECORDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
      writeStorage(STORAGE_KEYS.LEAVE_REQUESTS, SEED_LEAVE_REQUESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_PERIODS)) {
      writeStorage(STORAGE_KEYS.PAYROLL_PERIODS, SEED_PAYROLL_PERIODS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_ITEMS)) {
      writeStorage(STORAGE_KEYS.PAYROLL_ITEMS, SEED_PAYROLL_ITEMS);
    }
    // Phase 10 initializations
    if (!localStorage.getItem(STORAGE_KEYS.EXPORT_JOBS)) {
      writeStorage(STORAGE_KEYS.EXPORT_JOBS, SEED_EXPORT_JOBS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.KPI_TARGETS)) {
      writeStorage(STORAGE_KEYS.KPI_TARGETS, SEED_KPI_TARGETS);
    }
    // Phase 11 initializations
    if (!localStorage.getItem(STORAGE_KEYS.SECURITY_INCIDENTS)) {
      writeStorage(STORAGE_KEYS.SECURITY_INCIDENTS, SEED_SECURITY_INCIDENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VISITOR_PASSES)) {
      writeStorage(STORAGE_KEYS.VISITOR_PASSES, SEED_VISITOR_PASSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOST_AND_FOUND)) {
      writeStorage(STORAGE_KEYS.LOST_AND_FOUND, SEED_LOST_AND_FOUND);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_COMPLAINTS)) {
      writeStorage(STORAGE_KEYS.GUEST_COMPLAINTS, SEED_GUEST_COMPLAINTS);
    }
    // Phase 12 initializations
    if (!localStorage.getItem(STORAGE_KEYS.FLEET_VEHICLES)) {
      writeStorage(STORAGE_KEYS.FLEET_VEHICLES, SEED_FLEET_VEHICLES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AIRPORT_TRANSFERS)) {
      writeStorage(STORAGE_KEYS.AIRPORT_TRANSFERS, SEED_AIRPORT_TRANSFERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXCURSION_ACTIVITIES)) {
      writeStorage(STORAGE_KEYS.EXCURSION_ACTIVITIES, SEED_EXCURSION_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXCURSION_BOOKINGS)) {
      writeStorage(STORAGE_KEYS.EXCURSION_BOOKINGS, SEED_EXCURSION_BOOKINGS);
    }
    // Phase 13 initializations
    if (!localStorage.getItem(STORAGE_KEYS.UTILITY_LOGS)) {
      writeStorage(STORAGE_KEYS.UTILITY_LOGS, SEED_UTILITY_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOOD_WASTE_LOGS)) {
      writeStorage(STORAGE_KEYS.FOOD_WASTE_LOGS, SEED_FOOD_WASTE_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ECO_GUEST_OPT_INS)) {
      writeStorage(STORAGE_KEYS.ECO_GUEST_OPT_INS, SEED_ECO_GUEST_OPT_INS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUSTAINABILITY_AUDITS)) {
      writeStorage(STORAGE_KEYS.SUSTAINABILITY_AUDITS, SEED_SUSTAINABILITY_AUDITS);
    }
    // Phase 14 initializations
    if (!localStorage.getItem(STORAGE_KEYS.CHANNEL_CONNECTIONS)) {
      writeStorage(STORAGE_KEYS.CHANNEL_CONNECTIONS, SEED_CHANNEL_CONNECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RATE_PARITY_CHECKS)) {
      writeStorage(STORAGE_KEYS.RATE_PARITY_CHECKS, SEED_RATE_PARITY_CHECKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DYNAMIC_YIELD_RULES)) {
      writeStorage(STORAGE_KEYS.DYNAMIC_YIELD_RULES, SEED_DYNAMIC_YIELD_RULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RATE_PLANS)) {
      writeStorage(STORAGE_KEYS.RATE_PLANS, SEED_RATE_PLANS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIRECT_WEB_BOOKINGS)) {
      writeStorage(STORAGE_KEYS.DIRECT_WEB_BOOKINGS, SEED_DIRECT_WEB_BOOKINGS);
    }
    // Phase 15 initializations
    if (!localStorage.getItem(STORAGE_KEYS.ROOM_SERVICE_ORDERS)) {
      writeStorage(STORAGE_KEYS.ROOM_SERVICE_ORDERS, SEED_ROOM_SERVICE_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_SERVICE_REQUESTS)) {
      writeStorage(STORAGE_KEYS.GUEST_SERVICE_REQUESTS, SEED_GUEST_SERVICE_REQUESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPRESS_CHECKOUTS)) {
      writeStorage(STORAGE_KEYS.EXPRESS_CHECKOUTS, SEED_EXPRESS_CHECKOUTS);
    }
    // Phase 16 initializations
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      writeStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS)) {
      writeStorage(STORAGE_KEYS.PURCHASE_ORDERS, SEED_PURCHASE_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.THREE_WAY_MATCHES)) {
      writeStorage(STORAGE_KEYS.THREE_WAY_MATCHES, SEED_THREE_WAY_MATCHES);
    }
    // Phase 17 initializations
    if (!localStorage.getItem(STORAGE_KEYS.LINEN_ITEMS)) {
      writeStorage(STORAGE_KEYS.LINEN_ITEMS, SEED_LINEN_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAUNDRY_WASH_LOADS)) {
      writeStorage(STORAGE_KEYS.LAUNDRY_WASH_LOADS, SEED_LAUNDRY_WASH_LOADS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_LAUNDRY_ORDERS)) {
      writeStorage(STORAGE_KEYS.GUEST_LAUNDRY_ORDERS, SEED_GUEST_LAUNDRY_ORDERS);
    }
    // Phase 18 initializations
    if (!localStorage.getItem(STORAGE_KEYS.RECIPE_CARDS)) {
      writeStorage(STORAGE_KEYS.RECIPE_CARDS, SEED_RECIPE_CARDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FOOD_COST_VARIANCES)) {
      writeStorage(STORAGE_KEYS.FOOD_COST_VARIANCES, SEED_FOOD_COST_VARIANCES);
    }
    // Phase 19 initializations
    if (!localStorage.getItem(STORAGE_KEYS.GUEST_REVIEWS)) {
      writeStorage(STORAGE_KEYS.GUEST_REVIEWS, SEED_GUEST_REVIEWS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SURVEY_CAMPAIGNS)) {
      writeStorage(STORAGE_KEYS.SURVEY_CAMPAIGNS, SEED_SURVEY_CAMPAIGNS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES)) {
      writeStorage(STORAGE_KEYS.SURVEY_RESPONSES, SEED_SURVEY_RESPONSES);
    }
    // Phase 20 initializations
    if (!localStorage.getItem(STORAGE_KEYS.SMART_ROOM_DEVICES)) {
      writeStorage(STORAGE_KEYS.SMART_ROOM_DEVICES, SEED_SMART_ROOM_DEVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENERGY_SUBMETERS)) {
      writeStorage(STORAGE_KEYS.ENERGY_SUBMETERS, SEED_ENERGY_SUBMETERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMS_POLICIES)) {
      writeStorage(STORAGE_KEYS.EMS_POLICIES, SEED_EMS_POLICIES);
    }
    // Phase 21 initializations
    if (!localStorage.getItem(STORAGE_KEYS.HACCP_TEMP_LOGS)) {
      writeStorage(STORAGE_KEYS.HACCP_TEMP_LOGS, SEED_HACCP_TEMP_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.POOL_WATER_LOGS)) {
      writeStorage(STORAGE_KEYS.POOL_WATER_LOGS, SEED_POOL_WATER_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HYGIENE_AUDITS)) {
      writeStorage(STORAGE_KEYS.HYGIENE_AUDITS, SEED_HYGIENE_AUDITS);
    }
    // Phase 22 initializations
    if (!localStorage.getItem(STORAGE_KEYS.PARKING_BAYS)) {
      writeStorage(STORAGE_KEYS.PARKING_BAYS, SEED_PARKING_BAYS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VALET_TICKETS)) {
      writeStorage(STORAGE_KEYS.VALET_TICKETS, SEED_VALET_TICKETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EV_CHARGING_SESSIONS)) {
      writeStorage(STORAGE_KEYS.EV_CHARGING_SESSIONS, SEED_EV_CHARGING_SESSIONS);
    }
    // Phase 23 initializations
    if (!localStorage.getItem(STORAGE_KEYS.CASHIER_DROPS)) {
      writeStorage(STORAGE_KEYS.CASHIER_DROPS, SEED_CASHIER_DROPS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HIGH_BALANCE_ALERTS)) {
      writeStorage(STORAGE_KEYS.HIGH_BALANCE_ALERTS, SEED_HIGH_BALANCE_ALERTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NIGHT_AUDIT_JOURNALS)) {
      writeStorage(STORAGE_KEYS.NIGHT_AUDIT_JOURNALS, SEED_NIGHT_AUDIT_JOURNALS);
    }
    // Phase 24 initializations
    if (!localStorage.getItem(STORAGE_KEYS.SHIFT_HANDOVERS)) {
      writeStorage(STORAGE_KEYS.SHIFT_HANDOVERS, SEED_SHIFT_HANDOVERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RAPID_SERVICE_TASKS)) {
      writeStorage(STORAGE_KEYS.RAPID_SERVICE_TASKS, SEED_RAPID_SERVICE_TASKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF_BROADCAST_ALERTS)) {
      writeStorage(STORAGE_KEYS.STAFF_BROADCAST_ALERTS, SEED_STAFF_BROADCAST_ALERTS);
    }
    // Phase 25 initializations
    if (!localStorage.getItem(STORAGE_KEYS.CORPORATE_ACCOUNTS)) {
      writeStorage(STORAGE_KEYS.CORPORATE_ACCOUNTS, SEED_CORPORATE_ACCOUNTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CITY_LEDGER_INVOICES)) {
      writeStorage(STORAGE_KEYS.CITY_LEDGER_INVOICES, SEED_CITY_LEDGER_INVOICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AGENCY_COMMISSIONS)) {
      writeStorage(STORAGE_KEYS.AGENCY_COMMISSIONS, SEED_AGENCY_COMMISSIONS);
    }
    // Phase 26 initializations
    if (!localStorage.getItem(STORAGE_KEYS.DINING_TABLES)) {
      writeStorage(STORAGE_KEYS.DINING_TABLES, SEED_DINING_TABLES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DINING_RESERVATIONS)) {
      writeStorage(STORAGE_KEYS.DINING_RESERVATIONS, SEED_DINING_RESERVATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WINE_CELLAR_BOTTLES)) {
      writeStorage(STORAGE_KEYS.WINE_CELLAR_BOTTLES, SEED_WINE_CELLAR_BOTTLES);
    }
    // Phase 27 initializations
    if (!localStorage.getItem(STORAGE_KEYS.GROUP_BLOCKS)) {
      writeStorage(STORAGE_KEYS.GROUP_BLOCKS, SEED_GROUP_BLOCKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GROUP_ROOMING_GUESTS)) {
      writeStorage(STORAGE_KEYS.GROUP_ROOMING_GUESTS, SEED_GROUP_ROOMING_GUESTS);
    }
  }

  public resetToDefaults(): void {
    localStorage.clear();
    this.ensureInitialized();
    this.hashesReadyPromise = this.ensureDefaultPasswordHashes();
  }

  // ==========================================
  // PHASE 2: DEPARTMENTS API
  // ==========================================
  public getDepartments(hotelId?: string): Department[] {
    const all = readStorage<Department[]>(STORAGE_KEYS.DEPARTMENTS, []);
    if (!hotelId) return all;
    return all.filter((d) => d.hotelId === hotelId);
  }

  public saveDepartment(department: Department, actor: { email: string; fullName: string; role: string }): void {
    const depts = this.getDepartments();
    const index = depts.findIndex((d) => d.id === department.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      depts[index] = { ...department, updatedAt: now };
      writeStorage(STORAGE_KEYS.DEPARTMENTS, depts);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'DEPARTMENT_UPDATED',
        module: 'departments',
        targetId: department.id,
        hotelId: department.hotelId,
        description: `Updated department: ${department.name} (${department.code}) - Status: ${department.status}`,
      });
    } else {
      depts.push({ ...department, createdAt: now, updatedAt: now });
      writeStorage(STORAGE_KEYS.DEPARTMENTS, depts);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'DEPARTMENT_CREATED',
        module: 'departments',
        targetId: department.id,
        hotelId: department.hotelId,
        description: `Created new hotel department: ${department.name} (${department.code})`,
      });
    }
  }

  // ==========================================
  // PHASE 2: OUTLETS API
  // ==========================================
  public getOutlets(hotelId?: string): Outlet[] {
    const all = readStorage<Outlet[]>(STORAGE_KEYS.OUTLETS, SEED_OUTLETS);
    if (!hotelId) return all;
    return all.filter((o) => o.hotelId === hotelId);
  }

  public saveOutlet(outlet: Outlet, actor: { email: string; fullName: string; role: string }): void {
    const outlets = this.getOutlets();
    const index = outlets.findIndex((o) => o.id === outlet.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      outlets[index] = { ...outlet, updatedAt: now };
      writeStorage(STORAGE_KEYS.OUTLETS, outlets);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'OUTLET_UPDATED',
        module: 'outlets',
        targetId: outlet.id,
        hotelId: outlet.hotelId,
        description: `Updated outlet: ${outlet.name} (${outlet.type})`,
      });
    } else {
      outlets.push({ ...outlet, createdAt: now, updatedAt: now });
      writeStorage(STORAGE_KEYS.OUTLETS, outlets);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'OUTLET_CREATED',
        module: 'outlets',
        targetId: outlet.id,
        hotelId: outlet.hotelId,
        description: `Created new outlet location: ${outlet.name} (${outlet.type})`,
      });
    }
  }

  // ==========================================
  // PHASE 2: ROOM TYPES & ROOMS API
  // ==========================================
  public getRoomTypes(hotelId?: string): RoomType[] {
    const all = readStorage<RoomType[]>(STORAGE_KEYS.ROOM_TYPES, SEED_ROOM_TYPES);
    if (!hotelId) return all;
    return all.filter((rt) => rt.hotelId === hotelId);
  }

  public saveRoomType(roomType: RoomType, actor: { email: string; fullName: string; role: string }): void {
    const rts = this.getRoomTypes();
    const index = rts.findIndex((r) => r.id === roomType.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      rts[index] = { ...roomType, updatedAt: now };
      writeStorage(STORAGE_KEYS.ROOM_TYPES, rts);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_TYPE_UPDATED',
        module: 'rooms',
        targetId: roomType.id,
        hotelId: roomType.hotelId,
        description: `Updated room category: ${roomType.name} - Rate: ${roomType.standardRate} ${roomType.baseRateCurrency}`,
      });
    } else {
      rts.push({ ...roomType, createdAt: now, updatedAt: now });
      writeStorage(STORAGE_KEYS.ROOM_TYPES, rts);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_TYPE_CREATED',
        module: 'rooms',
        targetId: roomType.id,
        hotelId: roomType.hotelId,
        description: `Created new room category: ${roomType.name} (${roomType.code})`,
      });
    }
  }

  public getRooms(hotelId?: string): Room[] {
    const all = readStorage<Room[]>(STORAGE_KEYS.ROOMS, []);
    if (!hotelId) return all;
    return all.filter((r) => r.hotelId === hotelId);
  }

  public saveRoom(room: Room, actor: { email: string; fullName: string; role: string }): void {
    const rooms = this.getRooms();
    const index = rooms.findIndex((r) => r.id === room.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      rooms[index] = { ...room, updatedAt: now };
      writeStorage(STORAGE_KEYS.ROOMS, rooms);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_UPDATED',
        module: 'rooms',
        targetId: room.id,
        hotelId: room.hotelId,
        description: `Updated Room ${room.roomNumber} - Status: ${room.status}`,
      });
    } else {
      rooms.push({ ...room, createdAt: now, updatedAt: now });
      writeStorage(STORAGE_KEYS.ROOMS, rooms);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_CREATED',
        module: 'rooms',
        targetId: room.id,
        hotelId: room.hotelId,
        description: `Configured new Room ${room.roomNumber} (Floor ${room.floor}) - ${room.roomTypeName}`,
      });
    }
  }

  public updateRoomStatus(
    roomId: string,
    newStatus: RoomOperationalStatus,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const rooms = this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);
    if (index === -1) return;

    const r = rooms[index];
    const prev = r.status;
    r.status = newStatus;
    r.updatedAt = new Date().toISOString();
    writeStorage(STORAGE_KEYS.ROOMS, rooms);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'ROOM_STATUS_CHANGED',
      module: 'rooms',
      targetId: r.id,
      hotelId: r.hotelId,
      description: `Changed Room ${r.roomNumber} status from ${prev} to ${newStatus}`,
    });
  }

  // ==========================================
  // PHASE 2: EMPLOYEES & BULK CSV IMPORT API
  // ==========================================
  public getEmployees(hotelId?: string): Employee[] {
    const all = readStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, SEED_EMPLOYEES);
    if (!hotelId) return all;
    return all.filter((e) => e.hotelId === hotelId);
  }

  public saveEmployee(employee: Employee, actor: { email: string; fullName: string; role: string }): void {
    const emps = this.getEmployees();
    const index = emps.findIndex((e) => e.id === employee.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      emps[index] = { ...employee, updatedAt: now };
      writeStorage(STORAGE_KEYS.EMPLOYEES, emps);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'EMPLOYEE_UPDATED',
        module: 'employees',
        targetId: employee.id,
        hotelId: employee.hotelId,
        description: `Updated employee record: ${employee.fullName} (${employee.employeeId})`,
      });
    } else {
      emps.push({ ...employee, createdAt: now, updatedAt: now });
      writeStorage(STORAGE_KEYS.EMPLOYEES, emps);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'EMPLOYEE_REGISTERED',
        module: 'employees',
        targetId: employee.id,
        hotelId: employee.hotelId,
        description: `Registered employee: ${employee.fullName} (${employee.employeeId}) in ${employee.departmentName}`,
      });
    }
  }

  public importEmployeesBulk(
    hotelId: string,
    importedList: Array<Omit<Employee, 'id' | 'hotelId' | 'createdAt' | 'updatedAt'>>,
    actor: { email: string; fullName: string; role: string }
  ): number {
    const emps = this.getEmployees();
    const now = new Date().toISOString();
    let count = 0;

    importedList.forEach((item) => {
      const id = 'emp_' + Math.random().toString(36).substring(2, 9);
      emps.push({
        ...item,
        id,
        hotelId,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    });

    writeStorage(STORAGE_KEYS.EMPLOYEES, emps);
    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'BULK_EMPLOYEE_IMPORT',
      module: 'employees',
      targetId: hotelId,
      hotelId: hotelId,
      description: `Bulk imported ${count} employee records via CSV / Excel upload`,
    });

    return count;
  }

  // ==========================================
  // PHASE 2: FINANCIAL RULES & APPROVAL LIMITS
  // ==========================================
  public getFinancialRules(hotelId: string): HotelFinancialRules {
    const all = readStorage<HotelFinancialRules[]>(STORAGE_KEYS.FINANCIAL_RULES, []);
    const found = all.find((r) => r.hotelId === hotelId);
    if (found) return found;
    return generateSeedFinancialRules(hotelId, 'ETB');
  }

  public saveFinancialRules(rules: HotelFinancialRules, actor: { email: string; fullName: string; role: string }): void {
    const all = readStorage<HotelFinancialRules[]>(STORAGE_KEYS.FINANCIAL_RULES, []);
    const index = all.findIndex((r) => r.hotelId === rules.hotelId);
    rules.updatedAt = new Date().toISOString();

    if (index >= 0) {
      all[index] = rules;
    } else {
      all.push(rules);
    }
    writeStorage(STORAGE_KEYS.FINANCIAL_RULES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'FINANCIAL_RULES_CONFIGURED',
      module: 'finance',
      targetId: rules.id,
      hotelId: rules.hotelId,
      description: `Updated financial approval limits, VAT (${rules.vatRate}%), and reporting deadlines`,
    });
  }

  // ==========================================
  // PHASE 2: CUSTOM FIELDS API
  // ==========================================
  public getCustomFields(hotelId: string): CustomField[] {
    const all = readStorage<CustomField[]>(STORAGE_KEYS.CUSTOM_FIELDS, SEED_CUSTOM_FIELDS);
    return all.filter((cf) => cf.hotelId === hotelId);
  }

  public saveCustomField(field: CustomField, actor: { email: string; fullName: string; role: string }): void {
    const all = readStorage<CustomField[]>(STORAGE_KEYS.CUSTOM_FIELDS, SEED_CUSTOM_FIELDS);
    const index = all.findIndex((cf) => cf.id === field.id);

    if (index >= 0) {
      all[index] = field;
    } else {
      all.push(field);
    }
    writeStorage(STORAGE_KEYS.CUSTOM_FIELDS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'CUSTOM_FIELD_SAVED',
      module: 'settings',
      targetId: field.id,
      hotelId: field.hotelId,
      description: `Saved custom field: ${field.fieldLabel} (${field.fieldType}) for ${field.module}`,
    });
  }

  // ==========================================
  // PHASE 3: RESERVATIONS & FRONT OFFICE API
  // ==========================================
  public getReservations(hotelId?: string): Reservation[] {
    const all = readStorage<Reservation[]>(STORAGE_KEYS.RESERVATIONS, SEED_RESERVATIONS);
    if (!hotelId) return all;
    return all.filter((r) => r.hotelId === hotelId);
  }

  public getReservationById(id: string): Reservation | undefined {
    return this.getReservations().find((r) => r.id === id);
  }

  public saveReservation(reservation: Reservation, actor: { email: string; fullName: string; role: string }): void {
    const list = this.getReservations();
    const index = list.findIndex((r) => r.id === reservation.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      list[index] = { ...reservation, updatedAt: now };
      writeStorage(STORAGE_KEYS.RESERVATIONS, list);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'RESERVATION_UPDATED',
        module: 'rooms',
        targetId: reservation.id,
        hotelId: reservation.hotelId,
        description: `Updated reservation ${reservation.bookingReference} for ${reservation.guestName} (${reservation.status})`,
      });
    } else {
      list.unshift({ ...reservation, createdAt: now, updatedAt: now });
      writeStorage(STORAGE_KEYS.RESERVATIONS, list);
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'RESERVATION_CREATED',
        module: 'rooms',
        targetId: reservation.id,
        hotelId: reservation.hotelId,
        description: `Created new booking ${reservation.bookingReference} for ${reservation.guestName} - ${reservation.nights} nights`,
      });
    }
  }

  public checkInGuest(
    reservationId: string,
    assignedRoomId: string,
    actor: { email: string; fullName: string; role: string }
  ): GuestFolio {
    const reservations = this.getReservations();
    const resIdx = reservations.findIndex((r) => r.id === reservationId);
    if (resIdx === -1) throw new Error('Reservation not found');

    const res = reservations[resIdx];
    const rooms = this.getRooms(res.hotelId);
    const room = rooms.find((r) => r.id === assignedRoomId);
    if (!room) throw new Error('Assigned room not found');

    // Update reservation
    res.status = 'checked_in';
    res.roomId = room.id;
    res.roomNumber = room.roomNumber;
    res.checkedInAt = new Date().toISOString();
    res.updatedAt = new Date().toISOString();
    writeStorage(STORAGE_KEYS.RESERVATIONS, reservations);

    // Update room operational status to occupied
    this.updateRoomStatus(room.id, 'occupied', actor);

    // Initialize or retrieve Guest Folio
    let folio = this.getGuestFolioByBookingId(res.id);
    if (!folio) {
      const rules = this.getFinancialRules(res.hotelId);
      const levies = calculateHospitalityLevies(res.totalRoomCharge, {
        vatRatePercent: rules?.vatRate,
        serviceChargeRatePercent: rules?.serviceChargeRate,
      });
      folio = {
        id: `folio_${res.id}`,
        bookingId: res.id,
        bookingReference: res.bookingReference,
        hotelId: res.hotelId,
        guestName: res.guestName,
        roomNumber: room.roomNumber,
        charges: [
          {
            id: `chg_${Math.random().toString(36).substring(2, 7)}`,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            category: 'room_rate',
            description: `Room Charge - ${res.nights} Nights (${res.roomTypeName})`,
            amount: res.totalRoomCharge,
            postedBy: actor.fullName,
          },
        ],
        payments: [],
        subtotal: levies.subtotal,
        vatAmount: levies.vatAmount,
        serviceChargeAmount: levies.serviceChargeAmount,
        grandTotal: levies.total,
        totalPaid: 0,
        balanceDue: levies.total,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.saveGuestFolio(folio, actor);
    }

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'GUEST_CHECKED_IN',
      module: 'rooms',
      targetId: res.id,
      hotelId: res.hotelId,
      description: `Checked in ${res.guestName} into Room ${room.roomNumber} (Ref: ${res.bookingReference})`,
    });

    return folio;
  }

  public checkOutGuest(
    reservationId: string,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const reservations = this.getReservations();
    const resIdx = reservations.findIndex((r) => r.id === reservationId);
    if (resIdx === -1) return;

    const res = reservations[resIdx];
    res.status = 'checked_out';
    res.checkedOutAt = new Date().toISOString();
    res.updatedAt = new Date().toISOString();
    writeStorage(STORAGE_KEYS.RESERVATIONS, reservations);

    // If room assigned, mark room as 'dirty' so housekeeping is prompted
    if (res.roomId) {
      this.updateRoomStatus(res.roomId, 'dirty', actor);

      // Create or update a departure housekeeping task
      const rooms = this.getRooms(res.hotelId);
      const rm = rooms.find((r) => r.id === res.roomId);
      if (rm) {
        const tasks = this.getHousekeepingTasks(res.hotelId);
        const existingTask = tasks.find((t) => t.roomId === rm.id);
        if (existingTask) {
          existingTask.status = 'dirty';
          existingTask.cleaningType = 'departure_clean';
          existingTask.priority = 'high';
          existingTask.notes = `Guest ${res.guestName} checked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Clean for next arrival.`;
          existingTask.updatedAt = new Date().toISOString();
          writeStorage(STORAGE_KEYS.HOUSEKEEPING_TASKS, tasks);
        } else {
          tasks.unshift({
            id: `hk_${Math.random().toString(36).substring(2, 7)}`,
            hotelId: res.hotelId,
            roomId: rm.id,
            roomNumber: rm.roomNumber,
            floor: rm.floor,
            roomTypeName: rm.roomTypeName,
            priority: 'high',
            cleaningType: 'departure_clean',
            status: 'dirty',
            linenReplaced: false,
            minibarRestocked: false,
            notes: `Guest ${res.guestName} checked out. Turnover required.`,
            updatedAt: new Date().toISOString(),
          });
          writeStorage(STORAGE_KEYS.HOUSEKEEPING_TASKS, tasks);
        }
      }
    }

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'GUEST_CHECKED_OUT',
      module: 'rooms',
      targetId: res.id,
      hotelId: res.hotelId,
      description: `Checked out guest ${res.guestName} from Room ${res.roomNumber}. Room flagged Dirty for Housekeeping.`,
    });
  }

  // ==========================================
  // PHASE 3: GUEST FOLIO & BILLING API
  // ==========================================
  public getGuestFolios(hotelId?: string): GuestFolio[] {
    const all = readStorage<GuestFolio[]>(STORAGE_KEYS.GUEST_FOLIOS, SEED_GUEST_FOLIOS);
    if (!hotelId) return all;
    return all.filter((f) => f.hotelId === hotelId);
  }

  public getGuestFolioByBookingId(bookingId: string): GuestFolio | undefined {
    return this.getGuestFolios().find((f) => f.bookingId === bookingId);
  }

  public getGuestFolioByRoomNumber(hotelId: string, roomNumber: string): GuestFolio | undefined {
    return this.getGuestFolios(hotelId).find(
      (f) => f.roomNumber === roomNumber && f.status === 'open'
    );
  }

  public saveGuestFolio(folio: GuestFolio, actor: { email: string; fullName: string; role: string }): void {
    const folios = this.getGuestFolios();
    const index = folios.findIndex((f) => f.id === folio.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      folios[index] = { ...folio, updatedAt: now };
    } else {
      folios.unshift({ ...folio, createdAt: now, updatedAt: now });
    }
    writeStorage(STORAGE_KEYS.GUEST_FOLIOS, folios);
  }

  public addChargeToFolio(
    folioId: string,
    chargeData: Omit<FolioChargeItem, 'id' | 'date'>,
    actor: { email: string; fullName: string; role: string }
  ): GuestFolio {
    const folios = this.getGuestFolios();
    const index = folios.findIndex((f) => f.id === folioId);
    if (index === -1) throw new Error('Folio not found');

    const folio = folios[index];
    const newCharge: FolioChargeItem = {
      id: `chg_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...chargeData,
    };

    folio.charges.push(newCharge);
    
    // Recalculate totals using centralized hospitality levy calculator
    const subtotal = folio.charges.reduce((acc, c) => acc + c.amount, 0);
    const rules = this.getFinancialRules(folio.hotelId);
    const levies = calculateHospitalityLevies(subtotal, {
      vatRatePercent: rules?.vatRate,
      serviceChargeRatePercent: rules?.serviceChargeRate,
    });
    const totalPaid = folio.payments.reduce((acc, p) => acc + p.amount, 0);

    folio.subtotal = levies.subtotal;
    folio.vatAmount = levies.vatAmount;
    folio.serviceChargeAmount = levies.serviceChargeAmount;
    folio.grandTotal = levies.total;
    folio.totalPaid = Math.round(totalPaid * 100) / 100;
    folio.balanceDue = Math.max(0, Math.round((levies.total - totalPaid) * 100) / 100);
    folio.updatedAt = new Date().toISOString();

    writeStorage(STORAGE_KEYS.GUEST_FOLIOS, folios);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'FOLIO_CHARGE_POSTED',
      module: 'finance',
      targetId: folio.id,
      hotelId: folio.hotelId,
      description: `Posted charge of ${chargeData.amount} (${chargeData.description}) to Room ${folio.roomNumber} folio (${folio.guestName})`,
    });

    return folio;
  }

  public addPaymentToFolio(
    folioId: string,
    paymentData: Omit<FolioPaymentItem, 'id' | 'date'>,
    actor: { email: string; fullName: string; role: string }
  ): GuestFolio {
    const folios = this.getGuestFolios();
    const index = folios.findIndex((f) => f.id === folioId);
    if (index === -1) throw new Error('Folio not found');

    const folio = folios[index];
    const newPayment: FolioPaymentItem = {
      id: `pmt_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...paymentData,
    };

    folio.payments.push(newPayment);

    // Recalculate totals
    const totalPaid = folio.payments.reduce((acc, p) => acc + p.amount, 0);
    folio.totalPaid = Math.round(totalPaid * 100) / 100;
    folio.balanceDue = Math.max(0, Math.round((folio.grandTotal - totalPaid) * 100) / 100);
    if (folio.balanceDue <= 0.01) {
      folio.status = 'settled';
      folio.closedAt = new Date().toISOString();
    }
    folio.updatedAt = new Date().toISOString();

    writeStorage(STORAGE_KEYS.GUEST_FOLIOS, folios);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'FOLIO_PAYMENT_COLLECTED',
      module: 'finance',
      targetId: folio.id,
      hotelId: folio.hotelId,
      description: `Received payment of ${paymentData.amount} via ${paymentData.method} for Room ${folio.roomNumber} (${folio.guestName}) - Ref: ${paymentData.reference}`,
    });

    return folio;
  }

  // ==========================================
  // PHASE 3: HOUSEKEEPING BOARD API
  // ==========================================
  public getHousekeepingTasks(hotelId?: string): HousekeepingTask[] {
    const all = readStorage<HousekeepingTask[]>(STORAGE_KEYS.HOUSEKEEPING_TASKS, SEED_HOUSEKEEPING_TASKS);
    if (!hotelId) return all;
    return all.filter((t) => t.hotelId === hotelId);
  }

  public saveHousekeepingTask(task: HousekeepingTask, actor: { email: string; fullName: string; role: string }): void {
    const tasks = this.getHousekeepingTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      tasks[index] = { ...task, updatedAt: now };
    } else {
      tasks.unshift({ ...task, updatedAt: now });
    }
    writeStorage(STORAGE_KEYS.HOUSEKEEPING_TASKS, tasks);
  }

  public updateHousekeepingStatus(
    taskId: string,
    status: 'dirty' | 'in_progress' | 'clean' | 'inspected',
    actor: { email: string; fullName: string; role: string },
    details?: {
      staffId?: string;
      staffName?: string;
      linenReplaced?: boolean;
      minibarRestocked?: boolean;
      minibarItemsCount?: number;
      minibarChargeAmount?: number;
      maintenanceIssue?: string;
      notes?: string;
    }
  ): void {
    const tasks = this.getHousekeepingTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return;

    const task = tasks[index];
    const prevStatus = task.status;
    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (details) {
      if (details.staffId) task.assignedStaffId = details.staffId;
      if (details.staffName) task.assignedStaffName = details.staffName;
      if (details.linenReplaced !== undefined) task.linenReplaced = details.linenReplaced;
      if (details.minibarRestocked !== undefined) task.minibarRestocked = details.minibarRestocked;
      if (details.minibarItemsCount !== undefined) task.minibarItemsCount = details.minibarItemsCount;
      if (details.minibarChargeAmount !== undefined) task.minibarChargeAmount = details.minibarChargeAmount;
      if (details.maintenanceIssue) task.maintenanceIssue = details.maintenanceIssue;
      if (details.notes) task.notes = details.notes;
    }

    if (status === 'in_progress' && !task.startedAt) {
      task.startedAt = new Date().toISOString();
    }
    if (status === 'clean' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }
    if (status === 'inspected') {
      task.inspectedBy = actor.fullName;
      task.inspectedAt = new Date().toISOString();
    }

    writeStorage(STORAGE_KEYS.HOUSEKEEPING_TASKS, tasks);

    // Sync room operational status
    if (status === 'clean') {
      this.updateRoomStatus(task.roomId, 'clean', actor);
    } else if (status === 'inspected') {
      this.updateRoomStatus(task.roomId, 'inspected', actor);
    } else if (status === 'dirty') {
      this.updateRoomStatus(task.roomId, 'dirty', actor);
    }

    // If minibar charged and room has active folio, automatically post to folio!
    if (details?.minibarChargeAmount && details.minibarChargeAmount > 0) {
      const folio = this.getGuestFolioByRoomNumber(task.hotelId, task.roomNumber);
      if (folio) {
        this.addChargeToFolio(
          folio.id,
          {
            category: 'minibar',
            description: `Minibar Consumption (${details.minibarItemsCount || 1} items restocked by Housekeeping)`,
            amount: details.minibarChargeAmount,
            postedBy: actor.fullName,
          },
          actor
        );
      }
    }

    // If maintenance issue flagged, set room to maintenance
    if (details?.maintenanceIssue) {
      this.updateRoomStatus(task.roomId, 'maintenance', actor);
    }

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'HOUSEKEEPING_UPDATED',
      module: 'rooms',
      targetId: task.id,
      hotelId: task.hotelId,
      description: `Room ${task.roomNumber} housekeeping status changed from ${prevStatus} to ${status} by ${actor.fullName}`,
    });
  }

  // ==========================================
  // PHASE 3: CASHIER SHIFTS & POS SALES API
  // ==========================================
  public getCashierShifts(hotelId?: string): CashierShift[] {
    const all = readStorage<CashierShift[]>(STORAGE_KEYS.CASHIER_SHIFTS, SEED_CASHIER_SHIFTS);
    if (!hotelId) return all;
    return all.filter((s) => s.hotelId === hotelId);
  }

  public getActiveShift(hotelId: string, cashierUserId?: string): CashierShift | undefined {
    const shifts = this.getCashierShifts(hotelId);
    if (cashierUserId) {
      return shifts.find((s) => s.status === 'open' && s.cashierUserId === cashierUserId);
    }
    return shifts.find((s) => s.status === 'open');
  }

  public openCashierShift(
    shiftData: {
      hotelId: string;
      outletId: string;
      outletName: string;
      cashierUserId: string;
      cashierName: string;
      openingFloat: number;
    },
    actor: { email: string; fullName: string; role: string }
  ): CashierShift {
    const shifts = this.getCashierShifts();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const shiftNumber = `SHIFT-${dateStr}-${rand}`;

    const newShift: CashierShift = {
      id: `shift_${Math.random().toString(36).substring(2, 7)}`,
      ...shiftData,
      shiftNumber,
      startTime: new Date().toISOString(),
      status: 'open',
      cashSales: 0,
      cardSales: 0,
      telebirrSales: 0,
      roomChargeSales: 0,
      totalRevenue: 0,
    };

    shifts.unshift(newShift);
    writeStorage(STORAGE_KEYS.CASHIER_SHIFTS, shifts);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'CASHIER_SHIFT_OPENED',
      module: 'finance',
      targetId: newShift.id,
      hotelId: newShift.hotelId,
      description: `Opened Cashier Session ${newShift.shiftNumber} for ${newShift.cashierName} at ${newShift.outletName} with ${newShift.openingFloat} opening float`,
    });

    return newShift;
  }

  public closeCashierShift(
    shiftId: string,
    actualCashCounted: number,
    notes?: string,
    actor?: { email: string; fullName: string; role: string }
  ): CashierShift {
    const shifts = this.getCashierShifts();
    const index = shifts.findIndex((s) => s.id === shiftId);
    if (index === -1) throw new Error('Shift not found');

    const shift = shifts[index];
    const expectedCash = shift.openingFloat + shift.cashSales;
    const variance = actualCashCounted - expectedCash;

    shift.status = 'closed';
    shift.endTime = new Date().toISOString();
    shift.actualCashCounted = actualCashCounted;
    shift.cashVariance = variance;
    shift.notes = notes;

    writeStorage(STORAGE_KEYS.CASHIER_SHIFTS, shifts);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'CASHIER_SHIFT_CLOSED',
        module: 'finance',
        targetId: shift.id,
        hotelId: shift.hotelId,
        description: `Closed Session ${shift.shiftNumber} (${shift.outletName}). Total: ${shift.totalRevenue}. Cash Variance: ${variance >= 0 ? '+' : ''}${variance}`,
      });
    }

    return shift;
  }

  public recordPOSSale(
    sale: {
      hotelId: string;
      outletId: string;
      outletName: string;
      cashierShiftId?: string;
      guestName?: string;
      roomNumber?: string;
      paymentMethod: 'cash' | 'card' | 'telebirr' | 'room_charge';
      items: Array<{ name: string; price: number; qty: number }>;
      receiptNotes?: string;
    },
    actor: { email: string; fullName: string; role: string }
  ): { receiptNumber: string; totalAmount: number; postedToFolio: boolean } {
    const subtotal = sale.items.reduce((acc, item) => acc + item.price * item.qty, 0);
    const rules = this.getFinancialRules(sale.hotelId);
    const levies = calculateHospitalityLevies(subtotal, {
      vatRatePercent: rules?.vatRate,
      serviceChargeRatePercent: rules?.serviceChargeRate,
    });
    const grandTotal = levies.total;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `POS-${dateStr}-${rand}`;

    // Update active cashier shift if provided or active
    const shifts = this.getCashierShifts();
    const shift = sale.cashierShiftId
      ? shifts.find((s) => s.id === sale.cashierShiftId)
      : this.getActiveShift(sale.hotelId);

    if (shift && shift.status === 'open') {
      if (sale.paymentMethod === 'cash') shift.cashSales += grandTotal;
      else if (sale.paymentMethod === 'card') shift.cardSales += grandTotal;
      else if (sale.paymentMethod === 'telebirr') shift.telebirrSales += grandTotal;
      else if (sale.paymentMethod === 'room_charge') shift.roomChargeSales += grandTotal;

      shift.totalRevenue += grandTotal;
      writeStorage(STORAGE_KEYS.CASHIER_SHIFTS, shifts);
    }

    // If room charge, post pre-tax subtotal to guest folio (folio calculates VAT & SC once)
    let postedToFolio = false;
    if (sale.paymentMethod === 'room_charge' && sale.roomNumber) {
      const folio = this.getGuestFolioByRoomNumber(sale.hotelId, sale.roomNumber);
      if (folio) {
        const itemSummary = sale.items.map((i) => `${i.qty}x ${i.name}`).join(', ');
        this.addChargeToFolio(
          folio.id,
          {
            category: 'restaurant',
            description: `${sale.outletName} Bill: ${itemSummary} (Receipt #${receiptNumber})`,
            outletName: sale.outletName,
            amount: subtotal,
            postedBy: actor.fullName,
          },
          actor
        );
        postedToFolio = true;
      }
    }

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'POS_SALE_COMPLETED',
      module: 'finance',
      targetId: receiptNumber,
      hotelId: sale.hotelId,
      description: `POS Bill #${receiptNumber} settled at ${sale.outletName} for ${grandTotal} via ${sale.paymentMethod.toUpperCase()}${postedToFolio ? ` (Charged to Room ${sale.roomNumber})` : ''}`,
    });

    return { receiptNumber, totalAmount: grandTotal, postedToFolio };
  }

  public getOutletMenuItems(hotelId?: string, outletId?: string): OutletMenuItem[] {
    const all = readStorage<OutletMenuItem[]>(STORAGE_KEYS.OUTLET_MENU_ITEMS, SEED_OUTLET_MENU_ITEMS);
    return all.filter((item) => {
      const matchHotel = !hotelId || item.hotelId === hotelId;
      const matchOutlet = !outletId || item.outletId === outletId;
      return matchHotel && matchOutlet;
    });
  }

  public saveOutletMenuItem(item: OutletMenuItem): void {
    const all = readStorage<OutletMenuItem[]>(STORAGE_KEYS.OUTLET_MENU_ITEMS, SEED_OUTLET_MENU_ITEMS);
    const index = all.findIndex((m) => m.id === item.id);
    if (index >= 0) all[index] = item;
    else all.push(item);
    writeStorage(STORAGE_KEYS.OUTLET_MENU_ITEMS, all);
  }

  // ==========================================
  // PHASE 4: FINANCIAL MANAGEMENT & RECONCILIATIONS
  // ==========================================

  public getRequisitions(hotelId?: string): PurchaseRequisition[] {
    const all = readStorage<PurchaseRequisition[]>(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS);
    if (!hotelId) return all;
    return all.filter((r) => r.hotelId === hotelId);
  }

  public getRequisitionById(id: string): PurchaseRequisition | undefined {
    return this.getRequisitions().find((r) => r.id === id);
  }

  public createRequisition(
    data: {
      hotelId: string;
      departmentId: string;
      departmentName: string;
      category: string;
      description: string;
      amount: number;
      currency: string;
      vendorName: string;
      invoiceReference?: string;
    },
    actor: { email: string; fullName: string; role: string }
  ): PurchaseRequisition {
    const id = 'req_' + Math.random().toString(36).substring(2, 9);
    const dateYear = new Date().getFullYear();
    const randNum = Math.floor(100 + Math.random() * 900);
    const requisitionNumber = `REQ-${dateYear}-${randNum}`;

    const newReq: PurchaseRequisition = {
      id,
      hotelId: data.hotelId,
      requisitionNumber,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      category: data.category,
      description: data.description,
      amount: data.amount,
      currency: data.currency || 'ETB',
      vendorName: data.vendorName,
      invoiceReference: data.invoiceReference,
      requestedBy: {
        name: actor.fullName,
        email: actor.email,
        role: actor.role,
      },
      status: 'pending_dept_head',
      currentApprovalTier: 'dept_head',
      approvalHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = this.getRequisitions();
    all.unshift(newReq);
    writeStorage(STORAGE_KEYS.REQUISITIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'REQUISITION_CREATED',
      module: 'finance',
      targetId: requisitionNumber,
      hotelId: data.hotelId,
      description: `Created Requisition ${requisitionNumber} for ${data.departmentName}: ${data.amount} ${data.currency} (${data.category})`,
    });

    return newReq;
  }

  public approveRequisition(
    id: string,
    actor: { email: string; fullName: string; role: string },
    comment?: string
  ): PurchaseRequisition | undefined {
    const all = this.getRequisitions();
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    const req = all[index];
    const rules = this.getFinancialRules(req.hotelId);
    const thresholds = rules?.approvalLimits || {
      deptHeadLimit: 5000,
      financeManagerLimit: 50000,
      gmLimit: 250000,
    };

    const now = new Date().toISOString();

    // Record this tier approval
    req.approvalHistory.push({
      tier: req.currentApprovalTier,
      approverName: `${actor.fullName} (${actor.role.replace('_', ' ').toUpperCase()})`,
      action: 'approved',
      comment: comment || 'Approved in accordance with financial policy.',
      timestamp: now,
    });

    // Advance to next required tier or finalize approval
    if (req.currentApprovalTier === 'dept_head') {
      if (req.amount <= thresholds.deptHeadLimit) {
        req.status = 'approved';
      } else {
        req.status = 'pending_finance';
        req.currentApprovalTier = 'finance';
      }
    } else if (req.currentApprovalTier === 'finance') {
      if (req.amount <= thresholds.financeManagerLimit) {
        req.status = 'approved';
      } else {
        req.status = 'pending_gm';
        req.currentApprovalTier = 'gm';
      }
    } else if (req.currentApprovalTier === 'gm') {
      if (req.amount <= thresholds.gmLimit) {
        req.status = 'approved';
      } else {
        req.status = 'pending_gm'; // moves to owner tier
        req.currentApprovalTier = 'owner';
      }
    } else if (req.currentApprovalTier === 'owner') {
      req.status = 'approved';
    }

    req.updatedAt = now;
    all[index] = req;
    writeStorage(STORAGE_KEYS.REQUISITIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'REQUISITION_APPROVED',
      module: 'finance',
      targetId: req.requisitionNumber,
      hotelId: req.hotelId,
      description: `Approved Requisition ${req.requisitionNumber} (${req.amount} ${req.currency}). New Status: ${req.status}`,
    });

    return req;
  }

  public rejectRequisition(
    id: string,
    reason: string,
    actor: { email: string; fullName: string; role: string }
  ): PurchaseRequisition | undefined {
    const all = this.getRequisitions();
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    const req = all[index];
    const now = new Date().toISOString();

    req.status = 'rejected';
    req.rejectionReason = reason;
    req.updatedAt = now;

    req.approvalHistory.push({
      tier: req.currentApprovalTier,
      approverName: `${actor.fullName} (${actor.role.replace('_', ' ').toUpperCase()})`,
      action: 'rejected',
      comment: reason,
      timestamp: now,
    });

    all[index] = req;
    writeStorage(STORAGE_KEYS.REQUISITIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'REQUISITION_REJECTED',
      module: 'finance',
      targetId: req.requisitionNumber,
      hotelId: req.hotelId,
      description: `Rejected Requisition ${req.requisitionNumber}. Reason: ${reason}`,
    });

    return req;
  }

  public settleRequisition(
    id: string,
    settlementMethod: string,
    actor: { email: string; fullName: string; role: string }
  ): PurchaseRequisition | undefined {
    const all = this.getRequisitions();
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) return undefined;

    const req = all[index];
    const now = new Date().toISOString();

    req.status = 'settled';
    req.settlementMethod = settlementMethod;
    req.settledAt = now;
    req.updatedAt = now;

    all[index] = req;
    writeStorage(STORAGE_KEYS.REQUISITIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'REQUISITION_SETTLED',
      module: 'finance',
      targetId: req.requisitionNumber,
      hotelId: req.hotelId,
      description: `Disbursed and settled Requisition ${req.requisitionNumber} (${req.amount} ${req.currency}) via ${settlementMethod}`,
    });

    return req;
  }

  public getDailyRevenueReports(hotelId?: string): DailyRevenueRecord[] {
    const all = readStorage<DailyRevenueRecord[]>(STORAGE_KEYS.DAILY_REVENUE_REPORTS, SEED_DAILY_REVENUE_REPORTS);
    if (!hotelId) return all;
    return all.filter((r) => r.hotelId === hotelId);
  }

  public getDailyRevenueReportById(id: string): DailyRevenueRecord | undefined {
    return this.getDailyRevenueReports().find((r) => r.id === id);
  }

  public saveDailyRevenueReport(
    report: DailyRevenueRecord,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getDailyRevenueReports();
    const index = all.findIndex((r) => r.id === report.id);
    if (index >= 0) {
      all[index] = report;
    } else {
      all.unshift(report);
    }
    writeStorage(STORAGE_KEYS.DAILY_REVENUE_REPORTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'DAILY_REVENUE_REPORT_SAVED',
      module: 'finance',
      targetId: report.date,
      hotelId: report.hotelId,
      description: `Daily Revenue Flash Report saved for ${report.date}. Total Gross: ${report.totalGrossRevenue}`,
    });
  }

  public generateDailyRevenueReport(
    hotelId: string,
    date: string,
    actor: { email: string; fullName: string; role: string }
  ): DailyRevenueRecord {
    // Check if report already exists for this date
    const existing = this.getDailyRevenueReports(hotelId).find((r) => r.date === date);
    if (existing) return existing;

    const rooms = this.getRooms(hotelId);
    const totalRooms = rooms.length > 0 ? rooms.length : 45;
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length || Math.floor(totalRooms * 0.72);
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

    // Calculate department revenues from active shifts & folios if available
    const shifts = this.getCashierShifts(hotelId);
    let foodRev = 0;
    let bevRev = 0;
    let cardCol = 0;
    let cashCol = 0;
    let telebirrCol = 0;
    let roomChargeCol = 0;

    shifts.forEach((s) => {
      foodRev += s.cashSales * 0.45 + s.cardSales * 0.45;
      bevRev += s.cashSales * 0.35 + s.telebirrSales * 0.4;
      cashCol += s.cashSales;
      cardCol += s.cardSales;
      telebirrCol += s.telebirrSales;
      roomChargeCol += s.roomChargeSales;
    });

    // Provide robust defaults if shifts are low
    const roomsRevenue = occupiedRooms * 2700;
    const foodRevenue = foodRev > 0 ? Math.round(foodRev) : Math.round(occupiedRooms * 720);
    const beverageRevenue = bevRev > 0 ? Math.round(bevRev) : Math.round(occupiedRooms * 490);
    const otherRevenue = Math.round(occupiedRooms * 95);

    const rules = this.getFinancialRules(hotelId);
    const totalGrossRevenue = roomsRevenue + foodRevenue + beverageRevenue + otherRevenue;
    const levies = calculateHospitalityLevies(totalGrossRevenue, {
      vatRatePercent: rules?.vatRate,
      serviceChargeRatePercent: rules?.serviceChargeRate,
    });
    const vatCollected = levies.vatAmount;
    const serviceChargeCollected = levies.serviceChargeAmount;
    const totalNetRevenue = levies.total;

    const adr = occupiedRooms > 0 ? Math.round(roomsRevenue / occupiedRooms) : 0;
    const revPar = totalRooms > 0 ? Math.round(roomsRevenue / totalRooms) : 0;

    const cashCollected = cashCol > 0 ? cashCol : Math.round(totalNetRevenue * 0.35);
    const cardCollected = cardCol > 0 ? cardCol : Math.round(totalNetRevenue * 0.28);
    const telebirrCollected = telebirrCol > 0 ? telebirrCol : Math.round(totalNetRevenue * 0.22);
    const roomChargeCollected = roomChargeCol > 0 ? roomChargeCol : Math.round(totalNetRevenue * 0.15);

    const dateKey = date.replace(/-/g, '');
    const report: DailyRevenueRecord = {
      id: `rev_${dateKey}`,
      hotelId,
      date,
      roomsRevenue,
      foodRevenue,
      beverageRevenue,
      otherRevenue,
      totalGrossRevenue,
      vatCollected,
      serviceChargeCollected,
      totalNetRevenue,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      adr,
      revPar,
      cashCollected,
      cardCollected,
      telebirrCollected,
      roomChargeCollected,
      approvedByGM: false,
      submittedAt: new Date().toISOString(),
    };

    this.saveDailyRevenueReport(report, actor);
    return report;
  }

  public approveDailyRevenueReport(
    reportId: string,
    gmNotes: string,
    actor: { email: string; fullName: string; role: string }
  ): DailyRevenueRecord | undefined {
    const all = this.getDailyRevenueReports();
    const index = all.findIndex((r) => r.id === reportId);
    if (index === -1) return undefined;

    const report = all[index];
    report.approvedByGM = true;
    report.gmNotes = gmNotes;
    all[index] = report;
    writeStorage(STORAGE_KEYS.DAILY_REVENUE_REPORTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'DAILY_REVENUE_REPORT_APPROVED',
      module: 'finance',
      targetId: report.date,
      hotelId: report.hotelId,
      description: `General Manager approved Daily Flash Revenue Report for ${report.date}. Notes: ${gmNotes}`,
    });

    return report;
  }

  public getBankReconciliations(hotelId?: string): BankReconciliationItem[] {
    const all = readStorage<BankReconciliationItem[]>(STORAGE_KEYS.BANK_RECONCILIATIONS, SEED_BANK_RECONCILIATIONS);
    if (!hotelId) return all;
    return all.filter((b) => b.hotelId === hotelId);
  }

  public saveBankReconciliation(
    item: BankReconciliationItem,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getBankReconciliations();
    const index = all.findIndex((b) => b.id === item.id);
    if (index >= 0) {
      all[index] = item;
    } else {
      all.unshift(item);
    }
    writeStorage(STORAGE_KEYS.BANK_RECONCILIATIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'BANK_RECONCILIATION_UPDATED',
      module: 'finance',
      targetId: item.accountName,
      hotelId: item.hotelId,
      description: `Reconciliation updated for ${item.accountName} (${item.date}). Variance: ${item.variance}`,
    });
  }

  public verifyReconciliation(
    id: string,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getBankReconciliations();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return;

    const item = all[index];
    item.bankStatementAmount = item.systemRecordedAmount;
    item.variance = 0;
    item.status = 'matched';
    item.reconciledBy = `${actor.fullName} (${actor.role})`;
    item.updatedAt = new Date().toISOString();

    all[index] = item;
    writeStorage(STORAGE_KEYS.BANK_RECONCILIATIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'BANK_RECONCILIATION_MATCHED',
      module: 'finance',
      targetId: item.accountName,
      hotelId: item.hotelId,
      description: `Bank reconciliation marked as matched for ${item.accountName} on ${item.date}`,
    });
  }

  // ==========================================
  // PHASE 5: STORES & STOCK INVENTORY APIS
  // ==========================================

  public getStoreLocations(hotelId?: string): StoreLocation[] {
    const all = readStorage<StoreLocation[]>(STORAGE_KEYS.STORE_LOCATIONS, SEED_STORE_LOCATIONS);
    if (!hotelId) return all;
    return all.filter((l) => l.hotelId === hotelId);
  }

  public saveStoreLocation(
    loc: StoreLocation,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getStoreLocations();
    const index = all.findIndex((l) => l.id === loc.id);
    if (index >= 0) {
      all[index] = loc;
    } else {
      all.push(loc);
    }
    writeStorage(STORAGE_KEYS.STORE_LOCATIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'STORE_LOCATION_SAVED',
      module: 'settings',
      targetId: loc.code,
      hotelId: loc.hotelId,
      description: `Saved Store Location: ${loc.name} (${loc.code})`,
    });
  }

  public getStockItems(hotelId?: string, locationId?: string, category?: string): StockItem[] {
    const all = readStorage<StockItem[]>(STORAGE_KEYS.STOCK_ITEMS, SEED_STOCK_ITEMS);
    return all.filter((item) => {
      const matchHotel = !hotelId || item.hotelId === hotelId;
      const matchLoc = !locationId || locationId === 'all' || item.storeLocationId === locationId;
      const matchCat = !category || category === 'all' || item.category === category;
      return matchHotel && matchLoc && matchCat;
    });
  }

  public getStockItemById(id: string): StockItem | undefined {
    return this.getStockItems().find((i) => i.id === id);
  }

  public saveStockItem(
    item: StockItem,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getStockItems();
    const index = all.findIndex((i) => i.id === item.id);
    const now = new Date().toISOString();
    item.updatedAt = now;
    item.totalValue = item.currentQuantity * item.unitCost;

    if (item.currentQuantity === 0) item.status = 'out_of_stock';
    else if (item.currentQuantity <= item.reorderPoint) item.status = 'low_stock';
    else item.status = 'in_stock';

    if (index >= 0) {
      all[index] = item;
    } else {
      item.createdAt = now;
      all.unshift(item);
    }
    writeStorage(STORAGE_KEYS.STOCK_ITEMS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'STOCK_ITEM_SAVED',
      module: 'finance',
      targetId: item.itemCode,
      hotelId: item.hotelId,
      description: `Saved Stock Item: ${item.name} (${item.itemCode}). Qty: ${item.currentQuantity} ${item.unitOfMeasure}`,
    });
  }

  public getGRVs(hotelId?: string): GoodsReceivedVoucher[] {
    const all = readStorage<GoodsReceivedVoucher[]>(STORAGE_KEYS.GRVS, SEED_GRVS);
    if (!hotelId) return all;
    return all.filter((g) => g.hotelId === hotelId);
  }

  public createGRV(
    grvData: Omit<GoodsReceivedVoucher, 'id' | 'grvNumber' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): GoodsReceivedVoucher {
    const id = 'grv_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const grvNumber = `GRV-${year}-${rand}`;

    const newGRV: GoodsReceivedVoucher = {
      ...grvData,
      id,
      grvNumber,
      createdAt: new Date().toISOString(),
    };

    // Update stock levels for each item received
    const stockItems = this.getStockItems();
    grvData.items.forEach((received) => {
      const itemIdx = stockItems.findIndex((s) => s.id === received.itemId);
      if (itemIdx >= 0) {
        const currentItem = stockItems[itemIdx];
        const prevQty = currentItem.currentQuantity;
        const newQty = prevQty + received.quantity;

        // Calculate weighted average unit cost
        const totalOldCost = prevQty * currentItem.unitCost;
        const totalNewCost = received.quantity * received.unitCost;
        const weightedCost = newQty > 0 ? Math.round(((totalOldCost + totalNewCost) / newQty) * 100) / 100 : received.unitCost;

        currentItem.currentQuantity = newQty;
        currentItem.unitCost = weightedCost;
        currentItem.totalValue = currentItem.currentQuantity * currentItem.unitCost;
        currentItem.lastRestockedAt = new Date().toISOString();
        currentItem.updatedAt = new Date().toISOString();

        if (currentItem.currentQuantity === 0) currentItem.status = 'out_of_stock';
        else if (currentItem.currentQuantity <= currentItem.reorderPoint) currentItem.status = 'low_stock';
        else currentItem.status = 'in_stock';

        stockItems[itemIdx] = currentItem;
      }
    });
    writeStorage(STORAGE_KEYS.STOCK_ITEMS, stockItems);

    const grvs = this.getGRVs();
    grvs.unshift(newGRV);
    writeStorage(STORAGE_KEYS.GRVS, grvs);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'GRV_CREATED',
      module: 'finance',
      targetId: grvNumber,
      hotelId: grvData.hotelId,
      description: `Created GRV ${grvNumber} from ${grvData.vendorName}. Total: ${grvData.grandTotal} ${grvData.currency} across ${grvData.items.length} items`,
    });

    return newGRV;
  }

  public getSIVs(hotelId?: string): StoreIssueVoucher[] {
    const all = readStorage<StoreIssueVoucher[]>(STORAGE_KEYS.SIVS, SEED_SIVS);
    if (!hotelId) return all;
    return all.filter((s) => s.hotelId === hotelId);
  }

  public createSIV(
    sivData: Omit<StoreIssueVoucher, 'id' | 'sivNumber' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): StoreIssueVoucher {
    const id = 'siv_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const sivNumber = `SIV-${year}-${rand}`;

    const newSIV: StoreIssueVoucher = {
      ...sivData,
      id,
      sivNumber,
      createdAt: new Date().toISOString(),
    };

    // Deduct stock levels for each item issued
    const stockItems = this.getStockItems();
    sivData.items.forEach((issued) => {
      const itemIdx = stockItems.findIndex((s) => s.id === issued.itemId);
      if (itemIdx >= 0) {
        const currentItem = stockItems[itemIdx];
        currentItem.currentQuantity = Math.max(0, currentItem.currentQuantity - issued.quantity);
        currentItem.totalValue = currentItem.currentQuantity * currentItem.unitCost;
        currentItem.updatedAt = new Date().toISOString();

        if (currentItem.currentQuantity === 0) currentItem.status = 'out_of_stock';
        else if (currentItem.currentQuantity <= currentItem.reorderPoint) currentItem.status = 'low_stock';
        else currentItem.status = 'in_stock';

        stockItems[itemIdx] = currentItem;
      }
    });
    writeStorage(STORAGE_KEYS.STOCK_ITEMS, stockItems);

    const sivs = this.getSIVs();
    sivs.unshift(newSIV);
    writeStorage(STORAGE_KEYS.SIVS, sivs);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SIV_CREATED',
      module: 'finance',
      targetId: sivNumber,
      hotelId: sivData.hotelId,
      description: `Created SIV ${sivNumber} issued to ${sivData.requestingDepartmentName} (${sivData.issuedToStaffName}). Total: ${sivData.totalValue} ${sivData.currency}`,
    });

    return newSIV;
  }

  public getStockAdjustments(hotelId?: string): StockAdjustment[] {
    const all = readStorage<StockAdjustment[]>(STORAGE_KEYS.STOCK_ADJUSTMENTS, SEED_STOCK_ADJUSTMENTS);
    if (!hotelId) return all;
    return all.filter((a) => a.hotelId === hotelId);
  }

  public createStockAdjustment(
    adjData: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): StockAdjustment {
    const id = 'adj_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const adjustmentNumber = `ADJ-${year}-${rand}`;

    const newAdj: StockAdjustment = {
      ...adjData,
      id,
      adjustmentNumber,
      createdAt: new Date().toISOString(),
    };

    // Update physical quantity of adjusted stock item
    const stockItems = this.getStockItems();
    const itemIdx = stockItems.findIndex((s) => s.id === adjData.itemId);
    if (itemIdx >= 0) {
      const currentItem = stockItems[itemIdx];
      currentItem.currentQuantity = Math.max(0, adjData.newQuantity);
      currentItem.totalValue = currentItem.currentQuantity * currentItem.unitCost;
      currentItem.updatedAt = new Date().toISOString();

      if (currentItem.currentQuantity === 0) currentItem.status = 'out_of_stock';
      else if (currentItem.currentQuantity <= currentItem.reorderPoint) currentItem.status = 'low_stock';
      else currentItem.status = 'in_stock';

      stockItems[itemIdx] = currentItem;
      writeStorage(STORAGE_KEYS.STOCK_ITEMS, stockItems);
    }

    const adjustments = this.getStockAdjustments();
    adjustments.unshift(newAdj);
    writeStorage(STORAGE_KEYS.STOCK_ADJUSTMENTS, adjustments);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'STOCK_ADJUSTMENT_LOGGED',
      module: 'finance',
      targetId: adjustmentNumber,
      hotelId: adjData.hotelId,
      description: `Stock Adjustment ${adjustmentNumber} for ${adjData.itemName} (${adjData.adjustmentType}). Qty Delta: ${adjData.quantityDelta}. Impact: ${adjData.totalImpactValue}`,
    });

    return newAdj;
  }

  // ==========================================
  // PHASE 6: MAINTENANCE, ENGINEERING & ASSET APIS
  // ==========================================
  public getAssets(hotelId?: string): AssetRecord[] {
    const all = readStorage<AssetRecord[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    if (!hotelId) return all;
    return all.filter((a) => a.hotelId === hotelId);
  }

  public getAssetById(id: string): AssetRecord | undefined {
    return this.getAssets().find((a) => a.id === id);
  }

  public saveAsset(
    asset: AssetRecord,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getAssets();
    const index = all.findIndex((a) => a.id === asset.id);
    const now = new Date().toISOString();
    asset.updatedAt = now;

    if (index >= 0) {
      all[index] = asset;
    } else {
      asset.createdAt = now;
      all.unshift(asset);
    }
    writeStorage(STORAGE_KEYS.ASSETS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'ASSET_RECORD_SAVED',
      module: 'settings',
      targetId: asset.assetCode,
      hotelId: asset.hotelId,
      description: `Saved Asset: ${asset.name} (${asset.assetCode}) - Status: ${asset.operatingStatus}, Location: ${asset.location}`,
    });
  }

  public getWorkOrders(hotelId?: string): WorkOrder[] {
    const all = readStorage<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, SEED_WORK_ORDERS);
    if (!hotelId) return all;
    return all.filter((w) => w.hotelId === hotelId);
  }

  public getWorkOrderById(id: string): WorkOrder | undefined {
    return this.getWorkOrders().find((w) => w.id === id);
  }

  public createWorkOrder(
    woData: Omit<WorkOrder, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>,
    actor: { email: string; fullName: string; role: string }
  ): WorkOrder {
    const id = 'wo_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `WO-${year}-${rand}`;

    const newWO: WorkOrder = {
      ...woData,
      id,
      ticketNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If marked room out of order, update room status
    if (newWO.roomOutOfOrder && newWO.roomId) {
      const rooms = this.getRooms();
      const rIdx = rooms.findIndex((r) => r.id === newWO.roomId || r.roomNumber === newWO.roomNumber);
      if (rIdx >= 0) {
        rooms[rIdx].status = 'out_of_order';
        writeStorage(STORAGE_KEYS.ROOMS, rooms);
      }
    }

    const workOrders = this.getWorkOrders();
    workOrders.unshift(newWO);
    writeStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'WORK_ORDER_CREATED',
      module: 'rooms',
      targetId: ticketNumber,
      hotelId: woData.hotelId,
      description: `Created Work Order ${ticketNumber}: ${woData.title} [Priority: ${woData.priority.toUpperCase()}]`,
    });

    return newWO;
  }

  public updateWorkOrderStatus(
    id: string,
    status: WorkOrderStatus,
    updates: Partial<WorkOrder>,
    actor: { email: string; fullName: string; role: string }
  ): WorkOrder | undefined {
    const workOrders = this.getWorkOrders();
    const index = workOrders.findIndex((w) => w.id === id);
    if (index === -1) return undefined;

    const currentWO = workOrders[index];
    const updatedWO: WorkOrder = {
      ...currentWO,
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'in_progress' && !updatedWO.startedAt) {
      updatedWO.startedAt = new Date().toISOString();
    } else if (status === 'resolved' && !updatedWO.resolvedAt) {
      updatedWO.resolvedAt = new Date().toISOString();
    } else if (status === 'closed' && !updatedWO.closedAt) {
      updatedWO.closedAt = new Date().toISOString();
    }

    // If resolved or closed, and roomOutOfOrder was true, check if room can be released
    if ((status === 'resolved' || status === 'closed') && updatedWO.roomId) {
      const otherActiveForRoom = workOrders.some(
        (w) => w.id !== id && w.roomId === updatedWO.roomId && w.roomOutOfOrder && w.status !== 'resolved' && w.status !== 'closed'
      );
      if (!otherActiveForRoom) {
        const rooms = this.getRooms();
        const rIdx = rooms.findIndex((r) => r.id === updatedWO.roomId);
        if (rIdx >= 0 && rooms[rIdx].status === 'out_of_order') {
          // Room released from maintenance, marked dirty for turnover cleaning
          rooms[rIdx].status = 'dirty';
          writeStorage(STORAGE_KEYS.ROOMS, rooms);
        }
      }
    }

    workOrders[index] = updatedWO;
    writeStorage(STORAGE_KEYS.WORK_ORDERS, workOrders);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'WORK_ORDER_STATUS_CHANGED',
      module: 'rooms',
      targetId: updatedWO.ticketNumber,
      hotelId: updatedWO.hotelId,
      description: `Work Order ${updatedWO.ticketNumber} updated to status "${status}" by ${actor.fullName}`,
    });

    return updatedWO;
  }

  public getPreventiveSchedules(hotelId?: string): PreventiveSchedule[] {
    const all = readStorage<PreventiveSchedule[]>(STORAGE_KEYS.PREVENTIVE_SCHEDULES, SEED_PREVENTIVE_SCHEDULES);
    if (!hotelId) return all;
    return all.filter((s) => s.hotelId === hotelId);
  }

  public savePreventiveSchedule(
    schedule: PreventiveSchedule,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getPreventiveSchedules();
    const index = all.findIndex((s) => s.id === schedule.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      all[index] = schedule;
    } else {
      schedule.createdAt = now;
      all.unshift(schedule);
    }
    writeStorage(STORAGE_KEYS.PREVENTIVE_SCHEDULES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'PREVENTIVE_SCHEDULE_SAVED',
      module: 'settings',
      targetId: schedule.scheduleCode,
      hotelId: schedule.hotelId,
      description: `Saved PPM Schedule ${schedule.scheduleCode}: ${schedule.title} (${schedule.frequency})`,
    });
  }

  public triggerPreventiveWorkOrder(
    scheduleId: string,
    actor: { email: string; fullName: string; role: string }
  ): WorkOrder | undefined {
    const schedules = this.getPreventiveSchedules();
    const sIdx = schedules.findIndex((s) => s.id === scheduleId);
    if (sIdx === -1) return undefined;

    const schedule = schedules[sIdx];
    const asset = schedule.assetId ? this.getAssetById(schedule.assetId) : undefined;

    const checklistText = schedule.checklist.map((c) => `[ ] ${c.task}${c.isMandatory ? ' (Mandatory)' : ''}`).join('\n');
    const description = `[Scheduled PPM - ${schedule.scheduleCode}]\nEstimated Hours: ${schedule.estimatedHours}h\nAssigned: ${schedule.assignedRoleOrTech}\n\nTask Checklist:\n${checklistText}`;

    const newWO = this.createWorkOrder(
      {
        hotelId: schedule.hotelId,
        title: `PPM: ${schedule.title}`,
        description,
        category: schedule.category,
        priority: 'medium',
        status: 'assigned',
        source: 'preventive_schedule',
        targetType: schedule.assetId ? 'equipment_asset' : 'public_area',
        assetId: schedule.assetId,
        assetName: schedule.assetName,
        assignedTechnicianName: schedule.assignedRoleOrTech,
        reportedBy: `${actor.fullName} (System PPM Scheduler)`,
        reportedAt: new Date().toISOString(),
        roomOutOfOrder: false,
        partsUsed: [],
        totalPartsCost: 0,
        currency: 'ETB',
      },
      actor
    );

    // Update schedule last executed & next due date
    const today = new Date();
    schedule.lastRunDate = today.toISOString().slice(0, 10);
    const nextDate = new Date(today);
    if (schedule.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (schedule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (schedule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (schedule.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (schedule.frequency === 'semi_annual') nextDate.setMonth(nextDate.getMonth() + 6);
    else if (schedule.frequency === 'annual') nextDate.setFullYear(nextDate.getFullYear() + 1);

    schedule.nextDueDate = nextDate.toISOString().slice(0, 10);
    schedules[sIdx] = schedule;
    writeStorage(STORAGE_KEYS.PREVENTIVE_SCHEDULES, schedules);

    // If asset was linked, update last serviced date
    if (asset) {
      asset.lastServicedDate = today.toISOString().slice(0, 10);
      asset.nextScheduledServiceDate = schedule.nextDueDate;
      this.saveAsset(asset, actor);
    }

    return newWO;
  }

  // ==========================================
  // PHASE 7: CONFERENCES, EVENTS & BANQUETING APIS
  // ==========================================
  public getEventSpaces(hotelId?: string): EventSpace[] {
    const all = readStorage<EventSpace[]>(STORAGE_KEYS.EVENT_SPACES, SEED_EVENT_SPACES);
    if (!hotelId) return all;
    return all.filter((s) => s.hotelId === hotelId);
  }

  public getEventSpaceById(id: string): EventSpace | undefined {
    return this.getEventSpaces().find((s) => s.id === id);
  }

  public saveEventSpace(
    space: EventSpace,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getEventSpaces();
    const index = all.findIndex((s) => s.id === space.id);

    if (index >= 0) {
      all[index] = space;
    } else {
      space.createdAt = new Date().toISOString();
      all.unshift(space);
    }
    writeStorage(STORAGE_KEYS.EVENT_SPACES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EVENT_SPACE_SAVED',
      module: 'settings',
      targetId: space.code,
      hotelId: space.hotelId,
      description: `Saved Event Space: ${space.name} (${space.code}) - Capacity: ${space.capacities.banquet} banquet, ${space.capacities.theater} theater`,
    });
  }

  public getEventBookings(hotelId?: string): EventBooking[] {
    const all = readStorage<EventBooking[]>(STORAGE_KEYS.EVENT_BOOKINGS, SEED_EVENT_BOOKINGS);
    if (!hotelId) return all;
    return all.filter((b) => b.hotelId === hotelId);
  }

  public getEventBookingById(id: string): EventBooking | undefined {
    return this.getEventBookings().find((b) => b.id === id);
  }

  public createEventBooking(
    bookingData: Omit<EventBooking, 'id' | 'bookingReference' | 'createdAt' | 'updatedAt'>,
    actor: { email: string; fullName: string; role: string }
  ): EventBooking {
    const id = 'evt_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const bookingReference = `EVT-${year}-${rand}`;

    const newBooking: EventBooking = {
      ...bookingData,
      id,
      bookingReference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = this.getEventBookings();
    all.unshift(newBooking);
    writeStorage(STORAGE_KEYS.EVENT_BOOKINGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EVENT_BOOKING_CREATED',
      module: 'departments',
      targetId: bookingReference,
      hotelId: bookingData.hotelId,
      description: `Created Event Booking ${bookingReference}: "${bookingData.eventTitle}" for ${bookingData.clientName} (${bookingData.expectedAttendees} pax). Total: ${bookingData.grandTotal} ${bookingData.currency}`,
    });

    return newBooking;
  }

  public updateEventBookingStatus(
    id: string,
    status: EventBookingStatus,
    updates: Partial<EventBooking>,
    actor: { email: string; fullName: string; role: string }
  ): EventBooking | undefined {
    const all = this.getEventBookings();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const current = all[index];
    const updated: EventBooking = {
      ...current,
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    writeStorage(STORAGE_KEYS.EVENT_BOOKINGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EVENT_STATUS_UPDATED',
      module: 'departments',
      targetId: updated.bookingReference,
      hotelId: updated.hotelId,
      description: `Event ${updated.bookingReference} status updated to "${status}" by ${actor.fullName}`,
    });

    return updated;
  }

  public signBEO(
    id: string,
    actor: { email: string; fullName: string; role: string }
  ): EventBooking | undefined {
    const all = this.getEventBookings();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const current = all[index];
    current.beoApprovedByGM = true;
    current.beoApprovedAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();

    all[index] = current;
    writeStorage(STORAGE_KEYS.EVENT_BOOKINGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'BEO_SIGNED_OFF',
      module: 'departments',
      targetId: current.bookingReference,
      hotelId: current.hotelId,
      description: `Banquet Event Order (BEO) signed off by GM ${actor.fullName} for event ${current.bookingReference}`,
    });

    return current;
  }

  public recordEventPayment(
    id: string,
    paymentAmount: number,
    actor: { email: string; fullName: string; role: string }
  ): EventBooking | undefined {
    const all = this.getEventBookings();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const current = all[index];
    current.depositPaid = (current.depositPaid || 0) + paymentAmount;
    current.balanceDue = Math.max(0, current.grandTotal - current.depositPaid);
    current.updatedAt = new Date().toISOString();

    all[index] = current;
    writeStorage(STORAGE_KEYS.EVENT_BOOKINGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EVENT_PAYMENT_RECORDED',
      module: 'finance',
      targetId: current.bookingReference,
      hotelId: current.hotelId,
      description: `Recorded payment of ${paymentAmount} ${current.currency} for event ${current.bookingReference}. New Balance: ${current.balanceDue} ${current.currency}`,
    });

    return current;
  }

  // ==========================================
  // PHASE 8: GUEST CRM, SPA & LOYALTY APIS
  // ==========================================
  public getGuestProfiles(hotelId?: string): GuestProfile[] {
    const all = readStorage<GuestProfile[]>(STORAGE_KEYS.GUEST_PROFILES, SEED_GUEST_PROFILES);
    if (!hotelId) return all;
    return all.filter((g) => g.hotelId === hotelId);
  }

  public getGuestProfileById(id: string): GuestProfile | undefined {
    return this.getGuestProfiles().find((g) => g.id === id);
  }

  public saveGuestProfile(
    guest: GuestProfile,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getGuestProfiles();
    const index = all.findIndex((g) => g.id === guest.id);
    const now = new Date().toISOString();
    guest.updatedAt = now;

    if (index >= 0) {
      all[index] = guest;
    } else {
      guest.createdAt = now;
      all.unshift(guest);
    }
    writeStorage(STORAGE_KEYS.GUEST_PROFILES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'GUEST_PROFILE_SAVED',
      module: 'settings',
      targetId: guest.guestCode,
      hotelId: guest.hotelId,
      description: `Saved Guest Profile ${guest.guestCode}: ${guest.fullName} [VIP Tier: ${guest.vipTier.toUpperCase()}]`,
    });
  }

  public getLoyaltyRewards(hotelId?: string): LoyaltyReward[] {
    const all = readStorage<LoyaltyReward[]>(STORAGE_KEYS.LOYALTY_REWARDS, SEED_LOYALTY_REWARDS);
    if (!hotelId) return all;
    return all.filter((r) => r.hotelId === hotelId);
  }

  public getLoyaltyTransactions(hotelId?: string, guestId?: string): LoyaltyTransaction[] {
    const all = readStorage<LoyaltyTransaction[]>(STORAGE_KEYS.LOYALTY_TRANSACTIONS, []);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((t) => t.hotelId === hotelId);
    if (guestId) filtered = filtered.filter((t) => t.guestId === guestId);
    return filtered;
  }

  public redeemLoyaltyReward(
    guestId: string,
    rewardId: string,
    actor: { email: string; fullName: string; role: string }
  ): { success: boolean; message: string } {
    const guests = this.getGuestProfiles();
    const gIdx = guests.findIndex((g) => g.id === guestId);
    if (gIdx === -1) return { success: false, message: 'Guest profile not found' };

    const rewards = this.getLoyaltyRewards();
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return { success: false, message: 'Reward not found' };

    const guest = guests[gIdx];
    if (guest.loyaltyPointsBalance < reward.pointsRequired) {
      return {
        success: false,
        message: `Insufficient points. Required: ${reward.pointsRequired}, Available: ${guest.loyaltyPointsBalance}`,
      };
    }

    guest.loyaltyPointsBalance -= reward.pointsRequired;
    guest.updatedAt = new Date().toISOString();
    guests[gIdx] = guest;
    writeStorage(STORAGE_KEYS.GUEST_PROFILES, guests);

    // Record transaction
    const newTx: LoyaltyTransaction = {
      id: 'ltx_' + Math.random().toString(36).substring(2, 9),
      hotelId: guest.hotelId,
      guestId: guest.id,
      guestName: guest.fullName,
      type: 'redemption',
      points: -reward.pointsRequired,
      description: `Redeemed: ${reward.title}`,
      date: new Date().toISOString(),
      performedBy: actor.fullName,
    };

    const allTx = this.getLoyaltyTransactions();
    allTx.unshift(newTx);
    writeStorage(STORAGE_KEYS.LOYALTY_TRANSACTIONS, allTx);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'LOYALTY_POINTS_REDEEMED',
      module: 'settings',
      targetId: guest.guestCode,
      hotelId: guest.hotelId,
      description: `Redeemed ${reward.pointsRequired} points for "${reward.title}" by ${guest.fullName}`,
    });

    return {
      success: true,
      message: `Successfully redeemed "${reward.title}". Remaining Points: ${guest.loyaltyPointsBalance}`,
    };
  }

  public getSpaTreatments(hotelId?: string): SpaTreatment[] {
    const all = readStorage<SpaTreatment[]>(STORAGE_KEYS.SPA_TREATMENTS, SEED_SPA_TREATMENTS);
    if (!hotelId) return all;
    return all.filter((s) => s.hotelId === hotelId);
  }

  public saveSpaTreatment(
    treatment: SpaTreatment,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getSpaTreatments();
    const index = all.findIndex((t) => t.id === treatment.id);

    if (index >= 0) {
      all[index] = treatment;
    } else {
      all.unshift(treatment);
    }
    writeStorage(STORAGE_KEYS.SPA_TREATMENTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SPA_TREATMENT_SAVED',
      module: 'settings',
      targetId: treatment.code,
      hotelId: treatment.hotelId,
      description: `Saved Spa Service: ${treatment.name} (${treatment.durationMinutes} min) - ${treatment.price} ${treatment.currency}`,
    });
  }

  public getSpaAppointments(hotelId?: string): SpaAppointment[] {
    const all = readStorage<SpaAppointment[]>(STORAGE_KEYS.SPA_APPOINTMENTS, SEED_SPA_APPOINTMENTS);
    if (!hotelId) return all;
    return all.filter((a) => a.hotelId === hotelId);
  }

  public createSpaAppointment(
    apptData: Omit<SpaAppointment, 'id' | 'appointmentNumber' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): SpaAppointment {
    const id = 'appt_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const appointmentNumber = `SPA-${year}-${rand}`;

    const newAppt: SpaAppointment = {
      ...apptData,
      id,
      appointmentNumber,
      createdAt: new Date().toISOString(),
    };

    // If charged to room, post to guest folio
    if (newAppt.chargeToRoomFolio && (newAppt.roomNumber || newAppt.roomId)) {
      const folios = this.getGuestFolios(apptData.hotelId);
      const targetRoom = newAppt.roomNumber || newAppt.roomId;
      const folio = folios.find((f) => f.roomNumber === targetRoom && f.status === 'open');
      if (folio) {
        try {
          this.addChargeToFolio(
            folio.id,
            {
              category: 'spa',
              description: `Spa: ${newAppt.treatmentName} (${newAppt.therapistName})`,
              amount: newAppt.price,
              postedBy: actor.fullName,
            },
            actor
          );
          newAppt.linkedFolioId = folio.id;
        } catch {
          // charge posting error fallback handled silently
        }
      }
    }

    const all = this.getSpaAppointments();
    all.unshift(newAppt);
    writeStorage(STORAGE_KEYS.SPA_APPOINTMENTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SPA_APPOINTMENT_BOOKED',
      module: 'outlets',
      targetId: appointmentNumber,
      hotelId: apptData.hotelId,
      description: `Booked Spa Appointment ${appointmentNumber} for ${apptData.guestName}: ${apptData.treatmentName} (${apptData.price} ${apptData.currency})`,
    });

    return newAppt;
  }

  public updateSpaAppointmentStatus(
    id: string,
    status: SpaAppointment['status'],
    actor: { email: string; fullName: string; role: string }
  ): SpaAppointment | undefined {
    const all = this.getSpaAppointments();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return undefined;

    const current = all[index];
    current.status = status;
    if (status === 'completed' && current.paymentStatus === 'pending') {
      current.paymentStatus = 'paid';
    }

    all[index] = current;
    writeStorage(STORAGE_KEYS.SPA_APPOINTMENTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SPA_STATUS_UPDATED',
      module: 'outlets',
      targetId: current.appointmentNumber,
      hotelId: current.hotelId,
      description: `Spa Appointment ${current.appointmentNumber} updated to "${status}" by ${actor.fullName}`,
    });

    return current;
  }

  public getGuestFeedbacks(hotelId?: string): GuestFeedback[] {
    const all = readStorage<GuestFeedback[]>(STORAGE_KEYS.GUEST_FEEDBACK, SEED_GUEST_FEEDBACK);
    if (!hotelId) return all;
    return all.filter((f) => f.hotelId === hotelId);
  }

  public submitGuestFeedback(feedback: Omit<GuestFeedback, 'id' | 'status' | 'date'>): GuestFeedback {
    const id = 'fb_' + Math.random().toString(36).substring(2, 9);
    const newFeedback: GuestFeedback = {
      ...feedback,
      id,
      status: 'new',
      date: new Date().toISOString().slice(0, 10),
    };

    const all = this.getGuestFeedbacks();
    all.unshift(newFeedback);
    writeStorage(STORAGE_KEYS.GUEST_FEEDBACK, all);
    return newFeedback;
  }

  public respondToFeedback(
    id: string,
    response: string,
    actor: { email: string; fullName: string; role: string }
  ): GuestFeedback | undefined {
    const all = this.getGuestFeedbacks();
    const index = all.findIndex((f) => f.id === id);
    if (index === -1) return undefined;

    const current = all[index];
    current.managementResponse = response;
    current.status = 'reviewed';

    all[index] = current;
    writeStorage(STORAGE_KEYS.GUEST_FEEDBACK, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'FEEDBACK_RESPONDED',
      module: 'settings',
      targetId: current.id,
      hotelId: current.hotelId,
      description: `Management response sent to feedback from ${current.guestName} by ${actor.fullName}`,
    });

    return current;
  }

  // ==========================================
  // PHASE 9: HUMAN RESOURCES, SHIFT ROSTERING & PAYROLL
  // ==========================================

  public getShiftSchedules(hotelId?: string, departmentId?: string, date?: string): ShiftSchedule[] {
    const all = readStorage<ShiftSchedule[]>(STORAGE_KEYS.SHIFT_SCHEDULES, SEED_SHIFT_SCHEDULES);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((s) => s.hotelId === hotelId);
    if (departmentId && departmentId !== 'all') filtered = filtered.filter((s) => s.departmentId === departmentId);
    if (date) filtered = filtered.filter((s) => s.date === date);
    return filtered;
  }

  public saveShiftSchedule(schedule: ShiftSchedule, actor: { email: string; fullName: string; role: string }): void {
    const all = this.getShiftSchedules();
    const index = all.findIndex((s) => s.id === schedule.id);
    if (index >= 0) {
      all[index] = schedule;
    } else {
      all.push(schedule);
    }
    writeStorage(STORAGE_KEYS.SHIFT_SCHEDULES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: index >= 0 ? 'SHIFT_UPDATED' : 'SHIFT_CREATED',
      module: 'employees',
      targetId: schedule.id,
      hotelId: schedule.hotelId,
      description: `Scheduled ${schedule.shiftType.toUpperCase()} shift for ${schedule.employeeName} (${schedule.departmentName}) on ${schedule.date}`,
    });
  }

  public bulkCreateShiftSchedules(schedules: ShiftSchedule[], actor: { email: string; fullName: string; role: string }): void {
    const all = this.getShiftSchedules();
    for (const item of schedules) {
      const idx = all.findIndex((s) => s.id === item.id);
      if (idx >= 0) {
        all[idx] = item;
      } else {
        all.push(item);
      }
    }
    writeStorage(STORAGE_KEYS.SHIFT_SCHEDULES, all);

    if (schedules.length > 0) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'SHIFT_BULK_ROSTERED',
        module: 'employees',
        targetId: schedules[0].id,
        hotelId: schedules[0].hotelId,
        description: `Bulk published ${schedules.length} shifts across hotel roster by ${actor.fullName}`,
      });
    }
  }

  public deleteShiftSchedule(id: string, actor: { email: string; fullName: string; role: string }): void {
    const all = this.getShiftSchedules();
    const item = all.find((s) => s.id === id);
    if (!item) return;
    const filtered = all.filter((s) => s.id !== id);
    writeStorage(STORAGE_KEYS.SHIFT_SCHEDULES, filtered);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SHIFT_DELETED',
      module: 'employees',
      targetId: id,
      hotelId: item.hotelId,
      description: `Cancelled shift for ${item.employeeName} on ${item.date}`,
    });
  }

  public getAttendanceRecords(hotelId?: string, date?: string): AttendanceRecord[] {
    const all = readStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE_RECORDS, SEED_ATTENDANCE_RECORDS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((r) => r.hotelId === hotelId);
    if (date) filtered = filtered.filter((r) => r.date === date);
    return filtered;
  }

  public clockIn(
    employeeId: string,
    hotelId: string,
    actor: { email: string; fullName: string; role: string }
  ): AttendanceRecord {
    const employees = this.getEmployees(hotelId);
    const emp = employees.find((e) => e.id === employeeId);
    const empName = emp ? emp.fullName : actor.fullName;
    const deptName = emp?.departmentName || 'Operations';

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);

    const id = 'att_' + Math.random().toString(36).substring(2, 9);
    const newRecord: AttendanceRecord = {
      id,
      hotelId,
      employeeId,
      employeeName: empName,
      departmentName: deptName,
      date: today,
      clockInTime: timeStr,
      totalHours: 0,
      overtimeHours: 0,
      status: parseInt(timeStr.replace(':', ''), 10) > 815 ? 'late' : 'on_time',
      notes: 'Punched via SEAM Digital Terminal',
    };

    const all = this.getAttendanceRecords();
    all.unshift(newRecord);
    writeStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'ATTENDANCE_CLOCK_IN',
      module: 'employees',
      targetId: newRecord.id,
      hotelId,
      description: `Staff punch-in: ${empName} clocked in at ${timeStr} (${newRecord.status.replace('_', ' ')})`,
    });

    return newRecord;
  }

  public clockOut(
    recordId: string,
    actor: { email: string; fullName: string; role: string }
  ): AttendanceRecord | undefined {
    const all = this.getAttendanceRecords();
    const index = all.findIndex((r) => r.id === recordId);
    if (index === -1) return undefined;

    const record = all[index];
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    record.clockOutTime = timeStr;

    // Calculate hours
    const [inH, inM] = record.clockInTime.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    const hours = Math.round((diffMinutes / 60) * 10) / 10;
    record.totalHours = hours;
    record.overtimeHours = hours > 8 ? Math.round((hours - 8) * 10) / 10 : 0;
    if (record.overtimeHours > 0) {
      record.status = 'overtime';
    }

    all[index] = record;
    writeStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'ATTENDANCE_CLOCK_OUT',
      module: 'employees',
      targetId: record.id,
      hotelId: record.hotelId,
      description: `Staff punch-out: ${record.employeeName} clocked out at ${timeStr} (Total: ${hours} hrs)`,
    });

    return record;
  }

  public getLeaveRequests(hotelId?: string, status?: string): LeaveRequest[] {
    const all = readStorage<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, SEED_LEAVE_REQUESTS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((l) => l.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((l) => l.status === status);
    return filtered;
  }

  public submitLeaveRequest(
    data: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt' | 'updatedAt'>,
    actor: { email: string; fullName: string; role: string }
  ): LeaveRequest {
    const id = 'lv_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newReq: LeaveRequest = {
      ...data,
      id,
      status: 'pending',
      appliedAt: now,
      updatedAt: now,
    };

    const all = this.getLeaveRequests();
    all.unshift(newReq);
    writeStorage(STORAGE_KEYS.LEAVE_REQUESTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'LEAVE_REQUEST_SUBMITTED',
      module: 'employees',
      targetId: newReq.id,
      hotelId: newReq.hotelId,
      description: `Leave request: ${newReq.employeeName} applied for ${newReq.daysCount} days of ${newReq.leaveType} leave`,
    });

    return newReq;
  }

  public updateLeaveRequestStatus(
    id: string,
    status: 'approved' | 'rejected',
    notes: string,
    actor: { email: string; fullName: string; role: string }
  ): LeaveRequest | undefined {
    const all = this.getLeaveRequests();
    const index = all.findIndex((l) => l.id === id);
    if (index === -1) return undefined;

    const item = all[index];
    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (status === 'approved') {
      item.approvedBy = `${actor.role.replace(/_/g, ' ').toUpperCase()} (${actor.fullName})`;
    } else {
      item.rejectionReason = notes;
    }

    all[index] = item;
    writeStorage(STORAGE_KEYS.LEAVE_REQUESTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: status === 'approved' ? 'LEAVE_REQUEST_APPROVED' : 'LEAVE_REQUEST_REJECTED',
      module: 'employees',
      targetId: item.id,
      hotelId: item.hotelId,
      description: `Leave ${status} for ${item.employeeName} (${item.daysCount} days) by ${actor.fullName}`,
    });

    return item;
  }

  public getPayrollPeriods(hotelId?: string): PayrollPeriod[] {
    const all = readStorage<PayrollPeriod[]>(STORAGE_KEYS.PAYROLL_PERIODS, SEED_PAYROLL_PERIODS);
    if (!hotelId) return all;
    return all.filter((p) => p.hotelId === hotelId);
  }

  public getPayrollItems(periodId: string): EmployeePayrollItem[] {
    const all = readStorage<EmployeePayrollItem[]>(STORAGE_KEYS.PAYROLL_ITEMS, SEED_PAYROLL_ITEMS);
    return all.filter((p) => p.payrollPeriodId === periodId);
  }

  public generateMonthlyPayroll(
    hotelId: string,
    periodName: string,
    startDate: string,
    endDate: string,
    serviceChargePool: number,
    actor: { email: string; fullName: string; role: string }
  ): PayrollPeriod {
    const employees = this.getEmployees(hotelId).filter((e) => e.employmentStatus === 'active');
    const eligibleCount = Math.max(1, employees.length);
    const scPerEmployee = Math.round(serviceChargePool / eligibleCount);

    const periodId = 'pay_' + Math.random().toString(36).substring(2, 9);
    let totalGross = 0;
    let totalTax = 0;
    let totalPension = 0;
    let totalNet = 0;

    const currency = this.getHotelById(hotelId)?.operationalSettings?.currency || 'ETB';
    const payrollItems: EmployeePayrollItem[] = employees.map((emp) => {
      const baseSalary = emp.salary || 20000;
      const calc = calculateEthiopianPayrollItem({
        baseSalaryEtb: baseSalary,
        serviceChargeShareEtb: scPerEmployee,
        overtimePayEtb: 0,
        bonusesEtb: 0,
        otherDeductionsEtb: 0,
      });

      totalGross += calc.grossPay;
      totalTax += calc.incomeTax;
      totalPension += calc.pensionEmployee;
      totalNet += calc.netPay;

      return {
        id: 'pi_' + Math.random().toString(36).substring(2, 9),
        payrollPeriodId: periodId,
        hotelId,
        employeeId: emp.id,
        employeeName: emp.fullName,
        departmentName: emp.departmentName,
        designation: emp.position,
        baseSalary: calc.baseSalary,
        serviceChargeShare: calc.serviceChargeShare,
        overtimeHours: 0,
        overtimePay: calc.overtimePay,
        bonuses: calc.bonuses,
        grossPay: calc.grossPay,
        pensionEmployee: calc.pensionEmployee,
        pensionEmployer: calc.pensionEmployer,
        incomeTax: calc.incomeTax,
        otherDeductions: calc.otherDeductions,
        netPay: calc.netPay,
        currency,
        status: 'pending',
      };
    });

    const newPeriod: PayrollPeriod = {
      id: periodId,
      hotelId,
      periodName,
      startDate,
      endDate,
      totalGrossWages: totalGross,
      totalServiceChargePool: serviceChargePool,
      totalTaxDeductions: totalTax,
      totalPensionDeductions: totalPension,
      totalNetPay: totalNet,
      eligibleStaffCount: eligibleCount,
      currency,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    const allPeriods = this.getPayrollPeriods();
    allPeriods.unshift(newPeriod);
    writeStorage(STORAGE_KEYS.PAYROLL_PERIODS, allPeriods);

    const allItems = readStorage<EmployeePayrollItem[]>(STORAGE_KEYS.PAYROLL_ITEMS, SEED_PAYROLL_ITEMS);
    allItems.push(...payrollItems);
    writeStorage(STORAGE_KEYS.PAYROLL_ITEMS, allItems);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'PAYROLL_GENERATED',
      module: 'finance',
      targetId: newPeriod.id,
      hotelId,
      description: `Generated payroll run for "${periodName}": ${eligibleCount} staff, ${serviceChargePool} ETB 10% Service Charge distributed`,
    });

    return newPeriod;
  }

  public disbursePayrollPeriod(
    periodId: string,
    actor: { email: string; fullName: string; role: string }
  ): PayrollPeriod | undefined {
    const allPeriods = this.getPayrollPeriods();
    const index = allPeriods.findIndex((p) => p.id === periodId);
    if (index === -1) return undefined;

    const period = allPeriods[index];
    period.status = 'disbursed';
    period.approvedBy = `${actor.role.replace(/_/g, ' ').toUpperCase()} (${actor.fullName})`;
    period.approvedAt = new Date().toISOString();

    allPeriods[index] = period;
    writeStorage(STORAGE_KEYS.PAYROLL_PERIODS, allPeriods);

    // Mark all items as paid
    const allItems = readStorage<EmployeePayrollItem[]>(STORAGE_KEYS.PAYROLL_ITEMS, SEED_PAYROLL_ITEMS);
    const updatedItems = allItems.map((item) =>
      item.payrollPeriodId === periodId ? { ...item, status: 'paid' as const } : item
    );
    writeStorage(STORAGE_KEYS.PAYROLL_ITEMS, updatedItems);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'PAYROLL_DISBURSED',
      module: 'finance',
      targetId: period.id,
      hotelId: period.hotelId,
      description: `Payroll run "${period.periodName}" disbursed: Net payout of ${period.totalNetPay.toLocaleString()} ${period.currency} authorized`,
    });

    return period;
  }

  // ==========================================
  // PHASE 10: EXECUTIVE BI & PORTFOLIO ANALYTICS
  // ==========================================

  public getPortfolioMetrics(): PortfolioMetric[] {
    const hotels = this.getHotels();
    return hotels.map((h) => {
      const reports = this.getDailyRevenueReports(h.id);
      const rooms = this.getRooms(h.id);
      const totalRooms = rooms.length || h.operationalSettings.totalRooms || 60;
      const latestReport = reports[0];

      const occupiedRooms = latestReport ? latestReport.occupiedRooms : Math.round(totalRooms * 0.76);
      const occupancyRate = latestReport ? latestReport.occupancyRate : 76.0;
      const adr = latestReport ? latestReport.adr : 2850;
      const revPar = latestReport ? latestReport.revPar : Math.round(adr * (occupancyRate / 100));
      const roomsRevenue = latestReport ? latestReport.roomsRevenue : occupiedRooms * adr;
      const fAndBRevenue = latestReport ? (latestReport.foodRevenue + latestReport.beverageRevenue) : Math.round(roomsRevenue * 0.38);
      const otherRevenue = latestReport ? latestReport.otherRevenue : Math.round(roomsRevenue * 0.12);
      const grossRevenue = latestReport ? latestReport.totalGrossRevenue : (roomsRevenue + fAndBRevenue + otherRevenue);
      const netRevenue = latestReport ? latestReport.totalNetRevenue : Math.round(grossRevenue * 0.78);
      
      // GOP (Gross Operating Profit) estimated at ~48% of gross
      const gop = Math.round(grossRevenue * 0.482);
      const gopMargin = 48.2;

      return {
        hotelId: h.id,
        hotelName: h.name,
        hotelCode: h.code,
        city: h.address.city,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        adr,
        revPar,
        grossRevenue,
        netRevenue,
        roomsRevenue,
        fAndBRevenue,
        otherRevenue,
        gop,
        gopMargin,
        currency: h.operationalSettings.currency || 'ETB',
      };
    });
  }

  public getChannelDistribution(hotelId?: string): ChannelDistribution[] {
    const baseRev = 450000;
    return [
      {
        channel: 'direct',
        channelLabel: 'Direct Website & Brand Phone',
        percentage: 38,
        revenue: Math.round(baseRev * 0.38),
        bookingsCount: 42,
        adr: 2950,
      },
      {
        channel: 'corporate',
        channelLabel: 'Corporate & Government Contracts',
        percentage: 26,
        revenue: Math.round(baseRev * 0.26),
        bookingsCount: 28,
        adr: 2750,
      },
      {
        channel: 'walk_in',
        channelLabel: 'Front Desk Walk-in',
        percentage: 16,
        revenue: Math.round(baseRev * 0.16),
        bookingsCount: 18,
        adr: 3100,
      },
      {
        channel: 'ota_booking',
        channelLabel: 'Online Travel Agencies (OTA)',
        percentage: 12,
        revenue: Math.round(baseRev * 0.12),
        bookingsCount: 15,
        adr: 2500,
      },
      {
        channel: 'events_banquet',
        channelLabel: 'Conferences & Banqueting Delegate Blocks',
        percentage: 8,
        revenue: Math.round(baseRev * 0.08),
        bookingsCount: 10,
        adr: 2600,
      },
    ];
  }

  public getKPITargets(hotelId?: string): KPITargetItem[] {
    return readStorage<KPITargetItem[]>(STORAGE_KEYS.KPI_TARGETS, SEED_KPI_TARGETS);
  }

  public getExportJobs(hotelId?: string): ExportJob[] {
    const all = readStorage<ExportJob[]>(STORAGE_KEYS.EXPORT_JOBS, SEED_EXPORT_JOBS);
    if (!hotelId) return all;
    return all.filter((j) => j.hotelId === hotelId);
  }

  public triggerExport(
    hotelId: string,
    reportType: ExportReportType,
    format: 'csv' | 'json' | 'excel',
    actor: { email: string; fullName: string; role: string }
  ): ExportJob {
    const id = 'exp_' + Math.random().toString(36).substring(2, 9);
    const titles: Record<ExportReportType, string> = {
      daily_revenue_flash: 'Daily Revenue Flash Audit Report',
      vat_service_charge_tax: 'Monthly 15% VAT & 10% Service Charge Tax Filing Summary',
      occupancy_statistics: 'National Tourism & Lodging Occupancy Statistics',
      general_ledger_trial_balance: 'General Ledger Monthly Trial Balance Export',
      employee_payroll_summary: 'Hotel Payroll & 10% Service Charge Distribution Summary',
      full_tenant_backup: 'Complete Hotel Tenant Offline JSON Data Vault Backup',
    };

    const newJob: ExportJob = {
      id,
      hotelId,
      reportType,
      title: `${titles[reportType]} (${new Date().toLocaleDateString()})`,
      format,
      fileSizeBytes: Math.floor(25000 + Math.random() * 85000),
      recordsCount: Math.floor(35 + Math.random() * 120),
      generatedBy: `${actor.fullName} (${actor.role.replace(/_/g, ' ')})`,
      generatedAt: new Date().toISOString(),
      downloadUrl: '#',
    };

    const all = this.getExportJobs();
    all.unshift(newJob);
    writeStorage(STORAGE_KEYS.EXPORT_JOBS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EXPORT_GENERATED',
      module: 'finance',
      targetId: newJob.id,
      hotelId,
      description: `Generated ${format.toUpperCase()} compliance export: "${newJob.title}"`,
    });

    return newJob;
  }

  // ==========================================
  // PHASE 11: SECURITY, LOSS PREVENTION, VISITOR PASSES & GUEST SERVICE RECOVERY
  // ==========================================

  public getSecurityIncidents(hotelId?: string, category?: string): SecurityIncident[] {
    const all = readStorage<SecurityIncident[]>(STORAGE_KEYS.SECURITY_INCIDENTS, SEED_SECURITY_INCIDENTS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((i) => i.hotelId === hotelId);
    if (category && category !== 'all') filtered = filtered.filter((i) => i.category === category);
    return filtered;
  }

  public saveSecurityIncident(
    incident: SecurityIncident,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getSecurityIncidents();
    const index = all.findIndex((i) => i.id === incident.id);
    if (index >= 0) {
      all[index] = incident;
    } else {
      all.unshift(incident);
    }
    writeStorage(STORAGE_KEYS.SECURITY_INCIDENTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: index >= 0 ? 'SECURITY_INCIDENT_UPDATED' : 'SECURITY_INCIDENT_LOGGED',
      module: 'security',
      targetId: incident.id,
      hotelId: incident.hotelId,
      description: `Security Incident ${incident.incidentNumber} (${incident.category}): ${incident.location} - Severity: ${incident.severity.toUpperCase()}`,
    });
  }

  public getVisitorPasses(hotelId?: string, status?: string): VisitorGatePass[] {
    const all = readStorage<VisitorGatePass[]>(STORAGE_KEYS.VISITOR_PASSES, SEED_VISITOR_PASSES);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((p) => p.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((p) => p.status === status);
    return filtered;
  }

  public createVisitorPass(
    passData: Omit<VisitorGatePass, 'id' | 'passNumber' | 'status'>,
    actor: { email: string; fullName: string; role: string }
  ): VisitorGatePass {
    const id = 'gp_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const passNumber = `GP-${year}-${rand}`;

    const newPass: VisitorGatePass = {
      ...passData,
      id,
      passNumber,
      status: 'active',
    };

    const all = this.getVisitorPasses();
    all.unshift(newPass);
    writeStorage(STORAGE_KEYS.VISITOR_PASSES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'GATE_PASS_ISSUED',
      module: 'security',
      targetId: newPass.id,
      hotelId: newPass.hotelId,
      description: `Gate Pass ${newPass.passNumber} issued to ${newPass.visitorName} (${newPass.visitorType}) visiting ${newPass.visitingRoomOrDept}`,
    });

    return newPass;
  }

  public checkoutVisitorPass(
    passId: string,
    actor: { email: string; fullName: string; role: string }
  ): VisitorGatePass | undefined {
    const all = this.getVisitorPasses();
    const index = all.findIndex((p) => p.id === passId);
    if (index === -1) return undefined;

    const pass = all[index];
    pass.status = 'cleared';
    pass.exitTime = new Date().toTimeString().slice(0, 5);

    all[index] = pass;
    writeStorage(STORAGE_KEYS.VISITOR_PASSES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'GATE_PASS_CLEARED',
      module: 'security',
      targetId: pass.id,
      hotelId: pass.hotelId,
      description: `Gate Pass ${pass.passNumber} cleared: ${pass.visitorName} exited premises at ${pass.exitTime}`,
    });

    return pass;
  }

  public getLostAndFoundItems(hotelId?: string, status?: string): LostAndFoundItem[] {
    const all = readStorage<LostAndFoundItem[]>(STORAGE_KEYS.LOST_AND_FOUND, SEED_LOST_AND_FOUND);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((i) => i.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((i) => i.status === status);
    return filtered;
  }

  public registerLostItem(
    itemData: Omit<LostAndFoundItem, 'id' | 'itemNumber' | 'status'>,
    actor: { email: string; fullName: string; role: string }
  ): LostAndFoundItem {
    const id = 'lf_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const itemNumber = `LF-${year}-${rand}`;

    const newItem: LostAndFoundItem = {
      ...itemData,
      id,
      itemNumber,
      status: 'in_safekeeping',
    };

    const all = this.getLostAndFoundItems();
    all.unshift(newItem);
    writeStorage(STORAGE_KEYS.LOST_AND_FOUND, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'LOST_ITEM_REGISTERED',
      module: 'security',
      targetId: newItem.id,
      hotelId: newItem.hotelId,
      description: `Registered Lost & Found ${newItem.itemNumber} (${newItem.itemName}) found at ${newItem.foundLocation}`,
    });

    return newItem;
  }

  public claimLostItem(
    itemId: string,
    claimantName: string,
    notes: string,
    actor: { email: string; fullName: string; role: string }
  ): LostAndFoundItem | undefined {
    const all = this.getLostAndFoundItems();
    const index = all.findIndex((i) => i.id === itemId);
    if (index === -1) return undefined;

    const item = all[index];
    item.status = 'claimed';
    item.claimedBy = claimantName;
    item.claimedDate = new Date().toISOString();
    item.claimNotes = notes;

    all[index] = item;
    writeStorage(STORAGE_KEYS.LOST_AND_FOUND, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'LOST_ITEM_CLAIMED',
      module: 'security',
      targetId: item.id,
      hotelId: item.hotelId,
      description: `Lost & Found ${item.itemNumber} (${item.itemName}) claimed by ${claimantName}`,
    });

    return item;
  }

  public getGuestComplaints(hotelId?: string, status?: string): GuestComplaintTicket[] {
    const all = readStorage<GuestComplaintTicket[]>(STORAGE_KEYS.GUEST_COMPLAINTS, SEED_GUEST_COMPLAINTS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((c) => c.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((c) => c.status === status);
    return filtered;
  }

  public createGuestComplaint(
    complaintData: Omit<GuestComplaintTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'timeElapsedMinutes'>,
    actor: { email: string; fullName: string; role: string }
  ): GuestComplaintTicket {
    const id = 'sr_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `SR-${year}-${rand}`;

    const newTicket: GuestComplaintTicket = {
      ...complaintData,
      id,
      ticketNumber,
      status: 'open',
      timeElapsedMinutes: 0,
      createdAt: new Date().toISOString(),
    };

    const all = this.getGuestComplaints();
    all.unshift(newTicket);
    writeStorage(STORAGE_KEYS.GUEST_COMPLAINTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SERVICE_RECOVERY_LOGGED',
      module: 'settings',
      targetId: newTicket.id,
      hotelId: newTicket.hotelId,
      description: `Guest Service Recovery ${newTicket.ticketNumber} opened: ${newTicket.guestName} (${newTicket.category}) - Assigned to ${newTicket.assignedTo}`,
    });

    return newTicket;
  }

  public resolveGuestComplaint(
    ticketId: string,
    resolutionNotes: string,
    compensation: GuestComplaintTicket['compensationOffered'],
    actor: { email: string; fullName: string; role: string }
  ): GuestComplaintTicket | undefined {
    const all = this.getGuestComplaints();
    const index = all.findIndex((c) => c.id === ticketId);
    if (index === -1) return undefined;

    const ticket = all[index];
    ticket.status = 'resolved';
    ticket.resolutionNotes = resolutionNotes;
    ticket.compensationOffered = compensation;
    ticket.guestSatisfied = true;
    ticket.resolvedAt = new Date().toISOString();

    all[index] = ticket;
    writeStorage(STORAGE_KEYS.GUEST_COMPLAINTS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SERVICE_RECOVERY_RESOLVED',
      module: 'settings',
      targetId: ticket.id,
      hotelId: ticket.hotelId,
      description: `Service Recovery ${ticket.ticketNumber} resolved by ${actor.fullName}: ${resolutionNotes}`,
    });

    return ticket;
  }

  // ==========================================
  // PHASE 12: CONCIERGE, FLEET & EXCURSIONS APIS
  // ==========================================
  public getFleetVehicles(hotelId?: string, status?: string): FleetVehicle[] {
    const all = readStorage<FleetVehicle[]>(STORAGE_KEYS.FLEET_VEHICLES, SEED_FLEET_VEHICLES);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((v) => v.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((v) => v.status === status);
    return filtered;
  }

  public saveFleetVehicle(
    vehicle: FleetVehicle,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getFleetVehicles();
    const index = all.findIndex((v) => v.id === vehicle.id);
    if (index >= 0) {
      all[index] = vehicle;
    } else {
      all.unshift(vehicle);
    }
    writeStorage(STORAGE_KEYS.FLEET_VEHICLES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: index >= 0 ? 'FLEET_VEHICLE_UPDATED' : 'FLEET_VEHICLE_REGISTERED',
      module: 'settings',
      targetId: vehicle.id,
      hotelId: vehicle.hotelId,
      description: `Fleet vehicle ${vehicle.vehicleCode} (${vehicle.makeModel} [${vehicle.licensePlate}]) saved by ${actor.fullName}`,
    });
  }

  public updateFleetStatus(
    vehicleId: string,
    status: FleetVehicle['status'],
    odometerKm: number | undefined,
    fuelPercent: number | undefined,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getFleetVehicles();
    const index = all.findIndex((v) => v.id === vehicleId);
    if (index === -1) return;

    all[index].status = status;
    if (odometerKm !== undefined) all[index].currentOdometerKm = odometerKm;
    if (fuelPercent !== undefined) all[index].fuelLevelPercent = fuelPercent;

    writeStorage(STORAGE_KEYS.FLEET_VEHICLES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'FLEET_STATUS_UPDATED',
      module: 'settings',
      targetId: vehicleId,
      hotelId: all[index].hotelId,
      description: `Vehicle ${all[index].vehicleCode} status updated to ${status} (Odo: ${all[index].currentOdometerKm} km, Fuel: ${all[index].fuelLevelPercent}%)`,
    });
  }

  public getAirportTransfers(hotelId?: string, status?: string): AirportTransferBooking[] {
    const all = readStorage<AirportTransferBooking[]>(STORAGE_KEYS.AIRPORT_TRANSFERS, SEED_AIRPORT_TRANSFERS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((t) => t.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((t) => t.status === status);
    return filtered;
  }

  public createAirportTransfer(
    transferData: Omit<AirportTransferBooking, 'id' | 'bookingNumber' | 'status' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): AirportTransferBooking {
    const id = 'trf_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const bookingNumber = `TRF-${year}-${rand}`;

    const newTransfer: AirportTransferBooking = {
      ...transferData,
      id,
      bookingNumber,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    const all = this.getAirportTransfers();
    all.unshift(newTransfer);
    writeStorage(STORAGE_KEYS.AIRPORT_TRANSFERS, all);

    // If folio room charge requested and room has active folio
    if (newTransfer.chargeToFolio && newTransfer.rate > 0 && newTransfer.roomNumber) {
      const activeFolio = this.getGuestFolios(newTransfer.hotelId).find(
        (f) => f.roomNumber === newTransfer.roomNumber && f.status === 'open'
      );
      if (activeFolio) {
        try {
          this.addChargeToFolio(
            activeFolio.id,
            {
              category: 'other',
              outletName: 'Concierge & Transport',
              description: `Airport Transfer (${newTransfer.transferType.replace('_', ' ')}) - ${newTransfer.flightNumber}`,
              amount: newTransfer.rate,
              postedBy: actor.fullName,
            },
            actor
          );
        } catch {
          // ignore charge posting failure
        }
      }
    }

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'AIRPORT_TRANSFER_BOOKED',
      module: 'settings',
      targetId: newTransfer.id,
      hotelId: newTransfer.hotelId,
      description: `Airport transfer ${newTransfer.bookingNumber} booked for ${newTransfer.guestName} (${newTransfer.flightNumber})`,
    });

    return newTransfer;
  }

  public updateTransferStatus(
    transferId: string,
    status: AirportTransferBooking['status'],
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getAirportTransfers();
    const index = all.findIndex((t) => t.id === transferId);
    if (index === -1) return;

    all[index].status = status;
    writeStorage(STORAGE_KEYS.AIRPORT_TRANSFERS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'AIRPORT_TRANSFER_STATUS_UPDATED',
      module: 'settings',
      targetId: transferId,
      hotelId: all[index].hotelId,
      description: `Transfer ${all[index].bookingNumber} status updated to ${status}`,
    });
  }

  public getExcursionActivities(hotelId?: string): ExcursionActivity[] {
    const all = readStorage<ExcursionActivity[]>(STORAGE_KEYS.EXCURSION_ACTIVITIES, SEED_EXCURSION_ACTIVITIES);
    if (hotelId) return all.filter((a) => a.hotelId === hotelId);
    return all;
  }

  public saveExcursionActivity(
    activity: ExcursionActivity,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getExcursionActivities();
    const index = all.findIndex((a) => a.id === activity.id);
    if (index >= 0) {
      all[index] = activity;
    } else {
      all.unshift(activity);
    }
    writeStorage(STORAGE_KEYS.EXCURSION_ACTIVITIES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: index >= 0 ? 'EXCURSION_ACTIVITY_UPDATED' : 'EXCURSION_ACTIVITY_CREATED',
      module: 'settings',
      targetId: activity.id,
      hotelId: activity.hotelId,
      description: `Excursion activity ${activity.code} (${activity.title}) saved`,
    });
  }

  public getExcursionBookings(hotelId?: string, status?: string): ExcursionBooking[] {
    const all = readStorage<ExcursionBooking[]>(STORAGE_KEYS.EXCURSION_BOOKINGS, SEED_EXCURSION_BOOKINGS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((b) => b.hotelId === hotelId);
    if (status && status !== 'all') filtered = filtered.filter((b) => b.status === status);
    return filtered;
  }

  public createExcursionBooking(
    bookingData: Omit<ExcursionBooking, 'id' | 'bookingRef' | 'status' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): ExcursionBooking {
    const id = 'bk_exc_' + Math.random().toString(36).substring(2, 9);
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const bookingRef = `EXC-${year}-${rand}`;

    const newBooking: ExcursionBooking = {
      ...bookingData,
      id,
      bookingRef,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const all = this.getExcursionBookings();
    all.unshift(newBooking);
    writeStorage(STORAGE_KEYS.EXCURSION_BOOKINGS, all);

    // If folio room charge requested and room has active folio
    if (newBooking.chargeToFolio && newBooking.totalPrice > 0 && newBooking.roomNumber) {
      const activeFolio = this.getGuestFolios(newBooking.hotelId).find(
        (f) => f.roomNumber === newBooking.roomNumber && f.status === 'open'
      );
      if (activeFolio) {
        try {
          this.addChargeToFolio(
            activeFolio.id,
            {
              category: 'other',
              outletName: 'Safari Excursions Desk',
              description: `Excursion Safari: ${newBooking.activityTitle} (${newBooking.participantsCount} pax)`,
              amount: newBooking.totalPrice,
              postedBy: actor.fullName,
            },
            actor
          );
        } catch {
          // ignore charge posting failure
        }
      }
    }

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EXCURSION_SAFARI_BOOKED',
      module: 'settings',
      targetId: newBooking.id,
      hotelId: newBooking.hotelId,
      description: `Excursion safari ${newBooking.bookingRef} (${newBooking.activityTitle}) booked for ${newBooking.guestName}`,
    });

    return newBooking;
  }

  public updateExcursionStatus(
    bookingId: string,
    status: ExcursionBooking['status'],
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getExcursionBookings();
    const index = all.findIndex((b) => b.id === bookingId);
    if (index === -1) return;

    all[index].status = status;
    writeStorage(STORAGE_KEYS.EXCURSION_BOOKINGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'EXCURSION_STATUS_UPDATED',
      module: 'settings',
      targetId: bookingId,
      hotelId: all[index].hotelId,
      description: `Excursion ${all[index].bookingRef} status updated to ${status}`,
    });
  }

  // ==========================================
  // PHASE 13: SUSTAINABILITY, UTILITIES & FOOD WASTE APIS
  // ==========================================
  public getUtilityLogs(hotelId?: string, utilityType?: string): UtilityConsumptionLog[] {
    const all = readStorage<UtilityConsumptionLog[]>(STORAGE_KEYS.UTILITY_LOGS, SEED_UTILITY_LOGS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((u) => u.hotelId === hotelId);
    if (utilityType && utilityType !== 'all') filtered = filtered.filter((u) => u.utilityType === utilityType);
    return filtered;
  }

  public createUtilityLog(
    logData: Omit<UtilityConsumptionLog, 'id' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): UtilityConsumptionLog {
    const id = 'utl_' + Math.random().toString(36).substring(2, 9);
    const newLog: UtilityConsumptionLog = {
      ...logData,
      id,
      createdAt: new Date().toISOString(),
    };

    const all = this.getUtilityLogs();
    all.unshift(newLog);
    writeStorage(STORAGE_KEYS.UTILITY_LOGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'UTILITY_CONSUMPTION_LOGGED',
      module: 'settings',
      targetId: newLog.id,
      hotelId: newLog.hotelId,
      description: `Logged ${newLog.utilityType} (${newLog.source}): ${newLog.consumptionUnits} ${newLog.unitOfMeasure} = ${newLog.totalCost} ETB`,
    });

    return newLog;
  }

  public getFoodWasteLogs(hotelId?: string, mealSession?: string): FoodWasteLog[] {
    const all = readStorage<FoodWasteLog[]>(STORAGE_KEYS.FOOD_WASTE_LOGS, SEED_FOOD_WASTE_LOGS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((f) => f.hotelId === hotelId);
    if (mealSession && mealSession !== 'all') filtered = filtered.filter((f) => f.mealSession === mealSession);
    return filtered;
  }

  public createFoodWasteLog(
    wasteData: Omit<FoodWasteLog, 'id' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): FoodWasteLog {
    const id = 'fw_' + Math.random().toString(36).substring(2, 9);
    const newWaste: FoodWasteLog = {
      ...wasteData,
      id,
      createdAt: new Date().toISOString(),
    };

    const all = this.getFoodWasteLogs();
    all.unshift(newWaste);
    writeStorage(STORAGE_KEYS.FOOD_WASTE_LOGS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'FOOD_WASTE_LOGGED',
      module: 'settings',
      targetId: newWaste.id,
      hotelId: newWaste.hotelId,
      description: `Food waste logged (${newWaste.mealSession} - ${newWaste.category}): ${newWaste.weightKg} kg (${newWaste.destination})`,
    });

    return newWaste;
  }

  public getEcoOptIns(hotelId?: string): EcoGuestOptIn[] {
    const all = readStorage<EcoGuestOptIn[]>(STORAGE_KEYS.ECO_GUEST_OPT_INS, SEED_ECO_GUEST_OPT_INS);
    if (hotelId) return all.filter((o) => o.hotelId === hotelId);
    return all;
  }

  public registerEcoOptIn(
    optInData: Omit<EcoGuestOptIn, 'id' | 'optInDate'>,
    actor: { email: string; fullName: string; role: string }
  ): EcoGuestOptIn {
    const id = 'opt_' + Math.random().toString(36).substring(2, 9);
    const newOptIn: EcoGuestOptIn = {
      ...optInData,
      id,
      optInDate: new Date().toISOString(),
    };

    const all = this.getEcoOptIns();
    all.unshift(newOptIn);
    writeStorage(STORAGE_KEYS.ECO_GUEST_OPT_INS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'ECO_OPT_IN_REGISTERED',
      module: 'settings',
      targetId: newOptIn.id,
      hotelId: newOptIn.hotelId,
      description: `Room ${newOptIn.roomNumber} (${newOptIn.guestName}) opted into Green Linen program (+${newOptIn.loyaltyEcoPointsAwarded} points)`,
    });

    return newOptIn;
  }

  public getSustainabilityAudits(hotelId?: string, standard?: string): SustainabilityAuditItem[] {
    const all = readStorage<SustainabilityAuditItem[]>(STORAGE_KEYS.SUSTAINABILITY_AUDITS, SEED_SUSTAINABILITY_AUDITS);
    let filtered = all;
    if (hotelId) filtered = filtered.filter((a) => a.hotelId === hotelId);
    if (standard && standard !== 'all') filtered = filtered.filter((a) => a.auditStandard === standard);
    return filtered;
  }

  public updateSustainabilityAudit(
    item: SustainabilityAuditItem,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getSustainabilityAudits();
    const index = all.findIndex((a) => a.id === item.id);
    if (index >= 0) {
      all[index] = item;
    } else {
      all.unshift(item);
    }
    writeStorage(STORAGE_KEYS.SUSTAINABILITY_AUDITS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'SUSTAINABILITY_AUDIT_UPDATED',
      module: 'settings',
      targetId: item.id,
      hotelId: item.hotelId,
      description: `Sustainability criterion ${item.criterion} updated (${item.complianceStatus} - ${item.currentScorePercent}%)`,
    });
  }

  // ==========================================
  // PHASE 14: CRS, CHANNEL MANAGER & DYNAMIC PRICING APIS
  // ==========================================
  public getChannelConnections(hotelId?: string): ChannelConnection[] {
    const all = readStorage<ChannelConnection[]>(STORAGE_KEYS.CHANNEL_CONNECTIONS, SEED_CHANNEL_CONNECTIONS);
    if (hotelId) return all.filter((c) => c.hotelId === hotelId);
    return all;
  }

  public updateChannelConnection(
    conn: ChannelConnection,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getChannelConnections();
    const index = all.findIndex((c) => c.id === conn.id);
    if (index >= 0) {
      all[index] = conn;
    } else {
      all.push(conn);
    }
    writeStorage(STORAGE_KEYS.CHANNEL_CONNECTIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'CHANNEL_CONNECTION_UPDATED',
      module: 'rooms',
      targetId: conn.id,
      hotelId: conn.hotelId,
      description: `Updated channel connection for ${conn.channelName} (Status: ${conn.status})`,
    });
  }

  public triggerChannelSync(
    channelId: string,
    actor: { email: string; fullName: string; role: string }
  ): ChannelConnection {
    const all = this.getChannelConnections();
    const index = all.findIndex((c) => c.id === channelId);
    if (index < 0) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const updated: ChannelConnection = {
      ...all[index],
      status: 'connected',
      lastSyncTimestamp: new Date().toISOString(),
    };
    all[index] = updated;
    writeStorage(STORAGE_KEYS.CHANNEL_CONNECTIONS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'CHANNEL_SYNC_TRIGGERED',
      module: 'rooms',
      targetId: updated.id,
      hotelId: updated.hotelId,
      description: `Triggered 2-way ARI (Availability, Rates & Inventory) push to ${updated.channelName}`,
    });

    return updated;
  }

  public getRateParityChecks(hotelId?: string): RateParityCheck[] {
    const all = readStorage<RateParityCheck[]>(STORAGE_KEYS.RATE_PARITY_CHECKS, SEED_RATE_PARITY_CHECKS);
    if (hotelId) return all.filter((p) => p.hotelId === hotelId);
    return all;
  }

  public updateRateParityCheck(
    check: RateParityCheck,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getRateParityChecks();
    const index = all.findIndex((p) => p.id === check.id);
    if (index >= 0) {
      all[index] = check;
    } else {
      all.push(check);
    }
    writeStorage(STORAGE_KEYS.RATE_PARITY_CHECKS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'RATE_PARITY_UPDATED',
      module: 'rooms',
      targetId: check.id,
      hotelId: check.hotelId,
      description: `Rate parity benchmark updated for ${check.roomTypeName} (${check.parityStatus})`,
    });
  }

  public getDynamicYieldRules(hotelId?: string): DynamicYieldRule[] {
    const all = readStorage<DynamicYieldRule[]>(STORAGE_KEYS.DYNAMIC_YIELD_RULES, SEED_DYNAMIC_YIELD_RULES);
    if (hotelId) return all.filter((r) => r.hotelId === hotelId);
    return all;
  }

  public createDynamicYieldRule(
    ruleData: Omit<DynamicYieldRule, 'id' | 'updatedAt'>,
    actor: { email: string; fullName: string; role: string }
  ): DynamicYieldRule {
    const id = 'rul_' + Math.random().toString(36).substring(2, 9);
    const newRule: DynamicYieldRule = {
      ...ruleData,
      id,
      updatedAt: new Date().toISOString(),
    };

    const all = this.getDynamicYieldRules();
    all.unshift(newRule);
    writeStorage(STORAGE_KEYS.DYNAMIC_YIELD_RULES, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'DYNAMIC_YIELD_RULE_CREATED',
      module: 'rooms',
      targetId: newRule.id,
      hotelId: newRule.hotelId,
      description: `Created dynamic pricing yield rule: ${newRule.ruleName} (${newRule.condition})`,
    });

    return newRule;
  }

  public toggleDynamicYieldRule(
    ruleId: string,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getDynamicYieldRules();
    const rule = all.find((r) => r.id === ruleId);
    if (rule) {
      rule.isActive = !rule.isActive;
      rule.updatedAt = new Date().toISOString();
      writeStorage(STORAGE_KEYS.DYNAMIC_YIELD_RULES, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'DYNAMIC_YIELD_RULE_TOGGLED',
        module: 'rooms',
        targetId: rule.id,
        hotelId: rule.hotelId,
        description: `Toggled yield rule ${rule.ruleName} to ${rule.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      });
    }
  }

  public getRatePlans(hotelId?: string): RatePlan[] {
    const all = readStorage<RatePlan[]>(STORAGE_KEYS.RATE_PLANS, SEED_RATE_PLANS);
    if (hotelId) return all.filter((rp) => rp.hotelId === hotelId);
    return all;
  }

  public saveRatePlan(
    plan: RatePlan,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getRatePlans();
    const index = all.findIndex((rp) => rp.id === plan.id);
    if (index >= 0) {
      all[index] = plan;
    } else {
      all.push(plan);
    }
    writeStorage(STORAGE_KEYS.RATE_PLANS, all);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'RATE_PLAN_SAVED',
      module: 'rooms',
      targetId: plan.id,
      hotelId: plan.hotelId,
      description: `Rate plan ${plan.name} (${plan.code}) saved.`,
    });
  }

  public getDirectWebBookings(hotelId?: string): DirectWebBookingRequest[] {
    const all = readStorage<DirectWebBookingRequest[]>(STORAGE_KEYS.DIRECT_WEB_BOOKINGS, SEED_DIRECT_WEB_BOOKINGS);
    if (hotelId) return all.filter((b) => b.hotelId === hotelId);
    return all;
  }

  public submitDirectWebBooking(
    bookingData: Omit<DirectWebBookingRequest, 'id' | 'createdAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): DirectWebBookingRequest {
    const id = 'dwb_' + Math.random().toString(36).substring(2, 9);
    const newBooking: DirectWebBookingRequest = {
      ...bookingData,
      id,
      createdAt: new Date().toISOString(),
    };

    const all = this.getDirectWebBookings();
    all.unshift(newBooking);
    writeStorage(STORAGE_KEYS.DIRECT_WEB_BOOKINGS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'DIRECT_WEB_BOOKING_SUBMITTED',
        module: 'rooms',
        targetId: newBooking.id,
        hotelId: newBooking.hotelId,
        description: `Direct web reservation ingested for ${newBooking.guestName} (${newBooking.totalPrice} ${newBooking.currency})`,
      });
    }

    return newBooking;
  }

  // ==========================================
  // PHASE 15: DIGITAL GUEST TABLET, SMART ROOM & QR COMPENDIUM APIS
  // ==========================================
  public getRoomServiceOrders(hotelId?: string): RoomServiceOrder[] {
    const all = readStorage<RoomServiceOrder[]>(STORAGE_KEYS.ROOM_SERVICE_ORDERS, SEED_ROOM_SERVICE_ORDERS);
    if (hotelId) return all.filter((o) => o.hotelId === hotelId);
    return all;
  }

  public createRoomServiceOrder(
    orderData: Omit<RoomServiceOrder, 'id' | 'placedAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): RoomServiceOrder {
    const id = 'rso_' + Math.random().toString(36).substring(2, 9);
    const newOrder: RoomServiceOrder = {
      ...orderData,
      id,
      placedAt: new Date().toISOString(),
    };

    const all = this.getRoomServiceOrders();
    all.unshift(newOrder);
    writeStorage(STORAGE_KEYS.ROOM_SERVICE_ORDERS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_SERVICE_ORDER_PLACED',
        module: 'rooms',
        targetId: newOrder.id,
        hotelId: newOrder.hotelId,
        description: `Room service order placed by Room ${newOrder.roomNumber} (${newOrder.guestName}) for ${newOrder.totalPrice} ${newOrder.currency}`,
      });
    }

    return newOrder;
  }

  public updateRoomServiceOrderStatus(
    orderId: string,
    status: RoomServiceOrder['orderStatus'],
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getRoomServiceOrders();
    const order = all.find((o) => o.id === orderId);
    if (order) {
      order.orderStatus = status;
      writeStorage(STORAGE_KEYS.ROOM_SERVICE_ORDERS, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_SERVICE_ORDER_UPDATED',
        module: 'rooms',
        targetId: order.id,
        hotelId: order.hotelId,
        description: `Room service order ${order.id} for Room ${order.roomNumber} updated to ${status.toUpperCase()}`,
      });
    }
  }

  public getGuestServiceRequests(hotelId?: string): GuestServiceRequest[] {
    const all = readStorage<GuestServiceRequest[]>(STORAGE_KEYS.GUEST_SERVICE_REQUESTS, SEED_GUEST_SERVICE_REQUESTS);
    if (hotelId) return all.filter((r) => r.hotelId === hotelId);
    return all;
  }

  public createGuestServiceRequest(
    reqData: Omit<GuestServiceRequest, 'id' | 'requestedAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): GuestServiceRequest {
    const id = 'req_' + Math.random().toString(36).substring(2, 9);
    const newReq: GuestServiceRequest = {
      ...reqData,
      id,
      requestedAt: new Date().toISOString(),
    };

    const all = this.getGuestServiceRequests();
    all.unshift(newReq);
    writeStorage(STORAGE_KEYS.GUEST_SERVICE_REQUESTS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'GUEST_SERVICE_REQUESTED',
        module: 'rooms',
        targetId: newReq.id,
        hotelId: newReq.hotelId,
        description: `Guest in Room ${newReq.roomNumber} requested ${newReq.requestType} (${newReq.details})`,
      });
    }

    return newReq;
  }

  public updateGuestServiceRequestStatus(
    reqId: string,
    status: GuestServiceRequest['status'],
    staffName?: string,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getGuestServiceRequests();
    const req = all.find((r) => r.id === reqId);
    if (req) {
      req.status = status;
      if (staffName) req.assignedStaffName = staffName;
      if (status === 'completed') req.completedAt = new Date().toISOString();
      writeStorage(STORAGE_KEYS.GUEST_SERVICE_REQUESTS, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'GUEST_SERVICE_UPDATED',
          module: 'rooms',
          targetId: req.id,
          hotelId: req.hotelId,
          description: `Guest request #${req.id} for Room ${req.roomNumber} updated to ${status.toUpperCase()}`,
        });
      }
    }
  }

  public getExpressCheckOuts(hotelId?: string): ExpressCheckOutRequest[] {
    const all = readStorage<ExpressCheckOutRequest[]>(STORAGE_KEYS.EXPRESS_CHECKOUTS, SEED_EXPRESS_CHECKOUTS);
    if (hotelId) return all.filter((e) => e.hotelId === hotelId);
    return all;
  }

  public submitExpressCheckOut(
    ecoData: Omit<ExpressCheckOutRequest, 'id' | 'createdAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): ExpressCheckOutRequest {
    const id = 'eco_' + Math.random().toString(36).substring(2, 9);
    const newEco: ExpressCheckOutRequest = {
      ...ecoData,
      id,
      createdAt: new Date().toISOString(),
    };

    const all = this.getExpressCheckOuts();
    all.unshift(newEco);
    writeStorage(STORAGE_KEYS.EXPRESS_CHECKOUTS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'EXPRESS_CHECKOUT_SUBMITTED',
        module: 'rooms',
        targetId: newEco.id,
        hotelId: newEco.hotelId,
        description: `Express check-out requested by Room ${newEco.roomNumber} (${newEco.guestName}) balance: ${newEco.outstandingBalance} ETB`,
      });
    }

    return newEco;
  }

  public updateExpressCheckOutStatus(
    ecoId: string,
    status: ExpressCheckOutRequest['status'],
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getExpressCheckOuts();
    const eco = all.find((e) => e.id === ecoId);
    if (eco) {
      eco.status = status;
      writeStorage(STORAGE_KEYS.EXPRESS_CHECKOUTS, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'EXPRESS_CHECKOUT_STATUS_UPDATED',
        module: 'rooms',
        targetId: eco.id,
        hotelId: eco.hotelId,
        description: `Express checkout for Room ${eco.roomNumber} marked ${status.toUpperCase()}`,
      });
    }
  }

  // ==========================================
  // PHASE 16: SUPPLY CHAIN, VENDOR REGISTRY & THREE-WAY MATCHING APIS
  // ==========================================
  public getSuppliers(hotelId?: string, category?: string): SupplierVendor[] {
    const all = readStorage<SupplierVendor[]>(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    return all.filter((s) => {
      if (hotelId && s.hotelId !== hotelId) return false;
      if (category && category !== 'all' && s.category !== category) return false;
      return true;
    });
  }

  public createSupplier(
    supplierData: Omit<SupplierVendor, 'id'>,
    actor?: { email: string; fullName: string; role: string }
  ): SupplierVendor {
    const id = 'sup_' + Math.random().toString(36).substring(2, 9);
    const newSupplier: SupplierVendor = {
      ...supplierData,
      id,
    };

    const all = this.getSuppliers();
    all.unshift(newSupplier);
    writeStorage(STORAGE_KEYS.SUPPLIERS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'VENDOR_CREATED',
        module: 'finance',
        targetId: newSupplier.id,
        hotelId: newSupplier.hotelId,
        description: `Registered approved vendor: ${newSupplier.name} (TIN: ${newSupplier.tinNumber})`,
      });
    }

    return newSupplier;
  }

  public getPurchaseOrders(hotelId?: string, status?: string): PurchaseOrder[] {
    const all = readStorage<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, SEED_PURCHASE_ORDERS);
    return all.filter((po) => {
      if (hotelId && po.hotelId !== hotelId) return false;
      if (status && status !== 'all' && po.status !== status) return false;
      return true;
    });
  }

  public createPurchaseOrder(
    poData: Omit<PurchaseOrder, 'id' | 'createdAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): PurchaseOrder {
    const id = 'po_' + Math.random().toString(36).substring(2, 9);
    const newPo: PurchaseOrder = {
      ...poData,
      id,
      createdAt: new Date().toISOString(),
    };

    const all = this.getPurchaseOrders();
    all.unshift(newPo);
    writeStorage(STORAGE_KEYS.PURCHASE_ORDERS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'PURCHASE_ORDER_GENERATED',
        module: 'finance',
        targetId: newPo.id,
        hotelId: newPo.hotelId,
        description: `Generated Purchase Order ${newPo.poNumber} to ${newPo.vendorName} for ${newPo.totalAmount.toLocaleString()} ${newPo.currency}`,
      });
    }

    return newPo;
  }

  public updatePurchaseOrderStatus(
    poId: string,
    status: PurchaseOrder['status'],
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getPurchaseOrders();
    const po = all.find((p) => p.id === poId);
    if (po) {
      po.status = status;
      if (status === 'approved' && !po.approvedBy) {
        po.approvedBy = `${actor.fullName} (${actor.role})`;
      }
      writeStorage(STORAGE_KEYS.PURCHASE_ORDERS, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'PURCHASE_ORDER_STATUS_UPDATED',
        module: 'finance',
        targetId: po.id,
        hotelId: po.hotelId,
        description: `PO ${po.poNumber} status changed to ${status.toUpperCase()}`,
      });
    }
  }

  public getThreeWayMatches(hotelId?: string): ThreeWayInvoiceMatch[] {
    const all = readStorage<ThreeWayInvoiceMatch[]>(STORAGE_KEYS.THREE_WAY_MATCHES, SEED_THREE_WAY_MATCHES);
    if (hotelId) return all.filter((m) => m.hotelId === hotelId);
    return all;
  }

  public createThreeWayMatch(
    matchData: Omit<ThreeWayInvoiceMatch, 'id' | 'createdAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): ThreeWayInvoiceMatch {
    const id = 'twm_' + Math.random().toString(36).substring(2, 9);
    const newMatch: ThreeWayInvoiceMatch = {
      ...matchData,
      id,
      createdAt: new Date().toISOString(),
    };

    const all = this.getThreeWayMatches();
    all.unshift(newMatch);
    writeStorage(STORAGE_KEYS.THREE_WAY_MATCHES, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'THREE_WAY_MATCH_AUDITED',
        module: 'finance',
        targetId: newMatch.id,
        hotelId: newMatch.hotelId,
        description: `Reconciled Invoice ${newMatch.invoiceNumber} vs ${newMatch.poNumber} & ${newMatch.grvNumber} (Status: ${newMatch.matchStatus})`,
      });
    }

    return newMatch;
  }

  public updateThreeWayMatchStatus(
    matchId: string,
    matchStatus: ThreeWayInvoiceMatch['matchStatus'],
    paymentStatus?: ThreeWayInvoiceMatch['paymentStatus'],
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getThreeWayMatches();
    const match = all.find((m) => m.id === matchId);
    if (match) {
      match.matchStatus = matchStatus;
      if (paymentStatus) {
        match.paymentStatus = paymentStatus;
      }
      if (actor) {
        match.reconciledBy = `${actor.fullName} (${actor.role})`;
      }
      writeStorage(STORAGE_KEYS.THREE_WAY_MATCHES, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'THREE_WAY_MATCH_STATUS_UPDATED',
          module: 'finance',
          targetId: match.id,
          hotelId: match.hotelId,
          description: `Invoice ${match.invoiceNumber} match status changed to ${matchStatus.toUpperCase()} (Payment: ${match.paymentStatus})`,
        });
      }
    }
  }

  // ==========================================
  // PHASE 17: COMMERCIAL LAUNDRY, LINEN PAR & GUEST VALET APIS
  // ==========================================
  public getLinenItems(hotelId?: string, category?: string): LinenItem[] {
    const all = readStorage<LinenItem[]>(STORAGE_KEYS.LINEN_ITEMS, SEED_LINEN_ITEMS);
    return all.filter((l) => {
      if (hotelId && l.hotelId !== hotelId) return false;
      if (category && category !== 'all' && l.category !== category) return false;
      return true;
    });
  }

  public updateLinenStock(
    itemId: string,
    updates: Partial<LinenItem>,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getLinenItems();
    const item = all.find((i) => i.id === itemId);
    if (item) {
      Object.assign(item, updates);
      item.totalStockCount = item.inRoomsCount + item.inLaundryCount + item.cleanInPantryCount + item.reserveStorageCount;
      writeStorage(STORAGE_KEYS.LINEN_ITEMS, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'LINEN_STOCK_UPDATED',
          module: 'rooms',
          targetId: item.id,
          hotelId: item.hotelId,
          description: `Audited linen count for ${item.name}: ${item.totalStockCount} units (In Rooms: ${item.inRoomsCount}, In Wash: ${item.inLaundryCount}, Pantry: ${item.cleanInPantryCount}, Reserve: ${item.reserveStorageCount})`,
        });
      }
    }
  }

  public recordLinenDiscard(
    itemId: string,
    discardCount: number,
    reason: string,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getLinenItems();
    const item = all.find((i) => i.id === itemId);
    if (item && discardCount > 0) {
      item.damagedDiscardedThisMonth += discardCount;
      item.reserveStorageCount = Math.max(0, item.reserveStorageCount - discardCount);
      item.totalStockCount = item.inRoomsCount + item.inLaundryCount + item.cleanInPantryCount + item.reserveStorageCount;
      writeStorage(STORAGE_KEYS.LINEN_ITEMS, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'LINEN_DISCARD_RECORDED',
          module: 'rooms',
          targetId: item.id,
          hotelId: item.hotelId,
          description: `Discarded ${discardCount} damaged units of ${item.name} into rags. Reason: ${reason} (Loss: ${(discardCount * item.unitCost).toLocaleString()} ETB)`,
        });
      }
    }
  }

  public getLaundryWashLoads(hotelId?: string, status?: string): LaundryWashLoad[] {
    const all = readStorage<LaundryWashLoad[]>(STORAGE_KEYS.LAUNDRY_WASH_LOADS, SEED_LAUNDRY_WASH_LOADS);
    return all.filter((l) => {
      if (hotelId && l.hotelId !== hotelId) return false;
      if (status && status !== 'all' && l.cycleStatus !== status) return false;
      return true;
    });
  }

  public createLaundryWashLoad(
    loadData: Omit<LaundryWashLoad, 'id' | 'startedAt'>,
    actor?: { email: string; fullName: string; role: string }
  ): LaundryWashLoad {
    const id = 'load_' + Math.random().toString(36).substring(2, 9);
    const newLoad: LaundryWashLoad = {
      ...loadData,
      id,
      startedAt: new Date().toISOString(),
    };

    const all = this.getLaundryWashLoads();
    all.unshift(newLoad);
    writeStorage(STORAGE_KEYS.LAUNDRY_WASH_LOADS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'LAUNDRY_WASH_CYCLE_STARTED',
        module: 'rooms',
        targetId: newLoad.id,
        hotelId: newLoad.hotelId,
        description: `Started batch ${newLoad.batchNumber} (${newLoad.weightKg}kg) on ${newLoad.machineId} [${newLoad.programType}]`,
      });
    }

    return newLoad;
  }

  public updateLaundryWashLoadStatus(
    loadId: string,
    status: LaundryWashLoad['cycleStatus'],
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getLaundryWashLoads();
    const load = all.find((l) => l.id === loadId);
    if (load) {
      load.cycleStatus = status;
      if (status === 'completed' && !load.completedAt) {
        load.completedAt = new Date().toISOString();
      }
      writeStorage(STORAGE_KEYS.LAUNDRY_WASH_LOADS, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'LAUNDRY_CYCLE_STATUS_UPDATED',
          module: 'rooms',
          targetId: load.id,
          hotelId: load.hotelId,
          description: `Wash batch ${load.batchNumber} moved to ${status.toUpperCase()}`,
        });
      }
    }
  }

  public getGuestLaundryOrders(hotelId?: string, status?: string): GuestLaundryOrder[] {
    const all = readStorage<GuestLaundryOrder[]>(STORAGE_KEYS.GUEST_LAUNDRY_ORDERS, SEED_GUEST_LAUNDRY_ORDERS);
    return all.filter((o) => {
      if (hotelId && o.hotelId !== hotelId) return false;
      if (status && status !== 'all' && o.status !== status) return false;
      return true;
    });
  }

  public createGuestLaundryOrder(
    orderData: Omit<GuestLaundryOrder, 'id' | 'receivedAt'>,
    postToFolio: boolean = true,
    actor?: { email: string; fullName: string; role: string }
  ): GuestLaundryOrder {
    const id = 'glo_' + Math.random().toString(36).substring(2, 9);
    const folioChargeId = postToFolio ? 'chg_valet_' + Math.random().toString(36).substring(2, 9) : undefined;

    const newOrder: GuestLaundryOrder = {
      ...orderData,
      id,
      receivedAt: new Date().toISOString(),
      isBilledToFolio: postToFolio,
      folioChargeId,
    };

    const all = this.getGuestLaundryOrders();
    all.unshift(newOrder);
    writeStorage(STORAGE_KEYS.GUEST_LAUNDRY_ORDERS, all);

    if (postToFolio) {
      const folios = this.getGuestFolios(newOrder.hotelId);
      const folio = folios.find(
        (f: GuestFolio) =>
          f.hotelId === newOrder.hotelId &&
          (f.bookingId === newOrder.reservationId || f.status === 'open')
      );

      if (folio) {
        try {
          this.addChargeToFolio(
            folio.id,
            {
              description: `Valet Laundry & Dry Cleaning (${newOrder.orderNumber} - ${newOrder.items.length} garments)`,
              category: 'laundry',
              amount: newOrder.subtotal,
              postedBy: actor ? `${actor.fullName} (Valet)` : 'Laundry Dept',
            },
            actor || { email: 'laundry@seamhotel.com', fullName: 'Laundry Attendant', role: 'staff' }
          );
        } catch (e) {
          console.warn('Folio charge posting bypassed:', e);
        }
      }
    }

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'GUEST_LAUNDRY_ORDER_CREATED',
        module: 'rooms',
        targetId: newOrder.id,
        hotelId: newOrder.hotelId,
        description: `Created Valet Order ${newOrder.orderNumber} for Room ${newOrder.roomNumber} (${newOrder.guestName}) - ${newOrder.totalAmount.toLocaleString()} ETB`,
      });
    }

    return newOrder;
  }

  public updateGuestLaundryOrderStatus(
    orderId: string,
    status: GuestLaundryOrder['status'],
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getGuestLaundryOrders();
    const order = all.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      if (status === 'delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date().toISOString();
      }
      writeStorage(STORAGE_KEYS.GUEST_LAUNDRY_ORDERS, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'GUEST_LAUNDRY_STATUS_UPDATED',
          module: 'rooms',
          targetId: order.id,
          hotelId: order.hotelId,
          description: `Valet Order ${order.orderNumber} (Room ${order.roomNumber}) marked ${status.toUpperCase()}`,
        });
      }
    }
  }

  // ==========================================
  // PHASE 18: KITCHEN RECIPE COSTING & MENU ENGINEERING APIS
  // ==========================================
  public getRecipeCards(hotelId?: string, category?: string): RecipeCard[] {
    const all = readStorage<RecipeCard[]>(STORAGE_KEYS.RECIPE_CARDS, SEED_RECIPE_CARDS);
    return all.filter((r) => {
      if (hotelId && r.hotelId !== hotelId) return false;
      if (category && category !== 'all' && r.category !== category) return false;
      return true;
    });
  }

  public createRecipeCard(
    recipeData: Omit<RecipeCard, 'id' | 'totalCost' | 'portionCost' | 'foodCostPercentage' | 'grossProfit' | 'lastCostedDate'>,
    actor?: { email: string; fullName: string; role: string }
  ): RecipeCard {
    const id = 'rcp_' + Math.random().toString(36).substring(2, 9);
    const totalCost = recipeData.ingredients.reduce((sum, ing) => sum + ing.costContribution, 0);
    const portionCost = Math.round((totalCost / (recipeData.servingPortions || 1)) * 100) / 100;
    const foodCostPercentage = Math.round((portionCost / (recipeData.sellingPrice || 1)) * 1000) / 10;
    const grossProfit = recipeData.sellingPrice - portionCost;

    const newRecipe: RecipeCard = {
      ...recipeData,
      id,
      totalCost,
      portionCost,
      foodCostPercentage,
      grossProfit,
      lastCostedDate: new Date().toISOString().slice(0, 10),
    };

    const all = this.getRecipeCards();
    all.unshift(newRecipe);
    writeStorage(STORAGE_KEYS.RECIPE_CARDS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'RECIPE_CARD_CREATED',
        module: 'outlets',
        targetId: newRecipe.id,
        hotelId: newRecipe.hotelId,
        description: `Costed recipe card for ${newRecipe.dishName} (${newRecipe.recipeCode}): Portion Cost ${portionCost} ETB (${foodCostPercentage}% FC)`,
      });
    }

    return newRecipe;
  }

  public updateRecipeCard(
    recipeId: string,
    updates: Partial<RecipeCard>,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getRecipeCards();
    const recipe = all.find((r) => r.id === recipeId);
    if (recipe) {
      Object.assign(recipe, updates);
      if (updates.ingredients || updates.sellingPrice || updates.servingPortions) {
        recipe.totalCost = recipe.ingredients.reduce((sum, ing) => sum + ing.costContribution, 0);
        recipe.portionCost = Math.round((recipe.totalCost / (recipe.servingPortions || 1)) * 100) / 100;
        recipe.foodCostPercentage = Math.round((recipe.portionCost / (recipe.sellingPrice || 1)) * 1000) / 10;
        recipe.grossProfit = recipe.sellingPrice - recipe.portionCost;
      }
      recipe.lastCostedDate = new Date().toISOString().slice(0, 10);
      writeStorage(STORAGE_KEYS.RECIPE_CARDS, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'RECIPE_CARD_UPDATED',
          module: 'outlets',
          targetId: recipe.id,
          hotelId: recipe.hotelId,
          description: `Updated recipe card for ${recipe.dishName}: New portion cost ${recipe.portionCost} ETB (${recipe.foodCostPercentage}% FC)`,
        });
      }
    }
  }

  public getFoodCostVariances(hotelId?: string): FoodCostVarianceRecord[] {
    const all = readStorage<FoodCostVarianceRecord[]>(STORAGE_KEYS.FOOD_COST_VARIANCES, SEED_FOOD_COST_VARIANCES);
    if (hotelId) return all.filter((v) => v.hotelId === hotelId);
    return all;
  }

  public recordFoodCostVariance(
    recordData: Omit<FoodCostVarianceRecord, 'id'>,
    actor?: { email: string; fullName: string; role: string }
  ): FoodCostVarianceRecord {
    const id = 'fcv_' + Math.random().toString(36).substring(2, 9);
    const newRecord: FoodCostVarianceRecord = {
      ...recordData,
      id,
    };

    const all = this.getFoodCostVariances();
    all.unshift(newRecord);
    writeStorage(STORAGE_KEYS.FOOD_COST_VARIANCES, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'FOOD_COST_VARIANCE_RECORDED',
        module: 'finance',
        targetId: newRecord.id,
        hotelId: newRecord.hotelId,
        description: `Audited ${newRecord.periodMonth} food cost variance for ${newRecord.outletId}: Theoretical ${newRecord.theoreticalCostPercentage}% vs Actual ${newRecord.actualCostPercentage}% (Variance: ${newRecord.variancePercentage}%)`,
      });
    }

    return newRecord;
  }

  // ==========================================
  // PHASE 19: ONLINE REPUTATION & SENTIMENT INTELLIGENCE
  // ==========================================

  public getGuestReviews(hotelId?: string, channel?: string, sentiment?: string): GuestReview[] {
    const all = readStorage<GuestReview[]>(STORAGE_KEYS.GUEST_REVIEWS, SEED_GUEST_REVIEWS);
    return all.filter((r) => {
      if (hotelId && r.hotelId !== hotelId) return false;
      if (channel && channel !== 'all' && r.channel !== channel) return false;
      if (sentiment && sentiment !== 'all' && r.sentimentPolarity !== sentiment) return false;
      return true;
    });
  }

  public addManagementResponse(
    reviewId: string,
    responseText: string,
    publishedToChannel: boolean,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getGuestReviews();
    const review = all.find((r) => r.id === reviewId);
    if (review) {
      review.managementResponse = {
        responseText,
        respondedBy: actor.fullName,
        respondedAt: new Date().toISOString(),
        publishedToChannel,
      };
      writeStorage(STORAGE_KEYS.GUEST_REVIEWS, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'REVIEW_RESPONSE_PUBLISHED',
        module: 'hotels',
        targetId: review.id,
        hotelId: review.hotelId,
        description: `Posted official management response to ${review.guestName}'s review on ${review.channel}`,
      });
    }
  }

  public escalateReviewToHOD(
    reviewId: string,
    hodDepartment: string,
    notes: string,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getGuestReviews();
    const review = all.find((r) => r.id === reviewId);
    if (review) {
      review.isEscalatedToHOD = true;
      review.hodDepartment = hodDepartment;
      review.hodEscalationStatus = 'investigating';
      review.hodResolutionNotes = notes;
      writeStorage(STORAGE_KEYS.GUEST_REVIEWS, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'REVIEW_ESCALATED_TO_HOD',
        module: 'hotels',
        targetId: review.id,
        hotelId: review.hotelId,
        description: `Escalated review from ${review.guestName} (${review.rating}★) to HOD ${hodDepartment}`,
      });
    }
  }

  public resolveHODReviewEscalation(
    reviewId: string,
    resolutionNotes: string,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getGuestReviews();
    const review = all.find((r) => r.id === reviewId);
    if (review) {
      review.hodEscalationStatus = 'resolved';
      review.hodResolutionNotes = resolutionNotes;
      writeStorage(STORAGE_KEYS.GUEST_REVIEWS, all);

      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'REVIEW_ESCALATION_RESOLVED',
        module: 'hotels',
        targetId: review.id,
        hotelId: review.hotelId,
        description: `Resolved HOD review escalation for ${review.guestName}: ${resolutionNotes}`,
      });
    }
  }

  public createGuestReview(
    reviewData: Omit<GuestReview, 'id'>,
    actor?: { email: string; fullName: string; role: string }
  ): GuestReview {
    const id = 'rev_' + Math.random().toString(36).substring(2, 9);
    const newReview: GuestReview = {
      ...reviewData,
      id,
    };

    const all = this.getGuestReviews();
    all.unshift(newReview);
    writeStorage(STORAGE_KEYS.GUEST_REVIEWS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'NEW_GUEST_REVIEW_INGESTED',
        module: 'hotels',
        targetId: newReview.id,
        hotelId: newReview.hotelId,
        description: `Ingested new ${newReview.channel} review by ${newReview.guestName} (${newReview.rating}★)`,
      });
    }

    return newReview;
  }

  public getSurveyCampaigns(hotelId?: string): PostStaySurveyCampaign[] {
    const all = readStorage<PostStaySurveyCampaign[]>(STORAGE_KEYS.SURVEY_CAMPAIGNS, SEED_SURVEY_CAMPAIGNS);
    if (hotelId) return all.filter((c) => c.hotelId === hotelId);
    return all;
  }

  public saveSurveyCampaign(
    campaign: PostStaySurveyCampaign,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getSurveyCampaigns();
    const index = all.findIndex((c) => c.id === campaign.id);
    if (index >= 0) {
      all[index] = campaign;
    } else {
      all.push(campaign);
    }
    writeStorage(STORAGE_KEYS.SURVEY_CAMPAIGNS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'SURVEY_CAMPAIGN_UPDATED',
        module: 'settings',
        targetId: campaign.id,
        hotelId: campaign.hotelId,
        description: `Updated post-stay survey campaign: ${campaign.campaignName} (${campaign.channel})`,
      });
    }
  }

  public getSurveyResponses(hotelId?: string, campaignId?: string): SurveyResponse[] {
    const all = readStorage<SurveyResponse[]>(STORAGE_KEYS.SURVEY_RESPONSES, SEED_SURVEY_RESPONSES);
    return all.filter((r) => {
      if (hotelId && r.hotelId !== hotelId) return false;
      if (campaignId && r.campaignId !== campaignId) return false;
      return true;
    });
  }

  public submitSurveyResponse(
    response: Omit<SurveyResponse, 'id' | 'submittedAt'>
  ): SurveyResponse {
    const id = 'sr_' + Math.random().toString(36).substring(2, 9);
    const newResponse: SurveyResponse = {
      ...response,
      id,
      submittedAt: new Date().toISOString(),
    };

    const all = this.getSurveyResponses();
    all.unshift(newResponse);
    writeStorage(STORAGE_KEYS.SURVEY_RESPONSES, all);

    // Update campaign metrics
    const campaigns = this.getSurveyCampaigns();
    const camp = campaigns.find((c) => c.id === response.campaignId);
    if (camp) {
      camp.responseCount += 1;
      const responsesForCamp = all.filter((r) => r.campaignId === response.campaignId);
      const totalNps = responsesForCamp.reduce((sum, r) => sum + r.npsScore, 0);
      camp.avgNpsScore = Math.round((totalNps / responsesForCamp.length) * 10) / 10;
      writeStorage(STORAGE_KEYS.SURVEY_CAMPAIGNS, campaigns);
    }

    return newResponse;
  }

  // ==========================================
  // PHASE 20: ENERGY MANAGEMENT & SMART ROOM IOT
  // ==========================================

  public getSmartRoomDevices(hotelId?: string, roomNumber?: string): SmartRoomDevice[] {
    const all = readStorage<SmartRoomDevice[]>(STORAGE_KEYS.SMART_ROOM_DEVICES, SEED_SMART_ROOM_DEVICES);
    return all.filter((d) => {
      if (hotelId && d.hotelId !== hotelId) return false;
      if (roomNumber && roomNumber !== 'all' && d.roomNumber !== roomNumber) return false;
      return true;
    });
  }

  public updateSmartRoomDevice(
    deviceId: string,
    updates: Partial<SmartRoomDevice>,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getSmartRoomDevices();
    const device = all.find((d) => d.id === deviceId);
    if (device) {
      Object.assign(device, updates, { lastHeartbeat: new Date().toISOString() });
      writeStorage(STORAGE_KEYS.SMART_ROOM_DEVICES, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'SMART_DEVICE_UPDATED',
          module: 'rooms',
          targetId: device.id,
          hotelId: device.hotelId,
          description: `Updated IoT device ${device.deviceName} in Room ${device.roomNumber} (${device.hvacMode}, target ${device.targetTemperatureC}°C)`,
        });
      }
    }
  }

  public setRoomClimateProfile(
    roomNumber: string,
    hvacMode: HvacOperatingMode,
    targetTemp: number,
    hotelId: string = 'htl_grand_rift',
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getSmartRoomDevices();
    const devices = all.filter((d) => d.roomNumber === roomNumber && (!hotelId || d.hotelId === hotelId));
    devices.forEach((dev) => {
      dev.hvacMode = hvacMode;
      dev.targetTemperatureC = targetTemp;
      dev.lastHeartbeat = new Date().toISOString();
      if (hvacMode === 'eco_standby' || hvacMode === 'off') {
        dev.powerDrawWatts = Math.min(dev.powerDrawWatts, 45);
      } else {
        dev.powerDrawWatts = Math.max(dev.powerDrawWatts, 280);
      }
    });
    writeStorage(STORAGE_KEYS.SMART_ROOM_DEVICES, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'ROOM_CLIMATE_ADJUSTED',
        module: 'rooms',
        targetId: roomNumber,
        hotelId,
        description: `Set climate in Room ${roomNumber} to ${hvacMode} at ${targetTemp}°C`,
      });
    }
  }

  public setAllUnoccupiedToEcoSetback(
    hotelId: string = 'htl_grand_rift',
    actor?: { email: string; fullName: string; role: string }
  ): number {
    const all = this.getSmartRoomDevices();
    let count = 0;
    all.forEach((dev) => {
      if (dev.hotelId === hotelId && (dev.occupancyState === 'unoccupied' || !dev.keycardInserted)) {
        dev.hvacMode = 'eco_standby';
        dev.targetTemperatureC = 26.0;
        dev.fanSpeed = 'low';
        dev.powerDrawWatts = 35;
        dev.lastHeartbeat = new Date().toISOString();
        count++;
      }
    });
    writeStorage(STORAGE_KEYS.SMART_ROOM_DEVICES, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'EMS_BULK_SETBACK_ENGAGED',
        module: 'settings',
        targetId: 'all_unoccupied',
        hotelId,
        description: `Dispatched bulk Eco-Setback (26°C Low Fan) to ${count} unoccupied room IoT thermostats`,
      });
    }
    return count;
  }

  public getEnergySubmeters(hotelId?: string): EnergySubmeterZone[] {
    const all = readStorage<EnergySubmeterZone[]>(STORAGE_KEYS.ENERGY_SUBMETERS, SEED_ENERGY_SUBMETERS);
    if (hotelId) return all.filter((s) => s.hotelId === hotelId);
    return all;
  }

  public getEmsPolicies(hotelId?: string): EmsAutomatedPolicy[] {
    const all = readStorage<EmsAutomatedPolicy[]>(STORAGE_KEYS.EMS_POLICIES, SEED_EMS_POLICIES);
    if (hotelId) return all.filter((p) => p.hotelId === hotelId);
    return all;
  }

  public toggleEmsPolicy(
    policyId: string,
    enabled: boolean,
    actor?: { email: string; fullName: string; role: string }
  ): void {
    const all = this.getEmsPolicies();
    const policy = all.find((p) => p.id === policyId);
    if (policy) {
      policy.enabled = enabled;
      writeStorage(STORAGE_KEYS.EMS_POLICIES, all);

      if (actor) {
        this.logAudit({
          actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
          action: 'EMS_POLICY_TOGGLED',
          module: 'settings',
          targetId: policy.id,
          hotelId: policy.hotelId,
          description: `${enabled ? 'Enabled' : 'Disabled'} EMS automated energy policy: ${policy.policyName}`,
        });
      }
    }
  }

  // ==========================================
  // PHASE 21: HACCP FOOD SAFETY & WATER QUALITY
  // ==========================================

  public getHaccpLogs(hotelId?: string, outletId?: string): HaccpTemperatureRecord[] {
    const all = readStorage<HaccpTemperatureRecord[]>(STORAGE_KEYS.HACCP_TEMP_LOGS, SEED_HACCP_TEMP_LOGS);
    return all.filter((l) => {
      if (hotelId && l.hotelId !== hotelId) return false;
      if (outletId && outletId !== 'all' && l.outletId !== outletId) return false;
      return true;
    });
  }

  public recordHaccpLog(
    logData: Omit<HaccpTemperatureRecord, 'id' | 'loggedAt' | 'status'>,
    actor?: { email: string; fullName: string; role: string }
  ): HaccpTemperatureRecord {
    const id = 'haccp_' + Math.random().toString(36).substring(2, 9);
    
    // Calculate status
    let status: HaccpComplianceStatus = 'compliant';
    if (logData.temperatureC < logData.targetMinC || logData.temperatureC > logData.targetMaxC) {
      if (
        (logData.logType === 'hot_holding_buffet' && logData.temperatureC < 60.0) ||
        (logData.logType === 'walk_in_chiller' && logData.temperatureC > logData.targetMaxC + 3.0) ||
        (logData.logType === 'food_core_cooking' && logData.temperatureC < logData.targetMinC - 4.0) ||
        (logData.logType === 'dishwasher_sanitizing' && logData.temperatureC < 78.0)
      ) {
        status = 'critical_breach';
      } else {
        status = 'warning';
      }
    }

    const newRecord: HaccpTemperatureRecord = {
      ...logData,
      id,
      status,
      loggedAt: new Date().toISOString(),
    };

    const all = this.getHaccpLogs();
    all.unshift(newRecord);
    writeStorage(STORAGE_KEYS.HACCP_TEMP_LOGS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'HACCP_TEMPERATURE_LOGGED',
        module: 'outlets',
        targetId: newRecord.id,
        hotelId: newRecord.hotelId,
        description: `Logged HACCP temp for ${newRecord.unitName}: ${newRecord.temperatureC}°C (${newRecord.status.toUpperCase()})`,
      });
    }

    return newRecord;
  }

  public getPoolWaterLogs(hotelId?: string, poolLocation?: string): PoolWaterQualityLog[] {
    const all = readStorage<PoolWaterQualityLog[]>(STORAGE_KEYS.POOL_WATER_LOGS, SEED_POOL_WATER_LOGS);
    return all.filter((p) => {
      if (hotelId && p.hotelId !== hotelId) return false;
      if (poolLocation && poolLocation !== 'all' && p.poolLocation !== poolLocation) return false;
      return true;
    });
  }

  public recordPoolWaterLog(
    logData: Omit<PoolWaterQualityLog, 'id' | 'testedAt' | 'status'>,
    actor?: { email: string; fullName: string; role: string }
  ): PoolWaterQualityLog {
    const id = 'pool_' + Math.random().toString(36).substring(2, 9);
    
    // Determine pool safety status
    let status: PoolSafetyStatus = 'safe_for_swimming';
    const isPhSafe = logData.phLevel >= 7.2 && logData.phLevel <= 7.6;
    const isChlorineSafe = logData.freeChlorinePpm >= 1.0 && logData.freeChlorinePpm <= 3.0;
    const isTurbiditySafe = logData.turbidityNtu <= 0.5;

    if (!isPhSafe || !isChlorineSafe || !isTurbiditySafe) {
      if (logData.phLevel > 7.9 || logData.phLevel < 6.8 || logData.freeChlorinePpm < 0.5 || logData.turbidityNtu > 0.8) {
        status = 'closed_for_shock_treatment';
      } else {
        status = 'chemical_adjustment_needed';
      }
    }

    const newLog: PoolWaterQualityLog = {
      ...logData,
      id,
      status,
      testedAt: new Date().toISOString(),
    };

    const all = this.getPoolWaterLogs();
    all.unshift(newLog);
    writeStorage(STORAGE_KEYS.POOL_WATER_LOGS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'POOL_WATER_TESTED',
        module: 'hotels',
        targetId: newLog.id,
        hotelId: newLog.hotelId,
        description: `Tested pool water chemistry at ${newLog.poolLocation}: pH ${newLog.phLevel}, Chlorine ${newLog.freeChlorinePpm} ppm (${newLog.status})`,
      });
    }

    return newLog;
  }

  public getHygieneAudits(hotelId?: string): HygieneAuditChecklist[] {
    const all = readStorage<HygieneAuditChecklist[]>(STORAGE_KEYS.HYGIENE_AUDITS, SEED_HYGIENE_AUDITS);
    if (hotelId) return all.filter((a) => a.hotelId === hotelId);
    return all;
  }

  public saveHygieneAudit(
    auditData: Omit<HygieneAuditChecklist, 'id'>,
    actor?: { email: string; fullName: string; role: string }
  ): HygieneAuditChecklist {
    const id = 'aud_' + Math.random().toString(36).substring(2, 9);
    const newAudit: HygieneAuditChecklist = {
      ...auditData,
      id,
    };

    const all = this.getHygieneAudits();
    all.unshift(newAudit);
    writeStorage(STORAGE_KEYS.HYGIENE_AUDITS, all);

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'HYGIENE_AUDIT_RECORDED',
        module: 'hotels',
        targetId: newAudit.id,
        hotelId: newAudit.hotelId,
        description: `Conducted hygiene audit for ${newAudit.area}: Score ${newAudit.overallScore}% (${newAudit.status})`,
      });
    }

    return newAudit;
  }

  // ==========================================
  // PHASE 22: VALET PARKING & EV CHARGING FLEET
  // ==========================================

  public getParkingBays(hotelId?: string): ParkingBay[] {
    const all = readStorage<ParkingBay[]>(STORAGE_KEYS.PARKING_BAYS, SEED_PARKING_BAYS);
    if (hotelId) return all.filter((b) => b.hotelId === hotelId);
    return all;
  }

  public updateParkingBayStatus(bayId: string, status: ParkingBayStatus, vehiclePlate?: string): void {
    const all = this.getParkingBays();
    const bay = all.find((b) => b.id === bayId);
    if (bay) {
      bay.status = status;
      bay.currentVehiclePlate = status === 'available' ? undefined : (vehiclePlate || bay.currentVehiclePlate);
      writeStorage(STORAGE_KEYS.PARKING_BAYS, all);
    }
  }

  public getValetTickets(hotelId?: string, status?: string): ValetTicket[] {
    const all = readStorage<ValetTicket[]>(STORAGE_KEYS.VALET_TICKETS, SEED_VALET_TICKETS);
    return all.filter((t) => {
      if (hotelId && t.hotelId !== hotelId) return false;
      if (status && status !== 'all' && t.status !== status) return false;
      return true;
    });
  }

  public issueValetTicket(
    ticketData: Omit<ValetTicket, 'id' | 'ticketNumber' | 'checkedInAt' | 'status'>,
    actor?: { email: string; fullName: string; role: string }
  ): ValetTicket {
    const id = 'val_' + Math.random().toString(36).substring(2, 9);
    const ticketNumber = 'VAL-' + Math.floor(1000 + Math.random() * 9000);
    const newTicket: ValetTicket = {
      ...ticketData,
      id,
      ticketNumber,
      status: 'parked',
      checkedInAt: new Date().toISOString(),
    };

    const all = this.getValetTickets();
    all.unshift(newTicket);
    writeStorage(STORAGE_KEYS.VALET_TICKETS, all);

    // Mark bay as occupied
    const bays = this.getParkingBays();
    const bay = bays.find((b) => b.bayCode === ticketData.assignedBayCode);
    if (bay) {
      bay.status = 'occupied';
      bay.currentVehiclePlate = ticketData.licensePlate;
      writeStorage(STORAGE_KEYS.PARKING_BAYS, bays);
    }

    if (actor) {
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'VALET_TICKET_ISSUED',
        module: 'hotels',
        targetId: newTicket.id,
        hotelId: newTicket.hotelId,
        description: `Issued valet ticket ${newTicket.ticketNumber} for ${newTicket.guestName} (${newTicket.vehicleMakeModel}, ${newTicket.licensePlate}) in bay ${newTicket.assignedBayCode}`,
      });
    }

    return newTicket;
  }

  public requestValetRetrieval(
    ticketId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): ValetTicket | null {
    const all = this.getValetTickets();
    const ticket = all.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = 'retrieval_requested';
      ticket.retrievalRequestedAt = new Date().toISOString();
      writeStorage(STORAGE_KEYS.VALET_TICKETS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'valet@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'VALET_RETRIEVAL_REQUESTED',
          module: 'hotels',
          targetId: ticket.id,
          hotelId: ticket.hotelId,
          description: `Guest ${ticket.guestName} requested vehicle retrieval for ${ticket.ticketNumber} (${ticket.licensePlate})`,
        });
      }
      return ticket;
    }
    return null;
  }

  public stageValetVehicle(
    ticketId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): ValetTicket | null {
    const all = this.getValetTickets();
    const ticket = all.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = 'staged_at_curb';
      writeStorage(STORAGE_KEYS.VALET_TICKETS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'valet@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'VALET_VEHICLE_STAGED',
          module: 'hotels',
          targetId: ticket.id,
          hotelId: ticket.hotelId,
          description: `Vehicle for ${ticket.guestName} (${ticket.licensePlate}) staged at porte-cochère curb`,
        });
      }
      return ticket;
    }
    return null;
  }

  public completeValetTicket(
    ticketId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): ValetTicket | null {
    const all = this.getValetTickets();
    const ticket = all.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = 'completed';
      writeStorage(STORAGE_KEYS.VALET_TICKETS, all);

      // Free up parking bay
      const bays = this.getParkingBays();
      const bay = bays.find((b) => b.bayCode === ticket.assignedBayCode);
      if (bay) {
        bay.status = 'available';
        bay.currentVehiclePlate = undefined;
        writeStorage(STORAGE_KEYS.PARKING_BAYS, bays);
      }

      const actorObj = typeof actor === 'string'
        ? { email: 'valet@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'VALET_VEHICLE_DELIVERED',
          module: 'hotels',
          targetId: ticket.id,
          hotelId: ticket.hotelId,
          description: `Keys delivered and valet session completed for ${ticket.guestName} (${ticket.ticketNumber})`,
        });
      }
      return ticket;
    }
    return null;
  }

  public getEvChargingSessions(hotelId?: string): EvChargingSession[] {
    const all = readStorage<EvChargingSession[]>(STORAGE_KEYS.EV_CHARGING_SESSIONS, SEED_EV_CHARGING_SESSIONS);
    if (hotelId) return all.filter((s) => s.hotelId === hotelId);
    return all;
  }

  public startEvChargingSession(
    sessionData: {
      hotelId: string;
      bayCode: string;
      guestName: string;
      roomNumber?: string;
      vehiclePlate: string;
      ratePerKwh: number;
      kwhDelivered?: number;
      totalChargeEtb?: number;
    },
    actor?: { email: string; fullName: string; role: string } | string
  ): EvChargingSession {
    const id = 'ev_' + Math.random().toString(36).substring(2, 9);
    const kwh = sessionData.kwhDelivered ?? 0;
    const total = sessionData.totalChargeEtb ?? Math.round(kwh * sessionData.ratePerKwh);

    const newSession: EvChargingSession = {
      hotelId: sessionData.hotelId,
      bayCode: sessionData.bayCode,
      guestName: sessionData.guestName,
      roomNumber: sessionData.roomNumber,
      vehiclePlate: sessionData.vehiclePlate,
      ratePerKwh: sessionData.ratePerKwh,
      kwhDelivered: kwh,
      totalChargeEtb: total,
      id,
      sessionStatus: 'charging',
      startedAt: new Date().toISOString(),
    };

    const all = this.getEvChargingSessions();
    all.unshift(newSession);
    writeStorage(STORAGE_KEYS.EV_CHARGING_SESSIONS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'valet@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'EV_CHARGING_STARTED',
        module: 'hotels',
        targetId: newSession.id,
        hotelId: newSession.hotelId,
        description: `Started EV charging session for ${newSession.vehiclePlate} (${newSession.guestName}) at bay ${newSession.bayCode}`,
      });
    }

    return newSession;
  }

  public billEvSessionToFolio(
    sessionId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): boolean {
    const all = this.getEvChargingSessions();
    const session = all.find((s) => s.id === sessionId);
    if (session) {
      session.sessionStatus = 'billed_to_folio';
      session.endedAt = session.endedAt || new Date().toISOString();
      writeStorage(STORAGE_KEYS.EV_CHARGING_SESSIONS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'valet@hotel.internal', fullName: actor, role: 'staff' }
        : actor || { email: 'valet@hotel.internal', fullName: 'Valet Attendant', role: 'staff' };

      // Post charge to active guest folio if room number provided
      if (session.roomNumber) {
        const folios = this.getGuestFolios(session.hotelId);
        const openFolio = folios.find((f) => f.roomNumber === session.roomNumber && f.status === 'open');
        if (openFolio) {
          this.addChargeToFolio(
            openFolio.id,
            {
              category: 'other',
              description: `EV Supercharger Energy Session (${session.kwhDelivered} kWh @ ${session.ratePerKwh} ETB - ${session.vehiclePlate})`,
              amount: session.totalChargeEtb,
              postedBy: actorObj.fullName,
            },
            actorObj
          );
        }
      }

      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'EV_CHARGING_BILLED_TO_FOLIO',
        module: 'hotels',
        targetId: session.id,
        hotelId: session.hotelId,
        description: `Billed EV charging session (${session.totalChargeEtb} ETB) for ${session.guestName} to Room ${session.roomNumber || 'Direct'}`,
      });

      return true;
    }
    return false;
  }

  // ==========================================
  // PHASE 23: NIGHT AUDIT, EOD BALANCING & RATE ROLL
  // ==========================================

  public getCashierDrops(hotelId?: string): CashierDropRecord[] {
    const all = readStorage<CashierDropRecord[]>(STORAGE_KEYS.CASHIER_DROPS, SEED_CASHIER_DROPS);
    if (hotelId) return all.filter((d) => d.hotelId === hotelId);
    return all;
  }

  public recordCashierDrop(
    dropData: Omit<CashierDropRecord, 'id' | 'varianceAmount' | 'status'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): CashierDropRecord {
    const id = 'drop_' + Math.random().toString(36).substring(2, 9);
    const variance = Math.round((dropData.actualDropAmount - dropData.expectedSystemAmount) * 100) / 100;
    const status: CashierDropStatus = variance === 0 ? 'balanced' : variance > 0 ? 'over' : 'short';

    const newDrop: CashierDropRecord = {
      ...dropData,
      id,
      varianceAmount: variance,
      status,
    };

    const all = this.getCashierDrops();
    all.unshift(newDrop);
    writeStorage(STORAGE_KEYS.CASHIER_DROPS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'auditor@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'CASHIER_DROP_RECONCILED',
        module: 'hotels',
        targetId: newDrop.id,
        hotelId: newDrop.hotelId,
        description: `Cashier drop for ${newDrop.cashierName} (${newDrop.outletName}) recorded: Expected ${newDrop.expectedSystemAmount} ${newDrop.currency}, Drop ${newDrop.actualDropAmount} ${newDrop.currency} (Variance: ${newDrop.varianceAmount})`,
      });
    }

    return newDrop;
  }

  public getHighBalanceAlerts(hotelId?: string): HighBalanceAlert[] {
    const all = readStorage<HighBalanceAlert[]>(STORAGE_KEYS.HIGH_BALANCE_ALERTS, SEED_HIGH_BALANCE_ALERTS);
    if (hotelId) return all.filter((a) => a.hotelId === hotelId);
    return all;
  }

  public resolveHighBalanceAlert(
    alertId: string,
    actionTaken: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getHighBalanceAlerts();
    const item = all.find((a) => a.id === alertId);
    if (item) {
      item.actionTaken = actionTaken;
      writeStorage(STORAGE_KEYS.HIGH_BALANCE_ALERTS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'auditor@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'HIGH_BALANCE_RESOLVED',
          module: 'hotels',
          targetId: item.id,
          hotelId: item.hotelId,
          description: `High balance risk for ${item.guestName} (Room ${item.roomNumber}) mitigated: ${actionTaken}`,
        });
      }
    }
  }

  public getNightAuditJournals(hotelId?: string): NightAuditJournal[] {
    const all = readStorage<NightAuditJournal[]>(STORAGE_KEYS.NIGHT_AUDIT_JOURNALS, SEED_NIGHT_AUDIT_JOURNALS);
    if (hotelId) return all.filter((j) => j.hotelId === hotelId);
    return all;
  }

  public getCurrentBusinessDate(hotelId: string): string {
    const key = STORAGE_KEYS.BUSINESS_DATE_PREFIX + hotelId;
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(key, today);
    return today;
  }

  public executeNightAudit(
    params: {
      hotelId: string;
      auditorName: string;
      auditorRole: string;
      postRoomRates: boolean;
      rollBusinessDate: boolean;
    },
    actor?: { email: string; fullName: string; role: string } | string
  ): NightAuditJournal {
    const currentBizDate = this.getCurrentBusinessDate(params.hotelId);
    const rooms = this.getRooms(params.hotelId);
    const hotel = this.getHotelById(params.hotelId);
    const totalRooms = rooms.length > 0 ? rooms.length : hotel?.operationalSettings?.totalRooms || 0;
    const folios = this.getGuestFolios(params.hotelId);
    const openFolios = folios.filter((f) => f.status === 'open');
    const reservations = this.getReservations(params.hotelId);
    const rules = this.getFinancialRules(params.hotelId);

    let postedCount = 0;
    let totalRoomRev = 0;

    const actorObj = typeof actor === 'string'
      ? { email: 'nightaudit@hotel.internal', fullName: actor, role: 'staff' }
      : actor || { email: 'nightaudit@hotel.internal', fullName: params.auditorName, role: 'staff' };

    const resolveFolioNightlyRate = (folio: GuestFolio): number => {
      const matchedRes = reservations.find((r) => r.id === folio.bookingId);
      if (matchedRes && matchedRes.dailyRate > 0) return matchedRes.dailyRate;
      const matchedRoom = rooms.find((rm) => rm.roomNumber === folio.roomNumber);
      if (matchedRoom && matchedRoom.standardRate > 0) return matchedRoom.standardRate;
      const firstRoomCharge = folio.charges.find((c) => c.category === 'room_rate');
      return firstRoomCharge?.amount || 0;
    };

    // Post room rate and service charge / VAT if requested
    if (params.postRoomRates) {
      openFolios.forEach((folio) => {
        const baseRate = resolveFolioNightlyRate(folio);
        if (baseRate <= 0) return;
        const levies = calculateHospitalityLevies(baseRate, {
          vatRatePercent: rules?.vatRate,
          serviceChargeRatePercent: rules?.serviceChargeRate,
        });

        this.addChargeToFolio(
          folio.id,
          {
            category: 'room_rate',
            description: `Room Night Rate (${currentBizDate}) - Rm ${folio.roomNumber} [Base: ${baseRate} + SC: ${levies.serviceChargeAmount} + VAT: ${levies.vatAmount}]`,
            amount: baseRate,
            postedBy: params.auditorName,
          },
          actorObj
        );
        postedCount++;
        totalRoomRev += baseRate;
      });
    } else {
      openFolios.forEach((folio) => {
        totalRoomRev += resolveFolioNightlyRate(folio);
      });
      postedCount = openFolios.length;
    }

    const occupiedRoomsCount = rooms.filter((r) => r.status === 'occupied').length;
    const occupiedRooms = Math.max(openFolios.length, occupiedRoomsCount);
    const occRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0;

    const shifts = this.getCashierShifts(params.hotelId);
    const fnbRev = shifts.reduce(
      (sum, s) => sum + (s.cashSales + s.cardSales + s.telebirrSales + s.roomChargeSales),
      0
    );
    const otherRev = folios.reduce(
      (sum, f) =>
        sum +
        f.charges
          .filter((c) => c.category !== 'room_rate' && c.category !== 'restaurant' && c.category !== 'bar')
          .reduce((cSum, c) => cSum + c.amount, 0),
      0
    );

    const grossRev = totalRoomRev + fnbRev + otherRev;
    const totalLevies = calculateHospitalityLevies(grossRev, {
      vatRatePercent: rules?.vatRate,
      serviceChargeRatePercent: rules?.serviceChargeRate,
    });
    const totalSC = totalLevies.serviceChargeAmount;
    const totalVat = totalLevies.vatAmount;
    const adr = occupiedRooms > 0 ? Math.round(totalRoomRev / occupiedRooms) : 0;
    const revpar = totalRooms > 0 ? Math.round(totalRoomRev / totalRooms) : 0;

    // Calculate cashier drop discrepancies
    const drops = this.getCashierDrops(params.hotelId);
    const discrepancyTotal = drops.reduce((sum, d) => sum + d.varianceAmount, 0);
    const outOfOrderRooms = rooms.filter(
      (r) => r.status === 'out_of_order' || r.status === 'maintenance'
    ).length;

    const journal: NightAuditJournal = {
      id: 'naj_' + Math.random().toString(36).substring(2, 9),
      hotelId: params.hotelId,
      auditDate: currentBizDate,
      executedAt: new Date().toISOString(),
      auditorName: params.auditorName,
      auditorRole: params.auditorRole,
      roomsAvailable: totalRooms,
      roomsOccupied: occupiedRooms,
      occupancyRate: occRate,
      complimentaryRooms: 0,
      outOfOrderRooms,
      totalRoomRevenue: totalRoomRev,
      totalFnBRevenue: fnbRev,
      totalOtherRevenue: otherRev,
      totalGrossRevenue: grossRev,
      totalServiceCharge: totalSC,
      totalVat: totalVat,
      adr,
      revpar,
      guestFoliosPostedCount: postedCount,
      cashierDiscrepancyTotal: discrepancyTotal,
      status: 'finalized',
    };

    const journals = this.getNightAuditJournals();
    journals.unshift(journal);
    writeStorage(STORAGE_KEYS.NIGHT_AUDIT_JOURNALS, journals);

    // Roll business date forward if requested
    if (params.rollBusinessDate) {
      const current = new Date(currentBizDate);
      current.setDate(current.getDate() + 1);
      const nextDate = current.toISOString().slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.BUSINESS_DATE_PREFIX + params.hotelId, nextDate);
    }

    this.logAudit({
      actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
      action: 'NIGHT_AUDIT_FINALIZED',
      module: 'hotels',
      targetId: journal.id,
      hotelId: journal.hotelId,
      description: `Night Audit closed for business date ${currentBizDate}. Occupancy: ${occRate}%, Gross Revenue: ${grossRev.toLocaleString()} ETB, ADR: ${adr.toLocaleString()} ETB, RevPAR: ${revpar.toLocaleString()} ETB`,
    });

    return journal;
  }

  // ==========================================
  // PHASE 24: SHIFT HANDOVER & RAPID TASK DISPATCH
  // ==========================================

  public getShiftHandovers(hotelId?: string): ShiftHandoverEntry[] {
    const all = readStorage<ShiftHandoverEntry[]>(STORAGE_KEYS.SHIFT_HANDOVERS, SEED_SHIFT_HANDOVERS);
    if (hotelId) return all.filter((s) => s.hotelId === hotelId);
    return all;
  }

  public addShiftHandover(
    entryData: Omit<ShiftHandoverEntry, 'id' | 'createdAt' | 'status'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): ShiftHandoverEntry {
    const id = 'sho_' + Math.random().toString(36).substring(2, 9);
    const newEntry: ShiftHandoverEntry = {
      ...entryData,
      id,
      status: 'pending_action',
      createdAt: new Date().toISOString(),
    };

    const all = this.getShiftHandovers();
    all.unshift(newEntry);
    writeStorage(STORAGE_KEYS.SHIFT_HANDOVERS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'staff@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'SHIFT_HANDOVER_LOGGED',
        module: 'hotels',
        targetId: newEntry.id,
        hotelId: newEntry.hotelId,
        description: `Shift Handover entry logged for ${newEntry.shift} shift by ${newEntry.outgoingSupervisor}: ${newEntry.subject}`,
      });
    }

    return newEntry;
  }

  public acknowledgeShiftHandover(
    entryId: string,
    incomingSupervisor: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getShiftHandovers();
    const entry = all.find((e) => e.id === entryId);
    if (entry) {
      entry.incomingSupervisor = incomingSupervisor;
      entry.acknowledgedAt = new Date().toISOString();
      entry.status = 'in_progress';
      writeStorage(STORAGE_KEYS.SHIFT_HANDOVERS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'staff@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'SHIFT_HANDOVER_ACKNOWLEDGED',
          module: 'hotels',
          targetId: entry.id,
          hotelId: entry.hotelId,
          description: `Shift Handover (${entry.subject}) acknowledged by incoming supervisor ${incomingSupervisor}`,
        });
      }
    }
  }

  public resolveShiftHandover(
    entryId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getShiftHandovers();
    const entry = all.find((e) => e.id === entryId);
    if (entry) {
      entry.status = 'resolved';
      writeStorage(STORAGE_KEYS.SHIFT_HANDOVERS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'staff@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'SHIFT_HANDOVER_RESOLVED',
          module: 'hotels',
          targetId: entry.id,
          hotelId: entry.hotelId,
          description: `Shift Handover action (${entry.subject}) marked resolved`,
        });
      }
    }
  }

  public getRapidServiceTasks(hotelId?: string): RapidServiceTask[] {
    const all = readStorage<RapidServiceTask[]>(STORAGE_KEYS.RAPID_SERVICE_TASKS, SEED_RAPID_SERVICE_TASKS);
    if (hotelId) return all.filter((t) => t.hotelId === hotelId);
    return all;
  }

  public dispatchRapidTask(
    taskData: Omit<RapidServiceTask, 'id' | 'taskCode' | 'status' | 'dispatchedAt'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): RapidServiceTask {
    const id = 'rst_' + Math.random().toString(36).substring(2, 9);
    const code = 'TASK-' + Math.floor(1000 + Math.random() * 9000);
    const newTask: RapidServiceTask = {
      ...taskData,
      id,
      taskCode: code,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    };

    const all = this.getRapidServiceTasks();
    all.unshift(newTask);
    writeStorage(STORAGE_KEYS.RAPID_SERVICE_TASKS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'staff@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'RAPID_TASK_DISPATCHED',
        module: 'hotels',
        targetId: newTask.id,
        hotelId: newTask.hotelId,
        description: `Rapid service task ${newTask.taskCode} dispatched for Room ${newTask.roomNumber} to ${newTask.targetDepartment}: ${newTask.taskDescription}`,
      });
    }

    return newTask;
  }

  public updateRapidTaskStatus(
    taskId: string,
    status: RapidTaskStatus,
    notes?: string,
    runner?: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getRapidServiceTasks();
    const task = all.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      if (notes) task.resolutionNotes = notes;
      if (runner) task.assignedRunner = runner;
      if (status === 'completed' || status === 'verified') {
        task.completedAt = task.completedAt || new Date().toISOString();
      }
      writeStorage(STORAGE_KEYS.RAPID_SERVICE_TASKS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'staff@hotel.internal', fullName: actor, role: 'staff' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'RAPID_TASK_UPDATED',
          module: 'hotels',
          targetId: task.id,
          hotelId: task.hotelId,
          description: `Rapid service task ${task.taskCode} updated to ${status} for Room ${task.roomNumber}`,
        });
      }
    }
  }

  public getStaffBroadcastAlerts(hotelId?: string): StaffBroadcastAlert[] {
    const all = readStorage<StaffBroadcastAlert[]>(STORAGE_KEYS.STAFF_BROADCAST_ALERTS, SEED_STAFF_BROADCAST_ALERTS);
    if (hotelId) return all.filter((a) => a.hotelId === hotelId);
    return all;
  }

  public createStaffBroadcast(
    alertData: Omit<StaffBroadcastAlert, 'id' | 'createdAt' | 'acknowledgedCount'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): StaffBroadcastAlert {
    const id = 'sba_' + Math.random().toString(36).substring(2, 9);
    const newAlert: StaffBroadcastAlert = {
      ...alertData,
      id,
      createdAt: new Date().toISOString(),
      acknowledgedCount: 1,
    };

    const all = this.getStaffBroadcastAlerts();
    all.unshift(newAlert);
    writeStorage(STORAGE_KEYS.STAFF_BROADCAST_ALERTS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'staff@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'STAFF_BROADCAST_ISSUED',
        module: 'hotels',
        targetId: newAlert.id,
        hotelId: newAlert.hotelId,
        description: `Operational broadcast issued by ${newAlert.senderName}: ${newAlert.title}`,
      });
    }

    return newAlert;
  }

  public acknowledgeBroadcast(alertId: string): void {
    const all = this.getStaffBroadcastAlerts();
    const alert = all.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledgedCount = (alert.acknowledgedCount || 0) + 1;
      writeStorage(STORAGE_KEYS.STAFF_BROADCAST_ALERTS, all);
    }
  }

  // ==========================================
  // PHASE 25: CORPORATE ACCOUNTS, CITY LEDGER (AR) & AGENCY COMMISSIONS
  // ==========================================

  public getCorporateAccounts(hotelId?: string): CorporateAccount[] {
    const all = readStorage<CorporateAccount[]>(STORAGE_KEYS.CORPORATE_ACCOUNTS, SEED_CORPORATE_ACCOUNTS);
    if (hotelId) return all.filter((c) => c.hotelId === hotelId);
    return all;
  }

  public createCorporateAccount(
    accountData: Omit<CorporateAccount, 'id' | 'currentBalanceEtb' | 'status'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): CorporateAccount {
    const id = 'corp_' + Math.random().toString(36).substring(2, 9);
    const newAccount: CorporateAccount = {
      ...accountData,
      id,
      currentBalanceEtb: 0,
      status: 'active',
    };

    const all = this.getCorporateAccounts();
    all.unshift(newAccount);
    writeStorage(STORAGE_KEYS.CORPORATE_ACCOUNTS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'CORPORATE_ACCOUNT_CREATED',
        module: 'finance',
        targetId: newAccount.id,
        hotelId: newAccount.hotelId,
        description: `Onboarded Corporate/AR account ${newAccount.companyName} (${newAccount.accountCode}) with ${newAccount.creditLimitEtb.toLocaleString()} ETB credit limit`,
      });
    }

    return newAccount;
  }

  public updateCorporateAccountStatus(
    accountId: string,
    status: CorporateAccountStatus,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getCorporateAccounts();
    const acc = all.find((a) => a.id === accountId);
    if (acc) {
      acc.status = status;
      writeStorage(STORAGE_KEYS.CORPORATE_ACCOUNTS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'CORPORATE_ACCOUNT_STATUS_CHANGED',
          module: 'finance',
          targetId: acc.id,
          hotelId: acc.hotelId,
          description: `Updated credit status of ${acc.companyName} to ${status.toUpperCase()}`,
        });
      }
    }
  }

  public getCityLedgerInvoices(hotelId?: string): CityLedgerInvoice[] {
    const all = readStorage<CityLedgerInvoice[]>(STORAGE_KEYS.CITY_LEDGER_INVOICES, SEED_CITY_LEDGER_INVOICES);
    if (hotelId) return all.filter((inv) => inv.hotelId === hotelId);
    return all;
  }

  public createCityLedgerInvoice(
    invoiceData: {
      hotelId: string;
      accountId: string;
      guestOrGroupName: string;
      folioReference?: string;
      totalAmountEtb: number;
      lpoReference?: string;
    },
    actor?: { email: string; fullName: string; role: string } | string
  ): CityLedgerInvoice | null {
    const accounts = this.getCorporateAccounts();
    const account = accounts.find((a) => a.id === invoiceData.accountId);
    if (!account) return null;

    const id = 'cli_' + Math.random().toString(36).substring(2, 9);
    const invNum = 'CL-2026-' + Math.floor(1000 + Math.random() * 9000);
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + (account.paymentTermsDays || 30));

    const newInvoice: CityLedgerInvoice = {
      id,
      hotelId: invoiceData.hotelId,
      invoiceNumber: invNum,
      accountId: account.id,
      companyName: account.companyName,
      guestOrGroupName: invoiceData.guestOrGroupName,
      folioReference: invoiceData.folioReference,
      issueDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      agingDays: 0,
      totalAmountEtb: invoiceData.totalAmountEtb,
      paidAmountEtb: 0,
      balanceDueEtb: invoiceData.totalAmountEtb,
      status: 'open',
      lpoReference: invoiceData.lpoReference,
      payments: [],
    };

    const allInvoices = this.getCityLedgerInvoices();
    allInvoices.unshift(newInvoice);
    writeStorage(STORAGE_KEYS.CITY_LEDGER_INVOICES, allInvoices);

    // Update corporate account balance
    account.currentBalanceEtb = Math.round((account.currentBalanceEtb + invoiceData.totalAmountEtb) * 100) / 100;
    if (account.currentBalanceEtb >= account.creditLimitEtb) {
      account.status = 'credit_hold';
    }
    writeStorage(STORAGE_KEYS.CORPORATE_ACCOUNTS, accounts);

    const actorObj = typeof actor === 'string'
      ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'CITY_LEDGER_INVOICE_ISSUED',
        module: 'finance',
        targetId: newInvoice.id,
        hotelId: newInvoice.hotelId,
        description: `Transferred ${newInvoice.totalAmountEtb.toLocaleString()} ETB to City Ledger (${newInvoice.invoiceNumber}) for ${account.companyName}`,
      });
    }

    return newInvoice;
  }

  public recordCityLedgerPayment(
    invoiceId: string,
    payment: { amountEtb: number; method: string; reference: string; recordedBy: string },
    actor?: { email: string; fullName: string; role: string } | string
  ): CityLedgerInvoice | null {
    const allInvoices = this.getCityLedgerInvoices();
    const inv = allInvoices.find((i) => i.id === invoiceId);
    if (!inv || payment.amountEtb <= 0) return null;

    const applied = Math.min(payment.amountEtb, inv.balanceDueEtb);
    const paymentItem: CityLedgerPayment = {
      id: 'clp_' + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().slice(0, 10),
      amountEtb: applied,
      method: payment.method,
      reference: payment.reference,
      recordedBy: payment.recordedBy,
    };

    inv.payments.push(paymentItem);
    inv.paidAmountEtb = Math.round((inv.paidAmountEtb + applied) * 100) / 100;
    inv.balanceDueEtb = Math.max(0, Math.round((inv.totalAmountEtb - inv.paidAmountEtb) * 100) / 100);
    inv.status = inv.balanceDueEtb === 0 ? 'settled' : 'partially_paid';
    writeStorage(STORAGE_KEYS.CITY_LEDGER_INVOICES, allInvoices);

    // Reduce corporate account balance & release hold if below limit
    const accounts = this.getCorporateAccounts();
    const account = accounts.find((a) => a.id === inv.accountId);
    if (account) {
      account.currentBalanceEtb = Math.max(0, Math.round((account.currentBalanceEtb - applied) * 100) / 100);
      if (account.status === 'credit_hold' && account.currentBalanceEtb < account.creditLimitEtb) {
        account.status = 'active';
      }
      writeStorage(STORAGE_KEYS.CORPORATE_ACCOUNTS, accounts);
    }

    const actorObj = typeof actor === 'string'
      ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'CITY_LEDGER_PAYMENT_RECORDED',
        module: 'finance',
        targetId: inv.id,
        hotelId: inv.hotelId,
        description: `Recorded AR payment of ${applied.toLocaleString()} ETB via ${payment.method} (${payment.reference}) against ${inv.invoiceNumber}`,
      });
    }

    return inv;
  }

  public sendCityLedgerReminder(
    invoiceId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const allInvoices = this.getCityLedgerInvoices();
    const inv = allInvoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.lastReminderSentAt = new Date().toISOString();
      writeStorage(STORAGE_KEYS.CITY_LEDGER_INVOICES, allInvoices);

      const actorObj = typeof actor === 'string'
        ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'CITY_LEDGER_REMINDER_SENT',
          module: 'finance',
          targetId: inv.id,
          hotelId: inv.hotelId,
          description: `Dispatched AR dunning statement reminder for ${inv.invoiceNumber} (${inv.companyName})`,
        });
      }
    }
  }

  public getAgencyCommissions(hotelId?: string): AgencyCommissionRecord[] {
    const all = readStorage<AgencyCommissionRecord[]>(STORAGE_KEYS.AGENCY_COMMISSIONS, SEED_AGENCY_COMMISSIONS);
    if (hotelId) return all.filter((c) => c.hotelId === hotelId);
    return all;
  }

  public approveAgencyCommission(
    commissionId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getAgencyCommissions();
    const rec = all.find((r) => r.id === commissionId);
    if (rec) {
      rec.status = 'approved_payable';
      writeStorage(STORAGE_KEYS.AGENCY_COMMISSIONS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'AGENCY_COMMISSION_APPROVED',
          module: 'finance',
          targetId: rec.id,
          hotelId: rec.hotelId,
          description: `Approved ${rec.netPayableEtb.toLocaleString()} ETB commission payable to ${rec.agencyName} (${rec.bookingReference})`,
        });
      }
    }
  }

  public markCommissionPaid(
    commissionId: string,
    payoutReference: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getAgencyCommissions();
    const rec = all.find((r) => r.id === commissionId);
    if (rec) {
      rec.status = 'paid';
      rec.payoutReference = payoutReference;
      rec.paidAt = new Date().toISOString();
      writeStorage(STORAGE_KEYS.AGENCY_COMMISSIONS, all);

      const actorObj = typeof actor === 'string'
        ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
        : actor;

      if (actorObj) {
        this.logAudit({
          actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
          action: 'AGENCY_COMMISSION_PAID',
          module: 'finance',
          targetId: rec.id,
          hotelId: rec.hotelId,
          description: `Settled ${rec.netPayableEtb.toLocaleString()} ETB agency commission to ${rec.agencyName} via ref ${payoutReference}`,
        });
      }
    }
  }

  // ==========================================
  // PHASE 26: DINING FLOOR PLAN, TABLE RESERVATIONS & SOMMELIER CELLAR
  // ==========================================
  public getDiningTables(hotelId?: string): DiningTable[] {
    const all = readStorage<DiningTable[]>(STORAGE_KEYS.DINING_TABLES, SEED_DINING_TABLES);
    if (hotelId) return all.filter((t) => t.hotelId === hotelId);
    return all;
  }

  public updateDiningTableStatus(
    tableId: string,
    status: DiningTableStatus,
    details?: { currentGuestName?: string; currentPartySize?: number; assignedServer?: string; notes?: string },
    actor?: { email: string; fullName: string; role: string } | string
  ): DiningTable | null {
    const all = this.getDiningTables();
    const tbl = all.find((t) => t.id === tableId);
    if (!tbl) return null;

    tbl.status = status;
    if (status === 'available' || status === 'needs_bussing') {
      tbl.currentGuestName = undefined;
      tbl.currentPartySize = undefined;
      tbl.seatedAt = undefined;
      tbl.reservationId = undefined;
    } else if (status === 'seated') {
      tbl.seatedAt = new Date().toTimeString().slice(0, 5);
    }

    if (details) {
      if (details.currentGuestName !== undefined) tbl.currentGuestName = details.currentGuestName;
      if (details.currentPartySize !== undefined) tbl.currentPartySize = details.currentPartySize;
      if (details.assignedServer !== undefined) tbl.assignedServer = details.assignedServer;
      if (details.notes !== undefined) tbl.notes = details.notes;
    }

    writeStorage(STORAGE_KEYS.DINING_TABLES, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'fb@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'DINING_TABLE_STATUS_UPDATED',
        module: 'outlets',
        targetId: tbl.id,
        hotelId: tbl.hotelId,
        description: `Updated Table ${tbl.tableNumber} status to ${status}${tbl.currentGuestName ? ` (${tbl.currentGuestName})` : ''}`,
      });
    }

    return tbl;
  }

  public getDiningReservations(hotelId?: string): DiningReservation[] {
    const all = readStorage<DiningReservation[]>(STORAGE_KEYS.DINING_RESERVATIONS, SEED_DINING_RESERVATIONS);
    if (hotelId) return all.filter((r) => r.hotelId === hotelId);
    return all;
  }

  public createDiningReservation(
    data: Omit<DiningReservation, 'id' | 'reservationCode' | 'createdAt'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): DiningReservation {
    const all = this.getDiningReservations();
    const prefix = data.status === 'waitlist' ? 'WL' : 'TBL';
    const newRes: DiningReservation = {
      ...data,
      id: 'dres_' + Math.random().toString(36).substring(2, 9),
      reservationCode: `${prefix}-2026-${Math.floor(410 + Math.random() * 580)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newRes);
    writeStorage(STORAGE_KEYS.DINING_RESERVATIONS, all);

    if (data.assignedTableNumber && data.status === 'confirmed') {
      const tables = this.getDiningTables();
      const targetTable = tables.find(
        (t) => t.hotelId === data.hotelId && t.tableNumber === data.assignedTableNumber && t.status === 'available'
      );
      if (targetTable) {
        targetTable.status = 'reserved';
        targetTable.currentGuestName = data.guestName;
        targetTable.currentPartySize = data.partySize;
        targetTable.reservationId = newRes.id;
        writeStorage(STORAGE_KEYS.DINING_TABLES, tables);
      }
    }

    const actorObj = typeof actor === 'string'
      ? { email: 'fb@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'DINING_RESERVATION_CREATED',
        module: 'outlets',
        targetId: newRes.id,
        hotelId: newRes.hotelId,
        description: `Logged ${data.status === 'waitlist' ? 'waitlist entry' : 'table reservation'} ${newRes.reservationCode} for ${data.guestName} (Party of ${data.partySize})`,
      });
    }

    return newRes;
  }

  public seatDiningReservation(
    reservationId: string,
    tableId: string,
    assignedServer: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): boolean {
    const reservations = this.getDiningReservations();
    const tables = this.getDiningTables();
    const res = reservations.find((r) => r.id === reservationId);
    const tbl = tables.find((t) => t.id === tableId);
    if (!res || !tbl) return false;

    res.status = 'seated';
    res.assignedTableNumber = tbl.tableNumber;
    writeStorage(STORAGE_KEYS.DINING_RESERVATIONS, reservations);

    tbl.status = 'seated';
    tbl.currentGuestName = res.guestName;
    tbl.currentPartySize = res.partySize;
    tbl.assignedServer = assignedServer;
    tbl.seatedAt = new Date().toTimeString().slice(0, 5);
    tbl.reservationId = res.id;
    if (res.roomNumber) {
      tbl.notes = `Room ${res.roomNumber} resident${res.dietaryNotes ? ` · ${res.dietaryNotes}` : ''}`;
    } else if (res.dietaryNotes) {
      tbl.notes = res.dietaryNotes;
    }
    writeStorage(STORAGE_KEYS.DINING_TABLES, tables);

    const actorObj = typeof actor === 'string'
      ? { email: 'fb@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'DINING_GUEST_SEATED',
        module: 'outlets',
        targetId: res.id,
        hotelId: res.hotelId,
        description: `Seated ${res.guestName} (Party of ${res.partySize}) at Table ${tbl.tableNumber} with server ${assignedServer}`,
      });
    }

    return true;
  }

  public updateDiningReservationStatus(
    reservationId: string,
    status: TableReservationStatus,
    actor?: { email: string; fullName: string; role: string } | string
  ): void {
    const all = this.getDiningReservations();
    const res = all.find((r) => r.id === reservationId);
    if (!res) return;

    res.status = status;
    writeStorage(STORAGE_KEYS.DINING_RESERVATIONS, all);

    if ((status === 'cancelled' || status === 'no_show' || status === 'completed') && res.assignedTableNumber) {
      const tables = this.getDiningTables();
      const tbl = tables.find(
        (t) => t.hotelId === res.hotelId && t.tableNumber === res.assignedTableNumber && t.reservationId === res.id
      );
      if (tbl) {
        tbl.status = status === 'completed' ? 'needs_bussing' : 'available';
        tbl.currentGuestName = undefined;
        tbl.currentPartySize = undefined;
        tbl.reservationId = undefined;
        tbl.seatedAt = undefined;
        writeStorage(STORAGE_KEYS.DINING_TABLES, tables);
      }
    }

    const actorObj = typeof actor === 'string'
      ? { email: 'fb@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'DINING_RESERVATION_STATUS_UPDATED',
        module: 'outlets',
        targetId: res.id,
        hotelId: res.hotelId,
        description: `Marked reservation ${res.reservationCode} (${res.guestName}) as ${status}`,
      });
    }
  }

  public getWineCellarBottles(hotelId?: string): WineCellarBottle[] {
    const all = readStorage<WineCellarBottle[]>(STORAGE_KEYS.WINE_CELLAR_BOTTLES, SEED_WINE_CELLAR_BOTTLES);
    if (hotelId) return all.filter((w) => w.hotelId === hotelId);
    return all;
  }

  public createWineCellarBottle(
    data: Omit<WineCellarBottle, 'id' | 'lastInventoriedAt'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): WineCellarBottle {
    const all = this.getWineCellarBottles();
    const newBottle: WineCellarBottle = {
      ...data,
      id: 'win_' + Math.random().toString(36).substring(2, 9),
      lastInventoriedAt: new Date().toISOString().slice(0, 10),
    };
    all.unshift(newBottle);
    writeStorage(STORAGE_KEYS.WINE_CELLAR_BOTTLES, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'sommelier@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'WINE_CELLAR_BIN_ADDED',
        module: 'outlets',
        targetId: newBottle.id,
        hotelId: newBottle.hotelId,
        description: `Registered ${newBottle.binCode}: ${newBottle.wineName} (${newBottle.stockBottles} bottles)`,
      });
    }

    return newBottle;
  }

  public restockWineCellarBottle(
    bottleId: string,
    addBottles: number,
    actor?: { email: string; fullName: string; role: string } | string
  ): WineCellarBottle | null {
    if (addBottles <= 0) return null;
    const all = this.getWineCellarBottles();
    const bottle = all.find((w) => w.id === bottleId);
    if (!bottle) return null;

    bottle.stockBottles += addBottles;
    bottle.lastInventoriedAt = new Date().toISOString().slice(0, 10);
    writeStorage(STORAGE_KEYS.WINE_CELLAR_BOTTLES, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'sommelier@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'WINE_CELLAR_RESTOCKED',
        module: 'outlets',
        targetId: bottle.id,
        hotelId: bottle.hotelId,
        description: `Added ${addBottles} bottles to ${bottle.binCode} (${bottle.wineName}); new stock: ${bottle.stockBottles}`,
      });
    }

    return bottle;
  }

  public serveWineToRoomOrTable(
    bottleId: string,
    payload: {
      quantityBottles: number;
      targetRoomNumber?: string;
      targetTableNumber?: string;
      guestName?: string;
    },
    actor?: { email: string; fullName: string; role: string } | string
  ): { success: boolean; billedToFolio: boolean; totalAmountEtb: number; bottle?: WineCellarBottle } {
    const all = this.getWineCellarBottles();
    const bottle = all.find((w) => w.id === bottleId);
    if (!bottle || payload.quantityBottles <= 0 || bottle.stockBottles < payload.quantityBottles) {
      return { success: false, billedToFolio: false, totalAmountEtb: 0 };
    }

    bottle.stockBottles -= payload.quantityBottles;
    bottle.lastInventoriedAt = new Date().toISOString().slice(0, 10);
    writeStorage(STORAGE_KEYS.WINE_CELLAR_BOTTLES, all);

    const totalAmountEtb = Math.round(bottle.bottlePriceEtb * payload.quantityBottles * 100) / 100;
    const actorObj = typeof actor === 'string'
      ? { email: 'winecellar@hotel.internal', fullName: actor, role: 'staff' }
      : actor || { email: 'winecellar@hotel.internal', fullName: 'Wine Cellar Lead', role: 'staff' };

    let billedToFolio = false;
    if (payload.targetRoomNumber) {
      const folios = this.getGuestFolios(bottle.hotelId);
      const openFolio = folios.find(
        (f) => f.roomNumber === payload.targetRoomNumber && f.status === 'open'
      );
      if (openFolio) {
        this.addChargeToFolio(
          openFolio.id,
          {
            category: 'bar',
            description: `Wine Cellar (${bottle.binCode}): ${payload.quantityBottles}x ${bottle.wineName}`,
            outletName: 'Wine Cellar',
            amount: totalAmountEtb,
            postedBy: actorObj.fullName,
          },
          actorObj
        );
        billedToFolio = true;
      }
    }

    this.logAudit({
      actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
      action: 'SOMMELIER_WINE_SERVED',
      module: 'outlets',
      targetId: bottle.id,
      hotelId: bottle.hotelId,
      description: `Served ${payload.quantityBottles}x ${bottle.wineName} (${bottle.binCode}) · ${
        billedToFolio
          ? `Posted ${totalAmountEtb.toLocaleString()} ETB to Room ${payload.targetRoomNumber} Folio`
          : payload.targetTableNumber
          ? `Table ${payload.targetTableNumber} check`
          : 'Direct lounge settlement'
      }`,
    });

    return { success: true, billedToFolio, totalAmountEtb, bottle };
  }

  // ==========================================
  // PHASE 27: GROUP ROOM BLOCKS & ROOMING LISTS
  // ==========================================
  public getGroupBlocks(hotelId?: string): GroupBlock[] {
    const all = readStorage<GroupBlock[]>(STORAGE_KEYS.GROUP_BLOCKS, SEED_GROUP_BLOCKS);
    if (hotelId) return all.filter((g) => g.hotelId === hotelId);
    return all;
  }

  public createGroupBlock(
    data: Omit<GroupBlock, 'id' | 'washedRooms' | 'estimatedRevenueEtb'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): GroupBlock {
    const all = this.getGroupBlocks();
    const nights = Math.max(
      1,
      Math.round(
        (new Date(data.checkOutDate).getTime() - new Date(data.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const estimatedRevenueEtb = Math.round(data.contractedRooms * nights * data.negotiatedRateEtb);

    const newBlock: GroupBlock = {
      ...data,
      id: 'grp_' + Math.random().toString(36).substring(2, 9),
      washedRooms: 0,
      estimatedRevenueEtb,
    };
    all.unshift(newBlock);
    writeStorage(STORAGE_KEYS.GROUP_BLOCKS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'reservations@hotel.internal', fullName: actor, role: 'front_office_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'GROUP_BLOCK_CREATED',
        module: 'rooms',
        targetId: newBlock.id,
        hotelId: newBlock.hotelId,
        description: `Created group allotment ${newBlock.blockCode} (${newBlock.groupName}) for ${newBlock.contractedRooms} rooms`,
      });
    }

    return newBlock;
  }

  public washGroupBlockInventory(
    blockId: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): { washedCount: number; block: GroupBlock | null } {
    const all = this.getGroupBlocks();
    const block = all.find((b) => b.id === blockId);
    if (!block) return { washedCount: 0, block: null };

    const remainingUnpicked = Math.max(0, block.contractedRooms - block.pickedUpRooms - block.washedRooms);
    if (remainingUnpicked === 0) return { washedCount: 0, block };

    block.washedRooms += remainingUnpicked;
    if (block.status === 'tentative' || block.status === 'definite') {
      block.status = 'washed_released';
    }
    const nights = Math.max(
      1,
      Math.round(
        (new Date(block.checkOutDate).getTime() - new Date(block.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    block.estimatedRevenueEtb = Math.round(block.pickedUpRooms * nights * block.negotiatedRateEtb);
    writeStorage(STORAGE_KEYS.GROUP_BLOCKS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'reservations@hotel.internal', fullName: actor, role: 'front_office_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'GROUP_INVENTORY_WASHED',
        module: 'rooms',
        targetId: block.id,
        hotelId: block.hotelId,
        description: `Washed ${remainingUnpicked} unsold rooms from ${block.blockCode} back into general BAR availability`,
      });
    }

    return { washedCount: remainingUnpicked, block };
  }

  public recordGroupDeposit(
    blockId: string,
    amountEtb: number,
    actor?: { email: string; fullName: string; role: string } | string
  ): GroupBlock | null {
    if (amountEtb <= 0) return null;
    const all = this.getGroupBlocks();
    const block = all.find((b) => b.id === blockId);
    if (!block) return null;

    block.depositPaidEtb = Math.round((block.depositPaidEtb + amountEtb) * 100) / 100;
    if (block.status === 'tentative') {
      block.status = 'definite';
    }
    writeStorage(STORAGE_KEYS.GROUP_BLOCKS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'finance@hotel.internal', fullName: actor, role: 'finance_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'GROUP_DEPOSIT_RECORDED',
        module: 'finance',
        targetId: block.id,
        hotelId: block.hotelId,
        description: `Recorded ${amountEtb.toLocaleString()} ETB group deposit on ${block.blockCode} (${block.groupName})`,
      });
    }

    return block;
  }

  public transferGroupBalanceToCityLedger(
    blockId: string,
    corporateAccountId: string,
    lpoReference?: string,
    actor?: { email: string; fullName: string; role: string } | string
  ): CityLedgerInvoice | null {
    const all = this.getGroupBlocks();
    const block = all.find((b) => b.id === blockId);
    if (!block) return null;

    const netBalance = Math.max(0, block.estimatedRevenueEtb - block.depositPaidEtb);
    if (netBalance <= 0) return null;

    const invoice = this.createCityLedgerInvoice(
      {
        hotelId: block.hotelId,
        accountId: corporateAccountId,
        guestOrGroupName: `${block.groupName} (${block.blockCode})`,
        folioReference: block.blockCode,
        totalAmountEtb: netBalance,
        lpoReference: lpoReference || `GRP-BILL-${block.blockCode}`,
      },
      actor
    );

    if (invoice) {
      block.corporateAccountId = corporateAccountId;
      block.cityLedgerInvoiceRef = invoice.invoiceNumber;
      block.status = 'settled';
      writeStorage(STORAGE_KEYS.GROUP_BLOCKS, all);
    }

    return invoice;
  }

  public getGroupRoomingList(hotelId?: string, groupBlockId?: string): GroupRoomingGuest[] {
    let all = readStorage<GroupRoomingGuest[]>(STORAGE_KEYS.GROUP_ROOMING_GUESTS, SEED_GROUP_ROOMING_GUESTS);
    if (hotelId) all = all.filter((g) => g.hotelId === hotelId);
    if (groupBlockId) all = all.filter((g) => g.groupBlockId === groupBlockId);
    return all;
  }

  public addRoomingListGuest(
    data: Omit<GroupRoomingGuest, 'id'>,
    actor?: { email: string; fullName: string; role: string } | string
  ): GroupRoomingGuest {
    const all = this.getGroupRoomingList();
    const newGuest: GroupRoomingGuest = {
      ...data,
      id: 'grm_' + Math.random().toString(36).substring(2, 9),
    };
    all.unshift(newGuest);
    writeStorage(STORAGE_KEYS.GROUP_ROOMING_GUESTS, all);

    // Increment pickedUpRooms if within contracted limit
    const blocks = this.getGroupBlocks();
    const blk = blocks.find((b) => b.id === data.groupBlockId);
    if (blk && blk.pickedUpRooms < blk.contractedRooms - blk.washedRooms) {
      blk.pickedUpRooms += 1;
      writeStorage(STORAGE_KEYS.GROUP_BLOCKS, blocks);
    }

    const actorObj = typeof actor === 'string'
      ? { email: 'reservations@hotel.internal', fullName: actor, role: 'staff' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: 'ROOMING_LIST_GUEST_ADDED',
        module: 'rooms',
        targetId: newGuest.id,
        hotelId: newGuest.hotelId,
        description: `Added delegate ${newGuest.guestName} to rooming list ${newGuest.blockCode}`,
      });
    }

    return newGuest;
  }

  public assignRoomAndCheckInGuest(
    guestId: string,
    roomNumber: string,
    status: 'room_assigned' | 'checked_in',
    actor?: { email: string; fullName: string; role: string } | string
  ): GroupRoomingGuest | null {
    const all = this.getGroupRoomingList();
    const guest = all.find((g) => g.id === guestId);
    if (!guest) return null;

    guest.assignedRoomNumber = roomNumber;
    guest.status = status;
    writeStorage(STORAGE_KEYS.GROUP_ROOMING_GUESTS, all);

    const actorObj = typeof actor === 'string'
      ? { email: 'frontdesk@hotel.internal', fullName: actor, role: 'front_office_manager' }
      : actor;

    if (actorObj) {
      this.logAudit({
        actor: { uid: actorObj.email, email: actorObj.email, fullName: actorObj.fullName, role: actorObj.role },
        action: status === 'checked_in' ? 'GROUP_DELEGATE_CHECKED_IN' : 'GROUP_DELEGATE_ROOM_ASSIGNED',
        module: 'rooms',
        targetId: guest.id,
        hotelId: guest.hotelId,
        description: `${status === 'checked_in' ? 'Checked in' : 'Assigned Room ' + roomNumber + ' to'} ${guest.guestName} (${guest.blockCode})`,
      });
    }

    return guest;
  }

  // ==========================================
  // PHASE 1 FOUNDATION APIS (PRESERVED)
  // ==========================================
  public getHotels(): Hotel[] {
    return readStorage<Hotel[]>(STORAGE_KEYS.HOTELS, []);
  }

  public getHotelById(id: string): Hotel | undefined {
    return this.getHotels().find((h) => h.id === id);
  }

  public saveHotel(hotel: Hotel, actor: { email: string; fullName: string; role: string }): void {
    const hotels = this.getHotels();
    const index = hotels.findIndex((h) => h.id === hotel.id);
    const now = new Date().toISOString();
    
    if (index >= 0) {
      const prev = hotels[index];
      hotels[index] = { ...hotel, updatedAt: now, updatedBy: actor.email };
      writeStorage(STORAGE_KEYS.HOTELS, hotels);
      
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'HOTEL_UPDATED',
        module: 'hotels',
        targetId: hotel.id,
        hotelId: hotel.id,
        hotelName: hotel.name,
        description: `Updated profile configuration for hotel: ${hotel.name}`,
        changes: [
          { field: 'operationalSettings', previousValue: prev.operationalSettings, newValue: hotel.operationalSettings },
          { field: 'enabledModules', previousValue: prev.enabledModules, newValue: hotel.enabledModules },
        ],
      });
    } else {
      hotels.push(hotel);
      writeStorage(STORAGE_KEYS.HOTELS, hotels);
      
      this.logAudit({
        actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
        action: 'HOTEL_REGISTERED',
        module: 'hotels',
        targetId: hotel.id,
        hotelId: hotel.id,
        hotelName: hotel.name,
        description: `Registered new hotel: ${hotel.name} (${hotel.code})`,
      });
    }
  }

  public createHotelWithAdmin(
    hotelData: Omit<Hotel, 'id' | 'subscriptionId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    adminData: { fullName: string; email: string; phone?: string; initialPassword?: string },
    actor: { email: string; fullName: string; role: string }
  ): { hotel: Hotel; subscription: Subscription; adminUser: HotelUser } {
    const hotelId = 'htl_' + Math.random().toString(36).substring(2, 9);
    const subId = 'sub_' + Math.random().toString(36).substring(2, 9);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === hotelData.subscriptionPlan) || SUBSCRIPTION_PLANS[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const graceEnds = new Date(expiryDate);
    graceEnds.setDate(graceEnds.getDate() + 7);

    const newHotel: Hotel = {
      ...hotelData,
      id: hotelId,
      subscriptionId: subId,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.email,
      updatedBy: actor.email,
    };

    const newSubscription: Subscription = {
      id: subId,
      hotelId: hotelId,
      hotelName: newHotel.name,
      planId: plan.id,
      planName: plan.name,
      billingCycle: 'monthly',
      price: plan.monthlyPriceETB,
      currency: 'ETB',
      startDate: now,
      expiryDate: expiryDate.toISOString(),
      gracePeriodDays: 7,
      gracePeriodEndsAt: graceEnds.toISOString(),
      paymentStatus: 'paid',
      status: 'active',
      autoRenew: true,
      history: [
        {
          action: 'created',
          performedBy: actor.email,
          timestamp: now,
          notes: 'Account created with initial 30-day active trial by Super Admin.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const newAdminUser: HotelUser = {
      id: userId,
      uid: 'auth_' + userId,
      hotelId: hotelId,
      employeeId: 'EMP-ADM-001',
      email: adminData.email,
      fullName: adminData.fullName,
      phone: adminData.phone,
      role: 'hotel_admin',
      departmentId: 'management',
      departmentName: 'Executive Office',
      status: 'active',
      requirePasswordChange: true,
      invitedBy: actor.email,
      createdAt: now,
      updatedAt: now,
    };

    // Save
    const hotels = this.getHotels();
    hotels.push(newHotel);
    writeStorage(STORAGE_KEYS.HOTELS, hotels);

    const subscriptions = this.getSubscriptions();
    subscriptions.push(newSubscription);
    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);

    const users = this.getAllUsers();
    users.push(newAdminUser);
    writeStorage(STORAGE_KEYS.USERS, users);

    if (adminData.initialPassword && adminData.initialPassword.trim()) {
      void this.setUserPassword(newAdminUser.id, adminData.initialPassword.trim(), false);
    }

    // Also auto-initialize standard 15 departments and financial config for the new hotel!
    const depts = this.getDepartments();
    const newDepts = generateSeedDepartments(hotelId);
    depts.push(...newDepts);
    writeStorage(STORAGE_KEYS.DEPARTMENTS, depts);

    this.saveFinancialRules(generateSeedFinancialRules(hotelId, newHotel.operationalSettings.currency), actor);

    return { hotel: newHotel, subscription: newSubscription, adminUser: newAdminUser };
  }

  public getSubscriptions(): Subscription[] {
    return readStorage<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
  }

  public getSubscriptionByHotelId(hotelId: string): Subscription | undefined {
    return this.getSubscriptions().find((s) => s.hotelId === hotelId);
  }

  public updateSubscriptionStatus(
    subscriptionId: string,
    newStatus: SubscriptionStatus,
    reason: string,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const subs = this.getSubscriptions();
    const index = subs.findIndex((s) => s.id === subscriptionId);
    if (index === -1) return;

    const sub = subs[index];
    const prevStatus = sub.status;
    sub.status = newStatus;
    sub.suspensionReason = newStatus === 'suspended' ? reason : undefined;
    sub.updatedAt = new Date().toISOString();
    sub.history.push({
      action: newStatus === 'suspended' ? 'suspended' : newStatus === 'active' ? 'reactivated' : 'grace_entered',
      performedBy: actor.email,
      timestamp: new Date().toISOString(),
      notes: reason,
    });

    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    const hotels = this.getHotels();
    const hotelIndex = hotels.findIndex((h) => h.id === sub.hotelId);
    if (hotelIndex >= 0) {
      hotels[hotelIndex].subscriptionStatus = newStatus;
      hotels[hotelIndex].status = newStatus === 'suspended' ? 'suspended' : 'active';
      writeStorage(STORAGE_KEYS.HOTELS, hotels);
    }
  }

  public extendSubscription(
    subscriptionId: string,
    additionalDays: number,
    actor: { email: string; fullName: string; role: string },
    notes?: string
  ): void {
    const subs = this.getSubscriptions();
    const index = subs.findIndex((s) => s.id === subscriptionId);
    if (index === -1) return;

    const sub = subs[index];
    const currentExpiry = new Date(sub.expiryDate);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setDate(baseDate.getDate() + additionalDays);
    
    sub.expiryDate = baseDate.toISOString();
    const grace = new Date(baseDate);
    grace.setDate(grace.getDate() + sub.gracePeriodDays);
    sub.gracePeriodEndsAt = grace.toISOString();
    sub.status = 'active';
    sub.paymentStatus = 'paid';
    sub.updatedAt = new Date().toISOString();

    sub.history.push({
      action: 'renewed',
      performedBy: actor.email,
      timestamp: new Date().toISOString(),
      notes:
        notes ||
        (this.currentLanguage === 'am'
          ? `በዋና አስተዳዳሪ ለ ${additionalDays} ቀናት ተራዝሟል።`
          : `Extended by ${additionalDays} days by Super Admin.`),
    });

    writeStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    const hotels = this.getHotels();
    const hIdx = hotels.findIndex((h) => h.id === sub.hotelId);
    if (hIdx >= 0) {
      hotels[hIdx].subscriptionStatus = 'active';
      hotels[hIdx].status = 'active';
      writeStorage(STORAGE_KEYS.HOTELS, hotels);
    }
  }

  public getPayments(): SubscriptionPayment[] {
    return readStorage<SubscriptionPayment[]>(STORAGE_KEYS.PAYMENTS, []);
  }

  public recordManualPayment(
    payment: Omit<SubscriptionPayment, 'id' | 'referenceNumber' | 'status' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): SubscriptionPayment {
    const id = 'pay_' + Math.random().toString(36).substring(2, 9);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `SEAM-PAY-${dateStr}-${rand}`;

    const newPayment: SubscriptionPayment = {
      ...payment,
      id,
      referenceNumber,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };

    const payments = this.getPayments();
    payments.unshift(newPayment);
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  }

  public verifyPayment(
    paymentId: string,
    extendDays: number,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const payments = this.getPayments();
    const index = payments.findIndex((p) => p.id === paymentId);
    if (index === -1) return;

    const p = payments[index];
    p.status = 'verified';
    p.verifiedBy = actor.email;
    p.verifiedAt = new Date().toISOString();
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);

    const note =
      this.currentLanguage === 'am'
        ? `ክፍያ ተረጋግጧል: ማጣቀሻ ${p.referenceNumber}`
        : `Payment verified: Ref ${p.referenceNumber}`;
    this.extendSubscription(p.subscriptionId, extendDays, actor, note);
  }

  public getAllUsers(): HotelUser[] {
    return readStorage<HotelUser[]>(STORAGE_KEYS.USERS, []);
  }

  public getUsersByHotelId(hotelId: string): HotelUser[] {
    return this.getAllUsers().filter((u) => u.hotelId === hotelId);
  }

  public saveHotelUser(user: HotelUser, actor: { email: string; fullName: string; role: string }): void {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    const now = new Date().toISOString();

    if (index >= 0) {
      users[index] = { ...users[index], ...user, updatedAt: now };
    } else {
      users.push({ ...user, createdAt: user.createdAt || now, updatedAt: now });
    }
    writeStorage(STORAGE_KEYS.USERS, users);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: index >= 0 ? 'HOTEL_USER_UPDATED' : 'HOTEL_USER_PRIVILEGED',
      module: 'users',
      targetId: user.id,
      hotelId: user.hotelId,
      description: `${index >= 0 ? 'Updated' : 'Privileged'} user ${user.fullName} (${user.email}) with role ${user.role} [${user.status}]`,
    });
  }

  public deleteHotelUser(userId: string, actor: { email: string; fullName: string; role: string }): void {
    const users = this.getAllUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const filtered = users.filter((u) => u.id !== userId);
    writeStorage(STORAGE_KEYS.USERS, filtered);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'HOTEL_USER_REVOKED',
      module: 'users',
      targetId: userId,
      hotelId: target.hotelId,
      description: `Revoked property access for ${target.fullName} (${target.email})`,
    });
  }

  public getPlatformUsers(): PlatformUser[] {
    return readStorage<PlatformUser[]>(STORAGE_KEYS.PLATFORM_USERS, []);
  }

  public savePlatformUser(user: PlatformUser, actor: { email: string; fullName: string; role: string }): void {
    const users = this.getPlatformUsers();
    const index = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    const now = new Date().toISOString();

    if (index >= 0) {
      users[index] = { ...users[index], ...user, updatedAt: now };
    } else {
      users.push({ ...user, createdAt: user.createdAt || now, updatedAt: now });
    }
    writeStorage(STORAGE_KEYS.PLATFORM_USERS, users);

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: index >= 0 ? 'PLATFORM_ADMIN_UPDATED' : 'PLATFORM_ADMIN_PRIVILEGED',
      module: 'security',
      targetId: user.id,
      description: `${index >= 0 ? 'Updated' : 'Granted'} Super Admin privilege for ${user.fullName} (${user.email}) [${user.status}]`,
    });
  }

  public deletePlatformUser(userId: string, actor: { email: string; fullName: string; role: string }): void {
    const users = this.getPlatformUsers();
    const target = users.find((u) => u.id === userId);
    if (!target || target.email.toLowerCase() === 'getman2000@gmail.com') return;
    writeStorage(
      STORAGE_KEYS.PLATFORM_USERS,
      users.filter((u) => u.id !== userId)
    );

    this.logAudit({
      actor: { uid: actor.email, email: actor.email, fullName: actor.fullName, role: actor.role },
      action: 'PLATFORM_ADMIN_REVOKED',
      module: 'security',
      targetId: userId,
      description: `Revoked Super Admin privilege for ${target.fullName} (${target.email})`,
    });
  }

  public async setUserPassword(userId: string, rawPassword: string, isPlatform = false): Promise<void> {
    const passwordHash = await hashSecret(rawPassword);
    const now = new Date().toISOString();
    if (isPlatform) {
      const users = this.getPlatformUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        users[idx] = { ...users[idx], passwordHash, updatedAt: now };
        writeStorage(STORAGE_KEYS.PLATFORM_USERS, users);
      }
      return;
    }
    const users = this.getAllUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], passwordHash, requirePasswordChange: false, updatedAt: now };
      writeStorage(STORAGE_KEYS.USERS, users);
    }
  }

  public getAuditLogs(hotelId?: string): AuditLog[] {
    const logs = readStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const filtered = !hotelId ? logs : logs.filter((l) => l.hotelId === hotelId || !l.hotelId);
    if (this.currentLanguage !== 'am') return filtered;
    return filtered.map((l) => ({
      ...l,
      description: l.descriptionAm || l.description,
    }));
  }

  public logAudit(logData: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const id = 'log_' + Math.random().toString(36).substring(2, 9);
    const newLog: AuditLog = {
      ...logData,
      id,
      timestamp: new Date().toISOString(),
    };
    const logs = readStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift(newLog);
    writeStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  }

  public getAnnouncements(): PlatformAnnouncement[] {
    const items = readStorage<PlatformAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    if (this.currentLanguage !== 'am') return items;
    return items.map((a) => ({
      ...a,
      title: a.titleAm || a.title,
      content: a.contentAm || a.content,
    }));
  }

  public saveAnnouncement(
    ann: Omit<PlatformAnnouncement, 'id' | 'createdAt'>,
    actor: { email: string; fullName: string; role: string }
  ): void {
    const id = 'ann_' + Math.random().toString(36).substring(2, 9);
    const item: PlatformAnnouncement = {
      ...ann,
      id,
      createdAt: new Date().toISOString(),
    };
    const items = readStorage<PlatformAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    items.unshift(item);
    writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, items);
  }
}

export const saasStorage = SaaSStorageService.getInstance();
export const storageService = saasStorage;
export const storage = saasStorage;
