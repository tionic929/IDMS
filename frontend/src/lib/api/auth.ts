import api, { getCsrfCookie } from "./axios";

export const apiLogin = async (email: string, password: string) => {
    await getCsrfCookie();  // ✅ Clean and correct
    return await api.post("/login", {email, password});
}

export const fetchUser = async () => {
    return await api.get("/user");
}

export const apiLogout = async () => {
    return await api.post("/logout");
}