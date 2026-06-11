import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import style from "./ui.module.css";
import { selectAdmin, selecteUsers } from "../../Store/authSlice";
import {
  getAdminBearerToken,
  getAdminProfileTargetId,
  getAdminRoleLabel,
  getAdminRole,
  isSecondaryAdmin,
  PRIMARY_SUPPORT_ADMIN_ID,
  resolveAdminProfileUser,
} from "../../utils/adminProfile";

const serverURL = process.env.REACT_APP_SERVER_URL;

const SOCIAL_LINKS = [
  { key: "Facebook", icon: "bi bi-facebook", color: "#1877f2" },
  { key: "Instagram", icon: "bi bi-instagram", color: "#e1306c" },
  { key: "LinkedIn", icon: "bi bi-linkedin", color: "#0077b5" },
  { key: "Skype", icon: "bi bi-skype", color: "#00aff0" },
  { key: "Telegram", icon: "bi bi-telegram", color: "#2ca5e0" },
];

async function fetchUserById(userId) {
  const res = await axios.get(
    `${serverURL}/api/users/get_all_users?ids=${encodeURIComponent(userId)}`,
  );
  return res.data?.users?.[0] || null;
}

export function AdminDetailpage() {
  const adminAuth = useSelector(selectAdmin);
  const storeUsers = useSelector(selecteUsers);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = getAdminRole(adminAuth, user);
  const roleLabel = getAdminRoleLabel(role);
  const profileId = getAdminProfileTargetId(adminAuth, user) || user?._id;

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      const resolved = resolveAdminProfileUser(adminAuth, storeUsers);
      if (resolved) {
        if (!cancelled) {
          setUser(resolved);
          setLoading(false);
        }
        return;
      }

      const targetId = getAdminProfileTargetId(adminAuth);
      const idsToTry = [
        targetId,
        !isSecondaryAdmin(adminAuth) ? PRIMARY_SUPPORT_ADMIN_ID : null,
      ].filter(Boolean);

      for (const id of idsToTry) {
        try {
          const fetched = await fetchUserById(id);
          if (fetched) {
            if (!cancelled) {
              setUser(fetched);
              setLoading(false);
            }
            return;
          }
        } catch {
          /* try next id */
        }
      }

      const token = getAdminBearerToken(adminAuth);
      if (token) {
        try {
          const res = await axios.get(`${serverURL}/api/admin/profile`, {
            headers: { authorization: `Bearer ${token}` },
          });
          const fromApi =
            res.data?.mongoUser || res.data?.admin?.mongoProfile || null;
          if (!cancelled && fromApi) {
            setUser(fromApi);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [adminAuth, storeUsers]);

  if (loading) {
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

  if (!user) {
    return (
      <div className={style.adpPage}>
        <div className={style.adpCover}>
          <div className={style.adpCoverOverlay} />
        </div>
        <div style={{ padding: "40px 32px", color: "#6b7280", textAlign: "center" }}>
          Profile not found for this admin account.
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
      <div className={style.adpCover}>
        <div className={style.adpCoverOverlay} />
      </div>

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
          {profileId && (
            <Link
              to={`/Admin/AdminDashboard/UserDetails/${profileId}/Posts`}
              className={`${style.adpActionBtn} ${style.adpActionBtnSecondary}`}
            >
              <i className="bi bi-grid" />
              Posts
            </Link>
          )}
        </div>
      </div>

      <div className={style.adpNameBlock}>
        <div className={style.adpName}>{fullName || user.email || "Admin"}</div>
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

      <div className={style.adpGrid}>
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

        <div className={style.adpCard}>
          <div className={style.adpCardTitle}>
            <i className="bi bi-fingerprint" />
            Account Details
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
              <div className={style.adpInfoValue}>{roleLabel}</div>
            </div>
          </div>
        </div>

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

        <div className={style.adpCard}>
          <div className={style.adpCardTitle}>
            <i className="bi bi-lightning" />
            Quick Access
          </div>
          <div className={style.adpQuickGrid}>
            {profileId && (
              <Link
                to={`/Admin/AdminDashboard/UserDetails/${profileId}/Posts`}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
