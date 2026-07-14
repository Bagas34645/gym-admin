"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { disconnectEcho, initEcho } from "@/lib/echo";
import type Echo from "laravel-echo";

import {
  CHAT_CONVERSATIONS_KEY,
  loadChatViewedMap,
  saveChatViewedMap,
  type ChatViewedMap,
} from "@/lib/chat-inbox";

interface Conversation {
  id: string;
  member_id?: string | null;
  subject?: string;
  status?: string;
  updated_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  other_party_name?: string | null;
  member?: { id?: string; name: string; email?: string } | null;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  conversation_id?: string;
  sender?: { id: string; name: string };
}

/** One sidebar row = one member (duplicate threads collapsed to latest). */
interface MemberThread {
  key: string;
  memberId: string | null;
  name: string;
  primaryConversationId: string;
  conversationIds: string[];
  lastMessage?: string;
  updatedAt: string;
  activityStamp: string;
}

type ConversationsCache = {
  data: Conversation[];
  message: string;
  meta?: { page: number; per_page: number; total: number };
};

type MessagesCache = {
  data: Message[];
  message: string;
};

const CONVERSATIONS_KEY = CHAT_CONVERSATIONS_KEY;
const messagesKey = (id: string) => ["admin", "chat", "messages", id] as const;

type ViewedMap = ChatViewedMap;

function loadViewedMap(): ViewedMap {
  return loadChatViewedMap();
}

function saveViewedMap(map: ViewedMap) {
  saveChatViewedMap(map);
}

function displayName(c: Conversation): string {
  return (c.other_party_name ?? c.member?.name ?? "Anggota").trim() || "Anggota";
}

function memberIdOf(c: Conversation): string | null {
  const raw = c.member_id ?? c.member?.id;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw);
}

function conversationTime(c: Conversation): number {
  const raw = c.last_message_at ?? c.updated_at;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function asConversationList(data: unknown): Conversation[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is Conversation =>
      !!item && typeof item === "object" && typeof (item as Conversation).id === "string",
  );
}

function dedupeConversations(list: Conversation[]): Conversation[] {
  const byId = new Map<string, Conversation>();
  for (const c of list) {
    const existing = byId.get(c.id);
    if (!existing || conversationTime(c) >= conversationTime(existing)) {
      byId.set(c.id, c);
    }
  }
  return [...byId.values()];
}

