import React, { useState } from "react";
import style from "./ui.module.css";
import { toast } from "react-toastify";
import axios from "axios";

const serverURL = process.env.REACT_APP_SERVER_URL;

export function SendNotification() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false); // Loader state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loader

    const formData = { title, body };

    try {
      let response = await axios.post(
        `${serverURL}/api/admin/sendManualNotification`,
        formData
      );

      if (response && response.status === 200) {
        toast.success(response.data.message);
        setTitle("");
        setBody("");
      }
    } catch (error) {
      if (error && error.response) {
        if (error.response.status === 401) {
          toast.warning(error.response.data.message);
        } else if (error.response.status === 409) {
          toast.info(error.response.data.message);
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error("Failed to send notification");
      }
    } finally {
      setLoading(false); // Stop loader
    }
  };

  return (
    <>
      <div className={`p-2 text-light ${style.Sheading}`}>
        <h2 className={style.Heading}>Send Manual App Notification</h2>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="title"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Title:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="body"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Body:
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={150} // Restricts the input to 150 characters
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            <span style={{ color: body.length >= 150 ? "red" : "black" }}>
              {body.length}/150
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading} // Disable button while loading
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </>
  );
}
