import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import StatCards from "../components/StatCards";
import TransactionList from "../components/TransactionList";
import TransactionModal from "../components/TransactionModal";
import Charts from "../components/Charts";
import BudgetProgress from "../components/BudgetProgress";
import TaxEstimator from "../components/TaxEstimator";
import ExpenseBreakdown from "../components/ExpenseBreakdown";
import axios from "axios";
import TaxNotificationBanner from "../components/TaxNotificationBanner";

const API = "http://localhost:5000";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [userData, setUserData] = useState({
    plan: "pro",
    expiry: "March 20, 2026",
    estimatedIncome: 0,
    region: "India (New)"
  });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const refreshBudgets = useCallback(() => {
    const savedBudgets = JSON.parse(localStorage.getItem("user_budgets") || "[]");
    setBudgets(savedBudgets);
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/transactions`, getAuthHeader());
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const init = async () => {
      setLoading(true);
      refreshBudgets();
      await fetchTransactions();
      setLoading(false);
    };
    init();

    window.addEventListener("storage", refreshBudgets);
    return () => window.removeEventListener("storage", refreshBudgets);
  }, [navigate, refreshBudgets, fetchTransactions]);

  const handleSaveTransaction = async (newEntry) => {
    try {
      await axios.post(`${API}/api/transactions`, newEntry, getAuthHeader());
      await fetchTransactions();
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userStatus={userData}
        onBudgetUpdate={refreshBudgets}
      />

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="relative group bg-[#10b981] text-white px-4 md:px-7 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-black
                      tracking-tight transition-all duration-500 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)]
                      hover:shadow-[0_20px_30px_-5px_rgba(16,185,129,0.3)] hover:-translate-y-1 hover:scale-[1.03] active:scale-95"
          >
            <span className="relative flex items-center gap-2">
              <span className="text-lg md:text-xl font-light">+</span>
              <span className="hidden xs:inline">Add Record</span>
              <span className="xs:hidden">Add</span>
            </span>
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div>
            <p className="mt-4 font-bold text-gray-400 text-xs uppercase tracking-widest text-center px-4">Syncing secure data...</p>
          </div>
        ) : (
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8 animate-fadeIn">
            <TaxNotificationBanner region={userData.region} />
            <StatCards transactions={transactions} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-8 order-1">
                {/* Cash Flow Chart */}
                <div className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden h-[350px] md:h-[400px] w-full">
                  <Charts transactions={transactions} />
                </div>

                {/* Expense Breakdown Pie Chart ← NEW */}
                <ExpenseBreakdown transactions={transactions} loading={loading} />

                {/* Recent Transactions */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <TransactionList transactions={transactions} />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-8 order-2">
                <TaxEstimator transactions={transactions} userProfile={userData} />
                <BudgetProgress transactions={transactions} userBudgets={budgets} />
              </div>
            </div>
          </div>
        )}
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        userBudgets={budgets}
      />

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Dashboard;