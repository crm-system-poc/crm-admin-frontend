"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Lead, Paginated } from "@/components/leads/types";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import { AssignLeadDialog } from "@/components/leads/AssignLeadDialog";
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
import { hasModule, hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";

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
  "oem_approval",
  "lost",
] as const;
const PRIORITY = ["low", "medium", "high"] as const;
const SOURCE = [
  "website",
  "referral",
  "social_media",
  "cold_call",
  "email",
  "oem",
  "other",
] as const;

export default function LeadsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);

  const canAssignLead =
    user?.systemrole === "SuperAdmin" ||
    user?.role === "Manager" ||
    hasAction(user?.permissions, "manageLeads", "update");

  const [openedDropdown, setOpenedDropdown] = useState<string | null>(null);

  // searchuery state
  const [search, setsearch] = useState("");
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const fetchLeads = async (pageNo = 1) => {
    const statussearchuery = status === "all" ? undefined : status;
    const prioritysearchuery = priority === "all" ? undefined : priority;
    const sourcesearchuery = source === "all" ? undefined : source;

    try {
      setLoading(true);

      const resp = await api.get(`/api/leads`, {
        params: {
          page: pageNo,
          limit: 10,
          search: search, // 🔥 Backend expects `search`, not `search`
          status: statussearchuery,
          priority: prioritysearchuery,
          source: sourcesearchuery,
        },
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

  // re-searchuery when filters/search change
  useEffect(() => {
    const t = setTimeout(() => fetchLeads(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, source]);

  // Remove allSelected, toggleAll, toggleOne, bulk actions, bulk assign/delete
  // const allSelected = useMemo(
  //   () => rows.length > 0 && rows.every((r) => selected[r.id]),
  //   [rows, selected]
  // );

  // const toggleAll = (checked: boolean | string) => {
  //   const map: Record<string, boolean> = {};
  //   if(checked) rows.forEach((r) => (map[r.id] = true));
  //   setSelected(map);
  // };

  // const toggleOne = (id: string, checked: boolean | string) => {
  //   setSelected((prev) => ({...prev, [id]: !!checked}));
  // };

  // const handleBulkDeleteConfirmed = async () => { ... }

  // const onBulkDelete = () => { ... }

  // const onBulkAssign = async () => { ... }

  const convertTosearchuotation = async (lead: Lead) => {
    try {
      toast.loading("Converting to searchuotation...");
      // Example: pass lead fields directly; adjust to your backend contract
      const payload = {
        customerName: lead.customerName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phoneNumber: lead.phoneNumber,
        projectTitle:
          lead.researchuirementDetails?.slice(0, 40) || "searchuotation",
        researchuirementDetails: lead.researchuirementDetails,
        estimatedValue: lead.estimatedValue ?? 0,
        leadId: lead.id,
      };
      await api.post(`/api/searchuotations`, payload);
      toast.dismiss();
      toast.success("searchuotation created");
      // navigate to searchuotation list or detail
      router.push("/searchuotation");
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

  // FIX: Remove programmatically closing the dropdown on navigation.
  // This function is now not called from Dropdown, see below.
  const handleDropdownMenuNavClick = (href: string) => {
    router.push(href);
    // Do not close dropdown programmatically
  };

  // table columns
  const columns: ColumnDef<Lead>[] = useMemo(
    () => [
      // Remove checkbox selection column
      // Add index column instead
      {
        id: "index",
        header: "Sr.No",
        cell: ({ row }) =>
          row.index + 1 + (pagination.page - 1) * pagination.limit,
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
        accessorKey: "createdby",
        header: "Created By",
        cell: ({ row }) => (
          <p className="capitalize" variant="secondary">
            {row.original.createdBy.name}
          </p>
        ),
      },
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
        accessorKey: "Lead Age",
        header: "Lead Age",
        cell: ({ row }) => {
          // Calculate age in days from createdAt
          const createdAt = row.original.createdAt ? new Date(row.original.createdAt) : null;
          let ageInDays = 0;
          if (createdAt) {
            const now = new Date();
            const diff = now.getTime() - createdAt.getTime();
            ageInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
          }
          return (
            <Badge variant="outline">{ageInDays} days</Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu
            open={openedDropdown === row.original.id}
            onOpenChange={(open) => {
              if (open) {
                setOpenedDropdown(row.original.id);
              } else {
                setOpenedDropdown(null);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasAction(user.permissions, "manageLeads", "update") && (
                <DropdownMenuItem
                  // Fix: Prevent dropdown from closing & fix navigation bug!
                  onSelect={(e) => {
                    e.preventDefault();
                    // Do not close the menu, just navigate
                    router.push(`/leads/${row.original.id}`);
                  }}
                  // <DropdownMenuItem/> in shadcn/ui doesn't close when onSelect preventsDefault
                >
                  View details
                </DropdownMenuItem>
              )}
              {canAssignLead && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setLeadToAssign(row.original);
                    setAssignDialogOpen(true);
                  }}
                >
                  Assign Lead
                </DropdownMenuItem>
              )}
              {hasAction(user.permissions, "manageQuotation", "create") && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    router.push(`/leads/Quotation/${row.original.id}`);
                  }}
                >
                  Create Quotation
                </DropdownMenuItem>
              )}
              {hasAction(user.permissions, "managePurchaseOrder", "read") && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    router.push(`/leads/purchase-orders/${row.original.id}`);
                  }}
                >
                  View Purchase orders
                </DropdownMenuItem>
              )}
              {hasAction(user.permissions, "manageQuotation", "read") && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    router.push(`/leads/view/${row.original.id}`);
                  }}
                >
                  View Quotations
                </DropdownMenuItem>
              )}
              {/* Use AlertDialog for Delete Lead */}
              <AlertDialog
                open={deleteDialogOpen && leadToDelete === row.original.id}
                onOpenChange={(open) => {
                  if (!open) {
                    setDeleteDialogOpen(false);
                    setLeadToDelete(null);
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  {hasAction(user.permissions, "manageLeads", "delete") && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        // Leave dropdown open, do not call setOpenedDropdown(null)
                        deleteLeadById(row.original.id);
                      }}
                      className="text-destructive"
                    >
                      Delete Lead
                    </DropdownMenuItem>
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lead? This action
                      cannot be undone.
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
    [
      router,
      deleteDialogOpen,
      leadToDelete,
      openedDropdown,
      pagination.page,
      pagination.limit,
    ]
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
            value={search}
            onChange={(e) => setsearch(e.target.value)}
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
          {hasAction(user.permissions, "manageLeads", "create") && (
            <Button onClick={() => router.push("/leads/createleads")}>
              Create Lead
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions removed */}

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
      {leadToAssign && (
        <AssignLeadDialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            // if (!open) setLeadToAssign(null);
            setAssignDialogOpen(open);
          }}
          leadId={leadToAssign.id}
          currentAssigneeName={
            // only if you already populate assignedTo on the lead
            // adjust based on your actual schema
            // e.g. leadToAssign.assignedTo?.name
            undefined
          }
          onAssigned={() => {
            // refetch current page of leads
            fetchLeads(page);
          }}
        />
      )}
    </div>
  );
}
