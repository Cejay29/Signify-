// src/hooks/arcade/useArcadeLeaderboard.js
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function sinceISO(filter) {
  const now = Date.now();
  if (filter === "daily") return new Date(now - 1 * 86400 * 1000).toISOString();
  if (filter === "weekly")
    return new Date(now - 7 * 86400 * 1000).toISOString();
  return null; // "all"
}

export default function useArcadeLeaderboard(initialFilter = "daily") {
  const [filter, setFilter] = useState(initialFilter);
  const [rows, setRows] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const load = useCallback(
    async (f = filter) => {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        setCurrentUserId(session?.session?.user?.id || null);

        let query = supabase
          .from("arcade_best")
          .select(
            "user_id, score, max_streak, xp_earned, gems_earned, created_at"
          )
          .order("score", { ascending: false })
          .limit(20);

        const iso = sinceISO(f);
        if (iso) query = query.gte("created_at", iso);

        const { data, error } = await query;
        if (error) throw error;

        const best = data || [];
        if (best.length === 0) {
          setRows([]);
          return;
        }

        // Get usernames in one request
        const ids = [...new Set(best.map((r) => r.user_id))];
        const { data: users, error: userErr } = await supabase
          .from("users")
          .select("id, username")
          .in("id", ids);

        if (userErr)
          console.warn("⚠️ Username fetch failed, using 'Player'", userErr);

        const nameMap = {};
        users?.forEach((u) => (nameMap[u.id] = u.username || "Player"));

        setRows(
          best.map((r) => ({
            ...r,
            username: nameMap[r.user_id] || "Player",
          }))
        );
      } catch (e) {
        console.error("❌ Leaderboard load error:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  // Auto-refresh controls
  const startAutoRefresh = useCallback(
    (intervalMs = 10000) => {
      stopAutoRefresh();
      intervalRef.current = setInterval(() => {
        load(filter).catch((e) => console.warn("Auto-refresh load error:", e));
      }, intervalMs);
    },
    [filter, load]
  );

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  return {
    filter,
    setFilter,
    rows,
    load,
    loading,
    currentUserId,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
