import api from "./axios";

export const apiLogin = async (email: string, password: string) => {
    await api.get("https://ncnian-id.svizcarra.online/sanctum/csrf-cookie");

    return await api.post("/login", {email, password});
}

export const fetchUser = async () => {
    return await api.get("/user");
}

export const apiLogout = async () => {
    return await api.post("/logout");
}