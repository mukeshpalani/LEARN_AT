import { logoutUser, startLogin } from "@/const";
import { auth } from "@/firebase";
import { trpc } from "@/lib/trpc";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const utils = trpc.useUtils();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [utils]);

  const state = useMemo(() => {
    let user: any = null;
    if (meQuery.data) {
      user = meQuery.data;
    } else if (firebaseUser) {
      // Check stored role or default to user
      const storedRole = localStorage.getItem(`role_${firebaseUser.uid}`) || "user";
      user = {
        id: 1,
        openId: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Learner",
        email: firebaseUser.email,
        phoneNumber: firebaseUser.phoneNumber,
        loginMethod: "firebase",
        role: storedRole,
      };
    }

    return {
      user,
      loading: authInitializing || (Boolean(firebaseUser) && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [authInitializing, firebaseUser, meQuery.data, meQuery.error, meQuery.isLoading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;

    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [redirectOnUnauthenticated, redirectPath, state.loading, state.user]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
