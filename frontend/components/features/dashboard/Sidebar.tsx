"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/review");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-[220px] bg-[#1a1612] hidden md:flex flex-col z-10 shrink-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2e2924]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <LogoMark size={26} color="#ff6600" />
          <span
            className="text-white font-bold text-sm tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            PYMES-AI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "transition-[background-color,color] duration-150 ease-out",
                active
                  ? "bg-[#ff6600] text-white"
                  : "text-white/60 hover:bg-[#2e2924] hover:text-white"
              )}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[#2e2924] p-3 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#ff6600] text-white font-bold text-xs flex items-center justify-center shrink-0"
              style={{ fontFamily: "var(--font-display)" }}>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate" style={{ fontFamily: "var(--font-sans)" }}>
                {user.name}
              </p>
              <p className="text-[10px] text-white/40 truncate" style={{ fontFamily: "var(--font-sans)" }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-white/60
            hover:bg-[#2e2924] hover:text-[#f87171]
            transition-[background-color,color] duration-150 ease-out"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
