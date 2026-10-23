"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "../lib/apiClient";

// Chats for the admin inbox (WhatsApp, Messenger and Instagram together),
// polled from /api/admin/inbox (Neon, no read quota) while the tab is visible.
const LIST_EVERY_MS = 5000;
const THREAD_EVERY_MS = 3000;

async function getJson(url) {
  const res = await adminFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// Runs `task` now and every `ms` while the page is visible.
function usePolling(task, ms, enabled = true) {
  const saved = useRef(task);
  saved.current = task;
  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let timer;
    const tick = async () => {
      if (!document.hidden) await saved.current().catch(() => {});
      if (!stopped) timer = setTimeout(tick, ms);
    };
    tick();
    const onVisible = () => !document.hidden && saved.current().catch(() => {});
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ms, enabled]);
}

// The last chat list, kept for the admin's next visit: the inbox shows it
// at once and the first poll only freshens it. The menu badges poll the same
// list, so by the time the inbox tab is opened it is usually current already.
const LIST_CACHE_KEY = "gt-admin-inbox";
let listCache = null;
const listeners = new Set();

function readCache() {
  if (listCache) return listCache;
  try {
    listCache = JSON.parse(localStorage.getItem(LIST_CACHE_KEY)) || null;
  } catch {
    listCache = null;
  }
  return listCache;
}

function writeCache(data) {
  listCache = {
    conversations: data.conversations || [],
    contacts: data.contacts || {},
    imported: Boolean(data.imported),
    ai: data.ai || null,
  };
  try {
    localStorage.setItem(LIST_CACHE_KEY, JSON.stringify(listCache));
  } catch {}
  listeners.forEach((fn) => fn(listCache));
}

async function fetchList() {
  writeCache(await getJson("/api/admin/inbox"));
}

// A chat is identified by its channel and id together.
export const chatKey = (c) => (c ? `${c.channel}:${c.id}` : "");

// Every channel's chats in one list; `selected` is { channel, id } or null.
export function useInbox(selected) {
  const [list, setList] = useState(() => (typeof window === "undefined" ? null : readCache()));
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listeners.add(setList);
    return () => listeners.delete(setList);
  }, []);

  const loadList = useCallback(async () => {
    try {
      await fetchList();
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const channel = selected?.channel;
  const id = selected?.id;
  const loadThread = useCallback(async () => {
    if (!id) return;
    const data = await getJson(`/api/admin/inbox?channel=${channel}&conversation=${encodeURIComponent(id)}`);
    setMessages(data.messages || []);
  }, [channel, id]);

  useEffect(() => setMessages([]), [channel, id]);
  usePolling(loadList, LIST_EVERY_MS);
  usePolling(loadThread, THREAD_EVERY_MS, Boolean(id));

  const markRead = useCallback(async (chat) => {
    if (listCache) {
      writeCache({
        ...listCache,
        conversations: listCache.conversations.map((c) => (chatKey(c) === chatKey(chat) ? { ...c, unread: 0 } : c)),
      });
    }
    await adminFetch("/api/admin/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", channel: chat.channel, id: chat.id }),
    }).catch(() => {});
  }, []);

  // Right after sending, show the reply without waiting for the next poll.
  const refresh = useCallback(() => Promise.all([loadList(), loadThread().catch(() => {})]), [loadList, loadThread]);

  return {
    loaded: Boolean(list),
    conversations: list?.conversations || [],
    contacts: list?.contacts || {},
    imported: list ? list.imported : true,
    ai: list?.ai || null,
    messages,
    error,
    markRead,
    refresh,
  };
}

const MEDIA_LABEL = /^(📷 ფოტო|🙂 სტიკერი)( · )?/;

// Photo or sticker of a message, when it has one: Messenger sends a public
// link, WhatsApp media is fetched through /api/admin/inbox/media (it needs
// the admin token, so it is loaded as a blob rather than a plain <img src>).
export function MessageMedia({ message }) {
  const isImage = message.type === "image" || message.type === "sticker";
  const [src, setSrc] = useState(message.mediaUrl || "");

  useEffect(() => {
    if (message.mediaUrl || !isImage || !message.mediaId) return undefined;
    let objectUrl = "";
    let cancelled = false;
    adminFetch(`/api/admin/inbox/media?id=${encodeURIComponent(message.mediaId)}`)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [message.mediaUrl, message.mediaId, isImage]);

  // Not loaded (yet, or Meta refused it): the label the caption left out.
  if (!src) return isImage ? <span className="wa-msg-text">{message.type === "sticker" ? "🙂 სტიკერი" : "📷 ფოტო"}</span> : null;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className={`wa-media${message.type === "sticker" ? " is-sticker" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={message.type === "sticker" ? "სტიკერი" : "ფოტო"} loading="lazy" />
    </a>
  );
}

// The text under a photo or sticker, without the "📷 ფოტო" label.
export function messageCaption(message, hasMedia) {
  return hasMedia ? message.text.replace(MEDIA_LABEL, "") : message.text;
}

// Inbox actions that change a setting and then reload the list.
export async function inboxAction(body) {
  const res = await adminFetch("/api/admin/inbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  await fetchList().catch(() => {});
  return data;
}

// Copies the chats stored in Firestore before the move (one time).
export async function importOldChats() {
  const res = await adminFetch("/api/admin/inbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "import" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// Chats with unread messages, for the admin menu badge. It polls the whole
// list (one small Neon query), which also keeps the inbox tab's cache warm.
export function useUnreadCount(enabled) {
  const [list, setList] = useState(null);
  useEffect(() => {
    setList(readCache());
    listeners.add(setList);
    return () => listeners.delete(setList);
  }, []);
  usePolling(fetchList, 30000, enabled);
  return (list?.conversations || []).filter((c) => c.unread > 0).length;
}
