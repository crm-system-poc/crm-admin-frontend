"use client";

import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateInquiryPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
    city: "",
    message: "",
    status: "new",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await api.post("/api/inquiries", formData);
      
      toast({
        title: "Success!",
        description: "Inquiry created successfully.",
      });
      
      router.push("/inquiries");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create inquiry. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create inquiry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedPage module="manageInquiry" action="create">
      <div className="space-y-6 p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link href="/inquiries">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create Inquiry</h2>
            <p className="text-muted-foreground">
              Add a new customer inquiry to the system
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Inquiry Details</CardTitle>
                <CardDescription>
                  Fill in the information below to create a new inquiry
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 3x2 Grid Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => handleChange("customerName", e.target.value)}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>

                {/* Status */}
                {/* <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                    required
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
              </div>

              {/* Message - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Enter inquiry message (max 100 characters)..."
                  rows={6}
                  maxLength={100}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length} / 100 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Link href="/inquiries">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Inquiry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </ProtectedPage>
  );
}