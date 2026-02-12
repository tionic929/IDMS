import api from "./axios";

export const apiLogin = async (email: string, password: string) => {
  const res = await api.post("/login", { email, password });
  if (res.data?.token) {
    localStorage.setItem("auth_token", res.data.token);
  }
  return res;
};

export const fetchUser = async () => {
  return await api.get("/user");
};

export const apiLogout = async () => {
  try {
    await api.post("/logout");
  } finally {
    localStorage.removeItem("auth_token");
  }
};
