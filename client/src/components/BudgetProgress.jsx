import { useState, useMemo } from "react"; 
import { createPortal } from "react-dom";
import { formatCurrency } from "../utils/financeHelpers";
import axios from "axios";

const BudgetProgress = ({ transactions = [], budgets = [], setBudgets, loading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempBudgets, setTempBudgets] = useState([]);

  // --- Core Logic ---
  const addCategory = () => setTempBudgets([{ id: `temp-${Date.now()}`, name: "", limit: 0 }, ...tempBudgets]);
  const removeCategory = (id) => setTempBudgets(tempBudgets.filter(cat => (cat._id || cat.id) !== id));
  
  const updateCategory = (id, field, value) => {
    setTempBudgets(tempBudgets.map(cat => 
      (cat._id || cat.id) === id ? { ...cat, [field]: field === 'limit' ? (value === "" ? "" : Number(value)) : value } : cat
    ));
  };

  const handleConfirmSave = async () => {
    if (tempBudgets.some(b => !b.name.trim() || !b.limit || b.limit <= 0)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post('/api/budgets/sync', { budgets: tempBudgets }, { headers: { Authorization: `Bearer ${token}` } });
      setBudgets(tempBudgets); 
      setIsModalOpen(false);
    } catch (err) { alert("Sync failed!"); }
  };

  const budgetData = useMemo(() => {
    return budgets.map(cat => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category?.toLowerCase().trim() === (cat.name || cat.category)?.toLowerCase().trim())
        .reduce((sum, t) => sum + Number(t.amount || 0), 0); 
      const percent = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
      let statusColor = percent >= 100 ? "bg-rose-500" : percent >= 80 ? "bg-orange-500" : percent >= 50 ? "bg-amber-400" : "bg-emerald-500";
      return { ...cat, id: cat._id || cat.id, name: cat.name || cat.category, spent, percent, statusColor, remaining: cat.limit - spent };
    });
  }, [transactions, budgets]);

  if (loading) return <div className="animate-pulse p-8 bg-white rounded-[2.5rem]">Loading...</div>;

  return (
    <>
      {/* Main Tracker Card */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[400px] lg:h-[520px] antialiased">
        <div className="mb-10">
          <h4 className="text-2xl font-[1000] text-slate-900 tracking-tight leading-tight">Budget Tracker</h4>
          <p className="text-[11px] text-emerald-600 font-black uppercase tracking-[0.15em] mt-1">Real-time Analytics</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-hide">
          {budgetData.length === 0 ? (
            <div className="text-center py-20 text-slate-300 font-bold italic">No budgets configured.</div>
          ) : (
            budgetData.map((b) => (
              <div key={b.id} className="group p-4 rounded-3xl transition-all duration-300 hover:bg-slate-50 border-l-4 border-transparent hover:border-emerald-500">
                <div className="flex justify-between items-end mb-3">
                  <div className="space-y-1">
                    <span className="text-[14px] font-[1000] text-slate-800 uppercase tracking-wide group-hover:text-black transition-colors">{b.name}</span>
                    <p className={`text-[10px] font-black tracking-wider ${b.remaining < 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                      {b.remaining < 0 ? `⚠️ OVER: ${formatCurrency(Math.abs(b.remaining))}` : `${formatCurrency(b.remaining)} LEFT`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-[1000] text-slate-900">{formatCurrency(b.spent)}</span>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-tighter">of {formatCurrency(b.limit)}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ease-out rounded-full ${b.statusColor}`} style={{ width: `${Math.min(b.percent, 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={() => { setTempBudgets([...budgets]); setIsModalOpen(true); }} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-[1000] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-600 active:scale-[0.98] transition-all duration-300">
           Manage & Setup Budgets
        </button>
      </div>

      {/* Responsive Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             
             {/* Header */}
             <div className="p-6 md:p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl md:text-2xl font-[1000] text-slate-900">Budget Settings</h3>
                  <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control your monthly limits</p>
                </div>
                <button onClick={addCategory} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md">+ Add New</button>
             </div>
             
             {/* Body */}
             <div className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-hide bg-slate-50/30">
                {tempBudgets.map((cat) => {
                  const isNameInvalid = cat.name.trim() === "";
                  const isLimitInvalid = !cat.limit || cat.limit <= 0;

                  return (
                    <div key={cat._id || cat.id} className="relative bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all group-within:shadow-md">
                      <div className="flex flex-col md:flex-row gap-5 md:items-start">
                        
                        {/* Category Name Field */}
                        <div className="flex-[2] flex flex-col">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category Name</label>
                          <input 
                            className={`w-full p-3.5 bg-slate-50 rounded-2xl border font-bold text-slate-900 outline-none transition-all focus:bg-white ${isNameInvalid ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`}
                            value={cat.name}
                            onChange={(e) => updateCategory(cat._id || cat.id, 'name', e.target.value)}
                            placeholder="e.g. Shopping"
                          />
                          {isNameInvalid && (
                            <span className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 ml-1 animate-pulse">Required name *</span>
                          )}
                        </div>

                        {/* Limit Field */}
                        <div className="flex-1 flex flex-col">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 md:text-right">Budget Limit</label>
                          <input 
                            className={`w-full p-3.5 bg-slate-50 rounded-2xl border font-[1000] md:text-right text-slate-900 outline-none transition-all focus:bg-white ${isLimitInvalid ? 'border-rose-200 focus:border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`}
                            type="number"
                            value={cat.limit === 0 ? "" : cat.limit}
                            onChange={(e) => updateCategory(cat._id || cat.id, 'limit', e.target.value)}
                            placeholder="0.00"
                          />
                          {isLimitInvalid && (
                            <span className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 ml-1 md:text-right md:mr-1 animate-pulse">Invalid limit *</span>
                          )}
                        </div>

                        {/* Delete Action (Desktop) */}
                        <button onClick={() => removeCategory(cat._id || cat.id)} className="hidden md:flex mt-8 text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        {/* Delete Action (Mobile) */}
                        <button onClick={() => removeCategory(cat._id || cat.id)} className="md:hidden absolute top-5 right-6 text-rose-400 font-black text-[10px] uppercase">
                           Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
             </div>

             {/* Footer */}
             <div className="p-6 md:p-8 bg-white border-t sticky bottom-0">
                <button 
                  onClick={handleConfirmSave} 
                  disabled={tempBudgets.some(b => !b.name.trim() || !b.limit || b.limit <= 0)}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-[1000] text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 disabled:opacity-20 disabled:grayscale transition-all shadow-xl active:scale-95"
                >
                  Confirm & Sync Changes
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default BudgetProgress;