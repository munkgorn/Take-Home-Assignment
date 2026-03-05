import axios from "axios";
import { getSession } from "next-auth/react";
import { Meeting, PaginatedResponse } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

export default api;

// --- Meetings ---

export async function getMeetings(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get<PaginatedResponse<Meeting>>("/meetings", {
    params,
  });
  return data;
}

export async function getMeetingsByRange(params: {
  startDate: string;
  endDate: string;
  status?: string;
}) {
  const { data } = await api.get<PaginatedResponse<Meeting>>("/meetings", {
    params,
  });
  return data;
}

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingMeetings: {
    id: string;
    title: string;
    candidateName: string;
    startTime: string;
    endTime: string;
  }[];
}

export async function checkMeetingOverlap(params: {
  start: string;
  end: string;
  excludeId?: string;
}) {
  const { data } = await api.get<OverlapResult>("/meetings/check-overlap", {
    params,
  });
  return data;
}

export async function getMeeting(id: string) {
  const { data } = await api.get<Meeting>(`/meetings/${id}`);
  return data;
}

export async function createMeeting(body: Partial<Meeting>) {
  const { data } = await api.post<Meeting>("/meetings", body);
  return data;
}

export async function updateMeeting(id: string, body: Partial<Meeting>) {
  const { data } = await api.put<Meeting>(`/meetings/${id}`, body);
  return data;
}

export async function deleteMeeting(id: string) {
  await api.delete(`/meetings/${id}`);
}

// --- Auth ---

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await api.put<{ message: string }>(
    "/auth/change-password",
    body
  );
  return data;
}

export async function register(body: {
  email: string;
  password: string;
  name: string;
}) {
  const { data } = await api.post("/auth/register", body);
  return data;
}
