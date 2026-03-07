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

// ── Spending Breakdown Chart ──────────────────────────────────
const SpendingChart = ({ budgetData }) => {
  const total = budgetData.reduce((s, b) => s + b.spent, 0);
  if (!total) return null;

  const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
      <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Spending Breakdown</h3>
      <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Budget vs Spent</h2>
      <p className="text-[10px] text-slate-400 font-bold mb-6">Progress bar shows % of budget limit used</p>

      <div className="flex flex-col gap-4">
        {budgetData.filter(b => b.spent > 0).sort((a,b) => b.spent - a.spent).map((b, i) => {
          const pctOfLimit = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0;
          const pctOfTotal = total > 0 ? (b.spent / total) * 100 : 0;
          const color = b.pct >= 100 ? '#ef4444' : b.pct >= 80 ? '#f97316' : COLORS[i % COLORS.length];
          return (
            <div key={b.id} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-black text-slate-700 uppercase tracking-wide truncate">{b.name}</span>
                  <div className="text-right ml-2 shrink-0">
                    <span className="text-[12px] font-black text-slate-900">{formatCurrency(b.spent)}</span>
                    <span className="text-[9px] text-slate-400 font-bold ml-1">/ {formatCurrency(b.limit)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pctOfLimit}%`, background: color }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-slate-400 font-bold">
                    {pctOfTotal.toFixed(0)}% of total spending
                  </span>
                  <span className={`text-[9px] font-black ${b.pct >= 100 ? 'text-rose-500' : b.pct >= 80 ? 'text-orange-500' : 'text-slate-400'}`}>
                    {pctOfLimit.toFixed(0)}% of limit used
                  </span>
                </div>
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
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
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
              { label: "Total Allocated", value: formatCurrency(totalAllocated), icon: "💰", bg: "bg-blue-50",    text: "text-blue-700"    },
              { label: "Total Spent",     value: formatCurrency(totalSpent),     icon: "💸", bg: "bg-rose-50",    text: "text-rose-700"    },
              { label: "Remaining",       value: formatCurrency(totalAllocated - totalSpent), icon: "✅", bg: "bg-emerald-50", text: "text-emerald-700" },
              { label: "Over Budget",     value: `${overCount} categories`,      icon: "⚠️", bg: "bg-orange-50",  text: "text-orange-700"  },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-[1.5rem] p-5 border border-white shadow-sm`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`text-[18px] font-black ${s.text} tracking-tight leading-tight`}>{s.value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
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
                  <div className="text-[48px] mb-4">💰</div>
                  <div className="text-[16px] font-black text-slate-300 mb-2">No budgets set yet</div>
                  <div className="text-[12px] text-slate-300 mb-6">Set monthly limits to track your spending</div>
                  <button onClick={() => setModalOpen(true)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                    Set Up Budgets
                  </button>
                </div>
              ) : (
                budgetData.map(b => (
                  <div key={b.id}
                    className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-5 md:p-6
                               hover:shadow-md hover:border-emerald-100 transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-wide">{b.name}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block ${b.badge}`}>
                          {b.label}
                        </span>
                        {b.createdAt && (
                          <p className="text-[9px] text-slate-400 font-bold mt-1">
                            Created {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[16px] font-black text-slate-900">{formatCurrency(b.spent)}</div>
                        <div className="text-[10px] text-slate-400 font-bold">of {formatCurrency(b.limit)}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-700 ${b.color}`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black ${b.remaining < 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                        {b.remaining < 0
                          ? `⚠️ Over by ${formatCurrency(Math.abs(b.remaining))}`
                          : `${formatCurrency(b.remaining)} remaining`}
                      </span>
                      <span className="text-[10px] font-black text-slate-400">{Math.round(b.pct)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Spending Chart — right */}
            <div className="lg:col-span-5">
              {budgetData.length > 0
                ? <SpendingChart budgetData={budgetData} />
                : (
                  <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                    <div className="text-[40px] mb-3">📊</div>
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