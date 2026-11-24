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

// 개발 모드 전용: 실제 OAuth 대신 제공자별 체험 계정으로 서버 세션을 받습니다.
export async function demoSocialLogin(provider) {
  try {
    const session = await apiRequest("/api/users/demo-social", {
      method: "POST",
      body: JSON.stringify({ provider }),
    });
    saveServerSession(session, true);
    return { ok: true, user: publicUser(session) };
  } catch (error) {
    return { ok: false, message: error.message || "소셜 로그인에 실패했어요." };
  }
}

export async function changePassword({ currentPassword, newPassword }) {
  try {
    await apiRequest("/api/users/me/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message || "비밀번호를 변경하지 못했어요." };
  }
}

export async function clearMyData(confirmEmail) {
  try {
    await apiRequest("/api/users/me/data", {
      method: "DELETE",
      body: JSON.stringify({ confirmEmail }),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message || "데이터를 삭제하지 못했어요." };
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
