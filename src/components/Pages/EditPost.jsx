import React, { useEffect, useRef, useState } from "react";
import { Modal } from "reactstrap";
import { Loader } from "../Loader/loader";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { updatePost, selectAdmin } from "../../Store/authSlice";
import { getAdminMongoUserId } from "../../utils/adminProfile";
import {
  formatTagsForPostDescription,
  GENERAL_POST_TYPE,
  normalizePostTag,
  normalizePostType,
  parsePostHashtags,
  STATIC_POST_TAGS,
} from "../../utils/postTags";
import imageCompression from "browser-image-compression";
import style from "./ui.module.css";

const serverURL = process.env.REACT_APP_SERVER_URL;

const POST_TYPE_OPTIONS = [
  { value: GENERAL_POST_TYPE, label: "General" },
  { value: "sell", label: "Sell" },
  { value: "buy", label: "Buy" },
];

export function EditPost({ modalEdit, postData, setmodalEdit }) {
  const dispatch = useDispatch();
  const admin = useSelector(selectAdmin);
  const [newPost, setNewPost] = useState(null);
  const [category, setCategory] = useState(GENERAL_POST_TYPE);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [myFile, setMyFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setloading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setNewPost(postData || null);
    setCategory(normalizePostType(postData?.tag));
    setSelectedTags(parsePostHashtags(postData?.postDescription));
    setCustomTagInput("");
    setTagsModalOpen(false);
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

  const toggleTag = (label) => {
    const normalized = normalizePostTag(label);
    if (!normalized) return;
    setSelectedTags((prev) =>
      prev.some((t) => normalizePostTag(t).toLowerCase() === normalized.toLowerCase())
        ? prev.filter((t) => normalizePostTag(t).toLowerCase() !== normalized.toLowerCase())
        : [...prev, label]
    );
  };

  const addCustomTag = () => {
    const normalized = normalizePostTag(customTagInput);
    if (!normalized) return;
    if (selectedTags.some((t) => normalizePostTag(t).toLowerCase() === normalized.toLowerCase())) {
      toast.info("Tag already added");
      return;
    }
    setSelectedTags((prev) => [...prev, normalized]);
    setCustomTagInput("");
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedTags.length === 0) {
      toast.error("Please add at least one tag.");
      setTagsModalOpen(true);
      return;
    }

    toggle();
    setloading(true);

    const formData = new FormData();
    formData.append("postContent", newPost.postContent);
    formData.append("postDescription", formatTagsForPostDescription(selectedTags));
    formData.append("tag", category || GENERAL_POST_TYPE);
    const editorUserId = getAdminMongoUserId(admin);
    if (editorUserId) {
      formData.append("editorUserId", editorUserId);
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
          <div className={style.epHeader}>
            <div className={style.epHeaderLeft}>
              <div className={style.epHeaderIcon}>
                <i className="bi bi-pencil-square" />
              </div>
              <div>
                <h2 className={style.epHeaderTitle}>Edit Post</h2>
                <p className={style.epHeaderSub}>Update post type, tags, and content</p>
              </div>
            </div>
            <button className={style.epCloseBtn} onClick={toggle} type="button" aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {newPost ? (
            <form onSubmit={handleSubmit}>
              <div className={style.epBody}>
                <div className={style.epField}>
                  <label className={style.epLabel}>
                    <i className="bi bi-image" />
                    Post Media
                    <span className={style.epLabelHint}>Optional — replaces current media</span>
                  </label>

                  {(preview || newPost.postMediaUrl) && (
                    <div className={style.epCurrentMedia}>
                      <img
                        src={preview || newPost.postMediaUrl}
                        alt="media"
                        className={style.epMediaImg}
                      />
                      {preview && <span className={style.epNewBadge}>New</span>}
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

                <div className={style.epField}>
                  <label className={style.epLabel} htmlFor="ep-post-type">
                    <i className="bi bi-layers" />
                    Post Type
                  </label>
                  <select
                    id="ep-post-type"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={style.epSelect}
                  >
                    {POST_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={style.epField}>
                  <label className={style.epLabel}>
                    <i className="bi bi-hash" />
                    Tags
                    <span className={style.epLabelHint}>At least one required</span>
                  </label>
                  <div className={style.epActionRow}>
                    <button
                      type="button"
                      className={`${style.epTagsBtn} ${
                        selectedTags.length > 0 ? style.epTagsBtnActive : style.epTagsBtnRequired
                      }`}
                      onClick={() => setTagsModalOpen(true)}
                    >
                      <i className="bi bi-tag-fill" />
                      {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Edit Tags"}
                      {selectedTags.length === 0 && <span className={style.epRequiredMark}>*</span>}
                    </button>
                  </div>

                  {selectedTags.length === 0 && (
                    <p className={style.epTagsWarning}>
                      At least one tag is required. Open Edit Tags and add a tag before saving.
                    </p>
                  )}

                  {selectedTags.length > 0 && (
                    <div className={style.epSelectedTags}>
                      {selectedTags.map((t) => (
                        <span key={t} className={style.epTagChip}>
                          #{normalizePostTag(t)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={style.epFooter}>
                <button type="button" className={style.epCancelBtn} onClick={toggle}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={style.epSubmitBtn}
                  disabled={selectedTags.length === 0}
                >
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

      <Modal centered zIndex={105100} isOpen={tagsModalOpen} toggle={() => setTagsModalOpen(false)}>
        <div className={style.epTagsModal}>
          <div className={style.epTagsModalHeader}>
            <div>
              <h3 className={style.epTagsModalTitle}>
                Edit Tags <span className={style.epRequiredMark}>*</span>
              </h3>
              <p className={style.epTagsModalSub}>
                At least one tag is required. Pick suggested tags or add your own.
              </p>
            </div>
            <button
              type="button"
              className={style.epCloseBtn}
              onClick={() => setTagsModalOpen(false)}
              aria-label="Close tags"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className={style.epTagsModalBody}>
            <p className={style.epTagsSectionLabel}>Suggested</p>
            <div className={style.epTagsGrid}>
              {STATIC_POST_TAGS.map((label) => {
                const isSelected = selectedTags.some(
                  (t) => normalizePostTag(t).toLowerCase() === normalizePostTag(label).toLowerCase()
                );
                return (
                  <button
                    key={label}
                    type="button"
                    className={`${style.epSuggestedTag} ${isSelected ? style.epSuggestedTagActive : ""}`}
                    onClick={() => toggleTag(label)}
                  >
                    #{normalizePostTag(label)}
                  </button>
                );
              })}
            </div>

            <p className={style.epTagsSectionLabel}>Custom tag</p>
            <div className={style.epCustomTagRow}>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="e.g. crypto, forex"
                className={style.epInput}
              />
              <button
                type="button"
                className={style.epAddTagBtn}
                onClick={addCustomTag}
                disabled={!normalizePostTag(customTagInput)}
              >
                Add
              </button>
            </div>

            {selectedTags.length > 0 && (
              <div className={style.epTagsSelectedSection}>
                <p className={style.epTagsSectionLabel}>Selected ({selectedTags.length})</p>
                <div className={style.epSelectedTags}>
                  {selectedTags.map((t) => (
                    <span key={t} className={style.epTagChipRemovable}>
                      #{normalizePostTag(t)}
                      <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
                        <i className="bi bi-x" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={style.epTagsModalFooter}>
            <button
              type="button"
              className={style.epSubmitBtn}
              onClick={() => setTagsModalOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      <Loader loading={loading} />
    </>
  );
}
