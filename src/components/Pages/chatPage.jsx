import React, { useEffect, useRef, useState } from "react";
import style from "./ui.module.css";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, onSnapshot, addDoc, Timestamp, updateDoc, doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { selecteUsers } from "../../Store/authSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";

const serverURL = process.env.REACT_APP_SERVER_URL;

export function Chat() {
    const { id, chatId } = useParams();
    const [currentChat, SetCurrentChat] = useState();
    const [currentMessages, setCurrentMessages] = useState([]);
    const storeUser = useSelector(selecteUsers);
    const [message, setMessage] = useState("");
    const adminId = "658c582ff1bc8978d2300823";
    const otherUserId = chatId.split("_").find((uid) => uid !== adminId);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                        const uid = chatId.split("_").find((userid) => userid !== id);
                        const user = storeUser.find((u) => u._id === uid);
                        SetCurrentChat({ ...chatRoomDoc.data(), user });
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
    }, [chatId, storeUser, id]);

    async function sendMessage(e) {
        e.preventDefault();
        if (!message.trim()) return;
        try {
            const chatDocRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatDocRef);
            if (!chatDoc.exists()) {
                const newChat = {
                    chatRoomId: chatId,
                    isRequested: "accepted",
                    users: [adminId, otherUserId],
                    timestamp: serverTimestamp(),
                    unreadCountFrom: 0,
                    unreadCountTo: 0,
                };
                await setDoc(chatDocRef, newChat);
                const newCreatedChat = await getDoc(chatDocRef);
                const user = storeUser.find((u) => u._id === otherUserId);
                SetCurrentChat({ ...newCreatedChat.data(), user });
            }
            const newMessage = {
                type: "text",
                lastMessageStatus: "Delivered",
                imageUrl: null,
                timestamp: Timestamp.fromDate(new Date()),
                receiverId: otherUserId,
                senderId: adminId,
                message,
            };
            const messagesCollectionRef = collection(db, "chats", chatId, "messages");
            await addDoc(messagesCollectionRef, newMessage);
            await updateDoc(chatDocRef, { lastMessage: message, receiverId: otherUserId, senderId: adminId });
            axios
                .post(`${serverURL}/api/notification/chat`, { message, receiverId: otherUserId, senderId: adminId })
                .catch((err) => console.log(err));
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong");
        } finally {
            setMessage("");
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

    const contactName = currentChat?.user
        ? `${currentChat.user.firstName || ""} ${currentChat.user.lastName || ""}`.trim()
        : "";
    const avatarUrl = currentChat?.user?.profileImageUrl;

    return (
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
                <div className={style.waHeaderActions}>
                    <button className={style.waHeaderBtn} title="Search" type="button">
                        <i className="bi bi-search" />
                    </button>
                    <button className={style.waHeaderBtn} title="More options" type="button">
                        <i className="bi bi-three-dots-vertical" />
                    </button>
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
                            const isSent = item.senderId === adminId;
                            return (
                                <div
                                    key={index}
                                    className={`${style.waMsgRow} ${isSent ? style.waMsgRowSent : style.waMsgRowReceived}`}
                                >
                                    {!isSent && avatarUrl && (
                                        <img src={avatarUrl} alt="avatar" className={style.waMsgAvatar} />
                                    )}
                                    <div className={`${style.waBubble} ${isSent ? style.waBubbleSent : style.waBubbleReceived}`}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt="chat_img" className={style.waBubbleImg} />
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

            {adminId === id && (
                <div className={style.waInputBar}>
                    <form onSubmit={sendMessage} className={style.waInputForm}>
                        <button type="button" className={style.waInputIcon}>
                            <i className="bi bi-emoji-smile" />
                        </button>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            className={style.waInput}
                        />
                        <button type="submit" className={style.waSendBtn} disabled={!message.trim()}>
                            <i className="bi bi-send-fill" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
