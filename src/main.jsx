import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

/* PUBLIC PAGES */
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import Lesson from "./pages/Lesson";
import Alphabet from "./pages/Alphabet";
import Arcade from "./pages/Arcade";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";

/* WRAPPERS */
import PageLoaderWrapper from "./components/PageLoaderWrapper";
import ProtectedRoute from "./components/ProtedtedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

/* ADMIN PAGES */
import Admin from "./pages/Admin";
import AdminLessons from "./pages/AdminLessons";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* =========================
          ADMIN ROUTES (NO LOADER)
      ========================== */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <Admin />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/lessons"
        element={
          <AdminProtectedRoute>
            <AdminLessons />
          </AdminProtectedRoute>
        }
      />

      {/* Admin signup (public) */}
      <Route path="/admin-signup" element={<AdminSignup />} />

      {/* =========================
          PUBLIC + USER ROUTES
          (WRAPPED IN LOADER)
      ========================== */}
      <Route
        path="/*"
        element={
          <PageLoaderWrapper>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route
                path="/homepage"
                element={
                  <ProtectedRoute>
                    <Homepage />
                  </ProtectedRoute>
                }
              />

              <Route path="/lesson" element={<Lesson />} />
              <Route path="/alphabet" element={<Alphabet />} />
              <Route path="/arcade" element={<Arcade />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/profile" element={<Profile />} />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
          </PageLoaderWrapper>
        }
      />
    </Routes>
  </BrowserRouter>
);
