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
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  User,
  ArrowRightCircle,
} from "lucide-react";
import Link from "next/link";
import ProtectedPage from "@/components/ProtectedPage";
import { hasAction } from "@/lib/permissions";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
const [limit] = useState(10);
const [totalPages, setTotalPages] = useState(1);
const [statusFilter, setStatusFilter] = useState("all");

  const permissions =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("admin") || "{}")?.permissions
      : {};

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
                            {hasAction(
                              permissions,
                              "manageInquiry",
                              "update"
                            ) &&
                              !row.isConvertedToLead &&
                              (row.status === "new" ||
                                row.status === "contacted") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <ArrowRightCircle className="h-4 w-4" />
                                      Convert To Lead
                                    </Button>
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
                                        onClick={() =>
                                          handleConvertToLead(row.id)
                                        }
                                        className="bg-primary text-white hover:bg-primary/90"
                                      >
                                        Convert
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                            {hasAction(
                              permissions,
                              "manageInquiry",
                              "update"
                            ) && (
                              <Link href={`/inquiries/${row.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                              </Link>
                            )}
                            {hasAction(
                              permissions,
                              "manageInquiry",
                              "delete"
                            ) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
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
                                      onClick={() => handleDelete(row.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
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
      </div>
    </ProtectedPage>
  );
}
