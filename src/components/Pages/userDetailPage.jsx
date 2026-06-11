import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Row } from "reactstrap";
import { useSelector } from "react-redux";
import axios from "axios";
import { selecteUsers } from "../../Store/authSlice";
import { displayText, formatJoiningDateTime } from "../../utils/userDisplay";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;

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
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
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
                    <InfoField icon="bi-device-hdd" label="Device">
                      {displayText(user.device)}
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
                        <InfoField icon="bi-skype" label="Skype">
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
            <Col xs={12} sm={6} md={4} lg={3}>
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
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
