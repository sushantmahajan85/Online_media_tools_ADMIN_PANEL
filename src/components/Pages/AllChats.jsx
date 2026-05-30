import axios from "axios";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;
const CHATS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const UNKNOWN_LABELS = new Set([
  "Unknown",
  "Unknown Sender",
  "Unknown Receiver",
]);

function hasKnownParticipants(chat) {
  return (
    chat.senderName &&
    chat.receiverName &&
    !UNKNOWN_LABELS.has(chat.senderName) &&
    !UNKNOWN_LABELS.has(chat.receiverName)
  );
}

function filterKnownChats(chats) {
  return chats.filter(hasKnownParticipants);
}

function displayName(user) {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || user.mobileNumber || null;
}

function firestoreTimestampToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts.seconds != null) return new Date(ts.seconds * 1000);
  return null;
}

function chatDocToRow(docSnap) {
  const data = docSnap.data();
  const chatId = docSnap.id;
  const participants = Array.isArray(data.users)
    ? data.users.map(String)
    : chatId.split("_");

  return {
    chatId,
    participants,
    senderId: String(data.senderId ?? participants[0] ?? ""),
    receiverId: String(data.receiverId ?? participants[1] ?? ""),
    lastMessage: data.lastMessage || "No messages yet",
    timestamp: firestoreTimestampToDate(data.timestamp),
  };
}

async function fetchUsersByIds(ids) {
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  if (!unique.length) return new Map();

  const response = await axios.get(`${serverURL}/api/users/get_all_users`, {
    params: { ids: unique.join(",") },
  });

  const map = new Map();
  (response.data?.users || []).forEach((user) => {
    map.set(String(user._id), user);
  });
  return map;
}

async function enrichRows(rows) {
  const userIds = new Set();
  rows.forEach((row) => {
    row.participants?.forEach((id) => userIds.add(String(id)));
    if (row.senderId) userIds.add(String(row.senderId));
    if (row.receiverId) userIds.add(String(row.receiverId));
  });

  const userMap = await fetchUsersByIds([...userIds]);

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
        chatLink: `/Admin/AdminDashboard/UserDetails/${row.receiverId || p2}/UserChats/${row.chatId}/Chat`,
      };
    })
    .filter(hasKnownParticipants);
}

