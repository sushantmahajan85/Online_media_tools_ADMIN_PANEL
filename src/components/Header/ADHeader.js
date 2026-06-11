import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectAdmin, selecteUsers } from "../../Store/authSlice";
import { toast } from "react-toastify";
import style from "./header.module.css";
import { useAdminMongoProfile } from "../../hooks/useAdminMongoProfile";
import {
  resolveAdminProfileUser,
  SECONDARY_ADMIN_HOME_PATH,
} from "../../utils/adminProfile";

function resolvePageInfo(pathname, storeUsers) {
  const path = pathname.replace(/^\/Admin/, "");

  const getUserName = (id) => {
    if (!id) return null;
    const u = storeUsers.find((usr) => usr._id === id);
    return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : null;
  };

  const chatMatch = path.match(/\/AdminDashboard\/UserDetails\/([^/]+)\/UserChats\/[^/]+\/Chat/);
  if (chatMatch) {
    const name = getUserName(chatMatch[1]);
    return {
      title: "Chat",
      crumbs: [
        { label: "Users", to: "/Admin/AdminDashboard/Users" },
        name && { label: name, to: `/Admin/AdminDashboard/UserDetails/${chatMatch[1]}` },
        { label: "Chats", to: `/Admin/AdminDashboard/UserDetails/${chatMatch[1]}/UserChats` },
        { label: "Chat" },
      ].filter(Boolean),
    };
  }

  const allChatMatch = path.match(/\/AdminDashboard\/Chats\/([^/]+)$/);
  if (allChatMatch) {
    return {
      title: "Chat",
      crumbs: [
        { label: "All Chats", to: "/Admin/AdminDashboard/Chats" },
        { label: "Conversation" },
      ],
    };
  }

  const adminChatMatch = path.match(/\/AdminDashboard\/AdminChats\/([^/]+)$/);
  if (adminChatMatch) {
    return {
      title: "Admin Chat",
      crumbs: [
        { label: "Admin Chats", to: "/Admin/AdminDashboard/AdminChats" },
        { label: "Conversation" },
      ],
    };
  }

  const userChatsMatch = path.match(/\/AdminDashboard\/UserDetails\/([^/]+)\/UserChats/);
  if (userChatsMatch) {
    const name = getUserName(userChatsMatch[1]);
    return {
      title: name ? `${name}'s Chats` : "User Chats",
      crumbs: [
        { label: "Users", to: "/Admin/AdminDashboard/Users" },
        name && { label: name, to: `/Admin/AdminDashboard/UserDetails/${userChatsMatch[1]}` },
        { label: "Chats" },
      ].filter(Boolean),
    };
  }

  const userPostsMatch = path.match(/\/AdminDashboard\/UserDetails\/([^/]+)\/Posts/);
  if (userPostsMatch) {
    const name = getUserName(userPostsMatch[1]);
    return {
      title: name ? `${name}'s Posts` : "User Posts",
      crumbs: [
        { label: "Users", to: "/Admin/AdminDashboard/Users" },
        name && { label: name, to: `/Admin/AdminDashboard/UserDetails/${userPostsMatch[1]}` },
        { label: "Posts" },
      ].filter(Boolean),
    };
  }

  const userDetailMatch = path.match(/\/AdminDashboard\/UserDetails\/([^/]+)$/);
  if (userDetailMatch) {
    const name = getUserName(userDetailMatch[1]);
    return {
      title: name || "User Details",
      crumbs: [
        { label: "Users", to: "/Admin/AdminDashboard/Users" },
        { label: name || "User Details" },
      ],
    };
  }

  const STATIC = {
    "/AdminDashboard/Profile": { title: "Admin Profile", crumbs: [{ label: "Profile" }] },
    "/AdminDashboard/starter": { title: "Dashboard", crumbs: [{ label: "Dashboard" }] },
    "/AdminDashboard/Users": { title: "Users", crumbs: [{ label: "Users" }] },
    "/AdminDashboard/Posts": { title: "Posts", crumbs: [{ label: "Posts" }] },
    "/AdminDashboard/Chats": { title: "All Chats", crumbs: [{ label: "Chats" }] },
    "/AdminDashboard/AdminChats": {
      title: "Admin Chats",
      crumbs: [{ label: "Admin Chats" }],
    },
    "/AdminDashboard/BumperPost": { title: "Pinned Posts", crumbs: [{ label: "Pinned Posts" }] },
    "/AdminDashboard/ReportRequests": { title: "Report Requests", crumbs: [{ label: "Reported" }] },
    "/AdminDashboard/sendnotification": { title: "Send Notification", crumbs: [{ label: "Notification" }] },
    "/AdminDashboard/addPartner": { title: "Partners", crumbs: [{ label: "Partner" }] },
  };

  for (const [key, val] of Object.entries(STATIC)) {
    if (path === key || path.startsWith(key + "/")) return val;
  }

  return { title: "Dashboard", crumbs: [{ label: "Dashboard" }] };
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const adminAuth = useSelector(selectAdmin);
  const storeUsers = useSelector(selecteUsers);
  const { profileUser, roleLabel, canAccessAdminChats } = useAdminMongoProfile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const adminUser = profileUser || resolveAdminProfileUser(adminAuth, storeUsers) || adminAuth || {};
  const { title, crumbs } = resolvePageInfo(location.pathname, storeUsers);

  const fullName = adminUser.firstName
    ? `${adminUser.firstName} ${adminUser.lastName || ""}`.trim()
    : adminUser.adminemail || adminUser.email || "Admin";
  const avatarUrl = adminUser.profileImageUrl || null;
  const email = adminUser.email || adminUser.adminemail || "";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showMobilemenu = () => {
    document.getElementById("sidebarArea").classList.toggle("showSidebar");
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("OMB_ADMIN_DATA");
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <header className={style.header}>
      <div className={style.headerLeft}>
        <button
          className={`${style.menuBtn} d-lg-none`}
          onClick={showMobilemenu}
          type="button"
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list" />
        </button>

        <div className={style.titleBlock}>
          <span className={style.pageTitle}>{title}</span>
          <nav className={style.breadcrumb} aria-label="breadcrumb">
            <Link
              to={canAccessAdminChats ? "/Admin/AdminDashboard/starter" : SECONDARY_ADMIN_HOME_PATH}
              className={style.breadcrumbHome}
            >
              {canAccessAdminChats ? "Dashboard" : "Chats"}
            </Link>
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <span className={style.breadcrumbSep}>
                  <i className="bi bi-chevron-right" />
                </span>
                {crumb.to ? (
                  <Link to={crumb.to} className={style.breadcrumbLink}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={style.breadcrumbCurrent}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className={style.headerRight}>
        <button className={style.iconBtn} type="button" title="Notifications">
          <i className="bi bi-bell" />
        </button>

        <div className={style.divider} />

        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            className={style.adminChip}
            onClick={() => setDropdownOpen((p) => !p)}
            type="button"
          >
            <div className={style.adminAvatar}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="admin" className={style.adminAvatarImg} />
              ) : (
                <span className={style.adminAvatarFallback}>
                  {fullName[0]?.toUpperCase() || "A"}
                </span>
              )}
            </div>
            <div className={style.adminInfo}>
              <span className={style.adminName}>{fullName}</span>
              <span className={style.adminRole}>{roleLabel}</span>
            </div>
            <i
              className={`bi bi-chevron-down ${style.chevron} ${
                dropdownOpen ? style.chevronOpen : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className={style.dropdown}>
              <div className={style.dropdownHeader}>
                <div className={style.dropdownName}>{fullName}</div>
                {email && <div className={style.dropdownEmail}>{email}</div>}
              </div>

              {canAccessAdminChats && (
                <Link
                  to="/Admin/AdminDashboard/Profile"
                  className={style.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-person-circle" />
                  My Profile
                </Link>
              )}

              <button
                className={`${style.dropdownItem} ${style.dropdownLogout}`}
                onClick={handleLogout}
                type="button"
              >
                <i className="bi bi-box-arrow-right" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
