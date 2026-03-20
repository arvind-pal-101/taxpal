import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {Eye,EyeOff} from "lucide-react";
import BASE_URL from "../config";

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Show error if redirected back from Google with error
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err === "no_account") {
      setError("No account found with this Google email. Please sign up first.");
    } else if (err === "oauth_error") {
      setError("Google sign-in failed. Please try again.");
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email)    { setError("Please enter your email address."); return; }
    if (!formData.password) { setError("Please enter your password."); return; }
    if (formData.password.length < 6) { setError("Wrong password! Please enter a valid password."); return; }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        if (onLoginSuccess) onLoginSuccess(data.accessToken);
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
          <span>🔒</span> {toast}
        </div>
      )}
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

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => { window.location.href = `${BASE_URL}/api/auth/google/login`; }}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 font-semibold text-gray-700 text-sm group"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">or with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6" noValidate>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 ml-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input type="email" name="email" className={getInputClass("email")}
                placeholder="john@example.com" value={formData.email} onChange={handleChange} />
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
      className={`${getInputClass("password")} pr-12`}
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


            <button type="submit" disabled={loading}
              className={`w-full py-3.5 sm:py-4 rounded-2xl text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"
              }`}>
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