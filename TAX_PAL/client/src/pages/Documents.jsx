import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { formatCurrency } from '../utils/financeHelpers';
import { calculateTaxByRegion, calculateBusinessTax } from '../utils/taxCalculations';

const API = "http://localhost:5000";

const CAT_COLORS = [
  "#10b981","#3b82f6","#f59e0b","#8b5cf6",
  "#ef4444","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1",
];

function getWeekBounds(year, month, day) {
  const ref = new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
  const dow  = ref.getDay();
  const mon  = new Date(ref); mon.setDate(ref.getDate() - ((dow + 6) % 7));
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}
function toYMD(d) { return d.toISOString().slice(0,10); }

function filterTxns(txns, mode, year, month, day) {
  return txns.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    if (mode === 'year')  return d.getFullYear() === +year;
    if (mode === 'month') return d.getFullYear() === +year && d.getMonth()+1 === +month;
    if (mode === 'day') {
      return t.date.slice(0,10) === `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    if (mode === 'week') {
      const { start, end } = getWeekBounds(year, month, day);
      return d >= start && d <= end;
    }
    return true;
  });
}

function makePeriodLabel(mode, year, month, day) {
  const p = n => String(n).padStart(2,'0');
  if (mode === 'year')  return `${year}`;
  if (mode === 'month') return `${year}-${p(month)}`;
  if (mode === 'day')   return `${year}-${p(month)}-${p(day)}`;
  if (mode === 'week')  {
    const { start, end } = getWeekBounds(year, month, day);
    return `Week_${toYMD(start)}_${toYMD(end)}`;
  }
  return '';
}

function makeBadge(mode, year, month, day) {
  const MSHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const p = n => String(n).padStart(2,'0');
  if (mode === 'year')  return `Year ${year}`;
  if (mode === 'month') return `${MSHORT[+month-1]} ${year}`;
  if (mode === 'day')   return `${p(day)} ${MSHORT[+month-1]} ${year}`;
  if (mode === 'week')  {
    const { start, end } = getWeekBounds(year, month, day);
    return `${toYMD(start)} to ${toYMD(end)}`;
  }
  return '';
}

function dl(rows, cols, filename) {
  if (!rows.length) { alert('No data for selected period.'); return; }
  const csv = [cols.join(','), ...rows.map(r => cols.map(c=>`"${r[c]??''}"`).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
    download: filename,
  });
  a.click(); URL.revokeObjectURL(a.href);
}

function doExport(tab, filtered, label, { taxpayerType, region }) {
  const income  = filtered.filter(t=>t.type==='income');
  const expense = filtered.filter(t=>t.type==='expense');
  const totInc  = income.reduce((s,t)=>s+t.amount,0);
  const totExp  = expense.reduce((s,t)=>s+t.amount,0);
  const taxable = taxpayerType==='Business' ? Math.max(0,totInc-totExp) : totInc;
  const tax     = taxpayerType==='Business' ? calculateBusinessTax(taxable) : calculateTaxByRegion(totInc, region);
  if (tab === 'income') {
    dl(income.map(t=>({Date:t.date,Description:t.desc||'',Category:t.category,Amount:t.amount})),
      ['Date','Description','Category','Amount'], `TaxPal_Income_${label}.csv`);
  } else if (tab === 'expense') {
    dl(expense.map(t=>({Date:t.date,Description:t.desc||'',Category:t.category,Amount:t.amount})),
      ['Date','Description','Category','Amount'], `TaxPal_Expense_${label}.csv`);
  } else if (tab === 'vs') {
    dl([
      {Metric:'Total Income',   Amount:totInc},
      {Metric:'Total Expenses', Amount:totExp},
      {Metric:'Net Savings',    Amount:totInc-totExp},
      {Metric:'Savings Rate %', Amount:totInc>0?((totInc-totExp)/totInc*100).toFixed(2)+'%':'0%'},
    ], ['Metric','Amount'], `TaxPal_IncomeVsExpense_${label}.csv`);
  } else if (tab === 'tax') {
    dl([
      {Field:'Period',Value:label},{Field:'Total Income',Value:totInc},
      {Field:'Total Expenses',Value:totExp},{Field:'Taxable Income',Value:taxable},
      {Field:'Estimated Tax',Value:tax},{Field:'Effective Rate %',Value:totInc>0?((tax/totInc)*100).toFixed(2)+'%':'0%'},
      {Field:'In-Hand',Value:totInc-tax},{Field:'Taxpayer Type',Value:taxpayerType},{Field:'Region',Value:region},
    ], ['Field','Value'], `TaxPal_TaxReport_${label}.csv`);
  }
}

function DonutChart({ slices }) {
  const total = slices.reduce((s,x)=>s+x.value,0);
  if (!total) return <EmptyChart />;
  const R=78, cx=100, cy=95;
  let angle = -Math.PI/2;
  const paths = slices.map((s,i) => {
    const sweep = (s.value/total)*2*Math.PI;
    const [x1,y1] = [cx+R*Math.cos(angle), cy+R*Math.sin(angle)];
    angle += sweep;
    const [x2,y2] = [cx+R*Math.cos(angle), cy+R*Math.sin(angle)];
    return {
      d:`M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${sweep>Math.PI?1:0},1 ${x2},${y2} Z`,
      color: CAT_COLORS[i%CAT_COLORS.length],
      pct:((s.value/total)*100).toFixed(1),
      label:s.label,
    };
  });
  return (
    <div className="flex items-center gap-5 w-full">
      <svg width="200" height="190" viewBox="0 0 200 190" className="flex-shrink-0">
        {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth="2.5" opacity="0.93"/>)}
        <circle cx={cx} cy={cy} r={R*0.44} fill="white"/>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize="12" fontWeight="900" fill="#111827">100%</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {paths.map((p,i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:p.color}}/>
            <span className="text-[11px] font-bold text-gray-400 flex-1 truncate">{p.label}</span>
            <span className="text-[11px] font-black text-gray-900">{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChartSVG({ slices }) {
  if (!slices.length) return <EmptyChart />;
  const max = Math.max(...slices.map(s=>s.value), 1);
  const W=340, H=170, pl=44, pr=10, pt=10, pb=38;
  const bw = Math.max(18, Math.min(52, Math.floor((W-pl-pr)/slices.length)-12));
  const step = (W-pl-pr) / slices.length;
  const toY = v => pt + ((max-v)/max)*(H-pt-pb);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxHeight:H}}>
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
        const bh = ((s.value/max)*(H-pt-pb));
        return (
          <g key={i}>
            <rect x={x} y={toY(s.value)} width={bw} height={bh} rx="5" fill={CAT_COLORS[i%CAT_COLORS.length]} opacity="0.9"/>
            <text x={x+bw/2} y={H-pb+14} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">
              {s.label.length>8?s.label.slice(0,7)+'…':s.label}
            </text>
          </g>
        );
      })}
      <line x1={pl} y1={pt} x2={pl} y2={H-pb} stroke="#e2e8f0" strokeWidth="1"/>
      <line x1={pl} y1={H-pb} x2={W-pr} y2={H-pb} stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-36 text-[11px] font-black text-gray-200 uppercase tracking-widest">
      NO DATA
    </div>
  );
}

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function FilterBar({ mode, setMode, year, setYear, month, setMonth, day, setDay }) {
  const now   = new Date();
  const years = Array.from({length:6}, (_,i) => now.getFullYear()-i);
  const daysInMonth = new Date(+year, +month, 0).getDate();
  const days  = Array.from({length:daysInMonth}, (_,i)=>i+1);
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
      <select value={year} onChange={e=>setYear(e.target.value)}
        className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 bg-white cursor-pointer outline-none">
        {years.map(y=><option key={y} value={y}>{y}</option>)}
      </select>
      {(mode==='month'||mode==='day'||mode==='week') && (
        <select value={month} onChange={e=>setMonth(e.target.value)}
          className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 bg-white cursor-pointer outline-none">
          {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
      )}
      {(mode==='day'||mode==='week') && (
        <select value={day} onChange={e=>setDay(e.target.value)}
          className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 bg-white cursor-pointer outline-none">
          {days.map(d=><option key={d} value={d}>{String(d).padStart(2,'0')}</option>)}
        </select>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
      {title && <div className="px-6 pt-5"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{title}</p></div>}
      {children}
    </div>
  );
}

function TxnList({ txns, colorClass, sign }) {
  if (!txns.length) return (
    <p className="text-center py-8 text-[11px] font-black text-gray-300 uppercase tracking-widest">No transactions</p>
  );
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

const Documents = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [transactions,  setTransactions] = useState([]);
  const [region]                          = useState('India (New)');
  const [taxpayerType,  setTaxpayerType] = useState('Business');
  const [activeTab,     setActiveTab]    = useState('income');

  const now = new Date();
  const [mode,  setMode]  = useState('year');
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()+1);
  const [day,   setDay]   = useState(now.getDate());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    axios.get(`${API}/api/transactions`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setTransactions(r.data)).catch(()=>{});
  }, [navigate]);

  const filtered  = useMemo(() => filterTxns(transactions, mode, year, month, day), [transactions,mode,year,month,day]);
  const fileLabel = useMemo(() => makePeriodLabel(mode, year, month, day),           [mode,year,month,day]);
  const badge     = useMemo(() => makeBadge(mode, year, month, day),                  [mode,year,month,day]);

  const income  = useMemo(() => filtered.filter(t=>t.type==='income'),  [filtered]);
  const expense = useMemo(() => filtered.filter(t=>t.type==='expense'), [filtered]);
  const totInc  = useMemo(() => income.reduce((s,t)=>s+t.amount,0),    [income]);
  const totExp  = useMemo(() => expense.reduce((s,t)=>s+t.amount,0),   [expense]);
  const net     = totInc - totExp;
  const estTax  = taxpayerType==='Business'
    ? calculateBusinessTax(Math.max(0,totInc-totExp))
    : calculateTaxByRegion(totInc, region);
  const inHand  = totInc - estTax;

  const incSlices = useMemo(() => {
    const acc={};
    income.forEach(t=>{ acc[t.category]=(acc[t.category]||0)+t.amount; });
    return Object.entries(acc).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  }, [income]);

  const expSlices = useMemo(() => {
    const acc={};
    expense.forEach(t=>{ acc[t.category]=(acc[t.category]||0)+t.amount; });
    return Object.entries(acc).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  }, [expense]);

  const QUARTERS = [
    {label:'Q1',pct:0.15,due:'Jun 15'},
    {label:'Q2',pct:0.45,due:'Sep 15'},
    {label:'Q3',pct:0.75,due:'Dec 15'},
    {label:'Q4',pct:1.00,due:'Mar 15'},
  ];
  const quarterData = useMemo(() => QUARTERS.map(q => {
    const tax = taxpayerType==='Business'
      ? calculateBusinessTax(Math.max(0,totInc-totExp))*q.pct
      : calculateTaxByRegion(totInc,region)*q.pct;
    return {label:q.label, value:Math.round(tax), due:q.due, pct:[15,45,75,100][QUARTERS.indexOf(q)]};
  }), [taxpayerType, totInc, totExp, region]);

  const TABS = [
    {id:'income',  emoji:'💰', label:'Income'},
    {id:'expense', emoji:'💸', label:'Expense'},
    {id:'vs',      emoji:'📊', label:'Income vs Expense'},
    {id:'tax',     emoji:'🧾', label:'Tax Report'},
  ];

  const QC = [
    {bg:'bg-emerald-50', col:'text-emerald-600', border:'border-emerald-100'},
    {bg:'bg-blue-50',    col:'text-blue-600',    border:'border-blue-100'},
    {bg:'bg-violet-50',  col:'text-violet-600',  border:'border-violet-100'},
    {bg:'bg-amber-50',   col:'text-amber-600',   border:'border-amber-100'},
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} userStatus={{plan:'pro'}} onBudgetUpdate={()=>{}} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Documents</h2>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1180px] mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:'Total Income',       value:formatCurrency(totInc), color:'text-emerald-600'},
              {label:'Total Expenses',     value:formatCurrency(totExp), color:'text-rose-500'},
              {label:'Net Savings',        value:formatCurrency(net),    color:net>=0?'text-gray-900':'text-rose-500'},
              {label:'Est. Tax Liability', value:formatCurrency(estTax), color:'text-amber-600'},
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{c.label}</p>
                <p className={`text-2xl font-black ${c.color} tracking-tighter leading-none`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${activeTab===t.id ? 'bg-gray-950 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Filter + Export */}
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <FilterBar mode={mode} setMode={setMode} year={year} setYear={setYear} month={month} setMonth={setMonth} day={day} setDay={setDay}/>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">{badge}</span>
              <button
                onClick={() => doExport(activeTab, filtered, fileLabel, {taxpayerType, region})}
                className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95">
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* INCOME TAB */}
          {activeTab==='income' && (<>
            <div className="flex gap-8 px-1">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Income</p>
                <p className="text-2xl font-black text-emerald-600 tracking-tighter">+{formatCurrency(totInc)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-2xl font-black text-gray-900">{income.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Income by Category (Donut)"><div className="px-6 pb-5"><DonutChart slices={incSlices}/></div></Card>
              <Card title="Income by Category (Bar)"><div className="px-6 pb-5"><BarChartSVG slices={incSlices}/></div></Card>
            </div>
            <Card title="Transactions"><TxnList txns={income} colorClass="text-emerald-600" sign="+" /></Card>
          </>)}

          {/* EXPENSE TAB */}
          {activeTab==='expense' && (<>
            <div className="flex gap-8 px-1">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Expenses</p>
                <p className="text-2xl font-black text-rose-500 tracking-tighter">−{formatCurrency(totExp)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-2xl font-black text-gray-900">{expense.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Expense by Category (Donut)"><div className="px-6 pb-5"><DonutChart slices={expSlices}/></div></Card>
              <Card title="Expense by Category (Bar)"><div className="px-6 pb-5"><BarChartSVG slices={expSlices}/></div></Card>
            </div>
            <Card title="Transactions"><TxnList txns={expense} colorClass="text-rose-500" sign="−" /></Card>
          </>)}

          {/* INCOME VS EXPENSE TAB */}
          {activeTab==='vs' && (<>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {label:'Total Income',   val:formatCurrency(totInc), col:'text-emerald-600'},
                {label:'Total Expenses', val:formatCurrency(totExp), col:'text-rose-500'},
                {label:'Net Savings',    val:formatCurrency(net),    col:net>=0?'text-gray-900':'text-rose-500'},
              ].map(c=>(
                <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{c.label}</p>
                  <p className={`text-2xl font-black ${c.col} tracking-tighter leading-none`}>{c.val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Income vs Expense (Donut)">
                <div className="px-6 pb-5"><DonutChart slices={[{label:'Income',value:totInc},{label:'Expense',value:totExp}]}/></div>
              </Card>
              <Card title="Income vs Expense (Bar)">
                <div className="px-6 pb-5"><BarChartSVG slices={[{label:'Income',value:totInc},{label:'Expenses',value:totExp},{label:'Savings',value:Math.max(0,net)}]}/></div>
              </Card>
            </div>
            <Card title="Monthly Breakdown">
              <div className="divide-y divide-gray-50 px-6">
                {(() => {
                  const byM={};
                  filtered.forEach(t=>{ const m=t.date?.slice(0,7)||'?'; if(!byM[m])byM[m]={i:0,e:0}; byM[m][t.type==='income'?'i':'e']+=t.amount; });
                  const entries=Object.entries(byM).sort((a,b)=>b[0].localeCompare(a[0]));
                  if(!entries.length) return <p className="text-center py-6 text-[11px] font-black text-gray-300 uppercase tracking-widest">No data</p>;
                  return entries.map(([m,d],idx)=>{
                    const n=d.i-d.e, ratio=d.i>0?(d.e/d.i*100):100;
                    return(
                      <div key={idx} className="py-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-black text-gray-900">{new Date(m+'-01').toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</p>
                            <p className={`text-[10px] font-bold mt-0.5 ${n>=0?'text-emerald-600':'text-rose-500'}`}>Net: {n>=0?'+':''}{formatCurrency(n)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-600">+{formatCurrency(d.i)}</p>
                            <p className="text-xs font-black text-rose-500 mt-0.5">−{formatCurrency(d.e)}</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{width:`${Math.min(ratio,100)}%`}}/>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mt-1">{ratio.toFixed(0)}% spent of income</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </>)}

          {/* TAX REPORT TAB */}
          {activeTab==='tax' && (<>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tax as:</span>
              {['Business','Salaried'].map(tp=>(
                <button key={tp} onClick={() => setTaxpayerType(tp)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all
                    ${taxpayerType===tp ? 'bg-gray-950 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                  {tp==='Business'?'🏢':'👔'} {tp}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Tax Breakdown (Donut)">
                <div className="px-6 pb-5"><DonutChart slices={[{label:'In-Hand',value:Math.max(0,totInc-estTax)},{label:'Tax Due',value:estTax}]}/></div>
              </Card>
              <Card title="Quarterly Tax (Bar)">
                <div className="px-6 pb-5"><BarChartSVG slices={quarterData.map(q=>({label:q.label,value:q.value}))}/></div>
              </Card>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quarterData.map((q,i)=>(
                <div key={i} className={`${QC[i].bg} rounded-2xl p-5 border ${QC[i].border}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${QC[i].col}`}>{q.label}</span>
                    <span className={`text-[9px] font-black ${QC[i].col}`}>{q.pct}%</span>
                  </div>
                  <p className={`text-xl font-black tracking-tighter ${QC[i].col} mb-1`}>{formatCurrency(q.value)}</p>
                  <p className="text-[9px] text-gray-400 font-bold">Due {q.due}</p>
                </div>
              ))}
            </div>
            <Card title="Tax Summary">
              <div className="px-6 pb-6 space-y-1">
                {[
                  {label:'Total Income',      val:formatCurrency(totInc), col:'text-emerald-600'},
                  {label:'Total Expenses',    val:formatCurrency(totExp), col:'text-rose-500'},
                  {label:'Taxable Income',    val:formatCurrency(Math.max(0,taxpayerType==='Business'?totInc-totExp:totInc)), col:'text-gray-900'},
                  {label:'Estimated Tax',     val:formatCurrency(estTax), col:'text-amber-600'},
                  {label:'Effective Rate',    val:totInc>0?`${((estTax/totInc)*100).toFixed(1)}%`:'0%', col:'text-blue-600'},
                  {label:'In-Hand After Tax', val:formatCurrency(inHand), col:'text-gray-900'},
                ].map((r,i)=>(
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
    </div>
  );
};

export default Documents;