import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

// ── Custom SVG Icons ───────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Transactions: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  ),
  TaxEstimator: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M8 7h8M8 12h8M8 17h5"/>
    </svg>
  ),
  TaxCalendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  ),
  Budget: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 6v2m0 8v2"/>
      <path d="M9 9.5c0-1.1.9-1.5 3-1.5s3 .9 3 2.5c0 2-3 2.5-3 4.5 0 1.1.4 1.5 3 1.5"/>
    </svg>
  ),
  Reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  SignOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ── Avatar: shows initials with gradient bg ────────────────
function Avatar({ name, email }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0] || '?').toUpperCase();

  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-black flex-shrink-0 shadow-md"
      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
      {initials}
    </div>
  );
}

const Sidebar = ({ isOpen, setIsOpen, userStatus }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });

  useEffect(() => {
    const name  = localStorage.getItem('userName')  || '';
    const email = localStorage.getItem('userEmail') || '';
    setUser({ name, email });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const menuItems = [
    { name: "Dashboard",     Icon: Icons.Dashboard,     path: "/dashboard"    },
    { name: "Transactions",  Icon: Icons.Transactions,  path: "/transactions"  },
    { name: "Tax Estimator", Icon: Icons.TaxEstimator,  path: "/tax-estimator" },
    { name: "Tax Calendar",  Icon: Icons.TaxCalendar,   path: "/calendar"      },
    { name: "Budget",        Icon: Icons.Budget,        path: "/budget"        },
    { name: "Reports",       Icon: Icons.Reports,       path: "/reports"       },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-[70] h-screen w-[272px] bg-white border-r border-gray-100
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        flex flex-col shadow-2xl lg:shadow-none
      `}>

        {/* ── Logo ── */}
        <div className="px-7 pt-7 pb-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform duration-300">
              <img src={logo} alt="TaxPal" className="h-6 w-auto brightness-0 invert" />
            </div>
            <span className="font-black text-2xl text-gray-900 tracking-tighter">
              Tax<span className="text-emerald-600">Pal</span>
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-rose-500 transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
          <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.22em] mb-3">Main Menu</p>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  relative group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl
                  font-black text-[11px] uppercase tracking-wider transition-all duration-200 no-underline
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}
              >
                {/* Active left bar */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full" />
                )}

                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <item.Icon />
                </span>

                <span className="flex-1">{item.name}</span>

                {/* Active dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User Card + Logout ── */}
        <div className="mx-4 mb-5 mt-3">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">

            {/* User info row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Avatar name={user.name} email={user.email} />
              <div className="flex-1 min-w-0">
                {user.name && (
                  <p className="text-[12px] font-black text-gray-900 truncate leading-tight">
                    {user.name}
                  </p>
                )}
                <p className="text-[10px] font-semibold text-gray-400 truncate leading-tight mt-0.5">
                  {user.email || 'Not signed in'}
                </p>
              </div>
              {/* Online dot */}
              <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 shadow-sm shadow-emerald-200" title="Online" />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-4" />

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider hover:text-rose-500 hover:bg-rose-50/60 transition-all duration-200 group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                <Icons.SignOut />
              </span>
              Sign Out
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;