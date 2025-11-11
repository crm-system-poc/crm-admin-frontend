"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// TypeScript item type aligns with backend expectations (unitPrice/quantity: number)
type Item = {
  productId: string;
  description: string;
  unitPrice: string; // kept as string for controlled input, will parse as number
  quantity: string;  // likewise
};

const EMPTY_ITEM: Item = {
  productId: "",
  description: "",
  unitPrice: "",
  quantity: "",
};

export default function CreateQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const leadIdParam = (params?.id as string) || "";

  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [form, setForm] = useState({
    taxRate: "18", // Backend default
    validityDays: "30", // Backend default
    notes: "",
    termsAndConditions: "",
  });
  const [loading, setLoading] = useState(false);

  const handleItemChange = (idx: number, field: keyof Item, value: string) => {
    setItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((items) => [...items, { ...EMPTY_ITEM }]);

  const removeItem = (idx: number) => {
    setItems((items) =>
      items.length === 1 ? items : items.filter((_, i) => i !== idx)
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  // Validate and parse items to match backend requirements (unitPrice/quantity: number, require fields)
  const validateItems = (): {
    valid: boolean;
    parsed?: {
      productId: string;
      description: string;
      unitPrice: number;
      quantity: number;
    }[];
    error?: string;
  } => {
    if (!items.length) {
      return { valid: false, error: "At least one item is required for quotation" };
    }
    for (const [idx, item] of items.entries()) {
      if (!item.productId.trim() || !item.unitPrice.trim() || !item.quantity.trim()) {
        return {
          valid: false,
          error: `All fields are required for Item ${idx + 1}.`
        };
      }
      const unitPrice = Number(item.unitPrice);
      const quantity = Number(item.quantity);

      if (isNaN(unitPrice) || unitPrice < 0) {
        return {
          valid: false,
          error: `Unit price must be a non-negative number (in Item ${idx + 1}).`
        };
      }
      if (isNaN(quantity) || quantity < 1) {
        return {
          valid: false,
          error: `Quantity must be at least 1 (in Item ${idx + 1}).`
        };
      }
    }
    // Use numbers for backend
    const parsed = items.map(item => ({
      productId: item.productId.trim(),
      description: item.description,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
    }));
    return { valid: true, parsed };
  };

  // Handles POST to backend, matches controller contract (including FormData & pdf)
  const submitQuotation = async () => {
    setLoading(true);
  
    const { valid, parsed, error } = validateItems();
    if (!valid) {
      toast.error(error);
      setLoading(false);
      return;
    }
  
    const data = new FormData();
    data.append("leadId", leadIdParam);
    data.append("items", JSON.stringify(parsed));
    data.append("taxRate", form.taxRate || "18");
    data.append("validityDays", form.validityDays || "30");
    data.append("notes", form.notes);
    data.append("termsAndConditions", form.termsAndConditions);
  
    // ✅ Correct field name for backend upload middleware
    if (file) data.append("pdf", file);
  
    try {
      const res = await api.post("/api/quotations", data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
  
      if (res.data?.success) {
        toast.success("Quotation created successfully ✅");
        router.push(`/leads/${leadIdParam}`);
      } else {
        toast.error(res.data?.error || "Failed to create quotation");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create quotation");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="p-6  space-y-4">
      <h1 className="text-xl font-semibold">Create Quotation</h1>

      <Input
        name="leadId"
        placeholder="Lead ID"
        value={leadIdParam}
        readOnly
        className="bg-gray-100 cursor-not-allowed"
      />

      <div>
        <div className="flex items-center mb-2">
          <span className="font-semibold">Product Items</span>
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="ml-auto px-3 py-1"
            variant="outline"
          >
            + Add Item
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {items.map((item, idx) => (
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end"
              key={idx}
            >
              <Input
                placeholder="Product ID"
                value={item.productId}
                onChange={(e) =>
                  handleItemChange(idx, "productId", e.target.value)
                }
                required
                name={`items.${idx}.productId`}
              />
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) =>
                  handleItemChange(idx, "description", e.target.value)
                }
                name={`items.${idx}.description`}
              />
              <Input
                placeholder="Unit Price"
                value={item.unitPrice}
                onChange={(e) =>
                  handleItemChange(idx, "unitPrice", e.target.value)
                }
                type="number"
                name={`items.${idx}.unitPrice`}
                min="0"
                required
              />
              <Input
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(idx, "quantity", e.target.value)
                }
                type="number"
                name={`items.${idx}.quantity`}
                min="1"
                required
                className="md:col-span-1"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="col-span-1 md:col-auto md:ml-2 mt-2 md:mt-0"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                title={
                  items.length === 1 ? "At least one item required" : "Remove"
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ">
        <Input
          name="taxRate"
          placeholder="Tax Rate (%)"
          onChange={handleChange}
          value={form.taxRate}
          type="number"
          min="0"
        />
        <Input
          name="validityDays"
          placeholder="Validity Days"
          onChange={handleChange}
          value={form.validityDays}
          type="number"
          min="1"
        />
        <Textarea
          name="notes"
          placeholder="Notes"
          rows={3}
          onChange={handleChange}
          value={form.notes}
        />
        <Textarea
          name="termsAndConditions"
          placeholder="Terms and Conditions"
          rows={3}
          onChange={handleChange}
          value={form.termsAndConditions}
        />

        <Input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button onClick={submitQuotation} disabled={loading} className="w-half">
        {loading ? "Creating..." : "Create"}
      </Button>
    </div>
  );
}
