// ─────────────────────────────────────────────────────────
//  TAX SLABS — FY 2024-25 (India)
// ─────────────────────────────────────────────────────────

// NEW REGIME slabs (default from FY 2023-24 onwards)
// Standard Deduction: ₹75,000 auto
// Rebate 87A: if taxable income ≤ ₹7L → tax = ₹0
export const NEW_REGIME_SLABS = [
  { min: 0,        max: 300000,  rate: 0.00, label: "₹0 – ₹3 Lakh",     pct: "0%"  },
  { min: 300000,   max: 700000,  rate: 0.05, label: "₹3L – ₹7 Lakh",    pct: "5%"  },
  { min: 700000,   max: 1000000, rate: 0.10, label: "₹7L – ₹10 Lakh",   pct: "10%" },
  { min: 1000000,  max: 1200000, rate: 0.15, label: "₹10L – ₹12 Lakh",  pct: "15%" },
  { min: 1200000,  max: 1500000, rate: 0.20, label: "₹12L – ₹15 Lakh",  pct: "20%" },
  { min: 1500000,  max: null,    rate: 0.30, label: "Above ₹15 Lakh",    pct: "30%" },
];

// OLD REGIME slabs (Direct Tax as per madam)
// Standard Deduction: ₹50,000 auto
// Rebate 87A: if taxable income ≤ ₹5L → tax = ₹0
// Deductions allowed: 80C, 80D, NPS, HRA
export const OLD_REGIME_SLABS = [
  { min: 0,        max: 250000,  rate: 0.00, label: "₹0 – ₹2.5 Lakh",    pct: "0%"  },
  { min: 250000,   max: 500000,  rate: 0.05, label: "₹2.5L – ₹5 Lakh",   pct: "5%"  },
  { min: 500000,   max: 1000000, rate: 0.10, label: "₹5L – ₹10 Lakh",    pct: "10%" },
  { min: 1000000,  max: 2000000, rate: 0.20, label: "₹10L – ₹20 Lakh",   pct: "20%" },
  { min: 2000000,  max: null,    rate: 0.30, label: "Above ₹20 Lakh",     pct: "30%" },
];

// BUSINESS uses same slabs as chosen regime
// No standard deduction — instead actual expenses deducted

// Quarterly advance tax schedule
export const QUARTERS = [
  { label: "Q1", full: "Q1 (Apr–Jun)", due: "15th June", pct: 0.15 },
  { label: "Q2", full: "Q2 (Jul–Sep)", due: "15th Sept", pct: 0.45 },
  { label: "Q3", full: "Q3 (Oct–Dec)", due: "15th Dec",  pct: 0.75 },
  { label: "Q4", full: "Q4 (Jan–Mar)", due: "15th Mar",  pct: 1.00 },
];

// ─────────────────────────────────────────────────────────
//  CORE: Slab-wise breakdown (works for any slab array)
// ─────────────────────────────────────────────────────────
export const calculateSlabBreakdown = (taxableIncome, slabs) => {
  let remaining = Math.max(0, taxableIncome);
  let totalTax  = 0;
  const breakdown = [];

  for (const slab of slabs) {
    const slabSize   = slab.max ? slab.max - slab.min : Infinity;
    const inThisSlab = Math.min(remaining, slabSize);
    const taxInSlab  = Math.round(inThisSlab * slab.rate);
    totalTax += taxInSlab;
    breakdown.push({
      label:    slab.label,
      pct:      slab.pct,
      rate:     slab.rate,
      amount:   Math.round(inThisSlab),
      tax:      taxInSlab,
      isActive: inThisSlab > 0,
    });
    remaining -= inThisSlab;
    if (remaining <= 0) break;
  }

  return { totalTax, breakdown };
};

// ─────────────────────────────────────────────────────────
//  REBATE 87A
//  New regime: income ≤ ₹7L → full tax rebate
//  Old regime: income ≤ ₹5L → full tax rebate
// ─────────────────────────────────────────────────────────
const applyRebate87A = (tax, taxableIncome, regime) => {
  const limit = regime === 'new' ? 700000 : 500000;
  if (taxableIncome <= limit) return 0;
  return tax;
};

// ─────────────────────────────────────────────────────────
//  SALARIED TAX CALCULATOR
// ─────────────────────────────────────────────────────────
export const calculateSalariedTax = (grossIncome, tdsAlreadyPaid = 0, deductions = {}, regime = 'new') => {
  const slabs = regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;

  // Standard deduction — both regimes, different amounts
  const standardDeduction = regime === 'new' ? 75000 : 50000;

  // Old regime deductions with govt caps
  // New regime — none of these apply
  const sec80C   = regime === 'old' ? Math.min(Number(deductions.sec80c) || 0, 150000) : 0;
  const sec80D   = regime === 'old' ? Math.min(Number(deductions.sec80d) || 0, 25000)  : 0;
  const nps80CCD = regime === 'old' ? Math.min(Number(deductions.nps)    || 0, 50000)  : 0;
  const hra      = regime === 'old' ? (Number(deductions.hra)            || 0)         : 0;

  const totalDeductions = standardDeduction + sec80C + sec80D + nps80CCD + hra;
  const taxableIncome   = Math.max(0, grossIncome - totalDeductions);

  const { totalTax: rawTax, breakdown } = calculateSlabBreakdown(taxableIncome, slabs);

  // Apply Rebate 87A
  const totalTax     = applyRebate87A(rawTax, taxableIncome, regime);
  const rebateApplied = rawTax > 0 && totalTax === 0;

  const remainingTax = Math.max(0, totalTax - tdsAlreadyPaid);
  const refund       = tdsAlreadyPaid > totalTax ? tdsAlreadyPaid - totalTax : 0;

  return {
    grossIncome,
    regime,
    standardDeduction,
    appliedDeductions: { sec80C, sec80D, nps80CCD, hra },
    totalDeductions,
    taxableIncome,
    rawTax,
    totalTax,
    rebateApplied,
    tdsAlreadyPaid,
    remainingTax,
    refund,
    breakdown,
    effectiveRate: grossIncome > 0
      ? ((totalTax / grossIncome) * 100).toFixed(2)
      : "0.00",
  };
};

