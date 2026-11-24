import {
  apiRequest,
  clearServerSession,
  getServerSession,
  saveServerSession,
} from "./apiClient";

function publicUser(session) {
  return {
    email: session.email,
    userId: session.userId,
    nickname: session.nickname,
  };
}

export function getCurrentUser() {
  const session = getServerSession();
  return session ? publicUser(session) : null;
}

export async function registerAccount({ email, userId, nickname, password }) {
  try {
    const session = await apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify({ email, userId, nickname, password }),
    });
    saveServerSession(session, true);
    return { ok: true, user: publicUser(session) };
  } catch (error) {
    return { ok: false, message: error.message || "회원가입에 실패했어요." };
  }
}

export async function loginAccount({ userId, password, remember }) {
  try {
    const session = await apiRequest("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ userId, password }),
    });
    saveServerSession(session, remember);
    return { ok: true, user: publicUser(session) };
  } catch (error) {
    return { ok: false, message: error.message || "로그인에 실패했어요." };
  }
}

export function logoutAccount() {
  const session = getServerSession();
  clearServerSession();
  if (session?.token) {
    fetch("/api/users/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
    }).catch(() => undefined);
  }
}
