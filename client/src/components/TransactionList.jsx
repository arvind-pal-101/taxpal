import React from "react";
import { formatCurrency } from "../utils/financeHelpers";

const TransactionList = ({ transactions = [], loading }) => {
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
    <div className="flex flex-col w-full">

      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-10 custom-scrollbar transition-all duration-500">
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
                className="flex justify-between items-center p-4 rounded-[2rem] bg-transparent hover:bg-white hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] border border-transparent hover:border-gray-50 transition-all duration-500 group cursor-default hover:-translate-y-1.5 active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all duration-700 group-hover:rotate-[12deg] group-hover:scale-110 ${details.bg}`}>
                    {details.icon}
                  </div>

                  <div>
                    <p className="text-[14px] font-black text-gray-800 leading-none mb-1.5 group-hover:text-emerald-600 transition-all duration-500">
                      {t.desc}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter transition-all duration-500 group-hover:bg-opacity-100 ${details.bg} ${details.text}`}>
                         {t.category}
                       </span>
                       <span className="text-[9px] text-gray-300 group-hover:text-gray-500 font-bold uppercase tracking-tighter transition-colors duration-500">
                         {t.date}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-[15px] font-black tracking-tighter transition-all duration-500 group-hover:scale-110 origin-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-[8px] text-gray-300 group-hover:text-emerald-500 font-black uppercase tracking-widest transition-colors duration-500">
                    Success
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionList;