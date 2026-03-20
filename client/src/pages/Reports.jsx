import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { formatCurrency } from '../utils/financeHelpers';
import { calculateSalariedTax, calculateBusinessTax, QUARTERS } from '../utils/taxCalculations';
import BASE_URL from "../config";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



const API = BASE_URL;

const CAT_COLORS = [
  "#10b981","#3b82f6","#f59e0b","#8b5cf6",
  "#ef4444","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1",
];

// ─── Date Helpers
function getWeekBounds(year, month, day) {
  const ref = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
  const dow = ref.getDay();
  const mon = new Date(ref); mon.setDate(ref.getDate() - ((dow + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}
function toYMD(d) { return d.toISOString().slice(0,10); }

function filterTxns(txns, mode, year, month, day) {
  return txns.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    if (mode === 'year')  return d.getFullYear() === +year;
    if (mode === 'month') return d.getFullYear() === +year && d.getMonth()+1 === +month;
    if (mode === 'day')   return t.date.slice(0,10) === `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (mode === 'week')  { const {start,end} = getWeekBounds(year,month,day); return d >= start && d <= end; }
    return true;
  });
}
function makePeriodLabel(mode, year, month, day) {
  const p = n => String(n).padStart(2,'0');
  if (mode === 'year')  return `${year}`;
  if (mode === 'month') return `${year}-${p(month)}`;
  if (mode === 'day')   return `${year}-${p(month)}-${p(day)}`;
  if (mode === 'week')  { const {start,end} = getWeekBounds(year,month,day); return `Week_${toYMD(start)}_${toYMD(end)}`; }
  return '';
}
function makeBadge(mode, year, month, day) {
  const MSHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const p = n => String(n).padStart(2,'0');
  if (mode === 'year')  return `Year ${year}`;
  if (mode === 'month') return `${MSHORT[+month-1]} ${year}`;
  if (mode === 'day')   return `${p(day)} ${MSHORT[+month-1]} ${year}`;
  if (mode === 'week')  { const {start,end} = getWeekBounds(year,month,day); return `${toYMD(start)} → ${toYMD(end)}`; }
  return '';
}

// ─── CSV Export
function dl(rows, cols, filename) {
  if (!rows.length) { alert('No data for selected period.'); return; }
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click(); URL.revokeObjectURL(a.href);
}

function doExport(tab, filtered, label, budgets, taxpayerType, regime = 'new') {
  const income  = filtered.filter(t => t.type === 'income');
  const expense = filtered.filter(t => t.type === 'expense');
  const totInc  = income.reduce((s,t)  => s + t.amount, 0);
  const totExp  = expense.reduce((s,t) => s + t.amount, 0);

  const estTax = taxpayerType === 'Business'
    ? calculateBusinessTax(totInc, totExp, regime).totalTax
    : calculateSalariedTax(totInc, 0, {}, regime).totalTax;

  if (tab === 'income') {
    const inr = n => '₹' + Number(Math.round(n)).toLocaleString('en-IN');
    dl(income.map(t => ({ Date:t.date, Description:t.desc||'', Category:t.category, Amount:inr(t.amount) })),
      ['Date','Description','Category','Amount'], `TaxPal_Income_${label}.csv`);
  } else if (tab === 'expense') {
    const inr = n => '₹' + Number(Math.round(n)).toLocaleString('en-IN');
    dl(expense.map(t => ({ Date:t.date, Description:t.desc||'', Category:t.category, Amount:inr(t.amount) })),
      ['Date','Description','Category','Amount'], `TaxPal_Expense_${label}.csv`);
  } else if (tab === 'vs') {
    const inr = n => '₹' + Number(Math.round(n)).toLocaleString('en-IN');
    const byM = {};
    filtered.forEach(t => { const m = t.date?.slice(0,7)||'?'; if (!byM[m]) byM[m]={i:0,e:0}; byM[m][t.type==='income'?'i':'e'] += t.amount; });
    const rows = Object.entries(byM).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,d]) => ({
      Month: m, Income: inr(d.i), Expense: inr(d.e), Net_Savings: inr(d.i - d.e),
      Savings_Rate: d.i > 0 ? ((d.i-d.e)/d.i*100).toFixed(1)+'%' : '0%',
    }));
    dl(rows.length ? rows : [{ Month:'No Data', Income:'₹0', Expense:'₹0', Net_Savings:'₹0', Savings_Rate:'0%' }],
      ['Month','Income','Expense','Net_Savings','Savings_Rate'], `TaxPal_IncomeVsExpense_${label}.csv`);
  } else if (tab === 'tax') {
    const inr = n => '₹' + Number(Math.round(n)).toLocaleString('en-IN');
    const taxableInc = taxpayerType === 'Business' ? Math.max(0, totInc - totExp) : totInc;
    dl([
      { Field:'Period',          Value: label },
      { Field:'Total Income',    Value: inr(totInc) },
      { Field:'Total Expenses',  Value: inr(totExp) },
      { Field:'Taxable Income',  Value: inr(taxableInc) },
      { Field:'Estimated Tax',   Value: inr(estTax) },
      { Field:'Effective Rate',  Value: totInc > 0 ? ((estTax/totInc)*100).toFixed(2)+'%' : '0%' },
      { Field:'In-Hand',         Value: inr(totInc - estTax) },
      { Field:'Taxpayer Type',   Value: taxpayerType },
      { Field:'Regime',          Value: regime === 'new' ? 'New Regime' : 'Old Regime' },
    ], ['Field','Value'], `TaxPal_TaxReport_${label}.csv`);
  } else if (tab === 'budget') {
    const inr = n => '₹' + Number(Math.round(n)).toLocaleString('en-IN');
    const rows = (budgets||[]).map(b => {
      const spent = expense.filter(t => t.category === (b.name||b.category)).reduce((s,t)=>s+t.amount,0);
      const alloc = b.amount || b.limit || 0;
      return { Category: b.name||b.category, Allocated: inr(alloc), Spent: inr(spent), Remaining: inr(alloc - spent), Status: spent > alloc ? 'OVER BUDGET' : 'OK' };
    });
    dl(rows.length ? rows : [{ Category:'No budgets', Allocated:'₹0', Spent:'₹0', Remaining:'₹0', Status:'-' }],
      ['Category','Allocated','Spent','Remaining','Status'], `TaxPal_Budget_${label}.csv`);
  }
}

function exportPDF(tab, filtered, label, budgets, taxpayerType, regime = "new") {
  const doc = new jsPDF();
  const inr = (num) => `Rs. ${Number(Math.round(num)).toLocaleString("en-IN")}`;

  const income = filtered.filter(t => t.type === "income");
  const expense = filtered.filter(t => t.type === "expense");

  const totInc = income.reduce((s, t) => s + t.amount, 0);
  const totExp = expense.reduce((s, t) => s + t.amount, 0);

  const estTax =
    taxpayerType === "Business"
      ? calculateBusinessTax(totInc, totExp, regime).totalTax
      : calculateSalariedTax(totInc, 0, {}, regime).totalTax;

  doc.setFontSize(18);
  doc.setTextColor(0,0,0);
  doc.text("TaxPal Financial Report", 14, 18);
  
  doc.setFontSize(10);
  doc.setTextColor(0,0,0);
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 24);

  doc.setFontSize(10);
  doc.text(`Period: ${label}`, 14, 30);
  doc.text(`Taxpayer Type: ${taxpayerType}`, 14, 36);
  doc.text(`Regime: ${regime === "new" ? "New Regime" : "Old Regime"}`, 14, 42);

  if (tab === "income") {
    autoTable(doc, {
      startY: 45,
      head: [["Date", "Description", "Category", "Amount"]],
      body: income.map(t => [
        new Date(t.date).toLocaleDateString("en-IN"),
        t.desc || "",
        t.category,
        inr(t.amount),
      ]),
    });

    doc.save(`TaxPal_Income_${label}.pdf`);
  }

  else if (tab === "expense") {
    autoTable(doc, {
      startY: 45,
      head: [["Date", "Description", "Category", "Amount"]],
      body: expense.map(t => [
        new Date(t.date).toLocaleDateString("en-IN"),
        t.desc || "",
        t.category,
        inr(t.amount),
      ]),
    });
    doc.save(`TaxPal_Expense_${label}.pdf`);
  }

    else if (tab === "vs") {

  const monthly = {};

  filtered.forEach(t => {
    const month = new Date(t.date).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric"
    });

    if (!monthly[month]) {
      monthly[month] = { income: 0, expense: 0 };
    }

    if (t.type === "income") monthly[month].income += t.amount;
    else monthly[month].expense += t.amount;
  });

  const rows = Object.entries(monthly).map(([month, data]) => [
    month,
    inr(data.income),
    inr(data.expense),
    inr(data.income - data.expense)
  ]);

  autoTable(doc, {
    startY: 45,
    head: [["Month", "Income", "Expense", "Net Savings"]],
    body: rows,
  });

  doc.save(`TaxPal_IncomeVsExpense_${label}.pdf`);
}

else if (tab === "budget") {

  const rows = budgets.map(b => {

    const spent = expense
      .filter(t => t.category === (b.name || b.category))
      .reduce((s, t) => s + t.amount, 0);

    const allocated = b.amount || b.limit || 0;

    return [
      b.name || b.category,
      inr(allocated),
      inr(spent),
      inr(allocated - spent),
      spent > allocated ? "OVER BUDGET" : "OK"
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [["Category", "Allocated", "Spent", "Remaining", "Status"]],
    body: rows,
  });

  doc.save(`TaxPal_BudgetReport_${label}.pdf`);
}

  else if (tab === "tax") {
    autoTable(doc, {
      startY: 45,
      head: [["Field", "Value"]],
      body: [
        ["Total Income", inr(totInc)],
        ["Total Expenses", inr(totExp)],
        ["Estimated Tax", inr(estTax)],
        ["In-Hand Income", inr(totInc - estTax)],
      ],
    });

    doc.save(`TaxPal_TaxReport_${label}.pdf`);
  }
}

// ─── Charts
function EmptyChart() {
  return <div className="flex items-center justify-center h-36 text-[11px] font-black text-gray-200 uppercase tracking-widest">NO DATA</div>;
}

function DonutChart({ slices }) {
  const total = slices.reduce((s,x) => s + x.value, 0);
  if (!total) return <EmptyChart />;
  const R=78, cx=100, cy=95;

  // Build paths — special case: single slice = full circle (SVG arc can't draw 360°)
  const paths = slices.map((s, i) => {
    const pct = ((s.value / total) * 100).toFixed(1);
    const color = s.color || CAT_COLORS[i % CAT_COLORS.length];
    return { pct, label: s.label, color, value: s.value };
  });

  const renderArcs = () => {
    if (slices.length === 1) {
      // Full circle — two semicircles to avoid SVG arc bug
      return (
        <>
          <path d={`M${cx},${cy-R} A${R},${R} 0 0,1 ${cx},${cy+R} Z`} fill={paths[0].color} opacity="0.93"/>
          <path d={`M${cx},${cy+R} A${R},${R} 0 0,1 ${cx},${cy-R} Z`} fill={paths[0].color} opacity="0.93"/>
        </>
      );
    }
    let angle = -Math.PI/2;
    return paths.map((p, i) => {
      const sweep = (slices[i].value / total) * 2 * Math.PI;
      const x1 = cx + R * Math.cos(angle);
      const y1 = cy + R * Math.sin(angle);
      angle += sweep;
      const x2 = cx + R * Math.cos(angle);
      const y2 = cy + R * Math.sin(angle);
      return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${sweep>Math.PI?1:0},1 ${x2},${y2} Z`}
        fill={p.color} stroke="#fff" strokeWidth="2.5" opacity="0.93"/>;
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <div className="w-[150px] sm:w-[170px] flex-shrink-0">
        <svg viewBox="0 0 200 190" className="w-full h-auto">
          {renderArcs()}
          <circle cx={cx} cy={cy} r={R*0.44} fill="white"/>
          <text x={cx} y={cy+5} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111827">{slices.length}</text>
          <text x={cx} y={cy+17} textAnchor="middle" fontSize="8" fill="#9ca3af">items</text>
        </svg>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0 w-full sm:w-auto">
        {paths.map((p,i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:p.color}}/>
            <span className="text-[11px] font-bold text-gray-500 flex-1 min-w-0 break-words">{p.label}</span>
            <span className="text-[11px] font-black text-gray-900 flex-shrink-0">{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChartSVG({ slices, colors }) {
  if (!slices.length) return <EmptyChart />;
  const max = Math.max(...slices.map(s => s.value), 1);
  const W=340, H=170, pl=44, pr=10, pt=10, pb=38;
  const bw = Math.max(18, Math.min(52, Math.floor((W-pl-pr)/slices.length)-12));
  const step = (W-pl-pr) / slices.length;
  const toY = v => pt + ((max-v)/max) * (H-pt-pb);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', maxHeight:H}}>
      {[0,0.25,0.5,0.75,1].map(t => {
        const y=toY(max*t), v=max*t;
        return (
          <g key={t}>
            <line x1={pl} y1={y} x2={W-pr} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
            <text x={pl-5} y={y+4} textAnchor="end" fontSize="7.5" fill="#cbd5e1" fontWeight="700">
              {v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}k`:Math.round(v)}
            </text>
          </g>
        );
      })}
      {slices.map((s,i) => {
        const x = pl + i*step + (step-bw)/2;
        const bh = (s.value/max) * (H-pt-pb);
        const col = colors ? colors[i % colors.length] : CAT_COLORS[i % CAT_COLORS.length];
        return (
          <g key={i}>
            <rect x={x} y={toY(s.value)} width={bw} height={bh} rx="5" fill={col} opacity="0.9"/>
            <text x={x+bw/2} y={H-pb+14} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">
              {s.label.length>8 ? s.label.slice(0,7)+'…' : s.label}
            </text>
          </g>
        );
      })}
      <line x1={pl} y1={pt} x2={pl} y2={H-pb} stroke="#e2e8f0" strokeWidth="1"/>
      <line x1={pl} y1={H-pb} x2={W-pr} y2={H-pb} stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

// ─── Grouped Bar: Income vs Expense per month 
function GroupedBarChart({ data }) {
  if (!data.length) return <EmptyChart />;
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const W=380, H=170, pl=48, pr=10, pt=10, pb=42;
  const groupW = (W-pl-pr) / data.length;
  const bw = Math.min(22, groupW/2 - 4);
  const toY = v => pt + ((max-v)/max) * (H-pt-pb);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', maxHeight:H}}>
      {[0,0.25,0.5,0.75,1].map(t => {
        const y=toY(max*t), v=max*t;
        return (
          <g key={t}>
            <line x1={pl} y1={y} x2={W-pr} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
            <text x={pl-5} y={y+4} textAnchor="end" fontSize="7" fill="#cbd5e1" fontWeight="700">
              {v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}k`:Math.round(v)}
            </text>
          </g>
        );
      })}
      {data.map((d,i) => {
        const cx = pl + i*groupW + groupW/2;
        const x1 = cx - bw - 2, x2 = cx + 2;
        return (
          <g key={i}>
            <rect x={x1} y={toY(d.income)}  width={bw} height={(d.income/max)*(H-pt-pb)}  rx="4" fill="#10b981" opacity="0.85"/>
            <rect x={x2} y={toY(d.expense)} width={bw} height={(d.expense/max)*(H-pt-pb)} rx="4" fill="#f43f5e" opacity="0.85"/>
            <text x={cx} y={H-pb+14} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="700">
              {d.label.length>6 ? d.label.slice(2) : d.label}
            </text>
          </g>
        );
      })}
      <line x1={pl} y1={pt} x2={pl} y2={H-pb} stroke="#e2e8f0" strokeWidth="1"/>
      <line x1={pl} y1={H-pb} x2={W-pr} y2={H-pb} stroke="#e2e8f0" strokeWidth="1"/>
      {/* Legend */}
      <rect x={pl} y={H-pb+26} width="10" height="8" rx="2" fill="#10b981"/>
      <text x={pl+14} y={H-pb+34} fontSize="8" fill="#6b7280" fontWeight="700">Income</text>
      <rect x={pl+62} y={H-pb+26} width="10" height="8" rx="2" fill="#f43f5e"/>
      <text x={pl+76} y={H-pb+34} fontSize="8" fill="#6b7280" fontWeight="700">Expense</text>
    </svg>
  );
}

// ─── Reusable UI
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function FilterBar({ mode, setMode, year, setYear, month, setMonth, day, setDay }) {
  const now   = new Date();
  const years = Array.from({length:6}, (_,i) => now.getFullYear()-i);
  const daysInMonth = new Date(+year, +month, 0).getDate();
  const days = Array.from({length:daysInMonth}, (_,i) => i+1);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Filter:</span>
      {['day','week','month','year'].map(m => (
        <button key={m} onClick={() => setMode(m)}
          className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
            ${mode===m ? 'bg-gray-950 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
          {m.charAt(0).toUpperCase()+m.slice(1)}
        </button>
      ))}
      <select value={year} onChange={e => setYear(e.target.value)}
        className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 bg-white cursor-pointer outline-none">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {(mode==='month'||mode==='day'||mode==='week') && (
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 bg-white cursor-pointer outline-none">
          {MONTHS_FULL.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
      )}
      {(mode==='day'||mode==='week') && (
        <select value={day} onChange={e => setDay(e.target.value)}
          className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 bg-white cursor-pointer outline-none">
          {days.map(d => <option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
        </select>
      )}
    </div>
  );
}

function Card({ title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
      {(title||sub) && (
        <div className="px-6 pt-5 pb-2">
          {title && <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</p>}
          {sub   && <p className="text-[11px] font-bold text-gray-500 mt-0.5">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function TxnList({ txns, colorClass, sign }) {
  if (!txns.length) return <p className="text-center py-8 text-[11px] font-black text-gray-300 uppercase tracking-widest">No transactions</p>;
  return (
    <div className="divide-y divide-gray-50">
      {txns.map((t,i) => (
        <div key={i} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
          <div>
            <p className="text-sm font-black text-gray-900">{t.desc||t.category}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{t.date} · {t.category}</p>
          </div>
          <p className={`text-sm font-black tracking-tighter ${colorClass}`}>{sign}{formatCurrency(t.amount)}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT
const Reports = ({ transactions: propTxns = [], budgets: propBudgets = [] }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [transactions,  setTransactions] = useState(propTxns);
  const [budgets,       setBudgets]      = useState(propBudgets);
  const [taxpayerType,  setTaxpayerType] = useState('Business');
  const [regime,        setRegime]       = useState('new');
  const [activeTab,     setActiveTab]    = useState('income');

  const now = new Date();
  const [mode,  setMode]  = useState('year');
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()+1);
  const [day,   setDay]   = useState(now.getDate());

  // Fetch transactions if not passed as props
  useEffect(() => {
    if (propTxns.length) { setTransactions(propTxns); return; }
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    axios.get(`${API}/api/transactions/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setTransactions(r.data)).catch(() => {});
  }, [propTxns, navigate]);

  // Fetch budgets if not passed as props
  useEffect(() => {
    if (propBudgets.length) { setBudgets(propBudgets); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API}/api/budgets/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBudgets(r.data)).catch(() => {});
  }, [propBudgets]);

  // Filtered data
  const filtered  = useMemo(() => filterTxns(transactions, mode, year, month, day), [transactions,mode,year,month,day]);
  const fileLabel = useMemo(() => makePeriodLabel(mode, year, month, day), [mode,year,month,day]);
  const badge     = useMemo(() => makeBadge(mode, year, month, day),       [mode,year,month,day]);

  const income  = useMemo(() => filtered.filter(t => t.type === 'income'),  [filtered]);
  const expense = useMemo(() => filtered.filter(t => t.type === 'expense'), [filtered]);
  const totInc  = useMemo(() => income.reduce((s,t)  => s + t.amount, 0),   [income]);
  const totExp  = useMemo(() => expense.reduce((s,t) => s + t.amount, 0),   [expense]);
  const net     = totInc - totExp;

  // Tax estimate using correct functions from taxCalculations.js
  const estTax = useMemo(() => {
    if (taxpayerType === 'Business') return calculateBusinessTax(totInc, totExp, regime).totalTax;
    return calculateSalariedTax(totInc, 0, {}, regime).totalTax;
  }, [taxpayerType, regime, totInc, totExp]);

  const inHand = totInc - estTax;

  // Chart slices
  const incSlices = useMemo(() => {
    const acc = {};
    income.forEach(t => { acc[t.category] = (acc[t.category]||0) + t.amount; });
    return Object.entries(acc).map(([label,value]) => ({label,value})).sort((a,b) => b.value-a.value);
  }, [income]);

  const expSlices = useMemo(() => {
    const acc = {};
    expense.forEach(t => { acc[t.category] = (acc[t.category]||0) + t.amount; });
    return Object.entries(acc).map(([label,value]) => ({label,value})).sort((a,b) => b.value-a.value);
  }, [expense]);

  // Monthly grouped bar data
  const monthlyData = useMemo(() => {
    const byM = {};
    filtered.forEach(t => {
      const m = t.date?.slice(0,7) || '?';
      if (!byM[m]) byM[m] = {income:0, expense:0};
      byM[m][t.type === 'income' ? 'income' : 'expense'] += t.amount;
    });
    return Object.entries(byM).sort((a,b) => a[0].localeCompare(b[0]))
      .map(([m,d]) => ({ label:m, income:d.income, expense:d.expense }));
  }, [filtered]);

  // Quarter tax data
  const quarterData = useMemo(() => QUARTERS.map(q => ({
    label: q.label,
    due:   q.due,
    full:  q.full,
    value: Math.round(estTax * q.pct),
    pct:   Math.round(q.pct * 100),
  })), [estTax]);

  // Budget data
  const budgetData = useMemo(() => budgets.map(b => {
    const name  = b.name || b.category || '';
    const alloc = Number(b.amount || b.limit || 0);
    const spent = expense.filter(t => t.category === name).reduce((s,t) => s + t.amount, 0);
    const rem   = alloc - spent;
    const pct   = alloc > 0 ? Math.min(100, (spent/alloc)*100) : 0;
    return { name, alloc, spent, rem, pct, over: spent > alloc };
  }), [budgets, expense]);

  const QC = [
    { bg:'bg-emerald-50', col:'text-emerald-600', border:'border-emerald-100', bar:'#10b981' },
    { bg:'bg-blue-50',    col:'text-blue-600',    border:'border-blue-100',    bar:'#3b82f6' },
    { bg:'bg-violet-50',  col:'text-violet-600',  border:'border-violet-100',  bar:'#8b5cf6' },
    { bg:'bg-amber-50',   col:'text-amber-600',   border:'border-amber-100',   bar:'#f59e0b' },
  ];

  const TABS = [
    { id:'income',  emoji:'💰', label:'Income'           },
    { id:'expense', emoji:'💸', label:'Expense'          },
    { id:'vs',      emoji:'📊', label:'Income vs Expense'},
    { id:'budget',  emoji:'🎯', label:'Budget'           },
    { id:'tax',     emoji:'🧾', label:'Tax Report'       },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} userStatus={{plan:'pro'}} onBudgetUpdate={()=>{}}/>

      <main className="flex-1 overflow-y-auto">

        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 lg:px-10 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 text-xl">☰</button>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Financial Reports</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Analyze · Export · Understand</p>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1180px] mx-auto space-y-5">

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label:'Total Income',       value:formatCurrency(totInc), color:'text-emerald-600', bg:'bg-emerald-50',  border:'border-emerald-100' },
              { label:'Total Expenses',     value:formatCurrency(totExp), color:'text-rose-500',    bg:'bg-rose-50',     border:'border-rose-100'    },
              { label:'Net Savings',        value:formatCurrency(net),    color: net>=0 ? 'text-gray-900':'text-rose-500', bg:'bg-white', border:'border-gray-100' },
              { label:'Est. Tax Liability', value:formatCurrency(estTax), color:'text-amber-600',   bg:'bg-amber-50',    border:'border-amber-100'   },
            ].map(c => (
              <div key={c.label} className={`${c.bg} rounded-2xl p-4 border ${c.border} shadow-sm`}>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{c.label}</p>
                <p className={`text-xl font-black ${c.color} tracking-tighter leading-none`}>{c.value}</p>
                <p className="text-[9px] text-gray-400 font-bold mt-1.5">{badge}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${activeTab===t.id ? 'bg-gray-950 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>

          {/* ── Filter + Export Bar ── */}
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <FilterBar mode={mode} setMode={setMode} year={year} setYear={setYear} month={month} setMonth={setMonth} day={day} setDay={setDay}/>
           <div className="flex items-center gap-3">
            <button onClick={() => doExport(activeTab, filtered, fileLabel, budgets, taxpayerType, regime)}
              className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase 
              border border-emerald-400 transition-all duration-300 hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.8)] hover:ring-2 hover:ring-emerald-300">
             ↓ Export CSV
            </button>

            <button onClick={() => exportPDF(activeTab, filtered, fileLabel, budgets, taxpayerType, regime)}
              className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase 
              border border-emerald-400 transition-all duration-300 hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.8)] hover:ring-2 hover:ring-emerald-300">
             📄 Export PDF
            </button>
           </div>
          </div>

          {/* ════════════════════════════════════════
              TAB: INCOME
          ════════════════════════════════════════ */}
          {activeTab === 'income' && (<>
            <div className="grid grid-cols-3 gap-3 px-1">
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Income</p>
                <p className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tighter truncate">+{formatCurrency(totInc)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-lg sm:text-2xl font-black text-gray-900">{income.length}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg per Txn</p>
                <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">{formatCurrency(income.length ? totInc/income.length : 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Income by Category — Donut">
                <div className="px-6 pb-5"><DonutChart slices={incSlices}/></div>
              </Card>
              <Card title="Income by Category — Bar">
                <div className="px-6 pb-5"><BarChartSVG slices={incSlices}/></div>
              </Card>
            </div>
            <Card title="All Income Transactions">
              <TxnList txns={income} colorClass="text-emerald-600" sign="+"/>
            </Card>
          </>)}

          {/* ========================================
              TAB: EXPENSE
          ======================================== */}
          {activeTab === 'expense' && (<>
            <div className="grid grid-cols-3 gap-3 px-1">
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Expenses</p>
                <p className="text-lg sm:text-2xl font-black text-rose-500 tracking-tighter truncate">−{formatCurrency(totExp)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-lg sm:text-2xl font-black text-gray-900">{expense.length}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg per Txn</p>
                <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">{formatCurrency(expense.length ? totExp/expense.length : 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Expense by Category — Donut">
                <div className="px-6 pb-5"><DonutChart slices={expSlices}/></div>
              </Card>
              <Card title="Expense by Category — Bar">
                <div className="px-6 pb-5">
                  <BarChartSVG slices={expSlices} colors={["#ef4444","#f97316","#f59e0b","#ec4899","#8b5cf6","#6366f1","#06b6d4","#84cc16"]}/>
                </div>
              </Card>
            </div>
            <Card title="All Expense Transactions">
              <TxnList txns={expense} colorClass="text-rose-500" sign="−"/>
            </Card>
          </>)}

          {/* ==================================
              TAB: INCOME vs EXPENSE
          ===================================== */}
          {activeTab === 'vs' && (<>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label:'Total Income',   val:formatCurrency(totInc), col:'text-emerald-600' },
                { label:'Total Expenses', val:formatCurrency(totExp), col:'text-rose-500'    },
                { label:'Net Savings',    val:formatCurrency(net),    col: net>=0 ? 'text-gray-900' : 'text-rose-500' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{c.label}</p>
                  <p className={`text-2xl font-black ${c.col} tracking-tighter leading-none`}>{c.val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Income vs Expense — Donut">
                <div className="px-6 pb-5">
                  <DonutChart slices={[{label:'Income',value:totInc,color:'#10b981'},{label:'Expense',value:totExp,color:'#fb7185'}]}/>
                </div>
              </Card>
              <Card title="Monthly Grouped Bar">
                <div className="px-6 pb-5">
                  <GroupedBarChart data={monthlyData}/>
                </div>
              </Card>
            </div>
            <Card title="Month-by-Month Breakdown">
              <div className="divide-y divide-gray-50 px-6">
                {monthlyData.length === 0 && (
                  <p className="text-center py-6 text-[11px] font-black text-gray-300 uppercase tracking-widest">No data</p>
                )}
                {[...monthlyData].reverse().map((d,idx) => {
                  const n = d.income - d.expense;
                  const ratio = d.income > 0 ? (d.expense/d.income*100) : 100;
                  return (
                    <div key={idx} className="py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-black text-gray-900">
                            {new Date(d.label+'-01').toLocaleDateString('en-IN',{month:'long',year:'numeric'})}
                          </p>
                          <p className={`text-[10px] font-bold mt-0.5 ${n>=0?'text-emerald-600':'text-rose-500'}`}>
                            Net: {n>=0?'+':''}{formatCurrency(n)} · Savings Rate: {d.income>0?((n/d.income)*100).toFixed(1):0}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-600">+{formatCurrency(d.income)}</p>
                          <p className="text-xs font-black text-rose-500 mt-0.5">−{formatCurrency(d.expense)}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full transition-all" style={{width:`${Math.min(ratio,100)}%`}}/>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold mt-1">{ratio.toFixed(0)}% spent of income</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>)}

          {/* ========================================
              TAB: BUDGET
          ======================================== */}
          {activeTab === 'budget' && (<>
            {budgetData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🎯</div>
                <p className="text-[13px] font-black text-gray-700 mb-1">No Budgets Found</p>
                <p className="text-[11px] text-gray-400 font-semibold">Create budgets first to see budget report here.</p>
              </div>
            ) : (<>
              {/* Overview cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(() => {
                  const totalAlloc  = budgetData.reduce((s,b) => s+b.alloc, 0);
                  const totalSpent  = budgetData.reduce((s,b) => s+b.spent, 0);
                  const overCount   = budgetData.filter(b => b.over).length;
                  return [
                    { label:'Total Allocated', val:formatCurrency(totalAlloc), col:'text-blue-600',    bg:'bg-blue-50',    border:'border-blue-100'    },
                    { label:'Total Spent',      val:formatCurrency(totalSpent), col:'text-rose-500',    bg:'bg-rose-50',    border:'border-rose-100'    },
                    { label:'Over Budget',      val:`${overCount} categor${overCount===1?'y':'ies'}`, col: overCount>0?'text-red-600':'text-emerald-600', bg:'bg-white', border:'border-gray-100' },
                  ].map(c => (
                    <div key={c.label} className={`${c.bg} rounded-2xl p-5 border ${c.border} shadow-sm`}>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{c.label}</p>
                      <p className={`text-xl font-black ${c.col} tracking-tighter`}>{c.val}</p>
                    </div>
                  ));
                })()}
              </div>

              {/* Budget bar chart */}
              <Card title="Allocated vs Spent — Bar Chart">
                <div className="px-6 pb-5">
                  <BarChartSVG
                    slices={budgetData.map(b => ({ label: b.name, value: b.spent }))}
                    colors={budgetData.map(b => b.over ? '#ef4444' : '#10b981')}
                  />
                  <p className="text-[9px] text-gray-400 font-bold mt-2 text-center">🔴 Red = Over budget · 🟢 Green = Within budget</p>
                </div>
              </Card>

              {/* Budget rows */}
              <Card title="Budget Category Details">
                <div className="divide-y divide-gray-50">
                  {budgetData.map((b,i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.over ? 'bg-red-400' : 'bg-emerald-400'}`}/>
                          <span className="text-sm font-black text-gray-900">{b.name}</span>
                          {b.over && <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Over Budget</span>}
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black tracking-tighter ${b.over ? 'text-red-500' : 'text-gray-900'}`}>
                            {formatCurrency(b.spent)} <span className="text-[10px] font-bold text-gray-400">/ {formatCurrency(b.alloc)}</span>
                          </p>
                          <p className={`text-[10px] font-bold mt-0.5 ${b.rem >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {b.rem >= 0 ? `${formatCurrency(b.rem)} left` : `${formatCurrency(-b.rem)} over`}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${b.over ? 'bg-red-400' : 'bg-emerald-400'}`}
                          style={{width:`${b.pct}%`}}/>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold mt-1">{b.pct.toFixed(1)}% used</p>
                    </div>
                  ))}
                </div>
              </Card>
            </>)}
          </>)}

          {/* ========================================
              TAB: TAX REPORT
          ======================================== */}
          {activeTab === 'tax' && (<>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Taxpayer Type:</span>
                {['Business','Salaried'].map(tp => (
                  <button key={tp} onClick={() => setTaxpayerType(tp)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all
                      ${taxpayerType===tp ? 'bg-gray-950 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {tp==='Business'?'🏢':'👔'} {tp}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Regime:</span>
                {[{id:'new',label:'New Regime'},{id:'old',label:'Old Regime'}].map(r => (
                  <button key={r.id} onClick={() => setRegime(r.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all
                      ${regime===r.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Tax vs In-Hand — Donut">
                <div className="px-6 pb-5">
                  <DonutChart slices={[
                    {label:'In-Hand', value: Math.max(0, totInc - estTax)},
                    {label:'Tax Due', value: estTax},
                  ]}/>
                </div>
              </Card>
              <Card title="Quarterly Tax Schedule — Bar">
                <div className="px-6 pb-5">
                  <BarChartSVG
                    slices={quarterData.map(q => ({label:q.label, value:q.value}))}
                    colors={['#10b981','#3b82f6','#8b5cf6','#f59e0b']}
                  />
                </div>
              </Card>
            </div>

            {/* Quarter cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quarterData.map((q,i) => (
                <div key={i} className={`${QC[i].bg} rounded-2xl p-5 border ${QC[i].border}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${QC[i].col}`}>{q.label}</span>
                    <span className={`text-[9px] font-black ${QC[i].col}`}>{q.pct}%</span>
                  </div>
                  <p className={`text-xl font-black tracking-tighter ${QC[i].col} mb-1`}>{formatCurrency(q.value)}</p>
                  <p className="text-[9px] text-gray-400 font-bold">Due {q.due}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">{q.full}</p>
                </div>
              ))}
            </div>

            {/* Tax Summary table */}
            <Card title="Tax Summary" sub={`Estimated for ${badge} · ${taxpayerType} · ${regime === 'new' ? 'New Regime' : 'Old Regime'}`}>
              <div className="px-6 pb-6 space-y-1 mt-2">
                {[
                  { label:'Total Income',                val:formatCurrency(totInc),  col:'text-emerald-600' },
                  { label:'Total Expenses',              val:formatCurrency(totExp),  col:'text-rose-500'    },
                  { label:'Taxable Income',              val:formatCurrency(Math.max(0, taxpayerType==='Business' ? totInc-totExp : totInc)), col:'text-gray-900' },
                  { label:'Estimated Tax',               val:formatCurrency(estTax),  col:'text-amber-600'   },
                  { label:'Effective Rate',              val:totInc>0?`${((estTax/totInc)*100).toFixed(1)}%`:'0%', col:'text-blue-600' },
                  { label:'In-Hand After Tax',           val:formatCurrency(inHand),  col:'text-gray-900'    },
                ].map((r,i) => (
                  <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-xl ${i%2===0?'bg-gray-50/60':'bg-white'}`}>
                    <span className="text-xs font-bold text-gray-500">{r.label}</span>
                    <span className={`text-sm font-black tracking-tighter ${r.col}`}>{r.val}</span>
                  </div>
                ))}
                <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest pt-3">
                  * Estimate only. Consult a CA for accurate tax filing.
                </p>
              </div>
            </Card>
          </>)}

          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest pb-4">
            TaxPal Secure Ledger · {filtered.length} Records · {badge}
          </p>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print { aside { display: none !important; } body { background: white !important; } }
      `}</style>
    </div>
  );
};

export default Reports;