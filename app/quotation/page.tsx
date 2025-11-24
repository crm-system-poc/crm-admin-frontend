"use client";

import { useEffect, useState, useRef } from "react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { hasModule, hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";

const STATUS_OPTIONS = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired"
];

// Map status to badge color classes
const statusColorMap: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700",
  sent: "bg-pink-100 text-pink-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-yellow-100 text-yellow-800", // You can customize for 'expired' as desired
};

export default function QuotationList() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  // State for data, filters, and pagination
  const [quotations, setQuotations] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // For delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Track which dropdown menu is open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Ref for navigation timeout – used for delayed navigation dismissal after dropdown closes if needed
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup any pending timeout on unmount or rerender
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, []);

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

  }, [page, status, customerName]);

  useEffect(() => {
    setPage(1);

  }, [status, customerName]);


  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/quotations/${id}`);
      toast.success("Quotation deleted.");
      setQuotations(qs => qs.filter(q => q.id !== id));
      fetchData();
    } catch (err) {
      toast.error("Failed to delete quotation.");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // Fast Navigation Handlers for DropdownMenuItem
  const handleViewDetails = (q: any) => {
    // Navigate instantly without waiting for menu to close
    router.push(`/quotation/${q.id}`);
    setOpenDropdownId(null);
  };
  const handleCreatePO = (q: any) => {
    if (q.id && q.leadId && q.leadId.id) {
      router.push(`quotation/purchase-order/${q.id}/${q.leadId.id}`);
      setOpenDropdownId(null);
    } else {
      toast.error("Quotation or Lead info missing.");
      setOpenDropdownId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Quotations</h1>
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
              <TableHead className="w-10 text-center">Sr.No</TableHead>
              <TableHead>Quotation</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Documentation</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">No quotations found.</TableCell>
              </TableRow>
            ) : (
              quotations.map((q: any, idx: number) => (
                <TableRow key={q.id} className="hover:bg-muted/30">
                  <TableCell className="text-center">{(page - 1) * 10 + idx + 1}</TableCell>
                  <TableCell>{q.quoteId}</TableCell>
                  <TableCell>
                    {/* {q.customerDetails?.customerName} */}
                    <div>{q.customerDetails?.contactPerson}</div>
                  </TableCell>
                  <TableCell>
                    {q.leadId?.id ? (
                      <Button
                        size="sm"
                        variant="link"
                        className="px-0 h-auto text-black"
                        onClick={() => router.push(`/leads/${q.leadId.id}`)}
                      >
                        {q.leadId.customerName}
                        {/* <div className="text-xs text-muted-foreground">{q.leadId.contactPerson}</div> */}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        `capitalize ${statusColorMap[q.status] || "bg-gray-100 text-gray-700"}`
                      }
                    >
                      {q.status}
                    </Badge>
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
                        {/* Show both Lead Name and PDF Filename if possible */}
                        {q.leadId && q.leadId.customerName
                          ? `${q.leadId.customerName} - document`
                          : q.pdfFile.originalName}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openDropdownId === q.id}
                      onOpenChange={(open) => setOpenDropdownId(open ? q.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      {hasAction(user.permissions, "manageQuotation", "read") && (
                        <DropdownMenuItem
                          onSelect={e => {
                            e.preventDefault();
                            handleViewDetails(q);
                          }}
                        >
                          View Detail
                        </DropdownMenuItem>
                      )}
                       {hasAction(user.permissions, "managePurchaseOrder", "create") && (
                        <DropdownMenuItem
                          onSelect={e => {
                            e.preventDefault();
                            handleCreatePO(q);
                          }}
                        >
                          Create Purchase Order
                        </DropdownMenuItem>
                       )}
                        <DropdownMenuSeparator />
                        <AlertDialog open={deleteId === q.id} onOpenChange={(open) => {if (!open) setDeleteId(null); }}>
                          <AlertDialogTrigger asChild>
                          {hasAction(user.permissions, "manageQuotation", "delete") && (
                            <DropdownMenuItem onSelect={e => {
                              e.preventDefault();
                              setOpenDropdownId(null); // make sure dropdown closes on delete prompt
                              setDeleteId(q.id);
                               
                            }}>
                              Delete
                            </DropdownMenuItem>
                          )}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this quotation? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deleteLoading} onClick={() => setDeleteId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={deleteLoading}
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(q.id)}
                              >
                                {deleteLoading ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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