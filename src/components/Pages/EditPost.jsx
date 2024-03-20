import React, { useEffect, useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { Loader } from "../Loader/loader";
import { useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { updatePost } from "../../Store/authSlice";
import imageCompression from "browser-image-compression";

const serverURL = process.env.REACT_APP_SERVER_URL;

export function EditPost(props) {
  const dispatch = useDispatch();
  const [NewPost, setNewPost] = useState();
  const [Myfile, setMyfile] = useState("");
  const [loading, setloading] = useState(false);

  useEffect(() => {
    setNewPost(props.postData);
  }, [props.postData]);
  const toggle = () => props.setmodalEdit(!props.modalEdit);

  const handelSubmit = async (e) => {
    e.preventDefault();

    // // console.log("aya")
    toggle();
    setloading(true);
    //  // console.log(Myfile);

    const formData = new FormData();
    formData.append("postContent", NewPost.postContent);
    formData.append("postDescription", NewPost.postDescription);
    formData.append("tag", NewPost.tag);
    if (Myfile) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(Myfile, options);
      // // console.log(compressedFile);
      formData.append("postMedia", compressedFile);
    }
    // formData.append("PostCreated", NewPost.PostCreated)
    try {
      let response = await axios.post(
        `${serverURL}/api/posts/${NewPost._id}/edit_post`,
        formData
      );

      if (response && response.status === 200) {
        setloading(false);
        toast.success(response.data.message);
        // // console.log(response.data.updatedPost);
        dispatch(updatePost(response.data.updatedPost));
      }
    } catch (error) {
      setloading(false);
      if (error) {
        if (error.response) {
          // // console.log(error.response.data);
          // // console.log(error.response.status);
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to Update Post ");
        }
      }
    }
    setNewPost("");
  };
  return (
    <>
      <div>
        <Modal
          centered
          zIndex={105000}
          isOpen={props.modalEdit}
          toggle={toggle}
        >
          {NewPost ? (
            <div>
              <ModalHeader toggle={props.toggleEdit}>
                {" "}
                <span className="fw-bold">Edit Post</span>
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handelSubmit}>
                  <div className=" p-1 col">
                    <div className="my-2  fw-bolder">
                      <label htmlFor="postMedia">Post Media</label>
                    </div>
                    <input
                      type="file"
                      onChange={(e) => {
                        setMyfile(e.target.files[0]);
                      }}
                      style={{
                        width: "100%",
                        boxShadow: ` 3px 3px 4px rgba(0, 0, 0, 0.2)`,
                      }}
                      className=" rounded p-1 "
                      name="postMedia"
                      id="postMedia"
                    />
                  </div>

                  {/* <div style={{ width: "100%" }} className='  p-1'>
                                <div className='my-2 fw-bolder'>
                                    <label htmlFor="PostCreated">Post Created</label>
                                </div>
                                <input required type="text" value={NewPost.PostCreated} onChange={(e) => {
                                    setNewPost((pre) => ({ ...pre, PostCreated: e.target.value }))
                                }} style={{ width: "100%", boxShadow: ` 3px 3px 4px rgba(0, 0, 0, 0.2)` }} className=' rounded p-1 ' name='PostCreated' id='PostCreated' />
                            </div> */}

                  <div className="col p-1">
                    <div className="my-2 fw-bolder ">
                      <label htmlFor="postContent">Post Content</label>
                    </div>
                    <textarea
                      required
                      name="postContent"
                      onChange={(e) => {
                        setNewPost((pre) => ({
                          ...pre,
                          postContent: e.target.value,
                        }));
                      }}
                      value={NewPost.postContent}
                      id="postContent"
                      rows="3"
                      style={{
                        width: "100%",
                        boxShadow: ` 3px 3px 4px rgba(0, 0, 0, 0.2)`,
                      }}
                      className="border-0 rounded p-1 "
                    />
                    {/* <input type="t" placeholder='' name='postContent' id='postContent' /> */}
                  </div>
                  <div className="col p-1">
                    <div className="my-2 fw-bolder ">
                      <label htmlFor="postDescription">Post Description</label>
                    </div>
                    <textarea
                      name="postDescription"
                      onChange={(e) => {
                        setNewPost((pre) => ({
                          ...pre,
                          postDescription: e.target.value,
                        }));
                      }}
                      value={NewPost.postDescription}
                      id="postContent"
                      rows="3"
                      style={{
                        width: "100%",
                        boxShadow: ` 3px 3px 4px rgba(0, 0, 0, 0.2)`,
                      }}
                      className="border-0 rounded p-1 "
                    />
                    {/* <input type="t" placeholder='' name='postContent' id='postContent' /> */}
                  </div>
                  <div className="col p-1">
                    <div className="my-2 fw-bolder ">
                      <label htmlFor="postDescription">
                        Tag (options - blank, buy or sell)
                      </label>
                    </div>
                    <input
                      name="tag"
                      onChange={(e) => {
                        setNewPost((pre) => ({
                          ...pre,
                          tag: e.target.value.toString().toLowerCase(),
                        }));
                      }}
                      value={NewPost.tag}
                      id="tag"
                      rows="3"
                      style={{
                        width: "100%",
                        boxShadow: ` 3px 3px 4px rgba(0, 0, 0, 0.2)`,
                      }}
                      className="border-0 rounded p-1 "
                    />
                    {/* <input type="t" placeholder='' name='postContent' id='postContent' /> */}
                  </div>
                  <ModalFooter>
                    <Button color="light" onClick={toggle}>
                      Cancel
                    </Button>{" "}
                    <Button type="submit" color="success">
                      Update
                    </Button>
                  </ModalFooter>
                </form>
              </ModalBody>
            </div>
          ) : (
            <div className="p-2  text-center ">Loading...</div>
          )}
        </Modal>
      </div>

      <Loader loading={loading} />
    </>
  );
}
