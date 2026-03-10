    import { useState, useEffect } from "react";
    import { BrowserRouter, Routes, Route } from "react-router-dom";
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

    const API_URL_T = `${API_URL}/api/transactions`;
const BUDGET_URL = `${API_URL}/api/budgets`;

    function App() {
      const [transactions,       setTransactions]       = useState([]);
      const [budgets,            setBudgets]            = useState([]);
      const [isModalOpen,        setIsModalOpen]        = useState(false);
      const [editingTransaction, setEditingTransaction] = useState(null);

      const token = localStorage.getItem("token");

      // Fetch transactions
      useEffect(() => {
        if (!token) return;
        axios.get(`${API_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => setTransactions(res.data))
          .catch(err => console.error("Fetch transactions error:", err));
      }, [token]);

      // Fetch budgets
      useEffect(() => {
        if (!token) return;
        axios.get(`${BUDGET_URL}/all`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => setBudgets(res.data))
          .catch(err => console.error("Fetch budgets error:", err));
      }, [token]);

      // Save / Update transaction
      // calledFromPage=true  → TransactionsPage has its own modal, don't call closeModal()
      // calledFromPage=false → global modal, call closeModal()
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

      // Delete transaction
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
              {/* Public */}
              <Route path="/"                element={<Landing />} />
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              {/* App */}
              <Route path="/dashboard" element={
                <Dashboard
                  transactions={transactions}
                  budgets={budgets}
                  onSaveTransaction={(data) => handleSaveTransaction(data, false)}
                />
              } />

              <Route path="/transactions" element={
                <TransactionsPage
                  transactions={transactions}
                  budgets={budgets}
                  onDelete={handleDelete}
                  onSaveTransaction={(data) => handleSaveTransaction(data, true)}
                />
              } />

              <Route path="/tax-estimator" element={<TaxEstimatorPage transactions={transactions} />} />
              <Route path="/reports" element={<Reports transactions={transactions} budgets={budgets} onOpenModal={openAddModal} />} />
              <Route path="/settings"  element={<Settings />} />
              <Route path="/calendar"  element={<TaxCalendar transactions={transactions} />} />
              <Route path="/budget" element={
                <BudgetPage
                  transactions={transactions}
                  budgets={budgets}
                  setBudgets={setBudgets}
                />
              } />
            </Routes>

            {/* Global modal — for Dashboard / Reports "Add Record" button */}
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