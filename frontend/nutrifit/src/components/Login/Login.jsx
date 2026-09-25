
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!formData.email || !formData.password) {
      setMessage("Please fill all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://nutrifit.alwaysdata.net/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (response.ok && data.success) {

        // Save JWT token
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // Save logged-in user's email
        localStorage.setItem("loginEmail", formData.email);

        setMessage(
          data.message || "Login successful!"
        );

        // Directly go to Get Started
        setTimeout(() => {
          navigate("/");
        }, 800);

      } else {
        setMessage(
          data.message || "Invalid email or password."
        );
      }

    } catch (error) {
      console.error("Login Error:", error);
      setMessage("Unable to connect to server.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      <div className="login-card">

        {/* BACK ARROW */}
        <button
          className="back-arrow"
          type="button"
          onClick={() => navigate("/register")}
        >
          ←
        </button>

        {/* HEADING */}
        <h1>Welcome back</h1>

        <p className="login-subtitle">
          Login to your account
        </p>

        <form onSubmit={handleLogin}>

          {/* EMAIL */}
          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />

          </div>

          {/* PASSWORD */}
          <div className="form-group password-group">

            <label>Password</label>

            <div className="password-wrapper">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="eye-button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "◉" : "◌"}
              </button>

            </div>

          </div>

          {/* FORGOT PASSWORD */}
          <div className="forgot-wrapper">

            <button
              type="button"
              onClick={() =>
                navigate("/forgot-password")
              }
            >
              Forgot Password?
            </button>

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        {/* MESSAGE */}
        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        {/* DIVIDER */}
        <div className="bottom-line"></div>

        {/* CREATE ACCOUNT */}
        <div className="create-account">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/signup")
            }
          >
            Create Account
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;

