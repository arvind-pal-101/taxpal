import { useState, useMemo, useEffect } from 'react';
import Sidebar from './Sidebar';
import { calculateSalariedTax, QUARTERS } from '../utils/taxCalculations';
import { formatCurrency } from '../utils/financeHelpers';

const MONTHS      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── All India tax events for FY 2024-25 ──────────────────────
const TAX_EVENTS = [
  { month: 3,  day: 15, label: "Advance Tax Q4",     type: "payment",  quarter: 3, desc: "100% of annual advance tax due (cumulative)" },
  { month: 3,  day: 31, label: "FY End",              type: "deadline",             desc: "Financial Year 2024-25 ends" },
  { month: 6,  day: 15, label: "Advance Tax Q1",      type: "payment",  quarter: 0, desc: "15% of estimated annual tax due" },
  { month: 7,  day: 31, label: "ITR Filing Deadline", type: "itr",                  desc: "Last date to file Income Tax Return for FY 2024-25" },
  { month: 9,  day: 15, label: "Advance Tax Q2",      type: "payment",  quarter: 1, desc: "45% of estimated annual tax due (cumulative)" },
  { month: 12, day: 15, label: "Advance Tax Q3",      type: "payment",  quarter: 2, desc: "75% of estimated annual tax due (cumulative)" },
];

