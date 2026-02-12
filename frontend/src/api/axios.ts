// src/api/axios.ts
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: false,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
