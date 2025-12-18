"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import LicenseExpiryReport from "@/components/reports/LicenseExpiryReport";
import SalesFunnelReport from "@/components/reports/SalesFunnelReport";

import { useReports } from "@/components/reports/useReports";
import DashboardOverview from "@/components/reports/DashboardOverview";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const { dashboardData, isLoading, refreshReports } = useReports();

  return (
    // <div className="container mx-auto p-6 space-y-6">
    <div className="p-6 max-w-8xl mx-auto space-y-4">
   
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"> Dashboard & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your CRM performance and license management
          </p>
        </div>
        <Button onClick={refreshReports} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Dashboard Overview Cards */}
      {activeTab === "dashboard" && dashboardData && (
        <DashboardOverview data={dashboardData} isLoading={isLoading} />
      )}

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="sales-funnel" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales Funnel
          </TabsTrigger>
          <TabsTrigger value="license-expiry" className="gap-2">
            <Calendar className="h-4 w-4" />
            License Expiry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <SalesFunnelReport
              data={dashboardData}
              isLoading={isLoading}
              view="detailed"
            />
          )}
        </TabsContent>

        <TabsContent value="sales-funnel">
          <SalesFunnelReport isLoading={isLoading} view="full" />
        </TabsContent>

        <TabsContent value="license-expiry">
          <LicenseExpiryReport isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
