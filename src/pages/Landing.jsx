import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeatureCard from "../components/FeatureCard";
import SectionTitle from "../components/SectionTitle";

const Landing = () => {
  return (
    <div className="bg-gray-50">
      <Navbar />

      {/* HERO */}
     <section className="relative bg-gradient-to-b from-white to-blue-50">
  <div className="max-w-7xl mx-auto px-4 py-28 text-center">

    {/* Headline */}
    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
      Manage Income, Track Expenses &
      <span className="text-blue-600"> Estimate Taxes</span> — All in One Place
    </h1>

    {/* Subtext */}
    <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
      A secure financial dashboard built for freelancers and professionals
      who need clarity, control and confidence over their finances.
    </p>

    {/* CTA */}
    <div className="mt-10">
      <a
        href="#features"
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg shadow-md transition duration-200"
      >
        Explore Features
      </a>
    </div>

  </div>
</section>


      {/* WHY TAXPAL */}
      {/* FEATURES */}
<section id="features" className="bg-white">
  <div className="max-w-6xl mx-auto px-6 py-24">

    {/* Section Title */}
    <SectionTitle
  title="Built for Financial Clarity"
  subtitle="TaxPal centralizes income tracking, budgeting and tax estimation into one structured and secure platform."
/>


    {/* Feature Grid */}
    <div className="grid md:grid-cols-3 gap-10">

     <FeatureCard
  icon="💰"
  title="Income & Expense Tracking"
  desc="Log transactions, categorize expenses and monitor your financial flow in real time."
/>

<FeatureCard
  icon="📊"
  title="Smart Budget Management"
  desc="Set monthly spending limits and track performance with clear financial insights."
/>

<FeatureCard
  icon="🧾"
  title="Automated Tax Estimation"
  desc="Instantly calculate quarterly tax estimates based on your income and expense data."
/>

    </div>

  </div>
</section>
{/* HOW IT WORKS */}
<section id="how-it-works" className="bg-gray-50">
  <div className="max-w-6xl mx-auto px-6 py-24">

    {/* Section Title */}
   <SectionTitle
  title="How It Works"
  subtitle="A simple four-step process designed for freelancers and professionals."
/>


    {/* Steps Grid */}
    <div className="grid md:grid-cols-4 gap-10 text-center">

      {/* Step 1 */}
      <div>
        <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
          1
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Create Account
        </h3>
        <p className="text-sm text-gray-600">
          Sign up securely and access your personal dashboard.
        </p>
      </div>

      {/* Step 2 */}
      <div>
        <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
          2
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Log Transactions
        </h3>
        <p className="text-sm text-gray-600">
          Add income and expenses with proper categorization.
        </p>
      </div>

      {/* Step 3 */}
      <div>
        <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
          3
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Track Budget
        </h3>
        <p className="text-sm text-gray-600">
          Monitor spending trends and stay within limits.
        </p>
      </div>

      {/* Step 4 */}
      <div>
        <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
          4
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          Estimate Taxes
        </h3>
        <p className="text-sm text-gray-600">
          Instantly generate quarterly tax estimates.
        </p>
      </div>

    </div>

  </div>
</section>
{/* SECURITY */}
<section id="security" className="bg-white">
  <div className="max-w-6xl mx-auto px-6 py-24">

    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* Left Content */}
      <div>
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
          Security & Privacy First
        </h2>

        <p className="text-gray-600 mb-8">
          TaxPal is built with security at its core. Your financial data
          remains protected through encrypted sessions and secure authentication systems.
        </p>

        <ul className="space-y-4 text-gray-700 text-sm">
          <li>✔ Secure JWT-based Authentication</li>
          <li>✔ Encrypted Data Handling</li>
          <li>✔ Protected User Sessions</li>
          <li>✔ Privacy-Focused Architecture</li>
        </ul>
      </div>

      {/* Right Visual Block */}
      <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
        <div className="text-5xl font-bold text-blue-600 mb-4">
          🔒
        </div>
        <p className="text-gray-700 font-medium">
          Your financial data stays private and secure.
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
