import { Link } from "react-router-dom";
import { db } from "../../firebase";
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { selecteUsers } from "../../Store/authSlice";
import style from "./ui.module.css";

export function AllChats() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const StoreAllUsers = useSelector(selecteUsers);

  // 🔹 Fetch Chat List from Firestore
  const fetchChats = async (initial = false) => {
    setIsLoading(true);
    try {
      const chatsQuery = initial
        ? query(
            collection(db, "chats"),
            orderBy("timestamp", "desc"),
            limit(100)
          )
        : query(
            collection(db, "chats"),
            orderBy("timestamp", "desc"),
            startAfter(lastVisible),
            limit(100)
          );

      const querySnapshot = await getDocs(chatsQuery);

      if (!querySnapshot.empty) {
        const chatData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const processedChats = chatData.map((chat) => {
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
            senderName: sender?.firstName || "Unknown Sender",
            receiverId: chat.receiverId,
            receiverName: receiver?.firstName || "Unknown Receiver",
            timestamp: date,
            lastMessage: chat.lastMessage || "",
            chatLink: `/Admin/AdminDashboard/UserDetails/${chat.receiverId}/UserChats/${chat.id}/Chat`,
          };
        });

        setChats((prevChats) =>
          initial ? processedChats : [...prevChats, ...processedChats]
        );
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === 100);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChats(true);
  }, []);

  // 🔹 Filter Chats Based on Search Input
  useEffect(() => {
    setIsLoading(true);
    let filteredChats = chats;

    if (searchTerm.trim()) {
      filteredChats = filteredChats.filter(
        (chat) =>
          chat.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (searchMessage.trim()) {
      filteredChats = filteredChats.filter((chat) =>
        chat.lastMessage.toLowerCase().includes(searchMessage.toLowerCase())
      );
    }

    setFilteredChats(filteredChats);
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
      {filteredChats.length > 0 ? (
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
          {hasMore && (
            <button
              className="btn btn-primary mt-3"
              onClick={() => fetchChats(false)}
            >
              Load More
            </button>
          )}
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
