import { type Students } from "./students";

export interface DepartmentSidebarItem {
    department: string;
    applicant_count: number;
}

export interface DepartmentDetailsResponse{
    success: boolean;
    selected_department: string;
    students: Students[];
    sidebar: DepartmentSidebarItem[];
    pagination: DepartmentsPaginatedResponse;
}

export interface DepartmentsPaginatedResponse{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    next_cursor: string;
    prev_cursor: string;
    has_more: boolean;
}