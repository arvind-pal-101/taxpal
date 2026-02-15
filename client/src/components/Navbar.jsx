import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo1.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="TaxPal" className="h-8 w-auto" />
            <span className="font-bold text-gray-900 hidden sm:inline">TaxPal</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">
              How it works
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-900 text-2xl"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-4 mt-4">
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                How it works
              </a>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
