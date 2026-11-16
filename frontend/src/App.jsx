import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SessionManager from "./components/SessionManager";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UsersScreen from "./screens/UsersScreen";
import RolesScreen from "./screens/RolesScreen";
import CreatorsScreen from "./screens/CreatorsScreen";
import CreatorDetailScreen from "./screens/CreatorDetailScreen";
import CreatorCreateScreen from "./screens/CreatorCreateScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <SessionManager>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <RolesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creators"
          element={
            <ProtectedRoute permission="read_creator">
              <CreatorsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creators/new"
          element={
            <ProtectedRoute permission="create_creator">
              <CreatorCreateScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creators/:id/edit"
          element={
            <ProtectedRoute permission="update_creator">
              <CreatorCreateScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creators/:id"
          element={
            <ProtectedRoute permission="read_creator">
              <CreatorDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </SessionManager>
      <ToastContainer position="top-right" autoClose={4000} newestOnTop />

    </Router>
  );
}

export default App;
