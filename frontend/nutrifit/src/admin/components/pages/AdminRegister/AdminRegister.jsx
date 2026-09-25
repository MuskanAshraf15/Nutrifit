import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminRegister.css";

function AdminRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = "https://nutrifit.alwaysdata.net";

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Admin registration failed."
        );

        setLoading(false);
        return;
      }

      setSuccess(
        "Admin registered successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/admin/login", {
          replace: true,
        });
      }, 1500);
    } catch (error) {
      console.error(
        "Admin registration error:",
        error
      );

      setError(
        "Unable to connect to server. Please make sure Flask backend is running."
      );
    }

    setLoading(false);
  };

  return (
    <div className="admin-register-page">
      <div className="admin-register-card">
        <div className="admin-register-header">
          <div className="admin-register-icon">
            🥗
          </div>

          <h1>NutriFit</h1>

          <p>Admin Panel</p>
        </div>

        <div className="admin-register-title">
          <h2>Admin Registration</h2>

          <p>
            Create the first administrator account
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="admin-form-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Enter admin name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="admin-form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="admin-form-group">
            <label>Password</label>

            <div className="admin-password-wrapper">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-eye-button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="admin-form-group">
            <label>Confirm Password</label>

            <div className="admin-password-wrapper">
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-eye-button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          {success && (
            <div className="admin-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="admin-register-button"
            disabled={loading}
          >
            {loading
              ? "Creating Admin..."
              : "Create Admin Account"}
          </button>
        </form>

        <div className="admin-register-login">
          <p>
            Already have an admin account?
          </p>

          <button
            type="button"
            onClick={() => navigate("/admin/login")}
          >
            Admin Login
          </button>
        </div>

        <div className="admin-register-footer">
          <p>
            NutriFit • Food Recommendation System
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;