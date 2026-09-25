import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE = "https://nutrifit.alwaysdata.net";

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("dashboard");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ADMIN DATA FROM LOCAL STORAGE

  const adminName = localStorage.getItem("admin_name") || "Admin";
  const adminEmail = localStorage.getItem("admin_email") || "";
  const adminId = localStorage.getItem("admin_id") || "";

  // DATA STATE

  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    users: [],
  });

  const [feedback, setFeedback] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [foods, setFoods] = useState([]);
  const [progress, setProgress] = useState([]);
  const [admins, setAdmins] = useState([]);

  // FOOD FORM

  const emptyFood = {
    Food_Name: "",
    Meal_Type: "Breakfast",
    Calories: "",
    Protein_g: "",
    Carbs_g: "",
    Fat_g: "",
    Serving_g: "",
    Cost: "",
    Preference: "",
    Activity: "",
    Goal: "",
    Estimated_Cost: "",
  };

  const [foodForm, setFoodForm] = useState(emptyFood);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [foodErrors, setFoodErrors] = useState({});
  const [originalNutrition, setOriginalNutrition] = useState(null);

  // FEEDBACK REPLY

  const [feedbackReplyId, setFeedbackReplyId] = useState(null);
  const [feedbackReplyText, setFeedbackReplyText] = useState("");

  // CONTACT REPLY

  const [contactReplyId, setContactReplyId] = useState(null);
  const [contactReplyText, setContactReplyText] = useState("");

  // AUTH HEADERS

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // CHECK ADMIN LOGIN

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const loggedIn = localStorage.getItem("adminLoggedIn");

    if (!token || loggedIn !== "true") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // CLEAR MESSAGES

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // LOAD USER STATS

  const loadUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/user_stats`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load user statistics");
      }

      setUserStats({
        total_users: data.total_users || 0,
        active_users: data.active_users || 0,
        users: data.users || [],
      });
    } catch (err) {
      console.error("USER STATS ERROR:", err);
      setError(err.message);
    }
  };

  // LOAD FEEDBACK

  const loadFeedback = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/feedback`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load feedback");
      }

      setFeedback(data.feedback || []);
    } catch (err) {
      console.error("FEEDBACK ERROR:", err);
      setError(err.message);
    }
  };

  // LOAD CONTACT MESSAGES

  const loadContactMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/contact-messages`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load contact messages");
      }

      setContactMessages(data.messages || []);
    } catch (err) {
      console.error("CONTACT ERROR:", err);
      setError(err.message);
    }
  };

  // LOAD FOODS

  const loadFoods = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/foods`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load foods");
      }

      setFoods(data.foods || []);
    } catch (err) {
      console.error("FOODS ERROR:", err);
      setError(err.message);
    }
  };

  // LOAD PROGRESS

  const loadProgress = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/progress`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load progress");
      }

      setProgress(data.progress || []);
    } catch (err) {
      console.error("PROGRESS ERROR:", err);
      setError(err.message);
    }
  };

  // LOAD ADMINS

  const loadAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/admins`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load admins");
      }

      setAdmins(data.admins || []);
    } catch (err) {
      console.error("ADMINS ERROR:", err);
      setError(err.message);
    }
  };

  // LOAD DATA WHEN SECTION CHANGES

  useEffect(() => {
    clearMessages();

    if (activeSection === "dashboard") {
      loadUserStats();
      loadFeedback();
      loadContactMessages();
    }

    if (activeSection === "users") {
      loadUserStats();
    }

    if (activeSection === "foods") {
      loadFoods();
    }

    if (activeSection === "feedback") {
      loadFeedback();
    }

    if (activeSection === "contact") {
      loadContactMessages();
    }

    if (activeSection === "progress") {
      loadProgress();
    }

    if (activeSection === "admins") {
      loadAdmins();
    }

    // --------------------------------------------------
    // USER ACTIVITY AUTO REFRESH
    // Joined / Left / Last Seen
    // --------------------------------------------------

    let userActivityInterval = null;

    if (
      activeSection === "dashboard" ||
      activeSection === "users"
    ) {
      userActivityInterval = setInterval(() => {
        loadUserStats();
      }, 10000);
    }

    return () => {
      if (userActivityInterval) {
        clearInterval(userActivityInterval);
      }
    };
  }, [activeSection]);

  // FOOD FORM CHANGE

  const handleFoodChange = (e) => {
    const { name, value } = e.target;

    setFoodErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    if (
      name === "Serving_g" &&
      editingFoodId &&
      originalNutrition
    ) {
      const newServing = Number(value);
      const baseServing = Number(originalNutrition.Serving_g);

      if (
        value !== "" &&
        newServing > 0 &&
        baseServing > 0
      ) {
        const multiplier = newServing / baseServing;

        setFoodForm((previous) => ({
          ...previous,
          Serving_g: value,
          Protein_g: (
            Number(originalNutrition.Protein_g || 0) *
            multiplier
          ).toFixed(2),
          Carbs_g: (
            Number(originalNutrition.Carbs_g || 0) *
            multiplier
          ).toFixed(2),
          Fat_g: (
            Number(originalNutrition.Fat_g || 0) *
            multiplier
          ).toFixed(2),
        }));

        return;
      }
    }

    setFoodForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // OPEN ADD FOOD

  const openAddFood = () => {
    clearMessages();
    setFoodErrors({});
    setOriginalNutrition(null);
    setEditingFoodId(null);
    setFoodForm(emptyFood);
    setShowFoodForm(true);
  };

  // OPEN EDIT FOOD

  const openEditFood = (food) => {
    clearMessages();
    setFoodErrors({});

    setEditingFoodId(food.Food_ID);

    setOriginalNutrition({
      Serving_g: Number(food.Serving_g) > 0
        ? Number(food.Serving_g)
        : 100,
      Protein_g: Number(food.Protein_g) || 0,
      Carbs_g: Number(food.Carbs_g) || 0,
      Fat_g: Number(food.Fat_g) || 0,
    });

    setFoodForm({
      Food_Name: food.Food_Name || "",
      Meal_Type: food.Meal_Type || "Breakfast",
      Calories: food.Calories ?? "",
      Protein_g: food.Protein_g ?? "",
      Carbs_g: food.Carbs_g ?? "",
      Fat_g: food.Fat_g ?? "",
      Serving_g: food.Serving_g ?? "",
      Cost: food.Cost || "",
      Preference: food.Preference || "",
      Activity: food.Activity || "",
      Goal: food.Goal || "",
      Estimated_Cost: food.Estimated_Cost ?? "",
    });

    setShowFoodForm(true);
  };

  // SAVE FOOD

  const saveFood = async (e) => {
    e.preventDefault();

    clearMessages();

    const validationErrors = {};

    if (!foodForm.Food_Name.trim()) {
      validationErrors.Food_Name =
        "Food name is required.";
    }

    if (!foodForm.Meal_Type) {
      validationErrors.Meal_Type =
        "Meal type is required.";
    }

    const calories = Number(foodForm.Calories);
    const serving = Number(foodForm.Serving_g);
    const estimatedCost = Number(foodForm.Estimated_Cost);
    const protein = Number(foodForm.Protein_g || 0);
    const carbs = Number(foodForm.Carbs_g || 0);
    const fat = Number(foodForm.Fat_g || 0);

    if (
      foodForm.Calories === "" ||
      !Number.isFinite(calories) ||
      calories <= 0
    ) {
      validationErrors.Calories =
        "Calories must be greater than 0.";
    }

    if (
      foodForm.Serving_g === "" ||
      !Number.isFinite(serving) ||
      serving <= 0
    ) {
      validationErrors.Serving_g =
        "Serving must be greater than 0 grams.";
    }

    if (
      foodForm.Estimated_Cost === "" ||
      !Number.isFinite(estimatedCost) ||
      estimatedCost <= 0
    ) {
      validationErrors.Estimated_Cost =
        "Estimated cost must be greater than 0.";
    }

    if (!Number.isFinite(protein) || protein < 0) {
      validationErrors.Protein_g =
        "Protein cannot be negative.";
    }

    if (!Number.isFinite(carbs) || carbs < 0) {
      validationErrors.Carbs_g =
        "Carbs cannot be negative.";
    }

    if (!Number.isFinite(fat) || fat < 0) {
      validationErrors.Fat_g =
        "Fat cannot be negative.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setFoodErrors(validationErrors);
      setError("Please correct the highlighted food values.");
      return;
    }

    setFoodErrors({});
    setLoading(true);

    try {
      const url = editingFoodId
        ? `${API_BASE}/admin/foods/${editingFoodId}`
        : `${API_BASE}/admin/foods`;

      const method = editingFoodId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(foodForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save food");
      }

      setMessage(
        editingFoodId
          ? "Food updated successfully."
          : "Food added successfully."
      );

      setShowFoodForm(false);
      setEditingFoodId(null);
      setOriginalNutrition(null);
      setFoodErrors({});
      setFoodForm(emptyFood);

      await loadFoods();
    } catch (err) {
      console.error("SAVE FOOD ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE FOOD

  const deleteFood = async (foodId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this food?"
    );

    if (!confirmDelete) {
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/admin/foods/${foodId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete food");
      }

      setMessage("Food deleted successfully.");

      await loadFoods();
    } catch (err) {
      console.error("DELETE FOOD ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // MARK FEEDBACK READ

  const markFeedbackRead = async (feedbackId) => {
    clearMessages();

    try {
      const response = await fetch(
        `${API_BASE}/admin/feedback/${feedbackId}/read`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark feedback as read");
      }

      setMessage("Feedback marked as read.");

      await loadFeedback();
    } catch (err) {
      console.error("READ FEEDBACK ERROR:", err);
      setError(err.message);
    }
  };

  // REPLY TO FEEDBACK

  const replyToFeedback = async (feedbackId) => {
    if (!feedbackReplyText.trim()) {
      setError("Please enter a response.");
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/admin/feedback/reply`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            feedback_id: feedbackId,
            response: feedbackReplyText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reply");
      }

      setMessage("Feedback response sent successfully.");
      setFeedbackReplyId(null);
      setFeedbackReplyText("");

      await loadFeedback();
    } catch (err) {
      console.error("FEEDBACK REPLY ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // MARK CONTACT READ

  const markContactRead = async (messageId) => {
    clearMessages();

    try {
      const response = await fetch(
        `${API_BASE}/admin/contact-messages/${messageId}/read`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark message as read");
      }

      setMessage("Message marked as read.");

      await loadContactMessages();
    } catch (err) {
      console.error("READ CONTACT ERROR:", err);
      setError(err.message);
    }
  };

  // REPLY TO CONTACT

  const replyToContact = async (messageId) => {
    if (!contactReplyText.trim()) {
      setError("Please enter a response.");
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/admin/contact/reply`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            message_id: messageId,
            response: contactReplyText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reply");
      }

      setMessage("Response sent successfully.");
      setContactReplyId(null);
      setContactReplyText("");

      await loadContactMessages();
    } catch (err) {
      console.error("CONTACT REPLY ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE CONTACT MESSAGE

  const deleteContactMessage = async (messageId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) {
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/admin/contact-messages/${messageId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete message");
      }

      setMessage("Message deleted successfully.");

      await loadContactMessages();
    } catch (err) {
      console.error("DELETE CONTACT ERROR:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SIGN OUT + PERMANENTLY DELETE ADMIN ACCOUNT

const handleSignOut = async () => {
  const confirmSignOut = window.confirm(
    "Are you sure you want to sign out? Your admin account will be permanently deleted. This action cannot be undone."
  );

  if (!confirmSignOut) {
    return;
  }

  clearMessages();
  setLoading(true);

  try {
    const response = await fetch(
      `${API_BASE}/admin/delete-account`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete admin account."
      );
    }

    // Clear admin local storage
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("adminLoggedIn");

    // Go to admin login
    navigate("/admin/login", {
      replace: true,
    });

  } catch (err) {
    console.error("ADMIN SIGN OUT ERROR:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // FORMAT DATE

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  // RECENT FEEDBACK

  const recentFeedback = feedback.slice(0, 5);

  // RECENT CONTACT

  const recentMessages = contactMessages.slice(0, 5);

  // UNREAD COUNTS

  const unreadFeedback = feedback.filter(
    (item) => item.status !== "Read" && item.status !== "Replied"
  ).length;

  const unreadMessages = contactMessages.filter(
    (item) => item.status !== "Read" && item.status !== "Replied"
  ).length;

  // RENDER DASHBOARD

  const renderDashboard = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {adminName}.</p>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={() => {
              loadUserStats();
              loadFeedback();
              loadContactMessages();
            }}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div>
              <h3>Total Users</h3>
              <strong>{userStats.total_users}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">🟢</div>
            <div>
              <h3>Active Users</h3>
              <strong>{userStats.active_users}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">💬</div>
            <div>
              <h3>Total Feedback</h3>
              <strong>{feedback.length}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">✉️</div>
            <div>
              <h3>Contact Messages</h3>
              <strong>{contactMessages.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-two-column">
          <div className="admin-content-card">
            <div className="admin-card-heading">
              <h2>Recent Feedback</h2>
              <button onClick={() => setActiveSection("feedback")}>
                View All
              </button>
            </div>

            {recentFeedback.length === 0 ? (
              <div className="admin-empty">
                No feedback available.
              </div>
            ) : (
              <div className="admin-mini-list">
                {recentFeedback.map((item) => (
                  <div className="admin-mini-item" key={item.id}>
                    <div>
                      <strong>{item.name || "Unknown User"}</strong>
                      <p>{item.comment}</p>
                    </div>

                    <span
                      className={`admin-status ${
                        item.status === "Replied"
                          ? "status-replied"
                          : item.status === "Read"
                          ? "status-read"
                          : "status-unread"
                      }`}
                    >
                      {item.status || "Unread"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-content-card">
            <div className="admin-card-heading">
              <h2>Recent Messages</h2>
              <button onClick={() => setActiveSection("contact")}>
                View All
              </button>
            </div>

            {recentMessages.length === 0 ? (
              <div className="admin-empty">
                No contact messages available.
              </div>
            ) : (
              <div className="admin-mini-list">
                {recentMessages.map((item) => (
                  <div className="admin-mini-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.subject}</p>
                    </div>

                    <span
                      className={`admin-status ${
                        item.status === "Replied"
                          ? "status-replied"
                          : item.status === "Read"
                          ? "status-read"
                          : "status-unread"
                      }`}
                    >
                      {item.status || "Unread"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // USERS SECTION

  const renderUsers = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Users</h1>
            <p>Monitor NutriFit users and their current activity.</p>
          </div>

          <button className="admin-refresh-btn" onClick={loadUserStats}>
            ↻ Refresh
          </button>
        </div>

        <div className="admin-stat-grid admin-small-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div>
              <h3>Total Users</h3>
              <strong>{userStats.total_users}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">🟢</div>
            <div>
              <h3>Online Now</h3>
              <strong>{userStats.active_users}</strong>
            </div>
          </div>
        </div>

        <div className="admin-content-card">
          <div className="admin-card-heading">
            <h2>Currently Online Users</h2>
          </div>

          {userStats.users.length === 0 ? (
            <div className="admin-empty">
              No users are currently online.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined At</th>
                    <th>Last Seen</th>
                    <th>Left At</th>
                  </tr>
                </thead>

                <tbody>
                  {userStats.users.map((user) => (
                    <tr key={user.user_id}>
                      <td>#{user.user_id}</td>

                      <td>{user.name}</td>

                      <td>{user.email}</td>

                      <td>
                        <span
                          className={`admin-status ${
                            user.status === "online"
                              ? "status-online"
                              : "status-read"
                          }`}
                        >
                          {user.status || "offline"}
                        </span>
                      </td>

                      <td>{formatDate(user.joined_at)}</td>

                      <td>{formatDate(user.last_seen)}</td>

                      <td>{formatDate(user.left_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // FOODS SECTION

  const renderFoods = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Foods</h1>
            <p>
              Manage foods available in the NutriFit recommendation system.
            </p>
          </div>

          <div className="admin-heading-actions">
            <button className="admin-refresh-btn" onClick={loadFoods}>
              ↻ Refresh
            </button>

            <button className="admin-primary-btn" onClick={openAddFood}>
              + Add Food
            </button>
          </div>
        </div>

        {showFoodForm && (
          <div className="admin-form-card">
            <div className="admin-card-heading">
              <h2>
                {editingFoodId ? "Edit Food" : "Add New Food"}
              </h2>

              <button
                className="admin-close-btn"
                onClick={() => {
                  setShowFoodForm(false);
                  setEditingFoodId(null);
                  setFoodForm(emptyFood);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveFood}>
              <div className="admin-food-form-grid">
                <div className="admin-form-group">
                  <label>Food Name *</label>
                  <input
                    className={foodErrors.Food_Name ? "admin-input-error" : ""}
                    type="text"
                    name="Food_Name"
                    value={foodForm.Food_Name}
                    onChange={handleFoodChange}
                    placeholder="Food name"
                  />
                  {foodErrors.Food_Name && (
                    <span className="admin-field-error">
                      {foodErrors.Food_Name}
                    </span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Meal Type *</label>
                  <select
                    name="Meal_Type"
                    value={foodForm.Meal_Type}
                    onChange={handleFoodChange}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Calories *</label>
                  <input
                    className={foodErrors.Calories ? "admin-input-error" : ""}
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="Calories"
                    value={foodForm.Calories}
                    onChange={handleFoodChange}
                    placeholder="Calories"
                  />
                  {foodErrors.Calories && (
                    <span className="admin-field-error">
                      {foodErrors.Calories}
                    </span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Protein (g)</label>
                  <input
                    className={foodErrors.Protein_g ? "admin-input-error" : ""}
                    type="number"
                    step="0.01"
                    min="0"
                    name="Protein_g"
                    value={foodForm.Protein_g}
                    onChange={handleFoodChange}
                    placeholder="Protein"
                  />
                  {foodErrors.Protein_g && (
                    <span className="admin-field-error">
                      {foodErrors.Protein_g}
                    </span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Carbs (g)</label>
                  <input
                    className={foodErrors.Carbs_g ? "admin-input-error" : ""}
                    type="number"
                    step="0.01"
                    min="0"
                    name="Carbs_g"
                    value={foodForm.Carbs_g}
                    onChange={handleFoodChange}
                    placeholder="Carbs"
                  />
                  {foodErrors.Carbs_g && (
                    <span className="admin-field-error">
                      {foodErrors.Carbs_g}
                    </span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Fat (g)</label>
                  <input
                    className={foodErrors.Fat_g ? "admin-input-error" : ""}
                    type="number"
                    step="0.01"
                    min="0"
                    name="Fat_g"
                    value={foodForm.Fat_g}
                    onChange={handleFoodChange}
                    placeholder="Fat"
                  />
                  {foodErrors.Fat_g && (
                    <span className="admin-field-error">
                      {foodErrors.Fat_g}
                    </span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Serving (g)</label>
                  <input
                    className={foodErrors.Serving_g ? "admin-input-error" : ""}
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="Serving_g"
                    value={foodForm.Serving_g}
                    onChange={handleFoodChange}
                    placeholder="Serving"
                  />
                  {foodErrors.Serving_g && (
                    <span className="admin-field-error">
                      {foodErrors.Serving_g}
                    </span>
                  )}

                  {editingFoodId && (
                    <span className="admin-auto-note">
                      Changing serving automatically adjusts protein,
                      carbs and fat.
                    </span>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Cost</label>
                  <select
                    name="Cost"
                    value={foodForm.Cost}
                    onChange={handleFoodChange}
                  >
                    <option value="">Select Cost</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Preference</label>
                  <select
                    name="Preference"
                    value={foodForm.Preference}
                    onChange={handleFoodChange}
                  >
                    <option value="">Select Preference</option>
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Activity</label>
                  <select
                    name="Activity"
                    value={foodForm.Activity}
                    onChange={handleFoodChange}
                  >
                    <option value="">Select Activity</option>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Active">Active</option>
                    <option value="Very Active">Very Active</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Goal</label>
                  <select
                    name="Goal"
                    value={foodForm.Goal}
                    onChange={handleFoodChange}
                  >
                    <option value="">Select Goal</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Weight Gain">Weight Gain</option>
                    <option value="Weight Maintain">Weight Maintain</option>
                    <option value="maintain">maintain</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Estimated Cost</label>
                  <input
                    className={foodErrors.Estimated_Cost ? "admin-input-error" : ""}
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="Estimated_Cost"
                    value={foodForm.Estimated_Cost}
                    onChange={handleFoodChange}
                    placeholder="Estimated cost"
                  />
                  {foodErrors.Estimated_Cost && (
                    <span className="admin-field-error">
                      {foodErrors.Estimated_Cost}
                    </span>
                  )}
                </div>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => {
                    setShowFoodForm(false);
                    setEditingFoodId(null);
                    setFoodForm(emptyFood);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingFoodId
                    ? "Update Food"
                    : "Add Food"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="admin-content-card">
          <div className="admin-card-heading">
            <h2>Food Dataset</h2>
            <span className="admin-count">{foods.length} foods</span>
          </div>

          {foods.length === 0 ? (
            <div className="admin-empty">
              No foods found in the database.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table foods-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Food Name</th>
                    <th>Meal</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                    <th>Serving</th>
                    <th>Cost</th>
                    <th>Preference</th>
                    <th>Activity</th>
                    <th>Goal</th>
                    <th>Est. Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {foods.map((food) => (
                    <tr key={food.Food_ID}>
                      <td>#{food.Food_ID}</td>

                      <td className="food-name-cell">
                        {food.Food_Name}
                      </td>

                      <td>{food.Meal_Type}</td>
                      <td>{food.Calories}</td>
                      <td>{food.Protein_g ?? "-"}</td>
                      <td>{food.Carbs_g ?? "-"}</td>
                      <td>{food.Fat_g ?? "-"}</td>
                      <td>{food.Serving_g ?? "-"}</td>

                      <td>
                        <span className="admin-cost-badge">
                          {food.Cost || "-"}
                        </span>
                      </td>

                      <td>{food.Preference || "-"}</td>
                      <td>{food.Activity || "-"}</td>
                      <td>{food.Goal || "-"}</td>
                      <td>{food.Estimated_Cost ?? "-"}</td>

                      <td>
                        <div className="admin-action-buttons">
                          <button
                            className="admin-edit-btn"
                            onClick={() => openEditFood(food)}
                          >
                            Edit
                          </button>

                          <button
                            className="admin-delete-btn"
                            onClick={() => deleteFood(food.Food_ID)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // FEEDBACK SECTION

  const renderFeedback = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Feedback</h1>
            <p>Review feedback submitted by NutriFit users.</p>
          </div>

          <button className="admin-refresh-btn" onClick={loadFeedback}>
            ↻ Refresh
          </button>
        </div>

        <div className="admin-stat-grid admin-small-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">💬</div>

            <div>
              <h3>Total Feedback</h3>
              <strong>{feedback.length}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">🔔</div>

            <div>
              <h3>Unread</h3>
              <strong>{unreadFeedback}</strong>
            </div>
          </div>
        </div>

        <div className="admin-content-card">
          <div className="admin-card-heading">
            <h2>All Feedback</h2>
          </div>

          {feedback.length === 0 ? (
            <div className="admin-empty">
              No feedback available.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Food ID</th>
                    <th>Meal</th>
                    <th>Followed</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {feedback.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr>
                        <td>#{item.id}</td>
                        <td>{item.name || "-"}</td>
                        <td>{item.email || "-"}</td>
                        <td>{item.food_id || "-"}</td>
                        <td>{item.meal_type || "-"}</td>

                        <td>
                          <span
                            className={`followed-badge ${
                              item.followed === "Yes"
                                ? "followed-yes"
                                : "followed-no"
                            }`}
                          >
                            {item.followed}
                          </span>
                        </td>

                        <td className="long-text-cell">
                          {item.comment}
                        </td>

                        <td>
                          <span
                            className={`admin-status ${
                              item.status === "Replied"
                                ? "status-replied"
                                : item.status === "Read"
                                ? "status-read"
                                : "status-unread"
                            }`}
                          >
                            {item.status || "Unread"}
                          </span>
                        </td>

                        <td>{formatDate(item.created_at)}</td>

                        <td>
                          <div className="admin-action-buttons vertical-actions">
                            {item.status !== "Read" &&
                              item.status !== "Replied" && (
                                <button
                                  className="admin-read-btn"
                                  onClick={() =>
                                    markFeedbackRead(item.id)
                                  }
                                >
                                  Mark Read
                                </button>
                              )}

                            <button
                              className="admin-reply-btn"
                              onClick={() => {
                                setFeedbackReplyId(item.id);
                                setFeedbackReplyText(
                                  item.admin_response || ""
                                );
                              }}
                            >
                              Reply
                            </button>
                          </div>
                        </td>
                      </tr>

                      {feedbackReplyId === item.id && (
                        <tr className="reply-row">
                          <td colSpan="10">
                            <div className="admin-reply-box">
                              <textarea
                                value={feedbackReplyText}
                                onChange={(e) =>
                                  setFeedbackReplyText(e.target.value)
                                }
                                placeholder="Write your response..."
                                rows="3"
                              />

                              <div className="admin-form-actions">
                                <button
                                  className="admin-secondary-btn"
                                  onClick={() => {
                                    setFeedbackReplyId(null);
                                    setFeedbackReplyText("");
                                  }}
                                >
                                  Cancel
                                </button>

                                <button
                                  className="admin-primary-btn"
                                  onClick={() =>
                                    replyToFeedback(item.id)
                                  }
                                  disabled={loading}
                                >
                                  {loading
                                    ? "Sending..."
                                    : "Send Response"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // CONTACT SECTION

  const renderContact = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Contact Messages</h1>
            <p>Manage messages received from NutriFit users.</p>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={loadContactMessages}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="admin-stat-grid admin-small-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">✉️</div>

            <div>
              <h3>Total Messages</h3>
              <strong>{contactMessages.length}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">🔔</div>

            <div>
              <h3>Unread</h3>
              <strong>{unreadMessages}</strong>
            </div>
          </div>
        </div>

        <div className="admin-content-card">
          <div className="admin-card-heading">
            <h2>All Contact Messages</h2>
          </div>

          {contactMessages.length === 0 ? (
            <div className="admin-empty">
              No contact messages available.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {contactMessages.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr>
                        <td>#{item.id}</td>
                        <td>{item.user_id || "-"}</td>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>{item.subject}</td>

                        <td className="long-text-cell">
                          {item.message}
                        </td>

                        <td>
                          <span
                            className={`admin-status ${
                              item.status === "Replied"
                                ? "status-replied"
                                : item.status === "Read"
                                ? "status-read"
                                : "status-unread"
                            }`}
                          >
                            {item.status || "Unread"}
                          </span>
                        </td>

                        <td>{formatDate(item.created_at)}</td>

                        <td>
                          <div className="admin-action-buttons vertical-actions">
                            {item.status !== "Read" &&
                              item.status !== "Replied" && (
                                <button
                                  className="admin-read-btn"
                                  onClick={() =>
                                    markContactRead(item.id)
                                  }
                                >
                                  Mark Read
                                </button>
                              )}

                            <button
                              className="admin-reply-btn"
                              onClick={() => {
                                setContactReplyId(item.id);
                                setContactReplyText(
                                  item.admin_response || ""
                                );
                              }}
                            >
                              Reply
                            </button>

                            <button
                              className="admin-delete-btn"
                              onClick={() =>
                                deleteContactMessage(item.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {contactReplyId === item.id && (
                        <tr className="reply-row">
                          <td colSpan="9">
                            <div className="admin-reply-box">
                              <textarea
                                value={contactReplyText}
                                onChange={(e) =>
                                  setContactReplyText(e.target.value)
                                }
                                placeholder="Write your response..."
                                rows="3"
                              />

                              <div className="admin-form-actions">
                                <button
                                  className="admin-secondary-btn"
                                  onClick={() => {
                                    setContactReplyId(null);
                                    setContactReplyText("");
                                  }}
                                >
                                  Cancel
                                </button>

                                <button
                                  className="admin-primary-btn"
                                  onClick={() =>
                                    replyToContact(item.id)
                                  }
                                  disabled={loading}
                                >
                                  {loading
                                    ? "Sending..."
                                    : "Send Response"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // PROGRESS SECTION

  const renderProgress = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>User Progress</h1>
            <p>View weight progress records submitted by users.</p>
          </div>

          <button className="admin-refresh-btn" onClick={loadProgress}>
            ↻ Refresh
          </button>
        </div>

        <div className="admin-content-card">
          <div className="admin-card-heading">
            <h2>Progress Records</h2>

            <span className="admin-count">
              {progress.length} records
            </span>
          </div>

          {progress.length === 0 ? (
            <div className="admin-empty">
              No progress records available.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>User ID</th>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Weight (kg)</th>
                    <th>Progress Date</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {progress.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>#{item.user_id}</td>
                      <td>{item.name || "-"}</td>
                      <td>{item.email || "-"}</td>

                      <td>
                        <strong>{item.weight} kg</strong>
                      </td>

                      <td>{item.progress_date || "-"}</td>
                      <td>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // ADMINS SECTION

  const renderAdmins = () => {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Admins</h1>
            <p>View registered NutriFit administrators.</p>
          </div>

          <button className="admin-refresh-btn" onClick={loadAdmins}>
            ↻ Refresh
          </button>
        </div>

        <div className="admin-content-card">
          <div className="admin-card-heading">
            <h2>Admin Accounts</h2>

            <span className="admin-count">
              {admins.length} admins
            </span>
          </div>

          {admins.length === 0 ? (
            <div className="admin-empty">
              No admin accounts found.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Admin ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Created At</th>
                    <th>Account</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>#{admin.id}</td>

                      <td>
                        <strong>{admin.name}</strong>
                      </td>

                      <td>{admin.email}</td>
                      <td>{formatDate(admin.created_at)}</td>

                      <td>
                        {String(admin.id) === String(adminId) ? (
                          <span className="admin-status status-current">
                            Current Admin
                          </span>
                        ) : (
                          <span className="admin-status status-read">
                            Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

 const handleLogout = () => {
  const confirmLogout = window.confirm(
    "Are you sure you want to logout?"
  );

  if (!confirmLogout) {
    return;
  }

  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_id");
  localStorage.removeItem("admin_name");
  localStorage.removeItem("admin_email");
  localStorage.removeItem("adminLoggedIn");

  navigate("/admin/login", {
    replace: true,
  });
};


// SETTINGS SECTION

const renderSettings = () => {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Settings</h1>
          <p>View your administrator account information.</p>
        </div>
      </div>

      <div className="admin-settings-card">
        <div className="admin-profile-icon">👤</div>

        <h2>{adminName}</h2>

        <p>{adminEmail}</p>

        <div className="admin-account-info">
          <div>
            <span>Admin ID</span>
            <strong>#{adminId}</strong>
          </div>

          <div>
            <span>Account Type</span>
            <strong>Administrator</strong>
          </div>

          <div>
            <span>Authentication</span>
            <strong>JWT + Local Storage</strong>
          </div>
        </div>

        <button
          className="admin-logout-settings-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

        <button
          className="admin-logout-settings-btn"
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </>
  );
};

  // SECTION CONTENT

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();

      case "users":
        return renderUsers();

      case "foods":
        return renderFoods();

      case "feedback":
        return renderFeedback();

      case "contact":
        return renderContact();

      case "progress":
        return renderProgress();

      case "admins":
        return renderAdmins();

      case "settings":
        return renderSettings();

      default:
        return renderDashboard();
    }
  };

  // MAIN UI

  return (
    <div className="admin-dashboard">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div className="admin-sidebar-logo">
          <div className="admin-logo-icon">🥗</div>

          <div>
            <h2>NutriFit</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="admin-sidebar-profile">
          <div className="admin-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <nav className="admin-nav">

          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            <span>▣</span>
            Dashboard
          </button>

          <button
            className={activeSection === "users" ? "active" : ""}
            onClick={() => setActiveSection("users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            className={activeSection === "foods" ? "active" : ""}
            onClick={() => setActiveSection("foods")}
          >
            <span>🥗</span>
            Foods
          </button>

          <button
            className={activeSection === "feedback" ? "active" : ""}
            onClick={() => setActiveSection("feedback")}
          >
            <span>💬</span>
            Feedback

            {unreadFeedback > 0 && (
              <span className="admin-nav-badge">
                {unreadFeedback}
              </span>
            )}
          </button>

          <button
            className={activeSection === "contact" ? "active" : ""}
            onClick={() => setActiveSection("contact")}
          >
            <span>✉️</span>
            Contact Messages

            {unreadMessages > 0 && (
              <span className="admin-nav-badge">
                {unreadMessages}
              </span>
            )}
          </button>

          <button
            className={activeSection === "progress" ? "active" : ""}
            onClick={() => setActiveSection("progress")}
          >
            <span>📈</span>
            Progress
          </button>

          <button
            className={activeSection === "admins" ? "active" : ""}
            onClick={() => setActiveSection("admins")}
          >
            <span>🛡️</span>
            Admins
          </button>

          <button
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => setActiveSection("settings")}
          >
            <span>⚙️</span>
            Settings
          </button>

          <button
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => navigate("/admin/login")}
          >
            <span>🔐</span>
            Login
          </button>

        </nav>

      </aside>

      {/* MAIN CONTENT */}

      <main className="admin-main">

        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              NutriFit Administration
            </span>
          </div>

          <div className="admin-topbar-user">
            <div className="admin-top-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>
              <span>{adminEmail}</span>
            </div>
          </div>
        </header>

        <section className="admin-content">

          {message && (
            <div className="admin-alert admin-success">
              <span>✓</span>
              {message}

              <button onClick={() => setMessage("")}>
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="admin-alert admin-error">
              <span>!</span>
              {error}

              <button onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}

          {renderSection()}

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;