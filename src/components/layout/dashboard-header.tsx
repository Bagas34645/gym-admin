"use client";

import Link from "next/link";
import { LogOut, MonitorSmartphone } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { meQuery, logoutMutation } = useAuth();
  const user = meQuery.data;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-end gap-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto gap-2 px-2 py-1.5"
                aria-label="Menu akun"
              >
                <Avatar className="size-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left text-sm sm:block">
                  <p className="font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem asChild>
                <Link href="/account/login-activity">
                  <MonitorSmartphone className="size-4" />
                  Aktivitas Login
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={logoutMutation.isPending}
                onSelect={() => logoutMutation.mutate()}
              >
                <LogOut className="size-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        )}
      </div>
    </header>
  );
}
