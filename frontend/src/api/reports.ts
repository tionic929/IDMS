import api from "./axios"
import { type ImportedReportsPayload, type PaginatedResponse } from "../types/reports";

export const verifyIdNumber = async (id_number: string) => {
    const response = await api.post('/reports/verify', {
        id_number: id_number,
    });
    return response.data;
}

export const importReports = async (formData: FormData) => {
    const request = await api.post('/import', formData, {
        headers: {"Content-Type": "multipart/form-data"}
    });
    return request.data;
}

export const getImportedReports = async(
    page: number = 1,
    search: string = ''
): Promise<PaginatedResponse> => {
    const request = await api.get('/all-imported-reports', {
        params: {search: search, page: page}
    });
    return request.data;
}