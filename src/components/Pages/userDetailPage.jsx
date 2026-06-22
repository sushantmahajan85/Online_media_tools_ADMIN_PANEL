import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Row } from "reactstrap";
import { useSelector } from "react-redux";
import axios from "axios";
import { selecteUsers } from "../../Store/authSlice";
import { displayText, formatJoiningDateTime, resolveProfileImageUrl } from "../../utils/userDisplay";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;
const HISTORY_PAGE_SIZE = 10;

function formatLoginDateTime(raw) {
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

function formatCountry(code) {
  if (!code) return "—";
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    return name ? `${name} (${code})` : code;
  } catch {
    return code;
  }
}

function formatLoginMethod(method) {
  if (!method) return "—";
  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoField({ icon, label, children }) {
  return (
    <div className={style.udpField}>
      <span className={`bi ${icon} ${style.udpFieldIcon}`} />
      <div className={style.udpFieldContent}>
        <span className={style.udpFieldLabel}>{label}</span>
        <span className={style.udpFieldValue}>{children}</span>
      </div>
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <div className={style.udpInfoCard}>
      <div className={style.udpInfoCardHeader}>
        <span className={`bi ${icon} ${style.udpInfoCardIcon}`} />
        <span className={style.udpInfoCardTitle}>{title}</span>
      </div>
      <div className={style.udpInfoCardBody}>{children}</div>
    </div>
  );
}

export function UserDetailpage() {
  const storeUser = useSelector(selecteUsers);
  const { id } = useParams();
  const [user, setUser] = useState();
  const [loadingUser, setLoadingUser] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: HISTORY_PAGE_SIZE,
  });

  useEffect(() => {
    const current = storeUser.find((u) => String(u._id) === String(id));
    if (current) {
      setUser(current);
      setLoadingUser(false);
      return;
    }

    let cancelled = false;
    setLoadingUser(true);

    axios
      .get(`${serverURL}/api/users/get_all_users?ids=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!cancelled) {
          setUser(res.data?.users?.[0] || null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingUser(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, storeUser]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setHistoryLoading(true);

    axios
      .get(`${serverURL}/api/users/${id}/login-history`, {
        params: { page: historyPage, limit: HISTORY_PAGE_SIZE },
      })
      .then((res) => {
        if (!cancelled) {
          setLoginHistory(res.data?.history || []);
          setHistoryPagination(
            res.data?.pagination || {
              total: 0,
              totalPages: 0,
              limit: HISTORY_PAGE_SIZE,
            }
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load login history:", err);
          setLoginHistory([]);
          setHistoryPagination({ total: 0, totalPages: 0, limit: HISTORY_PAGE_SIZE });
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [id]);

  const fullName = useMemo(() => {
    if (!user) return "";
    const a = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return a || displayText(user.email, "User");
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return "?";
    const a = (user.firstName || "").trim();
    const b = (user.lastName || "").trim();
    if (a && b) return (a[0] + b[0]).toUpperCase();
    if (a) return a.slice(0, 2).toUpperCase();
    const e = (user.email || "").trim();
    return e ? e[0].toUpperCase() : "?";
  }, [user]);

  const avatarUrl = useMemo(() => resolveProfileImageUrl(user), [user]);

  const historyTotalPages = Math.max(1, historyPagination.totalPages || 0);
  const showHistoryPagination = historyPagination.total > HISTORY_PAGE_SIZE;
  const historyRowOffset = (historyPage - 1) * HISTORY_PAGE_SIZE;

  const displayLoginHistory = useMemo(() => {
    if (loginHistory.length > 0) return loginHistory;

    const fallback = [];
    if (user?.lastLoginIp) {
      fallback.push({
        _id: "profile-last-login",
        ip: user.lastLoginIp,
        loggedInAt: user.lastLoginAt,
        method: "last_login",
      });
    }
    if (user?.ipAddress && user.ipAddress !== user.lastLoginIp) {
      fallback.push({
        _id: "profile-registration",
        ip: user.ipAddress,
        method: "registration",
      });
    }
    return fallback;
  }, [loginHistory, user]);

  return (
    <div className={style.udpPage}>
      {loadingUser && (
        <div style={{ padding: "40px 32px", color: "#6b7280", textAlign: "center" }}>
          Loading user…
        </div>
      )}
      {!loadingUser && !user && (
        <div style={{ padding: "40px 32px", color: "#6b7280", textAlign: "center" }}>
          User not found.
        </div>
      )}
      {!loadingUser && user && (
        <div className={style.udpShell}>
          <Row className="g-4 mb-4">
            <Col lg={4} md={5} xs={12}>
              <div className={style.udpHeroCard}>
                <div className={style.udpHeroCover}>
                  <div className={style.udpAvatarWrap}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className={style.udpAvatarImg}
                      />
                    ) : (
                      <div className={style.udpAvatarInitials}>{initials}</div>
                    )}
                  </div>
                </div>
                <div className={style.udpHeroBody}>
                  <div
                    className={`${style.udpVerifyBadge} ${
                      user.isverified
                        ? style.udpVerifyBadgeOk
                        : style.udpVerifyBadgeFail
                    }`}
                  >
                    <span
                      className={`bi ${
                        user.isverified
                          ? "bi-patch-check-fill"
                          : "bi-patch-exclamation-fill"
                      }`}
                    />
                    {user.isverified ? "Verified" : "Unverified"}
                  </div>

                  <div className={style.udpHeroName}>{fullName}</div>

                  {user.Designation && (
                    <div className={style.udpHeroDesignation}>
                      {user.Designation}
                    </div>
                  )}

                  <div className={style.udpHeroMeta}>
                    <span className="bi bi-envelope" />
                    <span>{displayText(user.email)}</span>
                  </div>

                  <div className={style.udpHeroActions}>
                    <Link
                      to={`/Admin/AdminDashboard/UserDetails/${id}/Posts`}
                      className={style.udpActionCard}
                    >
                      <div className={`${style.udpActionIcon} ${style.udpActionIconPosts}`}>
                        <img src="/mpost.png" alt="" width={28} height={28} />
                      </div>
                      <span className={style.udpActionLabel}>Posts</span>
                      <span className={`bi bi-arrow-right-short ${style.udpActionArrow}`} />
                    </Link>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={8} md={7} xs={12}>
              <Row className="g-3">
                <Col md={6}>
                  <InfoCard title="Account & Access" icon="bi-shield-lock">
                    <InfoField icon="bi-envelope-check" label="Email">
                      {displayText(user.email)}
                    </InfoField>
                    <InfoField icon="bi-phone" label="Mobile">
                      {displayText(user.mobileNumber)}
                    </InfoField>
                    <InfoField icon="bi-globe" label="IP Address">
                      {displayText(user.ipAddress)}
                    </InfoField>
                    <InfoField icon="bi-clock-history" label="Last Login">
                      {formatLoginDateTime(user.lastLoginAt)}
                    </InfoField>
                    <InfoField icon="bi-geo-alt" label="Last Login IP">
                      {displayText(user.lastLoginIp)}
                    </InfoField>
                    <InfoField icon="bi-calendar3" label="Joined">
                      {formatJoiningDateTime(user)}
                    </InfoField>
                  </InfoCard>
                </Col>

                <Col md={6}>
                  <InfoCard title="Profile" icon="bi-person-badge">
                    <InfoField icon="bi-briefcase" label="Designation">
                      {displayText(user.Designation)}
                    </InfoField>
                    <InfoField icon="bi-info-circle" label="About">
                      {displayText(user.AboutMe)}
                    </InfoField>
                  </InfoCard>
                </Col>

                <Col xs={12}>
                  <InfoCard title="Social" icon="bi-share">
                    <Row className="g-0">
                      <Col xs={12} sm={6}>
                        <InfoField icon="bi-facebook" label="Facebook">
                          {displayText(user.Facebook)}
                        </InfoField>
                        <InfoField icon="bi-instagram" label="Instagram">
                          {displayText(user.Instagram)}
                        </InfoField>
                        <InfoField icon="bi-linkedin" label="LinkedIn">
                          {displayText(user.LinkedIn)}
                        </InfoField>
                      </Col>
                      <Col xs={12} sm={6}>
                        <InfoField icon="bi-microsoft-teams" label="Teams">
                          {displayText(user.Skype)}
                        </InfoField>
                        <InfoField icon="bi-telegram" label="Telegram">
                          {displayText(user.Telegram)}
                        </InfoField>
                      </Col>
                    </Row>
                  </InfoCard>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row className="g-3 pb-4">
            <Col xs={12}>
              <InfoCard title="Login History" icon="bi-clock-history">
                <div className={style.rrTableWrap}>
                  {!historyLoading && displayLoginHistory.length === 0 ? (
                    <div className={style.rrEmpty}>
                      <i className="bi bi-clock-history" style={{ fontSize: 44, opacity: 0.2 }} />
                      <p className={style.rrEmptyTitle}>No login history recorded yet.</p>
                    </div>
                  ) : (
                    <>
                    <table className={style.rrTable}>
                      <thead>
                        <tr>
                          <th className={style.rrTh} style={{ width: 36 }}>#</th>
                          <th className={style.rrTh} style={{ width: 180 }}>Date & Time</th>
                          <th className={style.rrTh}>IP Address</th>
                          <th className={style.rrTh}>Country</th>
                          <th className={style.rrTh}>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyLoading &&
                          [...Array(HISTORY_PAGE_SIZE)].map((_, i) => (
                            <tr key={i} className={style.rrSkeletonRow}>
                              <td><div className={style.rrSkeleton} style={{ width: 20 }} /></td>
                              <td><div className={style.rrSkeleton} style={{ width: 140 }} /></td>
                              <td><div className={style.rrSkeleton} style={{ width: 120 }} /></td>
                              <td><div className={style.rrSkeleton} style={{ width: 100 }} /></td>
                              <td><div className={style.rrSkeleton} style={{ width: 90 }} /></td>
                            </tr>
                          ))}

                        {!historyLoading &&
                          displayLoginHistory.map((entry, index) => (
                            <tr key={entry._id} className={style.rrRow}>
                              <td className={style.rrTd} style={{ color: "#9ca3af", fontSize: 13 }}>
                                {historyRowOffset + index + 1}
                              </td>
                              <td className={style.rrTd}>
                                <span className={style.rrDateTime}>
                                  {formatLoginDateTime(entry.loggedInAt || entry.createdAt)}
                                </span>
                              </td>
                              <td className={style.rrTd}>{displayText(entry.ip)}</td>
                              <td className={style.rrTd}>{formatCountry(entry.country)}</td>
                              <td className={style.rrTd}>{formatLoginMethod(entry.method)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {showHistoryPagination && (
                      <div className={style.rrPagination}>
                        <button
                          type="button"
                          className={style.rrPageBtn}
                          disabled={historyPage <= 1 || historyLoading}
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        >
                          <i className="bi bi-chevron-left" />
                          Previous
                        </button>
                        <span className={style.rrPageInfo}>
                          Page {historyPage} of {historyTotalPages}
                          <span className={style.rrPageCount}>
                            ({historyPagination.total} total)
                          </span>
                        </span>
                        <button
                          type="button"
                          className={style.rrPageBtn}
                          disabled={historyPage >= historyTotalPages || historyLoading}
                          onClick={() => setHistoryPage((p) => p + 1)}
                        >
                          Next
                          <i className="bi bi-chevron-right" />
                        </button>
                      </div>
                    )}
                    </>
                  )}
                </div>
              </InfoCard>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
