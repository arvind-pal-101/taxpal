import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Landing = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      <Navbar />

      {/* HERO SECTION  */}
      <section className="bg-gradient-to-br from-white to-emerald-50 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Manage Income, Track Expenses &<br />
            <span className="text-emerald-600">Estimate Taxes</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            A secure financial dashboard built for freelancers and professionals who need clarity, control, and confidence over their finances.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-10 py-4 rounded-2xl font-bold text-lg transition-all"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
              Built for Financial Clarity
            </h2>
            <div className="h-1.5 w-20 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="group p-10 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-100 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Log transactions, categorize expenses and monitor your financial flow in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-10 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-100 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">💰</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Budgets</h3>
              <p className="text-gray-600 leading-relaxed">
                Set monthly spending limits and track performance with clear financial insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-10 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-100 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🧮</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tax Estimates</h3>
              <p className="text-gray-600 leading-relaxed">
                Instantly calculate quarterly tax estimates based on your income and expense data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-emerald-50/50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16">Simple 4-Step Process</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { num: 1, title: "Create Account", desc: "Sign up securely for your dashboard" },
              { num: 2, title: "Log Data", desc: "Add income and expenses easily" },
              { num: 3, title: "Track Progress", desc: "Monitor your spending trends" },
              { num: 4, title: "Get Estimates", desc: "Generate quarterly tax reports" }
            ].map((step) => (
              <div key={step.num} className="group">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-2xl shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY SECTION */}
      <section id="security" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Security & Privacy First</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                TaxPal is built with industry-standard encryption. Your financial data remains protected through secure authentication.
              </p>
              <div className="space-y-4">
                {["Secure JWT Authentication", "Encrypted Data Handling", "Privacy-Focused Architecture"].map((item, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-emerald-600 mr-3 font-bold">✔</span>
                    <span className="text-gray-700 font-semibold text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2 bg-emerald-600 rounded-[3rem] p-16 text-center shadow-2xl shadow-emerald-200 relative overflow-hidden">
               {/* Decorative Circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full opacity-50"></div>
              <div className="text-8xl mb-6 relative z-10">🔒</div>
              <p className="text-white font-bold text-2xl relative z-10">Data is Encrypted</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;