import { NavLink, useLocation } from "react-router-dom";
import { Home, ClipboardList, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", icon: Home, label: "ホーム" },
  { to: "/board", icon: ClipboardList, label: "掲示板" },
  { to: "/members", icon: Users, label: "メンバー" },
  { to: "/mypage", icon: User, label: "マイページ" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] transition-colors",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
