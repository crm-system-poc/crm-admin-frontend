"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  MoreVertical,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AccountDialog } from "./AccountDialog";
import { api } from "@/lib/api";
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
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Menu components (assuming shadcn/ui or similar is available)
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/accounts?search=${encodeURIComponent(search)}&page=${page}`
      );
      setAccounts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total || 0);
    } catch (error) {
      setAccounts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/accounts/${deleteId}`);
      setDeleteId(null);
      fetchAccounts();
    } catch (error) {
      // Optional: error notification
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line
  }, [search, page]);

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {/* <Users className="h-8 w-8" /> */}
            Accounts
          </h1>
          {/* <p className="text-muted-foreground mt-1">
            Manage your customer accounts and information
          </p> */}
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 ml-auto w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Refresh button is added here */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchAccounts()}
            className="w-full md:w-auto mt-2 md:mt-0 flex items-center "
            disabled={loading}
          >
            {/* <RefreshCw className={` h-4 w-4 ${loading ? "animate-spin" : ""}`} /> */}
            Refresh
          </Button>
          <Button
            onClick={() => router.push("/accounts/create")}
          >
            {/* <Plus className="mr-2 h-4 w-4" /> */}
            Add Account
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader >
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Sr.No</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">City</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  Loading accounts...
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">
                      No accounts found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or add a new account
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc, index) => (
                <TableRow
                  key={acc.id ?? acc._id}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {acc.customerName}
                  </TableCell>
                  <TableCell >
                    {acc.email}
                  </TableCell>
                  <TableCell >
                    {acc.phoneNumber}
                  </TableCell>
                  <TableCell>
                    {acc.address.city}
                  </TableCell>
                  <TableCell>
                    {typeof acc.isActive === "boolean" ? (
                      <Badge
                        variant={acc.isActive ? "default" : "destructive"}
                      >
                        {acc.isActive ? "Active" : "Inactive"}
                      </Badge>
                    ) : (
                      <span>
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted/50"
                          aria-label="Open actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/accounts/${acc._id}`)
                          }
                        >
                          {/* <Pencil className="w-4 h-4 mr-2" /> */}
                          View details
                        </DropdownMenuItem>
                        {/* <DropdownMenuSeparator /> */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(acc.id ?? acc._id)}
                              className="text-destructive focus:bg-destructive/10"
                            >
                              {/* <Trash2 className="h-4 w-4 mr-2" /> */}
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete account?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">
                                  {acc.customerName}
                                </span>
                                ? This action cannot be undone and will
                                permanently remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setDeleteId(null)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive"
                              >
                                {deleting ? "Deleting..." : "Delete"}
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

      {/* Pagination (lead style) */}
      {/* {totalPages > 1 && ( */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
            {typeof total === "number" && total > 0 && (
              <> • {total} total</>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      {/* )} */}
    </div>
  );
}
