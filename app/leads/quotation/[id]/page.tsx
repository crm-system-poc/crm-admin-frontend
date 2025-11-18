"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
// Lucide icons
import { Plus, Trash2, FilePlus, FileText, Percent, CalendarDays, StickyNote, ClipboardList, Loader2, X, Package } from "lucide-react";

const initialItem = {
  productId: "",
  productName: "",
  productCode: "",
  category: "",
  oem: "",
  oemPrice: "",
  description: "",
  unitPrice: "",
  quantity: "",
};

interface Product {
  _id?: string;
  id?: string;
  productId: string;
  productName: string;
  productCode?: string;
  category?: string;
  oem?: string;
  description?: string;
  oemPrice?: number;
  sellingPrice?: number;
}

export default function CreateQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const leadIdParam = (params?.id as string) || "";

  const [items, setItems] = useState([{ ...initialItem }]);
  const [form, setForm] = useState({
    taxRate: "18",
    validityDays: "30",
    notes: "",
    termsAndConditions: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Product-related states
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await api.get("/api/products?limit=1000");
        if (res.data?.success) {
          setProducts(res.data.data || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch product details by ID
  const fetchProductDetails = async (productId: string, itemIdx: number) => {
    try {
      // Try to find product in the already fetched list first
      const product = products.find(
        (p) => 
          p.productId === productId || 
          p._id === productId || 
          p.id === productId ||
          (p._id && p._id.toString() === productId) ||
          (p.id && p.id.toString() === productId)
      );

      if (product) {
        // Update the item with product details
        setItems((prevItems) =>
          prevItems.map((it, i) =>
            i === itemIdx
              ? {
                  ...it,
                  productId: product.productId || productId,
                  productName: product.productName || "",
                  productCode: product.productCode || "",
                  category: product.category || "",
                  oem: product.oem || "",
                  oemPrice: product.oemPrice?.toString() || "",
                  description: product.description || product.productName || "",
                  unitPrice: product.sellingPrice?.toString() || "",
                }
              : it
          )
        );
      } else {
        // If not found, try to fetch by MongoDB _id from API
        // Note: This assumes productId might be a MongoDB _id
        // If it's a productId string, we'd need a different endpoint
        try {
          const res = await api.get(`/api/products/${productId}`);
          if (res.data?.success && res.data.data) {
            const fetchedProduct = res.data.data;
            setItems((prevItems) =>
              prevItems.map((it, i) =>
                i === itemIdx
                  ? {
                      ...it,
                      productId: fetchedProduct.productId || productId,
                      productName: fetchedProduct.productName || "",
                      productCode: fetchedProduct.productCode || "",
                      category: fetchedProduct.category || "",
                      oem: fetchedProduct.oem || "",
                      oemPrice: fetchedProduct.oemPrice?.toString() || "",
                      description: fetchedProduct.description || fetchedProduct.productName || "",
                      unitPrice: fetchedProduct.sellingPrice?.toString() || "",
                    }
                  : it
              )
            );
          }
        } catch (fetchErr) {
          // Silently fail - product might not exist or be a productId string
          console.warn("Could not fetch product by ID:", productId);
        }
      }
    } catch (err: any) {
      console.error("Error fetching product details:", err);
    }
  };

  // Get product value for Select component
  const getProductSelectValue = (productId: string): string => {
    if (!productId) return "";
    const product = products.find(
      (p) =>
        p.productId === productId ||
        p._id === productId ||
        p.id === productId ||
        (p._id && p._id.toString() === productId) ||
        (p.id && p.id.toString() === productId)
    );
    if (!product) return productId; // Return as-is if not found (might be manually entered)
    return product.productId || product._id || product.id || productId;
  };

  // Check if product is already selected in another item
  const isProductAlreadySelected = (productId: string, currentItemIdx: number): boolean => {
    if (!productId) return false;
    
    // Find the product object for the productId being checked
    const currentProduct = products.find(
      (p) =>
        p.productId === productId ||
        p._id === productId ||
        p.id === productId ||
        (p._id && p._id.toString() === productId) ||
        (p.id && p.id.toString() === productId)
    );
    
    return items.some((item, idx) => {
      if (idx === currentItemIdx) return false; // Skip current item
      if (!item.productId) return false;
      
      // Direct productId comparison
      if (item.productId === productId) return true;
      
      // If we have product objects, compare them
      if (currentProduct) {
        const existingProduct = products.find(
          (p) =>
            p.productId === item.productId ||
            p._id === item.productId ||
            p.id === item.productId ||
            (p._id && p._id.toString() === item.productId) ||
            (p.id && p.id.toString() === item.productId)
        );
        
        if (existingProduct && currentProduct) {
          // Compare by productId first (most reliable)
          if (currentProduct.productId && existingProduct.productId) {
            return currentProduct.productId === existingProduct.productId;
          }
          // Fallback to _id or id comparison
          return (
            currentProduct._id === existingProduct._id ||
            currentProduct.id === existingProduct.id
          );
        }
      }
      
      return false;
    });
  };

  // Handle product selection
  const handleProductSelect = (value: string, itemIdx: number) => {
    if (!value) {
      handleItemChange(itemIdx, "productId", "");
      return;
    }

    // Find the product to get the actual productId
    const selectedProduct = products.find(
      (p) =>
        p.productId === value ||
        p._id === value ||
        p.id === value ||
        (p._id && p._id.toString() === value) ||
        (p.id && p.id.toString() === value)
    );

    // Use the product's productId if available, otherwise use the value (which might be _id)
    const actualProductId = selectedProduct?.productId || value;
    
    // Check if this product is already selected in another item
    if (isProductAlreadySelected(actualProductId, itemIdx)) {
      toast.error("Cannot select similar product. This product has already been selected in another item.");
      return; // Don't update the selection
    }
    
    handleItemChange(itemIdx, "productId", actualProductId);
    
    if (value) {
      fetchProductDetails(value, itemIdx);
    }
  };

  function validateItems() {
    if (!leadIdParam) return "Missing lead ID";
    if (!items.length) return "At least one item is required.";
    
    // Check for duplicate products
    const productIds = items
      .map((item) => item.productId?.trim())
      .filter((id) => id);
    
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      return "Cannot select similar product. Each product can only be selected once.";
    }
    
    for (const i of items) {
      if (!i.productId?.trim()) return "Product ID required on all items.";
      if (!i.description?.trim()) return "Description required on all items.";
      if (!i.unitPrice || isNaN(Number(i.unitPrice))) return "Valid unit price required on all items.";
      if (!i.quantity || isNaN(Number(i.quantity))) return "Valid quantity required on all items.";
    }
    if (!form.taxRate || isNaN(Number(form.taxRate))) return "Valid tax rate is required.";
    if (!form.validityDays || isNaN(Number(form.validityDays))) return "Validity days is required.";
    return null;
  }

  const submitQuotation = async () => {
    const error = validateItems();
    if (error) return toast.error(error);

    setLoading(true);

    const mappedItems = items.map((i) => ({
      productId: i.productId,
      description: i.description,
      unitPrice: Number(i.unitPrice),
      quantity: Number(i.quantity),
    }));

    const data = new FormData();
    data.append("leadId", leadIdParam);
    data.append("items", JSON.stringify(mappedItems));
    data.append("taxRate", form.taxRate);
    data.append("validityDays", form.validityDays);
    data.append("notes", form.notes);
    data.append("termsAndConditions", form.termsAndConditions);
    if (file) data.append("pdf", file);

    try {
      const res = await api.post("/api/quotations", data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("Quotation created successfully!");
        router.push(`/leads/${leadIdParam}`);
      } else {
        toast.error(res.data?.error || "Failed to create quotation");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to create quotation"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handlers for items
  function handleItemChange(idx: number, field: string, value: string) {
    setItems(items =>
      items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it
      )
    );
  }
  function addItem() {
    setItems([...items, { ...initialItem }]);
  }
  function removeItem(idx: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-pink-600" />
            Create Quotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Quotation Items */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Products</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => router.push("/products/add")}
                >
                  <Package className="w-4 h-4" />
                  Add New Product
                </Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-end">
                  <div className="w-full max-w-xs">
                    <Label htmlFor={`productId-${idx}`} className="block text-md font-medium mb-1">
                      Product
                    </Label>
                    <Select
                      value={getProductSelectValue(item.productId)}
                      onValueChange={(value) => handleProductSelect(value, idx)}
                    >
                      <SelectTrigger id={`productId-${idx}`} className="w-full">
                        <SelectValue placeholder={productsLoading ? "Loading..." : "Select a product"} />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading products...
                          </SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="no-products" disabled>
                            No products available
                          </SelectItem>
                        ) : (
                          products.map((product) => {
                            const productValue = product.productId || product._id || product.id || "";
                            // Check if this product is already selected in another item (excluding current item)
                            const isDisabled = items.some((item, itemIdx) => {
                              if (itemIdx === idx || !item.productId) return false;
                              
                              const existingProduct = products.find(
                                (p) =>
                                  p.productId === item.productId ||
                                  p._id === item.productId ||
                                  p.id === item.productId ||
                                  (p._id && p._id.toString() === item.productId) ||
                                  (p.id && p.id.toString() === item.productId)
                              );
                              
                              if (existingProduct && product) {
                                return (
                                  existingProduct.productId === product.productId ||
                                  existingProduct._id === product._id ||
                                  existingProduct.id === product.id
                                );
                              }
                              return false;
                            });
                            
                            return (
                              <SelectItem
                                key={product._id || product.id || product.productId}
                                value={productValue}
                                disabled={isDisabled}
                              >
                                {product.productName} ({product.productCode || product.productId})
                                {isDisabled && " (Already selected)"}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-md font-medium mb-1" htmlFor={`description-${idx}`}>
                      Description
                    </label>
                    <Input
                      id={`description-${idx}`}
                      placeholder="Description"
                      value={item.description}
                      onChange={e => handleItemChange(idx, "description", e.target.value)}
                     
                    />
                  </div>
                  <div>
                    <label className="block text-md font-medium mb-1" htmlFor={`unitPrice-${idx}`}>
                      Unit Price
                    </label>
                    <Input
                      id={`unitPrice-${idx}`}
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(idx, "unitPrice", e.target.value)}
                    
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-md font-medium mb-1" htmlFor={`quantity-${idx}`}>
                      Quantity
                    </label>
                    <Input
                      id={`quantity-${idx}`}
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, "quantity", e.target.value)}
                     
                      min={1}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeItem(idx)}
                    size="icon"
                    variant="destructive"
                    className="ml-1 self-end"
                    disabled={items.length === 1}
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={addItem} size="sm" className="mt-1 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </section>

            {/* PDF Upload */}
            <section>
              <label htmlFor="pdf-file" className="block font-medium mb-1 flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-muted-foreground" />
                Attach Quotation PDF (optional)
              </label>
              <Input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </section>

            {/* Details */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tax-rate" className="block font-medium mb-1 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  Tax Rate (%)
                </label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  value={form.taxRate}
                  onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="validity-days" className="block font-medium mb-1 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  Validity Days
                </label>
                <Input
                  id="validity-days"
                  type="number"
                  min={1}
                  value={form.validityDays}
                  onChange={e => setForm(f => ({ ...f, validityDays: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block font-medium mb-1 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-muted-foreground" />
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="terms-and-conditions" className="block font-medium mb-1 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-muted-foreground" />
                  Terms and Conditions
                </label>
                <Textarea
                  id="terms-and-conditions"
                  value={form.termsAndConditions}
                  onChange={e => setForm(f => ({ ...f, termsAndConditions: e.target.value }))}
                  rows={2}
                />
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                disabled={loading}
                onClick={submitQuotation}
                className="bg-pink-600 hover:bg-pink-700 flex items-center gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FilePlus className="w-4 h-4" />
                    Submit Quotation
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/leads/${leadIdParam}`)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
