import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Eye,EyeOff} from "lucide-react";
import BASE_URL from "../config";

const COUNTRIES = [
  { value: "india", label: "🇮🇳 India",         currency: "₹" },
  { value: "usa",   label: "🇺🇸 United States",  currency: "$" },
  { value: "uk",    label: "🇬🇧 United Kingdom", currency: "£" },
];

const Register = () => {
  const navigate = useNavigate();
  const [showPassword,setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const currencyMap = { india: "₹", usa: "$", uk: "£" };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email:    "",
    password: "",
    country:  "",
    income:   ""
  });

  const [errors,  setErrors]  = useState({});
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

    if (!fullName)                        newErrors.fullName = "Name required";
    if (!email)                           newErrors.email    = "Email required";
    if (!password || password.length < 6) newErrors.password = "Min 6 characters";
    if (!country)                         newErrors.country  = "Country required";
    if (!income)                          newErrors.income   = "Income required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const selected = COUNTRIES.find(c => c.value === country);
    const currency = selected ? selected.currency : "₹";

    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           fullName,
          email,
          password,
          country,
          income_bracket: Number(income.replace(/,/g, "")),
          currency
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

  const selectedCountry = COUNTRIES.find(c => c.value === formData.country);
  const dynamicCurrency = selectedCountry ? selectedCountry.currency : "₹";

  const getInputClass = (fieldName) => {
    const base        = "w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none transition-all duration-300";
    const errorState  = "border-red-500 focus:ring-4 focus:ring-red-100";
    const normalState = "border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
    return `${base} ${errors[fieldName] ? errorState : normalState}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6 py-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <span>🔒</span> {toast}
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500 font-medium">
              Join <span className="text-emerald-600 font-semibold">TaxPal</span> to manage your finances
            </p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-sm font-medium">
              ⚠️ {errors.submit}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => { window.location.href = `${BASE_URL}/api/auth/google/register`; }}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 font-semibold text-gray-700 text-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">or with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="fullName" value={formData.fullName}
                onChange={handleChange} className={getInputClass("fullName")}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} className={getInputClass("email")}
                placeholder="name@company.com"
              />
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


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country" value={formData.country}
                  onChange={handleChange}
                  className={`${getInputClass("country")} cursor-pointer`}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.country && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.country}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Annual Income ({dynamicCurrency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" name="income" value={formData.income}
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

            <button
              type="submit" disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 mt-4 ${
                loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

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