"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowRight, Search as SearchIcon } from "lucide-react";
import LicenseTable from "@/components/licenses/license-table";
import { exportToCSV, exportToPDF } from "@/components/licenses/export-utils";

function flattenExpired(apiData: any) {
  // apiData.expired may be grouped object { "2025-01": { items: [...] } }
  if (!apiData) return [];
  if (Array.isArray(apiData)) return apiData;
  const groups = apiData;
  const out: any[] = [];
  Object.keys(groups).forEach((k) => {
    const grp = groups[k];
    const items = grp?.items ?? grp?.list ?? [];
    items.forEach((it: any) => out.push({ ...it, __groupKey: k, __groupLabel: grp?.label ?? k }));
  });
  return out;
}

function flattenExpiringSoon(apiData: any) {
  // expiringSoon: might be { "in_1_month": [...], "in_2_months": [...], ... } or grouped by month key
  if (!apiData) return [];
  if (Array.isArray(apiData)) return apiData;
  const out: any[] = [];
  Object.keys(apiData).forEach((k) => {
    const arr = apiData[k];
    if (Array.isArray(arr)) {
      arr.forEach((it: any) => out.push({ ...it, __bucket: k }));
      return;
    }
    // grouped by month object
    const grp = apiData[k];
    const items = grp?.items ?? grp?.list ?? [];
    items.forEach((it: any) => out.push({ ...it, __groupKey: k, __groupLabel: grp?.label ?? k }));
  });
  return out;
}

export default function ExpiringLicenseListingPage() {
  const router = useRouter();
  const [apiData, setApiData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Initialize filter mode and range from query params on client side only
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const qf = (sp.get("filter") as string) || "all";
    const qr = (sp.get("range") as string) || "monthly";
    setFilterMode(qf);
    setRangeMode(qr);
  }, []);

  // Table UI state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("expiryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [rangeMode, setRangeMode] = useState<string>("monthly");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://crm-backend-b8ys.onrender.com/api/reports/expiring-licenses", {
          credentials: "include",
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "API returned failure");
        }
        setApiData(json.data);
      } catch (err: any) {
        console.error("Error fetching expiring licenses", err);
        setError(err?.message ?? "Failed to fetch");
        setApiData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build list based on filterMode
  const rows = useMemo(() => {
    if (!apiData) return [];
    let arr: any[] = [];
    if (filterMode === "expired") {
      arr = flattenExpired(apiData.expired);
    } else if (filterMode === "expiring-soon") {
      arr = flattenExpiringSoon(apiData.expiringSoon);
    } else {
      // all: combine both
      arr = [...flattenExpired(apiData.expired), ...flattenExpiringSoon(apiData.expiringSoon)];
    }

    // Apply search
    if (searchTerm && searchTerm.trim().length) {
      const s = searchTerm.toLowerCase();
      arr = arr.filter((r) => {
        return (
          (r.customerName ?? "").toString().toLowerCase().includes(s) ||
          (r.productId ?? "").toString().toLowerCase().includes(s) ||
          (r.description ?? "").toString().toLowerCase().includes(s) ||
          (r.licenseType ?? "").toString().toLowerCase().includes(s)
        );
      });
    }

    // Sorting
    arr.sort((a: any, b: any) => {
      const getVal = (o: any, k: string) => {
        if (k === "expiryDate") return new Date(o.expiryDate ?? o.expiry ?? o.licenseExpiryDate ?? 0).getTime();
        if (k === "totalPrice") return Number(o.totalPrice ?? o.total ?? 0);
        return (o[k] ?? "").toString().toLowerCase();
      };
      const va = getVal(a, sortBy);
      const vb = getVal(b, sortBy);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [apiData, filterMode, searchTerm, sortBy, sortDir]);

  const totalRows = rows.length;
  const pages = Math.max(1, Math.ceil(totalRows / pageSize));
  useEffect(() => {
    if (page > pages) setPage(1);
  }, [pages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const onRowClick = (row: any) => {
    const poId = row.purchaseOrderId ?? row.purchaseOrderId ?? row.poId ?? row.purchaseOrder ?? row.parentId ?? row._id;
    if (!poId) {
      alert("Purchase order id missing for this row");
      return;
    }
    router.push(`/purchase-orders/${poId}`);
  };

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  // Exports: export current filtered & sorted rows (all rows) or current page
  const handleExportCSV = (all = true) => {
    const toExport = all ? rows : paginated;
    exportToCSV(toExport, `licenses-${filterMode}-${rangeMode}.csv`);
  };

  const handleExportPDF = (all = true) => {
    const toExport = all ? rows : paginated;
    exportToPDF(toExport, `licenses-${filterMode}-${rangeMode}.pdf`);
  };

  return (
    <div className="p-8 mt-16">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2 text-rose-700">
                <span className="inline-block w-7 h-7 bg-rose-200 rounded-full mr-1" />
                Expiring Licenses
              </CardTitle>
              <div className="text-muted-foreground text-sm mt-1">View expired & expiring licenses — filter, export, and open PO.</div>
            </div>

            <div className="flex items-center gap-2">
              {/* Updated filter Select using shadcn/ui primitives for option display */}
              <Select
                value={filterMode}
                onValueChange={(v) => {
                  setFilterMode(v);
                  router.push(`/licenses/expiring?filter=${encodeURIComponent(v)}&range=${encodeURIComponent(rangeMode)}`);
                  setPage(1);
                }}
              >
                <SelectTrigger className="min-w-[185px]" aria-label="Filter by">
                  {filterMode === "all" && "All (Past 3 + Next 3 months)"}
                  {filterMode === "expired" && "Expired (Past 3 months)"}
                  {filterMode === "expiring-soon" && "Expiring Soon (Next 3 months)"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All (Past 3 + Next 3 months)</SelectItem>
                  <SelectItem value="expired">Expired (Past 3 months)</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon (Next 3 months)</SelectItem>
                </SelectContent>
              </Select>

              {/* Updated range Select using shadcn/ui primitives */}
              <Select
                value={rangeMode}
                onValueChange={(v) => {
                  setRangeMode(v);
                  router.push(`/licenses/expiring?filter=${encodeURIComponent(filterMode)}&range=${encodeURIComponent(v)}`);
                }}
              >
                <SelectTrigger className="min-w-[105px]" aria-label="Range by">
                  {rangeMode === "monthly" && "Monthly"}
                  {rangeMode === "quarterly" && "Quarterly"}
                  {rangeMode === "yearly" && "Yearly"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search customer, product, license..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Button variant="ghost" onClick={() => handleExportCSV(true)} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> CSV
              </Button>
              <Button variant="ghost" onClick={() => handleExportPDF(true)} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Separator className="mb-4" />

          <LicenseTable
            data={paginated}
            loading={loading}
            onRowClick={onRowClick}
            toggleSort={toggleSort}
            sortBy={sortBy}
            sortDir={sortDir}
            totalRows={totalRows}
          />

          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalRows)} of {totalRows}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20" aria-label="Rows per page">
                  {String(pageSize)}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} variant="outline">Prev</Button>
              <div className="px-3">{page}</div>
              <Button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} variant="outline">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-100 text-red-700">{error}</div>}
    </div>
  );
}
