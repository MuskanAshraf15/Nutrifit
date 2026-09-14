import React from "react";
import { Navigate } from "react-router-dom";

function AdminProtectedRoute({ children }) {
  const adminLoggedIn = sessionStorage.getItem("adminLoggedIn");

  if (adminLoggedIn !== "true") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
