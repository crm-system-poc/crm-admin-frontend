"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";
import { User, Mail, Phone, Lock, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

const modules = [
  { key: "manageHome", label: "Home" },
  { key: "manageLeads", label: "Leads", actionKey: "leadsActions" },
  { key: "manageQuotation", label: "Quotation", actionKey: "quotationActions" },
  { key: "managePurchaseOrder", label: "Purchase Order", actionKey: "purchaseOrderActions" },
  { key: "manageReport", label: "Report", actionKey: "reportActions" }
];

const CRUDActionsTemplate = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      permissions: {
        manageHome: false,
        manageLeads: false,
        manageQuotation: false,
        managePurchaseOrder: false,
        manageReport: false,
        leadsActions: { ...CRUDActionsTemplate },
        quotationActions: { ...CRUDActionsTemplate },
        purchaseOrderActions: { ...CRUDActionsTemplate },
        reportActions: { ...CRUDActionsTemplate },
      },
    },
  });

  const watchedPermissions = watch("permissions");

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const res = await api.post(
        "/api/admin/create-user",
        data,
      );

      toast.success("User created successfully!");
      router.push("/admin/users");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground mt-2">
          Add a new user and configure their access permissions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ================= User Details Card ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Enter the basic details for the new user account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name"
                    placeholder="John Doe" 
                    className="pl-10"
                    {...register("name")} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="john@example.com" 
                    className="pl-10"
                    {...register("email")} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="mobile"
                    placeholder="+1 (555) 000-0000" 
                    className="pl-10"
                    {...register("mobile")} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    {...register("password")} 
                    required 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================= Permissions Card ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Permissions
            </CardTitle>
            <CardDescription>
              Configure module access and specific actions for this user
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {modules.map((mod, index) => (
                <div key={mod.key}>
                  <div className="space-y-4">
                    {/* Module Toggle */}
                    <div className="flex items-center gap-3">
                      <Controller
                        name={`permissions.${mod.key}`}
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={mod.key}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label 
                        htmlFor={mod.key}
                        className="text-base font-medium cursor-pointer"
                      >
                        {mod.label}
                      </Label>
                    </div>

                    {/* CRUD Actions */}
                    {mod.actionKey && watchedPermissions[mod.key] && (
                      <div className="ml-7 p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-medium mb-3 text-muted-foreground">
                          Allowed Actions
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.keys(CRUDActionsTemplate).map((action) => (
                            <Controller
                              key={action}
                              name={`permissions.${mod.actionKey}.${action}`}
                              control={control}
                              render={({ field }) => (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`${mod.actionKey}-${action}`}
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label 
                                    htmlFor={`${mod.actionKey}-${action}`}
                                    className="text-sm font-normal cursor-pointer capitalize"
                                  >
                                    {action}
                                  </Label>
                                </div>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {index < modules.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ================= Action Buttons ================= */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/admin/users")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
}