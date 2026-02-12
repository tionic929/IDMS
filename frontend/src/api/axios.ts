import axios from "axios";

const isLocal = window.location.hostname === "localhost";

const apiBaseUrl = import.meta.env.VITE_API_URL || (isLocal 
  ? "http://localhost:8000" 
  : "https://dashboard-ncnian-id.svizcarra.online");

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json",
  },
});

export const getCsrfToken = async () => {
  return await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
};

export default api;