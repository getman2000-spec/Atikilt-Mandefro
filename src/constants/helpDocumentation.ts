/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contextual Help Documentation, Step-by-Step Guides, and FAQs
 * Mapped 1:1 to every Super Admin view and all 27 Hotel Operational Modules.
 */

export interface HelpStep {
  title: string;
  titleAm: string;
  detail: string;
  detailAm: string;
}

export interface HelpFaq {
  question: string;
  questionAm: string;
  answer: string;
  answerAm: string;
}

export interface ModuleHelpDoc {
  tabId: string;
  scope: 'super_admin' | 'hotel';
  title: string;
  titleAm: string;
  category: string;
  categoryAm: string;
  summary: string;
  summaryAm: string;
  steps: HelpStep[];
  faqs: HelpFaq[];
  relatedTabs?: string[];
}

export const HELP_DOCUMENTATION: Record<string, ModuleHelpDoc> = {
  // ==========================================
  // SUPER ADMIN PORTAL GUIDES
  // ==========================================
  saas_overview: {
    tabId: 'saas_overview',
    scope: 'super_admin',
    title: 'Executive Overview',
    titleAm: 'አስፈጻሚ አጠቃላይ እይታ',
    category: 'Platform Overview',
    categoryAm: 'የመድረክ አጠቃላይ እይታ',
    summary:
      'Monitor active hotel tenants, monthly recurring revenue (MRR), pending payment verifications, and tenant subscription health across the SEAM platform.',
    summaryAm:
      'ንቁ የሆቴል ደንበኞችን፣ ወርሃዊ ተደጋጋሚ ገቢን (MRR)፣ የክፍያ ማረጋገጫዎችን እና የምዝገባ ሁኔታን በአንድ ቦታ ይከታተሉ።',
    steps: [
      {
        title: 'Review portfolio KPIs',
        titleAm: 'የፖርትፎሊዮ KPIዎችን ይገምግሙ',
        detail: 'Check active properties, rooms under management, MRR in ETB, and tenants currently in a grace period.',
        detailAm: 'ንቁ ሆቴሎችን፣ ጠቅላላ ክፍሎችን፣ በብር የሚታየውን ወርሃዊ ገቢ እና በችሮታ ጊዜ ውስጥ ያሉ ደንበኞችን ይመልከቱ።',
      },
      {
        title: 'Resolve action alerts',
        titleAm: 'አስቸኳይ ማንቂያዎችን ይፍቱ',
        detail: 'Follow pending verification or grace-period banners directly into Payment Verification or Subscriptions.',
        detailAm: 'በመጠባበቅ ላይ ያሉ የክፍያ ደረሰኞችን ወይም የችሮታ ጊዜ ማንቂያዎችን በመጫን ወደ ተገቢው ክፍል ይሂዱ።',
      },
      {
        title: 'Launch a property workspace',
        titleAm: 'የሆቴል ሥራ ቦታን ይክፈቱ',
        detail: 'Use "Inspect" on any hotel row or the top-bar selector to switch into that hotel’s scoped ERP workspace.',
        detailAm: 'የአንድን ሆቴል የውስጥ ሥራ ለመመርመር "Inspect" ወይም የላይኛውን የሆቴል መምረጫ ይጠቀሙ።',
      },
    ],
    faqs: [
      {
        question: 'Does switching to a hotel workspace expose my Super Admin account?',
        questionAm: 'ወደ ሆቴል ሥራ ቦታ መቀየር የዋና አስተዳዳሪ ፈቃዴን ያጠፋል?',
        answer:
          'No. Verified Super Admins retain platform governance privileges and can return to the SaaS portal at any time from the top persona bar.',
        answerAm:
          'አይደለም። የተረጋገጡ ዋና አስተዳዳሪዎች የመድረክ መብታቸውን ይዘው በማንኛውም ጊዜ ከላይኛው አሞሌ መመለስ ይችላሉ።',
      },
      {
        question: 'How are platform MRR totals calculated?',
        questionAm: 'የመድረክ MRR ድምር እንዴት ይሰላል?',
        answer:
          'Totals aggregate active and grace-period hotel subscription contracts stored in the platform directory.',
        answerAm:
          'ድምሩ በመድረክ ማውጫ ውስጥ የተመዘገቡ ንቁ እና በችሮታ ጊዜ ያሉ የሆቴል ምዝገባ ውሎችን መሰረት ያደርጋል።',
      },
    ],
    relatedTabs: ['hotels', 'payments', 'platform_access'],
  },

  hotels: {
    tabId: 'hotels',
    scope: 'super_admin',
    title: 'Hotel Tenants',
    titleAm: 'የሆቴል ደንበኞች',
    category: 'Platform Overview',
    categoryAm: 'የመድረክ አጠቃላይ እይታ',
    summary:
      'Onboard new hotel properties with a 3-step registration wizard, inspect tenant limits, or suspend and reactivate hotel access with audit logging.',
    summaryAm:
      'አዲስ ሆቴሎችን በ3-ደረጃ ይመዝግቡ፣ የአቅም ገደቦችን ይመርምሩ እና የመዳረሻ ሁኔታን በኦዲት መዝገብ ያስተዳድሩ።',
    steps: [
      {
        title: 'Start property onboarding',
        titleAm: 'የሆቴል ምዝገባ ይጀምሩ',
        detail: 'Click Onboard Hotel and enter legal name, unique property code, currency (ETB), timezone, and room capacity.',
        detailAm: 'አዲስ ሆቴል መዝግብ የሚለውን በመጫን ሕጋዊ ስም፣ ልዩ ኮድ፣ ገንዘብ (ብር)፣ የሰዓት ሰቅ እና የክፍል ብዛት ያስገቡ።',
      },
      {
        title: 'Assign plan & modules',
        titleAm: 'ዕቅድ እና ሞጁሎችን ይመድቡ',
        detail: 'Choose Basic, Standard, or Premium tier and customize enabled modules before provisioning.',
        detailAm: 'Basic፣ Standard ወይም Premium ዕቅድን ይምረጡ እና የሚፈቀዱ ሞጁሎችን ያስተካክሉ።',
      },
      {
        title: 'Provision initial Property Admin',
        titleAm: 'የመጀመሪያውን የሆቴል አስተዳዳሪ ይፍጠሩ',
        detail: 'Enter the Property Admin’s name, email, and initial password; this automatically creates both local credentials and a cloud access grant.',
        detailAm: 'የሆቴል አስተዳዳሪውን ስም፣ ኢሜይል እና የመጀመሪያ የይለፍ ቃል ያስገቡ፤ ይህ ለGoogle እና ለይለፍ ቃል መግቢያ ፈቃድ ይፈጥራል።',
      },
    ],
    faqs: [
      {
        question: 'What happens to data when a hotel is suspended?',
        questionAm: 'አንድ ሆቴል ሲታገድ መረጃው ምን ይሆናል?',
        answer:
          'All hotel records remain intact and preserved. Staff and hotel admins see the suspension notice until a Super Admin reactivates the contract.',
        answerAm:
          'ሁሉም የሆቴል መረጃዎች ሳይጠፉ ይቀመጣሉ። ዋና አስተዳዳሪ እስኪያነቃው ድረስ የሆቴሉ ተጠቃሚዎች የእገዳ ማሳወቂያ ይመለከታሉ።',
      },
      {
        question: 'Can a newly created Property Admin sign in with Google immediately?',
        questionAm: 'አዲስ የተፈጠረ የሆቴል አስተዳዳሪ ወዲያውኑ በGoogle መግባት ይችላል?',
        answer:
          'Yes, provided the Super Admin creating the property is signed into Firebase with Google so the cloud access grant is written to Firestore.',
        answerAm:
          'አዎን፣ ሆቴሉን የፈጠረው ዋና አስተዳዳሪ በGoogle ገብቶ ከሆነ የክላውድ የመግቢያ ፈቃዱ ወዲያውኑ ወደ Firestore ይጻፋል።',
      },
    ],
    relatedTabs: ['subscriptions', 'platform_access', 'modules'],
  },

  subscriptions: {
    tabId: 'subscriptions',
    scope: 'super_admin',
    title: 'Subscriptions & Plans',
    titleAm: 'የደንበኝነት ምዝገባ እና ዕቅዶች',
    category: 'Platform Overview',
    categoryAm: 'የመድረክ አጠቃላይ እይታ',
    summary:
      'Manage hotel billing cycles, expiration dates, 7-day grace periods, manual extensions, and contract suspension history.',
    summaryAm:
      'የሆቴል የክፍያ ዑደቶችን፣ የማብቂያ ቀናትን፣ የ7-ቀን የችሮታ ጊዜያትን እና የውል ታሪክን ያስተዳድሩ።',
    steps: [
      {
        title: 'Filter contracts by lifecycle state',
        titleAm: 'ውሎችን በሁኔታ ይለዩ',
        detail: 'Check active, grace period, expired, or suspended contracts to identify upcoming renewals.',
        detailAm: 'የሚታደሱ ውሎችን ለመለየት ንቁ፣ በችሮታ ጊዜ፣ ጊዜው ያለፈበት ወይም የታገዱ ውሎችን ይመልከቱ።',
      },
      {
        title: 'Extend contract duration',
        titleAm: 'የውል ጊዜ ያራዝሙ',
        detail: 'Use Extend Subscription to add 30, 90, or 365 days and automatically restore active tenant access.',
        detailAm: 'የውል ጊዜ አራዝም የሚለውን በመጠቀም 30፣ 90 ወይም 365 ቀናት ይጨምሩ እና ንቁ መዳረሻን ይመልሱ።',
      },
    ],
    faqs: [
      {
        question: 'How long is the default grace period?',
        questionAm: 'መደበኛው የችሮታ ጊዜ ስንት ቀን ነው?',
        answer:
          'SEAM provisions a 7-day grace period past expiry where staff see a non-blocking renewal banner before suspension.',
        answerAm:
          'SEAM ከማብቂያ ቀን በኋላ ለ7 ቀናት የሚቆይ የችሮታ ጊዜ ይሰጣል፤ በዚህ ጊዜ ሰራተኞች ማስጠንቀቂያ ይመለከታሉ።',
      },
    ],
    relatedTabs: ['payments', 'hotels'],
  },

  payments: {
    tabId: 'payments',
    scope: 'super_admin',
    title: 'Payment Verification',
    titleAm: 'የክፍያ ማረጋገጫ',
    category: 'Platform Overview',
    categoryAm: 'የመድረክ አጠቃላይ እይታ',
    summary:
      'Verify submitted CBE, Telebirr, or bank transfer payment slips from hotel tenants and apply verified renewal days.',
    summaryAm:
      'ከሆቴሎች የተላኩ የCBE፣ የቴሌብር ወይም የባንክ ዝውውር ደረሰኞችን አረጋግጠው የምዝገባ ጊዜን ያድሱ።',
    steps: [
      {
        title: 'Inspect payment reference',
        titleAm: 'የክፍያ ማጣቀሻውን ይመርምሩ',
        detail: 'Compare the bank slip reference number, payment method, and ETB amount against bank statements.',
        detailAm: 'የባንክ ደረሰኝ ቁጥርን፣ የክፍያ ዘዴን እና የብር መጠንን ከባንክ መግለጫ ጋር ያመሳክሩ።',
      },
      {
        title: 'Approve and extend',
        titleAm: 'ያጽድቁ እና ያራዝሙ',
        detail: 'Confirm verification and choose the extension days (30, 90, or 365) to update the hotel’s subscription immediately.',
        detailAm: 'ማረጋገጫውን ሲያጸድቁ የሆቴሉን የምዝገባ ጊዜ በቀጥታ ለ30፣ 90 ወይም 365 ቀናት ያራዝማል።',
      },
    ],
    faqs: [
      {
        question: 'Does verifying a payment also reactivate a suspended hotel?',
        questionAm: 'ክፍያ ማረጋገጥ የታገደ ሆቴልን መልሶ ያነቃዋል?',
        answer:
          'Yes. Verifying a receipt automatically sets both the subscription and hotel tenant status back to active.',
        answerAm:
          'አዎን። ደረሰኝ ሲረጋገጥ የምዝገባውንም ሆነ የሆቴሉን ሁኔታ ወደ ንቁ ይመልሳል።',
      },
    ],
    relatedTabs: ['subscriptions', 'audit_logs'],
  },

  platform_access: {
    tabId: 'platform_access',
    scope: 'super_admin',
    title: 'Users & Access Control',
    titleAm: 'የተጠቃሚዎች እና ፈቃድ ቁጥጥር',
    category: 'Platform Governance',
    categoryAm: 'የመድረክ አስተዳደር',
    summary:
      'Central governance registry to privilege Platform Super Admins and Property Admins/Staff, reset passwords, suspend seats, and sync Firestore access grants.',
    summaryAm:
      'የመድረክ ዋና አስተዳዳሪዎችን እና የሆቴል አስተዳዳሪዎችን/ሰራተኞችን መለያ ለመፍቀድ፣ የይለፍ ቃል ለመቀየር እና መዳረሻን ለማገድ የሚያገለግል ማዕከል።',
    steps: [
      {
        title: 'Choose directory scope',
        titleAm: 'የተጠቃሚ ማውጫ ይምረጡ',
        detail: 'Switch between Property Admins & Staff (filterable by hotel and role) and Platform Super Admins.',
        detailAm: 'በሆቴል አስተዳዳሪዎች/ሰራተኞች እና በመድረክ ዋና አስተዳዳሪዎች ማውጫ መካከል ይቀያይሩ።',
      },
      {
        title: 'Privilege an account',
        titleAm: 'መለያ ይፍቀዱ',
        detail: 'Click Privilege Super Admin or Privilege Property Account, assign email + role, and optionally set an initial 8+ character password.',
        detailAm: 'መለያ ፍቀድ የሚለውን በመጫን ኢሜይል፣ ሚና እና ቢያንስ 8 ፊደላት ያለው የይለፍ ቃል ያዘጋጁ።',
      },
      {
        title: 'Update passwords or revoke access',
        titleAm: 'የይለፍ ቃል ይቀይሩ ወይም ፈቃድ ይሰርዙ',
        detail: 'Use the key icon to set a new password or Suspend/Revoke to immediately block sign-in across both local and Google sessions.',
        detailAm: 'የቁልፍ ምልክቱን በመጠቀም የይለፍ ቃል ይቀይሩ ወይም መዳረሻን ለመከልከል Suspend/Revoke ይጠቀሙ።',
      },
    ],
    faqs: [
      {
        question: 'Can an uninvited user sign in with Google?',
        questionAm: 'ፈቃድ ያልተሰጠው ተጠቃሚ በGoogle መግባት ይችላል?',
        answer:
          'No. Google Sign-In checks /admins and /accessGrants in Firestore; unprivileged accounts are immediately signed out and denied access.',
        answerAm:
          'አይችልም። የGoogle መግቢያ በFirestore ውስጥ ፈቃድ መኖሩን ያረጋግጣል፤ ያልተፈቀዱ መለያዎች ወዲያውኑ ይታገዳሉ።',
      },
      {
        question: 'Why cannot the root owner account be deleted?',
        questionAm: 'ዋናው የመድረክ ባለቤት መለያ ለምን አይሰረዝም?',
        answer:
          'The bootstrapped platform owner and your active session are protected against accidental self-lockout.',
        answerAm:
          'የስርዓቱ መስራች ባለቤት እና የአሁኑ ንቁ ክፍለ ጊዜ በስህተት እንዳይቆለፉ ተጠብቀዋል።',
      },
    ],
    relatedTabs: ['hotels', 'audit_logs'],
  },

  modules: {
    tabId: 'modules',
    scope: 'super_admin',
    title: 'Module Feature Flags',
    titleAm: 'የሞጁል ባህሪያት ቁጥጥር',
    category: 'Platform Governance',
    categoryAm: 'የመድረክ አስተዳደር',
    summary:
      'Enable or disable individual hospitality ERP modules per tenant hotel independently of their baseline subscription tier.',
    summaryAm:
      'ለእያንዳንዱ ሆቴል የERP ሞጁሎችን ከመደበኛ የምዝገባ ዕቅዱ በተጨማሪ ወይም በመቀነስ ያብሩ እና ያጥፉ።',
    steps: [
      {
        title: 'Select target hotel',
        titleAm: 'የሚስተካከለውን ሆቴል ይምረጡ',
        detail: 'Pick a tenant property to view all 14 core module entitlements.',
        detailAm: 'ሁሉንም የሞጁል ፈቃዶች ለማየት አንድ ሆቴል ይምረጡ።',
      },
      {
        title: 'Toggle module entitlements',
        titleAm: 'ሞጁሎችን ያብሩ ወይም ያጥፉ',
        detail: 'Switch modules on or off; disabled modules are immediately hidden from sidebar navigation and blocked by permission checks.',
        detailAm: 'ሞጁሎችን ያብሩ ወይም ያጥፉ፤ የተዘጉ ሞጁሎች ከጎን ምናሌ ይጠፋሉ።',
      },
    ],
    faqs: [
      {
        question: 'Are existing records deleted if a module is turned off?',
        questionAm: 'አንድ ሞጁል ሲጠፋ የተመዘገቡ መረጃዎች ይጠፋሉ?',
        answer:
          'No. Disabling a module hides its UI and blocks access, while underlying records remain preserved if re-enabled later.',
        answerAm:
          'አይጠፉም። ሞጁሉን ማጥፋት መዳረሻን ብቻ ይዘጋል፤ መረጃው ተጠብቆ ይቆያል።',
      },
    ],
    relatedTabs: ['hotels', 'subscriptions'],
  },

  announcements: {
    tabId: 'announcements',
    scope: 'super_admin',
    title: 'Platform Announcements',
    titleAm: 'ማስታወቂያዎች',
    category: 'Platform Governance',
    categoryAm: 'የመድረክ አስተዳደር',
    summary:
      'Publish platform-wide operational notices, scheduled maintenance alerts, and compliance bulletins visible to hotel administrators.',
    summaryAm:
      'ለሆቴል አስተዳዳሪዎች የሚታዩ የስርዓት ማስታወቂያዎችን፣ የጥገና ሰዓቶችን እና የአሰራር መመሪያዎችን ያትሙ።',
    steps: [
      {
        title: 'Compose announcement',
        titleAm: 'ማስታወቂያ ይጻፉ',
        detail: 'Provide an English and optional Amharic title, priority severity, and concise action message.',
        detailAm: 'በእንግሊዝኛ እና በአማርኛ ርዕስ፣ የአስቸኳይነት ደረጃ እና ግልጽ መልእክት ያስገቡ።',
      },
      {
        title: 'Publish to tenant dashboards',
        titleAm: 'ለሆቴል ዳሽቦርዶች ያሰራጩ',
        detail: 'Submitted notices appear immediately across active hotel workspaces.',
        detailAm: 'የታተሙ ማስታወቂያዎች ወዲያውኑ በንቁ ሆቴሎች ዳሽቦርድ ላይ ይታያሉ።',
      },
    ],
    faqs: [
      {
        question: 'Who can publish platform announcements?',
        questionAm: 'የመድረክ ማስታወቂያ ማን ማተም ይችላል?',
        answer:
          'Only authenticated Platform Super Admins can create global announcements.',
        answerAm:
          'ዓለም አቀፍ ማስታወቂያዎችን ማተም የሚችሉት የተረጋገጡ ዋና አስተዳዳሪዎች ብቻ ናቸው።',
      },
    ],
    relatedTabs: ['saas_overview', 'audit_logs'],
  },

  audit_logs: {
    tabId: 'audit_logs',
    scope: 'super_admin',
    title: 'Security Audit Trail',
    titleAm: 'የደህንነት ኦዲት መዝገብ',
    category: 'Platform Governance',
    categoryAm: 'የመድረክ አስተዳደር',
    summary:
      'Immutable chronological log of logins, failed password attempts, privilege grants/revocations, hotel onboarding, and status changes.',
    summaryAm:
      'የመግቢያ ሙከራዎች፣ የተሳሳቱ የይለፍ ቃሎች፣ የፈቃድ ለውጦች እና የሆቴል ሁኔታ ዝመናዎች የማይለወጥ መዝገብ።',
    steps: [
      {
        title: 'Filter by module or tenant',
        titleAm: 'በሞጁል ወይም በሆቴል ያጣሩ',
        detail: 'Search actor email, action code (e.g., LOGIN_FAILED_BAD_PASSWORD, HOTEL_USER_PRIVILEGED), or target ID.',
        detailAm: 'የተጠቃሚ ኢሜይል፣ የድርጊት ኮድ ወይም የሆቴል ስም በመጻፍ ይፈልጉ።',
      },
      {
        title: 'Export CSV evidence',
        titleAm: 'የCSV ማስረጃ ያውርዱ',
        detail: 'Download the filtered audit table for compliance review.',
        detailAm: 'ለኦዲት ግምገማ የተጣራውን ሰንጠረዥ በCSV ያውርዱ።',
      },
    ],
    faqs: [
      {
        question: 'Can audit logs be edited or deleted from the UI?',
        questionAm: 'የኦዲት መዝገቦችን ከገጹ ላይ ማረም ወይም መሰረዝ ይቻላል?',
        answer:
          'No. Audit events are append-only in UI views to preserve accountability.',
        answerAm:
          'አይቻልም። ተጠያቂነትን ለመጠበቅ የኦዲት መዝገቦች መደመር እንጂ መሰረዝ አይችሉም።',
      },
    ],
    relatedTabs: ['platform_access', 'hotels'],
  },

  // ==========================================
  // HOTEL ADMIN & 27 OPERATIONAL MODULES
  // ==========================================
  hotel_dashboard: {
    tabId: 'hotel_dashboard',
    scope: 'hotel',
    title: 'Executive Dashboard',
    titleAm: 'የአስፈጻሚ ዳሽቦርድ',
    category: 'Overview & Governance',
    categoryAm: 'አጠቃላይ እይታ እና አስተዳደር',
    summary:
      'Real-time property overview showing occupancy, ADR, RevPAR, revenue vs. collections, pending approvals, and operational exceptions calculated from stored hotel data.',
    summaryAm:
      'ከሆቴሉ ትክክለኛ መረጃ የተሰሉ የክፍል ሙሌት፣ ADR፣ RevPAR፣ ገቢ እና በመጠባበቅ ላይ ያሉ ፍቃዶችን ያሳያል።',
    steps: [
      {
        title: 'Review top property KPIs',
        titleAm: 'ዋና የሆቴል KPIዎችን ይገምግሙ',
        detail: 'Compare room occupancy percentage, ADR, RevPAR, and open receivables for the active business date.',
        detailAm: 'ለተመረጠው የሥራ ቀን የክፍል ሙሌት መቶኛን፣ ADR፣ RevPAR እና ያልተሰበሰቡ ሂሳቦችን ያነጻጽሩ።',
      },
      {
        title: 'Act on departmental alerts',
        titleAm: 'የክፍል ማንቂያዎችን ይከታተሉ',
        detail: 'Click through pending purchase requisitions, room turnovers, or night audit warnings directly.',
        detailAm: 'የግዥ ጥያቄዎችን፣ የክፍል ዝግጅትን ወይም የምሽት ኦዲት ማንቂያዎችን በመጫን ወደ ተግባር ይሂዱ።',
      },
    ],
    faqs: [
      {
        question: 'Why do some dashboards show a "Sample Data" indicator?',
        questionAm: 'አንዳንድ መረጃዎች ላይ "Sample Data" የሚል ምልክት ለምን ይታያል?',
        answer:
          'Modules containing pre-seeded illustrative entries display a Sample Data badge so staff never mistake evaluation examples for audited financial results.',
        answerAm:
          'ለማሳያነት የተሞሉ ናሙና መረጃዎች ከትክክለኛ የኦዲት ውጤቶች እንዳይምታቱ በግልጽ ምልክት ተለይተዋል።',
      },
    ],
    relatedTabs: ['front_office', 'financial_management', 'night_audit', 'reporting_bi'],
  },

  hotel_profile: {
    tabId: 'hotel_profile',
    scope: 'hotel',
    title: 'Organization Settings',
    titleAm: 'የድርጅት ቅንብሮች',
    category: 'Overview & Governance',
    categoryAm: 'አጠቃላይ እይታ እና አስተዳደር',
    summary:
      'Configure your property’s legal identity, logo URL, address, contact channels, default currency (ETB), timezone, and fiscal year start month.',
    summaryAm:
      'የሆቴሉን ሕጋዊ ስም፣ አርማ፣ አድራሻ፣ የግንኙነት መረጃ፣ ገንዘብ (ብር)፣ የሰዓት ሰቅ እና የበጀት ዓመት ያስተካክሉ።',
    steps: [
      {
        title: 'Update property branding',
        titleAm: 'የሆቴሉን መለያ ያዘምኑ',
        detail: 'Set display name, legal name, and optional logo URL shown in the sidebar and printed guest folios.',
        detailAm: 'በጎን አሞሌ እና በደረሰኞች ላይ የሚታየውን ስም እና አርማ ያስተካክሉ።',
      },
      {
        title: 'Save localization defaults',
        titleAm: 'የአካባቢ ቅንብሮችን ያስቀምጡ',
        detail: 'Verify VAT %, service charge %, currency symbol, and default workspace language.',
        detailAm: 'የVAT መቶኛ፣ የአገልግሎት ክፍያ መቶኛ እና ነባሪ ቋንቋን አረጋግጠው ያስቀምጡ።',
      },
    ],
    faqs: [
      {
        question: 'Who can modify Organization Settings?',
        questionAm: 'የድርጅት ቅንብሮችን ማን ማስተካከል ይችላል?',
        answer:
          'Only Hotel Admins, General Managers, and inspecting Super Admins have edit permissions.',
        answerAm:
          'ለውጥ ማድረግ የሚችሉት የሆቴል አስተዳዳሪዎች፣ ዋና ሥራ አስኪያጆች እና ዋና አስተዳዳሪዎች ብቻ ናቸው።',
      },
    ],
    relatedTabs: ['financial_rules', 'departments', 'hotel_users'],
  },

  hotel_users: {
    tabId: 'hotel_users',
    scope: 'hotel',
    title: 'Staff Accounts & Roles',
    titleAm: 'የሰራተኞች መለያ እና ሚናዎች',
    category: 'Overview & Governance',
    categoryAm: 'አጠቃላይ እይታ እና አስተዳደር',
    summary:
      'Privilege property staff members, assign role tiers and departments, set or reset passwords, and suspend or revoke login access.',
    summaryAm:
      'ለሆቴል ሰራተኞች የመግቢያ መለያ ይፍቀዱ፣ ሚና እና ክፍል ይመድቡ፣ የይለፍ ቃል ያዘጋጁ ወይም መዳረሻን ያግዱ።',
    steps: [
      {
        title: 'Privilege a staff account',
        titleAm: 'የሰራተኛ መለያ ይፍቀዱ',
        detail: 'Click Privilege Staff Account, enter name, work email, role tier, department, and an initial 8+ character password.',
        detailAm: 'የሰራተኛ መለያ ፍቀድ የሚለውን በመጫን ስም፣ ኢሜይል፣ ሚና፣ ክፍል እና የይለፍ ቃል ያስገቡ።',
      },
      {
        title: 'Manage passwords & status',
        titleAm: 'የይለፍ ቃል እና ሁኔታን ያስተዳድሩ',
        detail: 'Use the key icon to issue a new password or Suspend/Revoke to block sign-in immediately.',
        detailAm: 'የይለፍ ቃል ለመቀየር የቁልፍ ምልክቱን፣ ለማገድ ደግሞ Suspend ወይም Revoke ይጠቀሙ።',
      },
    ],
    faqs: [
      {
        question: 'Can a staff member sign in before an admin adds them here?',
        questionAm: 'አስተዳዳሪ ሳይፈቅድለት አንድ ሰራተኛ መግባት ይችላል?',
        answer:
          'No. Both email/password login and Google Sign-In strictly require an active account record provisioned by a Property Admin or Super Admin.',
        answerAm:
          'አይችልም። በይለፍ ቃልም ሆነ በGoogle መግባት የሚቻለው በአስተዳዳሪ ንቁ ፈቃድ ሲሰጥ ብቻ ነው።',
      },
    ],
    relatedTabs: ['role_matrix', 'employees'],
  },

  role_matrix: {
    tabId: 'role_matrix',
    scope: 'hotel',
    title: 'RBAC Permissions Matrix',
    titleAm: 'የሚና እና ፈቃድ ሰንጠረዥ',
    category: 'Overview & Governance',
    categoryAm: 'አጠቃላይ እይታ እና አስተዳደር',
    summary:
      'Inspect module visibility and action-level rights (View, Create, Edit, Delete, Approve, Export) enforced across every role tier.',
    summaryAm:
      'በእያንዳንዱ ሚና ላይ የተፈቀዱ ሞጁሎችን እና የድርጊት መብቶችን (ማየት፣ መፍጠር፣ ማረም፣ መሰረዝ፣ ማጽደቅ፣ ማውጣት) ይመልከቱ።',
    steps: [
      {
        title: 'Inspect role capabilities',
        titleAm: 'የሚና መብቶችን ይመርምሩ',
        detail: 'Compare permissions from Hotel Admin and GM down to Department Head, Supervisor, Staff, and Auditor.',
        detailAm: 'ከሆቴል አስተዳዳሪ እና GM እስከ ሰራተኛ እና ኦዲተር ያሉትን ፈቃዶች ያወዳድሩ።',
      },
      {
        title: 'Verify module boundaries',
        titleAm: 'የሞጁል ገደቦችን ያረጋግጡ',
        detail: 'Confirm that financial approvals and user governance remain restricted to authorized leadership roles.',
        detailAm: 'የፋይናንስ ማጽደቂያ እና የተጠቃሚ አስተዳደር ለተፈቀደላቸው መሪዎች ብቻ መሆኑን ያረጋግጡ።',
      },
    ],
    faqs: [
      {
        question: 'How does SEAM restrict modules by both plan and role?',
        questionAm: 'SEAM ሞጁሎችን በዕቅድ እና በሚና እንዴት ይገድባል?',
        answer:
          'A user can only open a module if it is BOTH enabled on the hotel’s subscription AND included in their assigned role permissions.',
        answerAm:
          'አንድ ተጠቃሚ ሞጁል መክፈት የሚችለው በሆቴሉ የምዝገባ ዕቅድ ከነቃ እና በሚናው ከተፈቀደለት ብቻ ነው።',
      },
    ],
    relatedTabs: ['hotel_users', 'hotel_subscription'],
  },

  hotel_subscription: {
    tabId: 'hotel_subscription',
    scope: 'hotel',
    title: 'Subscription & Billing',
    titleAm: 'ምዝገባ እና ክፍያ',
    category: 'Overview & Governance',
    categoryAm: 'አጠቃላይ እይታ እና አስተዳደር',
    summary:
      'View your property’s active SaaS plan, seat and room capacity usage, renewal dates, and submit manual CBE/Telebirr payment slips for Super Admin verification.',
    summaryAm:
      'የሆቴሉን ንቁ የምዝገባ ዕቅድ፣ የተጠቃሚ/ክፍል አጠቃቀም፣ የማብቂያ ቀን ይመልከቱ እና የእድሳት ክፍያ ደረሰኝ ያስገቡ።',
    steps: [
      {
        title: 'Monitor seat & room limits',
        titleAm: 'የአቅም ገደቦችን ይከታተሉ',
        detail: 'Verify current active staff accounts and room counts against your subscription ceiling.',
        detailAm: 'የአሁኑን የተጠቃሚ እና የክፍል ብዛት ከዕቅዱ ገደብ ጋር ያመሳክሩ።',
      },
      {
        title: 'Submit renewal payment',
        titleAm: 'የእድሳት ክፍያ ያስገቡ',
        detail: 'Record bank transfer or Telebirr reference numbers so the Super Admin can verify and extend the billing period.',
        detailAm: 'የባንክ ወይም የቴሌብር ማጣቀሻ ቁጥር በማስገባት ዋና አስተዳዳሪ እንዲያረጋግጠው ይላኩ።',
      },
    ],
    faqs: [
      {
        question: 'What should we do during a Grace Period warning?',
        questionAm: 'የችሮታ ጊዜ ማስጠንቀቂያ ሲታይ ምን እናድርግ?',
        answer:
          'Submit your renewal transfer receipt before the 7-day grace window closes to prevent the workspace from entering suspended status.',
        answerAm:
          'ሥራ እንዳይቋረጥ የ7-ቀን የችሮታ ጊዜ ከማብቃቱ በፊት የክፍያ ደረሰኝዎን ያስገቡ።',
      },
    ],
    relatedTabs: ['hotel_profile', 'hotel_users'],
  },

  rooms: {
    tabId: 'rooms',
    scope: 'hotel',
    title: 'Rooms & Categories',
    titleAm: 'ክፍሎች እና ምድቦች',
    category: 'Property Configuration',
    categoryAm: 'የሆቴል ማዋቀሪያ',
    summary:
      'Define room categories, rack rates in ETB, bed configurations, floor numbers, amenities, and live housekeeping/maintenance operational status.',
    summaryAm:
      'የክፍል ምድቦችን፣ የሌሊት ዋጋን (በብር)፣ የፎቅ ቁጥሮችን፣ መገልገያዎችን እና የክፍል ሁኔታዎችን ያዋቅሩ።',
    steps: [
      {
        title: 'Configure room categories',
        titleAm: 'የክፍል ምድቦችን ይፍጠሩ',
        detail: 'Set base nightly rates, maximum occupancy, and standard amenities for Standard, Deluxe, or Suite categories.',
        detailAm: 'ለእያንዳንዱ የክፍል ምድብ መደበኛ ዋጋ፣ የእንግዳ ብዛት እና መገልገያዎችን ይመድቡ።',
      },
      {
        title: 'Add or update room inventory',
        titleAm: 'ክፍሎችን ያክሉ ወይም ያዘምኑ',
        detail: 'Register room numbers by floor and link each room to its category for Front Desk and Housekeeping sync.',
        detailAm: 'የክፍል ቁጥሮችን በፎቅ ይመዝግቡ እና ከፊት ቢሮ እና ጽዳት ጋር ያገናኙ።',
      },
    ],
    faqs: [
      {
        question: 'How does Out of Order (OOO) status affect occupancy?',
        questionAm: 'ከአገልግሎት ውጭ (OOO) የሆነ ክፍል በሙሌት ላይ ተጽዕኖ አለው?',
        answer:
          'Rooms marked Out of Order are blocked from Front Desk check-in assignment until cleared by Engineering and Housekeeping.',
        answerAm:
          'OOO ተብለው የተመዘገቡ ክፍሎች በጥገና እና ጽዳት እስኪጸዱ ድረስ ለእንግዳ መግቢያ አይመደቡም።',
      },
    ],
    relatedTabs: ['front_office', 'housekeeping', 'maintenance'],
  },

  departments: {
    tabId: 'departments',
    scope: 'hotel',
    title: 'Departments Setup',
    titleAm: 'የክፍለ ሥራዎች ማዋቀሪያ',
    category: 'Property Configuration',
    categoryAm: 'የሆቴል ማዋቀሪያ',
    summary:
      'Manage USALI hotel cost centers, revenue centers, department heads, and monthly budget allocations.',
    summaryAm:
      'የሆቴሉን የUSALI ወጪ እና ገቢ ማዕከላት፣ የክፍል ኃላፊዎች እና ወርሃዊ በጀት ያደራጁ።',
    steps: [
      {
        title: 'Inspect cost & revenue centers',
        titleAm: 'የወጪ እና ገቢ ማዕከላትን ይመልከቱ',
        detail: 'Review Front Office, F&B, Kitchen, Housekeeping, Finance, HR, Engineering, and Security centers.',
        detailAm: 'የፊት ቢሮ፣ ምግብና መጠጥ፣ ወጥ ቤት፣ ጽዳት፣ ፋይናንስ፣ የሰው ኃይል እና ጥገና ማዕከላትን ይመርምሩ።',
      },
      {
        title: 'Assign budgets & heads',
        titleAm: 'በጀት እና ኃላፊ ይመድቡ',
        detail: 'Attach monthly operating budgets in ETB for variance tracking in Financial Management.',
        detailAm: 'ለፋይናንስ ቁጥጥር ወርሃዊ በጀት በብር እና የክፍል ኃላፊ ይመድቡ።',
      },
    ],
    faqs: [
      {
        question: 'Why are departments aligned to USALI?',
        questionAm: 'ክፍሎች በUSALI ስርዓት ለምን ይደራጃሉ?',
        answer:
          'USALI (Uniform System of Accounts for the Lodging Industry) keeps revenue, payroll, and departmental expenses comparable across properties.',
        answerAm:
          'USALI የሆቴል ገቢን፣ ደመወዝን እና የክፍል ወጪዎችን በዓለም አቀፍ የሆቴል ሂሳብ መስፈርት እንዲነጻጸሩ ያስችላል።',
      },
    ],
    relatedTabs: ['financial_management', 'employees'],
  },

  outlets: {
    tabId: 'outlets',
    scope: 'hotel',
    title: 'Outlets & POS Centers',
    titleAm: 'መሸጫዎች እና የPOS ማዕከላት',
    category: 'Property Configuration',
    categoryAm: 'የሆቴል ማዋቀሪያ',
    summary:
      'Configure F&B restaurants, bars, lounges, room service, and spa revenue outlets along with menu pricing and service schedules.',
    summaryAm:
      'የሆቴሉን ምግብ ቤቶች፣ ባሮች፣ ላውንጆች እና የክፍል አገልግሎት መሸጫዎችን ያዋቅሩ።',
    steps: [
      {
        title: 'Create POS revenue outlets',
        titleAm: 'የPOS መሸጫዎችን ይፍጠሩ',
        detail: 'Define outlet code, type, seating capacity, and operating hours.',
        detailAm: 'የመሸጫ ኮድ፣ ዓይነት፣ የመቀመጫ አቅም እና የሥራ ሰዓት ይመዝግቡ።',
      },
      {
        title: 'Link to POS Cashiering',
        titleAm: 'ከPOS ገንዘብ ተቀባይ ጋር ያገናኙ',
        detail: 'Active outlets appear immediately in POS & Cashier Sessions for order entry and room posting.',
        detailAm: 'ንቁ መሸጫዎች ወዲያውኑ በPOS እና የገንዘብ ተቀባይ ክፍለ ጊዜ ውስጥ ይታያሉ።',
      },
    ],
    faqs: [
      {
        question: 'Do outlet charges support posting to guest room folios?',
        questionAm: 'የመሸጫ ሂሳቦችን ወደ እንግዳ ክፍል ሂሳብ (Folio) ማዞር ይቻላል?',
        answer:
          'Yes. Any active F&B outlet in POS Cashiering can post signed checks directly to an in-house guest folio.',
        answerAm:
          'አዎን። በPOS ውስጥ ያሉ ንቁ መሸጫዎች የእንግዳ ትዕዛዞችን በቀጥታ ወደ ክፍል ሂሳብ ማስገባት ይችላሉ።',
      },
    ],
    relatedTabs: ['pos_cashier', 'restaurant_floor', 'recipes_menu'],
  },

  employees: {
    tabId: 'employees',
    scope: 'hotel',
    title: 'Employee Directory',
    titleAm: 'የሰራተኞች ማውጫ',
    category: 'Property Configuration',
    categoryAm: 'የሆቴል ማዋቀሪያ',
    summary:
      'Master HR employee directory storing roles, department assignments, contract types, and masked national ID / passport identifiers.',
    summaryAm:
      'የሰራተኞችን ሙሉ መዝገብ፣ የሥራ ክፍል፣ የቅጥር ሁኔታ እና የተከለለ መታወቂያ/ፓስፖርት ቁጥር የሚያስተዳድር ማውጫ።',
    steps: [
      {
        title: 'Add or import staff records',
        titleAm: 'የሰራተኛ መዝገብ ያክሉ',
        detail: 'Register employees individually or import via CSV with department code and base salary in ETB.',
        detailAm: 'ሰራተኞችን በተናጠል ወይም በCSV ከክፍል ኮድ እና መሰረታዊ ደመወዝ ጋር ያስገቡ።',
      },
      {
        title: 'Verify privacy masking',
        titleAm: 'የመረጃ መከለልን ያረጋግጡ',
        detail: 'National ID and passport numbers are masked to the last 4 characters in list tables for data protection.',
        detailAm: 'የብሔራዊ መታወቂያ እና ፓስፖርት ቁጥሮች በዝርዝር ሰንጠረዦች ውስጥ የመጨረሻ 4 ቁጥሮች ብቻ ይታያሉ።',
      },
    ],
    faqs: [
      {
        question: 'Does adding an employee here automatically give them login access?',
        questionAm: 'ሰራተኛን እዚህ መመዝገብ ወዲያውኑ የመግቢያ መለያ ይፈጥራል?',
        answer:
          'No. Employee HR records are separate from login credentials; grant login access in Staff Accounts & Roles.',
        answerAm:
          'አይደለም። የመግቢያ መለያ እና የይለፍ ቃል በ"የሰራተኞች መለያ እና ሚናዎች" በኩል ለብቻው መፈቀድ አለበት።',
      },
    ],
    relatedTabs: ['hotel_users', 'human_resources'],
  },

  financial_rules: {
    tabId: 'financial_rules',
    scope: 'hotel',
    title: 'Financial Rules & Limits',
    titleAm: 'የፋይናንስ ሕጎች እና ገደቦች',
    category: 'Property Configuration',
    categoryAm: 'የሆቴል ማዋቀሪያ',
    summary:
      'Configure VAT (15%), Service Charge (10%), Ethiopian payroll tax/pension parameters, and ETB requisition approval thresholds.',
    summaryAm:
      'የ15% VAT፣ የ10% አገልግሎት ክፍያ፣ የኢትዮጵያ የደመወዝ ግብር/ጡረታ መለኪያዎችን እና የግዥ ማጽደቂያ ገደቦችን ያስተካክሉ።',
    steps: [
      {
        title: 'Verify tax & levy percentages',
        titleAm: 'የግብር እና አገልግሎት ክፍያ መቶኛዎችን ያረጋግጡ',
        detail: 'Review hospitality VAT and service charge rules used across Front Desk folios and POS checks.',
        detailAm: 'በፊት ቢሮ እና POS ደረሰኞች ላይ የሚተገበረውን የVAT እና አገልግሎት ክፍያ መቶኛ ያረጋግጡ።',
      },
      {
        title: 'Set ETB approval limits',
        titleAm: 'የብር ማጽደቂያ ገደቦችን ያዘጋጁ',
        detail: 'Define Department Head, Finance Manager, and GM sign-off thresholds in ETB.',
        detailAm: 'የክፍል ኃላፊ፣ የፋይናንስ ሥራ አስኪያጅ እና የGM የማጽደቂያ ገደቦችን በብር ይወስኑ።',
      },
    ],
    faqs: [
      {
        question: 'Should tax rates be reviewed before statutory filing?',
        questionAm: 'የግብር መቶኛዎች ከመደበኛ ሪፖርት በፊት መረጋገጥ አለባቸው?',
        answer:
          'Yes. All calculated VAT, service charge, income tax, and pension figures must be verified by your property accountant before official filing.',
        answerAm:
          'አዎን። ሁሉም የVAT፣ የአገልግሎት ክፍያ፣ የገቢ ግብር እና የጡረታ ስሌቶች ከመደበኛ ሪፖርት በፊት በሆቴሉ ሂሳብ ባለሙያ መረጋገጥ አለባቸው።',
      },
    ],
    relatedTabs: ['financial_management', 'human_resources'],
  },

  front_office: {
    tabId: 'front_office',
    scope: 'hotel',
    title: 'Front Desk & Folios',
    titleAm: 'እንግዳ መቀበያ እና ሂሳቦች',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Manage reservations, walk-ins, room assignments, check-ins/check-outs, guest folios with itemized VAT/Service Charge, and City Ledger transfers.',
    summaryAm:
      'ቦታ ማስያዝን፣ መግቢያና መውጫን፣ የክፍል ምደባን እና የእንግዳ ሂሳቦችን (Folio) ከVAT እና አገልግሎት ክፍያ ጋር ያስተዳድሩ።',
    steps: [
      {
        title: 'Create or locate reservation',
        titleAm: 'ቦታ ማስያዝ ይፍጠሩ ወይም ይፈልጉ',
        detail: 'Filter arrivals, departures, or in-house guests, or create a new booking with room category and nightly ETB rate.',
        detailAm: 'ዛሬ የሚገቡ፣ የሚወጡ ወይም በክፍል ውስጥ ያሉ እንግዶችን ይፈልጉ ወይም አዲስ ቦታ ያስይዙ።',
      },
      {
        title: 'Check-in & assign clean room',
        titleAm: 'ንጹህ ክፍል መድበው ያስገቡ',
        detail: 'Assign a Verified Clean room, mask/verify guest ID, and open an active guest folio.',
        detailAm: 'ንጹህ የሆነ ክፍል መድበው፣ የእንግዳ መታወቂያ አረጋግጠው እና ሂሳብ (Folio) ይክፈቱ።',
      },
      {
        title: 'Post charges, payments & check-out',
        titleAm: 'ክፍያዎችን መዝግበው ያሰናብቱ',
        detail: 'Settle balance via Cash, CBE, Telebirr, Card, or Corporate City Ledger before completing departure.',
        detailAm: 'ከመውጣታቸው በፊት ቀሪ ሂሳቡን በጥሬ ገንዘብ፣ CBE፣ ቴሌብር ወይም በድርጅት ሂሳብ ይዝጉ።',
      },
    ],
    faqs: [
      {
        question: 'Why does a check-out fail when folio balance is non-zero?',
        questionAm: 'ቀሪ ሂሳብ ሳይዘጋ መውጫ (Check-out) ለምን አይፈቀድም?',
        answer:
          'To prevent uncollected revenue loss, all guest folio balances must either be settled to zero or transferred to an approved City Ledger corporate account.',
        answerAm:
          'ያልተሰበሰበ ገቢ እንዳይባክን ሂሳቡ ሙሉ በሙሉ መከፈል ወይም ወደ ተፈቀደ የድርጅት ሂሳብ መዘዋወር አለበት።',
      },
    ],
    relatedTabs: ['housekeeping', 'city_ledger', 'night_audit', 'group_blocks'],
  },

  housekeeping: {
    tabId: 'housekeeping',
    scope: 'hotel',
    title: 'Housekeeping Board',
    titleAm: 'የቤት አያያዝ ሰሌዳ',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Coordinate room turnover cleaning tasks, attendant assignments, supervisor inspections, minibar checks, and maintenance escalations.',
    summaryAm:
      'የክፍል ጽዳት ስራዎችን፣ የሰራተኞች ምደባን፣ የሱፐርቫይዘር ፍተሻን እና የሚኒባር ቁጥጥርን ያስተባብሩ።',
    steps: [
      {
        title: 'Prioritize departure & VIP rooms',
        titleAm: 'ለቀው የወጡ እና VIP ክፍሎችን ቅድሚያ ይስጡ',
        detail: 'Filter dirty or stay-over rooms and assign housekeeping attendants by floor.',
        detailAm: 'ቆሻሻ ወይም በመስተንግዶ ላይ ያሉ ክፍሎችን በመለየት ለሰራተኞች ይመድቡ።',
      },
      {
        title: 'Advance inspection status',
        titleAm: 'የፍተሻ ሁኔታን ያዘምኑ',
        detail: 'Move rooms from Dirty → Cleaning → Inspected/Clean so Front Desk can check arriving guests in.',
        detailAm: 'ክፍሎችን ከቆሻሻ ወደ ጽዳት እና የተመረመረ ንጹህ በማሸጋገር ለፊት ቢሮ ዝግጁ ያድርጉ።',
      },
    ],
    faqs: [
      {
        question: 'How are urgent room defects reported to Engineering?',
        questionAm: 'በጽዳት ጊዜ የተገኘ ብልሽት ለጥገና እንዴት ይላካል?',
        answer:
          'Create a maintenance work order from Engineering & Assets or mark the room Out of Service while repairs proceed.',
        answerAm:
          'በኢንጂነሪንግ እና ንብረቶች ሞጁል ውስጥ የጥገና ትዕዛዝ ይፍጠሩ እና ክፍሉን ለጊዜው ከአገልግሎት ውጭ ያድርጉ።',
      },
    ],
    relatedTabs: ['front_office', 'laundry', 'maintenance'],
  },

  group_blocks: {
    tabId: 'group_blocks',
    scope: 'hotel',
    title: 'Group Room Blocks',
    titleAm: 'የቡድን ክፍል ምደባዎች',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Manage tour, conference, NGO, and diplomatic group allotments, cutoff dates, master billing instructions, and individual rooming lists.',
    summaryAm:
      'የቱሪዝም፣ የስብሰባ እና የድርጅት ቡድን ክፍል ምደባዎችን፣ የመጨረሻ ቀናትን እና የእንግዳ ስም ዝርዝር (Rooming List) ያስተዳድሩ።',
    steps: [
      {
        title: 'Create group allotment block',
        titleAm: 'የቡድን ክፍል ምደባ ይፍጠሩ',
        detail: 'Specify organization, arrival/departure dates, contracted rooms, cutoff date, and master vs. individual billing.',
        detailAm: 'ድርጅቱን፣ የመግቢያ/መውጫ ቀንን፣ የተያዙ ክፍሎችን እና የክፍያ መመሪያውን ይመዝግቡ።',
      },
      {
        title: 'Maintain rooming list',
        titleAm: 'የእንግዳ ዝርዝር ያስተዳድሩ',
        detail: 'Pick up guests against the allotment and track confirmed vs. washed rooms prior to cutoff.',
        detailAm: 'እንግዶችን በቡድኑ ስር በመመዝገብ የተረጋገጡ እና የተለቀቁ ክፍሎችን ይከታተሉ።',
      },
    ],
    faqs: [
      {
        question: 'What happens when a cutoff date is reached?',
        questionAm: 'የቡድን የመጨረሻ ቀን (Cutoff) ሲደርስ ምን ይደረጋል?',
        answer:
          'Unclaimed rooms can be washed back into general Front Desk & CRS inventory to avoid unsold room loss.',
        answerAm:
          'ያልተያዙ ክፍሎች እንዳይባክኑ ወደ መደበኛው የፊት ቢሮ ሽያጭ ክምችት መመለስ ይቻላል።',
      },
    ],
    relatedTabs: ['front_office', 'events', 'city_ledger'],
  },

  in_room_tablet: {
    tabId: 'in_room_tablet',
    scope: 'hotel',
    title: 'Digital In-Room Hub',
    titleAm: 'የክፍል ውስጥ ዲጂታል ማዕከል',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Monitor digital guest room-service orders, Make-Up Room / Do-Not-Disturb signals, pillow/amenity requests, and express check-out tickets.',
    summaryAm:
      'ከክፍል ታብሌት/QR የሚመጡ የምግብ ትዕዛዞችን፣ DND/MUR ጥያቄዎችን እና ፈጣን መውጫ ጥያቄዎችን ይከታተሉ።',
    steps: [
      {
        title: 'Monitor DND / Make-Up Room queue',
        titleAm: 'የDND / ክፍል አጽዳ ጥያቄዎችን ይከታተሉ',
        detail: 'Dispatch housekeeping or concierge staff when guests toggle room service preferences.',
        detailAm: 'እንግዶች የጽዳት ወይም የአገልግሎት ጥያቄ ሲልኩ ሰራተኞችን ወዲያውኑ ያሰማሩ።',
      },
      {
        title: 'Process room-service & express checkout',
        titleAm: 'የክፍል ትዕዛዝ እና ፈጣን መውጫን ያስተናግዱ',
        detail: 'Confirm pending tray orders and hand off express check-out requests to Front Desk cashiering.',
        detailAm: 'የምግብ ትዕዛዞችን አረጋግጠው የመውጫ ጥያቄዎችን ለፊት ቢሮ ያስተላልፉ።',
      },
    ],
    faqs: [
      {
        question: 'Is this connected to physical bedside tablets?',
        questionAm: 'ይህ ከክፍል ውስጥ አካላዊ ታብሌቶች ጋር የተገናኘ ነው?',
        answer:
          'External bedside tablet hardware integrations are simulated unless connected to your property’s hardware gateway; staff dispatch queues work locally.',
        answerAm:
          'የታብሌት ሃርድዌር ግንኙነት ለማሳያ የተዘጋጀ ሲሆን የውስጥ አገልግሎት ትዕዛዞች በመደበኛነት ይመዘገባሉ።',
      },
    ],
    relatedTabs: ['front_office', 'housekeeping', 'pos_cashier'],
  },

  concierge_fleet: {
    tabId: 'concierge_fleet',
    scope: 'hotel',
    title: 'Concierge & Safaris',
    titleAm: 'ኮንሲየርጅ እና ጉዞዎች',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Dispatch airport pickups/drop-offs, track hotel transport fleet status, and book local excursions and cultural tours for guests.',
    summaryAm:
      'የአየር ማረፊያ ትራንስፖርት አገልግሎትን፣ የሆቴል ተሽከርካሪዎችን እና የእንግዳ ጉዞዎችን ያስተባብሩ።',
    steps: [
      {
        title: 'Schedule airport transfers',
        titleAm: 'የአየር ማረፊያ ዝውውር ያቅዱ',
        detail: 'Log flight number, arrival/departure time, passenger count, and assign an available fleet vehicle & driver.',
        detailAm: 'የበረራ ቁጥር፣ ሰዓት እና የተሳፋሪ ብዛት በመመዝገብ ተሽከርካሪ እና ሾፌር ይመድቡ።',
      },
      {
        title: 'Book guest excursions',
        titleAm: 'የእንግዳ ጉዞዎችን ይመዝግቡ',
        detail: 'Confirm tour activities and post package fees to the guest folio or collect direct settlement.',
        detailAm: 'የጉብኝት መርሐግብሮችን ያረጋግጡ እና ክፍያውን ወደ እንግዳ ሂሳብ ያስገቡ።',
      },
    ],
    faqs: [
      {
        question: 'Can third-party tour operators be tracked here?',
        questionAm: 'የውጭ አስጎብኚ ድርጅቶች እዚህ መመዝገብ ይችላሉ?',
        answer:
          'Yes. You can record partner tour assignments and commissionable guest excursion bookings inside the activity catalog.',
        answerAm:
          'አዎን። የአጋር አስጎብኚ ድርጅት ጉዞዎችን እና የእንግዳ ትዕዛዞችን በዝርዝሩ ውስጥ መመዝገብ ይቻላል።',
      },
    ],
    relatedTabs: ['front_office', 'valet_parking'],
  },

  crm_spa: {
    tabId: 'crm_spa',
    scope: 'hotel',
    title: 'Guest CRM, Spa & Loyalty',
    titleAm: 'የእንግዳ CRM፣ ስፓ እና ታማኝነት',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Maintain repeat guest profiles, VIP preferences, loyalty point tiers/redemptions, and schedule spa wellness treatments.',
    summaryAm:
      'የተደጋጋሚ እንግዶችን መዝገብ፣ የVIP ምርጫዎችን፣ የታማኝነት ነጥቦችን እና የስፓ ቀጠሮዎችን ያስተዳድሩ።',
    steps: [
      {
        title: 'Look up or register guest VIP profile',
        titleAm: 'የእንግዳ መገለጫ ይመዝግቡ',
        detail: 'Track stay history, dietary notes, loyalty tier, and lifetime spend in ETB.',
        detailAm: 'የእንግዳውን የቆይታ ታሪክ፣ ምርጫዎች እና የታማኝነት ነጥብ ይመዝግቡ።',
      },
      {
        title: 'Schedule spa appointments & rewards',
        titleAm: 'የስፓ ቀጠሮ እና ሽልማት ያስተዳድሩ',
        detail: 'Book massage/wellness therapists and redeem earned loyalty points for complimentary upgrades.',
        detailAm: 'የስፓ ሕክምና ቀጠሮዎችን ይያዙ እና የተጠራቀሙ ነጥቦችን ይቀንሱ።',
      },
    ],
    faqs: [
      {
        question: 'Are guest passport numbers shown in full in CRM tables?',
        questionAm: 'የእንግዳ ፓስፖርት ቁጥሮች በCRM ሰንጠረዥ ሙሉ በሙሉ ይታያሉ?',
        answer:
          'No. Sensitive identity numbers are masked in list views so only the last 4 digits appear.',
        answerAm:
          'አይታዩም። ለመረጃ ደህንነት የመጨረሻ 4 ቁጥሮች ብቻ በዝርዝር ውስጥ ይታያሉ።',
      },
    ],
    relatedTabs: ['front_office', 'reputation'],
  },

  reputation: {
    tabId: 'reputation',
    scope: 'hotel',
    title: 'Reputation & CSAT',
    titleAm: 'ስም እና የእንግዳ እርካታ',
    category: 'Front Office & Guest Journey',
    categoryAm: 'የፊት ቢሮ እና የእንግዳ ጉዞ',
    summary:
      'Track guest satisfaction scores, sentiment across departments, post-stay survey campaigns, and draft management responses.',
    summaryAm:
      'የእንግዳ እርካታ ነጥቦችን፣ የክፍለ ሥራ ግምገማዎችን እና የአመራር ምላሾችን ይከታተሉ።',
    steps: [
      {
        title: 'Monitor department sentiment',
        titleAm: 'የክፍሎችን የእርካታ ደረጃ ይከታተሉ',
        detail: 'Filter reviews by Front Desk, Housekeeping, F&B, or Facilities to spot recurring service gaps.',
        detailAm: 'ድክመቶችን ለመለየት ግምገማዎችን በክፍል ይለዩ።',
      },
      {
        title: 'Publish management replies',
        titleAm: 'የአመራር ምላሽ ይጻፉ',
        detail: 'Log official responses to verified guest reviews and escalate serious issues to Security & Recovery.',
        detailAm: 'ለተሰጡ አስተያየቶች ምላሽ ይመዝግቡ እና አስቸኳይ ጉዳዮችን ወደ አገልግሎት ማገገሚያ ይምሩ።',
      },
    ],
    faqs: [
      {
        question: 'Are external review feeds automatically pulled live?',
        questionAm: 'ከውጭ የግምገማ ድረ-ገጾች መረጃ በቀጥታ ይመጣል?',
        answer:
          'External OTA review connectors are simulated until live partner API keys are integrated; internal post-stay feedback logs directly.',
        answerAm:
          'የውጭ ቻናል ግምገማዎች ለማሳያ ሲሆኑ የሆቴሉ የውስጥ የእንግዳ ግብረ-መልሶች በቀጥታ ይመዘገባሉ።',
      },
    ],
    relatedTabs: ['security_recovery', 'crm_spa'],
  },

  pos_cashier: {
    tabId: 'pos_cashier',
    scope: 'hotel',
    title: 'POS & Cashier Sessions',
    titleAm: 'POS እና የገንዘብ ተቀባይ ክፍለ ጊዜዎች',
    category: 'F&B, Culinary & Venues',
    categoryAm: 'ምግብና መጠጥ፣ ወጥ ቤት እና አዳራሾች',
    summary:
      'Open/close outlet cashier shifts, ring restaurant/bar/room-service tickets with automatic 15% VAT + 10% Service Charge, and settle checks or post to rooms.',
    summaryAm:
      'የገንዘብ ተቀባይ ፈረቃዎችን ይክፈቱ/ይዝጉ፣ የምግብና መጠጥ ትዕዛዞችን ከ15% VAT እና 10% አገልግሎት ክፍያ ጋር ይቁረጡ።',
    steps: [
      {
        title: 'Open a cashier shift',
        titleAm: 'የገንዘብ ተቀባይ ፈረቃ ይክፈቱ',
        detail: 'Select the F&B outlet and declare opening float in ETB before taking orders.',
        detailAm: 'ትዕዛዝ ከመቀበልዎ በፊት መሸጫውን እና የመነሻ ገንዘብ (Float) ይመዝግቡ።',
      },
      {
        title: 'Build check & apply payment',
        titleAm: 'ትዕዛዝ ዘርዝረው ክፍያ ይፈጽሙ',
        detail: 'Select menu items and settle via Cash, CBE, Telebirr, Card, or Post to Guest Room Folio.',
        detailAm: 'ምግብና መጠጦችን መርጠው በጥሬ ገንዘብ፣ ባንክ፣ ቴሌብር ወይም ወደ እንግዳ ክፍል ያዙሩ።',
      },
      {
        title: 'Close shift & reconcile drop',
        titleAm: 'ፈረቃ ይዝጉ እና ገንዘብ ያስረክቡ',
        detail: 'Verify expected cash vs. declared blind drop for Night Audit balancing.',
        detailAm: 'የተሰበሰበውን ገንዘብ ከስርዓቱ ጋር አመሳክረው ለምሽት ኦዲት ያስረክቡ።',
      },
    ],
    faqs: [
      {
        question: 'Can a POS check be posted to an occupied room?',
        questionAm: 'የPOS ሂሳብን በክፍል ውስጥ ባለ እንግዳ ስም ማስመዝገብ ይቻላል?',
        answer:
          'Yes. Select "Post to Room" and pick an active checked-in reservation to append the itemized charge directly onto their folio.',
        answerAm:
          'አዎን። "Post to Room" በመምረጥ ክፍል የያዘውን እንግዳ ሲመርጡ ሂሳቡ ወዲያውኑ ወደ Folio ይጨመራል።',
      },
    ],
    relatedTabs: ['restaurant_floor', 'front_office', 'night_audit'],
  },

  restaurant_floor: {
    tabId: 'restaurant_floor',
    scope: 'hotel',
    title: 'Dining & Wine Cellar',
    titleAm: 'ምግብ ቤት እና የወይን ማከማቻ',
    category: 'F&B, Culinary & Venues',
    categoryAm: 'ምግብና መጠጥ፣ ወጥ ቤት እና አዳራሾች',
    summary:
      'Manage dining room tables, table reservations/waitlist, seating turnover, and the Sommelier Wine Cellar bottle ledger.',
    summaryAm:
      'የምግብ ቤት ጠረጴዛዎችን፣ የተያዙ መቀመጫዎችን እና የወይን ማከማቻ (Wine Cellar) ክምችትን ያስተዳድሩ።',
    steps: [
      {
        title: 'Track live table status',
        titleAm: 'የጠረጴዛዎችን ሁኔታ ይከታተሉ',
        detail: 'Switch tables between Available, Reserved, Seated, and Dirty across dining zones.',
        detailAm: 'ጠረጴዛዎችን ነጻ፣ የተያዘ፣ እንግዳ የተቀመጠበት እና ለጽዳት ዝግጁ በማለት ያዘምኑ።',
      },
      {
        title: 'Manage Wine Cellar stock',
        titleAm: 'የወይን ማከማቻ ክምችትን ይከታተሉ',
        detail: 'Monitor vintage stock levels, bottle selling prices in ETB, and par replenishment.',
        detailAm: 'የወይን ጠርሙሶችን ብዛት፣ የሽያጭ ዋጋ እና መሙያ መጠን ይመዝግቡ።',
      },
    ],
    faqs: [
      {
        question: 'Are Dining reservations linked to Front Desk guests?',
        questionAm: 'የምግብ ቤት ቦታ ማስያዝ ከክፍል እንግዶች ጋር ይገናኛል?',
        answer:
          'You can note room numbers on table bookings to coordinate VIP dining preferences with Front Office.',
        answerAm:
          'ለVIP አገልግሎት የእንግዳውን የክፍል ቁጥር በጠረጴዛ ምዝገባው ላይ መጨመር ይቻላል።',
      },
    ],
    relatedTabs: ['pos_cashier', 'recipes_menu', 'inventory'],
  },

  recipes_menu: {
    tabId: 'recipes_menu',
    scope: 'hotel',
    title: 'Recipe & Menu Matrix',
    titleAm: 'የምግብ አዘገጃጀት እና ሜኑ ማትሪክስ',
    category: 'F&B, Culinary & Venues',
    categoryAm: 'ምግብና መጠጥ፣ ወጥ ቤት እና አዳራሾች',
    summary:
      'Calculate standardized recipe portion costs, usable yield percentages, target food-cost margins, menu engineering quadrants, and kitchen variance.',
    summaryAm:
      'የእያንዳንዱን ምግብ የጥሬ ዕቃ ወጪ፣ የአጠቃቀም ውጤታማነት መቶኛ፣ የሜኑ ትርፋማነት እና የወጥ ቤት ልዩነትን ያስሉ።',
    steps: [
      {
        title: 'Build standardized recipe cards',
        titleAm: 'የምግብ አዘገጃጀት ካርዶችን ይፍጠሩ',
        detail: 'List ingredient quantities, unit costs in ETB, and realistic usable yield % to compute plate cost.',
        detailAm: 'የጥሬ ዕቃ መጠን፣ የብር ዋጋ እና ትክክለኛ የውጤት መቶኛ በማስገባት የአንድ ምግብ ወጪን ያስሉ።',
      },
      {
        title: 'Classify menu engineering mix',
        titleAm: 'የሜኑ አፈጻጸምን ይመድቡ',
        detail: 'Identify Stars, Plowhorses, Puzzles, and Dogs based on popularity vs. contribution margin.',
        detailAm: 'በተፈላጊነት እና በትርፍ ህዳግ ላይ በመመስረት ምግቦችን በሜኑ ማትሪክስ ይገምግሙ።',
      },
    ],
    faqs: [
      {
        question: 'Why does usable yield matter in recipe costing?',
        questionAm: 'የውጤት መቶኛ (Usable Yield) በወጪ ስሌት ውስጥ ለምን አስፈላጊ ነው?',
        answer:
          'Trimming and cooking losses increase effective ingredient cost per served portion; realistic yield % ensures menu prices protect margins.',
        answerAm:
          'በዝግጅት እና ማብሰል ወቅት የሚቀንሰው መጠን ትክክለኛውን የሰሃን ወጪ ስለሚጨምር ትርፋማ ዋጋ ለመወሰን ይረዳል።',
      },
    ],
    relatedTabs: ['pos_cashier', 'inventory', 'haccp_safety'],
  },

  events: {
    tabId: 'events',
    scope: 'hotel',
    title: 'Conferences & Events',
    titleAm: 'ስብሰባዎች እና ዝግጅቶች',
    category: 'F&B, Culinary & Venues',
    categoryAm: 'ምግብና መጠጥ፣ ወጥ ቤት እና አዳራሾች',
    summary:
      'Book ballrooms and meeting spaces, generate Banquet Event Orders (BEOs), track setup styles (Theater, Classroom, U-Shape), and manage deposits.',
    summaryAm:
      'የስብሰባ አዳራሾችን ይመዝግቡ፣ የዝግጅት ትዕዛዞችን (BEO) ያዘጋጁ እና የቅድሚያ ክፍያዎችን ይከታተሉ።',
    steps: [
      {
        title: 'Check hall availability',
        titleAm: 'የአዳራሽ መገኘትን ያረጋግጡ',
        detail: 'Select venue capacity and seating configuration (Theater, Banquet, Boardroom, Classroom).',
        detailAm: 'የአዳራሹን አቅም እና የመቀመጫ አቀማመጥ ይምረጡ።',
      },
      {
        title: 'Issue Banquet Event Order (BEO)',
        titleAm: 'የBEO ትዕዛዝ ይፍጠሩ',
        detail: 'Itemize AV equipment, coffee breaks, lunch buffets, and rental charges in ETB.',
        detailAm: 'የድምጽ/ምስል መሳሪያዎችን፣ የሻይ እረፍት፣ ምሳ እና የአዳራሽ ኪራይ ዋጋ ይዘርዝሩ።',
      },
    ],
    faqs: [
      {
        question: 'Can corporate events be billed to City Ledger?',
        questionAm: 'የስብሰባ ወጪዎችን ወደ ድርጅት ሂሳብ (City Ledger) ማዞር ይቻላል?',
        answer:
          'Yes. Confirmed corporate banquet invoices can be tracked as receivables in City Ledger & AR.',
        answerAm:
          'አዎን። የተረጋገጡ የድርጅት ዝግጅት ሂሳቦች በCity Ledger እና AR ውስጥ ይከታተላሉ።',
      },
    ],
    relatedTabs: ['group_blocks', 'city_ledger', 'financial_management'],
  },

  financial_management: {
    tabId: 'financial_management',
    scope: 'hotel',
    title: 'Financial Management',
    titleAm: 'የፋይናንስ አስተዳደር',
    category: 'Finance, Audit & Revenue',
    categoryAm: 'ፋይናንስ፣ ኦዲት እና ገቢ',
    summary:
      'Process multi-stage purchase requisitions (Dept Head → Finance → GM) with ETB limits, review Daily Flash Reports, and perform bank reconciliations.',
    summaryAm:
      'የግዥ ጥያቄዎችን በብር ገደብ ማጽደቅ፣ ዕለታዊ የፋይናንስ ሪፖርቶችን መገምገም እና የባንክ ሂሳብ ማስታረቅን ያከናውኑ።',
    steps: [
      {
        title: 'Submit or approve requisitions',
        titleAm: 'የግዥ ጥያቄዎችን ያስገቡ ወይም ያጽድቁ',
        detail: 'Requests route automatically based on department and ETB threshold configured in Financial Rules.',
        detailAm: 'ጥያቄዎች በክፍል እና በፋይናንስ ሕጎች በተቀመጠው የብር ገደብ መሰረት ወደ ማጽደቂያ ይላካሉ።',
      },
      {
        title: 'Inspect Daily Flash & Bank Rec',
        titleAm: 'ዕለታዊ ሪፖርት እና የባንክ ማስታረቅ ይስሩ',
        detail: 'Match POS/Front Desk collections against CBE, Telebirr, and card merchant settlements.',
        detailAm: 'የተሰበሰበውን ገቢ ከCBE፣ ቴሌብር እና የካርድ ክፍያዎች ጋር ያመሳክሩ።',
      },
    ],
    faqs: [
      {
        question: 'What are the ETB approval thresholds?',
        questionAm: 'የብር ማጽደቂያ ገደቦች እንዴት ይሰራሉ?',
        answer:
          'Thresholds convert and store in ETB inside Financial Rules & Limits so Department Head, Finance Manager, and GM sign-offs match local policy.',
        answerAm:
          'ገደቦች በፋይናንስ ሕጎች ውስጥ በብር ተቀምጠዋል፤ በመጠኑ መሰረት ከክፍል ኃላፊ እስከ GM ማጽደቂያ ያልፋሉ።',
      },
    ],
    relatedTabs: ['financial_rules', 'procurement', 'city_ledger', 'night_audit'],
  },

  city_ledger: {
    tabId: 'city_ledger',
    scope: 'hotel',
    title: 'City Ledger & AR',
    titleAm: 'የድርጅት ሂሳብ እና ተሰብሳቢ',
    category: 'Finance, Audit & Revenue',
    categoryAm: 'ፋይናንስ፣ ኦዲት እና ገቢ',
    summary:
      'Manage corporate/NGO/embassy credit accounts, aging buckets (0–30, 31–60, 61–90+ days), direct-bill invoices, partial settlements, and travel agency commissions.',
    summaryAm:
      'የድርጅቶች፣ መንግስታዊ ያልሆኑ ድርጅቶች እና ኤምባሲዎች የብድር ሂሳቦችን፣ የክፍያ ጊዜ ገደቦችን እና የኤጀንሲ ኮሚሽኖችን ያስተዳድሩ።',
    steps: [
      {
        title: 'Approve corporate credit limits',
        titleAm: 'የድርጅት የብድር ገደብ ያጽድቁ',
        detail: 'Verify credit terms and ETB ceilings before allowing Front Desk direct-bill folio transfers.',
        detailAm: 'ፊት ቢሮ ሂሳብ ከማዘዋወሩ በፊት የድርጅቱን የብድር ገደብ ያረጋግጡ።',
      },
      {
        title: 'Record payments & settle commissions',
        titleAm: 'ክፍያዎችን እና ኮሚሽኖችን ይመዝግቡ',
        detail: 'Apply incoming corporate bank transfers against open invoices and release verified travel agent commissions.',
        detailAm: 'የገቡ የባንክ ክፍያዎችን ከደረሰኞች ጋር ያመሳክሩ እና የኤጀንሲ ኮሚሽን ይክፈሉ።',
      },
    ],
    faqs: [
      {
        question: 'How do Front Desk folios move to City Ledger?',
        questionAm: 'የእንግዳ ሂሳቦች ወደ City Ledger እንዴት ይዘዋወራሉ?',
        answer:
          'Select an approved corporate account during guest check-out settlement in Front Desk & Folios to generate an open City Ledger invoice.',
        answerAm:
          'እንግዳ በሚወጣበት ጊዜ በፊት ቢሮ ውስጥ የድርጅቱን የብድር መለያ በመምረጥ ሂሳቡን ወደ City Ledger ማዘዋወር ይቻላል።',
      },
    ],
    relatedTabs: ['front_office', 'financial_management', 'group_blocks'],
  },

  night_audit: {
    tabId: 'night_audit',
    scope: 'hotel',
    title: 'Night Audit & EOD',
    titleAm: 'የምሽት ኦዲት እና የቀን መዝጊያ',
    category: 'Finance, Audit & Revenue',
    categoryAm: 'ፋይናንስ፣ ኦዲት እና ገቢ',
    summary:
      'Verify cashier drops, resolve high-balance folio alerts, post daily room & tax charges across occupied rooms, and roll the hotel business date forward.',
    summaryAm:
      'የገንዘብ ተቀባይ ርክክቦችን፣ ከፍተኛ ቀሪ ሂሳቦችን እና ዕለታዊ የክፍል ኪራይ ቻርጆችን አረጋግጠው የሆቴሉን የሥራ ቀን ይዝጉ።',
    steps: [
      {
        title: 'Clear pre-audit blockers',
        titleAm: 'ቅድመ-ኦዲት ማንቂያዎችን ይፍቱ',
        detail: 'Verify pending cashier shift drops and acknowledge any guest folios exceeding credit limits.',
        detailAm: 'ያልተረጋገጡ የገንዘብ ተቀባይ ርክክቦችን እና ከብድር ገደብ ያለፉ የእንግዳ ሂሳቦችን ይፍቱ።',
      },
      {
        title: 'Run End-of-Day & Rate Roll',
        titleAm: 'የቀን መዝጊያ እና ዋጋ መሙላትን ያስኪዱ',
        detail: 'Post nightly room rate + 15% VAT + 10% Service Charge and advance the active business date by 1 day.',
        detailAm: 'የሌሊት ክፍል ዋጋ ከ15% VAT እና 10% አገልግሎት ክፍያ ጋር አስገብተው የሥራ ቀኑን ወደ ቀጣይ ቀን ያሳድጉ።',
      },
    ],
    faqs: [
      {
        question: 'Can the business date roll if cashier shifts remain unverified?',
        questionAm: 'የገንዘብ ተቀባይ ፈረቃዎች ሳይዘጉ ቀኑን መዝጋት ይቻላል?',
        answer:
          'All open drops should be balanced first so the Night Audit Journal accurately locks daily revenue totals.',
        answerAm:
          'ዕለታዊ የገቢ መዝገቡ ትክክለኛ እንዲሆን በመጀመሪያ ሁሉም የገንዘብ ተቀባይ ፈረቃዎች መመሳከር አለባቸው።',
      },
    ],
    relatedTabs: ['front_office', 'pos_cashier', 'financial_management'],
  },

  channel_manager: {
    tabId: 'channel_manager',
    scope: 'hotel',
    title: 'CRS & Yield Management',
    titleAm: 'CRS እና የዋጋ አስተዳደር',
    category: 'Finance, Audit & Revenue',
    categoryAm: 'ፋይናንስ፣ ኦዲት እና ገቢ',
    summary:
      'Manage OTA channel connections, rate parity checks, dynamic yield pricing multipliers, rate plans, and direct web booking requests.',
    summaryAm:
      'የOTA ቻናል ግንኙነቶችን፣ የዋጋ እኩልነት (Rate Parity) ቁጥጥርን፣ ተለዋዋጭ የዋጋ ሕጎችን እና ቀጥተኛ የድረ-ገጽ ቦታ ማስያዣዎችን ያስተዳድሩ።',
    steps: [
      {
        title: 'Monitor rate parity & channels',
        titleAm: 'የቻናል ዋጋ እኩልነትን ይከታተሉ',
        detail: 'Check parity variance across connected OTA channels (marked Sample/Simulated until live channel API keys are wired).',
        detailAm: 'በተገናኙ የOTA ቻናሎች መካከል ያለውን የዋጋ ልዩነት ይፈትሹ።',
      },
      {
        title: 'Adjust yield rules & direct requests',
        titleAm: 'የዋጋ ሕጎችን እና ቀጥተኛ ጥያቄዎችን ያስተካክሉ',
        detail: 'Enable occupancy-triggered rate rules and convert incoming direct web inquiries into confirmed reservations.',
        detailAm: 'በክፍል ሙሌት መጠን የሚቀየሩ የዋጋ ሕጎችን ያብሩ እና ቀጥተኛ ጥያቄዎችን ያረጋግጡ።',
      },
    ],
    faqs: [
      {
        question: 'Are live third-party OTAs currently pushing real bookings?',
        questionAm: 'ውጫዊ የOTA ቻናሎች በቀጥታ እውነተኛ ቦታ ማስያዝ ያመጣሉ?',
        answer:
          'External OTA channel connectors are flagged as Integration/Simulated until partner XML/API credentials are configured.',
        answerAm:
          'የውጭ OTA ግንኙነቶች የAPI ቁልፍ እስኪገባ ድረስ ለማሳያ/ውህደት ዝግጁ ተብለው ተለይተዋል።',
      },
    ],
    relatedTabs: ['front_office', 'rooms', 'reporting_bi'],
  },

  reporting_bi: {
    tabId: 'reporting_bi',
    scope: 'hotel',
    title: 'Executive BI & Vault',
    titleAm: 'አስፈጻሚ BI እና ማህደር',
    category: 'Finance, Audit & Revenue',
    categoryAm: 'ፋይናንስ፣ ኦዲት እና ገቢ',
    summary:
      'Analyze multi-month performance trends, department contribution margins, channel distribution, KPI targets, and export structured CSV/report packages.',
    summaryAm:
      'የወራት አፈጻጸም አዝማሚያዎችን፣ የክፍል አስተዋጽኦን፣ የሽያጭ ቻናሎችን እና የKPI ግቦችን በመመልከት ሪፖርቶችን ያውጡ።',
    steps: [
      {
        title: 'Benchmark against KPI targets',
        titleAm: 'ከKPI ግቦች ጋር ያነጻጽሩ',
        detail: 'Compare actual occupancy, ADR, F&B capture, and GOP % against monthly targets.',
        detailAm: 'ትክክለኛውን ሙሌት፣ ADR እና የትርፍ መቶኛ ከወርሃዊ ግብ ጋር ያወዳድሩ።',
      },
      {
        title: 'Generate Export Vault jobs',
        titleAm: 'የሪፖርት ማውጫ ስራዎችን ያስኪዱ',
        detail: 'Download CSV packs for executive board packets or statutory review.',
        detailAm: 'ለቦርድ ስብሰባ ወይም ለኦዲት የሚሆኑ CSV ሪፖርቶችን ያውርዱ።',
      },
    ],
    faqs: [
      {
        question: 'Do exported numbers reflect only my active hotel?',
        questionAm: 'የሚወርዱት ሪፖርቶች የኔን ሆቴል ብቻ ይይዛሉ?',
        answer:
          'Yes. Every BI chart and export job is strictly scoped to the active property.',
        answerAm:
          'አዎን። ሁሉም የBI ግራፎች እና የሚወርዱ ሪፖርቶች በተመረጠው ሆቴል ብቻ የተገደቡ ናቸው።',
      },
    ],
    relatedTabs: ['hotel_dashboard', 'financial_management', 'night_audit'],
  },

  inventory: {
    tabId: 'inventory',
    scope: 'hotel',
    title: 'Stores & Inventory',
    titleAm: 'ዕቃ ግምጃ ቤት እና ክምችት',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Control Main Store, Beverage Cellar, and Housekeeping storerooms with Goods Received Vouchers (GRV), Store Issue Vouchers (SIV), and stock adjustments.',
    summaryAm:
      'ዋና ግምጃ ቤትን፣ የመጠጥ ማከማቻን እና የጽዳት ዕቃዎችን በGRV (መቀበያ) እና SIV (መውጫ) ደረሰኞች ይቆጣጠሩ።',
    steps: [
      {
        title: 'Post Goods Received (GRV)',
        titleAm: 'የገቡ ዕቃዎችን (GRV) ይመዝግቡ',
        detail: 'Receive supplier deliveries into specific store locations and update weighted unit costs.',
        detailAm: 'ከአቅራቢ የመጡ ዕቃዎችን ወደ ተገቢው ግምጃ ቤት በማስገባት የዕቃ ክምችት ያሳድጉ።',
      },
      {
        title: 'Issue to departments (SIV)',
        titleAm: 'ለክፍሎች ዕቃ ያውጡ (SIV)',
        detail: 'Record departmental requisitions leaving the store and trigger alerts when items drop below reorder point.',
        detailAm: 'ለወጥ ቤት ወይም ጽዳት የሚወጡ ዕቃዎችን በSIV በመመዝገብ ዝቅተኛ ክምችትን ይከታተሉ።',
      },
    ],
    faqs: [
      {
        question: 'How do GRVs connect to Procurement?',
        questionAm: 'GRV ከግዥ ትዕዛዝ (PO) ጋር እንዴት ይገናኛል?',
        answer:
          'Received GRVs pair with approved Purchase Orders and supplier invoices during 3-way matching in Supply Chain & POs.',
        answerAm:
          'የተመዘገቡ GRVዎች በአቅርቦት ሰንሰለት ውስጥ ከግዥ ትዕዛዝ (PO) እና ከፋክቱር ጋር በ3-መንገድ ማመሳከሪያ ይጣመራሉ።',
      },
    ],
    relatedTabs: ['procurement', 'recipes_menu', 'financial_management'],
  },

  procurement: {
    tabId: 'procurement',
    scope: 'hotel',
    title: 'Supply Chain & POs',
    titleAm: 'አቅርቦት ሰንሰለት እና የግዥ ትዕዛዞች',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Manage approved vendor registry, issue Purchase Orders (POs), and run 3-Way Invoice Matching (PO vs. GRV vs. Supplier Invoice).',
    summaryAm:
      'የተፈቀዱ አቅራቢዎችን፣ የግዥ ትዕዛዞችን (PO) እና የ3-መንገድ ደረሰኝ ማመሳከሪያን (PO፣ GRV እና ፋክቱር) ያስተዳድሩ።',
    steps: [
      {
        title: 'Maintain vendor directory',
        titleAm: 'የአቅራቢዎችን ማውጫ ያስተዳድሩ',
        detail: 'Store supplier TIN numbers, categories, lead times, and payment terms.',
        detailAm: 'የአቅራቢዎችን TIN ቁጥር፣ የአቅርቦት ዘርፍ እና የክፍያ ጊዜ ይመዝግቡ።',
      },
      {
        title: 'Issue PO & complete 3-way match',
        titleAm: 'PO አውጥተው 3-መንገድ ማመሳከሪያ ይስሩ',
        detail: 'Verify ordered quantity/price against physical GRV delivery and vendor invoice before Finance payout.',
        detailAm: 'ክፍያ ከመፈጸሙ በፊት PO፣ GRV እና የአቅራቢውን ፋክቱር ያመሳክሩ።',
      },
    ],
    faqs: [
      {
        question: 'What happens if a supplier invoice exceeds the PO price?',
        questionAm: 'የአቅራቢው ፋክቱር ከPO ዋጋ በላይ ከሆነ ምን ይሆናል?',
        answer:
          'The 3-way match flags a price or quantity variance requiring Finance Manager investigation before payment clearance.',
        answerAm:
          'የ3-መንገድ ማመሳከሪያው ልዩነቱን በማሳየት ክፍያ ከመጽደቁ በፊት በፋይናንስ እንዲጣራ ያደርጋል።',
      },
    ],
    relatedTabs: ['inventory', 'financial_management'],
  },

  laundry: {
    tabId: 'laundry',
    scope: 'hotel',
    title: 'Laundry & Linen',
    titleAm: 'ልብስ ማጠቢያ እና ሊነን',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Track linen par stock across rooms and floors, log commercial washer/dryer cycles, and fulfill express guest valet laundry tickets.',
    summaryAm:
      'የአንሶላ እና ፎጣ ክምችትን (Par)፣ የማጠቢያ ዙሮችን እና የእንግዳ ልብስ ማጠብ ትዕዛዞችን ይከታተሉ።',
    steps: [
      {
        title: 'Monitor linen par levels',
        titleAm: 'የሊነን መጠን (Par) ይከታተሉ',
        detail: 'Compare clean shelf stock, in-wash loads, and discarded/damaged items against target par.',
        detailAm: 'ንጹህ ክምችትን፣ በማጠቢያ ላይ ያሉትን እና የተጎዱ ጨርቆችን ከሚፈለገው መጠን ጋር ያወዳድሩ።',
      },
      {
        title: 'Process guest laundry orders',
        titleAm: 'የእንግዳ ልብስ ትዕዛዞችን ያስተናግዱ',
        detail: 'Log room number, garment count, wash/dry-clean program, and post charges to the guest folio.',
        detailAm: 'የክፍል ቁጥር፣ የልብስ ብዛት እና አገልግሎት ዓይነት መዝግበው ወደ እንግዳ ሂሳብ ይላኩ።',
      },
    ],
    faqs: [
      {
        question: 'Why track wash loads and chemical cycles?',
        questionAm: 'የማጠቢያ ዙሮችን መመዝገብ ለምን ያስፈልጋል?',
        answer:
          'Tracking load weights and linen re-washes exposes excessive water/detergent consumption and linen life loss.',
        answerAm:
          'የማጠቢያ ዙሮችን መከታተል የውሃና ሳሙና ብክነትን እና የሊነን ዕድሜ መቀነስን ለመቆጣጠር ይረዳል።',
      },
    ],
    relatedTabs: ['housekeeping', 'front_office', 'sustainability'],
  },

  maintenance: {
    tabId: 'maintenance',
    scope: 'hotel',
    title: 'Engineering & Assets',
    titleAm: 'ኢንጂነሪንግ እና ንብረቶች',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Manage the property asset register, corrective maintenance work orders, generator/HVAC/chiller Preventive Maintenance (PPM) schedules, and OOO room clearances.',
    summaryAm:
      'የንብረት መዝገብን፣ የጥገና ትዕዛዞችን፣ የመከላከያ ጥገና (PPM) መርሐግብሮችን እና የክፍል ጥገና ማጠናቀቂያን ያስተዳድሩ።',
    steps: [
      {
        title: 'Triage reactive work orders',
        titleAm: 'አስቸኳይ የጥገና ትዕዛዞችን ይመድቡ',
        detail: 'Filter Open work orders by Critical/High priority and assign technicians with spare-part costs.',
        detailAm: 'ክፍት የጥገና ትዕዛዞችን በአስቸኳይነት ደረጃ ለይተው ለቴክኒሻኖች ይመድቡ።',
      },
      {
        title: 'Execute PPM inspections',
        titleAm: 'የመከላከያ ጥገና (PPM) ያካሂዱ',
        detail: 'Complete scheduled checks on boilers, standby generators, elevators, and water pumps to prevent downtime.',
        detailAm: 'በጄነሬተሮች፣ ቦይለሮች እና ፓምፖች ላይ ወቅታዊ ፍተሻ ያድርጉ።',
      },
    ],
    faqs: [
      {
        question: 'Does closing a room work order automatically notify Housekeeping?',
        questionAm: 'የክፍል ጥገና ሲጠናቀቅ የጽዳት ክፍል ያውቀዋል?',
        answer:
          'Once Engineering resolves a defect, Housekeeping can clean, inspect, and clear the room back to Vacant Clean for Front Desk.',
        answerAm:
          'ጥገናው ሲጠናቀቅ የቤት አያያዝ ክፍሉን አጽድቶና መርምሮ ለፊት ቢሮ ዝግጁ ያደርገዋል።',
      },
    ],
    relatedTabs: ['housekeeping', 'energy_iot', 'rooms'],
  },

  energy_iot: {
    tabId: 'energy_iot',
    scope: 'hotel',
    title: 'Energy & Room IoT',
    titleAm: 'ኢነርጂ እና ዘመናዊ ክፍል IoT',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Monitor room HVAC occupancy thermostats, keycard energy-saving policies, and departmental electrical/water submeters.',
    summaryAm:
      'የክፍል አየር ማቀዝቀዣ (HVAC) ቁጥጥርን፣ የኃይል ቆጣቢ ሕጎችን እና የመለኪያ ንባቦችን ይከታተሉ።',
    steps: [
      {
        title: 'Check room occupancy vs. HVAC state',
        titleAm: 'የክፍል ሁኔታን እና HVAC ያመሳክሩ',
        detail: 'Spot unoccupied rooms still running full cooling/heating and toggle eco setback policies.',
        detailAm: 'ሰው የሌለባቸው ክፍሎች ያለአግባብ ኃይል እንዳይበሉ Eco setback ያብሩ።',
      },
      {
        title: 'Review submeter zones',
        titleAm: 'የንዑስ መለኪያ ዞኖችን ይመልከቱ',
        detail: 'Compare kitchen, laundry, and guest-wing kWh consumption anomalies.',
        detailAm: 'የወጥ ቤት፣ ማጠቢያ እና የክፍሎችን የኤሌክትሪክ አጠቃቀም ያነጻጽሩ።',
      },
    ],
    faqs: [
      {
        question: 'Are live BMS/Zigbee hardware controllers connected?',
        questionAm: 'ቀጥተኛ የBMS/IoT ሃርድዌር መቆጣጠሪያዎች ተገናኝተዋል?',
        answer:
          'Room IoT telemetry is simulated unless paired with your hotel’s physical BMS/GRMS gateway API.',
        answerAm:
          'የክፍል IoT መረጃ ከሆቴሉ አካላዊ የBMS መቆጣጠሪያ ጋር እስኪገናኝ ድረስ ለማሳያ/ሲሙሌሽን የተዘጋጀ ነው።',
      },
    ],
    relatedTabs: ['maintenance', 'sustainability'],
  },

  sustainability: {
    tabId: 'sustainability',
    scope: 'hotel',
    title: 'Green Hospitality',
    titleAm: 'አረንጓዴ መስተንግዶ',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Log utility consumption (kWh, m³, diesel), kitchen food-waste weights, guest linen-reuse opt-ins, and Green Key audit readiness.',
    summaryAm:
      'የመብራት፣ ውሃ እና ናፍጣ አጠቃቀምን፣ የወጥ ቤት ምግብ ብክነትን እና የአካባቢ ጥበቃ ኦዲት መለኪያዎችን ይመዝግቡ።',
    steps: [
      {
        title: 'Record utility & waste logs',
        titleAm: 'የኃይል እና የብክነት መዝገብ ያስገቡ',
        detail: 'Enter daily or weekly meter readings and track composted vs. landfill kitchen trim.',
        detailAm: 'ዕለታዊ/ሳምንታዊ የመለኪያ ንባቦችን እና የምግብ ብክነት መጠንን ይመዝግቡ።',
      },
      {
        title: 'Track Green Key audit checklist',
        titleAm: 'የአካባቢ ጥበቃ ኦዲት ዝርዝርን ይከታተሉ',
        detail: 'Monitor eco opt-in participation and close open sustainability compliance items.',
        detailAm: 'ያልተሟሉ የአረንጓዴ መስተንግዶ መስፈርቶችን አረጋግጠው ይዝጉ።',
      },
    ],
    faqs: [
      {
        question: 'Why log diesel generator hours alongside grid power?',
        questionAm: 'የናፍጣ ጄነሬተር አጠቃቀምን ከመብራት ጋር መመዝገብ ለምን ይጠቅማል?',
        answer:
          'Tracking backup generator fuel consumption isolates power-outage operating costs and carbon footprint per occupied room.',
        answerAm:
          'የመጠባበቂያ ጄነሬተር ነዳጅ መመዝገብ በመብራት መቆራረጥ ምክንያት የሚወጣውን ወጪ በትክክል ለማወቅ ይረዳል።',
      },
    ],
    relatedTabs: ['energy_iot', 'laundry', 'maintenance'],
  },

  haccp_safety: {
    tabId: 'haccp_safety',
    scope: 'hotel',
    title: 'Food Safety & Pool',
    titleAm: 'የምግብ ደህንነት እና መዋኛ',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Record HACCP cold-room/freezer/hot-holding temperatures, swimming pool chlorine & pH tests, and kitchen hygiene checklists.',
    summaryAm:
      'የHACCP የማቀዝቀዣ እና ምግብ ሙቀት መዝገቦችን፣ የመዋኛ ገንዳ ክሎሪን/pH ፍተሻዎችን እና የንጽህና ቁጥጥሮችን ያከናውኑ።',
    steps: [
      {
        title: 'Log shift HACCP temperatures',
        titleAm: 'የፈረቃ HACCP ሙቀት ይመዝግቡ',
        detail: 'Record chiller, freezer, receiving, and buffet temperatures; out-of-range readings trigger corrective action alerts.',
        detailAm: 'የማቀዝቀዣ እና የምግብ ሙቀቶችን ይመዝግቡ፤ ከተፈቀደው ገደብ ውጭ ሲሆን የማስተካከያ እርምጃ ይወሰዳል።',
      },
      {
        title: 'Test pool & spa water',
        titleAm: 'የመዋኛ ውሃ ጥራት ይፈትሹ',
        detail: 'Log pH, free chlorine ppm, and temperature before daily guest opening.',
        detailAm: 'መዋኛው ለእንግዶች ከመከፈቱ በፊት pH፣ ክሎሪን እና ሙቀት ይመዝግቡ።',
      },
    ],
    faqs: [
      {
        question: 'Are Bluetooth probe sensors automatically synced?',
        questionAm: 'የብሉቱዝ ሙቀት መለኪያዎች በቀጥታ ይገባሉ?',
        answer:
          'Manual shift logging works directly; automated IoT probe hardware requires external sensor integration.',
        answerAm:
          'ሰራተኞች በየፈረቃው መመዝገብ ይችላሉ፤ ቀጥተኛ የሴንሰር መረጃ ከውጭ መሳሪያ ጋር ሲገናኝ ይሰራል።',
      },
    ],
    relatedTabs: ['recipes_menu', 'maintenance'],
  },

  valet_parking: {
    tabId: 'valet_parking',
    scope: 'hotel',
    title: 'Valet & EV Parking',
    titleAm: 'ቫሌት እና የEV ማቆሚያ',
    category: 'Stores, Supply & Facilities',
    categoryAm: 'ግምጃ ቤት፣ አቅርቦት እና መገልገያዎች',
    summary:
      'Control parking bay occupancy, issue digital valet car-claim tickets, and monitor EV charger sessions and kWh billing.',
    summaryAm:
      'የመኪና ማቆሚያ ቦታዎችን፣ የቫሌት ቲኬቶችን እና የኤሌክትሪክ መኪና ቻርጅ ክፍለ ጊዜዎችን ይቆጣጠሩ።',
    steps: [
      {
        title: 'Issue valet ticket on arrival',
        titleAm: 'መኪና ሲገባ የቫሌት ቲኬት ይስጡ',
        detail: 'Record vehicle plate, bay assignment, guest name/room, and pre-existing exterior notes.',
        detailAm: 'የሰሌዳ ቁጥር፣ የተመደበ ቦታ እና የእንግዳ ስም/ክፍል ይመዝግቡ።',
      },
      {
        title: 'Track EV charging sessions',
        titleAm: 'የEV ቻርጅ ክፍለ ጊዜዎችን ይከታተሉ',
        detail: 'Monitor kWh delivered and post charging fees in ETB to guest folios or direct cashier.',
        detailAm: 'የተጠቀሙትን ኪሎዋት (kWh) መዝግበው ክፍያውን ወደ እንግዳ ሂሳብ ያስገቡ።',
      },
    ],
    faqs: [
      {
        question: 'Can VIP and conference arrivals reserve dedicated bays?',
        questionAm: 'ለVIP እና የስብሰባ እንግዶች ልዩ የማቆሚያ ቦታ መያዝ ይቻላል?',
        answer:
          'Yes. Parking bays can be reserved or marked VIP/EV across basement and surface lots.',
        answerAm:
          'አዎን። የማቆሚያ ቦታዎችን ለVIP፣ ለEV ወይም ለዝግጅት እንግዶች መመደብ ይቻላል።',
      },
    ],
    relatedTabs: ['concierge_fleet', 'security_recovery'],
  },

  human_resources: {
    tabId: 'human_resources',
    scope: 'hotel',
    title: 'HR, Rosters & Payroll',
    titleAm: 'የሰው ኃይል፣ ፈረቃ እና ደመወዝ',
    category: 'Workforce, Safety & Dispatch',
    categoryAm: 'የሰው ኃይል፣ ደህንነት እና ስርጭት',
    summary:
      'Schedule departmental shift rosters, log attendance and leave requests, distribute hotel service-charge pools, and run Ethiopian payroll calculations (tax + 7%/11% pension).',
    summaryAm:
      'የሰራተኞች የፈረቃ መርሐግብር፣ መገኘት፣ የእረፍት ጥያቄ እና የኢትዮጵያ ደመወዝ (የገቢ ግብር እና 7%/11% ጡረታ) ስሌት ያከናውኑ።',
    steps: [
      {
        title: 'Manage shift rosters & leave',
        titleAm: 'የፈረቃ ሰንጠረዥ እና እረፍት ያስተዳድሩ',
        detail: 'Assign Morning, Afternoon, and Night shifts and approve pending annual or sick leave requests.',
        detailAm: 'የጠዋት፣ የከሰዓት እና የምሽት ፈረቃዎችን ይመድቡ እንዲሁም የእረፍት ጥያቄዎችን ያጽድቁ።',
      },
      {
        title: 'Run payroll & verify outputs',
        titleAm: 'ደመወዝ አስልተው ያረጋግጡ',
        detail: 'Compute gross pay, service charge share, progressive income tax, and 7% employee / 11% employer pension—always verify with an accountant before bank disbursement.',
        detailAm: 'ጠቅላላ ደመወዝ፣ የአገልግሎት ክፍያ፣ የገቢ ግብር እና 7%/11% ጡረታ ያስሉ፤ ከክፍያ በፊት በሂሳብ ባለሙያ ያረጋግጡ።',
      },
    ],
    faqs: [
      {
        question: 'Where are Ethiopian payroll tax and pension rates configured?',
        questionAm: 'የኢትዮጵያ የደመወዝ ግብር እና ጡረታ መለኪያዎች የት ይገኛሉ?',
        answer:
          'Rates live centrally in the tax & payroll configuration module and must be reviewed by a certified accountant before statutory remittance.',
        answerAm:
          'መለኪያዎቹ በተማከለው የግብርና ደመወዝ ማዋቀሪያ ውስጥ የሚገኙ ሲሆን ከመደበኛ ክፍያ በፊት በሂሳብ ባለሙያ መረጋገጥ አለባቸው።',
      },
    ],
    relatedTabs: ['employees', 'financial_rules', 'staff_dispatch'],
  },

  staff_dispatch: {
    tabId: 'staff_dispatch',
    scope: 'hotel',
    title: 'Staff Tasks & Handover',
    titleAm: 'የሰራተኞች ተግባራት እና ርክክብ',
    category: 'Workforce, Safety & Dispatch',
    categoryAm: 'የሰው ኃይል፣ ደህንነት እና ስርጭት',
    summary:
      'Maintain the Manager-on-Duty (MOD) shift handover logbook, dispatch rapid cross-department tasks, and issue urgent staff broadcast alerts.',
    summaryAm:
      'የMOD የፈረቃ ርክክብ መዝገብን፣ ፈጣን የክፍሎች ተግባር ስርጭትን እና አስቸኳይ የሰራተኞች ማሳወቂያዎችን ያስተዳድሩ።',
    steps: [
      {
        title: 'Log shift handover notes',
        titleAm: 'የፈረቃ ርክክብ ማስታወሻ ይመዝግቡ',
        detail: 'Record VIP arrivals, unresolved guest requests, and equipment warnings for the incoming shift.',
        detailAm: 'ለቀጣዩ ፈረቃ አስፈላጊ የሆኑ የVIP መረጃዎችን እና ያልተፈቱ ጉዳዮችን ይመዝግቡ።',
      },
      {
        title: 'Dispatch & close rapid tasks',
        titleAm: 'ፈጣን ተግባራትን ያሰራጩ እና ይዝጉ',
        detail: 'Assign timed tasks to Front Office, Housekeeping, Engineering, or Security and track completion.',
        detailAm: 'በሰዓት የተገደቡ ተግባራትን ለተለያዩ ክፍሎች በመላክ አፈጻጸማቸውን ይከታተሉ።',
      },
    ],
    faqs: [
      {
        question: 'Who should write in the MOD handover logbook?',
        questionAm: 'በMOD የርክክብ መዝገብ ውስጥ ማን መጻፍ አለበት?',
        answer:
          'Outgoing shift supervisors, department heads, and Duty Managers at every shift change.',
        answerAm:
          'በእያንዳንዱ የፈረቃ ለውጥ ጊዜ የፈረቃ ተቆጣጣሪዎች፣ የክፍል ኃላፊዎች እና Duty Managers መጻፍ አለባቸው።',
      },
    ],
    relatedTabs: ['human_resources', 'security_recovery', 'housekeeping'],
  },

  security_recovery: {
    tabId: 'security_recovery',
    scope: 'hotel',
    title: 'Security & Recovery',
    titleAm: 'ደህንነት እና አገልግሎት ማገገሚያ',
    category: 'Workforce, Safety & Dispatch',
    categoryAm: 'የሰው ኃይል፣ ደህንነት እና ስርጭት',
    summary:
      'Log security incidents, issue visitor/contractor gate passes, manage the Lost & Found custody vault, and resolve guest complaint SLAs.',
    summaryAm:
      'የደህንነት ክስተቶችን፣ የጎብኚ በር ፈቃዶችን፣ የጠፉና የተገኙ ዕቃዎች ማከማቻን እና የእንግዳ ቅሬታዎችን (SLA) ያስተዳድሩ።',
    steps: [
      {
        title: 'Log incidents & visitor gate passes',
        titleAm: 'ክስተቶችን እና የጎብኚ ፈቃዶችን ይመዝግቡ',
        detail: 'Check visitors in and out at the gate and document any safety/CCTV review incident with severity.',
        detailAm: 'የጎብኚዎችን መግቢያና መውጫ ይመዝግቡ እንዲሁም የደህንነት ክስተቶችን ከክብደት ደረጃ ጋር ይጻፉ።',
      },
      {
        title: 'Manage Lost & Found & SLA complaints',
        titleAm: 'የጠፉ ዕቃዎችን እና የቅሬታ SLA ይቆጣጠሩ',
        detail: 'Track custody status until claimed and close guest service-recovery tickets within target minutes.',
        detailAm: 'የጠፉ ዕቃዎችን ጥበቃ ይከታተሉ እና የእንግዳ ቅሬታዎችን በተቀመጠው የሰዓት ገደብ ውስጥ ይፍቱ።',
      },
    ],
    faqs: [
      {
        question: 'Are visitor ID numbers masked in tables?',
        questionAm: 'የጎብኚ መታወቂያ ቁጥሮች በሰንጠረዡ ውስጥ ይከለላሉ?',
        answer:
          'Yes. Gate pass logs protect personal ID details and record check-out clearance timestamps.',
        answerAm:
          'አዎን። የበር ፈቃድ መዝገቦች የግል መታወቂያ መረጃን ይከልላሉ እንዲሁም የመውጫ ሰዓትን ይመዘግባሉ።',
      },
    ],
    relatedTabs: ['staff_dispatch', 'reputation', 'valet_parking'],
  },
};

export function getHelpDocForTab(tabId: string, isSuperAdmin: boolean): ModuleHelpDoc {
  const exact = HELP_DOCUMENTATION[tabId];
  if (exact) return exact;
  return isSuperAdmin ? HELP_DOCUMENTATION.saas_overview : HELP_DOCUMENTATION.hotel_dashboard;
}

export function getHelpDocsByScope(isSuperAdmin: boolean): ModuleHelpDoc[] {
  const scope = isSuperAdmin ? 'super_admin' : 'hotel';
  return Object.values(HELP_DOCUMENTATION).filter((doc) => doc.scope === scope);
}
