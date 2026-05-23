/* eslint-disable react-hooks/exhaustive-deps */
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { selecteUsers } from "../../Store/authSlice";
import style from "./ui.module.css";

export function AllChats() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const StoreAllUsers = useSelector(selecteUsers);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const chatsQuery = query(
        collection(db, "chats"),
        orderBy("timestamp", "desc"),
      );
      const querySnapshot = await getDocs(chatsQuery);

      if (!querySnapshot.empty) {
        const chatData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const chat = { id: doc.id, ...doc.data() };

            console.log("🔥 Raw Firestore Chat Document:", chat); // Debug log

            // Fetch messages sorted by timestamp (latest first)
            const messagesQuery = query(
              collection(db, `chats/${chat.id}/messages`),
              orderBy("timestamp", "desc"),
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const messages = messagesSnapshot.docs.map((msg) => ({
              id: msg.id,
              ...msg.data(),
            }));

            console.log(`📩 Messages for Chat ${chat.id}:`, messages); // Debug log

            // Get the latest message
            const lastMessage = messages.length > 0 ? messages[0] : null;

            // Assign sender & receiver based on the last message
            const sender = StoreAllUsers.find(
              (user) => user._id === lastMessage?.senderId,
            );
            const receiver = StoreAllUsers.find(
              (user) => user._id === lastMessage?.receiverId,
            );

            const date = chat.timestamp
              ? new Date(chat.timestamp.seconds * 1000)
              : null;

            return {
              chatId: chat.id,
              senderId: lastMessage?.senderId || "Unknown",
              senderName: sender?.firstName || "Unknown Sender",
              receiverId: lastMessage?.receiverId || "Unknown",
              receiverName: receiver?.firstName || "Unknown Receiver",
              timestamp: date,
              lastMessage: lastMessage?.message || "No messages yet",
              allMessages: messages, // Store all messages for search
              chatLink: `/Admin/AdminDashboard/UserDetails/${chat.receiverId}/UserChats/${chat.id}/Chat`,
            };
          }),
        );

        setChats(chatData);
        setFilteredChats(chatData); // Ensure initial state is set
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChats();
  }, [StoreAllUsers]);

  // 🔹 Filter Chats Based on Search Input
  useEffect(() => {
    setIsLoading(true);
    console.log("🔎 Filtering chats...");
    console.log("📌 Search Term:", searchTerm);
    console.log("📌 Search Message:", searchMessage);
    console.log("📌 Original Chats Before Filtering:", chats);

    let filtered = [...chats]; // Ensure we don't mutate state

    if (searchTerm.trim()) {
      filtered = filtered.filter((chat) => {
        const senderMatch = chat.senderName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
        const receiverMatch = chat.receiverName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

        console.log(
          `🔹 Checking chat: Sender=${chat.senderName}, Receiver=${
            chat.receiverName
          }, Match=${senderMatch || receiverMatch}`,
        );

        return senderMatch || receiverMatch;
      });
    }

    if (searchMessage.trim()) {
      filtered = filtered.filter((chat) =>
        chat.allMessages.some((msg) =>
          msg.message?.toLowerCase().includes(searchMessage.toLowerCase()),
        ),
      );
    }

    console.log("🔹 Filtered Chats After Search:", filtered);
    setFilteredChats(filtered);
    setIsLoading(false);
  }, [searchTerm, searchMessage, chats]);

  function getInitials(name) {
    if (!name || name === "Unknown Sender" || name === "Unknown Receiver")
      return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  function formatTime(date) {
    if (!date) return "—";
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
          {!isLoading && (
            <span className={style.acpCountBadge}>
              {filteredChats.length} conversation{filteredChats.length !== 1 ? "s" : ""}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={style.acpSearchInput}
            />
            {searchTerm && (
              <button
                className={style.acpSearchClear}
                onClick={() => setSearchTerm("")}
                aria-label="Clear"
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
              onChange={(e) => setSearchMessage(e.target.value)}
              className={style.acpSearchInput}
            />
            {searchMessage && (
              <button
                className={style.acpSearchClear}
                onClick={() => setSearchMessage("")}
                aria-label="Clear"
              >
                <span className="bi bi-x" />
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className={style.acpLoadingWrap}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={style.acpSkeleton} />
            ))}
          </div>
        )}

        {!isLoading && filteredChats.length > 0 && (
          <div className={style.acpList}>
            {filteredChats.map((chat) => (
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
                  <div className={style.acpAvatar} data-name={chat.receiverName} style={{ background: "linear-gradient(135deg,#0bb7af,#3699ff)" }}>
                    {getInitials(chat.receiverName)}
                  </div>
                </div>

                <div className={style.acpChatInfo}>
                  <div className={style.acpChatNames}>
                    <span className={style.acpSenderName}>{chat.senderName}</span>
                    <span className={style.acpNameSep}>→</span>
                    <span className={style.acpReceiverName}>{chat.receiverName}</span>
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

        {!isLoading && filteredChats.length === 0 && (
          <div className={style.acpEmpty}>
            <span className={`bi bi-chat-slash ${style.acpEmptyIcon}`} />
            <p className={style.acpEmptyTitle}>No chats found</p>
            <p className={style.acpEmptyHint}>Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
