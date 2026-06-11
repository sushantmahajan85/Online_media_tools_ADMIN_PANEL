import { UserDetailpage } from "../Pages/userDetailPage";
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAdmin } from "../../Store/authSlice";
import { getAdminHomePath } from "../../utils/adminProfile";
import { Users } from "../Pages/users";
import { PrivateRouteAdmin } from "./PrivateRouteAdmin";
import { PinnedPost } from "../Pages/PinnedPosts";
import { Posts } from "../Pages/Posts";
import { UserPosts } from "../Pages/userPosts";
import { UserChats } from "../Pages/chats";
import { Chat } from "../Pages/chatPage";
import { AdminDetailpage } from "../Pages/AdminDetailPage";
import { ReportRequests } from "../Pages/ReportRequests";
import { SendNotification } from "../Pages/sendNotification";
import { AddPartner } from "../Pages/addPartner";
import { AllChats } from "../Pages/AllChats";
import { SecondaryAdminChats } from "../Pages/SecondaryAdminChats";
import { SecondaryChatView } from "../Pages/SecondaryChatView";

const FullLayout = lazy(() => import("./ADFullLayout"));
const Starter = lazy(() => import("../Home/Starter"));

function AdminHomeRedirect() {
  const adminAuth = useSelector(selectAdmin);
  return <Navigate to={getAdminHomePath(adminAuth)} replace />;
}

export const ThemeRoutes = [
  {
    path: "/",
    element: <FullLayout />,
    children: [
      { path: "/", element: <AdminHomeRedirect /> },
      {
        path: "AdminDashboard/starter",
        exact: true,
        element: <PrivateRouteAdmin element={<Starter />} />,
      },
      {
        path: "AdminDashboard/Users",
        exact: true,
        element: <PrivateRouteAdmin element={<Users />} />,
      },
      {
        path: "AdminDashboard/BumperPost",
        exact: true,
        element: <PrivateRouteAdmin element={<PinnedPost />} />,
      },
      {
        path: "AdminDashboard/Posts",
        exact: true,
        element: <PrivateRouteAdmin element={<Posts />} />,
      },
      {
        path: "AdminDashboard/UserDetails/:id",
        exact: true,
        element: <PrivateRouteAdmin element={<UserDetailpage />} />,
      },
      {
        path: "AdminDashboard/UserDetails/:id/Posts",
        exact: true,
        element: <PrivateRouteAdmin element={<UserPosts />} />,
      },
      {
        path: "AdminDashboard/UserDetails/:id/UserChats",
        exact: true,
        element: <PrivateRouteAdmin element={<UserChats />} />,
      },
      {
        path: "AdminDashboard/UserDetails/:id/UserChats/:chatId/Chat",
        element: <PrivateRouteAdmin element={<Chat />} />,
      },
      {
        path: "AdminDashboard/Profile",
        exact: true,
        element: <PrivateRouteAdmin element={<AdminDetailpage />} />,
      },
      {
        path: "AdminDashboard/Chats",
        exact: true,
        element: <PrivateRouteAdmin element={<AllChats />} />,
      },
      {
        path: "AdminDashboard/Chats/:chatId",
        exact: true,
        element: <PrivateRouteAdmin element={<SecondaryChatView />} />,
      },
      {
        path: "AdminDashboard/AdminChats",
        exact: true,
        element: <PrivateRouteAdmin element={<SecondaryAdminChats />} />,
      },
      {
        path: "AdminDashboard/AdminChats/:chatId",
        exact: true,
        element: <PrivateRouteAdmin element={<SecondaryChatView />} />,
      },
      {
        path: "AdminDashboard/ReportRequests",
        exact: true,
        element: <PrivateRouteAdmin element={<ReportRequests />} />,
      },
      {
        path: "AdminDashboard/sendnotification",
        exact: true,
        element: <PrivateRouteAdmin element={<SendNotification />} />,
      },
      {
        path: "AdminDashboard/addPartner",
        exact: true,
        element: <PrivateRouteAdmin element={<AddPartner />} />,
      },
    ],
  },
];
