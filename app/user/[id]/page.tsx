"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const modules = [
  { key: "manageHome", label: "Home", description: "Access to dashboard and home" },
  { key: "manageLeads", label: "Leads", description: "Manage customer leads", actionKey: "leadsActions" },
  { key: "manageQuotation", label: "Quotation", description: "Create and manage quotes", actionKey: "quotationActions" },
  { key: "managePurchaseOrder", label: "Purchase Order", description: "Handle purchase orders", actionKey: "purchaseOrderActions" },
  { key: "manageReport", label: "Report", description: "View and generate reports", actionKey: "reportActions" },
  { key: "managePlatformUsers", label: "User Management", description: "Manage platform users", actionKey: "platformUserActions" },
  { key: "manageProducts", label: "Products", description: "Manage Products", actionKey: "productsActions" },
  { key: "manageInquiry", label: "Enquiry", description: "Manage Enquiry", actionKey: "inquiryActions" }
];

const CRUDActionsTemplate = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const crudIcons = {
  create: "",
  read: "",
  update: "",
  delete: ""
};

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);

  const { register, handleSubmit, control, setValue, watch } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      permissions: {}
    }
  });

  const watchedPermissions = watch("permissions") as Record<string, any> | undefined;

  const fetchUser = async () => {
    try {
      const res = await api.get(`/api/admin/users/${id}`);
      const user = res.data.user || res.data;

      setUserData(user);
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("phone", user.phone);

      if (user.permissions) {
        Object.keys(user.permissions).forEach((key) =>
          setValue(`permissions.${key}` as any, user.permissions[key as any])
        );
      }
    } catch (error) {
      console.log(error);
      toast.error((error as any).response?.data?.message || "Failed to load user details");
      router.push("/user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);

      await api.put(`/api/admin/users/${id}/permissions`, {
        permissions: data.permissions
      });

      toast.success("User updated successfully!");
      router.push("/user");
    } catch (error) {
      console.error(error);
      toast.error((error as any).response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleAllActions = (moduleKey: string, actionKey: string, checked: boolean) => {
    Object.keys(CRUDActionsTemplate).forEach((action) => {
      setValue(`permissions.${actionKey}.${action}` as any, checked);
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-8xl mx-auto p-6">
      <form>
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                Edit User
              </CardTitle>
              {/* {userData?.isActive !== undefined && (
                <Badge className={userData.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                  {userData.isActive ? "Active" : "Inactive"}
                </Badge>
              )} */}
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Full Name
                </Label>
                <Input
                  {...register("name")}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Email Address
                </Label>
                <Input
                  {...register("email")}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Phone Number
                </Label>
                <Input
                  {...register("phone")}
                  className="bg-muted/50"
                />
              </div>
            </div> 

            {/* Access Permissions */}
            <div>
              <div className="flex items-center gap-2 pb-2">
                <span className="font-semibold text-lg">Access Permissions</span>
              </div>
             
              <div className="space-y-4">
                {modules.map((mod, i) => {
                  const isModuleEnabled = watchedPermissions?.[mod.key];
                  const moduleActions = mod.actionKey ? watchedPermissions?.[mod.actionKey] : null;
                  const allActionsEnabled =
                    moduleActions && Object.values(moduleActions).every((v) => v === true);

                  return (
                    <div key={mod.key}>
                      <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Controller
                              name={`permissions.${mod.key}` as any}
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1"
                                />
                              )}
                            />
                            <div className="flex-1">
                              <Label className="text-base font-semibold cursor-pointer">
                                {mod.label}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {mod.description}
                              </p>
                            </div>
                          </div>

                          {isModuleEnabled && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Enabled
                            </Badge>
                          )}
                        </div>

                        {/* CRUD Actions */}
                        {mod.actionKey && isModuleEnabled && (
                          <div className="ml-7 mt-4 rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-medium text-muted-foreground">
                                Operation Permissions
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleAllActions(
                                    mod.key,
                                    mod.actionKey,
                                    !allActionsEnabled
                                  )
                                }
                                className="h-7 text-xs"
                              >
                                {allActionsEnabled ? "Deselect All" : "Select All"}
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {Object.keys(CRUDActionsTemplate).map((action) => (
                                <Controller
                                  key={action}
                                  name={`permissions.${mod.actionKey}.${action}` as any}
                                  control={control}
                                  render={({ field }) => (
                                    <div className="flex items-center gap-2 rounded-md border bg-background p-3 hover:bg-accent transition-colors">
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                      <Label className="text-sm font-medium capitalize cursor-pointer flex items-center gap-1">
                                        <span>{crudIcons[action as keyof typeof crudIcons]}</span>
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

                      {i < modules.length - 1 && <Separator className="my-4" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 sticky bottom-6 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg z-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="gap-2 min-w-[120px]"
                onClick={handleSubmit(onSubmit)}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}