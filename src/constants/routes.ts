export const ROUTES = {

  // ── Core ────────────────────────────────────────────────────────────────────
  DASHBOARD: '/',
  AUTH: '/auth',
  ONBOARDING: '/onboarding',

  // ── Settings ─────────────────────────────────────────────────────────────────
  SETTINGS: '/settings',
  USER_PHOTO: '/settings/photo',
  USER_PROFILE: '/settings/profile',
  USER_REPORT_ISSUE: '/settings/report-issue',
  USER_LOGOUT: '/settings/logout',
  USER_DELETE_ACCOUNT: '/settings/delete-account',

  // ── Contacts ─────────────────────────────────────────────────────────────────
  CONTACTS: '/contacts',
  NEW_CONTACT: '/contacts/new',
  CONTACT_DETAILS: '/contacts/$id',
  CONTACT_SETTINGS: '/contacts/$id/settings',
  CONTACT_BREAKDOWN: '/contacts/$id/breakdown',
  CONTACT_REMINDER: '/contacts/$id/reminder',
  CONTACT_ADD_EXPENSE: '/contacts/$id/add-expense',
  CONTACT_RECURRING: '/contacts/$id/recurring',
  CONTACT_ADD_RECURRING: '/contacts/$id/recurring/new',
  CONTACT_EDIT_RECURRING: '/contacts/$id/recurring/$paymentId/edit',

  // ── Transactions ─────────────────────────────────────────────────────────────
  TRANSACTIONS: '/transactions',
  TRANSACTION_DETAILS: '/transactions/$id',
  TRANSACTION_EDIT: '/transactions/$id/edit',

  // ── Settlements ───────────────────────────────────────────────────────────────
  SETTLEMENT_DETAILS: '/settlements/$id',

  // ── Notifications ────────────────────────────────────────────────────────────
  NOTIFICATIONS: '/notifications',
  CONFIRM_PAYMENT: '/notifications/confirm/$id',
  DISPUTE_PAYMENT: '/notifications/dispute/$id',

  // ── Personal ─────────────────────────────────────────────────────────────────
  PERSONAL: '/personal',
  PERSONAL_REPORTS: '/personal/reports',
  PERSONAL_SETTINGS: '/personal/settings',
  PERSONAL_CATEGORIES: '/personal/categories',
  PERSONAL_HIDE_LEDGERS: '/personal/hide-ledgers',
  PERSONAL_DEFAULT_PERIOD: '/personal/default-period',
  PERSONAL_BUDGET_LIMIT: '/personal/budget-limit',
  PERSONAL_ADD_EXPENSE: '/personal/add-expense',
  PERSONAL_CATEGORY_BUDGETS: '/personal/category-budgets',
  PERSONAL_SET_CATEGORY_LIMIT: '/personal/category-budgets/$catId',

  // ── Groups ───────────────────────────────────────────────────────────────────
  GROUPS: '/groups',
  GROUP_DETAILS: '/groups/$id',
  GROUP_SETTINGS: '/groups/$id/settings',
  GROUP_PHOTO: '/groups/$id/settings/photo',
  GROUP_NAME: '/groups/$id/settings/name',
  GROUP_SMART_SETTLE: '/groups/$id/settings/smart-settle',
  GROUP_REMINDER: '/groups/$id/reminder',
  GROUP_ADD_EXPENSE: '/groups/$id/add-expense',
  GROUP_CATEGORY: '/groups/$id/category/$catId',
  GROUP_RECURRING: '/groups/$id/recurring',
  GROUP_ADD_RECURRING: '/groups/$id/recurring/new',
  GROUP_EDIT_RECURRING: '/groups/$id/recurring/$paymentId/edit',

  // ── Misc ─────────────────────────────────────────────────────────────────────
  SETTLE_UP: '/settle-up',

} as const
