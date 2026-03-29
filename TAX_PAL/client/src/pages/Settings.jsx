import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getCountryList } from '../utils/taxCalculations';
import axios from 'axios';

const API = "http://localhost:5000";

const DEFAULT_EXPENSE_CATS = ["Business Expenses","Office Rent","Software Subscriptions","Professional Development","Marketing","Travel","Meals & Entertainment","Utilities","Food","Shopping","Rent & Bills","Transport"];
const DEFAULT_INCOME_CATS  = ["Salary","Freelance","Investment","Gift","Consulting","Other Income"];
const CAT_COLORS = ["bg-rose-400","bg-blue-400","bg-purple-400","bg-green-400","bg-amber-400","bg-pink-400","bg-sky-400","bg-indigo-400","bg-teal-400","bg-orange-400"];

const Settings = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]         = useState("profile");
  const [toast, setToast]                 = useState({ msg: "", type: "" });
  const [loading, setLoading]             = useState(false);

  const [profile, setProfile]       = useState({ name: '', email: '', country: 'India (New)', incomeBracket: '' });
  const [expenseCats, setExpenseCats] = useState([...DEFAULT_EXPENSE_CATS]);
  const [incomeCats,  setIncomeCats]  = useState([...DEFAULT_INCOME_CATS]);
  const [newCat,  setNewCat]          = useState('');
  const [catTab,  setCatTab]          = useState('expense');
  const [editIdx, setEditIdx]         = useState(null);
  const [editVal, setEditVal]         = useState('');
  const [notifs, setNotifs]           = useState({ taxDeadlines: true, monthlyReport: true, budgetAlerts: true, weeklyDigest: false });
  const [passwords, setPasswords]     = useState({ current: '', new: '', confirm: '' });

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // Load profile + notifications from DB on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    axios.get(`${API}/api/auth/profile`, getAuthHeader())
      .then(res => {
        const u = res.data;
        setProfile({
          name:          u.name          || '',
          email:         u.email         || '',
          country:       u.country       || 'India (New)',
          incomeBracket: u.income_bracket ? String(u.income_bracket) : '',
        });
        if (u.notifications) setNotifs(u.notifications);
      }).catch(() => {});

    // Categories still from localStorage (user-customised, not per-account in DB)
    const ec = JSON.parse(localStorage.getItem("taxpal_expense_cats") || "null");
    const ic = JSON.parse(localStorage.getItem("taxpal_income_cats")  || "null");
    if (ec) setExpenseCats(ec);
    if (ic) setIncomeCats(ic);
  }, [navigate]);

  /* ── Profile ── */
  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/api/auth/profile`, {
        name:           profile.name,
        country:        profile.country,
        income_bracket: parseFloat(profile.incomeBracket) || 0,
      }, getAuthHeader());
      window.dispatchEvent(new Event("taxpal_profile_updated"));
      showToast("✓ Profile saved successfully.");
    } catch (err) {
      showToast("✗ " + (err.response?.data?.message || "Failed to save profile."), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Categories (localStorage — user preference) ── */
  const cats    = catTab === 'expense' ? expenseCats : incomeCats;
  const setCats = catTab === 'expense' ? setExpenseCats : setIncomeCats;
  const storageKey = catTab === 'expense' ? "taxpal_expense_cats" : "taxpal_income_cats";

  const saveCats = (updated) => {
    setCats(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };
  const handleAddCat    = () => { if (!newCat.trim()) return; saveCats([...cats, newCat.trim()]); setNewCat(''); showToast("✓ Category added."); };
  const handleDeleteCat = (idx) => saveCats(cats.filter((_, i) => i !== idx));
  const handleEditCat   = (idx) => { const u = [...cats]; u[idx] = editVal; saveCats(u); setEditIdx(null); setEditVal(''); showToast("✓ Category updated."); };

  /* ── Notifications ── */
  const handleNotifSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/api/auth/notifications`, notifs, getAuthHeader());
      showToast("✓ Notification preferences saved.");
    } catch (err) {
      showToast("✗ " + (err.response?.data?.message || "Failed to save preferences."), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Password ── */
  const handlePasswordSave = async () => {
    if (!passwords.current)                      { showToast("✗ Enter your current password.", "error"); return; }
    if (!passwords.new || passwords.new.length < 6) { showToast("✗ New password must be at least 6 characters.", "error"); return; }
    if (passwords.new !== passwords.confirm)     { showToast("✗ Passwords don't match!", "error"); return; }
    setLoading(true);
    try {
      await axios.put(`${API}/api/auth/update-password`, {
        currentPassword: passwords.current,
        newPassword:     passwords.new,
      }, getAuthHeader());
      setPasswords({ current: '', new: '', confirm: '' });
      showToast("✓ Password updated successfully.");
    } catch (err) {
      showToast("✗ " + (err.response?.data?.message || "Failed to update password."), "error");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: "profile",       icon: "👤", label: "Profile" },
    { id: "categories",    icon: "🗂️",  label: "Categories" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "security",      icon: "🔒", label: "Security" },
  ];

  const btnClass = `px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userStatus={{ plan: "pro" }} onBudgetUpdate={() => {}} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 p-4 lg:px-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">☰</button>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Settings</h2>
            <p className="text-xs text-gray-400 font-bold hidden md:block">Manage your account settings and preferences</p>
          </div>
          {toast.msg && (
            <span className={`text-xs font-black px-4 py-2 rounded-xl border
              ${toast.type === "error" ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {toast.msg}
            </span>
          )}
        </header>

        <div className="p-4 lg:p-8 max-w-[900px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Left Tab List */}
            <div className="lg:col-span-1">
              {/* Mobile: horizontal tabs */}
              <div className="flex lg:hidden gap-1 bg-white rounded-2xl border border-gray-50 shadow-sm p-2 overflow-x-auto">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all
                      ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:bg-gray-50'}`}>
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
              {/* Desktop: vertical tabs */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-50 shadow-sm p-3 space-y-1">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all text-left
                      ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5 sm:p-6">

                {/* ── PROFILE ── */}
                {activeTab === "profile" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Profile</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Update your personal information</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", key: "name",  placeholder: "Enter your full name" },
                        { label: "Email",     key: "email", placeholder: "Your registered email", disabled: true },
                      ].map(({ label, key, placeholder, disabled }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                          <input value={profile[key]} onChange={e => !disabled && setProfile(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder} disabled={disabled}
                            className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country</label>
                        <select value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700 cursor-pointer">
                          {getCountryList().map(c => <option key={c}>{c}</option>)}
                        </select>
                        <p className="text-[9px] text-emerald-600 font-bold">⚡ Changes tax calculation across entire app</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Income Bracket (Optional)</label>
                        <select value={profile.incomeBracket} onChange={e => setProfile(p => ({ ...p, incomeBracket: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700 cursor-pointer">
                          <option value="">Select income bracket</option>
                          <option value="300000">Low (Below ₹5L)</option>
                          <option value="1000000">Middle (₹5L – ₹15L)</option>
                          <option value="2000000">High (Above ₹15L)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">What changes when you save:</p>
                      <ul className="space-y-1">
                        {[
                          "Dashboard Tax View → uses selected country's tax slabs",
                          "Tax Estimator → auto-selects your country",
                          "Tax Calendar → shows your country's deadlines",
                        ].map((item, i) => (
                          <li key={i} className="text-[10px] font-bold text-emerald-600 flex items-center gap-2">
                            <span className="text-emerald-400">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button onClick={handleProfileSave} disabled={loading} className={btnClass}>
                      {loading ? 'Saving…' : 'Save Profile'}
                    </button>
                  </div>
                )}

                {/* ── CATEGORIES ── */}
                {activeTab === "categories" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Category Management</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Add, edit or remove transaction categories</p>
                    </div>
                    <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                      {['expense', 'income'].map(t => (
                        <button key={t} onClick={() => setCatTab(t)}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all capitalize
                            ${catTab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                          {t} Categories
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {cats.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${CAT_COLORS[idx % CAT_COLORS.length]}`} />
                            {editIdx === idx ? (
                              <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                                onBlur={() => handleEditCat(idx)} onKeyDown={e => e.key === 'Enter' && handleEditCat(idx)}
                                className="bg-white border border-emerald-300 rounded-lg px-2 py-1 text-sm font-bold text-gray-800 outline-none" />
                            ) : (
                              <span className="text-sm font-bold text-gray-700 truncate">{cat}</span>
                            )}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => { setEditIdx(idx); setEditVal(cat); }} className="text-gray-400 hover:text-emerald-600 transition-colors text-sm">✏️</button>
                            <button onClick={() => handleDeleteCat(idx)} className="text-gray-400 hover:text-rose-500 transition-colors text-sm font-black px-1">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newCat} onChange={e => setNewCat(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCat()}
                        placeholder="New category name..."
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700 min-w-0" />
                      <button onClick={handleAddCat} className="px-5 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shrink-0">+ Add</button>
                    </div>
                  </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === "notifications" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Notifications</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Choose what notifications you want to receive</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: 'taxDeadlines',  label: 'Tax Deadlines',   desc: 'Get reminded before quarterly tax payment due dates' },
                        { key: 'monthlyReport', label: 'Monthly Report',  desc: 'Receive a summary of your income and expenses each month' },
                        { key: 'budgetAlerts',  label: 'Budget Alerts',   desc: 'Get notified when you are close to exceeding a budget limit' },
                        { key: 'weeklyDigest',  label: 'Weekly Digest',   desc: 'Receive a weekly overview of your financial activity' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-800">{label}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{desc}</p>
                          </div>
                          <button onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${notifs[key] ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${notifs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleNotifSave} disabled={loading} className={btnClass}>
                      {loading ? 'Saving…' : 'Save Preferences'}
                    </button>
                  </div>
                )}

                {/* ── SECURITY ── */}
                {activeTab === "security" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Security</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Update your password to keep your account secure</p>
                    </div>
                    {[
                      { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                      { key: 'new',     label: 'New Password',     placeholder: 'Choose a new password (min 6 chars)' },
                      { key: 'confirm', label: 'Confirm Password', placeholder: 'Confirm new password' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                        <input type="password" value={passwords[key]} onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-300 font-bold text-sm text-gray-700" />
                      </div>
                    ))}
                    <button onClick={handlePasswordSave} disabled={loading} className={btnClass}>
                      {loading ? 'Updating…' : 'Update Password'}
                    </button>

                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs font-black text-rose-500 mb-2">Danger Zone</p>
                      <button onClick={() => { localStorage.clear(); navigate("/login"); }}
                        className="px-5 py-2.5 border border-rose-200 text-rose-500 rounded-xl font-black text-xs hover:bg-rose-50 transition-all">
                        Delete Account & Logout
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;