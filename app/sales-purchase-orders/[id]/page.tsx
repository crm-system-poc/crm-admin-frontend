"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, ArrowLeft } from "lucide-react";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.valueOf())) return "-";
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

export default function SalesPODetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [salesPO, setSalesPO] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesPO = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/sales-purchase-orders/${id}`);
        setSalesPO(res.data.data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.error || "Failed to load Sales PO"
        );
        router.push("/sales-purchase-orders");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesPO();
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!salesPO) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700",
      sent: "bg-blue-100 text-blue-700",
      acknowledged: "bg-green-100 text-green-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/sales-purchase-orders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => router.push(`/sales-purchase-orders/${id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Sales Purchase Order Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                PO Number: {salesPO.poNumber}
              </p>
            </div>
            <Badge className={getStatusColor(salesPO.status)}>
              {salesPO.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">PO Date</p>
              <p className="text-sm">{formatDate(salesPO.poDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-sm font-semibold">
                ₹{salesPO.totalAmount?.toLocaleString() || "0"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currency</p>
              <p className="text-sm">{salesPO.currency || "INR"}</p>
            </div>
          </div>

          {/* Customer Details */}
          {salesPO.customerDetails && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p className="text-sm">{salesPO.customerDetails.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p className="text-sm">{salesPO.customerDetails.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{salesPO.customerDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{salesPO.customerDetails.phoneNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Parent PO */}
          {salesPO.parentPoId && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Base Purchase Order</h3>
              <p className="text-sm">
                PO Number: <strong>{salesPO.parentPoId.poNumber}</strong>
              </p>
            </div>
          )}

          {/* Items */}
          {salesPO.items && salesPO.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Items</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>License Type</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesPO.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.productId}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.licenseType}</Badge>
                        </TableCell>
                        <TableCell>₹{item.unitPrice?.toLocaleString() || "0"}</TableCell>
                        <TableCell>₹{item.totalPrice?.toLocaleString() || "0"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesPO.paymentTerms && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Payment Terms
                </p>
                <p className="text-sm">{salesPO.paymentTerms}</p>
              </div>
            )}
            {salesPO.deliveryTerms && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Delivery Terms
                </p>
                <p className="text-sm">{salesPO.deliveryTerms}</p>
              </div>
            )}
            {salesPO.amcPeriod && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  AMC Period
                </p>
                <p className="text-sm">{salesPO.amcPeriod}</p>
              </div>
            )}
            {salesPO.rewardId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Reward ID
                </p>
                <p className="text-sm">{salesPO.rewardId}</p>
              </div>
            )}
            {salesPO.notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{salesPO.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

