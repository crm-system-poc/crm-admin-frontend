"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Lead, Paginated } from "@/components/leads/types";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Import shadcn/react primitives for AlertDialog
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const STATUS = [
  "new",
  "follow-up",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
const PRIORITY = ["low", "medium", "high"] as const;
const SOURCE = ["web", "email", "phone", "referral", "other"] as const;

export default function LeadsPage() {
  const router = useRouter();

  // query state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [page, setPage] = useState(1);

  // data state
  const [rows, setRows] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // selection state (bulk actions)
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // --- NEW STATE for Alert Dialogs (single & bulk delete) ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBulkDialogOpen, setDeleteBulkDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const fetchLeads = async (pageNo = 1) => {
    const statusQuery = status === "all" ? undefined : status;
    const priorityQuery = priority === "all" ? undefined : priority;
    const sourceQuery = source === "all" ? undefined : source;
    try {
      setLoading(true);
      const resp = await api.get(`/api/leads/customer/ABCCorporation`, {
        params: { page: pageNo, q, status: statusQuery, priority: priorityQuery, source: sourceQuery },
      });
      setRows(resp.data.data || []);
      setPagination(
        resp.data.pagination || {
          page: pageNo,
          limit: 10,
          total: 0,
          totalPages: 1,
        }
      );
      setPage(pageNo);
      setSelected({});
    } catch (e) {
      console.error(e);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-query when filters/search change
  useEffect(() => {
    const t = setTimeout(() => fetchLeads(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, priority, source]);

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected[r.id]),
    [rows, selected]
  );

  const toggleAll = (checked: boolean | string) => {
    const map: Record<string, boolean> = {};
    if (checked) rows.forEach((r) => (map[r.id] = true));
    setSelected(map);
  };

  const toggleOne = (id: string, checked: boolean | string) => {
    setSelected((prev) => ({ ...prev, [id]: !!checked }));
  };

  // actions
  // NOTE: onBulkDelete just sets dialog open, real delete in handleBulkDeleteConfirmed
  const handleBulkDeleteConfirmed = async () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (!ids.length) {
      toast.message("Select leads first");
      setDeleteBulkDialogOpen(false);
      return;
    }
    try {
      toast.loading("Deleting leads...");
      await api.post(`/api/leads/bulk-delete`, { ids }); // adjust to your backend
      toast.dismiss();
      toast.success("Deleted");
      setDeleteBulkDialogOpen(false);
      fetchLeads(page);
    } catch (e) {
      toast.dismiss();
      toast.error("Delete failed");
      setDeleteBulkDialogOpen(false);
    }
  };

  const onBulkDelete = () => {
    setDeleteBulkDialogOpen(true);
  };

  const onBulkAssign = async () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (!ids.length) return toast.message("Select leads first");
    try {
      toast.loading("Assigning...");
      await api.post(`/api/leads/bulk-assign`, { ids, assigneeId: "USER_ID" }); // adjust
      toast.dismiss();
      toast.success("Assigned");
      fetchLeads(page);
    } catch {
      toast.dismiss();
      toast.error("Assign failed");
    }
  };

  const convertToQuotation = async (lead: Lead) => {
    try {
      toast.loading("Converting to quotation...");
      // Example: pass lead fields directly; adjust to your backend contract
      const payload = {
        customerName: lead.customerName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phoneNumber: lead.phoneNumber,
        projectTitle: lead.requirementDetails?.slice(0, 40) || "Quotation",
        requirementDetails: lead.requirementDetails,
        estimatedValue: lead.estimatedValue ?? 0,
        leadId: lead.id,
      };
      await api.post(`/api/quotations`, payload);
      toast.dismiss();
      toast.success("Quotation created");
      // navigate to quotation list or detail
      router.push("/quotation");
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to convert");
    }
  };

  // Single delete by ID (uses dialog now, not window.confirm)
  const handleDeleteConfirmed = async () => {
    if (!leadToDelete) return;
    try {
      toast.loading("Deleting lead...");
      await api.delete(`/api/leads/${leadToDelete}`);
      toast.dismiss();
      toast.success("Lead deleted");
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      fetchLeads(page);
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to delete lead");
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const deleteLeadById = (leadId: string) => {
    setLeadToDelete(leadId);
    setDeleteDialogOpen(true);
  };

  // table columns
  const columns: ColumnDef<Lead>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={!!selected[row.original.id]}
            onCheckedChange={(v) => toggleOne(row.original.id, v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <button
            className="text-left hover:underline"
            onClick={() => router.push(`/leads/${row.original.id}`)}
            title="Open details"
          >
            {row.original.customerName}
          </button>
        ),
      },
      { accessorKey: "contactPerson", header: "Contact" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phoneNumber", header: "Phone" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className="capitalize" variant="secondary">
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const p = row.original.priority || "low";
          const cls =
            p === "high"
              ? "bg-red-500 text-white"
              : p === "medium"
              ? "bg-yellow-500 text-white"
              : "bg-emerald-500 text-white";
          return <Badge className={`capitalize ${cls}`}>{p}</Badge>;
        },
      },
      {
        accessorKey: "estimatedValue",
        header: "Value",
        cell: ({ row }) => <>₹ {row.original.estimatedValue ?? 0}</>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/leads/${row.original.id}`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/leads/quotation/${row.original.id}`)}
              >
               Create Quotation
              </DropdownMenuItem>
              {/* Use AlertDialog for Delete Lead */}
              <AlertDialog open={deleteDialogOpen && leadToDelete === row.original.id} onOpenChange={(open) => {
                if (!open) { setDeleteDialogOpen(false); setLeadToDelete(null);}
              }}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onClick={(e) => {
                      // stop DropdownMenuItem from triggering route change
                      e.preventDefault();
                      deleteLeadById(row.original.id);
                    }}
                    className="text-destructive"
                  >
                    Delete Lead
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lead? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setLeadToDelete(null);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteConfirmed}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [router, selected, allSelected, deleteDialogOpen, leadToDelete]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <div className="ml-auto flex w-full md:w-auto gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="w-full md:w-72"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem> 
              {STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {PRIORITY.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {SOURCE.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchLeads(1)}>
            Refresh
          </Button>
          <Button onClick={() => router.push("/leads/createleads")}>
            Create Lead
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {Object.values(selected).some(Boolean) && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {Object.values(selected).filter(Boolean).length} selected
            </span>
            {/* Use AlertDialog for bulk delete */}
            <AlertDialog open={deleteBulkDialogOpen} onOpenChange={setDeleteBulkDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" onClick={onBulkDelete}>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {Object.values(selected).filter(Boolean).length} selected leads?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the selected leads? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setDeleteBulkDialogOpen(false)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDeleteConfirmed}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="secondary" size="sm" onClick={onBulkAssign}>
              Assign
            </Button>
          </div>
        </>
      )}

      {/* Table */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>No leads found</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  {r.getVisibleCells().map((c) => (
                    <TableCell key={c.id}>
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages} • {pagination.total}{" "}
          total
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => fetchLeads(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => fetchLeads(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
