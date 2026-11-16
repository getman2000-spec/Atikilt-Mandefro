/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise English ↔ Amharic (አማርኛ) Hospitality ERP Dictionary & Dynamic Phrase Translator
 * Covers UI labels, navigation, backend status/error messages, KPIs, and hospitality domain content.
 */

import { MODULE_CATALOG_AMHARIC } from './amharicModuleCatalog';

export const EXACT_AMHARIC_MAP: Record<string, string> = {
  ...MODULE_CATALOG_AMHARIC,
  // Brand & Shell
  'SEAM': 'SEAM',
  'SEAM Platform': 'SEAM መድረክ',
  'SEAM Hotel Management System': 'SEAM የሆቴል አስተዳደር ሥርዓት',
  'SaaS Governance': 'የSaaS አስተዳደር',
  'Platform Governance': 'የመድረክ አስተዳደር',
  'Platform-level visibility': 'የመድረክ ደረጃ እይታ',
  'Property Workspace': 'የሆቴል የሥራ ቦታ',
  'Active Persona': 'ንቁ ተጠቃሚ',
  'Active Property': 'ንቁ ሆቴል',
  'Workspace Switcher': 'የሥራ ቦታ መቀየሪያ',
  'Switch active persona': 'ንቁ ተጠቃሚ ቀይር',
  'Super Admin (Platform Governance)': 'ዋና አስተዳዳሪ (የመድረክ አስተዳደር)',
  'Super Admin': 'ዋና አስተዳዳሪ',
  'Hotel Admin': 'የሆቴል አስተዳዳሪ',
  'Hotel Administrator': 'የሆቴል አስተዳዳሪ',
  'General Manager': 'ዋና ሥራ አስኪያጅ',
  'General Manager (GM)': 'ዋና ሥራ አስኪያጅ (GM)',
  'Department Head': 'የክፍል ኃላፊ',
  'Shift Supervisor': 'የፈረቃ ተቆጣጣሪ',
  'Operational Staff': 'የሥራ ባልደረባ',
  'Auditor / Viewer': 'ኦዲተር / ተመልካች',
  'Hotel Owner / Board': 'የሆቴል ባለቤት / ቦርድ',
  'Capabilities': 'ችሎታዎች',
  'Lock': 'ቆልፍ',
  'Reset': 'ዳግም አስጀምር',
  'Sign Out': 'ውጣ',
  'Sign out': 'ውጣ',
  'Lock session': 'ክፍለ ጊዜ ቆልፍ',
  'Unlock Session': 'ክፍለ ጊዜ ክፈት',
  'Session Locked': 'ክፍለ ጊዜ ተቆልፏል',
  'Protected session for': 'የተጠበቀ ክፍለ ጊዜ ለ',
  'Enter PIN or password...': 'PIN ወይም የይለፍ ቃል ያስገቡ...',
  'Jump to module...': 'ወደ ሞጁል ዝለል...',
  'Ctrl K': 'Ctrl K',
  'Operational Alerts': 'የሥራ ማንቂያዎች',
  'No active operational alerts right now.': 'በአሁኑ ጊዜ ምንም ንቁ የሥራ ማንቂያዎች የሉም።',
  'Grace Period': 'የችሮታ ጊዜ',
  'Onboard Hotel': 'አዲስ ሆቴል አስገባ',
  'Front Desk': 'እንግዳ መቀበያ',
  'Expand sidebar': 'የጎን ምናሌ አስፋ',
  'Compact sidebar': 'የጎን ምናሌ አሳጥር',
  'Close': 'ዝጋ',
  'Cancel': 'ሰርዝ',
  'Confirm': 'አረጋግጥ',
  'Save': 'አስቀምጥ',
  'Save Changes': 'ለውጦችን አስቀምጥ',
  'Submit': 'አስገባ',
  'Create': 'ፍጠር',
  'Update': 'አዘምን',
  'Delete': 'ሰርዝ',
  'Edit': 'አርትዕ',
  'View': 'ተመልከት',
  'Approve': 'አጽድቅ',
  'Reject': 'ውድቅ አድርግ',
  'Verify': 'አረጋግጥ',
  'Resolve': 'ፍታ',
  'Export CSV': 'CSV አውርድ',
  'Export': 'ላክ / አውርድ',
  'Print': 'አትም',
  'Refresh': 'አድስ',
  'Filter': 'አጣራ',
  'All': 'ሁሉም',
  'Search': 'ፈልግ',
  'Search records...': 'መዝገቦችን ፈልግ...',
  'Search any of the 27 operational modules, reports, or settings...': 'ከ27ቱ የሥራ ሞጁሎች፣ ሪፖርቶች ወይም ቅንብሮች መካከል ይፈልጉ...',
  'Actions': 'ተግባራት',
  'Status': 'ሁኔታ',
  'Notes': 'ማስታወሻዎች',
  'Description': 'መግለጫ',
  'Category': 'ምድብ',
  'Priority': 'ቅድሚያ',
  'Department': 'ክፍለ ሥራ',
  'Location': 'ቦታ',
  'Date': 'ቀን',
  'Amount': 'መጠን',
  'Total': 'ጠቅላላ',
  'No matching records': 'ተዛማጅ መዝገቦች አልተገኙም',
  'Try adjusting your search or filter criteria, or create a new entry.': 'የፍለጋ ወይም የማጣሪያ መስፈርቶችን ያስተካክሉ ወይም አዲስ መዝገብ ይፍጠሩ።',
  'No properties provisioned': 'ምንም ሆቴሎች አልተመዘገቡም',

  // Auth & Login
  'Sign in to SEAM': 'ወደ SEAM ይግቡ',
  'Enterprise Hospitality Operations & Financial Control': 'የኢንተርፕራይዝ መስተንግዶ ሥራዎች እና የፋይናንስ ቁጥጥር',
  'Work Email': 'የሥራ ኢሜይል',
  'Password': 'የይለፍ ቃል',
  'Forgot password?': 'የይለፍ ቃል ረሱ?',
  'Enter your password': 'የይለፍ ቃልዎን ያስገቡ',
  'Sign In': 'ግባ',
  'Continue with Google': 'በGoogle ይቀጥሉ',
  'Sign in with Google': 'በGoogle ይግቡ',
  'Or sign in with property credentials': 'ወይም በሆቴል መለያ መረጃ ይግቡ',
  'Google authentication failed': 'የGoogle ማረጋገጫ አልተሳካም',
  'Workspace User': 'የሥራ ቦታ ተጠቃሚ',
  'Quick Access Workspace Switch': 'ፈጣን የሥራ ቦታ መቀየሪያ',
  'Reset Account Password': 'የመለያ የይለፍ ቃል ዳግም ማስጀመር',
  'Send Reset Link': 'የዳግም ማስጀመሪያ አገናኝ ላክ',
  'Password reset instructions have been dispatched to your email address.': 'የይለፍ ቃል ዳግም ማስጀመሪያ መመሪያ ወደ ኢሜይልዎ ተልኳል።',
  'Please enter both email and password.': 'እባክዎ ኢሜይል እና የይለፍ ቃል ሁለቱንም ያስገቡ።',
  'Associated hotel account was not found.': 'ተዛማጅ የሆቴል መለያ አልተገኘም።',
  'Your staff account has been suspended by management.': 'የሰራተኛ መለያዎ በአስተዳደር ታግዷል።',
  'Invalid credentials. Use testing switcher above or enter registered email.': 'ልክ ያልሆነ መረጃ። ከላይ ያለውን መቀየሪያ ይጠቀሙ ወይም የተመዘገበ ኢሜይል ያስገቡ።',
  'Account Suspended': 'መለያው ታግዷል',
  'Contact SEAM Support': 'የSEAM ድጋፍን ያግኙ',

  // Testing Bar & Capabilities Matrix
  'Reset SEAM Workspace Data?': 'የSEAM የሥራ ቦታ ውሂብ ዳግም ይጀመር?',
  'This clears local browser overrides and restores the default operational seed datasets.': 'ይህ የአካባቢ ማስተካከያዎችን ያጸዳል እና ነባሪ የሥራ ውሂቦችን ይመልሳል።',
  'Reset Data': 'ውሂብ ዳግም አስጀምር',
  'Workspace restored to default datasets': 'የሥራ ቦታ ወደ ነባሪ ውሂብ ተመልሷል',
  'SEAM Multi-Tenant Architecture Matrix': 'የSEAM ባለብዙ-ደንበኛ መዋቅር ሰንጠረዥ',
  'Super Admin Platform Governance': 'የዋና አስተዳዳሪ መድረክ አስተዳደር',
  'Strict Multi-Tenant Property Isolation': 'ጥብቅ የሆቴል ውሂብ መለያየት',
  '8-Tier RBAC Permission Engine': 'ባለ 8-ደረጃ የRBAC ፈቃድ ሥርዓት',
  'Configurable Currency & Fiscal Rules': 'ሊዋቀር የሚችል ምንዛሬ እና የግብር ሕጎች',
  '27 Full-Stack Hospitality Modules': '27 ሙሉ የመስተንግዶ ሞጁሎች',
  'Active': 'ንቁ',

  // Navigation Groups (Super Admin + Hotel)
  'Platform Overview': 'የመድረክ አጠቃላይ እይታ',
  'Executive Overview': 'አስፈጻሚ አጠቃላይ እይታ',
  'Hotel Tenants': 'የሆቴል ደንበኞች',
  'Subscriptions & Plans': 'የደንበኝነት ምዝገባ እና ዕቅዶች',
  'Payment Verification': 'የክፍያ ማረጋገጫ',
  'Module Feature Flags': 'የሞጁል ባህሪያት ቁጥጥር',
  'Announcements': 'ማስታወቂያዎች',
  'Security Audit Trail': 'የደህንነት ኦዲት መዝገብ',
  'Overview & Governance': 'አጠቃላይ እይታ እና አስተዳደር',
  'Executive Dashboard': 'የአስፈጻሚ ዳሽቦርድ',
  'Organization Settings': 'የድርጅት ቅንብሮች',
  'Staff Accounts & Roles': 'የሰራተኞች መለያ እና ሚናዎች',
  'RBAC Permissions Matrix': 'የሚና እና ፈቃድ ሰንጠረዥ',
  'Subscription & Billing': 'ምዝገባ እና ክፍያ',
  'Property Configuration': 'የሆቴል ማዋቀሪያ',
  'Rooms & Categories': 'ክፍሎች እና ምድቦች',
  'Departments Setup': 'የክፍለ ሥራዎች ማዋቀሪያ',
  'Outlets & POS Centers': 'መሸጫዎች እና የPOS ማዕከላት',
  'Employee Directory': 'የሰራተኞች ማውጫ',
  'Financial Rules & Limits': 'የፋይናንስ ሕጎች እና ገደቦች',
  'Front Office & Guest Journey': 'የፊት ቢሮ እና የእንግዳ ጉዞ',
  'Front Desk & Folios': 'እንግዳ መቀበያ እና ሂሳቦች',
  'Housekeeping Board': 'የቤት አያያዝ ሰሌዳ',
  'Group Room Blocks': 'የቡድን ክፍል ምደባዎች',
  'Digital In-Room Hub': 'የክፍል ውስጥ ዲጂታል ማዕከል',
  'Concierge & Safaris': 'ኮንሲየርጅ እና ጉዞዎች',
  'Guest CRM, Spa & Loyalty': 'የእንግዳ CRM፣ ስፓ እና ታማኝነት',
  'Reputation & CSAT': 'ስም እና የእንግዳ እርካታ',
  'F&B, Culinary & Venues': 'ምግብና መጠጥ፣ ወጥ ቤት እና አዳራሾች',
  'POS & Cashier Sessions': 'POS እና የገንዘብ ተቀባይ ክፍለ ጊዜዎች',
  'Dining & Wine Cellar': 'ምግብ ቤት እና ወይን ማከማቻ',
  'Recipe & Menu Matrix': 'የምግብ አዘገጃጀት እና ሜኑ ማትሪክስ',
  'Conferences & Events': 'ስብሰባዎች እና ዝግጅቶች',
  'Finance, Audit & Revenue': 'ፋይናንስ፣ ኦዲት እና ገቢ',
  'Financial Management': 'የፋይናንስ አስተዳደር',
  'City Ledger & AR': 'የድርጅት ሂሳብ እና ተሰብሳቢ',
  'Night Audit & EOD': 'የምሽት ኦዲት እና የቀን መዝጊያ',
  'CRS & Yield Management': 'CRS እና የዋጋ አስተዳደር',
  'Executive BI & Vault': 'አስፈጻሚ BI እና ማህደር',
  'Stores, Supply & Facilities': 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
  'Stores & Inventory': 'ዕቃ ግምጃ ቤት እና ክምችት',
  'Supply Chain & POs': 'አቅርቦት ሰንሰለት እና የግዥ ትዕዛዞች',
  'Laundry & Linen': 'ልብስ ማጠቢያ እና ሊነን',
  'Engineering & Assets': 'ኢንጂነሪንግ እና ንብረቶች',
  'Energy & Room IoT': 'ኢነርጂ እና ዘመናዊ ክፍል IoT',
  'Green Hospitality': 'አረንጓዴ መስተንግዶ',
  'Food Safety & Pool': 'የምግብ ደህንነት እና መዋኛ',
  'Valet & EV Parking': 'ቫሌት እና የEV ማቆሚያ',
  'Workforce, Safety & Dispatch': 'የሰው ኃይል፣ ደህንነት እና ስርጭት',
  'HR, Rosters & Payroll': 'የሰው ኃይል፣ ፈረቃ እና ደመወዝ',
  'Staff Tasks & Handover': 'የሰራተኞች ተግባራት እና ርክክብ',
  'Security & Recovery': 'ደህንነት እና አገልግሎት ማገገሚያ',

  // Executive Dashboard & KPIs
  'Total Revenue': 'ጠቅላላ ገቢ',
  'Occupancy %': 'የክፍል መያዝ %',
  'ADR': 'አማካይ የቀን ክፍያ (ADR)',
  'RevPAR': 'በክፍል ገቢ (RevPAR)',
  'Rooms Sold': 'የተሸጡ ክፍሎች',
  'Outstanding Receivables': 'ያልተሰበሰቡ ሂሳቦች',
  'Revenue Performance': 'የገቢ አፈጻጸም',
  'Department Revenue Comparison': 'የክፍለ ሥራዎች ገቢ ንጽጽር',
  'Budget vs Actual Performance': 'በጀት እና ትክክለኛ አፈጻጸም',
  'Department Performance Summary': 'የክፍለ ሥራዎች አፈጻጸም ማጠቃለያ',
  'Pending Approvals': 'ማጽደቅ የሚጠባበቁ',
  'Critical Operational Alerts': 'ወሳኝ የሥራ ማንቂያዎች',
  'Recent Activities': 'የቅርብ ጊዜ እንቅስቃሴዎች',
  'Daily Revenue Trends': 'የዕለት ገቢ አዝማሚያ',
  'Monthly Revenue Trends': 'የወርሃዊ ገቢ አዝማሚያ',
  'Occupancy Trends': 'የክፍል መያዝ አዝማሚያ',
  'Business Date': 'የሥራ ቀን',
  'Date Range': 'የቀን ክልል',
  'All Departments': 'ሁሉም ክፍለ ሥራዎች',
  'Executive Operations & Financial Command': 'አስፈጻሚ ሥራዎች እና የፋይናንስ ቁጥጥር',
  'Revenue & Occupancy Trend': 'የገቢ እና የክፍል መያዝ አዝማሚያ',
  'Department Revenue Mix': 'የክፍለ ሥራዎች ገቢ ስብጥር',
  'Department Budget vs Actual Spend': 'የክፍለ ሥራ በጀት እና ትክክለኛ ወጪ',
  'KPI Target Attainment': 'የKPI ግብ አፈጻጸም',
  'Recent Property Activity': 'የቅርብ ጊዜ የሆቴል እንቅስቃሴ',
  'Rooms Live Status': 'የክፍሎች ወቅታዊ ሁኔታ',
  'Vacant Ready': 'ባዶ ዝግጁ',
  'Dirty Turnover': 'ጽዳት የሚፈልጉ',
  'Property Settings': 'የሆቴል ቅንብሮች',
  'Sample data': 'ናሙና ውሂብ',
  'Sample data & Simulator': 'ናሙና ውሂብ እና ማስመሰያ',

  // Super Admin Portal & Hotels Status
  'SaaS Platform Overview': 'የSaaS መድረክ አጠቃላይ እይታ',
  'Platform Governance & Tenant Health': 'የመድረክ አስተዳደር እና የሆቴሎች ሁኔታ',
  'Multi-tenant SaaS provisioning, subscription contracts, payment verification queue, and platform audit logs.': 'ባለብዙ-ሆቴል SaaS አገልግሎት፣ የምዝገባ ውሎች፣ የክፍያ ማረጋገጫ ወረፋ እና የመድረክ ኦዲት መዝገቦች።',
  'Tenant Portfolio Overview': 'የሆቴሎች ሁኔታ እና አጠቃላይ እይታ',
  'Platform-level property metadata and subscription status': 'በመድረክ ደረጃ የሆቴሎች መረጃ፣ አቅም እና የምዝገባ ሁኔታ',
  'Subscribing Properties': 'የተመዘገቡ ሆቴሎች',
  'Grace & Suspended Watch': 'የችሮታ እና የታገዱ ሆቴሎች ክትትል',
  'Normalized Platform MRR (ETB)': 'ጠቅላላ ወርሃዊ ገቢ (በብር)',
  'Payment Verification Queue': 'የክፍያ ማረጋገጫ ወረፋ',
  'Platform Usage & Isolation': 'የመድረክ አጠቃቀም እና መለያየት',
  'Room Capacity Allocated': 'የተመደበ የክፍል አቅም',
  'Active Subscriptions': 'ንቁ ምዝገባዎች',
  'Tenant Data Scope': 'የሆቴል ውሂብ ወሰን',
  'Strict hotelId Isolation': 'ጥብቅ የሆቴል መለያ (hotelId) መለያየት',
  'Audit Trail': 'የኦዲት መዝገብ',
  'Onboard Property': 'አዲስ ሆቴል አስገባ',
  'Broadcast': 'መልእክት አሰራጭ',
  'Hotel Tenant Directory': 'የሆቴሎች ሁኔታ እና ማውጫ',
  'Onboard independent hotel properties, enforce multi-tenant boundaries, and govern subscription lifecycles.': 'ራሳቸውን የቻሉ ሆቴሎችን ያስመዝግቡ፣ የውሂብ መለያየትን ያስከብሩ እና የምዝገባ ሁኔታን ያስተዳድሩ።',
  'Register New Hotel': 'አዲስ ሆቴል መዝግብ',
  'Registered Tenants': 'የተመዘገቡ ሆቴሎች',
  'In Grace Period': 'በችሮታ ጊዜ ውስጥ',
  'Suspended Tenants': 'የታገዱ ሆቴሎች',
  'Launch Property': 'ሆቴሉን ክፈት',
  'Configure': 'አዋቅር',
  'Modules Provisioned': 'የተፈቀዱ ሞጁሎች',
  'Room Capacity': 'የክፍል አቅም',
  'active': 'ንቁ',
  'grace period': 'የችሮታ ጊዜ',
  'suspended': 'ታግዷል',
  'Active Tenants': 'ንቁ ሆቴሎች',
  'Monthly Recurring Revenue': 'ወርሃዊ ተደጋጋሚ ገቢ',
  'Pending Payments': 'በመጠባበቅ ላይ ያሉ ክፍያዎች',
  'Suspended Accounts': 'የታገዱ መለያዎች',
  'Hotel Tenants Registry': 'የሆቴል ደንበኞች መዝገብ',
  'Onboard New Hotel': 'አዲስ ሆቴል አስመዝግብ',
  'Subscription Plans & Lifecycle': 'የምዝገባ ዕቅዶች እና የሕይወት ዑደት',
  'Payment Receipt Verification': 'የክፍያ ደረሰኝ ማረጋገጫ',
  'Module Access & Feature Flags': 'የሞጁል መዳረሻ እና ባህሪያት',
  'Platform Announcements': 'የመድረክ ማስታወቂያዎች',
  'Broadcast Announcement': 'ማስታወቂያ አሰራጭ',
  'Immutable Security Audit Trail': 'የማይቀየር የደህንነት ኦዲት መዝገብ',
  'Active & Grace': 'ንቁ እና የችሮታ ጊዜ',
  'Suspended': 'ታግዷል',
  'Grace Period Active': 'የችሮታ ጊዜ ንቁ ነው',
  'Verified': 'ተረጋግጧል',
  'Pending Review': 'ግምገማ በመጠባበቅ ላይ',
  'Rejected': 'ውድቅ ተደርጓል',
  'Basic Operations': 'መሰረታዊ ሥራዎች',
  'Standard Commercial': 'መደበኛ ንግድ',
  'Premium Enterprise': 'ፕሪሚየም ኢንተርፕራይዝ',
  'Custom / Group Tier': 'ብጁ / የቡድን ደረጃ',

  // Hotel Configuration Modules
  'Organization & Property Settings': 'የድርጅት እና የሆቴል ቅንብሮች',
  'Staff Accounts & Access Control': 'የሰራተኞች መለያ እና የመዳረሻ ቁጥጥር',
  'Role & Permission Matrix': 'የሚና እና ፈቃድ ሰንጠረዥ',
  'Subscription Health & Billing': 'የምዝገባ ጤንነት እና ክፍያ',
  'Rooms & Inventory Management': 'የክፍሎች እና ክምችት አስተዳደር',
  'Departmental Structure & Budgets': 'የክፍለ ሥራ መዋቅር እና በጀት',
  'Outlets & POS Revenue Centers': 'መሸጫዎች እና የPOS የገቢ ማዕከላት',
  'Employee Directory & Staff Records': 'የሰራተኞች ማውጫ እና መዝገቦች',
  'Financial Rules & Governance Limits': 'የፋይናንስ ሕጎች እና የአስተዳደር ገደቦች',
  'Total Inventory': 'ጠቅላላ ክፍሎች',
  'Ready to Sell': 'ለሽያጭ ዝግጁ',
  'Occupied': 'የተያዘ',
  'Dirty / Turnover': 'ቆሻሻ / ጽዳት የሚፈልግ',
  'Maintenance / OOO': 'ጥገና / ከአገልግሎት ውጪ',
  'Vacant Clean': 'ባዶ ንጹህ',
  'Vacant Dirty': 'ባዶ ቆሻሻ',
  'Inspected': 'የተፈተሸ',
  'Out of Order': 'ከአገልግሎት ውጪ',
  'Total Enrolled Staff': 'ጠቅላላ የተመዘገቡ ሰራተኞች',
  'Active On Duty': 'በሥራ ላይ ያሉ',
  'On Approved Leave': 'በጸደቀ ፈቃድ ላይ',
  'Monthly Base Payroll': 'ወርሃዊ መሰረታዊ ደመወዝ',
  'Configured Departments': 'የተዋቀሩ ክፍለ ሥራዎች',
  'Active Departments': 'ንቁ ክፍለ ሥራዎች',
  'Monthly Budget Pool': 'ወርሃዊ የበጀት ድምር',
  'Default Language': 'ነባሪ ቋንቋ',
  'Amharic (አማርኛ)': 'አማርኛ (Amharic)',
  'English': 'እንግሊዝኛ (English)',

  // Daily Operations (Front Office, Housekeeping, POS, Dining, Group Blocks)
  'Front Office & Reservations': 'የፊት ቢሮ እና ቦታ ማስያዝ',
  'Check-In': 'መግቢያ (Check-In)',
  'Check-Out': 'መውጫ (Check-Out)',
  'New Reservation': 'አዲስ ቦታ ማስያዝ',
  'Walk-In': 'ቀጥታ መግቢያ',
  'Checked In': 'ገብቷል',
  'Checked Out': 'ወጥቷል',
  'Confirmed': 'የተረጋገጠ',
  'No Show': 'ያልመጣ',
  'Cancelled': 'ተሰርዟል',
  'In-House Guests': 'በሆቴል ውስጥ ያሉ እንግዶች',
  'Arrivals Today': 'ዛሬ የሚገቡ',
  'Departures Today': 'ዛሬ የሚወጡ',
  'Guest Folio': 'የእንግዳ ሂሳብ',
  'Folio Balance': 'የሂሳብ ቀሪ',
  'Post Charge': 'ክፍያ መዝግብ',
  'Record Payment': 'ክፍያ አስገባ',
  'Room Rack': 'የክፍል ሰሌዳ',
  'Housekeeping Operations Board': 'የቤት አያያዝ ሥራ ሰሌዳ',
  'Assign Attendant': 'አጽጂ መድብ',
  'Mark Clean': 'ንጹህ አድርግ',
  'Mark Inspected': 'የተፈተሸ አድርግ',
  'POS & Cashier Terminal': 'POS እና የገንዘብ ተቀባይ ተርሚናል',
  'Open Cashier Shift': 'የገንዘብ ተቀባይ ፈረቃ ክፈት',
  'Close Shift': 'ፈረቃ ዝጋ',
  'Post Order': 'ትዕዛዝ አስገባ',
  'Dining Floor Plan & Wine Cellar': 'የምግብ ቤት ወለል እና ወይን ማከማቻ',
  'Table Reservations': 'የጠረጴዛ ቦታ ማስያዝ',
  'Wine Cellar': 'የወይን ማከማቻ',
  'Group Room Blocks & Rooming Lists': 'የቡድን ክፍል ምደባዎች እና ዝርዝር',
  'Create Group Block': 'የቡድን ምደባ ፍጠር',
  'Cutoff Date': 'የመጨረሻ ቀን',
  'Pickup': 'የተወሰደ',

  // Finance, Audit, BI, CRS, City Ledger
  'Financial Control & Approvals': 'የፋይናንስ ቁጥጥር እና ፍቃዶች',
  'Purchase Requisitions': 'የግዥ ጥያቄዎች',
  'Daily Revenue Flash': 'የዕለት ገቢ ሪፖርት',
  'Bank Reconciliations': 'የባንክ ማስታረቅ',
  'New Requisition': 'አዲስ የግዥ ጥያቄ',
  'City Ledger & Corporate AR': 'የድርጅት ሂሳብ እና ተሰብሳቢ',
  'Corporate Accounts': 'የድርጅት መለያዎች',
  'Invoices & Aging': 'ደረሰኞች እና እድሜ',
  'Agency Commissions': 'የወኪል ኮሚሽኖች',
  'Night Audit & End-of-Day Closing': 'የምሽት ኦዲት እና የቀን መዝጊያ',
  'Run Night Audit': 'የምሽት ኦዲት አስኪድ',
  'Roll Business Date': 'የሥራ ቀን አሸጋግር',
  'Cashier Drops': 'የገንዘብ ተቀባይ ማስረከቢያዎች',
  'High-Balance Alerts': 'ከፍተኛ ቀሪ ማንቂያዎች',
  'Channel Manager, CRS & Yield Rules': 'የቻናል አስተዳዳሪ፣ CRS እና የዋጋ ሕጎች',
  'Direct Web Bookings': 'ቀጥታ የድረ-ገጽ ቦታ ማስያዣዎች',
  'Rate Parity': 'የዋጋ እኩልነት',
  'Dynamic Yield Rules': 'ተለዋዋጭ የዋጋ ሕጎች',
  'Executive Business Intelligence & Export Vault': 'አስፈጻሚ ቢዝነስ ኢንተለጀንስ እና መላኪያ ማህደር',
  'KPI Targets': 'የKPI ግቦች',
  'Scheduled Exports': 'የታቀዱ መላኪያዎች',

  // Guest CRM, Concierge, In-Room, Reputation, Events
  'Guest Directory': 'የእንግዳ ማውጫ',
  'Spa Appointments': 'የስፓ ቀጠሮዎች',
  'Loyalty Rewards': 'የታማኝነት ሽልማቶች',
  'General Property Identity': 'አጠቃላይ የሆቴል ማንነት',
  'Location & Contact Directory': 'አድራሻ እና የመገኛ መረጃ',
  'Financial Calibration, Rooms & Tax Rates': 'የፋይናንስ ቅንብር፣ ክፍሎች እና የግብር ተመኖች',
  'Save Profile Configuration': 'የመገለጫ ቅንብር አስቀምጥ',
  'Submit Renewal Slip': 'የእድሳት ደረሰኝ አስገባ',
  'Organization profile updated': 'የድርጅት መገለጫ ተዘምኗል',
  'Ethiopian Birr (ETB - Br)': 'የኢትዮጵያ ብር (ETB - Br)',
  'US Dollar (USD - $)': 'የአሜሪካ ዶላር (USD - $)',
  'Euro (EUR - €)': 'ዩሮ (EUR - €)',
  'Kenyan Shilling (KES)': 'የኬንያ ሽልንግ (KES)',
  'British Pound (GBP - £)': 'የብሪታንያ ፓውንድ (GBP - £)',
  'January (Gregorian Standard)': 'ጥር / ጃንዋሪ (መደበኛ)',
  'July (Ethiopian Hamle / Fiscal)': 'ሐምሌ / ጁላይ (የኢትዮጵያ በጀት ዓመት)',
  'Concierge, Fleet & Safari Dispatch': 'ኮንሲየርጅ፣ ተሽከርካሪ እና የጉዞ ስርጭት',
  'Airport Transfers': 'የአየር ማረፊያ ትራንስፈር',
  'Safari & Excursions': 'ሳፋሪ እና ጉብኝቶች',
  'Fleet Vehicles': 'የሆቴል ተሽከርካሪዎች',
  'Digital In-Room Guest Hub': 'የክፍል ውስጥ ዲጂታል የእንግዳ ማዕከል',
  'Room Service Orders': 'የክፍል አገልግሎት ትዕዛዞች',
  'Guest Requests': 'የእንግዳ ጥያቄዎች',
  'Express Checkout': 'ፈጣን መውጫ',
  'Online Reputation & Guest Satisfaction': 'የመስመር ላይ ስም እና የእንግዳ እርካታ',
  'Guest Reviews': 'የእንግዳ ግምገማዎች',
  'Survey Campaigns': 'የዳሰሳ ዘመቻዎች',
  'Conferences, Banquets & Events': 'ስብሰባዎች፣ ግብዣዎች እና ዝግጅቶች',
  'Event Spaces': 'የዝግጅት አዳራሾች',
  'Event Bookings': 'የዝግጅት ቦታ ማስያዣዎች',

  // Inventory, Procurement, Kitchen, Laundry
  'Stores & Stock Inventory Control': 'ዕቃ ግምጃ ቤት እና ክምችት ቁጥጥር',
  'Stock Items': 'የክምችት ዕቃዎች',
  'Goods Received (GRV)': 'የገቡ ዕቃዎች (GRV)',
  'Store Issues (SIV)': 'የወጡ ዕቃዎች (SIV)',
  'Stock Adjustments': 'የክምችት ማስተካከያዎች',
  'Supply Chain & Purchase Orders': 'አቅርቦት ሰንሰለት እና የግዥ ትዕዛዞች',
  'Vendor Registry': 'የአቅራቢዎች መዝገብ',
  'Purchase Orders': 'የግዥ ትዕዛዞች',
  'Three-Way Matching': 'ባለ 3-መንገድ ማዛመጃ',
  'Kitchen Recipe Costing & Menu Matrix': 'የወጥ ቤት አዘገጃጀት ወጪ እና ሜኑ ማትሪክስ',
  'Master Recipe Cards': 'ዋና የምግብ አዘገጃጀት ካርዶች',
  'Menu Engineering Matrix': 'የሜኑ ምህንድስና ማትሪክስ',
  'Food Cost Variance': 'የምግብ ወጪ ልዩነት',
  'Commercial Laundry & Linen Control': 'ንግድ ልብስ ማጠቢያ እና ሊነን ቁጥጥር',
  'Linen Par Levels': 'የሊነን መጠን ደረጃዎች',
  'Wash Loads': 'የማጠቢያ ዙሮች',
  'Guest Valet Laundry': 'የእንግዳ ልብስ ማጠቢያ',

  // Maintenance, EMS, Sustainability, HACCP, Valet, HR, Dispatch, Security
  'Engineering, Maintenance & Asset Control': 'ኢንጂነሪንግ፣ ጥገና እና ንብረት ቁጥጥር',
  'Work Orders': 'የሥራ ትዕዛዞች',
  'Asset Registry': 'የንብረት መዝገብ',
  'Preventive Maintenance': 'መከላከያ ጥገና',
  'Energy Management & Room IoT': 'የኢነርጂ አስተዳደር እና ዘመናዊ ክፍል IoT',
  'Smart Room Devices': 'ዘመናዊ የክፍል መሣሪያዎች',
  'Energy Submeters': 'የኢነርጂ ቆጣሪዎች',
  'Green Hospitality & Utilities': 'አረንጓዴ መስተንግዶ እና መገልገያዎች',
  'Utilities & Energy': 'ኤሌክትሪክ፣ ውሃ እና ኢነርጂ',
  'Food Waste Tracker': 'የምግብ ብክነት መከታተያ',
  'Green Stay Roster': 'አረንጓዴ ቆይታ ዝርዝር',
  'Eco-Compliance Audits': 'የአካባቢ ተገዢነት ኦዲቶች',
  'Food Safety & Pool Water Quality': 'የምግብ ደህንነት እና የመዋኛ ውሃ ጥራት',
  'CCP Temperature Logs': 'የCCP ሙቀት መዝገቦች',
  'Pool & Spa Water': 'የመዋኛ እና ስፓ ውሃ',
  'Hygiene Audits': 'የንጽህና ኦዲቶች',
  'Valet Parking & EV Charging Hub': 'ቫሌት ማቆሚያ እና የኤሌክትሪክ መኪና ቻርጅ',
  'Parking Bays': 'የማቆሚያ ቦታዎች',
  'Valet Tickets': 'የቫሌት ቲኬቶች',
  'EV Charging Stations': 'የEV ቻርጅ ጣቢያዎች',
  'Human Resources, Rosters & Payroll': 'የሰው ኃይል፣ ፈረቃ እና ደመወዝ',
  'Shift Roster': 'የፈረቃ ሰንጠረዥ',
  'Time & Attendance': 'ሰዓት እና መገኘት',
  'Leave Approvals': 'የፈቃድ ማጽደቂያዎች',
  'Hospitality Payroll': 'የመስተንግዶ ደመወዝ ክፍያ',
  'Staff Handover, Tasks & Broadcasts': 'የሰራተኞች ርክክብ፣ ተግባራት እና መልእክቶች',
  'Rapid Task Dispatch': 'ፈጣን የተግባር ስርጭት',
  'MOD Shift Handover': 'የተረኛ ሥራ አስኪያጅ ርክክብ',
  'Staff Broadcasts': 'የሰራተኞች ማስታወቂያ',
  'Security, Gate Access & Service Recovery': 'ደህንነት፣ የበር ቁጥጥር እና የአገልግሎት ማገገሚያ',
  'Security Occurrence Log': 'የደህንነት ክስተቶች መዝገብ',
  'Visitor & Vehicle Gate Passes': 'የጎብኚ እና ተሽከርካሪ የበር ፈቃዶች',
  'Lost & Found Vault': 'የጠፉ እና የተገኙ ዕቃዎች ማከማቻ',
  'Guest Complaints & SLA': 'የእንግዳ ቅሬታዎች እና SLA',
  'Active Incidents': 'ንቁ ክስተቶች',
  'Vehicles & Visitors Inside': 'በግቢ ውስጥ ያሉ ተሽከርካሪዎች እና ጎብኚዎች',
  'Vault Safekeeping': 'በማከማቻ ውስጥ ያሉ ዕቃዎች',
  'Service Recovery SLA': 'የአገልግሎት ማገገሚያ SLA',
  'Log Incident': 'ክስተት መዝግብ',
  'Issue Gate Pass': 'የበር ፈቃድ ስጥ',
  'Register Lost Item': 'የጠፋ ዕቃ መዝግብ',
  'Log Complaint Ticket': 'የቅሬታ ቲኬት መዝግብ',
  'Check-out Exit': 'መውጫ አረጋግጥ',
  'Verify & Process Claim': 'አረጋግጥ እና አስረክብ',
  'Resolve & Compensate': 'ፍታ እና ካሳ ስጥ',

  // Common Status & Priority Labels
  'Open': 'ክፍት',
  'Closed': 'ዝግ',
  'Under Investigation': 'በምርመራ ላይ',
  'Resolved': 'ተፈቷል',
  'Escalated': 'ወደ ላይ ተመርቷል',
  'In Progress': 'በሂደት ላይ',
  'Completed': 'ተጠናቋል',
  'Pending': 'በመጠባበቅ ላይ',
  'Approved': 'ጸድቋል',
  'Draft': 'ረቂቅ',
  'Active Inside': 'በውስጥ ንቁ',
  'Cleared / Exited': 'ወጥቷል',
  'In Safekeeping': 'በጥበቃ ላይ',
  'Claimed': 'ተወስዷል',
  'Disposed': 'ተወግዷል',
  'SLA Satisfied': 'SLA ተሟልቷል',
  'SLA Breached': 'SLA ተጥሷል',
  'Guest Satisfied': 'እንግዳው ረክቷል',
  'Neutral / Unconfirmed': 'ገለልተኛ / ያልተረጋገጠ',
  'Low Severity': 'ዝቅተኛ ክብደት',
  'Medium Severity': 'መካከለኛ ክብደት',
  'High Severity': 'ከፍተኛ ክብደት',
  'Critical Severity': 'አስቸኳይ ክብደት',
  'Critical': 'አስቸኳይ',
  'High': 'ከፍተኛ',
  'Medium': 'መካከለኛ',
  'Low': 'ዝቅተኛ',
  'Urgent': 'አስቸኳይ',
  'All Clear': 'ሁሉም ሰላም',
  'On-Premises': 'በግቢ ውስጥ',
  'On Target': 'በግብ ላይ',
  'Items Held': 'የተያዙ ዕቃዎች',
  'All Categories': 'ሁሉም ምድቦች',
  'All Statuses': 'ሁሉም ሁኔታዎች',
  'All Gate Passes': 'ሁሉም የበር ፈቃዶች',
  'Active On-Premises': 'በግቢ ውስጥ ንቁ',
  'All Custody Statuses': 'ሁሉም የጥበቃ ሁኔታዎች',
  'In Safekeeping Vault': 'በጥበቃ ማከማቻ ውስጥ',
  'Claimed by Guest': 'በእንግዳ የተወሰደ',
  'Disposed / Donated': 'የተወገደ / የተለገሰ',
  'All Service Recovery Tickets': 'ሁሉም የአገልግሎት ማገገሚያ ቲኬቶች',
  'Open (Immediate Attention)': 'ክፍት (አስቸኳይ ትኩረት)',
  'Resolved & Compensated': 'የተፈታ እና ካሳ የተሰጠው',

  // Amenities, Payment Methods, Expense Categories
  'High-speed Wi-Fi': 'ፈጣን ዋይፋይ (Wi-Fi)',
  'Private Balcony': 'የግል በረንዳ',
  'Smart Flat TV': 'ስማርት ቴሌቪዥን',
  'Air Conditioning': 'አየር ማቀዝቀዣ (AC)',
  'In-room Safe': 'የክፍል ውስጥ ካዝና',
  'Minibar & Refrigerator': 'ሚኒባር እና ማቀዝቀዣ',
  'Tea & Coffee Maker': 'የሻይ እና ቡና ማፍያ',
  'Lake / Mountain View': 'የሐይቅ / የተራራ እይታ',
  'Hair Dryer & Bathrobe': 'የፀጉር ማድረቂያ እና የመታጠቢያ ካባ',
  'Work Desk & Chair': 'የሥራ ጠረጴዛ እና ወንበር',
  'En-suite Jacuzzi': 'የግል ጃኩዚ',
  'Daily Mineral Water': 'ዕለታዊ የማዕድን ውሃ',
  'Cash (ETB)': 'ጥሬ ገንዘብ (ብር)',
  'Commercial Bank of Ethiopia (CBE)': 'የኢትዮጵያ ንግድ ባንክ (CBE)',
  'Telebirr QR & Mobile Pay': 'ቴሌብር QR እና ሞባይል ክፍያ',
  'Awash Bank Transfer': 'አዋሽ ባንክ ዝውውር',
  'Visa & Mastercard Credit Card': 'ቪዛ እና ማስተርካርድ ካርድ',
  'US Dollar Cash (USD)': 'የአሜሪካ ዶላር ጥሬ ገንዘብ (USD)',
  'Direct Company Invoice / Credit': 'ቀጥታ የድርጅት ደረሰኝ / ብድር',
  'Food & Grocery Purchases': 'የምግብ እና ግሮሰሪ ግዥዎች',
  'Beverage Purchases': 'የመጠጥ ግዥዎች',
  'Staff Payroll & Allowances': 'የሰራተኞች ደመወዝ እና አበል',
  'Electricity & Utilities': 'ኤሌክትሪክ እና መገልገያዎች',
  'Water Supply': 'የውሃ አቅርቦት',
  'Fuel & Generator Operating': 'ነዳጅ እና የጄነሬተር ሥራ',
  'Linen & Housekeeping Supplies': 'ሊነን እና የቤት አያያዝ ዕቃዎች',
  'Maintenance & Spare Parts': 'ጥገና እና መለዋወጫዎች',
  'Software & Telecom Subscription': 'ሶፍትዌር እና ቴሌኮም ክፍያ',
  'Marketing & Advertising': 'ማርኬቲንግ እና ማስታወቂያ',
  'Government Taxes & Licensing': 'የመንግሥት ግብር እና ፈቃድ',
  'Administrative & Office Supplies': 'አስተዳደር እና የቢሮ ዕቃዎች',

  // Common Form & Action Labels
  'Name': 'ስም',
  'Email': 'ኢሜይል',
  'Phone': 'ስልክ',
  'Role': 'ሚና',
  'Title': 'ርዕስ',
  'Type': 'ዓይነት',
  'Room': 'ክፍል',
  'Guest': 'እንግዳ',
  'Guest Name': 'የእንግዳ ስም',
  'Staff': 'ሰራተኛ',
  'Created': 'የተፈጠረበት',
  'Updated': 'የተዘመነበት',
  'Time': 'ሰዓት',
  'Today': 'ዛሬ',
  'This Week': 'በዚህ ሳምንት',
  'This Month': 'በዚህ ወር',
  'Yes': 'አዎ',
  'No': 'አይ',
  'Enabled': 'ነቅቷል',
  'Disabled': 'ተሰናክሏል',
  'Success': 'ተሳክቷል',
  'Warning': 'ማስጠንቀቂያ',
  'Error': 'ስህተት',
  'Details': 'ዝርዝሮች',
  'Summary': 'ማጠቃለያ',
  'Settings': 'ቅንብሮች',
  'Configuration': 'ማዋቀሪያ',
  'Operations': 'ሥራዎች',
  'Finance': 'ፋይናንስ',
  'Inventory': 'ክምችት',
  'Security': 'ደህንነት',
  'Previous page': 'ቀዳሚ ገጽ',
  'Next page': 'ቀጣይ ገጽ',
  'Close modal': 'መስኮት ዝጋ',
  'Dismiss notification': 'ማሳወቂያ አጥፋ',

  // Auth & Access Control UI
  'Users & Access Control': 'የተጠቃሚዎች እና ፈቃድ ቁጥጥር',
  'Privilege Super Admin': 'ዋና አስተዳዳሪ ፍቀድ',
  'Privilege Property Account': 'የሆቴል መለያ ፍቀድ',
  'Privilege Account': 'መለያ ፍቀድ',
  'Privilege Staff Account': 'የሰራተኛ መለያ ፍቀድ',
  'Privilege Hotel Staff Member': 'የሆቴል ሰራተኛ መለያ ፍቀድ',
  'Platform Super Admins': 'የመድረክ ዋና አስተዳዳሪዎች',
  'Total Privileged Accounts': 'ጠቅላላ ፈቃድ የተሰጣቸው መለያዎች',
  'Active Super Admins': 'ንቁ ዋና አስተዳዳሪዎች',
  'Property Admins & GMs': 'የሆቴል አስተዳዳሪዎች እና GM',
  'Suspended / Revoked': 'የታገዱ / የተሰረዙ',
  'Set Password': 'የይለፍ ቃል አዘጋጅ',
  'Set Account Password': 'የመለያ የይለፍ ቃል አዘጋጅ',
  'Set Staff Password': 'የሰራተኛ የይለፍ ቃል አዘጋጅ',
  'Save Password': 'የይለፍ ቃል አስቀምጥ',
  'New Password *': 'አዲስ የይለፍ ቃል *',
  'Revoke Access': 'ፈቃድ ሰርዝ',
  'Reset password': 'የይለፍ ቃል ዳግም አስጀምር',
  'Sign In to Workspace': 'ወደ ሥራ ቦታ ይግቡ',
  'Re-verify with Google': 'በGoogle እንደገና ያረጋግጡ',
  'Restricted Access': 'የተገደበ መዳረሻ',
  'Only accounts explicitly privileged by a Super Admin or Property Admin can access SEAM.': 'በዋና አስተዳዳሪ ወይም በሆቴል አስተዳዳሪ ፈቃድ የተሰጣቸው መለያዎች ብቻ ወደ SEAM መግባት ይችላሉ።',
};

