import api from "./axios";

export interface User{
    id: number;
    name: string;
    email: string;
    role: "applicant" | "admin";
}