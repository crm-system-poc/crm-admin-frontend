"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
    taxRate: 18,
    validityDays: 20,
    

  });
  const [loading, setLoading] = useState(false);

  // For resetting file input if user wants to re-select or remove file
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    data.append("taxRate", String(form.taxRate ?? "18"));
    data.append("validityDays", String(form.validityDays ?? "30"));
    data.append("notes", form.notes);
    data.append("termsAndConditions", form.termsAndConditions);

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
        // Handle duplicate key error specifically
        if (
          typeof res.data?.error === "string" && 
          res.data.error.includes("duplicate key error") &&
          res.data.error.includes("quoteId")
        ) {
          toast.error("Duplicate Quotation: This quotation already exists for this quote ID. Please check or use a unique quotation.");
        } else {
          toast.error(res.data?.error || "Failed to create quotation");
        }
      }
    } catch (err: any) {
      // Also catch duplicate key error if thrown as an exception
      const backendMsg = err?.response?.data?.error;
      if (
        typeof backendMsg === "string" &&
        backendMsg.includes("duplicate key error") &&
        backendMsg.includes("quoteId")
      ) {
        toast.error("Duplicate Quotation: This quotation already exists for this quote ID. Please check or use a unique quotation.");
      } else {
        toast.error(backendMsg || "Failed to create quotation");
      }
    } finally {
      setLoading(false);
    }
  };

  // Simple Card wrapper
  function Card({
    children,
    className = ""
  }: React.PropsWithChildren<{ className?: string }>) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 border ${className}`}>{children}</div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Create Quotation</h1>

      {/* Product Items Section */}
      <Card>
        <div className="flex items-center mb-2">
          <span className="font-semibold text-lg">Product Items</span>
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
            <Card className="!shadow-sm !border border-gray-200 relative" key={idx}>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label htmlFor={`productId-${idx}`} className="block font-medium mb-1">Product ID</label>
                  <Input
                    id={`productId-${idx}`}
                    placeholder="Product ID"
                    value={item.productId}
                    onChange={(e) =>
                      handleItemChange(idx, "productId", e.target.value)
                    }
                    required
                    name={`items.${idx}.productId`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={`description-${idx}`} className="block font-medium mb-1">Description</label>
                  <Input
                    id={`description-${idx}`}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(idx, "description", e.target.value)
                    }
                    name={`items.${idx}.description`}
                  />
                </div>
                <div>
                  <label htmlFor={`unitPrice-${idx}`} className="block font-medium mb-1">Unit Price</label>
                  <Input
                    id={`unitPrice-${idx}`}
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
                </div>
                <div>
                  <label htmlFor={`quantity-${idx}`} className="block font-medium mb-1">Quantity</label>
                  <Input
                    id={`quantity-${idx}`}
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", e.target.value)
                    }
                    type="number"
                    name={`items.${idx}.quantity`}
                    min="1"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                className="absolute top-1 right-4 p-2 rounded hover:bg-red-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                title={items.length === 1 ? "At least one item required" : "Delete"}
                aria-label="Delete"
              >
                <Trash2 className={`w-5 h-5 text-red-500 ${items.length === 1 ? "opacity-50" : "hover:text-red-700"}`} />
              </button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Quotation Details Section */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="taxRate" className="block font-medium mb-1">Tax Rate (%)</label>
            <Input
              id="taxRate"
              name="taxRate"
              placeholder="Tax Rate (%)"
              onChange={handleChange}
              value={form.taxRate}
              type="number"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="validityDays" className="block font-medium mb-1">Validity Days</label>
            <Input
              id="validityDays"
              name="validityDays"
              placeholder="Validity Days"
              onChange={handleChange}
              value={form.validityDays}
              type="number"
              min="1"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="notes" className="block font-medium mb-1">Notes</label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Notes"
              rows={3}
              onChange={handleChange}
              value={form.notes}
            />
          </div>
          <div>
            <label htmlFor="termsAndConditions" className="block font-medium mb-1">Terms and Conditions</label>
            <Textarea
              id="termsAndConditions"
              name="termsAndConditions"
              placeholder="Terms and Conditions"
              rows={3}
              onChange={handleChange}
              value={form.termsAndConditions}
            />
          </div>
        </div>
        <div className="mt-4 w-full md:w-1/2">
          <label htmlFor="quotation-pdf" className="block font-medium mb-1">Quotation PDF (optional)</label>
          <div className="flex items-center gap-3">
            <Input
              id="quotation-pdf"
              type="file"
              accept="application/pdf"
              onChange={e => {
                setFile(e.target.files?.[0] || null);
              }}
              ref={fileInputRef}
              className="block flex-1"
            />
            {file && (
              <span className="truncate text-sm text-gray-700" title={file.name}>
                {file.name}
              </span>
            )}
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove file"
                className="ml-2"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={submitQuotation} disabled={loading} className="w-36">
          {loading ? "Creating..." : "Create"}
        </Button>
      </div>
    </div>
  );
}
