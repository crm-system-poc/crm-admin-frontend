"use client";

import { useRouter, useParams } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Edit, Loader2, Calendar, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditInquiryPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
    city: "",
    message: "",
    status: "new",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/inquiries/${id}`);
        const inquiryData = res.data.data;
        setData(inquiryData);
        setFormData({
          customerName: inquiryData.customerName || "",
          phoneNumber: inquiryData.phoneNumber || "",
          email: inquiryData.email || "",
          city: inquiryData.city || "",
          message: inquiryData.message || "",
          status: inquiryData.status || "new",
        });
      } catch (error) {
        toast.error("Failed to load inquiry data.");
        console.error("Failed to load inquiry:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await api.put(`/api/inquiries/${id}`, formData);
      
      toast.success("Inquiry updated successfully.");
      
      router.push("/inquiries");
    } catch (error) {
      toast.error("Failed to update inquiry. Please try again.");
      console.error("Failed to update inquiry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedPage module="manageInquiry">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading inquiry data...</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  if (!data) {
    return (
      <ProtectedPage module="manageInquiry">
        <div className="flex items-center justify-center min-h-[400px] ">
          <div className="text-center">
            <p className="text-muted-foreground">Inquiry not found.</p>
            <Link href="/inquiries">
              <Button variant="outline" className="mt-4">
                Back to Inquiries
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage module="manageInquiry">
      <div className="space-y-4 p-4">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          {/* <Link href="/inquiries">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link> */}
          
          {/* <Badge variant={data.isConvertedToLead ? "default" : "secondary"}>
            {data.isConvertedToLead ? "Converted to Lead" : "Inquiry"}
          </Badge> */}
        </div>

        {/* Info Cards */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="text-sm font-medium">
                    {data.createdBy?.name || "System"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created On</p>
                  <p className="text-sm font-medium">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div> */}
              <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Edit Inquiry</h2>
        
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
                <div className="space-y-2">
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
                      {/* <SelectItem value="qualified">Qualified</SelectItem> */}
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <div className="flex  gap-3 pt-4">
                <Link href="/inquiries">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {/* <Save className="h-4 w-4" /> */}
                  {isSubmitting ? "Updating..." : "Update Inquiry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}