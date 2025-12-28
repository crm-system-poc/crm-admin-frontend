import { api } from "./api";

export interface OEMPayload {
  name: string;
  email?: string;
  contactNumber?: string;
  contactPerson?: string;
  isActive?: boolean;
}

export const getOEMs = () => api.get("/api/oems");
export const createOEM = (data: OEMPayload) => api.post("/api/oems", data);
export const updateOEM = (id: string, data: OEMPayload) => api.put(`/api/oems/${id}`, data);
export const deleteOEM = (id: string) => api.delete(`/api/oems/${id}`);
