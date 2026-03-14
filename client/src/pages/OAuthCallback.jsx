import { useEffect } from "react";

const OAuthCallback = ({ onLoginSuccess }) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const name         = params.get("name");
    const email        = params.get("email");

    if (accessToken) {
      // Store everything in localStorage
      localStorage.setItem("token",        accessToken);
      localStorage.setItem("userName",     name  || "");
      localStorage.setItem("userEmail",    email || "");
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      // Notify parent App component
      if (onLoginSuccess) onLoginSuccess(accessToken);

      // Use window.location for a hard redirect so App re-reads localStorage
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login?error=oauth_failed";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold text-lg">Signing you in...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    </div>
  );
};

export default OAuthCallback;