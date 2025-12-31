"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Plus, Trash2 } from "lucide-react";

// Updated Item type to include oemPrice and remove unitPrice
type Item = {
  productId: string;
  description: string;
  quantity: number;
  licenseType: string;
  licenseExpiryDate: string;
  oemPrice: number;
};

export default function EditSalesPOPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [items, setItems] = useState<Item[]>([]);

  const [form, setForm] = useState({
    poNumber: "",
    poDate: "",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    status: "draft",
    amcPeriod: "",
    rewardId: "",
  });

  useEffect(() => {
    const fetchSalesPO = async () => {
      try {
        setFetching(true);
        const res = await api.get(`/api/sales-purchase-orders/${id}`);
        const data = res.data.data;

        setForm({
          poNumber: data.poNumber || "",
          poDate: data.poDate
            ? new Date(data.poDate).toISOString().split("T")[0]
            : "",
          paymentTerms: data.paymentTerms || "",
          deliveryTerms: data.deliveryTerms || "",
          notes: data.notes || "",
          status: data.status || "draft",
          amcPeriod:
            data.amcPeriod !== null && data.amcPeriod !== undefined
              ? String(data.amcPeriod)
              : "",
          rewardId:
            data.rewardId !== null && data.rewardId !== undefined
              ? String(data.rewardId)
              : "",
        });

        if (data.items && data.items.length > 0) {
          setItems(
            data.items.map((item: any) => ({
              productId: item.productId || "",
              description: item.description || "",
              quantity: item.quantity || 1,
              licenseType: item.licenseType || "perpetual",
              licenseExpiryDate: item.licenseExpiryDate
                ? new Date(item.licenseExpiryDate).toISOString().split("T")[0]
                : "",
              oemPrice:
                typeof item.oemPrice !== "undefined"
                  ? item.oemPrice
                  : 0,
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
      } catch (error: any) {
        toast.error(
          error?.response?.data?.error || "Failed to load Sales PO"
        );
        router.push("/sales-purchase-orders");
      } finally {
        setFetching(false);
      }
    };

    fetchSalesPO();
  }, [id, router]);

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

  // Need to update type for "field" to allow oemPrice
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
      await api.put(`/api/sales-purchase-orders/${id}`, {
        ...form,
        items: items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          oemPrice: Number(item.oemPrice),
        })),
      });
      toast.success("Sales PO updated successfully");
      router.push("/sales-purchase-orders");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || "Failed to update Sales PO"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-8xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Sales Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                >
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
                              <SelectItem value="perpetual">
                                Perpetual
                              </SelectItem>
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
                <Label htmlFor="amcPeriod">AMC Period</Label>
                <Input
                  id="amcPeriod"
                  name="amcPeriod"
                  type="text"
                  value={form.amcPeriod || ""}
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
                {loading ? "Updating..." : "Update Sales PO"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
