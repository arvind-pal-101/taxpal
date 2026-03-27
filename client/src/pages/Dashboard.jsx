import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import StatCards from "../components/StatCards";
import TransactionList from "../components/TransactionList";
import TransactionModal from "../components/TransactionModal";
import Charts from "../components/Charts";
import TaxEstimator from "../components/TaxEstimator";

// ── Compact Budget Summary
const BudgetSummary = ({ budgets = [], transactions = [] }) => {
  const navigate = useNavigate();

  const budgetData = budgets.map(cat => {
    const name  = cat.name || cat.category;
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category?.toLowerCase().trim() === name?.toLowerCase().trim())
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const pct = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
    return { ...cat, name, spent, pct, remaining: cat.limit - spent };
  });

  const overCount    = budgetData.filter(b => b.pct >= 100).length;
  const warnCount    = budgetData.filter(b => b.pct >= 80 && b.pct < 100).length;
  const healthyCount = budgetData.filter(b => b.pct < 80).length;
  const totalSpent   = budgetData.reduce((s, b) => s + b.spent, 0);
  const totalLimit   = budgets.reduce((s, b) => s + (b.limit || 0), 0);

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
      <div className="mb-6">
        <h4 className="text-2xl font-[1000] text-slate-900 tracking-tight leading-tight">Budget Tracker</h4>
        <p className="text-[11px] text-emerald-600 font-black uppercase tracking-[0.15em] mt-1">Monthly Overview</p>
      </div>

      {budgets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v2m0 8v2"/><path d="M9 9.5c0-1.1.9-1.5 3-1.5s3 .9 3 2.5c0 2-3 2.5-3 4.5 0 1.1.4 1.5 3 1.5"/></svg></div>
          <p className="text-[12px] font-bold text-slate-300 mb-4">No budgets configured</p>
        </div>
      ) : (
        <>
          {/* Status pills */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <div className="text-[20px] font-black text-emerald-600">{healthyCount}</div>
              <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Healthy</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <div className="text-[20px] font-black text-orange-500">{warnCount}</div>
              <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Warning</div>
            </div>
            <div className="bg-rose-50 rounded-2xl p-3 text-center">
              <div className="text-[20px] font-black text-rose-500">{overCount}</div>
              <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Over</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Spending</span>
              <span className="text-[11px] font-black text-slate-700">
                {totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalLimit > 0 && totalSpent / totalLimit >= 1   ? 'bg-rose-500'
                : totalLimit > 0 && totalSpent / totalLimit >= 0.8 ? 'bg-orange-400'
                : 'bg-emerald-500'}`}
                style={{ width: `${totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Top 3 categories */}
          <div className="space-y-2 mb-5 flex-1">
            {budgetData.slice(0, 3).map(b => (
              <div key={b._id || b.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  b.pct >= 100 ? 'bg-rose-500' : b.pct >= 80 ? 'bg-orange-400' : 'bg-emerald-500'}`} />
                <span className="text-[11px] font-black text-slate-600 flex-1 truncate uppercase tracking-wide">{b.name}</span>
                <span className={`text-[10px] font-black ${b.remaining < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {b.remaining < 0 ? 'Over' : `${Math.round(b.pct)}%`}
                </span>
              </div>
            ))}
            {budgetData.length > 3 && (
              <p className="text-[10px] text-slate-300 font-bold text-center pt-1">
                +{budgetData.length - 3} more categories
              </p>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => navigate('/budget')}
        className="mt-4 w-full py-4 bg-slate-900 text-white rounded-[2rem] text-[11px] font-[1000] uppercase
                   tracking-[0.2em] shadow-lg hover:bg-emerald-600 active:scale-[0.98] transition-all duration-300">
        {budgets.length === 0 ? 'Set Up Budgets →' : 'Manage Budgets →'}
      </button>
    </div>
  );
};

// ── Main Dashboard
const Dashboard = ({ transactions = [], budgets = [], onSaveTransaction }) => {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [userData,      setUserData]      = useState({
    plan: "pro",
    expiry: "March 20, 2026",
    estimatedIncome: 0,
    region: "India (New)"
  });

  const recentTransactions = (transactions || []).slice(0, 5);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userStatus={userData}
        onBudgetUpdate={() => {}}
      />

      <main className="flex-1 overflow-y-auto relative custom-scrollbar">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="relative group bg-[#10b981] text-white px-4 md:px-7 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-black
                       tracking-tight transition-all duration-500 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)]
                       hover:shadow-[0_20px_30px_-5px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:scale-95">
            Add Record
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500" />
          </div>
        ) : (
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8 animate-fadeIn">

            <StatCards transactions={transactions} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left — Charts + Recent */}
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden h-[420px] md:h-[500px]">
                  <Charts transactions={transactions} />
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                  <div className="flex justify-between items-end pt-8 px-8 mb-6">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Feed</h4>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Activity</h3>
                    </div>
                    <button onClick={() => navigate('/transactions')}
                      className="text-[10px] font-black text-gray-400 hover:text-emerald-600 transition-colors pb-1">
                      VIEW ALL RECORD →
                    </button>
                  </div>
                  <div className="px-6 pb-6">
                    <TransactionList transactions={recentTransactions} />
                  </div>
                </div>
              </div>

              {/* Right — Tax + Budget summary */}
              <div className="lg:col-span-4 space-y-8">
                <div className="sticky top-28 space-y-8">
                  <TaxEstimator transactions={transactions} userProfile={userData} />
                  <BudgetSummary budgets={budgets} transactions={transactions} />
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveTransaction}
        userBudgets={budgets}
      />

      <style>{`
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;