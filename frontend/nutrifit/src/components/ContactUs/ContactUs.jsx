import React from "react";
import "./ContactUs.css";

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Thank you! Your message has been submitted successfully.");

    e.target.reset();
  };

  return (
    <section className="contact-section" id="contact">

      {/* Heading */}
      <div className="contact-header">
        <span className="contact-eyebrow">CONTACT US</span>

        <h2>We'd Love to Hear From You</h2>

        <p>
          Have a question, suggestion, or need help with NutriFit?
          Send us a message and our admin team will get back to you.
        </p>
      </div>

      <div className="contact-container">

        {/* Left Side */}
        <div className="contact-info">

          <span className="contact-small-title">
            GET IN TOUCH
          </span>

          <h3>Need Help?</h3>

          <p className="contact-description">
            If you have any questions about your account, calorie
            recommendations, food plans, or any other NutriFit feature,
            you can contact our admin team through this form.
          </p>

          {/* Instructions */}
          <div className="contact-instructions">

            <h4>How to Contact Admin</h4>

            <div className="instruction-item">
              <div className="instruction-icon">📝</div>

              <div>
                <h5>1. Fill Out the Form</h5>
                <p>
                  Enter your name, email, subject, and message carefully.
                </p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-icon">📩</div>

              <div>
                <h5>2. Send Your Message</h5>
                <p>
                  Click the Send Message button after completing the form.
                </p>
              </div>
            </div>

            <div className="instruction-item">
              <div className="instruction-icon">👩‍💻</div>

              <div>
                <h5>3. Admin Will Respond</h5>
                <p>
                  Our admin team will review your message and respond
                  as soon as possible.
                </p>
              </div>
            </div>

          </div>

          {/* Note */}
          <div className="contact-note">
            <span>💡</span>

            <p>
              Please provide a clear subject and detailed message so
              we can help you more effectively.
            </p>
          </div>

        </div>

        {/* Right Side - Form */}
        <div className="contact-form-box">

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="name">Name</label>

              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>

              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="What is your message about?"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>

              <textarea
                id="message"
                name="message"
                rows="6"
                placeholder="Write your message here..."
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="contact-submit-btn"
            >
              Send Message →
            </button>

          </form>

        </div>

      </div>

    </section>
  );
}

export default Contact;