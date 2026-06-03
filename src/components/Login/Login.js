import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/scss/main.scss";
import style from "./login.module.css";
import { useDispatch } from "react-redux";
import { login } from "../../Store/authSlice";
import CryptoJS from "crypto-js";

const serverURL = process.env.REACT_APP_SERVER_URL;
const secretEnKey = process.env.REACT_APP_SECRET_ENC_KEY;

function maskEmailForDisplay(email) {
  if (!email || !email.includes("@")) return "your email";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${local.length > 2 ? "***" : "*"}@${domain}`;
}

function completeAdminLogin(dispatch, navigate, adminData) {
  const admin = CryptoJS.AES.encrypt(
    JSON.stringify(adminData),
    secretEnKey,
  ).toString();
  localStorage.setItem(
    "OMB_ADMIN_DATA",
    JSON.stringify({
      admin,
      expiration: adminData.sessionExpiration,
    }),
  );
  dispatch(login(adminData));
  navigate("/Admin");
}

export function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [step, setStep] = useState("credentials");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
  };

  async function loginUser(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${serverURL}/api/admin/login`, loginData);
      if (response?.status === 200) {
        if (response.data.requiresOtp) {
          setOtpToken(response.data.otpToken);
          setMaskedEmail(maskEmailForDisplay(loginData.email));
          setOtp("");
          setStep("otp");
          toast.success(response.data.message || "Verification code sent");
          if (response.data._devCode) {
            console.info("[dev] Admin login OTP:", response.data._devCode);
          }
        } else if (response.data.admin) {
          toast.success("Successfully signed in");
          completeAdminLogin(dispatch, navigate, response.data.admin);
        }
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 400 || status === 401 || status === 500) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit verification code");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${serverURL}/api/admin/verify-login-otp`, {
        otpToken,
        otp,
      });
      if (response?.status === 200 && response.data.admin) {
        toast.success("Successfully signed in");
        completeAdminLogin(dispatch, navigate, response.data.admin);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 400 || status === 401 || status === 500) {
        toast.error(error.response.data.message);
        if (status === 401 && error.response.data.message?.includes("expired")) {
          setStep("credentials");
          setOtpToken("");
          setOtp("");
        }
      } else {
        toast.error("Failed to verify code");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!otpToken) return;
    try {
      setLoading(true);
      const response = await axios.post(`${serverURL}/api/admin/resend-login-otp`, {
        otpToken,
      });
      toast.success(response.data.message || "Code resent");
      if (response.data._devCode) {
        console.info("[dev] Admin login OTP:", response.data._devCode);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        toast.error(error.response.data.message);
        setStep("credentials");
        setOtpToken("");
        setOtp("");
      } else {
        toast.error(error.response?.data?.message || "Failed to resend code");
      }
    } finally {
      setLoading(false);
    }
  }

  function backToCredentials() {
    setStep("credentials");
    setOtp("");
    setOtpToken("");
    setMaskedEmail("");
  }

  return (
    <>
      <div className={style.page}>
        <div className={style.card}>
          <div className={style.logoWrap}>
            <i className="bi bi-hexagon-fill" />
          </div>

          <p className={style.appName}>Affiliatechatbox</p>

          {step === "credentials" ? (
            <>
              <h2 className={style.heading}>Admin Sign In</h2>
              <p className={style.sub}>Enter your credentials to continue.</p>

              <form onSubmit={loginUser} className={style.form} noValidate>
                <div className={style.fieldGroup}>
                  <label className={style.label} htmlFor="loginEmail">
                    Email address
                  </label>
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

                <div className={style.fieldGroup}>
                  <label className={style.label} htmlFor="loginPassword">
                    Password
                  </label>
                  <div className={style.inputWrap}>
                    <i className={`bi bi-lock ${style.inputIcon}`} />
                    <input
                      required
                      id="loginPassword"
                      name="password"
                      type={inputVisible ? "text" : "password"}
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
                      <i className={`bi ${inputVisible ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                </div>

                <button type="submit" className={style.submitBtn} disabled={loading}>
                  {loading ? (
                    <>
                      <span className={style.btnSpinner} /> Signing in…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right" /> Sign In
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className={style.heading}>Verify your email</h2>
              <p className={style.sub}>
                Enter the 6-digit code sent to{" "}
                <strong>{maskedEmail}</strong>
              </p>

              <form onSubmit={verifyOtp} className={style.form} noValidate>
                <div className={style.fieldGroup}>
                  <label className={style.label} htmlFor="loginOtp">
                    Verification code
                  </label>
                  <div className={style.inputWrap}>
                    <i className={`bi bi-shield-lock ${style.inputIcon}`} />
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      id="loginOtp"
                      name="otp"
                      placeholder="000000"
                      value={otp}
                      onChange={handleOtpChange}
                      className={`${style.input} ${style.otpInput}`}
                      maxLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={style.submitBtn}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className={style.btnSpinner} /> Verifying…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle" /> Verify &amp; Sign In
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={style.secondaryBtn}
                  onClick={resendOtp}
                  disabled={loading}
                >
                  Resend code
                </button>

                <button
                  type="button"
                  className={style.linkBtn}
                  onClick={backToCredentials}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-left" /> Back to sign in
                </button>
              </form>
            </>
          )}

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
