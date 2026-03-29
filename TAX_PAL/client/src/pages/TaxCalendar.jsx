import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  TAX_POLICIES, calculateTaxByRegion, calculateBusinessTax,
  BUSINESS_TAX_SLABS, getCountryList
} from '../utils/taxCalculations';
import { formatCurrency } from '../utils/financeHelpers';
import axios from 'axios';

const API = "http://localhost:5000";
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TAX_EVENTS = {
  "India (New)": [
    { month: 3,  day: 31, label: "Advance Tax Q4",     type: "payment",  desc: "100% of annual advance tax due" },
    { month: 6,  day: 15, label: "Advance Tax Q1",     type: "payment",  desc: "15% of estimated annual tax" },
    { month: 7,  day: 31, label: "ITR Filing Deadline",type: "deadline", desc: "Last date to file Income Tax Return" },
    { month: 9,  day: 15, label: "Advance Tax Q2",     type: "payment",  desc: "45% of estimated annual tax cumulative" },
    { month: 12, day: 15, label: "Advance Tax Q3",     type: "payment",  desc: "75% of estimated annual tax cumulative" },
  ],
  "India (Old)": [
    { month: 3,  day: 31, label: "Advance Tax Q4",     type: "payment",  desc: "100% of annual advance tax due" },
    { month: 6,  day: 15, label: "Advance Tax Q1",     type: "payment",  desc: "15% of estimated annual tax" },
    { month: 7,  day: 31, label: "ITR Filing Deadline",type: "deadline", desc: "Last date to file Income Tax Return" },
    { month: 9,  day: 15, label: "Advance Tax Q2",     type: "payment",  desc: "45% of estimated annual tax cumulative" },
    { month: 12, day: 15, label: "Advance Tax Q3",     type: "payment",  desc: "75% of estimated annual tax cumulative" },
  ],
  "USA": [
    { month: 1,  day: 31, label: "W-2 Forms Due",       type: "document", desc: "Employers must send W-2 forms" },
    { month: 4,  day: 15, label: "Tax Filing Deadline", type: "deadline", desc: "File federal income tax return" },
    { month: 4,  day: 15, label: "Q1 Estimated Tax",    type: "payment",  desc: "First quarterly estimated tax payment" },
    { month: 6,  day: 17, label: "Q2 Estimated Tax",    type: "payment",  desc: "Second quarterly estimated tax payment" },
    { month: 9,  day: 16, label: "Q3 Estimated Tax",    type: "payment",  desc: "Third quarterly estimated tax payment" },
    { month: 10, day: 15, label: "Extended Deadline",   type: "deadline", desc: "Extended return filing deadline" },
    { month: 1,  day: 15, label: "Q4 Estimated Tax",    type: "payment",  desc: "Fourth quarterly estimated tax payment" },
  ],
  "UK": [
    { month: 1,  day: 31, label: "Self Assessment Deadline", type: "deadline", desc: "Online tax return and payment due" },
    { month: 4,  day: 5,  label: "End of Tax Year",          type: "deadline", desc: "UK tax year ends April 5" },
    { month: 4,  day: 6,  label: "New Tax Year Begins",      type: "document", desc: "2025-26 tax year starts" },
    { month: 7,  day: 31, label: "Payment on Account",       type: "payment",  desc: "Second payment on account due" },
    { month: 10, day: 31, label: "Paper Return Deadline",    type: "deadline", desc: "Deadline for paper tax returns" },
  ],
  "Germany": [
    { month: 7,  day: 31, label: "Tax Return Deadline", type: "deadline", desc: "Annual income tax return due" },
    { month: 3,  day: 10, label: "Q1 Advance Payment",  type: "payment",  desc: "Quarterly advance payment" },
    { month: 6,  day: 10, label: "Q2 Advance Payment",  type: "payment",  desc: "Quarterly advance payment" },
    { month: 9,  day: 10, label: "Q3 Advance Payment",  type: "payment",  desc: "Quarterly advance payment" },
    { month: 12, day: 10, label: "Q4 Advance Payment",  type: "payment",  desc: "Quarterly advance payment" },
  ],
};

