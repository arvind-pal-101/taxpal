import { useState, useEffect, useRef } from "react";

const TransactionModal = ({ isOpen, onClose, onSave, initialData, userBudgets = [] }) => {
  const [formData, setFormData] = useState({
    desc: "", amount: "", type: "income", category: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationError, setValidationError] = useState("");
  const dropdownRef = useRef(null);

  const defaultIncome  = ["Salary", "Freelance", "Investment", "Gift"];
  const defaultExpense = ["Food", "Rent & Bills", "Shopping", "Entertainment", "Transport", "Travel", "Health"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ desc: "", amount: "", type: "income", category: "", date: new Date().toISOString().split('T')[0] });
    }
    setValidationError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const getOptions = () => {
    const budgetNames = userBudgets.map(b => typeof b === 'object' ? (b.name || b.category) : b);
    const defaults = formData.type === 'income' ? defaultIncome : [...budgetNames, ...defaultExpense];
    return [...new Set(defaults)].filter(Boolean);
  };

  const filteredOptions = getOptions().filter(opt =>
    opt.toLowerCase().includes(formData.category.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    // Inline validation — no alert()
    if (!formData.category.trim()) { setValidationError("Category is required."); return; }
    if (!formData.amount || formData.amount <= 0) { setValidationError("Please enter a valid amount."); return; }

    onSave({ ...formData, amount: Number(formData.amount), id: initialData?.id || Date.now() });
    onClose();
  };

  const inputStyle = "w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-sm";

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-slideUp">

        {/* Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex justify-between items-center border-b border-gray-50 shrink-0">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">
            {initialData ? `✏️ Edit ${formData.type}` : "✨ New Record"}
          </h2>
          {/* Drag handle on mobile */}
          <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all text-xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto">

          {/* Validation error banner */}
          {validationError && (
            <div className="p-3 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-xs sm:text-sm font-bold">
              ⚠️ {validationError}
            </div>
          )}

          {/* Income / Expense toggle */}
          {!initialData ? (
            <div className="flex bg-gray-100 p-1 rounded-2xl shrink-0">
              {['income', 'expense'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => { setFormData({ ...formData, type: t, category: "" }); setShowDropdown(false); setValidationError(""); }}
                  className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.type === t
                      ? t === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'bg-white text-rose-600 shadow-sm'
                      : t === 'income' ? 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/50' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center pb-1">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border ${
                formData.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                Fixed as {formData.type}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <input
              required className={inputStyle}
              placeholder="What was this for?"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
            <input
              required type="number" className={inputStyle}
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); setValidationError(""); }}
            />
          </div>

          {/* Category */}
          <div className="space-y-1 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
            <div className="relative group">
              <input
                required className={`${inputStyle} pr-12`}
                placeholder="Type or select category..."
                value={formData.category}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => { setFormData({ ...formData, category: e.target.value }); setShowDropdown(true); setValidationError(""); }}
                autoComplete="off"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-emerald-500 transition-colors">▼</div>
            </div>

            {showDropdown && (
              <div className="absolute z-[999] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-44 sm:max-h-48 overflow-y-auto animate-fadeIn border-t-4 border-t-emerald-500">
                {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => { setFormData({ ...formData, category: opt }); setShowDropdown(false); }}
                    className="px-5 sm:px-6 py-3 sm:py-4 text-sm font-bold text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer transition-all flex justify-between items-center"
                  >
                    {opt}
                    {formData.category === opt && <span className="text-emerald-500 text-xs">✓</span>}
                  </div>
                )) : (
                  <div className="px-5 sm:px-6 py-3 sm:py-4">
                    <p className="text-[10px] font-black text-emerald-500 uppercase italic">✨ Custom: "{formData.category}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
            <input
              type="date" className={inputStyle}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Submit */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              className="w-full py-4 sm:py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
            >
              {initialData ? "Update Transaction" : "Confirm & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;