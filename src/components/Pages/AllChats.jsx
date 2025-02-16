import { Link } from "react-router-dom";
import { db } from "../../firebase";
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useSelector } from "react-redux";
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
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(chatsQuery);

      if (!querySnapshot.empty) {
        const chatData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const chat = { id: doc.id, ...doc.data() };

            console.log("🔥 Raw Firestore Chat Document:", chat); // Debug log

            // Fetch all messages from the chat's messages subcollection
            const messagesQuery = query(
              collection(db, `chats/${chat.id}/messages`),
              orderBy("timestamp", "desc")
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const messages = messagesSnapshot.docs.map((msg) => ({
              id: msg.id,
              ...msg.data(),
            }));

            console.log(`📩 Messages for Chat ${chat.id}:`, messages); // Debug log

            const sender = StoreAllUsers.find(
              (user) => user._id === chat.senderId
            );
            const receiver = StoreAllUsers.find(
              (user) => user._id === chat.receiverId
            );
            const date = chat.timestamp
              ? new Date(chat.timestamp.seconds * 1000)
              : null;

            return {
              chatId: chat.id,
              senderId: chat.senderId,
              senderName: sender?.firstName || "Loading Sender...",
              receiverId: chat.receiverId,
              receiverName: receiver?.firstName || "Loading Receiver...",
              timestamp: date,
              lastMessage: chat.lastMessage || "",
              allMessages: messages, // Store all messages for search
              chatLink: `/Admin/AdminDashboard/UserDetails/${chat.receiverId}/UserChats/${chat.id}/Chat`,
            };
          })
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
          }, Match=${senderMatch || receiverMatch}`
        );

        return senderMatch || receiverMatch;
      });
    }

    if (searchMessage.trim()) {
      filtered = filtered.filter((chat) =>
        chat.allMessages.some((msg) =>
          msg.message?.toLowerCase().includes(searchMessage.toLowerCase())
        )
      );
    }

    console.log("🔹 Filtered Chats After Search:", filtered);
    setFilteredChats(filtered);
    setIsLoading(false);
  }, [searchTerm, searchMessage, chats]);

  return (
    <>
      <div className={`p-2 text-light ${style.Sheading}`}>
        <h2 className={style.Heading}>User Chats</h2>
      </div>

      {/* 🔍 Search Input Fields */}
      <div className={`p-3 ${style.searchBar}`}>
        <input
          type="text"
          placeholder="Search by sender/receiver"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
        <input
          type="text"
          placeholder="Search by message content..."
          value={searchMessage}
          onChange={(e) => setSearchMessage(e.target.value)}
          className="form-control"
        />
      </div>

      {/* 🔄 Loader */}
      {isLoading && (
        <div className="text-center my-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* 🔹 Display Filtered Chats */}
      {!isLoading && filteredChats.length > 0 ? (
        <div className="my-2 p-2">
          <div className={style.containerContent}>
            {filteredChats.map((chat) => (
              <div key={chat.chatId} className={style.Content}>
                <div className="row gap-2 p-2">
                  <div className="col text-center">
                    {chat.senderName || "N/A"}
                  </div>
                  <div className="col text-center">
                    {chat.receiverName || "N/A"}
                  </div>
                  <div className="col text-center">
                    {chat.timestamp ? chat.timestamp.toLocaleString() : "N/A"}
                  </div>
                  <Link
                    to={chat.chatLink}
                    className="col text-center text-success"
                  >
                    {chat.lastMessage || "N/A"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center my-5">
            <p className="fw-bold">No Chats Found</p>
          </div>
        )
      )}
    </>
  );
}
