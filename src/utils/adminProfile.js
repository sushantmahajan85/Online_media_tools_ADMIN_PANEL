/** Primary support account used for member-facing admin chat in the main app */
export const PRIMARY_SUPPORT_ADMIN_ID = "658c582ff1bc8978d2300823";

export function getAdminMongoUserId(adminAuth) {
  if (!adminAuth) return null;
  return adminAuth.mongoUserId || adminAuth.mongoProfile?._id || null;
}

/** Mongo user id(s) that represent this admin panel login in chat rooms */
export function getAdminChatIdentityIds(adminAuth) {
  if (!adminAuth) return [];
  const ids = new Set();
  const mongoUserId = getAdminMongoUserId(adminAuth);
  if (mongoUserId) ids.add(String(mongoUserId));
  if (!isSecondaryAdmin(adminAuth)) {
    ids.add(PRIMARY_SUPPORT_ADMIN_ID);
  }
  return [...ids];
}

export function isAdminChatParticipant(adminAuth, participantIds = []) {
  const adminIds = getAdminChatIdentityIds(adminAuth);
  if (!adminIds.length || !participantIds.length) return false;
  return participantIds.some((pid) => adminIds.includes(String(pid)));
}

export function getAdminChatParticipantId(adminAuth, participantIds = []) {
  return participantIds.find((pid) =>
    getAdminChatIdentityIds(adminAuth).includes(String(pid)),
  );
}

/** Admin account id in an admin↔user chat room (for secondary admin replies) */
export function getAdminUserChatSupportId(
  participantIds = [],
  adminIds = new Set([PRIMARY_SUPPORT_ADMIN_ID]),
) {
  return (
    participantIds.find((pid) => adminIds.has(String(pid))) ||
    PRIMARY_SUPPORT_ADMIN_ID
  );
}

export function getAdminRole(adminAuth, profileUser) {
  return profileUser?.role || adminAuth?.role || null;
}

export function isSecondaryAdmin(adminAuth, profileUser) {
  return getAdminRole(adminAuth, profileUser) === "secondary_admin";
}

/** Mongo user id whose profile the logged-in admin panel account should display */
export function getAdminProfileTargetId(adminAuth, profileUser = null) {
  if (!adminAuth) return null;
  if (isSecondaryAdmin(adminAuth, profileUser)) {
    return getAdminMongoUserId(adminAuth);
  }
  return getAdminMongoUserId(adminAuth) || PRIMARY_SUPPORT_ADMIN_ID;
}

export function resolveAdminProfileUser(adminAuth, storeUsers = []) {
  if (!adminAuth) return null;

  const targetId = getAdminProfileTargetId(adminAuth);

  if (targetId && storeUsers.length > 0) {
    const fromStore = storeUsers.find(
      (u) => String(u._id) === String(targetId),
    );
    if (fromStore) return fromStore;
  }

  if (adminAuth.mongoProfile) {
    if (
      !targetId ||
      String(adminAuth.mongoProfile._id) === String(targetId)
    ) {
      return adminAuth.mongoProfile;
    }
  }

  if (adminAuth.adminemail && storeUsers.length > 0) {
    const email = adminAuth.adminemail.toLowerCase();
    const byEmail = storeUsers.find(
      (u) => u.email?.toLowerCase() === email,
    );
    if (byEmail) return byEmail;
  }

  if (!isSecondaryAdmin(adminAuth) && storeUsers.length > 0) {
    const primary = storeUsers.find(
      (u) => String(u._id) === PRIMARY_SUPPORT_ADMIN_ID,
    );
    if (primary) return primary;
  }

  return null;
}

export function getAdminRoleLabel(role) {
  if (role === "secondary_admin") return "Secondary Administrator";
  if (role === "admin") return "Administrator";
  return "Administrator";
}

export function getAdminBearerToken(adminAuth) {
  return adminAuth?.jwtadmintoken || null;
}

export const SECONDARY_ADMIN_HOME_PATH = "/Admin/AdminDashboard/Chats";
export const SECONDARY_ADMIN_USER_CHATS_PATH =
  "/Admin/AdminDashboard/AdminChats";
export const PRIMARY_ADMIN_HOME_PATH = "/Admin/AdminDashboard/starter";

export function getSecondaryAllChatLink(chatId) {
  return `${SECONDARY_ADMIN_HOME_PATH}/${chatId}`;
}

export function getSecondaryAdminUserChatLink(chatId) {
  return `${SECONDARY_ADMIN_USER_CHATS_PATH}/${chatId}`;
}

export function isPrimaryAdminChatRoute(pathname) {
  const normalized = (pathname || "").replace(/\/+$/, "") || "/";
  return /^\/Admin\/AdminDashboard\/UserDetails\/[^/]+\/UserChats/.test(
    normalized,
  );
}

export function isSecondaryAdminChatRoute(pathname) {
  const normalized = (pathname || "").replace(/\/+$/, "") || "/";

  if (
    normalized === SECONDARY_ADMIN_HOME_PATH ||
    normalized === SECONDARY_ADMIN_USER_CHATS_PATH
  ) {
    return true;
  }

  return (
    /^\/Admin\/AdminDashboard\/Chats\/[^/]+$/.test(normalized) ||
    /^\/Admin\/AdminDashboard\/AdminChats\/[^/]+$/.test(normalized)
  );
}

export function isAdminRouteAllowed(adminAuth, pathname) {
  if (isSecondaryAdmin(adminAuth)) {
    return isSecondaryAdminChatRoute(pathname);
  }
  return (
    !isPrimaryAdminChatRoute(pathname) && !isSecondaryAdminChatRoute(pathname)
  );
}

export function getAdminRouteRedirect(adminAuth) {
  return isSecondaryAdmin(adminAuth)
    ? SECONDARY_ADMIN_HOME_PATH
    : PRIMARY_ADMIN_HOME_PATH;
}

export function getAdminHomePath(adminAuth) {
  return getAdminRouteRedirect(adminAuth);
}
