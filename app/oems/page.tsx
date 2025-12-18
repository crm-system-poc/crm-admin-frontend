"use client";

import { useEffect, useState } from "react";
import { getOEMs, deleteOEM } from "@/lib/oem";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import OEMDialog from "@/components/oem/OEMDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function OEMPage() {
  const [oems, setOEMs] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedOEM, setSelectedOEM] = useState<any>(null);

  // State for delete alert dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteOEM, setPendingDeleteOEM] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    const res = await getOEMs();
    setOEMs(res.data.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler for confirming delete
  const handleConfirmDelete = async () => {
    if (!pendingDeleteOEM) return;
    setDeleting(true);
    try {
      await deleteOEM(pendingDeleteOEM.id);
      toast.success("OEM deleted");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete OEM");
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setPendingDeleteOEM(null);
  };

  return (
    <Card className="max-w-6xl mx-auto p-6 mt-24">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>OEMs</CardTitle>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setSelectedOEM(null);
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Add OEM
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {oems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No OEM found.
                </TableCell>
              </TableRow>
            ) : (
              oems.map((oem: any) => (
                <TableRow key={oem.id}>
                  <TableCell>{oem.name}</TableCell>
                  <TableCell>{oem.email || "-"}</TableCell>
                  <TableCell>{oem.contactNumber || "-"}</TableCell>
                  <TableCell>{oem.contactPerson || "-"}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Edit"
                      onClick={() => {
                        setSelectedOEM(oem);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      aria-label="Delete"
                      onClick={() => {
                        setPendingDeleteOEM(oem);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Delete Alert Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setPendingDeleteOEM(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete OEM</DialogTitle>
            </DialogHeader>
            <div>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{pendingDeleteOEM?.name}</span>?
              This action cannot be undone.
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setPendingDeleteOEM(null);
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <OEMDialog
          open={open}
          onOpenChange={setOpen}
          initialData={selectedOEM}
          onSuccess={loadData}
        />
      </CardContent>
    </Card>
  );
}
