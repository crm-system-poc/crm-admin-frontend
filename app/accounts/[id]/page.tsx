"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import stateList from "@/state.json";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import LedgerTab from "@/components/accounts/LedgerTab";

export default function EditAccountPage() {
  const { id } = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any>(null);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // State for payments
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // NEW: One "refresh" loading to show spinning Refresh button globally
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load all data on mount
    fetchAll();
    // eslint-disable-next-line
  }, [id]);

  const fetchAll = async () => {
    setRefreshing(true);
    await Promise.all([loadAccountDetails(), loadRelatedData(), loadPayments()]);
    setRefreshing(false);
  };

  const loadAccountDetails = async () => {
    try {
      const res = await api.get(`/api/accounts/${id}`);
      setAccount(res.data.data);
      setForm({
        customerName: res.data.data.customerName ?? "",
        contactPerson: res.data.data.contactPerson ?? "",
        email: res.data.data.email ?? "",
        phoneNumber: res.data.data.phoneNumber ?? "",
        alternateNumber: res.data.data.alternateNumber ?? "",
        street: res.data.data.address?.street ?? "",
        city: res.data.data.address?.city ?? "",
        state: res.data.data.address?.state ?? "",
        zipCode: res.data.data.address?.zipCode ?? "",
        country: res.data.data.address?.country ?? "",
      });
    } catch {
      toast.error("Failed to load account");
    }
  };

  const loadRelatedData = async () => {
    try {
      setLoadingRelated(true);
      const res = await api.get(`/api/accounts/${id}/related`);
      setRelatedData(res.data.data);
    } catch (error: any) {
      console.error("Failed to load related data:", error);
      toast.error("Failed to load related data");
    } finally {
      setLoadingRelated(false);
    }
  };

  // Fetches payments from the /api/payments/account/{accountId} API
  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const res = await api.get(`/api/payments/account/${id}`);
      if (res.data && Array.isArray(res.data.data)) {
        setPayments(res.data.data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      setPayments([]);
      toast.error("Failed to load payment data");
    } finally {
      setLoadingPayments(false);
    }
  };

  // // For AddPaymentDialog success, reload payments
  // const handlePaymentSuccess = () => {
  //   loadPayments();
  //   loadRelatedData(); // In case you want side-reload
  // };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleStateChange = (value: string) => {
    setForm({
      ...form,
      state: value,
    });
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload = {
        customerName: form.customerName,
        contactPerson: form.contactPerson,
        email: form.email,
        phoneNumber: form.phoneNumber,
        alternateNumber: form.alternateNumber,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
      };
      await api.put(`/api/accounts/${id}`, payload);
      toast.success("Account updated successfully");
      router.push("/accounts");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update account");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      contacted: "bg-yellow-100 text-yellow-700",
      qualified: "bg-green-100 text-green-700",
      proposal_sent: "bg-purple-100 text-purple-700",
      negotiation: "bg-orange-100 text-orange-700",
      won: "bg-emerald-100 text-emerald-700",
      lost: "bg-red-100 text-red-700",
      draft: "bg-slate-100 text-slate-700",
      sent: "bg-blue-100 text-blue-700",
      accepted: "bg-emerald-100 text-emerald-700",
      rejected: "bg-rose-100 text-rose-700",
      expired: "bg-amber-100 text-amber-700",
      acknowledged: "bg-green-100 text-green-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  // If still loading main data, do not render form
  if (!account || !form) return null;

  // // Helper: get 'AddPaymentDialog', fallback empty for build
  // let AddPaymentDialog: any = () => null;
  // try {
  //   // eslint-disable-next-line @typescript-eslint/no-var-requires
  //   AddPaymentDialog = require("@/components/accounts/AddPaymentDialog").default;
  // } catch (_e) {
  //   // fallback noop
  //   AddPaymentDialog = () => null;
  // }

  return (
    <div className="max-w-8xl mx-auto p-6 space-y-4">
      {/* Back Button */}
      {/* <Button
        variant="ghost"
        onClick={() => router.push("/accounts")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Accounts
      </Button> */}

      {/* Refresh Button Add: */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          disabled={refreshing}
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Unified Big Tabs - Customer Details, Leads, Quotation, Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Account details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer-details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="customer-details">
                Customer Details
              </TabsTrigger>
              <TabsTrigger value="leads">
                Leads ({relatedData?.leads?.pagination?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="quotations">
                Quotations ({relatedData?.quotations?.pagination?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="purchase-orders">
                Purchase Orders (
                {relatedData?.purchaseOrders?.pagination?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
              <TabsTrigger value="payment">Payments</TabsTrigger>
            </TabsList>

            {/* Customer Details Tab */}
            <TabsContent value="customer-details">
              {/* Edit Form */}
              <form
                className="space-y-6 mt-8"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="customerName"
                      className="block mb-2 font-medium"
                    >
                      Customer Name
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      type="text"
                      value={form.customerName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Customer Name"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="contactPerson"
                      className="block mb-2 font-medium"
                    >
                      Contact Person
                    </Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      type="text"
                      value={form.contactPerson}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Contact Person"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="block mb-2 font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="phoneNumber"
                      className="block mb-2 font-medium"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="text"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="alternateNumber"
                      className="block mb-2 font-medium"
                    >
                      Alternate Number
                    </Label>
                    <Input
                      id="alternateNumber"
                      name="alternateNumber"
                      type="text"
                      value={form.alternateNumber}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Alternate Number (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="street" className="block mb-2 font-medium">
                      Street Address
                    </Label>
                    <Input
                      id="street"
                      name="street"
                      type="text"
                      value={form.street}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Street Address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="block mb-2 font-medium">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      value={form.city}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="City"
                    />
                  </div>
                  <div className="w-full">
                    <Label htmlFor="state" className="block mb-2 font-medium">
                      State
                    </Label>
                    <Select
                      value={form.state}
                      onValueChange={handleStateChange}
                      disabled={loading}
                      name="state"
                    >
                      <SelectTrigger id="state" name="state" className="w-full">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {stateList.map((item) => (
                          <SelectItem key={item.code} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="block mb-2 font-medium">
                      Zip Code
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      value={form.zipCode}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Postal Code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="block mb-2 font-medium">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      value={form.country}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div>
                  <Button
                    type="submit"
                    className="px-4 py-2 rounded disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Account"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads" className="mt-4">
              {loadingRelated ? (
                <div className="text-center py-8">Loading...</div>
              ) : relatedData?.leads?.data?.length > 0 ? (
                <div className="rounded-md border  overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedData.leads.data.map((lead: any) => (
                        <TableRow key={lead._id || lead.id}>
                          <TableCell>{lead.customerName}</TableCell>
                          <TableCell>{lead.contactPerson}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {lead.priority || "medium"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/leads/${lead._id || lead.id}`)
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No leads found for this account
                </div>
              )}
            </TabsContent>

            {/* Quotations Tab */}
            <TabsContent value="quotations" className="mt-4">
              {loadingRelated ? (
                <div className="text-center py-8">Loading...</div>
              ) : relatedData?.quotations?.data?.length > 0 ? (
                <div className="rounded-md border  overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Quote ID</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedData.quotations.data.map((quotation: any) => (
                        <TableRow key={quotation._id || quotation.id}>
                          <TableCell>{quotation.quoteId || "N/A"}</TableCell>
                          <TableCell>
                            {quotation.customerDetails?.customerName ||
                              quotation.leadId?.customerName ||
                              "N/A"}
                          </TableCell>
                          <TableCell>
                            ₹
                            {quotation.grandTotal?.toLocaleString() ||
                              quotation.totalQuoteValue?.toLocaleString() ||
                              "0"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(quotation.status)}>
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {quotation.dateOfQuote
                              ? new Date(
                                  quotation.dateOfQuote
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/quotation/${quotation._id || quotation.id}`
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No quotations found for this account
                </div>
              )}
            </TabsContent>

            {/* Purchase Orders Tab */}
            <TabsContent value="purchase-orders" className="mt-4">
              {loadingRelated ? (
                <div className="text-center py-8">Loading...</div>
              ) : relatedData?.purchaseOrders?.data?.length > 0 ? (
                <div className="rounded-md border  overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PO Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedData.purchaseOrders.data.map((po: any) => (
                        <TableRow key={po._id || po.id}>
                          <TableCell>{po.poNumber}</TableCell>
                          <TableCell>
                            {po.customerDetails?.customerName ||
                              po.leadId?.customerName ||
                              "N/A"}
                          </TableCell>
                          <TableCell>
                            ₹{po.totalAmount?.toLocaleString() || "0"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(po.status)}>
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {po.poDate
                              ? new Date(po.poDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/purchase-orders/${po._id || po.id}`
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase orders found for this account
                </div>
              )}
            </TabsContent>

            <TabsContent value="ledger" className="mt-4">
              <LedgerTab accountId={id as string} />
            </TabsContent>

            {/* Payments Tab --- REWRITTEN: uses payments API */}
            <TabsContent value="payment" className="mt-4">
              {/* Refresh button for this tab, small and in the top-right */}
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAll}
                  disabled={refreshing}
                  aria-label="Refresh"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              {loadingPayments ? (
                <div className="text-center py-8">Loading...</div>
              ) : payments && payments.length > 0 ? (
                <>
                  {/* Summary Small Cards for Total, Paid, Due */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className=" p-4 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-semibold text-xl">
                        ₹
                        {payments
                          .reduce(
                            (acc: number, p: any) => acc + (Number(p.totalAmount) || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">Paid</div>
                      <div className="font-semibold text-xl text-green-700">
                        ₹
                        {payments
                          .reduce(
                            (acc: number, p: any) => acc + (Number(p.totalPaid) || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className=" p-4 rounded-lg border text-center">
                      <div className="text-xs text-muted-foreground">Due</div>
                      <div className="font-semibold text-xl text-red-700">
                        ₹
                        {payments
                          .reduce(
                            (acc: number, p: any) => acc + (Number(p.totalDue) || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Payments Table
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment: any) => (
                          <TableRow key={payment._id}>
                            <TableCell>
                              {payment.purchaseOrderId?.poNumber || "-"}
                            </TableCell>
                            <TableCell>
                              {payment.purchaseOrderId?.poDate
                                ? new Date(payment.purchaseOrderId.poDate).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              ₹
                              {payment.totalAmount !== undefined
                                ? Number(payment.totalAmount).toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              ₹
                              {payment.totalPaid !== undefined
                                ? Number(payment.totalPaid).toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              ₹
                              {payment.totalDue !== undefined
                                ? Number(payment.totalDue).toLocaleString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  payment.status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : payment.status === "partial"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {payment.status?.toUpperCase?.() || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {payment.status !== "paid" && AddPaymentDialog && (
                                <AddPaymentDialog
                                  ledgerId={payment.ledgerId}
                                  purchaseOrderId={
                                    payment.purchaseOrderId?._id ||
                                    payment.purchaseOrderId?.id
                                  }
                                  onSuccess={handlePaymentSuccess}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div> */}

                  {/* Payment Transactions Breakdown Table (below, with PO context in above table) */}
                  <div className="mt-8">
                    <div className="font-semibold mb-2">Payment Transactions</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.every((p: any) => !p.accountPayments?.length) ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No payment transactions
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.flatMap((payment: any) => 
                            (payment.accountPayments || []).length === 0
                              ? []
                              : payment.accountPayments.map((p: any, i: number) => (
                                  <TableRow key={payment._id + '-' + i}>
                                    <TableCell>
                                      {payment.purchaseOrderId?.poNumber || "-"}
                                    </TableCell>
                                    <TableCell>
                                      ₹{p.amountCollected}
                                    </TableCell>
                                    <TableCell>
                                      {p.paymentMode || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {p.paidAt
                                        ? new Date(p.paidAt).toLocaleDateString()
                                        : "-"}
                                    </TableCell>
                                    <TableCell>
                                      {p.note || "-"}
                                    </TableCell>
                                  </TableRow>
                                ))
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payment records found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
