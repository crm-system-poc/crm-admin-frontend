"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import stateList from "@/state.json";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phoneNumber: "",
    alternateNumber: "",
    contactPerson: "",
    // For address fields as per backend (street, city, state, zipCode, country)
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleStateChange = (value: string) => {
    setForm({
      ...form,
      state: value,
    });
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payload = {
        customerName: form.customerName,
        contactPerson: form.contactPerson,
        email: form.email,
        phoneNumber: form.phoneNumber,
        alternateNumber: form.alternateNumber,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
      };
      await api.post("/api/accounts", payload);
      toast.success("Account created successfully");
      router.push("/accounts");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to create account");
      } else {
        toast.error("Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1 */}
              <div>
                <Label htmlFor="customerName" className="block mb-2 font-medium">
                  Customer Name
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <Label htmlFor="contactPerson" className="block mb-2 font-medium">
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  value={form.contactPerson}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Contact Person"
                />
              </div>
              <div>
                <Label htmlFor="email" className="block mb-2 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Email"
                />
              </div>
              {/* Row 2 */}
              <div>
                <Label htmlFor="phoneNumber" className="block mb-2 font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <Label htmlFor="alternateNumber" className="block mb-2 font-medium">
                  Alternate Number
                </Label>
                <Input
                  id="alternateNumber"
                  name="alternateNumber"
                  type="text"
                  value={form.alternateNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Alternate Number (optional)"
                />
              </div>
              <div>
                <Label htmlFor="street" className="block mb-2 font-medium">
                  Street Address
                </Label>
                <Input
                  id="street"
                  name="street"
                  type="text"
                  value={form.street}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Street Address"
                />
              </div>
              {/* Row 3 */}
              <div>
                <Label htmlFor="city" className="block mb-2 font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="City"
                />
              </div>
              <div className="w-full">
                <Label htmlFor="state" className="block mb-2 font-medium">
                  State
                </Label>
                <Select
                  value={form.state}
                  onValueChange={handleStateChange}
                  disabled={loading}
                  name="state"
                >
                  <SelectTrigger id="state" name="state" className="w-full">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateList.map((item) => (
                      <SelectItem key={item.code} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zipCode" className="block mb-2 font-medium">
                  Zip Code
                </Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={form.zipCode}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Postal Code"
                />
              </div>
              <div>
                <Label htmlFor="country" className="block mb-2 font-medium">
                  Country
                </Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  value={form.country}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Country"
                />
              </div>
            </div>
            <div>
              <Button
                type="submit"
                className=" px-4 py-2 rounded disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
