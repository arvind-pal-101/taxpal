import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../config";

const ForgotPassword = () => {
  const [email,     setEmail]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) { setError("Please enter your email address first."); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/reset-password", { state: { email } });
      } else {
        const msg = data.message?.toLowerCase() || "";
        if (msg.includes("not found") || msg.includes("user")) {
          setError("User not found! Please enter a registered email.");
        } else {
          setError(data.message || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      setError("Server is not responding. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = () => {
    const base = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all duration-300 text-sm md:text-base";
    if (error) return `${base} border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100`;
    return `${base} focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">

          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">Enter your email to receive an OTP</p>
          </div>

          {error && (
            <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-xs sm:text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 ml-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email" required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                disabled={isLoading}
                className={getInputClass()}
                placeholder="name@company.com"
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className={`w-full py-3.5 sm:py-4 rounded-2xl text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                isLoading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="mt-6 sm:mt-8 text-center text-sm text-gray-500 font-medium">
            Remember your password?{" "}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline underline-offset-4">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;