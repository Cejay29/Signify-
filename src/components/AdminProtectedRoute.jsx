import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    async function check() {
      // 1. Check if logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setAllowed(false);
        return;
      }

      const userId = session.user.id;

      // 2. Check admin_users table
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      setAllowed(!!adminRow);
    }

    check();
  }, []);

  if (allowed === null) return <div className="text-white p-6">Loading…</div>;

  if (!allowed) return <Navigate to="/landing" replace />;

  return children;
}
