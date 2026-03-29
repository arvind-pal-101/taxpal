import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../utils/financeHelpers';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#0ea5e9', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

const CATEGORY_ICONS = {
  "Freelance": "💻", "Rent & Bills": "🏠", "Food": "🍔", "Shopping": "🛍️",
  "Salary": "💰", "Investment": "📈", "Transport": "🚗", "Entertainment": "🎬",
  "Gift": "🎁", "Business Expenses": "💼", "Travel": "✈️", "Utilities": "💡",
};

const ExpenseBreakdown = ({ transactions = [], loading }) => {
  if (loading) return <div className="animate-pulse h-[350px] bg-gray-50 rounded-[2rem]" />;

  // Build pie data from expense transactions grouped by category
  const categoryMap = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const total = Object.values(categoryMap).reduce((a, v) => a + v, 0);

  const data = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
          <p className="text-xs font-black text-gray-900">{CATEGORY_ICONS[item.name] || '💸'} {item.name}</p>
          <p className="text-sm font-black text-rose-500 mt-1">{formatCurrency(item.value)}</p>
          <p className="text-[10px] font-bold text-gray-400">{item.percentage}% of expenses</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="mb-6">
        <h4 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Expense Breakdown</h4>
        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-1">By Category</p>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-3 opacity-20">🥧</span>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No expense data yet</p>
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="h-[220px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-2.5 mt-2">
            {data.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                    {CATEGORY_ICONS[item.name] || '💸'} {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-900">{formatCurrency(item.value)}</span>
                  <span className="text-[10px] font-black text-gray-400 w-8 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
            {data.length > 6 && (
              <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest text-center pt-1">
                +{data.length - 6} more categories
              </p>
            )}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Expenses</span>
            <span className="text-sm font-black text-rose-500">{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseBreakdown;
