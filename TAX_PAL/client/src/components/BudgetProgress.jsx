import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "../utils/financeHelpers";

const BudgetProgress = ({ transactions = [], loading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem("user_budgets");
    return saved ? JSON.parse(saved) : []; 
  });

  const [tempBudgets, setTempBudgets] = useState([]);

  useEffect(() => {
    localStorage.setItem("user_budgets", JSON.stringify(budgets));
  }, [budgets]);

  const openModal = () => {
    setTempBudgets([...budgets]);
    setShowErrors(false);
    setIsModalOpen(true);
  };

  const budgetData = useMemo(() => {
    return budgets.map(cat => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' && 
          t.category?.toLowerCase().trim() === cat.name?.toLowerCase().trim()
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      return { ...cat, spent, remaining: cat.limit - spent };
    });
  }, [transactions, budgets]);

  const isFormValid = tempBudgets.every(cat => cat.name.trim() !== "" && cat.limit > 0);
  
  const hasDuplicateNames = () => {
    const names = tempBudgets.map(cat => cat.name.toLowerCase().trim()).filter(n => n !== "");
    return names.some((name, index) => names.indexOf(name) !== index);
  };

  const addCategory = () => {
    if (tempBudgets.length > 0 && (!isFormValid || hasDuplicateNames())) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setTempBudgets([{ id: Date.now(), name: "", limit: 0 }, ...tempBudgets]);
  };

  const handleConfirmSave = () => {
    if (!isFormValid || hasDuplicateNames()) {
      setShowErrors(true);
      return;
    }
    setBudgets(tempBudgets);
    setIsModalOpen(false);
    setShowErrors(false);
  };

  const removeCategory = (id) => {
    setTempBudgets(tempBudgets.filter(cat => cat.id !== id));
  };

  const updateCategory = (id, field, value) => {
    setTempBudgets(tempBudgets.map(cat => 
      cat.id === id ? { ...cat, [field]: field === 'limit' ? (value === "" ? "" : Number(value)) : value } : cat
    ));
  };

  if (loading) return <div className="animate-pulse p-8 bg-white rounded-[2.5rem]">Loading...</div>;

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:-translate-y-1.5 transition-all duration-500 ease-out flex flex-col min-h-[400px] lg:h-[520px] relative overflow-hidden">
        <div className="flex justify-between items-start mb-8 md:mb-10 px-1 md:px-2 shrink-0">
          <div className="space-y-1">
            <h4 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Budget Planning</h4>
            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">Monthly Limits</p>
          </div>
          {budgets.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 px-2.5 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[8px] md:text-[10px] font-black text-emerald-700 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-16">
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {budgetData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5 px-4 animate-fadeIn">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm md:text-base font-black text-gray-900 mb-1">No Budgets Defined</p>
                <p className="text-[10px] md:text-xs font-medium text-gray-400 leading-relaxed">Set monthly spending targets to <br className="hidden md:block"/>track your savings effectively.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-7 md:space-y-9">
              {budgetData.map((b) => {
                const isOverBudget = b.spent > b.limit;
                const percentage = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0;
                
                const statusColor = isOverBudget 
                  ? 'text-rose-600 animate-pulse' 
                  : percentage >= 90 ? 'text-rose-600' 
                  : percentage >= 65 ? 'text-amber-500' 
                  : 'text-emerald-600';

                const barColor = isOverBudget
                  ? 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                  : percentage >= 90 ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                  : percentage >= 65 ? 'bg-amber-400' 
                  : 'bg-emerald-500';

                return (
                  <div key={b.id} className="group cursor-pointer">
                    <div className="flex justify-between items-end mb-2.5">
                      <div className="space-y-0.5 md:space-y-1 transition-all duration-300 md:group-hover:translate-x-1.5">
                        <span className="text-[10px] md:text-[12px] font-black text-gray-400 uppercase tracking-widest transition-colors duration-300 group-hover:text-gray-900 inline-block">
                          {b.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] md:text-[10px] font-bold ${statusColor} transition-all duration-300 group-hover:brightness-125`}>
                            {isOverBudget 
                              ? `⚠️ Over by ${formatCurrency(b.spent - b.limit)}` 
                              : `${percentage.toFixed(0)}% Used`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col transition-all duration-300 md:group-hover:scale-105 origin-right">
                        <span className={`text-[12px] md:text-[13px] font-black tracking-tight ${isOverBudget ? 'text-rose-600' : 'text-gray-900'}`}>
                          {formatCurrency(b.spent)}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold text-gray-300 uppercase tracking-tighter group-hover:text-gray-500">
                          Limit: {formatCurrency(b.limit)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100/80 h-1.5 rounded-full overflow-hidden relative shadow-inner">
                      <div className={`h-full transition-all duration-1000 ease-out rounded-full ${barColor} group-hover:brightness-110`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white pt-4 shrink-0 z-20 mt-auto">
          <button onClick={openModal} className="w-full py-4 md:py-5 bg-emerald-50 text-emerald-700 rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] hover:bg-emerald-600 hover:text-white hover:shadow-[0_15px_30px_rgba(16,185,129,0.25)] transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 group">
            <span>{budgets.length === 0 ? "Set Your Budget" : "Manage Limits"}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl border border-white/60 h-[85vh] md:max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
            <div className="flex justify-between items-center mb-6 shrink-0">
               <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Budget</h3>
               <button onClick={addCategory} className="bg-emerald-50 text-emerald-600 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all transform active:scale-95">
                 + Add
               </button>
            </div>

            <div className="space-y-4 md:space-y-6 overflow-y-auto no-scrollbar pr-1 flex-1 pb-10">
               {tempBudgets.map((cat, index) => {
                 const nameError = showErrors && cat.name.trim() === "";
                 const limitError = showErrors && cat.limit <= 0;
                 const isDuplicate = showErrors && tempBudgets.some((other, idx) => 
                    idx !== index && 
                    other.name.toLowerCase().trim() === cat.name.toLowerCase().trim() && 
                    cat.name.trim() !== ""
                 );

                 return (
                   <div key={cat.id} className="flex flex-col sm:flex-row gap-3 items-start bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shrink-0 relative mb-4">
                      {/* Name Field Wrapper */}
                      <div className="w-full sm:flex-1 space-y-1 relative pb-4">
                         <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Category Name</label>
                         <input 
                           type="text" 
                           value={cat.name} 
                           placeholder="e.g. Travel" 
                           onChange={(e) => updateCategory(cat.id, 'name', e.target.value)} 
                           className={`w-full bg-white rounded-xl p-3 text-sm font-bold outline-none border-2 transition-all 
                             ${(nameError || isDuplicate) ? "border-rose-500 bg-rose-50/50" : "border-transparent focus:border-emerald-500/20"}`} 
                         />
                         {/* Name Error Message */}
                         {(nameError || isDuplicate) && (
                           <p className="absolute bottom-0 left-1 text-[8px] text-rose-500 font-black uppercase animate-pulse">
                             {isDuplicate ? "⚠️ Already exists" : "⚠️ Name required"}
                           </p>
                         )}
                      </div>

                      {/* Limit Field Wrapper */}
                      <div className="w-full sm:w-32 space-y-1 relative pb-4">
                         <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Limit</label>
                         <input 
                           type="number" 
                           value={cat.limit === 0 ? "" : cat.limit} 
                           placeholder="0" 
                           onChange={(e) => updateCategory(cat.id, 'limit', e.target.value)} 
                           className={`w-full bg-white rounded-xl p-3 text-sm font-black text-emerald-600 outline-none border-2 transition-all
                             ${limitError ? "border-rose-500 bg-rose-50/50" : "border-transparent focus:border-emerald-500/20"}`} 
                         />
                         {/* Limit Error Message */}
                         {limitError && (
                           <p className="absolute bottom-0 left-1 text-[8px] text-rose-500 font-black uppercase animate-pulse">
                             ⚠️ Set limit
                           </p>
                         )}
                      </div>

                      <button onClick={() => removeCategory(cat.id)} className="absolute top-2 right-2 sm:relative sm:top-0 sm:mt-8 p-2 text-gray-300 hover:text-rose-500 transition-colors">✕</button>
                   </div>
                 );
               })}
            </div>

            <div className="pt-4 bg-white shrink-0 border-t border-gray-50 mt-auto">
              <button 
                onClick={handleConfirmSave} 
                className="w-full py-4 md:py-5 bg-emerald-50 text-emerald-700 rounded-[1.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] hover:bg-emerald-600 hover:text-white transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
              >
                <span>Save Changes</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetProgress;