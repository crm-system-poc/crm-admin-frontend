"use client";

import { useEffect, useState } from "react";
import { AppBar } from "@/components/appbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  IndianRupee,
  BarChart3,
  LineChart as LucideLineChart,
  BarChartBig,
  ArrowRight,
  Timer,
  Layers,
  Crown,
  ShoppingBag
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Purchase Orders Stats Mock (from prompt)
const poStats = {
  totalPOs: 5,
  status: {
    totalDraft: 3,
    totalSent: 0,
    totalAcknowledged: 0,
    totalInProgress: 1,
    totalCompleted: 1,
    totalCancelled: 0,
  },
  attachmentSummary: {
    totalWithPDF: 5,
    totalWithoutPDF: 0,
  },
  licenses: {
    expired: 0,
    expiringSoon: 5,
  },
  financials: {
    totalAmountSum: 585000,
  }
};

// Mock time series data for each card stat
const leadsTrend = [
  { month: "Jan", leads: 14 },
  { month: "Feb", leads: 28 },
  { month: "Mar", leads: 37 },
  { month: "Apr", leads: 50 },
  { month: "May", leads: 42 },
];

const revenueData = [
  { month: "Jan", amount: 60000 },
  { month: "Feb", amount: 85000 },
  { month: "Mar", amount: 120000 },
  { month: "Apr", amount: 90000 },
  { month: "May", amount: 140000 },
];

// NEW: Mock time series for Quotation stats
const quotationsTrend = [
  { month: "Jan", quotations: 10 },
  { month: "Feb", quotations: 16 },
  { month: "Mar", quotations: 12 },
  { month: "Apr", quotations: 19 },
  { month: "May", quotations: 22 },
];

// NEW: Mock time series for Purchase Order stats
const purchaseOrderTrend = [
  { month: "Jan", purchaseOrders: 2 },
  { month: "Feb", purchaseOrders: 1 },
  { month: "Mar", purchaseOrders: 0 },
  { month: "Apr", purchaseOrders: 1 },
  { month: "May", purchaseOrders: 1 },
];

// NEW: Mock status breakdowns for small line/area charts per status (example)
// For real app, you could query backend for per-status timeseries.
const statusTrends = {
  leads: leadsTrend.map((d) => ({ ...d, value: d.leads })),
  totalValue: revenueData.map((d) => ({ ...d, value: d.amount })),
  quotations: quotationsTrend.map((d) => ({ ...d, value: d.quotations })),
  purchaseOrders: purchaseOrderTrend.map((d) => ({ ...d, value: d.purchaseOrders })),
};

const recentLeads = [
  { name: "Sarah Smith", company: "XYZ Pvt Ltd", stage: "Proposal Sent" },
  { name: "Manish Patel", company: "SoftWeb", stage: "Negotiation" },
];

// Helper to auto color small lines per stat
const statLineColor = {
  leads: "#ec4899",
  totalValue: "#22c55e",
  quotations: "#6366f1",
  purchaseOrders: "#0ea5e9",
};

