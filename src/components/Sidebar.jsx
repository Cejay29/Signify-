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
    {
      label: "LEARN",
      icon: <BookOpen className="w-5 h-5" />,
      path: "/homepage",
    },
    {
      label: "ALPHABET & MORE",
      icon: <Type className="w-5 h-5" />,
      path: "/alphabet",
    },
    { label: "SHOP", icon: <ShoppingBag className="w-5 h-5" />, path: "/shop" },
    { label: "PROFILE", icon: <User className="w-5 h-5" />, path: "/profile" },
  ];

  /* -----------------------------------------
      NAVIGATION BUTTON COMPONENT
  ----------------------------------------- */
  const SidebarButton = ({ label, icon, path }) => {
    const active = pathname === path;

    return (
      <button
        onClick={() => {
          navigate(path);
          setMobileOpen(false); // CLOSE drawer on mobile only
        }}
        className={`
          nav-btn flex items-center transition-all rounded-lg

          ${active ? "active" : ""}

          /* Desktop: Full width and labels */
          xl:w-full xl:px-4 xl:gap-3 xl:justify-start

          /* Tablet: Icon only */
          md:w-16 md:justify-center md:px-0 md:gap-0

          /* Mobile: Full drawer */
          ${mobileOpen ? "w-full px-4 gap-3 justify-start" : ""}
        `}
      >
        {icon}

        {/* Desktop label */}
        <span className="hidden xl:inline ml-2 text-sm">{label}</span>

        {/* MOBILE label (drawer open) */}
        {mobileOpen && (
          <span className="xl:hidden block ml-3 text-sm">{label}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* 🍔 MOBILE BURGER BUTTON */}
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

          /* Tablet: icon-only always visible */
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
        <div className="text-center mb-8">
          {/* Desktop full logo */}
          <h2 className="hidden xl:block text-4xl font-extrabold text-[#FFC400]">
            Signify
          </h2>

          {/* Tablet icon-only logo */}
          <h2 className="hidden md:block xl:hidden text-3xl font-extrabold text-[#FFC400]">
            S
          </h2>

          {/* Mobile full logo */}
          {mobileOpen && (
            <h2 className="text-3xl font-extrabold text-[#FFC400] md:hidden">
              Signify
            </h2>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-3 mt-2">
          {navItems.map((item) => (
            <SidebarButton key={item.path} {...item} />
          ))}

          {/* MORE + LOGOUT */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`
                nav-btn flex items-center w-full transition

                /* Tablet icon-only */
                md:px-0 md:justify-center

                /* Desktop spacing */
                xl:px-4 xl:justify-between

                /* Mobile drawer full */
                ${mobileOpen ? "px-4 justify-between" : ""}
              `}
            >
              <span className="flex items-center gap-2 md:gap-0">
                <MoreHorizontal className="w-5 h-5" />

                {/* Desktop label */}
                <span className="hidden xl:inline">MORE</span>

                {/* Mobile drawer label */}
                {mobileOpen && <span className="xl:hidden ml-2">MORE</span>}
              </span>

              {/* Chevron for Desktop + Mobile */}
              <ChevronDown
                className={`
                  w-4 h-4 text-white transition-transform
                  ${moreOpen ? "rotate-180" : ""}

                  /* hide on tablet */
                  hidden md:hidden

                  /* show on desktop */
                  xl:block

                  /* show on mobile */
                  ${mobileOpen ? "block" : ""}
                `}
              />
            </button>

            {/* DROPDOWN CONTENT: WORKS ON ALL SCREEN SIZES */}
            {moreOpen && (
              <div
                className={`
                  mt-2 space-y-1
                  xl:ml-12  /* Desktop spacing */
                  ${mobileOpen ? "ml-5" : ""}
                `}
              >
                <button
                  onClick={() => {
                    onLogout();
                    setMobileOpen(false);
                  }}
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
