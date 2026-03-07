import React, { useState, useMemo } from "react";
import axios from "axios";
import { calculateTaxByRegion } from "../utils/taxCalculations";
import { formatCurrency } from "../utils/financeHelpers";

const TaxEstimator = ({ transactions = [], loading }) => {
  const [region, setRegion] = useState("India");
  const [regime, setRegime] = useState("new");
  const [manualDeductions, setManualDeductions] = useState(0);

  const taxData = useMemo(() => {
    const stats = (transactions || []).reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      if (curr.type === 'expense') acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });

    const incomeHeads = { salary: stats.income };
    const totalDeductions = stats.expense + manualDeductions;

    const result = calculateTaxByRegion(incomeHeads, region, regime, totalDeductions);
    
    const quarterlyDeadlines = result.totalTax > 10000 ? [
      { date: "June 15", pct: "15%", amount: result.totalTax * 0.15 },
      { date: "Sept 15", pct: "45%", amount: result.totalTax * 0.45 },
      { date: "Dec 15", pct: "75%", amount: result.totalTax * 0.75 },
      { date: "Mar 15", pct: "100%", amount: result.totalTax * 1.00 },
    ] : [];

    return {
      totalIncome: stats.income, 
      taxableIncome: result.taxableIncome,
      taxDue: result.totalTax,
      netSavings: stats.income - result.totalTax,
      effectiveRate: result.taxableIncome > 0 ? ((result.totalTax / result.taxableIncome) * 100).toFixed(3) : 0,
      monthly: result.monthlyTax,
      deadlines: quarterlyDeadlines
    };
  }, [transactions, region, regime, manualDeductions]);

  const saveTaxToDB = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token || localStorage.getItem("token");

      if (!token) return alert("Please login first to save tax data");

      const response = await axios.post('/api/taxes/save', {
        region,
        regime,
        totalIncome: taxData.totalIncome,
        taxableIncome: taxData.taxableIncome,
        taxDue: taxData.taxDue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        alert("Tax Calculation Saved Successfully! ✅");
      }
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      alert("Error saving tax calculation. Check backend routes.");
    }
  };

  if (loading) return <div className="h-48 bg-gray-50 animate-pulse rounded-[2rem]" />;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
      {/* 1. Header & Region Selector */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tax View</h4>
        <select 
          className="text-[10px] font-black bg-gray-50 border-none rounded-lg px-2 py-1 outline-none cursor-pointer"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="India">🇮🇳 India</option>
          <option value="USA">🇺🇸 USA</option>
          <option value="UK">🇬🇧 UK</option>
          <option value="Canada">🇨🇦 Canada</option>
        </select>
      </div>

      {/* 2. Regime Toggle */}
      {region === "India" && (
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setRegime("new")}
            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
              regime === "new" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"
            }`}
          >
            New Regime
          </button>
          <button 
            onClick={() => setRegime("old")}
            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
              regime === "old" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
            }`}
          >
            Old Regime
          </button>
        </div>
      )}

      {/* Manual Deduction Input */}
      {regime === "old" && region === "India" && (
        <div className="animate-in fade-in slide-in-from-top-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Investment/Deductions (80C, 80D)</label>
          <input 
            type="number"
            className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-300"
            placeholder="e.g. 150000"
            onChange={(e) => setManualDeductions(Number(e.target.value))}
          />
        </div>
      )}

      {/* 3. Main Stats */}
      <div className="grid grid-cols-1 gap-2">
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase">Taxable Income</span>
          <span className="font-black text-gray-900">{formatCurrency(taxData.taxableIncome, region)}</span>
        </div>

        <div className={`p-4 rounded-2xl border flex justify-between items-center transition-all duration-300 ${
          taxData.taxDue > 0 ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'
        }`}>
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase">Est. Tax ({regime})</p>
            <h3 className={`text-lg font-black ${taxData.taxDue > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
              {formatCurrency(taxData.taxDue, region)}
            </h3>
          </div>
          {taxData.taxDue === 0 && (
            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">NIL</span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-blue-600 uppercase">In-Hand (Annual)</span>
          <span className="font-black text-blue-900">{formatCurrency(taxData.netSavings, region)}</span>
        </div>
      </div>

      {/* Step 4: Advance Tax Calendar */}
      {taxData.deadlines.length > 0 && (
        <div className="bg-gray-900 p-4 rounded-2xl shadow-inner">
          <p className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-tighter text-center">📅 Advance Tax Deadlines</p>
          <div className="grid grid-cols-2 gap-2">
            {taxData.deadlines.map((item, idx) => (
              <div key={idx} className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                <p className="text-[8px] font-bold text-gray-500">{item.date} ({item.pct})</p>
                <p className="text-[10px] font-black text-white">{formatCurrency(item.amount, region)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Footer Info */}
      <div className="flex justify-between items-center px-1">
        <div className="text-[10px] text-gray-400 font-bold italic flex items-center gap-1">
          <span className="text-base">💡</span>
          Rate: <span className="text-emerald-600">{taxData.effectiveRate}%</span>
        </div>
        <div className="text-[10px] text-gray-400 font-bold uppercase">
          Monthly: <span className="text-gray-900">{formatCurrency(taxData.monthly, region)}</span>
        </div>
      </div>

      {/* ✅ Save Button with spacing */}
      <button 
        onClick={saveTaxToDB}
        className="w-full mt-2 py-4 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all duration-300 active:scale-95"
      >
        Save Calculation to Profile
      </button>
    </div>
  );
};

export default TaxEstimator;