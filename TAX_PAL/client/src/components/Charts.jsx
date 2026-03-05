import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "../utils/financeHelpers";

const Charts = ({ transactions = [], loading }) => {
  
  const processData = () => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
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
        if (t.type === 'income') monthlyData[month].income += t.amount;
        else if (t.type === 'expense') monthlyData[month].expense += t.amount;
      }
    });

    return last6Months.map(month => monthlyData[month]);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 w-full animate-pulse">
        <div className="h-6 w-32 bg-gray-100 rounded mb-8"></div>
        <div className="h-[250px] w-full bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex items-center justify-center">
           <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Analysing Data...</span>
        </div>
      </div>
    );
  }

  const chartData = processData();

  return (
    // Responsive Height
    <div className="p-4 md:p-8 h-full min-h-[350px] w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 md:mb-10">
        <div className="space-y-1">
          <h4 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Cash Flow</h4>
          <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">Last 6 Months Activity</p>
        </div>
        
        {/* Legend Indicators */}
        <div className="flex gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-50/60 px-2.5 md:px-3 py-1.5 rounded-full border border-emerald-100/50">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span className="text-[8px] md:text-[9px] font-black text-emerald-700 uppercase">Income</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-rose-50/60 px-2.5 md:px-3 py-1.5 rounded-full border border-rose-100/50">
            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
            <span className="text-[8px] md:text-[9px] font-black text-rose-700 uppercase">Expense</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] md:h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData}
            margin={{ top: 0, right: 10, left: -20, bottom: 0 }} 
            style={{ outline: 'none' }} 
            tabIndex="-1"
          >
            <defs>
              <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />

            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 9, fontWeight: '800', fill: '#cbd5e1'}} 
              dy={15}
              // Interval logic
              interval={'preserveStartEnd'}
            />

            {/* YAxis hidden but still providing scale */}
            <YAxis hide domain={['auto', 'auto']} />

            <Tooltip 
              cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
              wrapperStyle={{ outline: 'none' }}
              contentStyle={{ 
                borderRadius: '20px', 
                border: 'none', 
                boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(8px)'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
              formatter={(value) => [formatCurrency(value), null]}
            />

            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={window.innerWidth < 768 ? 3 : 4} // Thinner line on mobile
              fillOpacity={1} 
              fill="url(#colorInc)" 
              animationDuration={1200}
              activeDot={{ r: 5, strokeWidth: 0, fill: '#059669' }}
            />

            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="#f43f5e" 
              strokeWidth={window.innerWidth < 768 ? 2 : 3} 
              fill="url(#colorExp)" 
              strokeDasharray="8 5" 
              animationDuration={1500}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#e11d48' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;