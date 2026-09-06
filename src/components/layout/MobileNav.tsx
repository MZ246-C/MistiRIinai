import { NavLink } from "react-router-dom";
import { Home, Image, CalendarDays, Plus, MoreHorizontal } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/memories", label: "Memories", icon: Image, end: false },
  { to: "__add", label: "Add", icon: Plus, end: false },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, end: false },
  { to: "/settings", label: "More", icon: MoreHorizontal, end: false },
];

export function MobileNav({ onAddMemory }: { onAddMemory: () => void }) {
  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/40 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] dark:border-white/5 md:hidden"
      aria-label="Primary"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        if (item.to === "__add") {
          return (
            <button
              key="add"
              onClick={onAddMemory}
              aria-label="Add memory"
              className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full accent-bg shadow-glow active:scale-95"
            >
              <Icon size={22} />
            </button>
          );
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] font-medium",
                isActive ? "accent-text" : "text-booth-ink/50 dark:text-booth-paper/50"
              )
            }
          >
            <Icon size={20} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
