import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/ADSidebar";
import Header from "../Header/ADHeader";
import { Container } from "reactstrap";
import { useState, useEffect, useRef } from "react";
import { Loader } from "../Loader/loader";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { allusers, selecteUsers, selectAllPosts,  allPosts , selectAllPinnedPosts , allBumperPosts } from "../../Store/authSlice";
import style from "./routes.module.css"

const serverURL = process.env.REACT_APP_SERVER_URL



const FullLayout = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const storeUsers = useSelector(selecteUsers)
  const storeAllposts = useSelector(selectAllPosts)
  const storeAllBumperPosts = useSelector(selectAllPinnedPosts)

  const usersFetchedRef = useRef(storeUsers.length > 0)
  const postsFetchedRef = useRef(storeAllposts.length > 0)
  const bumperPostsFetchedRef = useRef(storeAllBumperPosts.length > 0)

  useEffect(() => {
    if (usersFetchedRef.current) return
    usersFetchedRef.current = true

    async function getuser() {
      try {
        setLoading(true)
        const response = await axios.get(`${serverURL}/api/users/get_all_users`)
        if (response?.status === 200) {
          dispatch(allusers(response.data.users))
          toast.success(response.data.message)
        }
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.message
        if (status === 401 || status === 400 || status === 500) {
          toast.error(message)
        }
      } finally {
        setLoading(false)
      }
    }

    getuser()
  }, [dispatch])

  useEffect(() => {
    if (postsFetchedRef.current) return
    postsFetchedRef.current = true

    async function getAllposts() {
      try {
        setLoading(true)
        const response = await axios.get(`${serverURL}/api/posts/get_all_posts/0`)
        if (response?.status === 200) {
          dispatch(allPosts(response.data.posts ?? []))
          toast.success(response.data.message)
        }
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.message
        if (status === 401 || status === 400 || status === 500) {
          toast.error(message)
        }
      } finally {
        setLoading(false)
      }
    }

    getAllposts()
  }, [dispatch])

  useEffect(() => {
    if (bumperPostsFetchedRef.current) return
    bumperPostsFetchedRef.current = true

    async function getAllBumperposts() {
      try {
        setLoading(true)
        const response = await axios.get(`${serverURL}/api/PinnedPosts/get_all_Pinned`)
        if (response?.status === 200) {
          dispatch(allBumperPosts(response.data.posts ?? []))
          toast.success(response.data.message)
        }
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.message
        if (status === 401 || status === 400 || status === 500) {
          toast.error(message)
        }
      } finally {
        setLoading(false)
      }
    }

    getAllBumperposts()
  }, [dispatch])



  return (
    <main>
      <div className="pageWrapper d-lg-flex">
        {/********Sidebar**********/}

        <aside className="sidebarArea shadow" id="sidebarArea">
          {<Sidebar />}
        </aside>

        {/********Content Area**********/}

        <div className="contentArea">
          {/********header**********/}
          <Header />
          {/********Middle Content**********/}
          <div className={style.containerScroll}>
            <Container style={{ padding: 0 }} className="wrapper" fluid>
              <Outlet />
            </Container>
          </div>
        </div>
      </div>
      <Loader loading={loading} />
    </main>

  );
};
export default FullLayout;
