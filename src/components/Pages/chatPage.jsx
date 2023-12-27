import React, { useEffect, useState } from "react";
import style from "./ui.module.css"
import { useParams } from "react-router-dom";
import { db, } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { selecteUsers } from "../../Store/authSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export function Chat() {
    const { id, chatId } = useParams()
    const [currentChat, SetCurrentChat] = useState()
    const storeUser = useSelector(selecteUsers)

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (chatId) {
                    // Get the specific chatRoomId document
                    const chatRoomDocRef = collection(db, "chats");
                    const querySnapshot = await getDocs(chatRoomDocRef);

                    const chatRoomDoc = querySnapshot.docs.find(doc => doc.id === chatId);
                    // // console.log("forst , doc ", chatRoomDoc.data())
                    if (chatRoomDoc) {
                        // Get the messages collection under the chatRoomId document
                        const messagesCollectionRef = collection(chatRoomDoc.ref, "messages");
                        const messagesQuerySnapshot = await getDocs(messagesCollectionRef);

                        // Extract messages data from the query snapshot
                        const messagesData = messagesQuerySnapshot.docs.map((doc) => doc.data());

                        // Set the current chat state with the chat data and messages data
                        const otherUserId = chatId.split('_').find(userid => userid !== id);
                        const user = storeUser.find(user => user._id === otherUserId);
                        const sortedMessages = messagesData.slice().sort((a, b) => {
                            const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1e6;
                            const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1e6;
                            return timeA - timeB;
                        });
                        SetCurrentChat({ ...chatRoomDoc.data(), messages: sortedMessages, user });
                    } else {
                        toast.info("Chat Room document not found");
                    }
                }
            } catch (error) {
                toast.info("Error fetching data");
            }
        };

        fetchData();
    }, [chatId, storeUser, id]);


    // const sortedMessages = currentChat.messages.slice().sort((a, b) => {
    //     const timeA = a.timestamp.seconds * 1000 + a.timestamp.nanoseconds / 1e6;
    //     const timeB = b.timestamp.seconds * 1000 + b.timestamp.nanoseconds / 1e6;
    //     return timeA - timeB;
    // });

    // // console.log(currentChat)
    return (<>
        {currentChat ?
            <div>

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
                            
                    {currentChat.messages.map((chat, index) => {
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

                                            <span className={`  ${chat.senderId === id ? `bg-info` : `bg-success`} p-1 my-2 rounded d-flex align-items-center justify-content-between`}>
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
    </>)
}
