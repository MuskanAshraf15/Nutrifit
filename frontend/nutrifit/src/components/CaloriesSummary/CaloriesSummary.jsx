import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CaloriesSummary.css";

function CaloriesSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;

  if (!data) {
    return (
      <section className="calories-summary">
        <div className="summary-card no-data">
          <div className="summary-icon">🥗</div>

          <h2>No Calories Summary Found</h2>

          <p>
            Please complete the Get Started form first.
          </p>

          <button
            onClick={() => navigate("/get-started")}
            className="summary-btn"
          >
            Get Started
          </button>
        </div>
      </section>
    );
  }

  const handleFullPlan = () => {
    navigate("/meal-plan", {
      state: data,
    });
  };

  // Back to profile
  const handleBackToProfile = () => {
    navigate("/get-started", {
      state: data,
    });
  };

  return (
    <section className="calories-summary">

      <div className="summary-wrapper">

        {/* BACK TO PROFILE */}
        <button
          className="back-profile-btn"
          onClick={handleBackToProfile}
        >
          ← Back to Profile
        </button>

        {/* HEADER */}
        <div className="summary-header">

          <div className="summary-icon">
            🥗
          </div>

          <span>YOUR RESULTS</span>

          <h1>
            Calories <strong>Summary</strong>
          </h1>

          <p>
            Here is your personalized calorie summary based on
            your health information and selected goal.
          </p>

        </div>

        {/* SUMMARY CARD */}
        <div className="summary-card">

          {/* BMI */}
          <div className="summary-item">
            <div className="item-icon">⚖️</div>

            <div className="item-info">
              <span>BMI</span>

              <h2>
                {data.bmi}
              </h2>

              <p>
                Body Mass Index
              </p>
            </div>
          </div>

          {/* BMI CATEGORY */}
          <div className="summary-item">
            <div className="item-icon">📊</div>

            <div className="item-info">
              <span>BMI CATEGORY</span>

              <h2>
                {data.category}
              </h2>

              <p>
                Your current BMI category
              </p>
            </div>
          </div>

          {/* BMR */}
          <div className="summary-item">
            <div className="item-icon">🔥</div>

            <div className="item-info">
              <span>BMR</span>

              <h2>
                {data.bmr}
                <small> kcal</small>
              </h2>

              <p>
                Basal Metabolic Rate
              </p>
            </div>
          </div>

          {/* MAINTENANCE CALORIES */}
          <div className="summary-item">
            <div className="item-icon">⚡</div>

            <div className="item-info">
              <span>MAINTENANCE CALORIES</span>

              <h2>
                {data.maintenance_calories}
                <small> kcal</small>
              </h2>

              <p>
                Calories needed to maintain weight
              </p>
            </div>
          </div>

          {/* RECOMMENDED CALORIES */}
          <div className="summary-item recommended">
            <div className="item-icon">🎯</div>

            <div className="item-info">
              <span>RECOMMENDED CALORIES</span>

              <h2>
                {data.daily_calories}
                <small> kcal/day</small>
              </h2>

              <p>
                Your personalized daily calorie target
              </p>
            </div>
          </div>

        </div>

        {/* GOAL COMPATIBILITY MESSAGE */}
        <div
          className={
            data.goal_check?.mismatch
              ? "goal-warning"
              : "goal-success"
          }
        >

          <div className="goal-warning-icon">
            {data.goal_check?.mismatch ? "⚠️" : "✅"}
          </div>

          <div className="goal-warning-content">

            <h3>
              {data.goal_check?.mismatch
                ? "Goal Review Recommended"
                : "Goal Check"}
            </h3>

            <p>
              {data.goal_check?.message ||
                "Your selected goal has been checked with your BMI."}
            </p>

            <span>
              {data.goal_check?.suggestion ||
                "Continue with your selected goal and monitor your progress."}
            </span>

          </div>

        </div>

        {/* FULL PLAN BUTTON */}
        <div className="plan-section">

          <button
            className="full-plan-btn"
            onClick={handleFullPlan}
          >
            See My Full Plan
            <span>→</span>
          </button>

        </div>

      </div>

    </section>
  );
}

export default CaloriesSummary;
