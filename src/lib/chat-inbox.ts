/**
 * Shared chat inbox “unseen” helpers for /chat page and sidebar nav dot.
 */

export const CHAT_CONVERSATIONS_KEY = ["admin", "chat", "conversations"] as const;
export const CHAT_VIEWED_STORAGE_KEY = "gym-admin:chat-viewed-v2";
export const CHAT_VIEWED_EVENT = "gym-admin:chat-viewed";

export type ChatViewedMap = Record<string, string>;

export type ChatConversationLike = {
  id: string;
  member_id?: string | null;
  updated_at: string;
  last_message_at?: string | null;
  other_party_name?: string | null;
  member?: { id?: string; name?: string } | null;
};

export function loadChatViewedMap(): ChatViewedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHAT_VIEWED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChatViewedMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChatViewedMap(map: ChatViewedMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_VIEWED_STORAGE_KEY, JSON.stringify(map));
  // Defer so listeners (e.g. AppSidebar) don't setState while another component is rendering.
  queueMicrotask(() => {
    window.dispatchEvent(new Event(CHAT_VIEWED_EVENT));
  });
}

export function memberThreadKey(c: ChatConversationLike): string {
  const memberId = c.member_id ?? c.member?.id;
  if (memberId != null && String(memberId).trim() !== "") {
    return `id:${String(memberId)}`;
  }
  const name =
    (c.other_party_name ?? c.member?.name ?? "Anggota").trim().toLowerCase() ||
    "anggota";
  return `name:${name}`;
}

export function activityStampOf(c: ChatConversationLike): string {
  return String(c.last_message_at ?? c.updated_at);
}

function stampTime(stamp: string): number {
  const ts = new Date(stamp).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

/** Latest activity stamp per member group. */
export function latestStampsByMember(
  conversations: ChatConversationLike[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of conversations) {
    const key = memberThreadKey(c);
    const stamp = activityStampOf(c);
    const prev = map.get(key);
    if (!prev || stampTime(stamp) >= stampTime(prev)) {
      map.set(key, stamp);
    }
  }
  return map;
}

export function hasUnseenChat(
  conversations: ChatConversationLike[],
  viewed: ChatViewedMap,
): boolean {
  if (conversations.length === 0) return false;
  for (const [key, stamp] of latestStampsByMember(conversations)) {
    if (viewed[key] !== stamp) return true;
  }
  return false;
}
