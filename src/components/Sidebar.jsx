import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  User,
  Type,
  MoreHorizontal,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar({ onLogout }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = [
    { label: "LEARN", icon: <BookOpen className="w-5 h-5" />, path: "/homepage" },
    { label: "ALPHABET & MORE", icon: <Type className="w-5 h-5" />, path: "/alphabet" },
    { label: "ARCADE", icon: <Gamepad2 className="w-5 h-5" />, path: "/arcade" },
    { label: "SHOP", icon: <ShoppingBag className="w-5 h-5" />, path: "/shop" },
    { label: "PROFILE", icon: <User className="w-5 h-5" />, path: "/profile" },
  ];

  /* -----------------------------------------
      REUSABLE NAV BUTTON
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
          flex items-center transition-all rounded-xl font-medium
          py-3 select-none relative
          
          /* Desktop full width */
          xl:w-full xl:px-4 xl:gap-3 xl:justify-start

          /* Tablet icon-only */
          md:w-16 md:justify-center md:px-0 md:gap-0

          /* Mobile drawer */
          ${mobileOpen ? "w-full px-4 gap-3 justify-start" : ""}

          ${active
            ? `
                bg-gradient-to-r from-[#FFC400] to-[#FF3F7F]
                text-[#1C1B2E]
                shadow-lg shadow-[#FF3F7F]/40
                ring-2 ring-white/60
              `
            : `
                bg-white/15 backdrop-blur-md text-white
                border border-white/20
                hover:bg-white/25 hover:shadow-md
              `
          }
        `}
      >
        {icon}

        <span className="hidden xl:inline ml-2 text-sm">{label}</span>

        {mobileOpen && <span className="xl:hidden block ml-3 text-sm">{label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* 🍔 MOBILE BURGER */}
      <button
        onClick={() => setMobileOpen(true)}
        className="
          md:hidden fixed top-5 left-5 z-[60]
          bg-white/20 backdrop-blur-xl
          border border-white/40
          w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
        "
      >
        <Menu className="w-7 h-7 text-white" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[49] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 🌈 SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-[50]
          bg-white/10 backdrop-blur-2xl
          border-r border-white/30
          flex flex-col py-6 transition-all duration-300

          /* Mobile drawer */
          ${mobileOpen
            ? "translate-x-0 w-[250px]"
            : "-translate-x-full w-[250px]"
          }

          /* Tablet */
          md:translate-x-0 md:w-20 md:px-3

          /* Desktop */
          xl:w-[250px] xl:px-6
        `}
      >
        {/* ❌ Close (mobile) */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-5 right-5 md:hidden"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}

        {/* LOGO */}
        <div className="text-center mb-10">
          {/* Large logo */}
          <h2 className="hidden xl:block text-4xl font-extrabold text-yellow-300 drop-shadow-md">
            Signify
          </h2>

          {/* Compact tablet logo */}
          <h2 className="hidden md:block xl:hidden text-3xl font-extrabold text-yellow-300 drop-shadow-md">
            S
          </h2>

          {/* Mobile drawer logo */}
          {mobileOpen && (
            <h2 className="text-3xl font-extrabold text-yellow-300 drop-shadow-md md:hidden">
              Signify
            </h2>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-3 mt-2">
          {navItems.map((item) => (
            <SidebarButton key={item.path} {...item} />
          ))}

          {/* MORE */}
          <div className="relative mt-2">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`
                flex items-center w-full transition rounded-xl
                py-3
                bg-white/15 backdrop-blur-md text-white
                hover:bg-white/25

                md:justify-center
                xl:px-4 xl:justify-between
                ${mobileOpen ? "px-4 justify-between" : ""}
              `}
            >
              <span className="flex items-center gap-2">
                <MoreHorizontal className="w-5 h-5" />
                <span className="hidden xl:inline">MORE</span>
                {mobileOpen && <span className="xl:hidden ml-2">MORE</span>}
              </span>

              <ChevronDown
                className={`
                  w-4 h-4 transition-transform
                  ${moreOpen ? "rotate-180" : ""}
                  hidden xl:block
                  ${mobileOpen ? "block" : ""}
                `}
              />
            </button>

            {moreOpen && (
              <div className={`mt-2 space-y-1 xl:ml-10 ${mobileOpen ? "ml-5" : ""}`}>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileOpen(false);
                  }}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-xl
                    bg-red-500/20 text-red-300
                    border border-red-300/40
                    hover:bg-red-500/30
                  "
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden xl:inline">LOGOUT</span>
                  {mobileOpen && <span className="xl:hidden">LOGOUT</span>}
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
