import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

type Props = {
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  toggleSort?: (col: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  totalRows?: number;
};

function fmtDate(d?: any) {
  if (!d) return "--";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return String(d);
  }
}

export default function LicenseTable({ data = [], loading = false, onRowClick, toggleSort, sortBy, sortDir }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => toggleSort && toggleSort("customerName")} className="cursor-pointer">
              <div className="flex items-center gap-2">Customer <ArrowUpDown className="w-4 h-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort && toggleSort("productId")} className="cursor-pointer">
              <div className="flex items-center gap-2">Product ID <ArrowUpDown className="w-4 h-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort && toggleSort("description")} className="cursor-pointer">
              <div className="flex items-center gap-2">Description <ArrowUpDown className="w-4 h-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort && toggleSort("expiryDate")} className="cursor-pointer">
              <div className="flex items-center gap-2">Expiry Date <ArrowUpDown className="w-4 h-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort && toggleSort("licenseType")} className="cursor-pointer">
              <div className="flex items-center gap-2">License Type <ArrowUpDown className="w-4 h-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort && toggleSort("totalPrice")} className="cursor-pointer">
              <div className="flex items-center gap-2">Value <ArrowUpDown className="w-4 h-4" /></div>
            </TableHead>
            <TableHead>PO</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">Loading...</TableCell>
            </TableRow>
          ) : data.length ? (
            data.map((row, idx) => {
              const poId = row.ponumber ?? row.ponumber ?? row.ponumber ?? row.parentId ?? row._id ?? "";
              return (
                <TableRow key={idx} className="cursor-pointer" onClick={() => onRowClick && onRowClick(row)}>
                  <TableCell className="font-medium">{row.customerName ?? row.customer?.name ?? "-"}</TableCell>
                  <TableCell>{row.productId ?? "-"}</TableCell>
                  <TableCell className="max-w-xl truncate">{row.description ?? "-"}</TableCell>
                  <TableCell>{fmtDate(row.expiryDate ?? row.licenseExpiryDate ?? row.expiry)}</TableCell>
                  <TableCell>{row.licenseType ?? "-"}</TableCell>
                  <TableCell>₹ {(Number(row.totalPrice ?? row.total ?? 0)).toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{poId ? poId : "-"}</TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">No records found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
