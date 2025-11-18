"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Users } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Timer } from "lucide-react";
import { Layers } from "lucide-react";
import { Crown } from "lucide-react";
import { ShoppingBag } from "lucide-react";
import { AlarmClock } from "lucide-react";
import { CalendarClock } from "lucide-react";
import { TrendingDown } from "lucide-react";
import { Activity } from "lucide-react";
import { DollarSign, IndianRupee } from "lucide-react";
import { FileText } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Mock data for PO fallback/attach - you may replace this if needed.
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
  },
};

// Map status keys to readable names for Lead Status Pie Chart
const STATUS_LABELS: Record<string, string> = {
  New: "New",
  Qualified: "Qualified",
  Contacted: "Contacted",
  "Proposal Sent": "Proposal Sent",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
  Unqualified: "Unqualified",
  Draft: "Draft",
  Sent: "Sent",
  Acknowledged: "Acknowledged",
  "In Progress": "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const COLORS = {
  pink: "#ec4899",
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#a855f7",
  green: "#22c55e",
  yellow: "#fbbf24",
  teal: "#14b8a6",
  red: "#ef4444",
  orange: "#f97316",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value?.toLocaleString?.() ?? entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Home() {
  const [apiStats, setApiStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [expiringLicenses, setExpiringLicenses] = useState<any>(null);
  const [licenseSummary, setLicenseSummary] = useState<any>(null);

  // Expiring licenses
  useEffect(() => {
    const fetchExpiringLicenses = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/api/purchase-orders/expiring-licenses",
          { credentials: "include" }
        );
        const json = await res.json();
        if (json.success) setExpiringLicenses(json.data.expiringIn);
      } catch (e) {
        console.log("Error loading license expiry list:", e);
      }
    };
    fetchExpiringLicenses();
  }, []);

  // API STATS: Leads, Quotations, Purchase Orders (dynamic)
  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      setError("");
      try {
        // Real endpoints for lead & quotation, plus override for POs
        const [leadRes, quotationRes] = await Promise.all([
          fetch("http://localhost:8080/api/leads/stats", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
          fetch("http://localhost:8080/api/quotations/stats", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
        ]);
        const leadJson = await leadRes.json();
        const quotationJson = await quotationRes.json();
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
                {
                  _id: "Acknowledged",
                  count: poStats.status.totalAcknowledged,
                },
                { _id: "In Progress", count: poStats.status.totalInProgress },
                { _id: "Completed", count: poStats.status.totalCompleted },
                { _id: "Cancelled", count: poStats.status.totalCancelled },
              ],
              attachmentSummary: poStats.attachmentSummary,
              licenses: poStats.licenses,
            },
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

  // License summary (not shown in UI, but matches upstream example)
  useEffect(() => {
    const fetchLicenseSummary = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/api/reports/expiring-licenses",
          { credentials: "include" }
        );
        const json = await res.json();
        if (json.success) {
          setLicenseSummary(json.data.summary);
        }
      } catch (e) {
        console.error("Error fetching license summary:", e);
      }
    };
    fetchLicenseSummary();
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
    return loading ? (
      <span className="animate-pulse text-indigo-400">...</span>
    ) : apiStats?.quotations?.[statName] !== undefined ? (
      apiStats.quotations[statName]?.toLocaleString?.() ??
      apiStats.quotations[statName]
    ) : (
      "--"
    );
  }

  function purchaseOrderStat(statName: string) {
    if (loading) {
      return <span className="animate-pulse text-blue-400">...</span>;
    }
    switch (statName) {
      case "totalPurchaseOrders":
        return apiStats?.purchaseOrders?.totalPurchaseOrders ?? "--";
      case "totalValue":
        return apiStats?.purchaseOrders?.totalValue?.toLocaleString() ?? "--";
      case "totalWithPDF":
        return (
          apiStats?.purchaseOrders?.attachmentSummary?.totalWithPDF ?? "--"
        );
      case "totalWithoutPDF":
        return (
          apiStats?.purchaseOrders?.attachmentSummary?.totalWithoutPDF ?? "--"
        );
      default:
        return apiStats?.purchaseOrders?.[statName] ?? "--";
    }
  }

  function purchaseOrderStatusCount(status: string) {
    if (loading) {
      return <span className="animate-pulse text-cyan-400">...</span>;
    }
    const found = apiStats?.purchaseOrders?.byStatus?.find(
      (s: any) => s._id === status
    );
    return found ? found.count : "0";
  }

  // --- DATA ADAPTERS: Make chart inputs dynamic from apiStats ---
  // MONTH-LABEL UTILS
  function getMonthName(monthNum: any) {
    return typeof monthNum === "string"
      ? monthNum
      : (typeof monthNum === "number"
          ? new Date(0, monthNum - 1)
          : new Date(undefined)
        ).toLocaleString("en-US", { month: "short" }) || "-";
  }

  // 1. Leads Growth Trend (leadsTrend) - API: apiStats?.trendData?.leads
  const leadsTrend =
    apiStats?.trendData?.leads && Array.isArray(apiStats.trendData.leads)
      ? apiStats.trendData.leads.map((item: any) => ({
          month: getMonthName(item.month),
          leads: item.leads,
          revenue: item.revenue ?? undefined,
        }))
      : [
          // fallback (could remove if desired)
          { month: "Jan", leads: 14, revenue: 60000 },
          { month: "Feb", leads: 28, revenue: 85000 },
          { month: "Mar", leads: 37, revenue: 120000 },
          { month: "Apr", leads: 50, revenue: 90000 },
          { month: "May", leads: 42, revenue: 140000 },
          { month: "Jun", leads: 55, revenue: 165000 },
        ];

  // 2. Quotations Trend (quotationsTrend) - API: apiStats?.trendData?.quotations
  const quotationsTrend =
    apiStats?.trendData?.quotations &&
    Array.isArray(apiStats.trendData.quotations)
      ? apiStats.trendData.quotations.map((item: any) => ({
          month: getMonthName(item.month),
          quotations: item.quotations,
        }))
      : [
          { month: "Jan", quotations: 10 },
          { month: "Feb", quotations: 16 },
          { month: "Mar", quotations: 12 },
          { month: "Apr", quotations: 19 },
          { month: "May", quotations: 22 },
          { month: "Jun", quotations: 25 },
        ];

  // Pie Data: Lead Status, Priority, and Quotations Status remain similar:
  // Fix: statusPieData now checks "name" or "_id" (with fallback using STATUS_LABELS or _id directly)
  const statusPieData =
    apiStats?.byStatus?.map((s: any, i: number) => {
      let pieName =
        s.name && typeof s.name === "string" && s.name.trim().length > 0
          ? s.name
          : s._id && typeof s._id === "string" && s._id.trim().length > 0
          ? STATUS_LABELS[s._id] || s._id
          : "Unknown";
      return {
        name: s.status,
        value: s.count,
        fill: Object.values(COLORS)[i % Object.values(COLORS).length],
      };
    }) || [];

  const priorityPieData =
    apiStats?.byPriority?.map((p: any, i: number) => ({
      name: p.priority,
      value: p.count,
      fill: [COLORS.green, COLORS.yellow, COLORS.red][i],
    })) || [];

  const quotationsStatusData = [
    {
      name: "Pending",
      value: apiStats?.quotations?.totalPending || 0,
      fill: COLORS.yellow,
    },
    {
      name: "Approved",
      value: apiStats?.quotations?.totalApproved || 0,
      fill: COLORS.green,
    },
    {
      name: "Rejected",
      value: apiStats?.quotations?.totalRejected || 0,
      fill: COLORS.red,
    },
    {
      name: "Expired",
      value: apiStats?.quotations?.totalExpired || 0,
      fill: COLORS.purple,
    },
  ];

  // For Mini-Statistic Sparklines/Trend: Read from trend data if available, otherwise fallback.
  const keyMetrics = {
    leads: leadsTrend.map((d: any) => ({ v: d.leads })),
    quotations: quotationsTrend.map((d: any) => ({ v: d.quotations })),
    po: leadsTrend.map((d: any) => ({
      v:
        apiStats?.purchaseOrders?.trendData?.purchaseOrders &&
        Array.isArray(apiStats.purchaseOrders.trendData.purchaseOrders)
          ? apiStats.purchaseOrders.trendData.purchaseOrders[d.month]?.v ?? 0
          : 0,
    })),
    poValue: leadsTrend.map((d: any) => ({
      v: d.revenue,
    })),
    revenue: leadsTrend.map((d: any) => ({
      month: d.month,
      revenue: d.revenue,
    })),
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Layers className="w-7 h-7 text-white" />
              </div>
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here's your CRM overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-pink-600">
                ₹{purchaseOrderStat("totalValue")}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                +12%
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Total Leads
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {loading ? (
                <span className="animate-pulse text-pink-400">...</span>
              ) : (
                apiStats?.totalLeads ?? "--"
              )}
            </p>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={keyMetrics.leads}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={COLORS.pink}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Total Quotations */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                +8%
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Total Quotations
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {quotationsStat("totalQuotations")}
            </p>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={keyMetrics.quotations}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={COLORS.indigo}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchase Orders */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-red-600 text-sm font-semibold">
                <TrendingDown className="w-4 h-4" />
                -3%
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Purchase Orders
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {purchaseOrderStat("totalPurchaseOrders")}
            </p>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keyMetrics.leads}>
                  <Bar dataKey="v" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                +18%
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Total PO Value
            </p>
            <p className="text-3xl font-bold text-gray-800">
              ₹{purchaseOrderStat("totalValue")}
            </p>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={keyMetrics.poValue}>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={COLORS.green}
                    fill={COLORS.green}
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <Separator />
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <AlarmClock className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Expiring Licenses
              </h3>
              <p className="text-sm text-gray-500">Upcoming license renewals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {/* Expired Licenses (Last 3 Months) */}
            <Card
              onClick={() =>
                router.push("/licenses/expiring?filter=expired&range=monthly")
              }
              className="cursor-pointer border bg-pink-100 text-pink-700 border-pink-300 shadow-md group hover:scale-[1.02] transition"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <AlarmClock className="w-5 h-5 text-pink-600" />
                  Expired Licenses (Last 3 Months)
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-4xl font-black text-pink-700">
                  {licenseSummary?.totalExpired ?? "--"}
                </p>
                <p className="text-sm mt-1 opacity-70">From past 3 months</p>
              </CardContent>
            </Card>

            {/* Expiring Soon Licenses (Next 3 Months) */}
            <Card
              onClick={() =>
                router.push(
                  "/licenses/expiring?filter=expiring-soon&range=monthly"
                )
              }
              className="cursor-pointer border bg-yellow-100 text-yellow-700 border-yellow-300 shadow-md group hover:scale-[1.02] transition"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CalendarClock className="w-5 h-5 text-yellow-600" />
                  Expiring Soon (Next 3 Months)
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-4xl font-black text-yellow-700">
                  {licenseSummary?.totalExpiringSoon ?? "--"}
                </p>
                <p className="text-sm mt-1 opacity-70">Coming 3 months</p>
              </CardContent>
            </Card>

            {/* Total Licenses */}
            <Card
              onClick={() =>
                router.push("/licenses/expiring?filter=all&range=monthly")
              }
              className="cursor-pointer border bg-blue-100 text-blue-700 border-blue-300 shadow-md group hover:scale-[1.02] transition"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Crown className="w-5 h-5 text-blue-600" />
                  Total Licenses (6-Month Window)
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-4xl font-black text-blue-700">
                  {licenseSummary?.totalLicenses ?? "--"}
                </p>
                <p className="text-sm mt-1 opacity-70">
                  Past 3 + Next 3 months
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Separator />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Status Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Lead Status Distribution
                </h3>
                <p className="text-sm text-gray-500">By current stage</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name} ${
                        typeof percent === "number"
                          ? (percent * 100).toFixed(0)
                          : "--"
                      }%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Priority Distribution
                </h3>
                <p className="text-sm text-gray-500">Lead priority breakdown</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}`}
                  >
                    {priorityPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quotations Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Quotation Status
                </h3>
                <p className="text-sm text-gray-500">
                  Current quotation breakdown
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quotationsStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {quotationsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quotations Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Quotations Trend
                </h3>
                <p className="text-sm text-gray-500">Monthly quotation flow</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quotationsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#666" style={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="quotations"
                    stroke={COLORS.indigo}
                    strokeWidth={3}
                    dot={{ fill: COLORS.indigo, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leads Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Leads Growth Trend
                </h3>
                <p className="text-sm text-gray-500">Monthly lead generation</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsTrend}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={COLORS.pink}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.pink}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#666" style={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke={COLORS.pink}
                    strokeWidth={3}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Revenue Overview
                </h3>
                <p className="text-sm text-gray-500">
                  Monthly revenue breakdown
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#666" style={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill={COLORS.pink}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expiring Licenses
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <AlarmClock className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Expiring Licenses
              </h3>
              <p className="text-sm text-gray-500">Upcoming license renewals</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <CalendarClock className="w-6 h-6 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">
                  1 Month
                </span>
              </div>
              <p className="text-4xl font-bold text-yellow-700">
                {expiringLicenses?.["1_month"]?.count ?? "--"}
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                {expiringLicenses?.["1_month"]?.month &&
                  new Date(
                    expiringLicenses["1_month"].year,
                    expiringLicenses["1_month"].month - 1
                  ).toLocaleString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <CalendarClock className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">
                  2 Months
                </span>
              </div>
              <p className="text-4xl font-bold text-orange-700">
                {expiringLicenses?.["2_months"]?.count ?? "--"}
              </p>
              <p className="text-xs text-orange-600 mt-2">
                {expiringLicenses?.["2_months"]?.month &&
                  new Date(
                    expiringLicenses["2_months"].year,
                    expiringLicenses["2_months"].month - 1
                  ).toLocaleString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <CalendarClock className="w-6 h-6 text-red-600" />
                <span className="text-sm font-semibold text-red-800">
                  3 Months
                </span>
              </div>
              <p className="text-4xl font-bold text-red-700">
                {expiringLicenses?.["3_months"]?.count ?? "--"}
              </p>
              <p className="text-xs text-red-600 mt-2">
                {expiringLicenses?.["3_months"]?.month &&
                  new Date(
                    expiringLicenses["3_months"].year,
                    expiringLicenses["3_months"].month - 1
                  ).toLocaleString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div> */}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
            <h4 className="text-sm font-medium opacity-90 mb-2">
              Conversion Rate
            </h4>
            <p className="text-3xl font-bold mb-1">
              {apiStats?.conversionRate
                ? `${apiStats.conversionRate}%`
                : "5.3%"}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+0.8% from last month</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-lg p-6 text-white">
            <h4 className="text-sm font-medium opacity-90 mb-2">
              Avg. Deal Size
            </h4>
            <p className="text-3xl font-bold mb-1">
              ₹
              {apiStats?.averageDealSize
                ? apiStats.averageDealSize?.toLocaleString?.()
                : "23.9K"}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+12% from last month</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl shadow-lg p-6 text-white">
            <h4 className="text-sm font-medium opacity-90 mb-2">
              Active Deals
            </h4>
            <p className="text-3xl font-bold mb-1">
              {apiStats?.activeDeals ?? "87"}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <Activity className="w-4 h-4" />
              <span>In progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