function MiniLineChart({
  data,
  dataKey = "value",
  color = "#8884d8",
  ...props
}: {
  data: any[];
  dataKey?: string;
  color?: string;
  width?: number;
  height?: number;
}) {
  // Minimal axes, no dots, no tooltip, sparkline
  return (
    <div style={{ width: 80, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Home() {
  const [apiStats, setApiStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Combine all stats fetches for synchronized loading and error
    const fetchAllStats = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch leads/quotation normally, but override purchase order stats with new structure
        const [leadRes, quotationRes] = await Promise.all([
          fetch("http://localhost:8080/api/leads/stats", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }),
          fetch("http://localhost:8080/api/quotations/stats", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }),
        ]);
        const leadJson = await leadRes.json();
        const quotationJson = await quotationRes.json();
        // Override purchaseOrders property based on poStats from above
        if (leadJson.success && quotationJson.success) {
          setApiStats({
            ...leadJson.data,
            quotations: quotationJson.data,
            purchaseOrders: {
              totalPurchaseOrders: poStats.totalPOs,
              totalValue: poStats.financials.totalAmountSum,
              byStatus: [
                { _id: "Draft", count: poStats.status.totalDraft },
                { _id: "Sent", count: poStats.status.totalSent },
                { _id: "Acknowledged", count: poStats.status.totalAcknowledged },
                { _id: "In Progress", count: poStats.status.totalInProgress },
                { _id: "Completed", count: poStats.status.totalCompleted },
                { _id: "Cancelled", count: poStats.status.totalCancelled },
              ],
              attachmentSummary: poStats.attachmentSummary,
              licenses: poStats.licenses,
            }
          });
        } else {
          setError("Failed to load data");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchAllStats();
  }, []);

  function getTotalValue(value: any) {
    if (typeof value === "number") {
      return value.toLocaleString();
    } else if (value == null) {
      return "--";
    }
    return String(value);
  }

  function getStatusTotalValue(s: any) {
    if (s && typeof s.totalValue === "number") {
      return s.totalValue.toLocaleString();
    } else if (s && s.totalValue == null) {
      return "--";
    } else {
      return "";
    }
  }

  function quotationsStat(statName: string) {
    return loading
      ? <span className="animate-pulse text-indigo-400">...</span>
      : (apiStats?.quotations?.[statName] !== undefined
        ? apiStats.quotations[statName]?.toLocaleString?.() ?? apiStats.quotations[statName]
        : "--");
  }

  // Override purchase order stat helpers to use new PO stats
  function purchaseOrderStat(statName: string) {
    if (loading) {
      return <span className="animate-pulse text-blue-400">...</span>;
    }
    // PO stat mapping
    switch (statName) {
      case "totalPurchaseOrders":
        return apiStats?.purchaseOrders?.totalPurchaseOrders ?? "--";
      case "totalValue":
        return apiStats?.purchaseOrders?.totalValue?.toLocaleString() ?? "--";
      case "totalWithPDF":
        return apiStats?.purchaseOrders?.attachmentSummary?.totalWithPDF ?? "--";
      case "totalWithoutPDF":
        return apiStats?.purchaseOrders?.attachmentSummary?.totalWithoutPDF ?? "--";
      default:
        return apiStats?.purchaseOrders?.[statName] ?? "--";
    }
  }

  // Helper for purchase order statuses
  function purchaseOrderStatusCount(status: string) {
    if (loading) {
      return <span className="animate-pulse text-cyan-400">...</span>;
    }
    const found = apiStats?.purchaseOrders?.byStatus?.find((s: any) => s._id === status);
    return found ? found.count : "0";
  }

  return (
    <>
      <div className="p-6 rounded-md mt-16 bg-white  shadow border-1 border-gray-200  space-y-10 via-white to-pink-100 min-h-screen">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-snug flex items-center gap-3 ">
              <Layers className="w-8 h-8 text-pink-700" />
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base pt-1">
              Your <b>CRM</b> insights at a glance — manage, track, and grow!
            </p>
          </div>
        </div>
        <Separator />
        {/* Leads Section */}
        <h3 className="text-2xl font-bold text-pink-700 mt-6 mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-pink-500" /> Leads
        </h3>
        
        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <Card className="bg-white border-1 border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Users className="w-16 h-16 text-pink-200 group-hover:text-pink-100 transition" />
            </div>
            <CardHeader className="pb-2 flex flex-col gap-0">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <Users className="w-5 h-5 text-pink-500" /> Total Leads
              </CardTitle>
              {/* Small Line Graph for Leads */}
              <div className="mt-1">
                <MiniLineChart data={statusTrends.leads} color={statLineColor.leads} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-pink-700">
                {loading ? (
                  <span className="animate-pulse text-pink-400">...</span>
                ) : (
                  apiStats?.totalLeads ?? "--"
                )}
              </span>
            </CardContent>
          </Card>
          {/* Total Value */}
          <Card className="bg-white border-1 border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <IndianRupee className="w-16 h-16 text-green-200 group-hover:text-green-100 transition" />
            </div>
            <CardHeader className="pb-2 flex flex-col gap-0">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <IndianRupee className="w-5 h-5 text-green-600" /> Total Value
              </CardTitle>
              {/* Small Line Graph for Value */}
              <div className="mt-1">
                <MiniLineChart data={statusTrends.totalValue} color={statLineColor.totalValue} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-green-700">
                {loading ? (
                  <span className="animate-pulse text-green-400">...</span>
                ) : (
                  <>
                    ₹{" "}
                    {getTotalValue(apiStats?.totalValue)}
                  </>
                )}
              </span>
            </CardContent>
          </Card>
          {/* Statuses */}
          <Card className="bg-white border-1 border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <CheckCircle2 className="w-16 h-16 text-blue-200 group-hover:text-blue-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Statuses
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {loading ? (
                <span className="animate-pulse text-blue-400">Loading...</span>
              ) : Array.isArray(apiStats?.byStatus) && apiStats.byStatus.length ? (
                apiStats.byStatus.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <Timer className="w-4 h-4 text-blue-400" />
                    {/* Show friendly label: use s.status if available, otherwise fallback */}
                    <span className="capitalize">
                      {(() => {
                        // Map status code to label
                        const labels: Record<string, string> = {
                          new: "New",
                          contacted: "Contacted",
                          qualified: "Qualified",
                          proposal_sent: "Proposal Sent",
                          negotiation: "Negotiation",
                          won: "Won",
                          lost: "Lost"
                        };
                        // Prefer "status" key (for new backend shape), fallback to "_id"
                        const code = s?.status ?? s?._id;
                        return labels[code] || code || "--";
                      })()}
                    </span>
                    :<span className="font-bold">{s?.count ?? "--"}</span>
                    <span className="text-xs">
                      (<IndianRupee className="inline w-3 h-3" />
                      {/* Prefer "totalValue" (match backend), fallback to getStatusTotalValue(s) for backwards compatibility */}
                      {typeof s?.totalValue === "number"
                        ? s.totalValue.toLocaleString()
                        : getStatusTotalValue(s)}
                      )
                    </span>
                    {/* Optionally, an inline trend for each status could be placed here in future */}
                  </div>
                ))
              ) : (
                "No data"
              )}
            </CardContent>
          </Card>
          {/* Priorities */}
          <Card className="bg-white border-1 border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Crown className="w-16 h-16 text-yellow-200 group-hover:text-yellow-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <Crown className="w-5 h-5 text-yellow-600" />
                Priorities
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {loading ? (
                <span className="animate-pulse text-yellow-400">Loading...</span>
              ) : Array.isArray(apiStats?.byPriority) && apiStats.byPriority.length ? (
                apiStats.byPriority.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <Crown className="w-4 h-4 text-yellow-400" />
                    {/* Show friendly label: use p.priority if available, otherwise fallback */}
                    <span className="capitalize">
                      {(() => {
                        // Map priority code to label
                        const priorityLabels: Record<string, string> = {
                          low: "Low",
                          medium: "Medium",
                          high: "High"
                        };
                        // Prefer "priority" key (for new backend shape), fallback to "_id"
                        const code = p?.priority ?? p?._id;
                        return priorityLabels[code] || code || "--";
                      })()}
                    </span>
                    :{" "}
                    <span className="font-bold">{p?.count ?? "--"}</span>
                  </div>
                ))
              ) : (
                "No data"
              )}
            </CardContent>
          </Card>
        </div>
        <Separator />
        {/* Quotations Section */}
        <h3 className="text-2xl font-bold text-indigo-700 mt-8 mb-2 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" /> Quotation
        </h3>
        
        {/* Quotations Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
          {/* Total Quotations */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <BarChart3 className="w-16 h-16 text-indigo-200 group-hover:text-indigo-100 transition" />
            </div>
            <CardHeader className="pb-2 flex flex-col gap-0">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Total Quotations
              </CardTitle>
              <div className="mt-1">
                <MiniLineChart data={statusTrends.quotations} color={statLineColor.quotations} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-indigo-700">
                {quotationsStat("totalQuotations")}
              </span>
            </CardContent>
          </Card>
          {/* Quotations With PDF/Without PDF */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <BarChartBig className="w-16 h-16 text-indigo-200 group-hover:text-indigo-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <BarChartBig className="w-5 h-5 text-indigo-600" />
                Quotations With/Without Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-400 mr-1" />
                With Documents:{" "}
                <span className="text-xl font-black text-green-700">
                  {quotationsStat("totalWithPDF")}
                </span>
              </span>
              <span className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-400 mr-1" />
                Without Documents:{" "}
                <span className="text-xl font-black text-red-700">
                  {quotationsStat("totalWithoutPDF")}
                </span>
              </span>
            </CardContent>
          </Card>
          {/* Quotation Statuses */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <TrendingUp className="w-16 h-16 text-indigo-200 group-hover:text-indigo-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Quotation Statuses
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
                  Pending:
                  <span className="font-bold text-yellow-700 ml-1">
                    {quotationsStat("totalPending")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                  Approved:
                  <span className="font-bold text-green-700 ml-1">
                    {quotationsStat("totalApproved")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                  Rejected:
                  <span className="font-bold text-red-700 ml-1">
                    {quotationsStat("totalRejected")}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
                  Expired:
                  <span className="font-bold text-purple-700 ml-1">
                    {quotationsStat("totalExpired")}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
          {/* Grand Quotation Value */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <IndianRupee className="w-16 h-16 text-indigo-200 group-hover:text-indigo-100 transition" />
            </div>
            <CardHeader className="pb-2 flex flex-col gap-0">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <IndianRupee className="w-5 h-5 text-indigo-600" />
                Grand Quotation Value
              </CardTitle>
              <div className="mt-1">
                <MiniLineChart data={statusTrends.totalValue} color={statLineColor.totalValue} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-indigo-700">
                {loading ? (
                  <span className="animate-pulse text-indigo-400">...</span>
                ) : (
                  <>
                    ₹ {" "}
                    {(apiStats?.quotations?.totalGrandValue !== undefined && apiStats?.quotations?.totalGrandValue !== null)
                      ? apiStats.quotations.totalGrandValue.toLocaleString()
                      : "--"}
                  </>
                )}
              </span>
            </CardContent>
          </Card>
        </div>
        <Separator />
        {/* Purchase Orders Section */}
        <h3 className="text-2xl font-bold text-blue-700 mt-8 mb-2 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-blue-600" /> Purchase Orders
        </h3>
        {/* Purchase Orders Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {/* Total Purchase Orders */}
          <Card className="bg-white border-1  border-gray-200 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <ShoppingBag className="w-16 h-16 text-blue-200 group-hover:text-blue-100 transition" />
            </div>
            <CardHeader className="pb-2 flex flex-col gap-0">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Total Purchase Orders
              </CardTitle>
              <div className="mt-1">
                <MiniLineChart data={statusTrends.purchaseOrders} color={statLineColor.purchaseOrders} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-blue-700">
                {purchaseOrderStat("totalPurchaseOrders")}
              </span>
            </CardContent>
          </Card>
          {/* Purchase Orders Value */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <IndianRupee className="w-16 h-16 text-cyan-200 group-hover:text-cyan-100 transition" />
            </div>
            <CardHeader className="pb-2 flex flex-col gap-0">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <IndianRupee className="w-5 h-5 text-cyan-600" />
                Total Purchase Order Value
              </CardTitle>
              <div className="mt-1">
                <MiniLineChart data={statusTrends.totalValue} color={statLineColor.totalValue} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-cyan-700">
                {loading ? (
                  <span className="animate-pulse text-cyan-400">...</span>
                ) : (
                  <>
                    ₹{" "}
                    {getTotalValue(apiStats?.purchaseOrders?.totalValue)}
                  </>
                )}
              </span>
            </CardContent>
          </Card>
          {/* Purchase Order Statuses */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <CheckCircle2 className="w-16 h-16 text-cyan-200 group-hover:text-cyan-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <CheckCircle2 className="w-5 h-5 text-cyan-600" /> Statuses
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {loading ? (
                <span className="animate-pulse text-cyan-400">Loading...</span>
              ) : (
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2 py-0.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>Draft:</span>
                    <span className="font-bold">{purchaseOrderStatusCount("Draft")}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>Sent:</span>
                    <span className="font-bold">{purchaseOrderStatusCount("Sent")}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>Acknowledged:</span>
                    <span className="font-bold">{purchaseOrderStatusCount("Acknowledged")}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>In Progress:</span>
                    <span className="font-bold">{purchaseOrderStatusCount("In Progress")}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>Completed:</span>
                    <span className="font-bold">{purchaseOrderStatusCount("Completed")}</span>
                  </div>
                  <div className="flex items-center gap-2 py-0.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>Cancelled:</span>
                    <span className="font-bold">{purchaseOrderStatusCount("Cancelled")}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Purchase Orders With/Without PDF */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <BarChartBig className="w-16 h-16 text-blue-200 group-hover:text-blue-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <BarChartBig className="w-5 h-5 text-blue-600" />
                POs With/Without Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-400 mr-1" />
                With Documents:{" "}
                <span className="text-xl font-black text-green-700">
                  {purchaseOrderStat("totalWithPDF")}
                </span>
              </span>
              <span className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-400 mr-1" />
                Without Documents:{" "}
                <span className="text-xl font-black text-red-700">
                  {purchaseOrderStat("totalWithoutPDF")}
                </span>
              </span>
            </CardContent>
          </Card>
          {/* Purchase Order License Expiry */}
          <Card className="bg-white border-1  border-gray-100 shadow-md group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Crown className="w-16 h-16 text-blue-200 group-hover:text-blue-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <Crown className="w-5 h-5 text-blue-600" />
                License Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>
                <span className="inline-block h-3 w-3 rounded-full bg-pink-400 mr-1" />
                Expired:{" "}
                <span className="font-bold text-pink-700">
                  {loading ? <span className="animate-pulse text-pink-400">...</span>
                  : (apiStats?.purchaseOrders?.licenses?.expired ?? "--")}
                </span>
              </span>
              <span>
                <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 mr-1" />
                Expiring Soon:{" "}
                <span className="font-bold text-yellow-700">
                  {loading ? <span className="animate-pulse text-yellow-400">...</span>
                  : (apiStats?.purchaseOrders?.licenses?.expiringSoon ?? "--")}
                </span>
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Separator />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leads Trend Chart */}
          <Card className="rounded-xl border-1  border-gray-100 bg-white shadow-md hover:shadow-xl transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
                <LucideLineChart className="text-pink-600 h-6 w-6" /> Leads Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsTrend}>
                  <CartesianGrid strokeDasharray="8 6" stroke="#ec489980" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#ec4899"
                    strokeWidth={4}
                    dot={{ stroke: "#fff", fill: "#ec4899", strokeWidth: 3, r: 6 }}
                    activeDot={{ fill: "#be185d", r: 9 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="rounded-xl border  border-gray-100 bg-white shadow-md hover:shadow-xl transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
                <BarChartBig className="text-pink-600 h-6 w-6" /> Revenue (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="8 6" stroke="#ec489980" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#ec4899" radius={[10, 10, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads Section */}
        <Separator />
        <Card className="rounded-xl border  border-gray-100 bg-white shadow-md hover:shadow-xl transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
              <Users className="w-5 h-5 text-pink-600" />
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-pink-100">
              {recentLeads.map((lead, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 px-1 hover:bg-pink-50 transition rounded-xl group"
                >
                  <div>
                    <p className="font-semibold flex items-center gap-2 text-pink-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> {lead.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 bg-pink-100 text-pink-700 border border-pink-200">
                      <Timer className="inline w-4 h-4 mr-1 text-pink-500" />
                      {lead.stage}
                    </Badge>
                    <ArrowRight className="h-5 w-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
