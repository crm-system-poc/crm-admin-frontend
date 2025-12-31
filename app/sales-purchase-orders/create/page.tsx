"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Item = {
  productId: string;
  description: string;
  quantity: number;
  licenseType: string;
  licenseExpiryDate: string;
  oemPrice: number;
};

export default function CreateSalesPOPage() {
  const router = useRouter();
  const [basePoIdFromQuery, setBasePoIdFromQuery] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setBasePoIdFromQuery(sp.get("basePoId"));
  }, []);
  const [loadingBasePOs, setLoadingBasePOs] = useState(false);
  const [loadingBasePODetails, setLoadingBasePODetails] = useState(false);
  const [basePOs, setBasePOs] = useState<any[]>([]);
  const [selectedBasePOId, setSelectedBasePOId] = useState<string>("none");
  const [selectedBasePO, setSelectedBasePO] = useState<any>(null);

  useEffect(() => {
    if (basePoIdFromQuery) setSelectedBasePOId(basePoIdFromQuery);
  }, [basePoIdFromQuery]);
  const [items, setItems] = useState<Item[]>([
    {
      productId: "",
      description: "",
      quantity: 1,
      licenseType: "perpetual",
      licenseExpiryDate: "",
      oemPrice: 0,
    },
  ]);

  const [form, setForm] = useState({
    poNumber: "",
    poDate: new Date().toISOString().split("T")[0],
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    status: "draft",
    amcPeriod: "",
    rewardId: "",
  });

  // Fetch base POs on mount
  useEffect(() => {
    const fetchBasePOs = async () => {
      try {
        setLoadingBasePOs(true);
        // Fetch base POs
        const res = await api.get("/api/purchase-orders?limit=100");
        const allPOs = res.data.data;

        // Filter only base POs
        const basePOsList = allPOs.filter(
          (po: any) => po.poType === "base"
        );

        // Fetch existing sales POs to filter out base POs that already have sales PO
        const salesPOsRes = await api.get("/api/sales-purchase-orders?limit=1000");
        const existingSalesPOs = salesPOsRes.data.data || [];
        const basePOsWithSalesPO = new Set(
          existingSalesPOs
            .map((spo: any) => spo.parentPoId?._id || spo.parentPoId)
            .filter(Boolean)
        );

        // Filter out base POs that already have a sales PO
        // But include the base PO from query params even if it has a sales PO
        const availableBasePOs = basePOsList.filter(
          (po: any) => {
            const poId = po.id || po._id;
            // Include if no sales PO exists, OR if it's the one from query params
            return !basePOsWithSalesPO.has(poId) || poId === basePoIdFromQuery;
          }
        );

        setBasePOs(availableBasePOs);
      } catch (error: any) {
        console.error("Failed to fetch base POs:", error);
        toast.error("Failed to load base purchase orders");
      } finally {
        setLoadingBasePOs(false);
      }
    };

    fetchBasePOs();
  }, []);

  // Fetch base PO details when selected
  const handleBasePOChange = async (basePOId: string) => {
    if (!basePOId || basePOId === "none") {
      // Reset form if no base PO selected
      setSelectedBasePOId("none");
      setSelectedBasePO(null);
      setForm({
        poNumber: "",
        poDate: new Date().toISOString().split("T")[0],
        paymentTerms: "",
        deliveryTerms: "",
        notes: "",
        status: "draft",
        amcPeriod: "",
        rewardId: "",
      });
      setItems([
        {
          productId: "",
          description: "",
          quantity: 1,
          licenseType: "perpetual",
          licenseExpiryDate: "",
          oemPrice: 0,
        },
      ]);
      return;
    }

    try {
      setLoadingBasePODetails(true);
      setSelectedBasePOId(basePOId);
      const res = await api.get(`/api/purchase-orders/${basePOId}`);
      const basePO = res.data.data;
      setSelectedBasePO(basePO);

      // Ensure we use the correct ID format from the fetched PO
      const poId = basePO._id || basePO.id || basePOId;
      setSelectedBasePOId(String(poId));

      // Pre-populate form with base PO data
      setForm({
        poNumber: "", // Sales PO number should be different
        poDate: basePO.poDate
          ? new Date(basePO.poDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        paymentTerms: basePO.paymentTerms || "",
        deliveryTerms: basePO.deliveryTerms || "",
        notes: basePO.notes || "",
        status: "draft",
        amcPeriod: "",
        rewardId: "",
      });

      // Pre-populate items
      if (basePO.items && basePO.items.length > 0) {
        setItems(
          basePO.items.map((item: any) => ({
            productId: item.productId || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            licenseType: item.licenseType || "perpetual",
            licenseExpiryDate: item.licenseExpiryDate
              ? new Date(item.licenseExpiryDate).toISOString().split("T")[0]
              : "",
            oemPrice: item.oemPrice ?? 0,
          }))
        );
      } else {
        setItems([
          {
            productId: "",
            description: "",
            quantity: 1,
            licenseType: "perpetual",
            licenseExpiryDate: "",
            oemPrice: 0,
          },
        ]);
      }

      toast.success("Base PO data loaded. You can now edit and create Sales PO.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || "Failed to load base PO details"
      );
      setSelectedBasePOId("none");
    } finally {
      setLoadingBasePODetails(false);
    }
  };

  // Auto-load base PO if basePoId is in query params
  useEffect(() => {
    const loadBasePOFromQuery = async () => {
      if (basePoIdFromQuery && !selectedBasePO && !loadingBasePODetails) {
        await handleBasePOChange(basePoIdFromQuery);
      }
    };
    if (basePoIdFromQuery) {
      loadBasePOFromQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePoIdFromQuery]);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        description: "",
        quantity: 1,
        licenseType: "perpetual",
        licenseExpiryDate: "",
        oemPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.poNumber.trim()) {
      toast.error("PO Number is required");
      return;
    }

    if (items.some((item) => !item.productId || !item.description)) {
      toast.error("Please fill all item fields");
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        ...form,
        items: items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          oemPrice: Number(item.oemPrice),
        })),
      };

      // If creating from base PO, include parentPoId and related IDs
      if (selectedBasePOId && selectedBasePOId !== "none" && selectedBasePO) {
        // Extract IDs - handle both string IDs and populated objects
        const extractId = (value: any): string | null => {
          if (!value) return null;
          if (typeof value === 'string') return value;
          if (value._id) return String(value._id);
          if (value.id) return String(value.id);
          return null;
        };

        // Use the base PO's actual ID (from _id or id field)
        const basePOId = selectedBasePO._id || selectedBasePO.id || selectedBasePOId;
        payload.parentPoId = String(basePOId);
        payload.leadId = extractId(selectedBasePO.leadId);
        payload.quotationId = extractId(selectedBasePO.quotationId);
        payload.accountId = extractId(selectedBasePO.accountId);
        payload.customerDetails = selectedBasePO.customerDetails;
      }

      await api.post("/api/sales-purchase-orders", payload);
      toast.success("Sales PO created successfully");
      router.push("/sales-purchase-orders");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to create Sales PO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Sales Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Base PO Selection */}
            <div>
              <Label htmlFor="basePO">
                Create from Base Purchase Order (Optional)
              </Label>
              <Select
                value={selectedBasePOId}
                onValueChange={handleBasePOChange}
                disabled={loadingBasePOs || loadingBasePODetails}
              >
                <SelectTrigger id="basePO">
                  <SelectValue placeholder={
                    loadingBasePOs
                      ? "Loading base POs..."
                      : loadingBasePODetails
                      ? "Loading base PO data..."
                      : basePoIdFromQuery && selectedBasePO
                      ? `${selectedBasePO.poNumber} - ${selectedBasePO.customerDetails?.customerName || "N/A"}`
                      : "Select a base PO to copy data from"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Create New (No Base PO)</SelectItem>
                  {basePOs.map((po) => (
                    <SelectItem
                      key={po.id || po._id}
                      value={po.id || po._id}
                    >
                      {po.poNumber} - {po.customerDetails?.customerName || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingBasePODetails && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading base PO data...
                </div>
              )}
              {selectedBasePOId && selectedBasePOId !== "none" && selectedBasePO && !loadingBasePODetails && (
                <p className="text-sm text-muted-foreground mt-2">
                  Base PO <strong>{selectedBasePO.poNumber}</strong> data loaded. You can edit the fields below before creating the Sales PO.
                </p>
              )}
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="poNumber">
                  PO Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="poNumber"
                  value={form.poNumber}
                  onChange={(e) =>
                    setForm({ ...form, poNumber: e.target.value })
                  }
                  placeholder="Enter PO Number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="poDate">PO Date</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={form.poDate}
                  onChange={(e) =>
                    setForm({ ...form, poDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-semibold">Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <Label>Product ID</Label>
                          <Input
                            value={item.productId}
                            onChange={(e) =>
                              updateItem(index, "productId", e.target.value)
                            }
                            placeholder="Product ID"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            placeholder="Description"
                            required
                          />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>OEM Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.oemPrice}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "oemPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>License Type</Label>
                          <Select
                            value={item.licenseType}
                            onValueChange={(value) =>
                              updateItem(index, "licenseType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="perpetual">Perpetual</SelectItem>
                              <SelectItem value="saas">SaaS</SelectItem>
                              <SelectItem value="sro">SRO</SelectItem>
                              <SelectItem value="mro">MRO</SelectItem>
                              <SelectItem value="xaas">XaaS</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>License Expiry Date</Label>
                          <Input
                            type="date"
                            value={item.licenseExpiryDate}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "licenseExpiryDate",
                                e.target.value
                              )
                            }
                            disabled={item.licenseType === "perpetual"}
                          />
                        </div>
                        {items.length > 1 && (
                          <div className="md:col-span-6 flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Payment Terms</Label>
                <Textarea
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm({ ...form, paymentTerms: e.target.value })
                  }
                  placeholder="Payment terms..."
                />
              </div>
              <div>
                <Label>Delivery Terms</Label>
                <Textarea
                  value={form.deliveryTerms}
                  onChange={(e) =>
                    setForm({ ...form, deliveryTerms: e.target.value })
                  }
                  placeholder="Delivery terms..."
                />
              </div>
              <div>
                <Label>AMC Period</Label>
                <Input
                  value={form.amcPeriod}
                  onChange={(e) =>
                    setForm({ ...form, amcPeriod: e.target.value })
                  }
                  placeholder="e.g., 12 Months"
                />
              </div>
              <div>
                <Label>Reward ID</Label>
                <Input
                  value={form.rewardId}
                  onChange={(e) =>
                    setForm({ ...form, rewardId: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Sales PO"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

