import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {Eye,EyeOff} from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email) { setError("Please enter your email address."); return; }
    if (!formData.password) { setError("Please enter your password."); return; }
    if (formData.password.length < 6) { setError("Wrong password! Please enter a valid password."); return; }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        setTimeout(() => navigate("/dashboard"), 100);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (fieldName) => {
    const errText = error.toLowerCase();
    const base = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all duration-300 text-sm md:text-base";
    const isCredentialError = errText.includes("credentials");
    let stateClass = "focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

    if (error) {
      if (fieldName === "email") {
        const isEmailError = errText.includes("email") || errText.includes("found");
        if (isEmailError || (isCredentialError && !errText.includes("password")))
          stateClass = "border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100";
      }
      if (fieldName === "password") {
        const isPasswordError = errText.includes("password") || errText.includes("character");
        if (isPasswordError || isCredentialError)
          stateClass = "border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100";
      }
    }
    return `${base} ${stateClass}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">

          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">Login to your TaxPal account</p>
          </div>

          {error && (
            <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-xs sm:text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6" noValidate>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 ml-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email" name="email"
                className={getInputClass("email")}
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
  <div className="flex justify-between mb-2 ml-1">
    <label className="text-sm font-bold text-gray-700">
      Password <span className="text-red-500">*</span>
    </label>
    <Link
      to="/forgot-password"
      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
    >
      Forgot?
    </Link>
  </div>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      required
      className="w-full px-5 py-4 pr-12 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300"
      placeholder="••••••••"
      onChange={handleChange}
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
</div>


            <button
              type="submit" disabled={loading}
              className={`w-full py-3.5 sm:py-4 rounded-2xl text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"
              }`}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 sm:mt-8 text-center text-sm text-gray-500 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline underline-offset-4">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;