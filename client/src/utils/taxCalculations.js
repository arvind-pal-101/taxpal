export const calculateTaxByRegion = (incomeHeads, region, regime = "new", deductions = 0) => {
  const totalGross = typeof incomeHeads === 'object' 
    ? Object.values(incomeHeads).reduce((a, b) => a + Number(b || 0), 0)
    : Number(incomeHeads);
  
  if (totalGross <= 0) return { taxableIncome: 0, totalTax: 0, monthlyTax: 0 };

  let tax = 0;
  let taxableIncome = totalGross;
  let surchargeOrCess = 0;

  const r = region.toLowerCase();

  // --- 🇮🇳 INDIA LOGIC (FY 2025-26 / 2026-27) ---
  if (r.includes("india")) {
    if (regime === "new") {
      taxableIncome = Math.max(0, totalGross - 75000);
      if (taxableIncome <= 1200000) {
        tax = 0;
      } else {
        if (taxableIncome > 2400000) tax += (taxableIncome - 2400000) * 0.30;
        if (taxableIncome > 2000000) tax += (Math.min(taxableIncome, 2400000) - 2000000) * 0.25;
        if (taxableIncome > 1600000) tax += (Math.min(taxableIncome, 2000000) - 1600000) * 0.20;
        if (taxableIncome > 1200000) tax += (Math.min(taxableIncome, 1600000) - 1200000) * 0.15;
        if (taxableIncome > 800000)  tax += (Math.min(taxableIncome, 1200000) - 800000) * 0.10;
        if (taxableIncome > 400000)  tax += (Math.min(taxableIncome, 800000) - 400000) * 0.05;
      }
    } else {
      taxableIncome = Math.max(0, totalGross - 50000 - deductions);
      if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.30;
      if (taxableIncome > 500000)  tax += (Math.min(taxableIncome, 1000000) - 500000) * 0.20;
      if (taxableIncome > 250000)  tax += (Math.min(taxableIncome, 500000) - 250000) * 0.05;
      if (taxableIncome <= 500000) tax = 0;
    }
    surchargeOrCess = tax * 0.04;
  } 

  // --- 🇺🇸 USA LOGIC (Federal Slabs 2026) ---
  else if (r.includes("usa")) {
    // Standard Deduction for Single Filer approx $15,000
    taxableIncome = Math.max(0, totalGross - 15000);
    if (taxableIncome > 600000) tax += (taxableIncome - 600000) * 0.37;
    if (taxableIncome > 243725) tax += (Math.min(taxableIncome, 600000) - 243725) * 0.35;
    if (taxableIncome > 191950) tax += (Math.min(taxableIncome, 243725) - 191950) * 0.32;
    if (taxableIncome > 100525) tax += (Math.min(taxableIncome, 191950) - 100525) * 0.24;
    if (taxableIncome > 47150)  tax += (Math.min(taxableIncome, 100525) - 47150) * 0.22;
    if (taxableIncome > 11600)  tax += (Math.min(taxableIncome, 47150) - 11600) * 0.12;
    if (taxableIncome > 0)      tax += Math.min(taxableIncome, 11600) * 0.10;
  }

  // --- 🇬🇧 UK LOGIC (Personal Allowance & Slabs) ---
  else if (r.includes("uk")) {
    // Personal Allowance £12,570 (Starts tapering after £100k)
    let personalAllowance = 12570;
    if (totalGross > 100000) {
        personalAllowance = Math.max(0, 12570 - (totalGross - 100000) / 2);
    }
    taxableIncome = Math.max(0, totalGross - personalAllowance);
    if (taxableIncome > 125140) tax += (taxableIncome - 125140) * 0.45;
    if (taxableIncome > 37700)   tax += (Math.min(taxableIncome, 125140) - 37700) * 0.40;
    if (taxableIncome > 0)       tax += Math.min(taxableIncome, 37700) * 0.20;
  }

  // --- 🇨🇦 CANADA LOGIC (Federal Slabs 2026) ---
  else if (r.includes("canada")) {
    // Basic Personal Amount approx $15,705
    taxableIncome = Math.max(0, totalGross - 15705);
    if (taxableIncome > 246752) tax += (taxableIncome - 246752) * 0.33;
    if (taxableIncome > 173205) tax += (Math.min(taxableIncome, 246752) - 173205) * 0.29;
    if (taxableIncome > 111733) tax += (Math.min(taxableIncome, 173205) - 111733) * 0.26;
    if (taxableIncome > 55867)  tax += (Math.min(taxableIncome, 111733) - 55867) * 0.205;
    if (taxableIncome > 0)      tax += Math.min(taxableIncome, 55867) * 0.15;
  }

  const finalTax = tax + surchargeOrCess;
  return {
    taxableIncome: Math.round(taxableIncome),
    totalTax: Math.round(finalTax),
    monthlyTax: Math.round(finalTax / 12),
    cess: Math.round(surchargeOrCess)
  };
};