import api from "./axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "";

export const apiLogin = async (email: string, password: string) => {
    await api.get(`${apiBaseUrl}/sanctum/csrf-cookie`);

    return await api.post("/login", {email, password});
}

export const fetchUser = async () => {
    return await api.get("/user");
}

export const apiLogout = async () => {
    return await api.post("/logout");
}
