"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { User, type AuthError, signInWithCustomToken } from "firebase/auth";
import {
  type Employee,
  signInWithGoogle,
  logOut,
  onAuthStateChange,
  getAuthErrorMessage,
  getProjectIdFromCustomToken,
  isLocalhost,
  createMockUser,
  createMockEmployee,
} from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
const LAST_SIGN_IN_KEY = "lastSignInTime";

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  error: string | null;
  hadTokenThisSession: boolean;
  /** Firebase ログイン時、Server Action に渡す ID トークン取得（本番 Supabase 連携用） */
  getIdToken: () => Promise<string | null>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hadTokenThisSession, setHadTokenThisSession] = useState(false);
  const tokenProcessingRef = useRef(false);
  const mountedRef = useRef(true);

  const checkSessionTimeout = (): boolean => {
    if (typeof window === "undefined") return false;
    const lastSignInTime = localStorage.getItem(LAST_SIGN_IN_KEY);
    if (!lastSignInTime) return true;
    const elapsed = Date.now() - parseInt(lastSignInTime, 10);
    return elapsed < SESSION_TIMEOUT;
  };

  const saveSignInTime = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_SIGN_IN_KEY, Date.now().toString());
    }
  };

  const clearSignInTime = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_SIGN_IN_KEY);
    }
  };

  interface FetchEmployeeResult {
    employee: Employee | null;
    errorMessage: string | null;
  }

  const fetchEmployee = async (email: string): Promise<FetchEmployeeResult> => {
    try {
      const response = await fetch("/api/employees/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.exists) {
        return {
          employee: null,
          errorMessage: "社員マスタに登録されていないアカウントです",
        };
      }

      if (!data.authorized) {
        return {
          employee: null,
          errorMessage:
            data.message || "このダッシュボードへのアクセス権限がありません",
        };
      }

      return { employee: data.employee, errorMessage: null };
    } catch (err) {
      console.error("Failed to fetch employee:", err);
      return {
        employee: null,
        errorMessage: "社員情報の取得に失敗しました",
      };
    }
  };

  const setSessionCookie = async (
    firebaseUser: User,
    employee: Employee
  ): Promise<void> => {
    if (!process.env.NEXT_PUBLIC_TMG_PORTAL_URL) return;
    try {
      const idToken = await firebaseUser.getIdToken();
      if (!idToken) return;
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          employee: {
            employee_number: employee.employee_number,
            name: employee.name,
            email: employee.google_email,
          },
        }),
      });
      if (!res.ok) {
        console.error(
          "[SSO] セッションCookie設定失敗",
          res.status,
          await res.text()
        );
      }
    } catch (error) {
      console.error("[SSO] セッションCookie設定エラー", error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLocalhost()) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    if (
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_DEBUG_SSO === "1"
    ) {
      console.info(
        "[SSO] URL に token を検出、signInWithCustomToken を実行"
      );
    }

    setHadTokenThisSession(true);

    if (tokenProcessingRef.current) return;
    tokenProcessingRef.current = true;

    setLoading(true);

    const removeTokenFromUrl = () => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    };

    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase の初期化に失敗しました。");
      removeTokenFromUrl();
      setLoading(false);
      tokenProcessingRef.current = false;
      return;
    }

    const tokenProjectId = getProjectIdFromCustomToken(token);
    const childSiteProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (
      tokenProjectId &&
      childSiteProjectId &&
      tokenProjectId !== childSiteProjectId
    ) {
      setError(
        `Firebase プロジェクトが一致しません。トークン発行元: ${tokenProjectId}、子サイト設定: ${childSiteProjectId}。Vercel の NEXT_PUBLIC_FIREBASE_PROJECT_ID を「${tokenProjectId}」に設定してください。`
      );
      removeTokenFromUrl();
      setLoading(false);
      tokenProcessingRef.current = false;
      return;
    }

    const timeoutMs = 15000;
    const timeoutId = setTimeout(() => {
      if (typeof window === "undefined") return;
      if (new URLSearchParams(window.location.search).has("token")) {
        setError(
          "認証がタイムアウトしました。ポータルで再ログインしてください。"
        );
        setLoading(false);
        tokenProcessingRef.current = false;
      }
    }, timeoutMs);

    signInWithCustomToken(auth, token)
      .then(() => {
        clearTimeout(timeoutId);
        saveSignInTime();
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (
          process.env.NODE_ENV === "development" ||
          process.env.NEXT_PUBLIC_DEBUG_SSO === "1"
        ) {
          console.info("[SSO] signInWithCustomToken 失敗", err);
        }
        console.error("Custom token sign-in failed:", err);
        removeTokenFromUrl();
        const msg =
          err && typeof err === "object" && "code" in err
            ? getAuthErrorMessage(err as AuthError)
            : err instanceof Error
              ? err.message
              : "ポータルからのログインに失敗しました";
        setError(msg);
        setLoading(false);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        tokenProcessingRef.current = false;
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (isLocalhost()) {
      setUser(createMockUser());
      setEmployee(createMockEmployee());
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        if (!checkSessionTimeout()) {
          if (!mountedRef.current) return;
          if (typeof window !== "undefined") {
            const p = new URLSearchParams(window.location.search);
            if (p.has("token")) {
              const u = new URL(window.location.href);
              u.searchParams.delete("token");
              window.history.replaceState(
                null,
                "",
                u.pathname + u.search + u.hash
              );
            }
          }
          await logOut();
          if (!mountedRef.current) return;
          clearSignInTime();
          setUser(null);
          setEmployee(null);
          setLoading(false);
          return;
        }

        setUser(firebaseUser);

        if (firebaseUser.email) {
          const result = await fetchEmployee(firebaseUser.email);
          if (!mountedRef.current) return;
          if (result.employee) {
            setEmployee(result.employee);
            if (!mountedRef.current) return;
            await setSessionCookie(firebaseUser, result.employee);
          } else {
            await logOut();
            clearSignInTime();
            setUser(null);
            setEmployee(null);
            setError(result.errorMessage);
          }
        }

        if (!mountedRef.current) return;
        if (typeof window !== "undefined") {
          const p = new URLSearchParams(window.location.search);
          if (p.has("token")) {
            const u = new URL(window.location.href);
            u.searchParams.delete("token");
            window.history.replaceState(
              null,
              "",
              u.pathname + u.search + u.hash
            );
          }
        }
      } else {
        const hasTokenInUrl =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).has("token");
        const isProcessingToken = tokenProcessingRef.current;

        if (hasTokenInUrl || isProcessingToken) {
          if (
            process.env.NODE_ENV === "development" ||
            process.env.NEXT_PUBLIC_DEBUG_SSO === "1"
          ) {
            console.info(
              "[SSO] onAuthStateChange(null) を受信したが、token 処理中のため setUser(null) をスキップ",
              { hasTokenInUrl, isProcessingToken }
            );
          }
        } else {
          setUser(null);
          setEmployee(null);
        }
      }

      if (!tokenProcessingRef.current) {
        const hasTokenInUrl =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).has("token");
        if (firebaseUser !== null || !hasTokenInUrl) {
          setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const login = async () => {
    setError(null);
    setLoading(true);

    try {
      const firebaseUser = await signInWithGoogle();

      if (!firebaseUser.email) {
        throw new Error("メールアドレスが取得できませんでした");
      }

      const result = await fetchEmployee(firebaseUser.email);

      if (!result.employee) {
        await logOut();
        setError(result.errorMessage);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setEmployee(result.employee);
      saveSignInTime();
      if (process.env.NEXT_PUBLIC_TMG_PORTAL_URL) {
        await setSessionCookie(firebaseUser, result.employee);
      }
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code) {
        setError(getAuthErrorMessage(authError));
      } else {
        setError((err as Error).message || "ログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (process.env.NEXT_PUBLIC_TMG_PORTAL_URL) {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // セッション Cookie 削除は失敗しても続行
        }
      }
      await logOut();
      clearSignInTime();
      setUser(null);
      setEmployee(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError("ログアウトに失敗しました");
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken(false);
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        loading,
        error,
        hadTokenThisSession,
        getIdToken,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
