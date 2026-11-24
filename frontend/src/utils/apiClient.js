const SESSION_KEY = "housingServerSession";

const sessionStorages = () => [window.sessionStorage, window.localStorage];

export function getServerSession() {
  for (const storage of sessionStorages()) {
    try {
      const session = JSON.parse(storage.getItem(SESSION_KEY));
      if (session?.token) return session;
    } catch {
      storage.removeItem(SESSION_KEY);
    }
  }
  return null;
}

export function saveServerSession(session, remember) {
  const target = remember ? window.localStorage : window.sessionStorage;
  const other = remember ? window.sessionStorage : window.localStorage;
  target.setItem(SESSION_KEY, JSON.stringify(session));
  other.removeItem(SESSION_KEY);
}

export function clearServerSession() {
  sessionStorages().forEach((storage) => storage.removeItem(SESSION_KEY));
}

export async function apiRequest(path, options = {}) {
  const session = getServerSession();
  const headers = new Headers(options.headers);
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.detail || error.message || "요청 처리에 실패했어요.");
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(errorText || "요청 처리에 실패했어요.");
      }
      throw error;
    }
  }
  if (response.status === 204) return null;
  return response.json();
}
