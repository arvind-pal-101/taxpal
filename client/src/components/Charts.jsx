import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from "../utils/financeHelpers";

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const income  = payload.find(p => p.dataKey === 'income')?.value  || 0;
  const expense = payload.find(p => p.dataKey === 'expense')?.value || 0;
  const net     = income - expense;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4 min-w-[170px]">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
        {payload[0]?.payload?.tooltip || label}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between gap-6 items-center">
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> Income
          </span>
          <span className="text-[12px] font-black text-gray-900">{formatCurrency(income)}</span>
        </div>
        <div className="flex justify-between gap-6 items-center">
          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-rose-400 rounded-full inline-block" /> Expense
          </span>
          <span className="text-[12px] font-black text-gray-900">{formatCurrency(expense)}</span>
        </div>
        <div className="h-px bg-gray-100 my-1" />
        <div className="flex justify-between gap-6 items-center">
          <span className="text-[11px] font-bold text-violet-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-violet-500 rounded-full inline-block" /> Net
          </span>
          <span className={`text-[12px] font-black ${net >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </span>
        </div>
      </div>
    </div>
  );
};

const Charts = ({ transactions = [], loading }) => {

  const processData = () => {
    const now = new Date();
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const mon = d.toLocaleString('default', { month: 'short' });
      const yr  = d.getFullYear();
      return { key: `${mon}-${yr}`, label: mon, tooltip: `${mon} ${yr}` };
    });
    const monthlyData = {};
    slots.forEach(s => { monthlyData[s.key] = { name: s.label, tooltip: s.tooltip, income: 0, expense: 0 }; });
    transactions.forEach(t => {
      const td  = new Date(t.date);
      const key = `${td.toLocaleString('default', { month: 'short' })}-${td.getFullYear()}`;
      if (monthlyData[key]) {
        if (t.type === 'income') monthlyData[key].income  += Number(t.amount);
        else                     monthlyData[key].expense += Number(t.amount);
      }
    });
    return slots.map(s => ({
      ...monthlyData[s.key],
      savings: monthlyData[s.key].income - monthlyData[s.key].expense,
    }));
  };

  if (loading) {
    return (
      <div className="p-8 w-full animate-pulse flex flex-col justify-center" style={{ minHeight: 420 }}>
        <div className="h-4 w-24 bg-gray-100 rounded-full mb-4" />
        <div className="flex-1 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analysing Trends...</span>
        </div>
      </div>
    );
  }

  const chartData    = processData();
  const totalIncome  = chartData.reduce((s, d) => s + d.income,  0);
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);
  const netSavings   = totalIncome - totalExpense;

  return (
    <div className="p-5 md:p-8 w-full flex flex-col bg-white">

      {/* Header */}
      <div className="flex justify-between items-start mb-5 px-1">
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Financial Trends</h4>
          <h3 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight leading-none">Cash Flow Analysis</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
            {chartData[0]?.tooltip} – {chartData[chartData.length - 1]?.tooltip}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${netSavings >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
          {netSavings >= 0 ? '▲' : '▼'} Net {formatCurrency(Math.abs(netSavings))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mb-4 px-1">
        {[
          { color: 'bg-emerald-400', label: 'Income'  },
          { color: 'bg-rose-400',    label: 'Expense' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>

            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#fb7185" stopOpacity={0.20} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name" axisLine={false} tickLine={false}
              tick={{ fontSize: 9, fontWeight: '900', fill: '#94a3b8' }}
              dy={12} interval={0}
            />
            <YAxis hide domain={[0, dataMax => Math.ceil(dataMax * 1.18)]} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />

            {/* Income — rendered first (below expense) */}
            <Area
              type="monotone" dataKey="income"
              stroke="#10b981" strokeWidth={2.5}
              fill="url(#incomeGrad)"
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: '#059669' }}
              animationDuration={1600} animationEasing="ease-out"
            />

            {/* Expense — rendered on top */}
            <Area
              type="monotone" dataKey="expense"
              stroke="#fb7185" strokeWidth={2.5}
              fill="url(#expenseGrad)"
              dot={{ r: 4, fill: '#fb7185', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: '#e11d48' }}
              animationDuration={1600} animationEasing="ease-out" animationBegin={200}
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Income</p>
          <p className="text-[13px] font-black text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="text-center border-x border-gray-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Expense</p>
          <p className="text-[13px] font-black text-rose-500">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Saved</p>
          <p className={`text-[13px] font-black ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {netSavings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netSavings))}
          </p>
        </div>
      </div>

      <p className="text-center text-[9px] text-gray-300 font-bold mt-2 md:hidden">
        Tap to see month details
      </p>
    </div>
  );
};

export default Charts;