import axios from "axios";

export const USER_EXPORT_EXCLUDE = [
  "jwttoken",
  "token",
  "webFcmToken",
  "linkedInAccessToken",
  "phoneOtpHash",
  "deleteAccountOtpHash",
  "phoneOtpExpiresAt",
  "deleteAccountOtpExpiresAt",
  "phoneOtpPendingNumber",
  "sessionExpiration",
];

export function toCsvValue(value) {
  if (value === null || value === undefined) return "";
  let str;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === "object") {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(rows, { exclude = [], order = [] } = {}) {
  if (!rows || rows.length === 0) return "";
  const excludeSet = new Set(exclude);
  const seen = new Set();
  const keys = [];
  for (const row of rows) {
    for (const key of Object.keys(row || {})) {
      if (!seen.has(key) && !excludeSet.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }
  const ordered = [
    ...order.filter((key) => seen.has(key)),
    ...keys.filter((key) => !order.includes(key)),
  ];
  const header = ordered.map(toCsvValue).join(",");
  const body = rows.map((row) => ordered.map((key) => toCsvValue(row?.[key])).join(","));
  return [header, ...body].join("\r\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function omitKeys(obj, keys) {
  const out = { ...obj };
  for (const key of keys) delete out[key];
  return out;
}

export function normalizeUserForExport(user) {
  if (!user) return {};
  const raw = typeof user.toObject === "function" ? user.toObject() : { ...user };
  const cleaned = omitKeys(raw, [...USER_EXPORT_EXCLUDE, "__v"]);
  if (cleaned._id != null) {
    cleaned.userId = String(cleaned._id);
    delete cleaned._id;
  }
  if (cleaned.isDeleted) cleaned.accountStatus = "deleted";
  else if (cleaned.isSuspended) cleaned.accountStatus = "suspended";
  else cleaned.accountStatus = "active";
  return cleaned;
}

export function getPostExportStatus(post) {
  if (post.underApproval) return "pending";
  if (post.isApproved) return "approved";
  return "disapproved";
}

export function normalizePostForExport(post) {
  if (!post) return {};
  const raw = typeof post.toObject === "function" ? post.toObject() : { ...post };
  const out = { post_status: getPostExportStatus(raw) };
  for (const [key, value] of Object.entries(raw)) {
    if (key === "__v") continue;
    if (key === "_id") {
      out.postId = String(value);
      continue;
    }
    out[`post_${key}`] = value;
  }
  return out;
}

export function buildAlignedExportRows(users, posts) {
  const postsByUserId = new Map();
  for (const post of posts) {
    const uid = String(post.userId || "");
    if (!postsByUserId.has(uid)) postsByUserId.set(uid, []);
    postsByUserId.get(uid).push(post);
  }

  const rows = [];
  const seenUserIds = new Set();

  for (const user of users) {
    const userFields = normalizeUserForExport(user);
    const userId = String(userFields.userId || user._id || "");
    seenUserIds.add(userId);
    const userPosts = postsByUserId.get(userId) || [];

    if (userPosts.length === 0) {
      rows.push({ recordType: "profile", ...userFields });
      continue;
    }

    for (const post of userPosts) {
      rows.push({ recordType: "post", ...userFields, ...normalizePostForExport(post) });
    }
  }

  for (const post of posts) {
    const userId = String(post.userId || "");
    if (seenUserIds.has(userId)) continue;
    rows.push({ recordType: "post", ...normalizePostForExport(post) });
  }

  return rows;
}

const ALIGNED_EXPORT_ORDER = [
  "recordType",
  "userId",
  "firstName",
  "lastName",
  "email",
  "mobileNumber",
  "accountStatus",
  "postId",
  "post_status",
  "post_postContent",
  "post_postDescription",
  "post_tag",
  "post_isApproved",
  "post_underApproval",
  "post_BumpTime",
  "post_PostCreated",
];

export function buildAlignedExportCsv(users, posts) {
  const rows = buildAlignedExportRows(users, posts);
  if (rows.length === 0) return "";
  return buildCsv(rows, { order: ALIGNED_EXPORT_ORDER });
}

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

/** ISO 3166-1 alpha-2 from "IN", "🇮🇳", or similar stored flag values. */
export function normalizeCountryCode(flag) {
  if (!flag) return null;
  const trimmed = String(flag).trim();
  if (!trimmed) return null;

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const codePoints = Array.from(trimmed).map((char) => char.codePointAt(0) ?? 0);
  if (
    codePoints.length === 2 &&
    codePoints.every(
      (cp) => cp >= REGIONAL_INDICATOR_BASE && cp <= REGIONAL_INDICATOR_END
    )
  ) {
    return String.fromCharCode(
      ...codePoints.map((cp) => cp - REGIONAL_INDICATOR_BASE + 65)
    );
  }

  return null;
}

export function formatCountryForExport(flagOrCode) {
  const iso = normalizeCountryCode(flagOrCode) || (flagOrCode ? String(flagOrCode).trim() : "");
  if (!iso) return "";
  try {
    if (/^[A-Z]{2}$/.test(iso)) {
      const name = new Intl.DisplayNames(["en"], { type: "region" }).of(iso);
      return name ? `${name} (${iso})` : iso;
    }
  } catch {
    /* fall through */
  }
  return iso;
}

function userDisplayNameForExport(user) {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return full || "";
}

function formatAccountForExport(user) {
  const parts = [];
  if (user?.isGoogleVerified) parts.push("Google");
  if (user?.isLinkedinVerified) parts.push("LinkedIn");
  return parts.join("; ");
}

function formatJoinedForExport(user) {
  const raw =
    user?.createdAt ?? user?.created_at ?? user?.joinedAt ?? user?.joined_at;
  let ms = null;
  if (raw) {
    const t = new Date(raw).getTime();
    if (!Number.isNaN(t)) ms = t;
  }
  if (ms == null) {
    const id = user?._id;
    if (typeof id === "string" && id.length === 24 && /^[a-f0-9]+$/i.test(id)) {
      const sec = parseInt(id.slice(0, 8), 16);
      if (!Number.isNaN(sec)) ms = sec * 1000;
    }
  }
  if (ms == null) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatusForExport(user) {
  if (!user?.firstName) return "";
  if (user.isDeleted) return "Deleted";
  if (user.isSuspended) return "Banned";
  return "Active";
}

/**
 * Matches the users table columns, plus Country and Phone Number.
 * Country prefers the user's phone-country `flag`, then latest login country.
 */
export function buildUsersInfoExportRows(users, loginCountriesByUserId = {}) {
  return (users || []).map((user) => {
    const userId = String(user?._id || user?.userId || "");
    const countrySource =
      user?.flag || loginCountriesByUserId[userId] || "";
    return {
      Name: userDisplayNameForExport(user),
      Email: user?.email || "",
      Account: formatAccountForExport(user),
      IP: user?.ipAddress || "",
      Device: user?.device || "",
      Joined: formatJoinedForExport(user),
      Status: formatStatusForExport(user),
      Country: formatCountryForExport(countrySource),
      "Phone Number": user?.mobileNumber || "",
    };
  });
}

const USERS_INFO_EXPORT_ORDER = [
  "Name",
  "Email",
  "Account",
  "IP",
  "Device",
  "Joined",
  "Status",
  "Country",
  "Phone Number",
];

export function buildUsersInfoExportCsv(users, loginCountriesByUserId = {}) {
  const rows = buildUsersInfoExportRows(users, loginCountriesByUserId);
  if (rows.length === 0) return "";
  return buildCsv(rows, { order: USERS_INFO_EXPORT_ORDER });
}

export function buildSingleUserExportRows(user, posts, loginHistory) {
  const userFields = normalizeUserForExport(user);
  const rows = [];

  for (const post of posts || []) {
    rows.push({ recordType: "post", ...userFields, ...normalizePostForExport(post) });
  }

  for (const entry of loginHistory || []) {
    rows.push({
      recordType: "login",
      ...userFields,
      login_ip: entry.ip,
      login_country: entry.country,
      login_method: entry.method,
      login_loggedInAt: entry.loggedInAt || entry.createdAt,
    });
  }

  if (rows.length === 0) {
    rows.push({ recordType: "profile", ...userFields });
  }

  return rows;
}

const SINGLE_USER_EXPORT_ORDER = [
  "recordType",
  "userId",
  "firstName",
  "lastName",
  "email",
  "mobileNumber",
  "accountStatus",
  "isverified",
  "isSuspended",
  "isDeleted",
  "postId",
  "post_status",
  "post_postContent",
  "post_postDescription",
  "post_tag",
  "login_ip",
  "login_country",
  "login_method",
  "login_loggedInAt",
];

export function buildSingleUserExportCsv(user, posts, loginHistory) {
  const rows = buildSingleUserExportRows(user, posts, loginHistory);
  if (rows.length === 0) return "";
  return buildCsv(rows, { order: SINGLE_USER_EXPORT_ORDER });
}

export async function fetchAllLoginHistory(serverURL, userId) {
  const limit = 100;
  let page = 1;
  let all = [];
  let totalPages = 1;

  do {
    const res = await axios.get(`${serverURL}/api/users/${userId}/login-history`, {
      params: { page, limit },
    });
    all = all.concat(res.data?.history || []);
    totalPages = res.data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

const CHAT_EXPORT_ORDER = [
  "userId",
  "userName",
  "chatId",
  "chatPartnerId",
  "chatPartnerName",
  "chatPartnerEmail",
  "chatPartnerStatus",
  "messageId",
  "senderId",
  "senderName",
  "receiverId",
  "message",
  "timestamp",
  "type",
  "imageUrl",
  "fileUrl",
  "fileType",
  "isRead",
];

/**
 * Full chat history for a user (all conversations, every message oldest→newest).
 * Uses admin Firestore export — not conversation lastMessage previews.
 */
export async function fetchUserChatExportRows(serverURL, userId, userName) {
  const res = await axios.get(
    `${serverURL}/api/admin/chats/export/${encodeURIComponent(userId)}`
  );
  const rows = res.data?.messages || [];

  if (!rows.length) return [];

  // Ensure subject display name is present even if backend fell back to id.
  return rows.map((row) => ({
    ...row,
    userName: row.userName || userName || "",
  }));
}

export function buildChatExportCsv(rows) {
  if (!rows.length) return "";
  return buildCsv(rows, { order: CHAT_EXPORT_ORDER });
}
