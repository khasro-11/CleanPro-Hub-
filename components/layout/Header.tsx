"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? "??";
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = getInitials(user?.name, user?.email);
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : "Mitarbeiter";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-brand-500 text-[11px] font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm font-medium leading-none">{user?.name ?? user?.email}</span>
              <span className="mt-0.5 text-[11px] text-muted-foreground">{roleLabel}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name ?? "Benutzer"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
