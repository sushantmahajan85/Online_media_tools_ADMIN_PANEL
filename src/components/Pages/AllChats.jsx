import { Link } from "react-router-dom";
import { db } from "../../firebase";
import React, { useEffect, useState } from "react";
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { selecteUsers } from "../../Store/authSlice"; // Replace with your actual selector
import style from "./ui.module.css";

export function AllChats() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const StoreAllUsers = useSelector(selecteUsers); // All user data from your store

  const fetchChats = async (initial = false) => {
    try {
      const chatsQuery = initial
        ? query(collection(db, "chats"), orderBy("timestamp", "desc"), limit(100))
        : query(
            collection(db, "chats"),
            orderBy("timestamp", "desc"),
            startAfter(lastVisible),
            limit(100)
          );

      const querySnapshot = await getDocs(chatsQuery);
      if (!querySnapshot.empty) {
        const chatData = [];
        querySnapshot.forEach((doc) => {
          chatData.push({ id: doc.id, ...doc.data() });
        });

        const processedChats = chatData.map((chat) => {
          const sender = StoreAllUsers.find((user) => user._id === chat.senderId);
          const receiver = StoreAllUsers.find((user) => user._id === chat.receiverId);
          const milliseconds =
            chat.timestamp.seconds * 1000 + chat.timestamp.nanoseconds / 1e6;
          const date = new Date(milliseconds);

          return {
            chatId: chat.id,
            senderId: chat.senderId,
            senderName: sender ? sender.firstName : "Unknown Sender",
            receiverId: chat.receiverId,
            receiverName: receiver ? receiver.firstName : "Unknown Receiver",
            timestamp: date,
            lastMessage: chat.lastMessage,
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
  };

  // Function to search messages
  const searchMessages = async (keyword) => {
    try {
      const messagesQuery = query(
        collectionGroup(db, "messages"), // Search all 'messages' subcollections
        where("content", ">=", keyword),
        where("content", "<=", keyword + "\uf8ff") // Ensures a "starts with" match
      );

      const querySnapshot = await getDocs(messagesQuery);

      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          chatId: doc.ref.parent.parent.id, // Get parent chatId
          content: data.content,
          senderId: data.senderId,
          timestamp: data.timestamp,
        });
      });

      return results;
    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchChats(true); // Fetch initial chats
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.trim() === "") {
        setFilteredChats(chats); // No search term, show all chats
        return;
      }

      // Filter chats by sender or receiver name
      const nameFilteredChats = chats.filter(
        (chat) =>
          chat.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Search messages for matching content
      const messageResults = await searchMessages(searchTerm);

      // Include chats with matching messages
      const messageFilteredChats = chats.filter((chat) =>
        messageResults.some((msg) => msg.chatId === chat.chatId)
      );

      // Combine and deduplicate results
      const combinedFilteredChats = [
        ...new Map(
          [...nameFilteredChats, ...messageFilteredChats].map((chat) => [
            chat.chatId,
            chat,
          ])
        ).values(),
      ];

      setFilteredChats(combinedFilteredChats);
    };

    performSearch();
  }, [searchTerm, chats]);

  return (
    <>
      <div className={`p-2 text-light ${style.Sheading}`}>
        <h2 className={style.Heading}>User Chats</h2>
      </div>

      {/* Search Bar */}
      <div className={`p-3 ${style.searchBar}`}>
        <input
          type="text"
          placeholder="Search by sender, receiver, or message content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {filteredChats && filteredChats.length > 0 ? (
        <div className="my-2 p-2">
          <div className={style.containerContent}>
            <div className={style.HeadingContent}>
              <div className="row gap-2">
                <div className="col d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Sender</h2>
                </div>
                <div className="col d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Receiver</h2>
                </div>
                <div className="col d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Timestamp</h2>
                </div>
                <div className="col d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Last Message</h2>
                </div>
              </div>
            </div>
            {filteredChats.map((chat) => (
              <div key={chat.id} className={style.Content}>
                <div className="row gap-2 p-2">
                  <div className="col d-flex align-items-center justify-content-center">
                    <h2 className="fw-medium fs-6">{chat.senderName || "N/A"}</h2>
                  </div>
                  <div className="col d-flex align-items-center justify-content-center">
                    <h2 className="fw-medium fs-6">{chat.receiverName || "N/A"}</h2>
                  </div>
                  <div className="col d-flex align-items-center justify-content-center">
                    <h2 className="fw-medium fs-6">
                      {chat.timestamp ? chat.timestamp.toLocaleString() : "N/A"}
                    </h2>
                  </div>
                  <Link
                    to={chat.chatLink}
                    style={{ textDecoration: "underline", color: "green" }}
                    className="col d-flex align-items-center justify-content-start gap-2"
                  >
                    <div className="col d-flex align-items-center justify-content-center">
                      <h2 className="fw-medium fs-6">{chat.lastMessage || "N/A"}</h2>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="d-flex justify-content-center mt-3">
              <button className="btn btn-primary" onClick={() => fetchChats(false)}>
                Load More
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xl d-flex align-items-center my-5 justify-content-center">
          <p className="text-center fw-bolder">No Chats Found</p>
        </div>
      )}
    </>
  );
}
