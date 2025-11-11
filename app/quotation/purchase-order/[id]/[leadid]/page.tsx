"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Allowed license types according to backend enum
const LICENSE_TYPES = [
  "perpetual",
  "saas",
  "sro",
  "mro",
  "xaas",
  "other",
];

type Item = {
  productId: string;
  description: string;
  unitPrice: string;
  quantity: string;
  licenseType: string;
  licenseExpiryDate: string; // format: yyyy-mm-dd (HTML input type="date")
};

const EMPTY_ITEM: Item = {
  productId: "",
  description: "",
  unitPrice: "",
  quantity: "",
  licenseType: "",
  licenseExpiryDate: "",
};

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const params = useParams();
  const leadIdParam = (params?.leadid as string) || "";
  const quotationIdParam = (params?.id as string) || "";

  // New: store quotation data
  const [quotationData, setQuotationData] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);

  // Set initial state based on fetched quotation
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [form, setForm] = useState({
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    poDate: "",
  });
  const [poPdfFile, setPoPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Quotation by ID when id param is defined
  useEffect(() => {
    async function fetchQuotation() {
      if (!quotationIdParam) return;
      setQuoteLoading(true);
      try {
        const response = await api.get(`http://localhost:8080/api/quotations/${quotationIdParam}`);
        const data = response.data.data;
        setQuotationData(data);

        // Populate initial items and form fields from quotation, if present
        if (data?.items && Array.isArray(data.items)) {
          setItems(
            data.items.map((item: any) => ({
              productId: item.productId?.toString() || "",
              description: item.description || "",
              unitPrice: item.unitPrice !== undefined ? String(item.unitPrice) : "",
              quantity: item.quantity !== undefined ? String(item.quantity) : "",
              licenseType: item.licenseType || "",
              licenseExpiryDate: item.licenseExpiryDate
                ? item.licenseExpiryDate.slice(0, 10)
                : "",
            })) || [{ ...EMPTY_ITEM }]
          );
        }
        setForm({
          paymentTerms: data.paymentTerms || "",
          deliveryTerms: data.deliveryTerms || "",
          notes: data.notes || "",
          poDate: "",
        });
      } catch (e) {
        toast.error("Failed to fetch quotation details.");
      } finally {
        setQuoteLoading(false);
      }
    }
    fetchQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationIdParam]);

  // Update item field
  const handleItemChange = (
    idx: number,
    field: keyof Item,
    value: string
  ) => {
    setItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () =>
    setItems((items) => [...items, { ...EMPTY_ITEM }]);

  const removeItem = (idx: number) => {
    setItems((items) =>
      items.length === 1 ? items : items.filter((_, i) => i !== idx)
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  // Validation to match backend model
  const validateItems = (): {
    valid: boolean;
    parsed?: {
      productId: string;
      description: string;
      unitPrice: number;
      quantity: number;
      licenseType: string;
      licenseExpiryDate?: string | null;
    }[];
    error?: string;
  } => {
    if (!items.length) {
      return {
        valid: false,
        error: "At least one item is required for the Purchase Order.",
      };
    }
    for (const [idx, item] of items.entries()) {
      // productId, licenseType, description, unitPrice, quantity are required
      if (
        !item.productId.trim() ||
        !item.licenseType.trim() ||
        !item.description.trim() ||
        !item.unitPrice.trim() ||
        !item.quantity.trim()
      ) {
        if (!item.licenseType.trim()) {
          return {
            valid: false,
            error: `Item validation failed: Item ${idx + 1}: License type is required`,
          };
        }
        return {
          valid: false,
          error: `All fields except license expiry are required for Item ${idx + 1}.`
        };
      }
      // License type must be allowed
      if (!LICENSE_TYPES.includes(item.licenseType.trim())) {
        return {
          valid: false,
          error: `Item ${idx + 1}: Invalid license type "${item.licenseType}".`,
        };
      }
      // Validate price/quantity as numbers
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

      // For non-perpetual, licenseExpiryDate REQUIRED and must be a future date
      if (item.licenseType !== "perpetual") {
        if (!item.licenseExpiryDate) {
          return {
            valid: false,
            error: `Item validation failed: Item ${idx + 1}: License expiry date is required for non-perpetual licenses`,
          };
        }
        // Expiry date > now
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiryDate = new Date(item.licenseExpiryDate);
        if (
          isNaN(expiryDate.getTime()) ||
          expiryDate <= today
        ) {
          return {
            valid: false,
            error: `Item validation failed: Item ${idx + 1}: License expiry date must be in the future for non-perpetual licenses`,
          };
        }
      }
    }

    // Prepare parsed data for backend
    const parsed = items.map(item => ({
      productId: item.productId.trim(),
      description: item.description,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      licenseType: item.licenseType.trim(),
      licenseExpiryDate:
        item.licenseType !== "perpetual" && item.licenseExpiryDate
          ? item.licenseExpiryDate
          : undefined,
    }));
    return { valid: true, parsed };
  };

  // Handles POST to backend for purchase order
  const submitPurchaseOrder = async () => {
    setLoading(true);

    // Check if file is present
    if (!poPdfFile) {
      toast.error("PO PDF attachment is required (filename field must be 'poPdf')");
      setLoading(false);
      return;
    }

    const { valid, parsed, error } = validateItems();
    if (!valid) {
      toast.error(error);
      setLoading(false);
      return;
    }

    // Validate required form fields
    if (!form.paymentTerms.trim()) {
      toast.error("Payment Terms is required.");
      setLoading(false);
      return;
    }
    if (!form.deliveryTerms.trim()) {
      toast.error("Delivery Terms is required.");
      setLoading(false);
      return;
    }
    if (!form.poDate.trim()) {
      toast.error("PO Date is required.");
      setLoading(false);
      return;
    }

    try {
      // Build FormData for multipart/form-data
      const formData = new FormData();
      formData.append("leadId", leadIdParam);
      formData.append("quotationId", quotationIdParam);
      formData.append("items", JSON.stringify(parsed));
      formData.append("paymentTerms", form.paymentTerms);
      formData.append("deliveryTerms", form.deliveryTerms);
      formData.append("notes", form.notes);
      formData.append("poDate", form.poDate);
      // PDF file
      formData.append("poPdf", poPdfFile);

      const res = await api.post(
        "http://localhost:8080/api/purchase-orders",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        toast.success("Purchase Order created successfully ✅");
        router.push(`/leads/${leadIdParam}`);
      } else {
        toast.error(res.data?.error || "Failed to create Purchase Order");
      }
    } catch (err: any) {
      // show explicit error if attachment is required and backend responds with such error
      const backendErr = err?.response?.data?.error;
      if (
        backendErr &&
        (backendErr.toLowerCase().includes("po pdf attachment is required")
         || backendErr.toLowerCase().includes("unexpected field"))
      ) {
        toast.error("PO PDF attachment is required (filename field must be 'poPdf')");
      } else if (
        backendErr &&
        backendErr.toLowerCase().includes('item validation failed') &&
        backendErr.toLowerCase().includes('license type is required')
      ) {
        toast.error(backendErr);
      } else {
        toast.error(backendErr || "Failed to create Purchase Order");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6  space-y-4 rounded-md border-1 mt-16 border-gray-200">
      <h1 className="text-xl font-semibold">Create Purchase Order</h1>

      {/* <Input
        name="leadId"
        placeholder="Lead ID"
        value={leadIdParam}
        readOnly
        className="bg-gray-100 cursor-not-allowed"
      />

      <Input
        name="quotationId"
        placeholder="Quotation ID"
        value={quotationIdParam}
        readOnly
        className="bg-gray-100 cursor-not-allowed"
      /> */}

      {quoteLoading ? (
        <div className="py-6 text-center text-gray-400">Loading quotation&hellip;</div>
      ) : (
      <>
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
          {items.map((item, idx) => {
            const licenseType = item.licenseType;
            return (
              <div
                className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end"
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
                  required
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
                <div className="flex gap-1 md:col-span-1">
                  <select
                    name={`items.${idx}.licenseType`}
                    value={item.licenseType}
                    onChange={e =>
                      handleItemChange(idx, "licenseType", e.target.value)
                    }
                    className="p-2 border rounded w-full"
                    required
                  >
                    <option value="">License Type*</option>
                    {LICENSE_TYPES.map(type => (
                      <option value={type} key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <Input
                  placeholder="License Expiry Date"
                  type="date"
                  value={item.licenseExpiryDate}
                  onChange={e =>
                    handleItemChange(idx, "licenseExpiryDate", e.target.value)
                  }
                  name={`items.${idx}.licenseExpiryDate`}
                  disabled={item.licenseType === "perpetual"}
                  required={item.licenseType !== "perpetual"}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="col-span-1 md:col-auto md:ml-2 mt-2 md:mt-0"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  title={
                    items.length === 1
                      ? "At least one item required"
                      : "Remove"
                  }
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ">
        <Input
          name="paymentTerms"
          placeholder="Payment Terms"
          onChange={handleChange}
          value={form.paymentTerms}
        />
        <Input
          name="deliveryTerms"
          placeholder="Delivery Terms"
          onChange={handleChange}
          value={form.deliveryTerms}
        />
        <Input
          name="poDate"
          placeholder="PO Date"
          onChange={handleChange}
          value={form.poDate}
          type="date"
        />
        <Textarea
          name="notes"
          placeholder="Notes"
          rows={3}
          onChange={handleChange}
          value={form.notes}
        />
        <Input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPoPdfFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      <Button onClick={submitPurchaseOrder} disabled={loading} className="w-half">
        {loading ? "Creating..." : "Create"}
      </Button>
      </>
      )}
    </div>
  );
}
