// ─── INDIAN TAX PAYER TYPES ──────────────────────────────────────────────────

export const TAXPAYER_TYPES = {
  BUSINESS: "Business",
  SALARIED: "Salaried",
};

// Business person tax slabs (India)
export const BUSINESS_TAX_SLABS = [
  { min: 0,       max: 250000,  rate: 0,    label: "0%  (₹0 – ₹2.5L)" },
  { min: 250000,  max: 500000,  rate: 0.05, label: "5%  (₹2.5L – ₹5L)" },
  { min: 500000,  max: 1000000, rate: 0.10, label: "10% (₹5L – ₹10L)" },
  { min: 2000000, max: Infinity, rate: 0.20, label: "20% (above ₹20L)" },
];

// Quarterly advance tax % obligations
export const QUARTER_TAX_PERCENT = [0.15, 0.45, 0.75, 1.00];
export const QUARTER_PENALTY_RATE = 0.01; // 1% per quarter for late payment

export const calculateBusinessTax = (annualIncome) => {
  if (annualIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const slab of BUSINESS_TAX_SLABS) {
    if (annualIncome <= slab.min) break;
    const taxable = Math.min(annualIncome, slab.max) - slab.min;
    tax += taxable * slab.rate;
    prev = slab.max;
  }
  return Math.round(tax);
};

export const calculateQuarterlyTax = (annualTax, quarterIndex, paidSoFar = 0) => {
  const required = Math.round(annualTax * QUARTER_TAX_PERCENT[quarterIndex]);
  const due = Math.max(0, required - paidSoFar);
  return { required, due, paidSoFar };
};

export const calculatePenalty = (unpaidAmount, quarterIndex) => {
  // 1% simple interest penalty per month on unpaid amount
  const monthsLate = 3; // approx months in a quarter
  return Math.round(unpaidAmount * QUARTER_PENALTY_RATE * monthsLate);
};

// ─── TAX POLICIES BY COUNTRY ───────────────────────────────────────────────

