import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, permission }) => {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) return <Navigate to="/" replace />;
  if (permission && !userInfo.user?.role?.permissions?.includes(permission))
    return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
