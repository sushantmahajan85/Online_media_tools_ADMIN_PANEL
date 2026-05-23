import React, { useEffect, useState } from "react";
import style from "./ui.module.css";
import { Link, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { selecteUsers } from "../../Store/authSlice";
import { useSelector } from "react-redux";

export function UserChats() {
    const StoreAllUsers = useSelector(selecteUsers);
    const { id } = useParams();
    const [chatUsers, setChatUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "chats"));
            const myChats = [];
            querySnapshot.forEach((doc) => {
                if (doc.id.includes(id)) {
                    myChats.push({ chatId: doc.id });
                }
            });

            const chatted = myChats
                .map((chat) => {
                    const otherUserId = chat.chatId.split("_").find((uid) => uid !== id);
                    const otherUser = StoreAllUsers.find((u) => u._id === otherUserId);
                    return otherUser ? { chatId: chat.chatId, otherUser } : null;
                })
                .filter(Boolean);

            setChatUsers(chatted);
            setLoading(false);
        };
        fetchData();
    }, [id, StoreAllUsers]);

    const filtered = chatUsers.filter(({ otherUser }) => {
        const q = search.toLowerCase();
        const name = `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.toLowerCase();
        return name.includes(q) || (otherUser.email || "").toLowerCase().includes(q);
    });

    function getInitials(user) {
        const parts = [user.firstName, user.lastName].filter(Boolean);
        return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
    }

    return (
        <div className={style.uctPage}>
            <div className={style.uctToolbar}>
                <div className={style.uctSearchWrap}>
                    <i className={`bi bi-search ${style.uctSearchIcon}`} />
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={style.uctSearchInput}
                    />
                    {search && (
                        <button
                            className={style.uctSearchClear}
                            onClick={() => setSearch("")}
                            type="button"
                            aria-label="Clear"
                        >
                            <i className="bi bi-x" />
                        </button>
                    )}
                </div>
                <span className={style.uctCount}>
                    {loading ? "—" : `${filtered.length} conversation${filtered.length !== 1 ? "s" : ""}`}
                </span>
            </div>

            <div className={style.uctTableWrap}>
                <table className={style.uctTable}>
                    <thead>
                        <tr>
                            <th className={style.uctTh} style={{ width: 44 }}>#</th>
                            <th className={style.uctTh}>User</th>
                            <th className={style.uctTh}>Email</th>
                            <th className={style.uctTh} style={{ width: 110, textAlign: "center" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            [...Array(4)].map((_, i) => (
                                <tr key={i} className={style.uctSkeletonRow}>
                                    <td><div className={style.uctSkeleton} style={{ width: 20 }} /></td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className={`${style.uctSkeleton} ${style.uctSkeletonCircle}`} />
                                            <div className={style.uctSkeleton} style={{ width: 120 }} />
                                        </div>
                                    </td>
                                    <td><div className={style.uctSkeleton} style={{ width: 180 }} /></td>
                                    <td><div className={style.uctSkeleton} style={{ width: 70, margin: "0 auto" }} /></td>
                                </tr>
                            ))
                        )}

                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} className={style.uctEmptyRow}>
                                    <i className="bi bi-chat-slash" style={{ fontSize: 28, opacity: 0.3 }} />
                                    <p>{search ? "No results match your search." : "No chats found."}</p>
                                </td>
                            </tr>
                        )}

                        {!loading && filtered.map(({ chatId, otherUser }, index) => {
                            const fullName = `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim();
                            return (
                                <tr key={chatId} className={style.uctRow}>
                                    <td className={style.uctTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                                        {index + 1}
                                    </td>
                                    <td className={style.uctTd}>
                                        <div className={style.uctUserCell}>
                                            {otherUser.profileImageUrl ? (
                                                <img
                                                    src={otherUser.profileImageUrl}
                                                    alt={fullName}
                                                    className={style.uctAvatar}
                                                />
                                            ) : (
                                                <div className={style.uctAvatarFallback}>
                                                    {getInitials(otherUser)}
                                                </div>
                                            )}
                                            <span className={style.uctUserName}>{fullName || "—"}</span>
                                        </div>
                                    </td>
                                    <td className={style.uctTd}>
                                        <span className={style.uctEmail}>{otherUser.email || "—"}</span>
                                    </td>
                                    <td className={style.uctTd} style={{ textAlign: "center" }}>
                                        <Link
                                            to={`/Admin/AdminDashboard/UserDetails/${id}/UserChats/${chatId}/Chat`}
                                            className={style.uctOpenBtn}
                                        >
                                            <i className="bi bi-chat-dots-fill" />
                                            Open
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
