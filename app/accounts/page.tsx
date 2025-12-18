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
import { Plus, Pencil, Trash2 } from "lucide-react";
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const router = useRouter();

  // For delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get(
        `/api/accounts?search=${encodeURIComponent(search)}&page=${page}`
      );
      setAccounts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      // Optional: handle error (e.g., setAccounts([]) or show a notification)
      setAccounts([]);
      setTotalPages(1);
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
  }, [search, page]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Accounts</h1>
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search by name / email / phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/accounts/create")}>
          Add Account
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>City</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No account found
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((acc) => (
              <TableRow key={acc.id ?? acc._id}>
                <TableCell>{acc.customerName}</TableCell>
                <TableCell>{acc.email}</TableCell>
                <TableCell>{acc.phoneNumber}</TableCell>
                <TableCell>{acc.address?.city}</TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/accounts/${acc._id}`)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {/* Delete icon with AlertDialog */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(acc.id ?? acc._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this account? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex justify-end gap-2">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>

      <AccountDialog
        open={open}
        onClose={() => setOpen(false)}
        editData={editData}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}