// Lowercase normalized map for fast case-insensitive exact lookup
const LOWERCASE_MAP: Record<string, string> = Object.entries(EXACT_AMHARIC_MAP).reduce(
  (acc, [k, v]) => {
    acc[k.trim().toLowerCase()] = v;
    return acc;
  },
  {} as Record<string, string>
);

// Token-level replacements for structured phrases & seed content
const WORD_PHRASE_PAIRS: Array<[RegExp, string]> = [
  [/\bProperty Configuration\b/gi, 'የሆቴል ማዋቀሪያ'],
  [/\bDaily Operations\b/gi, 'የዕለት ተዕለት ሥራዎች'],
  [/\bFront Office\b/gi, 'የፊት ቢሮ'],
  [/\bHousekeeping\b/gi, 'የቤት አያያዝ'],
  [/\bFood & Beverage\b/gi, 'ምግብና መጠጥ'],
  [/\bHuman Resources\b/gi, 'የሰው ኃይል'],
  [/\bPurchasing\b/gi, 'ግዥ'],
  [/\bEngineering & Maintenance\b/gi, 'ኢንጂነሪንግ እና ጥገና'],
  [/\bFinance & Accounts\b/gi, 'ፋይናንስ እና ሂሳብ'],
  [/\bStores & Inventory\b/gi, 'ዕቃ ግምጃ ቤት እና ክምችት'],
  [/\bConference & Events\b/gi, 'ስብሰባ እና ዝግጅቶች'],
  [/\bSpa & Wellness\b/gi, 'ስፓ እና ደህንነት'],
  [/\bGuest Relations\b/gi, 'የእንግዳ ግንኙነት'],
  [/\bSales & Marketing\b/gi, 'ሽያጭ እና ማርኬቲንግ'],
  [/\bBusiness Date:\s*/gi, 'የሥራ ቀን: '],
  [/\bProperty:\s*/gi, 'ሆቴል: '],
  [/\bActive Property\b/gi, 'ንቁ ሆቴል'],
  [/\bSample Property A\b/gi, 'ናሙና ሆቴል ሀ'],
  [/\bSample Property B\b/gi, 'ናሙና ሆቴል ለ'],
  [/\bSample Property C\b/gi, 'ናሙና ሆቴል ሐ'],
  [/\bSample Property D\b/gi, 'ናሙና ሆቴል መ'],
  [/\bExport Log CSV\b/gi, 'የክስተት መዝገብ CSV አውርድ'],
  [/\bExport Gate Log CSV\b/gi, 'የበር መዝገብ CSV አውርድ'],
  [/\bExport Vault CSV\b/gi, 'የማከማቻ CSV አውርድ'],
  [/\bExport SLA CSV\b/gi, 'የSLA CSV አውርድ'],
  [/\bPedestrian Entry\b/gi, 'በእግር የገባ'],
  [/\bPublic Area Guest\b/gi, 'የጋራ አካባቢ እንግዳ'],
  [/\bNo voucher issued\b/gi, 'ምንም ቫውቸር አልተሰጠም'],
  [/\bCCTV Reviewed\b/gi, 'CCTV ተመርምሯል'],
  [/\bNo CCTV Log\b/gi, 'የCCTV መዝገብ የለም'],
  [/\bPolice Notified\b/gi, 'ፖሊስ ተነግሯል'],
  [/\bOn Premises\b/gi, 'በግቢ ውስጥ'],
  [/\bTarget (\d+)m\b/gi, 'ግብ $1 ደቂቃ'],
  [/\bRoom (\d+[A-Z]?)\b/gi, 'ክፍል $1'],
  [/\bFloor (\d+)\b/gi, 'ፎቅ $1'],
  [/\bInspect:\s*/gi, 'መርምር: '],
  [/\bJust now\b/gi, 'አሁን'],
  [/\bLoading\.\.\.\b/gi, 'በመጫን ላይ...'],
];

