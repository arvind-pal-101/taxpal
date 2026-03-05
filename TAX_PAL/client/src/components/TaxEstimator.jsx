import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { calculateTaxByRegion, calculateBusinessTax, getCountryList } from "../utils/taxCalculations";
import { formatCurrency } from "../utils/financeHelpers";

const API = "http://localhost:5000";

const REGION_FLAGS = {
  "India (New)": "🇮🇳",
  "India (Old)": "🇮🇳",
  "USA":         "🇺🇸",
  "UK":          "🇬🇧",
  "Germany":     "🇩🇪",
};

const TaxEstimator = ({ transactions = [], loading }) => {
  const [region, setRegion]           = useState("India (New)");
  const [taxpayerType, setTaxpayerType] = useState("Business");
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState(null);

  // Load saved region AND taxpayerType from DB on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API}/api/tax-estimate`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data?.region)       setRegion(res.data.region);
      if (res.data?.taxpayerType) setTaxpayerType(res.data.taxpayerType);
    }).catch(() => {});
  }, []);

  // Persist region change to DB immediately
  const handleRegionChange = async (newRegion) => {
    setRegion(newRegion);
    await persistToDb({ region: newRegion, taxpayerType });
  };

  // Persist taxpayerType change to DB immediately
  const handleTypeChange = async (newType) => {
    setTaxpayerType(newType);
    await persistToDb({ region, taxpayerType: newType });
  };

  const persistToDb = async (payload) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/api/tax-estimate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveMsg("saved");
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  };

  const taxData = useMemo(() => {
    const stats = (transactions || []).reduce((acc, curr) => {
      if (curr.type === "income")  acc.income  += curr.amount;
      if (curr.type === "expense") acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });

    let taxableIncome, taxDue;

    if (taxpayerType === "Business") {
      // Business: taxable = income - expenses (same logic as TaxEstimatorPage)
      taxableIncome = Math.max(0, stats.income - stats.expense);
      taxDue = calculateBusinessTax(taxableIncome);
    } else {
      // Salaried: taxable = income only, tax by region slab
      taxableIncome = Math.max(0, stats.income);
      taxDue = calculateTaxByRegion(taxableIncome, region);
    }

    return {
      taxableIncome,
      taxDue,
      netSavings: stats.income - stats.expense - taxDue,
      effectiveRate: taxableIncome > 0 ? ((taxDue / taxableIncome) * 100).toFixed(1) : 0,
    };
  }, [transactions, region, taxpayerType]);

  if (loading) return <div className="h-48 bg-gray-50 animate-pulse rounded-[2rem]" />;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tax View</h4>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[9px] font-black text-gray-300 uppercase">saving…</span>}
          {saveMsg === "saved" && <span className="text-[9px] font-black text-emerald-500 uppercase">✓ saved</span>}
          {saveMsg === "error" && <span className="text-[9px] font-black text-rose-400 uppercase">✗ error</span>}
          <select
            className="text-[10px] font-black bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-emerald-200 transition-all"
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
          >
            {getCountryList().map(c => (
              <option key={c} value={c}>{REGION_FLAGS[c] || "🌍"} {c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Taxpayer Type Toggle */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
        {["Business", "Salaried"].map(type => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all
              ${taxpayerType === type
                ? "bg-white shadow-sm text-gray-800 border border-gray-100"
                : "text-gray-400 hover:text-gray-600"}`}
          >
            {type === "Business" ? "🏢" : "👔"} {type}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2">
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase">
            {taxpayerType === "Business" ? "Profit (Income − Expenses)" : "Taxable Income"}
          </span>
          <span className="font-black text-gray-900">{formatCurrency(taxData.taxableIncome)}</span>
        </div>

        <div className={`p-4 rounded-2xl border flex justify-between items-center transition-colors ${
          taxData.taxDue > 0 ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100"
        }`}>
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase">Est. Tax</p>
            <h3 className={`text-lg font-black ${taxData.taxDue > 0 ? "text-orange-700" : "text-emerald-700"}`}>
              {formatCurrency(taxData.taxDue)}
            </h3>
          </div>
          {taxData.taxDue === 0 && (
            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">NIL</span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-blue-600 uppercase">In-Hand</span>
          <span className="font-black text-blue-900">{formatCurrency(taxData.netSavings)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-400 font-bold italic flex items-center gap-2">
        <span className="text-base">💡</span>
        Effective Rate: <span className="text-emerald-600">{taxData.effectiveRate}%</span>
      </div>
    </div>
  );
};

export default TaxEstimator;