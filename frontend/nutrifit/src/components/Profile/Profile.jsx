import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Flask Backend URL
  const API_URL = "https://nutrifit.alwaysdata.net";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      // Token nahi hai
      if (!token) {
        navigate("/login");
        return;
      }

      // IMPORTANT:
      // Backend route /my_profile hai
      const response = await fetch(`${API_URL}/my_profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data = {};

      try {
        data = await response.json();
      } catch (error) {
        throw new Error("Invalid response received from server.");
      }

      // Token invalid / expired
      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/get-started");
        return;
      }

      // Other errors
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to fetch profile."
        );
      }

      // Backend response:
      // {
      //   success: true,
      //   user: {...},
      //   health_information: {...}
      // }

      if (data.success) {
        setProfile(data.user || null);
        setHealthInfo(data.health_information || null);
      } else {
        setError(
          data.message || "Could not load your profile."
        );
      }

    } catch (err) {
      console.error("Profile Error:", err);

      if (
        err.name === "TypeError" &&
        err.message === "Failed to fetch"
      ) {
        setError(
          "Unable to connect to the server. Please make sure your Flask backend is running."
        );
      } else {
        setError(
          err.message || "Something went wrong."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (err) {
      console.error("Logout Error:", err);
    } finally {
      // Logout only ends the login session.
      // User database data will NOT be deleted.
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // =========================
  // SIGN OUT / DELETE ACCOUNT
  // =========================
  const handleSignOut = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.clear();
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/delete_account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data = {};

      try {
        data = await response.json();
      } catch (err) {
        console.error("Invalid response from server.");
      }

      if (response.ok && data.success) {
        // Account and all related user data deleted.
        localStorage.clear();
        navigate("/");
      } else {
        alert(
          data.message ||
            "Unable to delete your account. Please try again."
        );
      }

    } catch (err) {
      console.error("Sign Out Error:", err);

      alert(
        "Unable to connect to the server. Please make sure your Flask backend is running."
      );
    }
  };

  // =========================
  // CLOSE PROFILE
  // =========================

  const handleCloseProfile = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-loading">

        <button
          type="button"
          className="profile-close-btn"
          onClick={handleCloseProfile}
          aria-label="Close profile"
        >
          ×
        </button>

          <div className="loading-spinner"></div>

          <p>
            Loading your profile...
          </p>

        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-error">

        <button
          type="button"
          className="profile-close-btn"
          onClick={handleCloseProfile}
          aria-label="Close profile"
        >
          ×
        </button>

          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Profile
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="edit-btn"
            onClick={fetchProfile}
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // =========================
  // NO PROFILE
  // =========================

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-error">

          <div className="error-icon">
            👤
          </div>

          <h2>
            No Profile Found
          </h2>

          <p>
            Please complete your profile first.
          </p>

          <button
            type="button"
            className="edit-btn"
            onClick={() => navigate("/edit-profile")}
          >
            Complete Profile
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      <div className="profile-card">

        <button
          type="button"
          className="profile-close-btn"
          onClick={handleCloseProfile}
          aria-label="Close profile"
        >
          ×
        </button>

        {/* =========================
            HEADER
        ========================== */}

        <div className="profile-top">

          <div className="profile-avatar">
            👤
          </div>

          <div className="profile-user">

            <h2>
              {profile.name || "User"}
            </h2>

            <p>
              {profile.email || "No email available"}
            </p>

          </div>

        </div>


        {/* =========================
            PERSONAL INFORMATION
        ========================== */}

        <div className="profile-section">

          <h3>
            Personal Information
          </h3>

          <div className="profile-row">

            <span>
              Age
            </span>

            <strong>
              {profile.age !== null &&
              profile.age !== undefined &&
              profile.age !== ""
                ? `${profile.age} years`
                : "Not set"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              Gender
            </span>

            <strong>
              {profile.gender || "Not set"}
            </strong>

          </div>

        </div>


        {/* =========================
            BODY INFORMATION
        ========================== */}

        <div className="profile-section">

          <h3>
            Body Information
          </h3>

          <div className="profile-row">

            <span>
              Weight
            </span>

            <strong>
              {profile.weight !== null &&
              profile.weight !== undefined &&
              profile.weight !== ""
                ? `${profile.weight} kg`
                : "Not set"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              Height
            </span>

            <strong>
              {profile.height !== null &&
              profile.height !== undefined &&
              profile.height !== ""
                ? `${profile.height} cm`
                : "Not set"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              BMI
            </span>

            <strong>
              {healthInfo &&
              healthInfo.bmi !== null &&
              healthInfo.bmi !== undefined
                ? Number(healthInfo.bmi).toFixed(1)
                : "Not calculated"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              BMI Category
            </span>

            <strong>
              {healthInfo &&
              healthInfo.bmi_category
                ? healthInfo.bmi_category
                : "Not available"}
            </strong>

          </div>

        </div>


        {/* =========================
            NUTRITION PREFERENCES
        ========================== */}

        <div className="profile-section">

          <h3>
            Nutrition Preferences
          </h3>

          <div className="profile-row">

            <span>
              Activity
            </span>

            <strong>
              {profile.activity_level || "Not set"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              Goal
            </span>

            <strong>
              {profile.goal || "Not set"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              Food Preference
            </span>

            <strong>
              {profile.food_preference || "Not set"}
            </strong>

          </div>

          <div className="profile-row">

            <span>
              Budget
            </span>

            <strong>
              {profile.budget_level || "Not set"}
            </strong>

          </div>

        </div>


        {/* =========================
            CALORIE INFORMATION
        ========================== */}

        {healthInfo && (
          <div className="profile-section">

            <h3>
              Calorie Information
            </h3>

            <div className="profile-row">

              <span>
                BMR
              </span>

              <strong>
                {healthInfo.bmr
                  ? `${healthInfo.bmr} kcal`
                  : "Not calculated"}
              </strong>

            </div>

            <div className="profile-row">

              <span>
                Maintenance Calories
              </span>

              <strong>
                {healthInfo.maintenance_calories
                  ? `${healthInfo.maintenance_calories} kcal`
                  : "Not calculated"}
              </strong>

            </div>

            <div className="profile-row">

              <span>
                Recommended Daily Calories
              </span>

              <strong>
                {healthInfo.recommended_daily_calories
                  ? `${healthInfo.recommended_daily_calories} kcal`
                  : "Not calculated"}
              </strong>

            </div>

          </div>
        )}


        {/* =========================
            BUTTONS
        ========================== */}

        <div className="profile-actions">

          <button
            type="button"
            className="edit-btn"
            onClick={() =>
              navigate("/get-started", {
                state: { editMode: true },
              })
            }
          >
             Edit Profile
          </button>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
             Logout
          </button>

          <button
            type="button"
            className="signout-btn"
            onClick={handleSignOut}
          >
            Sign Out
          </button>

        </div>

      </div>

    </div>
  );
}

export default Profile;
