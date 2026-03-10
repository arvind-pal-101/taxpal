import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  QUARTERS, QUARTER_MONTHS, BUSINESS_EXPENSE_CATEGORIES, SALARIED_DEDUCTION_SECTIONS,
  calculateBusinessTax, calculateSalariedTax, calculatePenalty, compareRegimes,
} from '../utils/taxCalculations';
import { formatCurrency } from '../utils/financeHelpers';
import API_URL from '../api';

const fmt = (n) => formatCurrency(Math.round(n || 0));

/* ── Sub-components ── */

const RupeeInput = ({ value, onChange, placeholder, sm, indigo }) => (
  <div className="relative">
    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none z-10">
      &#8377;
    </span>
    <input
      type="number" min="0"
      placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      className={[
        'w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl outline-none box-border transition-all font-semibold text-slate-800 font-sans',
        sm ? 'pl-6 pr-3 py-2 text-sm' : 'pl-7 pr-3 py-2.5 text-sm',
        indigo
          ? 'focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-50'
          : 'focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-50',
      ].join(' ')}
    />
  </div>
);

const ToggleGroup = ({ options, value, onChange, indigo }) => (
  <div className="flex bg-slate-100 rounded-xl p-[3px] gap-[3px]">
    {options.map(o => {
      const active = value === o.id;
      const isInd  = indigo && o.id === 'old';
      return (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={[
            'flex-1 px-3.5 py-[7px] rounded-[8px] border-none cursor-pointer text-[11px] font-bold tracking-[.03em] whitespace-nowrap transition-all',
            active
              ? isInd
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-400',
          ].join(' ')}>
          {o.label === 'salaried' ? <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Salaried</span> : o.label === 'business' ? <span className="flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>Business</span> : o.label}
        </button>
      );
    })}
  </div>
);

const CARD_ICONS = {
  salaried: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  business: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  calendar: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>,
  document: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 12h8M8 17h5"/></svg>,
  box: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  warning: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};
const CardIcon = ({ emoji, bg }) => (
  <div className={`w-[34px] h-[34px] ${bg} rounded-[10px] flex items-center justify-center shrink-0`}
    style={{ color: bg.includes('eff6ff') ? '#3b82f6' : bg.includes('ecfdf5') ? '#10b981' : bg.includes('eef2ff') ? '#6366f1' : bg.includes('fff7ed') ? '#f59e0b' : bg.includes('fef2f2') ? '#ef4444' : '#64748b' }}>
    {CARD_ICONS[emoji] || <span className="text-[17px]">{emoji}</span>}
  </div>
);

const SlabRow = ({ slab, isIndigo }) => {
  const rc = isIndigo ? '#6366f1' : '#10b981';
  return (
    <div className={[
      'rounded-[9px] transition-all',
      slab.isActive
        ? isIndigo ? 'border border-[#c7d2fe] bg-[#eef2ff]' : 'border border-[#d1fae5] bg-[#ecfdf5]'
        : 'border border-slate-100 bg-slate-50 opacity-40',
    ].join(' ')}>
      <div className="p-[9px_12px]">
        <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 88px 76px' }}>
          <div className="flex items-center gap-[7px] min-w-0">
            <span className="shrink-0 text-[9px] font-bold px-[7px] py-[2px] rounded-full text-white"
              style={{ background: slab.isActive ? rc : '#cbd5e1' }}>
              {slab.pct}
            </span>
            <span className="text-[11px] font-semibold truncate"
              style={{ color: slab.isActive ? '#334155' : '#94a3b8' }}>
              {slab.label}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-right"
            style={{ color: slab.isActive ? '#64748b' : '#cbd5e1' }}>
            {slab.isActive ? fmt(slab.amount) : '—'}
          </span>
          <span className="text-[12px] font-bold text-right"
            style={{ color: slab.isActive ? rc : '#cbd5e1' }}>
            {slab.isActive ? fmt(slab.tax) : '—'}
          </span>
        </div>
        {slab.isActive && (
          <div className="h-[3px] rounded-full mt-[5px]" style={{ background: `${rc}20` }}>
            <div className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(slab.rate * 100, 4)}%`, background: rc }} />
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label: lbl, value, color, bg }) => (
  <div className="flex justify-between items-center px-[11px] py-[9px] rounded-[9px]"
    style={{ background: bg || '#f8fafc' }}>
    <span className="text-[12px] font-semibold text-slate-500">{lbl}</span>
    <span className="text-[13px] font-extrabold" style={{ color: color || '#1e293b' }}>{value}</span>
  </div>
);

/* ══════════ MAIN ══════════ */
const TaxEstimatorPage = ({ transactions = [] }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode,        setMode]        = useState('salaried');
  const [activeTab,   setActiveTab]   = useState('calc');
  const [regime,      setRegime]      = useState('new');

  const [country,   setCountry]   = useState('india');
  const [salGross, setSalGross] = useState('');
  const [tds,      setTds]      = useState('');
  const [salDed,   setSalDed]   = useState(Object.fromEntries(SALARIED_DEDUCTION_SECTIONS.map(d => [d.key, ''])));
  const [bizGross, setBizGross] = useState('');
  const [bizExp,   setBizExp]   = useState(Object.fromEntries(BUSINESS_EXPENSE_CATEGORIES.map(d => [d.key, ''])));
  const [penQ,     setPenQ]     = useState(0);
  const [penDue,   setPenDue]   = useState('');
  const [penPaid,  setPenPaid]  = useState('');
  const [itrStatus, setItrStatus] = useState('late');

  // Auto-fill income from transactions
  const autoIncome = useMemo(() => {
    if (!Array.isArray(transactions) || !transactions.length) return 0;
    return transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  }, [transactions]);

  // Auto-fill income from transactions on mount
  useEffect(() => {
    if (autoIncome > 0 && !salGross && !bizGross) {
      setSalGross(String(Math.round(autoIncome)));
      setBizGross(String(Math.round(autoIncome)));
    }
  }, [autoIncome]);

  const salResult = useMemo(() => {
    const g = Number(salGross); if (!g) return null;
    return calculateSalariedTax(g, Number(tds) || 0, salDed, regime);
  }, [salGross, tds, salDed, regime]);

  const bizResult = useMemo(() => {
    const g = Number(bizGross); if (!g) return null;
    return calculateBusinessTax(g, Object.values(bizExp).reduce((a, v) => a + (Number(v) || 0), 0), regime);
  }, [bizGross, bizExp, regime]);

  const comparison = useMemo(() => {
    const g = Number(salGross); if (!g) return null;
    return compareRegimes(g, Number(tds) || 0, salDed);
  }, [salGross, tds, salDed]);

  const result    = mode === 'salaried' ? salResult : bizResult;
  const penResult = useMemo(() => penDue ? calculatePenalty(Number(penDue) || 0, Number(penPaid) || 0, penQ) : null, [penDue, penPaid, penQ]);

  const isOld   = regime === 'old';
  const rc      = isOld ? '#6366f1' : '#10b981';
  const rLight  = isOld ? '#eef2ff' : '#ecfdf5';
  const rBorder = isOld ? '#c7d2fe' : '#d1fae5';
  const rDark   = isOld ? '#4f46e5' : '#059669';

  const itrPen = useMemo(() => {
    const inc = result?.grossIncome || 0;
    const low = inc <= 500000;
    const map = {
      ontime:   { penalty: 0,                  label: 'Filed by 31st July',     color: '#059669', icon: '✅' },
      late:     { penalty: low ? 1000 : 5000,  label: 'Filed Aug – 31st Dec',   color: '#d97706', icon: '⚠️' },
      verylate: { penalty: low ? 1000 : 10000, label: 'Filed after 31st Dec',   color: '#e11d48', icon: '🚨' },
      notfiled: { penalty: low ? 1000 : 10000, label: 'Not Filed At All',       color: '#be123c', icon: '❌' },
    };
    const r = map[itrStatus];
    return { ...r, interest: itrStatus === 'notfiled' ? Math.round(inc * 0.01) : 0 };
  }, [result, itrStatus]);

  const COUNTRIES = [
    { id: 'india', flag: '🇮🇳', label: 'India',       available: true  },
    { id: 'usa',   flag: '🇺🇸', label: 'USA',         available: false },
    { id: 'uk',    flag: '🇬🇧', label: 'UK',          available: false },
    { id: 'aus',   flag: '🇦🇺', label: 'Australia',   available: false },
    { id: 'sgp',   flag: '🇸🇬', label: 'Singapore',   available: false },
  ];

  const SLABS_NEW = [['₹0–₹3L','0%'],['₹3L–₹7L','5%'],['₹7L–₹10L','10%'],['₹10L–₹12L','15%'],['₹12L–₹15L','20%'],['₹15L+','30%']];
  const SLABS_OLD = [['₹0–₹2.5L','0%'],['₹2.5L–₹5L','5%'],['₹5L–₹10L','10%'],['₹10L–₹20L','20%'],['₹20L+','30%']];
  const QTR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  /* ── Save to DB ── */
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error

  const handleSave = async () => {
    if (!result) return;
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      if (!token) { setSaveStatus('error'); return; }

      await axios.post(
        `${API_URL}/api/taxes/save`,
        {
          country,
          regime,
          mode,
          grossIncome:    result.grossIncome,
          taxableIncome:  result.taxableIncome,
          totalTax:       result.totalTax,
          tdsAlreadyPaid: mode === 'salaried' ? (Number(tds) || 0) : 0,
          remainingTax:   result.remainingTax  ?? 0,
          refund:         result.refund        ?? 0,
          effectiveRate:  result.effectiveRate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Save result to localStorage for TaxCalendar to use
      localStorage.setItem('taxEstimatorResult', JSON.stringify({
        totalTax:      result.totalTax,
        grossIncome:   result.grossIncome,
        taxableIncome: result.taxableIncome,
        effectiveRate: result.effectiveRate,
        regime,
        mode,
        savedAt: new Date().toISOString(),
      }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Tax save error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} userStatus={{ plan: 'pro' }} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto min-w-0">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-30 border-b border-slate-100"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}>

          {/* top row */}
          <div className="flex items-center gap-[10px] flex-wrap px-4 lg:px-6 py-3">

            {/* Hamburger — hidden on lg+ */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-[34px] h-[34px] rounded-[9px] border border-slate-200 bg-white cursor-pointer shrink-0 text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">Tax Estimator</div>
              <div className="text-[10px] text-slate-400 font-semibold">FY 2024-25 · New &amp; Old Regime</div>
            </div>

            {/* Country Selector */}
            <div className="relative">
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-[7px] pr-7 text-[11px] font-bold text-slate-700 outline-none cursor-pointer transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
              >
                {COUNTRIES.map(c => (
                  <option key={c.id} value={c.id} disabled={!c.available}>
                    {c.flag} {c.label}{!c.available ? ' (Coming Soon)' : ''}
                  </option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[9px]">▼</span>
            </div>

            {/* Controls — full-width on mobile */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <ToggleGroup
                options={[{ id: 'salaried', label: 'salaried' }, { id: 'business', label: 'business' }]}
                value={mode} onChange={setMode}
              />
              <ToggleGroup
                options={[{ id: 'new', label: 'New Regime' }, { id: 'old', label: 'Old Regime' }]}
                value={regime} onChange={setRegime} indigo
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 lg:px-6 pb-[10px] overflow-x-auto">
            {[
              { id: 'calc',     label: '🧮 Calculator' },
              { id: 'quarters', label: '📅 Quarterly'  },
              { id: 'penalty',  label: '⚠️ Penalty'    },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={[
                  'px-3 sm:px-5 py-[7px] rounded-[8px] border-none cursor-pointer text-[10px] sm:text-[11px] font-bold tracking-[.04em] transition-all whitespace-nowrap',
                  activeTab === t.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                ].join(' ')}>
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── PAGE BODY ── */}
        <div className="px-4 lg:px-6 pt-5 pb-12 max-w-[1160px] mx-auto">

          {/* ════ COUNTRY NOT AVAILABLE ════ */}
          {country !== 'india' && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-[56px] mb-4">
                {COUNTRIES.find(c => c.id === country)?.flag}
              </div>
              <div className="text-[18px] font-extrabold text-slate-800 mb-2">
                {COUNTRIES.find(c => c.id === country)?.label} — Coming Soon
              </div>
              <div className="text-[12px] text-slate-400 font-semibold max-w-xs leading-relaxed mb-6">
                We're working on tax calculations for this country. Currently only 🇮🇳 India is supported.
              </div>
              <button
                onClick={() => setCountry('india')}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[12px] font-bold border-none cursor-pointer hover:bg-emerald-600 transition-all">
                Switch to India →
              </button>
            </div>
          )}

          {/* ════ INDIA CONTENT ════ */}
          {country === 'india' && (<>

          {/* ════ CALCULATOR TAB ════ */}
          {activeTab === 'calc' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

              {/* LEFT */}
              <div className="flex flex-col gap-[14px]">

                {/* Regime banner */}
                <div className="rounded-[12px] p-[13px_16px]" style={{ background: rLight, border: `1px solid ${rBorder}` }}>
                  <div className="flex justify-between items-center mb-[9px]">
                    <span className="text-[12px] font-extrabold" style={{ color: rDark }}>{isOld ? '🔵 Old Regime' : '🟢 New Regime'}</span>
                    <span className="text-[9px] font-semibold opacity-70" style={{ color: rDark }}>FY 2024-25</span>
                  </div>
                  <div className={`grid gap-[5px] ${isOld ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {(isOld ? SLABS_OLD : SLABS_NEW).map(([range, rate]) => (
                      <div key={range} className="flex justify-between rounded-[7px] px-[9px] py-[4px]"
                        style={{ background: 'rgba(255,255,255,.55)' }}>
                        <span className="text-[10px] font-semibold text-slate-700">{range}</span>
                        <span className="text-[10px] font-extrabold" style={{ color: rc }}>{rate}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[9px] font-semibold leading-relaxed" style={{ color: rDark }}>
                    {isOld
                      ? 'Std. Deduction ₹50,000 · 87A rebate ≤₹5L → ₹0 tax · 80C, 80D, HRA allowed'
                      : 'Std. Deduction ₹75,000 · 87A rebate ≤₹7L → ₹0 tax · No 80C/80D'}
                  </div>
                </div>

                {/* ── SALARIED FORM ── */}
                {mode === 'salaried' && (
                  <>
                    {/* Income card */}
                    <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                        <CardIcon emoji="salaried" bg="bg-[#eff6ff]" />
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">Salaried Income</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Enter annual gross salary</div>
                        </div>
                      </div>
                      <div className="p-[14px_18px] flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-1">Annual Gross Salary</span>
                            <RupeeInput value={salGross} onChange={setSalGross} placeholder="e.g. 800000" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-1">TDS Already Deducted</span>
                            <RupeeInput value={tds} onChange={setTds} placeholder="e.g. 5000" />
                            <div className="text-[9px] text-slate-400 mt-1">From Form 16 — deducted by employer</div>
                          </div>
                        </div>
                        {/* Std deduction badge */}
                        <div className="flex items-center justify-between rounded-[9px] px-[13px] py-[9px]"
                          style={{ background: rLight, border: `1px solid ${rBorder}` }}>
                          <div className="flex items-center gap-[7px]">
                            <span className="text-[15px]">📦</span>
                            <div>
                              <div className="text-[11px] font-bold" style={{ color: rDark }}>Standard Deduction — Auto</div>
                              <div className="text-[9px] font-semibold opacity-70" style={{ color: rDark }}>Fixed by Govt · both regimes</div>
                            </div>
                          </div>
                          <span className="text-[14px] font-extrabold" style={{ color: rDark }}>{isOld ? '₹50,000 ✓' : '₹75,000 ✓'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Old regime deductions */}
                    {isOld && (
                      <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                          <CardIcon emoji="document" bg="bg-[#eef2ff]" />
                          <div>
                            <div className="text-[13px] font-bold text-slate-900">Old Regime — Deductions</div>
                            <div className="text-[10px] text-slate-400 font-semibold">As per Income Tax Act — enter what applies</div>
                          </div>
                        </div>
                        <div className="p-[14px_18px] flex flex-col gap-[10px]">
                          {SALARIED_DEDUCTION_SECTIONS.map(d => {
                            const val  = Number(salDed[d.key]) || 0;
                            const over = d.max && val > d.max;
                            return (
                              <div key={d.key} className="rounded-[11px] p-[11px_13px]"
                                style={{ background: '#f8fafc', border: `1px solid ${over ? '#fda4af' : '#f1f5f9'}` }}>
                                <div className="flex items-start gap-[9px] mb-2">
                                  <span className="text-[18px] shrink-0">{d.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2 flex-wrap">
                                      <div className="text-[12px] font-bold text-slate-800">{d.label}</div>
                                      <span className="text-[9px] font-bold px-2 py-[2px] rounded-full whitespace-nowrap"
                                        style={{ background: `${d.color}14`, color: d.color }}>{d.maxLabel}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">{d.hint}</div>
                                  </div>
                                </div>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">&#8377;</span>
                                  <input type="number" min="0" placeholder="0 — leave blank if not applicable"
                                    value={salDed[d.key]}
                                    onChange={e => setSalDed(p => ({ ...p, [d.key]: e.target.value }))}
                                    className={[
                                      'w-full bg-slate-50 border-[1.5px] rounded-[9px] pl-7 pr-3 py-2 text-[13px] font-semibold text-slate-800 outline-none box-border transition-all',
                                      over
                                        ? 'border-red-400 focus:border-red-400 focus:ring-[3px] focus:ring-red-50'
                                        : 'border-slate-200 focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-50',
                                    ].join(' ')}
                                  />
                                </div>
                                {over && <div className="text-[9px] text-red-500 font-bold mt-1">⚠ Exceeds limit — only {fmt(d.max)} applied</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* New regime info */}
                    {!isOld && (
                      <div className="rounded-[11px] p-[11px_15px]" style={{ background: '#ecfdf5', border: '1px solid #d1fae5' }}>
                        <div className="text-[11px] font-bold text-emerald-700 mb-[3px]">ℹ New Regime — No Additional Deductions</div>
                        <div className="text-[10px] text-emerald-700 leading-relaxed" style={{ opacity: 0.85 }}>
                          Only Standard Deduction (₹75,000) is auto-applied. Switch to Old Regime to claim 80C, 80D, HRA, NPS etc.
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── BUSINESS FORM ── */}
                {mode === 'business' && (
                  <>
                    <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                        <CardIcon emoji="business" bg="bg-[#ecfdf5]" />
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">Business Income</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Gross Income − Expenses = Taxable</div>
                        </div>
                      </div>
                      <div className="p-[14px_18px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-1">Annual Gross Business Income</span>
                        <RupeeInput value={bizGross} onChange={setBizGross} placeholder="e.g. 1200000" />
                      </div>
                    </div>

                    <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                        <CardIcon emoji="box" bg="bg-slate-50" />
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">Business Expenses</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Deductible — keep valid receipts</div>
                        </div>
                      </div>
                      {/* auto-fit grid — same as original */}
                      <div className="grid gap-[10px] p-[14px_18px]"
                        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                        {BUSINESS_EXPENSE_CATEGORIES.map(d => (
                          <div key={d.key} className="rounded-[10px] p-[10px_12px]"
                            style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                            <div className="text-[10px] font-bold text-slate-700 mb-[6px] flex items-center gap-[5px]">
                              {d.icon} {d.label}
                            </div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[12px] pointer-events-none">&#8377;</span>
                              <input type="number" min="0" placeholder="0" value={bizExp[d.key]}
                                onChange={e => setBizExp(p => ({ ...p, [d.key]: e.target.value }))}
                                className="w-full bg-white border-[1.5px] border-slate-200 rounded-[9px] pl-7 pr-3 py-2 text-[13px] font-semibold text-slate-800 outline-none box-border transition-all focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-50"
                              />
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1">{d.hint}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mx-[14px] mb-[14px] rounded-[10px] p-[10px_13px]"
                        style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <div className="text-[10px] font-bold text-sky-700 mb-[2px]">📖 Example</div>
                        <div className="text-[10px] text-sky-600 font-semibold leading-relaxed">
                          Income ₹8L − Expenses ₹1L = Taxable ₹7L<br />
                          <em>New:</em> ₹20,000 &nbsp;|&nbsp; <em>Old:</em> ₹52,500
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT — Results */}
              <div className="flex flex-col gap-[14px]">
                {!result ? (
                  <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm flex flex-col items-center justify-center p-[60px_24px] text-center"
                    style={{ opacity: 0.18, minHeight: 260 }}>
                    <div className="text-[48px] mb-3">🧮</div>
                    <div className="text-[12px] font-bold text-slate-900 uppercase tracking-[.1em] leading-relaxed">
                      Enter income above<br />Tax will appear here
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Stat grid — always 2 cols */}
                    <div className="grid grid-cols-2 gap-[10px]">
                      {(mode === 'salaried' ? [
                        { label: 'Gross Salary',   value: fmt(result.grossIncome),           color: '#0f172a', bg: '#fff'    },
                        { label: 'Deductions',      value: `−${fmt(result.totalDeductions)}`, color: '#e11d48', bg: '#fff1f2' },
                        { label: 'Taxable Income', value: fmt(result.taxableIncome),          color: rDark,     bg: rLight    },
                        { label: 'Total Tax',      value: fmt(result.totalTax),               color: '#92400e', bg: '#fffbeb' },
                      ] : [
                        { label: 'Gross Income',   value: fmt(result.grossIncome),            color: '#0f172a', bg: '#fff'    },
                        { label: 'Expenses',        value: `−${fmt(result.totalExpenses)}`,   color: '#e11d48', bg: '#fff1f2' },
                        { label: 'Taxable Income', value: fmt(result.taxableIncome),          color: rDark,     bg: rLight    },
                        { label: 'Total Tax',      value: fmt(result.totalTax),               color: '#92400e', bg: '#fffbeb' },
                      ]).map(s => (
                        <div key={s.label} className="rounded-[12px] border border-slate-100 p-[14px_16px]"
                          style={{ background: s.bg }}>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[.12em] mb-[6px]">{s.label}</div>
                          <div className="text-[18px] font-extrabold truncate tracking-[-0.02em]" style={{ color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Regime comparison */}
                    {mode === 'salaried' && comparison && (
                      <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm p-[15px_18px]">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-[9px]">⚖️ Regime Comparison</div>
                        <div className="grid grid-cols-2 gap-[10px]">
                          {[
                            { id: 'new', label: '🟢 New', res: comparison.newResult, acc: '#10b981', light: '#ecfdf5', bdr: '#d1fae5' },
                            { id: 'old', label: '🔵 Old', res: comparison.oldResult, acc: '#6366f1', light: '#eef2ff', bdr: '#c7d2fe' },
                          ].map(r => {
                            const better = comparison.better === r.id;
                            return (
                              <div key={r.id} className="relative rounded-[11px] p-[11px_13px]"
                                style={{ background: better ? r.light : '#f8fafc', border: `2px solid ${better ? r.acc : '#e2e8f0'}` }}>
                                {better && (
                                  <div className="absolute -top-[9px] right-2 text-white text-[8px] font-extrabold px-[7px] py-[2px] rounded-full"
                                    style={{ background: r.acc }}>✓ BETTER</div>
                                )}
                                <div className="text-[10px] font-bold mb-[5px]" style={{ color: better ? r.acc : '#94a3b8' }}>{r.label} Regime</div>
                                <div className="text-[19px] font-extrabold tracking-[-0.02em]" style={{ color: better ? r.acc : '#64748b' }}>{fmt(r.res.totalTax)}</div>
                                <div className="text-[9px] text-slate-400 mt-[2px]">Taxable: {fmt(r.res.taxableIncome)}</div>
                                {r.res.rebateApplied && <div className="text-[9px] font-bold mt-[3px]" style={{ color: r.acc }}>🎉 87A rebate</div>}
                              </div>
                            );
                          })}
                        </div>
                        {comparison.better !== 'equal' && (
                          <div className="mt-[9px] px-[11px] py-[7px] bg-slate-50 rounded-[9px] text-[10px] font-bold text-slate-600 text-center">
                            {comparison.better === 'new' ? '🟢 New' : '🔵 Old'} Regime saves&nbsp;
                            <strong style={{ color: comparison.better === 'new' ? '#059669' : '#4f46e5' }}>{fmt(comparison.saving)}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Applied deductions — old salaried */}
                    {mode === 'salaried' && isOld && result.totalDeductions > result.standardDeduction && (
                      <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                          <div className="text-[12px] font-bold text-slate-900">🧾 Applied Deductions</div>
                        </div>
                        <div className="p-[14px_18px] flex flex-col gap-[6px]">
                          <Row label="📦 Standard Deduction" value={fmt(result.standardDeduction)} color="#4f46e5" bg="#eef2ff" />
                          {SALARIED_DEDUCTION_SECTIONS.map(d => {
                            const km  = { sec80c: 'sec80C', sec80d: 'sec80D', nps: 'nps80CCD', hra: 'hra' };
                            const val = result.appliedDeductions?.[km[d.key]];
                            if (!val) return null;
                            return <Row key={d.key} label={`${d.icon} ${d.label}`} value={fmt(val)} color={d.color} />;
                          })}
                          <div className="flex justify-between px-[11px] py-[9px] bg-slate-100 rounded-[9px] mt-[2px]">
                            <span className="text-[12px] font-bold text-slate-700">Total Deductions</span>
                            <span className="text-[13px] font-extrabold text-red-500">−{fmt(result.totalDeductions)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Slab breakdown */}
                    <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center flex-wrap gap-[6px] px-[18px] py-[13px] border-b border-slate-100">
                        <div>
                          <div className="text-[12px] font-bold text-slate-900">📊 Tax Slab Breakdown</div>
                          <div className="text-[9px] text-slate-400 font-semibold mt-[2px]">
                            Taxable: <strong style={{ color: rc }}>{fmt(result.taxableIncome)}</strong>&nbsp;·&nbsp;
                            Rate: <strong className="text-amber-600">{result.effectiveRate}%</strong>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-[9px] py-[2px] rounded-full"
                          style={{ background: rLight, color: rDark, border: `1px solid ${rBorder}` }}>
                          {isOld ? 'Old Regime' : 'New Regime'}
                        </span>
                      </div>
                      <div className="p-[14px_18px] flex flex-col gap-[5px]">
                        <div className="grid gap-2 px-1 mb-[2px]" style={{ gridTemplateColumns: '1fr 88px 76px' }}>
                          {['Slab', 'In Slab', 'Tax'].map((h, i) => (
                            <span key={h} className={`text-[9px] font-bold text-slate-400 uppercase tracking-[.1em] ${i > 0 ? 'text-right' : ''}`}>{h}</span>
                          ))}
                        </div>
                        {result.breakdown.map((s, i) => <SlabRow key={i} slab={s} isIndigo={isOld} />)}

                        {result.rebateApplied && (
                          <div className="flex justify-between items-center px-3 py-[9px] rounded-[9px]"
                            style={{ background: '#ecfdf5', border: '1px solid #d1fae5' }}>
                            <div>
                              <div className="text-[11px] font-bold text-emerald-700">🎉 Rebate — Section 87A</div>
                              <div className="text-[9px] text-emerald-700 opacity-80">Taxable income within limit — full tax waived</div>
                            </div>
                            <span className="text-[13px] font-extrabold text-emerald-700">−{fmt(result.rawTax)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center px-[13px] py-[11px] rounded-[10px] mt-[3px]"
                          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <span className="text-[12px] font-bold text-amber-900">Total Tax Payable</span>
                          <span className="text-[20px] font-extrabold text-amber-900 tracking-[-0.02em]">{fmt(result.totalTax)}</span>
                        </div>
                      </div>
                    </div>

                    {/* TDS reconciliation */}
                    {mode === 'salaried' && (
                      <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                          <div>
                            <div className="text-[12px] font-bold text-slate-900">💳 TDS Reconciliation</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-[1px]">Total tax due vs TDS deducted by employer</div>
                          </div>
                        </div>
                        <div className="p-[14px_18px] flex flex-col gap-[7px]">
                          <Row label="Total Tax Due"    value={fmt(result.totalTax)}             color="#d97706" />
                          <Row label="TDS Already Paid" value={`−${fmt(result.tdsAlreadyPaid)}`} color="#10b981" />
                          <div className="flex justify-between items-center px-[13px] py-[11px] rounded-[11px]"
                            style={{
                              background: result.refund > 0 ? '#ecfdf5' : '#fffbeb',
                              border: `1px solid ${result.refund > 0 ? '#d1fae5' : '#fde68a'}`,
                            }}>
                            <span className="text-[12px] font-bold" style={{ color: result.refund > 0 ? '#059669' : '#92400e' }}>
                              {result.refund > 0 ? '🎉 Refund Due' : '💳 Still to Pay'}
                            </span>
                            <span className="text-[19px] font-extrabold tracking-[-0.02em]"
                              style={{ color: result.refund > 0 ? '#059669' : '#92400e' }}>
                              {fmt(result.refund > 0 ? result.refund : result.remainingTax)}
                            </span>
                          </div>
                          {!result.tdsAlreadyPaid && (
                            <div className="text-[9px] text-slate-400 font-semibold text-center">Enter TDS above for exact remaining tax</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════ QUARTERLY TAB ════ */}
          {activeTab === 'quarters' && (
            <div className="flex flex-col gap-[18px]">
              {/* Banner */}
              <div className="rounded-[14px] p-[18px_22px] text-white"
                style={{ background: 'linear-gradient(135deg,#10b981,#0d9488)' }}>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] mb-[5px]" style={{ opacity: 0.8 }}>
                  Advance Tax — Quarterly Schedule
                </div>
                <div className="text-[24px] font-extrabold tracking-[-0.03em] mb-1">
                  {result ? fmt(result.totalTax) : '—'}&nbsp;
                  <span className="text-[11px] font-semibold" style={{ opacity: 0.7 }}>total tax</span>
                </div>
                <div className="text-[10px] leading-relaxed" style={{ opacity: 0.8 }}>
                  Applies when annual tax &gt; ₹10,000 · Interest = shortfall × 1% × months till Mar 31
                </div>
              </div>

              {!result ? (
                <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm p-[48px_24px] text-center"
                  style={{ opacity: 0.2 }}>
                  <div className="text-[34px]">📅</div>
                  <div className="text-[11px] font-bold uppercase mt-2">Enter income in Calculator first</div>
                </div>
              ) : (
                <>
                  {/* Quarter cards — 4 cols lg, 2 cols mobile */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {QUARTERS.map((q, i) => {
                      const cum  = Math.round(result.totalTax * q.pct);
                      const prev = i > 0 ? Math.round(result.totalTax * QUARTERS[i - 1].pct) : 0;
                      const inst = cum - prev;
                      const cc   = QTR_COLORS[i];
                      return (
                        <div key={i} className="rounded-[12px] border border-slate-100 bg-white overflow-hidden"
                          style={{ border: `1px solid ${cc}28` }}>
                          <div className="p-[11px_14px]" style={{ borderBottom: `1px solid ${cc}18` }}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[.1em]" style={{ color: cc }}>{q.full}</div>
                                <div className="text-[9px] text-slate-400 font-semibold mt-[2px]">Due: {q.due}</div>
                              </div>
                              <span className="text-[9px] font-extrabold text-white px-[7px] py-[2px] rounded-[14px]"
                                style={{ background: cc }}>{Math.round(q.pct * 100)}%</span>
                            </div>
                          </div>
                          <div className="p-[11px_14px] flex flex-col gap-2">
                            <div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase mb-[2px]">Cumulative Due</div>
                              <div className="text-[17px] font-extrabold tracking-[-0.02em]" style={{ color: cc }}>{fmt(cum)}</div>
                            </div>
                            <div className="rounded-[8px] p-[7px_10px]" style={{ background: `${cc}10` }}>
                              <div className="text-[8px] font-bold text-slate-500 uppercase mb-[2px]">This Installment</div>
                              <div className="text-[14px] font-extrabold" style={{ color: cc }}>{fmt(inst)}</div>
                            </div>
                            <div className="h-[3px] bg-slate-100 rounded-full">
                              <div className="h-full rounded-full" style={{ background: cc, width: `${q.pct * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Schedule table */}
                  <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                      <div className="text-[12px] font-bold text-slate-900">📋 Full Payment Schedule</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse" style={{ minWidth: 460 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {['Quarter', 'Due Date', '% of Tax', 'Cumulative', 'Installment'].map((h, i) => (
                              <th key={h} className={`px-[14px] py-[9px] text-[9px] font-bold text-slate-400 uppercase tracking-[.1em] ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {QUARTERS.map((q, i) => {
                            const cum  = Math.round(result.totalTax * q.pct);
                            const prev = i > 0 ? Math.round(result.totalTax * QUARTERS[i - 1].pct) : 0;
                            const inst = cum - prev;
                            const cc   = QTR_COLORS[i];
                            return (
                              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td className="px-[14px] py-[9px]">
                                  <span className="text-[9px] font-extrabold text-white px-[7px] py-[2px] rounded-[6px]"
                                    style={{ background: cc }}>{q.label}</span>
                                </td>
                                <td className="px-[14px] py-[9px] text-[11px] font-semibold text-slate-700">{q.due}</td>
                                <td className="px-[14px] py-[9px] text-[11px] font-extrabold" style={{ color: cc }}>{Math.round(q.pct * 100)}%</td>
                                <td className="px-[14px] py-[9px] text-[12px] font-bold text-slate-800 text-right">{fmt(cum)}</td>
                                <td className="px-[14px] py-[9px] text-[12px] font-extrabold text-right" style={{ color: cc }}>{fmt(inst)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ PENALTY TAB ════ */}
          {activeTab === 'penalty' && (
            <div className="flex flex-col gap-6">

              {/* Section 1 */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-[10px]">
                  Section 1 — Advance Tax Shortfall (234B / 234C)
                </div>
                {/* 2-col lg, 1-col mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-[10px]">
                  <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                      <CardIcon emoji="calendar" bg="bg-[#fff7ed]" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-900">Quarterly Penalty</div>
                        <div className="text-[10px] text-slate-400 font-semibold">1% interest/month on shortfall</div>
                      </div>
                    </div>
                    <div className="p-[14px_18px] flex flex-col gap-[14px]">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-2">Select Quarter</span>
                        <div className="grid grid-cols-4 gap-2">
                          {QUARTERS.map((q, i) => (
                            <button key={i}
                              onClick={() => { setPenQ(i); if (result) setPenDue(String(Math.round(result.totalTax * q.pct))); setPenPaid(''); }}
                              className="rounded-[9px] border-none cursor-pointer text-[10px] font-bold transition-all p-[9px_4px]"
                              style={{
                                background: penQ === i ? '#10b981' : '#f8fafc',
                                color:      penQ === i ? '#fff'    : '#64748b',
                                boxShadow:  penQ === i ? '0 2px 8px #10b98140' : 'none',
                              }}>
                              <div>{q.label}</div>
                              <div className="text-[8px] opacity-80 mt-[2px]">{q.due}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-1">Due Amount</span>
                          <RupeeInput value={penDue} onChange={setPenDue} placeholder="e.g. 4875" />
                          {result && <div className="text-[9px] text-slate-400 mt-1">Q{penQ + 1}: {fmt(Math.round(result.totalTax * QUARTERS[penQ].pct))}</div>}
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-1">Amount Paid</span>
                          <RupeeInput value={penPaid} onChange={setPenPaid} placeholder="e.g. 3000" />
                        </div>
                      </div>
                      <div className="rounded-[10px] p-[10px_13px]" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <div className="text-[10px] font-bold text-sky-700 mb-[2px]">📖 Example (Q1)</div>
                        <div className="text-[10px] text-sky-600 font-semibold leading-relaxed">
                          Q1 due ₹4,875 · Paid ₹3,000<br />
                          Shortfall ₹1,875 × 1% × 10 months = <strong>₹187</strong><br />
                          Total payable = <strong>₹2,062</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {!penResult || Number(penDue) === 0 ? (
                      <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm p-[48px_24px] text-center" style={{ opacity: 0.2 }}>
                        <div className="text-[34px]">📅</div>
                        <div className="text-[11px] font-bold uppercase mt-2">Enter due and paid amounts</div>
                      </div>
                    ) : penResult.shortfall === 0 ? (
                      <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm p-[40px_24px] text-center">
                        <div className="text-[48px] mb-[10px]">✅</div>
                        <div className="text-[16px] font-extrabold text-emerald-500 mb-[5px]">No Penalty!</div>
                        <div className="text-[11px] text-slate-400">Full amount paid on time.</div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[11px]">
                        <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                            <div className="text-[12px] font-bold text-slate-900">Penalty Breakdown</div>
                          </div>
                          <div className="p-[14px_18px] flex flex-col gap-[6px]">
                            <Row label="Amount Due"    value={fmt(Number(penDue))}           color="#d97706" />
                            <Row label="Amount Paid"   value={`−${fmt(Number(penPaid))}`}    color="#10b981" />
                            <Row label="Shortfall"     value={fmt(penResult.shortfall)}      color="#e11d48" />
                            <Row label={`1% × ${penResult.months} months interest`} value={`+${fmt(penResult.interest)}`} color="#e11d48" />
                            <div className="flex justify-between items-center px-[13px] py-[11px] rounded-[10px] mt-[2px]"
                              style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
                              <span className="text-[12px] font-bold text-red-700">💸 Total Payable</span>
                              <span className="text-[19px] font-extrabold text-red-700">{fmt(penResult.total)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-[11px] p-[10px_13px]" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <div className="text-[10px] font-semibold text-amber-800 leading-relaxed">
                            ⚠️ Interest = Shortfall × 1% × months remaining till 31st Mar<br />
                            Q1 (June) = 10 months · Q2 (Sept) = 7 · Q3 (Dec) = 4 · Q4 (Mar) = 1
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-[10px]">
                  Section 2 — ITR Late Filing Penalty (Section 234F)
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-[10px]">
                  <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-[10px] px-[18px] py-[13px] border-b border-slate-100">
                      <CardIcon emoji="document" bg="bg-[#fef2f2]" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-900">ITR Filing Status</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Section 234F — late filing penalty</div>
                      </div>
                    </div>
                    <div className="p-[14px_18px] flex flex-col gap-[14px]">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-2">When will you file ITR?</span>
                        <div className="flex flex-col gap-[7px]">
                          {[
                            { id: 'ontime',   label: 'By 31st July',       sub: 'On time — no penalty',             color: '#059669', icon: '✅' },
                            { id: 'late',     label: 'August to 31st Dec',  sub: 'Late — penalty applies',           color: '#d97706', icon: '⚠️' },
                            { id: 'verylate', label: 'After 31st Dec',      sub: 'Very late — higher penalty',       color: '#e11d48', icon: '🚨' },
                            { id: 'notfiled', label: 'Not Filed At All',    sub: 'Max penalty + interest + notice', color: '#be123c', icon: '❌' },
                          ].map(opt => (
                            <button key={opt.id} onClick={() => setItrStatus(opt.id)}
                              className="flex items-center gap-[10px] px-3 py-[10px] rounded-[10px] border-2 cursor-pointer text-left w-full transition-all bg-white"
                              style={{
                                borderColor: itrStatus === opt.id ? opt.color : '#e2e8f0',
                                background:  itrStatus === opt.id ? `${opt.color}0e` : '#fff',
                              }}>
                              <span className="text-[17px] shrink-0">{opt.icon}</span>
                              <div className="flex-1">
                                <div className="text-[12px] font-bold" style={{ color: itrStatus === opt.id ? opt.color : '#334155' }}>{opt.label}</div>
                                <div className="text-[9px] text-slate-400 font-semibold mt-[1px]">{opt.sub}</div>
                              </div>
                              <div className="w-[13px] h-[13px] rounded-full border-2 shrink-0 transition-all"
                                style={{
                                  borderColor: itrStatus === opt.id ? opt.color : '#cbd5e1',
                                  background:  itrStatus === opt.id ? opt.color : 'transparent',
                                }} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[10px] p-[10px_13px]" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <div className="text-[10px] font-bold text-sky-700 mb-[3px]">📖 Section 234F Rules</div>
                        <div className="text-[10px] text-sky-600 font-semibold leading-relaxed">
                          Income ≤ ₹5L → max ₹1,000<br />
                          Income &gt; ₹5L, by 31 Dec → ₹5,000<br />
                          Income &gt; ₹5L, after 31 Dec → ₹10,000<br />
                          Not filed → penalty + 1% interest on income
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-[11px]">
                    <div className="bg-white rounded-[14px] border border-slate-100 shadow-sm p-[16px_18px]">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[.14em] mb-[10px]">Penalty Summary</div>
                      <div className="flex flex-col gap-[7px]">
                        <Row label="Your Annual Income" value={result ? fmt(result.grossIncome) : '—'} />
                        <Row label="Filing Status" value={`${itrPen.icon} ${itrPen.label}`} color={itrPen.color} />
                        <div className="flex justify-between items-center px-[13px] py-[11px] rounded-[11px]"
                          style={{
                            background: itrPen.penalty === 0 ? '#ecfdf5' : '#fff1f2',
                            border: `1px solid ${itrPen.penalty === 0 ? '#d1fae5' : '#fecdd3'}`,
                          }}>
                          <div>
                            <div className="text-[12px] font-bold" style={{ color: itrPen.penalty === 0 ? '#059669' : '#be123c' }}>
                              {itrPen.penalty === 0 ? '✅ No Penalty' : '💸 Late Penalty'}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-[1px]">Section 234F</div>
                          </div>
                          <span className="text-[19px] font-extrabold" style={{ color: itrPen.penalty === 0 ? '#059669' : '#be123c' }}>
                            {itrPen.penalty === 0 ? '₹0' : fmt(itrPen.penalty)}
                          </span>
                        </div>
                        {itrPen.interest > 0 && (
                          <Row label="+ Interest (1% of income)" value={fmt(itrPen.interest)} color="#be123c" bg="#fff1f2" />
                        )}
                        {itrStatus === 'notfiled' && (
                          <div className="rounded-[10px] p-[11px_13px]" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div className="text-[11px] font-bold text-red-800 mb-[5px]">🚨 Consequences of Not Filing</div>
                            <div className="text-[10px] text-red-600 font-semibold leading-relaxed">
                              • ₹10,000 penalty (Sec 234F)<br />
                              • 1% interest/month on tax due<br />
                              • IT notice from department<br />
                              • Loan &amp; visa applications rejected<br />
                              • Cannot carry forward losses
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-[11px] p-[10px_13px]" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <div className="text-[10px] font-semibold text-amber-800 leading-relaxed">
                        ⚠️ File ITR by 31st July to avoid penalty. Mandatory above basic exemption limit.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
          {/* ── end India content ── */}
          </>)}
        </div>

        {/* ── SAVE BAR — sticky bottom, only when result exists ── */}
        {result && (
          <div className="sticky bottom-0 left-0 right-0 px-4 lg:px-6 py-3 mt-4"
            style={{ background: 'rgba(248,250,252,0.97)', backdropFilter: 'blur(10px)', borderTop: '1px solid #f1f5f9' }}>
            <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11px] font-bold text-slate-700">
                  {mode === 'salaried' ? 'Salaried' : 'Business'} &nbsp;·&nbsp;
                  {isOld ? '🔵 Old Regime' : '🟢 New Regime'} &nbsp;·&nbsp;
                  Tax: <strong style={{ color: rc }}>{fmt(result.totalTax)}</strong>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Save this calculation to your profile</div>
              </div>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none cursor-pointer font-bold text-[12px] transition-all"
                style={{
                  background: saveStatus === 'saved'  ? '#10b981'
                            : saveStatus === 'error'  ? '#ef4444'
                            : saveStatus === 'saving' ? '#94a3b8'
                            : '#0f172a',
                  color: '#fff',
                  opacity: saveStatus === 'saving' ? 0.7 : 1,
                }}>
                {saveStatus === 'saving' ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Saving...</> : saveStatus === 'saved' ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Saved!</> : saveStatus === 'error' ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Error — Retry</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Profile</>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TaxEstimatorPage;