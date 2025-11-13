import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      // 1️⃣ Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAllowed(false); // not logged in
        return;
      }

      const userId = session.user.id;

      // 2️⃣ Check if user exists in admin_users
      const { data: adminRow, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Admin check failed:", error);
        setAllowed(false);
        return;
      }

      // adminRow = object if admin / null if not
      setAllowed(!!adminRow);
    }

    // Run immediately
    checkAuth();

    // Also listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Still checking
  if (allowed === null) return <div className="text-white p-6">Loading…</div>;

  // Not logged in OR not admin
  if (!allowed) return <Navigate to="/login" replace />;

  // Admin → allow access
  return children;
}
