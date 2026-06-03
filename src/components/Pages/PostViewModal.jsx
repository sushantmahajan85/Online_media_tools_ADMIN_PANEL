import { Modal } from "reactstrap";
import style from "./ui.module.css";

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d)
    ? String(raw).slice(0, 15)
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function isVideoMedia(post) {
  if (!post?.postMediaUrl) return false;
  if (post.postMediaType?.startsWith("video")) return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(post.postMediaUrl);
}

function StatusBadge({ post }) {
  if (post.underApproval)
    return <span className={style.pstBadgePending}>Pending</span>;
  if (post.isApproved)
    return <span className={style.pstBadgeApproved}>Approved</span>;
  return <span className={style.pstBadgeDisapproved}>Disapproved</span>;
}

export function PostViewModal({ isOpen, post, onClose }) {
  const toggle = () => onClose();

  return (
    <Modal centered zIndex={105000} isOpen={isOpen && !!post} toggle={toggle} size="lg">
      {post && (
        <div className={style.pvModal}>
          <div className={style.pvHeader}>
            <div className={style.pvHeaderLeft}>
              <div className={style.pvHeaderIcon}>
                <i className="bi bi-file-earmark-text" />
              </div>
              <div>
                <h2 className={style.pvHeaderTitle}>Post details</h2>
                <p className={style.pvHeaderSub}>
                  {post.userName || "Unknown author"} · {formatDate(post.PostCreated)}
                </p>
              </div>
            </div>
            <button className={style.epCloseBtn} onClick={toggle} type="button" aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className={style.pvBody}>
            {post.postMediaUrl && (
              <div className={style.pvMediaWrap}>
                {isVideoMedia(post) ? (
                  <video
                    src={post.postMediaUrl}
                    className={style.pvMedia}
                    controls
                    playsInline
                  />
                ) : (
                  <img src={post.postMediaUrl} alt="Post media" className={style.pvMedia} />
                )}
              </div>
            )}

            <div className={style.pvMeta}>
              <StatusBadge post={post} />
              {post.isPinned && (
                <span className={style.pvMetaChip}>
                  <i className="bi bi-pin-fill" /> Pinned
                </span>
              )}
              {post.tag && (
                <span className={style.pvMetaChip}>{post.tag}</span>
              )}
            </div>

            <div className={style.pvContentBlock}>
              <h3 className={style.pvContentLabel}>Content</h3>
              <p className={style.pvContentText}>
                {post.postContent || (
                  <span className={style.pvContentEmpty}>No content</span>
                )}
              </p>
            </div>

            {post.postDescription && (
              <div className={style.pvContentBlock}>
                <h3 className={style.pvContentLabel}>Description</h3>
                <p className={style.pvContentText}>{post.postDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
