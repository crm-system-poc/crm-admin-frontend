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
import axios from "axios";
import { api } from "@/lib/api";

export function AccountDialog({ open, onClose, editData, onSuccess }: any) {
  const [form, setForm] = useState<any>({
    customerName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    alternateNumber: "",
    location: "",
  });

  useEffect(() => {
    if (editData) setForm(editData);
  }, [editData]);

  const submit = async () => {
    const url = editData
      ? `/api/accounts/${editData._id}`
      : "/api/accounts";

    try {
      let res;
      if (editData) {
        res = await api.put(url, form, { withCredentials: true });
      } else {
        res = await api.post(url, form, { withCredentials: true });
      }
      toast.success("Account saved");
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error || error?.message || "Failed";
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
            onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input placeholder="Contact Person" value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <Input placeholder="Alternate Number" value={form.alternateNumber}
            onChange={(e) => setForm({ ...form, alternateNumber: e.target.value })} />
          <Input placeholder="Location" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
