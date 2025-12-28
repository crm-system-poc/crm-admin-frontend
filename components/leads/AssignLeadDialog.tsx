"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/components/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserCircle2, Check, Plus } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

type User = { id: string; name?: string; role?: string };

type AssignedUser = {
  user: string;
  permissions: { read: boolean; update: boolean; delete: boolean };
};

interface AssignLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  currentAssigneeName?: string;
  onAssigned?: () => void;
}

export function AssignLeadDialog({
  open,
  onOpenChange,
  leadId,
  currentAssigneeName,
  onAssigned,
}: AssignLeadDialogProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.systemrole === "SuperAdmin";

  const [users, setUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !isSuperAdmin) return;

    const loadData = async () => {
      try {
        setLoading(true);

        const leadRes = await api.get(`/api/leads/${leadId}`);
        const assigned = leadRes.data?.data?.assignedUsers || [];
        setAssignedUsers(
          assigned.map((a: any) => ({
            user: a.user.id,
            permissions: a.permissions,
          }))
        );

        const userRes = await api.get("/api/admin/users?isActive=true");
        // Normalize response to array of users
        const fetchedUsers = userRes.data?.users ?? userRes.data ?? [];
        setUsers(fetchedUsers);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, isSuperAdmin, leadId]);

  const toggleUser = (id: string) => {
    const exists = assignedUsers.some((u) => u.user === id);

    if (exists) {
      // Remove user assignment
      setAssignedUsers((prev) => prev.filter((u) => u.user !== id));
    } else {
      // Add with default READ=true
      setAssignedUsers((prev) => [
        ...prev,
        {
          user: id,
          permissions: {
            read: true,
            update: false,
            delete: false,
          },
        },
      ]);
    }
  };

  const togglePermission = (id: string, key: keyof AssignedUser['permissions']) => {
    setAssignedUsers((prev) =>
      prev.map((u) =>
        u.user === id
          ? {
              ...u,
              permissions: { ...u.permissions, [key]: !u.permissions[key] },
            }
          : u
      )
    );
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      await api.put(`/api/leads/${leadId}/reassign`, {
        assignedUsers,
      });

      toast.success("Lead assignment updated");
      onAssigned?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Lead</DialogTitle>
          <DialogDescription>Choose users and permissions</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <Label>Team Members</Label>

            {/* User Selection Popover */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {assignedUsers.length > 0
                    ? `${assignedUsers.length} users selected`
                    : "Select users"}
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-72 p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No user found.</CommandEmpty>

                  <CommandGroup>
                    {users.map((u) => {
                      const selected = assignedUsers.some((a) => a.user === u.id);
                      return (
                        <CommandItem
                          key={u.id}
                          onSelect={() => toggleUser(u.id)}
                          className="flex items-center gap-2"
                        >
                          <Checkbox checked={selected} />
                          <UserCircle2 className="h-4 w-4" />
                          <span>{u.name}</span>
                          {selected && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Permissions UI */}
            {assignedUsers.map((au) => {
              const userInfo = users.find((x) => x.id === au.user);

              return (
                <div
                  key={au.user}
                  className="p-2 border rounded-md space-y-2"
                >
                  <div className="font-semibold text-sm">
                    {userInfo?.name} — {userInfo?.role}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-1">
                      <Checkbox
                        checked={!!au.permissions.read}
                        onCheckedChange={() =>
                          togglePermission(au.user, "read")
                        }
                      />
                      Read
                    </label>
                    <label className="flex items-center gap-1">
                      <Checkbox
                        checked={!!au.permissions.update}
                        onCheckedChange={() =>
                          togglePermission(au.user, "update")
                        }
                      />
                      Update
                    </label>
                    <label className="flex items-center gap-1">
                      <Checkbox
                        checked={!!au.permissions.delete}
                        onCheckedChange={() =>
                          togglePermission(au.user, "delete")
                        }
                      />
                      Delete
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={submitting} onClick={handleSave}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
