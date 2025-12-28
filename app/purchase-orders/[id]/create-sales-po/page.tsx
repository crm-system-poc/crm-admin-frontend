"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function CreateSalesPOPage() {
  const router = useRouter();
  const { id } = useParams(); // base PO ID

  const [loading, setLoading] = useState(false);
  const [basePO, setBasePO] = useState<any>(null);

  const [form, setForm] = useState({
    poNumber: "",
    poDate: "",
    paymentTerms: "",
    amcPeriod: "",
    rewardId: "",
  });

  /* ---------------- FETCH BASE PO ---------------- */
  useEffect(() => {
    const fetchBasePO = async () => {
      const res = await api.get(`/api/purchase-orders/${id}`);
      setBasePO(res.data.data);
    };
    fetchBasePO();
  }, [id]);

  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    try {
      setLoading(true);

      await api.post(
        `/api/purchase-orders/${id}/create-sales-po`,
        {
          poNumber: form.poNumber,
          poDate: form.poDate,
          paymentTerms: form.paymentTerms,
          amcPeriod: form.amcPeriod,
          rewardId: form.rewardId,
        },
        { withCredentials: true }
      );

      toast.success("Sales PO created successfully");
      router.push(`/sales-purchase-orders`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create Sales PO");
    } finally {
      setLoading(false);
    }
  };

  if (!basePO) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Sales PO</CardTitle>
          <p className="text-sm text-muted-foreground">
            Base PO: <b>{basePO.poNumber}</b> | Customer:{" "}
            {basePO.customerDetails.customerName}
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div>
            <Label>Sales PO Number</Label>
            <Input
              value={form.poNumber}
              onChange={(e) =>
                setForm({ ...form, poNumber: e.target.value })
              }
              placeholder="Enter Sales PO Number"
            />
          </div>

          <div>
            <Label>PO Date</Label>
            <Input
              type="date"
              value={form.poDate}
              onChange={(e) =>
                setForm({ ...form, poDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label>AMC Period</Label>
            <Input
              value={form.amcPeriod}
              onChange={(e) =>
                setForm({ ...form, amcPeriod: e.target.value })
              }
              placeholder="12 Months"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Payment Terms</Label>
            <Input
              value={form.paymentTerms}
              onChange={(e) =>
                setForm({ ...form, paymentTerms: e.target.value })
              }
              placeholder="Net 30 days"
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
        </CardContent>

        <div className="flex justify-end gap-2 p-6">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Creating..." : "Create Sales PO"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
