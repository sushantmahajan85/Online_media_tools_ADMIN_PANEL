import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { db } from "../../firebase";
import { selecteUsers } from "../../Store/authSlice";
import { useAdminMongoProfile } from "../../hooks/useAdminMongoProfile";
import { getSecondaryAllChatLink } from "../../utils/adminProfile";
import {
  buildUserMapFromStore,
  chatDocToRow,
  enrichChatsWithLatestActivity,
  fetchUsersByIds,
  filterChatsByParticipantName,
  hasKnownParticipants,
  searchChatsByMessageContent,
} from "../../utils/userChatMonitor";
import style from "./ui.module.css";

const CHATS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

function displayName(user) {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || user.mobileNumber || null;
}

async function enrichRows(rows, forSecondaryAdmin, storeUsers) {
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
        chatLink: forSecondaryAdmin
          ? getSecondaryAllChatLink(row.chatId)
          : `/Admin/AdminDashboard/UserDetails/${row.receiverId || p2}/UserChats/${row.chatId}/Chat`,
      };
    })
    .filter(hasKnownParticipants);
}

export function AllChats() {
  const storeUsers = useSelector(selecteUsers);
  const { canAccessAdminChats } = useAdminMongoProfile();
  const forSecondaryAdmin = !canAccessAdminChats;

  const [browseChats, setBrowseChats] = useState([]);
  const [searchChats, setSearchChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatPage, setChatPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchMode, setSearchModeState] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchModeRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const browseChatsRef = useRef([]);

  const setSearchMode = (mode) => {
    searchModeRef.current = mode;
    setSearchModeState(mode);
  };

  const loadAllChats = useCallback(async () => {
    let snapshot;
    try {
      snapshot = await getDocs(
        query(collection(db, "chats"), orderBy("timestamp", "desc")),
      );
    } catch {
      snapshot = await getDocs(collection(db, "chats"));
    }

    const rows = snapshot.docs.map(chatDocToRow);
    const enriched = await enrichRows(rows, forSecondaryAdmin, storeUsers);
    return enrichChatsWithLatestActivity(db, enriched);
  }, [forSecondaryAdmin, storeUsers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const chats = await loadAllChats();
        if (!cancelled) {
          browseChatsRef.current = chats;
          setBrowseChats(chats);
          setChatPage(1);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
        if (!cancelled) {
          browseChatsRef.current = [];
          setBrowseChats([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAllChats]);

  const activeList = searchMode ? searchChats : browseChats;
  const totalCount = activeList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / CHATS_PAGE_SIZE));

  const viewChats = useMemo(() => {
    const start = (chatPage - 1) * CHATS_PAGE_SIZE;
    return activeList.slice(start, start + CHATS_PAGE_SIZE);
  }, [activeList, chatPage]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const nameQ = searchName.trim();
    const messageQ = searchMessage.trim();

    if (!nameQ && !messageQ) {
      if (searchModeRef.current) {
        setSearchMode(null);
        setSearchChats([]);
        setChatPage(1);
      }
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      const source = browseChatsRef.current;
      setIsSearching(true);
      try {
        if (nameQ) {
          setSearchMode("name");
          setSearchChats(filterChatsByParticipantName(source, nameQ));
          setChatPage(1);
        } else if (messageQ) {
          setSearchMode("message");
          const results = await searchChatsByMessageContent(db, source, messageQ);
          setSearchChats(results);
          setChatPage(1);
        }
      } catch (error) {
        console.error("Chat search failed:", error);
        setSearchChats([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchName, searchMessage, browseChats]);

  const handlePrevPage = () => {
    if (chatPage <= 1) return;
    setChatPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (chatPage >= totalPages) return;
    setChatPage((p) => p + 1);
  };

  const showSkeleton = isLoading && browseChats.length === 0;
  const showList = !showSkeleton && viewChats.length > 0;
  const showEmpty = !showSkeleton && !isSearching && activeList.length === 0;
  const showPagination = totalPages > 1;

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
          <div className={style.acpList}>
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

        {showPagination && (
          <div className={style.acpPagination}>
            <button
              type="button"
              className={style.acpPageBtn}
              disabled={chatPage <= 1}
              onClick={handlePrevPage}
            >
              Previous
            </button>
            <span className={style.acpPageInfo}>
              Page {chatPage} of {totalPages}
            </span>
            <button
              type="button"
              className={style.acpPageBtn}
              disabled={chatPage >= totalPages}
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
