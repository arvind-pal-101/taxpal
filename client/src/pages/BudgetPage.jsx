import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import { formatCurrency } from "../utils/financeHelpers";
import axios from "axios";

// ── Same categories as TransactionModal ─────────────────────
const SUGGESTED_CATEGORIES = [
  { label: "Food",           emoji: "🍕" },
  { label: "Rent & Bills",   emoji: "🏠" },
  { label: "Shopping",       emoji: "🛍️" },
  { label: "Entertainment",  emoji: "🎬" },
  { label: "Transport",      emoji: "🚗" },
  { label: "Travel",         emoji: "✈️" },
  { label: "Health",         emoji: "💊" },
];

// ── Summary Stat Card with Hover ─────────────────────────────
const StatSummaryCard = ({ s }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '1.5rem',
        background: hovered
          ? `linear-gradient(135deg, white 0%, ${s.accent}08 100%)`
          : 'white',
        border: `1.5px solid ${hovered ? s.accent + '40' : '#f1f5f9'}`,
        boxShadow: hovered
          ? `0 20px 48px -12px ${s.accent}35, 0 0 0 1px ${s.accent}10`
          : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        padding: '22px',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Glow blob behind icon */}
      <div style={{
        position: 'absolute', top: '-10px', right: '-10px',
        width: '70px', height: '70px', borderRadius: '50%',
        background: `radial-gradient(circle, ${s.accent}20 0%, transparent 70%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', marginBottom: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hovered ? `${s.accent}20` : `${s.accent}12`,
        boxShadow: hovered ? `0 4px 12px ${s.accent}30` : 'none',
        transform: hovered ? 'scale(1.12) rotate(-4deg)' : 'scale(1) rotate(0deg)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {s.icon === 'wallet'  && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1" fill={s.iconColor}/></svg>}
        {s.icon === 'spend'   && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>}
        {s.icon === 'check'   && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        {s.icon === 'warning' && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '20px', fontWeight: 900,
        color: hovered ? s.accent : '#0f172a',
        letterSpacing: '-0.03em', lineHeight: 1.1,
        transition: 'color 0.25s ease',
        marginBottom: '4px',
      }}>{s.value}</div>

      {/* Label */}
      <div style={{
        fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: hovered ? s.accent + 'aa' : '#94a3b8',
        transition: 'color 0.25s ease',
      }}>{s.label}</div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: '22px', right: '22px', height: '2px',
        background: `linear-gradient(90deg, ${s.accent}, ${s.accent}00)`,
        borderRadius: '99px',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }} />
    </div>
  );
};

// ── Spending Breakdown Chart ──────────────────────────────────
const SpendingChart = ({ budgetData }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const total = budgetData.reduce((s, b) => s + b.spent, 0);
  if (!total) return null;
  const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
      <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Spending Breakdown</h3>
      <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Budget vs Spent</h2>
      <p className="text-[10px] text-slate-400 font-bold mb-6">Hover each row to inspect</p>

      <div className="flex flex-col gap-2">
        {budgetData.filter(b => b.spent > 0).sort((a,b) => b.spent - a.spent).map((b, i) => {
          const pctOfLimit = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0;
          const pctOfTotal = total > 0 ? (b.spent / total) * 100 : 0;
          const color = b.pct >= 100 ? '#ef4444' : b.pct >= 80 ? '#f97316' : COLORS[i % COLORS.length];
          const isHov = hoveredRow === i;
          return (
            <div key={b.id}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                padding: '10px 14px',
                borderRadius: '14px',
                background: isHov ? `${color}10` : 'transparent',
                border: `1.5px solid ${isHov ? color + '30' : 'transparent'}`,
                transform: isHov ? 'translateX(5px)' : 'translateX(0)',
                boxShadow: isHov ? `0 4px 16px ${color}20` : 'none',
                transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                cursor: 'default',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {/* Colored dot — pulses on hover */}
                <div style={{
                  width: isHov ? '12px' : '8px', height: isHov ? '12px' : '8px',
                  borderRadius: '50%', background: color, flexShrink: 0,
                  boxShadow: isHov ? `0 0 0 4px ${color}25` : 'none',
                  transition: 'all 0.22s ease',
                }} />
                <span style={{
                  flex: 1, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isHov ? color : '#334155',
                  transition: 'color 0.2s ease',
                }}>{b.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 900,
                    color: isHov ? color : '#0f172a',
                    transition: 'color 0.2s ease',
                  }}>{formatCurrency(b.spent)}</span>
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, marginLeft: '4px' }}>
                    / {formatCurrency(b.limit)}
                  </span>
                </div>
              </div>

              {/* Progress bar — thicker + glowing on hover */}
              <div style={{ height: isHov ? '8px' : '5px', background: '#f1f5f9', borderRadius: '99px',
                overflow: 'hidden', transition: 'height 0.2s ease' }}>
                <div style={{
                  height: '100%', borderRadius: '99px',
                  width: `${pctOfLimit}%`, background: color,
                  boxShadow: isHov ? `0 0 8px ${color}80` : 'none',
                  transition: 'all 0.5s ease, box-shadow 0.2s ease',
                }} />
              </div>

              {/* Tooltip row — only on hover */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: '6px',
                maxHeight: isHov ? '20px' : '0px', overflow: 'hidden',
                opacity: isHov ? 1 : 0,
                transition: 'max-height 0.2s ease, opacity 0.2s ease',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: color }}>
                  {pctOfTotal.toFixed(0)}% of total spending
                </span>
                <span style={{ fontSize: '9px', fontWeight: 900, color: color }}>
                  {pctOfLimit.toFixed(0)}% of limit used
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Spent</span>
        <span className="text-[20px] font-black text-slate-900 tracking-tight">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

// ── Budget Modal ──────────────────────────────────────────────
const BudgetModal = ({ budgets, onSave, onClose }) => {
  const [tempBudgets, setTempBudgets] = useState([...budgets]);

  const addCategory  = () => setTempBudgets([{ id: `temp-${Date.now()}`, name: "", limit: 0 }, ...tempBudgets]);
  const removeCategory = (id) => setTempBudgets(tempBudgets.filter(b => (b._id || b.id) !== id));
  const updateCategory = (id, field, value) =>
    setTempBudgets(tempBudgets.map(b =>
      (b._id || b.id) === id
        ? { ...b, [field]: field === 'limit' ? (value === "" ? "" : Number(value)) : value }
        : b
    ));

  // Duplicate name check — case insensitive
  const hasDuplicate = tempBudgets.some((b, _, arr) => {
    const name = b.name.trim().toLowerCase();
    return name && arr.filter(x => x.name.trim().toLowerCase() === name).length > 1;
  });

  const isValid = tempBudgets.every(b => b.name.trim() && b.limit > 0) && !hasDuplicate;

  const handleSave = async () => {
    if (!isValid) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post('/api/budgets/sync', { budgets: tempBudgets }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Use API response — it has createdAt from MongoDB
      onSave(response.data);
      onClose();
    } catch { onClose(); }
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="p-6 md:p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900">Budget Settings</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Set your monthly limits</p>
          </div>
          <button onClick={addCategory}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">
            + Add New
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-4 overflow-y-auto bg-slate-50/30">

          {/* Quick category suggestions */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 p-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
              ⚡ Quick Add — click to add category
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CATEGORIES.map(cat => {
                const alreadyAdded = tempBudgets.some(
                  b => b.name?.toLowerCase() === cat.label.toLowerCase()
                );
                return (
                  <button
                    key={cat.label}
                    onClick={() => {
                      if (alreadyAdded) return;
                      setTempBudgets(prev => [
                        { id: `temp-${Date.now()}-${cat.label}`, name: cat.label, limit: 0 },
                        ...prev,
                      ]);
                    }}
                    disabled={alreadyAdded}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all
                      ${alreadyAdded
                        ? 'bg-emerald-50 text-emerald-500 border border-emerald-200 cursor-not-allowed opacity-60'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 cursor-pointer'
                      }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {alreadyAdded ? <span className="text-emerald-400">✓</span> : <span className="text-slate-300">+</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {tempBudgets.length === 0 && (
            <div className="text-center py-16 text-slate-300 font-bold">No budgets yet — click Quick Add or Add New above</div>
          )}
          {tempBudgets.map(cat => {
            const id = cat._id || cat.id;
            const nameInvalid  = cat.name.trim() === "";
            const limitInvalid = !cat.limit || cat.limit <= 0;
            return (
              <div key={id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 md:items-start">
                  {/* Name */}
                  <div className="flex-[2] flex flex-col">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Name</label>
                    <input
                      value={cat.name}
                      onChange={e => updateCategory(id, 'name', e.target.value)}
                      placeholder="e.g. Shopping"
                      className={`w-full p-3.5 bg-slate-50 rounded-2xl border font-bold text-slate-900 outline-none transition-all focus:bg-white
                        ${nameInvalid ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`}
                    />
                    {nameInvalid && <span className="text-[9px] font-bold text-rose-500 mt-1">⚠ Category name is required</span>}
                    {!nameInvalid && tempBudgets.filter(x => x.name.trim().toLowerCase() === cat.name.trim().toLowerCase()).length > 1 && (
                      <span className="text-[9px] font-bold text-rose-500 mt-1">⚠ Duplicate category — already exists</span>
                    )}
                  </div>
                  {/* Limit */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 md:text-right">Budget Limit</label>
                    <input
                      type="text" inputMode="numeric"
                      value={cat.limit === 0 ? "" : cat.limit}
                      onClick={(e) => e.target.select()}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        updateCategory(id, 'limit', val === '' ? 0 : Number(val));
                      }}
                      placeholder="e.g. 5000"
                      className={`w-full p-3.5 bg-slate-50 rounded-2xl border font-black text-slate-900 outline-none transition-all focus:bg-white
                        ${limitInvalid ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`}
                    />
                    {limitInvalid && <span className="text-[9px] font-bold text-rose-500 mt-1">⚠ Enter a valid limit</span>}
                  </div>
                  {/* Delete */}
                  <button onClick={() => removeCategory(id)}
                    className="hidden md:flex mt-8 text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button onClick={() => removeCategory(id)}
                    className="md:hidden self-end text-rose-400 font-black text-[10px] uppercase">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-white border-t sticky bottom-0">
          <button onClick={handleSave} disabled={!isValid}
            className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em]
                       hover:bg-emerald-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95">
            Confirm & Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// ── Budget Card with Hover ────────────────────────────────────
const BudgetCard = ({ b }) => {
  const [hovered, setHovered] = useState(false);
  const accent = b.pct >= 100 ? '#ef4444' : b.pct >= 80 ? '#f97316' : '#10b981';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: hovered
          ? `linear-gradient(135deg, white 60%, ${accent}06 100%)`
          : 'white',
        borderRadius: '1.5rem',
        border: `1.5px solid ${hovered ? accent + '35' : '#f1f5f9'}`,
        boxShadow: hovered
          ? `0 24px 48px -12px ${accent}30, 0 0 0 1px ${accent}12`
          : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.3,0.64,1)',
        padding: '20px 24px',
        cursor: 'default',
      }}
    >
      {/* Sliding accent bar — top */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        height: '3px', borderRadius: '99px',
        background: `linear-gradient(90deg, ${accent}, ${accent}60)`,
        width: hovered ? '100%' : '0%',
        transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
      }} />

      {/* Decorative circle bg */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '90px', height: '90px', borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <h4 style={{
            fontSize: '14px', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: hovered ? accent : '#1e293b',
            transition: 'color 0.25s ease',
          }}>{b.name}</h4>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block ${b.badge}`}>
            {b.label}
          </span>
          {b.createdAt && (
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              Created {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '18px', fontWeight: 900,
            color: hovered ? accent : '#0f172a',
            transition: 'color 0.25s ease',
            letterSpacing: '-0.02em',
          }}>{formatCurrency(b.spent)}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
            of {formatCurrency(b.limit)}
          </div>
        </div>
      </div>

      {/* Progress bar — grows taller + glows on hover */}
      <div style={{
        height: hovered ? '10px' : '7px', background: '#f1f5f9',
        borderRadius: '99px', overflow: 'hidden', marginBottom: '10px',
        transition: 'height 0.25s ease',
      }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          width: `${Math.min(b.pct, 100)}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent}bb)`,
          boxShadow: hovered ? `0 0 10px ${accent}70` : 'none',
          transition: 'box-shadow 0.25s ease',
        }} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '10px', fontWeight: 900,
          color: b.remaining < 0 ? '#ef4444' : hovered ? '#64748b' : '#94a3b8',
          transition: 'color 0.2s ease',
        }}>
          {b.remaining < 0
            ? `Over by ${formatCurrency(Math.abs(b.remaining))}`
            : `${formatCurrency(b.remaining)} remaining`}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 900,
          color: hovered ? accent : '#94a3b8',
          transition: 'color 0.25s ease',
          background: hovered ? `${accent}12` : 'transparent',
          padding: '2px 8px', borderRadius: '99px',
        }}>
          {Math.round(b.pct)}%
        </span>
      </div>
    </div>
  );
};

