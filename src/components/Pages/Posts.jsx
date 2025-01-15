import React, { useEffect } from "react";
import style from "./ui.module.css";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader/loader";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAllPosts,
  updatePostStatus,
  addPinnedPosts,
  selectAllPinnedPosts,
} from "../../Store/authSlice";
import { Button } from "reactstrap";
import { DeleteModel } from "./DeleteModel";
import { EditPost } from "./EditPost";
// import { messaging } from "../../firebase";
// import imageCompression from 'browser-image-compression';

const serverURL = process.env.REACT_APP_SERVER_URL;

export function Posts() {
  // const [selectedOption, setSelectedOption] = useState('Select..');

  const dispatch = useDispatch();
  const StorePosts = useSelector(selectAllPosts);
  const StorePinnedPosts = useSelector(selectAllPinnedPosts);
  const [loading, setloading] = useState(false);
  // const [Myfile, setMyfile] = useState(false);
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);
  const [deltedId, setDeletedId] = useState("");
  const [deleteWhatUsers, setdeleteWhatUsers] = useState("");
  const [pContent, setpContent] = useState();
  // const [postId, setPostId] = useState('')
  // // console.log(StorePosts);
  const [modalEdit, setmodalEdit] = useState(false);
  // const toggleEdit = () => setmodalEdit(!modal);
  const [postData, setpostData] = useState();
  const [TotalPinned, setTotalPinned] = useState(0);

  useEffect(() => {
    let MyPinnedPosts = 0;
    StorePinnedPosts.forEach((userobjects) => {
      if (userobjects.isPinnedT === true) {
        MyPinnedPosts++;
      }
    });
    setTotalPinned(MyPinnedPosts);
  }, [StorePinnedPosts]);
  // // console.log(TotalPinned);

  return (
    <>
      {/* <button onClick={async () => {
           try {
            await messaging.requestPermission();
            console.log('Notification permission granted.');
            const token = await messaging.getToken();
            console.log('Token:', token);
        } catch (err) {
            console.error('Unable to get permission to notify.', err);
        }
             
            // const message = {
            //     notification: {
            //         title: "Notif",
            //         body: 'This is a Test Notification okay'
            //     },
            //     token: "dDhpuiwnS5eLnjKWt-Zjls:APA91bE_3jWCeUM1wSRbGSre-6pLGO2z4K4VtEvq114ezM2YJRMVaLyoULMY116nkJx9rXpNLEgSDuz7k1LyuEMnuj3jLL2VWVRRX34tARxBJJl3pH2r4HRZs2TXQ_NhWvfPPSLWSUcJ",
            // };
            // messaging.sendToDevice(message.token, message)
            //     .then((response) => {
            //         // Response is an array of message IDs sent to the device.
            //         console.log('Successfully sent message:', response);
            //     })
            //     .catch((error) => {
            //         console.log('Error sending message 11111:', error);
            //     });
            // messaging.send(message)
            //     .then((response) => {
            //         // Response is a message ID string.
            //         console.log('Successfully sent message:', response);
            //     })
            //     .catch((error) => {
            //         console.log('Error sending message:', error);
            //     });
        // try {
        //         const fcmEndpoint = 'https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send';
        //         const fcmAccessToken = 'Bearer ya29.ElqKBGN2Ri_Uz...PbJ_uNasm';
        //         // const fcmAccessToken = 'Bearer eyBTrmHDRtOCXPcE1-N_y_:APA91bFNgjnbPOx1Oj-p9L-inI14n0Wkbb09FshCKRQC9airic_c0Q2EQxZ_3wqJtRXEYYPId08dDsi8jAdsdLQu0wDtAtOnK_OfI4VSRvFqEMAdOOd8TlZq8VKkucwtAs72etdrW5wU';

        //         // Replace <token of destination app> with the actual FCM token of the destination app
        //         const destinationToken = 'dDhpuiwnS5eLnjKWt-Zjls:APA91bE_3jWCeUM1wSRbGSre-6pLGO2z4K4VtEvq114ezM2YJRMVaLyoULMY116nkJx9rXpNLEgSDuz7k1LyuEMnuj3jLL2VWVRRX34tARxBJJl3pH2r4HRZs2TXQ_NhWvfPPSLWSUcJ';

        //         const notificationPayload = {
        //             "message": {
        //                 "token": destinationToken,
        //                 "notification": {
        //                     "title": "FCM Message",
        //                     "body": "This is a message from FCM okayy"
        //                 },
        //                 "webpush": {
        //                     "headers": {
        //                         "Urgency": "high"
        //                     },
        //                     "notification": {
        //                         "body": "This is a message from FCM to web",
        //                         "requireInteraction": true,
        //                         "badge": "/events.png"
        //                     }
        //                 }
        //             }
        //         };

        //         const axiosConfig = {
        //             headers: {
        //                 'Content-Type': 'application/json',
        //                 'Authorization': fcmAccessToken,
        //             },
        //         };

        //         const notify = await axios.post(fcmEndpoint, notificationPayload, axiosConfig)
        //         if (notify.status === 200) {
        //             console.log(notify)
        //             console.log(notify.data)
        //         }
        //     } catch (error) {
        //         console.log(error)
        //     }
        }} className="p-2 border border-danger ">
            Add notification
        </button>
        <div className={`p-2  text-light ${style.Sheading} `}>
            <h2 className={style.Heading}>
                All Post
            </h2>
        </div> */}

      {/* <input type="file" name="" id="" onChange={(e) => { setMyfile(e.target.files[0]) }} />
        <button onClick={async () => {

            try {

                setloading(true)

                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(Myfile, options);
                // console.log("compressed file");
                // console.log(compressedFile);


                const formData = new FormData()
                formData.append("postContent", "2 do not do any action on it")
                formData.append("postMedia", compressedFile)
                let response = await axios.post(`${serverURL}/api/posts/654f545cb80a37a368e19597/posts/add_post`, formData)

                if (response && response.status === 200) {
                    setloading(false)
                    toast.success(response.data.message)
                    // console.log(response.data.post);
                    // dispatch(addNewPosts(response.data.newPost))
                }


            } catch (error) {
                setloading(false)
                if (error) {
                    if (error.response) {
                        // console.log(error.response.data);
                        // console.log(error.response.status);
                        toast.error(error.response.data.message);
                    } else {
                        toast.error("Failed to Add Post ");
                    }
                }

            }
        }} className={style.buttonDisApprove} >Add Post </button> */}

      {StorePosts && StorePosts.length > 0 ? (
        <div className="my-2 p-2">
          <div className={style.containerContent}>
            <div className={style.HeadingContent}>
              <div className="row gap-2">
                <div className="col  d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Media</h2>
                </div>
                <div className="col  d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Content</h2>
                </div>

                <div className="col  d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Posted by</h2>
                </div>
                <div className="col  d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Posted Date</h2>
                </div>
                <div className="col  d-flex align-items-center justify-content-center">
                  <h2 className="fw-bold fs-5">Status</h2>
                </div>
                {/* <div className="col  d-flex align-items-center justify-content-center">
                                <h2 className="fw-bold fs-5">LinkedIn</h2>
                            </div> */}
              </div>
            </div>
            {StorePosts.map((post, index) => {
              return (
                <div key={index} className={style.Content}>
                  <div className="row gap-2 p-2 ">
                    <div className="row gap-2 p-1 ">
                      {post.postMediaUrl ? (
                        <div className="col  d-flex align-items-center justify-content-center ">
                          <div>
                            <img
                              src={post.postMediaUrl}
                              alt="PostMedia"
                              style={{ borderRadius: "1rem" }}
                              width={"120rem"}
                              height={"120rem"}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="col  d-flex align-items-center justify-content-center">
                          <h2 className="fw-medium fs-6 text-muted">
                            No media
                          </h2>
                        </div>
                      )}
                      <div className="col d-flex align-items-center justify-content-center ">
                        <h2 className="fw-medium fs-6">{post.postContent}</h2>
                      </div>

                      <div className="col d-flex align-items-center justify-content-center">
                        <h2 className="fw-medium fs-6">{post.userName}</h2>
                      </div>
                      <div className="col d-flex align-items-center justify-content-center">
                        <h2 className="fw-medium fs-6">
                          {post.PostCreated
                            ? post.PostCreated.slice(0, 15)
                            : "NaN"}
                        </h2>
                      </div>
                      <div className="col d-flex align-items-center justify-content-center">
                        {post.underApproval ? (
                          <span className="fw-bold fs-6 text-warning">
                            Pending
                          </span>
                        ) : (
                          <div>
                            {post.isApproved ? (
                              <span className="fw-bold fs-6 text-success">
                                Approved
                              </span>
                            ) : (
                              <span className="fw-bold fs-6 text-danger">
                                Disapproved
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="row gap-2 p-1">
                      <div className="col d-flex align-items-center justify-content-center">
                        {/* approve disapprove button */}
                        <button
                          onClick={async () => {
                            try {
                              setloading(true);
                              let response = await axios.post(
                                `${serverURL}/api/posts/${post._id}/Approve_post`,
                                { appproveStatus: post.isApproved }
                              );

                              if (response && response.status === 200) {
                                setloading(false);
                                toast.success(response.data.message);
                                dispatch(
                                  updatePostStatus({
                                    _id: post._id,
                                    post: response.data.post,
                                  })
                                );
                              }
                            } catch (error) {
                              setloading(false);
                              if (error) {
                                if (error.response) {
                                  // console.log(error.response.data);
                                  // console.log(error.response.status);
                                  toast.error(error.response.data.message);
                                } else {
                                  toast.error("Failed to Update Post Status");
                                }
                              }
                            }
                          }}
                          className={
                            post.isApproved
                              ? style.buttonDisApprove
                              : style.buttonApprove
                          }
                        >
                          {" "}
                          {post.isApproved ? "Disapprove" : "Approve"}{" "}
                        </button>
                      </div>

                      {/* add to pinned posts */}
                      <div className="col d-flex align-items-center justify-content-start">
                        <button
                          onClick={async () => {
                            if (post.isPinned) {
                              toast.info("Already Added");
                              return;
                            }

                            try {
                              setloading(true);
                              let response = await axios.post(
                                `${serverURL}/api/PinnedPosts/${post._id}/add_Pinned_post`,
                                { TotalPinned }
                              );

                              if (response && response.status === 200) {
                                setloading(false);
                                toast.success(response.data.message);
                                // console.log("response aya");
                                // console.log(response.data.newBumperpost);
                                dispatch(
                                  addPinnedPosts({
                                    postId: post._id,
                                    NewBumperPost: response.data.newBumperpost,
                                    TotalPinned,
                                  })
                                );
                              }
                            } catch (error) {
                              setloading(false);
                              if (error) {
                                if (error.response) {
                                  if (error.response.status === 401) {
                                    toast.warning(error.response.data.message);
                                  } else if (error.response.status === 409) {
                                    toast.info(error.response.data.message);
                                  } else {
                                    // console.log(error.response.data);
                                    // console.log(error.response.status);
                                    toast.error(error.response.data.message);
                                  }
                                } else {
                                  toast.error("Failed to Add Post to Bumper");
                                }
                              }
                            }
                          }}
                          className={
                            post.isPinned ? style.buttonAdded : style.buttonAdd
                          }
                        >
                          {" "}
                          {post.isPinned ? "Added" : "Add to pinned posts"}{" "}
                        </button>
                      </div>
                      {/* edit post button */}
                      <div
                        onClick={() => {
                          setmodalEdit(true);
                          setpostData(post);
                        }}
                        style={{ cursor: "pointer" }}
                        className="col d-flex align-items-center  justify-content-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          fill="currentColor"
                          className="bi bi-pencil-square"
                          viewBox="0 0 16 16"
                        >
                          <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                          <path
                            fillRule="evenodd"
                            d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
                          />
                        </svg>
                      </div>
                      {/* delete post button */}
                      <div className="col d-flex align-items-center justify-content-center">
                        <Button
                          className="Reject"
                          onClick={() => {
                            setDeletedId(post._id);
                            setModal(!modal);
                            setdeleteWhatUsers("Post");
                            setpContent(
                              " Are you sure you want to Delete  this Post? This action cannot be undone."
                            );
                          }}
                        >
                          <i className="bi bi-trash3"></i>
                        </Button>
                      </div>

                      {/* add to linked in button */}
                      <div className="col d-flex align-items-center justify-content-center">
                        <button
                          onClick={async () => {
                            try {
                              setloading(true);
                              let response = await axios.post(
                                `https://online-media-tools-server-vercel.vercel.app/api/posts/${post._id}/admin-Linkedin`
                              );

                              if (response && response.status === 200) {
                                setloading(false);
                                toast.success(response.data.message);
                                dispatch(
                                  updatePostStatus({
                                    _id: post._id,
                                    post: response.data.post,
                                  })
                                );
                              }
                            } catch (error) {
                              setloading(false);
                              if (error) {
                                if (error.response) {
                                  // console.log(error.response.data);
                                  // console.log(error.response.status);
                                  toast.error(error.response.data.message);
                                } else {
                                  toast.error(
                                    "Failed to add post to linkedin."
                                  );
                                }
                              }
                            }
                          }}
                          className={
                            post.addedToAdminLinkedin
                              ? style.buttonDisApprove
                              : style.buttonApprove
                          }
                        >
                          {" "}
                          {post.addedToAdminLinkedin
                            ? "Already on LinkedIn"
                            : "Add to LinkedIn"}{" "}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className=" text-xl d-flex  align-items-center my-5 justify-content-center">
          <p className="text-center center fw-bolder ">No Posts Found</p>
        </div>
      )}

      <DeleteModel
        modal={modal}
        setModal={setModal}
        toggle={toggle}
        pContent={pContent}
        deleteWhat={deleteWhatUsers}
        deltedId={deltedId}
        setDeletedId={setDeletedId}
      />

      <EditPost
        modalEdit={modalEdit}
        postData={postData}
        setmodalEdit={setmodalEdit}
      />

      <Loader loading={loading} />
    </>
  );
}
