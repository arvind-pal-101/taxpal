const TaxEstimate = require("../models/TaxEstimate");

// GET — load saved estimate for logged-in user
const getTaxEstimate = async (req, res) => {
  try {
    const estimate = await TaxEstimate.findOne({ userId: req.user.id });
    if (!estimate) return res.json(null); // no saved data yet — frontend will use defaults
    res.json(estimate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST — save (upsert) estimate for logged-in user
const saveTaxEstimate = async (req, res) => {
  try {
    const { region, taxpayerType, tdsAmount, paidAmounts, deductions } = req.body;

    const estimate = await TaxEstimate.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        region,
        taxpayerType,
        tdsAmount: parseFloat(tdsAmount) || 0,
        paidAmounts: {
          0: parseFloat(paidAmounts?.[0]) || 0,
          1: parseFloat(paidAmounts?.[1]) || 0,
          2: parseFloat(paidAmounts?.[2]) || 0,
          3: parseFloat(paidAmounts?.[3]) || 0,
        },
        deductions: {
          businessExpenses:        parseFloat(deductions?.businessExpenses) || 0,
          retirementContributions: parseFloat(deductions?.retirementContributions) || 0,
          healthInsurance:         parseFloat(deductions?.healthInsurance) || 0,
          homeOffice:              parseFloat(deductions?.homeOffice) || 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(estimate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getTaxEstimate, saveTaxEstimate };