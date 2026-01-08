import api from "./axios";
import type { Students, PaginatedResponse } from "../types/students";


export interface TotalApplicantsPayload{
    applicantsReport: number;
}

export const getPaginatedApplicants = async(
    search: string = '',
    page: number = 1
): Promise<PaginatedResponse> => {
    const request = await api.get('/paginated-applicants', {
        params: {search, page}
    });
    return request.data;
} 

export const getApplicantsReport = async (): Promise<TotalApplicantsPayload> => {
    const request = await api.get('/total-applicants');
    return request.data;
}
    
export const getStudents = async (): Promise<Students[]> => {
    const request = await api.get('/students');
    return request.data;
}

export const confirmApplicant = async (studentId: number): Promise<{ message: string }> => {
    const {data} = await api.post(`/confirm-applicant/${studentId}`);
    return data;
}

export const togglehasCard = async (studentId: number, field: keyof Students) => {
    const request = await api.put(`/applicant/${studentId}/toggle`, {
        field: field
    });
    return request.data;
}