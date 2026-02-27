import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import StatCards from "../components/StatCards";
import TransactionList from "../components/TransactionList";
import TransactionModal from "../components/TransactionModal";
import Charts from "../components/Charts";
import BudgetProgress from "../components/BudgetProgress";
import TaxEstimator from "../components/TaxEstimator";
import axios from "axios";

const Dashboard = ({ transactions = [], onSaveTransaction }) => {
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  
  const [budgets, setBudgets] = useState([]); 
  const [userData, setUserData] = useState({ 
    plan: "pro", 
    expiry: "March 20, 2026",
    estimatedIncome: 0, 
    region: "India (New)"
  });
  const openModal = () => {
    refreshBudgets(); 
    setIsModalOpen(true);
  };
  const recentTransactions = (transactions || []).slice(0, 5);

  const refreshBudgets = useCallback(async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await axios.get('/api/budgets/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setBudgets(res.data); 
  } catch (err) {
    console.error("Error fetching budgets:", err);
  }
}, []);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) navigate("/login"); 
    };
    checkAuth();
    refreshBudgets();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("storage", refreshBudgets); 
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("storage", refreshBudgets);
    };
  }, [navigate, refreshBudgets]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        userStatus={userData} 
        onBudgetUpdate={refreshBudgets} 
      />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
          </div>
          
          <button 
            onClick={openModal}
            className="relative group bg-[#10b981] text-white px-4 md:px-7 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-black 
                      tracking-tight transition-all duration-500 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)]
                      hover:shadow-[0_20px_30px_-5px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:scale-95"
          >
            Add Record
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
          </div>
        ) : (
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8 animate-fadeIn">
            
            <StatCards transactions={transactions} />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden h-[350px] md:h-[450px]">
                  <Charts transactions={transactions} />
                </div>
                
                {/* Recent Transactions List */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                  <div className="flex justify-between items-end pt-8 px-8 mb-6">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Feed</h4>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Recent Activity</h3>
                    </div>
                    <button onClick={() => navigate('/transactions')} className="text-[10px] font-black text-gray-400 hover:text-emerald-600 transition-colors pb-1">
                      VIEW ALL RECORD →
                    </button>
                  </div>
                  <div className="px-6 pb-6">
                    <TransactionList transactions={recentTransactions} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8 h-full">
                <div className="sticky top-28 space-y-8">
                   <TaxEstimator transactions={transactions} userProfile={userData} />
<BudgetProgress 
  transactions={transactions} 
  budgets={budgets} 
  setBudgets={setBudgets} 
/>                </div>
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