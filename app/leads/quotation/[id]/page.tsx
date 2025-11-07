"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CreateQuotationPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    leadId: "",
    items: "",
    taxRate: "",
    validityDays: "",
    notes: "",
  });

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitQuotation = async () => {
    try {
      const data = new FormData();
      data.append("leadId", form.leadId);
      data.append("items", form.items);
      data.append("taxRate", form.taxRate);
      data.append("validityDays", form.validityDays);
      data.append("notes", form.notes);
      if (file) data.append("quotationPdf", file);

      await api.post("/api/quotations", data, { headers: { "Content-Type": "multipart/form-data" } });

      toast.success("Quotation Created ✅");
      router.push("/quotation");
    } catch {
      toast.error("Failed to create quotation");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Create Quotation</h1>

      <Input name="leadId" placeholder="Lead ID" onChange={handleChange} />
      <Textarea name="items" placeholder='[{"productId":...}]' rows={4} onChange={handleChange} />
      <Input name="taxRate" placeholder="Tax Rate (%)" onChange={handleChange} />
      <Input name="validityDays" placeholder="Validity Days" onChange={handleChange} />
      <Textarea name="notes" placeholder="Notes" rows={3} onChange={handleChange} />

      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <Button onClick={submitQuotation} className="w-full">Create</Button>
    </div>
  );
}