// ─────────────────────────────────────────────────────────
//  BUSINESS TAX CALCULATOR
//  Taxable = Gross Income − Business Expenses
//  Business uses regime slabs (no standard deduction)
// ─────────────────────────────────────────────────────────
export const calculateBusinessTax = (grossIncome, totalExpenses, regime = 'new') => {
  const slabs         = regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  const taxableIncome = Math.max(0, grossIncome - totalExpenses);

  const { totalTax: rawTax, breakdown } = calculateSlabBreakdown(taxableIncome, slabs);

  // Rebate 87A applies to business too if taxable income within limit
  const totalTax     = applyRebate87A(rawTax, taxableIncome, regime);
  const rebateApplied = rawTax > 0 && totalTax === 0;

  return {
    grossIncome,
    regime,
    totalExpenses,
    taxableIncome,
    rawTax,
    totalTax,
    rebateApplied,
    breakdown,
    effectiveRate: taxableIncome > 0
      ? ((totalTax / taxableIncome) * 100).toFixed(2)
      : "0.00",
  };
};

// ─────────────────────────────────────────────────────────
//  REGIME COMPARISON
//  Given same income + deductions, compare both regimes
// ─────────────────────────────────────────────────────────
export const compareRegimes = (grossIncome, tdsAlreadyPaid = 0, deductions = {}) => {
  const newResult = calculateSalariedTax(grossIncome, tdsAlreadyPaid, deductions, 'new');
  const oldResult = calculateSalariedTax(grossIncome, tdsAlreadyPaid, deductions, 'old');
  const saving    = oldResult.totalTax - newResult.totalTax;
  const better    = saving > 0 ? 'new' : saving < 0 ? 'old' : 'equal';
  return { newResult, oldResult, saving: Math.abs(saving), better };
};

// ─────────────────────────────────────────────────────────
//  PENALTY CALCULATOR — Sec 234B / 234C
//  1% simple interest per month on shortfall
//  Months counted from quarter due date till 31st March
//    Q1 (15th June)  → 10 months remaining
//    Q2 (15th Sept)  →  7 months remaining
//    Q3 (15th Dec)   →  4 months remaining
//    Q4 (15th March) →  1 month  remaining
// ─────────────────────────────────────────────────────────
export const QUARTER_MONTHS = [10, 7, 4, 1]; // months till year-end for Q1-Q4

export const calculatePenalty = (amountDue, amountPaid, quarterIndex = 0) => {
  const months    = QUARTER_MONTHS[quarterIndex] ?? 1;
  const shortfall = Math.max(0, amountDue - amountPaid);
  const interest  = Math.round(shortfall * 0.01 * months);
  return { shortfall, interest, months, total: shortfall + interest };
};

// ─────────────────────────────────────────────────────────
//  BUSINESS EXPENSE CATEGORIES
// ─────────────────────────────────────────────────────────
export const BUSINESS_EXPENSE_CATEGORIES = [
  { key: "rent",         label: "Office Rent",              icon: "🏢", hint: "Rent paid for business premises"        },
  { key: "salaries",     label: "Staff Salaries",           icon: "👥", hint: "Wages paid to employees"                },
  { key: "equipment",    label: "Equipment & Assets",       icon: "🖥️",  hint: "Laptops, machinery, tools (depreciation)" },
  { key: "software",     label: "Software & Subscriptions", icon: "💻", hint: "Business tools, cloud, SaaS"            },
  { key: "marketing",    label: "Marketing & Advertising",  icon: "📢", hint: "Ads, promotions, branding"              },
  { key: "travel",       label: "Business Travel",          icon: "✈️",  hint: "Travel solely for business purposes"   },
  { key: "professional", label: "Professional Fees",        icon: "⚖️",  hint: "CA, lawyer, consultant charges"        },
  { key: "other",        label: "Other Business Expenses",  icon: "📦", hint: "Any other legitimate business cost"     },
];

// ─────────────────────────────────────────────────────────
//  SALARIED DEDUCTION SECTIONS (Old Regime only)
// ─────────────────────────────────────────────────────────
export const SALARIED_DEDUCTION_SECTIONS = [
  { key:"sec80c", label:"Section 80C",                   icon:"💰", max:150000, maxLabel:"Max ₹1,50,000",                       hint:"PPF, ELSS, LIC premium, EPF, NSC, 5yr FD, Sukanya Samriddhi",          color:"#10b981" },
  { key:"sec80d", label:"Section 80D — Health Insurance", icon:"🏥", max:25000,  maxLabel:"Max ₹25,000 (₹50k if parents senior)", hint:"Medical insurance premium for self, spouse, children & parents",        color:"#3b82f6" },
  { key:"nps",    label:"Section 80CCD(1B) — NPS",        icon:"🏦", max:50000,  maxLabel:"Max ₹50,000 (extra over 80C)",         hint:"National Pension Scheme — benefit over and above 80C limit",            color:"#8b5cf6" },
  { key:"hra",    label:"HRA Exemption",                   icon:"🏠", max:null,   maxLabel:"Based on salary & rent paid",          hint:"Min of: HRA received, 50%/40% of basic salary, or rent − 10% of basic", color:"#f59e0b" },
];