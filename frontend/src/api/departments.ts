import api from "./axios";
import { type DepartmentDetailsResponse } from "../types/departments";

export const getDepartmentsWithStudents = async (
  department: string = '',
  cursor: string | null = null,
  search: string = ''
): Promise<DepartmentDetailsResponse> => {

  const params = new URLSearchParams();

  if (department) params.append('department', department);
  if (search) params.append('search', search);
  if (cursor) params.append('cursor', cursor);

  const response = await api.get(`/get-departments?${params.toString()}`);
  return response.data;
};
