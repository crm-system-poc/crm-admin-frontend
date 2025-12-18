import { api } from "./api";


export const getOEMs = () => api.get("/api/oems");
export const createOEM = (data: any) => api.post("/api/oems", data);
export const updateOEM = (id: string, data: any) => api.put(`/api/oems/${id}`, data);
export const deleteOEM = (id: string) => api.delete(`/api/oems/${id}`);
