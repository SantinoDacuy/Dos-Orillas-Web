export const contactLimits = {
  name: 120,
  email: 254,
  organization: 160,
  message: 5000,
  bodyBytes: 24 * 1024,
  bodyTimeoutMs: 3000,
  mailTimeoutMs: 8000,
  clientTimeoutMs: 12000,
  rateWindowMs: 10 * 60 * 1000,
  rateRequests: 5,
  rateEntries: 5000,
} as const;
