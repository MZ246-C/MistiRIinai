import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Plus, CalendarDays, Settings, LogOut, Heart, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import clsx from "clsx";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/memories", label: "Memories" },
  { to: "/calendar", label: "Calendar" },
  { to: "/favorites", label: "Favorites" },
];

export function Header({
  onSearch,
  onAddMemory,
}: {
  onSearch: () => void;
  onAddMemory: () => void;
}) {
  const { logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { show } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    show("Signed out. See you soon.", "info");
    navigate("/login");
  };

  return (
    <header className="glass sticky top-0 z-30 border-b border-white/40 dark:border-white/5">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-display text-lg text-booth-plum-700 dark:text-booth-paper">
          <motion.span
            initial={{ rotate: -6, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex"
          >
            <Heart size={20} className="accent-text fill-current" />
          </motion.span>
          <span className="hidden sm:inline">MistiRinai</span>
        </NavLink>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "accent-bg"
                    : "text-booth-ink/70 hover:bg-booth-plum-50 dark:text-booth-paper/70 dark:hover:bg-white/5"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onSearch}
            aria-label="Search memories"
            className="rounded-full p-2 text-booth-ink/60 transition-colors hover:bg-booth-plum-50 dark:text-booth-paper/60 dark:hover:bg-white/5"
          >
            <Search size={18} />
          </button>
          <button
            onClick={onAddMemory}
            className="hidden items-center gap-1.5 rounded-xl accent-bg px-3.5 py-2 text-sm font-medium shadow-soft transition-transform hover:brightness-110 active:scale-95 sm:flex"
          >
            <Plus size={16} /> Add memory
          </button>
          <NavLink
            to="/calendar"
            aria-label="Calendar"
            className="hidden rounded-full p-2 text-booth-ink/60 transition-colors hover:bg-booth-plum-50 dark:text-booth-paper/60 dark:hover:bg-white/5 sm:inline-flex"
          >
            <CalendarDays size={18} />
          </NavLink>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="rounded-full p-2 text-booth-ink/60 transition-colors hover:bg-booth-plum-50 dark:text-booth-paper/60 dark:hover:bg-white/5"
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NavLink
            to="/settings"
            aria-label="Settings"
            className="hidden rounded-full p-2 text-booth-ink/60 transition-colors hover:bg-booth-plum-50 dark:text-booth-paper/60 dark:hover:bg-white/5 sm:inline-flex"
          >
            <Settings size={18} />
          </NavLink>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-full p-2 text-booth-ink/60 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-booth-paper/60 dark:hover:bg-rose-500/10"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
