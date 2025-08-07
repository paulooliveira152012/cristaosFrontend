// src/components/ProtectedRoute.js

// import { UserContext } from "../context/UserContext";
import { useUser } from "../context/UserContext.js";

import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.leader) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;