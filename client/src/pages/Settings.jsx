import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("menu"); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: localStorage.getItem("userName") || "User",
    email: localStorage.getItem("userEmail") || "user@taxpal.com",
    currency: "INR (₹)",
    notifications: true
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isMobileMenu = activeTab === "menu";

  return (
    /* Improved Background: Stronger Emerald mesh and subtle pattern */
    <div className="min-h-screen bg-[#F8F9FB] bg-[radial-gradient(circle_at_10%_20%,_rgba(16,185,129,0.05)_0%,_transparent_40%),_radial-gradient(circle_at_90%_80%,_rgba(16,185,129,0.08)_0%,_transparent_40%)] text-[#1d1d1f] antialiased selection:bg-emerald-100 font-sans">
      <div className="max-w-[1100px] mx-auto py-6 md:py-16 px-4 md:px-8">
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* SIDEBAR */}
          <aside className={`w-full lg:w-64 space-y-8 flex-shrink-0 ${!isMobileMenu ? 'hidden lg:block' : 'block'}`}>
            <div className="px-2 cursor-pointer group" onClick={() => setActiveTab("menu")}>
              <h1 className="text-3xl font-black tracking-tighter italic text-gray-900 duration-300">
                Set.<span className="text-emerald-500 not-italic">_</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Configuration</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: "general", label: "Profile", icon: "👤" },
                { id: "preferences", label: "Preferences", icon: "⚙️" },
                { id: "security", label: "Security", icon: "🛡️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 border ${
                    activeTab === tab.id 
                    ? "bg-white text-gray-900 border-emerald-500 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.2)]" 
                    : "bg-white/40 text-gray-400 border-transparent hover:text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeTab === tab.id ? "text-emerald-500" : ""}>{tab.icon}</span>
                    {tab.label}
                  </div>
                  <span className={`lg:hidden transition-transform ${activeTab === tab.id ? 'translate-x-1 text-emerald-500' : 'text-gray-300'}`}>→</span>
                </button>
              ))}
            </nav>

            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-rose-50 text-rose-500 font-black text-[13px] hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-100 transition-all border border-rose-100 active:scale-95"
            >
              Sign Out
            </button>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className={`flex-1 ${isMobileMenu ? 'hidden lg:block' : 'block'}`}>
            
            {!isMobileMenu && (
              <button 
                onClick={() => setActiveTab("menu")}
                className="lg:hidden flex items-center gap-2 text-emerald-600 font-bold mb-6 group transition-all"
              >
                <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 
                Back to Settings
              </button>
            )}

            <main className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] border border-white min-h-[550px] flex flex-col relative overflow-hidden">
              
              {/* WELCOME STATE: Hoverable & Emerald Focused */}
              {activeTab === "menu" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700 group/welcome">
                  <div className="relative mb-8 transition-transform duration-500 group-hover/welcome:-translate-y-2">
                    <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl shadow-emerald-200 rotate-12 group-hover/welcome:rotate-0 transition-all duration-500">
                      <span className="group-hover/welcome:scale-110 transition-transform">⚙️</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Control</h2>
                  <p className="text-gray-400 max-w-[320px] mt-3 font-medium leading-relaxed">
                    Manage your identity, security protocols, and workspace preferences.
                  </p>
                  <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-sm transition-all duration-500 group-hover/welcome:scale-105">
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:bg-emerald-50 transition-colors">
                      <div className="text-emerald-600 font-black text-xl">100%</div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Secure</div>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="text-gray-900 font-black text-xl">v2.0</div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Engine</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Section */}
              {activeTab === "general" && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <header className="mb-10">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight underline decoration-emerald-500/30 decoration-4 underline-offset-8">Profile Identity</h2>
                  </header>
                  <div className="max-w-md space-y-8">
                    <div className="space-y-2 group">
                      <label className="text-[11px] font-black uppercase text-gray-400 ml-1 group-focus-within:text-emerald-500 transition-colors">Legal Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl text-base font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all hover:border-gray-300"
                      />
                    </div>
                    
                    {/* FIXED EMAIL TOOLTIP LOGIC */}
                    <div className="space-y-2 relative group/email">
                      <label className="text-[11px] font-black uppercase text-gray-400 ml-1">Email Address</label>
                      
                      {/* Floating Professional Message */}
                      <div className="absolute -top-4 right-0 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover/email:opacity-100 transition-all pointer-events-none translate-y-2 group-hover/email:translate-y-0 shadow-xl z-20">
                        <span className="text-emerald-400 mr-1">◆</span> Locked for security
                      </div>

                      <div className="bg-gray-100/80 border border-gray-200 px-6 py-4 rounded-2xl text-gray-400 font-bold cursor-not-allowed flex justify-between items-center transition-all group-hover/email:bg-gray-100 group-hover/email:border-emerald-200">
                        {formData.email}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm font-black text-gray-400">READ-ONLY</span>
                          <span className="text-emerald-500 text-xs transition-transform group-hover/email:rotate-12">🛡️</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setIsSaving(true); setTimeout(() => setIsSaving(false), 1000); }}
                      className="w-full md:w-auto bg-emerald-500 text-white px-12 py-4 rounded-2xl font-black text-sm hover:bg-emerald-600 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
                    >
                      {isSaving ? "Syncing..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeTab === "preferences" && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black mb-10 tracking-tight">System Prefs</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-emerald-100 hover:bg-white transition-all cursor-pointer group">
                      <div>
                        <span className="font-bold text-gray-900 block">Primary Currency</span>
                        <span className="text-[11px] text-gray-400 font-medium">Used for financial reports.</span>
                      </div>
                      <select className="bg-white px-4 py-2 rounded-xl font-bold text-emerald-600 border border-gray-200 outline-none text-sm cursor-pointer hover:border-emerald-400 transition-colors shadow-sm">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                      </select>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, notifications: !formData.notifications})}
                      className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-emerald-100 hover:bg-white transition-all cursor-pointer group"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-emerald-600 transition-colors text-sm md:text-base">Smart Notifications</span>
                        <span className="text-[11px] text-gray-400 font-medium">AI-driven alerts.</span>
                      </div>
                      <button 
                        className={`w-14 h-8 rounded-full transition-all flex items-center px-1.5 ${formData.notifications ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${formData.notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeTab === "security" && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black mb-8 text-rose-600 tracking-tight">Advanced Security</h2>
                  <div className="bg-rose-50/20 border border-rose-100 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-100/40 transition-colors"></div>
                    <h4 className="font-black text-rose-900 text-xl mb-3">Terminate Workspace</h4>
                    <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed max-w-sm">
                      Destructive action. Once confirmed, all documents and logs will be permanently purged.
                    </p>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full md:w-auto px-10 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 hover:shadow-2xl hover:shadow-rose-200 active:scale-95 transition-all"
                    >
                      Erase All Data
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {(showLogoutModal || showDeleteModal) && (
  <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
    <div className="bg-white w-full max-w-sm p-12 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] text-center border border-white scale-up-center">
      
      {/* Dynamic Icon */}
      <div className={`w-20 h-20 mx-auto mb-8 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner ${showLogoutModal ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
        {showLogoutModal ? '🚪' : '⚠️'}
      </div>
      
      {/* Dynamic Headline */}
      <h3 className="text-2xl font-black text-gray-900 tracking-tight">
        {showLogoutModal ? "Ready to leave?" : "Permanent Erase?"}
      </h3>
      
      {/* Dynamic Body Text */}
      <p className="text-gray-400 mt-4 mb-10 text-sm font-medium leading-relaxed">
        {showLogoutModal ? (
          "Are you sure you want to end your session? Don't worry, your workspace data is safe."
        ) : (
          <>
            This will erase all your workspace logs and documents forever.{" "}
            <span className="text-rose-500 font-bold">This cannot be undone.</span>
          </>
        )}
      </p>
      
      <div className="flex flex-col gap-3">
        {/* Dynamic Primary Button */}
        <button 
          onClick={showLogoutModal ? handleLogout : () => {setShowDeleteModal(false); navigate("/register");}}
          className={`py-5 rounded-2xl font-black text-white transition-all shadow-xl active:scale-95 ${
            showLogoutModal 
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' 
              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
          }`}
        >
          {showLogoutModal ? "Sign Out Now" : "Yes, Erase All"}
        </button>
        
        {/* Dynamic Secondary Button */}
        <button 
          onClick={() => { setShowLogoutModal(false); setShowDeleteModal(false); }} 
          className="py-5 text-gray-400 font-black hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all"
        >
          {showLogoutModal ? "Stay Logged In" : "Cancel, Keep Data"}
        </button>

      </div>
    </div>
  </div>
      )}
    </div>
  );
};

export default Settings;