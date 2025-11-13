import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import Lesson from "./pages/Lesson";
import PageLoaderWrapper from "./components/PageLoaderWrapper";
import ProtectedRoute from "./components/ProtedtedRoute";
import Alphabet from "./pages/Alphabet";
import Arcade from "./pages/Arcade";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <PageLoaderWrapper>
      <Routes>
        {/* ✅ Default route redirects to /landing */}
        <Route path="/" element={<Landing />} />

        {/* Pages */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/lesson" element={<Lesson />} />
        <Route path="/alphabet" element={<Alphabet />} />
        <Route path="/arcade" element={<Arcade />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />

        {/* Protected route */}
        <Route
          path="/homepage"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />

        {/* Optional 404 fallback */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </PageLoaderWrapper>
  </BrowserRouter>
);
