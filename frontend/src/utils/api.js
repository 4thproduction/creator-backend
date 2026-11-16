import axios from "axios";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "X-Portal-Request": "1" },
});
let generation = 0;
export const sessionGeneration = () => generation;
api.interceptors.request.use((config) => {
  if (config.method === 'post' && /\/api\/auth\/(login|logout|session\/continue)$/.test(config.url)) generation += 1;
  config.sessionGeneration = generation;
  return config;
});
api.interceptors.response.use(
  (response) => {
    if (response.data?.session) response.data.session.receivedAt = Date.now();
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.sessionGeneration === generation &&
      !error.config?.url?.endsWith("/login")
    )
      window.dispatchEvent(new Event("portal-session-expired"));
    return Promise.reject(error);
  },
);
export const notifySessionChange = () =>
  localStorage.setItem(
    "portal-session-event",
    `${Date.now()}-${Math.random()}`,
  );
export default api;
