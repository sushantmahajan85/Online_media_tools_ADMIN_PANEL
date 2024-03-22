import React from "react";
import style from "./ui.module.css";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader/loader";
import imageCompression from "browser-image-compression";

const serverURL = process.env.REACT_APP_SERVER_URL;
export function AddPartner() {
  const [logo, setLogo] = useState(null);
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [loading, setloading] = useState(false);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setloading(true);
    // You can perform further actions here, like sending data to backend
    const formData = new FormData();
    formData.append("link", link);
    formData.append("description", description);

    if (logo) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(logo, options);
      // // console.log(compressedFile);
      formData.append("logo", compressedFile);
      console.log("Submitted Data: ", {
        logo,
        description,
        link,
      });
    }
    try {
      let response = await axios.post(
        `${serverURL}/api/users/addpartner`,
        formData
      );

      if (response && response.status === 201) {
        setloading(false);
        toast.success(response.data.message);
        // // console.log(response.data.updatedPost);
        // dispatch(updatePost(response.data.updatedPost));
      }
    } catch (error) {
      setloading(false);
      if (error) {
        if (error.response) {
          // // console.log(error.response.data);
          // // console.log(error.response.status);
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to Add partner");
        }
      }
    }
    setLink("");
    setLogo("");
    setDescription("");
  };

  return (
    <>
      <div className={`p-2  text-light ${style.Sheading} `}>
        <h2 className={style.Heading}>Add Partner</h2>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px", marginTop: "2.5rem" }}>
            Logo:
          </label>
          <input type="file" onChange={handleLogoChange} accept="image/*" />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px" }}>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", minHeight: "100px", padding: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "10px" }}>Link:</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: "blue",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
          }}
        >
          Submit
        </button>
      </form>

      <Loader loading={loading} />
    </>
  );
}
