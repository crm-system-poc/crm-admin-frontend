export type Lead = {
    id: string;
    customerName: string;
    contactPerson?: string;
    email?: string;
    phoneNumber?: string;
    requirementDetails?: string;
    status: "new" | "follow-up" | "proposal" | "negotiation" | "won" | "lost";
    source?: string; // e.g., "other"
    priority?: "low" | "medium" | "high";
    estimatedValue?: number;
    createdBy?: { name?: string; email?: string; id?: string };
    createdAt?: string;
    updatedAt?: string;
  };
  
  export type Paginated<T> = {
    success: boolean;
    data: T[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  