"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { hasModule, hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";

type Quotation = {
  id: string;
  quoteId: string;
  dateOfQuote: string;
  validUntil?: string;
  status: string;
  notes?: string;
  termsAndConditions?: string;
  totalQuoteValue: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  validityDays?: number;
  customerDetails?: {
    customerName?: string;
    contactPerson?: string;
    email?: string;
    phoneNumber?: string;
    address?: {
      country?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  pdfFile?: {
    s3Url?: string;
    originalName?: string;
    fileSize?: number;
    uploadedAt?: string;
  };
  leadId?: any;
  items?: Array<{
    productId?: string;
    description?: string;
    unitPrice?: number;
    quantity?: number;
    total?: number;
    _id?: string;
  }>;
  [key: string]: any;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export default function QuotationDetail() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [status, setStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [terms, setTerms] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  const fetchDetails = async () => {
    try {
      setError(null);
      const res = await api.get(`/api/quotations/${id}`);
      let data = res.data?.data;
      // Defensive: If data is array, pick first
      if (Array.isArray(data)) data = data[0] || null;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        setQuotation(data);
        setStatus(data.status || "");
        setNotes(data.notes || "");
        setTerms(data.termsAndConditions || "");
      } else {
        setQuotation(null);
        setStatus("");
        setError("Unable to load this quotation.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch quotation details.");
      setQuotation(null);
      setStatus("");
    }
  };

  const updateStatus = async () => {
    if (!quotation) return;
    try {
      await api.put(`/api/quotations/${id}/status`, { status });
      toast.success("Status Updated ✅");
      fetchDetails();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update status.");
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!quotation) return <p className="p-6">Loading...</p>;

  const cust = quotation.customerDetails || {};
  const pdf = quotation.pdfFile || {};
  const addr = cust.address || {};

  return (
    <div className="p-6  mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Quotation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 3x3 Grid for main details: Customer Info + Quotation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 - Customer Info */}
            <div className="space-y-5">
              <div>
                <label className="block font-medium text-sm mb-1">Customer Name</label>
                <Input readOnly value={cust.customerName || ""} />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Contact Person</label>
                <Input readOnly value={cust.contactPerson || ""} />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Email</label>
                <Input readOnly value={cust.email || ""} />
                <div className="mt-4">
                <label className="block font-medium text-sm mb-1">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="min-w-[340px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem value={opt.value} key={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
            {/* Column 2 - More Customer/Quote Info */}
            <div className="space-y-5">
              <div>
                <label className="block font-medium text-sm mb-1">Phone Number</label>
                <Input readOnly value={cust.phoneNumber || ""} />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Country</label>
                <Input readOnly value={addr.country || ""} />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Quote Number</label>
                <Input readOnly value={quotation.quoteId || quotation.id || ""} />
              </div>
            </div>
            {/* Column 3 - Quotation Summary */}
            <div className="space-y-6">
              <div>
                <label className="block font-medium text-sm mb-1">Quote Date</label>
                <Input
                  readOnly
                  value={
                    quotation.dateOfQuote
                      ? new Date(quotation.dateOfQuote).toLocaleDateString()
                      : ""
                  }
                />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Valid Until</label>
                <Input
                  readOnly
                  value={
                    quotation.validUntil
                      ? new Date(quotation.validUntil).toLocaleDateString()
                      : ""
                  }
                />
                
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Currency</label>
                <Input readOnly value={quotation.currency || ""} />
              </div>
             
             
            </div>
            {hasAction(user.permissions, "manageQuotation", "update") && (
                <Button className="mt-2 max-w-30" onClick={updateStatus}>
                  Update Status
                </Button>
              )}
          </div>

          {/* Quote items table */}
          <div className="mt-8">
            <div className="font-semibold mb-1">Quote Items</div>
            <div className="overflow-auto border rounded">
              <table className="min-w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left font-medium">
                      Product ID
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Description
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="px-2 py-2 text-right font-medium">
                      Quantity
                    </th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(quotation.items || []).length > 0 ? (
                    (quotation.items || []).map((item, idx) => (
                      <tr
                        key={item._id || idx}
                        className={idx % 2 ? "bg-muted-foreground/5" : ""}
                      >
                        <td className="px-4 py-2">{item.productId || ""}</td>
                        <td className="px-4 py-2">{item.description || ""}</td>
                        <td className="px-2 py-2 text-right">
                          {item.unitPrice?.toLocaleString?.() ?? ""}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {item.quantity ?? ""}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {item.total?.toLocaleString?.() ?? ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-2 text-center" colSpan={5}>
                        No items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total & financial summary in 3x3 grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div>
              <label className="block font-medium text-sm mb-1">Total Quote Value</label>
              <Input
                readOnly
                value={quotation.totalQuoteValue?.toLocaleString?.() || ""}
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Tax Rate (%)</label>
              <Input readOnly value={quotation.taxRate || ""} />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Tax Amount</label>
              <Input
                readOnly
                value={quotation.taxAmount?.toLocaleString?.() || ""}
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Grand Total</label>
              <Input
                readOnly
                value={quotation.grandTotal?.toLocaleString?.() || ""}
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Validity Days</label>
              <Input
                readOnly
                value={quotation.validityDays?.toString() || ""}
              />
            </div>
          </div>

          {/* Notes & Terms section 3x3 grid style (keep 2 col if only Notes/Terms) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div>
              <label className="block font-medium text-sm mb-1">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                readOnly
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Terms & Conditions</label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Terms and Conditions"
                readOnly
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* PDF if available */}
          {/* PDF Section */}
          <div className="mt-8 space-y-3">
            <label className="font-semibold text-lg">Quotation PDF</label>

            {pdf.s3Url ? (
              <div className="flex items-center gap-4">
                {/* Preview Button */}
                <Button
                  variant="outline"
                  onClick={() => window.open(pdf.s3Url!, "_blank")}
                >
                  Preview PDF
                </Button>
                {/* Download & Delete PDF buttons can go here if enabled */}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No PDF uploaded yet.
              </p>
            )}

            {/* Upload or Replace */}
            <div>
              <label className="block font-medium text-sm mb-1">Upload/Replace PDF</label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("pdf", file);

                  try {
                    setUploadProgress(0);
                    await api.put(
                      `/api/quotations/${id}/upload-pdf`,
                      formData,
                      {
                        headers: { "Content-Type": "multipart/form-data" },
                        onUploadProgress: (event) => {
                          setUploadProgress(
                            Math.round((event.loaded * 100) / event.total!)
                          );
                        },
                      }
                    );
                    toast.success("PDF uploaded ✅");
                    fetchDetails();
                  } catch {
                    toast.error("PDF upload failed.");
                  }
                }}
              />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 w-full bg-gray-200 rounded h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Delete PDF?</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this PDF from cloud storage?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await api.delete(`/api/quotations/${id}/pdf`);
                    toast.success("PDF deleted ✅");
                    setShowDeleteConfirm(false);
                    fetchDetails();
                  } catch {
                    toast.error("Failed to delete PDF.");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
