import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

import WhyNutriFit from "../WhyNutriFit/WhyNutriFit";
import HowItWorks from "../HowItWorks/HowItWorks";
import About from "../AboutUs/AboutUs";
import Contact from "../ContactUs/ContactUs";

function Home() {
  return (
    <>
      {/* ================= HERO SECTION ================= */}

      <section className="hero">

        <div className="hero__left">

          <div className="hero__blob"></div>

          <div className="hero__blob2"></div>

          <img
            src="/images/fruit.png"
            alt="Healthy salad bowl"
            className="hero__plate"
          />

          {/* baaki hero code */}

        </div>


        <div className="hero__content">

          <h1 className="hero__title">
            <span className="green-text">Welcome to</span>
            <span className="yellow-text">NutriFit</span>
          </h1>

          <p className="hero__text">
            Not sure what to eat or how much to eat?
            We make it simple. Enter your basic information
            and let our system create calorie-based meal
            recommendations designed around your needs.
          </p>

          <Link to="/get-started" className="hero__btn">
            Get Started
          </Link>

        </div>

      </section>


      {/* ================= WHY NUTRIFIT ================= */}

      <WhyNutriFit />


      {/* ================= HOW IT WORKS ================= */}

      <HowItWorks />


      {/* ================= ABOUT NUTRIFIT ================= */}

      <About />


      {/* ================= CONTACT US ================= */}

      <Contact />

    </>
  );
}

export default Home;