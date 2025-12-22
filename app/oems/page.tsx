"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import { getOEMs, deleteOEM } from "@/lib/oem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import OEMDialog from "@/components/oem/OEMDialog";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
  Factory,
} from "lucide-react";

/* ---------------- Status Badge ---------------- */

function OEMStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

/* ---------------- Skeleton ---------------- */

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* ---------------- Page ---------------- */

export default function OEMPage() {
  const [oems, setOEMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedOEM, setSelectedOEM] = useState<any>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");

  const loadData = async () => {
    setLoading(true);
    const res = await getOEMs();
    setOEMs(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- Delete ---------------- */

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteOEM(pendingDelete.id);
      toast.success("OEM deleted");
      loadData();
    } catch {
      toast.error("Failed to delete OEM");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setPendingDelete(null);
    }
  };

  /* ---------------- Filtering ---------------- */

  const filteredData = useMemo(() => {
    return oems.filter((oem) => {
      if (statusFilter === "active") return oem.isActive;
      if (statusFilter === "inactive") return !oem.isActive;
      return true;
    });
  }, [oems, statusFilter]);

  /* ---------------- Columns ---------------- */

  const columns: ColumnDef<any>[] = [
    {
      id: "srNo",
      header: "Sr. No",
      cell: ({ row }) => {
        // Show correct serial number relative to current pagination
        const { pageIndex, pageSize } = table.getState().pagination;
        return pageIndex * pageSize + row.index + 1;
      },
      size: 60,
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "contactNumber", header: "Contact" },
    { accessorKey: "contactPerson", header: "Contact Person" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <OEMStatusBadge isActive={row.original.isActive} />
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedOEM(row.original);
                setOpen(true);
              }}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setPendingDelete(row.original);
                setDeleteOpen(true);
              }}
            >
             Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // To access pagination in sr.no column, we need to initialize table before using columns
  const [tableInstance, setTableInstance] = useState<any>(null);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Set table instance after initialization so column is aware of pagination
  useEffect(() => {
    setTableInstance(table);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().pagination.pageIndex, table.getState().pagination.pageSize, filteredData]);

  // Patch columns for correct reference to table instance
  columns[0].cell = ({ row }: any) => {
    const t = tableInstance || table;
    const { pageIndex, pageSize } = t.getState().pagination;
    return pageIndex * pageSize + row.index + 1;
  };

  return (
    <div className="max-w-8xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            {/* <Factory className="h-5 w-5 text-muted-foreground" /> */}
            <CardTitle className="text-2xl">OEM Management</CardTitle>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Search OEM..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="md:w-[260px]"
              />

              <Select
                value={statusFilter}
                onValueChange={(v: any) => setStatusFilter(v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setOpen(true)}>
              {/* <Plus className="mr-2 h-4 w-4" /> */}
              Add OEM
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
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
                  <TableSkeleton />
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      No OEMs found
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredData.map((oem, idx) => (
              <Card key={oem.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground px-1">{idx + 1}</div>
                      <div className="font-semibold">{oem.name}</div>
                    </div>
                    <OEMStatusBadge isActive={oem.isActive} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {oem.email}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOEM(oem);
                        setOpen(true);
                      }}
                    >
                      Edit details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingDelete(oem);
                        setDeleteOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete OEM</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {pendingDelete?.name}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OEMDialog
        open={open}
        onOpenChange={setOpen}
        initialData={selectedOEM}
        onSuccess={loadData}
      />
    </div>
  );
}
