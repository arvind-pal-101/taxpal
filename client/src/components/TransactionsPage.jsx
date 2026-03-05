import React, { useState } from 'react';
import { formatCurrency } from '../utils/financeHelpers';
import TransactionModal from "../components/TransactionModal";
import Sidebar from "../components/Sidebar";

// Arrow Up icon — income
const ArrowUp = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);

// Arrow Down icon — expense
const ArrowDown = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

// Formatted currency with thin space between ₹ and digits
const Rupee = ({ amount, className = "" }) => (
  <span className={className}>
    ₹&thinsp;{Number(amount).toLocaleString('en-IN')}
  </span>
);

const FILTERS = [
  {
    id: 'all',
    label: 'All',
    base:    'text-slate-500',
    active:  'bg-white text-slate-900 shadow-sm',
    hover:   'hover:bg-slate-50 hover:text-slate-700',
    inactive: 'text-slate-400',
  },
  {
    id: 'income',
    label: 'Income',
    base:    'text-emerald-600',
    active:  'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100',
    hover:   'hover:bg-emerald-50 hover:text-emerald-600',
    inactive: 'text-slate-400',
  },
  {
    id: 'expense',
    label: 'Expenses',
    base:    'text-rose-600',
    active:  'bg-rose-50 text-rose-700 shadow-sm border border-rose-100',
    hover:   'hover:bg-rose-50 hover:text-rose-600',
    inactive: 'text-slate-400',
  },
];

const TransactionsPage = ({ transactions = [], onDelete, onSaveTransaction, budgets = [] }) => {
  const [sidebarOpen,        setSidebarOpen]        = useState(false);
  const [searchTerm,         setSearchTerm]         = useState("");
  const [activeFilter,       setActiveFilter]       = useState("all");
  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const income   = transactions.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;

  const filteredData = transactions.filter(t => {
    const matchesSearch =
      (t.desc     || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeFilter === 'all' || t.type === activeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex h-screen bg-[#F9FBFA] overflow-hidden font-sans">

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} userStatus={{ plan: 'pro' }} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto min-w-0">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 flex-shrink-0">
              ☰
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                <span className="text-emerald-600 text-[9px] font-black uppercase tracking-[0.3em]">History</span>
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">All Transactions</h1>
            </div>
          </div>
          <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
            className="flex-shrink-0 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95">
            + Add New
          </button>
        </header>

        <div className="px-4 lg:px-8 py-6 max-w-[1200px] mx-auto space-y-5">

          {/* ── Stats ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Balance */}
            <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm relative overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-default">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-400 opacity-20 group-hover:opacity-100 group-hover:w-2.5 transition-all duration-300"/>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Total Balance</p>
              <h3 className={`text-2xl font-black tracking-tighter ${balance >= 0 ? 'text-slate-900 group-hover:text-indigo-700' : 'text-rose-600'} transition-colors duration-200`}>
                <Rupee amount={balance} />
              </h3>
            </div>

            {/* Income */}
            <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group transition-all hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-0.5 cursor-default">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-400 opacity-20 group-hover:opacity-100 group-hover:w-2.5 transition-all duration-300"/>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Income</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tighter flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                  <ArrowUp />
                </span>
                <Rupee amount={income} />
              </h3>
            </div>

            {/* Expenses */}
            <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden group transition-all hover:shadow-lg hover:shadow-rose-100 hover:-translate-y-0.5 cursor-default">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-400 opacity-10 group-hover:opacity-100 group-hover:w-2.5 transition-all duration-300"/>
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Total Expenses</p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tighter flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-200">
                  <ArrowDown />
                </span>
                <Rupee amount={expenses} />
              </h3>
            </div>

          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">

            {/* Search */}
            <div className="relative w-full lg:max-w-sm group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input type="text" placeholder="Search transactions..."
                className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-semibold text-sm transition-all shadow-sm placeholder:text-slate-300 text-slate-800"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Filter Pills */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-full lg:w-auto gap-0.5">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center gap-1.5 flex-1 px-3 sm:px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200
                    ${activeFilter === f.id ? f.active : `${f.inactive} ${f.hover}`}`}>
                  {f.id === 'income'  && <ArrowUp />}
                  {f.id === 'expense' && <ArrowDown />}
                  {f.label}
                </button>
              ))}
            </div>

          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[680px]">
                <thead>
                  <tr className="bg-slate-50/70">
                    <th className="px-7 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Description</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Category</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Date</th>
                    <th className="px-7 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                    <th className="px-7 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? filteredData.map(t => (
                    <tr key={t._id}
                      className={`group border-b border-slate-50 last:border-0 transition-all duration-150
                        ${t.type === 'income'
                          ? 'hover:bg-emerald-50/50'
                          : 'hover:bg-rose-50/40'}`}>

                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2.5">
                          {/* Type icon badge */}
                          <span className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-xl
                            ${t.type === 'income'
                              ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
                              : 'bg-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'}
                            transition-all duration-200`}>
                            {t.type === 'income' ? <ArrowUp /> : <ArrowDown />}
                          </span>
                          <p className="font-bold text-slate-600 text-sm group-hover:text-slate-900 transition-colors">{t.desc}</p>
                        </div>
                      </td>

                      <td className="px-7 py-4 text-center">
                        <span className={`inline-block text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-all duration-150
                          ${t.type === 'income'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100 group-hover:border-emerald-200'
                            : 'bg-rose-50 border-rose-100 text-rose-600 group-hover:bg-rose-100 group-hover:border-rose-200'}`}>
                          {t.category}
                        </span>
                      </td>

                      <td className="px-7 py-4 text-center text-slate-400 font-medium text-[11px] group-hover:text-slate-600 transition-colors">
                        {t.date}
                      </td>

                      <td className="px-7 py-4">
                        <p className={`font-black text-sm tracking-tight flex items-center gap-1
                          ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? <ArrowUp /> : <ArrowDown />}
                          <Rupee amount={t.amount} />
                        </p>
                      </td>

                      <td className="px-7 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }}
                            className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.25 2.25 0 113.182 3.182L12 18.364l-4.243 1.414 1.414-4.243L17.586 3.586z"/>
                            </svg>
                          </button>
                          <button onClick={() => onDelete(t._id)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-25">
                          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                          </svg>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        initialData={editingTransaction}
        onSave={(data) => {
          onSaveTransaction(editingTransaction ? { ...data, _id: editingTransaction._id } : data);
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        userBudgets={budgets}
      />
    </div>
  );
};

export default TransactionsPage;