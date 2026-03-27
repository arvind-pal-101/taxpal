import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateSalariedTax } from '../utils/taxCalculations';

// ── Quarter metadata — same as TaxCalendar
const QUARTER_META = [
  { label: "Q1", period: "Apr – Jun", due: "15th Jun", dueMonth: 6,  dueDay: 15, pct: 0.15, color: "emerald" },
  { label: "Q2", period: "Jul – Sep", due: "15th Sep", dueMonth: 9,  dueDay: 15, pct: 0.45, color: "blue"    },
  { label: "Q3", period: "Oct – Dec", due: "15th Dec", dueMonth: 12, dueDay: 15, pct: 0.75, color: "violet"  },
  { label: "Q4", period: "Jan – Mar", due: "15th Mar", dueMonth: 3,  dueDay: 15, pct: 1.00, color: "amber"   },
];

// ── ITR Filing deadline
const ITR_EVENT = {
  label: "ITR Filing Deadline",
  due: "31st Jul",
  dueMonth: 7,
  dueDay: 31,
  color: "rose",
  isITR: true,
};

// ── Days until a date
function daysUntil(month, day) {
  const now   = new Date();
  now.setHours(0, 0, 0, 0);
  const year  = now.getFullYear();
  let due     = new Date(year, month - 1, day);
  if (due < now) due = new Date(year + 1, month - 1, day);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

// ── Format currency
function fmt(n) {
  if (!n || n === 0) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function getUrgency(daysLeft) {
  if (daysLeft <= 7)  return {
    bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700',
    badge: 'bg-rose-500', icon: '🚨', label: daysLeft === 0 ? 'Due Today!' : daysLeft === 1 ? 'Due Tomorrow!' : `${daysLeft} days left`,
  };
  if (daysLeft <= 15) return {
    bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
    badge: 'bg-orange-500', icon: '⚠️', label: `${daysLeft} days left`,
  };
  return {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    badge: 'bg-amber-400', icon: '🔔', label: `${daysLeft} days left`,
  };
}

// ── Main Component ───────────────────────────────────────────
const TaxNotificationBanner = ({ transactions = [] }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState([]);

  // Load dismissed keys from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tax_notif_dismissed') || '[]');
      setDismissed(saved);
    } catch { setDismissed([]); }
  }, []);

  // Get total income from transactions
  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0),
    [transactions]
  );

  // Get annual tax — use saved estimate from TaxEstimator if available, else calculate
  const annualTax = useMemo(() => {
    try {
      const raw = localStorage.getItem('taxEstimatorResult');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.totalTax && Math.abs((saved.grossIncome || 0) - totalIncome) < 1000) {
          return saved.totalTax;
        }
      }
    } catch { /* ignore */ }
    // Fallback — calculate from transactions
    if (totalIncome > 0) {
      const result = calculateSalariedTax(totalIncome, 0, {}, 'new');
      return result?.totalTax || 0;
    }
    return 0;
  }, [totalIncome]);

  // Build notifications — quarters + ITR within 30 days
  const notifications = useMemo(() => {
    const list = [];

    // Quarter notifications
    QUARTER_META.forEach((q, i) => {
      const daysLeft = daysUntil(q.dueMonth, q.dueDay);
      if (daysLeft > 30) return;

      // Installment amount for this quarter
      const prevPct   = i > 0 ? QUARTER_META[i - 1].pct : 0;
      const instAmt   = Math.round(annualTax * (q.pct - prevPct));
      const cumulAmt  = Math.round(annualTax * q.pct);

      list.push({
        key:       `quarter-${q.label}-${new Date().getFullYear()}`,
        icon:      '🗓️',
        title:     `Advance Tax ${q.label} Due`,
        subtitle:  `${q.period} · Due ${q.due}`,
        amount:    instAmt,
        cumul:     cumulAmt,
        daysLeft,
        color:     q.color,
        isQuarter: true,
      });
    });

    // ITR notification
    const itrDays = daysUntil(ITR_EVENT.dueMonth, ITR_EVENT.dueDay);
    if (itrDays <= 30) {
      list.push({
        key:      `itr-${new Date().getFullYear()}`,
        icon:     '📋',
        title:    'ITR Filing Deadline',
        subtitle: `File your Income Tax Return · Due ${ITR_EVENT.due}`,
        daysLeft: itrDays,
        color:    ITR_EVENT.color,
        isITR:    true,
      });
    }

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [annualTax]);

  // Filter out dismissed
  const visible = notifications.filter(n => !dismissed.includes(n.key));

  // Dismiss handler — save to localStorage
  const dismiss = (key) => {
    const updated = [...dismissed, key];
    setDismissed(updated);
    localStorage.setItem('tax_notif_dismissed', JSON.stringify(updated));
  };

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-6">
      {visible.map(n => {
        const u = getUrgency(n.daysLeft);
        return (
          <div
            key={n.key}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${u.bg} ${u.border} shadow-sm`}
          >
            {/* Icon */}
            <span className="text-xl shrink-0">{n.icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className={`text-[12px] font-black ${u.text}`}>{n.title}</p>
                {/* Days badge */}
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white ${u.badge} uppercase tracking-widest`}>
                  {u.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold">{n.subtitle}</p>

              {/* Amount info — only for quarters */}
              {n.isQuarter && annualTax > 0 && (
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`text-[10px] font-black ${u.text}`}>
                    Pay this instalment: {fmt(n.amount) || '—'}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold">
                    Cumulative due: {fmt(n.cumul) || '—'}
                  </span>
                  {!annualTax && (
                    <span className="text-[9px] text-gray-400 font-bold italic">
                      (Save tax estimate for exact amount)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/calendar')}
                className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${u.border} ${u.text} bg-white hover:opacity-80 transition-all whitespace-nowrap hidden sm:block`}
              >
                View Calendar
              </button>

              {/* Dismiss ✕ */}
              <button
                onClick={() => dismiss(n.key)}
                title="Dismiss notification"
                className={`w-6 h-6 flex items-center justify-center rounded-lg ${u.text} hover:bg-white transition-all font-black text-sm`}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaxNotificationBanner;