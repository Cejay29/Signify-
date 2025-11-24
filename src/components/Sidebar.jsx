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
      NAV BUTTON
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
          flex items-center transition-all rounded-xl font-medium py-3 select-none
          xl:w-full xl:px-4 xl:gap-3 xl:justify-start
          md:w-16 md:justify-center md:px-0
          ${mobileOpen ? "w-full px-4 gap-3 justify-start" : ""}

          ${active
            ? `
                bg-gradient-to-r from-[#FF3F7F] to-[#FFC400]
                text-[#2E1426]
                shadow-[0_0_18px_rgba(255,63,127,0.5)]
                border border-[#FFD1E3]
              `
            : `
                bg-[#3A1E32]/40
                border border-[#6A3B57]/40
                text-white/90
                hover:bg-[#6A3B57]/40 hover:border-[#C27BA0]/40 hover:shadow-md
              `
          }
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
      {/* 🍔 MOBILE BURGER */}
      <button
        onClick={() => setMobileOpen(true)}
        className="
          md:hidden fixed top-5 left-5 z-[60]
          bg-[#3A1E32]/70 backdrop-blur-xl
          border border-[#6A3B57]
          w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
        "
      >
        <Menu className="w-7 h-7 text-white" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[49] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 🌙 SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-[50]
          bg-[#2E1426]/80 backdrop-blur-2xl
          border-r border-[#6A3B57]/40
          flex flex-col py-6 transition-all duration-300

          ${mobileOpen ? "translate-x-0 w-[250px]" : "-translate-x-full w-[250px]"}
          md:translate-x-0 md:w-20 md:px-3
          xl:w-[250px] xl:px-6
        `}
      >
        {/* ❌ Mobile Close */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-5 right-5 md:hidden"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-10">
          <h2 className="hidden xl:block text-4xl font-extrabold text-yellow-300 drop-shadow-xl">
            Signify
          </h2>

          <h2 className="hidden md:block xl:hidden text-3xl font-extrabold text-yellow-300">
            S
          </h2>

          {mobileOpen && (
            <h2 className="text-3xl font-extrabold text-yellow-300 drop-shadow-md md:hidden">
              Signify
            </h2>
          )}
        </div>

        {/* NAV */}
        <nav className="flex flex-col gap-3 mt-2">
          {navItems.map((item) => (
            <SidebarButton key={item.path} {...item} />
          ))}

          {/* MORE */}
          <div className="relative mt-2">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`
                flex items-center w-full transition rounded-xl py-3
                bg-[#3A1E32]/40 border border-[#6A3B57]/40 text-white/90
                hover:bg-[#6A3B57]/40
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
                  w-4 h-4 text-white transition-transform
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
                    bg-red-500/10 text-red-300 border border-red-300/20
                    hover:bg-red-500/20
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
