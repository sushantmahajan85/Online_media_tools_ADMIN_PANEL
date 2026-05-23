import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import "react-dropdown/style.css";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, CardBody, Input, Table } from "reactstrap";
import { selecteUsers } from "../../Store/authSlice";
import { displayText, formatJoiningDate } from "../../utils/userDisplay";
import { DeleteModel } from "./DeleteModel";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;

const EXCLUDED_ADMIN_ID = "658c582ff1bc8978d2300823";

function userDisplayName(tdata) {
  if (tdata.firstName || tdata.lastName) {
    return [tdata.firstName, tdata.lastName].filter(Boolean).join(" ").trim();
  }
  return "—";
}

const ProjectTables = () => {
  const storeUsers = useSelector(selecteUsers);
  const [deltedId, setDeletedId] = useState();
  const [deleteWhatUsers, setdeleteWhatUsers] = useState("");
  const [pContent, setpContent] = useState();
  const navigate = useNavigate();
  const [currentData, setcurrentData] = useState();
  const [modal, setModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const toggle = () => setModal(!modal);

  useEffect(() => {
    let alluser = storeUsers.filter((user) => user._id !== EXCLUDED_ADMIN_ID);
    alluser = alluser.reverse();
    setcurrentData(alluser);
  }, [storeUsers]);

  const filteredData = useMemo(() => {
    if (!currentData) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentData;
    return currentData.filter((u) => {
      const name = userDisplayName(u).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const mobile = displayText(u.mobileNumber, "").toLowerCase();
      const ip = displayText(u.ipAddress, "").toLowerCase();
      const device = displayText(u.device, "").toLowerCase();
      const id = (u._id || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        mobile.includes(q) ||
        ip.includes(q) ||
        device.includes(q) ||
        id.includes(q)
      );
    });
  }, [currentData, searchQuery]);

  async function handleUserChat(userId) {
    const chatRoomUsers = [EXCLUDED_ADMIN_ID, userId].sort();
    const chatRoomId = chatRoomUsers.join("_");
    navigate(
      `/Admin/AdminDashboard/UserDetails/${EXCLUDED_ADMIN_ID}/UserChats/${chatRoomId}/Chat`,
    );
  }

  return (
    <div className={style.usersPageShell}>
      {/* Toolbar */}
      <div className={style.usersToolbar}>
        <div className={style.usersToolbarLeft}>
          <div className={style.usersSearchWrap}>
            <i className={`bi bi-search ${style.usersSearchIcon}`} />
            <input
              type="search"
              placeholder="Search name, email, IP, device…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={style.usersSearchInput}
            />
            {searchQuery && (
              <button className={style.usersSearchClear} onClick={() => setSearchQuery("")} type="button">
                <i className="bi bi-x" />
              </button>
            )}
          </div>
          <span className={style.usersCount}>
            {filteredData.length} user{filteredData.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          type="button"
          className={style.usersDeleteUnverifiedBtn}
          onClick={() => {
            setModal(!modal);
            setpContent("Are you sure you want to delete all unverified users? This action cannot be undone.");
            setdeleteWhatUsers("UnverifiedUsers");
          }}
        >
          <i className="bi bi-person-x-fill" />
          Delete Unverified
        </button>
      </div>

      {/* Table */}
      {currentData && (
        <div
          className={style.usersTableViewport}
          role="region"
          aria-label="Users table"
          tabIndex={0}
        >
          <Table
            className={`align-middle mb-0 ${style.usersTable}`}
            borderless
            responsive={false}
          >
            <colgroup>
              <col className={style.usersColName} />
              <col className={style.usersColEmail} />
              <col className={style.usersColContact} />
              <col className={style.usersColRole} />
              <col className={style.usersColAccount} />
              <col className={style.usersColIp} />
              <col className={style.usersColDevice} />
              <col className={style.usersColJoined} />
              <col className={style.usersColAction} />
              <col className={style.usersColChat} />
              <col className={style.usersColSuspend} />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Account</th>
                <th>IP</th>
                <th>Device</th>
                <th>Joined</th>
                <th className={style.usersActionCol}>Del</th>
                <th className={style.usersChatCol}>Chat</th>
                <th className={style.usersSuspendCol}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((tdata) => (
                <tr key={tdata._id} className={style.usersRow}>
                  {/* Name */}
                  <td>
                    <Link
                      to={`/Admin/AdminDashboard/UserDetails/${tdata._id}`}
                      className={style.usersNameCell}
                    >
                      {tdata.profileImageUrl ? (
                        <img
                          src={tdata.profileImageUrl}
                          className={style.usersAvatar}
                          alt=""
                          width={36}
                          height={36}
                        />
                      ) : (
                        <span className={style.usersAvatarFallback}>
                          {(tdata.firstName || "?")[0].toUpperCase()}
                        </span>
                      )}
                      <span className={`${style.usersCellEllipsis} ${style.usersNameText}`} title={userDisplayName(tdata)}>
                        {userDisplayName(tdata)}
                      </span>
                    </Link>
                  </td>

                  {/* Email */}
                  <td>
                    <div className={style.usersCellInner}>
                      <span className={`${style.usersCellEllipsis} ${style.usersCellText}`} title={displayText(tdata.email)}>
                        {displayText(tdata.email)}
                      </span>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div className={style.usersCellInner}>
                      <span className={`${style.usersCellEllipsis} ${style.usersCellText}`} title={displayText(tdata.mobileNumber)}>
                        {displayText(tdata.mobileNumber)}
                      </span>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <div className={style.usersCellInner}>
                      <span className={`${style.usersCellClamp} ${style.usersCellText}`} title={displayText(tdata.Designation)}>
                        {displayText(tdata.Designation)}
                      </span>
                    </div>
                  </td>

                  {/* Account */}
                  <td>
                    {tdata.isverified ? (
                      <span className={style.usersVerifiedBadge}>Verified</span>
                    ) : (
                      <span className={style.usersUnverifiedBadge}>Unverified</span>
                    )}
                  </td>

                  {/* IP */}
                  <td>
                    <div className={style.usersCellInner}>
                      <span className={`${style.usersCellEllipsis} ${style.usersCellText}`} title={displayText(tdata.ipAddress)}>
                        {displayText(tdata.ipAddress)}
                      </span>
                    </div>
                  </td>

                  {/* Device */}
                  <td>
                    <div className={style.usersCellInner}>
                      <span className={`${style.usersCellClamp} ${style.usersCellText}`} title={displayText(tdata.device)}>
                        {displayText(tdata.device)}
                      </span>
                    </div>
                  </td>

                  {/* Joined */}
                  <td>
                    <div className={style.usersCellInner}>
                      <span className={`${style.usersCellEllipsis} ${style.usersCellText}`} title={formatJoiningDate(tdata)}>
                        {formatJoiningDate(tdata)}
                      </span>
                    </div>
                  </td>

                  {/* Delete */}
                  <td className={`${style.usersActionCol} ${style.usersTableActions}`}>
                    <button
                      type="button"
                      className={style.usersIconBtnDelete}
                      aria-label="Delete user"
                      onClick={() => {
                        setDeletedId(tdata._id);
                        setModal(!modal);
                        setdeleteWhatUsers("user");
                        setpContent("Are you sure you want to delete this user? All data will be permanently removed.");
                      }}
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </td>

                  {/* Chat */}
                  <td className={`${style.usersChatCol} ${style.usersTableActions}`}>
                    {tdata.isverified ? (
                      <button
                        type="button"
                        className={style.usersIconBtnChat}
                        aria-label="Open chat"
                        onClick={() => handleUserChat(tdata._id)}
                      >
                        <i className="bi bi-chat-dots-fill" />
                      </button>
                    ) : (
                      <span className={style.usersCellMuted}>—</span>
                    )}
                  </td>

                  {/* Suspend */}
                  <td className={`${style.usersSuspendCol} ${style.usersTableActions}`}>
                    {tdata.firstName && !tdata.isSuspended && (
                      <button
                        type="button"
                        className={style.usersSuspendBtn}
                        onClick={async () => {
                          const res = await axios.put(`${serverURL}/api/users/suspend/${tdata._id}`);
                          if (res?.status === 200) { toast.success(res.data.message); window.location.reload(); }
                        }}
                      >
                        Suspend
                      </button>
                    )}
                    {tdata.firstName && tdata.isSuspended && (
                      <button
                        type="button"
                        className={style.usersUnsuspendBtn}
                        onClick={async () => {
                          const res = await axios.put(`${serverURL}/api/users/unsuspend/${tdata._id}`);
                          if (res?.status === 200) { toast.success(res.data.message); window.location.reload(); }
                        }}
                      >
                        Banned
                      </button>
                    )}
                    {!tdata.firstName && <span className={style.usersCellMuted}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <DeleteModel
        modal={modal}
        setModal={setModal}
        toggle={toggle}
        pContent={pContent}
        deleteWhat={deleteWhatUsers}
        deltedId={deltedId}
      />
    </div>
  );
};

export default ProjectTables;
