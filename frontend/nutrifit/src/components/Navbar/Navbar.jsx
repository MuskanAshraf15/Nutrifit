import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">

      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/" onClick={closeMenu}>
          <span className="logo-nutri">Nutri</span>
          <span className="logo-fit">Fit</span>
        </Link>
      </div>

      {/* Hamburger */}
      <button
        type="button"
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation Links */}
      <div className={`navbar-links ${menuOpen ? "menu-open" : ""}`}>

        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          Home
        </NavLink>

        {/* How It Works */}
        <NavLink
          to="/works"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          How It Works
        </NavLink>

        {/* About Us */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          About Us
        </NavLink>

        {/* Contact Us */}
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          Contact Us
        </NavLink>

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

        {/* Login */}
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
            isActive
              ? "profile-link profile-active"
              : "profile-link"
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
