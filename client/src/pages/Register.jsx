import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Eye,EyeOff} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword,setShowPassword] = useState(false);
  const currencyMap = { india: "₹", usa: "$", uk: "£" };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    country: "",
    income: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const formatNumber = (value) => {
    const number = value.replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { fullName, email, password, country, income } = formData;
    let newErrors = {};

    if (!fullName) newErrors.fullName = "Name required";
    if (!email) newErrors.email = "Email required";
    if (!password || password.length < 6) newErrors.password = "Min 6 characters";
    if (!country) newErrors.country = "Country required";
    if (!income) newErrors.income = "Income required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const normalizedCountry = country.trim().toLowerCase();
    const selectedCurrency = currencyMap[normalizedCountry] || "₹";

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          country,
          income_bracket: Number(income.replace(/,/g, "")),
          currency: selectedCurrency
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors({ submit: data.message });
        setLoading(false);
        return;
      }
      navigate("/login");
    } catch (error) {
      setErrors({ submit: "Connection error. Server is down." });
      setLoading(false);
    }
  };

  const dynamicCurrency = currencyMap[formData.country.trim().toLowerCase()] || "₹";

  // Reusable Input Class Logic 
  const getInputClass = (fieldName) => {
    const baseClass = "w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none transition-all duration-300";
    const errorState = "border-red-500 focus:ring-4 focus:ring-red-100";
    const normalState = "border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
    
    return `${baseClass} ${errors[fieldName] ? errorState : normalState}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        
        {/* Main Card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500 font-medium">Join <span className="text-emerald-600 font-semibold">TaxPal</span> to manage your finances</p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-sm font-medium">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={getInputClass("fullName")} placeholder="John Doe" />
              {errors.fullName && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.fullName}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Address <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={getInputClass("email")} placeholder="name@company.com" />
              {errors.email && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.email}</p>}
            </div>

            {/* Password */}
<div>
  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
    Password <span className="text-red-500">*</span>
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      value={formData.password}
      onChange={handleChange}
      className={`${getInputClass("password")} pr-12`}
      placeholder="••••••••"
    />

    {/* Eye Toggle */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>

  {errors.password && (
    <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">
      ⚠️ {errors.password}
    </p>
  )}
</div>


           {/* Dual Column - Responsive adjustment */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Country */}
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Country <span className="text-red-500">*</span></label>
    <input 
      type="text" 
      name="country" 
      value={formData.country} 
      onChange={handleChange} 
      className={getInputClass("country")} 
      placeholder="India" 
    />
    {errors.country && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.country}</p>}
  </div>

  {/* Income */}
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Est. Annual Income ({dynamicCurrency}) <span className="text-red-500">*</span></label>
    <input 
      type="text" 
      name="income" 
      value={formData.income} 
      onChange={(e) => {
        const formatted = formatNumber(e.target.value);
        setFormData({ ...formData, income: formatted });
        if (errors.income) setErrors({ ...errors, income: "" });
      }} 
      className={getInputClass("income")} 
      placeholder="5,00,000" 
    />
    {errors.income && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.income}</p>}
  </div>
</div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 mt-4 ${
                loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-center text-gray-500 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline underline-offset-4">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;