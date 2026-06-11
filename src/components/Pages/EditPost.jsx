import React, { useEffect, useRef, useState } from "react";
import { Modal } from "reactstrap";
import { Loader } from "../Loader/loader";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { updatePost, selectAdmin } from "../../Store/authSlice";
import imageCompression from "browser-image-compression";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;

const TAG_OPTIONS = [
  { value: "", label: "None" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
];

export function EditPost({ modalEdit, postData, setmodalEdit }) {
  const dispatch = useDispatch();
  const admin = useSelector(selectAdmin);
  const [newPost, setNewPost] = useState(null);
  const [myFile, setMyFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setloading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setNewPost(postData || null);
    setMyFile(null);
    setPreview(null);
  }, [postData]);

  const toggle = () => setmodalEdit(!modalEdit);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMyFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toggle();
    setloading(true);

    const formData = new FormData();
    formData.append("postContent", newPost.postContent);
    formData.append("postDescription", newPost.postDescription || "");
    formData.append("tag", newPost.tag || "");
    if (admin?._id) {
      formData.append("editorUserId", admin._id);
    }

    if (myFile) {
      const compressed = await imageCompression(myFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      formData.append("postMedia", compressed);
    }

    try {
      const res = await axios.post(`${serverURL}/api/posts/${newPost._id}/edit_post`, formData);
      if (res?.status === 200) {
        toast.success(res.data.message);
        dispatch(updatePost(res.data.updatedPost));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update post");
    } finally {
      setloading(false);
      setNewPost(null);
    }
  };

  return (
    <>
      <Modal centered zIndex={105000} isOpen={modalEdit} toggle={toggle}>
        <div className={style.epModal}>
          {/* Header */}
          <div className={style.epHeader}>
            <div className={style.epHeaderLeft}>
              <div className={style.epHeaderIcon}>
                <i className="bi bi-pencil-square" />
              </div>
              <div>
                <h2 className={style.epHeaderTitle}>Edit Post</h2>
                <p className={style.epHeaderSub}>Update post details below</p>
              </div>
            </div>
            <button className={style.epCloseBtn} onClick={toggle} type="button" aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Body */}
          {newPost ? (
            <form onSubmit={handleSubmit}>
              <div className={style.epBody}>

                {/* Media upload */}
                <div className={style.epField}>
                  <label className={style.epLabel}>
                    <i className="bi bi-image" />
                    Post Media
                    <span className={style.epLabelHint}>Optional — replaces current media</span>
                  </label>

                  {/* Current media preview */}
                  {(preview || newPost.postMediaUrl) && (
                    <div className={style.epCurrentMedia}>
                      <img
                        src={preview || newPost.postMediaUrl}
                        alt="media"
                        className={style.epMediaImg}
                      />
                      {preview && (
                        <span className={style.epNewBadge}>New</span>
                      )}
                    </div>
                  )}

                  <div
                    className={style.epDropZone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-cloud-arrow-up" style={{ fontSize: 22, color: "#9ca3af" }} />
                    <span className={style.epDropText}>
                      {myFile ? myFile.name : "Click to upload new media"}
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Content */}
                <div className={style.epField}>
                  <label className={style.epLabel} htmlFor="ep-content">
                    <i className="bi bi-text-paragraph" />
                    Post Content
                  </label>
                  <textarea
                    id="ep-content"
                    required
                    rows={4}
                    value={newPost.postContent || ""}
                    onChange={(e) => setNewPost((p) => ({ ...p, postContent: e.target.value }))}
                    className={style.epTextarea}
                    placeholder="Write post content…"
                  />
                </div>

                {/* Tag */}
                <div className={style.epField}>
                  <label className={style.epLabel} htmlFor="ep-tag">
                    <i className="bi bi-tag" />
                    Tag
                    <span className={style.epLabelHint}>blank, buy, or sell</span>
                  </label>
                  <div className={style.epTagRow}>
                    {TAG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${style.epTagBtn} ${(newPost.tag || "") === opt.value ? style.epTagBtnActive : ""}`}
                        onClick={() => setNewPost((p) => ({ ...p, tag: opt.value }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    id="ep-tag"
                    type="text"
                    value={newPost.tag || ""}
                    onChange={(e) => setNewPost((p) => ({ ...p, tag: e.target.value.toLowerCase() }))}
                    placeholder="or type custom tag…"
                    className={style.epInput}
                  />
                </div>

              </div>

              {/* Footer */}
              <div className={style.epFooter}>
                <button type="button" className={style.epCancelBtn} onClick={toggle}>
                  Cancel
                </button>
                <button type="submit" className={style.epSubmitBtn}>
                  <i className="bi bi-check-circle" />
                  Update Post
                </button>
              </div>
            </form>
          ) : (
            <div className={style.epLoading}>
              <span className={style.epLoadingSpinner} />
              Loading…
            </div>
          )}
        </div>
      </Modal>

      <Loader loading={loading} />
    </>
  );
}
