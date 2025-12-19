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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  User,
  ArrowRightCircle,
  MoreVertical,
  Users,
} from "lucide-react";
import Link from "next/link";
import ProtectedPage from "@/components/ProtectedPage";
import { hasAction } from "@/lib/permissions";
import { api } from "@/lib/api";
import { toast } from "sonner";
import AssignInquiryUsersModal from "@/components/Inquiry/AssignInquiryUsersModal";
import { useAuth } from "@/components/context/AuthContext";

export default function InquiriesPage() {

  const { user, logout } = useAuth();
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
  }, []);

  const handleConvertToLead = async (id: string) => {
    try {
      const res = await api.post(`/api/inquiries/${id}/convert`);
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
      <Badge variant={variants[status.toLowerCase()] || "outline"}>
        {status}
      </Badge>
    );
  };

  const filteredInquiries = inquiries.filter(
    (inquiry) =>
      inquiry.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.phoneNumber?.includes(searchQuery)
  );

  return (
    <ProtectedPage module="manageInquiry">
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inquiries</h2>
            <p className="text-muted-foreground">
              Manage and track customer inquiries
            </p>
          </div>

          {hasAction(permissions, "manageInquiry", "create") && (
            <Link href="/inquiries/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Inquiry
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Inquiries</CardTitle>
                <CardDescription>
                  {filteredInquiries.length} total inquiries
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Name
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex justify-center items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : Array.isArray(filteredInquiries) &&
                    filteredInquiries.length > 0 ? (
                    filteredInquiries.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.customerName}
                        </TableCell>
                        <TableCell>{row.phoneNumber}</TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {/* Replace all action icon buttons with a dropdown menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground"
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
                                          onSelect={e => {
                                            // Prevent closing the dropdown before dialog appears
                                            e.preventDefault();
                                            setConvertDialogOpen(true);
                                            setConvertRow(row);
                                          }}
                                        >
                                          <ArrowRightCircle className="mr-2 h-4 w-4 text-green-600" />
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
                                            <strong>{row.customerName}</strong>{" "}
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
                                              handleConvertToLead(row.id)
                                            }}
                                            className="bg-primary text-white hover:bg-primary/90"
                                          >
                                            Convert
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
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
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
                                    <Users className="mr-2 h-4 w-4" />
                                    Assign Users
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
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you absolutely sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will
                                          permanently delete the inquiry for{" "}
                                          {row.customerName}.
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
                                            handleDelete(row.id)
                                          }}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
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
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-muted-foreground">
                            {searchQuery
                              ? "No inquiries match your search."
                              : "No inquiries found."}
                          </p>
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
          </CardContent>
        </Card>
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
