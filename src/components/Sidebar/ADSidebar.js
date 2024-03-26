import { Button, Nav, NavItem } from "reactstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import style from "./sidebar.module.css";
import { useDispatch } from "react-redux";
import { logout } from "../../Store/authSlice";
import { toast } from "react-toastify";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const showMobilemenu = () => {
    document.getElementById("sidebarArea").classList.toggle("showSidebar");
  };
  let location = useLocation();

  return (
    <div
      style={{ height: "100vh", zIndex: "14000" }}
      className={` position-relative ${style.SidebarContainer} `}
    >
      <div
        className={`d-flex shadow  text-light py-2 align-items-center ${style.sidebar} `}
      >
        <h2 className="px-2">Admin</h2>
        <Button
          close
          size="sm"
          color="light"
          className="ms-auto d-lg-none  text-light "
          onClick={() => showMobilemenu()}
        ></Button>
      </div>

      <div className={`${style.sideBarContainer} `}>
        <div className={`${style.heightScroll} pt-3 `}>
          <Nav vertical className="sidebarNav">
            <NavItem>
              <strong> Admin </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/Profile"}
                className={
                  location.pathname === "/Admin/AdminDashboard/"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                {/* <i className="bi bi-speedometer2"></i> */}
                <img
                  src={"/profile.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Profile</span>
              </Link>
            </NavItem>

            <NavItem>
              <strong> Home </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/starter"}
                className={
                  location.pathname === "/Admin/AdminDashboard/starter"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                {/* <i className="bi bi-speedometer2"></i> */}
                <img
                  src={"/dashboard.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Dashboard</span>
              </Link>
            </NavItem>

            <NavItem>
              <strong> User </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/Users"}
                className={
                  location.pathname === "/Admin/AdminDashboard/Users"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                <img
                  src={"/users.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Users</span>
              </Link>
            </NavItem>
            <NavItem>
              <strong> Posts </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/Posts"}
                className={
                  location.pathname === "/Admin/AdminDashboard/Posts"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                <img
                  src={"/posts.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Posts</span>
              </Link>
            </NavItem>

            <NavItem>
              <strong> BumperPost </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/BumperPost"}
                className={
                  location.pathname === "/Admin/AdminDashboard/BumperPost"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                <img
                  src={"/bumperPost.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Pinned Posts</span>
              </Link>
            </NavItem>
            <NavItem>
              <strong> Reported </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/ReportRequests"}
                className={
                  location.pathname === "/Admin/AdminDashboard/ReportRequests"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                <img
                  src={"/bumperPost.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Report Requests</span>
              </Link>
            </NavItem>
            <NavItem>
              <strong> Notification </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/sendnotification"}
                className={
                  location.pathname === "/Admin/AdminDashboard/sendnotification"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                <img
                  src={"/posts.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Send Notification</span>
              </Link>
            </NavItem>
            <NavItem>
              <strong> Partner </strong>{" "}
            </NavItem>
            <NavItem className="sidenav-bg">
              <Link
                to={"/Admin/AdminDashboard/addPartner"}
                className={
                  location.pathname === "/Admin/AdminDashboard/addPartner"
                    ? " text-primary bg-light fw-bold nav-link py-3 color"
                    : "nav-link text-secondary py-3"
                }
              >
                <img
                  src={"/posts.png"}
                  width={"20px"}
                  height={"20px"}
                  alt="img"
                />

                <span className="ms-3 d-inline-block">Partners</span>
              </Link>
            </NavItem>
          </Nav>
        </div>
      </div>

      <div className={style.buttonLogoutDiv}>
        <button
          onClick={() => {
            dispatch(logout());
            localStorage.removeItem("OMB_ADMIN_DATA");
            toast.success("Log Out");
            navigate("/");
          }}
          className={`sidenav-bg  ${style.logoutButton}`}
        >
          <i className="bi bi-box-arrow-left"></i>
          <span className="ms-3 d-inline-block fw-bold">LogOut</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
