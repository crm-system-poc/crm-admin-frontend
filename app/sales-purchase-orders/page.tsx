"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SalesPO = {
  id: string;
  poNumber: string;
  status: string;
  parentPoId?: {
    poNumber: string;
  };
  accountId?: {
    customerName: string;
    phoneNumber?: string;
  };
};

export default function SalesPOListPage() {
  const router = useRouter();

  const [data, setData] = useState<SalesPO[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSalesPOs = async (pageNo = 1) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/sales-purchase-orders?page=${pageNo}&limit=10&search=${search}`
      );
      setData(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to fetch Sales POs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPOs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/sales-purchase-orders/${deleteId}`);
      toast.success("Sales PO deleted successfully");
      setDeleteId(null);
      fetchSalesPOs(page);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete Sales PO");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Add a refresh handler
  const handleRefresh = () => {
    fetchSalesPOs(page);
  };

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sales Purchase Orders</h1>
        {/* Refresh Button added here */}
      

        <div className="flex relative max-w-md gap-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by PO or Customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSalesPOs(1)}
          />
            <Button
          variant="outline"
         // size="icon"
         // className="ml-2"
          aria-label="Refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow >
              <TableHead>Sr.No</TableHead>
              <TableHead>Sales PO</TableHead>
              <TableHead>Base PO</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No sales purchase order found
                </TableCell>
              </TableRow>
            ) : (
              data.map((po, idx) => (
                <TableRow key={po.id}>
                  <TableCell>
                    {(page - 1) * 10 + idx + 1}
                  </TableCell>
                  <TableCell>{po.poNumber}</TableCell>
                  <TableCell>{po.parentPoId?.poNumber || "-"}</TableCell>
                  <TableCell>{po.accountId?.customerName}</TableCell>
                  <TableCell>
                    <Badge className="capitalize">{po.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                       
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/sales-purchase-orders/${po.id}/edit`)
                          }
                        >
                          {/* <Edit className="w-4 h-4 mr-2" /> */}
                          View details
                        </DropdownMenuItem>
                        {/* <DropdownMenuSeparator /> */}
                        <DropdownMenuItem
                          onClick={() => setDeleteId(po.id)}
                          className="text-destructive"
                        >
                          {/* <Trash2 className="w-4 h-4 mr-2" /> */}
                          Delete
                        </DropdownMenuItem>
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
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => fetchSalesPOs(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => fetchSalesPOs(page + 1)}
        >
          Next
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              Sales PO.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
