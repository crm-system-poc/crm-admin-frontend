"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired"
];

export default function QuotationList() {
  const router = useRouter();

  // State for data, filters, and pagination
  const [quotations, setQuotations] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // Fetch with filters and pagination
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
      };
      if (status && status !== "all") params.status = status;
      if (customerName) params.customerName = customerName;

      const res = await api.get("/api/quotations", { params });
      setQuotations(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // We want to run when page, status, or customerName changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, customerName]);


  // Reset page if filter/search changes
  useEffect(() => {
    setPage(1);
    // don't fetch here, fetch is triggered above by page/stat/cust change
    // eslint-disable-next-line
  }, [status, customerName]);


  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Quotations</h1>
        <Button onClick={() => router.push("/quotation/create")}>Create Quotation</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-4">
        {/* Filter by Status */}
        <div>
          <label
            htmlFor="status-filter"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <Select
            value={status ?? "all"}
            onValueChange={(v) => setStatus(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="min-w-[140px]" id="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Filter by Customer */}
        <div>
          <label htmlFor="customer-filter" className="block mb-1 text-sm font-medium text-gray-700">
            Customer Name
          </label>
          <Input
            id="customer-filter"
            type="text"
            placeholder="Search customer..."
            className="min-w-[200px]"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">No quotations found.</TableCell>
              </TableRow>
            ) : (
              quotations.map((q: any) => (
                <TableRow key={q.id} className="hover:bg-muted/30">
                  <TableCell>{q.quoteId}</TableCell>
                  <TableCell>
                    {q.customerDetails?.customerName}
                    <div className="text-xs text-muted-foreground">{q.customerDetails?.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{q.customerDetails?.email}</div>
                    <div className="text-xs text-muted-foreground">{q.customerDetails?.phoneNumber}</div>
                  </TableCell>
                  <TableCell>
                    {q.leadId?.id ? (
                      <Button
                        size="sm"
                        variant="link"
                        className="px-0 h-auto text-blue-700"
                        onClick={() => router.push(`/leads/${q.leadId.id}`)}
                      >
                        {q.leadId.customerName}
                        <div className="text-xs text-muted-foreground">{q.leadId.contactPerson}</div>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize">{q.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {q.currency === "INR" ? "₹" : q.currency} {q.grandTotal?.toLocaleString() ?? "—"}
                  </TableCell>
                  <TableCell>
                    {q.pdfFile && q.pdfFile.s3Url ? (
                      <a
                        href={q.pdfFile.s3Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-700 text-sm"
                      >
                        {q.pdfFile.originalName}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/quotation/${q.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-4 pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}