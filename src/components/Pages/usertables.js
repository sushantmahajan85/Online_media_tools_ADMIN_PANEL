import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import "react-dropdown/style.css";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, CardBody, Input, Table } from "reactstrap";
import { allusers, selecteUsers } from "../../Store/authSlice";
import { displayText, formatJoiningDate, resolveProfileImageUrl } from "../../utils/userDisplay";
import {
  buildAlignedExportCsv,
  downloadCsv,
  exportStamp,
} from "../../utils/csvExport";
import { PRIMARY_SUPPORT_ADMIN_ID } from "../../constants/admin";
import { DeleteModel } from "./DeleteModel";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;

const EXCLUDED_ADMIN_ID = PRIMARY_SUPPORT_ADMIN_ID;

function userDisplayName(tdata) {
  if (tdata.firstName || tdata.lastName) {
    return [tdata.firstName, tdata.lastName].filter(Boolean).join(" ").trim();
  }
  return "—";
}

const ProjectTables = () => {
  const dispatch = useDispatch();
  const storeUsers = useSelector(selecteUsers);
  const [deltedId, setDeletedId] = useState();
  const [deleteWhatUsers, setdeleteWhatUsers] = useState("");
  const [pContent, setpContent] = useState();
  const [currentData, setcurrentData] = useState();
  const [modal, setModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const exportInFlightRef = useRef(false);
  const toggle = () => setModal(!modal);

  const handleExport = async () => {
    if (exportInFlightRef.current || isExporting) return;
    exportInFlightRef.current = true;
    setIsExporting(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        axios.get(`${serverURL}/api/users/get_all_users`),
        axios.get(`${serverURL}/api/posts/get_all_posts/0`),
      ]);

      const users = usersRes?.data?.users || [];
      const posts = postsRes?.data?.posts || [];

      if (users.length === 0 && posts.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const stamp = exportStamp();
      const csv = buildAlignedExportCsv(users, posts);
      downloadCsv(`users_posts_export_${stamp}.csv`, csv);

      toast.success(`Exported ${users.length} users and ${posts.length} posts`);
    } catch {
      toast.error("Failed to export data. Please try again.");
    } finally {
      exportInFlightRef.current = false;
      setIsExporting(false);
    }
  };

  useEffect(() => {
    async function refreshUsers() {
      try {
        const response = await axios.get(`${serverURL}/api/users/get_all_users`);
        if (response?.status === 200 && response.data?.users) {
          dispatch(allusers(response.data.users));
        }
      } catch {
        /* keep cached list on failure */
      }
    }
    refreshUsers();
  }, [dispatch]);

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

        <div className={style.usersToolbarActions}>
          <button
            type="button"
            className={style.usersExportBtn}
            onClick={handleExport}
            disabled={isExporting}
            title="Export all users and posts (all statuses) as CSV"
          >
            {isExporting ? (
              <>
                <span className={style.usersExportSpinner} />
                Exporting…
              </>
            ) : (
              <>
                <i className="bi bi-download" />
                Export CSV
              </>
            )}
          </button>

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
              <col className={style.usersColAccount} />
              <col className={style.usersColIp} />
              <col className={style.usersColDevice} />
              <col className={style.usersColJoined} />
              <col className={style.usersColAction} />
              <col className={style.usersColSuspend} />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Account</th>
                <th>IP</th>
                <th>Device</th>
                <th>Joined</th>
                <th className={style.usersActionCol}>Del</th>
                <th className={style.usersSuspendCol}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((tdata) => {
                const avatarUrl = resolveProfileImageUrl(tdata);
                return (
                <tr key={tdata._id} className={style.usersRow}>
                  {/* Name */}
                  <td>
                    <Link
                      to={`/Admin/AdminDashboard/UserDetails/${tdata._id}`}
                      className={style.usersNameCell}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
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

                  {/* Account */}
                  <td>
                    <div className={style.usersAuthBadges}>
                      {tdata.isGoogleVerified && (
                        <span className={style.usersGoogleBadge} title="Google verified">
                          <i className="bi bi-google" />
                        </span>
                      )}
                      {tdata.isLinkedinVerified && (
                        tdata.LinkedIn ? (
                          <a
                            href={tdata.LinkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={style.usersLinkedInLink}
                            title="LinkedIn verified — view profile"
                          >
                            <i className="bi bi-linkedin" />
                          </a>
                        ) : (
                          <a
                            href={(() => {
                              const parts = [userDisplayName(tdata)];
                              if (tdata.Designation) parts.push(tdata.Designation);
                              if (tdata.Company) parts.push(tdata.Company);
                              return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(parts.join(" "))}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={style.usersLinkedInSearch}
                            title={`LinkedIn verified — search: ${[userDisplayName(tdata), tdata.Designation, tdata.Company].filter(Boolean).join(", ")}`}
                          >
                            <i className="bi bi-linkedin" />
                          </a>
                        )
                      )}
                      {!tdata.isGoogleVerified && !tdata.isLinkedinVerified && (
                        <span className={style.usersCellMuted}>—</span>
                      )}
                    </div>
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
              );
              })}
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
