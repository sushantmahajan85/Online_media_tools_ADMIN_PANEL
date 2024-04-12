import React, { useEffect, useState } from "react";
import style from "./ui.module.css"
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, onSnapshot, addDoc, Timestamp, updateDoc, doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { selecteUsers } from "../../Store/authSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";

const serverURL = process.env.REACT_APP_SERVER_URL

export function Chat() {
    const { id, chatId } = useParams()
    const [currentChat, SetCurrentChat] = useState();
    const [currentMessages, setCurrentMessages] = useState([]);
    const storeUser = useSelector(selecteUsers);
    const [message, setMessage] = useState("");
    const adminId = "658c582ff1bc8978d2300823";
    const otherUserId = chatId.split("_").find(id => id !== adminId);

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
                    const newMessages = []
                    sortedMessages.forEach((change) => {
                        if (change.type === "added") {
                            newMessages.push(change.doc.data());
                        }
                    });
                    setCurrentMessages((prev) => [...prev, ...newMessages]);
                })
                return unsub;
            } catch (error) {
                return () => null;
            }
        }
        const fetchData = async () => {
            try {
                if (chatId) {
                    // Get the specific chatRoomId document
                    const chatRoomDocRef = collection(db, "chats");
                    const querySnapshot = await getDocs(chatRoomDocRef);

                    const chatRoomDoc = querySnapshot.docs.find(doc => doc.id === chatId);
                    // // console.log("forst , doc ", chatRoomDoc.data())
                    if (chatRoomDoc) {
                        // // Get the messages collection under the chatRoomId document
                        // const messagesCollectionRef = collection(chatRoomDoc.ref, "messages");
                        // const messagesQuerySnapshot = await getDocs(messagesCollectionRef);

                        // // Extract messages data from the query snapshot
                        // const messagesData = messagesQuerySnapshot.docs.map((doc) => doc.data());

                        // // Set the current chat state with the chat data and messages data
                        const otherUserId = chatId.split('_').find(userid => userid !== id);
                        const user = storeUser.find(user => user._id === otherUserId);
                        // const sortedMessages = messagesData.slice().sort((a, b) => {
                        //     const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1e6;
                        //     const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1e6;
                        //     return timeA - timeB;
                        // });
                        // setCurrentMessages(sortedMessages)
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
        try {
            e.preventDefault();
            const chatDocRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatDocRef);
            if (!chatDoc.exists()) {
                // init new chat
                const newChat = {
                    chatRoomId: chatId,
                    isRequested: "accepted",
                    users: [adminId, otherUserId],
                    timestamp: serverTimestamp(),
                    unreadCountFrom: 0,
                    unreadCountTo: 0,
                }
                await setDoc(chatDocRef, newChat);
                const newCreatedChat = await getDoc(chatDocRef);
                const user = storeUser.find(user => user._id === otherUserId);
                SetCurrentChat({ ...newCreatedChat.data(), user });
            }
            const newMessage = {
                type: "text",
                lastMessageStatus: "Delivered",
                imageUrl: null,
                timestamp: Timestamp.fromDate(new Date()),
                receiverId: otherUserId,
                senderId: adminId,
                message
            }
            const messagesCollectionRef = collection(db, "chats", chatId, "messages");
            await addDoc(messagesCollectionRef, newMessage);
            await updateDoc(chatDocRef, { lastMessage: message, receiverId: otherUserId, senderId: adminId });
            axios.post(`${serverURL}/api/notification/chat`, { message, receiverId: otherUserId, senderId: adminId }).catch((error) => console.log(error))
        } catch (error) {
            console.log(error);
            toast.error("Someting went wrong")
        }
        finally {
            setMessage("");
        }
    }


    // const sortedMessages = currentChat.messages.slice().sort((a, b) => {
    //     const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1e6;
    //     const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1e6;
    //     return timeA - timeB;
    // });

    // // console.log(currentChat)
    return (<div >
        {(currentChat && currentMessages.length !== 0) ?
            <div style={{ marginBottom: 60 }}>

                <div className={`p-2  d-flex align-items-center justify-content-between text-light ${style.Sheading} `}>
                    <div className={`d-flex align-items-center justify-content-between`}>
                        <div>
                            {
                                currentChat.user.profileImageUrl &&
                                <img
                                    src={currentChat.user.profileImageUrl}
                                    className="rounded-circle"

                                    alt="avatar"
                                    width="45"
                                    height="45"
                                />
                            }
                        </div>
                        <h2 className="mx-2">
                            {
                                currentChat.user.firstName &&
                                currentChat.user.firstName + " " + currentChat.user.lastName
                            }
                        </h2>
                        <h2 className="mx-2">
                            {/* {mobileNumber && mobileNumber} */}
                        </h2>
                    </div>
                    <h2 className={style.Heading}>
                        {currentChat ? currentChat.isRequested : ""}
                    </h2>
                </div>

                <div>

                    {currentMessages.map((chat, index) => {
                        const milliseconds = chat.timestamp.seconds * 1000 + chat.timestamp.nanoseconds / 1e6;
                        const date = new Date(milliseconds);
                        return <div key={index} className="p-2">
                            <div className={`d-flex ${chat.senderId === id ? `justify-content-end` : `justify-content-start`}    `}>
                                <div style={{ width: "80%" }}>
                                    {
                                        chat.imageUrl ? <div style={{ height: "50rem", width: "100%" }}>
                                            <img src={chat.imageUrl} alt="chat_img" width={"100%"} style={{ objectFit: "contain" }} height={"100%"} />
                                        </div>
                                            :

                                            <span className={`  ${chat.senderId === adminId ? `bg-info` : `bg-success`} p-1 my-2 rounded d-flex align-items-center justify-content-between`}>
                                                {chat.message}
                                                <span style={{ fontSize: ".7rem" }}>
                                                    {date.toLocaleString()}
                                                </span>
                                            </span>
                                    }
                                </div>

                            </div>

                        </div>
                    })}
                </div>
            </div>
            :
            <div>
                <p className="fw-bold text-center">
                    No Chat Found
                </p>
            </div>}
        {adminId === id && <div className={style.chatInput} style={{ position: "absolute", boxShadow: " rgba(0, 0, 0, 0.24) 0px 3px 8px" }}>
            <form onSubmit={sendMessage} style={{ display: "flex" }}>
                <input
                    style={{ width: "100%", padding: 10, border: "none", borderRadius: "10px 0 0 10px" }}
                    type="text" value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button style={{ border: "none", padding: 15, textAlign: "center", borderRadius: "0 10px 10px 0", backgroundColor: "black", color: "white" }} type="submit"><i class="bi bi-send"></i></button>
            </form>
        </div>}
    </div>)
}
