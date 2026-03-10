import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API_URL from "../api";

const ResetPassword = () => {
  const [otp,             setOtp]             = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);  // ← new

  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "your email";

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (otp.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);  // ← show success state
        setTimeout(() => navigate("/login"), 2500);
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
    const base    = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all duration-300";
    return `${base} ${isError
      ? "border-red-200 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100"
      : "focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"}`;
  };

  // ── Success State ─────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              ✅
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Password Updated!</h2>
            <p className="text-gray-500 font-medium mb-2">Your password has been reset successfully.</p>
            <p className="text-sm text-emerald-600 font-bold">Redirecting to login...</p>
            <div className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-[shrink_2.5s_linear_forwards]" style={{ animation: 'progress 2.5s linear forwards' }} />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes progress { from { width: 100%; } to { width: 0%; } }
        `}</style>
      </div>
    );
  }

  // ── Form State ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Set New Password</h2>
            <p className="text-gray-500 font-medium">Verify OTP and secure your account</p>
          </div>

          {/* Email badge */}
          <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">OTP sent to</p>
            <p className="text-sm font-semibold text-gray-700">{email}</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-6" noValidate>

            {/* OTP */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                6-Digit OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value); setError(""); }}
                required
                className={getInputClass("OTP")}
              />
            </div>

            {/* New + Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  required
                  className={getInputClass("Password")}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                  Confirm <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  required
                  className={getInputClass("match")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                loading ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => navigate("/login")} className="text-emerald-600 font-bold hover:underline underline-offset-4">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;