export function AllChats() {
  const [viewChats, setViewChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);
  const [chatPage, setChatPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchName, setSearchName] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchMode, setSearchModeState] = useState(null);
  const searchModeRef = useRef(null);
  const setSearchMode = (mode) => {
    searchModeRef.current = mode;
    setSearchModeState(mode);
  };
  const [isSearching, setIsSearching] = useState(false);

  const pageCursorsRef = useRef({});
  const allChatDocsRef = useRef([]);
  const allChatsLoadedRef = useRef(false);
  const backgroundLoadStartedRef = useRef(false);
  const searchDebounceRef = useRef(null);

  const loadBrowsePage = useCallback(async (page, { silent = false } = {}) => {
    if (!silent) {
      if (page === 1) setIsLoading(true);
      else setIsPaging(true);
    }

    try {
      if (allChatsLoadedRef.current && allChatDocsRef.current.length > 0) {
        const sorted = [...allChatDocsRef.current].sort(
          (a, b) =>
            (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0),
        );
        const total = sorted.length;
        const start = (page - 1) * CHATS_PAGE_SIZE;
        const slice = sorted.slice(start, start + CHATS_PAGE_SIZE);
        const enriched = await enrichRows(slice);
        setViewChats(enriched);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / CHATS_PAGE_SIZE)));
        setChatPage(page);
        return;
      }

      let chatsQuery;
      const base = collection(db, "chats");

      if (page === 1) {
        chatsQuery = query(
          base,
          orderBy("timestamp", "desc"),
          limit(CHATS_PAGE_SIZE),
        );
      } else {
        const cursor = pageCursorsRef.current[page - 1];
        if (!cursor) {
          setViewChats([]);
          return;
        }
        chatsQuery = query(
          base,
          orderBy("timestamp", "desc"),
          startAfter(cursor),
          limit(CHATS_PAGE_SIZE),
        );
      }

      let snapshot;
      try {
        snapshot = await getDocs(chatsQuery);
      } catch (firestoreError) {
        console.warn("Ordered chat query failed:", firestoreError);
        if (page === 1) {
          const fallback = await getDocs(base);
          const docs = fallback.docs.slice(0, CHATS_PAGE_SIZE);
          snapshot = { docs, empty: docs.length === 0 };
        } else {
          throw firestoreError;
        }
      }

      if (!snapshot.docs.length) {
        if (page === 1) {
          setViewChats([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        setChatPage(page);
        return;
      }

      pageCursorsRef.current[page] =
        snapshot.docs[snapshot.docs.length - 1];

      const rows = snapshot.docs.map(chatDocToRow);
      const enriched = await enrichRows(rows);
      setViewChats(enriched);
      setChatPage(page);

      const hasMore = snapshot.docs.length === CHATS_PAGE_SIZE;
      setTotalPages(hasMore ? page + 1 : page);
      setTotalCount(
        allChatsLoadedRef.current
          ? allChatDocsRef.current.length
          : page * CHATS_PAGE_SIZE - (hasMore ? 0 : CHATS_PAGE_SIZE - snapshot.docs.length),
      );
    } catch (error) {
      console.error("Error loading chats:", error);
      if (page === 1) setViewChats([]);
    } finally {
      setIsLoading(false);
      setIsPaging(false);
    }
  }, []);

  const loadAllChatDocsInBackground = useCallback(async () => {
    if (backgroundLoadStartedRef.current || allChatsLoadedRef.current) return;
    backgroundLoadStartedRef.current = true;

    try {
      let snapshot;
      try {
        snapshot = await getDocs(
          query(collection(db, "chats"), orderBy("timestamp", "desc")),
        );
      } catch {
        snapshot = await getDocs(collection(db, "chats"));
      }

      allChatDocsRef.current = snapshot.docs.map(chatDocToRow);
      allChatsLoadedRef.current = true;
      setTotalCount(allChatDocsRef.current.length);
      setTotalPages(
        Math.max(1, Math.ceil(allChatDocsRef.current.length / CHATS_PAGE_SIZE)),
      );
    } catch (error) {
      console.warn("Background chat index load failed:", error);
      backgroundLoadStartedRef.current = false;
    }
  }, []);

  const runNameSearch = useCallback(async (q, page = 1) => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `${serverURL}/api/admin/chats/search-by-name`,
        { params: { q, page, limit: CHATS_PAGE_SIZE } },
      );
      const chats = filterKnownChats(response.data?.chats || []);
      const pagination = response.data?.pagination;
      setViewChats(chats);
      setChatPage(pagination?.page ?? page);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalCount(pagination?.total ?? chats.length);
    } catch (error) {
      console.error("Name search failed:", error);
      setViewChats([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, []);

  const runMessageSearch = useCallback(async (q, page = 1) => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `${serverURL}/api/admin/chats/search-by-message`,
        { params: { q, page, limit: CHATS_PAGE_SIZE } },
      );
      const chats = filterKnownChats(response.data?.chats || []);
      const pagination = response.data?.pagination;
      setViewChats(
        chats.map((c) => ({
          ...c,
          lastMessage: c.matchedMessage || c.lastMessage,
        })),
      );
      setChatPage(pagination?.page ?? page);
      setTotalPages(pagination?.totalPages ?? 1);
      setTotalCount(pagination?.total ?? chats.length);
    } catch (error) {
      console.error("Message search failed:", error);
      setViewChats([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrowsePage(1).then(() => {
      loadAllChatDocsInBackground();
    });
  }, [loadBrowsePage, loadAllChatDocsInBackground]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const nameQ = searchName.trim();
    const messageQ = searchMessage.trim();

    if (!nameQ && !messageQ) {
      if (searchModeRef.current) {
        setSearchMode(null);
        loadBrowsePage(1);
      }
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      if (nameQ) {
        setSearchMode("name");
        setSearchMessage("");
        runNameSearch(nameQ, 1);
      } else if (messageQ) {
        setSearchMode("message");
        setSearchName("");
        runMessageSearch(messageQ, 1);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchName, searchMessage, loadBrowsePage, runNameSearch, runMessageSearch]);

  const handlePrevPage = () => {
    if (chatPage <= 1 || isPaging || isSearching) return;
    const prev = chatPage - 1;
    if (searchMode === "name") {
      runNameSearch(searchName.trim(), prev);
    } else if (searchMode === "message") {
      runMessageSearch(searchMessage.trim(), prev);
    } else {
      loadBrowsePage(prev);
    }
  };

  const handleNextPage = () => {
    if (chatPage >= totalPages || isPaging || isSearching) return;
    const next = chatPage + 1;
    if (searchMode === "name") {
      runNameSearch(searchName.trim(), next);
    } else if (searchMode === "message") {
      runMessageSearch(searchMessage.trim(), next);
    } else {
      loadBrowsePage(next);
    }
  };

  const showSkeleton = isLoading && viewChats.length === 0;
  const showList = !showSkeleton && viewChats.length > 0;
  const showEmpty = !showSkeleton && !isSearching && viewChats.length === 0;

  function getInitials(name) {
    if (!name || name === "Unknown") return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  function formatTime(date) {
    if (!date) return "—";
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  return (
    <div className={style.acpPage}>
      <div className={style.udpPageHeader}>
        <nav className={style.udpBreadcrumb} aria-label="breadcrumb">
          <span>Dashboard</span>
          <span className={style.udpBreadcrumbSep}>/</span>
          <span className={style.udpBreadcrumbActive}>All Chats</span>
        </nav>
        <div className={style.acpHeaderRow}>
          <h1 className={style.udpPageTitle}>All Chats</h1>
          {!showSkeleton && (
            <span className={style.acpCountBadge}>
              {totalCount} conversation{totalCount !== 1 ? "s" : ""}
              {searchMode === "name" && " · name search"}
              {searchMode === "message" && " · message search"}
            </span>
          )}
        </div>
      </div>

      <div className={style.acpShell}>
        <div className={style.acpSearchRow}>
          <div className={style.acpSearchField}>
            <span className={`bi bi-person-search ${style.acpSearchIcon}`} />
            <input
              type="text"
              placeholder="Search by name…"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                if (e.target.value.trim()) setSearchMessage("");
              }}
              className={style.acpSearchInput}
            />
            {searchName && (
              <button
                type="button"
                className={style.acpSearchClear}
                onClick={() => setSearchName("")}
                aria-label="Clear name search"
              >
                <span className="bi bi-x" />
              </button>
            )}
          </div>
          <div className={style.acpSearchField}>
            <span className={`bi bi-chat-text ${style.acpSearchIcon}`} />
            <input
              type="text"
              placeholder="Search by message…"
              value={searchMessage}
              onChange={(e) => {
                setSearchMessage(e.target.value);
                if (e.target.value.trim()) setSearchName("");
              }}
              className={style.acpSearchInput}
            />
            {searchMessage && (
              <button
                type="button"
                className={style.acpSearchClear}
                onClick={() => setSearchMessage("")}
                aria-label="Clear message search"
              >
                <span className="bi bi-x" />
              </button>
            )}
          </div>
        </div>

        {isSearching && (
          <p className="text-muted small mb-2">Searching…</p>
        )}

        {showSkeleton && (
          <div className={style.acpLoadingWrap}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={style.acpSkeleton} />
            ))}
          </div>
        )}

        {showList && (
          <div className={`${style.acpList} ${isPaging ? "opacity-75" : ""}`}>
            {viewChats.map((chat) => (
              <Link
                key={chat.chatId}
                to={chat.chatLink}
                className={style.acpChatCard}
              >
                <div className={style.acpParticipants}>
                  <div className={style.acpAvatar} data-name={chat.senderName}>
                    {getInitials(chat.senderName)}
                  </div>
                  <div className={style.acpArrow}>
                    <span className="bi bi-arrow-right" />
                  </div>
                  <div
                    className={style.acpAvatar}
                    data-name={chat.receiverName}
                    style={{
                      background: "linear-gradient(135deg,#0bb7af,#3699ff)",
                    }}
                  >
                    {getInitials(chat.receiverName)}
                  </div>
                </div>

                <div className={style.acpChatInfo}>
                  <div className={style.acpChatNames}>
                    <span className={style.acpSenderName}>{chat.senderName}</span>
                    <span className={style.acpNameSep}>→</span>
                    <span className={style.acpReceiverName}>
                      {chat.receiverName}
                    </span>
                  </div>
                  <div className={style.acpLastMsg}>
                    <span className="bi bi-chat-left-text" />
                    <span>{chat.lastMessage}</span>
                  </div>
                </div>

                <div className={style.acpChatMeta}>
                  <span className={style.acpTimestamp}>
                    <span className="bi bi-clock" />
                    {formatTime(chat.timestamp)}
                  </span>
                  <span className={style.acpOpenBtn}>
                    Open <span className="bi bi-arrow-right-short" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showList && totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between mt-3 px-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={chatPage <= 1 || isPaging || isSearching}
              onClick={handlePrevPage}
            >
              Previous
            </button>
            <span className="small text-muted">
              Page {chatPage} of {totalPages}
              {isPaging && " · loading…"}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={chatPage >= totalPages || isPaging || isSearching}
              onClick={handleNextPage}
            >
              Next
            </button>
          </div>
        )}

        {showEmpty && (
          <div className={style.acpEmpty}>
            <span className={`bi bi-chat-slash ${style.acpEmptyIcon}`} />
            <p className={style.acpEmptyTitle}>No chats found</p>
            <p className={style.acpEmptyHint}>
              {searchMode
                ? "Try a different search term"
                : "No conversations in Firestore yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
