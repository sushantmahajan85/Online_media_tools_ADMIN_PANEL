import React, { useState, useEffect, useRef } from "react";
import style from "./ui.module.css";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader/loader";
import imageCompression from "browser-image-compression";

const serverURL = process.env.REACT_APP_SERVER_URL;

export function AddPartner() {
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [partners, setPartners] = useState([]);
  const [btntext, setBtntext] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [loading, setloading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchPartners() {
      setloading(true);
      try {
        const res = await axios.get(`${serverURL}/api/users/allpartners`);
        setPartners(res.data.allpartners || []);
      } catch {
        toast.error("Failed to fetch partners");
      } finally {
        setloading(false);
      }
    }
    fetchPartners();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setloading(true);
    const formData = new FormData();
    formData.append("link", link);
    formData.append("description", description);
    formData.append("btntext", btntext);

    if (logo) {
      const compressed = await imageCompression(logo, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      formData.append("logo", compressed);
    }

    try {
      const res = await axios.post(`${serverURL}/api/users/addpartner`, formData);
      if (res?.status === 201) {
        toast.success(res.data.message);
        setLink("");
        setLogo(null);
        setLogoPreview(null);
        setDescription("");
        setBtntext("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        // refresh list
        const updated = await axios.get(`${serverURL}/api/users/allpartners`);
        setPartners(updated.data.allpartners || []);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add partner");
    } finally {
      setloading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await axios.delete(`${serverURL}/api/users/delpartner/${id}`);
      if (res?.status === 200) {
        toast.success(res.data.message);
        setPartners((prev) => prev.filter((p) => p._id !== id));
      }
    } catch {
      toast.error("Failed to delete partner");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.description || "").toLowerCase().includes(q) ||
      (p.link || "").toLowerCase().includes(q)
    );
  });

  const canSubmit = link.trim() && description.trim() && !loading;

  return (
    <>
      <div className={style.apPage}>
        <div className={style.apLayout}>

          {/* ── Add Partner Form ── */}
          <div className={style.apFormCard}>
            <div className={style.apFormHeader}>
              <div className={style.apFormIcon}>
                <i className="bi bi-plus-circle-fill" />
              </div>
              <div>
                <h2 className={style.apFormTitle}>Add Partner</h2>
                <p className={style.apFormSub}>Fill in the details to add a new partner</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={style.apForm}>
              {/* Logo upload */}
              <div className={style.apField}>
                <label className={style.apLabel}>
                  <i className="bi bi-image" />
                  Partner Logo
                </label>
                <div
                  className={style.apDropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo preview" className={style.apLogoPreview} />
                  ) : (
                    <div className={style.apDropPlaceholder}>
                      <i className="bi bi-cloud-arrow-up" style={{ fontSize: 28, color: "#9ca3af" }} />
                      <span className={style.apDropText}>Click to upload logo</span>
                      <span className={style.apDropHint}>PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleLogoChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                {logoPreview && (
                  <button
                    type="button"
                    className={style.apRemoveLogo}
                    onClick={() => { setLogo(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    <i className="bi bi-x" /> Remove
                  </button>
                )}
              </div>

              {/* Description */}
              <div className={style.apField}>
                <label className={style.apLabel} htmlFor="ap-desc">
                  <i className="bi bi-text-paragraph" />
                  Description
                </label>
                <textarea
                  id="ap-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the partner…"
                  className={style.apTextarea}
                  rows={3}
                  required
                />
              </div>

              {/* Link */}
              <div className={style.apField}>
                <label className={style.apLabel} htmlFor="ap-link">
                  <i className="bi bi-link-45deg" />
                  Link URL
                </label>
                <input
                  id="ap-link"
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  className={style.apInput}
                  required
                />
              </div>

              {/* Button text */}
              <div className={style.apField}>
                <label className={style.apLabel} htmlFor="ap-btn">
                  <i className="bi bi-cursor-text" />
                  Button Label
                </label>
                <input
                  id="ap-btn"
                  type="text"
                  value={btntext}
                  onChange={(e) => setBtntext(e.target.value)}
                  placeholder="e.g. Visit Partner"
                  className={style.apInput}
                />
              </div>

              <button type="submit" disabled={!canSubmit} className={style.apSubmit}>
                {loading ? (
                  <><span className={style.apSpinner} /> Adding…</>
                ) : (
                  <><i className="bi bi-plus-lg" /> Add Partner</>
                )}
              </button>
            </form>
          </div>

          {/* ── Partners List ── */}
          <div className={style.apListCard}>
            <div className={style.apListHeader}>
              <div>
                <h2 className={style.apListTitle}>Current Partners</h2>
                <p className={style.apListSub}>{partners.length} partner{partners.length !== 1 ? "s" : ""} listed</p>
              </div>
              <div className={style.apListSearchWrap}>
                <i className={`bi bi-search ${style.apListSearchIcon}`} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={style.apListSearch}
                />
              </div>
            </div>

            <div className={style.apPartnerList}>
              {filtered.length === 0 && (
                <div className={style.apEmpty}>
                  <i className="bi bi-people" style={{ fontSize: 36, opacity: 0.2 }} />
                  <p>{search ? "No partners match your search." : "No partners yet."}</p>
                </div>
              )}

              {filtered.map(({ _id, link, description, logo, btntext }) => (
                <div key={_id} className={style.apPartnerCard}>
                  <div className={style.apPartnerLeft}>
                    {logo ? (
                      <img src={logo} alt="logo" className={style.apPartnerLogo} />
                    ) : (
                      <div className={style.apPartnerLogoFallback}>
                        <i className="bi bi-building" />
                      </div>
                    )}
                    <div className={style.apPartnerInfo}>
                      <p className={style.apPartnerDesc}>{description || "—"}</p>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={style.apPartnerLink}
                      >
                        <i className="bi bi-box-arrow-up-right" />
                        {link?.length > 45 ? link.slice(0, 45) + "…" : link}
                      </a>
                      {btntext && (
                        <span className={style.apPartnerBtnLabel}>
                          <i className="bi bi-cursor" /> {btntext}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={style.apDeleteBtn}
                    onClick={() => handleDelete(_id)}
                    disabled={deletingId === _id}
                    type="button"
                    title="Delete partner"
                  >
                    {deletingId === _id
                      ? <span className={style.apSpinnerRed} />
                      : <i className="bi bi-trash3" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Loader loading={loading} />
    </>
  );
}
