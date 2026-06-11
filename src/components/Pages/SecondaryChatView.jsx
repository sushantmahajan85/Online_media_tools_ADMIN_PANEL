import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { db } from "../../firebase";
import { selectAdmin, selecteUsers } from "../../Store/authSlice";
import {
  getAdminMongoUserId,
  getAdminUserChatSupportId,
  SECONDARY_ADMIN_HOME_PATH,
  SECONDARY_ADMIN_USER_CHATS_PATH,
} from "../../utils/adminProfile";
import {
  displayName,
  getBlockedChatParticipantIds,
  isAdminUserChat,
} from "../../utils/userChatMonitor";
import { ChatComposer } from "./ChatComposer";
import { uploadChatImage } from "../../utils/chatImageUpload";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;

function getChatParticipantIds(chatId, chatData) {
  if (Array.isArray(chatData?.users) && chatData.users.length >= 2) {
    return chatData.users.map(String);
  }
  return chatId.split("_").filter(Boolean).map(String);
}

export function SecondaryChatView() {
  const { chatId } = useParams();
  const { pathname } = useLocation();
  const adminAuth = useSelector(selectAdmin);
  const storeUsers = useSelector(selecteUsers);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);

  const requireAdminUserChat = pathname.includes("/AdminChats/");
  const backPath = requireAdminUserChat
    ? SECONDARY_ADMIN_USER_CHATS_PATH
    : SECONDARY_ADMIN_HOME_PATH;

  const adminIds = useMemo(
    () =>
      getBlockedChatParticipantIds([getAdminMongoUserId(adminAuth)]),
    [adminAuth],
  );
  const participantIds = getChatParticipantIds(chatId, currentChat);
  const adminParticipantId = getAdminUserChatSupportId(participantIds, adminIds);
  const otherUserId = participantIds.find(
    (pid) => String(pid) !== String(adminParticipantId),
  );
  const canSendMessages =
    requireAdminUserChat &&
    Boolean(adminParticipantId && otherUserId) &&
    isAdminUserChat(participantIds, adminIds);

  const statusLabel = canSendMessages
    ? "Replying as support admin"
    : requireAdminUserChat
      ? "Admin & user"
      : "Read-only";

  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [currentMessages]);

  useEffect(() => {
    let unsubMessages = () => {};

    async function loadChat() {
      try {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (!chatDoc.exists()) {
          toast.info("Chat not found");
          return;
        }

        const chatData = chatDoc.data();
        const ids = getChatParticipantIds(chatId, chatData);

        if (requireAdminUserChat && !isAdminUserChat(ids, adminIds)) {
          toast.error("This admin chat is not available");
          return;
        }

        setCurrentChat({ ...chatData, participants: ids });

        unsubMessages = onSnapshot(
          collection(db, "chats", chatId, "messages"),
          (snapshot) => {
            const messages = snapshot.docs
              .map((d) => d.data())
              .sort((a, b) => {
                const timeA =
                  a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1e6;
                const timeB =
                  b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1e6;
                return timeA - timeB;
              });
            setCurrentMessages(messages);
          },
        );
      } catch {
        toast.info("Error loading chat");
      }
    }

    if (chatId) loadChat();
    return () => unsubMessages();
  }, [chatId, requireAdminUserChat, adminAuth, adminIds]);

  async function ensureChatRoom(chatDocRef) {
    const chatDoc = await getDoc(chatDocRef);
    if (!chatDoc.exists()) {
      await setDoc(chatDocRef, {
        chatRoomId: chatId,
        isRequested: "accepted",
        users: [adminParticipantId, otherUserId],
        timestamp: serverTimestamp(),
        unreadCountFrom: 0,
        unreadCountTo: 0,
      });
    }
  }

  async function deliverChatMessage({ text, messageType, imageUrl = null }) {
    if (!canSendMessages || !adminParticipantId || !otherUserId) return false;

    const chatDocRef = doc(db, "chats", chatId);
    await ensureChatRoom(chatDocRef);

    const newMessage = {
      type: messageType,
      lastMessageStatus: "Delivered",
      imageUrl: imageUrl || null,
      timestamp: Timestamp.fromDate(new Date()),
      receiverId: otherUserId,
      senderId: adminParticipantId,
      message: text,
    };

    await addDoc(collection(db, "chats", chatId, "messages"), newMessage);

    const lastMessage = text.trim() || (imageUrl ? "📷 Photo" : "");
    await updateDoc(chatDocRef, {
      lastMessage,
      receiverId: otherUserId,
      senderId: adminParticipantId,
    });

    axios
      .post(`${serverURL}/api/notification/chat`, {
        message: lastMessage,
        receiverId: otherUserId,
        senderId: adminParticipantId,
      })
      .catch((err) => console.log(err));

    return true;
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text || isSending || isUploading) return;
    setIsSending(true);
    try {
      await deliverChatMessage({ text, messageType: "text" });
      setMessage("");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  async function sendImageMessage(file, caption) {
    if (isSending || isUploading) return false;
    setIsUploading(true);
    try {
      const imageUrl = await uploadChatImage({
        userId: adminParticipantId,
        chatRoomId: chatId,
        file,
      });
      if (!imageUrl) {
        toast.error("Failed to upload image");
        return false;
      }
      await deliverChatMessage({
        text: caption,
        messageType: "image",
        imageUrl,
      });
      return true;
    } catch (error) {
      console.log(error);
      toast.error("Failed to send image");
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  function formatTime(timestamp) {
    const ms = timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6;
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateLabel(timestamp) {
    const ms = timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6;
    const date = new Date(ms);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function participantLabel(pid) {
    const user = storeUsers.find((u) => String(u._id) === String(pid));
    if (adminIds.has(String(pid))) {
      return displayName(user) || "Admin";
    }
    return displayName(user) || `User ${String(pid).slice(-4)}`;
  }

  const participantNames = participantIds.map(participantLabel);
  const contactName =
    participantNames.length >= 2
      ? `${participantNames[0]} ↔ ${participantNames[1]}`
      : "Conversation";

  const groupedMessages = [];
  let lastDateLabel = null;
  currentMessages.forEach((msg) => {
    const label = formatDateLabel(msg.timestamp);
    if (label !== lastDateLabel) {
      groupedMessages.push({ type: "date", label });
      lastDateLabel = label;
    }
    groupedMessages.push({ type: "message", ...msg });
  });

  if (
    currentChat &&
    requireAdminUserChat &&
    !isAdminUserChat(participantIds, adminIds)
  ) {
    return (
      <div className={style.acpPage}>
        <p className="text-muted">This conversation cannot be viewed here.</p>
        <Link to={backPath} className="btn btn-sm btn-primary">
          Back to admin chats
        </Link>
      </div>
    );
  }

  return (
    <div className={`wa-chat-page ${style.waInboxShell}`}>
      <div className={style.waContainer}>
        <div className={style.waHeader}>
          <div className={style.waHeaderLeft}>
            <Link
              to={backPath}
              className="btn btn-sm btn-link text-decoration-none me-2"
            >
              <i className="bi bi-arrow-left" />
            </Link>
            <div className={style.waHeaderInfo}>
              <span className={style.waHeaderName}>{contactName}</span>
              <span className={style.waHeaderStatus}>{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className={style.waMessages}>
          {currentChat && currentMessages.length > 0 ? (
            <>
              {groupedMessages.map((item, index) => {
                if (item.type === "date") {
                  return (
                    <div key={`date-${index}`} className={style.waDateSep}>
                      <span>{item.label}</span>
                    </div>
                  );
                }

                const isSent =
                  String(item.senderId) === String(adminParticipantId);
                const senderLabel = participantLabel(item.senderId);

                return (
                  <div
                    key={index}
                    className={`${style.waMsgRow} ${
                      isSent ? style.waMsgRowSent : style.waMsgRowReceived
                    }`}
                  >
                    <div
                      className={`${style.waBubble} ${
                        isSent ? style.waBubbleSent : style.waBubbleReceived
                      }`}
                    >
                      <span className="small text-muted d-block mb-1">
                        {senderLabel}
                      </span>
                      {item.imageUrl ? (
                        <>
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={item.imageUrl}
                              alt="chat"
                              className={style.waBubbleImg}
                            />
                          </a>
                          {item.message ? (
                            <span className={style.waBubbleText}>
                              {item.message}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className={style.waBubbleText}>{item.message}</span>
                      )}
                      <div className={style.waBubbleMeta}>
                        <span className={style.waBubbleTime}>
                          {formatTime(item.timestamp)}
                        </span>
                        {isSent && (
                          <span className={style.waTicks}>
                            <i className="bi bi-check2-all" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className={style.waEmpty}>
              <i
                className="bi bi-chat-dots"
                style={{ fontSize: 48, opacity: 0.25 }}
              />
              <p>No messages yet</p>
            </div>
          )}
        </div>

        {canSendMessages && (
          <div className={style.waInputBar}>
            <form onSubmit={sendMessage}>
              <ChatComposer
                message={message}
                onMessageChange={setMessage}
                onSendText={sendMessage}
                onSendImage={sendImageMessage}
                isSending={isSending}
                isUploading={isUploading}
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
