import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo1.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
            <img src={logo} alt="TaxPal" className="h-9 w-auto" />
            <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:inline">
              Tax<span className="text-emerald-600">Pal</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-600 hover:text-emerald-600 font-semibold transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-emerald-600 font-semibold transition-colors">
              How it works
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-gray-600 hover:text-emerald-600 font-bold transition-colors">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button - Stylish Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg bg-emerald-50 text-emerald-600 transition-colors"
          >
            {menuOpen ? (
              <span className="text-2xl block w-6 text-center">✕</span>
            ) : (
              <span className="text-2xl block w-6 text-center">☰</span>
            )}
          </button>
        </div>

        {/* Mobile Menu with Animation Style */}
        {menuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-emerald-100 shadow-xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="block text-gray-700 hover:text-emerald-600 font-semibold text-lg"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="block text-gray-700 hover:text-emerald-600 font-semibold text-lg"
            >
              How it works
            </a>
            <div className="pt-4 flex flex-col gap-4 border-t border-emerald-50">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center py-3 text-gray-700 font-bold text-lg"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-center shadow-lg shadow-emerald-100"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;