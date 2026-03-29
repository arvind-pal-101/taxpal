import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Tax events by region (mirrors TaxCalendar for consistency)
const TAX_EVENTS = {
  "India (New)": [
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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// How many days before due date to start showing notification
const WARN_DAYS = 30;

const getUpcomingTaxEvents = (region) => {
  const events = TAX_EVENTS[region] || TAX_EVENTS["India (New)"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();

  return events
    .map(ev => {
      // Build due date for this year; if already passed, check next year
      let dueDate = new Date(year, ev.month - 1, ev.day);
      if (dueDate < today) {
        dueDate = new Date(year + 1, ev.month - 1, ev.day);
      }
      const diffMs = dueDate - today;
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...ev, dueDate, daysLeft };
    })
    .filter(ev => ev.daysLeft <= WARN_DAYS && ev.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
};

const URGENCY = (daysLeft) => {
  if (daysLeft <= 3)  return { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-500 text-white',   icon: '🚨' };
  if (daysLeft <= 7)  return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500 text-white', icon: '⚠️' };
  if (daysLeft <= 15) return { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-400 text-white',  icon: '🔔' };
  return               { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-500 text-white',   icon: '📅' };
};

const TaxNotificationBanner = ({ region = "India (New)" }) => {
  const [dismissed, setDismissed] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const savedDismissed = JSON.parse(sessionStorage.getItem('tax_notif_dismissed') || '[]');
    setDismissed(savedDismissed);
    setEvents(getUpcomingTaxEvents(region));
  }, [region]);

  const dismiss = (key) => {
    const updated = [...dismissed, key];
    setDismissed(updated);
    sessionStorage.setItem('tax_notif_dismissed', JSON.stringify(updated));
  };

  const visibleEvents = events.filter(ev => {
    const key = `${ev.label}-${ev.dueDate.toISOString().split('T')[0]}`;
    return !dismissed.includes(key);
  });

  if (visibleEvents.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      {visibleEvents.map((ev, i) => {
        const key = `${ev.label}-${ev.dueDate.toISOString().split('T')[0]}`;
        const u = URGENCY(ev.daysLeft);
        const dateStr = `${MONTHS[ev.month - 1]} ${ev.day}`;

        return (
          <div
            key={key}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${u.bg} ${u.border} shadow-sm transition-all`}
          >
            {/* Icon */}
            <span className="text-lg mt-0.5 shrink-0">{u.icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className={`text-[12px] font-black ${u.text}`}>{ev.label}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${u.badge} uppercase tracking-widest`}>
                  {ev.daysLeft === 0 ? 'Today!' : ev.daysLeft === 1 ? 'Tomorrow!' : `${ev.daysLeft} days left`}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${u.text} opacity-70`}>
                  Due {dateStr}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold truncate">{ev.desc}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/calendar"
                className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${u.border} ${u.text} bg-white hover:opacity-80 transition-all whitespace-nowrap`}
              >
                View Calendar
              </Link>
              <button
                onClick={() => dismiss(key)}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-white"
                title="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaxNotificationBanner;