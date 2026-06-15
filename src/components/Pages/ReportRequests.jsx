import { useEffect, useState } from "react";
import style from "./ui.module.css";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader/loader";

const serverURL = process.env.REACT_APP_SERVER_URL;

function getInitials(user) {
  if (!user) return "?";
  return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "?";
}

function formatReportDateTime(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ReportRequests() {
  const [reportedUsers, setReportedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReportedUsers();
  }, []);

  async function fetchReportedUsers() {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/api/users/reportedUsers`);
      setReportedUsers(res.data.reportedUsers);
    } catch (error) {
      toast.error("Failed to fetch report requests");
    } finally {
      setLoading(false);
    }
  }

  const filtered = reportedUsers
    .filter((r) => {
      const q = search.toLowerCase();
      const reported = `${r.reportedUserId?.firstName || ""} ${r.reportedUserId?.lastName || ""}`.toLowerCase();
      const reporter = `${r.reporterUserId?.firstName || ""} ${r.reporterUserId?.lastName || ""}`.toLowerCase();
      const reason = (r.reason || "").toLowerCase();
      return reported.includes(q) || reporter.includes(q) || reason.includes(q);
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <>
      <div className={style.rrPage}>
        {/* Toolbar */}
        <div className={style.rrToolbar}>
          <div className={style.rrSearchWrap}>
            <i className={`bi bi-search ${style.rrSearchIcon}`} />
            <input
              type="text"
              placeholder="Search by name or reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={style.rrSearchInput}
            />
            {search && (
              <button className={style.rrSearchClear} onClick={() => setSearch("")} type="button">
                <i className="bi bi-x" />
              </button>
            )}
          </div>
          <span className={style.rrCountBadge}>
            <i className="bi bi-flag-fill" />
            {loading ? "—" : `${filtered.length} report${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Table */}
        <div className={style.rrTableWrap}>
          {!loading && filtered.length === 0 ? (
            <div className={style.rrEmpty}>
              <i className="bi bi-shield-check" style={{ fontSize: 44, opacity: 0.2 }} />
              <p className={style.rrEmptyTitle}>
                {search ? "No reports match your search." : "No report requests found."}
              </p>
              {search && (
                <button className={style.rrEmptyClear} onClick={() => setSearch("")} type="button">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <table className={style.rrTable}>
              <thead>
                <tr>
                  <th className={style.rrTh} style={{ width: 36 }}>#</th>
                  <th className={style.rrTh}>Reported User</th>
                  <th className={style.rrTh}>Reporting User</th>
                  <th className={style.rrTh}>Reason</th>
                  <th className={style.rrTh} style={{ width: 160 }}>Reported At</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className={style.rrSkeletonRow}>
                      <td><div className={style.rrSkeleton} style={{ width: 20 }} /></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className={`${style.rrSkeleton} ${style.rrSkeletonCircle}`} />
                          <div className={style.rrSkeleton} style={{ width: 110 }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className={`${style.rrSkeleton} ${style.rrSkeletonCircle}`} />
                          <div className={style.rrSkeleton} style={{ width: 110 }} />
                        </div>
                      </td>
                      <td><div className={style.rrSkeleton} style={{ width: 200 }} /></td>
                      <td><div className={style.rrSkeleton} style={{ width: 120 }} /></td>
                    </tr>
                  ))}

                {!loading &&
                  filtered.map(({ _id, reason, reportedUserId, reporterUserId, createdAt }, index) => (
                    <tr key={_id} className={style.rrRow}>
                      <td className={style.rrTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                        {index + 1}
                      </td>

                      {/* Reported user */}
                      <td className={style.rrTd}>
                        <div className={style.rrUserCell}>
                          <div className={style.rrAvatarRed}>
                            {getInitials(reportedUserId)}
                          </div>
                          <div>
                            <div className={style.rrUserName}>
                              {reportedUserId
                                ? `${reportedUserId.firstName || ""} ${reportedUserId.lastName || ""}`.trim()
                                : "Unknown"}
                            </div>
                            {reportedUserId?.email && (
                              <div className={style.rrUserEmail}>{reportedUserId.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reporter */}
                      <td className={style.rrTd}>
                        <div className={style.rrUserCell}>
                          <div className={style.rrAvatarBlue}>
                            {getInitials(reporterUserId)}
                          </div>
                          <div>
                            <div className={style.rrUserName}>
                              {reporterUserId
                                ? `${reporterUserId.firstName || ""} ${reporterUserId.lastName || ""}`.trim()
                                : "Unknown"}
                            </div>
                            {reporterUserId?.email && (
                              <div className={style.rrUserEmail}>{reporterUserId.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className={style.rrTd}>
                        <span className={style.rrReason}>{reason || "—"}</span>
                      </td>

                      {/* Reported at */}
                      <td className={style.rrTd}>
                        <span className={style.rrDateTime}>{formatReportDateTime(createdAt)}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Loader loading={loading} />
    </>
  );
}
