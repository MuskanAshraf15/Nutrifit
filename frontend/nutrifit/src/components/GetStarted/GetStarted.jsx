import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GetStarted.css";

function GetStarted() {
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = location.state?.editMode === true;

  const [formData, setFormData] = useState(() => {
    const token = localStorage.getItem("token");
    const savedToken = localStorage.getItem("getStartedFormToken");
    const savedFormData = localStorage.getItem("getStartedFormData");

    if (savedFormData && token && savedToken === token) {
      try {
        return JSON.parse(savedFormData);
      } catch (error) {
        console.error("SAVED FORM DATA ERROR:", error);
      }
    }

    return {
      age: "",
      gender: "",
      weight: "",
      height: "",
      activity_level: "",
      goal: "",
      food_preference: "",
      budget_level: "",
    };
  });

  useEffect(() => {
    const loadExistingProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const savedToken = localStorage.getItem("getStartedFormToken");
      const savedFormData = localStorage.getItem("getStartedFormData");

      if (savedFormData && savedToken === token) {
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

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          const existingProfile = {
            age: data.user.age ?? "",
            gender: data.user.gender ?? "",
            weight: data.user.weight ?? "",
            height: data.user.height ?? "",
            activity_level:
              data.user.activity_level ?? "",
            goal: data.user.goal ?? "",
            food_preference:
              data.user.food_preference ?? "",
            budget_level:
              data.user.budget_level ?? "",
          };

          setFormData(existingProfile);
        }
      } catch (error) {
        console.error(
          "LOAD EXISTING PROFILE ERROR:",
          error
        );
      }
    };

    loadExistingProfile();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    localStorage.setItem(
      "getStartedFormData",
      JSON.stringify(formData)
    );

    localStorage.setItem(
      "getStartedFormToken",
      token
    );
  }, [formData]);

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

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      const saveProfileResponse = await fetch(
        "https://nutrifit.alwaysdata.net/save_profile",
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

      const progressResponse = await fetch(
        "https://nutrifit.alwaysdata.net/progress",
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

      const response = await fetch(
        "https://nutrifit.alwaysdata.net/calculate_calories",
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

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

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

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
          });
        });
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

        <div className="get-started-header">

          <div className="get-started-icon">
            🥗
          </div>

          <span>
            {isEditMode ? "EDIT PROFILE" : "GET STARTED"}
          </span>

          <h1>
            {isEditMode ? (
              <>Edit <strong>Profile</strong></>
            ) : (
              <>Tell Us About <strong>You</strong></>
            )}
          </h1>

          <p>
            {isEditMode
              ? "Update your personal information below."
              : "Enter your information to get personalized calorie-based food recommendations."}
          </p>

        </div>

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

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
