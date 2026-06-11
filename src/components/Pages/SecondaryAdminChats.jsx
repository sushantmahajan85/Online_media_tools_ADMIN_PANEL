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
import { selectAdmin, selecteUsers } from "../../Store/authSlice";
import {
  getAdminMongoUserId,
  getSecondaryAdminUserChatLink,
} from "../../utils/adminProfile";
import {
  chatDocToRow,
  enrichChatRows,
  filterKnownChats,
  getBlockedChatParticipantIds,
  isAdminUserChat,
} from "../../utils/userChatMonitor";
import axios from "axios";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;
const CHATS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function SecondaryAdminChats() {
  const storeUsers = useSelector(selecteUsers);
  const adminAuth = useSelector(selectAdmin);
  const adminMongoId = getAdminMongoUserId(adminAuth);
  const adminIds = useMemo(
    () => getBlockedChatParticipantIds([adminMongoId]),
    [adminMongoId],
  );

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

  const setSearchMode = (mode) => {
    searchModeRef.current = mode;
    setSearchModeState(mode);
  };

  const loadAllAdminChats = useCallback(async () => {
    let snapshot;
    try {
      snapshot = await getDocs(
        query(collection(db, "chats"), orderBy("timestamp", "desc")),
      );
    } catch {
      snapshot = await getDocs(collection(db, "chats"));
    }

    const rows = snapshot.docs
      .map(chatDocToRow)
      .filter((row) => isAdminUserChat(row.participants, adminIds));

    const enriched = await enrichChatRows(rows, {
      matchParticipants: (participants) =>
        isAdminUserChat(participants, adminIds),
      chatLink: (row) => getSecondaryAdminUserChatLink(row.chatId),
      storeUsers,
    });

    return enriched.sort(
      (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0),
    );
  }, [adminIds, storeUsers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const chats = await loadAllAdminChats();
        if (!cancelled) {
          setBrowseChats(chats);
          setChatPage(1);
        }
      } catch (error) {
        console.error("Error loading admin chats:", error);
        if (!cancelled) setBrowseChats([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAllAdminChats]);

  const activeList = searchMode ? searchChats : browseChats;
  const totalCount = activeList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / CHATS_PAGE_SIZE));

  const viewChats = useMemo(() => {
    const start = (chatPage - 1) * CHATS_PAGE_SIZE;
    return activeList.slice(start, start + CHATS_PAGE_SIZE);
  }, [activeList, chatPage]);

  const runNameSearch = useCallback(
    async (q) => {
      setIsSearching(true);
      try {
        const response = await axios.get(
          `${serverURL}/api/admin/chats/search-by-name`,
          { params: { q, page: 1, limit: 500 } },
        );
        const chats = filterKnownChats(response.data?.chats || [])
          .filter((chat) =>
            isAdminUserChat(
              chat.participants || [chat.senderId, chat.receiverId],
              adminIds,
            ),
          )
          .map((chat) => ({
            ...chat,
            chatLink: getSecondaryAdminUserChatLink(chat.chatId),
          }));
        setSearchChats(chats);
        setChatPage(1);
      } catch (error) {
        console.error("Name search failed:", error);
        setSearchChats([]);
      } finally {
        setIsSearching(false);
        setIsLoading(false);
      }
    },
    [adminIds],
  );

  const runMessageSearch = useCallback(
    async (q) => {
      setIsSearching(true);
      try {
        const response = await axios.get(
          `${serverURL}/api/admin/chats/search-by-message`,
          { params: { q, page: 1, limit: 500 } },
        );
        const chats = filterKnownChats(response.data?.chats || [])
          .filter((chat) =>
            isAdminUserChat(
              chat.participants || [chat.senderId, chat.receiverId],
              adminIds,
            ),
          )
          .map((c) => ({
            ...c,
            lastMessage: c.matchedMessage || c.lastMessage,
            chatLink: getSecondaryAdminUserChatLink(c.chatId),
          }));
        setSearchChats(chats);
        setChatPage(1);
      } catch (error) {
        console.error("Message search failed:", error);
        setSearchChats([]);
      } finally {
        setIsSearching(false);
        setIsLoading(false);
      }
    },
    [adminIds],
  );

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

    searchDebounceRef.current = setTimeout(() => {
      if (nameQ) {
        setSearchMode("name");
        setSearchMessage("");
        runNameSearch(nameQ);
      } else if (messageQ) {
        setSearchMode("message");
        setSearchName("");
        runMessageSearch(messageQ);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchName, searchMessage, runNameSearch, runMessageSearch]);

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
  const showEmpty =
    !showSkeleton && !isSearching && activeList.length === 0;
  const showPagination = totalPages > 1 && !isSearching;

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
          <span>Chats</span>
          <span className={style.udpBreadcrumbSep}>/</span>
          <span className={style.udpBreadcrumbActive}>Admin & User</span>
        </nav>
        <div className={style.acpHeaderRow}>
          <h1 className={style.udpPageTitle}>Admin Chats</h1>
          {!showSkeleton && (
            <span className={style.acpCountBadge}>
              {totalCount} conversation{totalCount !== 1 ? "s" : ""}
              {searchMode === "name" && " · name search"}
              {searchMode === "message" && " · message search"}
            </span>
          )}
        </div>
        <p className="text-muted small mb-0">
          Conversations between support admin and platform users.
        </p>
      </div>

      <div className={style.acpShell}>
        <div className={style.acpSearchRow}>
          <div className={style.acpSearchField}>
            <span className={`bi bi-person-search ${style.acpSearchIcon}`} />
            <input
              type="text"
              placeholder="Search by user name…"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                if (e.target.value.trim()) setSearchMessage("");
              }}
              className={style.acpSearchInput}
            />
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
          </div>
        </div>

        {isSearching && <p className="text-muted small mb-2">Searching…</p>}

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
          <div className="d-flex align-items-center justify-content-between mt-3 px-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={chatPage <= 1}
              onClick={handlePrevPage}
            >
              Previous
            </button>
            <span className="small text-muted">
              Page {chatPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
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
            <p className={style.acpEmptyTitle}>No admin chats found</p>
            <p className={style.acpEmptyHint}>
              {searchMode
                ? "Try a different search term"
                : "No admin-to-user conversations yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
