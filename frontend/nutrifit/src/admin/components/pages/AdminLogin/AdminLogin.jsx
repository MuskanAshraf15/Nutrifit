import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "https://nutrifit.alwaysdata.net";

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!name || !email || !password) {
      setError("Please enter name, email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid admin details.");
        setLoading(false);
        return;
      }

      if (!data.access_token) {
        setError(
          "Login successful, but admin security token was not received."
        );
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "admin_token",
        data.access_token
      );

      if (data.admin) {
        localStorage.setItem(
          "admin_id",
          data.admin.id
        );

        localStorage.setItem(
          "admin_name",
          data.admin.name
        );

        localStorage.setItem(
          "admin_email",
          data.admin.email
        );
      } else {
        localStorage.setItem(
          "admin_name",
          name
        );

        localStorage.setItem(
          "admin_email",
          email
        );
      }

      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        "Unable to connect to server. Please make sure Flask backend is running."
      );
    }

    setLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-icon">
            🥗
          </div>

          <h1>NutriFit</h1>

          <p>Admin Panel</p>
        </div>

        <div className="admin-login-title">
          <h2>Admin Login</h2>

          <p>
            Sign in to manage your NutriFit system
          </p>
        </div>

        <form onSubmit={handleLogin}>
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
              autoComplete="username"
            />
          </div>

          <div className="admin-form-group">
            <label>Password</label>

            <div className="admin-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-eye-button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Admin Login"}
          </button>

          <div className="admin-login-forgot">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/forgot-password")
              }
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <div className="admin-login-footer">
          <p>
            NutriFit • Food Recommendation System
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;