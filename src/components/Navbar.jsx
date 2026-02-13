import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo1.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClose = () => setMenuOpen(false);

  return (
    <nav
      className={`w-full bg-white sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Row */}
        <div className="h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center">
            <img
              src={logo}
              alt="TaxPal"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
            >
              How it Works
            </a>

            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`text-2xl text-gray-700 focus:outline-none transition-transform duration-300 ${
                menuOpen ? "rotate-90" : ""
              }`}
            >
              ☰
            </button>
          </div>

        </div>

        {/* Mobile Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-3 px-6 py-5 bg-white border-t border-gray-200 shadow-lg rounded-b-xl">

            <a
              href="#features"
              onClick={handleClose}
              className="text-gray-700 font-medium py-2 hover:text-blue-600 transition"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              onClick={handleClose}
              className="text-gray-700 font-medium py-2 hover:text-blue-600 transition"
            >
              How it Works
            </a>

            <Link
              to="/login"
              onClick={handleClose}
              className="text-gray-700 font-medium py-2 hover:text-blue-600 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              onClick={handleClose}
              className="font-medium bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition shadow-sm"
            >
              Get Started
            </Link>

          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
