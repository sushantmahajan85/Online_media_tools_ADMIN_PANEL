import axios from "axios";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { PRIMARY_SUPPORT_ADMIN_ID } from "./adminProfile";

const serverURL = process.env.REACT_APP_SERVER_URL;

export const UNKNOWN_LABELS = new Set([
  "Unknown",
  "Unknown Sender",
  "Unknown Receiver",
]);

export function displayName(user) {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || user.mobileNumber || null;
}

export function hasKnownParticipants(chat) {
  return (
    chat.senderName &&
    chat.receiverName &&
    !UNKNOWN_LABELS.has(chat.senderName) &&
    !UNKNOWN_LABELS.has(chat.receiverName)
  );
}

export function filterKnownChats(chats) {
  return chats.filter(hasKnownParticipants);
}

export function getFirestoreTimeMs(ts) {
  if (ts == null) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  if (ts.seconds != null) {
    return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
  }
  return null;
}

export function firestoreTimestampToDate(ts) {
  const ms = getFirestoreTimeMs(ts);
  return ms != null ? new Date(ms) : null;
}

export function chatDocToRow(docSnap) {
  const data = docSnap.data();
  const chatId = docSnap.id;
  const participants = Array.isArray(data.users)
    ? data.users.map(String)
    : chatId.split("_");

  const roomMs = getFirestoreTimeMs(data.timestamp);

  return {
    chatId,
    participants,
    senderId: String(data.senderId ?? participants[0] ?? ""),
    receiverId: String(data.receiverId ?? participants[1] ?? ""),
    lastMessage: data.lastMessage || "No messages yet",
    timestamp: roomMs != null ? new Date(roomMs) : null,
    sortTimeMs: roomMs ?? 0,
  };
}

export function getBlockedChatParticipantIds(extraIds = []) {
  return new Set(
    [PRIMARY_SUPPORT_ADMIN_ID, ...extraIds].map(String).filter(Boolean),
  );
}

export function isPeerToPeerChat(participants, blockedIds) {
  const ids = (participants || []).map(String).filter(Boolean);
  if (ids.length < 2) return false;
  return !ids.some((id) => blockedIds.has(id));
}

export function isAdminUserChat(participants, adminIds) {
  const ids = (participants || []).map(String).filter(Boolean);
  if (ids.length < 2) return false;
  const hasAdmin = ids.some((id) => adminIds.has(id));
  const hasNonAdmin = ids.some((id) => !adminIds.has(id));
  return hasAdmin && hasNonAdmin;
}

const USER_FETCH_BATCH_SIZE = 80;

export function buildUserMapFromStore(storeUsers = []) {
  const map = new Map();
  storeUsers.forEach((user) => {
    if (user?._id) map.set(String(user._id), user);
  });
  return map;
}

export async function fetchUsersByIds(ids, seedMap = new Map()) {
  const map = new Map(seedMap);
  const unique = [...new Set(ids.map(String).filter(Boolean))].filter(
    (id) => !map.has(id),
  );
  if (!unique.length) return map;

  for (let i = 0; i < unique.length; i += USER_FETCH_BATCH_SIZE) {
    const chunk = unique.slice(i, i + USER_FETCH_BATCH_SIZE);
    try {
      const response = await axios.get(`${serverURL}/api/users/get_all_users`, {
        params: { ids: chunk.join(",") },
      });
      (response.data?.users || []).forEach((user) => {
        map.set(String(user._id), user);
      });
    } catch (error) {
      console.warn("fetchUsersByIds batch failed:", error);
    }
  }

  return map;
}

export async function enrichChatRows(
  rows,
  { chatLink, matchParticipants = () => true, storeUsers = [] },
) {
  const userIds = new Set();
  rows.forEach((row) => {
    row.participants?.forEach((id) => userIds.add(String(id)));
    if (row.senderId) userIds.add(String(row.senderId));
    if (row.receiverId) userIds.add(String(row.receiverId));
  });

  const userMap = await fetchUsersByIds(
    [...userIds],
    buildUserMapFromStore(storeUsers),
  );

  return rows
    .map((row) => {
      const [p1, p2] = row.participants || [];
      const senderName =
        displayName(userMap.get(String(p1))) ||
        displayName(userMap.get(String(row.senderId))) ||
        "Unknown";
      const receiverName =
        displayName(userMap.get(String(p2))) ||
        displayName(userMap.get(String(row.receiverId))) ||
        "Unknown";

      return {
        ...row,
        senderName,
        receiverName,
        chatLink: chatLink(row),
      };
    })
    .filter((row) => hasKnownParticipants(row))
    .filter((row) => matchParticipants(row.participants));
}

export function sortChatsByRecency(chats) {
  return [...chats].sort(
    (a, b) => (b.sortTimeMs ?? 0) - (a.sortTimeMs ?? 0),
  );
}

export async function fetchLatestMessageTimeMs(db, chatId) {
  try {
    const snap = await getDocs(
      query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "desc"),
        limit(1),
      ),
    );
    if (!snap.empty) {
      return getFirestoreTimeMs(snap.docs[0].data().timestamp);
    }
  } catch {
    try {
      const snap = await getDocs(collection(db, "chats", chatId, "messages"));
      let max = null;
      snap.docs.forEach((docSnap) => {
        const ms = getFirestoreTimeMs(docSnap.data().timestamp);
        if (ms != null && (max == null || ms > max)) max = ms;
      });
      return max;
    } catch {
      return null;
    }
  }

  return null;
}

export async function enrichChatsWithLatestActivity(db, chats) {
  const enriched = await Promise.all(
    chats.map(async (chat) => {
      const latestMs = await fetchLatestMessageTimeMs(db, chat.chatId);
      const sortTimeMs = Math.max(latestMs ?? 0, chat.sortTimeMs ?? 0);
      return {
        ...chat,
        sortTimeMs,
        timestamp: sortTimeMs ? new Date(sortTimeMs) : chat.timestamp,
      };
    }),
  );
  return sortChatsByRecency(enriched);
}

export function filterChatsByParticipantName(chats, queryText) {
  const needle = String(queryText || "").trim().toLowerCase();
  if (!needle) return chats;
  return chats.filter(
    (chat) =>
      (chat.senderName || "").toLowerCase().includes(needle) ||
      (chat.receiverName || "").toLowerCase().includes(needle),
  );
}

export function filterChatsByLastMessage(chats, queryText) {
  const needle = String(queryText || "").trim().toLowerCase();
  if (!needle) return chats;
  return chats.filter((chat) =>
    (chat.lastMessage || "").toLowerCase().includes(needle),
  );
}

export async function searchChatsByMessageContent(db, chats, queryText) {
  const needle = String(queryText || "").trim().toLowerCase();
  if (!needle) return [];

  const fromPreview = filterChatsByLastMessage(chats, needle);
  const matchedIds = new Set(fromPreview.map((chat) => chat.chatId));
  const toScan = chats.filter((chat) => !matchedIds.has(chat.chatId));

  const scanned = await Promise.all(
    toScan.map(async (chat) => {
      try {
        const snap = await getDocs(collection(db, "chats", chat.chatId, "messages"));
        const match = snap.docs.find((docSnap) =>
          String(docSnap.data().message || "").toLowerCase().includes(needle),
        );
        if (!match) return null;
        const message = String(match.data().message || "");
        return { ...chat, lastMessage: message, matchedMessage: message };
      } catch {
        return null;
      }
    }),
  );

  return sortChatsByRecency([
    ...fromPreview,
    ...scanned.filter(Boolean),
  ]);
}
