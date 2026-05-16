/**
 * Joining date from API timestamps or Mongo ObjectId (fallback).
 */
export function getJoiningDateMs(user) {
  if (!user) return null;
  const raw =
    user.createdAt ??
    user.created_at ??
    user.joinedAt ??
    user.joined_at;
  if (raw) {
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const id = user._id;
  if (typeof id === "string" && id.length === 24 && /^[a-f0-9]+$/i.test(id)) {
    const sec = parseInt(id.slice(0, 8), 16);
    return Number.isNaN(sec) ? null : sec * 1000;
  }
  return null;
}

export function formatJoiningDate(user, locale) {
  const ms = getJoiningDateMs(user);
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString(locale || undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatJoiningDateTime(user, locale) {
  const ms = getJoiningDateMs(user);
  if (ms == null) return "—";
  return new Date(ms).toLocaleString(locale || undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function displayText(value, fallback = "—") {
  if (value == null || value === "") return fallback;
  return String(value);
}
