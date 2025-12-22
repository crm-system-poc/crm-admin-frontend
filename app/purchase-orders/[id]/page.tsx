"use client";

import { useEffect, useState, useRef } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";
import { Download, Loader2 } from "lucide-react";

// PDF export dependencies
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const COLOR_FIX_STYLE_ID = "html2canvas-color-fix";

// Injects CSS that forces colors into RGB inside the PDF root only
function injectColorFallbackCSS() {
  if (typeof document === "undefined") return;

  // Avoid injecting twice
  if (document.getElementById(COLOR_FIX_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = COLOR_FIX_STYLE_ID;

  // Scoped only to [data-pdf-root="true"] to avoid affecting whole app
  style.innerHTML = `
    [data-pdf-root="true"],
    [data-pdf-root="true"] * {
      color: rgb(0, 0, 0) !important;
      background-color: rgb(255, 255, 255) !important;
      border-color: rgb(229, 231, 235) !important;
    }

    [data-pdf-root="true"] svg,
    [data-pdf-root="true"] svg * {
      fill: rgb(0, 0, 0) !important;
      stroke: rgb(0, 0, 0) !important;
    }
  `;

  document.head.appendChild(style);
}

function removeColorFallbackCSS() {
  if (typeof document === "undefined") return;
  const style = document.getElementById(COLOR_FIX_STYLE_ID);
  if (style) style.remove();
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const { user } = useAuth();
  const userPermissions = user?.permissions || {};

  const [customerDetails, setCustomerDetails] = useState<any>({
    customerName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    country: "",
  });

  const [leadDetails, setLeadDetails] = useState<any>({
    customerName: "",
    contactPerson: "",
    email: "",
    id: "",
    status: "",
    requirementDetails: "",
    location: "",
  });

  const [quotationDetails, setQuotationDetails] = useState<any>({
    quoteId: "",
    status: "",
    grandTotal: "",
    currency: "",
    validUntil: "",
    pdfUrl: "",
    pdfName: "",
  });

  // Ref for the main content to export as PDF
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/api/purchase-orders/${id}`);
        const data = res.data.data;
        setOrder(data);
        setStatus(data.status || "");

        setCustomerDetails({
          customerName: data.customerDetails?.customerName || "",
          contactPerson: data.customerDetails?.contactPerson || "",
          email: data.customerDetails?.email || "",
          phoneNumber: data.customerDetails?.phoneNumber || "",
          country: data.customerDetails?.address?.country || "",
        });

        setLeadDetails({
          customerName: data.leadId?.customerName || "",
          contactPerson: data.leadId?.contactPerson || "",
          email: data.leadId?.email || "",
          id: data.leadId?.id || "",
          status: data.leadId?.status || "",
          requirementDetails: data.leadId?.requirementDetails || "",
          location: data.leadId?.location || "",
        });

        setQuotationDetails({
          quoteId: data.quotationId?.quoteId || "",
          status: data.quotationId?.status || "",
          grandTotal:
            data.quotationId?.grandTotal !== undefined &&
            data.quotationId?.grandTotal !== null
              ? String(data.quotationId?.grandTotal)
              : "",
          currency: data.quotationId?.currency || "",
          validUntil: data.quotationId?.validUntil || "",
          pdfUrl: data.quotationId?.pdfFile?.s3Url || "",
          pdfName: data.quotationId?.pdfFile?.originalName || "",
        });
      } catch (error) {
        console.error("Failed to fetch purchase order details", error);
        toast.error("Failed to load purchase order details");
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  const updateStatus = async () => {
    try {
      await api.put(`/api/purchase-orders/${id}/status`, { status });
      toast.success("Status Updated ✅");

      const res = await api.get(`/api/purchase-orders/${id}`);
      const data = res.data.data;

      setOrder(data);
      setStatus(data.status || "");

      setCustomerDetails({
        customerName: data.customerDetails?.customerName || "",
        contactPerson: data.customerDetails?.contactPerson || "",
        email: data.customerDetails?.email || "",
        phoneNumber: data.customerDetails?.phoneNumber || "",
        country: data.customerDetails?.address?.country || "",
      });

      setLeadDetails({
        customerName: data.leadId?.customerName || "",
        contactPerson: data.leadId?.contactPerson || "",
        email: data.leadId?.email || "",
        id: data.leadId?.id || "",
        status: data.leadId?.status || "",
        requirementDetails: data.leadId?.requirementDetails || "",
        location: data.leadId?.location || "",
      });

      setQuotationDetails({
        quoteId: data.quotationId?.quoteId || "",
        status: data.quotationId?.status || "",
        grandTotal:
          data.quotationId?.grandTotal !== undefined &&
          data.quotationId?.grandTotal !== null
            ? String(data.quotationId?.grandTotal)
            : "",
        currency: data.quotationId?.currency || "",
        validUntil: data.quotationId?.validUntil || "",
        pdfUrl: data.quotationId?.pdfFile?.s3Url || "",
        pdfName: data.quotationId?.pdfFile?.originalName || "",
      });
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status");
    }
  };

  // Enhanced, stable PDF Export Handler
  const handleExportPDF = async () => {
    if (!pdfRef.current) {
      toast.error("Unable to generate PDF");
      return;
    }

    setIsExporting(true);

    const element = pdfRef.current;

    // Store original styles to avoid layout issues after capture
    const originalStyles = {
      overflow: element.style.overflow,
      height: element.style.height,
      maxHeight: element.style.maxHeight,
    };

    try {
      // Make sure the full content is visible for capture
      element.style.overflow = "visible";
      element.style.height = "auto";
      element.style.maxHeight = "none";

      // Inject scoped CSS fallback for unsupported color functions
      injectColorFallbackCSS();

      // Let the browser recalc layout/styles
      await new Promise((resolve) => setTimeout(resolve, 50));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 20;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      // First page
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      // Extra pages if content is taller than one page
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      const filename = `PO_${order?.poNumber || id}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      pdf.save(filename);
      toast.success("PDF exported successfully! 📄");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      // Restore original styles & remove CSS override
      element.style.overflow = originalStyles.overflow;
      element.style.height = originalStyles.height;
      element.style.maxHeight = originalStyles.maxHeight;
      removeColorFallbackCSS();
      setIsExporting(false);
    }
  };

  if (!mounted || !order) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex text-2xl flex-wrap items-center gap-2">
        Purchase Order
      
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            size="sm"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to PDF
              </>
            )}
          </Button>
        </CardHeader>

        {/* PDF Export Content */}
        <CardContent
          className="space-y-6"
          ref={pdfRef}
          data-pdf-root="true"
        >
          {/* Customer (PO) details */}
          <div>
            <h2 className="font-semibold mb-2 text-lg">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  className="block text-xs text-muted-foreground mb-1"
                  htmlFor="customerName-input"
                >
                  Customer Name
                </label>
                <Input
                  id="customerName-input"
                  value={customerDetails.customerName}
                  readOnly
                />
              </div>
              <div>
                <label
                  className="block text-xs text-muted-foreground mb-1"
                  htmlFor="contactPerson-input"
                >
                  Contact Person
                </label>
                <Input
                  id="contactPerson-input"
                  value={customerDetails.contactPerson}
                  readOnly
                  
                />
              </div>
              <div>
                <label
                  className="block text-xs text-muted-foreground mb-1"
                  htmlFor="email-input"
                >
                  Email
                </label>
                <Input
                  id="email-input"
                  value={customerDetails.email}
                  readOnly
                
                />
              </div>
              <div>
                <label
                  className="block text-xs text-muted-foreground mb-1"
                  htmlFor="phoneNumber-input"
                >
                  Phone Number
                </label>
                <Input
                  id="phoneNumber-input"
                  value={customerDetails.phoneNumber}
                  readOnly
                  
                />
              </div>
              <div>
                <label
                  className="block text-xs text-muted-foreground mb-1"
                  htmlFor="country-input"
                >
                  Country
                </label>
                <Input
                  id="country-input"
                  value={customerDetails.country}
                  readOnly
                
                />
              </div>
              <div className="flex items-center gap-4 mt-5">
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
                {hasAction(
                  userPermissions,
                  "managePurchaseOrder",
                  "update"
                ) && (
                  <Button onClick={updateStatus} size="sm">
                    Update Status
                  </Button>
                )}
              </div>
            </div>
          </div>

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
                {typeof order.poPdf.fileSize === "number" && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({Math.round(order.poPdf.fileSize / 1024)} KB)
                  </span>
                )}
                {order.poPdf.uploadedAt && (
                  <span className="ml-4 text-xs text-muted-foreground">
                    Uploaded: {formatDate(order.poPdf.uploadedAt)}
                  </span>
                )}
              </div>
            ) : (
              <span className="italic text-muted-foreground">
                Not uploaded
              </span>
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
                  <TableRow key={item._id || item.productId || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.productId}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell className="capitalize">
                      {item.licenseType}
                    </TableCell>
                    <TableCell>
                      {item.licenseExpiryDate
                        ? formatDate(item.licenseExpiryDate)
                        : "-"}
                    </TableCell>
                    <TableCell>{item.totalPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payment/Delivery Terms & Notes */}
          <div className="mt-6 gap-6">
            <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium block mb-1">
                  Payment Terms
                </label>
                <Textarea
                  value={order.paymentTerms || ""}
                  readOnly
                  className="resize-none"
                />
              </div>
              <div>
                <label className="font-medium block mb-1">
                  Delivery Terms
                </label>
                <Textarea
                  value={order.deliveryTerms || ""}
                  readOnly
                  className="resize-none"
                />
              </div>
              <div>
                <label className="font-medium block mb-1">Notes</label>
                <Textarea
                  value={order.notes || ""}
                  readOnly
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
