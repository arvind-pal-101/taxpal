import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";

// Pages
import Landing        from "./pages/Landing";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Dashboard      from "./pages/Dashboard";
import Settings       from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import Reports        from "./pages/Reports";
import TaxEstimatorPage from "./pages/TaxEstimatorPage";
import API_URL from "./api";

// Extra Pages
import BudgetPage from "./pages/BudgetPage";

// Components
import TransactionsPage   from "./components/TransactionsPage";
import TransactionModal   from "./components/TransactionModal";
import TaxCalendar        from "./components/TaxCalendar";

const TRANSACTIONS_URL = `${API_URL}/api/transactions`;
const BUDGET_URL = `${API_URL}/api/budgets`;

function App() {
  const [transactions,       setTransactions]       = useState([]);
  const [budgets,            setBudgets]            = useState([]);
  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // ✅ FIX 1: token ko useState se lo, localStorage se nahi
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // ✅ FIX 2: Login ke baad token update karne ka function
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // ✅ FIX 3: Logout karne par state bhi clear ho
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setToken(null);
    setTransactions([]);
    setBudgets([]);
  };

  // Fetch transactions — token change hote hi turant chalega
  useEffect(() => {
    if (!token) {
      setTransactions([]);
      return;
    }
    axios.get(`${TRANSACTIONS_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTransactions(res.data))
      .catch(err => console.error("Fetch transactions error:", err));
  }, [token]);

  // Fetch budgets — token change hote hi turant chalega
  useEffect(() => {
    if (!token) {
      setBudgets([]);
      return;
    }
    axios.get(`${BUDGET_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBudgets(res.data))
      .catch(err => console.error("Fetch budgets error:", err));
  }, [token]);

  // Save / Update transaction
  const handleSaveTransaction = async (data, calledFromPage = false) => {
    try {
      const transactionId = data._id;
      if (transactionId) {
        const res = await axios.put(
          `${TRANSACTIONS_URL}/update/${transactionId}`, data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTransactions(prev => prev.map(t => t._id === transactionId ? res.data : t));
      } else {
        const res = await axios.post(
          `${TRANSACTIONS_URL}/add`, data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTransactions(prev => [res.data, ...prev]);
      }
      if (!calledFromPage) closeModal();
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error saving to database.");
    }
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${TRANSACTIONS_URL}/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Delete failed");
    }
  };

  const openAddModal      = () => { setEditingTransaction(null); setIsModalOpen(true); };
  const closeModal        = () => { setIsModalOpen(false); setEditingTransaction(null); };
  const handleEditTrigger = (t) => { setEditingTransaction(t); setIsModalOpen(true); };

  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<Landing />} />
          {/* ✅ FIX 4: onLoginSuccess prop pass karo Login ko */}
          <Route path="/login"           element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* App */}
          <Route path="/dashboard" element={
            <Dashboard
              transactions={transactions}
              budgets={budgets}
              onSaveTransaction={(data) => handleSaveTransaction(data, false)}
              onLogout={handleLogout}
            />
          } />

          <Route path="/transactions" element={
            <TransactionsPage
              transactions={transactions}
              budgets={budgets}
              onDelete={handleDelete}
              onSaveTransaction={(data) => handleSaveTransaction(data, true)}
              onLogout={handleLogout}
            />
          } />

          <Route path="/tax-estimator" element={<TaxEstimatorPage transactions={transactions} onLogout={handleLogout} />} />
          <Route path="/reports" element={<Reports transactions={transactions} budgets={budgets} onOpenModal={openAddModal} onLogout={handleLogout} />} />
          <Route path="/settings"  element={<Settings onLogout={handleLogout} />} />
          <Route path="/calendar"  element={<TaxCalendar transactions={transactions} onLogout={handleLogout} />} />
          <Route path="/budget" element={
            <BudgetPage
              transactions={transactions}
              budgets={budgets}
              setBudgets={setBudgets}
              onLogout={handleLogout}
            />
          } />
        </Routes>

        {/* Global modal */}
        <TransactionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
          userBudgets={budgets}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;