import axios from "axios";

export const api = axios.create({
  baseURL: "https://crm-backend-b8ys.onrender.com",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
