import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import style from "./ui.module.css";
import { useSelector } from "react-redux";
import { selecteUsers } from "../../Store/authSlice";

const ADMIN_ID = "658c582ff1bc8978d2300823";

const SOCIAL_LINKS = [
  { key: "Facebook", icon: "bi bi-facebook", color: "#1877f2" },
  { key: "Instagram", icon: "bi bi-instagram", color: "#e1306c" },
  { key: "LinkedIn", icon: "bi bi-linkedin", color: "#0077b5" },
  { key: "Skype", icon: "bi bi-skype", color: "#00aff0" },
  { key: "Telegram", icon: "bi bi-telegram", color: "#2ca5e0" },
];

export function AdminDetailpage() {
  const storeUser = useSelector(selecteUsers);
  const [user, setUsers] = useState(null);

  useEffect(() => {
    const found = storeUser.find((u) => u._id === ADMIN_ID);
    setUsers(found || null);
  }, [storeUser]);

  if (!user) {
    return (
      <div className={style.adpPage}>
        <div className={style.adpCover}>
          <div className={style.adpCoverOverlay} />
        </div>
        <div style={{ padding: "40px 32px", color: "#6b7280", textAlign: "center" }}>
          Loading profile…
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const initials = fullName
    ? fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  const activeSocials = SOCIAL_LINKS.filter((s) => user[s.key]);

  return (
    <div className={style.adpPage}>
      {/* Cover */}
      <div className={style.adpCover}>
        <div className={style.adpCoverOverlay} />
      </div>

      {/* Avatar + Actions row */}
      <div className={style.adpProfileRow}>
        <div className={style.adpAvatarWrap}>
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="profile"
              className={style.adpAvatar}
            />
          ) : (
            <div className={style.adpAvatarFallback}>{initials}</div>
          )}
          <div
            className={
              user.isverified ? style.adpVerifiedBadge : style.adpUnverifiedBadge
            }
          >
            <i className={user.isverified ? "bi bi-check" : "bi bi-exclamation"} />
          </div>
        </div>

        <div className={style.adpProfileActions}>
          <Link
            to={`/Admin/AdminDashboard/UserDetails/${ADMIN_ID}/UserChats`}
            className={`${style.adpActionBtn} ${style.adpActionBtnPrimary}`}
          >
            <i className="bi bi-chat-dots" />
            Chats
          </Link>
          <Link
            to={`/Admin/AdminDashboard/UserDetails/${ADMIN_ID}/Posts`}
            className={`${style.adpActionBtn} ${style.adpActionBtnSecondary}`}
          >
            <i className="bi bi-grid" />
            Posts
          </Link>
        </div>
      </div>

      {/* Name + Designation */}
      <div className={style.adpNameBlock}>
        <div className={style.adpName}>{fullName || "Unknown Admin"}</div>
        {user.Designation && (
          <div className={style.adpDesignation}>
            <i className="bi bi-briefcase" />
            {user.Designation}
          </div>
        )}
        {user.AboutMe && (
          <p className={style.adpAbout}>{user.AboutMe}</p>
        )}
      </div>

      {/* Info Grid */}
      <div className={style.adpGrid}>

        {/* Contact Info */}
        <div className={style.adpCard}>
          <div className={style.adpCardTitle}>
            <i className="bi bi-person-lines-fill" />
            Contact Information
          </div>

          {user.email && (
            <div className={style.adpInfoRow}>
              <div className={style.adpInfoIcon}>
                <i className="bi bi-envelope" />
              </div>
              <div>
                <div className={style.adpInfoLabel}>Email</div>
                <div className={style.adpInfoValue}>{user.email}</div>
              </div>
            </div>
          )}

          {user.mobileNumber && (
            <div className={style.adpInfoRow}>
              <div className={style.adpInfoIcon}>
                <i className="bi bi-phone" />
              </div>
              <div>
                <div className={style.adpInfoLabel}>Mobile</div>
                <div className={style.adpInfoValue}>{user.mobileNumber}</div>
              </div>
            </div>
          )}

          <div className={style.adpInfoRow}>
            <div className={style.adpInfoIcon}>
              <i className="bi bi-shield-check" />
            </div>
            <div>
              <div className={style.adpInfoLabel}>Account Status</div>
              <div>
                {user.isverified ? (
                  <span className={style.adpStatusVerified}>
                    <i className="bi bi-check-circle-fill" />
                    Verified
                  </span>
                ) : (
                  <span className={style.adpStatusUnverified}>
                    <i className="bi bi-exclamation-circle-fill" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className={style.adpCard}>
          <div className={style.adpCardTitle}>
            <i className="bi bi-fingerprint" />
            Account Details
          </div>

          <div className={style.adpInfoRow}>
            <div className={style.adpInfoIcon}>
              <i className="bi bi-hash" />
            </div>
            <div>
              <div className={style.adpInfoLabel}>User ID</div>
              <div className={style.adpIdBadge}>{user._id}</div>
            </div>
          </div>

          {user.Designation && (
            <div className={style.adpInfoRow}>
              <div className={style.adpInfoIcon}>
                <i className="bi bi-briefcase" />
              </div>
              <div>
                <div className={style.adpInfoLabel}>Designation</div>
                <div className={style.adpInfoValue}>{user.Designation}</div>
              </div>
            </div>
          )}

          <div className={style.adpInfoRow}>
            <div className={style.adpInfoIcon}>
              <i className="bi bi-person-badge" />
            </div>
            <div>
              <div className={style.adpInfoLabel}>Role</div>
              <div className={style.adpInfoValue}>Administrator</div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {activeSocials.length > 0 && (
          <div className={style.adpCard}>
            <div className={style.adpCardTitle}>
              <i className="bi bi-share" />
              Social Links
            </div>
            <div className={style.adpSocialGrid}>
              {activeSocials.map(({ key, icon, color }) => (
                <a
                  key={key}
                  href={user[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={style.adpSocialItem}
                >
                  <i className={`${icon} ${style.adpSocialIcon}`} style={{ color }} />
                  {key}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={style.adpCard}>
          <div className={style.adpCardTitle}>
            <i className="bi bi-lightning" />
            Quick Access
          </div>
          <div className={style.adpQuickGrid}>
            <Link
              to={`/Admin/AdminDashboard/UserDetails/${ADMIN_ID}/UserChats`}
              className={style.adpQuickCard}
            >
              <div className={`${style.adpQuickIcon} ${style.adpQuickIconBlue}`}>
                <i className="bi bi-chat-dots-fill" />
              </div>
              <div>
                <div>Chats</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginTop: 2 }}>
                  View all chats
                </div>
              </div>
            </Link>
            <Link
              to={`/Admin/AdminDashboard/UserDetails/${ADMIN_ID}/Posts`}
              className={style.adpQuickCard}
            >
              <div className={`${style.adpQuickIcon} ${style.adpQuickIconPurple}`}>
                <i className="bi bi-grid-3x3-gap-fill" />
              </div>
              <div>
                <div>Posts</div>
                <div style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginTop: 2 }}>
                  View all posts
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
