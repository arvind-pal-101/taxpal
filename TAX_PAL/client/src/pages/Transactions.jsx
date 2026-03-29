import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TransactionModal from '../components/TransactionModal';
import { formatCurrency } from '../utils/financeHelpers';

const API = "http://localhost:5000";

const CATEGORY_MAP = {
  "Freelance":    { icon: "💻", bg: "bg-blue-50",    text: "text-blue-600" },
  "Rent & Bills": { icon: "🏠", bg: "bg-orange-50",  text: "text-orange-600" },
  "Food":         { icon: "🍔", bg: "bg-rose-50",    text: "text-rose-600" },
  "Shopping":     { icon: "🛍️", bg: "bg-purple-50",  text: "text-purple-600" },
  "Salary":       { icon: "💰", bg: "bg-emerald-50", text: "text-emerald-600" },
  "Investment":   { icon: "📈", bg: "bg-green-50",   text: "text-green-600" },
  "Transport":    { icon: "🚗", bg: "bg-sky-50",     text: "text-sky-600" },
  "Entertainment":{ icon: "🎬", bg: "bg-pink-50",    text: "text-pink-600" },
  "Gift":         { icon: "🎁", bg: "bg-yellow-50",  text: "text-yellow-600" },
};

const getCategoryDetails = (category, type) =>
  CATEGORY_MAP[category] || {
    icon: type === 'income' ? '💰' : '💸',
    bg: type === 'income' ? 'bg-emerald-50' : 'bg-gray-50',
    text: type === 'income' ? 'text-emerald-600' : 'text-gray-600',
  };

const Transactions = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [budgets, setBudgets] = useState([]);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/transactions`, getAuthHeader());
      setTransactions(res.data);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    setBudgets(JSON.parse(localStorage.getItem("user_budgets") || "[]"));
    fetchTransactions();
  }, [navigate, fetchTransactions]);

  const handleSave = async (entry) => {
    await axios.post(`${API}/api/transactions`, entry, getAuthHeader());
    await fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await axios.delete(`${API}/api/transactions/${id}`, getAuthHeader());
    setTransactions(prev => prev.filter(t => t._id !== id));
  };

  const filtered = transactions.filter(t => {
    const matchSearch = t.desc.toLowerCase().includes(search.toLowerCase()) ||
                        t.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.type === filter;
    return matchSearch && matchFilter;
  });

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const net = totalIncome - totalExpense;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan: "pro" }} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Transactions</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-tight hover:bg-emerald-600 hover:-translate-y-0.5 transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            + Add Record
          </button>
        </header>

        <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-4 w-full">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-50 shadow-sm flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Income</p>
              <p className="text-lg sm:text-2xl font-black text-emerald-600 truncate">+{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-50 shadow-sm flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-black text-rose-500 truncate">-{formatCurrency(totalExpense)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-50 shadow-sm flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Savings</p>
              <p className={`text-lg sm:text-2xl font-black truncate ${net >= 0 ? 'text-gray-900' : 'text-rose-500'}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm flex flex-col gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by description or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl outline-none border-2 border-transparent focus:border-emerald-200 transition-all text-sm font-bold text-gray-700 placeholder:text-gray-300"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'income', 'expense'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${filter === f ? 'bg-gray-950 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex gap-4 items-center animate-pulse">
                    <div className="w-11 h-11 bg-gray-100 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-gray-100 rounded" />
                      <div className="h-2 w-1/5 bg-gray-50 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4 opacity-20">📁</span>
                <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">
                  {search || filter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
                </p>
                {!search && filter === 'all' && (
                  <button onClick={() => setIsModalOpen(true)} className="mt-4 text-xs font-black text-emerald-600 hover:underline">
                    + Add your first transaction
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {/* Table Header — desktop only */}
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-6 py-3 bg-gray-50/60">
                  {['Description', 'Category', 'Date', 'Type', 'Amount'].map(h => (
                    <span key={h} className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{h}</span>
                  ))}
                </div>

                {/* Rows */}
                {filtered.map((t, idx) => {
                  const details = getCategoryDetails(t.category, t.type);
                  return (
                    <div
                      key={t._id || idx}
                      className="flex sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-all group gap-3"
                    >
                      {/* Icon + Description */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-lg shadow-sm ${details.bg}`}>
                          {details.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 leading-tight truncate group-hover:text-emerald-700 transition-colors">{t.desc}</p>
                          <p className="text-[9px] text-gray-400 font-bold truncate">{t.date} • {t.category}</p>
                        </div>
                      </div>

                      {/* Category (desktop) */}
                      <div className="hidden sm:block">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-tight ${details.bg} ${details.text}`}>
                          {t.category}
                        </span>
                      </div>

                      {/* Date (desktop) */}
                      <div className="hidden sm:block">
                        <p className="text-xs font-bold text-gray-400">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>

                      {/* Type Badge (desktop) */}
                      <div className="hidden sm:block">
                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider
                          ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type}
                        </span>
                      </div>

                      {/* Amount + Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <p className={`text-sm font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs shrink-0"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Showing {filtered.length} of {transactions.length} transactions
            </p>
          )}
        </div>
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        userBudgets={budgets}
      />
    </div>
  );
};

export default Transactions;