
export interface ImportedReportsPayload{
    id: number,
    id_number: string,
    name: string,
    course: string,
    formatted_date?: string;
}
export interface PaginatedResponse{
    data: ImportedReportsPayload[];
    current_page: number;
    last_page: number;
    total: number,
    per_page: number,
}