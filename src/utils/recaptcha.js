const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

export function isRecaptchaEnabled() {
  return Boolean(SITE_KEY);
}

export function loadRecaptchaScript() {
  if (!isRecaptchaEnabled()) {
    return Promise.resolve();
  }

  if (window.grecaptcha?.ready) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existing) {
      if (window.grecaptcha?.ready) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load reCAPTCHA"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      SITE_KEY
    )}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
}

export function getRecaptchaSiteKey() {
  return SITE_KEY || "";
}

export function executeRecaptchaV3(action = "admin_login_gate") {
  if (!isRecaptchaEnabled()) {
    return Promise.resolve("");
  }
  if (!window.grecaptcha?.execute || !SITE_KEY) {
    return Promise.reject(new Error("reCAPTCHA is not ready"));
  }
  return window.grecaptcha.execute(SITE_KEY, { action });
}

export function renderRecaptchaWidget(container, options = {}) {
  if (!isRecaptchaEnabled() || !container || !window.grecaptcha?.render) {
    return null;
  }

  return window.grecaptcha.render(container, {
    sitekey: SITE_KEY,
    theme: "light",
    ...options,
  });
}

export function getRecaptchaResponse(widgetId) {
  if (!isRecaptchaEnabled() || widgetId == null || !window.grecaptcha) {
    return "";
  }
  return window.grecaptcha.getResponse(widgetId) || "";
}

export function resetRecaptchaWidget(widgetId) {
  if (widgetId == null || !window.grecaptcha) return;
  window.grecaptcha.reset(widgetId);
}
