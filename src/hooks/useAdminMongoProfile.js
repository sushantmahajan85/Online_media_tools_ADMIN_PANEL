import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectAdmin, selecteUsers } from "../Store/authSlice";
import {
  getAdminBearerToken,
  getAdminProfileTargetId,
  getAdminRoleLabel,
  resolveAdminProfileUser,
  getAdminRole,
  isSecondaryAdmin,
  PRIMARY_SUPPORT_ADMIN_ID,
} from "../utils/adminProfile";

const serverURL = process.env.REACT_APP_SERVER_URL;

async function fetchMongoUserById(mongoUserId) {
  const res = await axios.get(
    `${serverURL}/api/users/get_all_users?ids=${encodeURIComponent(mongoUserId)}`,
  );
  return res.data?.users?.[0] || null;
}

async function fetchAdminProfileFromApi(token) {
  const res = await axios.get(`${serverURL}/api/admin/profile`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return res.data?.mongoUser || res.data?.admin?.mongoProfile || null;
}

export function useAdminMongoProfile() {
  const adminAuth = useSelector(selectAdmin);
  const storeUsers = useSelector(selecteUsers);
  const [fetchedProfile, setFetchedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const profileFromStore = resolveAdminProfileUser(adminAuth, storeUsers);
  const profileUser = profileFromStore || fetchedProfile;
  const mongoUserId = getAdminProfileTargetId(adminAuth, profileUser);
  const role = getAdminRole(adminAuth, profileUser);
  const roleLabel = getAdminRoleLabel(role);
  const canAccessAdminChats = !isSecondaryAdmin(adminAuth, profileUser);
  const isResolving =
    Boolean(adminAuth) && !profileUser && (!fetchAttempted || loading);

  useEffect(() => {
    if (profileFromStore) {
      setFetchedProfile(null);
      setFetchAttempted(false);
      setLoading(false);
      return;
    }

    if (!adminAuth) {
      setFetchedProfile(null);
      setFetchAttempted(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function resolveProfile() {
      const targetId = getAdminProfileTargetId(adminAuth);
      const token = getAdminBearerToken(adminAuth);

      if (targetId) {
        try {
          const byId = await fetchMongoUserById(targetId);
          if (!cancelled && byId) {
            setFetchedProfile(byId);
            return;
          }
        } catch {
          /* try next source */
        }
      }

      if (token) {
        try {
          const fromApi = await fetchAdminProfileFromApi(token);
          if (!cancelled && fromApi) {
            setFetchedProfile(fromApi);
            return;
          }
        } catch {
          /* try primary fallback for main admin */
        }
      }

      if (!isSecondaryAdmin(adminAuth) && targetId !== PRIMARY_SUPPORT_ADMIN_ID) {
        try {
          const primary = await fetchMongoUserById(PRIMARY_SUPPORT_ADMIN_ID);
          if (!cancelled && primary) {
            setFetchedProfile(primary);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (!cancelled) {
        setFetchedProfile(null);
      }
    }

    resolveProfile().finally(() => {
      if (!cancelled) {
        setFetchAttempted(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [adminAuth, profileFromStore, storeUsers.length]);

  return {
    adminAuth,
    profileUser,
    mongoUserId,
    roleLabel,
    role,
    canAccessAdminChats,
    loading: isResolving,
  };
}
