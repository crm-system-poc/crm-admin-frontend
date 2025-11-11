import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  ShoppingCart,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

interface DashboardData {
  currentMonth: {
    month: number;
    year: number;
    leads: { count: number; growth: number };
    quotations: { count: number; growth: number };
    orders: { count: number; growth: number };
    expiringLicenses: number;
  };
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
}

interface DashboardOverviewProps {
  data?: DashboardData;
  isLoading: boolean;
  fetchError?: string | null;
}

const StatCard = ({
  title,
  value,
  growth,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number;
  growth: number;
  icon: any;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="flex items-center text-xs">
            {growth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={growth >= 0 ? "text-green-600" : "text-red-600"}>
              {Math.abs(growth)}% from last month
            </span>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

const ConversionCard = ({
  title,
  rate,
  description,
  isLoading,
}: {
  title: string;
  rate: number;
  description: string;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-2xl">
        {isLoading ? <Skeleton className="h-8 w-16" /> : `${rate}%`}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function DashboardOverview({
  data,
  isLoading,
  fetchError,
}: DashboardOverviewProps) {
  // Show a 404-specific error message, or Axios error message if present
  if (
    fetchError === "404" ||
    (fetchError &&
      (fetchError.includes("404") ||
        fetchError.toLowerCase().includes("not found"))) ||
    data === undefined
  ) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 text-center">
        Failed to load dashboard data: Resource not found (404).
      </div>
    );
  }

  // Handle generic Axios/client/server errors, like "Failed to fetch dashboard data: AxiosError ..."
  if (
    fetchError &&
    (fetchError.toLowerCase().includes("axioserror") ||
      fetchError.toLowerCase().includes("failed to fetch"))
  ) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 text-center">
        {fetchError}
      </div>
    );
  }

  // (This matches the data fallback display in your other reports.)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Defensive in case data is still undefined for a brief moment
  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-700 text-center">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="New Leads"
        value={data.currentMonth.leads.count}
        growth={data.currentMonth.leads.growth}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Quotations Sent"
        value={data.currentMonth.quotations.count}
        growth={data.currentMonth.quotations.growth}
        icon={FileText}
        isLoading={isLoading}
      />
      <StatCard
        title="Purchase Orders"
        value={data.currentMonth.orders.count}
        growth={data.currentMonth.orders.growth}
        icon={ShoppingCart}
        isLoading={isLoading}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Expiring Licenses
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data.currentMonth.expiringLicenses}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
