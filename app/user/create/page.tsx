"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { User, Mail, Phone, Lock, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const modules = [
  { key: "manageHome", label: "Home" },
  { key: "manageLeads", label: "Leads", actionKey: "leadsActions" },
  { key: "manageQuotation", label: "Quotation", actionKey: "quotationActions" },
  { key: "managePurchaseOrder", label: "Purchase Order", actionKey: "purchaseOrderActions" },
  { key: "manageReport", label: "Report", actionKey: "reportActions" },
  { key: "managePlatformUsers", label: "Platform User", actionKey: "platformUserActions" },
  { key: "manageProducts", label: "Products", actionKey: "productsActions" },
  { key: "manageInquiry", label: "Enquiry", actionKey: "inquiryActions" },
];

// These are the CRM project roles allowed for platform users (from model)
const userRoles = [
  { value: "Sale Executive", label: "Sale Executive" },
  { value: "Telecaller", label: "Telecaller" },
  { value: "Support Executive", label: "Support Executive" },
  { value: "Manager", label: "Manager" },
  { value: "Other", label: "Other" },
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

  const { register, handleSubmit, control, watch, setValue } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "Sale Executive",
      permissions: {
        manageHome: false,
        manageLeads: false,
        manageQuotation: false,
        managePurchaseOrder: false,
        managePlatformUsers: false,
        manageReport: false,
        manageProducts: false,
        leadsActions: { ...CRUDActionsTemplate },
        quotationActions: { ...CRUDActionsTemplate },
        purchaseOrderActions: { ...CRUDActionsTemplate },
        reportActions: { ...CRUDActionsTemplate },
        platformUserActions: { ...CRUDActionsTemplate },
        productsActions: { ...CRUDActionsTemplate },
        inquiryActions: { ...CRUDActionsTemplate },
      },
    },
  });

  const watchedPermissions = watch("permissions");

  // Helper: when module is checked, set read=true in actions and disable unchecking
  const handleModuleToggle = (mod: typeof modules[number], value: boolean) => {
    setValue(`permissions.${mod.key}`, value);
    if (mod.actionKey) {
      // Always enable read when module is toggled on
      setValue(`permissions.${mod.actionKey}.read`, value, { shouldDirty: true, shouldTouch: true });
    }
  };

  // Fix unchecking read if module is checked
  const handleReadActionChange = (
    mod: typeof modules[number],
    checked: boolean
  ) => {
    if (mod.actionKey && watchedPermissions[mod.key]) {
      // ignore manual unchecking if module checked
      return;
    }
    setValue(`permissions.${mod.actionKey}.read`, checked, { shouldDirty: true, shouldTouch: true });
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // POST to backend, as per userController expects: name, email, phone, password, permissions, role
      await api.post("/api/admin/create-user", data);

      toast.success("User created successfully!");
      router.push("/user");
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-8xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Create New User</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* ================= User Details ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="Enter Name"
                    {...register("name")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="abc@example.com"
                    {...register("email")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    placeholder="123456890"
                    {...register("phone")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(val)}
                      value={field.value}
                      disabled={loading}
                    >
                      <SelectTrigger id="role" className="w-48">
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <Separator className="my-8" />

            {/* ================= Permissions Section ================= */}
            <div>
              <div className="mb-6">
                <span className="text-lg font-semibold flex items-center gap-2">
                  {/* <Shield className="h-5 w-5" /> */}
                  Access Permissions
                </span>
                {/* <CardDescription>
                  Configure module access and specific actions for this user
                </CardDescription> */}
              </div>
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
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (mod.actionKey) {
                                  setValue(`permissions.${mod.actionKey}.read`, !!checked, { shouldDirty: true, shouldTouch: true });
                                }
                              }}
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
                                render={({ field }) => {
                                  if (action === "read") {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={`${mod.actionKey}-${action}`}
                                          checked={true}
                                          disabled={watchedPermissions[mod.key]}
                                          onCheckedChange={() => {
                                            handleReadActionChange(mod, !watchedPermissions[mod.actionKey]?.read);
                                          }}
                                        />
                                        <Label
                                          htmlFor={`${mod.actionKey}-${action}`}
                                          className="text-sm font-normal cursor-pointer capitalize"
                                        >
                                          {action}
                                        </Label>
                                      </div>
                                    );
                                  } else {
                                    return (
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
                                    );
                                  }
                                }}
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
            </div>

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
        </CardContent>
      </Card>
    </div>
  );
}