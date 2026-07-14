"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import {
  CHAT_CONVERSATIONS_KEY,
  CHAT_VIEWED_EVENT,
  hasUnseenChat,
  loadChatViewedMap,
  type ChatConversationLike,
  type ChatViewedMap,
} from "@/lib/chat-inbox";

/**
 * Red-dot signal for sidebar Chat nav: true when any member thread has
 * activity newer than the last time admin opened it.
 */
export function useChatUnseenDot(): boolean {
  const [viewed, setViewed] = useState<ChatViewedMap>({});

  useEffect(() => {
    setViewed(loadChatViewedMap());
    const sync = () => {
      queueMicrotask(() => setViewed(loadChatViewedMap()));
    };
    window.addEventListener(CHAT_VIEWED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHAT_VIEWED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const conversationsQuery = useQuery({
    queryKey: CHAT_CONVERSATIONS_KEY,
    queryFn: async () => {
      // Prefer shared cache populated by /chat. Fallback: first page is enough for the nav dot.
      return apiGet<ChatConversationLike[]>("/admin/chat/conversations", {
        per_page: 100,
        page: 1,
      });
    },
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    staleTime: 2_000,
  });

  return useMemo(() => {
    const list = Array.isArray(conversationsQuery.data?.data)
      ? conversationsQuery.data.data
      : [];
    return hasUnseenChat(list, viewed);
  }, [conversationsQuery.dataUpdatedAt, conversationsQuery.data?.data, viewed]);
}
