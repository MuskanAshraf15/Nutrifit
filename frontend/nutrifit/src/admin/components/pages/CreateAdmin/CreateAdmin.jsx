import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateAdmin.css";

const API_URL = "http://127.0.0.1:5000";

function CreateAdmin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${API_URL}/create_admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || "Admin created successfully.");

        setFormData({
          name: "",
          email: "",
          password: "",
        });
      } else {
        setError(data.message || "Failed to create admin.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-admin-page">

      <div className="create-admin-card">

        <div className="create-admin-header">
          <div className="create-admin-icon">👤</div>

          <h1>NutriFit Admin</h1>

          <p>Create a new admin account</p>
        </div>

        <div className="create-admin-title">
          <h2>Create Admin</h2>

          <p>
            Add a new administrator to the system
          </p>
        </div>

        {error && (
          <div className="create-admin-error">
            {error}
          </div>
        )}

        {message && (
          <div className="create-admin-success">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div className="create-admin-form-group">

            <label>Admin Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter admin name"
              value={formData.name}
              onChange={handleChange}
            />

          </div>

          {/* Email */}
          <div className="create-admin-form-group">

            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter admin email"
              value={formData.email}
              onChange={handleChange}
            />

          </div>

          {/* Password */}
          <div className="create-admin-form-group">

            <label>Password</label>

            <div className="create-admin-password-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="create-admin-eye-button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>

            </div>

          </div>

          {/* Button */}
          <button
            type="submit"
            className="create-admin-button"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>

        </form>

        <div className="create-admin-login">

          <p>Already have an admin account?</p>

          <button
            type="button"
            onClick={() => navigate("/admin/login")}
          >
            Go to Admin Login
          </button>

        </div>

        <div className="create-admin-footer">
          NutriFit Admin Panel
        </div>

      </div>

    </div>
  );
}

export default CreateAdmin;