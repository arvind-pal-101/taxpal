import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const currencyMap = {
    india: "₹",
    usa: "$",
    uk: "£"
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    country: "",
    income: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const formatNumber = (value) => {
    const number = value.replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
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
      setErrors({ submit: "Something went wrong" });
      setLoading(false);
    }
  };

  const normalizedCountry = formData.country.trim().toLowerCase();
  const dynamicCurrency = currencyMap[normalizedCountry] || "₹";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 mb-8">Join TaxPal to manage your finances</p>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none ${errors.fullName ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none ${errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none ${errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none ${errors.country ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="e.g., India"
              />
              {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Annual Income ({dynamicCurrency})
              </label>
              <input
                type="text"
                name="income"
                value={formData.income}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value);
                  setFormData({ ...formData, income: formatted });
                  setErrors({ ...errors, income: "" });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none ${errors.income ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder={`e.g., 500000`}
              />
              {errors.income && <p className="text-xs text-red-600 mt-1">{errors.income}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors mt-6"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
