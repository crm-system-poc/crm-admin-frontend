"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreVertical,
  Users,
  ArrowRightCircle,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import ProtectedPage from "@/components/ProtectedPage";
import { hasAction } from "@/lib/permissions";
import { api } from "@/lib/api";
import { toast } from "sonner";
import AssignInquiryUsersModal from "@/components/Inquiry/AssignInquiryUsersModal";
import { useAuth } from "@/components/context/AuthContext";

export default function InquiriesPage() {
  const { user } = useAuth();
  const permissions = user?.permissions || {};

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);

  // State for convert dialog
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertRow, setConvertRow] = useState<any | null>(null);

  const canAssignInquiry =
    user?.systemrole === "SuperAdmin" ||
    user?.role === "Manager" ||
    hasAction(user?.permissions, "manageInquiry", "update");

  const loadInquiries = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/inquiries`, {
        params: {
          page,
          limit,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchQuery || undefined,
        },
      });
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setInquiries(res.data.data);
    } catch (error) {
      console.error("Failed to load inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    // eslint-disable-next-line
  }, [page, searchQuery, statusFilter]);

  const handleConvertToLead = async (id: string) => {
    try {
      await api.post(`/api/inquiries/${id}/convert`);
      toast.success("Inquiry converted to lead successfully!");
      loadInquiries();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to convert inquiry to lead"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/inquiries/${id}`);
      loadInquiries();
    } catch (error) {
      console.error("Failed to delete inquiry:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "secondary",
      contacted: "default",
      converted: "default",
      closed: "outline",
    };
    return (
      <Badge variant={variants[status?.toLowerCase()] || "outline"}>
        {status}
      </Badge>
    );
  };

  // Only do client-side filtering for display if needed (len <= limit?), otherwise relies only on paged server data.
  // For exact pagination, display only what's in inquiries, not filteredInquiries.
  // However, preserve original client-side search for consistency with /leads/page.tsx.

  return (
    <ProtectedPage module="manageInquiry">
      <div className="max-w-8xl mx-auto space-y-4 p-6">
        {/* Page heading & actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Inquiries</h1>
          </div>
          <div className="flex w-full sm:w-auto gap-2 sm:gap-3 items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-sm"
              />
            </div>
            {/* Refresh button */}
            <Button
              type="button"
              variant="outline"
              // size="icon"
              aria-label="Refresh inquiries"
              onClick={() => loadInquiries()}
              disabled={isLoading}
            >
              {/* <RefreshCcw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} /> */}
              Refresh
            </Button>
            {hasAction(permissions, "manageInquiry", "create") && (
              <Link href="/inquiries/new">
                <Button>
                  Add Inquiry
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-md border shadow-sm ">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>
                  <span className="font-semibold">Sr. No</span>
                </TableHead>
                <TableHead>
                  <span className="font-semibold">Customer Name</span>
                </TableHead>
                <TableHead>
                  <span className="font-semibold">Phone</span>
                </TableHead>
                <TableHead>
                  <span className="font-semibold">Status</span>
                </TableHead>
                <TableHead>
                  <span className="font-semibold">Action</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : Array.isArray(inquiries) && inquiries.length > 0 ? (
                inquiries.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.phoneNumber}</TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Convert To Lead */}
                            {hasAction(
                              permissions,
                              "manageInquiry",
                              "update"
                            ) &&
                              !row.isConvertedToLead &&
                              (row.status === "new" ||
                                row.status === "contacted") && (
                                <AlertDialog
                                  open={
                                    convertDialogOpen && convertRow?.id === row.id
                                  }
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setConvertDialogOpen(true);
                                      setConvertRow(row);
                                    } else {
                                      setConvertDialogOpen(false);
                                      setConvertRow(null);
                                    }
                                  }}
                                >
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-green-700 focus:text-green-800"
                                      onSelect={e => {
                                        e.preventDefault();
                                        setConvertDialogOpen(true);
                                        setConvertRow(row);
                                      }}
                                    >
                                      {/* <ArrowRightCircle className="mr-2 h-4 w-4 text-green-600" /> */}
                                      Convert to Lead
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Convert to Lead?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will create a Lead from{" "}
                                        <span className="font-semibold">
                                          {row.customerName}
                                        </span>{" "}
                                        inquiry and update its status.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setConvertDialogOpen(false);
                                          setConvertRow(null);
                                          handleConvertToLead(row.id);
                                        }}
                                        className="bg-primary text-white hover:bg-primary/90"
                                      >
                                        {"Convert"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                            {/* Edit */}
                            {hasAction(
                              permissions,
                              "manageInquiry",
                              "update"
                            ) && (
                              <Link href={`/inquiries/${row.id}`} passHref legacyBehavior>
                                <DropdownMenuItem asChild>
                                  <a>
                                    {/* <Pencil className="mr-2 h-4 w-4" /> */}
                                    View details
                                  </a>
                                </DropdownMenuItem>
                              </Link>
                            )}

                            {/* Assign Users */}
                            {canAssignInquiry && (
                              <DropdownMenuItem
                                onSelect={e => {
                                  e.preventDefault();
                                  setSelectedInquiry(row.id);
                                  setAssignOpen(true);
                                }}
                              >
                                {/* <Users className="mr-2 h-4 w-4" /> */}
                                Assign Inquiries
                              </DropdownMenuItem>
                            )}

                            {/* Delete */}
                            {hasAction(
                              permissions,
                              "manageInquiry",
                              "delete"
                            ) && (
                              <AlertDialog
                                open={
                                  deleteDialogOpen && deleteRow?.id === row.id
                                }
                                onOpenChange={(open) => {
                                  if (open) {
                                    setDeleteDialogOpen(true);
                                    setDeleteRow(row);
                                  } else {
                                    setDeleteDialogOpen(false);
                                    setDeleteRow(null);
                                  }
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={e => {
                                      e.preventDefault();
                                      setDeleteDialogOpen(true);
                                      setDeleteRow(row);
                                    }}
                                  >
                                    {/* <Trash2 className="mr-2 h-4 w-4" /> */}
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete inquiry?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      <span className="font-semibold">
                                        {row.customerName}
                                      </span>? This action cannot be undone
                                      and will permanently remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setDeleteDialogOpen(false);
                                        setDeleteRow(null);
                                        handleDelete(row.id);
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {"Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {searchQuery
                          ? "No inquiries match your search."
                          : "No inquiries found."}
                      </span>
                      {hasAction(permissions, "manageInquiry", "create") &&
                        !searchQuery && (
                          <Link href="/inquiries/new">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 mt-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add your first inquiry
                            </Button>
                          </Link>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-end gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
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
        )}
        
        {assignOpen && selectedInquiry && (
          <AssignInquiryUsersModal
            inquiryId={selectedInquiry}
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            onSuccess={loadInquiries}
          />
        )}
      </div>
    </ProtectedPage>
  );
}
