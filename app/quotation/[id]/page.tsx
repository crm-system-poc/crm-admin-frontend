"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
      setError("Failed to fetch quotation details.");
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
    } catch (e) {
      toast.error("Could not update status.");
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!quotation) return <p className="p-6">Loading...</p>;

  // Helper rendering
  const cust = quotation.customerDetails || {};
  const pdf = quotation.pdfFile || {};
  const addr = cust.address || {};

  return (
    <div className="p-6  mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            Quotation {quotation.quoteId ? `#${quotation.quoteId}` : quotation.id ? `#${quotation.id}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer info fields */}
            <div className="space-y-2 grid grid-cols-3 md:grid-cols-2">
              <label className="font-medium">Customer Name :-</label>
              <Input readOnly value={cust.customerName || ""} />

              <label className="font-medium">Contact Person :-</label>
              <Input readOnly value={cust.contactPerson || ""} />

              <label className="font-medium">Email :-</label>
              <Input readOnly value={cust.email || ""} />

              <label className="font-medium">Phone Number :-</label>
              <Input readOnly value={cust.phoneNumber || ""} />

              <label className="font-medium">Country :-</label>
              <Input readOnly value={addr.country || ""} />
            </div>

            {/* Quotation summary fields */}
            <div className="space-y-2 grid grid-cols-3 md:grid-cols-2">
              <label className="font-medium">Quote Number :-</label>
              <Input readOnly value={quotation.quoteId || quotation.id || ""} />

              <label className="font-medium">Quote Date :-</label>
              <Input readOnly value={quotation.dateOfQuote ? new Date(quotation.dateOfQuote).toLocaleDateString() : ""} />

              <label className="font-medium">Valid Until :-</label>
              <Input readOnly value={quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : ""} />

              <label className="font-medium">Currency :-</label>
              <Input readOnly value={quotation.currency || ""} />

              <label className="font-medium">Status :-</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt =>
                    <SelectItem value={opt.value} key={opt.value}>{opt.label}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              
            </div>
            <Button className="mt-2 max-w-30" onClick={updateStatus}>Update Status</Button>
          </div>

          {/* Quote items table */}
          <div className="mt-8">
            <div className="font-semibold mb-1">Quote Items</div>
            <div className="overflow-auto border rounded">
              <table className="min-w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left font-medium">Product ID</th>
                    <th className="px-4 py-2 text-left font-medium">Description</th>
                    <th className="px-2 py-2 text-right font-medium">Unit Price</th>
                    <th className="px-2 py-2 text-right font-medium">Quantity</th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(quotation.items || []).length > 0 ? (
                    (quotation.items || []).map((item, idx) => (
                      <tr key={item._id || idx} className={idx % 2 ? "bg-muted-foreground/5" : ""}>
                        <td className="px-4 py-2">{item.productId || ""}</td>
                        <td className="px-4 py-2">{item.description || ""}</td>
                        <td className="px-2 py-2 text-right">{item.unitPrice?.toLocaleString?.() ?? ""}</td>
                        <td className="px-2 py-2 text-right">{item.quantity ?? ""}</td>
                        <td className="px-2 py-2 text-right">{item.total?.toLocaleString?.() ?? ""}</td>
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

          {/* Total & financial summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div>
              <label className="font-medium">Total Quote Value</label>
              <Input readOnly value={quotation.totalQuoteValue?.toLocaleString?.() || ""} />
            </div>
            <div>
              <label className="font-medium">Tax Rate (%)</label>
              <Input readOnly value={quotation.taxRate || ""} />
            </div>
            <div>
              <label className="font-medium">Tax Amount</label>
              <Input readOnly value={quotation.taxAmount?.toLocaleString?.() || ""} />
            </div>
            <div>
              <label className="font-medium">Grand Total</label>
              <Input readOnly value={quotation.grandTotal?.toLocaleString?.() || ""} />
            </div>
            <div>
              <label className="font-medium">Validity Days</label>
              <Input readOnly value={quotation.validityDays?.toString() || ""} />
            </div>
          </div>

          {/* Notes & Terms section */}
          <div className="grid grid-cols-1 gap-4 mt-8">
            <div>
              <label className="font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes"
                readOnly
                minRows={2}
                className="resize-none"
              />
            </div>
            <div>
              <label className="font-medium">Terms & Conditions</label>
              <Textarea
                value={terms}
                onChange={e => setTerms(e.target.value)}
                placeholder="Terms and Conditions"
                readOnly
                minRows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* PDF if available */}
          {pdf.s3Url && (
            <div className="mt-6 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.open(pdf.s3Url as string, "_blank")}
              >
                View PDF{pdf.originalName ? ` (${pdf.originalName})` : ""}
              </Button>
              {pdf.fileSize && (
                <span className="text-xs text-muted-foreground">{(pdf.fileSize / 1024).toFixed(1)} KB uploaded on {pdf.uploadedAt ? new Date(pdf.uploadedAt).toLocaleString() : ""}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
