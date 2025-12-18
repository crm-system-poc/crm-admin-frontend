"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    productId: "",
    productName: "",
    productCode: "",
    category: "",
    oem: "",
    description: "",
    oemPrice: "",
    sellingPrice: "",
  });
  const [loading, setLoading] = useState(false);

  const [oems, setOems] = useState<any[]>([]);

  useEffect(() => {
    const fetchOEMs = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/oems/dropdown", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setOems(data.data || []);
        }
      } catch (err) {
        toast.error("Failed to load OEMs");
      }
    };

    fetchOEMs();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      productId: form.productId.trim() || undefined,
      productName: form.productName.trim(),
      productCode: form.productCode.trim(),
      category: form.category.trim(),
      oem: form.oem.trim(),
      description: form.description.trim(),
      oemPrice: form.oemPrice ? Number(form.oemPrice) : undefined,
      sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
    };

    try {
      const res = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product created successfully");
        router.push("/products");
      } else {
        toast.error(data.error || "Failed to create product");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add Product</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                name="productId"
                placeholder="Enter product id"
                value={form.productId}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>
            {/* Product Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                name="productName"
                placeholder="Enter product name"
                required
                value={form.productName}
                onChange={handleChange}
              />
            </div>
            {/* Product Code */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                name="productCode"
                placeholder="PRD001"
                required
                value={form.productCode}
                onChange={handleChange}
              />
            </div>
            {/* Category */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="Eg. Software"
                value={form.category}
                onChange={handleChange}
                required={false}
              />
            </div>
            {/* OEM */}
            {/* OEM */}
            <div className="flex flex-col gap-2 w-full">
              <Label>OEM</Label>
              <Select
                value={form.oem}
                onValueChange={(value) => setForm({ ...form, oem: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select OEM" />
                </SelectTrigger>
                <SelectContent>
                  {oems.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No OEMs found
                    </SelectItem>
                  )}
                  {oems.map((oem) => (
                    <SelectItem key={oem.id} value={oem.name}>
                      {oem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* OEM Price */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="oemPrice">OEM Price</Label>
              <Input
                id="oemPrice"
                name="oemPrice"
                placeholder="₹5,000"
                required
                value={form.oemPrice}
                onChange={handleChange}
                type="number"
                min="0"
                inputMode="decimal"
              />
            </div>
            {/* Selling Price */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input
                id="sellingPrice"
                name="sellingPrice"
                placeholder="₹6,000"
                required
                value={form.sellingPrice}
                onChange={handleChange}
                type="number"
                min="0"
                inputMode="decimal"
              />
            </div>
            {/* Description */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter product description"
                rows={3}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            {/* Submit Button (spans all) */}
            <div className="flex flex-col col-span-1 md:col-span-3 items-end mt-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/products")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Add Product"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
