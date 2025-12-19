"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/components/context/AuthContext";
import { hasAction } from "@/lib/permissions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

import { AssignPurchaseOrderDialog } from "@/components/purchaseOrders/AssignPurchaseOrderDialog";

/* ---------------- TYPES ---------------- */

type PurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  customerDetails: {
    customerName: string;
  };
  leadId?: {
    customerName: string;
  };
  quotationId?: {
    quoteId: string;
  };
  poPdf?: {
    s3Url: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  totalPages: number;
};

/* ---------------- COMPONENT ---------------- */

export default function PurchaseOrderList() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "approved" | "completed">("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [poToAssign, setPoToAssign] = useState<PurchaseOrder | null>(null);

  const canAssign =
    user?.systemrole === "SuperAdmin" ||
    user?.role === "Manager" ||
    hasAction(user?.permissions, "managePurchaseOrder", "update");

  /* ---------------- FETCH ---------------- */

  const fetchOrders = async (page = 1) => {
    const res = await api.get(`/api/purchase-orders?page=${page}&limit=10`);
    setOrders(res.data.data || []);
    setPagination(res.data.pagination);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ---------------- FILTERING ---------------- */

  const filteredOrders = useMemo(() => {
    return orders.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        po.customerDetails.customerName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchStatus = status === "all" || po.status === status;

      return matchSearch && matchStatus;
    });
  }, [orders, search, status]);

  /* ---------------- DELETE ---------------- */

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/api/purchase-orders/${deleteId}`);
    fetchOrders(pagination.page);
    setDeleteId(null);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 md:p-6 max-w-8xl mx-auto space-y-4">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl">Purchase Orders</CardTitle>

          {/* SEARCH + STATUS */}
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Search by PO or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-sm"
            />

            <Select
              value={status}
              onValueChange={(v) => setStatus(v as any)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Sr.No</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((po, i) => (
                  <TableRow key={po.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{po.poNumber}</TableCell>
                    <TableCell>{po.customerDetails.customerName}</TableCell>
                    <TableCell>{po.quotationId?.quoteId || "-"}</TableCell>
                    <TableCell>
                      <Badge className="capitalize">{po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/purchase-orders/${po.id}`)
                            }
                          >
                            View
                          </DropdownMenuItem>

                          {canAssign && (
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setPoToAssign(po);
                                setAssignOpen(true);
                              }}
                            >
                              Assign
                            </DropdownMenuItem>
                          )}

                          {po.poPdf?.s3Url && (
                            <DropdownMenuItem asChild>
                              <a href={po.poPdf.s3Url} target="_blank">
                                View PDF
                              </a>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(po.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((po) => (
              <Card key={po.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div className="font-semibold">{po.poNumber}</div>
                    <Badge className="capitalize">{po.status}</Badge>
                  </div>
                  <div className="text-sm">
                    Customer: {po.customerDetails.customerName}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/purchase-orders/${po.id}`)
                    }
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => fetchOrders(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchOrders(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DELETE */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ASSIGN */}
      {poToAssign && (
        <AssignPurchaseOrderDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          purchaseOrderId={poToAssign.id}
          onAssigned={() => fetchOrders(pagination.page)}
        />
      )}
    </div>
  );
}
