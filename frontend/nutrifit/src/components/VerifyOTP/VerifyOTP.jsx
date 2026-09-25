import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VerifyOTP.css";

function VerifyOTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem("verificationEmail");
  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setMessage("Please enter the OTP");
      return;
    }
    if (otp.length !== 6) {
      setMessage("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "https://nutrifit.alwaysdata.net/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Email verified successfully!");

        localStorage.removeItem("verificationEmail");

        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        setMessage(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    }

    setLoading(false);
  };

  const resendOTP = async () => {
    if (!email) {
      setMessage("Email not found. Please register again.");
      return;
    }

    try {
      const response = await fetch(
        "https://nutrifit.alwaysdata.net/resend-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );

      const data = await response.json();

      setMessage(
        data.message || "A new OTP has been sent to your email."
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to resend OTP");
    }
  };

  return (
    <div className="verify-container">

      <div className="verify-card">

        {/* Left Side */}
        <div className="verify-form-side">

          <div className="verify-content">

            <h1>Verify Your Email</h1>

            <p className="verify-subtitle">
              We have sent a 6-digit verification code
              to your email address.
            </p>

            {email && (
              <p className="verify-email">
                {email}
              </p>
            )}

            <form onSubmit={verifyOTP}>

              <label>Enter OTP</label>

              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                autoComplete="one-time-code"
              />

              <button
                type="submit"
                disabled={loading}
                 onClick={() => navigate("/login")}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>

            </form>

            {message && (
              <p className="verify-message">
                {message}
              </p>
            )}

            <div className="resend-section">
              <span>Didn't receive the code?</span>

              <button
                type="button"
                className="resend-btn"
                onClick={resendOTP}
              >
                Resend OTP
              </button>
            </div>

            <button
              type="button"
              className="back-login"
              onClick={() => navigate("/signup")}
            >
              ← Back to Register
            </button>

          </div>

        </div>

        {/* Right Side */}
        <div className="verify-art-side">

          <div className="verify-blob"></div>
          <div className="verify-blob-small"></div>

          <div className="verify-icon">
            ✉
          </div>

          <h2>Almost There!</h2>

          <p>
            Verify your email to continue
            using NutriFit.
          </p>

        </div>

      </div>

    </div>
  );
}

export default VerifyOTP;