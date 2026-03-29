import { useState } from "react";

const ProPlanCard = ({ userStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPro = userStatus?.plan === "pro";

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden shadow-xl rounded-[2.2rem]
        ${isPro ? 'bg-gradient-to-br from-[#064e3b] to-[#022c22]' : 'bg-white border-2 border-dashed border-emerald-100'}
        ${isExpanded ? 'p-6 md:p-8 h-auto scale-100 shadow-2xl' : 'p-4 h-[75px] flex items-center justify-between'}
      `}
    >
      {/* Background Glow Effect - Pro only */}
      {isPro && (
        <div className="absolute -right-6 -top-6 bg-emerald-400/10 rounded-full blur-3xl w-24 h-24 md:w-32 md:h-32 pointer-events-none transition-opacity duration-500"></div>
      )}
      
      {!isExpanded ? (
        // --- COLLAPSED STATE ---
        <div className="flex items-center justify-between w-full px-1 animate-fadeIn">
          <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                isPro ? 'bg-emerald-500 text-white italic shadow-emerald-900/40' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {isPro ? 'P' : '↑'}
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] md:text-[12px] font-black uppercase tracking-wider ${isPro ? 'text-white' : 'text-gray-800'}`}>
                  {isPro ? 'TaxPal Pro' : 'Upgrade'}
                </span>
                {isPro && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-[8px] md:text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">Active</span>
                  </div>
                )}
              </div>
          </div>

          <button 
            onClick={handleToggle}
            className={`group w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${
              isPro ? 'hover:bg-white/10' : 'hover:bg-emerald-50'
            }`}
          >
            <span className={`text-sm md:text-lg transition-transform group-hover:-translate-y-1 ${
              isPro ? 'text-emerald-400' : 'text-emerald-500'
            }`}>
              ▲
            </span>
          </button>
        </div>
      ) : (
        // --- EXPANDED STATE ---
        <div className="relative z-10 animate-slideUp">
          <div className="flex justify-between items-center mb-5 md:mb-6">
             <div className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl ${
               isPro ? 'text-emerald-300 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'
             }`}>
               {isPro ? 'Active Subscription' : 'Upgrade Plan'}
             </div>

             <button 
               onClick={handleToggle}
               className={`group w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${
                 isPro ? 'hover:bg-white/10 text-emerald-300/60' : 'hover:bg-gray-50 text-gray-400'
               }`}
             >
               <span className="text-sm md:text-lg transition-transform group-hover:translate-y-1 group-hover:text-emerald-400">
                 ▼
               </span>
             </button>
          </div>

          <div className="space-y-1 mb-6">
            <h4 className={`text-xl md:text-2xl font-black ${isPro ? 'text-white' : 'text-gray-900'}`}>
              {isPro ? 'Professional' : 'Unlock Pro'}
            </h4>
            <p className={`text-[11px] md:text-[12px] leading-relaxed max-w-[90%] ${isPro ? 'text-emerald-100/60' : 'text-gray-500'}`}>
              {isPro 
                ? `Full access to AI tools enabled until ${userStatus?.expiry || "next cycle"}.` 
                : 'Get AI tax audits, priority support, and unlimited exports.'}
            </p>
          </div>

          <button 
            onClick={(e) => e.stopPropagation()} 
            className={`w-full py-4 rounded-[1.2rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg ${
              isPro 
                ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-900/20' 
                : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
            }`}
          >
            {isPro ? 'Manage Billing' : 'Upgrade Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProPlanCard;