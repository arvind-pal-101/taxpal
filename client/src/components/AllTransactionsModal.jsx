import { useState } from "react";
import { formatCurrency } from "../utils/financeHelpers";

const AllTransactionsModal = ({ isOpen, onClose, transactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  if (!isOpen) return null;

  const getCategoryDetails = (category, type) => {
    const map = {
      "Freelance": { icon: "💻", bg: "bg-blue-50", text: "text-blue-600" },
      "Rent & Bills": { icon: "🏠", bg: "bg-orange-50", text: "text-orange-600" },
      "Food": { icon: "🍔", bg: "bg-rose-50", text: "text-rose-600" },
      "Shopping": { icon: "🛍️", bg: "bg-purple-50", text: "text-purple-600" },
      "Salary": { icon: "💰", bg: "bg-emerald-50", text: "text-emerald-600" },
    };
    return map[category] || { 
      icon: type === 'income' ? '💰' : '💸', 
      bg: type === 'income' ? 'bg-emerald-50' : 'bg-gray-50', 
      text: type === 'income' ? 'text-emerald-600' : 'text-gray-600' 
    };
  };

  const filteredData = transactions.filter((t) => {
    const matchesSearch = t.desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "all" || t.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-[500px] h-[90vh] sm:h-[85vh] flex flex-col relative z-10 border-[1.5px] border-gray-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] animate-slideUp overflow-hidden">
        
        {/* Header Section: Responsive padding */}
        <div className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-gray-50">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Financial Records</h3>
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                TaxPal Ledger • {transactions.length} Total
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">✕</button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <input 
              type="text"
              placeholder="Search record..."
              className="w-full bg-gray-50/80 p-3.5 sm:p-4 pl-10 sm:pl-12 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500/20 focus:bg-white transition-all font-bold text-sm text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 opacity-30 text-sm">🔍</span>
          </div>

          {/* Filters: Responsive Text */}
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-all
                  ${activeFilter === f ? 'bg-gray-800 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List Section: Optimized spacing for mobile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-3">
            {filteredData.length > 0 ? (
              filteredData.map(t => {
  const details = getCategoryDetails(t.category, t.type);
  return (
    <div 
      key={t.id} 
      className="relative flex justify-between items-center p-4 pl-6 rounded-[2rem] border border-transparent bg-white hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 group cursor-default hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
    >
      
      {/* Side Indicator: Smooth transition on hover */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 group-hover:w-1.5 ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="flex items-center gap-4">
        {/* Icon: Pop & Rotate effect like Recent Activity */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-all duration-700 group-hover:rotate-[12deg] group-hover:scale-110 ${details.bg}`}>
          {details.icon}
        </div>
        
        <div className="max-w-[150px] sm:max-w-none">
          {/* Desc: Color change to emerald on hover */}
          <p className="text-sm font-black text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors duration-500 truncate sm:whitespace-normal">
            {t.desc}
          </p>
          <div className="flex items-center gap-2">
             <span className={`text-[8px] sm:text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md transition-all duration-500 ${details.bg} ${details.text}`}>
               {t.category}
             </span>
             <span className="text-[9px] sm:text-[10px] text-gray-300 group-hover:text-gray-500 font-bold uppercase tracking-tighter transition-colors duration-500">
               {t.date}
             </span>
          </div>
        </div>
      </div>

      {/* Amount Section: Scaling up on hover */}
      <div className="text-right">
        <div className={`flex items-center justify-end gap-1 font-black text-sm sm:text-base tracking-tighter transition-all duration-500 group-hover:scale-110 origin-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
          <span>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</span>
        </div>
        {/* Verified/Success text: Turns Green/Emerald on hover */}
        <p className="text-[8px] sm:text-[9px] text-gray-300 group-hover:text-emerald-500 font-bold uppercase tracking-widest transition-colors duration-500">
          Verified
        </p>
      </div>
    </div>
  );
})
            ) : (
              <div className="text-center py-16 sm:py-20 opacity-30">
                 <span className="text-3xl sm:text-4xl block mb-2">📁</span>
                 <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest">No matching records</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 text-center border-t border-gray-100">
            <p className="text-[8px] sm:text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">TaxPal Secure Ledger</p>
        </div>
      </div>
    </div>
  );
};

export default AllTransactionsModal;