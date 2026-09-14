import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // STEP 1 - SEND OTP
  // ==========================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/forgot_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            action: "send_otp",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("OTP has been sent to your email.");

        setTimeout(() => {
          setSuccess("");
          setStep(2);
        }, 1000);
      } else {
        setError(data.message || "Unable to send OTP.");
      }
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 2 - VERIFY OTP
  // ==========================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/forgot_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
            action: "verify_otp",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Email verified successfully.");

        setTimeout(() => {
          setSuccess("");
          setStep(3);
        }, 1000);
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/forgot_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            action: "send_otp",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("New OTP has been sent.");
        setOtp("");
      } else {
        setError(data.message || "Unable to resend OTP.");
      }
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 3 - RESET PASSWORD
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/forgot_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
            new_password: newPassword,
            confirm_password: confirmPassword,
            action: "reset_password",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Password reset successfully.");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(data.message || "Unable to reset password.");
      }
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BACK BUTTON
  // ==========================================

  const handleBack = () => {
    setError("");
    setSuccess("");

    if (step === 1) {
      navigate("/login");
    } else if (step === 2) {
      setStep(1);
      setOtp("");
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="forgot-page">

      <div className="forgot-card">

        {/* =====================================
            STEP 1
        ===================================== */}

        {step === 1 && (
          <>
            <h1>Forgot Password?</h1>

            <p className="forgot-subtitle">
              Enter your email address to receive a verification code.
            </p>

            <form onSubmit={handleSendOTP}>

              <div className="forgot-input-group">
                <label>Email Address</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <p className="forgot-error">
                  {error}
                </p>
              )}

              {success && (
                <p className="forgot-success">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

            </form>

            <button
              className="forgot-back-btn"
              onClick={() => navigate("/login")}
            >
              ← Back to Login
            </button>
          </>
        )}

        {/* =====================================
            STEP 2
        ===================================== */}

        {step === 2 && (
          <>
            <h1>Verify OTP</h1>

            <p className="forgot-subtitle">
              Enter the 6-digit code sent to your email.
            </p>

            <p className="forgot-email">
              {email}
            </p>

            <form onSubmit={handleVerifyOTP}>

              <div className="forgot-input-group">
                <label>Verification Code</label>

                <input
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              {error && (
                <p className="forgot-error">
                  {error}
                </p>
              )}

              {success && (
                <p className="forgot-success">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

            </form>

            <button
              className="resend-btn"
              onClick={handleResendOTP}
              disabled={loading}
            >
              Resend OTP
            </button>

            <button
              className="forgot-back-btn"
              onClick={handleBack}
            >
              ← Change Email
            </button>
          </>
        )}

        {/* =====================================
            STEP 3
        ===================================== */}

        {step === 3 && (
          <>
            <h1>Reset Password</h1>

            <p className="forgot-subtitle">
              Create a new password for your account.
            </p>

            <form onSubmit={handleResetPassword}>

              {/* New Password */}

              <div className="forgot-input-group">
                <label>New Password</label>

                <div className="password-wrapper">

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "◉" : "◉"}
                  </button>

                </div>
              </div>

              {/* Confirm Password */}

              <div className="forgot-input-group">
                <label>Confirm Password</label>

                <div className="password-wrapper">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword ? "◉" : "◉"}
                  </button>

                </div>
              </div>

              {error && (
                <p className="forgot-error">
                  {error}
                </p>
              )}

              {success && (
                <p className="forgot-success">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

            </form>

            <button
              className="forgot-back-btn"
              onClick={handleBack}
            >
              ← Back to OTP
            </button>
          </>
        )}

      </div>

    </div>
  );
}

export default ForgotPassword;