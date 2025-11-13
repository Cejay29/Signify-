import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Hand,
  BrainCircuit,
  Users,
  LogOut,
} from "lucide-react";

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();

  async function logout() {
    const { error } = await window.supabase.auth.signOut();
    if (!error) navigate("/login");
  }

  const menu = [
    { label: "Dashboard", to: "/admin", icon: <Home className="w-5 h-5" /> },
    {
      label: "Manage Lessons",
      to: "/admin/lessons",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: "Gestures",
      to: "/admin/gestures",
      icon: <Hand className="w-5 h-5" />,
    },
    {
      label: "Model Management",
      to: "/admin/models",
      icon: <BrainCircuit className="w-5 h-5" />,
    },
    { label: "Users", to: "/admin/users", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-indigo-600">Signify Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                  isActive
                    ? "bg-indigo-100 text-indigo-600 font-semibold"
                    : "hover:bg-indigo-100"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        {title && (
          <h1 className="text-3xl font-bold mb-6 text-gray-800">{title}</h1>
        )}

        {children}
      </main>
    </div>
  );
}
