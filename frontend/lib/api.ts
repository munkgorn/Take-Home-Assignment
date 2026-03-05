import { getSession } from "next-auth/react";
import { Meeting, PaginatedResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.accessToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.accessToken}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "An error occurred");
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export async function getMeetings(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();
  return apiClient<PaginatedResponse<Meeting>>(
    `/meetings${query ? `?${query}` : ""}`
  );
}

export async function getMeeting(id: string) {
  return apiClient<Meeting>(`/meetings/${id}`);
}

export async function createMeeting(data: Partial<Meeting>) {
  return apiClient<Meeting>("/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMeeting(id: string, data: Partial<Meeting>) {
  return apiClient<Meeting>(`/meetings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: string) {
  return apiClient<void>(`/meetings/${id}`, { method: "DELETE" });
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
}) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Registration failed" }));
    throw new Error(error.message || "Registration failed");
  }
  return res.json();
}
