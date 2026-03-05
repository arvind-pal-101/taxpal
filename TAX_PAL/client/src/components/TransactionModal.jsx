import { useState } from "react";

const TransactionModal = ({ isOpen, onClose, onSave, userBudgets = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [formData, setFormData] = useState({
    desc: "",
    amount: "",
    type: "income",
    category: "Salary",
    date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const placeholders = {
    income: "e.g. Freelance Project, Monthly Salary",
    expense: "e.g. Starbucks Coffee, House Rent"
  };

  const getCategories = () => {
    if (formData.type === 'income') {
      return ["Salary", "Freelance", "Investment", "Gift"];
    }
    const budgetNames = userBudgets.map(b => b.name);
    const defaults = ["Food", "Rent & Bills", "Shopping", "Entertainment", "Transport"];
    return [...new Set([...budgetNames, ...defaults])];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.desc) return;
    setIsSubmitting(true);
    try {
      await onSave({ ...formData, amount: parseFloat(formData.amount) });
      onClose();
      setIsCustom(false);
      setFormData({ desc: "", amount: "", type: "income", category: "Salary", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accentColor = formData.type === 'income' ? 'emerald' : 'rose';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
     
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-md animate-fadeIn" 
        onClick={onClose}
      ></div>
      
      <form 
        onSubmit={handleSubmit} 
        className="bg-white rounded-[2.5rem] w-full max-w-[420px] p-8 md:p-10 relative z-10 
                   border border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] 
                   animate-slideUp"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Add Entry</h3>
                <div className={`h-1.5 w-8 rounded-full bg-${accentColor}-500 transition-colors duration-500`}></div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
            >✕</button>
        </div>
        
        <div className="space-y-6">
          {/* Segmented Toggle Control */}
          <div className="flex gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
            <button 
              type="button"
              onClick={() => { setFormData({...formData, type: 'income', category: 'Salary'}); setIsCustom(false); }}
              className={`flex-1 py-3 rounded-[1rem] text-[10px] font-black tracking-widest transition-all duration-500
                ${formData.type === 'income' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-400 hover:text-emerald-500'}`}
            >
              INCOME
            </button>
            <button 
              type="button"
              onClick={() => { setFormData({...formData, type: 'expense', category: 'Food'}); setIsCustom(false); }}
              className={`flex-1 py-3 rounded-[1rem] text-[10px] font-black tracking-widest transition-all duration-500
                ${formData.type === 'expense' 
                  ? 'bg-white text-rose-500 shadow-sm' 
                  : 'text-gray-400 hover:text-rose-500'}`}
            >
              EXPENSE
            </button>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Description</label>
            <input 
              required 
              className={`w-full bg-gray-50/50 p-4 rounded-2xl outline-none border-2 border-transparent 
                         focus:bg-white focus:border-${accentColor}-500/20 focus:ring-[6px] focus:ring-${accentColor}-500/5 
                         transition-all duration-300 font-bold text-sm text-gray-800 placeholder:text-gray-300`} 
              placeholder={placeholders[formData.type]} 
              value={formData.desc}
              onChange={e => setFormData({...formData, desc: e.target.value})} 
            />
          </div>

          {/* Amount & Category Row */}
          <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Amount</label>
                <div className="relative">
                   <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-${accentColor}-500`}>$</span>
                   <input 
                    required type="number" step="0.01"
                    className={`w-full bg-gray-50/50 p-4 pl-8 rounded-2xl outline-none border-2 border-transparent 
                               focus:bg-white focus:border-${accentColor}-500/20 
                               transition-all duration-300 font-black text-sm text-gray-800`} 
                    placeholder="0.00" 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Category</label>
                <div className="relative h-[56px]">
                  {!isCustom ? (
                    <select 
                      className={`w-full h-full bg-gray-50/50 px-4 rounded-2xl outline-none border-2 border-transparent 
                                 focus:bg-white focus:border-${accentColor}-500/20 transition-all 
                                 font-black text-[10px] uppercase text-gray-500 cursor-pointer appearance-none`}
                      value={formData.category}
                      onChange={e => e.target.value === "CUSTOM" ? (setIsCustom(true), setFormData({...formData, category: ""})) : setFormData({...formData, category: e.target.value})}
                    >
                      {getCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="CUSTOM" className="text-emerald-600">+ CUSTOM...</option>
                    </select>
                  ) : (
                    <div className="relative h-full animate-slideRight">
                      <input 
                        autoFocus
                        className={`w-full h-full bg-white px-4 pr-10 rounded-2xl outline-none border-2 border-${accentColor}-500/30 
                                   font-black text-[10px] uppercase text-gray-700`}
                        placeholder="Name..."
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      />
                      <button type="button" onClick={() => setIsCustom(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-rose-500">✕</button>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Transaction Date</label>
             <input 
               type="date" 
               className={`w-full bg-gray-50/50 p-4 rounded-2xl outline-none border-2 border-transparent 
                          focus:bg-white focus:border-${accentColor}-500/20 transition-all 
                          font-bold text-sm text-gray-500`} 
               value={formData.date}
               onChange={e => setFormData({...formData, date: e.target.value})} 
             />
          </div>

          {/* Footer Action */}
          <div className="pt-4">
            <button 
              disabled={isSubmitting}
              type="submit" 
              className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl active:scale-[0.97] flex items-center justify-center gap-3
                ${isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-950 text-white hover:bg-black hover:-translate-y-1 hover:shadow-2xl shadow-gray-200'}
              `}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
              ) : "Confirm Transaction"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TransactionModal;