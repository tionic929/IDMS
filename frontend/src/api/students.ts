import api from "./axios";
import type { Students, PaginatedResponse } from "../types/students";

export interface TotalApplicantsPayload {
    applicantsReport: number;
    pendingCount: number;
    issuedCount: number;
}

export const getPaginatedApplicants = async (
    search: string = '',
    page: number = 1,
    status: string = '',
    sortBy: string = '',
    sortDir: string = 'asc'
): Promise<PaginatedResponse> => {
    const request = await api.get('/paginated-applicants', {
        params: {
            search,
            page,
            ...(status && { status }),
            ...(sortBy && { sort_by: sortBy, sort_dir: sortDir }),
        }
    });
    return request.data;
}

export const getArchivedApplicants = async (page: number = 1): Promise<PaginatedResponse> => {
    const request = await api.get('/archived-applicants', {
        params: { page }
    });
    return request.data;
}

export const getApplicantsReport = async (): Promise<TotalApplicantsPayload> => {
    const request = await api.get('/total-applicants');
    return request.data;
}

export const getStudents = async (): Promise<{ queueList: Students[], totalQueue: number, history: Students[] }> => {
    const request = await api.get('/students');
    return request.data;
}

export const confirmApplicant = async (studentId: number): Promise<{ message: string }> => {
    const { data } = await api.post(`/confirm/${studentId}`);
    return data;
}

export const togglehasCard = async (studentId: number, field: keyof Students) => {
    const request = await api.put(`/applicant/${studentId}/toggle`, {
        field: field
    });
    return request.data;
}

export const deleteApplicant = async (studentId: number): Promise<{ message: string }> => {
    const request = await api.delete(`/applicant/${studentId}`);
    return request.data;
}

export const archiveApplicant = async (studentId: number): Promise<{ message: string }> => {
    const request = await api.post(`/applicant/${studentId}/archive`);
    return request.data;
}