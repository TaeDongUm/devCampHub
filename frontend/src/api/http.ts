// src/api/http.ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    // 인증 만료 공통 처리
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }

  // 204 No Content 대응
  const text = await res.text().catch(() => "");
  if (!text) return undefined as unknown as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // JSON 이 아닐 수도 있는 경우 방어
    return text as unknown as T;
  }
}
