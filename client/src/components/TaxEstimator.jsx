import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../utils/financeHelpers';
import { QUARTERS } from '../utils/taxCalculations';
import BASE_URL from '../config';

const fmt = (n) => formatCurrency(Math.round(n || 0));


const getNextQuarter = (totalTax) => {
  const now    = new Date();
  const month  = now.getMonth(); 

  let qIdx = 3; // default Q4
  if (month >= 3 && month < 5)  qIdx = 0; 
  else if (month >= 5 && month < 8)  qIdx = 1; 
  else if (month >= 8 && month < 11) qIdx = 2; 
  else qIdx = 3;                               

  const q        = QUARTERS[qIdx];
  const cumDue   = Math.round(totalTax * q.pct);
  const prevPct  = qIdx > 0 ? QUARTERS[qIdx - 1].pct : 0;
  const instalment = Math.round(totalTax * (q.pct - prevPct));

  return { qIdx, label: q.label, due: q.due, full: q.full, cumDue, instalment, pct: q.pct };
};

/* ── Mini stat card ── */
const StatCard = ({ label, value, color, bg }) => (
  <div className="rounded-[11px] border border-slate-100 p-[11px_13px]" style={{ background: bg || '#f8fafc' }}>
    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[.12em] mb-[5px]">{label}</div>
    <div className="text-[15px] font-extrabold truncate tracking-[-0.02em]" style={{ color: color || '#0f172a' }}>{value}</div>
  </div>
);


const TaxEstimator = ({ isDashboard = true }) => {
  const navigate = useNavigate();
  const [tax,     setTax]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    axios.get(`${BASE_URL}/api/taxes/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => { setTax(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  /* ── Loading ── */
  if (loading) return (
    <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/3" />
      <div className="h-16 bg-slate-50 rounded-xl" />
      <div className="h-10 bg-slate-50 rounded-xl" />
    </div>
  );


  if (!tax || error) return (
    <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-5 flex flex-col items-center gap-3 text-center">
      <div className="text-[36px]">🧮</div>
      <div className="text-[12px] font-bold text-slate-700">No Tax Calculation Saved</div>
      <div className="text-[10px] text-slate-400 font-semibold">Go to Tax Estimator, fill your details and save.</div>
      <button
        onClick={() => navigate('/tax-estimator')}
        className="mt-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-bold border-none cursor-pointer hover:bg-emerald-600 transition-all">
        Open Tax Estimator →
      </button>
    </div>
  );

  /* ── Data exists ── */
  const isOld       = tax.regime === 'old';
  const rc          = isOld ? '#6366f1' : '#10b981';
  const rLight      = isOld ? '#eef2ff' : '#ecfdf5';
  const rBorder     = isOld ? '#c7d2fe' : '#d1fae5';
  const rDark       = isOld ? '#4f46e5' : '#059669';
  const nextQ       = getNextQuarter(tax.totalTax);
  const paidPct     = tax.totalTax > 0 ? Math.min(100, Math.round(((tax.tdsAlreadyPaid || 0) / tax.totalTax) * 100)) : 100;
  const savedDate   = tax.savedAt ? new Date(tax.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm flex flex-col gap-3 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <div>
          <div className="text-[13px] font-extrabold text-slate-900 tracking-tight">🧮 Tax Summary</div>
          <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
            FY 2024-25 &nbsp;·&nbsp;
            {tax.mode === 'salaried' ? '👔 Salaried' : '🏢 Business'} &nbsp;·&nbsp;
            <span style={{ color: rc }}>{isOld ? '🔵 Old' : '🟢 New'} Regime</span>
          </div>
        </div>
        <span className="text-[8px] font-semibold text-slate-400">Saved {savedDate}</span>
      </div>

      {/* ── 4 Stat cards ── */}
      <div className="grid grid-cols-2 gap-2 px-4">
        <StatCard
          label={tax.mode === 'salaried' ? 'Gross Salary' : 'Gross Income'}
          value={fmt(tax.grossIncome)}
          color="#0f172a"
          bg="#fff"
        />
        <StatCard
          label="Taxable Income"
          value={fmt(tax.taxableIncome)}
          color={rDark}
          bg={rLight}
        />
        <StatCard
          label="Total Tax"
          value={fmt(tax.totalTax)}
          color="#92400e"
          bg="#fffbeb"
        />
        <StatCard
          label={tax.refund > 0 ? '🎉 Refund Due' : '💳 Still to Pay'}
          value={fmt(tax.refund > 0 ? tax.refund : tax.remainingTax)}
          color={tax.refund > 0 ? '#059669' : '#d97706'}
          bg={tax.refund > 0 ? '#ecfdf5' : '#fff7ed'}
        />
      </div>

      {/* ── Next Advance Tax Due ── */}
      {tax.totalTax > 10000 && (
        <div className="mx-4 rounded-[12px] p-[11px_13px]" style={{ background: rLight, border: `1px solid ${rBorder}` }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-[10px] font-extrabold" style={{ color: rDark }}>
                📅 Next Due — {nextQ.label} · {nextQ.due}
              </div>
              <div className="text-[9px] font-semibold mt-0.5" style={{ color: rDark, opacity: 0.75 }}>
                {nextQ.full} · Pay ₹{Math.round(nextQ.instalment).toLocaleString('en-IN')} this instalment
              </div>
            </div>
            <span className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded-full" style={{ background: rc }}>
              {Math.round(nextQ.pct * 100)}%
            </span>
          </div>

          {/* Progress bar — how much of total tax is covered */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-[5px] bg-white/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${paidPct}%`, background: rc }} />
            </div>
            <span className="text-[9px] font-bold shrink-0" style={{ color: rDark }}>
              {paidPct}% covered
            </span>
          </div>
          <div className="text-[8px] font-semibold mt-1" style={{ color: rDark, opacity: 0.65 }}>
            Cumulative due by {nextQ.due}: {fmt(nextQ.cumDue)}
          </div>
        </div>
      )}

      {/* ── Effective Rate chip ── */}
      <div className="flex items-center gap-2 px-4">
        <div className="flex-1 h-[1px] bg-slate-100" />
        <span className="text-[9px] font-bold text-slate-400 shrink-0">
          Effective Rate: <strong className="text-slate-600">{tax.effectiveRate}%</strong>
        </span>
        <div className="flex-1 h-[1px] bg-slate-100" />
      </div>

      {/* ── Footer button ── */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/tax-estimator')}
          className="w-full py-2.5 rounded-xl border-none cursor-pointer text-[11px] font-bold tracking-wide transition-all text-white"
          style={{ background: '#0f172a' }}
          onMouseEnter={e => e.target.style.background = rc}
          onMouseLeave={e => e.target.style.background = '#0f172a'}>
          View Full Details &amp; Edit →
        </button>
      </div>
    </div>
  );
};

export default TaxEstimator;