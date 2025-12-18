"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOEM, updateOEM } from "@/lib/oem";
import { toast } from "sonner";

interface OEMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any; // pass OEM object for edit
}

export default function OEMDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: OEMDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    contactPerson: "",
  });

  // Populate data in edit mode
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        contactNumber: initialData.contactNumber || "",
        contactPerson: initialData.contactPerson || "",
      });
    } else {
      setForm({ name: "", email: "", contactNumber: "", contactPerson: "" });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("OEM name is required");
      return;
    }

    try {
      setLoading(true);

      if (initialData) {
        await updateOEM(initialData.id, form);
        toast.success("OEM updated successfully");
      } else {
        await createOEM(form);
        toast.success("OEM created successfully");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit OEM" : "Add OEM"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* OEM Name */}
          <div className="space-y-1">
            <Label>OEM Name </Label>
            <Input
              name="name"
              placeholder="Enter OEM name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

           {/* Contact Person */}
           <div className="space-y-1">
            <Label>Contact Person</Label>
            <Input
              name="contactPerson"
              placeholder="Enter contact person name"
              value={form.contactPerson}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="oem@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

         

          {/* Contact Number */}
          <div className="space-y-1">
            <Label>Contact Number</Label>
            <Input
              name="contactNumber"
              placeholder="9876543210"
              value={form.contactNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
