import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Brain,
  Home,
  Activity,
  Flame,
  Users,
  BookOpen,
  Hand,
  Cpu,
  LogOut,
} from "lucide-react";
import Chart from "chart.js/auto";

export default function Admin() {
  const [stats, setStats] = useState({
    users: 0,
    lessons: 0,
    gestures: 0,
    modelStatus: "Loading...",
  });

  const xpChartRef = useRef(null);
  const streakChartRef = useRef(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: lessonCount } = await supabase
      .from("lesson")
      .select("*", { count: "exact", head: true });

    const { count: gestureCount } = await supabase
      .from("gesture_sample")
      .select("*", { count: "exact", head: true });

    const { count: modelCount } = await supabase
      .from("model_versions")
      .select("*", { count: "exact", head: true });

    setStats({
      users: userCount ?? 0,
      lessons: lessonCount ?? 0,
      gestures: gestureCount ?? 0,
      modelStatus: modelCount
        ? `${modelCount} model(s) uploaded`
        : "No models uploaded",
    });

    loadCharts();
  }

  async function loadCharts() {
    const { data: users } = await supabase
      .from("users")
      .select("username, xp, streak")
      .order("xp", { ascending: false })
      .limit(5);

    if (!users) return;

    // XP CHART
    new Chart(xpChartRef.current, {
      type: "bar",
      data: {
        labels: users.map((u) => u.username),
        datasets: [{ label: "XP", data: users.map((u) => u.xp) }],
      },
    });

    // STREAK CHART
    new Chart(streakChartRef.current, {
      type: "line",
      data: {
        labels: users.map((u) => u.username),
        datasets: [{ label: "Streak", data: users.map((u) => u.streak) }],
      },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="bg-gray-100 flex min-h-screen text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <Brain className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-indigo-600">Signify Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-3 text-gray-700">
          <div className="p-2 rounded bg-indigo-100 text-indigo-600 font-semibold flex items-center gap-2">
            <Home className="w-5 h-5" /> Dashboard
          </div>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7 text-indigo-600" />
          Dashboard Overview
        </h2>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard Icon={Users} label="Total Users" value={stats.users} />
          <StatCard
            Icon={BookOpen}
            label="Total Lessons"
            value={stats.lessons}
          />
          <StatCard Icon={Hand} label="Total Gestures" value={stats.gestures} />
          <StatCard Icon={Cpu} label="Model Status" value={stats.modelStatus} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CanvasBox title="XP Leaderboard" Icon={Activity}>
            <canvas ref={xpChartRef} height="200"></canvas>
          </CanvasBox>

          <CanvasBox title="Streak Leaderboard" Icon={Flame}>
            <canvas ref={streakChartRef} height="200"></canvas>
          </CanvasBox>
        </div>
      </main>
    </div>
  );
}

function StatCard({ Icon, label, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-5 flex flex-col items-center">
      <Icon className="w-8 h-8 text-indigo-600 mb-2" />
      <p className="text-gray-500 text-sm">{label}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  );
}

function CanvasBox({ title, Icon, children }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5 text-indigo-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}