const QUARTER_META = [
  { label: "Q1", period: "Apr – Jun", due: "15 Jun", dueMonth: 6,  dueDay: 15, pct: 0.15, color: "emerald" },
  { label: "Q2", period: "Jul – Sep", due: "15 Sep", dueMonth: 9,  dueDay: 15, pct: 0.45, color: "blue"    },
  { label: "Q3", period: "Oct – Dec", due: "15 Dec", dueMonth: 12, dueDay: 15, pct: 0.75, color: "violet"  },
  { label: "Q4", period: "Jan – Mar", due: "15 Mar", dueMonth: 3,  dueDay: 15, pct: 1.00, color: "amber"   },
];

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", badge: "bg-emerald-500", light: "bg-emerald-100", bar: "bg-emerald-400" },
  blue:    { bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-700",    badge: "bg-blue-500",    light: "bg-blue-100",    bar: "bg-blue-400"    },
  violet:  { bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-700",  badge: "bg-violet-500",  light: "bg-violet-100",  bar: "bg-violet-400"  },
  amber:   { bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-700",   badge: "bg-amber-500",   light: "bg-amber-100",   bar: "bg-amber-400"   },
};

const EVENT_STYLE = {
  payment:  { bg: "bg-amber-50",   border: "border-amber-100",  text: "text-amber-700",  dot: "bg-amber-400"  },
  deadline: { bg: "bg-rose-50",    border: "border-rose-100",   text: "text-rose-700",   dot: "bg-rose-500"   },
  itr:      { bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700",   dot: "bg-rose-600"   },
  default:  { bg: "bg-gray-50",    border: "border-gray-100",   text: "text-gray-600",   dot: "bg-gray-400"   },
};

// Days between two dates
function daysUntil(month, day) {
  const today  = new Date();
  const year   = today.getFullYear();
  const target = new Date(year, month - 1, day);
  if (target < today) target.setFullYear(year + 1);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function UrgencyBadge({ days }) {
  if (days <= 0)  return <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">Today!</span>;
  if (days <= 7)  return <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{days}d left</span>;
  if (days <= 30) return <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{days}d left</span>;
  return <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{days}d left</span>;
}

// Rupee with thin space
const Rs = ({ amount }) => <>₹&thinsp;{Number(amount).toLocaleString('en-IN')}</>;

const TaxCalendar = ({ transactions = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [regime,        setRegime]        = useState('new');
  const [currentMonth,  setCurrentMonth]  = useState(new Date().getMonth() + 1);
  const [currentYear]                     = useState(new Date().getFullYear());
  const [selectedDay,   setSelectedDay]   = useState(null);

  const today = new Date();

  // Tax calculation from transactions
  const totalIncome = useMemo(() =>
    (Array.isArray(transactions) ? transactions : [])
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [transactions]
  );

  // Try to use saved Tax Estimator result first (more accurate)
  const [savedEstimate, setSavedEstimate] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taxEstimatorResult');
      if (raw) setSavedEstimate(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const taxResult = useMemo(() =>
    calculateSalariedTax(totalIncome, 0, {}, regime),
    [totalIncome, regime]
  );

  // Use saved estimate if available and income matches closely, else fallback to calculated
  const annualTax = useMemo(() => {
    if (savedEstimate?.totalTax && Math.abs(savedEstimate.grossIncome - totalIncome) < 1000) {
      return savedEstimate.totalTax;
    }
    return taxResult.totalTax;
  }, [savedEstimate, totalIncome, taxResult]);

  const effectiveRate = useMemo(() => {
    if (savedEstimate?.effectiveRate && Math.abs(savedEstimate.grossIncome - totalIncome) < 1000) {
      return savedEstimate.effectiveRate;
    }
    return taxResult.effectiveRate;
  }, [savedEstimate, totalIncome, taxResult]);

  // Quarter amounts
  const quarterAmounts = QUARTER_META.map(q => ({
    ...q,
    amount:     Math.round(annualTax * q.pct),
    daysLeft:   daysUntil(q.dueMonth, q.dueDay),
  }));

  // Calendar helpers
  const daysInMonth     = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const monthEvents     = TAX_EVENTS.filter(e => e.month === currentMonth);

  // Upcoming events (next 4, sorted by days left)
  const upcomingEvents = useMemo(() => {
    return TAX_EVENTS
      .map(e => ({ ...e, days: daysUntil(e.month, e.day) }))
      .filter(e => e.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, []);

  // ITR deadline urgency
  const itrDays = daysUntil(7, 31);

  // Selected day events
  const selectedEvents = selectedDay
    ? monthEvents.filter(e => e.day === selectedDay)
    : [];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan: 'pro' }} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 text-xl">☰</button>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Tax Calendar</h2>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">FY 2024-25 · India</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Regime Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl gap-0.5">
              {[{id:'new',label:'New Regime'},{id:'old',label:'Old Regime'}].map(r => (
                <button key={r.id} onClick={() => setRegime(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                    ${regime===r.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
              <span className="text-lg">🇮🇳</span>
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wide">India</span>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1280px] mx-auto space-y-6">

          {/* ITR Deadline Banner — shows when within 60 days */}
          {itrDays <= 60 && (
            <div className={`flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border-2 ${itrDays <= 7 ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-200'} animate-pulse`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-widest ${itrDays <= 7 ? 'text-rose-700' : 'text-amber-700'}`}>ITR Filing Deadline Alert</p>
                  <p className="text-xs font-bold text-gray-600 mt-0.5">Income Tax Return must be filed by <strong>31st July {currentYear}</strong></p>
                </div>
              </div>
              <UrgencyBadge days={itrDays} />
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Annual Income',    value: <Rs amount={totalIncome} />, color: 'text-gray-900',    bg: 'bg-white',       border: 'border-gray-100'    },
              { label: 'Est. Annual Tax',  value: <Rs amount={annualTax} />,   color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-100'    },
              { label: 'Effective Rate',   value: `${effectiveRate}%`,          color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100'   },
              { label: 'ITR Deadline',     value: `31 Jul ${currentYear}`,      color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} p-4 rounded-2xl border ${s.border} shadow-sm`}>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className={`text-lg font-black ${s.color} tracking-tight`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Quarterly Tax Cards */}
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Quarterly Advance Tax Schedule</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quarterAmounts.map((q, i) => {
                const C       = COLOR_MAP[q.color];
                const isPast  = q.daysLeft > 300; // likely passed this year
                const cumPct  = [15, 45, 75, 100][i];
                return (
                  <div key={i} className={`${C.bg} rounded-2xl border ${C.border} p-5 relative overflow-hidden`}>
                    {/* Quarter label */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${C.text}`}>{q.label}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${C.light} ${C.text}`}>{cumPct}%</span>
                    </div>

                    {/* Amount */}
                    <p className={`text-xl font-black tracking-tighter ${C.text} mb-1`}>
                      <Rs amount={q.amount} />
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold mb-3">{q.period}</p>

                    {/* Due date + countdown */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-500">Due {q.due}</span>
                      {!isPast && <UrgencyBadge days={q.daysLeft} />}
                      {isPast  && <span className="text-[9px] font-black text-gray-300 uppercase">Passed</span>}
                    </div>

                    {/* Progress bar — how far into the year we are */}
                    <div className="mt-3 h-1 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full ${C.bar} rounded-full`} style={{ width: `${cumPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar + Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Calendar */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">
                  {MONTHS_FULL[currentMonth - 1]}&nbsp;
                  <span className="text-emerald-500">{currentYear}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCurrentMonth(m => m === 1 ? 12 : m - 1); setSelectedDay(null); }}
                    className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all font-black text-lg">
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date().getMonth() + 1)}
                    className="px-3 py-1.5 rounded-xl bg-gray-50 text-[10px] font-black text-gray-500 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-wide">
                    Today
                  </button>
                  <button
                    onClick={() => { setCurrentMonth(m => m === 12 ? 1 : m + 1); setSelectedDay(null); }}
                    className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all font-black text-lg">
                    ›
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-3 text-center">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-[9px] font-black text-gray-300 uppercase tracking-widest py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day       = i + 1;
                  const isToday   = day === today.getDate() && currentMonth === today.getMonth() + 1;
                  const isSelected = day === selectedDay;
                  const dayEvents  = monthEvents.filter(e => e.day === day);
                  const hasEvent   = dayEvents.length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`relative min-h-[52px] rounded-2xl p-1.5 flex flex-col items-center gap-1 transition-all duration-150 border
                        ${isToday    ? 'bg-gray-900 border-gray-900 text-white shadow-lg scale-105 z-10' :
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-105 z-10' :
                          hasEvent   ? 'bg-white border-amber-200 hover:border-emerald-300 hover:bg-emerald-50/30' :
                                       'bg-white border-gray-50 hover:border-gray-200 hover:bg-gray-50/50'}`}>
                      <span className="text-[11px] font-black leading-none">{day}</span>
                      {hasEvent && (
                        <div className="flex gap-0.5 flex-wrap justify-center">
                          {dayEvents.map((ev, ei) => (
                            <span key={ei}
                              className={`w-1.5 h-1.5 rounded-full ${isToday || isSelected ? 'bg-white/80' : (EVENT_STYLE[ev.type]?.dot || 'bg-gray-400')}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-50 flex-wrap">
                {[
                  { dot: 'bg-amber-400', label: 'Tax Payment' },
                  { dot: 'bg-rose-500',  label: 'ITR Deadline' },
                  { dot: 'bg-gray-900',  label: 'Today' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">

              {/* Selected Day Detail */}
              {selectedDay && (
                <div className="bg-white rounded-[2rem] border border-emerald-200 shadow-sm p-5">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">
                    {selectedDay} {MONTHS_FULL[currentMonth - 1]}
                  </p>
                  {selectedEvents.length > 0 ? selectedEvents.map((ev, i) => {
                    const S = EVENT_STYLE[ev.type] || EVENT_STYLE.default;
                    const days = daysUntil(ev.month, ev.day);
                    return (
                      <div key={i} className={`p-4 rounded-2xl border ${S.border} ${S.bg} mb-3`}>
                        <div className="flex justify-between items-start mb-1.5">
                          <p className={`text-[11px] font-black uppercase tracking-tight ${S.text}`}>{ev.label}</p>
                          <UrgencyBadge days={days} />
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold">{ev.desc}</p>
                        {ev.quarter !== undefined && (
                          <p className={`text-[10px] font-black mt-2 ${S.text}`}>
                            Amount due: <Rs amount={quarterAmounts[ev.quarter]?.amount || 0} />
                          </p>
                        )}
                      </div>
                    );
                  }) : (
                    <p className="text-[11px] font-bold text-gray-400 text-center py-3">No events this day</p>
                  )}
                </div>
              )}

              {/* Upcoming Events */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
                <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.map((ev, i) => {
                    const S = EVENT_STYLE[ev.type] || EVENT_STYLE.default;
                    return (
                      <div key={i} className={`p-3.5 rounded-2xl border ${S.border} ${S.bg} hover:scale-[1.01] transition-transform`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-black uppercase tracking-tight ${S.text} leading-tight`}>{ev.label}</p>
                          <UrgencyBadge days={ev.days} />
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold">
                          {MONTHS_FULL[ev.month - 1]} {ev.day}
                        </p>
                        {ev.quarter !== undefined && (
                          <p className={`text-[10px] font-black mt-1 ${S.text}`}>
                            <Rs amount={quarterAmounts[ev.quarter]?.amount || 0} />
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="bg-gray-900 rounded-[2rem] p-5 text-white">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Pro Tip</p>
                <p className="text-[11px] font-bold text-gray-300 leading-relaxed">
                  File your ITR at least 2 days before the deadline to avoid server congestion on the Income Tax portal.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaxCalendar;