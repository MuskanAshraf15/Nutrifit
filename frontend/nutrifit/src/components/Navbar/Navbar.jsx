import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    closeMenu();

    if (location.pathname !== "/") {
      navigate("/");

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
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  const handleHowItWorks = (e) => {
    e.preventDefault();
    scrollToSection("how-it-works");
  };

  const handleAbout = (e) => {
    e.preventDefault();
    scrollToSection("about");
  };

  // Contact Us function
  const handleContact = (e) => {
    e.preventDefault();
    scrollToSection("contact");
  };

  return (
    <nav className="navbar">

      {/* Logo */}
      <div className="navbar-logo">
        <a href="/">
          <span className="logo-nutri">Nutri</span>
          <span className="logo-fit">Fit</span>
        </a>
      </div>

      {/* Hamburger */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation */}
      <div className={`navbar-links ${menuOpen ? "menu-open" : ""}`}>

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          Home
        </NavLink>

        <a
          href="#how-it-works"
          className="nav-link"
          onClick={handleHowItWorks}
        >
          How It Works
        </a>

        <a
          href="#about"
          className="nav-link"
          onClick={handleAbout}
        >
          About Us
        </a>

        {/* Contact Us */}
        <a
          href="#contact"
          className="nav-link"
          onClick={handleContact}
        >
          Contact Us
        </a>

        {/* Progress */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          Progress
        </NavLink>

        <NavLink
          to="/login"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          Login
        </NavLink>

      </div>

      {/* Profile */}
      <div className="navbar-profile">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "profile-link profile-active" : "profile-link"
          }
          onClick={closeMenu}
          aria-label="Profile"
        >
          <div className="profile-icon">👤</div>
        </NavLink>
      </div>

    </nav>
  );
}

export default Navbar;
