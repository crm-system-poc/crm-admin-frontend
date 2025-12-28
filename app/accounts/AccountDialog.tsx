"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Account = {
  _id?: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  alternateNumber: string;
  location: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  editData?: Partial<Account>;
  onSuccess: () => void;
}

export function AccountDialog({ open, onClose, editData, onSuccess }: Props) {
  const [form, setForm] = useState<Account>({
    customerName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    alternateNumber: "",
    location: "",
  });

  useEffect(() => {
    if (editData) setForm(prev => ({ ...prev, ...editData }));
  }, [editData]);

  const getErrorMessage = (err: unknown) => {
    if (!err) return "Failed";
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      const response = e["response"] as Record<string, unknown> | undefined;
      const data = response?.["data"] as Record<string, unknown> | undefined;
      const nestedErr = data?.["error"] as string | undefined;
      if (typeof nestedErr === "string") return nestedErr;
      const msg = e["message"] as string | undefined;
      if (typeof msg === "string") return msg;
    }
    return "Failed";
  };

  const submit = async () => {
    const url = editData && editData._id ? `/api/accounts/${editData._id}` : "/api/accounts";

    try {
      if (editData && editData._id) {
        await api.put(url, form, { withCredentials: true });
      } else {
        await api.post(url, form, { withCredentials: true });
      }
      toast.success("Account saved");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit Account" : "Create Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Customer Name" value={form.customerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, customerName: e.target.value })} />
          <Input placeholder="Contact Person" value={form.contactPerson}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input placeholder="Email" value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phoneNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phoneNumber: e.target.value })} />
          <Input placeholder="Alternate Number" value={form.alternateNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, alternateNumber: e.target.value })} />
          <Input placeholder="Location" value={form.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, location: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
