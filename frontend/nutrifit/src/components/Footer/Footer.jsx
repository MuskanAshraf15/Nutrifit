import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();

  // Scroll to a section on the current page
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Go to Home first, then scroll to section
  const goToHomeSection = (sectionId) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      
      // Wait for Home page to load
      setTimeout(() => {
        const section = document.getElementById(sectionId);

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    } else {
      scrollToSection(sectionId);
    }
  };

  // Go to Home
  const goHome = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* ===== Brand ===== */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-nutri">Nutri</span>
            <span className="footer-logo-fit">Fit</span>
          </Link>

          <p>
            Eat better. Live healthier.
            <br />
            NutriFit makes personalized nutrition
            <br />
            simple, practical, and affordable.
          </p>
        </div>

        {/* ===== Quick Links ===== */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <button type="button" onClick={()=> navigate('/')}>
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate("/works")}
          >
            How It Works
          </button>

          <button
            type="button"
            onClick={() => navigate("/about")}
          >
            About Us
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact")}
          >
            Contact Us
          </button>
        </div>

        {/* ===== Help ===== */}
        <div className="footer-column">
          <h3>Help</h3>

          <button
            type="button"
            onClick={() => navigate("/works")}
          >
            How It Works
          </button>

          <button type="button" onClick={()=> navigate('/get-started')}>
            Getting Started
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact")}
          >
            Contact Support
          </button>
        </div>

        {/* ===== Contact ===== */}
        <div className="footer-column footer-contact">
          <h3>Get In Touch</h3>

          <p>
            Have a question or need help?
            <br />
            Our admin team is here to assist you.
          </p>

          <button
            type="button"
            className="footer-contact-btn"
            onClick={() => navigate("/contact")}
          >
            Contact Us →
          </button>
        </div>

      </div>

      {/* ===== Bottom ===== */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2026 NutriFit. All Rights Reserved.</p>

          <p>Made for healthier food choices.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
