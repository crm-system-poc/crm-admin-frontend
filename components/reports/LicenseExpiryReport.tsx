"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { api } from "@/lib/api";

interface LicenseExpiryData {
  year: number;
  summary: {
    totalExpiringLicenses: number;
    totalValue: number;
    monthsCovered: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    year: number;
    monthName: string;
    totalExpiring: number;
    totalValue: number;
    byLicenseType: Record<string, { count: number; value: number }>;
    products: Array<{
      productId: string;
      description: string;
      customerName: string;
      expiryDate: string;
    }>;
  }>;
}

interface LicenseExpiryReportProps {
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function LicenseExpiryReport({ isLoading }: LicenseExpiryReportProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [licenseExpiryData, setLicenseExpiryData] = useState<LicenseExpiryData | null>(null);

  const fetchLicenseExpiryData = useCallback(async () => {
    try {
      const response = await api.get(
        `/api/reports/license-expiry?year=${selectedYear}`,
        { withCredentials: true }
      );
      console.log(response.data)
      setLicenseExpiryData(response.data.data);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error("Failed to fetch license expiry data:", e.response?.data?.message ?? error);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchLicenseExpiryData();
  }, [fetchLicenseExpiryData]);

  const chartData = licenseExpiryData?.monthlyBreakdown.map(month => ({
    name: month.monthName,
    Expiring: month.totalExpiring,
    Value: month.totalValue,
  })) || [];

  const licenseTypeData = licenseExpiryData?.monthlyBreakdown.flatMap(month => 
    Object.entries(month.byLicenseType).map(([type, data]) => ({
      name: type.toUpperCase(),
      value: data.count,
    }))
  ) || [];

  // Aggregate license type data
  const aggregatedLicenseTypes = licenseTypeData.reduce((acc, item) => {
    const existing = acc.find(x => x.name === item.name);
    if (existing) {
      existing.value += item.value;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const currentMonth = new Date().getMonth() + 1;
  const upcomingExpiries = licenseExpiryData?.monthlyBreakdown
    .filter(month => month.month >= currentMonth)
    .slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">License Expiry Management</h2>
          <p className="text-muted-foreground">
            Track and manage software license expirations
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && licenseExpiryData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expiring Licenses</CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                {licenseExpiryData.summary.totalExpiringLicenses}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Across {licenseExpiryData.summary.monthsCovered} months
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Contract Value</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                ₹{(licenseExpiryData.summary.totalValue / 100000).toFixed(1)}L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                At risk of expiration
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming Renewals</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {upcomingExpiries.reduce((sum, month) => sum + month.totalExpiring, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Next 3 months
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Expiry Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly License Expirations</CardTitle>
            <CardDescription>Number of licenses expiring each month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Expiring" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* License Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>License Type Distribution</CardTitle>
            <CardDescription>Breakdown by license type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aggregatedLicenseTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((typeof percent === "number" ? percent : 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aggregatedLicenseTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Upcoming License Renewals
          </CardTitle>
          <CardDescription>
            Licenses expiring in the next 3 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingExpiries.map((month) => (
                <div key={month.month} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{month.monthName} {month.year}</h4>
                      <p className="text-sm text-muted-foreground">
                        {month.totalExpiring} licenses expiring • ₹{(month.totalValue / 1000).toFixed(1)}K value
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {month.totalExpiring} items
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm">
                    {month.products.slice(0, 3).map((product, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="font-medium">{product.productId}</span>
                          <span className="text-muted-foreground">{product.description}</span>
                        </div>
                        <span className="text-muted-foreground">{product.customerName}</span>
                      </div>
                    ))}
                    {month.products.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground pt-2">
                        +{month.products.length - 3} more licenses
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Detailed license expiry information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Month</th>
                    <th className="p-4 text-right font-medium">Expiring Licenses</th>
                    <th className="p-4 text-right font-medium">Total Value</th>
                    <th className="p-4 text-right font-medium">License Types</th>
                  </tr>
                </thead>
                <tbody>
                  {licenseExpiryData?.monthlyBreakdown.map((month, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{month.monthName}</td>
                      <td className="p-4 text-right">{month.totalExpiring}</td>
                      <td className="p-4 text-right">₹{(month.totalValue / 1000).toFixed(1)}K</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {Object.entries(month.byLicenseType).map(([type, data]) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}: {data.count}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}