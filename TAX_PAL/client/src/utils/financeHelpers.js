export const formatCurrency = (amount, region = "India (New)") => {
  const isUSA = region === "USA (Flat)";
  return new Intl.NumberFormat(isUSA ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency: isUSA ? 'USD' : 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Total amount of transactions
export const getTotalByType = (transactions, type) => {
  return transactions
    .filter(t => t.type === type)
    .reduce((acc, curr) => acc + curr.amount, 0);
};

// Calculate for percentage
export const calculatePercentage = (spent, limit) => {
  return Math.min((spent / limit) * 100, 100);
};