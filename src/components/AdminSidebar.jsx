import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Home,
  BookOpen,
  Hand,
  Cpu,
  Users,
  LogOut,
  MoreHorizontal,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function AdminSidebar({ onLogout }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ADMIN NAVIGATION
  const navItems = [
    {
      label: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      path: "/admin",
    },
    {
      label: "Manage Lessons",
      icon: <BookOpen className="w-5 h-5" />,
      path: "/admin/lessons",
    },
    {
      label: "Gestures",
      icon: <Hand className="w-5 h-5" />,
      path: "/admin/gestures",
    },
    {
      label: "Model Management",
      icon: <Cpu className="w-5 h-5" />,
      path: "/admin/models",
    },
    {
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      path: "/admin/users",
    },
  ];

  /* -----------------------------------------
      NAVIGATION BUTTON
  ----------------------------------------- */
  const SidebarButton = ({ label, icon, path }) => {
    const active = pathname === path;

    return (
      <button
        onClick={() => {
          navigate(path);
          setMobileOpen(false);
        }}
        className={`
          nav-btn flex items-center transition-all rounded-lg
          ${active ? "active" : ""}
          
          /* Desktop full width */
          xl:w-full xl:px-4 xl:gap-3 xl:justify-start

          /* Tablet icon only */
          md:w-16 md:justify-center md:px-0 md:gap-0

          /* Mobile drawer */
          ${mobileOpen ? "w-full px-4 gap-3 justify-start" : ""}
        `}
      >
        {icon}
        <span className="hidden xl:inline ml-2 text-sm">{label}</span>
        {mobileOpen && <span className="xl:hidden ml-3 text-sm">{label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* 🍔 MOBILE MENU BUTTON */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`
          md:hidden fixed top-5 left-5 z-[60]
          bg-[#2A2A3C] border border-[#C5CAFF]
          w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
          ${mobileOpen ? "hidden" : "block"}
        `}
      >
        <Menu className="w-7 h-7 text-white" />
      </button>

      {/* 🔳 MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[49] md:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* 🟦 SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-[50]
          bg-[#14142B] border-r border-[#2a2a3c]
          flex flex-col py-6 transition-all duration-300

          /* Mobile drawer */
          ${
            mobileOpen
              ? "translate-x-0 w-[250px]"
              : "-translate-x-full w-[250px]"
          }

          /* Tablet: icon-only */
          md:translate-x-0 md:w-20 md:px-3

          /* Desktop: expanded */
          xl:w-[250px] xl:px-6
        `}
      >
        {/* ❌ Close button (mobile only) */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-5 right-5 md:hidden"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        )}

        {/* LOGO */}
        <div className="text-center mb-8 select-none">
          {/* Desktop logo */}
          <h2 className="hidden xl:block text-4xl font-extrabold text-[#FFC400]">
            Signify Admin
          </h2>

          {/* Tablet logo */}
          <h2 className="hidden md:block xl:hidden text-3xl font-extrabold text-[#FFC400]">
            SA
          </h2>

          {/* Mobile logo */}
          {mobileOpen && (
            <h2 className="text-3xl font-extrabold text-[#FFC400] md:hidden">
              Signify Admin
            </h2>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-3 mt-2">
          {navItems.map((item) => (
            <SidebarButton key={item.path} {...item} />
          ))}

          {/* MORE / LOGOUT */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`
                nav-btn flex items-center w-full transition
                md:px-0 md:justify-center
                xl:px-4 xl:justify-between
                ${mobileOpen ? "px-4 justify-between" : ""}
              `}
            >
              <span className="flex items-center gap-2 md:gap-0">
                <MoreHorizontal className="w-5 h-5" />
                <span className="hidden xl:inline">MORE</span>
                {mobileOpen && <span className="xl:hidden ml-2">MORE</span>}
              </span>

              <ChevronDown
                className={`
                  w-4 h-4 text-white transition-transform
                  ${moreOpen ? "rotate-180" : ""}
                  hidden md:hidden xl:block
                  ${mobileOpen ? "block" : ""}
                `}
              />
            </button>

            {/* DROPDOWN */}
            {moreOpen && (
              <div
                className={`
                  mt-2 space-y-1
                  xl:ml-12
                  ${mobileOpen ? "ml-5" : ""}
                `}
              >
                <button
                  onClick={() => onLogout()}
                  className="nav-btn text-red-400 hover:bg-[#3a3a55] flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden xl:inline">LOGOUT</span>
                  {mobileOpen && <span className="xl:hidden ml-2">LOGOUT</span>}
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
