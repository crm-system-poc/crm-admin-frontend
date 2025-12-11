"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AssignedUser = {
  user: string;
  permissions: {
    read: boolean;
    update: boolean;
    delete: boolean;
  };
};

type Props = {
  inquiryId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AssignInquiryUsersModal({
  inquiryId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ Load inquiry (to get assignedUsers)
      const inquiryRes = await api.get(`/api/inquiries/${inquiryId}`);
      const assigned = inquiryRes.data?.data?.assignedUsers || [];

      setAssignedUsers(
        assigned.map((a: any) => ({
          user: a.user.id,
          permissions: a.permissions,
        }))
      );

      // ✅ Load all active users
      const userRes = await api.get("/api/admin/users?isActive=true");
      setUsers(userRes.data?.users ?? userRes.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const getAssigned = (userId: string) =>
    assignedUsers.find((u) => u.user === userId);

  const togglePermission = (userId: string, perm: "read" | "update" | "delete") => {
    setAssignedUsers((prev) => {
      const existing = prev.find((u) => u.user === userId);

      // ✅ If user not assigned → add with default read=true
      if (!existing) {
        return [
          ...prev,
          {
            user: userId,
            permissions: {
              read: perm === "read",
              update: perm === "update",
              delete: perm === "delete",
            },
          },
        ];
      }

      // ✅ Toggle permission
      const updated = prev.map((u) =>
        u.user === userId
          ? {
              ...u,
              permissions: {
                ...u.permissions,
                [perm]: !u.permissions[perm],
              },
            }
          : u
      );

      // ✅ Remove user if all permissions false
      return updated.filter(
        (u) =>
          u.user !== userId ||
          u.permissions.read ||
          u.permissions.update ||
          u.permissions.delete
      );
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/api/inquiries/${inquiryId}/reassign`, {
        assignedUsers,
      });

      toast.success("Inquiry assignment updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to assign users");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Users to Inquiry</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {users.map((user) => {
              const assigned = getAssigned(user.id);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between border p-3 rounded-md"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    {(["read", "update", "delete"] as const).map((perm) => (
                      <label
                        key={perm}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Checkbox
                          checked={!!assigned?.permissions?.[perm]}
                          onCheckedChange={() =>
                            togglePermission(user.id, perm)
                          }
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