/**
 * Translates UI strings, dynamic parameterized notifications, and hospitality domain content to Amharic.
 * Returns input untouched if already containing Ethiopic script or if it is a pure identifier/number/email.
 */
export function translateToAmharic(input: string): string {
  if (!input) return input;

  // Skip if already Ethiopic script
  if (/[\u1200-\u137F]/.test(input)) return input;

  const match = input.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return input;
  const [, leading, core, trailing] = match;
  if (!core) return input;

  // Skip pure numbers, currencies, emails, URLs, ISO dates, or short technical codes
  if (
    /^[\d\s.,:%+\-/$€£Br]+$/.test(core) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(core) ||
    /^https?:\/\//i.test(core) ||
    /^\d{4}-\d{2}-\d{2}/.test(core) ||
    /^[A-Z0-9_-]{2,18}$/.test(core)
  ) {
    return input;
  }

  // 1. Exact lookup (preserve case-insensitive fallback)
  const exact = EXACT_AMHARIC_MAP[core] ?? LOWERCASE_MAP[core.toLowerCase()];
  if (exact) {
    return `${leading}${exact}${trailing}`;
  }

  // 2. Dynamic pattern translations (counts, pagination, alerts)
  const showingMatch = core.match(/^Showing\s+(\d+)[–-](\d+)\s+of\s+(\d+)$/i);
  if (showingMatch) {
    return `${leading}ከ ${showingMatch[3]} ውስጥ ${showingMatch[1]}–${showingMatch[2]} በመታየት ላይ${trailing}`;
  }

  const showingItemsMatch = core.match(/^Showing\s+(\d+)\s+of\s+(\d+)\s+(.+)$/i);
  if (showingItemsMatch) {
    return `${leading}ከ ${showingItemsMatch[2]} ውስጥ ${showingItemsMatch[1]} ${translateToAmharic(showingItemsMatch[3])}${trailing}`;
  }

  const countSuffixMatch = core.match(/^(.+?)\s*\((\d+)\)$/);
  if (countSuffixMatch) {
    const baseTranslated = translateToAmharic(countSuffixMatch[1]);
    if (baseTranslated !== countSuffixMatch[1]) {
      return `${leading}${baseTranslated} (${countSuffixMatch[2]})${trailing}`;
    }
  }

  const paymentAlertMatch = core.match(/^(\d+)\s+payment receipt\(s\) awaiting verification$/i);
  if (paymentAlertMatch) {
    return `${leading}${paymentAlertMatch[1]} የክፍያ ደረሰኝ(ዎች) ማረጋገጫ በመጠባበቅ ላይ${trailing}`;
  }

  const graceAlertMatch = core.match(/^(\d+)\s+hotel tenant\(s\) in grace period$/i);
  if (graceAlertMatch) {
    return `${leading}${graceAlertMatch[1]} ሆቴል(ሎች) በችሮታ ጊዜ ውስጥ ናቸው${trailing}`;
  }

  const suspAlertMatch = core.match(/^(\d+)\s+suspended property account\(s\)$/i);
  if (suspAlertMatch) {
    return `${leading}${suspAlertMatch[1]} የታገዱ የሆቴል መለያ(ዎች)${trailing}`;
  }

  const reqAlertMatch = core.match(/^(\d+)\s+purchase requisition\(s\) awaiting approval$/i);
  if (reqAlertMatch) {
    return `${leading}${reqAlertMatch[1]} የግዥ ጥያቄ(ዎች) ፍቃድ በመጠባበቅ ላይ${trailing}`;
  }

  const highBalMatch = core.match(/^(\d+)\s+high-balance guest folio alert\(s\)$/i);
  if (highBalMatch) {
    return `${leading}${highBalMatch[1]} ከፍተኛ ቀሪ የእንግዳ ሂሳብ ማንቂያ(ዎች)${trailing}`;
  }

  const stockAlertMatch = core.match(/^(\d+)\s+store item\(s\) below reorder threshold$/i);
  if (stockAlertMatch) {
    return `${leading}${stockAlertMatch[1]} የግምጃ ቤት ዕቃ(ዎች) ከዝቅተኛ መጠን በታች ናቸው${trailing}`;
  }

  const noMatchQuery = core.match(/^No modules matching [“"]?(.*?)[”"]?$/i);
  if (noMatchQuery) {
    return `${leading}ከ "${noMatchQuery[1]}" ጋር የሚዛመድ ሞጁል አልተገኘም${trailing}`;
  }

  // 3. Split composite labels joined by ' · ' or ' — ' or ' / '
  if (core.includes(' · ')) {
    const parts = core.split(' · ').map((p) => translateToAmharic(p));
    return `${leading}${parts.join(' · ')}${trailing}`;
  }

  // 4. Phrase substitutions
  let result = core;
  for (const [pattern, replacement] of WORD_PHRASE_PAIRS) {
    result = result.replace(pattern, replacement);
  }

  return `${leading}${result}${trailing}`;
}
