import React, { useState } from "react";
import style from "./ui.module.css";
import { useSelector } from "react-redux";
import { selectAllPinnedPosts } from "../../Store/authSlice";
import { DeleteModel } from "./DeleteModel";

export function PinnedPost() {
    const StorePinnedPosts = useSelector(selectAllPinnedPosts);
    const [modal, setModal] = useState(false);
    const [deltedId, setDeletedId] = useState("");
    const [deleteWhatUsers, setdeleteWhatUsers] = useState("");
    const [pContent, setpContent] = useState("");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);

    const toggle = () => setModal(!modal);

    const filtered = (StorePinnedPosts || []).filter((p) => {
        const q = search.toLowerCase();
        return (
            (p.postContent || "").toLowerCase().includes(q) ||
            (p.userName || "").toLowerCase().includes(q)
        );
    });

    function formatDate(raw) {
        if (!raw) return "—";
        const d = new Date(raw);
        if (isNaN(d)) return raw.slice(0, 15);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function confirmDelete(id) {
        setDeletedId(id);
        setdeleteWhatUsers("BumperPost");
        setpContent("Are you sure you want to delete this Pinned Post? This action cannot be undone.");
        setModal(true);
    }

    return (
        <>
            <div className={style.ppPage}>
                {/* Toolbar */}
                <div className={style.ppToolbar}>
                    <div className={style.ppToolbarLeft}>
                        <div className={style.ppSearchWrap}>
                            <i className={`bi bi-search ${style.ppSearchIcon}`} />
                            <input
                                type="text"
                                placeholder="Search content or author…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={style.ppSearchInput}
                            />
                            {search && (
                                <button
                                    className={style.ppSearchClear}
                                    onClick={() => setSearch("")}
                                    type="button"
                                >
                                    <i className="bi bi-x" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={style.ppToolbarRight}>
                        <span className={style.ppCountBadge}>
                            <i className="bi bi-pin-angle-fill" />
                            {filtered.length} pinned {filtered.length === 1 ? "post" : "posts"}
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className={style.ppTableWrap}>
                    {filtered.length > 0 ? (
                        <table className={style.ppTable}>
                            <thead>
                                <tr>
                                    <th className={style.ppTh} style={{ width: 36 }}>#</th>
                                    <th className={style.ppTh} style={{ width: 80 }}>Media</th>
                                    <th className={style.ppTh}>Content</th>
                                    <th className={style.ppTh} style={{ width: 160 }}>Posted By</th>
                                    <th className={style.ppTh} style={{ width: 130 }}>Date</th>
                                    <th className={style.ppTh} style={{ width: 90, textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((pst, index) => {
                                    const isExpanded = expandedId === pst._id;
                                    return (
                                        <tr key={pst._id} className={style.ppRow}>
                                            <td className={style.ppTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                                                {index + 1}
                                            </td>

                                            {/* Media */}
                                            <td className={style.ppTd}>
                                                {pst.postMediaUrl ? (
                                                    <img
                                                        src={pst.postMediaUrl}
                                                        alt="media"
                                                        className={style.ppThumb}
                                                    />
                                                ) : (
                                                    <span className={style.ppNoMedia}>
                                                        <i className="bi bi-image" />
                                                    </span>
                                                )}
                                            </td>

                                            {/* Content */}
                                            <td className={style.ppTd}>
                                                <div className={style.ppContentCell}>
                                                    <p className={isExpanded ? style.ppContentFull : style.ppContentClamp}>
                                                        {pst.postContent || <span style={{ color: "#9ca3af" }}>No content</span>}
                                                    </p>
                                                    {pst.postContent && pst.postContent.length > 80 && (
                                                        <button
                                                            className={style.ppExpandBtn}
                                                            onClick={() => setExpandedId(isExpanded ? null : pst._id)}
                                                            type="button"
                                                        >
                                                            {isExpanded ? "Show less" : "Show more"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Author */}
                                            <td className={style.ppTd}>
                                                <div className={style.ppAuthorCell}>
                                                    <div className={style.ppAuthorAvatar}>
                                                        {(pst.userName || "?")[0].toUpperCase()}
                                                    </div>
                                                    <span className={style.ppAuthorName}>{pst.userName || "—"}</span>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className={style.ppTd}>
                                                <span className={style.ppDate}>{formatDate(pst.PostCreated)}</span>
                                            </td>

                                            {/* Action */}
                                            <td className={style.ppTd} style={{ textAlign: "center" }}>
                                                <button
                                                    className={style.ppDeleteBtn}
                                                    onClick={() => confirmDelete(pst._id)}
                                                    type="button"
                                                    title="Remove pin"
                                                >
                                                    <i className="bi bi-trash3" />
                                                    Unpin
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className={style.ppEmpty}>
                            <i className="bi bi-pin-angle" style={{ fontSize: 44, opacity: 0.2 }} />
                            <p className={style.ppEmptyTitle}>
                                {search ? "No posts match your search." : "No pinned posts yet."}
                            </p>
                            {search && (
                                <button
                                    className={style.ppEmptyClear}
                                    onClick={() => setSearch("")}
                                    type="button"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <DeleteModel
                modal={modal}
                setModal={setModal}
                toggle={toggle}
                pContent={pContent}
                deleteWhat={deleteWhatUsers}
                deltedId={deltedId}
                setDeletedId={setDeletedId}
            />
        </>
    );
}
