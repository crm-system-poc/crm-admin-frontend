"use client"

import axios from "axios"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"

const FormSchema = z.object({
  customerName: z.string().min(2, "Required"),
  contactPerson: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(10, "Invalid phone"),
  altEmail: z.string().email("Invalid alternate email").optional().or(z.literal("")),
  altPhoneNumber: z.string().min(10, "Invalid alternate phone").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  projectTitle: z.string().min(2, "Required"),
  requirementDetails: z.string().min(5, "Required"),
  status: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  priority: z.string().optional().or(z.literal("")),
  estimatedValue: z.coerce.number().min(1, "Enter valid amount"),
  followUpDate: z.string().optional().or(z.literal("")),
})

export default function CreateLead() {
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      customerName: "",
      contactPerson: "",
      email: "",
      phoneNumber: "",
      altEmail: "",
      altPhoneNumber: "",
      address: "",
      location: "",
      projectTitle: "",
      requirementDetails: "",
      status: "",
      source: "",
      notes: "",
      priority: "",
      estimatedValue: 0,
      followUpDate: "",
    },
  })

  const onSubmit = async (data: any) => {
    try {
      toast.loading("Creating lead...")

      // Only send the required keys
      const {
        customerName,
        contactPerson,
        email,
        phoneNumber,
        altEmail,
        altPhoneNumber,
        address,
        location,
        requirementDetails,
        status,
        source,
        notes,
        priority,
        estimatedValue,
        followUpDate,
      } = data

      await axios.post(
        "http://localhost:8080/api/leads",
        {
          customerName,
          contactPerson,
          email,
          phoneNumber,
          altEmail,
          altPhoneNumber,
          address,
          location,
          requirementDetails,
          status,
          source,
          notes,
          priority,
          estimatedValue,
          followUpDate,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )

      toast.dismiss()
      toast.success("Lead created successfully ✅")
      router.push("/leads") // redirect to leads list
    } catch (error) {
      toast.dismiss()
      toast.error("Something went wrong ❌")
      console.log(error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 border rounded-md mt-16">
      <h1 className="text-2xl font-semibold">Create Lead</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 3x3 grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@abccorp.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="altEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Email</FormLabel>
                  <FormControl>
                    <Input placeholder="alternate@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="altPhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Alternate phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Office Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City/Area" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input placeholder="New/Contacted" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Referral/Website/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input placeholder="High/Medium/Low" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50000"
                      {...field}
                      value={field.value === undefined || field.value === null ? "" : String(field.value)}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? "" : Number(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow Up Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      placeholder="Follow up date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Full width fields */}
          <FormField
            control={form.control}
            name="requirementDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirement Details</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Need corporate website with 10 pages"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Additional notes..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full md:w-auto">
            Create Lead
          </Button>
        </form>
      </Form>
    </div>
  )
}
