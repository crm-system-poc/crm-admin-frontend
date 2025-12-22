"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Package } from "lucide-react";
import { hasModule, hasAction } from "@/lib/permissions";
import { useAuth } from "@/components/context/AuthContext";

// Allowed license types according to backend enum
const LICENSE_TYPES = [
  "perpetual",
  "saas",
  "sro",
  "mro",
  "xaas",
  "other",
];

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

type Item = {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  oem: string;
  oemPrice: string;
  description: string;
  unitPrice: string;
  quantity: string;
  licenseType: string;
  licenseExpiryDate: string; // format: yyyy-mm-dd (HTML input type="date")
};

const EMPTY_ITEM: Item = {
  productId: "",
  productName: "",
  productCode: "",
  category: "",
  oem: "",
  oemPrice: "",
  description: "",
  unitPrice: "",
  quantity: "",
  licenseType: "",
  licenseExpiryDate: "",
};

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const params = useParams();
  const leadIdParam = (params?.leadid as string) || "";
  const quotationIdParam = (params?.id as string) || "";
  const { user, logout } = useAuth();
  const permissions = user?.permissions || {};

  // New: store quotation data
  const [quotationData, setQuotationData] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);

  // Add customer PO number state
  const [customerPONumber, setCustomerPONumber] = useState("");

  // Set initial state based on fetched quotation
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [form, setForm] = useState({
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    poDate: "",
  });
  const [poPdfFile, setPoPdfFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
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

  // Fetch Quotation by ID when id param is defined
  useEffect(() => {
    async function fetchQuotation() {
      if (!quotationIdParam) return;
      setQuoteLoading(true);
      try {
        const response = await api.get(`http://localhost:8080/api/quotations/${quotationIdParam}`);
        const data = response.data.data;
        setQuotationData(data);

        // Populate initial items and form fields from quotation, if present
        if (data?.items && Array.isArray(data.items)) {
          setItems(
            data.items.map((item: any) => ({
              productId: item.productId?.toString() || "",
              productName: item.productName || "",
              productCode: item.productCode || "",
              category: item.category || "",
              oem: item.oem || "",
              oemPrice: item.oemPrice !== undefined ? String(item.oemPrice) : "",
              description: item.description || "",
              unitPrice: item.unitPrice !== undefined ? String(item.unitPrice) : "",
              quantity: item.quantity !== undefined ? String(item.quantity) : "",
              licenseType: item.licenseType || "",
              licenseExpiryDate: item.licenseExpiryDate
                ? item.licenseExpiryDate.slice(0, 10)
                : "",
            })) || [{ ...EMPTY_ITEM }]
          );
        }
        setForm({
          paymentTerms: data.paymentTerms || "",
          deliveryTerms: data.deliveryTerms || "",
          notes: data.notes || "",
          poDate: "",
        });
        // Reset customer PO number
        setCustomerPONumber("");
      } catch (e) {
        toast.error("Failed to fetch quotation details.");
      } finally {
        setQuoteLoading(false);
      }
    }
    fetchQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationIdParam]);

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
    if (!product) return productId;
    return product.productId || product._id || product.id || productId;
  };

  // Check if product is already selected in another item
  const isProductAlreadySelected = (productId: string, currentItemIdx: number): boolean => {
    if (!productId) return false;
    
    const currentProduct = products.find(
      (p) =>
        p.productId === productId ||
        p._id === productId ||
        p.id === productId ||
        (p._id && p._id.toString() === productId) ||
        (p.id && p.id.toString() === productId)
    );
    
    return items.some((item, idx) => {
      if (idx === currentItemIdx) return false;
      if (!item.productId) return false;
      
      if (item.productId === productId) return true;
      
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
          if (currentProduct.productId && existingProduct.productId) {
            return currentProduct.productId === existingProduct.productId;
          }
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

    const selectedProduct = products.find(
      (p) =>
        p.productId === value ||
        p._id === value ||
        p.id === value ||
        (p._id && p._id.toString() === value) ||
        (p.id && p.id.toString() === value)
    );

    const actualProductId = selectedProduct?.productId || value;
    
    // Check if this product is already selected in another item
    if (isProductAlreadySelected(actualProductId, itemIdx)) {
      toast.error("Cannot select similar product. This product has already been selected in another item.");
      return;
    }
    
    handleItemChange(itemIdx, "productId", actualProductId);
    
    if (value) {
      fetchProductDetails(value, itemIdx);
    }
  };

  // Update item field
  const handleItemChange = (
    idx: number,
    field: keyof Item,
    value: string
  ) => {
    setItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () =>
    setItems((items) => [...items, { ...EMPTY_ITEM }]);

  const removeItem = (idx: number) => {
    setItems((items) =>
      items.length === 1 ? items : items.filter((_, i) => i !== idx)
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  // Handles customer PO number input change
  const handleCustomerPONumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPONumber(e.target.value.toUpperCase());
  };

  // Validation to match backend model
  const validateItems = (): {
    valid: boolean;
    parsed?: {
      productId: string;
      description: string;
      unitPrice: number;
      quantity: number;
      licenseType: string;
      licenseExpiryDate?: string | null;
    }[];
    error?: string;
  } => {
    if (!items.length) {
      return {
        valid: false,
        error: "At least one item is required for the Purchase Order.",
      };
    }

    // Check for duplicate products
    const productIds = items
      .map((item) => item.productId?.trim())
      .filter((id) => id);
    
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      return {
        valid: false,
        error: "Cannot select similar product. Each product can only be selected once.",
      };
    }

    for (const [idx, item] of items.entries()) {
      // productId, licenseType, description, unitPrice, quantity are required
      if (
        !item.productId.trim() ||
        !item.licenseType.trim() ||
        !item.description.trim() ||
        !item.unitPrice.trim() ||
        !item.quantity.trim()
      ) {
        if (!item.licenseType.trim()) {
          return {
            valid: false,
            error: `Item validation failed: Item ${idx + 1}: License type is required`,
          };
        }
        return {
          valid: false,
          error: `All fields except license expiry are required for Item ${idx + 1}.`
        };
      }
      // License type must be allowed
      if (!LICENSE_TYPES.includes(item.licenseType.trim())) {
        return {
          valid: false,
          error: `Item ${idx + 1}: Invalid license type "${item.licenseType}".`,
        };
      }
      // Validate price/quantity as numbers
      const unitPrice = Number(item.unitPrice);
      const quantity = Number(item.quantity);

      if (isNaN(unitPrice) || unitPrice < 0) {
        return {
          valid: false,
          error: `Unit price must be a non-negative number (in Item ${idx + 1}).`
        };
      }
      if (isNaN(quantity) || quantity < 1) {
        return {
          valid: false,
          error: `Quantity must be at least 1 (in Item ${idx + 1}).`
        };
      }

      // For non-perpetual, licenseExpiryDate REQUIRED and must be a future date
      if (item.licenseType !== "perpetual") {
        if (!item.licenseExpiryDate) {
          return {
            valid: false,
            error: `Item validation failed: Item ${idx + 1}: License expiry date is required for non-perpetual licenses`,
          };
        }
        // Expiry date > now
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiryDate = new Date(item.licenseExpiryDate);
        if (
          isNaN(expiryDate.getTime()) ||
          expiryDate <= today
        ) {
          return {
            valid: false,
            error: `Item validation failed: Item ${idx + 1}: License expiry date must be in the future for non-perpetual licenses`,
          };
        }
      }
    }

    // Prepare parsed data for backend
    const parsed = items.map(item => ({
      productId: item.productId.trim(),
      description: item.description,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      licenseType: item.licenseType.trim(),
      licenseExpiryDate:
        item.licenseType !== "perpetual" && item.licenseExpiryDate
          ? item.licenseExpiryDate
          : undefined,
    }));
    return { valid: true, parsed };
  };

  // Handles POST to backend for purchase order
  const submitPurchaseOrder = async () => {
    setLoading(true);

    // Validate customer PO number
    if (!customerPONumber.trim()) {
      toast.error("Customer PO Number is required.");
      setLoading(false);
      return;
    }

    // Check if file is present
    if (!poPdfFile) {
      toast.error("PO PDF attachment is required (filename field must be 'poPdf')");
      setLoading(false);
      return;
    }

    const { valid, parsed, error } = validateItems();
    if (!valid) {
      toast.error(error);
      setLoading(false);
      return;
    }

    // Validate required form fields
    if (!form.paymentTerms.trim()) {
      toast.error("Payment Terms is required.");
      setLoading(false);
      return;
    }
    if (!form.deliveryTerms.trim()) {
      toast.error("Delivery Terms is required.");
      setLoading(false);
      return;
    }
    if (!form.poDate.trim()) {
      toast.error("PO Date is required.");
      setLoading(false);
      return;
    }

    try {
      // Build FormData for multipart/form-data
      const formData = new FormData();
      formData.append("poNumber", customerPONumber); // include manually entered PO number
      formData.append("leadId", leadIdParam);
      formData.append("quotationId", quotationIdParam);
      formData.append("items", JSON.stringify(parsed));
      formData.append("paymentTerms", form.paymentTerms);
      formData.append("deliveryTerms", form.deliveryTerms);
      formData.append("notes", form.notes);
      formData.append("poDate", form.poDate);
      // PDF file
      formData.append("poPdf", poPdfFile);
      if (licenseFile) {
        formData.append("licenseFile", licenseFile);
      }

      const res = await api.post(
        "http://localhost:8080/api/purchase-orders",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        toast.success("Purchase Order created successfully ✅");
        router.push(`/leads/${leadIdParam}`);
      } else {
        toast.error(res.data?.error || "Failed to create Purchase Order");
      }
    } catch (err: any) {
      // show explicit error if attachment is required and backend responds with such error
      const backendErr = err?.response?.data?.error;
      if (
        backendErr &&
        (backendErr.toLowerCase().includes("po pdf attachment is required")
         || backendErr.toLowerCase().includes("unexpected field"))
      ) {
        toast.error("PO PDF attachment is required (filename field must be 'poPdf')");
      } else if (
        backendErr &&
        backendErr.toLowerCase().includes('item validation failed') &&
        backendErr.toLowerCase().includes('license type is required')
      ) {
        toast.error(backendErr);
      } else if (
        backendErr &&
        backendErr.toLowerCase().includes("po number") &&
        backendErr.toLowerCase().includes("required")
      ) {
        toast.error("Customer PO Number is required (must be entered exactly as shown on customer PO).");
      } else {
        toast.error(backendErr || "Failed to create Purchase Order");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-6 space-y-4 max-w-8xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Create Purchase Order</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Customer PO Number input */}
          <div className="mb-6 max-w-md">
            <label className="font-semibold text-sm block mb-1" htmlFor="customer-po-number">
              Customer PO Number <span className="text-red-500">*</span>
            </label>
            <Input
              id="customer-po-number"
              type="text"
              placeholder="Enter Customer PO number (as shown on customer PO)"
              value={customerPONumber}
              onChange={handleCustomerPONumberChange}
              autoComplete="off"
              maxLength={100}
              required
            />
          </div>
          {quoteLoading ? (
            <div className="py-6 text-center text-gray-400">Loading quotation&hellip;</div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Product Items</span>
                  <div className="flex gap-2">
                  {hasAction(user?.permissions, "manageProducts", "create") && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => router.push("/products/add")}
                    >
                      {/* <Package className="w-4 h-4" /> */}
                      Add Master Products
                    </Button>
                  )}
                  {hasAction(user?.permissions, "managePurchaseOrder", "create") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={addItem}
                      className="px-3 py-1"
                      variant="outline"
                    >
                      Add Item
                    </Button>
                  )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {items.map((item, idx) => {
                    const licenseType = item.licenseType;
                    return (
                      <div
                        className="bg-white rounded-lg shadow border border-gray-200 p-4 grid gap-3 relative"
                        key={idx}
                      >
                        <div className="absolute top-3 right-3">
                          {/* Replace Remove button with Trash2 Lucide icon */}
                          {hasAction(user?.permissions, "managePurchaseOrder", "create") && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            title={items.length === 1 ? "At least one item required" : "Remove"}
                            className={`text-red-600 transition hover:text-red-800 disabled:text-gray-300 p-1 rounded-full border border-transparent hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 ${
                              items.length === 1 ? "cursor-not-allowed" : ""
                            }`}
                            tabIndex={0}
                          >
                            <Trash2 size={20} strokeWidth={2} aria-label="Remove" />
                          </button>
                          )}
                        </div>
                        {/* Product Details Display */}
                        {(item.productName || item.productCode || item.category || item.oem || item.oemPrice) && (
                          <div className="mb-3 p-3 bg-muted/50 rounded-md border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {item.productName && (
                                <div>
                                  <span className="text-muted-foreground font-medium">Product Name:</span>
                                  <p className="font-semibold">{item.productName}</p>
                                </div>
                              )}
                              {item.productCode && (
                                <div>
                                  <span className="text-muted-foreground font-medium">Product Code:</span>
                                  <p className="font-semibold">{item.productCode}</p>
                                </div>
                              )}
                              {item.category && (
                                <div>
                                  <span className="text-muted-foreground font-medium">Category:</span>
                                  <p className="font-semibold">{item.category}</p>
                                </div>
                              )}
                              {item.oem && (
                                <div>
                                  <span className="text-muted-foreground font-medium">OEM:</span>
                                  <p className="font-semibold">{item.oem}</p>
                                </div>
                              )}
                              {item.oemPrice && (
                                <div>
                                  <span className="text-muted-foreground font-medium">OEM Price:</span>
                                  <p className="font-semibold">
                                    ₹{Number(item.oemPrice).toLocaleString("en-IN")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <Label
                              className="font-semibold text-sm mb-1 block"
                              htmlFor={`productId-${idx}`}
                            >
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
                                        if (existingProduct.productId && product.productId) {
                                          return existingProduct.productId === product.productId;
                                        }
                                        return (
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
                          <div className="flex flex-col gap-1">
                            <label
                              className="font-semibold text-sm mb-1 block"
                              htmlFor={`description-${idx}`}
                            >
                              Description
                            </label>
                            <Input
                              id={`description-${idx}`}
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(idx, "description", e.target.value)
                              }
                              required
                              name={`items.${idx}.description`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label
                              className="font-semibold text-sm mb-1 block"
                              htmlFor={`unitPrice-${idx}`}
                            >
                              Unit Price
                            </label>
                            <Input
                              id={`unitPrice-${idx}`}
                              placeholder="Unit Price"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(idx, "unitPrice", e.target.value)
                              }
                              type="number"
                              name={`items.${idx}.unitPrice`}
                              min="0"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label
                              className="font-semibold text-sm mb-1 block"
                              htmlFor={`quantity-${idx}`}
                            >
                              Quantity
                            </label>
                            <Input
                              id={`quantity-${idx}`}
                              placeholder="Quantity"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(idx, "quantity", e.target.value)
                              }
                              type="number"
                              name={`items.${idx}.quantity`}
                              min="1"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-sm mb-1 block" htmlFor={`licenseType-${idx}`}>License Type</label>
                            <select
                              id={`licenseType-${idx}`}
                              name={`items.${idx}.licenseType`}
                              value={item.licenseType}
                              onChange={e =>
                                handleItemChange(idx, "licenseType", e.target.value)
                              }
                              className="p-2 border rounded w-full"
                              required
                            >
                              <option value="">Select License Type</option>
                              {LICENSE_TYPES.map(type => (
                                <option value={type} key={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="font-semibold text-sm mb-1 block" htmlFor={`licenseExpiryDate-${idx}`}>License Expiry Date</label>
                            <Input
                              id={`licenseExpiryDate-${idx}`}
                              placeholder="License Expiry Date"
                              type="date"
                              value={item.licenseExpiryDate}
                              onChange={e =>
                                handleItemChange(idx, "licenseExpiryDate", e.target.value)
                              }
                              name={`items.${idx}.licenseExpiryDate`}
                              disabled={item.licenseType === "perpetual"}
                              required={item.licenseType !== "perpetual"}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-2">
                  <label className="font-semibold text-sm" htmlFor="paymentTerms">
                    Payment Terms
                  </label>
                  <Input
                    name="paymentTerms"
                    placeholder="Payment Terms"
                    onChange={handleChange}
                    value={form.paymentTerms}
                    id="paymentTerms"
                  />
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-2">
                  <label className="font-semibold text-sm" htmlFor="deliveryTerms">
                    Delivery Terms
                  </label>
                  <Input
                    name="deliveryTerms"
                    placeholder="Delivery Terms"
                    onChange={handleChange}
                    value={form.deliveryTerms}
                    id="deliveryTerms"
                  />
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-2">
                  <label className="font-semibold text-sm" htmlFor="poDate">
                    PO Date
                  </label>
                  <Input
                    name="poDate"
                    placeholder="PO Date"
                    onChange={handleChange}
                    value={form.poDate}
                    type="date"
                    id="poDate"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-2 md:col-span-1">
                  <label className="font-semibold text-sm" htmlFor="notes">
                    Notes
                  </label>
                  <Textarea
                    name="notes"
                    placeholder="Notes"
                    rows={3}
                    onChange={handleChange}
                    value={form.notes}
                    id="notes"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-2">
                    <label className="font-semibold text-sm" htmlFor="poPdf">
                      PO PDF (Attachment)
                    </label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPoPdfFile(e.target.files?.[0] || null)}
                      required
                      id="poPdf"
                    />
                  </div>
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-sm" htmlFor="licenseFile">
                        License File
                      </label>
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                      id="licenseFile"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6">
              {hasAction(user?.permissions, "managePurchaseOrder", "create") && (
                <Button
                  onClick={submitPurchaseOrder}
                  disabled={loading}
                  className=" "
                 
                >
                  {loading ? "Creating..." : "Create"}
                </Button>
              )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
