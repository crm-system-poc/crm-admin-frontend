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
import {
  Plus,
  Trash2,
  FilePlus,
  FileText,
  Percent,
  CalendarDays,
  StickyNote,
  Loader2,
  X,
  Package,
} from "lucide-react";

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

interface CustomerDetails {
  customerName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: string;
}

const initialCustomerDetails: CustomerDetails = {
  customerName: "",
  contactPerson: "",
  email: "",
  phoneNumber: "",
  address: "",
};

// Helper function to pretty-print address object
function formatAddress(address: any): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof address === "object") {
    // Concatenate address fields if present
    const {
      street = "",
      city = "",
      state = "",
      zipCode = "",
      country = "",
    } = address || {};
    const parts = [street, city, state, zipCode, country].filter(
      (p) => p && p.trim()
    );
    return parts.join(", ");
  }
  return "";
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

  // Customer details state for quotation, loaded from API
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    ...initialCustomerDetails,
  });
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(true);

  // --- [ NEW STATE for each field: unsafe detection of actual missing values ] ---
  const [customerFieldsActuallyEmpty, setCustomerFieldsActuallyEmpty] =
    useState({
      customerName: false,
      contactPerson: false,
      email: false,
      phoneNumber: false,
      address: false,
    });

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

  // Fetch customer details using leadIdParam
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!leadIdParam) return;
      setCustomerDetailsLoading(true);
      try {
        const res = await api.get(`/api/leads/${leadIdParam}`);
        const lead = res?.data?.data;
        if (lead) {
          let parsedAddress = "";
          if (
            lead.address &&
            typeof lead.address === "object" &&
            (lead.address.street ||
              lead.address.city ||
              lead.address.state ||
              lead.address.zipCode ||
              lead.address.country)
          ) {
            parsedAddress = formatAddress(lead.address);
          } else if (typeof lead.address === "string") {
            parsedAddress = lead.address;
          } else {
            parsedAddress = "";
          }

          setCustomerDetails({
            customerName:
              typeof lead.customerName === "string" ? lead.customerName : "",
            contactPerson:
              typeof lead.contactPerson === "string" ? lead.contactPerson : "",
            email: typeof lead.email === "string" ? lead.email : "",
            phoneNumber:
              typeof lead.phoneNumber === "string" ? lead.phoneNumber : "",
            address: parsedAddress,
          });
        }
      } catch (err) {
        toast.error("Failed to load customer details for this lead.");
        setCustomerDetails({ ...initialCustomerDetails });
      } finally {
        setCustomerDetailsLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [leadIdParam]);

  // Fetch product details by ID
  const fetchProductDetails = async (productId: string, itemIdx: number) => {
    try {
      const product = products.find(
        (p) =>
          p.productId === productId ||
          p._id === productId ||
          p.id === productId ||
          (p._id && p._id.toString() === productId) ||
          (p.id && p.id.toString() === productId)
      );
      if (product) {
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
                      description:
                        fetchedProduct.description ||
                        fetchedProduct.productName ||
                        "",
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
  const isProductAlreadySelected = (
    productId: string,
    currentItemIdx: number
  ): boolean => {
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
    if (isProductAlreadySelected(actualProductId, itemIdx)) {
      toast.error(
        "Cannot select similar product. This product has already been selected in another item."
      );
      return;
    }
    handleItemChange(itemIdx, "productId", actualProductId);
    if (value) {
      fetchProductDetails(value, itemIdx);
    }
  };

  // Track which fields are actually empty (for server-side error display)
  function setCustomerActuallyEmptyFields(fields: Record<string, boolean>) {
    setCustomerFieldsActuallyEmpty(fields);
    setTimeout(() => {
      setCustomerFieldsActuallyEmpty({
        customerName: false,
        contactPerson: false,
        email: false,
        phoneNumber: false,
        address: false,
      });
    }, 3000);
  }

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
      if (!i.unitPrice || isNaN(Number(i.unitPrice)))
        return "Valid unit price required on all items.";
      if (!i.quantity || isNaN(Number(i.quantity)))
        return "Valid quantity required on all items.";
    }
    if (!form.taxRate || isNaN(Number(form.taxRate)))
      return "Valid tax rate is required.";
    if (!form.validityDays || isNaN(Number(form.validityDays)))
      return "Validity days is required.";

    // Validate customer details (safe, i.e. make sure they aren't just string, also not just whitespace)
    const fields: Record<string, boolean> = {
      customerName:
        !customerDetails.customerName ||
        customerDetails.customerName.trim() === "",
      contactPerson:
        !customerDetails.contactPerson ||
        customerDetails.contactPerson.trim() === "",
      email: !customerDetails.email || customerDetails.email.trim() === "",
      phoneNumber:
        !customerDetails.phoneNumber ||
        customerDetails.phoneNumber.trim() === "",
      address:
        !customerDetails.address || customerDetails.address.trim() === "",
    };
    if (
      fields.customerName ||
      fields.contactPerson ||
      fields.email ||
      fields.phoneNumber ||
      fields.address
    ) {
      setCustomerActuallyEmptyFields(fields);
      let missingList = [];
      if (fields.customerName) missingList.push("Customer Name");
      if (fields.contactPerson) missingList.push("Contact Person");
      if (fields.email) missingList.push("Email");
      if (fields.phoneNumber) missingList.push("Phone Number");
      if (fields.address) missingList.push("Address");
      return `Missing customer details: ${missingList.join(", ")}`;
    }

    return null;
  }

  // UPLOAD THE PDF TO `/api/quotation-pdfs` FIRST IF FILE EXISTS, THEN USE PDF URL ON /api/quotations
  const submitQuotation = async () => {
    const error = validateItems();
    if (error) return toast.error(error);

    setLoading(true);

    let pdfUrl: string | undefined = undefined;
    let pdf: any = undefined; // Fix for referencing 'pdf' later

    try {
      // Step 1: If PDF file selected, upload file to API and get URL, fail if the upload fails.
      if (file) {
        const pdfForm = new FormData();
        pdfForm.append("pdf", file);
        // You can add metadata if needed, e.g. pdfForm.append("leadId", leadIdParam)
        const pdfRes = await api.post("/api/files/upload/quotation-pdf", pdfForm, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        // Check for both pdfRes.data?.success and the presence of the file url in .data.url or .data.data.url
        if (pdfRes.data?.success) {
          pdf = pdfRes.data.data;
          pdfUrl = pdf?.url;
        } else {
          throw new Error(
            pdfRes.data?.error || "Failed to upload PDF. Try again."
          );
        }
      }

      // Step 2: Create quotation as before, but pass PDF URL if present
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

      // Append customer details
      data.append("customerName", customerDetails.customerName);
      data.append("contactPerson", customerDetails.contactPerson);
      data.append("email", customerDetails.email);
      data.append("phoneNumber", customerDetails.phoneNumber);
      data.append("address", customerDetails.address);

      // Instead of sending the file as "pdf", pass the pdfUrl if present (send in correct form key!)
      if (pdfUrl && pdf) {
        data.append(
          "pdfFile",
          JSON.stringify({
            key: pdf.key,
            url: pdf.url,
            originalName: pdf.originalName,
            fileSize: pdf.fileSize,
          })
        );
      }

      const res = await api.post("/api/quotations", data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("Quotation created successfully!");
        router.push(`/leads/${leadIdParam}`);
      } else {
        let errorString = res.data?.error || "Failed to create quotation";
        if (
          typeof errorString === "string" &&
          errorString.includes("customerDetails")
        ) {
          // Attempt parse for human readable fields
          const match = errorString.match(
            /customerDetails\.([a-zA-Z]+): Path `customerDetails\.([a-zA-Z]+)` is required\./g
          );
          if (match) {
            const missingFields = match
              .map((m) => m.match(/customerDetails\.([a-zA-Z]+):/)?.[1] || "")
              .filter(Boolean);
            if (missingFields.length) {
              errorString =
                "Missing/required customer fields: " +
                missingFields
                  .map(
                    (f) =>
                      ((
                        {
                          customerName: "Customer Name",
                          contactPerson: "Contact Person",
                          email: "Email",
                          phoneNumber: "Phone Number",
                          address: "Address",
                        } as Record<string, string>
                      )[f] || f)
                  )
                  .join(", ");

              // Highlight missing field(s)
              const newFields: any = {
                customerName: false,
                contactPerson: false,
                email: false,
                phoneNumber: false,
                address: false,
              };
              missingFields.forEach((f: string) => {
                newFields[f] = true;
              });
              setCustomerActuallyEmptyFields(newFields);
            }
          }
        }
        toast.error(errorString);
      }
    } catch (err: any) {
      let errorString =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create quotation";
      if (
        typeof errorString === "string" &&
        errorString.includes("customerDetails")
      ) {
        const match = errorString.match(
          /customerDetails\.([a-zA-Z]+): Path `customerDetails\.([a-zA-Z]+)` is required\./g
        );
        if (match) {
          const missingFields = match
            .map((m) => m.match(/customerDetails\.([a-zA-Z]+):/)?.[1] || "")
            .filter(Boolean);
          if (missingFields.length) {
            errorString =
              "Missing/required customer fields: " +
              missingFields
                .map(
                  (f) =>
                    ((
                      {
                        customerName: "Customer Name",
                        contactPerson: "Contact Person",
                        email: "Email",
                        phoneNumber: "Phone Number",
                        address: "Address",
                      } as Record<string, string>
                    )[f] || f)
                )
                .join(", ");
            // highlight the actual fields
            const newFields: any = {
              customerName: false,
              contactPerson: false,
              email: false,
              phoneNumber: false,
              address: false,
            };
            missingFields.forEach((f: string) => {
              newFields[f] = true;
            });
            setCustomerActuallyEmptyFields(newFields);
          }
        }
      }
      toast.error(errorString);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for items
  function handleItemChange(idx: number, field: string, value: string) {
    setItems((items) =>
      items.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  }
  function addItem() {
    setItems([...items, { ...initialItem }]);
  }
  function removeItem(idx: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  // Handler for customerDetails form change (disallow editing since it's fetched)
  // But if you want to allow editing, keep this handler; otherwise, remove any edit fields below
  // function handleCustomerDetailsChange(field: keyof CustomerDetails, value: string) {
  //   setCustomerDetails((form) => ({
  //     ...form,
  //     [field]: value,
  //   }));
  // }

  return (
    <main className="max-w-8xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {/* <FileText className="w-6 h-6 text-pink-600" /> */}
            Create Quotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Customer Details */}
            <section>
              {/* <h3 className="text-lg font-semibold mb-2">Customer Details</h3> */}
              {customerDetailsLoading ? (
                <div className="text-muted-foreground text-sm mb-4">
                  Loading customer details...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block font-medium mb-1"
                    >
                      Customer Name *
                    </label>
                    <Input
                      id="customerName"
                      value={customerDetails.customerName}
                      placeholder="Customer Name"
                      readOnly
                      tabIndex={-1}
                      style={
                        customerFieldsActuallyEmpty.customerName
                          ? { borderColor: "#e11d48", background: "#ffecf1" }
                          : undefined
                      }
                    />
                    {customerFieldsActuallyEmpty.customerName && (
                      <span className="text-sm text-pink-600">
                        Please fill in Customer Name for this lead.
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="contactPerson"
                      className="block font-medium mb-1"
                    >
                      Contact Person *
                    </label>
                    <Input
                      id="contactPerson"
                      value={customerDetails.contactPerson}
                      placeholder="Contact Person"
                      readOnly
                      tabIndex={-1}
                      style={
                        customerFieldsActuallyEmpty.contactPerson
                          ? { borderColor: "#e11d48", background: "#ffecf1" }
                          : undefined
                      }
                    />
                    {customerFieldsActuallyEmpty.contactPerson && (
                      <span className="text-sm text-pink-600">
                        Please fill in Contact Person for this lead.
                      </span>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block font-medium mb-1">
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      placeholder="Email"
                      readOnly
                      tabIndex={-1}
                      style={
                        customerFieldsActuallyEmpty.email
                          ? { borderColor: "#e11d48", background: "#ffecf1" }
                          : undefined
                      }
                    />
                    {customerFieldsActuallyEmpty.email && (
                      <span className="text-sm text-pink-600">
                        Please fill in Email for this lead.
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block font-medium mb-1"
                    >
                      Phone Number *
                    </label>
                    <Input
                      id="phoneNumber"
                      value={customerDetails.phoneNumber}
                      placeholder="Phone Number"
                      readOnly
                      tabIndex={-1}
                      style={
                        customerFieldsActuallyEmpty.phoneNumber
                          ? { borderColor: "#e11d48", background: "#ffecf1" }
                          : undefined
                      }
                    />
                    {customerFieldsActuallyEmpty.phoneNumber && (
                      <span className="text-sm text-pink-600">
                        Please fill in Phone Number for this lead.
                      </span>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block font-medium mb-1">
                      Address *
                    </label>
                    <Textarea
                      id="address"
                      rows={2}
                      value={customerDetails.address}
                      placeholder="Address"
                      readOnly
                      tabIndex={-1}
                      style={
                        customerFieldsActuallyEmpty.address
                          ? { borderColor: "#e11d48", background: "#ffecf1" }
                          : undefined
                      }
                    />
                    {customerFieldsActuallyEmpty.address && (
                      <span className="text-sm text-pink-600">
                        Please fill in Address for this lead.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

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
                  {/* <Package className="w-4 h-4" /> */}
                  Add New Product
                </Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-end">
                  <div className="w-full max-w-xs">
                    <Label
                      htmlFor={`productId-${idx}`}
                      className="block text-md font-medium mb-1"
                    >
                      Product
                    </Label>
                    <Select
                      value={getProductSelectValue(item.productId)}
                      onValueChange={(value) => handleProductSelect(value, idx)}
                    >
                      <SelectTrigger id={`productId-${idx}`} className="w-full">
                        <SelectValue
                          placeholder={
                            productsLoading ? "Loading..." : "Select a product"
                          }
                        />
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
                            const productValue =
                              product.productId ||
                              product._id ||
                              product.id ||
                              "";
                            const isDisabled = items.some((item, itemIdx) => {
                              if (itemIdx === idx || !item.productId)
                                return false;

                              const existingProduct = products.find(
                                (p) =>
                                  p.productId === item.productId ||
                                  p._id === item.productId ||
                                  p.id === item.productId ||
                                  (p._id &&
                                    p._id.toString() === item.productId) ||
                                  (p.id && p.id.toString() === item.productId)
                              );

                              if (existingProduct && product) {
                                return (
                                  existingProduct.productId ===
                                    product.productId ||
                                  existingProduct._id === product._id ||
                                  existingProduct.id === product.id
                                );
                              }
                              return false;
                            });

                            return (
                              <SelectItem
                                key={
                                  product._id || product.id || product.productId
                                }
                                value={productValue}
                                disabled={isDisabled}
                              >
                                {product.productName} (
                                {product.productCode || product.productId})
                                {isDisabled && " (Already selected)"}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label
                      className="block text-md font-medium mb-1"
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
                    />
                  </div>
                  <div>
                    <label
                      className="block text-md font-medium mb-1"
                      htmlFor={`unitPrice-${idx}`}
                    >
                      Unit Price
                    </label>
                    <Input
                      id={`unitPrice-${idx}`}
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPrice", e.target.value)
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-md font-medium mb-1"
                      htmlFor={`quantity-${idx}`}
                    >
                      Quantity
                    </label>
                    <Input
                      id={`quantity-${idx}`}
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", e.target.value)
                      }
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
              <Button
                type="button"
                onClick={addItem}
                size="sm"
                className="mt-1 flex items-center gap-2"
              >
                {/* <Plus className="w-4 h-4" /> */}
                Add Item
              </Button>
            </section>

            {/* PDF Upload */}
            <section>
              <label
                htmlFor="pdf-file"
                className="block font-medium mb-1 flex items-center gap-2"
              >
                {/* <FilePlus className="w-4 h-4 text-muted-foreground" /> */}
                Attach Quotation PDF (optional)
              </label>
              <Input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </section>

            {/* Details */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tax-rate"
                  className="block font-medium mb-1 flex items-center gap-2"
                >
                  {/* <Percent className="w-4 h-4 text-muted-foreground" /> */}
                  Tax Rate (%)
                </label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, taxRate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="validity-days"
                  className="block font-medium mb-1 flex items-center gap-2"
                >
                  {/* <CalendarDays className="w-4 h-4 text-muted-foreground" /> */}
                  Validity Days
                </label>
                <Input
                  id="validity-days"
                  type="number"
                  min={1}
                  value={form.validityDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validityDays: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="notes"
                  className="block font-medium mb-1 flex items-center gap-2"
                >
                  {/* <StickyNote className="w-4 h-4 text-muted-foreground" /> */}
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="terms-and-conditions"
                  className="block font-medium mb-1 flex items-center gap-2"
                >
                  {/* <StickyNote className="w-4 h-4 text-muted-foreground" /> */}
                  Terms and Conditions
                </label>
                <Textarea
                  id="terms-and-conditions"
                  value={form.termsAndConditions}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      termsAndConditions: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                disabled={loading}
                onClick={submitQuotation}
                className="flex items-center gap-2"
               
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {/* <FilePlus className="w-4 h-4" /> */}
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
                {/* <X className="w-4 h-4" /> */}
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
