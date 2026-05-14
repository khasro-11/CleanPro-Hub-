"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Calendar,
  Clock,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/mitarbeiter", label: "Mitarbeiter", icon: UserCheck },
  { href: "/auftraege", label: "Aufträge", icon: ClipboardList },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/zeiterfassung", label: "Zeiterfassung", icon: Clock },
  { href: "/berichte", label: "Berichte", icon: BarChart3 },
  { href: "/assistent", label: "KI-Assistent", icon: Bot },
];

const bottomItems = [
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col bg-brand-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">CleanPro Hub</p>
          <p className="mt-0.5 text-[10px] text-white/50">Reinigungsservice</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Verwaltung
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
              isActive(href, exact)
                ? "bg-brand-500/20 text-brand-300"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
              isActive(href)
                ? "bg-brand-500/20 text-brand-300"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