const EVENT_COLORS = {
  deadline: { bg: "bg-rose-50",   text: "text-rose-600",   dot: "bg-rose-500",   border: "border-rose-200",   icon: "🔴" },
  payment:  { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-500",  border: "border-amber-200",  icon: "🟡" },
  document: { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400",   border: "border-blue-200",   icon: "🔵" },
};

// Compute days left until a due date (this year or next)
const getDaysLeft = (month, day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  let due = new Date(year, month - 1, day);
  if (due < today) due = new Date(year + 1, month - 1, day);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

// Format a live countdown HH:MM:SS to a deadline date
const getCountdown = (month, day) => {
  const now = new Date();
  const year = now.getFullYear();
  let due = new Date(year, month - 1, day, 23, 59, 59);
  if (due < now) due = new Date(year + 1, month - 1, day, 23, 59, 59);
  const diff = due - now;
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  const s = Math.floor(diff / 1000) % 60;
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

const urgencyStyle = (daysLeft) => {
  if (daysLeft <= 3)  return { banner: "bg-rose-50 border-rose-300",   badge: "bg-rose-500 text-white",   text: "text-rose-700",   icon: "🚨", label: daysLeft === 0 ? "TODAY!" : daysLeft === 1 ? "TOMORROW!" : `${daysLeft} DAYS LEFT` };
  if (daysLeft <= 7)  return { banner: "bg-orange-50 border-orange-300", badge: "bg-orange-500 text-white", text: "text-orange-700", icon: "⚠️", label: `${daysLeft} DAYS LEFT` };
  if (daysLeft <= 30) return { banner: "bg-amber-50 border-amber-200",  badge: "bg-amber-400 text-white",  text: "text-amber-700",  icon: "🔔", label: `${daysLeft} DAYS LEFT` };
  return null;
};

// Reminder banner for deadlines within 30 days
const ReminderBanner = ({ events, region }) => {
  const [tick, setTick] = useState(0);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const alerts = events
    .map(ev => ({ ...ev, daysLeft: getDaysLeft(ev.month, ev.day) }))
    .filter(ev => ev.daysLeft <= 30)
    .filter(ev => !dismissed.includes(`${ev.label}-${ev.month}-${ev.day}`))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((ev, i) => {
        const u = urgencyStyle(ev.daysLeft);
        const key = `${ev.label}-${ev.month}-${ev.day}`;
        return (
          <div key={key} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${u.banner} shadow-sm`}>
            <span className="text-lg shrink-0">{u.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className={`text-[12px] font-black ${u.text}`}>{ev.label}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${u.badge}`}>{u.label}</span>
                <span className={`text-[9px] font-black uppercase ${u.text} opacity-60`}>Due {MONTHS[ev.month-1]} {ev.day}</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold">{ev.desc}</p>
            </div>
            {/* Live Countdown */}
            <div className="shrink-0 text-center">
              <p className={`text-xs font-black font-mono ${u.text}`}>{getCountdown(ev.month, ev.day)}</p>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">remaining</p>
            </div>
            <button
              onClick={() => setDismissed(d => [...d, key])}
              className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-white shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Countdown timer shown inside each upcoming deadline card
const DeadlineCountdown = ({ month, day }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    const update = () => setDisplay(getCountdown(month, day));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [month, day]);
  const daysLeft = getDaysLeft(month, day);
  const color = daysLeft <= 3 ? 'text-rose-600' : daysLeft <= 7 ? 'text-orange-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-gray-400';
  return (
    <div className="mt-2 pt-2 border-t border-white/60 flex items-center justify-between">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Countdown</span>
      <span className={`text-[10px] font-black font-mono ${color}`}>{display}</span>
    </div>
  );
};

const TaxCalendar = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("India (New)");
  const [taxpayerType, setTaxpayerType] = useState("Business");
  const [transactions, setTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    axios.get(`${API}/api/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTransactions(res.data)).catch(() => {});

    axios.get(`${API}/api/tax-estimate`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data?.region)       setSelectedRegion(res.data.region);
        if (res.data?.taxpayerType) setTaxpayerType(res.data.taxpayerType);
      }).catch(() => {});
  }, [navigate]);

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  const taxableIncome = taxpayerType === 'Business'
    ? Math.max(0, totalIncome - totalExpense)
    : totalIncome;

  const estTax = taxpayerType === 'Business'
    ? calculateBusinessTax(taxableIncome)
    : calculateTaxByRegion(taxableIncome, selectedRegion);

  const effectiveRate = taxableIncome > 0 ? ((estTax / taxableIncome) * 100).toFixed(1) : 0;
  const policy  = TAX_POLICIES[selectedRegion];
  const events  = TAX_EVENTS[selectedRegion] || [];

  const upcomingEvents = events
    .map(ev => ({ ...ev, daysLeft: getDaysLeft(ev.month, ev.day) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  const today = new Date();
  const daysInMonth    = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const monthEvents    = events.filter(e => e.month === currentMonth);

  // Which slabs to show
  const displaySlabs = taxpayerType === 'Business'
    ? BUSINESS_TAX_SLABS.map(s => ({ label: s.label }))
    : (policy?.slabs || []).map(s => ({ label: s.label }));

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan: "pro" }} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Tax Calendar</h2>
          </div>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="bg-gray-50 border border-gray-100 text-gray-700 font-black text-xs rounded-2xl px-4 py-2.5 outline-none cursor-pointer hover:border-emerald-200 transition-all"
          >
            {getCountryList().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </header>

        <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-4">

          {/* ── Reminder Banner with live countdowns ── */}
          <ReminderBanner events={events} region={selectedRegion} />

          {/* ── Tax Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Income</p>
              <p className="text-xl font-black text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Est. Tax</p>
              <p className="text-xl font-black text-rose-500">{formatCurrency(estTax)}</p>
              <p className="text-[9px] font-bold text-gray-300 mt-1">{taxpayerType} · {selectedRegion}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Effective Rate</p>
              <p className="text-xl font-black text-amber-600">{effectiveRate}%</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Filing Deadline</p>
              <p className="text-xl font-black text-emerald-600">{policy?.filingDeadline}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Calendar ── */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-gray-900">{MONTHS[currentMonth - 1]} {currentYear}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(m => m === 1 ? 12 : m - 1)}
                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-sm">‹</button>
                  <button onClick={() => setCurrentMonth(m => m === 12 ? 1 : m + 1)}
                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-sm">›</button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() + 1;
                  const dayEvents = monthEvents.filter(e => e.day === day);
                  return (
                    <div key={day} className={`relative min-h-[44px] rounded-xl p-1.5 flex flex-col items-center transition-all
                      ${isToday ? 'bg-emerald-500 text-white' : dayEvents.length > 0 ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                      <span className={`text-[11px] font-black ${isToday ? 'text-white' : 'text-gray-700'}`}>{day}</span>
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayEvents.map((ev, ei) => (
                          <div key={ei} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.type].dot}`} title={ev.label} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="space-y-4">

              {/* Upcoming Deadlines with countdown timers */}
              <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-xs text-gray-300 font-bold text-center py-4">No upcoming events</p>
                  ) : upcomingEvents.map((ev, i) => {
                    const colors = EVENT_COLORS[ev.type];
                    const u = urgencyStyle(ev.daysLeft);
                    return (
                      <div key={i} className={`p-3.5 rounded-xl border ${colors.border} ${colors.bg}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[11px] font-black ${colors.text}`}>{ev.label}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white ${colors.text}`}>
                            {MONTHS[ev.month - 1]} {ev.day}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold">{ev.desc}</p>
                        {/* Urgency badge */}
                        {u && (
                          <span className={`inline-block mt-1.5 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${u.badge}`}>
                            {u.icon} {u.label}
                          </span>
                        )}
                        {/* Live countdown timer */}
                        <DeadlineCountdown month={ev.month} day={ev.day} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax Slabs — respects taxpayerType */}
              <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Tax Slabs
                </h3>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-3">
                  {taxpayerType === 'Business' ? 'Business (Direct Tax — India)' : selectedRegion}
                </p>
                <div className="space-y-2">
                  {displaySlabs.map((slab, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2 rounded-xl bg-gray-50">
                      <span className="text-[10px] font-bold text-gray-600">{slab.label}</span>
                    </div>
                  ))}
                </div>
                {taxpayerType === 'Business' && (
                  <p className="mt-3 pt-3 border-t border-gray-50 text-[9px] text-gray-400 font-bold leading-relaxed">
                    Taxable = Income − Expenses − Deductions
                  </p>
                )}
                {taxpayerType === 'Salaried' && policy?.notes && (
                  <p className="mt-3 pt-3 border-t border-gray-50 text-[9px] text-gray-400 font-bold leading-relaxed">{policy.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaxCalendar;