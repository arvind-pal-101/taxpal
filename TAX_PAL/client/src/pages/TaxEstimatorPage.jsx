import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  TAX_POLICIES,
  calculateTaxByRegion,
  getCountryList,
  calculateBusinessTax,
  BUSINESS_TAX_SLABS,
  QUARTER_TAX_PERCENT,
  calculatePenalty,
} from '../utils/taxCalculations';
import { formatCurrency } from '../utils/financeHelpers';
import axios from 'axios';

const API = "http://localhost:5000";

const QUARTERS = [
  { label: "Q1", full: "Q1 (Apr–Jun)", months: [4,5,6],    due: "Jun 15",  color: "emerald", percent: 15 },
  { label: "Q2", full: "Q2 (Jul–Sep)", months: [7,8,9],    due: "Sep 15",  color: "blue",    percent: 45 },
  { label: "Q3", full: "Q3 (Oct–Dec)", months: [10,11,12], due: "Dec 15",  color: "purple",  percent: 75 },
  { label: "Q4", full: "Q4 (Jan–Mar)", months: [1,2,3],    due: "Mar 15",  color: "amber",   percent: 100 },
];

const QUARTER_COLORS = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-500" },
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    badge: "bg-blue-500" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  badge: "bg-purple-500" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-500" },
};

const DEDUCTIBLE_CATEGORIES = ["Business Expenses","Software Subscriptions","Professional Development","Marketing","Travel","Office Rent"];

const TAX_SAVING_TIPS = {
  "India (New)": [
    { icon: "🏦", title: "NPS Contribution",   desc: "Contribute to NPS under Sec 80CCD(2) for additional deduction up to ₹50,000.", saving: 15000 },
    { icon: "🏠", title: "HRA Exemption",       desc: "If paying rent, claim HRA exemption to reduce taxable income significantly.",    saving: 20000 },
    { icon: "📦", title: "Standard Deduction",  desc: "₹50,000 standard deduction available for salaried individuals.",                saving: 15000 },
  ],
  "India (Old)": [
    { icon: "💰", title: "Section 80C",        desc: "Invest up to ₹1.5L in PPF, ELSS, LIC, FD to save tax.",             saving: 46800 },
    { icon: "🏥", title: "Section 80D",        desc: "Health insurance premium up to ₹25,000.",                           saving: 7800 },
    { icon: "🏦", title: "NPS (80CCD)",        desc: "Additional ₹50,000 deduction over 80C limit.",                      saving: 15600 },
    { icon: "🏠", title: "Home Loan Interest", desc: "Deduct up to ₹2L on home loan interest under Sec 24.",              saving: 62400 },
  ],
};

const isOverdue = (quarterIndex) => {
  const now = new Date();
  const yr = now.getFullYear();
  const dueDates = [
    new Date(yr, 5, 15),
    new Date(yr, 8, 15),
    new Date(yr, 11, 15),
    new Date(yr + 1, 2, 15),
  ];
  return now > dueDates[quarterIndex];
};

const TaxEstimatorPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [transactions, setTransactions]         = useState([]);
  const [region, setRegion]                     = useState("India (New)");
  const [taxpayerType, setTaxpayerType]         = useState("Business");
  const [tdsAmount, setTdsAmount]               = useState('');
  const [selectedQuarter, setSelectedQuarter]   = useState(0);
  const [paidAmounts, setPaidAmounts]           = useState({ 0:'', 1:'', 2:'', 3:'' });
  const [deductions, setDeductions]             = useState({ businessExpenses:'', retirementContributions:'', healthInsurance:'', homeOffice:'' });
  const [result, setResult]                     = useState(null);
  const [autoFilled, setAutoFilled]             = useState(false);
  const [activeTab, setActiveTab]               = useState("calculator");
  const [saveStatus, setSaveStatus]             = useState(null); // null | 'saving' | 'saved' | 'error'

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    // Load transactions
    axios.get(`${API}/api/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTransactions(res.data)).catch(() => {});

    // Load saved tax estimate from DB
    axios.get(`${API}/api/tax-estimate`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const d = res.data;
        if (!d) return; // no saved data yet, keep defaults
        setRegion(d.region || "India (New)");
        setTaxpayerType(d.taxpayerType || "Business");
        setTdsAmount(d.tdsAmount ? String(d.tdsAmount) : '');
        setPaidAmounts({
          0: d.paidAmounts?.[0] ? String(d.paidAmounts[0]) : '',
          1: d.paidAmounts?.[1] ? String(d.paidAmounts[1]) : '',
          2: d.paidAmounts?.[2] ? String(d.paidAmounts[2]) : '',
          3: d.paidAmounts?.[3] ? String(d.paidAmounts[3]) : '',
        });
        setDeductions({
          businessExpenses:        d.deductions?.businessExpenses        ? String(d.deductions.businessExpenses)        : '',
          retirementContributions: d.deductions?.retirementContributions ? String(d.deductions.retirementContributions) : '',
          healthInsurance:         d.deductions?.healthInsurance         ? String(d.deductions.healthInsurance)         : '',
          homeOffice:              d.deductions?.homeOffice              ? String(d.deductions.homeOffice)              : '',
        });
      }).catch(() => {});
  }, [navigate]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await axios.post(`${API}/api/tax-estimate`, {
        region,
        taxpayerType,
        tdsAmount,
        paidAmounts,
        deductions,
      }, getAuthHeader());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const policy = TAX_POLICIES[region];

  const annualIncome  = useMemo(() => transactions.filter(t => t.type==='income').reduce((a,t) => a+t.amount, 0), [transactions]);
  const annualExpense = useMemo(() => transactions.filter(t => t.type==='expense').reduce((a,t) => a+t.amount, 0), [transactions]);

  useEffect(() => { setResult(null); }, [selectedQuarter, region, taxpayerType]);

  const handleAutoFill = () => {
    const qm = QUARTERS[selectedQuarter].months;
    const businessExp = transactions
      .filter(t => t.type==='expense' && qm.includes(new Date(t.date).getMonth()+1))
      .filter(t => DEDUCTIBLE_CATEGORIES.some(c => t.category?.toLowerCase().includes(c.toLowerCase())))
      .reduce((a,t) => a+t.amount, 0);
    setDeductions(d => ({ ...d, businessExpenses: businessExp>0 ? String(businessExp) : d.businessExpenses }));
    setAutoFilled(true); setResult(null);
    setTimeout(() => setAutoFilled(false), 3000);
  };

  const liveResult = useMemo(() => {
    const totalDeductionsAnnual = Object.values(deductions).reduce((a,v) => a+(parseFloat(v)||0), 0);
    const tds = parseFloat(tdsAmount) || 0;
    let annualTaxable, annualTax;
    if (taxpayerType === "Business") {
      annualTaxable = Math.max(0, annualIncome - annualExpense - totalDeductionsAnnual);
      annualTax = calculateBusinessTax(annualTaxable);
    } else {
      annualTaxable = Math.max(0, annualIncome - tds - totalDeductionsAnnual);
      annualTax = calculateTaxByRegion(annualTaxable, region);
    }
    const qPct = QUARTER_TAX_PERCENT[selectedQuarter];
    const requiredByThisQ = Math.round(annualTax * qPct);
    const paidThisQ = parseFloat(paidAmounts[selectedQuarter]) || 0;
    const unpaid = Math.max(0, requiredByThisQ - paidThisQ);
    const overdue = isOverdue(selectedQuarter);
    const penalty = overdue && unpaid > 0 ? calculatePenalty(unpaid, selectedQuarter) : 0;
    const effectiveRate = annualTaxable > 0 ? ((annualTax/annualTaxable)*100).toFixed(1) : 0;
    return { annualTaxable, annualTax, tds, requiredByThisQ, paidThisQ, unpaid, penalty, totalDue: unpaid+penalty, effectiveRate, annualIncome, annualExpense, overdue };
  }, [deductions, annualIncome, annualExpense, region, taxpayerType, tdsAmount, selectedQuarter, paidAmounts]);

  const handleCalculate = () => setResult(liveResult);
  const handleReset = () => { setDeductions({ businessExpenses:'', retirementContributions:'', healthInsurance:'', homeOffice:'' }); setTdsAmount(''); setPaidAmounts({0:'',1:'',2:'',3:''}); setResult(null); };

  const allQuartersData = useMemo(() => QUARTERS.map((q, i) => {
    const income = transactions.filter(t => t.type==='income' && q.months.includes(new Date(t.date).getMonth()+1)).reduce((a,t) => a+t.amount, 0);
    const annualTax = taxpayerType==="Business" ? calculateBusinessTax(Math.max(0,annualIncome-annualExpense)) : calculateTaxByRegion(annualIncome, region);
    const required = Math.round(annualTax * QUARTER_TAX_PERCENT[i]);
    const paid = parseFloat(paidAmounts[i]) || 0;
    const unpaid = Math.max(0, required - paid);
    const overdue = isOverdue(i);
    const penalty = overdue && unpaid > 0 ? calculatePenalty(unpaid, i) : 0;
    return { ...q, income, required, paid, unpaid, penalty, totalDue: unpaid+penalty, overdue };
  }), [transactions, taxpayerType, annualIncome, annualExpense, region, paidAmounts]);

  const tips = TAX_SAVING_TIPS[region] || TAX_SAVING_TIPS["India (New)"];
  const totalPotentialSavings = tips.reduce((a,t) => a+t.saving, 0);

  const TABS = [
    { id:"calculator", label:"🧮 Calculator" },
    { id:"overview",   label:"📊 All Quarters" },
    { id:"tips",       label:"💡 Tax Tips" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan:"pro" }} onBudgetUpdate={() => {}} />
      <main className="flex-1 overflow-y-auto">

        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 px-4 lg:px-10 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Tax Estimator</h2>
          </div>
          <div className="sm:ml-auto flex items-center gap-3 overflow-x-auto -mx-1 px-1">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                ${saveStatus === 'saved'  ? 'bg-emerald-500 text-white' :
                  saveStatus === 'error'  ? 'bg-rose-500 text-white' :
                  saveStatus === 'saving' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                  'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
            >
              {saveStatus === 'saving' ? '⏳ Saving...' :
               saveStatus === 'saved'  ? '✓ Saved!' :
               saveStatus === 'error'  ? '✗ Error' :
               '💾 Save'}
            </button>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider whitespace-nowrap ${activeTab===t.id?'bg-white shadow-sm text-gray-800':'text-gray-400 hover:text-gray-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1100px] mx-auto">

          {/* ── CALCULATOR TAB ── */}
          {activeTab === "calculator" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 sm:p-6">
                  <h3 className="text-sm font-black text-gray-900 mb-1">Quarterly Tax Calculator</h3>
                  <p className="text-[10px] text-gray-400 font-bold mb-5">Calculate your estimated tax per quarter</p>

                  {/* Taxpayer Type */}
                  <div className="mb-5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Taxpayer Type</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-xl">
                      {["Business","Salaried"].map(type => (
                        <button key={type} onClick={() => { setTaxpayerType(type); setResult(null); }}
                          className={`py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${taxpayerType===type?'bg-white shadow-md text-gray-900 border border-gray-100':'text-gray-400 hover:text-gray-600'}`}>
                          <span>{type==='Business'?'🏢':'👔'}</span>{type} Person
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Business info banner */}
                  {taxpayerType === "Business" && (
                    <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">Business Tax Slabs (Direct Tax — India)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {BUSINESS_TAX_SLABS.map((s, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 text-center border border-amber-100">
                            <p className="text-[9px] font-bold text-gray-400">{s.label.split('(')[1]?.replace(')','') ?? s.label}</p>
                            <p className="text-sm font-black text-amber-700">{(s.rate*100).toFixed(0)}%</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-amber-600 font-bold mt-2">Taxable = Income − Expenses − Deductions</p>
                    </div>
                  )}

                  {/* Salaried TDS */}
                  {taxpayerType === "Salaried" && (
                    <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">TDS (Tax Deducted at Source)</p>
                      <p className="text-[9px] text-blue-600 font-bold mb-3">TDS already deducted from salary is subtracted from taxable amount. Tax = Slab on (Income − TDS − Deductions).</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                        <input type="number" min="0" placeholder="Enter TDS amount deducted by employer" value={tdsAmount}
                          onChange={e => { setTdsAmount(e.target.value); setResult(null); }}
                          className="w-full bg-white border border-blue-200 rounded-xl pl-7 pr-3 py-2.5 outline-none focus:border-blue-400 font-bold text-sm text-gray-700" />
                      </div>
                    </div>
                  )}

                  {/* Quarter + Region */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country / Region</label>
                      <select value={region} onChange={e => { setRegion(e.target.value); setResult(null); }}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-700 font-bold text-sm rounded-xl px-3 py-3 outline-none focus:border-emerald-300 cursor-pointer">
                        {getCountryList().map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quarter</label>
                      <select value={selectedQuarter} onChange={e => { setSelectedQuarter(Number(e.target.value)); setResult(null); }}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-700 font-bold text-sm rounded-xl px-3 py-3 outline-none focus:border-emerald-300 cursor-pointer">
                        {QUARTERS.map((q,i) => <option key={i} value={i}>{q.full} — Due {q.due} ({q.percent}%)</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Paid amount for selected quarter */}
                  <div className="mb-5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                      Amount Already Paid for {QUARTERS[selectedQuarter].label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                      <input type="number" min="0" placeholder="0.00"
                        value={paidAmounts[selectedQuarter]}
                        onChange={e => { setPaidAmounts(p => ({ ...p, [selectedQuarter]: e.target.value })); setResult(null); }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-7 pr-3 py-2.5 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700" />
                    </div>
                    {isOverdue(selectedQuarter) && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1.5">⚠ This quarter is overdue — 1% penalty/month on unpaid tax applies!</p>
                    )}
                  </div>

                  {/* Income display */}
                  <div className="mb-5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Annual Income (from all transactions)</label>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex justify-between items-center">
                      <span className="text-[11px] font-black text-emerald-700 uppercase">Auto-calculated</span>
                      <span className="text-lg font-black text-emerald-700">{formatCurrency(annualIncome)}</span>
                    </div>
                    {taxpayerType === "Business" && annualExpense > 0 && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 flex justify-between items-center mt-2">
                        <span className="text-[11px] font-black text-rose-600 uppercase">Annual Expenses</span>
                        <span className="font-black text-rose-600">−{formatCurrency(annualExpense)}</span>
                      </div>
                    )}
                  </div>

                  {/* Deductions */}
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Deductions <span className="normal-case text-gray-300">(annual)</span></p>
                    <button onClick={handleAutoFill}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${autoFilled?'bg-emerald-500 text-white':'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                      {autoFilled ? '✓ Auto-filled!' : '⚡ Auto-fill from transactions'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      { key:'businessExpenses',        label:'Business Expenses',        hint:'Software, equipment, office supplies' },
                      { key:'retirementContributions', label:'Retirement Contributions', hint:'NPS, EPF, 401k, IRA' },
                      { key:'healthInsurance',         label:'Health Insurance',         hint:'Medical insurance premiums' },
                      { key:'homeOffice',              label:'Home Office',              hint:'Proportion of rent/electricity' },
                    ].map(({ key, label, hint }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">{policy?.symbol||'₹'}</span>
                          <input type="number" min="0" placeholder="0.00" value={deductions[key]}
                            onChange={e => { setDeductions(d => ({ ...d, [key]: e.target.value })); setResult(null); }}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-7 pr-3 py-2.5 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700" />
                        </div>
                        <p className="text-[9px] text-gray-300 font-bold">{hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleCalculate} className="flex-1 bg-emerald-500 text-white py-3.5 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95">
                      Calculate Estimated Tax
                    </button>
                    <button onClick={handleReset} className="px-5 bg-gray-100 text-gray-500 py-3.5 rounded-xl font-black text-sm hover:bg-gray-200 transition-all">
                      Reset
                    </button>
                  </div>
                </div>

                {/* Tax Slab Table */}
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 sm:p-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Tax Slabs — {taxpayerType === "Business" ? "Business Person (India)" : region}
                  </h3>
                  <div className="space-y-2">
                    {(taxpayerType === "Business" ? BUSINESS_TAX_SLABS : (policy?.slabs || [])).map((slab, i) => {
                      const taxable = liveResult.annualTaxable;
                      const min = taxpayerType==="Business" ? slab.min : (i===0 ? 0 : (policy?.slabs[i-1]?.limit ?? 0));
                      const max = taxpayerType==="Business" ? slab.max : slab.limit;
                      const inSlab = taxable > min && (max===Infinity || taxable <= max);
                      return (
                        <div key={i} className={`flex justify-between items-center px-4 py-2.5 rounded-xl border transition-all ${inSlab&&taxable>0?'bg-emerald-50 border-emerald-200 shadow-sm':'bg-gray-50/50 border-transparent'}`}>
                          <span className={`text-xs font-bold ${inSlab&&taxable>0?'text-emerald-800':'text-gray-500'}`}>
                            {taxpayerType==="Business" ? slab.label : slab.label}
                          </span>
                          {inSlab && taxable > 0 && (
                            <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Your bracket</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {taxpayerType === "Business" && (
                    <p className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400 font-bold leading-relaxed">
                      ℹ Q1 (15%) due Jun 15 · Q2 (45%) due Sep 15 · Q3 (75%) due Dec 15 · Q4 (100%) due Mar 15. Late payment = 1%/month penalty.
                    </p>
                  )}
                  {taxpayerType === "Salaried" && policy?.notes && (
                    <p className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400 font-bold leading-relaxed">ℹ {policy.notes}</p>
                  )}
                </div>
              </div>

              {/* Right: Summary Panel */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 sm:p-6 lg:sticky lg:top-24">
                  <h3 className="text-sm font-black text-gray-900 mb-1">Tax Summary</h3>
                  <p className="text-[10px] text-gray-400 font-bold mb-5">{QUARTERS[selectedQuarter].full} · {taxpayerType}</p>
                  {!result ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <span className="text-4xl mb-3 opacity-20">🧮</span>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Fill in the form and click Calculate</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between">
                        <span className="text-xs font-bold text-gray-500">Annual Income</span>
                        <span className="text-sm font-black text-gray-900">{formatCurrency(result.annualIncome)}</span>
                      </div>
                      {taxpayerType==="Business" && (
                        <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between">
                          <span className="text-xs font-bold text-gray-500">Annual Expenses</span>
                          <span className="text-sm font-black text-rose-500">−{formatCurrency(result.annualExpense)}</span>
                        </div>
                      )}
                      {taxpayerType==="Salaried" && result.tds > 0 && (
                        <div className="bg-blue-50 rounded-xl p-3.5 flex justify-between border border-blue-100">
                          <span className="text-xs font-bold text-blue-700">TDS Deducted</span>
                          <span className="text-sm font-black text-blue-700">−{formatCurrency(result.tds)}</span>
                        </div>
                      )}
                      <div className="bg-emerald-50 rounded-xl p-3.5 flex justify-between border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700">Annual Taxable</span>
                        <span className="text-sm font-black text-emerald-700">{formatCurrency(result.annualTaxable)}</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between">
                        <span className="text-xs font-bold text-gray-500">Annual Tax</span>
                        <span className="text-sm font-black text-gray-900">{formatCurrency(result.annualTax)}</span>
                      </div>
                      <div className="h-px bg-gray-100" />
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-black text-amber-700 uppercase">{QUARTERS[selectedQuarter].label} Required ({QUARTERS[selectedQuarter].percent}%)</span>
                          <span className="text-xs font-black text-amber-600">Due: {QUARTERS[selectedQuarter].due}</span>
                        </div>
                        <p className="text-2xl font-black text-amber-700">{formatCurrency(result.requiredByThisQ)}</p>
                      </div>
                      {result.paidThisQ > 0 && (
                        <div className="bg-green-50 rounded-xl p-3.5 flex justify-between border border-green-100">
                          <span className="text-xs font-bold text-green-700">✓ Already Paid</span>
                          <span className="text-sm font-black text-green-700">{formatCurrency(result.paidThisQ)}</span>
                        </div>
                      )}
                      {result.unpaid > 0 && (
                        <div className="bg-rose-50 rounded-xl p-3.5 flex justify-between border border-rose-100">
                          <span className="text-xs font-bold text-rose-600">Balance Due</span>
                          <span className="text-sm font-black text-rose-600">{formatCurrency(result.unpaid)}</span>
                        </div>
                      )}
                      {result.penalty > 0 && (
                        <div className="bg-red-100 rounded-xl p-3.5 flex justify-between border border-red-200">
                          <span className="text-xs font-bold text-red-700">⚠ Late Penalty (1%/mo)</span>
                          <span className="text-sm font-black text-red-700">+{formatCurrency(result.penalty)}</span>
                        </div>
                      )}
                      {(result.unpaid > 0 || result.penalty > 0) && (
                        <div className="bg-gray-900 rounded-xl p-4 flex justify-between">
                          <span className="text-xs font-black text-white uppercase">Total to Pay Now</span>
                          <span className="text-sm font-black text-emerald-400">{formatCurrency(result.totalDue)}</span>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between">
                        <span className="text-xs font-bold text-gray-500">Effective Rate</span>
                        <span className="text-sm font-black text-gray-700">{result.effectiveRate}%</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 text-center pt-1">* Estimate only. Consult a CA.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ALL QUARTERS TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxpayer Type</label>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                  {["Business","Salaried"].map(type => (
                    <button key={type} onClick={() => setTaxpayerType(type)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${taxpayerType===type?'bg-white shadow-sm text-gray-800':'text-gray-400'}`}>
                      {type==='Business'?'🏢':'👔'} {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {allQuartersData.map((q, i) => {
                  const c = QUARTER_COLORS[q.color];
                  return (
                    <div key={i} className={`bg-white rounded-2xl border shadow-sm p-5 ${c.border}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${c.text}`}>{q.full}</span>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">Due {q.due}</p>
                          <p className="text-[9px] font-black text-gray-300">{q.percent}% of annual tax</p>
                        </div>
                        <span className={`${c.badge} text-white text-[9px] font-black px-2 py-1 rounded-lg`}>{q.label}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase">Quarter Income</p>
                          <p className="text-base font-black text-gray-900">{formatCurrency(q.income)}</p>
                        </div>
                        <div className={`rounded-xl p-2.5 ${c.bg}`}>
                          <p className="text-[9px] font-black text-gray-500 uppercase">Tax Required</p>
                          <p className={`text-sm font-black ${c.text}`}>{formatCurrency(q.required)}</p>
                        </div>
                        {q.paid > 0 && (
                          <div className="rounded-xl p-2.5 bg-green-50">
                            <p className="text-[9px] font-black text-green-600 uppercase">✓ Paid</p>
                            <p className="text-sm font-black text-green-700">{formatCurrency(q.paid)}</p>
                          </div>
                        )}
                        {q.unpaid > 0 && (
                          <div className={`rounded-xl p-2.5 ${q.overdue?'bg-red-50':'bg-amber-50'}`}>
                            <p className={`text-[9px] font-black uppercase ${q.overdue?'text-red-600':'text-amber-600'}`}>{q.overdue?'⚠ Overdue':'Balance Due'}</p>
                            <p className={`text-sm font-black ${q.overdue?'text-red-700':'text-amber-700'}`}>{formatCurrency(q.unpaid)}</p>
                          </div>
                        )}
                        {q.penalty > 0 && (
                          <div className="rounded-xl p-2.5 bg-red-100">
                            <p className="text-[9px] font-black text-red-700 uppercase">1% Penalty</p>
                            <p className="text-sm font-black text-red-700">+{formatCurrency(q.penalty)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mark payments input */}
              <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 sm:p-6">
                <h3 className="text-sm font-black text-gray-900 mb-1">Mark Payments Made</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4">Enter amounts already paid to check if penalty applies.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {QUARTERS.map((q, i) => {
                    const c = QUARTER_COLORS[q.color];
                    return (
                      <div key={i} className="space-y-1">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${c.text}`}>{q.label} Paid</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">₹</span>
                          <input type="number" min="0" placeholder="0" value={paidAmounts[i]}
                            onChange={e => setPaidAmounts(p => ({ ...p, [i]: e.target.value }))}
                            className={`w-full bg-gray-50 border rounded-xl pl-5 pr-2 py-2 outline-none font-bold text-xs text-gray-700 ${c.border}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Annual Summary */}
              <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 sm:p-6">
                <h3 className="text-sm font-black text-gray-900 mb-4">Annual Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label:"Annual Income",   value: formatCurrency(annualIncome),                                              color:"text-emerald-600" },
                    { label:"Total Tax Due",    value: formatCurrency(allQuartersData[3]?.required || 0),                       color:"text-amber-600" },
                    { label:"Total Paid",       value: formatCurrency(allQuartersData.reduce((a,q) => a+q.paid, 0)),            color:"text-blue-600" },
                    { label:"Total Penalty",    value: formatCurrency(allQuartersData.reduce((a,q) => a+q.penalty, 0)),         color:"text-red-600" },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAX TIPS TAB ── */}
          {activeTab === "tips" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Tax Saving Opportunities</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Smart ways to legally reduce your tax</p>
                </div>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-2 font-bold text-sm text-gray-700 outline-none focus:border-emerald-300 cursor-pointer shadow-sm w-full sm:w-auto">
                  {getCountryList().map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Potential Annual Tax Savings</p>
                <p className="text-3xl font-black">{formatCurrency(totalPotentialSavings)}</p>
                <p className="text-xs font-bold opacity-70 mt-1">If you apply all the tips below</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tips.map((tip, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5 hover:shadow-md hover:border-emerald-100 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{tip.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-1 mb-1">
                          <h4 className="text-sm font-black text-gray-900">{tip.title}</h4>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex-shrink-0">Save ~{formatCurrency(tip.saving)}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-amber-700">⚠ DISCLAIMER: General strategies only. Always consult a certified CA before making tax decisions.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TaxEstimatorPage;