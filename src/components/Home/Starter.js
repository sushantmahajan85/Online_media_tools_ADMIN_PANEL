import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopCards from "../Cards/TopCards";
import { useSelector } from "react-redux";
import { selecteUsers, selectAllPinnedPosts, selectAllPosts } from "../../Store/authSlice";
import style from "../Pages/ui.module.css";
import { useAdminMongoProfile } from "../../hooks/useAdminMongoProfile";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const MAX_PINNED_POSTS = 10;

const QUICK_LINKS = [
  { to: "/Admin/AdminDashboard/Users",            icon: "bi-people-fill",         label: "Manage Users",         color: "#2563eb", bg: "#eff6ff" },
  { to: "/Admin/AdminDashboard/Posts",            icon: "bi-file-earmark-text-fill", label: "Manage Posts",      color: "#16a34a", bg: "#dcfce7" },
  { to: "/Admin/AdminDashboard/BumperPost",       icon: "bi-pin-angle-fill",      label: "Pinned Posts",         color: "#d97706", bg: "#fffbeb" },
  { to: "/Admin/AdminDashboard/ReportRequests",   icon: "bi-flag-fill",           label: "Report Requests",      color: "#e11d48", bg: "#fff1f2" },
  { to: "/Admin/AdminDashboard/sendnotification", icon: "bi-bell-fill",           label: "Send Notification",    color: "#0891b2", bg: "#ecfeff" },
];

const Starter = () => {
  const storeUsers       = useSelector(selecteUsers);
  const storeAllPosts    = useSelector(selectAllPosts);
  const storePinnedPosts = useSelector(selectAllPinnedPosts);

  const [suspendedUsers, setSuspendedUsers]   = useState(0);
  const [approvedPosts, setApprovedPosts]     = useState(0);
  const [pendingPosts, setPendingPosts]       = useState(0);

  const { profileUser: adminUser } = useAdminMongoProfile();
  const adminName = adminUser?.firstName || adminUser?.email || "Admin";

  useEffect(() => {
    setSuspendedUsers(storeUsers.filter((u) => u.isSuspended).length);
  }, [storeUsers]);

  useEffect(() => {
    setApprovedPosts(storeAllPosts.filter((p) => p.isApproved && !p.underApproval).length);
    setPendingPosts(storeAllPosts.filter((p) => p.underApproval).length);
  }, [storeAllPosts]);

  const activeUsers  = storeUsers.length - suspendedUsers;
  const otherPosts   = storeAllPosts.length - approvedPosts - pendingPosts;

  return (
    <div className={style.dashPage}>

      {/* Welcome banner */}
      <div className={style.dashBanner}>
        <div className={style.dashBannerContent}>
          <div className={style.dashBannerText}>
            <h1 className={style.dashGreeting}>{getGreeting()}, {adminName} 👋</h1>
            <p className={style.dashDate}>{formatDate()}</p>
            <p className={style.dashSubtitle}>Here's a snapshot of your platform today.</p>
          </div>
          <div className={style.dashBannerIllustration}>
            <i className="bi bi-bar-chart-fill" />
          </div>
        </div>
      </div>

      <div className={style.dashBody}>

        {/* ── Users ── */}
        <section className={style.dashSection}>
          <div className={style.dashSectionHeader}>
            <div className={style.dashSectionIcon} style={{ background: "#eff6ff", color: "#2563eb" }}>
              <i className="bi bi-people-fill" />
            </div>
            <div>
              <h2 className={style.dashSectionTitle}>Users</h2>
              <p className={style.dashSectionSub}>Platform user overview</p>
            </div>
            <Link to="/Admin/AdminDashboard/Users" className={style.dashSectionLink}>
              View all <i className="bi bi-arrow-right" />
            </Link>
          </div>
          <div className={style.dashCardsRow}>
            <TopCards value={storeUsers.length}  label="Total Users"     icon="bi bi-people"       color="blue"  />
            <TopCards value={activeUsers}         label="Active Users"    icon="bi bi-person-check"  color="green" />
            <TopCards value={suspendedUsers}      label="Suspended"       icon="bi bi-person-dash"   color="red"   />
          </div>
        </section>

        {/* ── Posts ── */}
        <section className={style.dashSection}>
          <div className={style.dashSectionHeader}>
            <div className={style.dashSectionIcon} style={{ background: "#dcfce7", color: "#16a34a" }}>
              <i className="bi bi-file-earmark-text-fill" />
            </div>
            <div>
              <h2 className={style.dashSectionTitle}>Posts</h2>
              <p className={style.dashSectionSub}>Content published on the platform</p>
            </div>
            <Link to="/Admin/AdminDashboard/Posts" className={style.dashSectionLink}>
              View all <i className="bi bi-arrow-right" />
            </Link>
          </div>
          <div className={style.dashCardsRow}>
            <TopCards value={storeAllPosts.length} label="Total Posts"    icon="bi bi-file-earmark-text" color="blue"  />
            <TopCards value={approvedPosts}         label="Approved"       icon="bi bi-check-circle"      color="green" />
            <TopCards value={pendingPosts}          label="Pending"        icon="bi bi-hourglass-split"    color="amber" />
            <TopCards value={otherPosts}            label="Disapproved"    icon="bi bi-x-circle"          color="red"   />
          </div>
        </section>

        {/* ── Pinned Posts ── */}
        <section className={style.dashSection}>
          <div className={style.dashSectionHeader}>
            <div className={style.dashSectionIcon} style={{ background: "#fffbeb", color: "#d97706" }}>
              <i className="bi bi-pin-angle-fill" />
            </div>
            <div>
              <h2 className={style.dashSectionTitle}>Pinned Posts</h2>
              <p className={style.dashSectionSub}>Highlighted content across the app</p>
            </div>
            <Link to="/Admin/AdminDashboard/BumperPost" className={style.dashSectionLink}>
              View all <i className="bi bi-arrow-right" />
            </Link>
          </div>
          <div className={style.dashCardsRow}>
            <TopCards value={storePinnedPosts.length} label="Total Pinned Posts" icon="bi bi-pin-angle" color="amber" />
            <TopCards value={Math.max(0, MAX_PINNED_POSTS - storePinnedPosts.length)} label="Slots Available" icon="bi bi-plus-circle" color="gray" />
          </div>
        </section>

        {/* ── Quick Access ── */}
        <section className={style.dashSection}>
          <div className={style.dashSectionHeader}>
            <div className={style.dashSectionIcon} style={{ background: "#f5f3ff", color: "#7c3aed" }}>
              <i className="bi bi-lightning-fill" />
            </div>
            <div>
              <h2 className={style.dashSectionTitle}>Quick Access</h2>
              <p className={style.dashSectionSub}>Jump to any section instantly</p>
            </div>
          </div>
          <div className={style.dashQuickGrid}>
            {QUICK_LINKS.map(({ to, icon, label, color, bg }) => (
              <Link key={to} to={to} className={style.dashQuickCard}>
                <div className={style.dashQuickIcon} style={{ background: bg, color }}>
                  <i className={`bi ${icon}`} />
                </div>
                <span className={style.dashQuickLabel}>{label}</span>
                <i className="bi bi-chevron-right" style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }} />
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Starter;
