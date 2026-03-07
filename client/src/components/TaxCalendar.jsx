import { useState } from 'react';
import Sidebar from './Sidebar';
import * as TaxUtils from '../utils/taxCalculations';
import { formatCurrency } from '../utils/financeHelpers';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TAX_EVENTS = {
  "India (New)": [
    { month: 3,  day: 31, label: "Advance Tax Q4", type: "payment", desc: "100% of annual advance tax due" },
    { month: 6,  day: 15, label: "Advance Tax Q1", type: "payment", desc: "15% of estimated annual tax" },
    { month: 7,  day: 31, label: "ITR Filing Deadline", type: "deadline", desc: "Last date to file Income Tax Return" },
    { month: 9,  day: 15, label: "Advance Tax Q2", type: "payment", desc: "45% of estimated annual tax cumulative" },
    { month: 12, day: 15, label: "Advance Tax Q3", type: "payment", desc: "75% of estimated annual tax cumulative" },
  ],
  "USA": [
    { month: 1,  day: 31, label: "W-2 Forms Due",     type: "document", desc: "Employers must send W-2 forms" },
    { month: 4,  day: 15, label: "Tax Filing Deadline",type: "deadline", desc: "File federal income tax return" },
  ],
  "UK": [
    { month: 4,  day: 5,  label: "End of Tax Year",    type: "deadline", desc: "UK tax year ends April 5" },
  ],
};

const EVENT_COLORS = {
  deadline: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", border: "border-rose-100" },
  payment:  { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", border: "border-amber-100" },
  document: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400", border: "border-blue-100" },
  default:  { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-100" }
};

const TaxCalendar = ({ transactions = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("India (New)");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  // --- SAFER CALCULATIONS ---
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  const totalIncome = validTransactions
    .filter(t => t.type === 'income')
    .reduce((a, t) => a + (Number(t.amount) || 0), 0);
  
  const safeFormat = (val) => typeof formatCurrency === 'function' ? formatCurrency(val) : `₹${val}`;
  
  const estTax = typeof TaxUtils.calculateTaxByRegion === 'function' 
    ? TaxUtils.calculateTaxByRegion(totalIncome, selectedRegion) 
    : 0;

  const effectiveRate = typeof TaxUtils.getEffectiveRate === 'function'
    ? TaxUtils.getEffectiveRate(totalIncome, selectedRegion)
    : 0;

  const policy = TaxUtils.TAX_POLICIES ? TaxUtils.TAX_POLICIES[selectedRegion] : null;
  const events = TAX_EVENTS[selectedRegion] || [];
  
  const upcomingEvents = events
    .filter(e => e.month >= currentMonth)
    .sort((a, b) => a.month - b.month || a.day - b.day)
    .slice(0, 4);

  const today = new Date();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const monthEvents = events.filter(e => e.month === currentMonth);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan: "pro" }} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 font-bold text-xl">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Tax Calendar</h2>
          </div>
          
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="bg-gray-100 border-none text-gray-700 font-black text-[10px] uppercase tracking-wider rounded-xl px-4 py-2 outline-none cursor-pointer hover:bg-gray-200 transition-all"
          >
            {typeof TaxUtils.getCountryList === 'function' 
              ? TaxUtils.getCountryList().map(c => <option key={c} value={c}>{c}</option>)
              : <option>India (New)</option>
            }
          </select>
        </header>

        <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
          
          {/* Top Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Income</p>
              <p className="text-lg font-black text-gray-900">{safeFormat(totalIncome)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Est. Tax</p>
              <p className="text-lg font-black text-rose-500">{safeFormat(estTax)}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tax Rate</p>
              <p className="text-lg font-black text-amber-500">{effectiveRate}%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Deadline</p>
              <p className="text-lg font-black text-emerald-600">{policy?.filingDeadline || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Calendar View */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {MONTHS[currentMonth - 1]} <span className="text-emerald-500">{currentYear}</span>
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(m => m === 1 ? 12 : m - 1)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all font-black">‹</button>
                  <button onClick={() => setCurrentMonth(m => m === 12 ? 1 : m + 1)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all font-black">›</button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-4 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() + 1;
                  const dayEvents = monthEvents.filter(e => e.day === day);
                  
                  return (
                    <div key={day} className={`relative min-h-[50px] md:min-h-[60px] rounded-2xl p-2 flex flex-col items-center justify-between transition-all border ${isToday ? 'bg-gray-900 border-gray-900 text-white shadow-lg scale-105 z-10' : 'bg-white border-gray-50 hover:border-emerald-200'}`}>
                      <span className="text-xs font-black">{day}</span>
                      <div className="flex gap-1 flex-wrap justify-center">
                        {dayEvents.map((ev, ei) => (
                          <div key={ei} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-emerald-400' : (EVENT_COLORS[ev.type]?.dot || 'bg-gray-400')}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side Events Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Upcoming
                </h3>
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => {
                    const style = EVENT_COLORS[ev.type] || EVENT_COLORS.default;
                    return (
                      <div key={i} className={`p-4 rounded-2xl border ${style.border} ${style.bg} transition-all hover:scale-[1.02]`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className={`text-[11px] font-black leading-none ${style.text} uppercase tracking-tight`}>{ev.label}</p>
                          <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm">
                            {MONTHS[ev.month - 1]} {ev.day}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{ev.desc}</p>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-10">
                      <p className="text-[10px] font-black text-gray-300 uppercase">No Deadlines</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Extra Tip Card */}
              <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Pro Tip</p>
                <p className="text-xs font-bold leading-relaxed">
                  Always file 2 days before the deadline to avoid server congestion.
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