function groupConversationsByMember(conversations: Conversation[]): MemberThread[] {
  const byMemberId = new Map<string, Conversation[]>();
  const byName = new Map<string, Conversation[]>();

  for (const c of conversations) {
    const memberId = memberIdOf(c);
    if (memberId) {
      const list = byMemberId.get(memberId) ?? [];
      list.push(c);
      byMemberId.set(memberId, list);
      continue;
    }
    const nameKey = displayName(c).toLowerCase();
    const list = byName.get(nameKey) ?? [];
    list.push(c);
    byName.set(nameKey, list);
  }

  const nameUsedById = new Map<string, string>();
  for (const [memberId, list] of byMemberId) {
    nameUsedById.set(displayName(list[0]).toLowerCase(), memberId);
  }

  for (const [nameKey, list] of byName) {
    const existingId = nameUsedById.get(nameKey);
    if (existingId) {
      byMemberId.get(existingId)!.push(...list);
    } else {
      byMemberId.set(`name:${nameKey}`, list);
    }
  }

  const threads: MemberThread[] = [];

  for (const [key, list] of byMemberId) {
    const sorted = dedupeConversations(list).sort(
      (a, b) => conversationTime(b) - conversationTime(a),
    );
    if (sorted.length === 0) continue;

    const primary = sorted[0];
    const memberId = memberIdOf(primary);
    const conversationIds = sorted.map((c) => c.id);
    const updatedAt = primary.last_message_at ?? primary.updated_at;

    threads.push({
      key: memberId ? `id:${memberId}` : key,
      memberId,
      name: displayName(primary),
      primaryConversationId: primary.id,
      conversationIds,
      lastMessage: primary.last_message ?? primary.subject ?? undefined,
      updatedAt,
      activityStamp: String(updatedAt),
    });
  }

  return threads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

async function fetchAllConversations() {
  const first = await apiGet<Conversation[]>("/admin/chat/conversations", {
    per_page: 100,
    page: 1,
  });
  const total = Number(first.meta?.total ?? first.data.length);
  const perPage = Number(first.meta?.per_page ?? 100) || 100;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  let all = asConversationList(first.data);
  for (let page = 2; page <= pageCount; page++) {
    const next = await apiGet<Conversation[]>("/admin/chat/conversations", {
      per_page: perPage,
      page,
    });
    all = all.concat(asConversationList(next.data));
  }

  return { ...first, data: dedupeConversations(all) };
}

function messageFromEvent(event: Record<string, unknown>, fallbackId?: string): Message {
  return {
    id: String(event.id),
    message: String(event.message ?? ""),
    created_at: String(event.created_at ?? new Date().toISOString()),
    sender_id: String(event.sender_id ?? ""),
    conversation_id: String(event.conversation_id ?? fallbackId ?? ""),
    sender: {
      id: String(event.sender_id ?? ""),
      name: String(event.sender_name ?? "Unknown"),
    },
  };
}

function appendMessage(cache: MessagesCache | undefined, msg: Message): MessagesCache {
  if (!cache?.data) {
    return { data: [msg], message: "OK" };
  }
  if (cache.data.some((m) => m.id === msg.id)) return cache;
  return { ...cache, data: [...cache.data, msg] };
}

function patchConversationList(
  cache: ConversationsCache | undefined,
  msg: Message,
): ConversationsCache | undefined {
  if (!cache?.data || !msg.conversation_id) return cache;

  const existing = cache.data.find((c) => c.id === msg.conversation_id);
  if (!existing) {
    // Unknown conversation — force a full refetch via caller.
    return cache;
  }

  const next: Conversation = {
    ...existing,
    last_message: msg.message,
    last_message_at: msg.created_at,
    updated_at: msg.created_at,
  };

  return {
    ...cache,
    data: [next, ...cache.data.filter((c) => c.id !== msg.conversation_id)],
  };
}

function isThreadUnseen(thread: MemberThread, viewed: ViewedMap): boolean {
  const stamped = viewed[thread.key];
  if (!stamped) return true;
  return stamped !== thread.activityStamp;
}

export default function ChatPage() {
  const qc = useQueryClient();
  const { meQuery } = useAuth();
  const adminId = meQuery.data?.id;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [viewedMap, setViewedMap] = useState<ViewedMap>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const selectedKeyRef = useRef<string | null>(null);
  const primaryIdRef = useRef<string | null>(null);

  useEffect(() => {
    setViewedMap(loadViewedMap());
  }, []);

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: fetchAllConversations,
    // Always poll so inbox stays live even if Reverb is down.
    refetchInterval: 4_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const memberThreads = useMemo(
    () => groupConversationsByMember(asConversationList(conversationsQuery.data?.data)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationsQuery.dataUpdatedAt],
  );

  const selectedThread =
    memberThreads.find((t) => t.key === selectedKey) ?? null;

  const primaryConversationId = selectedThread?.primaryConversationId ?? null;

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
    primaryIdRef.current = primaryConversationId;
  }, [selectedKey, primaryConversationId]);

  const messagesQuery = useQuery({
    queryKey: messagesKey(primaryConversationId ?? "none"),
    queryFn: () =>
      apiGet<Message[]>(
        `/admin/chat/conversations/${primaryConversationId}/messages`,
      ),
    enabled: !!primaryConversationId,
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const messages = messagesQuery.data?.data ?? [];
  const messagesLoading = messagesQuery.isLoading;

  const markThreadViewed = useCallback((thread: MemberThread) => {
    const current = loadViewedMap();
    if (current[thread.key] === thread.activityStamp) {
      setViewedMap((prev) =>
        prev[thread.key] === thread.activityStamp
          ? prev
          : { ...prev, [thread.key]: thread.activityStamp },
      );
      return;
    }
    const next = { ...current, [thread.key]: thread.activityStamp };
    setViewedMap(next);
    saveViewedMap(next);
  }, []);

  const selectThread = (thread: MemberThread) => {
    setSelectedKey(thread.key);
    markThreadViewed(thread);
  };

  useEffect(() => {
    if (!selectedThread) return;
    markThreadViewed(selectedThread);
  }, [selectedThread?.key, selectedThread?.activityStamp, markThreadViewed, selectedThread]);

  const scrollToLatest = useCallback(() => {
    const scroller = messagesScrollRef.current;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useEffect(() => {
    if (!selectedThread || messagesLoading) return;
    const id = window.requestAnimationFrame(() => {
      scrollToLatest();
      window.setTimeout(scrollToLatest, 50);
    });
    return () => window.cancelAnimationFrame(id);
  }, [
    selectedKey,
    messagesLoading,
    messages.length,
    messages[messages.length - 1]?.id,
    selectedThread,
    scrollToLatest,
  ]);

  const applyIncomingMessage = useCallback(
    (msg: Message, opts?: { fromSelf?: boolean }) => {
      if (!msg.conversation_id || !msg.id) return;

      qc.setQueryData<MessagesCache>(messagesKey(msg.conversation_id), (prev) =>
        appendMessage(prev, msg),
      );

      const prevList = qc.getQueryData<ConversationsCache>(CONVERSATIONS_KEY);
      const known = prevList?.data?.some((c) => c.id === msg.conversation_id);
      if (known) {
        qc.setQueryData<ConversationsCache>(CONVERSATIONS_KEY, (prev) =>
          patchConversationList(prev, msg),
        );
      } else {
        void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      }

      // If admin is currently viewing this member's latest thread, mark seen.
      if (
        !opts?.fromSelf &&
        primaryIdRef.current &&
        msg.conversation_id === primaryIdRef.current &&
        selectedKeyRef.current
      ) {
        const key = selectedKeyRef.current;
        const stamp = String(msg.created_at);
        const next = { ...loadViewedMap(), [key]: stamp };
        setViewedMap(next);
        saveViewedMap(next);
      }
    },
    [qc],
  );

  useEffect(() => {
    let cancelled = false;
    let localEcho: Echo<any> | null = null;

    try {
      localEcho = initEcho();
      if (cancelled) return;
      setWsConnected(!!localEcho);
    } catch (error) {
      console.error("Echo init failed", error);
      setWsConnected(false);
      toast.error("Koneksi realtime chat gagal. Menggunakan polling.");
      return () => {
        cancelled = true;
      };
    }

    if (!localEcho) {
      setWsConnected(false);
      return () => {
        cancelled = true;
      };
    }

    localEcho.private("admin.chat").listen(
      ".message.sent",
      (event: Record<string, unknown>) => {
        const msg = messageFromEvent(event);
        if (adminId && msg.sender_id === adminId) return;
        applyIncomingMessage(msg);
        window.requestAnimationFrame(scrollToLatest);
      },
    );

    return () => {
      cancelled = true;
      try {
        localEcho?.leave("admin.chat");
      } catch {
        // ignore
      }
      disconnectEcho();
      setWsConnected(false);
    };
  }, [adminId, applyIncomingMessage, scrollToLatest]);

  useEffect(() => {
    if (!primaryConversationId) return;
    const echo = initEcho();
    if (!echo) return;

    const name = `chat.${primaryConversationId}`;
    echo.private(name).listen(".message.sent", (event: Record<string, unknown>) => {
      const msg = messageFromEvent(event, primaryConversationId);
      if (adminId && msg.sender_id === adminId) return;
      applyIncomingMessage(msg);
      window.requestAnimationFrame(scrollToLatest);
    });

    return () => {
      echo.leave(name);
    };
  }, [primaryConversationId, adminId, applyIncomingMessage, scrollToLatest]);

  // Refetch when tab becomes visible again.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      if (primaryIdRef.current) {
        void qc.invalidateQueries({
          queryKey: messagesKey(primaryIdRef.current),
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [qc]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!primaryConversationId) {
        throw new Error("Tidak ada percakapan aktif");
      }
      return apiPost<Message>(
        `/admin/chat/conversations/${primaryConversationId}/messages`,
        { message: newMessage },
      );
    },
    onSuccess: (res) => {
      const payload = res.data;
      const msg: Message = {
        id: payload.id,
        message: payload.message,
        created_at: payload.created_at,
        sender_id: payload.sender_id,
        conversation_id: payload.conversation_id ?? primaryConversationId ?? undefined,
        sender: payload.sender ?? {
          id: payload.sender_id,
          name: meQuery.data?.name ?? "Admin",
        },
      };
      setNewMessage("");
      applyIncomingMessage(msg, { fromSelf: true });
      window.requestAnimationFrame(scrollToLatest);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat Dukungan"
        description={
          wsConnected
            ? "Live — update otomatis (realtime + polling)"
            : "Live — update otomatis (polling)"
        }
      />

      <div className="grid h-[calc(100vh-12rem)] gap-4 md:grid-cols-3">
        <Card className="overflow-hidden md:col-span-1">
          <ScrollArea className="h-full">
            {conversationsQuery.isLoading ? (
              <Skeleton className="m-4 h-48" />
            ) : memberThreads.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Belum ada percakapan
              </p>
            ) : (
              <div className="divide-y">
                {memberThreads.map((thread) => {
                  const unseen = isThreadUnseen(thread, viewedMap);
                  return (
                    <button
                      key={thread.key}
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-muted/50",
                        selectedKey === thread.key && "bg-muted",
                      )}
                      onClick={() => selectThread(thread)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{thread.name}</p>
                        {unseen && (
                          <Badge variant="secondary" className="shrink-0">
                            Baru
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {thread.lastMessage ?? formatDateTime(thread.updatedAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden md:col-span-2">
          {selectedThread ? (
            <>
              <div className="border-b px-4 py-3">
                <p className="font-medium">{selectedThread.name}</p>
                <p className="text-xs text-muted-foreground">Chat dukungan</p>
              </div>
              <div
                ref={messagesScrollRef}
                className="min-h-0 flex-1 overflow-y-auto p-4"
              >
                {messagesLoading ? (
                  <Skeleton className="h-32" />
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada pesan</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex w-full",
                          m.sender_id === adminId
                            ? "justify-end"
                            : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            m.sender_id === adminId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <p className="text-xs opacity-70">{m.sender?.name}</p>
                          <p>{m.message}</p>
                          <p className="mt-1 text-xs opacity-60">
                            {formatDateTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t p-4">
                <Input
                  placeholder="Tulis pesan..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMessage.trim())
                      sendMutation.mutate();
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
