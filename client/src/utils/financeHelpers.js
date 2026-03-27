
export const formatCurrency = (amount, region = "India (New)") => {
  const r = region.toLowerCase();
  
  let locale = 'en-IN';
  let currency = 'INR';

  if (r.includes("usa")) {
    locale = 'en-US';
    currency = 'USD';
  } else if (r.includes("canada")) {
    locale = 'en-CA';
    currency = 'CAD';
  } else if (r.includes("uk")) {
    locale = 'en-GB';
    currency = 'GBP';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};


export const getTotalByType = (transactions, type) => {
  if (!transactions || !Array.isArray(transactions)) return 0;
  return transactions
    .filter(t => t.type === type)
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
};


export const calculatePercentage = (spent, limit) => {
  if (!limit || limit === 0) return 0;
  const percentage = (spent / limit) * 100;
  return Math.min(Math.max(percentage, 0), 100); 
};