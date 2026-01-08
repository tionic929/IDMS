import axios from "axios";

const api = axios.create({
  // Send requests under the /api prefix so the dev server proxy forwards them to the backend
  baseURL: "/api",
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

export default api;