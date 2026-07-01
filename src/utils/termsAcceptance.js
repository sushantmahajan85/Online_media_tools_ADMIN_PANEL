const TERMS_VERSION = "2023-11-25";
const STORAGE_KEY = `admin-terms-accepted:${TERMS_VERSION}`;

export function hasAcceptedAdminTerms() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAdminTermsAccepted() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
