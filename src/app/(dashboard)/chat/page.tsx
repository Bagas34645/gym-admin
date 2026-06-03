"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  subject?: string;
  updated_at: string;
  member?: { name: string };
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_type?: string;
  user?: { name: string };
}

export default function ChatPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["admin", "chat", "conversations"],
    queryFn: () => apiGet<Conversation[]>("/admin/chat/conversations", { per_page: 50 }),
    refetchInterval: 10_000,
  });

  const messagesQuery = useQuery({
    queryKey: ["admin", "chat", "messages", selectedId],
    queryFn: () =>
      apiGet<Message[]>(`/admin/chat/conversations/${selectedId}/messages`),
    enabled: !!selectedId,
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      apiPost(`/admin/chat/conversations/${selectedId}/messages`, {
        message: newMessage,
      }),
    onSuccess: () => {
      setNewMessage("");
      qc.invalidateQueries({ queryKey: ["admin", "chat", "messages", selectedId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const conversations = conversationsQuery.data?.data ?? [];
  const messages = messagesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Chat Dukungan" description="Percakapan dengan anggota" />

      <div className="grid h-[calc(100vh-12rem)] gap-4 md:grid-cols-3">
        <Card className="overflow-hidden md:col-span-1">
          <ScrollArea className="h-full">
            {conversationsQuery.isLoading ? (
              <Skeleton className="m-4 h-48" />
            ) : (
              <div className="divide-y">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-muted/50",
                      selectedId === c.id && "bg-muted",
                    )}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <p className="font-medium">{c.member?.name ?? "Anggota"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.subject ?? formatDateTime(c.updated_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex flex-col md:col-span-2">
          {selectedId ? (
            <>
              <ScrollArea className="flex-1 p-4">
                {messagesQuery.isLoading ? (
                  <Skeleton className="h-32" />
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          m.sender_type === "admin"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        <p className="text-xs opacity-70">{m.user?.name}</p>
                        <p>{m.message}</p>
                        <p className="mt-1 text-xs opacity-60">
                          {formatDateTime(m.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex gap-2 border-t p-4">
                <Input
                  placeholder="Tulis pesan..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMessage.trim()) sendMutation.mutate();
                  }}
                />
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                >
                  Kirim
                </Button>
              </div>
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center text-muted-foreground">
              Pilih percakapan
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
