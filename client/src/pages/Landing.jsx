import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Landing = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-br from-white to-purple-50 pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage your finances<br />without the stress
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track income, manage expenses, and understand your taxes. Built for freelancers who actually want clarity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
            What you get
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Track Everything</h3>
              <p className="text-gray-600">Log income and expenses. See where your money actually goes.</p>
            </div>

            <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Budget Better</h3>
              <p className="text-gray-600">Set spending limits that work. Stay in control of your money.</p>
            </div>

            <div className="p-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-3xl mb-4">🧮</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Taxes Made Simple</h3>
              <p className="text-gray-600">Get accurate quarterly estimates. No surprises on tax day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-purple-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
            How it works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: "Sign Up", desc: "Create your account" },
              { num: 2, title: "Log Transactions", desc: "Add your income and expenses" },
              { num: 3, title: "Track Progress", desc: "Watch your finances improve" },
              { num: 4, title: "Get Estimates", desc: "Know your tax liability" }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-purple-600 text-white font-bold text-lg">
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Your data is safe
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                We use industry-standard encryption to protect your financial information. Your data never gets shared with anyone.
              </p>
              <ul className="space-y-3">
                <li className="text-gray-700">✓ Encrypted connections</li>
                <li className="text-gray-700">✓ Secure authentication</li>
                <li className="text-gray-700">✓ No third-party sharing</li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-gray-700 font-semibold">
                Built with security in mind
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
