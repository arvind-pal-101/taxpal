import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/financeHelpers';
import { calculateTaxByRegion } from '../utils/taxCalculations';

const Documents = ({ transactions = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const netSavings   = totalIncome - totalExpense;
  const estTax       = calculateTaxByRegion ? calculateTaxByRegion(totalIncome, "India (New)") : totalIncome * 0.15;
  const inHand       = totalIncome - estTax;

  // Group by category
  const byCategory = transactions.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { income: 0, expense: 0, count: 0 };
    acc[t.category][t.type] += t.amount;
    acc[t.category].count++;
    return acc;
  }, {});

  // Group by month
  const byMonth = transactions.reduce((acc, t) => {
    const month = t.date?.slice(0, 7) || 'Unknown';
    if (!acc[month]) acc[month] = { income: 0, expense: 0 };
    acc[month][t.type] += t.amount;
    return acc;
  }, {});

  const handleExportCSV = () => {
    const header = "Date,Description,Category,Type,Amount\n";
    const rows = transactions.map(t => `${t.date},"${t.desc}",${t.category},${t.type},${t.amount}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taxpal_report.csv';
    a.click();
  };

  const TABS = [
    { id: "summary",  label: "Summary",   icon: "📊" },
    { id: "category", label: "By Category",icon: "🗂️" },
    { id: "monthly",  label: "Monthly",   icon: "📅" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan: "pro" }} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Documents</h2>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-tight hover:bg-emerald-600 transition-all shadow-md active:scale-95"
          >
            ↓ Export CSV
          </button>
        </header>

        <div className="p-4 lg:p-8 max-w-[1000px] mx-auto space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Income", value: formatCurrency ? formatCurrency(totalIncome) : `₹${totalIncome}`, color: "text-emerald-600" },
              { label: "Total Expenses", value: formatCurrency ? formatCurrency(totalExpense) : `₹${totalExpense}`, color: "text-rose-500" },
              { label: "Net Savings", value: formatCurrency ? formatCurrency(netSavings) : `₹${netSavings}`, color: netSavings >= 0 ? "text-gray-900" : "text-rose-500" },
              { label: "Est. Tax Liability", value: formatCurrency ? formatCurrency(estTax) : `₹${estTax}`, color: "text-amber-600" },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</p>
                <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs Container */}
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-50 p-2 gap-1 bg-gray-50/30">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${activeTab === tab.id ? 'bg-gray-950 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "summary" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">Income vs Expense</h4>
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: totalIncome > 0 ? `${Math.min((totalIncome / (totalIncome + totalExpense)) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-black text-emerald-600">Income {formatCurrency ? formatCurrency(totalIncome) : totalIncome}</span>
                      <span className="text-[10px] font-black text-rose-500">Expense {formatCurrency ? formatCurrency(totalExpense) : totalExpense}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "category" && (
                <div className="space-y-3">
                  {Object.entries(byCategory).length === 0 ? (
                    <p className="text-center text-gray-300 text-sm font-black py-8">No transaction data yet</p>
                  ) : Object.entries(byCategory).map(([cat, data]) => (
                    <div key={cat} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                      <div>
                        <p className="text-sm font-black text-gray-900">{cat}</p>
                        <p className="text-[9px] font-bold text-gray-400">{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        {data.income > 0 && <p className="text-xs font-black text-emerald-600">+{formatCurrency ? formatCurrency(data.income) : data.income}</p>}
                        {data.expense > 0 && <p className="text-xs font-black text-rose-500">-{formatCurrency ? formatCurrency(data.expense) : data.expense}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "monthly" && (
                <div className="space-y-3">
                  {Object.entries(byMonth).length === 0 ? (
                    <p className="text-center text-gray-300 text-sm font-black py-8">No data</p>
                  ) : Object.entries(byMonth).map(([month, data]) => (
                    <div key={month} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                      <p className="text-sm font-black text-gray-900">{month}</p>
                      <p className="text-xs font-black text-emerald-600">Net: {formatCurrency ? formatCurrency(data.income - data.expense) : (data.income - data.expense)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
            TaxPal Secure Ledger • {transactions.length} Records
          </p>
        </div>
      </main>
    </div>
  );
};

export default Documents;