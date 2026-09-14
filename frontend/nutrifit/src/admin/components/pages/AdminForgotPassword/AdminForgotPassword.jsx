import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminForgotPassword.css";

const API_URL = "http://127.0.0.1:5000";

function AdminForgotPassword() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  // =========================================================
  // SEND OTP
  // =========================================================

  const sendOTP = async () => {

    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/forgot_password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email,
            action: "send_otp"
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        setMessage(data.message);

        setStep(2);

      } else {

        setError(
          data.message || "Unable to send OTP."
        );
      }

    } catch (err) {

      setError(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // RESEND OTP
  // =========================================================

  const resendOTP = async () => {

    setMessage("");
    setError("");

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/forgot_password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email,
            action: "resend_otp"
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        setMessage(data.message);

      } else {

        setError(
          data.message || "Unable to resend OTP."
        );
      }

    } catch (err) {

      setError(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // VERIFY OTP
  // =========================================================

  const verifyOTP = async () => {

    setMessage("");
    setError("");

    if (!otp) {

      setError("Please enter the OTP.");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/forgot_password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email,
            otp: otp,
            action: "verify_otp"
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        setMessage(data.message);

        setStep(3);

      } else {

        setError(
          data.message || "Invalid OTP."
        );
      }

    } catch (err) {

      setError(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const resetPassword = async () => {

    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {

      setError(
        "Please enter both password fields."
      );

      return;
    }

    if (newPassword !== confirmPassword) {

      setError(
        "Passwords do not match."
      );

      return;
    }

    if (newPassword.length < 6) {

      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/forgot_password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            email: email,

            otp: otp,

            new_password: newPassword,

            confirm_password: confirmPassword,

            action: "reset_password"

          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {

        setMessage(data.message);

        setTimeout(() => {

          navigate("/admin/login");

        }, 1500);

      } else {

        setError(
          data.message ||
          "Unable to reset password."
        );
      }

    } catch (err) {

      setError(
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="admin-forgot-page">

      <div className="admin-forgot-card">


        {/* HEADER */}

        <div className="admin-forgot-header">

          <div className="admin-forgot-icon">
            🔐
          </div>

          <h1>NutriFit Admin</h1>

          <p>
            Reset your administrator password
          </p>

        </div>


        {/* STEP 1 */}

        {step === 1 && (

          <>

            <div className="admin-forgot-title">

              <h2>Forgot Password?</h2>

              <p>
                Enter your admin email to receive an OTP.
              </p>

            </div>


            {error && (
              <div className="admin-forgot-error">
                {error}
              </div>
            )}

            {message && (
              <div className="admin-forgot-success">
                {message}
              </div>
            )}


            <div className="admin-forgot-form-group">

              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>


            <button
              className="admin-forgot-button"
              onClick={sendOTP}
              disabled={loading}
            >

              {loading
                ? "Sending..."
                : "Send OTP"}

            </button>

          </>

        )}


        {/* STEP 2 */}

        {step === 2 && (

          <>

            <div className="admin-forgot-title">

              <h2>Verify OTP</h2>

              <p>
                Enter the OTP sent to
              </p>

              <strong>
                {email}
              </strong>

            </div>


            {error && (
              <div className="admin-forgot-error">
                {error}
              </div>
            )}

            {message && (
              <div className="admin-forgot-success">
                {message}
              </div>
            )}


            <div className="admin-forgot-form-group">

              <label>OTP</label>

              <input
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
              />

            </div>


            <button
              className="admin-forgot-button"
              onClick={verifyOTP}
              disabled={loading}
            >

              {loading
                ? "Verifying..."
                : "Verify OTP"}

            </button>


            <div className="admin-resend">

              <span>
                Didn't receive OTP?
              </span>

              <button
                type="button"
                onClick={resendOTP}
                disabled={loading}
              >
                Resend OTP
              </button>

            </div>

          </>

        )}


        {/* STEP 3 */}

        {step === 3 && (

          <>

            <div className="admin-forgot-title">

              <h2>Reset Password</h2>

              <p>
                Create your new admin password.
              </p>

            </div>


            {error && (
              <div className="admin-forgot-error">
                {error}
              </div>
            )}

            {message && (
              <div className="admin-forgot-success">
                {message}
              </div>
            )}


            {/* NEW PASSWORD */}

            <div className="admin-forgot-form-group">

              <label>New Password</label>

              <div className="admin-forgot-password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="admin-forgot-eye-button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >

                  {showPassword
                    ? "🙈"
                    : "👁️"}

                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="admin-forgot-form-group">

              <label>
                Confirm Password
              </label>

              <div className="admin-forgot-password-wrapper">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="admin-forgot-eye-button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >

                  {showConfirmPassword
                    ? "🙈"
                    : "👁️"}

                </button>

              </div>

            </div>


            <button
              className="admin-forgot-button"
              onClick={resetPassword}
              disabled={loading}
            >

              {loading
                ? "Updating..."
                : "Change Password"}

            </button>

          </>

        )}


        {/* LOGIN */}

        <div className="admin-forgot-login">

          <p>
            Remember your password?
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/login")
            }
          >
            Back to Admin Login
          </button>

        </div>


        {/* FOOTER */}

        <div className="admin-forgot-footer">

          NutriFit Admin Panel

        </div>

      </div>

    </div>

  );
}

export default AdminForgotPassword;