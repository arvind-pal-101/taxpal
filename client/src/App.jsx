import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import BASE_URL from "./config";

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
import OAuthCallback  from "./pages/OAuthCallback";

// Extra Pages
import BudgetPage from "./pages/BudgetPage";

// Components
import TransactionsPage   from "./components/TransactionsPage";
import TransactionModal   from "./components/TransactionModal";
import TaxCalendar        from "./components/TaxCalendar";

const API_URL    = `${BASE_URL}/api/transactions`;
const BUDGET_URL = `${BASE_URL}/api/budgets`;

function App() {
  const [transactions,       setTransactions]       = useState([]);
  const [budgets,            setBudgets]            = useState([]);
  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTransactions([]);
    setBudgets([]);
  };

  // Fetch transactions
  useEffect(() => {
    if (!token) { setTransactions([]); return; }
    axios.get(`${API_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTransactions(res.data))
      .catch(err => console.error("Fetch transactions error:", err));
  }, [token]);

  // Fetch budgets
  useEffect(() => {
    if (!token) { setBudgets([]); return; }
    axios.get(`${BUDGET_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBudgets(res.data))
      .catch(err => console.error("Fetch budgets error:", err));
  }, [token]);

  const handleSaveTransaction = async (data, calledFromPage = false) => {
    try {
      const transactionId = data._id;
      if (transactionId) {
        const res = await axios.put(
          `${API_URL}/update/${transactionId}`, data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTransactions(prev => prev.map(t => t._id === transactionId ? res.data : t));
      } else {
        const res = await axios.post(
          `${API_URL}/add`, data,
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

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_URL}/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
          <Route path="/"                element={<Landing />} />
          <Route path="/login"           element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/oauth-callback"  element={<OAuthCallback onLoginSuccess={handleLoginSuccess} />} />

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
          <Route path="/reports"       element={<Reports transactions={transactions} budgets={budgets} onOpenModal={openAddModal} onLogout={handleLogout} />} />
          <Route path="/settings"      element={<Settings onLogout={handleLogout} />} />
          <Route path="/calendar"      element={<TaxCalendar transactions={transactions} onLogout={handleLogout} />} />
          <Route path="/budget"        element={
            <BudgetPage
              transactions={transactions}
              budgets={budgets}
              setBudgets={setBudgets}
              onLogout={handleLogout}
            />
          } />
        </Routes>

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