import React, { useState } from "react";
import style from "./ui.module.css";
import { toast } from "react-toastify";
import axios from "axios";

const serverURL = process.env.REACT_APP_SERVER_URL;
const MAX_BODY = 150;

export function SendNotification() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${serverURL}/api/admin/sendManualNotification`, { title, body });
      if (res?.status === 200) {
        toast.success(res.data.message);
        setTitle("");
        setBody("");
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) toast.warning(error.response.data.message);
      else if (status === 409) toast.info(error.response.data.message);
      else toast.error(error?.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const bodyRemaining = MAX_BODY - body.length;
  const isOverLimit = body.length >= MAX_BODY;
  const canSubmit = title.trim() && body.trim() && !loading;

  return (
    <div className={style.snPage}>
      <div className={style.snLayout}>

        {/* Left — form card */}
        <div className={style.snCard}>
          <div className={style.snCardHeader}>
            <div className={style.snCardIcon}>
              <i className="bi bi-bell-fill" />
            </div>
            <div>
              <h2 className={style.snCardTitle}>Push Notification</h2>
              <p className={style.snCardSub}>Send a broadcast notification to all app users</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={style.snForm}>
            {/* Title */}
            <div className={style.snField}>
              <label htmlFor="notif-title" className={style.snLabel}>
                <i className="bi bi-type" />
                Notification Title
              </label>
              <input
                id="notif-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New feature available!"
                className={style.snInput}
                required
                maxLength={80}
              />
              <span className={style.snHint}>{title.length}/80 characters</span>
            </div>

            {/* Body */}
            <div className={style.snField}>
              <label htmlFor="notif-body" className={style.snLabel}>
                <i className="bi bi-text-paragraph" />
                Message Body
              </label>
              <textarea
                id="notif-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your notification message here…"
                className={`${style.snTextarea} ${isOverLimit ? style.snTextareaOver : ""}`}
                maxLength={MAX_BODY}
                required
                rows={4}
              />
              <div className={style.snBodyMeta}>
                <span className={style.snBodyHint}>Keep it short and actionable</span>
                <span className={isOverLimit ? style.snCountOver : style.snCount}>
                  {bodyRemaining} left
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`${style.snSubmit} ${sent ? style.snSubmitSent : ""}`}
            >
              {loading ? (
                <>
                  <span className={style.snSpinner} />
                  Sending…
                </>
              ) : sent ? (
                <>
                  <i className="bi bi-check-circle-fill" />
                  Sent!
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill" />
                  Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right — preview card */}
        <div className={style.snPreviewWrap}>
          <p className={style.snPreviewLabel}>Live Preview</p>
          <div className={style.snPhone}>
            <div className={style.snPhoneNotch} />
            <div className={style.snPhoneScreen}>
              <div className={style.snNotifBubble}>
                <div className={style.snNotifApp}>
                  <div className={style.snNotifAppIcon}>
                    <i className="bi bi-app" />
                  </div>
                  <span className={style.snNotifAppName}>App</span>
                  <span className={style.snNotifTime}>now</span>
                </div>
                <div className={style.snNotifTitle}>
                  {title || <span style={{ opacity: 0.35 }}>Notification title…</span>}
                </div>
                <div className={style.snNotifBody}>
                  {body || <span style={{ opacity: 0.35 }}>Your message will appear here…</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
