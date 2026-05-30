import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import style from "./ui.module.css";
import { useSelector, useDispatch } from "react-redux";
import { selectAllPosts, updatePostStatus } from "../../Store/authSlice";
import { Loader } from "../Loader/loader";
import { DeleteModel } from "./DeleteModel";

const serverURL = process.env.REACT_APP_SERVER_URL;

function StatusBadge({ post }) {
  if (post.underApproval)
    return <span className={style.upBadgePending}>Pending</span>;
  if (post.isApproved)
    return <span className={style.upBadgeApproved}>Approved</span>;
  return <span className={style.upBadgeDisapproved}>Disapproved</span>;
}

export function UserPosts() {
  const dispatch = useDispatch();
  const storeAllPosts = useSelector(selectAllPosts);
  const { id } = useParams();
  const [loading, setloading] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(false);
  const [deleteWhatUsers, setdeleteWhatUsers] = useState("");
  const [pContent, setpContent] = useState("");
  const [deltedId, setDeletedId] = useState("");
  const toggle = () => setModal(!modal);

  useEffect(() => {
    setUserPosts(storeAllPosts.filter((p) => p.userId === id));
  }, [storeAllPosts, id]);

  const filtered = userPosts.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = (p.postContent || "").toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && p.isApproved && !p.underApproval) ||
      (statusFilter === "pending" && p.underApproval) ||
      (statusFilter === "disapproved" && !p.isApproved && !p.underApproval);
    return matchSearch && matchStatus;
  });

  async function toggleApprove(post) {
    try {
      setloading(true);
      const res = await axios.post(`${serverURL}/api/posts/${post._id}/Approve_post`, {
        appproveStatus: !post.isApproved,
      });
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

  const approvedCount = userPosts.filter((p) => p.isApproved && !p.underApproval).length;
  const pendingCount = userPosts.filter((p) => p.underApproval).length;

  return (
    <>
      <div className={style.upPage}>
        {/* Stats */}
        <div className={style.upStats}>
          <div className={style.upStat}>
            <span className={style.upStatNum}>{userPosts.length}</span>
            <span className={style.upStatLabel}>Total</span>
          </div>
          <div className={style.upStatDiv} />
          <div className={style.upStat}>
            <span className={`${style.upStatNum} ${style.upStatGreen}`}>{approvedCount}</span>
            <span className={style.upStatLabel}>Approved</span>
          </div>
          <div className={style.upStatDiv} />
          <div className={style.upStat}>
            <span className={`${style.upStatNum} ${style.upStatAmber}`}>{pendingCount}</span>
            <span className={style.upStatLabel}>Pending</span>
          </div>
          <div className={style.upStatDiv} />
          <div className={style.upStat}>
            <span className={`${style.upStatNum} ${style.upStatRed}`}>
              {userPosts.length - approvedCount - pendingCount}
            </span>
            <span className={style.upStatLabel}>Disapproved</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className={style.upToolbar}>
          <div className={style.upSearchWrap}>
            <i className={`bi bi-search ${style.upSearchIcon}`} />
            <input
              type="text"
              placeholder="Search post content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={style.upSearchInput}
            />
            {search && (
              <button className={style.upSearchClear} onClick={() => setSearch("")} type="button">
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          <div className={style.upFilters}>
            {["all", "approved", "pending", "disapproved"].map((f) => (
              <button
                key={f}
                type="button"
                className={`${style.upFilterBtn} ${statusFilter === f ? style.upFilterBtnActive : ""}`}
                onClick={() => setStatusFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <span className={style.upCount}>{filtered.length} of {userPosts.length}</span>
        </div>

        {/* Table */}
        <div className={style.upTableWrap}>
          {filtered.length > 0 ? (
            <table className={style.upTable}>
              <thead>
                <tr>
                  <th className={style.upTh} style={{ width: 36 }}>#</th>
                  <th className={style.upTh} style={{ width: 68 }}>Media</th>
                  <th className={style.upTh}>Content</th>
                  <th className={style.upTh} style={{ width: 120 }}>Date</th>
                  <th className={style.upTh} style={{ width: 120 }}>Status</th>
                  <th className={style.upTh} style={{ width: 130, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, index) => {
                  const isExpanded = expandedId === post._id;
                  return (
                    <tr key={post._id} className={style.upRow}>
                      <td className={style.upTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                        {index + 1}
                      </td>

                      {/* Media */}
                      <td className={style.upTd}>
                        {post.postMediaUrl ? (
                          <img src={post.postMediaUrl} alt="media" className={style.upThumb} />
                        ) : (
                          <span className={style.upNoMedia}>
                            <i className="bi bi-image" />
                          </span>
                        )}
                      </td>

                      {/* Content */}
                      <td className={style.upTd}>
                        <div className={style.upContentCell}>
                          <p className={isExpanded ? style.upContentFull : style.upContentClamp}>
                            {post.postContent || <span style={{ color: "#9ca3af" }}>No content</span>}
                          </p>
                          {post.postContent && post.postContent.length > 80 && (
                            <button
                              type="button"
                              className={style.upExpandBtn}
                              onClick={() => setExpandedId(isExpanded ? null : post._id)}
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className={style.upTd}>
                        <span className={style.upDate}>{formatDate(post.PostCreated)}</span>
                      </td>

                      {/* Status */}
                      <td className={style.upTd}>
                        <StatusBadge post={post} />
                      </td>

                      {/* Actions */}
                      <td className={style.upTd}>
                        <div className={style.upActions}>
                          <button
                            type="button"
                            className={post.isApproved ? style.upBtnDisapprove : style.upBtnApprove}
                            onClick={() => toggleApprove(post)}
                            title={post.isApproved ? "Disapprove" : "Approve"}
                          >
                            <i className={`bi ${post.isApproved ? "bi-x-circle" : "bi-check-circle"}`} />
                          </button>
                          <button
                            type="button"
                            className={style.upBtnDelete}
                            onClick={() => confirmDelete(post._id)}
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
            <div className={style.upEmpty}>
              <i className="bi bi-file-earmark-x" style={{ fontSize: 44, opacity: 0.2 }} />
              <p className={style.upEmptyTitle}>
                {search || statusFilter !== "all" ? "No posts match your filters." : "No posts found."}
              </p>
              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  className={style.upEmptyClear}
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteModel
        modal={modal} setModal={setModal} toggle={toggle}
        pContent={pContent} deleteWhat={deleteWhatUsers}
        deltedId={deltedId} setDeletedId={setDeletedId}
      />
      <Loader loading={loading} />
    </>
  );
}
