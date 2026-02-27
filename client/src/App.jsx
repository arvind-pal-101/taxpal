import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

// Pages Imports
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Components Imports
import TransactionsPage from "./components/TransactionsPage";
import TransactionModal from "./components/TransactionModal";
import Documents from './components/Documents';
import TaxCalendar from "./components/TaxCalendar";

function App() {
  // States
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const API_URL = "http://localhost:5000/api/transactions";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchTransactions();
  }, [token]);

 const handleSaveTransaction = async (data) => {
  try {
    
    const transactionId = data._id || editingTransaction?._id;

    if (transactionId) {
      // 1. UPDATE LOGIC
      const res = await axios.put(`${API_URL}/update/${transactionId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTransactions(prev => prev.map(t => t._id === transactionId ? res.data : t));
      console.log("Updated successfully!");
    } else {
      // 2. ADD LOGIC
      const res = await axios.post(`${API_URL}/add`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(prev => [res.data, ...prev]);
      console.log("Added successfully!");
    }
    closeModal();
  } catch (err) {
    console.error("Save Error:", err);
    alert("Error saving to database.");
  }
};

  // 3. Delete Logic
  const handleDelete = async (id) => {
  // Check karein ki 'id' aa rahi hai ya nahi
  if (!id) {
    console.error("ID is undefined!");
    return;
  }

  if (window.confirm("Are you sure?")) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
   
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Delete failed");
    }
  }
};

  // Modal Helpers
  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleEditTrigger = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={
            <Dashboard 
              transactions={transactions} 
              onSaveTransaction={handleSaveTransaction} 
            />
          } />

          {/* Transactions Management */}
          <Route path="/transactions" element={
            <TransactionsPage 
              transactions={transactions} 
              onDelete={handleDelete} 
              onEdit={handleEditTrigger} 
              onOpenModal={openAddModal}
              onSaveTransaction={handleSaveTransaction}
            />
          } />

          {/* Other Features */}
          <Route path="/documents" element={
            <Documents 
              transactions={transactions} 
              onOpenModal={openAddModal} 
            />
          } />
          <Route path="/settings" element={<Settings />} />
          <Route path="/calendar" element={<TaxCalendar />} />
        </Routes>

        {/* Global Modal for Add/Edit */}
        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          onSave={handleSaveTransaction} 
          initialData={editingTransaction} 
        />
      </BrowserRouter>
    </div>
  );
}

export default App;