import { getTotalByType, formatCurrency } from "../utils/financeHelpers";

const StatCards = ({ transactions = [], loading }) => {
  const income = getTotalByType(transactions, "income");
  const expenses = getTotalByType(transactions, "expense");
  const savings = income - expenses;

  const cards = [
    { 
      title: "Total Income", 
      amount: income, 
      icon: "plus",
      emoji: "💰",
      color: "text-emerald-600", 
      bg: "bg-emerald-50/50",
      accent: "bg-emerald-500"
    },
    { 
      title: "Total Expenses", 
      amount: expenses, 
      emoji: "📉", 
      color: "text-rose-600", 
      bg: "bg-rose-50/50",
      accent: "bg-rose-500"
    },
    { 
      title: "Net Savings", 
      amount: savings, 
      emoji: "🏦", 
      // Dynamic color: Red if in debt, Blue if positive
      color: savings >= 0 ? "text-blue-600" : "text-amber-600", 
      bg: savings >= 0 ? "bg-blue-50/50" : "bg-amber-50/50",
      accent: savings >= 0 ? "bg-blue-500" : "bg-amber-500"
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-50 rounded-[1.2rem]"></div>
              <div className="flex-1 space-y-2">
                <div className="h-2 w-16 bg-gray-50 rounded-full"></div>
                <div className="h-5 w-24 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="group relative bg-white p-5 md:p-6 rounded-[2.2rem] border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden"
        >
          {/* Subtle Accent Bar on Top */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

          <div className="flex items-center gap-4 md:gap-5 relative z-10">
            {/* Icon Container */}
            <div className={`${card.bg} w-14 h-14 md:w-16 md:h-16 rounded-[1.3rem] flex items-center justify-center text-2xl md:text-3xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out`}>
              {card.emoji}
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                {card.title}
              </span>
              <h3 className={`text-xl md:text-2xl font-black ${card.color} tracking-tighter leading-none`}>
                {formatCurrency(card.amount || 0)}
              </h3>
            </div>
          </div>
          
          {/* Background Decorative Shape */}
          <div className="absolute -right-4 -bottom-4 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
             <span className="text-7xl font-black">{index + 1}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;