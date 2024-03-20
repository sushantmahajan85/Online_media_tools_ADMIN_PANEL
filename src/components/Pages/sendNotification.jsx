import React from "react";
import style from "./ui.module.css";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const serverURL = process.env.REACT_APP_SERVER_URL;
export function SendNotification() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // const [loading, setloading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you can handle form submission, for now just log the values
    console.log("Title:", title);
    console.log("Body:", body);
    const formData = { title, body };
    try {
      // setloading(true);
      let response = await axios.post(
        `${serverURL}/api/admin/sendManualNotification`,
        formData
      );

      if (response && response.status === 200) {
        // setloading(false);
        toast.success(response.data.message);
        setTitle("");
        setBody("");
        // console.log("response aya");
        // console.log(response.data.newBumperpost);
        // dispatch(
        //   addPinnedPosts({
        //     postId: pst._id,
        //     NewBumperPost: response.data.newBumperpost,
        //     TotalPinned,
        //   })
        // );
      }
    } catch (error) {
      // setloading(false);
      // Reset form fields
      setTitle("");
      setBody("");
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
          toast.error("Failed to send notification");
        }
      }
    }
  };
  return (
    <>
      <div className={`p-2  text-light ${style.Sheading} `}>
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
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "none",
          }}
        >
          Send
        </button>
      </form>
    </>
  );
}
