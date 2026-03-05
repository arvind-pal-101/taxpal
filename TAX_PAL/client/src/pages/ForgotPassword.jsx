import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        navigate("/reset-password", { state: { email } });
      } else {
        setError(data.message || "Something went wrong");
      }

    } catch (error) {
      setError("Server is not responding. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        
        {/* Main Card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-500 font-medium">Enter your email to receive an OTP</p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-r-xl text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300"
                placeholder="name@company.com"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                isLoading 
                  ? "bg-emerald-300 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-center text-gray-500 font-medium">
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