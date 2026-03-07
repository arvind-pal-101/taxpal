import React, { useState } from 'react';
import { formatCurrency } from '../utils/financeHelpers';
import TransactionModal from "../components/TransactionModal";

const TransactionsPage = ({ transactions = [], onDelete, onSaveTransaction, budgets = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Stats Logic
  const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expenses;

  // Filter Logic
  const filteredData = transactions.filter(t => {
    const desc = t.desc || "";
    const category = t.category || "";
    const matchesSearch = desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeFilter === 'all' || t.type === activeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto space-y-10 animate-fadeIn font-sans bg-[#F9FBFA]">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h4 className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em]">History</h4>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">All Transactions</h1>
        </div>
        
        <button 
          onClick={() => { 
            setEditingTransaction(null); 
            setIsModalOpen(true); 
          }}
          className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest 
                    hover:bg-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-200 
                    active:scale-95 flex items-center justify-center gap-2"
        >
          <span>+ Add New</span>
        </button>
      </div>

      {/* 2. STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[2rem] border border-indigo-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 opacity-20 transition-all duration-300 group-hover:opacity-100 group-hover:w-3"></div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Total Balance</p>
          <h3 className={`text-2xl font-black tracking-tighter ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(balance)}
          </h3>
        </div>

        <div className="bg-white p-7 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500 opacity-20 transition-all duration-300 group-hover:opacity-100 group-hover:w-3"></div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Total Income</p>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tighter">+ {formatCurrency(income)}</h3>
        </div>

        <div className="bg-white p-7 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 opacity-10 transition-all duration-300 group-hover:opacity-100 group-hover:w-3"></div>
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Total Expenses</p>
          <h3 className="text-2xl font-black text-rose-600 tracking-tighter">- {formatCurrency(expenses)}</h3>
        </div>
      </div>

      {/* 3. FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md group">
  {/* --- Search Icon --- */}
  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
    <svg 
      className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>

  {/* --- Input Field --- */}
  <input 
    type="text" 
    placeholder="Search by name or category..." 
    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-bold text-sm transition-all shadow-sm placeholder:text-slate-400 text-slate-900"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>

        <div className="flex p-1 bg-slate-100 rounded-xl w-full lg:w-auto">
          {['all', 'income', 'expense'].map((f) => (
            <button 
              key={f} 
              onClick={() => setActiveFilter(f)} 
              className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f === 'expense' ? 'Expenses' : f}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Description</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Category</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? (
                filteredData.map((t) => (
                  <tr key={t._id} className="group hover:bg-slate-50/80 transition-colors"> 
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-600 text-sm group-hover:text-slate-900">{t.desc}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block text-[9px] font-bold uppercase px-3 py-1.5 rounded-md border ${t.type === 'income' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center text-slate-400 font-medium text-[11px] group-hover:text-slate-900">{t.date}</td>
                    <td className="px-8 py-6">
                      <p className={`font-black text-sm tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {/* STATIC ICONS */}
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }} 
                          className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.25 2.25 0 113.182 3.182L12 18.364l-4.243 1.414 1.414-4.243L17.586 3.586z"/>
                          </svg>
                        </button>
                        <button 
                          onClick={() => onDelete(t._id)} 
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-24 text-center text-slate-300 font-bold text-sm italic">No records to display</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} 
        initialData={editingTransaction}
        onSave={(data) => {
          // MongoDB Sync: preserve _id for updates
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