import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GetStarted.css";

function GetStarted() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    activity_level: "",
    goal: "",
    food_preference: "",
    budget_level: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const age = Number(formData.age);
    const weight = Number(formData.weight);
    const height = Number(formData.height);

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (age < 10 || age > 100) {
      alert("Age must be between 10 and 100 years.");
      return;
    }

    if (weight < 20 || weight > 300) {
      alert("Weight must be between 20 and 300 kg.");
      return;
    }

    if (height < 100 || height > 250) {
      alert("Height must be between 100 and 250 cm.");
      return;
    }

    try {
      // -----------------------------------------
      // GET JWT TOKEN
      // -----------------------------------------

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      // -----------------------------------------
      // STEP 1: SAVE PROFILE
      // -----------------------------------------

      const saveProfileResponse = await fetch(
        "http://127.0.0.1:5000/save_profile",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(formData),
        }
      );

      const saveProfileResult =
        await saveProfileResponse.json();

      console.log(
        "SAVE PROFILE RESULT:",
        saveProfileResult
      );

      if (
        !saveProfileResponse.ok ||
        !saveProfileResult.success
      ) {
        alert(
          saveProfileResult.message ||
            "Profile could not be saved."
        );
        return;
      }

      // -----------------------------------------
      // STEP 2: SAVE INITIAL WEIGHT PROGRESS
      // -----------------------------------------

      const progressResponse = await fetch(
        "http://127.0.0.1:5000/progress",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            weight: formData.weight,
          }),
        }
      );

      const progressResult =
        await progressResponse.json();

      console.log(
        "SAVE PROGRESS RESULT:",
        progressResult
      );

      if (
        !progressResponse.ok ||
        !progressResult.success
      ) {
        alert(
          progressResult.message ||
            "Weight progress could not be saved."
        );
        return;
      }

      // -----------------------------------------
      // STEP 3: CALCULATE CALORIES
      // -----------------------------------------

      const response = await fetch(
        "http://127.0.0.1:5000/calculate_calories",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      console.log(
        "CALCULATE CALORIES RESULT:",
        result
      );

      if (!response.ok || !result.success) {
        alert(
          result.message ||
            "Calories could not be calculated."
        );
        return;
      }

      // -----------------------------------------
      // STEP 4: GO TO CALORIES SUMMARY
      // -----------------------------------------

      navigate("/calories-summary", {
        state: {
          ...formData,

          bmi: result.bmi,
          category: result.category,
          bmr: result.bmr,
          maintenance_calories:
            result.maintenance_calories,
          daily_calories:
            result.daily_calories,
            goal_check: result.goal_check,
        },
      });
    } catch (error) {
      console.error(
        "GET STARTED ERROR:",
        error
      );

      alert(
        "Unable to connect with backend."
      );
    }
  };

  return (
    <section className="get-started-section">

      <div className="get-started-card">

        {/* Header */}
        <div className="get-started-header">

          <div className="get-started-icon">
            🥗
          </div>

          <span>GET STARTED</span>

          <h1>
            Tell Us About <strong>You</strong>
          </h1>

          <p>
            Enter your information to get personalized
            calorie-based food recommendations.
          </p>

        </div>

        {/* Form */}
        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

          {/* Age */}
          <div className="form-field">

            <label htmlFor="age">
              Age
            </label>

            <input
              type="number"
              id="age"
              name="age"
              min="10"
              max="100"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              required
            />

            <small>
              Age must be between 10 and 100 years.
            </small>

          </div>

          {/* Gender */}
          <div className="form-field">

            <label htmlFor="gender">
              Gender
            </label>

            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >

              <option value="">
                Select gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

            </select>

          </div>

          {/* Weight */}
          <div className="form-field">

            <label htmlFor="weight">
              Weight <span>(kg)</span>
            </label>

            <input
              type="number"
              id="weight"
              name="weight"
              min="20"
              max="300"
              step="0.1"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Enter your weight"
              required
            />

            <small>
              Weight must be between 20 and 300 kg.
            </small>

          </div>

          {/* Height */}
          <div className="form-field">

            <label htmlFor="height">
              Height <span>(cm)</span>
            </label>

            <input
              type="number"
              id="height"
              name="height"
              min="100"
              max="250"
              step="0.1"
              value={formData.height}
              onChange={handleChange}
              placeholder="Enter your height"
              required
            />

            <small>
              Height must be between 100 and 250 cm.
            </small>

          </div>

          {/* Activity Level */}
          <div className="form-field">

            <label htmlFor="activity_level">
              Activity Level
            </label>

            <select
              id="activity_level"
              name="activity_level"
              value={formData.activity_level}
              onChange={handleChange}
              required
            >

              <option value="">
                Select activity level
              </option>

              <option value="Sedentary">
                Sedentary
              </option>

              <option value="Moderate">
                Moderate
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Very Active">
                Very Active
              </option>

            </select>

          </div>

          {/* Goal */}
          <div className="form-field">

            <label htmlFor="goal">
              Goal
            </label>

            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
            >

              <option value="">
                Select your goal
              </option>

              <option value="Weight Loss">
                Weight Loss
              </option>

              <option value="Weight Maintain">
                Weight Maintain
              </option>

              <option value="Weight Gain">
                Weight Gain
              </option>

            </select>

          </div>

          {/* Food Preference */}
          <div className="form-field">

            <label htmlFor="food_preference">
              Food Preference
            </label>

            <select
              id="food_preference"
              name="food_preference"
              value={formData.food_preference}
              onChange={handleChange}
              required
            >

              <option value="">
                Select food preference
              </option>

              <option value="Vegetarian">
                Vegetarian
              </option>

              <option value="Non Vegetarian">
                Non Vegetarian
              </option>

              <option value="Both">
                Both
              </option>

            </select>

          </div>

          {/* Budget */}
          <div className="form-field">

            <label htmlFor="budget_level">
              Budget
            </label>

            <select
              id="budget_level"
              name="budget_level"
              value={formData.budget_level}
              onChange={handleChange}
              required
            >

              <option value="">
                Select your budget
              </option>

              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>

            </select>

          </div>

          {/* Button */}
          <button
            type="submit"
            className="calculate-btn"
          >
            Calculate Calories
            <span>→</span>
          </button>

        </form>

      </div>

    </section>
  );
}

export default GetStarted;
