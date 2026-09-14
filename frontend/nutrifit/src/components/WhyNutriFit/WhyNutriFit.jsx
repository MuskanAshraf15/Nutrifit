                                                                                                        import React, { useState } from "react";
import "./WhyNutriFit.css";

const features = [
  {
    icon: "🎯",
    title: "Personalized",
    desc: "Recommendations tailored to your body and goals.",
    modal: {
      title: "Personalized Nutrition",
      text:
        "NutriFit creates meal recommendations based on your personal information and fitness goals. This helps you discover meals that are better suited to your individual calorie and lifestyle needs.",
      listLabel: "What NutriFit considers:",
      list: [
        "Age",
        "Gender",
        "Height & Weight",
        "Activity Level",
        "Fitness Goal",
        "Food Preference",
        "Budget Level",
      ],
    },
  },

  {
    icon: "🔥",
    title: "Calorie-Based",
    desc: "Meals selected according to your daily calorie needs.",
    modal: {
      title: "Calorie-Based Recommendations",
      text:
        "NutriFit calculates your daily calorie needs and uses your calorie target to recommend suitable breakfast, lunch, and dinner options.",
      listLabel: "Your recommendations include:",
      list: [
        "Daily calorie target",
        "Breakfast calories",
        "Lunch calories",
        "Dinner calories",
        "Serving size",
        "Protein",
        "Carbohydrates",
        "Fat",
      ],
    },
  },

  {
    icon: "🍛",
    title: "Food choice",
    desc: "Enjoy your favourite food choices.",
    modal: {
      title: "Pakistani Food Choices",
      text:
        "Healthy eating doesn't have to mean giving up the foods you enjoy. NutriFit focuses on food choices that can easily fit into your daily routine.",
      listLabel: "Enjoy:",
      list: [
        "Everyday food choices",
        "Different meal options",
        "Practical serving sizes",
        "Balanced calorie portions",
      ],
    },
  },

  {
    icon: "💰",
    title: "Budget Friendly",
    desc: "Find meal options that fit your budget.",
    modal: {
      title: "Meals That Fit Your Budget",
      text:
        "NutriFit considers your selected budget when recommending meals, helping you discover food options that are practical and affordable for your lifestyle.",
      listLabel: "Budget options:",
      list: [
        "Low(Rs. 230–400) — Affordable everyday choices",
        "Medium(Rs. 400–650) — More variety within a moderate budget",
        "High(Rs. 650–1,200) — Wider range of meal options",
      ],
    },
  },
];

function WhyNutriFit() {
  const [activeIndex, setActiveIndex] = useState(null);

  const closeModal = () => {
    setActiveIndex(null);
  };

  const activeFeature =
    activeIndex !== null ? features[activeIndex] : null;

  return (
    <section className="why-section" id="why-nutrifit">

      {/* ===== Header ===== */}
      <div className="why-header">

        <span className="why-eyebrow">
          WHY NUTRIFIT?
        </span>

        <h2 className="why-heading">
          Nutrition That Fits Your Life
        </h2>

        <p className="why-subheading">
          Smart nutrition made simple, personalized, and practical for you.
        </p>

      </div>


      {/* ===== Feature Cards ===== */}
      <div className="why-grid">

        {features.map((item, index) => (
          <div className="why-card" key={index}>

            <div className="why-icon">
              {item.icon}
            </div>

            <h3 className="why-title">
              {item.title}
            </h3>

            <p className="why-desc">
              {item.desc}
            </p>

            <button
              type="button"
              className="why-learn-more-btn"
              onClick={() => setActiveIndex(index)}
            >
              Learn More →
            </button>

          </div>
        ))}

      </div>


      {/* ===== Modal ===== */}
      {activeFeature && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="presentation"
        >

          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close Button */}
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>


            {/* Modal Icon */}
            <div className="modal-icon">
              {activeFeature.icon}
            </div>


            {/* Modal Title */}
            <h3 className="modal-title">
              {activeFeature.modal.title}
            </h3>


            {/* Modal Description */}
            <p className="modal-text">
              {activeFeature.modal.text}
            </p>


            {/* List Label */}
            <p className="modal-list-label">
              {activeFeature.modal.listLabel}
            </p>


            {/* Modal List */}
            <ul className="modal-list">

              {activeFeature.modal.list.map((point, index) => (
                <li key={index}>

                  <span className="modal-check">
                    ✓
                  </span>

                  <span>
                    {point}
                  </span>

                </li>
              ))}

            </ul>


            {/* Modal Button */}
            <button
              type="button"
              className="modal-btn"
              onClick={closeModal}
            >
              Got It
            </button>

          </div>
        </div>
      )}

    </section>
  );
}

export default WhyNutriFit;
