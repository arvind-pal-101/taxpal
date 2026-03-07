import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ResetPassword = () => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "your email";

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    // 2. Validate password matching
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // 3. OTP format check
    if (otp.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Password updated successfully!");
        navigate("/login");
      } else {
        setError(data.message || "Invalid OTP or request");
      }
    } catch (error) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (fieldName) => {
    const isError = error.toLowerCase().includes(fieldName.toLowerCase());
    const base = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all duration-300";
    
    const activeState = isError 
      ? "focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100 border-red-200" 
      : "focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
    
    return `${base} ${activeState}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
          
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Set Password</h2>
            <p className="text-gray-500 font-medium">Verify OTP and secure your account</p>
          </div>

          <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">OTP sent to</p>
            <p className="text-sm font-semibold text-gray-700">{email}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-6">
            {/* OTP Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">6-Digit OTP <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className={getInputClass("OTP")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* New Password */}
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={getInputClass("Password")}
                />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Confirm <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={getInputClass("match")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                loading 
                  ? "bg-emerald-300 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate("/login")} 
              className="text-emerald-600 font-bold hover:underline underline-offset-4"
            >
              Back to Login
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;