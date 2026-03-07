import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "../utils/financeHelpers";

const Charts = ({ transactions = [], loading }) => {
  
  // Logic to process transactions for the last 6 months
  const processData = () => {
    const last6Months = [];
    const now = new Date();

    // Fix: Using 1st of the month to avoid date overflow issues
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const monthlyData = {};
    last6Months.forEach(month => {
      monthlyData[month] = { name: month, income: 0, expense: 0 };
    });

    transactions.forEach(t => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (monthlyData[month]) {
        if (t.type === 'income') monthlyData[month].income += Number(t.amount);
        else if (t.type === 'expense') monthlyData[month].expense += Number(t.amount);
      }
    });

    return last6Months.map(month => monthlyData[month]);
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="p-8 w-full animate-pulse flex flex-col justify-center h-full">
        <div className="h-4 w-24 bg-gray-100 rounded-full mb-4"></div>
        <div className="flex-1 w-full bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 flex items-center justify-center">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analysing Trends...</span>
        </div>
      </div>
    );
  }

  const chartData = processData();

  return (
    <div className="p-6 md:p-8 h-full w-full flex flex-col bg-white">
      
      {/* PDF Inspired Header: Extra Bold & Minimal */}
      <div className="flex justify-between items-end mb-8 px-1">
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Financial Trends</h4>
          <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none">Cash Flow Analysis</h3>
        </div>
        
        {/* Custom Legend to match PDF Black & White + Emerald Theme */}
        <div className="hidden sm:flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Expenses</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 w-full min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <defs>
              {/* Premium Gradient for Income Area */}
              <linearGradient id="premiumIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
              </linearGradient>
            </defs>

            {/* Subtle Grid Lines */}
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />

            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} 
              dy={15}
              padding={{ left: 10, right: 0 }} 
              interval={0}
            />

            {/* YAxis hidden but active for scaling logic */}
            <YAxis hide domain={['auto', 'auto']} />

            <Tooltip 
              cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(8px)'
              }}
              itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
              formatter={(value) => [formatCurrency(value), null]}
            />

            {/* Income: Bold Emerald Area Chart */}
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#premiumIncome)" 
              animationDuration={1500}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
            />

            {/* Expenses: Black Dashed Line (PDF Theme) */}
            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              fill="transparent"
              strokeDasharray="6 6"
              animationDuration={2000}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#f43f5e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;