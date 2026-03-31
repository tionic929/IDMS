export interface Students {
  id: number;
  has_card: boolean;
  application_status?: string;
  id_number: string;
  first_name: string;
  middle_initial: string;
  last_name: string;
  manual_full_name?: string;
  course: string;
  email?: string;
  address: string;
  guardian_name: string;
  guardian_contact: string;
  id_picture: string;
  signature_picture: string;
  payment_proof?: string;
  formatted_time: string;
  formatted_date: string;
  created_at: string;
  updated_at?: string;
  is_archived?: boolean;
  archived_at?: string | null;
  reissuance_reason?: string;
}

export interface StudentResponse {
  data: Students | Students[];
}

export interface PaginatedResponse {
  current_page: number;
  data: Students[];
  last_page: number;
  per_page: number;
  total: number;
}

export const getFullName = (student: Students): string => {
  return `${student.first_name.trim()}
            ${student.middle_initial ? " " + student.middle_initial.trim() : ""}
            ${student.last_name.trim()}`;
}