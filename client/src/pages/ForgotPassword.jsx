import { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email) {
      setError("Please enter your email");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword: "12345678" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (error) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          {submitted ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h2>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <Link
                to="/login"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg text-center transition-colors"
              >
                Back to Login
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600 mb-8">Enter your email to receive reset instructions</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors mt-6"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center text-gray-600 text-sm mt-6">
                Remember your password?{" "}
                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
