import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MealPlan.css";

function MealPlan() {
  const navigate = useNavigate();

  const [meals, setMeals] = useState({
    Breakfast: null,
    Lunch: null,
    Dinner: null,
  });

  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [changeIndex, setChangeIndex] = useState(0);
  const [error, setError] = useState("");

  const [savingRecommendation, setSavingRecommendation] = useState(false);

  const token = localStorage.getItem("token");

  const mealNames = ["Breakfast", "Lunch", "Dinner"];

  // =========================================================
  // KEEP SEPARATE HISTORY FOR EACH MEAL
  // =========================================================

  const [mealHistory, setMealHistory] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
  });

  // =========================================================
  // FEEDBACK STATES
  // =========================================================

  const [feedback, setFeedback] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [followed, setFollowed] = useState("");
  const [feedbackMeal, setFeedbackMeal] = useState("Breakfast");

  // =========================================================
  // GET RECOMMENDATION FROM BACKEND
  // =========================================================

  const getRecommendation = async (meal, excludeIds = []) => {
    let url = `https://nutrifit.alwaysdata.net/recommend_food?meal=${encodeURIComponent(
      meal
    )}`;

    // Send ALL previously shown food IDs for this meal
    if (excludeIds.length > 0) {
      url += `&exclude_ids=${excludeIds.join(",")}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || `Unable to get ${meal} recommendation.`
      );
    }

    return data;
  };

  // =========================================================
  // LOAD ALL MEALS
  // =========================================================

  const loadMeals = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [breakfast, lunch, dinner] = await Promise.all([
        getRecommendation("Breakfast"),
        getRecommendation("Lunch"),
        getRecommendation("Dinner"),
      ]);

      setMeals({
        Breakfast: breakfast,
        Lunch: lunch,
        Dinner: dinner,
      });

      // First food of every meal becomes the beginning
      // of that meal's cycle.
      setMealHistory({
        Breakfast: breakfast?.recommendation?.food_id
          ? [breakfast.recommendation.food_id]
          : [],
        Lunch: lunch?.recommendation?.food_id
          ? [lunch.recommendation.food_id]
          : [],
        Dinner: dinner?.recommendation?.food_id
          ? [dinner.recommendation.food_id]
          : [],
      });

      setChangeIndex(0);
    } catch (err) {
      console.error("Meal Plan Error:", err);
      setError(err.message || "Unable to load meal plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  // =========================================================
  // AUTO SCROLL TO THE ACTUAL MEAL PLAN
  // =========================================================

  useEffect(() => {
    if (
      !loading &&
      (
        meals.Breakfast ||
        meals.Lunch ||
        meals.Dinner
      )
    ) {
      const planSection =
        document.getElementById("my-full-plan");

      if (planSection) {
        setTimeout(() => {
          planSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [loading]);

  // =========================================================
  // CHANGE RECOMMENDATION
  //
  // Breakfast -> Lunch -> Dinner -> Breakfast
  //
  // IMPORTANT:
  // Every meal has its own history.
  // =========================================================

  const changeRecommendation = async (selectedMealName = null) => {
    if (changing) {
      return;
    }

    const currentMealName =
      selectedMealName || mealNames[changeIndex];
    const currentMeal = meals[currentMealName];

    if (!currentMeal?.recommendation?.food_id) {
      setError(
        `No previous ${currentMealName} recommendation found.`
      );
      return;
    }

    const history = mealHistory[currentMealName] || [];

    setChanging(true);
    setError("");

    try {
      // -------------------------------------------------------
      // FIRST TRY:
      // Ask backend for a food that has NOT been shown before
      // -------------------------------------------------------

      let newMeal = await getRecommendation(
        currentMealName,
        history
      );

      let newFoodId = newMeal?.recommendation?.food_id;

      // -------------------------------------------------------
      // SAFETY CHECK
      //
      // If backend somehow returns a food already in history,
      // don't silently accept it.
      // -------------------------------------------------------

      if (newFoodId && history.includes(newFoodId)) {
        console.warn(
          `${currentMealName}: backend returned an already used food.`
        );

        // Try once again with the complete history.
        newMeal = await getRecommendation(
          currentMealName,
          history
        );

        newFoodId = newMeal?.recommendation?.food_id;
      }

      // -------------------------------------------------------
      // IF WE STILL RECEIVE SAME FOOD
      //
      // This means backend has exhausted available unique foods
      // and has started the cycle again.
      //
      // Reset this meal's history and accept the new cycle.
      // -------------------------------------------------------

      if (newFoodId && history.includes(newFoodId)) {
        console.log(
          `${currentMealName}: unique foods exhausted. Starting new cycle.`
        );

        setMealHistory((previous) => ({
          ...previous,
          [currentMealName]: [newFoodId],
        }));
      } else if (newFoodId) {
        // -----------------------------------------------------
        // NORMAL CASE:
        // Add new food to this meal's history
        // -----------------------------------------------------

        setMealHistory((previous) => ({
          ...previous,
          [currentMealName]: [
            ...(previous[currentMealName] || []),
            newFoodId,
          ],
        }));
      }

      // -------------------------------------------------------
      // UPDATE CURRENT MEAL
      // -------------------------------------------------------

      setMeals((previous) => ({
        ...previous,
        [currentMealName]: newMeal,
      }));

      // -------------------------------------------------------
      // NEXT CLICK -> NEXT MEAL
      // -------------------------------------------------------

      if (!selectedMealName) {
        setChangeIndex((previous) => {
          return (previous + 1) % mealNames.length;
        });
      }
    } catch (err) {
      console.error(
        `Change ${currentMealName} Error:`,
        err
      );

      setError(
        err.message ||
          `Unable to change ${currentMealName} recommendation.`
      );
    } finally {
      setChanging(false);
    }
  };

  // =========================================================
  // SAVE CURRENT MEAL PLAN TO USER DEVICE
  // =========================================================

  const saveAllRecommendations = () => {
    const currentMeals = mealNames
      .map((mealName) => ({
        mealName,
        food: meals[mealName]?.recommendation,
      }))
      .filter((item) => item.food?.food_id);

    if (currentMeals.length === 0) {
      setError("No recommendations found to save.");
      return;
    }

    setSavingRecommendation(true);
    setError("");

    try {
      const mealPlanText = currentMeals
        .map(({ mealName, food }) => {
          return [
            `${mealName.toUpperCase()}`,
            `Food: ${food.food_name || "Recommended Food"}`,
            `Serving: ${food.portion_grams || 0} g`,
            `Calories: ${food.calories || 0} kcal`,
            `Protein: ${food.protein_g || 0} g`,
            `Carbs: ${food.carbs_g || 0} g`,
            `Fat: ${food.fat_g || 0} g`,
            `Estimated Cost: Rs. ${food.estimated_cost || 0}`,
          ].join("\n");
        })
        .join("\n\n------------------------------\n\n");

      const fileContent =
        `NUTRIFIT - SAVED MEAL PLAN\n\n${mealPlanText}\n\nSaved from NutriFit`;

      const blob = new Blob(
        [fileContent],
        { type: "text/plain;charset=utf-8" }
      );

      const downloadUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;
      link.download =
        `NutriFit_Meal_Plan_${new Date()
          .toISOString()
          .slice(0, 10)}.txt`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(
        "Save Meal Plan Error:",
        err
      );

      setError(
        "Unable to save meal plan to your device."
      );
    } finally {
      setSavingRecommendation(false);
    }
  };


  // =========================================================
  // SUBMIT FEEDBACK
  // =========================================================

  const submitFeedback = async () => {
    const comment = feedback.trim();

    if (!followed) {
      setFeedbackMessage(
        "Please select Yes or No first."
      );
      return;
    }

    if (!comment) {
      setFeedbackMessage(
        "Please write your feedback first."
      );
      return;
    }

    if (!token) {
      navigate("/login");
      return;
    }

    const selectedMeal = meals[feedbackMeal];

    if (!selectedMeal?.recommendation?.food_id) {
      setFeedbackMessage(
        `No ${feedbackMeal} recommendation found.`
      );
      return;
    }

    const foodId =
      selectedMeal.recommendation.food_id;

    setSubmittingFeedback(true);
    setFeedbackMessage("");

    try {
      const response = await fetch(
        "https://nutrifit.alwaysdata.net/feedback",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            followed: followed,
            comment: comment,
            food_id: foodId,
            meal_type: feedbackMeal,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit feedback."
        );
      }

      setFeedback("");
      setFollowed("");

      setFeedbackMessage(
        "✓ Thank you! Your feedback has been saved and will help personalize future recommendations."
      );
    } catch (err) {
      console.error(
        "Feedback Error:",
        err
      );

      setFeedbackMessage(
        err.message ||
          "Unable to submit feedback."
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // =========================================================
  // BACK TO CALORIES SUMMARY WITH EXISTING RECORD
  // =========================================================

  const goBackToCaloriesSummary = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "https://nutrifit.alwaysdata.net/my_profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load calorie summary."
        );
      }

      const user = data.user || {};
      const health =
        data.health_information || {};

      navigate("/calories-summary", {
        state: {
          age: user.age ?? "",
          gender: user.gender ?? "",
          weight: user.weight ?? "",
          height: user.height ?? "",
          activity_level:
            user.activity_level ?? "",
          goal: user.goal ?? "",
          food_preference:
            user.food_preference ?? "",
          budget_level:
            user.budget_level ?? "",

          bmi: health.bmi ?? "",
          category:
            health.bmi_category ?? "",
          bmr: health.bmr ?? "",
          maintenance_calories:
            health.maintenance_calories ?? "",
          daily_calories:
            health.recommended_daily_calories ?? "",
        },
      });
    } catch (err) {
      console.error(
        "Back To Calories Summary Error:",
        err
      );

      setError(
        err.message ||
          "Unable to open calorie summary."
      );
    }
  };


  // =========================================================
  // MEAL CARD
  // =========================================================

  const MealCard = ({
    mealName,
    mealData,
    icon,
    description,
  }) => {
    if (!mealData?.recommendation) {
      return (
        <div className="meal-card empty-meal-card">
          <div className="empty-meal">
            <span>{icon}</span>
            <h3>{mealName}</h3>
            <p>No recommendation available.</p>
          </div>
        </div>
      );
    }

    const food = mealData.recommendation;
    const mealInfo = mealData.meal_information;

    return (
      <div className="meal-card">

        {/* Meal Header */}
        <div className="meal-card-header">

          <div className="meal-icon">
            {icon}
          </div>

          <div>
            <span className="meal-small-label">
              {mealName.toUpperCase()}
            </span>

            <h2>{mealName}</h2>
          </div>

        </div>

        {/* Description */}
        <p className="meal-description">
          {description}
        </p>

        {/* Target */}
        <div className="target-box">

          <span>MEAL TARGET</span>

          <strong>
            {mealInfo?.meal_target_calories || 0}
          </strong>

          <small>
            kcal · {mealInfo?.percentage || 0}%
          </small>

        </div>

        {/* Food Name */}
        <div className="food-name-box">

          <span>RECOMMENDED FOOD</span>

          <h3>
            {food.food_name || "Food"}
          </h3>

        </div>

        {/* Serving */}
        <div className="serving-box">

          <span>🍽️</span>

          <div>

            <small>
              SERVING / PORTION
            </small>

            <strong>
              {food.portion_grams || 0} g
            </strong>

          </div>

        </div>

        {/* Calories */}
        <div className="main-calories">

          <strong>
            {food.calories || 0}
          </strong>

          <span>
            kcal
          </span>

        </div>

        {/* Nutrition */}
        <div className="nutrition-list">

          <div className="nutrition-row">

            <span>
              💪 Protein
            </span>

            <strong>
              {food.protein_g || 0} g
            </strong>

          </div>

          <div className="nutrition-row">

            <span>
              🌾 Carbs
            </span>

            <strong>
              {food.carbs_g || 0} g
            </strong>

          </div>

          <div className="nutrition-row">

            <span>
              🥑 Fat
            </span>

            <strong>
              {food.fat_g || 0} g
            </strong>

          </div>

          <div className="nutrition-row cost-row">

            <span>
              💰 Estimated Cost
            </span>

            <strong>
              Rs. {food.estimated_cost || 0}
            </strong>

          </div>

        </div>

        {/* Change This Meal Recommendation */}
        <button
          type="button"
          className="submit-feedback-btn meal-change-btn"
          onClick={() =>
            changeRecommendation(mealName)
          }
          disabled={changing}
        >
          {changing
            ? "Finding Another Meal..."
            : "Change Recommendation"}
        </button>

      </div>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section className="meal-plan-page">

        <div className="meal-loading">

          <div className="loading-spinner"></div>

          <h2>
            Creating Your Meal Plan
          </h2>

          <p>
            Finding personalized meals for you...
          </p>

        </div>

      </section>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (
    error &&
    !meals.Breakfast &&
    !meals.Lunch &&
    !meals.Dinner
  ) {
    return (
      <section className="meal-plan-page">

        <div className="meal-error">

          <div className="error-icon">
            🥗
          </div>

          <h2>
            Unable to Load Meal Plan
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-btn"
            onClick={loadMeals}
          >
            Try Again
          </button>

        </div>

      </section>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <section className="meal-plan-page">

      <div className="meal-plan-container">

        {/* Back */}
        <button
          className="back-summary-btn"
          onClick={goBackToCaloriesSummary}
        >
          ← Back to Calories Summary
        </button>

        {/* Header */}
        <div className="meal-plan-header">

          <div className="header-icon">
            🥗
          </div>

          <span>
            YOUR PERSONALIZED PLAN
          </span>

          <h1>
            My Full <strong>Meal Plan</strong>
          </h1>

          <p>
            Your meals are personalized according to
            your calorie target, food preference,
            activity level, goal and budget.
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="small-error">
            {error}
          </div>
        )}

        {/* =================================================
            THREE HORIZONTAL MEALS
        ================================================= */}

        <div
          id="my-full-plan"
          className="meals-grid"
        >

          <MealCard
            mealName="Breakfast"
            mealData={meals.Breakfast}
            icon="🌅"
            description="A balanced start to your day."
          />

          <MealCard
            mealName="Lunch"
            mealData={meals.Lunch}
            icon="☀️"
            description="A satisfying midday meal."
          />

          <MealCard
            mealName="Dinner"
            mealData={meals.Dinner}
            icon="🌙"
            description="A nourishing end to your day."
          />

        </div>

        {/* =================================================
            SAVE MEAL PLAN TO DEVICE
        ================================================= */}

        <div className="change-section">

          <p className="change-hint">

            Like your current meal plan?

            <span>
              {" "}Save your Breakfast, Lunch and Dinner
              recommendations directly to your device.
            </span>

          </p>

          <button
            className="change-recommendation-btn"
            onClick={saveAllRecommendations}
            disabled={savingRecommendation}
          >

            {savingRecommendation ? (
              <>
                <span className="small-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                 Save Recommendation
              </>
            )}

          </button>

        </div>

        {/* =================================================
            FEEDBACK SECTION
        ================================================= */}

        <div className="feedback-section">

          <div className="feedback-header">

            <div className="feedback-icon">
              💬
            </div>

            <div>

              <span>
                HELP US PERSONALIZE YOUR PLAN
              </span>

              <h2>
                How was your recommendation?
              </h2>

              <p>
                Tell us which meal you are reviewing,
                whether you followed it, and what you
                liked or didn't like.
              </p>

            </div>

          </div>

          {/* SELECT MEAL */}

          <div className="feedback-meal-select">

            <label>
              Which recommendation are you reviewing?
            </label>

            <select
              value={feedbackMeal}
              onChange={(e) => {
                setFeedbackMeal(e.target.value);
                setFeedbackMessage("");
              }}
            >

              <option value="Breakfast">
                🌅 Breakfast —{" "}
                {meals.Breakfast?.recommendation?.food_name ||
                  "Recommendation"}
              </option>

              <option value="Lunch">
                ☀️ Lunch —{" "}
                {meals.Lunch?.recommendation?.food_name ||
                  "Recommendation"}
              </option>

              <option value="Dinner">
                🌙 Dinner —{" "}
                {meals.Dinner?.recommendation?.food_name ||
                  "Recommendation"}
              </option>

            </select>

          </div>

          {/* YES / NO */}

          <div className="followed-section">

            <label>
              Did you follow this recommendation?
            </label>

            <div className="followed-buttons">

              <button
                type="button"
                className={
                  followed === "Yes"
                    ? "followed-btn selected"
                    : "followed-btn"
                }
                onClick={() => {
                  setFollowed("Yes");
                  setFeedbackMessage("");
                }}
              >
                ✓ Yes
              </button>

              <button
                type="button"
                className={
                  followed === "No"
                    ? "followed-btn selected no-selected"
                    : "followed-btn"
                }
                onClick={() => {
                  setFollowed("No");
                  setFeedbackMessage("");
                }}
              >
                ✕ No
              </button>

            </div>

          </div>

          {/* COMMENT */}

          <textarea
            className="feedback-input"
            value={feedback}
            onChange={(e) =>
              setFeedback(e.target.value)
            }
            placeholder="Example: I like biryani. OR I don't like biryani because it is too oily..."
            rows="4"
            maxLength="2000"
          />

          {/* FEEDBACK BOTTOM */}

          <div className="feedback-bottom">

            <span className="character-count">
              {feedback.length}/2000
            </span>

            <button
              className="submit-feedback-btn"
              onClick={submitFeedback}
              disabled={submittingFeedback}
            >

              {submittingFeedback
                ? "Submitting..."
                : "Submit Feedback →"}

            </button>

          </div>

          {/* MESSAGE */}

          {feedbackMessage && (
            <div
              className={
                feedbackMessage.startsWith("✓")
                  ? "feedback-success"
                  : "feedback-error"
              }
            >
              {feedbackMessage}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="plan-footer">

          <div className="footer-icon">
            ✓
          </div>

          <div>

            <strong>
              Your plan is personalized for you
            </strong>

            <p>
              All recommendations are generated from
              your profile and food dataset.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

export default MealPlan;
