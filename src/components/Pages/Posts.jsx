import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import style from "./ui.module.css";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader/loader";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAllPosts,
  updatePostStatus,
  addPinnedPosts,
  selectAllPinnedPosts,
} from "../../Store/authSlice";
import { DeleteModel } from "./DeleteModel";
import { EditPost } from "./EditPost";
import { PostViewModal } from "./PostViewModal";

const serverURL = process.env.REACT_APP_SERVER_URL;
const MAX_PINNED_POSTS = 10;

function StatusBadge({ post }) {
  if (post.underApproval)
    return <span className={style.pstBadgePending}>Pending</span>;
  if (post.isApproved)
    return <span className={style.pstBadgeApproved}>Approved</span>;
  return <span className={style.pstBadgeDisapproved}>Disapproved</span>;
}

function PostActionsMenu({
  post,
  isOpen,
  onToggle,
  onClose,
  pinLimitReached,
  onApprove,
  onDisapprove,
  onPin,
  onEdit,
  onLinkedIn,
  onDelete,
}) {
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const isApproved = post.isApproved && !post.underApproval;
  const isDisapproved = !post.isApproved && !post.underApproval;
  const pinDisabled = post.isPinned || pinLimitReached;
  const pinLabel = post.isPinned
    ? "Already pinned"
    : pinLimitReached
      ? "Pin limit reached"
      : "Pin post";

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 196;
    const menuHeight = menuRef.current?.offsetHeight || 248;
    const gap = 6;
    const padding = 8;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight - padding) {
      top = Math.max(padding, rect.top - menuHeight - gap);
    }
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setMenuStyle({ top, left, width: menuWidth });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return undefined;
    }

    updateMenuPosition();
    const raf = window.requestAnimationFrame(() => {
      if (menuRef.current) updateMenuPosition();
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);

    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (e) => {
      const target = e.target;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  const run = (action) => {
    action();
    onClose();
  };

  const items = [
    {
      key: "approve",
      label: "Approve",
      icon: "bi-check-circle",
      tone: "approve",
      disabled: isApproved,
      onClick: () => run(() => onApprove(post, true)),
    },
    {
      key: "disapprove",
      label: "Disapprove",
      icon: "bi-x-circle",
      tone: "disapprove",
      disabled: isDisapproved,
      onClick: () => run(() => onDisapprove(post, false)),
    },
    {
      key: "pin",
      label: pinLabel,
      icon: post.isPinned ? "bi-pin-fill" : "bi-pin",
      tone: "pin",
      disabled: pinDisabled,
      onClick: () => run(() => onPin(post)),
    },
    {
      key: "edit",
      label: "Edit post",
      icon: "bi-pencil",
      tone: "default",
      onClick: () => run(() => onEdit(post)),
    },
    {
      key: "linkedin",
      label: post.addedToAdminLinkedin ? "Shared on LinkedIn" : "Share on LinkedIn",
      icon: "bi-linkedin",
      tone: "linkedin",
      disabled: post.addedToAdminLinkedin,
      onClick: () => run(() => onLinkedIn(post)),
    },
    {
      key: "delete",
      label: "Delete post",
      icon: "bi-trash3",
      tone: "delete",
      onClick: () => run(() => onDelete(post._id)),
    },
  ];

  const toneClass = {
    approve: style.pstMenuItemApprove,
    disapprove: style.pstMenuItemDisapprove,
    pin: style.pstMenuItemPin,
    default: "",
    linkedin: style.pstMenuItemLinkedin,
    delete: style.pstMenuItemDelete,
  };

  const menuPortal =
    isOpen &&
    menuStyle &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        className={style.pstMenuDropdown}
        role="menu"
        style={{
          top: menuStyle.top,
          left: menuStyle.left,
          width: menuStyle.width,
        }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={`${style.pstMenuItem} ${toneClass[item.tone] || ""}`}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            <i className={`bi ${item.icon} ${style.pstMenuItemIcon}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>,
      document.body
    );

  return (
    <div className={style.pstActionsMenu}>
      <button
        ref={triggerRef}
        type="button"
        className={`${style.pstMenuTrigger} ${isOpen ? style.pstMenuTriggerActive : ""}`}
        onClick={onToggle}
        aria-label="Post actions"
        aria-expanded={isOpen}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>
      {menuPortal}
    </div>
  );
}

export function Posts() {
  const dispatch = useDispatch();
  const StorePosts = useSelector(selectAllPosts);
  const StorePinnedPosts = useSelector(selectAllPinnedPosts);
  const [loading, setloading] = useState(false);
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  const [deltedId, setDeletedId] = useState("");
  const [deleteWhatUsers, setdeleteWhatUsers] = useState("");
  const [pContent, setpContent] = useState("");
  const [modalEdit, setmodalEdit] = useState(false);
  const [postData, setpostData] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewPost, setViewPost] = useState(null);
  const [modalView, setModalView] = useState(false);
  const [openActionsId, setOpenActionsId] = useState(null);

  function openPostView(post) {
    setViewPost(post);
    setModalView(true);
  }

  function closePostView() {
    setModalView(false);
    setViewPost(null);
  }

  const pinnedCount = (StorePinnedPosts || []).length;
  const pinLimitReached = pinnedCount >= MAX_PINNED_POSTS;

  const filtered = (StorePosts || []).filter((post) => {
    const q = search.toLowerCase();
    const matchSearch =
      (post.postContent || "").toLowerCase().includes(q) ||
      (post.userName || "").toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && post.underApproval) ||
      (statusFilter === "approved" && post.isApproved && !post.underApproval) ||
      (statusFilter === "disapproved" && !post.isApproved && !post.underApproval);
    return matchSearch && matchStatus;
  });

  async function updateApproveStatus(post, appproveStatus) {
    const isApproved = post.isApproved && !post.underApproval;
    const isDisapproved = !post.isApproved && !post.underApproval;
    if (appproveStatus && isApproved) return;
    if (!appproveStatus && isDisapproved) return;

    try {
      setloading(true);
      const res = await axios.post(
        `${serverURL}/api/posts/${post._id}/Approve_post`,
        { appproveStatus }
      );
      if (res?.status === 200) {
        toast.success(res.data.message);
        dispatch(updatePostStatus({ _id: post._id, post: res.data.post }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setloading(false);
    }
  }

  function handlePinClick(post) {
    if (post.isPinned) {
      toast.info("Already pinned");
      return;
    }
    if (pinLimitReached) {
      toast.warning(`You can only pin up to ${MAX_PINNED_POSTS} posts. Unpin a post first.`);
      return;
    }
    pinPost(post);
  }

  async function pinPost(post) {
    try {
      setloading(true);
      const res = await axios.post(
        `${serverURL}/api/PinnedPosts/${post._id}/add_Pinned_post`
      );
      if (res?.status === 200) {
        toast.success(res.data.message);
        dispatch(addPinnedPosts({ postId: post._id, NewBumperPost: res.data.newBumperpost }));
        window.location.reload();
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 409) toast.warning(err.response.data.message);
      else toast.error(err?.response?.data?.message || "Failed to pin post");
    } finally {
      setloading(false);
    }
  }

  function handleLinkedInClick(post) {
    if (post.addedToAdminLinkedin) {
      toast.warning("This post is already shared on LinkedIn.");
      return;
    }
    addToLinkedIn(post);
  }

  async function addToLinkedIn(post) {
    try {
      setloading(true);
      const res = await axios.post(`${serverURL}/api/posts/${post._id}/admin-Linkedin`);
      if (res?.status === 200) {
        if (res.data.post) {
          dispatch(updatePostStatus({ _id: post._id, post: res.data.post }));
        }
        const message = res.data.message || "";
        if (message.toLowerCase().includes("already")) {
          toast.warning(message);
        } else {
          toast.success(message);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add to LinkedIn");
    } finally {
      setloading(false);
    }
  }

  function confirmDelete(id) {
    setDeletedId(id);
    setdeleteWhatUsers("Post");
    setpContent("Are you sure you want to delete this post? This action cannot be undone.");
    setModal(true);
  }

  function formatDate(raw) {
    if (!raw) return "—";
    const d = new Date(raw);
    return isNaN(d)
      ? raw.slice(0, 15)
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  }

  const approvedCount = (StorePosts || []).filter((p) => p.isApproved && !p.underApproval).length;
  const pendingCount = (StorePosts || []).filter((p) => p.underApproval).length;

  return (
    <>
      <div className={style.pstPage}>

        {/* Stats row */}
        <div className={style.pstStats}>
          <div className={style.pstStat}>
            <span className={style.pstStatNum}>{StorePosts.length}</span>
            <span className={style.pstStatLabel}>Total</span>
          </div>
          <div className={style.pstStatDiv} />
          <div className={style.pstStat}>
            <span className={`${style.pstStatNum} ${style.pstStatGreen}`}>{approvedCount}</span>
            <span className={style.pstStatLabel}>Approved</span>
          </div>
          <div className={style.pstStatDiv} />
          <div className={style.pstStat}>
            <span className={`${style.pstStatNum} ${style.pstStatAmber}`}>{pendingCount}</span>
            <span className={style.pstStatLabel}>Pending</span>
          </div>
          <div className={style.pstStatDiv} />
          <div className={style.pstStat}>
            <span className={`${style.pstStatNum} ${style.pstStatPurple}`}>{StorePinnedPosts.length}</span>
            <span className={style.pstStatLabel}>Pinned</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className={style.pstToolbar}>
          <div className={style.pstSearchWrap}>
            <i className={`bi bi-search ${style.pstSearchIcon}`} />
            <input
              type="text"
              placeholder="Search content or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={style.pstSearchInput}
            />
            {search && (
              <button className={style.pstSearchClear} onClick={() => setSearch("")} type="button">
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          <div className={style.pstFilters}>
            {["all", "approved", "pending", "disapproved"].map((f) => (
              <button
                key={f}
                className={`${style.pstFilterBtn} ${statusFilter === f ? style.pstFilterBtnActive : ""}`}
                onClick={() => setStatusFilter(f)}
                type="button"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <span className={style.pstCount}>
            {filtered.length} of {StorePosts.length}
          </span>
        </div>

        {/* Table */}
        <div className={style.pstTableWrap}>
          {filtered.length > 0 ? (
            <table className={style.pstTable}>
              <thead>
                <tr>
                  <th className={`${style.pstTh} ${style.pstColIndex}`}>#</th>
                  <th className={`${style.pstTh} ${style.pstColMedia}`}>Media</th>
                  <th className={`${style.pstTh} ${style.pstColContent}`}>Content</th>
                  <th className={`${style.pstTh} ${style.pstColAuthor}`}>Posted By</th>
                  <th className={`${style.pstTh} ${style.pstColDate}`}>Date</th>
                  <th className={`${style.pstTh} ${style.pstColStatus}`}>Status</th>
                  <th className={`${style.pstTh} ${style.pstColActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, index) => {
                  const showSeeMore =
                    (post.postContent && post.postContent.length > 80) || !!post.postMediaUrl;
                  return (
                    <tr key={post._id} className={style.pstRow}>
                      {/* # */}
                      <td className={style.pstTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                        {index + 1}
                      </td>

                      {/* Media */}
                      <td className={style.pstTd}>
                        {post.postMediaUrl ? (
                          <button
                            type="button"
                            className={style.pstThumbBtn}
                            onClick={() => openPostView(post)}
                            title="View post"
                          >
                            <img src={post.postMediaUrl} alt="media" className={style.pstThumb} />
                          </button>
                        ) : (
                          <span className={style.pstNoMedia}>
                            <i className="bi bi-image" />
                          </span>
                        )}
                      </td>

                      {/* Content */}
                      <td className={`${style.pstTd} ${style.pstColContent}`}>
                        <div className={style.pstContentCell}>
                          <p className={style.pstContentClamp}>
                            {post.postContent || <span style={{ color: "#9ca3af" }}>No content</span>}
                          </p>
                          {showSeeMore && (
                            <button
                              className={style.pstExpandBtn}
                              onClick={() => openPostView(post)}
                              type="button"
                            >
                              See more
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Author */}
                      <td className={`${style.pstTd} ${style.pstColAuthor}`}>
                        <div className={style.pstAuthorCell}>
                          <div className={style.pstAuthorAvatar}>
                            {(post.userName || "?")[0].toUpperCase()}
                          </div>
                          <span className={style.pstAuthorName}>{post.userName || "—"}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className={`${style.pstTd} ${style.pstColDate}`}>
                        <span className={style.pstDate}>{formatDate(post.PostCreated)}</span>
                      </td>

                      {/* Status */}
                      <td className={`${style.pstTd} ${style.pstColStatus}`}>
                        <StatusBadge post={post} />
                      </td>

                      {/* Actions */}
                      <td className={`${style.pstTd} ${style.pstTdActions} ${style.pstColActions}`}>
                        <PostActionsMenu
                          post={post}
                          isOpen={openActionsId === post._id}
                          onToggle={() =>
                            setOpenActionsId((current) =>
                              current === post._id ? null : post._id
                            )
                          }
                          onClose={() => setOpenActionsId(null)}
                          pinLimitReached={pinLimitReached}
                          onApprove={updateApproveStatus}
                          onDisapprove={updateApproveStatus}
                          onPin={handlePinClick}
                          onEdit={(selected) => {
                            setmodalEdit(true);
                            setpostData(selected);
                          }}
                          onLinkedIn={handleLinkedInClick}
                          onDelete={confirmDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={style.pstEmpty}>
              <i className="bi bi-file-earmark-x" style={{ fontSize: 44, opacity: 0.2 }} />
              <p className={style.pstEmptyTitle}>
                {search || statusFilter !== "all" ? "No posts match your filters." : "No posts found."}
              </p>
              {(search || statusFilter !== "all") && (
                <button
                  className={style.pstEmptyClear}
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  type="button"
                >
                  Clear filters
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
      <EditPost modalEdit={modalEdit} postData={postData} setmodalEdit={setmodalEdit} />
      <PostViewModal isOpen={modalView} post={viewPost} onClose={closePostView} />
      <Loader loading={loading} />
    </>
  );
}
