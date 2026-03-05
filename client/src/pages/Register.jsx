import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const COUNTRIES = [
  { value: "india", label: "🇮🇳 India",         currency: "₹" },
  { value: "usa",   label: "🇺🇸 United States",  currency: "$" },
  { value: "uk",    label: "🇬🇧 United Kingdom", currency: "£" },
];

const Register = () => {
  const navigate = useNavigate();

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
      const response = await fetch("http://localhost:5000/api/auth/register", {
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
    const base       = "w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none transition-all duration-300";
    const errorState = "border-red-500 focus:ring-4 focus:ring-red-100";
    const normalState = "border-gray-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
    return `${base} ${errors[fieldName] ? errorState : normalState}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6 py-12">
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

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Full Name */}
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

            {/* Email */}
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
              <input
                type="password" name="password" value={formData.password}
                onChange={handleChange} className={getInputClass("password")}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1.5 font-medium ml-1">⚠️ {errors.password}</p>}
            </div>

            {/* Country + Income */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Country — Dropdown */}
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

              {/* Income */}
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