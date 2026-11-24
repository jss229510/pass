import { apiRequest } from "./apiClient";

export function saveUserState(stateKey, value) {
  return apiRequest(`/api/my/state/${stateKey}`, {
    method: "PUT",
    body: JSON.stringify(value),
  });
}

export async function loadUserState(stateKey) {
  return apiRequest(`/api/my/state/${stateKey}`);
}