// ── Main Budget Page ──────────────────────────────────────────
const BudgetPage = ({ transactions = [], budgets = [], setBudgets }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);

  const budgetData = useMemo(() => {
    return budgets.map(cat => {
      const name  = cat.name || cat.category;
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category?.toLowerCase().trim() === name?.toLowerCase().trim())
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const pct    = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
      const status = pct >= 100 ? { color: "bg-rose-500",   label: "Over Budget",  badge: "bg-rose-100 text-rose-600"   }
                   : pct >= 80  ? { color: "bg-orange-500", label: "Warning",       badge: "bg-orange-100 text-orange-600" }
                   : pct >= 50  ? { color: "bg-amber-400",  label: "On Track",      badge: "bg-amber-100 text-amber-600"   }
                   :              { color: "bg-emerald-500", label: "Healthy",       badge: "bg-emerald-100 text-emerald-600" };
      return { ...cat, id: cat._id || cat.id, name, spent, pct, remaining: cat.limit - spent, ...status };
    });
  }, [transactions, budgets]);

  // Summary stats
  const totalAllocated = budgets.reduce((s, b)  => s + (b.limit || 0), 0);
  const totalSpent     = budgetData.reduce((s, b) => s + b.spent, 0);
  const overCount      = budgetData.filter(b => b.pct >= 100).length;
  const healthyCount   = budgetData.filter(b => b.pct < 80).length;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 lg:px-10 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Budget Tracker</h2>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.15em]">Monthly Limits & Spending</p>
            </div>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="bg-emerald-600 text-white px-5 md:px-7 py-2.5 rounded-2xl text-xs font-black tracking-tight
                       transition-all shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)]
                       hover:shadow-[0_20px_30px_-5px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95">
            Manage Budgets
          </button>
        </header>

        <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Allocated", value: formatCurrency(totalAllocated), icon: "wallet",  iconColor: "#3b82f6", accent: "#3b82f6" },
              { label: "Total Spent",     value: formatCurrency(totalSpent),     icon: "spend",   iconColor: "#f43f5e", accent: "#f43f5e" },
              { label: "Remaining",       value: formatCurrency(totalAllocated - totalSpent), icon: "check", iconColor: "#10b981", accent: "#10b981" },
              { label: "Over Budget",     value: `${overCount} categories`,      icon: "warning", iconColor: "#f97316", accent: "#f97316" },
            ].map(s => (
              <StatSummaryCard key={s.label} s={s} />
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Budget Cards — left */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                {budgetData.length} Categories
              </h3>

              {budgetData.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v2m0 8v2"/><path d="M9 9.5c0-1.1.9-1.5 3-1.5s3 .9 3 2.5c0 2-3 2.5-3 4.5 0 1.1.4 1.5 3 1.5"/></svg></div>
                  <div className="text-[16px] font-black text-slate-300 mb-2">No budgets set yet</div>
                  <div className="text-[12px] text-slate-300 mb-6">Set monthly limits to track your spending</div>
                  <button onClick={() => setModalOpen(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                    Set Up Budgets
                  </button>
                </div>
              ) : (
                budgetData.map(b => (
                  <BudgetCard key={b.id} b={b} />
                ))
              )}
            </div>

            {/* Spending Chart — right */}
            <div className="lg:col-span-5">
              {budgetData.length > 0
                ? <SpendingChart budgetData={budgetData} />
                : (
                  <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
                    <div className="text-[12px] font-black text-slate-300">Chart will appear once you have budgets and transactions</div>
                  </div>
                )
              }
            </div>

          </div>
        </div>
      </main>

      {/* Budget Modal */}
      {modalOpen && (
        <BudgetModal
          budgets={budgets}
          onSave={setBudgets}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default BudgetPage;