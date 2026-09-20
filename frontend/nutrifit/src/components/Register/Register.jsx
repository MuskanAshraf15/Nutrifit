import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function getStrength(password) {
  if (password.length === 0) return null;

  if (password.length < 6) {
    return {
      label: "Weak",
      cls: "strength-weak"
    };
  }

  if (password.length < 10) {
    return {
      label: "Medium",
      cls: "strength-medium"
    };
  }

  return {
    label: "Strong",
    cls: "strength-strong"
  };
}

const EyeOpen = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(formData.password);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setMessage("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      setMessage("Please fill all fields.");
      setMessageType("error");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(
          "verificationEmail",
          data.email
        );

        setMessage(data.message);
        setMessageType("success");

        setTimeout(() => {
          navigate("/verify-otp");
        }, 1000);
      } else {
        setMessage(
          data.message || "Registration failed."
        );
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Unable to connect to server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">

      <div className="register-box">

        {/* ================= LEFT ================= */}

        <div className="register-form-side">

          {/* LOGO */}
          <div className="navbar-logo">
            <a href="/">
              <span className="logo-nutri">Nutri</span>
              <span className="logo-fit">Fit</span>
            </a>
          </div>

          <h2>Create your account</h2>

          <p className="subtitle">
            Join NutriFit and start your healthy journey.
          </p>

          {/* ================= FORM ================= */}

          <form onSubmit={handleRegister}>

            {/* FULL NAME */}
            <div className="form-group">

              <label>Full Name</label>

              <div className="input-wrapper">

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* EMAIL */}
            <div className="form-group">

              <label>Email</label>

              <div className="input-wrapper">

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="form-group">

              <label>Password</label>

              <div className="password-wrapper">

                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff />
                  ) : (
                    <EyeOpen />
                  )}
                </button>

              </div>

              {/* PASSWORD STRENGTH */}
              {strength && (
                <p
                  className={`strength-text ${strength.cls}`}
                >
                  Password strength:{" "}
                  <strong>{strength.label}</strong>
                </p>
              )}

            </div>

            {/* CREATE ACCOUNT BUTTON */}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* MESSAGE */}

          {message && (
            <p
              className={`register-message ${
                messageType === "success"
                  ? "success"
                  : ""
              }`}
            >
              {message}
            </p>
          )}

          {/* LOGIN */}

          <p className="login-link">
            Already have an account?
            <span
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>

        </div>

        {/* ================= RIGHT ================= */}

        <div className="register-art-side">

          {/* MAIN ORGANIC PISTA BLOB */}
          <div className="organic-blob"></div>

          {/* SECOND BLOB */}
          <div className="organic-blob-small"></div>

          {/* DECORATIVE SMALL CIRCLES */}
          <span className="green-dot dot1"></span>
          <span className="green-dot dot2"></span>
          <span className="green-dot dot3"></span>
          <span className="green-dot dot4"></span>
          <span className="green-dot dot5"></span>

          {/* LEAVES */}
          <span className="leaf leaf1"></span>
          <span className="leaf leaf2"></span>
          <span className="leaf leaf3"></span>

          {/* AVOCADO IMAGE */}
          <img
            src="/avocado.png"
            alt="Fresh Avocado"
            className="avocado-image"
          />

        </div>

      </div>

    </div>
  );
}

export default Register;