import { type Students } from "./students";

export interface DepartmentWithStudents{
    department: string;
    applicant_count: number;
    students: Students[];
}

export interface DepartmentDetailsResponse{
    success: boolean;
    total_departments: number;
    data: DepartmentWithStudents[];
}