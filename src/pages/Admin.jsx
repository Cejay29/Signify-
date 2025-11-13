import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { createIcons } from "lucide";
import Chart from "chart.js/auto";

export default function Admin() {
  const [stats, setStats] = useState({
    users: 0,
    lessons: 0,
    gestures: 0,
    modelStatus: "Loading...",
  });

  useEffect(() => {
    createIcons(); // activate lucide
    loadDashboard();
  }, []);

  async function loadDashboard() {
    // USERS
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // LESSONS
    const { count: lessonCount } = await supabase
      .from("lesson")
      .select("*", { count: "exact", head: true });

    // GESTURES
    const { count: gestureCount } = await supabase
      .from("gesture_sample")
      .select("*", { count: "exact", head: true });

    // MODEL VERSIONS
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
    new Chart(document.getElementById("xpChart"), {
      type: "bar",
      data: {
        labels: users.map((u) => u.username),
        datasets: [
          {
            label: "XP",
            data: users.map((u) => u.xp),
          },
        ],
      },
    });

    // STREAK CHART
    new Chart(document.getElementById("streakChart"), {
      type: "line",
      data: {
        labels: users.map((u) => u.username),
        datasets: [
          {
            label: "Streak",
            data: users.map((u) => u.streak),
          },
        ],
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
        <div className="p-6 border-b flex items-center gap-2">
          <i data-lucide="brain" className="w-6 h-6 text-indigo-600"></i>
          <h1 className="text-2xl font-bold text-indigo-600">Signify Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 text-gray-700">
          <a className="p-2 rounded bg-indigo-100 text-indigo-600 font-semibold flex items-center gap-2">
            <i data-lucide="home" className="w-5 h-5"></i> Dashboard
          </a>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded flex items-center justify-center gap-2"
          >
            <i data-lucide="log-out" className="w-5 h-5"></i> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <i data-lucide="bar-chart-3" className="w-7 h-7 text-indigo-600"></i>
          Dashboard Overview
        </h2>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon="users" label="Total Users" value={stats.users} />
          <StatCard icon="book-open" label="Total Lessons" value={stats.lessons} />
          <StatCard icon="hand" label="Total Gestures" value={stats.gestures} />
          <StatCard icon="cpu" label="Model Status" value={stats.modelStatus} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CanvasBox title="XP Leaderboard" icon="activity" id="xpChart" />
          <CanvasBox title="Streak Leaderboard" icon="flame" id="streakChart" />
        </div>
      </main>
    </div>
  );
}

// COMPONENTS
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-5 flex flex-col items-center">
      <i data-lucide={icon} className="w-8 h-8 text-indigo-600 mb-2"></i>
      <p className="text-gray-500 text-sm">{label}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  );
}

function CanvasBox({ title, icon, id }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <i data-lucide={icon} className="w-5 h-5 text-indigo-600"></i>
        {title}
      </h3>
      <canvas id={id} height="200"></canvas>
    </div>
  );
}
