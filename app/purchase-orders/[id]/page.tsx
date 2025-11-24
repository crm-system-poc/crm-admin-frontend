"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { hasModule, hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.valueOf())) return "-";
    return d.toISOString().slice(0, 10);
  } catch {
    return "-";
  }
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  const [customerDetails, setCustomerDetails] = useState<any>({
    customerName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    country: ""
  });

  const [leadDetails, setLeadDetails] = useState<any>({
    customerName: "",
    contactPerson: "",
    email: "",
    id: "",
    status: "",
    requirementDetails: "",
    location: ""
  });

  // For controlled quotation detail input fields (read-only but using input fields)
  const [quotationDetails, setQuotationDetails] = useState<any>({
    quoteId: "",
    status: "",
    grandTotal: "",
    currency: "",
    validUntil: "",
    pdfUrl: "",
    pdfName: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await api.get(`/api/purchase-orders/${id}`);
      setOrder(res.data.data);
      setStatus(res.data.data.status || "");

      setCustomerDetails({
        customerName: res.data.data.customerDetails?.customerName || "",
        contactPerson: res.data.data.customerDetails?.contactPerson || "",
        email: res.data.data.customerDetails?.email || "",
        phoneNumber: res.data.data.customerDetails?.phoneNumber || "",
        country: res.data.data.customerDetails?.address?.country || ""
      });

      setLeadDetails({
        customerName: res.data.data.leadId?.customerName || "",
        contactPerson: res.data.data.leadId?.contactPerson || "",
        email: res.data.data.leadId?.email || "",
        id: res.data.data.leadId?.id || "",
        status: res.data.data.leadId?.status || "",
        requirementDetails: res.data.data.leadId?.requirementDetails || "",
        location: res.data.data.leadId?.location || ""
      });

      setQuotationDetails({
        quoteId: res.data.data.quotationId?.quoteId || "",
        status: res.data.data.quotationId?.status || "",
        grandTotal: res.data.data.quotationId?.grandTotal !== undefined && res.data.data.quotationId?.grandTotal !== null ? String(res.data.data.quotationId?.grandTotal) : "",
        currency: res.data.data.quotationId?.currency || "",
        validUntil: res.data.data.quotationId?.validUntil || "",
        pdfUrl: res.data.data.quotationId?.pdfFile?.s3Url || "",
        pdfName: res.data.data.quotationId?.pdfFile?.originalName || "",
      });
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async () => {
    await api.put(`/api/purchase-orders/${id}/status`, { status });
    toast.success("Status Updated ✅");
    const res = await api.get(`/api/purchase-orders/${id}`);
    setOrder(res.data.data);
    setStatus(res.data.data.status || "");
    setCustomerDetails({
      customerName: res.data.data.customerDetails?.customerName || "",
      contactPerson: res.data.data.customerDetails?.contactPerson || "",
      email: res.data.data.customerDetails?.email || "",
      phoneNumber: res.data.data.customerDetails?.phoneNumber || "",
      country: res.data.data.customerDetails?.address?.country || ""
    });
    setLeadDetails({
      customerName: res.data.data.leadId?.customerName || "",
      contactPerson: res.data.data.leadId?.contactPerson || "",
      email: res.data.data.leadId?.email || "",
      id: res.data.data.leadId?.id || "",
      status: res.data.data.leadId?.status || "",
      requirementDetails: res.data.data.leadId?.requirementDetails || "",
      location: res.data.data.leadId?.location || ""
    });
    setQuotationDetails({
      quoteId: res.data.data.quotationId?.quoteId || "",
      status: res.data.data.quotationId?.status || "",
      grandTotal: res.data.data.quotationId?.grandTotal !== undefined && res.data.data.quotationId?.grandTotal !== null ? String(res.data.data.quotationId?.grandTotal) : "",
      currency: res.data.data.quotationId?.currency || "",
      validUntil: res.data.data.quotationId?.validUntil || "",
      pdfUrl: res.data.data.quotationId?.pdfFile?.s3Url || "",
      pdfName: res.data.data.quotationId?.pdfFile?.originalName || "",
    });
  };

  if (!mounted || !order) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6  space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex" >
            Purchase Order &nbsp; <span className="block font-semibold">{order.poNumber}</span>

          
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
         
          {/* Customer (PO) details */}
          <div>
            <h2 className="font-semibold mb-2 text-lg">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="customerName-input">Customer Name</label>
                <Input
                  id="customerName-input"
                  value={customerDetails.customerName}
                  readOnly
                  className="font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="contactPerson-input">Contact Person</label>
                <Input
                  id="contactPerson-input"
                  value={customerDetails.contactPerson}
                  readOnly
                  className="font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="email-input">Email</label>
                <Input
                  id="email-input"
                  value={customerDetails.email}
                  readOnly
                  className="font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="phoneNumber-input">Phone Number</label>
                <Input
                  id="phoneNumber-input"
                  value={customerDetails.phoneNumber}
                  readOnly
                  className="font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="country-input">Country</label>
                <Input
                  id="country-input"
                  value={customerDetails.country}
                  readOnly
                  className="font-semibold"
                />
              </div>
              <div className="flex items-center gap-4 mt-5">
              {/* <Badge className="capitalize px-6 py-1">{order.status}</Badge> */}
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <>
              {hasAction(user.permissions, "managePurchaseOrder", "update") && (
              <Button onClick={updateStatus} size="sm">Update Status</Button>
              )}
              </>
            </div>
            </div>
          </div>

          {/* Lead & Quotation
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-1">Lead</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="lead-customerName-input">Name</label>
                  <Input
                    id="lead-customerName-input"
                    value={leadDetails.customerName}
                    readOnly
                    className="font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="lead-contactPerson-input">Contact Person</label>
                  <Input
                    id="lead-contactPerson-input"
                    value={leadDetails.contactPerson}
                    readOnly
                    className="font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="lead-email-input">Email</label>
                  <Input
                    id="lead-email-input"
                    value={leadDetails.email}
                    readOnly
                    className="font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="lead-status-input">Status</label>
                  <Input
                    id="lead-status-input"
                    value={leadDetails.status}
                    readOnly
                    className="capitalize"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="lead-requirement-input">Requirement</label>
                  <Input
                    id="lead-requirement-input"
                    value={leadDetails.requirementDetails}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="lead-location-input">Location</label>
                  <Input
                    id="lead-location-input"
                    value={leadDetails.location}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div >
              <h3 className="font-medium mb-1">Quotation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
           
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="quotation-status-input">Status</label>
                  <Input
                    id="quotation-status-input"
                    value={quotationDetails.status}
                    readOnly
                    className="capitalize"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="quotation-grandTotal-input">Grand Total</label>
                  <Input
                    id="quotation-grandTotal-input"
                    value={quotationDetails.grandTotal}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="quotation-currency-input">Currency</label>
                  <Input
                    id="quotation-currency-input"
                    value={quotationDetails.currency}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="quotation-validUntil-input">Validity Until</label>
                  <Input
                    id="quotation-validUntil-input"
                    value={quotationDetails.validUntil ? formatDate(quotationDetails.validUntil) : ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1" htmlFor="quotation-pdf-input">Quotation PDF</label>
                  {quotationDetails.pdfUrl ? (
                    <a
                      href={quotationDetails.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {quotationDetails.pdfName || "View PDF"}
                    </a>
                  ) : (
                    <Input
                      id="quotation-pdf-input"
                      value={"Not uploaded"}
                      readOnly
                      className="italic"
                    />
                  )}
                </div>
              </div>
            </div>
          </div> */}

          {/* PO PDF */}
          <div>
            <h2 className="font-semibold text-lg mb-1">PO PDF</h2>
            {order.poPdf?.s3Url ? (
              <div>
                <a
                  href={order.poPdf.s3Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  {order.poPdf.originalName || "PO PDF"}
                </a>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({Math.round(order.poPdf.fileSize / 1024)} KB)
                </span>
                <span className="ml-4 text-xs text-muted-foreground">Uploaded: {formatDate(order.poPdf.uploadedAt)}</span>
              </div>
            ) : (
              <span className="italic text-muted-foreground">Not uploaded</span>
            )}
          </div>

          {/* Items Table */}
          <div className="shadow-sm p-4 border rounded-md">
            <h2 className="font-semibold mb-2 text-lg">Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No.</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.items || []).map((item: any, index: number) => (
                  <TableRow key={item._id || item.productId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.productId}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell className="capitalize">{item.licenseType}</TableCell>
                    <TableCell>
                      {item.licenseExpiryDate ? formatDate(item.licenseExpiryDate) : "-"}
                    </TableCell>
                    <TableCell>{item.totalPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payment/Delivery Terms & Notes */}
          <div className=" mt-6 gap-6">
            <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium block mb-1">Payment Terms</label>
                <Textarea value={order.paymentTerms || ""} readOnly className=" resize-none" />
              </div>
              <div>
                <label className="font-medium block mb-1">Delivery Terms</label>
                <Textarea value={order.deliveryTerms || ""} readOnly className=" resize-none" />
              </div>
              <div>
                <label className="font-medium block mb-1">Notes</label>
                <Textarea value={order.notes || ""} readOnly className=" resize-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
