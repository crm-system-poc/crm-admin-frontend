"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { RotateCw, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const STATUS_OPTIONS = ["draft", "sent", "accepted", "rejected", "expired"];

export default function ViewQuotation() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id;
  // console.log("Lead ID:", leadId);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const paramsObj: any = { page, limit: 10 };
      if (status && status !== "all") paramsObj.status = status;
      if (customerName) paramsObj.customerName = customerName;

      const res = await axios.get(
        `http://localhost:8080/api/quotations/lead/${leadId}`,
        { params: paramsObj, withCredentials: true }
      );

      console.log("API Response:", res.data);
      setQuotations(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error fetching quotations:", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, status, customerName, leadId]);
  useEffect(() => {
    setPage(1);
  }, [status, customerName]);

  return (
    <div className="p-6 space-y-6 max-w-8xl mx-auto">
      <div className="flex flex-row justify-between items-end mb-4 gap-6">
        <h1 className="text-2xl font-semibold">Quotations</h1>
        <div className="flex flex-row items-end gap-4">
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
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="customer-filter"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Customer Name
            </label>
            <Input
              id="customer-filter"
              type="text"
              placeholder="Search customer..."
              className="min-w-[200px]"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-1"
            onClick={fetchData}
            disabled={loading}
            title="Refresh"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Sr. No</TableHead>
              <TableHead>Quotation</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No quotations found.
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((q: any, idx: number) => {
                // Sr. No logic: based on current page, 10 items per page
                const serialNumber = (page - 1) * 10 + idx + 1;
                return (
                  <TableRow key={q.id} className="hover:bg-muted/30">
                    <TableCell>{serialNumber}</TableCell>
                    <TableCell>{q.quoteId}</TableCell>
                    <TableCell>
                      {q.customerDetails?.customerName}
                    </TableCell>
                    <TableCell>
                      {q?.customerDetails?.contactPerson}
                    </TableCell>
                    <TableCell>
                      {q?.customerDetails?.email}
                    </TableCell>
                    <TableCell>
                      {q?.customerDetails?.phoneNumber}
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize">{q.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {q.currency === "INR" ? "₹" : q.currency}{" "}
                      {q.grandTotal?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell>
                      {q.pdfFile?.s3Url ? (
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/quotation/${q.id}`)}
                          >
                            View
                          </DropdownMenuItem>
                          {/* Additional actions could be added here */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
