import React, { useEffect, useState } from "react";
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

const serverURL = process.env.REACT_APP_SERVER_URL;

function StatusBadge({ post }) {
  if (post.underApproval)
    return <span className={style.pstBadgePending}>Pending</span>;
  if (post.isApproved)
    return <span className={style.pstBadgeApproved}>Approved</span>;
  return <span className={style.pstBadgeDisapproved}>Disapproved</span>;
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
  const [TotalPinned, setTotalPinned] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const count = StorePinnedPosts.filter((p) => p.isPinnedT === true).length;
    setTotalPinned(count);
  }, [StorePinnedPosts]);

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

  async function toggleApprove(post) {
    try {
      setloading(true);
      const res = await axios.post(
        `${serverURL}/api/posts/${post._id}/Approve_post`,
        { appproveStatus: !post.isApproved }
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

  async function pinPost(post) {
    if (post.isPinned) { toast.info("Already pinned"); return; }
    try {
      setloading(true);
      const res = await axios.post(
        `${serverURL}/api/PinnedPosts/${post._id}/add_Pinned_post`,
        { TotalPinned }
      );
      if (res?.status === 200) {
        toast.success(res.data.message);
        dispatch(addPinnedPosts({ postId: post._id, NewBumperPost: res.data.newBumperpost, TotalPinned }));
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

  async function addToLinkedIn(post) {
    try {
      setloading(true);
      const res = await axios.post(`${serverURL}/api/posts/${post._id}/admin-Linkedin`);
      if (res?.status === 200) {
        toast.success(res.data.message);
        dispatch(updatePostStatus({ _id: post._id, post: res.data.post }));
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
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
                  <th className={style.pstTh} style={{ width: 36 }}>#</th>
                  <th className={style.pstTh} style={{ width: 72 }}>Media</th>
                  <th className={style.pstTh}>Content</th>
                  <th className={style.pstTh} style={{ width: 150 }}>Posted By</th>
                  <th className={style.pstTh} style={{ width: 120 }}>Date</th>
                  <th className={style.pstTh} style={{ width: 110 }}>Status</th>
                  <th className={style.pstTh} style={{ width: 220, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, index) => {
                  const isExpanded = expandedId === post._id;
                  return (
                    <tr key={post._id} className={style.pstRow}>
                      {/* # */}
                      <td className={style.pstTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                        {index + 1}
                      </td>

                      {/* Media */}
                      <td className={style.pstTd}>
                        {post.postMediaUrl ? (
                          <img src={post.postMediaUrl} alt="media" className={style.pstThumb} />
                        ) : (
                          <span className={style.pstNoMedia}>
                            <i className="bi bi-image" />
                          </span>
                        )}
                      </td>

                      {/* Content */}
                      <td className={style.pstTd}>
                        <div className={style.pstContentCell}>
                          <p className={isExpanded ? style.pstContentFull : style.pstContentClamp}>
                            {post.postContent || <span style={{ color: "#9ca3af" }}>No content</span>}
                          </p>
                          {post.postContent && post.postContent.length > 80 && (
                            <button
                              className={style.pstExpandBtn}
                              onClick={() => setExpandedId(isExpanded ? null : post._id)}
                              type="button"
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Author */}
                      <td className={style.pstTd}>
                        <div className={style.pstAuthorCell}>
                          <div className={style.pstAuthorAvatar}>
                            {(post.userName || "?")[0].toUpperCase()}
                          </div>
                          <span className={style.pstAuthorName}>{post.userName || "—"}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className={style.pstTd}>
                        <span className={style.pstDate}>{formatDate(post.PostCreated)}</span>
                      </td>

                      {/* Status */}
                      <td className={style.pstTd}>
                        <StatusBadge post={post} />
                      </td>

                      {/* Actions */}
                      <td className={style.pstTd}>
                        <div className={style.pstActions}>
                          {/* Approve / Disapprove */}
                          <button
                            className={post.isApproved ? style.pstBtnDisapprove : style.pstBtnApprove}
                            onClick={() => toggleApprove(post)}
                            type="button"
                            title={post.isApproved ? "Disapprove" : "Approve"}
                          >
                            <i className={`bi ${post.isApproved ? "bi-x-circle" : "bi-check-circle"}`} />
                          </button>

                          {/* Pin */}
                          <button
                            className={post.isPinned ? style.pstBtnPinned : style.pstBtnPin}
                            onClick={() => pinPost(post)}
                            type="button"
                            title={post.isPinned ? "Already pinned" : "Pin post"}
                          >
                            <i className={`bi ${post.isPinned ? "bi-pin-fill" : "bi-pin"}`} />
                          </button>

                          {/* Edit */}
                          <button
                            className={style.pstBtnIcon}
                            onClick={() => { setmodalEdit(true); setpostData(post); }}
                            type="button"
                            title="Edit post"
                          >
                            <i className="bi bi-pencil" />
                          </button>

                          {/* LinkedIn */}
                          <button
                            className={post.addedToAdminLinkedin ? style.pstBtnLinkedInDone : style.pstBtnLinkedIn}
                            onClick={() => addToLinkedIn(post)}
                            type="button"
                            title={post.addedToAdminLinkedin ? "On LinkedIn" : "Add to LinkedIn"}
                          >
                            <i className="bi bi-linkedin" />
                          </button>

                          {/* Delete */}
                          <button
                            className={style.pstBtnDelete}
                            onClick={() => confirmDelete(post._id)}
                            type="button"
                            title="Delete post"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
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
      <Loader loading={loading} />
    </>
  );
}
