import React, { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatCurrency } from "../utils/financeHelpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const income  = payload.find(p => p.dataKey === 'income')?.value  || 0;
  const expense = payload.find(p => p.dataKey === 'expense')?.value || 0;
  const net     = income - expense;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4 min-w-[160px]">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{payload[0]?.payload?.tooltip || label}</p>
      <div className="space-y-2">
        <div className="flex justify-between gap-6 items-center">
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" /> Income
          </span>
          <span className="text-[12px] font-black text-gray-900">{formatCurrency(income)}</span>
        </div>
        <div className="flex justify-between gap-6 items-center">
          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-rose-500 rounded-full inline-block" /> Expense
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

const BarLabel = ({ x, y, width, value }) => {
  if (!value || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={8} fontWeight="900" fill="#94a3b8">
      {value >= 100000 ? `${(value / 100000).toFixed(1)}L`
        : value >= 1000 ? `${(value / 1000).toFixed(0)}k`
        : value}
    </text>
  );
};

const Charts = ({ transactions = [], loading }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const processData = () => {
    const now = new Date();
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const mon = d.toLocaleString('default', { month: 'short' });
      const yr  = d.getFullYear();
      return {
        key:      `${mon}-${yr}`,
        label:    mon,                        // XAxis — short (Oct, Nov…)
        tooltip:  `${mon} ${yr}`,             // Tooltip — "Jan 2025"
      };
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
      savings: monthlyData[s.key].income - monthlyData[s.key].expense
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
    // ── FIX: removed h-full, added explicit padding+min-height so ResponsiveContainer gets a real height
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
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${netSavings >= 0 ? 'bg-violet-50 text-violet-600' : 'bg-rose-50 text-rose-600'}`}>
          {netSavings >= 0 ? '▲' : '▼'} Net {formatCurrency(Math.abs(netSavings))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 px-1">
        {[
          { color: 'bg-emerald-500', label: 'Income'      },
          { color: 'bg-rose-400',    label: 'Expense'     },
          { color: 'bg-violet-500',  label: 'Net Savings' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Chart — explicit height, NOT flex-1/h-full */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
            barCategoryGap="25%"
            barGap={4}
            onClick={(e) => {
              if (e?.activeTooltipIndex !== undefined) setActiveIndex(e.activeTooltipIndex);
            }}
          >
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fontSize: 9, fontWeight: '900', fill: '#94a3b8' }} dy={12} interval={0} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241,245,249,0.6)', radius: 8 }} />

            <Bar dataKey="income" radius={[6, 6, 0, 0]} maxBarSize={40} label={<BarLabel />} cursor="pointer">
              {chartData.map((_, i) => (
                <Cell key={i}
                  fill={activeIndex === i ? '#059669' : '#10b981'}
                  fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.5}
                />
              ))}
            </Bar>

            <Bar dataKey="expense" radius={[6, 6, 0, 0]} maxBarSize={40} label={<BarLabel />} cursor="pointer">
              {chartData.map((_, i) => (
                <Cell key={i}
                  fill={activeIndex === i ? '#e11d48' : '#fb7185'}
                  fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.5}
                />
              ))}
            </Bar>

            <Line type="monotone" dataKey="savings" stroke="#8b5cf6" strokeWidth={2.5}
              dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff', fill: '#8b5cf6', cursor: 'pointer' }}
              animationDuration={1800}
            />
          </ComposedChart>
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
          <p className={`text-[13px] font-black ${netSavings >= 0 ? 'text-violet-600' : 'text-rose-500'}`}>
            {formatCurrency(Math.abs(netSavings))}
          </p>
        </div>
      </div>

      <p className="text-center text-[9px] text-gray-300 font-bold mt-2 md:hidden">
        Tap on a bar to see month details
      </p>
    </div>
  );
};

export default Charts;