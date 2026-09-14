import React from "react";
import Navbar from "./components/Navbar/Navbar";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Home from "./components/Home/Home";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import VerifyOTP from "./components/VerifyOTP/VerifyOTP";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import Contact from "./components/ContactUs/ContactUs";
import Footer from "./components/Footer/Footer";
import GetStarted from "./components/GetStarted/GetStarted";
import CaloriesSummary from "./components/CaloriesSummary/CaloriesSummary";
import MealPlan from "./components/MealPlan/MealPlan";
import Dashboard from "./components/Dashboard/Dashboard";
import Profile from "./components/Profile/Profile";
import AdminRegister from "./admin/components/pages/AdminRegister/AdminRegister";
import AdminLogin from "./admin/components/pages/AdminLogin/AdminLogin";
import CreateAdmin from "./admin/components/pages/CreateAdmin/CreateAdmin";
import AdminForgotPassword from "./admin/components/pages/AdminForgotPassword/AdminForgotPassword";
import AdminDashboard from "./admin/components/pages/AdminDashboard/AdminDashboard";
import HowItWorks from "./components/HowItWorks/HowItWorks";
import About from "./components/AboutUs/AboutUs";
import Heartbeat from "./Heartbeat";

function App() {
  return (
    <BrowserRouter>
    
    <Heartbeat />

      {/* Navbar */}
      <Navbar />

      <Routes>

        {/* Home Page
            About Us, How It Works and Contact are sections inside Home */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Contact Us Page */}
        <Route path="/contact" element={<Contact />} />

        {/* Authentication Pages */}
        <Route path="/signup" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/calories-summary" element={<CaloriesSummary />} />
        <Route path="/meal-plan" element={<MealPlan />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />

        {/* Admin Page */}
        <Route path="/admin/signup" element={<AdminRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/create" element={<CreateAdmin />} />
        <Route path="/admin/forgot-password"element={<AdminForgotPassword />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />


        {/* Unknown URL → Home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {/* Footer */}
      <Footer />

    </BrowserRouter>
  );
}

export default App;