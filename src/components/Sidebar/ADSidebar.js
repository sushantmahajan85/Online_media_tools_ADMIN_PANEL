import { Link, useNavigate, useLocation } from "react-router-dom";
import style from "./sidebar.module.css";
import { useDispatch, useSelector } from "react-redux";
import { logout, selecteUsers } from "../../Store/authSlice";
import { toast } from "react-toastify";

const ADMIN_ID = "658c582ff1bc8978d2300823";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/Admin/AdminDashboard/starter",          icon: "bi-speedometer2",      label: "Dashboard" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/Admin/AdminDashboard/Posts",            icon: "bi-file-earmark-text", label: "Posts" },
      { to: "/Admin/AdminDashboard/BumperPost",       icon: "bi-pin-angle",         label: "Pinned Posts" },
    ],
  },
  {
    label: "Users",
    items: [
      { to: "/Admin/AdminDashboard/Users",            icon: "bi-people",            label: "Users" },
      { to: "/Admin/AdminDashboard/ReportRequests",   icon: "bi-flag",              label: "Report Requests" },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/Admin/AdminDashboard/Chats",            icon: "bi-chat-dots",         label: "All Chats" },
      { to: "/Admin/AdminDashboard/sendnotification", icon: "bi-bell",              label: "Send Notification" },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/Admin/AdminDashboard/addPartner",       icon: "bi-briefcase",         label: "Partners" },
      { to: "/Admin/AdminDashboard/Profile",          icon: "bi-person-circle",     label: "My Profile" },
    ],
  },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const storeUsers = useSelector(selecteUsers);

  const adminUser = storeUsers.find((u) => u._id === ADMIN_ID);
  const fullName = adminUser
    ? `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim()
    : "Admin";
  const avatarUrl = adminUser?.profileImageUrl;
  const initials = fullName
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "A";

  const showMobilemenu = () => {
    document.getElementById("sidebarArea").classList.toggle("showSidebar");
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("OMB_ADMIN_DATA");
    toast.success("Logged out");
    navigate("/");
  };

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className={style.sidebar}>
      {/* Logo / Brand */}
      <div className={style.brand}>
        <div className={style.brandIcon}>
          <i className="bi bi-hexagon-fill" />
        </div>
        <span className={style.brandName}>AdminPanel</span>
        <button
          className={style.backIconBtn}
          onClick={() => navigate(-1)}
          type="button"
          aria-label="Go back"
          title="Go back"
        >
          <i className="bi bi-arrow-left" />
        </button>
        <button
          className={`${style.closeBtn} d-lg-none`}
          onClick={showMobilemenu}
          type="button"
          aria-label="Close sidebar"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* Admin profile chip */}
      <Link to="/Admin/AdminDashboard/Profile" className={style.profileChip}>
        <div className={style.profileAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className={style.profileAvatarImg} />
          ) : (
            <span className={style.profileAvatarFallback}>{initials}</span>
          )}
        </div>
        <div className={style.profileInfo}>
          <span className={style.profileName}>{fullName}</span>
          <span className={style.profileRole}>Administrator</span>
        </div>
        <i className="bi bi-chevron-right" style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }} />
      </Link>

      {/* Nav */}
      <nav className={style.nav}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={style.navGroup}>
            <span className={style.navGroupLabel}>{group.label}</span>
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${style.navItem} ${isActive(item.to) ? style.navItemActive : ""}`}
              >
                <i className={`bi ${item.icon} ${style.navIcon}`} />
                <span className={style.navLabel}>{item.label}</span>
                {isActive(item.to) && <span className={style.navActiveBar} />}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer: Logout */}
      <div className={style.footer}>
        <button className={style.logoutBtn} onClick={handleLogout} type="button">
          <i className="bi bi-box-arrow-left" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
