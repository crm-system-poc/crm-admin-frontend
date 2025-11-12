"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MoreVertical } from "lucide-react";

// Simple AlertDialog
function ConfirmDialog({ open, onConfirm, onCancel, title, description }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-6 w-[360px] max-w-[85vw]">
        <div className="font-bold text-lg mb-2">{title}</div>
        <div className="mb-4 text-sm">{description}</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Yes, Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

type CustomerDetails = {
  customerName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
};

type Lead = {
  customerName: string;
  contactPerson: string;
  email: string;
  id: string;
};

type Quotation = {
  quoteId: string;
  totalQuoteValue: number;
  id: string;
};

type Item = {
  productId: string;
  description: string;
  quantity: number;
  licenseType: string;
  licenseExpiryDate?: string;
  unitPrice: number;
  totalPrice: number;
  _id: string;
};

type POPdf = {
  originalName: string;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  uploadedAt: string;
};

type CreatedBy = {
  name: string;
  email: string;
  id: string;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  customerDetails: CustomerDetails;
  leadId: Lead;
  quotationId: Quotation;
  poDate: string;
  poPdf: POPdf;
  items: Item[];
  totalAmount: number;
  currency: string;
  status: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  attachments: any[];
  createdBy: CreatedBy;
  createdAt: string;
  updatedAt: string;
};

export default function PurchaseOrderList() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = async () => {
    const res = await api.get("/api/purchase-orders");
    setOrders(res.data.data || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/purchase-orders/${deleteId}`);
      setOrders((prev) => prev.filter((order) => order.id !== deleteId));
      setDialogOpen(false);
      setDeleteId(null);
    } catch (err) {
      alert("Failed to delete Purchase Order.");
    }
    setDeleting(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 ">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Purchase Orders</h1>
      </div>

      <div className="border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 text-center">Sr.No</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Quotation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Purchase order not found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((po, idx) => (
                <TableRow key={po.id} className="hover:bg-muted/30">
                  <TableCell className="text-center">{idx + 1}</TableCell>
                  <TableCell>{po.poNumber || po.id}</TableCell>
                  <TableCell>{po.customerDetails?.contactPerson || "-"}</TableCell>
                  <TableCell>
                    {po.leadId
                      ? `${po.leadId.customerName} `
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {po.quotationId
                      ? `${po.quotationId.quoteId ?? po.quotationId.id}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize">{po.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/purchase-orders/${po.id}`)}
                        >
                          View
                        </DropdownMenuItem>
                        {po.poPdf?.s3Url && (
                          <DropdownMenuItem
                            asChild
                          >
                            <a
                              href={po.poPdf.s3Url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              PDF
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(po.id)}
                          disabled={deleting && deleteId === po.id}
                          className="text-destructive"
                        >
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

      <ConfirmDialog
        open={dialogOpen}
        title="Delete Purchase Order"
        description="Are you sure you want to delete this purchase order? This action cannot be undone."
        onCancel={() => { setDialogOpen(false); setDeleteId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
