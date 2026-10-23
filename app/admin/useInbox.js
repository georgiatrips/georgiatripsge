"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "../lib/apiClient";

// Chats for the WhatsApp / Messenger tabs, polled from /api/admin/inbox
// (Neon, no read quota) while the tab is visible.
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

export function useInbox(channel, selected) {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState({});
  const [imported, setImported] = useState(true);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    try {
      const data = await getJson(`/api/admin/inbox?channel=${channel}`);
      setConversations(data.conversations || []);
      setContacts(data.contacts || {});
      setImported(Boolean(data.imported));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [channel]);

  const loadThread = useCallback(async () => {
    if (!selected) return;
    const data = await getJson(`/api/admin/inbox?channel=${channel}&conversation=${encodeURIComponent(selected)}`);
    setMessages(data.messages || []);
  }, [channel, selected]);

  useEffect(() => setMessages([]), [selected]);
  usePolling(loadList, LIST_EVERY_MS);
  usePolling(loadThread, THREAD_EVERY_MS, Boolean(selected));

  const markRead = useCallback(
    async (id) => {
      setConversations((list) => list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
      await adminFetch("/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", channel, id }),
      }).catch(() => {});
    },
    [channel]
  );

  // Right after sending, show the reply without waiting for the next poll.
  const refresh = useCallback(() => Promise.all([loadList(), loadThread().catch(() => {})]), [loadList, loadThread]);

  return { conversations, contacts, imported, messages, error, markRead, refresh };
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

// Unread chat counts for the admin menu badges.
export function useUnreadCounts(enabled) {
  const [counts, setCounts] = useState({ whatsapp: 0, messenger: 0 });
  usePolling(
    async () => setCounts(await getJson("/api/admin/inbox?counts=1")),
    30000,
    enabled
  );
  return counts;
}
