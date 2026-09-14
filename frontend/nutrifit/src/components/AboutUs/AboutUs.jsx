import React from "react";
import "./AboutUs.css";
import fruitsImage from "./fruits.png";
import healthyBowlImage from "./healthy-bowl.png";
import { Link } from "react-router-dom";

function About() {
  return (
    <section className="about-section" id="about">

      {/* ================= ABOUT NUTRIFIT ================= */}
      <div className="about-container">

        <div className="about-image">
          <img
            src={fruitsImage}
            alt="Fresh healthy fruits"
          />
        </div>

        <div className="about-content">
          <span className="about-small-title">
            ABOUT NUTRIFIT
          </span>

          <h1>
            Eat Better. <span>Live Healthier.</span>
          </h1>

          <p>
            NutriFit is a personalized calorie-based food recommendation
            system designed to make healthy eating simple, practical,
            and affordable.
          </p>

          <p>
            It helps you understand your daily calorie needs and discover
            suitable meal options based on your personal information,
            fitness goal, food preferences, and budget.
          </p>

          <p>
            Our goal is to make healthy food choices easier without making
            your everyday eating complicated.
          </p>
        </div>

      </div>

      {/* ================= OUR PURPOSE ================= */}
      <div className="purpose-section">

        <div className="section-heading">
          <span>OUR PURPOSE</span>

          <h2>Making Healthy Eating Easier</h2>

          <p>
            NutriFit helps you make better food choices according to
            your individual needs, lifestyle, and goals.
          </p>
        </div>

        <div className="purpose-cards">

          <div className="purpose-card">
            <div className="purpose-icon">🥗</div>

            <h3>Personalized Meals</h3>

            <p>
              Get meal recommendations based on your age, body
              information, activity level, fitness goal, and food
              preferences.
            </p>
          </div>

          <div className="purpose-card">
            <div className="purpose-icon">🔥</div>

            <h3>Calorie-Based Plans</h3>

            <p>
              Understand your daily calorie requirement and choose
              meals that support your weight and fitness goals.
            </p>
          </div>

          <div className="purpose-card">
            <div className="purpose-icon">💰</div>

            <h3>Affordable Choices</h3>

            <p>
              Find suitable food recommendations according to your
              budget, making healthy eating practical and accessible.
            </p>
          </div>

        </div>
      </div>

      {/* ================= WHAT WE OFFER ================= */}
      <div className="offer-container">

        <div className="offer-content">

          <span className="offer-small-title">
            WHAT WE OFFER
          </span>

          <h2>
            Everything You Need for a
            <span> Better Food Journey</span>
          </h2>

          <p className="offer-intro">
            NutriFit provides simple tools to help you understand your
            nutritional needs and build better daily eating habits.
          </p>

          <ul className="offer-list">

            <li>
              <span>✓</span>
              Daily calorie requirement calculation
            </li>

            <li>
              <span>✓</span>
              Personalized breakfast, lunch, and dinner recommendations
            </li>

            <li>
              <span>✓</span>
              Support for weight loss, weight gain, and weight maintenance
            </li>

            <li>
              <span>✓</span>
              Food recommendations based on your food preferences
            </li>

            <li>
              <span>✓</span>
              Budget-friendly food choices
            </li>

            <li>
              <span>✓</span>
              Progress tracking to help you stay motivated
            </li>

          </ul>

        </div>

        <div className="offer-image">
          <img
            src={healthyBowlImage}
            alt="Healthy bowl with fresh vegetables"
          />
        </div>

      </div>

      {/* ================= WHY CHOOSE NUTRIFIT ================= */}
      <div className="why-section">

        <span className="why-small-title">
          WHY CHOOSE NUTRIFIT?
        </span>

        <h2>
          Your Goals. Your Needs. Your Food.
        </h2>

        <p>
          Everyone has different nutritional needs, lifestyle habits,
          food preferences, and fitness goals. NutriFit focuses on
          creating recommendations around your individual needs instead
          of providing the same plan to everyone.
        </p>

        <p>
          The system considers important information such as your age,
          gender, height, weight, activity level, fitness goal, food
          preference, and budget. Based on these details, your daily
          calorie requirement is calculated and suitable meal options
          are recommended.
        </p>

        <p>
          Whether your goal is to lose weight, gain weight, or maintain
          your current weight, NutriFit helps you make informed food
          choices in a simple and practical way.
        </p>

        <p>
          Our goal is to make healthy eating less confusing and more
          achievable by combining personalized calorie calculations with
          accessible food recommendations.
        </p>

      </div>
      <div className="about-get-started">
  <h2>Ready to Start Your Healthy Journey?</h2>
  <p>
    Get personalized food recommendations that fit your goals,
    lifestyle, and budget.
  </p>

  <Link to="/get-started" className="about-get-started-btn">
    Get Started →
  </Link>
</div>

    </section>
  );
}

export default About;