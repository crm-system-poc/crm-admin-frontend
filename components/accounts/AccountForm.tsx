"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

export default function AccountForm({
  initialData,
  onSubmit,
  loading,
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState({
    customerName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    alternateEmail: "",
    alternateNumber: "",
    location: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        address: {
          street: initialData.address?.street || "",
          city: initialData.address?.city || "",
          state: initialData.address?.state || "",
          zipCode: initialData.address?.zipCode || "",
          country: initialData.address?.country || "",
        },
      });
    }
  }, [initialData]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: any) => {
    setForm({
      ...form,
      address: { ...form.address, [e.target.name]: e.target.value },
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent>
        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          {/* Row 1 */}
          <Input name="customerName" placeholder="Customer Name" value={form.customerName} onChange={handleChange} required />
          <Input name="contactPerson" placeholder="Contact Person" value={form.contactPerson} onChange={handleChange} required />
          <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />

          {/* Row 2 */}
          <Input name="phoneNumber" placeholder="Phone Number" value={form.phoneNumber} onChange={handleChange} required />
          <Input name="alternateNumber" placeholder="Alternate Number" value={form.alternateNumber} onChange={handleChange} />
          <Input name="alternateEmail" placeholder="Alternate Email" value={form.alternateEmail} onChange={handleChange} />

          {/* Row 3 */}
          <Input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
          <Input name="street" placeholder="Street Address" value={form.address.street} onChange={handleAddressChange} />
          <Input name="city" placeholder="City" value={form.address.city} onChange={handleAddressChange} />

          {/* Row 4 */}
          <Input name="state" placeholder="State" value={form.address.state} onChange={handleAddressChange} />
          <Input name="zipCode" placeholder="Zip Code" value={form.address.zipCode} onChange={handleAddressChange} />
          <Input name="country" placeholder="Country" value={form.address.country} onChange={handleAddressChange} />

          {/* Submit */}
          <div className="col-span-1 md:col-span-3 flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
