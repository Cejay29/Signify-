import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

import AdminLayout from "../layouts/AdminLayout"; // ✅ FIXED IMPORT

import { Activity, Flame, Users, BookOpen, Hand, Cpu } from "lucide-react";
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

    new Chart(xpChartRef.current, {
      type: "bar",
      data: {
        labels: users.map((u) => u.username),
        datasets: [{ label: "XP", data: users.map((u) => u.xp) }],
      },
    });

    new Chart(streakChartRef.current, {
      type: "line",
      data: {
        labels: users.map((u) => u.username),
        datasets: [{ label: "Streak", data: users.map((u) => u.streak) }],
      },
    });
  }

  return (
    <AdminLayout title="Dashboard Overview">
      {/* Main Dashboard */}
      <h2 className="text-3xl font-bold flex items-center gap-2 mb-6">
        <Activity className="w-7 h-7 text-indigo-600" />
        Dashboard Overview
      </h2>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard Icon={Users} label="Total Users" value={stats.users} />
        <StatCard Icon={BookOpen} label="Total Lessons" value={stats.lessons} />
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
    </AdminLayout>
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
