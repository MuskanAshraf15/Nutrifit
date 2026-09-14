import React from "react";
import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    icon: "👤",
    title: "Create Your Account",
    text: "Create your NutriFit account using your name, email and password to get started.",
  },
  {
    number: "02",
    icon: "📋",
    title: "Complete Your Profile",
    text: "Enter your age, gender, height, weight, activity level, food preference and budget.",
  },
  {
    number: "03",
    icon: "🎯",
    title: "Choose Your Goal",
    text: "Select your goal: Weight Loss, Weight Gain or Weight Maintain.",
  },
  {
    number: "04",
    icon: "🔥",
    title: "Calculate Your Calories",
    text: "NutriFit calculates your daily calorie needs based on your personal information and activity level.",
  },
  {
    number: "05",
    icon: "🍽️",
    title: "Get Meal Suggestions",
    text: "Receive personalized breakfast, lunch and dinner recommendations with calories, nutrients and serving sizes.",
  },
  {
    number: "06",
    icon: "📈",
    title: "Track Your Progress",
    text: "Update your weight and keep track of your progress throughout your nutrition journey.",
  },
];

function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">

      <div className="how-header">

        <span className="how-eyebrow">
          HOW IT WORKS
        </span>

        <h2 className="how-heading">
          Your Nutrition Journey,
          <span> Made Simple</span>
        </h2>

        <p className="how-subheading">
          NutriFit makes healthy eating simple. Follow a few
          easy steps and get meal recommendations designed
          around your personal needs and goals.
        </p>

      </div>

      <div className="how-container">

        {steps.map((step, index) => (
          <React.Fragment key={step.number}>

            <div className="how-card">

              <div className="how-top">

                <span className="how-number">
                  {step.number}
                </span>

                <div className="how-icon">
                  {step.icon}
                </div>

              </div>

              <h3>
                {step.title}
              </h3>

              <p>
                {step.text}
              </p>

            </div>

            {index < steps.length - 1 && (
              <div className="how-connector">
                <span>→</span>
              </div>
            )}

          </React.Fragment>
        ))}

      </div>

      <div className="how-bottom">

        <div className="how-bottom-icon">
          🌱
        </div>

        <div>

          <h3>
            Start Your Healthy Journey Today
          </h3>

          <p>
            No complicated planning. Tell NutriFit about
            yourself, choose your goal and get personalized
            meal recommendations that fit your lifestyle.
          </p>

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;

