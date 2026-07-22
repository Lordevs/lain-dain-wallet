// The backend's `country` field is django_countries' CountryField, which
// expects an ISO 3166-1 alpha-2 code, not a display name — and it isn't a
// simple name→code lookup (e.g. "United States" isn't the official ISO
// short name, "United States of America" is), so this needs its own
// explicit map rather than relying on the backend to normalize it. Keys
// must match components/shared/country-selector-drawer.tsx's
// `standardOptions` list. A custom "Other" entry has no key here and is
// submitted as typed — the backend may reject it if unrecognized.
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Afghanistan: 'AF',
  Azerbaijan: 'AZ',
  Bahrain: 'BH',
  Bangladesh: 'BD',
  Canada: 'CA',
  China: 'CN',
  India: 'IN',
  Iran: 'IR',
  Iraq: 'IQ',
  Kuwait: 'KW',
  Malaysia: 'MY',
  Maldives: 'MV',
  Mauritius: 'MU',
  Nepal: 'NP',
  Oman: 'OM',
  Pakistan: 'PK',
  Palestine: 'PS',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  Singapore: 'SG',
  'South Africa': 'ZA',
  'Sri Lanka': 'LK',
  Thailand: 'TH',
  Turkey: 'TR',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
}
