import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import 'react-toastify/scss/main.scss';
import style from "./login.module.css";
import { useDispatch } from 'react-redux';
import { login } from '../../Store/authSlice';
import CryptoJS from 'crypto-js';

const serverURL = process.env.REACT_APP_SERVER_URL;
const secretEnKey = process.env.REACT_APP_SECRET_ENC_KEY;

export function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const encryptUserData = (data, secretKey) =>
    CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();

  async function loginUser(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${serverURL}/api/admin/login`, loginData);
      if (response?.status === 200) {
        setLoading(false);
        toast.success('Successfully signed in');
        const admin = encryptUserData(response.data.admin, secretEnKey);
        localStorage.setItem('OMB_ADMIN_DATA', JSON.stringify({
          admin,
          expiration: response.data.admin.sessionExpiration,
        }));
        dispatch(login(response.data.admin));
        navigate('/Admin');
      }
    } catch (error) {
      setLoading(false);
      const status = error?.response?.status;
      if (status === 400 || status === 401 || status === 500) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to login");
      }
    }
  }

  return (
    <>
      <div className={style.page}>
        <div className={style.card}>
          {/* Logo */}
          <div className={style.logoWrap}>
            <i className="bi bi-hexagon-fill" />
          </div>

          <p className={style.appName}>Affiliatechatbox</p>
          <h2 className={style.heading}>Admin Sign In</h2>
          <p className={style.sub}>Enter your credentials to continue.</p>

          <form onSubmit={loginUser} className={style.form} noValidate>
            {/* Email */}
            <div className={style.fieldGroup}>
              <label className={style.label} htmlFor="loginEmail">Email address</label>
              <div className={style.inputWrap}>
                <i className={`bi bi-envelope ${style.inputIcon}`} />
                <input
                  required
                  type="email"
                  id="loginEmail"
                  name="email"
                  placeholder="admin@example.com"
                  value={loginData.email}
                  onChange={handleInputChange}
                  className={style.input}
                />
              </div>
            </div>

            {/* Password */}
            <div className={style.fieldGroup}>
              <label className={style.label} htmlFor="loginPassword">Password</label>
              <div className={style.inputWrap}>
                <i className={`bi bi-lock ${style.inputIcon}`} />
                <input
                  required
                  id="loginPassword"
                  name="password"
                  type={inputVisible ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={handleInputChange}
                  className={style.input}
                />
                <button
                  type="button"
                  className={style.eyeBtn}
                  onClick={() => setInputVisible(!inputVisible)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${inputVisible ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className={style.submitBtn} disabled={loading}>
              {loading
                ? <><span className={style.btnSpinner} /> Signing in…</>
                : <><i className="bi bi-box-arrow-in-right" /> Sign In</>
              }
            </button>
          </form>

          <p className={style.footerNote}>
            Affiliatechatbox Admin Panel &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {loading && (
        <div className={style.backdrop}>
          <div className={style.spinner} />
        </div>
      )}
    </>
  );
}
