// One-time copy of the chats that were stored in Firestore before the inbox
// moved to Neon. Safe to run again: messages are stored once each.

import { getAdminDb } from "./adminAuth";
import { getConfig, putConversation, saveContacts, saveMessages, setConfig } from "./inboxStore";
import { WhatsAppError } from "./whatsapp";

const SOURCES = [
  { channel: "whatsapp", collection: "whatsapp_conversations", config: ["whatsapp", "whatsapp_config/main"] },
  { channel: "messenger", collection: "messenger_conversations", config: ["messenger", "messenger_config/main"] },
];

export async function importFromFirestore() {
  const firestore = getAdminDb();
  if (!firestore) throw new WhatsAppError("სერვერის Firestore არ არის მორგებული.", 503);

  const result = {};
  for (const source of SOURCES) {
    const [key, path] = source.config;
    if (!(await getConfig(key))) {
      const old = (await firestore.doc(path).get()).data();
      if (old) await setConfig(key, old, { replace: true });
    }

    const conversations = await firestore.collection(source.collection).get();
    let messages = 0;
    for (const conv of conversations.docs) {
      const snap = await conv.ref.collection("messages").get();
      const items = snap.docs.map((d) => {
        const m = d.data();
        return {
          conversationId: conv.id,
          record: {
            id: m.id || d.id,
            direction: m.direction === "out" ? "out" : "in",
            source: m.source,
            type: m.type,
            text: m.text,
            timestamp: Number(m.timestamp) || 0,
            mediaId: m.mediaId,
            replyTo: m.replyTo,
            status: m.status,
            error: m.error,
          },
        };
      });
      messages += (await saveMessages(source.channel, items)).length;
      await putConversation(source.channel, { id: conv.id, ...conv.data() });
    }
    result[source.channel] = { conversations: conversations.size, messages };
  }

  const contacts = await firestore.collection("whatsapp_contacts").get();
  await saveContacts(contacts.docs.map((d) => ({ phone: d.id, name: d.data().name || "" })));
  result.contacts = contacts.size;

  await setConfig("import", { at: Date.now(), result }, { replace: true });
  return result;
}
