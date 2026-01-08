import api from "./axios";
import {type  DepartmentDetailsResponse } from "../types/departments";

export const getDepartmentsWithStudents = async(): Promise<DepartmentDetailsResponse> => {
    const res = await api.get('/get-departments');
    return res.data;
}