import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";

import TaxCalendar from "./pages/TaxCalendar";
import Documents from "./pages/Documents";
import TaxEstimatorPage from "./pages/TaxEstimatorPage";

import Settings from "./pages/Settings";
import Placeholder from "./pages/PlaceHolder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Landing />} />
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />

        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/transactions"     element={<Transactions />} />
       
        <Route path="/calendar"         element={<TaxCalendar />} />
        <Route path="/documents"        element={<Documents />} />
        <Route path="/tax-estimator"    element={<TaxEstimatorPage />} />
       
        <Route path="/settings"         element={<Settings />} />
        <Route path="*"                 element={<Placeholder title="Page Not Found" icon="🔍" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
