"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// These enums match the backend model strictly:
const STATUS = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost"
] as const;

const PRIORITY = ["low", "medium", "high"] as const;

const SOURCE = [
  "website",
  "referral",
  "social_media",
  "cold_call",
  "email",
  "other"
] as const;

// Frontend form state should match the backend fields (with reasonable defaults)
export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<any | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    altEmail: "",
    altPhoneNumber: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
    addressCountry: "India",
    location: "",
    requirementDetails: "",
    status: "new",
    source: "other",
    notes: "",
    priority: "medium",
    estimatedValue: "",
    followUpDate: "",
    customerId: "",
    createdBy: "",
  });

  // Load by id
  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    api
      .get(`/api/leads/${leadId}`)
      .then((resp) => {
        setLead(resp.data.data);
        const d = resp.data.data || {};
        setForm({
          customerName: d.customerName || "",
          contactPerson: d.contactPerson || "",
          email: d.email || "",
          phoneNumber: d.phoneNumber || "",
          altEmail: d.altEmail || "",
          altPhoneNumber: d.altPhoneNumber || "",
          addressStreet: d.address?.street || "",
          addressCity: d.address?.city || "",
          addressState: d.address?.state || "",
          addressZipCode: d.address?.zipCode || "",
          addressCountry: d.address?.country || "India",
          location: d.location || "",
          requirementDetails: d.requirementDetails || "",
          status: d.status || "new",
          source: d.source || "other",
          notes: d.notes || "",
          priority: d.priority || "medium",
          estimatedValue: typeof d.estimatedValue === "number" ? String(d.estimatedValue) : d.estimatedValue || "",
          followUpDate: d.followUpDate ? d.followUpDate.slice(0, 10) : "",
          customerId: d.customerId || "",
          createdBy: d.createdBy || "",
        });
      })
      .catch((e) => {
        toast.error("Failed to load lead");
        setLead(null);
      })
      .finally(() => setLoading(false));
  }, [leadId]);

  // Helpers for validation (very basic; backend is source of truth)
  const validateEmail = (val?: string) => (!val ? true : /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(val));
  const validatePhone = (val?: string) => (!val ? true : /^\+?[\d\s\-()]+$/.test(val));

  // Update (only send fields that are in schema)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic frontend validation to match backend schema
    if (!form.customerName || form.customerName.length > 100) {
      toast.error("Customer Name is required and must be under 100 characters");
      return;
    }
    if (!form.contactPerson || form.contactPerson.length > 100) {
      toast.error("Contact Person is required and must be under 100 characters");
      return;
    }
    if (!form.email || !validateEmail(form.email)) {
      toast.error("Valid Email is required");
      return;
    }
    if (!form.phoneNumber || !validatePhone(form.phoneNumber)) {
      toast.error("Valid Phone Number is required");
      return;
    }
    if (form.altEmail && !validateEmail(form.altEmail)) {
      toast.error("Alt Email, if provided, must be valid");
      return;
    }
    if (form.altPhoneNumber && !validatePhone(form.altPhoneNumber)) {
      toast.error("Alt Phone Number, if provided, must be valid");
      return;
    }
    if (form.addressStreet.length > 200) {
      toast.error("Street address cannot exceed 200 characters");
      return;
    }
    if (form.addressCity.length > 50) {
      toast.error("City cannot exceed 50 characters");
      return;
    }
    if (form.addressState.length > 50) {
      toast.error("State cannot exceed 50 characters");
      return;
    }
    if (form.addressZipCode.length > 20) {
      toast.error("Zip code cannot exceed 20 characters");
      return;
    }
    if (form.addressCountry.length > 50) {
      toast.error("Country cannot exceed 50 characters");
      return;
    }
    if (form.location.length > 100) {
      toast.error("Location cannot exceed 100 characters");
      return;
    }
    if (form.requirementDetails.length > 1000) {
      toast.error("Requirement details cannot exceed 1000 characters");
      return;
    }
    if (form.notes.length > 1000) {
      toast.error("Notes cannot exceed 1000 characters");
      return;
    }
    if (form.estimatedValue && isNaN(Number(form.estimatedValue))) {
      toast.error("Estimated value must be a number");
      return;
    }
    if (form.estimatedValue && Number(form.estimatedValue) < 0) {
      toast.error("Estimated value must be non-negative");
      return;
    }

    if (!leadId) return;
    setSaving(true);
    toast.loading("Saving changes...");

    try {
      await api.put(`/api/leads/${leadId}`, {
        customerName: form.customerName,
        contactPerson: form.contactPerson,
        email: form.email,
        phoneNumber: form.phoneNumber,
        altEmail: form.altEmail || undefined,
        altPhoneNumber: form.altPhoneNumber || undefined,
        address: {
          street: form.addressStreet,
          city: form.addressCity,
          state: form.addressState,
          zipCode: form.addressZipCode,
          country: form.addressCountry || "India",
        },
        location: form.location || undefined,
        requirementDetails: form.requirementDetails,
        status: form.status,
        source: form.source,
        notes: form.notes || undefined,
        priority: form.priority,
        estimatedValue:
          form.estimatedValue !== "" ? Number(form.estimatedValue) : undefined,
        followUpDate: form.followUpDate || undefined,
        customerId: form.customerId || undefined,
        createdBy: form.createdBy || undefined,
      });
      toast.dismiss();
      toast.success("Lead updated");
      router.refresh?.();
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to update lead");
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading lead...</span>
      </div>
    );

  if (!lead)
    return (
      <div className="max-w-lg mx-auto mt-16">
        <h2 className="text-xl font-bold">Lead not found</h2>
        <Button variant="link" onClick={() => router.push("/leads")}>
          Back to leads list
        </Button>
      </div>
    );

  return (
    <div className="py-10 px-6 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <h1 className="text-2xl font-semibold flex-1">Lead Details</h1>
        <Badge className="capitalize" variant="secondary">
          {lead.status}
        </Badge>
        <Badge className="capitalize" variant="outline">
          {lead.priority}
        </Badge>
      </div>
      <Separator />
      {/* 3x3 grid layout */}
      <form className="space-y-6" onSubmit={handleUpdate}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Name *
            </label>
            <Input
              required
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              placeholder="Customer Name"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Person *
            </label>
            <Input
              required
              value={form.contactPerson}
              onChange={(e) =>
                setForm((f) => ({ ...f, contactPerson: e.target.value }))
              }
              placeholder="Contact Person"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number *
            </label>
            <Input
              required
              value={form.phoneNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, phoneNumber: e.target.value }))
              }
              placeholder="Phone Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Alt Email
            </label>
            <Input
              type="email"
              value={form.altEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, altEmail: e.target.value }))
              }
              placeholder="Alternative Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Alt Phone Number
            </label>
            <Input
              value={form.altPhoneNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, altPhoneNumber: e.target.value }))
              }
              placeholder="Alternative Phone Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address Street
            </label>
            <Input
              value={form.addressStreet}
              maxLength={200}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressStreet: e.target.value }))
              }
              placeholder="Street"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address City
            </label>
            <Input
              value={form.addressCity}
              maxLength={50}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressCity: e.target.value }))
              }
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address State
            </label>
            <Input
              value={form.addressState}
              maxLength={50}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressState: e.target.value }))
              }
              placeholder="State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address Zip Code
            </label>
            <Input
              value={form.addressZipCode}
              maxLength={20}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressZipCode: e.target.value }))
              }
              placeholder="Zip Code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Country
            </label>
            <Input
              value={form.addressCountry}
              maxLength={50}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressCountry: e.target.value }))
              }
              placeholder="Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Location
            </label>
            <Input
              value={form.location}
              maxLength={100}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Requirement Details
            </label>
            <Input
              value={form.requirementDetails}
              maxLength={1000}
              onChange={(e) =>
                setForm((f) => ({ ...f, requirementDetails: e.target.value }))
              }
              placeholder="Requirement Details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <Select
              value={form.source}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, source: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Notes
            </label>
            <Input
              value={form.notes}
              maxLength={1000}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Notes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Priority
            </label>
            <Select
              value={form.priority}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Estimated Value
            </label>
            <Input
              type="number"
              value={form.estimatedValue}
              min={0}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimatedValue: e.target.value }))
              }
              placeholder="Value (e.g., 100000)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Follow-up Date
            </label>
            <Input
              type="date"
              value={form.followUpDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, followUpDate: e.target.value }))
              }
              placeholder="Follow Up Date"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/leads")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
