"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TrainerHeader } from "@/components/layout/trainer-header";
import { TrainerSidebar } from "@/components/layout/trainer-sidebar";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <TrainerSidebar />
      <SidebarInset>
        <TrainerHeader />
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
