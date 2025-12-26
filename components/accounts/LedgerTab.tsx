"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import AddPaymentDialog from "./CollectPaymentDialog";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { Button } from "../ui/button";

export default function LedgerTab({ accountId }: { accountId: string }) {
  const [ledger, setLedger] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Add state for dialog
  const [paymentDialogLedger, setPaymentDialogLedger] = useState<any | null>(null);

  useEffect(() => {
    loadLedger();
    loadSummary();
    // eslint-disable-next-line
  }, [page, accountId]);

  const loadLedger = async () => {
    setIsLoading(true);
    const res = await api.get(
      `/api/ledger/account/${accountId}?page=${page}`
    );
    setLedger(res.data?.data ?? []);
    setPagination(res.data?.pagination ?? {});
    setIsLoading(false);
  };

  const loadSummary = async () => {
    const res = await api.get(
      `/api/ledger/account/${accountId}/summary`
    );
    setSummary(res.data.data);
  };

  const statusColor = (status: string) => {
    if (status === "paid") return "bg-emerald-100 text-emerald-700 border border-emerald-300";
    if (status === "partial") return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    return "bg-rose-100 text-rose-700 border border-rose-200";
  };

  // Extended summary "cards"
  const summaryCards = [
    {
      title: "Total Ledger Amount",
      value: `₹${summary.totalLedgerAmount || 0}`,
      icon: <FileText className="w-5 h-5 " />,
    },
    {
      title: "Total Purchase Orders",
      value: summary.totalPOs || 0,
      icon: <ArrowRight className="w-5 h-5 " />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        {summaryCards.map((card, idx) => (
          <Card
            key={card.title}
            className={`flex flex-row items-center gap-4 shadow-none border`}
          >
            <div className={`p-4 rounded-full flex items-center justify-center shrink-0`}>
              {/* {card.icon} */}
            </div>
            <div className="flex flex-col flex-grow py-2">
              <span className="text-sm font-medium">{card.title}</span>
              <span className="text-2xl font-medium">{card.value}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between ">
          <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
            Ledger
          </CardTitle>
          {/* Pagination Controls */}
          {Boolean(pagination?.totalPages > 1) && (
            <div className="flex items-center gap-3">
              <button
                className={`rounded-full p-2 border ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-sm text-gray-500">
                Page <span className="font-bold">{page}</span> /{" "}
                <span>{pagination.totalPages || 1}</span>
              </div>
              <button
                className={`rounded-full p-2 border ${page >= (pagination.totalPages || 1) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"}`}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= (pagination.totalPages || 1)}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent >
          <div className="rounded-md border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Sr.No</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      Loading ledger...
                    </TableCell>
                  </TableRow>
                ) : ledger.length ? (
                  ledger.map((row, idx) =>
                    Array.isArray(row.ledgerItems) && row.ledgerItems.length > 0 ? (
                      row.ledgerItems.map((item: any, pi: number) => (
                        <TableRow key={row._id + "_" + pi}>
                          {/* Sr No. only on first product row */}
                          <TableCell>
                            {pi === 0 ? (page - 1) * (pagination.limit || 10) + idx + 1 : ""}
                          </TableCell>
                          {/* PO Number only on first product row */}
                          <TableCell>
                            {pi === 0
                              ? (row.purchaseOrderId?.poNumber ? (
                                <span>{row.purchaseOrderId.poNumber}</span>
                              ) : (
                                <span>--</span>
                              ))
                              : ""}
                          </TableCell>
                          <TableCell>{item.productId}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          {/* Total, Status, Action only on first product row, merged with rowSpan */}
                          {pi === 0 && (
                            <>
                              <TableCell rowSpan={row.ledgerItems.length} className="align-top">
                                ₹{row.totalAmount ?? 0}
                              </TableCell>
                              <TableCell rowSpan={row.ledgerItems.length} className="align-top">
                                <Badge className={statusColor(row.status) + " text-xs px-3 py-1 rounded-full font-semibold"}>
                                  {row.status?.toUpperCase() || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell rowSpan={row.ledgerItems.length} className="align-top">
                                {row.status !== "paid" && row.purchaseOrderId && (
                                  <Button
                                    size={'sm'}
                                    onClick={() => setPaymentDialogLedger(row)}
                                  >
                                    Collect Payment
                                  </Button>
                                )}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      // If there are no products (ledgerItems), just show the row
                      <TableRow key={row._id + "_empty"}>
                        <TableCell>{(page - 1) * (pagination.limit || 10) + idx + 1}</TableCell>
                        <TableCell>
                          {row.purchaseOrderId?.poNumber ? (
                            <span>{row.purchaseOrderId.poNumber}</span>
                          ) : (
                            <span>--</span>
                          )}
                        </TableCell>
                        <TableCell colSpan={3} className="text-center">-- No Products --</TableCell>
                        <TableCell>₹{row.totalAmount ?? 0}</TableCell>
                        <TableCell>
                          <Badge className={statusColor(row.status) + " text-xs px-3 py-1 rounded-full font-semibold"}>
                            {row.status?.toUpperCase() || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.status !== "paid" && row.purchaseOrderId && (
                            <Button
                              size={'sm'}
                              onClick={() => setPaymentDialogLedger(row)}
                            >
                              Collect Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-lg">
                      No ledger entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* AddPaymentDialog should be opened only when triggered */}
          {paymentDialogLedger && (
            <AddPaymentDialog
              ledger={paymentDialogLedger}
              onSuccess={() => {
                setPaymentDialogLedger(null);
                loadLedger();
              }}
              onClose={() => setPaymentDialogLedger(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
