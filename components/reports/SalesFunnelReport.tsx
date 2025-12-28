"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import { api } from "@/lib/api";

interface SalesFunnelData {
  groupBy: string;
  summary: {
    totals: {
      leads: number;
      quotations: number;
      orders: number;
    };
    conversionRates: {
      leadToQuote: number;
      quoteToOrder: number;
      overall: number;
    };
  };
  periodBreakdown: Array<{
    displayPeriod: string;
    leads: number;
    quotations: number;
    orders: number;
    conversionRates: {
      leadToQuote: number;
      quoteToOrder: number;
      overall: number;
    };
  }>;
}

interface SalesFunnelReportProps {
  data?: SalesFunnelData | null;
  isLoading: boolean;
  view: "detailed" | "full";
}

export default function SalesFunnelReport({
  data: propData,
  isLoading,
  view,
}: SalesFunnelReportProps) {
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">(
    "month"
  );
  const [salesFunnelData, setSalesFunnelData] = useState<SalesFunnelData | null>(
    propData || null
  );
  const [error, setError] = useState<string | null>(null);

  // Defensive utility to always return an array or empty array
  function getPeriodBreakdownRows(data: SalesFunnelData | null | undefined) {
    return Array.isArray(data?.periodBreakdown) ? data.periodBreakdown : [];
  }
  function getSummaryTotals(data: SalesFunnelData | null | undefined) {
    return data?.summary?.totals ?? {
      leads: 0,
      quotations: 0,
      orders: 0,
    };
  }
  function getSummaryConversionRates(data: SalesFunnelData | null | undefined) {
    return data?.summary?.conversionRates ?? {
      leadToQuote: 0,
      quoteToOrder: 0,
      overall: 0,
    };
  }

  // API fetching (with stricter defensive logic)
  const fetchSalesFunnelData = async () => {
    setError(null);
    try {
      const currentYear = new Date().getFullYear();
      const url = `/api/reports/sales-funnel?startDate=${currentYear}-01-01&endDate=${currentYear}-12-31&groupBy=${timeRange}`;
      const response = await api.get(url, { withCredentials: true });
      setSalesFunnelData(response?.data?.data ?? null);
    } catch (err: unknown) {
      setSalesFunnelData(null);
      let apiMessage = "Failed to fetch sales funnel data.";
      const e = err as { response?: { data?: { message?: string } } };
      if (e?.response?.data?.message) {
        apiMessage += " " + e.response.data.message;
      }
      setError(apiMessage);
      console.error(apiMessage, err);
    }
  };

  useEffect(() => {
    if (!propData) {
      fetchSalesFunnelData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Always get an array (never undefined) for map uses
  const periodBreakdownRows = getPeriodBreakdownRows(salesFunnelData);

  // Defensive: Make sure chart data is always based on array, never undefined
  const chartData =
    Array.isArray(periodBreakdownRows) && periodBreakdownRows.length > 0
      ? periodBreakdownRows.map((period) => ({
          name: period.displayPeriod,
          Leads: period.leads,
          Quotations: period.quotations,
          Orders: period.orders,
          "Conversion Rate": period.conversionRates.overall,
        }))
      : [];

  const conversionData =
    Array.isArray(periodBreakdownRows) && periodBreakdownRows.length > 0
      ? periodBreakdownRows.map((period) => ({
          name: period.displayPeriod,
          "Lead to Quote": period.conversionRates.leadToQuote,
          "Quote to Order": period.conversionRates.quoteToOrder,
          Overall: period.conversionRates.overall,
        }))
      : [];

  const summaryTotals = getSummaryTotals(salesFunnelData);
  const summaryConversionRates = getSummaryConversionRates(salesFunnelData);

  if (view === "detailed" && salesFunnelData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Performance Overview
            </CardTitle>
            <CardDescription>
              Current month conversion rates and totals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {summaryConversionRates.leadToQuote ?? 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Lead to Quote
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summaryConversionRates.quoteToOrder ?? 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Quote to Order
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {summaryConversionRates.overall ?? 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Conversion
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Sales Funnel Analytics
          </h2>
          <p className="text-muted-foreground">
            Track your leads to orders conversion pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={timeRange}
            onValueChange={(val) => setTimeRange(val as typeof timeRange)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && salesFunnelData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {(summaryTotals.leads ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Quotations</CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                {(summaryTotals.quotations ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {(summaryTotals.orders ?? 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Volume Trend</CardTitle>
            <CardDescription>
              Leads, quotations, and orders over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Leads"
                    fill="#3b82f6"
                    stroke="#3b82f6"
                    fillOpacity={0.2}
                  />
                  <Bar dataKey="Quotations" fill="#f59e0b" />
                  <Bar dataKey="Orders" fill="#10b981" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center py-16">
                No data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rates Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
            <CardDescription>
              Conversion percentages across the sales funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : conversionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Lead to Quote"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Quote to Order"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Overall"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center py-16">
                No data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>
            {timeRange === "month"
              ? "Monthly"
              : timeRange === "quarter"
              ? "Quarterly"
              : "Yearly"}{" "}
            performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : periodBreakdownRows.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Period</th>
                    <th className="p-4 text-right font-medium">Leads</th>
                    <th className="p-4 text-right font-medium">Quotations</th>
                    <th className="p-4 text-right font-medium">Orders</th>
                    <th className="p-4 text-right font-medium">
                      Overall Conv.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {periodBreakdownRows.map((period, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">
                        {period.displayPeriod}
                      </td>
                      <td className="p-4 text-right">
                        {period.leads?.toLocaleString?.() ?? "0"}
                      </td>
                      <td className="p-4 text-right">
                        {period.quotations?.toLocaleString?.() ?? "0"}
                      </td>
                      <td className="p-4 text-right">
                        {period.orders?.toLocaleString?.() ?? "0"}
                      </td>
                      <td className="p-4 text-right">
                        <Badge
                          variant={
                            (period.conversionRates?.overall ?? 0) >= 20
                              ? "default"
                              : "secondary"
                          }
                        >
                          {(period.conversionRates?.overall ?? 0) + "%"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}