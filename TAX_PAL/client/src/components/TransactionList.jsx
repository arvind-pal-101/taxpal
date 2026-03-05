import React, { useState } from "react";
import { formatCurrency } from "../utils/financeHelpers";
import AllTransactionsModal from "./AllTransactionsModal";

const TransactionList = ({ transactions = [], loading }) => {
  const [isAllOpen, setIsAllOpen] = useState(false);
  
  const getCategoryDetails = (category, type) => {
    const map = {
      "Freelance": { icon: "💻", bg: "bg-blue-50/50", text: "text-blue-600" },
      "Rent & Bills": { icon: "🏠", bg: "bg-orange-50/50", text: "text-orange-600" },
      "Food": { icon: "🍔", bg: "bg-rose-50/50", text: "text-rose-600" },
      "Shopping": { icon: "🛍️", bg: "bg-purple-50/50", text: "text-purple-600" },
      "Salary": { icon: "💰", bg: "bg-emerald-50/50", text: "text-emerald-600" },
      "Tax": { icon: "⚖️", bg: "bg-gray-100", text: "text-gray-700" },
    };
    
    return map[category] || { 
      icon: type === 'income' ? '💰' : '💸', 
      bg: type === 'income' ? 'bg-emerald-50/50' : 'bg-gray-50', 
      text: type === 'income' ? 'text-emerald-600' : 'text-gray-600' 
    };
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-4 w-12 bg-gray-50 rounded animate-pulse"></div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center animate-pulse">
            <div className="w-11 h-11 bg-gray-100 rounded-2xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
              <div className="h-2 w-1/4 bg-gray-50 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-6 md:p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Recent Activity</h4>
        </div>
        <button 
          onClick={() => setIsAllOpen(true)} 
          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all active:scale-95"
        >
          View All
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar transition-all duration-500">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-50 rounded-[2rem]">
            <span className="text-4xl mb-4 grayscale opacity-30">📁</span>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No activity found</p>
          </div>
        ) : (
          recentTransactions.map((t, idx) => {
            const details = getCategoryDetails(t.category, t.type);
            return (
              <div 
                key={t.id || idx} 
                className="flex justify-between items-center p-3 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 border border-transparent hover:border-gray-50 transition-all duration-300 group cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center text-xl shadow-sm transition-all duration-500 group-hover:rotate-6 ${details.bg}`}>
                    {details.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-gray-900 leading-none mb-1.5 group-hover:text-emerald-700 transition-colors">{t.desc}</p>
                    <div className="flex items-center gap-2">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter ${details.bg} ${details.text}`}>
                         {t.category}
                       </span>
                       <span className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">{t.date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-[14px] font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest">Success</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Integration */}
      <AllTransactionsModal 
        isOpen={isAllOpen} 
        onClose={() => setIsAllOpen(false)}
        transactions={transactions} 
      />
    </div>
  );
};

export default TransactionList;