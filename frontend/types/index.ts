export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  candidateName: string;
  position: string;
  meetingType: "onsite" | "online";
  meetingLink?: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  deletedAt?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  meetings: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
