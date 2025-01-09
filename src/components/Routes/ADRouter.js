import { UserDetailpage } from "../Pages/userDetailPage";
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { Users } from "../Pages/users";
import { PrivateRouteAdmin } from "./PrivateRouteAdmin";
import { PinnedPost } from "../Pages/PinnedPosts";
import { Posts } from "../Pages/Posts";
import { UserPosts } from "../Pages/userPosts";
import { UserChats } from "../Pages/chats";
import { Chat } from "../Pages/chatPage";
// import { AdminChatPage } from "../Pages/chatPageAdmin";
// import { AdminChats } from "../Pages/chatsAdmin";
import { AdminDetailpage } from "../Pages/AdminDetailPage";
import { ReportRequests } from "../Pages/ReportRequests";
import { SendNotification } from "../Pages/sendNotification";
import { AddPartner } from "../Pages/addPartner";
import {AllChats} from "../Pages/AllChats"
const FullLayout = lazy(() => import("./ADFullLayout"));
const Starter = lazy(() => import("../Home/Starter"));
export const ThemeRoutes = [
  {
    path: "/",
    element: <FullLayout />,
    children: [
      { path: "/", element: <Navigate to="AdminDashboard/starter" /> },
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

      // { path: "AdminDashboard/AdminChats", exact: true, element: <PrivateRouteAdmin element={<AdminChats />} /> },
      // { path: "AdminDashboard/AdminChats/:id/:chatId/Chat", element: <PrivateRouteAdmin element={<AdminChatPage />} /> },

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
