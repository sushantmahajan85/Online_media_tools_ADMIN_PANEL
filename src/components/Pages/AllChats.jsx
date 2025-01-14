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
import { selecteUsers } from "../../Store/authSlice"; 
import style from "./ui.module.css";

export function AllChats() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const StoreAllUsers = useSelector(selecteUsers); 

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
        const chatData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const processedChats = chatData.map((chat) => {
          const sender = StoreAllUsers.find((user) => user._id === chat.senderId);
          const receiver = StoreAllUsers.find((user) => user._id === chat.receiverId);
          const date = chat.timestamp
            ? new Date(chat.timestamp.seconds * 1000 + chat.timestamp.nanoseconds / 1e6)
            : null;

          return {
            chatId: chat.id,
            senderId: chat.senderId,
            senderName: sender?.firstName || "Unknown Sender",
            receiverId: chat.receiverId,
            receiverName: receiver?.firstName || "Unknown Receiver",
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

  const searchMessages = async (keyword) => {
    try {
      const messagesQuery = query(
        collectionGroup(db, "messages"),
        where("message", ">=", keyword),
        where("message", "<=", keyword + "\uf8ff"),
        orderBy("message", "asc"),  
        orderBy("timestamp", "desc"),
        orderBy("__name__", "desc") 
      );

      const querySnapshot = await getDocs(messagesQuery);
      console.log("Searching messages with keyword:", keyword);

      if (querySnapshot.empty) {
        console.log("No matching documents.");
        return [];
      }

      // querySnapshot.forEach((doc) => {
      //   console.log(doc.id, " => ", doc.data());
      // });

      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  };


  useEffect(() => {
    fetchChats(true);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      //no query given
      if (!searchTerm.trim() && !searchMessage.trim()) {
        setFilteredChats(chats);
        return;
      }
     let filteredChatsByName = chats;
    let filteredChatsByMessage = [];

      // if (searchTerm.trim()) {
      //   // Filter by sender/receiver name
      //   filteredChatsByName = chats.filter(
      //     (chat) =>
      //       chat.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //       chat.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
      //   );
      //   console.log("inside filter names: ", filteredChatsByName.length);
      // }
      // if (!searchTerm.trim()) {
      //   filteredChatsByName = []
      // }
  
      if (searchMessage.trim()) {
        const messageResults = await searchMessages(searchMessage);
        console.log(messageResults);
        filteredChatsByMessage = chats.filter((chat) =>
          messageResults.some(
            (msg) =>
              //console.log(msg)
              (msg.senderId === chat.senderId && msg.receiverId === chat.receiverId) ||
              (msg.senderId === chat.receiverId && msg.receiverId === chat.senderId) // If receiver and sender are swapped
          ));
        //filteredChatsByMessage = messageResults;
        console.log("inside filter messages : ", filteredChatsByMessage.length);
      }

      const nameFilteredChats = chats.filter(
        (chat) =>
          chat.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // const messageResults = await searchMessages(searchMessage);
      // console.log(messageResults.length);

      // const messageFilteredChats = chats.filter((chat) =>
      //   messageResults.some((msg) => msg.chatId === chat.chatId)
      // );

      console.log("filter messages : ", filteredChatsByMessage.length, "filtered names - ", filteredChatsByName.length);

      const combinedFilteredChats = [
        ...new Map(
          [...filteredChatsByName, ...filteredChatsByMessage].map((chat) => [
            chat.chatId,
            chat,
          ])
        ).values(),
      ];
      console.log(`combined Filtered chats - ${combinedFilteredChats.length}`);
      setFilteredChats(combinedFilteredChats);
      console.log(`Filtered chats - ${filteredChats.length}`);
      console.log(`Filtered chats - ${filteredChats}`);
    };

    performSearch();
  }, [searchTerm, searchMessage, chats]);

  return (
    <>
      <div className={`p-2 text-light ${style.Sheading}`}>
        <h2 className={style.Heading}>User Chats</h2>
      </div>

      <div className={`p-3 ${style.searchBar}`}>
        <input
          type="text"
          placeholder="Search by sender/ receiver"
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

      {filteredChats.length > 0 ? (
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
              <div key={chat.chatId} className={style.Content}>
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
                    className="col d-flex align-items-center justify-content-center"
                  >
                    {chat.lastMessage || "N/A"}
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
