import React, { useEffect, useRef, useState } from "react";
import style from "./ui.module.css";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, onSnapshot, addDoc, Timestamp, updateDoc, doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { selecteUsers, selectAdmin } from "../../Store/authSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import {
  getAdminChatParticipantId,
  isAdminChatParticipant,
} from "../../utils/adminProfile";
import { ChatComposer } from "./ChatComposer";
import { uploadChatImage } from "../../utils/chatImageUpload";
const serverURL = process.env.REACT_APP_SERVER_URL;

function getChatParticipantIds(chatId, chatData) {
  if (Array.isArray(chatData?.users) && chatData.users.length >= 2) {
    return chatData.users.map(String);
  }
  return chatId.split("_").filter(Boolean).map(String);
}

export function Chat() {
    const { id, chatId } = useParams();
    const [currentChat, SetCurrentChat] = useState();
    const [currentMessages, setCurrentMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const storeUser = useSelector(selecteUsers);
    const adminAuth = useSelector(selectAdmin);
    const participantIds = getChatParticipantIds(chatId, currentChat);
    const canSendMessages = isAdminChatParticipant(adminAuth, participantIds);
    const activeAdminParticipantId = getAdminChatParticipantId(
        adminAuth,
        participantIds,
    );
    const otherUserId = participantIds.find(
        (uid) => String(uid) !== String(activeAdminParticipantId),
    );
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const el = messagesEndRef.current;
        if (!el) return;
        const container = el.closest(`.${style.waMessages}`);
        if (container && container.scrollHeight <= container.clientHeight + 8) return;
        el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [currentMessages]);

    useEffect(() => {
        function fetchMessages() {
            try {
                const unsub = onSnapshot(collection(db, "chats", chatId, "messages"), (snapshot) => {
                    const changes = snapshot.docChanges();
                    const sortedMessages = changes.slice().sort((changeA, changeB) => {
                        const a = changeA.doc.data();
                        const b = changeB.doc.data();
                        const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1e6;
                        const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1e6;
                        return timeA - timeB;
                    });
                    const newMessages = [];
                    sortedMessages.forEach((change) => {
                        if (change.type === "added") {
                            newMessages.push(change.doc.data());
                        }
                    });
                    setCurrentMessages((prev) => [...prev, ...newMessages]);
                });
                return unsub;
            } catch (error) {
                return () => null;
            }
        }

        const fetchData = async () => {
            try {
                if (chatId) {
                    const chatRoomDocRef = collection(db, "chats");
                    const querySnapshot = await getDocs(chatRoomDocRef);
                    const chatRoomDoc = querySnapshot.docs.find((d) => d.id === chatId);
                    if (chatRoomDoc) {
                        const chatData = chatRoomDoc.data();
                        const ids = getChatParticipantIds(chatId, chatData);
                        const isParticipant = isAdminChatParticipant(
                            adminAuth,
                            ids,
                        );
                        const adminInChat = getAdminChatParticipantId(
                            adminAuth,
                            ids,
                        );
                        const displayUserId = isParticipant
                            ? ids.find(
                                  (uid) => String(uid) !== String(adminInChat),
                              )
                            : ids.find((uid) => String(uid) !== String(id)) ||
                              ids[1] ||
                              ids[0];
                        const user = storeUser.find(
                            (u) => String(u._id) === String(displayUserId),
                        );
                        SetCurrentChat({ ...chatData, user, participants: ids });
                    } else {
                        toast.info("Chat Room document not found");
                    }
                }
            } catch (error) {
                toast.info("Error fetching data");
            }
        };

        fetchData();
        const unsub = fetchMessages();
        return () => unsub();
    }, [chatId, storeUser, id, adminAuth]);

    async function ensureChatRoom(chatDocRef) {
        const chatDoc = await getDoc(chatDocRef);
        if (!chatDoc.exists()) {
            const newChat = {
                chatRoomId: chatId,
                isRequested: "accepted",
                users: [activeAdminParticipantId, otherUserId],
                timestamp: serverTimestamp(),
                unreadCountFrom: 0,
                unreadCountTo: 0,
            };
            await setDoc(chatDocRef, newChat);
            const newCreatedChat = await getDoc(chatDocRef);
            const user = storeUser.find((u) => String(u._id) === String(otherUserId));
            SetCurrentChat({ ...newCreatedChat.data(), user });
        }
    }

    async function deliverChatMessage({ text, messageType, imageUrl = null }) {
        if (!canSendMessages || !activeAdminParticipantId || !otherUserId) return false;
        const chatDocRef = doc(db, "chats", chatId);
        await ensureChatRoom(chatDocRef);
        const newMessage = {
            type: messageType,
            lastMessageStatus: "Delivered",
            imageUrl: imageUrl || null,
            timestamp: Timestamp.fromDate(new Date()),
            receiverId: otherUserId,
            senderId: activeAdminParticipantId,
            message: text,
        };
        const messagesCollectionRef = collection(db, "chats", chatId, "messages");
        await addDoc(messagesCollectionRef, newMessage);
        const lastMessage = text.trim() || (imageUrl ? "📷 Photo" : "");
        await updateDoc(chatDocRef, {
            lastMessage,
            receiverId: otherUserId,
            senderId: activeAdminParticipantId,
        });
        axios
            .post(`${serverURL}/api/notification/chat`, {
                message: lastMessage,
                receiverId: otherUserId,
                senderId: activeAdminParticipantId,
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
                userId: activeAdminParticipantId,
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
        return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function formatDateLabel(timestamp) {
        const ms = timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6;
        const date = new Date(ms);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

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

    const contactName = (() => {
        if (canSendMessages && currentChat?.user) {
            return `${currentChat.user.firstName || ""} ${currentChat.user.lastName || ""}`.trim();
        }
        if (!canSendMessages && participantIds.length >= 2) {
            const names = participantIds
                .map((pid) => {
                    const u = storeUser.find((usr) => String(usr._id) === String(pid));
                    if (!u) return null;
                    return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
                })
                .filter(Boolean);
            if (names.length >= 2) return `${names[0]} ↔ ${names[1]}`;
        }
        if (currentChat?.user) {
            return `${currentChat.user.firstName || ""} ${currentChat.user.lastName || ""}`.trim();
        }
        return "";
    })();
    const avatarUrl = canSendMessages ? currentChat?.user?.profileImageUrl : null;

    return (
        <div className={`wa-chat-page ${style.waInboxShell}`}>
            <div className={style.waContainer}>
            <div className={style.waHeader}>
                <div className={style.waHeaderLeft}>
                    <div className={style.waHeaderAvatar}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className={style.waAvatarImg} />
                        ) : (
                            <span className={style.waAvatarFallback}>
                                {contactName ? contactName[0].toUpperCase() : "?"}
                            </span>
                        )}
                    </div>
                    <div className={style.waHeaderInfo}>
                        <span className={style.waHeaderName}>{contactName || "Unknown User"}</span>
                        {currentChat && (
                            <span className={style.waHeaderStatus}>{currentChat.isRequested}</span>
                        )}
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
                            const isSent = canSendMessages
                                ? String(item.senderId) ===
                                  String(activeAdminParticipantId)
                                : String(item.senderId) === String(participantIds[1]);
                            const senderUser = storeUser.find(
                                (u) => String(u._id) === String(item.senderId),
                            );
                            const msgAvatarUrl = senderUser?.profileImageUrl;
                            return (
                                <div
                                    key={index}
                                    className={`${style.waMsgRow} ${isSent ? style.waMsgRowSent : style.waMsgRowReceived}`}
                                >
                                    {!isSent && msgAvatarUrl && (
                                        <img src={msgAvatarUrl} alt="avatar" className={style.waMsgAvatar} />
                                    )}
                                    <div className={`${style.waBubble} ${isSent ? style.waBubbleSent : style.waBubbleReceived}`}>
                                        {item.imageUrl ? (
                                            <>
                                                <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                                                    <img src={item.imageUrl} alt="chat_img" className={style.waBubbleImg} />
                                                </a>
                                                {item.message ? (
                                                    <span className={style.waBubbleText}>{item.message}</span>
                                                ) : null}
                                            </>
                                        ) : (
                                            <span className={style.waBubbleText}>{item.message}</span>
                                        )}
                                        <div className={style.waBubbleMeta}>
                                            <span className={style.waBubbleTime}>{formatTime(item.timestamp)}</span>
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
                        <i className="bi bi-chat-dots" style={{ fontSize: 48, opacity: 0.25 }} />
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
