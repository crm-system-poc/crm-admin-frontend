"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function CollectPaymentDialog({
  ledger,
  onClose,
  onSuccess,
}: any) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPayment = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (Number(amount) > ledger.totalAmount) {
      toast.error("Amount exceeds due");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/payments/collect", {
        ledgerId: ledger._id,
        purchaseOrderId: ledger?.purchaseOrderId?.id,
        amountCollected: Number(amount),
        paymentMode: mode,
        note,
      });

      toast.success("Payment collected successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Collect Payment – {ledger?.purchaseOrderId?.poNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder={`Amount`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="banktransfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submitPayment} disabled={loading}>
            {loading ? "Saving..." : "Collect Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
