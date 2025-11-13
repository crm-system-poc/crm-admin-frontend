import { useState, useEffect } from "react";
import axios from "axios";
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

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/api/reports/dashboard", {
        withCredentials: true,
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const fetchSalesFunnelData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const url = `/api/reports/sales-funnel?startDate=${currentYear}-01-01&endDate=${currentYear}-12-31&groupBy=month`;
      const response = await api.get(
        url,
        { withCredentials: true }
      );
      setSalesFunnelData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch sales funnel data:", error);
    }
  };

  const fetchLicenseExpiryData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const url = `/api/reports/license-expiry?year=${currentYear}`;
      const response = await api.get(
        url,
        { withCredentials: true }
      );
      setLicenseExpiryData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch license expiry data:", error);
    }
  };

  // getAllExpireLicense
  const getAllExpireLicense = async () => {
    try {
      const url = `/api/reports/expiring-licenses`;
      const response = await api.get(
        url,
        { withCredentials: true }
      );
      console.log(response.data.data);
    } catch (error) {
      console.error("Failed to fetch license expiry data:", error);
    }
  };

  const refreshReports = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchSalesFunnelData(),
      fetchLicenseExpiryData(),
      getAllExpireLicense()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshReports();
  }, []);

  return {
    dashboardData,
    salesFunnelData,
    licenseExpiryData,
    isLoading,
    refreshReports,
  };
};