export const TAX_POLICIES = {
  "India (New)": {
    currency: "INR",
    symbol: "₹",
    slabs: [
      { limit: 300000,  rate: 0,    label: "0% (₹0 – ₹3L)" },
      { limit: 700000,  rate: 0.05, label: "5% (₹3L – ₹7L)" },
      { limit: 1000000, rate: 0.10, label: "10% (₹7L – ₹10L)" },
      { limit: 1200000, rate: 0.15, label: "15% (₹10L – ₹12L)" },
      { limit: 1500000, rate: 0.20, label: "20% (₹12L – ₹15L)" },
      { limit: Infinity, rate: 0.30, label: "30% (above ₹15L)" },
    ],
    cess: 0.04,
    rebateLimit: 700000,
    filingDeadline: "July 31",
    notes: "Includes 4% Health & Education Cess. Rebate under Sec 87A if income ≤ ₹7L.",
  },

  "India (Old)": {
    currency: "INR",
    symbol: "₹",
    slabs: [
      { limit: 250000,  rate: 0,    label: "0% (₹0 – ₹2.5L)" },
      { limit: 500000,  rate: 0.05, label: "5% (₹2.5L – ₹5L)" },
      { limit: 1000000, rate: 0.20, label: "20% (₹5L – ₹10L)" },
      { limit: Infinity, rate: 0.30, label: "30% (above ₹10L)" },
    ],
    cess: 0.04,
    rebateLimit: 500000,
    filingDeadline: "July 31",
    notes: "Allows deductions under 80C, 80D, HRA etc. 4% cess on tax.",
  },

  "USA": {
    currency: "USD",
    symbol: "$",
    slabs: [
      { limit: 11600,   rate: 0.10,  label: "10% ($0 – $11,600)" },
      { limit: 47150,   rate: 0.12,  label: "12% ($11,600 – $47,150)" },
      { limit: 100525,  rate: 0.22,  label: "22% ($47,150 – $100,525)" },
      { limit: 191950,  rate: 0.24,  label: "24% ($100,525 – $191,950)" },
      { limit: 243725,  rate: 0.32,  label: "32% ($191,950 – $243,725)" },
      { limit: 609350,  rate: 0.35,  label: "35% ($243,725 – $609,350)" },
      { limit: Infinity, rate: 0.37, label: "37% (above $609,350)" },
    ],
    cess: 0,
    rebateLimit: 0,
    filingDeadline: "April 15",
    notes: "2024 Federal Tax Brackets (Single filer). State taxes not included.",
  },

  "UK": {
    currency: "GBP",
    symbol: "£",
    slabs: [
      { limit: 12570,   rate: 0,    label: "0% Personal Allowance (£0 – £12,570)" },
      { limit: 50270,   rate: 0.20, label: "20% Basic Rate (£12,570 – £50,270)" },
      { limit: 125140,  rate: 0.40, label: "40% Higher Rate (£50,270 – £125,140)" },
      { limit: Infinity, rate: 0.45, label: "45% Additional Rate (above £125,140)" },
    ],
    cess: 0,
    rebateLimit: 0,
    filingDeadline: "January 31",
    notes: "2024-25 UK Income Tax. National Insurance contributions not included.",
  },

  "Germany": {
    currency: "EUR",
    symbol: "€",
    slabs: [
      { limit: 11604,   rate: 0,    label: "0% (€0 – €11,604)" },
      { limit: 66760,   rate: 0.14, label: "14–42% Progressive (€11,604 – €66,760)" },
      { limit: 277826,  rate: 0.42, label: "42% (€66,760 – €277,826)" },
      { limit: Infinity, rate: 0.45, label: "45% Rich Tax (above €277,826)" },
    ],
    cess: 0.055,
    rebateLimit: 0,
    filingDeadline: "July 31",
    notes: "Solidarity surcharge (5.5% of tax) may apply. Church tax not included.",
  },

  "Australia": {
    currency: "AUD",
    symbol: "A$",
    slabs: [
      { limit: 18200,   rate: 0,    label: "0% (A$0 – A$18,200)" },
      { limit: 45000,   rate: 0.19, label: "19% (A$18,200 – A$45,000)" },
      { limit: 120000,  rate: 0.325, label: "32.5% (A$45,000 – A$120,000)" },
      { limit: 180000,  rate: 0.37, label: "37% (A$120,000 – A$180,000)" },
      { limit: Infinity, rate: 0.45, label: "45% (above A$180,000)" },
    ],
    cess: 0.02,
    rebateLimit: 0,
    filingDeadline: "October 31",
    notes: "Medicare Levy of 2% applies. FY runs July 1 – June 30.",
  },

  "Canada": {
    currency: "CAD",
    symbol: "C$",
    slabs: [
      { limit: 55867,   rate: 0.15,  label: "15% (C$0 – C$55,867)" },
      { limit: 111733,  rate: 0.205, label: "20.5% (C$55,867 – C$111,733)" },
      { limit: 154906,  rate: 0.26,  label: "26% (C$111,733 – C$154,906)" },
      { limit: 220000,  rate: 0.29,  label: "29% (C$154,906 – C$220,000)" },
      { limit: Infinity, rate: 0.33, label: "33% (above C$220,000)" },
    ],
    cess: 0,
    rebateLimit: 0,
    filingDeadline: "April 30",
    notes: "Federal rates only. Provincial taxes not included.",
  },
};

// ─── CALCULATE TAX ───────────────────────────────────────────────────────────

export const calculateTaxByRegion = (income, region) => {
  if (income <= 0) return 0;

  const policy = TAX_POLICIES[region];
  if (!policy) return 0;

  // Calculate tax normally using slabs first
  let tax = 0;
  let prevLimit = 0;

  for (const slab of policy.slabs) {
    if (income <= prevLimit) break;
    const taxableInSlab = Math.min(income, slab.limit) - prevLimit;
    tax += taxableInSlab * slab.rate;
    prevLimit = slab.limit;
    if (slab.limit === Infinity) break;
  }

  // ── FIX: Sec 87A Rebate — waive tax only if tax itself ≤ rebate cap ──
  // Under Sec 87A, if income ≤ rebateLimit the rebate amount is ₹12,500 (New) / ₹12,500 (Old)
  // i.e. tax is fully waived only when the computed tax ≤ 12,500, NOT always zeroed out
  if (policy.rebateLimit && income <= policy.rebateLimit) {
    const rebateCap = 12500; // max rebate under Sec 87A
    tax = Math.max(0, tax - rebateCap);
  }

  // Add cess/surcharge on the final tax
  if (policy.cess > 0) {
    tax += tax * policy.cess;
  }

  return Math.round(tax);
};

// ─── GET EFFECTIVE RATE ──────────────────────────────────────────────────────

export const getEffectiveRate = (income, region) => {
  if (income <= 0) return 0;
  const tax = calculateTaxByRegion(income, region);
  return ((tax / income) * 100).toFixed(1);
};

// ─── GET FILING DEADLINE ─────────────────────────────────────────────────────

export const getFilingDeadline = (region) => {
  return TAX_POLICIES[region]?.filingDeadline || "N/A";
};

// ─── GET ALL COUNTRY NAMES ───────────────────────────────────────────────────

export const getCountryList = () => Object.keys(TAX_POLICIES);