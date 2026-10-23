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
