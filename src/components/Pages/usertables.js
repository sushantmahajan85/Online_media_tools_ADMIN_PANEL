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
      {currentData && (
        <div>
          <div className={`p-2 text-light ${style.Sheading}`}>
            <h2 className={style.Heading}>Users</h2>
          </div>

          <div>
            <CardBody className={`px-0 px-sm-2 ${style.usersCardBody}`}>
              <div className={style.usersCardHeader}>
                <div className="me-2">
                  <h2 className="h5 mb-1">User listing</h2>
                  <p className="text-muted small mb-0">
                    Overview of all users ({filteredData.length} shown)
                  </p>
                </div>

                <div className="d-flex flex-wrap align-items-stretch gap-2">
                  <div className={style.usersSearch}>
                    <Input
                      type="search"
                      bsSize="sm"
                      placeholder="Search name, email, IP, device…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-secondary-subtle"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModal(!modal);
                      setpContent(
                        " Are you sure you want to Delete All Unverified Users? This action cannot be undone.",
                      );
                      setdeleteWhatUsers("UnverifiedUsers");
                    }}
                    className="btn btn-danger btn-sm fw-semibold text-nowrap px-3"
                  >
                    Delete unverified
                  </button>
                </div>
              </div>

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
                      <th className={style.usersSuspendCol}>Suspend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((tdata) => (
                      <tr key={tdata._id} className="border-top">
                        <td>
                          <Link
                            to={`/Admin/AdminDashboard/UserDetails/${tdata._id}`}
                            className={`${style.userProfile} d-flex align-items-center text-dark text-decoration-none py-1 min-w-0 w-100`}
                          >
                            {tdata.profileImageUrl ? (
                              <img
                                src={tdata.profileImageUrl}
                                className="rounded-circle flex-shrink-0"
                                alt=""
                                width={40}
                                height={40}
                              />
                            ) : (
                              <span
                                className="rounded-circle flex-shrink-0 d-inline-flex align-items-center justify-content-center bg-light border text-secondary small"
                                style={{
                                  width: 40,
                                  height: 40,
                                  fontSize: "0.7rem",
                                }}
                              >
                                {(tdata.firstName || "?")[0]}
                              </span>
                            )}
                            <span className="ms-2 mb-0 small fw-semibold flex-grow-1 min-w-0">
                              <span
                                className={style.usersCellEllipsis}
                                title={userDisplayName(tdata)}
                              >
                                {userDisplayName(tdata)}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <div className={style.usersCellInner}>
                            <span
                              className={style.usersCellEllipsis}
                              title={displayText(tdata.email)}
                            >
                              {displayText(tdata.email)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={style.usersCellInner}>
                            <span
                              className={`small ${style.usersCellEllipsis}`}
                              title={displayText(tdata.mobileNumber)}
                            >
                              {displayText(tdata.mobileNumber)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={style.usersCellInner}>
                            <span
                              className={`small ${style.usersCellClamp}`}
                              title={displayText(tdata.Designation)}
                            >
                              {displayText(tdata.Designation)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={style.usersCellInner}>
                            {tdata.isverified === true ? (
                              <span className="text-success small fw-bold">
                                OK
                              </span>
                            ) : (
                              <span className="text-danger small fw-bold">
                                No
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={style.usersCellInner}>
                            <span
                              className={`small ${style.usersCellEllipsis}`}
                              title={displayText(tdata.ipAddress)}
                            >
                              {displayText(tdata.ipAddress)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={style.usersCellInner}>
                            <span
                              className={`small ${style.usersCellClamp}`}
                              title={displayText(tdata.device)}
                            >
                              {displayText(tdata.device)}
                            </span>
                          </div>
                        </td>
                        <td className="small text-muted">
                          <div className={style.usersCellInner}>
                            <span
                              className={style.usersCellEllipsis}
                              title={formatJoiningDate(tdata)}
                            >
                              {formatJoiningDate(tdata)}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`${style.usersActionCol} ${style.usersTableActions}`}
                        >
                          <Button
                            className="Reject btn-sm p-1"
                            onClick={() => {
                              setDeletedId(tdata._id);
                              setModal(!modal);
                              setdeleteWhatUsers("user");
                              setpContent(
                                " Are you sure you want to Delete  your account? All of your data will be permanently removed. This action cannot be undone.",
                              );
                            }}
                            aria-label="Delete user"
                          >
                            <i className="bi bi-trash3" />
                          </Button>
                        </td>
                        <td
                          className={`${style.usersChatCol} ${style.usersTableActions}`}
                        >
                          {tdata.isverified ? (
                            <Button
                              className="btn-sm p-1"
                              onClick={() => handleUserChat(tdata._id)}
                              aria-label="Open chat"
                            >
                              <i className="bi bi-chat-left-fill" />
                            </Button>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td
                          className={`${style.usersSuspendCol} ${style.usersTableActions} small`}
                        >
                          {tdata.firstName && !tdata.isSuspended && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger p-0 text-decoration-underline"
                              onClick={async () => {
                                const response = await axios.put(
                                  `${serverURL}/api/users/suspend/${tdata._id}`,
                                );
                                if (response && response.status === 200) {
                                  toast.success(response.data.message);
                                  window.location.reload();
                                }
                              }}
                            >
                              Suspend
                            </button>
                          )}
                          {tdata.firstName && tdata.isSuspended && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-success p-0 text-decoration-underline"
                              onClick={async () => {
                                const response = await axios.put(
                                  `${serverURL}/api/users/unsuspend/${tdata._id}`,
                                );
                                if (response && response.status === 200) {
                                  toast.success(response.data.message);
                                  window.location.reload();
                                }
                              }}
                            >
                              Banned
                            </button>
                          )}
                          {!tdata.firstName && <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </div>
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
