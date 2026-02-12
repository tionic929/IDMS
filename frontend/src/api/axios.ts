// src/api/axios.ts
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

export const getCsrfToken = async () => {
  return await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
};

export default api;