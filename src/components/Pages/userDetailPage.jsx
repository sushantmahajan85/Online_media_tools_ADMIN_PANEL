import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Row } from "reactstrap";
import { useSelector } from "react-redux";
import { selecteUsers } from "../../Store/authSlice";
import {
  displayText,
  formatJoiningDateTime,
} from "../../utils/userDisplay";
import style from "./ui.module.css";

function DetailField({ label, children }) {
  return (
    <div className={style.propRow}>
      <div className={style.propLabel}>{label}</div>
      <div className={style.propValue}>{children}</div>
    </div>
  );
}

export function UserDetailpage() {
  const storeUser = useSelector(selecteUsers);
  const { id } = useParams();
  const [user, setUser] = useState();

  useEffect(() => {
    const current = storeUser.find((u) => u._id === id);
    setUser(current);
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
    <>
      <div className={`p-2 text-light ${style.Sheading}`}>
        <h2 className={style.Heading}>User profile</h2>
      </div>

      {user && (
        <div className={style.userDetailShell}>
          <Row className="g-3 mb-3">
            <Col lg={4} md={5}>
              <div className={style.userDetailHeroCard}>
                <div className={style.userDetailAvatar}>
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" />
                  ) : (
                    <div className={style.userDetailAvatarPlaceholder}>
                      {initials}
                    </div>
                  )}
                </div>
                <div className={style.userDetailName}>{fullName}</div>
                <p className={`${style.userDetailMeta} mb-1`}>
                  {displayText(user.email)}
                </p>
                <p className={`${style.userDetailMeta} small font-monospace mb-0`}>
                  {displayText(user._id)}
                </p>
              </div>
            </Col>
            <Col lg={8} md={7}>
              <Row className="g-3">
                <Col md={6}>
                  <div className={style.propertiesBox}>
                    <div className={style.propertiesBoxTitle}>
                      {"Account & access"}
                    </div>
                    <DetailField label="Verification">
                      {user.isverified === true ? (
                        <span className="text-success fw-semibold">
                          Verified
                        </span>
                      ) : (
                        <span className="text-danger fw-semibold">
                          Unverified
                        </span>
                      )}
                    </DetailField>
                    <DetailField label="Email">
                      {displayText(user.email)}
                    </DetailField>
                    <DetailField label="Mobile">
                      {displayText(user.mobileNumber)}
                    </DetailField>
                    <DetailField label="IP address">
                      {displayText(user.ipAddress)}
                    </DetailField>
                    <DetailField label="Device">
                      {displayText(user.device)}
                    </DetailField>
                    <DetailField label="Joining date">
                      {formatJoiningDateTime(user)}
                    </DetailField>
                  </div>
                </Col>
                <Col md={6}>
                  <div className={style.propertiesBox}>
                    <div className={style.propertiesBoxTitle}>Profile</div>
                    <DetailField label="Designation">
                      {displayText(user.Designation)}
                    </DetailField>
                    <DetailField label="About">
                      {displayText(user.AboutMe)}
                    </DetailField>
                  </div>
                </Col>
                <Col xs={12}>
                  <div className={style.propertiesBox}>
                    <div className={style.propertiesBoxTitle}>Social</div>
                    <DetailField label="Facebook">
                      {displayText(user.Facebook)}
                    </DetailField>
                    <DetailField label="Instagram">
                      {displayText(user.Instagram)}
                    </DetailField>
                    <DetailField label="LinkedIn">
                      {displayText(user.LinkedIn)}
                    </DetailField>
                    <DetailField label="Skype">
                      {displayText(user.Skype)}
                    </DetailField>
                    <DetailField label="Telegram">
                      {displayText(user.Telegram)}
                    </DetailField>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      )}

      <div className={`container-fluid px-3 pb-4`}>
        <Row className="g-3 my-2 justify-content-center text-center">
          <Col xs={12} sm={6} md={4} lg={3}>
            <Link
              to={`/Admin/AdminDashboard/UserDetails/${id}/UserChats`}
              className={`${style.Box} h-100`}
            >
              <div>Chats</div>
              <div>
                <img src="/chats.png" alt="" width={36} height={36} />
              </div>
            </Link>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Link
              to={`/Admin/AdminDashboard/UserDetails/${id}/Posts`}
              className={`${style.Box} h-100`}
            >
              <div>Posts</div>
              <div>
                <img src="/mpost.png" alt="" width={36} height={36} />
              </div>
            </Link>
          </Col>
        </Row>
      </div>
    </>
  );
}
