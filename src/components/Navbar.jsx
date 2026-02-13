import { Link } from "react-router-dom";
import logo from "../assets/logo1.png"; // make sure logo is inside src/assets

const Navbar = () => {
  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

    {/* Left - Logo */}
    <div className="flex items-center">
      <img
        src={logo}
        alt="TaxPal"
        className="h-11 w-auto object-contain"
      />
    </div>

    {/* Right - Links */}
    <div className="hidden md:flex items-center gap-8">
      <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
        Features
      </a>
      <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
        How it Works
      </a>
      <Link
        to="/login"
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
      >
        Get Started
      </Link>
    </div>

  </div>
</nav>

  );
};

export default Navbar;
