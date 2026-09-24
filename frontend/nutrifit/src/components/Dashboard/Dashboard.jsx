import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard({ onClose }) {
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = "http://127.0.0.1:5000";

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    fetchProgress();
    fetchFeedback();
    fetchContactMessages();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/progress`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("PROGRESS API RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load progress");
      }

      setSummary(data.summary);
      setProgress(data.progress || []);
    } catch (err) {
      console.error("Progress error:", err);
      setError(err.message || "Unable to load progress.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${API_URL}/my-feedback`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("MY FEEDBACK RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load feedback");
      }

      setFeedbackList(data.feedback || []);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const fetchContactMessages = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${API_URL}/my-contact-messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("MY CONTACT MESSAGES RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load contact messages"
        );
      }

      setContactMessages(data.messages || []);
    } catch (err) {
      console.error("Contact messages error:", err);
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const getLastUpdated = () => {
    if (!progress.length) {
      return "-";
    }

    const latestRecord = progress[progress.length - 1];

    return formatDate(latestRecord.progress_date);
  };

  const getUpdatedMonth = () => {
    if (!progress.length) {
      return "";
    }

    const latestRecord = progress[progress.length - 1];
    const d = new Date(latestRecord.progress_date);

    if (isNaN(d.getTime())) {
      return "";
    }

    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getMotivation = () => {
    if (!summary) {
      return "Start tracking your weight today. Every small step counts!";
    }

    const change = Number(summary.weight_change);

    if (change < 0) {
      return "Great job! 🎉 You're making progress. Keep going!";
    }

    if (change > 0) {
      return "Stay consistent! 💪 Every journey has ups and downs.";
    }

    return "You're staying consistent! 🌱 Keep working toward your goal.";
  };

  const getGraphData = () => {
    if (!progress.length) {
      return {
        minWeight: 0,
        maxWeight: 0,
        range: 1,
      };
    }

    const weights = progress.map((item) => Number(item.weight));
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 1;

    return {
      minWeight,
      maxWeight,
      range,
    };
  };

  const getGraphPoints = () => {
    if (!progress.length) return "";

    const width = 500;
    const height = 180;
    const padding = 35;

    const { minWeight, range } = getGraphData();

    return progress
      .map((item, index) => {
        const x =
          progress.length === 1
            ? width / 2
            : padding +
              (index / (progress.length - 1)) *
                (width - padding * 2);

        const y =
          height -
          padding -
          ((Number(item.weight) - minWeight) / range) *
            (height - padding * 2);

        return `${x},${y}`;
      })
      .join(" ");
  };

  const getPointPosition = (index) => {
    if (!progress.length) {
      return {
        x: 0,
        y: 0,
      };
    }

    const width = 500;
    const height = 180;
    const padding = 35;

    const { minWeight, range } = getGraphData();

    const x =
      progress.length === 1
        ? width / 2
        : padding +
          (index / (progress.length - 1)) *
            (width - padding * 2);

    const y =
      height -
      padding -
      ((Number(progress[index].weight) - minWeight) / range) *
        (height - padding * 2);

    return {
      x,
      y,
    };
  };

  const getYAxisLabels = () => {
    if (!progress.length) return [];

    const { minWeight, maxWeight } = getGraphData();

    if (minWeight === maxWeight) {
      return [
        Number(maxWeight) + 2,
        Number(maxWeight) + 1,
        Number(maxWeight),
        Number(maxWeight) - 1,
      ];
    }

    const step = (maxWeight - minWeight) / 3;

    return [
      maxWeight,
      maxWeight - step,
      minWeight + step,
      minWeight,
    ].map((value) => Number(value.toFixed(1)));
  };

  const yAxisLabels = getYAxisLabels();

  if (loading) {
    return (
      <div className="dashboard-overlay">
        <div className="dashboard-card loading-card">
          <button
            type="button"
            className="dashboard-close"
            onClick={handleClose}
            aria-label="Close dashboard"
          >
            ×
          </button>

          <div className="loader"></div>

          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-card">
        <button
          type="button"
          className="dashboard-close"
          onClick={handleClose}
          aria-label="Close dashboard"
        >
          ×
        </button>

        <div className="dashboard-header">
          <span className="dashboard-small-title">
            YOUR PROGRESS
          </span>

          <h2>Weight Dashboard</h2>

          <p>
            Keep going, your progress matters 💚
          </p>
        </div>

        {error ? (
          <div className="dashboard-error">
            {error}
          </div>
        ) : !summary ? (
          <div className="empty-progress">
            <div className="empty-icon">
              ⚖️
            </div>

            <h3>Start Your Journey</h3>

            <p>
              Add your first weight to start tracking your progress.
            </p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-box current">
                <span className="stat-label">
                  Current Weight
                </span>

                <strong>
                  {summary.current_weight} kg
                </strong>

                <small>
                  {formatDate(summary.current_date)}
                </small>
              </div>

              <div className="stat-box previous">
                <span className="stat-label">
                  Previous Weight
                </span>

                <strong>
                  {summary.previous_weight !== null
                    ? `${summary.previous_weight} kg`
                    : "--"}
                </strong>

                <small>
                  {summary.previous_date
                    ? formatDate(summary.previous_date)
                    : "No previous record"}
                </small>
              </div>

              <div
                className={`stat-box ${
                  Number(summary.weight_change) < 0
                    ? "positive"
                    : Number(summary.weight_change) > 0
                    ? "negative"
                    : "neutral"
                }`}
              >
                <span className="stat-label">
                  Weight Change
                </span>

                <strong>
                  {Number(summary.weight_change) > 0
                    ? "+"
                    : ""}
                  {summary.weight_change} kg
                </strong>

                <small>
                  {summary.weight_percentage}% change
                </small>
              </div>
            </div>

            <div className="motivation-box">
              <div className="motivation-icon">
                🌿
              </div>

              <div>
                <h3>Keep Going!</h3>

                <p>
                  {getMotivation()}
                </p>
              </div>
            </div>

            <div className="graph-section">
              <div className="graph-heading">
                <div>
                  <h3>Weight Progress</h3>

                  <span>
                    Your journey over time
                  </span>
                </div>

                <div className="percentage-badge">
                  {summary.weight_percentage}%
                </div>
              </div>

              {progress.length === 1 ? (
                <div className="single-record">
                  <div className="single-record-dot"></div>

                  <strong>
                    {progress[0].weight} kg
                  </strong>

                  <span>
                    First record •{" "}
                    {formatDate(progress[0].progress_date)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="graph-wrapper">
                    <div className="y-axis">
                      {yAxisLabels.map((label, index) => (
                        <span key={index}>
                          {label} kg
                        </span>
                      ))}
                    </div>

                    <div className="graph-container">
                      <svg
                        viewBox="0 0 500 180"
                        preserveAspectRatio="none"
                        className="progress-graph"
                      >
                        <line
                          x1="35"
                          y1="35"
                          x2="465"
                          y2="35"
                          className="graph-grid"
                        />

                        <line
                          x1="35"
                          y1="90"
                          x2="465"
                          y2="90"
                          className="graph-grid"
                        />

                        <line
                          x1="35"
                          y1="145"
                          x2="465"
                          y2="145"
                          className="graph-grid"
                        />

                        <polyline
                          points={getGraphPoints()}
                          fill="none"
                          className="graph-line"
                        />

                        {progress.map((item, index) => {
                          const position =
                            getPointPosition(index);

                          return (
                            <g key={item.id || index}>
                              <circle
                                cx={position.x}
                                cy={position.y}
                                r="5"
                                className="graph-point"
                              />

                              <title>
                                {item.weight} kg -{" "}
                                {formatDate(
                                  item.progress_date
                                )}
                              </title>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="graph-dates">
                    {progress.map((item, index) => (
                      <span key={item.id || index}>
                        {formatShortDate(
                          item.progress_date
                        )}
                      </span>
                    ))}
                  </div>

                  <div className="graph-info">
                    <div className="legend-item">
                      <span className="legend-line"></span>
                      <span>Weight progress</span>
                    </div>

                    <div className="legend-item">
                      <span className="legend-dot"></span>
                      <span>Weight updated</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="last-updated-box">
              <div className="last-updated-icon">
                🕒
              </div>

              <div className="last-updated-content">
                <h4>Last Weight Update</h4>

                <p>
                  You updated your weight on{" "}
                  <strong>
                    {getLastUpdated()}
                  </strong>
                </p>

                <span>
                  This update was recorded in{" "}
                  <strong>
                    {getUpdatedMonth()}
                  </strong>
                </span>
              </div>
            </div>

            <div className="instruction-box">
              <div className="instruction-icon">
                💡
              </div>

              <div>
                <h4>Progress Tracking</h4>

                <p>
                  Update your weight regularly to keep your
                  graph accurate and monitor your progress
                  over time.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="dashboard-replies-section">
          <div className="replies-heading">
            <span className="dashboard-small-title">
              YOUR FEEDBACK
            </span>

            <h3>
              Feedback & Admin Response
            </h3>

            <p>
              See your feedback and responses from NutriFit admin.
            </p>
          </div>

          {replyLoading ? (
            <div className="reply-loading">
              Loading your feedback...
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="no-replies">
              <span>💬</span>

              <p>
                You have not submitted any feedback yet.
              </p>
            </div>
          ) : (
            <div className="feedback-list">
              {feedbackList.map((feedback) => (
                <div
                  className="feedback-reply-card"
                  key={feedback.id}
                >
                  <div className="feedback-card-header">
                    <span className="feedback-meal">
                      {feedback.meal_type ||
                        "Food Feedback"}
                    </span>

                    <span
                      className={`feedback-status ${
                        feedback.status === "Replied"
                          ? "replied"
                          : ""
                      }`}
                    >
                      {feedback.status || "Submitted"}
                    </span>
                  </div>

                  <div className="user-feedback-content">
                    <strong>Your Feedback</strong>

                    <p>
                      {feedback.comment}
                    </p>

                    <small>
                      Followed recommendation:{" "}
                      <strong>
                        {feedback.followed}
                      </strong>
                    </small>
                  </div>

                  {feedback.admin_response ? (
                    <div className="admin-response-box">
                      <div className="admin-response-title">
                        <span>👨‍💼</span>

                        <strong>
                          Admin Response
                        </strong>
                      </div>

                      <p>
                        {feedback.admin_response}
                      </p>

                      {feedback.responded_at && (
                        <small>
                          Responded on{" "}
                          {formatDate(
                            feedback.responded_at
                          )}
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className="waiting-response">
                      <span>⏳</span>

                      <p>
                        Your feedback has been received.
                        Admin has not replied yet.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-replies-section contact-replies-section">
          <div className="replies-heading">
            <span className="dashboard-small-title">
              CONTACT SUPPORT
            </span>

            <h3>
              Your Contact Messages
            </h3>

            <p>
              View your messages and responses from NutriFit admin.
            </p>
          </div>

          {replyLoading ? (
            <div className="reply-loading">
              Loading your messages...
            </div>
          ) : contactMessages.length === 0 ? (
            <div className="no-replies">
              <span>📩</span>

              <p>
                You have not sent any contact messages yet.
              </p>
            </div>
          ) : (
            <div className="feedback-list">
              {contactMessages.map((message) => (
                <div
                  className="feedback-reply-card"
                  key={message.id}
                >
                  <div className="feedback-card-header">
                    <span className="feedback-meal">
                      {message.subject}
                    </span>

                    <span
                      className={`feedback-status ${
                        message.status === "Replied"
                          ? "replied"
                          : ""
                      }`}
                    >
                      {message.status || "Submitted"}
                    </span>
                  </div>

                  <div className="user-feedback-content">
                    <strong>Your Message</strong>

                    <p>
                      {message.message}
                    </p>

                    <small>
                      Sent on{" "}
                      {formatDate(message.created_at)}
                    </small>
                  </div>

                  {message.admin_response ? (
                    <div className="admin-response-box">
                      <div className="admin-response-title">
                        <span>👨‍💼</span>

                        <strong>
                          Admin Response
                        </strong>
                      </div>

                      <p>
                        {message.admin_response}
                      </p>

                      {message.responded_at && (
                        <small>
                          Responded on{" "}
                          {formatDate(
                            message.responded_at
                          )}
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className="waiting-response">
                      <span>⏳</span>

                      <p>
                        Your message has been received.
                        Admin has not replied yet.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bottom-message">
          <span>💚</span>

          <p>
            Small changes today create big results tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;