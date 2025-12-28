import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

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

export const useReports = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [salesFunnelData, setSalesFunnelData] = useState<SalesFunnelData | null>(null);
  const [licenseExpiryData, setLicenseExpiryData] = useState<LicenseExpiryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Remove stray whitespace/newlines in the API route for both fetchSalesFunnelData and fetchLicenseExpiryData

  const refreshReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();

      const [dashboardRes, funnelRes, licenseRes, expiringRes] = await Promise.all([
        api.get("/api/reports/dashboard", { withCredentials: true }),
        api.get(
          `/api/reports/sales-funnel?startDate=${currentYear}-01-01&endDate=${currentYear}-12-31&groupBy=month`,
          { withCredentials: true }
        ),
        api.get(`/api/reports/license-expiry?year=${currentYear}`, { withCredentials: true }),
        api.get(`/api/reports/expiring-licenses`, { withCredentials: true }),
      ]);

      setDashboardData(dashboardRes.data.data);
      setSalesFunnelData(funnelRes.data.data);
      setLicenseExpiryData(licenseRes.data.data);
      // Keep previous behaviour of logging the raw data for expiring licenses
      console.log(expiringRes.data.data);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error("Failed to refresh reports:", e.response?.data?.message ?? error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  return {
    dashboardData,
    salesFunnelData,
    licenseExpiryData,
    isLoading,
    refreshReports,
  };
};