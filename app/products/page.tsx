"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  RefreshCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { unknown } from "zod";
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
import { hasModule, hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function ProductsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  // Set default oem to '__all__'
  const [oem, setOem] = useState("__all__");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Data state
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({ page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Distinct category and OEM options for filters
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [oemOptions, setOemOptions] = useState<string[]>([]);

  // ----------- ALERT DIALOG STATE: Only track _id being deleted, not open/close per row
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // For refresh: allow manual triggering
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch products (with filter and pagination)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (category && category !== "__all__") params.set("category", category);
        if (oem && oem !== "__all__") params.set("oem", oem);

        const res = await fetch(`http://localhost:8080/api/products?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();
        setProducts(Array.isArray(data.data) ? data.data : []);
        setPagination(
          data.pagination ?? {
            page: 1,
            limit: 20,
            total: Array.isArray(data.data) ? data.data.length : 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        );
      } catch (err: any) {
        setError(err?.message || "An error occurred");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    fetchProducts();
    // Cleanup refresh animation if any
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line
  }, [search, category, oem, page, limit, refreshCounter]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/products?limit=1000", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data.data) ? data.data : [];
        const categoryOptions = Array.from(
          new Set(
            rows
              .map((p: any) => typeof p.category === "string" ? p.category : undefined)
              .filter((v: unknown): v is string => typeof v === "string")
          )
        ).sort() as string[];
        setCategoryOptions(categoryOptions);

        const oemOptions = Array.from(
          new Set(
            rows
              .map((p: any) => typeof p.oem === "string" ? p.oem : undefined)
              .filter((v:unknown): v is string => typeof v === "string")
          )
        ).sort() as string[];
        setOemOptions(oemOptions);
      } catch {
        // fallback: ignore errors
      }
    };
    fetchFilterOptions();
  }, []);

  // Refresh button handler
  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshCounter((c) => c + 1);
    // If not done in 5 sec, stop spinner
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => setRefreshing(false), 5000);
  };

  // Helper to display price as currency
  const renderPrice = (price: any) => {
    if (typeof price === "number") {
      return price.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
    }
    if (typeof price === "string" && price.trim() !== "") {
      return price.startsWith("₹") ? price : `₹${price}`;
    }
    return "--";
  };

  // Pagination controls
  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1); // Reset to page 1
  }

  // For nice page number buttons (shadcn pagination style)
  function getPaginationRange(current: number, total: number, delta = 1) {
    // Shows 1 ... prev curr next ... last
    const range = [];
    const rangeWithDots: (number | "...")[] = [];
    let l: number;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }

  // Delete logic
  const handleDelete = (product: any) => {
    const id = product._id || product.id;
    if (id) setDeleteDialogId(id);
  };

  const confirmDelete = async () => {
    // deleteDialogId contains the product id to delete
    if (!deleteDialogId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/products/${deleteDialogId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete product");
      }
      setDeleteDialogId(null);
      setTimeout(() => setPage((p) => (p === 1 ? 2 : 1)), 0);
      setTimeout(() => setPage((p) => (p === 1 ? 1 : p)), 10);
    } catch (err: any) {
      setError(err?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handler for Edit
  const handleEdit = (product: any) => {
    const id = product._id || product.id || product.productId;
    if (id) {
      router.push(`/products/${id}`);
    }
  };

  // Find the product object for the open delete dialog so you can show info in Alert
  const productToDelete = deleteDialogId
    ? products.find(
        (p: any) =>
          (p._id === deleteDialogId) ||
          (p.id === deleteDialogId)
      ) || null
    : null;

  return (
    <main className="p-6 max-w-8xl mx-auto space-y-6">
      {/* Page Title, Add & Search beside Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Products
        </h1>
        <div className="flex gap-2 items-center">
        <div className="flex flex-col md:flex-row md:gap-4 gap-2 items-stretch md:items-end">
       
        <div className="w-full md:max-w-xs block md:hidden">
          <Label htmlFor="search" className="block text-sm mb-1 text-gray-700">Search</Label>
          <Input
            id="search"
            type="search"
            value={search}
            placeholder="Name, Code, ID, Description…"
            onChange={e => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div>
          {/* <Label htmlFor="category" className="text-sm mb-1 text-gray-700">Category</Label> */}
          <Select
            value={category === "" ? "__all__" : category}
            onValueChange={value => {
              setPage(1);
              setCategory(value === "__all__" ? "" : value);
            }}
          >
            <SelectTrigger id="category" className="min-w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {categoryOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:max-w-xs flex flex-col">
          {/* <Label htmlFor="oem" className="text-sm mb-1 text-gray-700">OEM</Label> */}
          <Select
            value={oem}
            onValueChange={value => {
              setPage(1);
              setOem(value);
            }}
          >
            <SelectTrigger id="oem">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {oemOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
          <Input
            id="search-top"
            type="search"
            className="w-48 sm:w-64"
            value={search}
            placeholder="Search products…"
            onChange={e => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <Button
            variant="outline"
            // size="icon"
            aria-label="Refresh"
            // className={
            //   "flex items-center justify-center" +
            //   (refreshing ? " animate-spin" : "")
            // }
            disabled={loading || refreshing}
            style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
            onClick={handleRefresh}
            title="Refresh products list"
          >
            <RefreshCcw className={"h-5 w-5 " + (refreshing ? "animate-spin" : "")} />
            Refresh
          </Button>
          {hasAction(user?.permissions, "manageProducts", "create") && (
            <Button
             
              onClick={() => router.push("/products/add")}
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr.No</TableHead>
              <TableHead>Product ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Product Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>OEM</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>OEM Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-red-600 py-8">
                  {error}
                </TableCell>
              </TableRow>
            ) : products.length ? (
              products.map((product: any, idx: number) => (
                <TableRow key={product._id || product.id}>
                  <TableCell>
                    {(pagination.page - 1) * pagination.limit + idx + 1}
                  </TableCell>
                  <TableCell>{product.productId || product.id || "--"}</TableCell>
                  <TableCell>{product.productName || product.name || "--"}</TableCell>
                  <TableCell>{product.productCode || product.code || "--"}</TableCell>
                  <TableCell>{product.category || "--"}</TableCell>
                  {/* If oem is empty or null show '--' */}
                  <TableCell>{(product.oem && product.oem !== "") ? product.oem : "--"}</TableCell>
                  <TableCell className="max-w-xs truncate">{product.description || "--"}</TableCell>
                  <TableCell>{renderPrice(product.oemPrice)}</TableCell>
                  <TableCell>{renderPrice(product.sellingPrice)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="More Actions"
                            className="flex items-center justify-center"
                          >
                            <MoreVertical className="h-6 w-6" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {hasAction(user.permissions, "manageProducts", "update") && (
                            <DropdownMenuItem
                              onClick={() => handleEdit(product)}
                            >
                              View details
                            </DropdownMenuItem>
                          )}
                          {/* {hasAction(user.permissions, "manageProducts", "update") &&
                            // hasAction(user.permissions, "manageProducts", "delete") && (
                            //   // <DropdownMenuSeparator />
                            // )} */}
                          {hasAction(user.permissions, "manageProducts", "delete") && (
                            <DropdownMenuItem
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(product);
                              }}
                              disabled={!!deleteDialogId}
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ALERT DIALOG FOR DELETE - only shown when deleteDialogId is set */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoading}
              onClick={confirmDelete}
            >
              {deleteLoading ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination controls (shadcn style) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 w-full">
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-start">
          <span className="text-xs text-gray-600 mr-2">Rows per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => handleLimitChange(Number(value))}
          >
            <SelectTrigger className="min-w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-5 text-xs text-gray-600">
            {pagination.total
              ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total}`
              : null}
          </span>
        </div>
        <div className="flex justify-end w-full sm:w-auto">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="First"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => handlePageChange(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              {getPaginationRange(pagination.page, pagination.totalPages, 1).map((item, idx) =>
                item === "..." ? (
                  <PaginationItem key={idx}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      isActive={item === pagination.page}
                      onClick={() => typeof item === "number" && handlePageChange(item)}
                      aria-current={item === pagination.page ? "page" : undefined}
                      tabIndex={item === pagination.page ? -1 : 0}
                      className={item === pagination.page ? "pointer-events-none" : ""}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Last"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => handlePageChange(pagination.totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </main>
  );
}
