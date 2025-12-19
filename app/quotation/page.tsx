"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  MoreVertical,
  Search,
  FileText,
  ExternalLink,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";
import { AssignQuotationDialog } from "@/components/quotations/AssignQuotationDialog";

const STATUS_OPTIONS = ["draft", "sent", "accepted", "rejected", "expired"];

const statusColorMap: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  sent: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  rejected: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  expired: "bg-amber-100 text-amber-700 hover:bg-amber-200",
};

const getAgeInDays = (createdAt?: string) => {
  if (!createdAt) return "-";
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = now.setHours(0, 0, 0, 0) - created.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))) + " days";
};

export default function QuotationList() {
  const router = useRouter();
  const { user } = useAuth();
  const permissions = user?.permissions || {};

  // Filters & pagination state
  const [quotations, setQuotations] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [quotationToAssign, setQuotationToAssign] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const canAssignQuotation =
    user?.systemrole === "SuperAdmin" ||
    user?.role === "Manager" ||
    hasAction(user?.permissions, "manageQuotation", "update");

  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always cleanup any timeouts on unmount
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, []);

  // Fetch with proper filter and pagination params, matching backend getAllQuotation API contract
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
      };
      if (status && status !== "all") params.status = status;
      if (customerName) params.customerName = customerName;

      // Could be extended with additional filters as needed!
      const res = await api.get("/api/quotations", { params });
      setQuotations(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || res.data.data?.length || 0);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters/pagination change
  useEffect(() => {
    fetchData();
  }, [page, status, customerName]);

  // Always reset to 1st page when filters change (for better UX)
  useEffect(() => {
    setPage(1);
  }, [status, customerName]);

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/quotations/${id}`);
      toast.success("Quotation deleted successfully.");
      setQuotations((qs) => qs.filter((q) => q.id !== id));
      fetchData();
    } catch (err) {
      toast.error("Failed to delete quotation.");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleViewDetails = (q: any) => {
    router.push(`/quotation/${q.id}`);
    setOpenDropdownId(null);
  };

  const handleCreatePO = (q: any) => {
    if (q.id && q.leadId) {
      router.push(`/quotation/purchase-order/${q.id}/${q.leadId}`);
      setOpenDropdownId(null);
    } else {
      toast.error("Quotation or Lead info missing.");
      setOpenDropdownId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-8xl mx-auto flex flex-col">
        <Card>
          <CardHeader className="border-b ">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Quotations
                </h1>
                <p className="text-slate-500">
                  Manage and track all your quotations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-normal">
                  <FileText className="w-3 h-3 mr-1" />
                  {totalRecords} Total
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent >
            {/* Filters */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <span className="text-lg font-semibold">Filters</span>
              </div>
              <span className="block text-slate-500 mb-3 text-sm">
                Search and filter quotations by status and customer
              </span>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="status-filter"
                    className="block mb-2 text-sm font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <Select
                    value={status ?? "all"}
                    onValueChange={(v) => setStatus(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="customer-filter"
                    className="block mb-2 text-sm font-medium text-slate-700"
                  >
                    Customer Name
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="customer-filter"
                      type="text"
                      placeholder="Search by customer name..."
                      className="pl-10 w-full"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto" />
                    <p className="text-slate-500 text-sm">
                      Loading quotations...
                    </p>
                  </div>
                </div>
              ) : quotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 text-lg font-semibold">
                    No quotations found
                  </p>
                  <p className="text-slate-500 text-sm mt-1 text-center max-w-md">
                    Try adjusting your filters or create a new quotation to get
                    started
                  </p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Sr.No</TableHead>
                        <TableHead className="font-semibold text-slate-700">Quotation ID</TableHead>
                        <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                        <TableHead className="font-semibold text-slate-700">Lead</TableHead>
                        <TableHead className="font-semibold text-slate-700">Value</TableHead>
                        <TableHead className="font-semibold text-slate-700">Documentation</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Age</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quotation: any, idx: number) => {
                        const srNo = (page - 1) * 10 + idx + 1;
                        const age = getAgeInDays(quotation.createdAt);
                        return (
                          <TableRow
                            key={quotation.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <TableCell className="text-sm text-slate-600">{srNo}</TableCell>
                            <TableCell className="font-semibold text-slate-900">{quotation.quoteId}</TableCell>
                            <TableCell className="text-sm text-slate-900">
                              {quotation.customerDetails?.contactPerson || "-"}
                            </TableCell>
                            <TableCell>
                              {quotation.leadId?.id ? (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="px-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
                                  onClick={() => handleViewDetails(quotation)}
                                >
                                  {quotation.leadId.customerName}
                                </Button>
                              ) : (
                                <span className="text-sm text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">
                              {quotation.currency === "INR"
                                ? "₹"
                                : quotation.currency}{" "}
                              {quotation.grandTotal?.toLocaleString() ?? "—"}
                            </TableCell>
                            <TableCell>
                              {quotation.pdfFile && quotation.pdfFile.s3Url ? (
                                <a
                                  href={quotation.pdfFile.s3Url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  {quotation.leadId && quotation.leadId.customerName
                                    ? `${quotation.leadId.customerName} - document`
                                    : quotation.pdfFile.originalName}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`capitalize ${
                                  statusColorMap[quotation.status] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {quotation.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{age}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu
                                open={openDropdownId === quotation.id}
                                onOpenChange={(open) =>
                                  setOpenDropdownId(open ? quotation.id : null)
                                }
                              >
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    aria-label="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => handleViewDetails(quotation)}
                                  >
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setQuotationToAssign(quotation);
                                      setAssignDialogOpen(true);
                                      setOpenDropdownId(null);
                                    }}
                                    disabled={!canAssignQuotation}
                                  >
                                    Assign Quotation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCreatePO(quotation)}
                                  >
                                    Create PO
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        className="text-rose-600 focus:text-rose-600"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={() => setDeleteId(quotation.id)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Quotation
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this quotation? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel
                                          onClick={() => setDeleteId(null)}
                                          disabled={deleteLoading}
                                        >
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          disabled={deleteLoading}
                                          onClick={async () => {
                                            await handleDelete(quotation.id);
                                          }}
                                        >
                                          {deleteLoading && deleteId === quotation.id ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin inline-block" />
                                          ) : null}
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            {/* Pagination */}
            <div className="flex justify-end items-center gap-2 px-4 py-3 border-t mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Assign Quotation Dialog */}
        <AssignQuotationDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          quotation={quotationToAssign}
          onAssigned={() => {
            setAssignDialogOpen(false);
            setQuotationToAssign(null);
            fetchData();
          }}
        />
      </div>
    </div>
  );
}