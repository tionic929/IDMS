// src/api/axios.ts
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  withXSRFToken: true,  
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

// Add XSRF token to every request
api.interceptors.request.use((config) => {
  const xsrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
  }

  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Export helper for CSRF cookie
export const getCsrfCookie = async () => {
  return await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
    withCredentials: true
  });
};

export default api;