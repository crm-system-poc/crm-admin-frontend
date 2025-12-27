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
// If you have a Card component, import it. Otherwise, you may need to create it or use from your UI library.
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Enum values for dropdowns taken from backend Lead.js model
const STATUS_LIST = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal Sent", value: "proposal_sent" },
  { label: "Negotiation", value: "negotiation" },
  { label: "Won", value: "won" },
  { label: "OEM Approval", value: "oem_approval" },
  { label: "Lost", value: "lost" },
]
const SOURCE_LIST = [
  { label: "Website", value: "website" },
  { label: "Referral", value: "referral" },
  { label: "Social Media", value: "social_media" },
  { label: "Cold Call", value: "cold_call" },
  { label: "Email", value: "email" },
  { label: "OEM", value: "oem" },
  { label: "Other", value: "other" },
]
const PRIORITY_LIST = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
]

const FormSchema = z.object({
  customerName: z.string().min(2, "Required"),
  contactPerson: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z
    .string()
    .min(10, "Invalid phone")
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone format"),
  altEmail: z
    .string()
    .email("Invalid alternate email")
    .optional()
    .or(z.literal("")),
  altPhoneNumber: z
    .string()
    .min(10, "Invalid alternate phone")
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone format")
    .optional()
    .or(z.literal("")),
  addressStreet: z.string().min(2, "Required"),
  addressCity: z.string().min(2, "Required"),
  addressState: z.string().min(2, "Required"),
  addressZipCode: z.string().min(2, "Required"),
  addressCountry: z.string().min(2, "Required").default("India"),
  location: z.string().optional().or(z.literal("")),
  // projectTitle field REMOVED (does not exist in Lead.js schema)
  requirementDetails: z.string().min(5, "Required"),
  status: z.enum([
    "new",
    "contacted",
    "qualified",
    "proposal_sent",
    "negotiation",
    "won",
    "oem_approval",
    "lost",
  ]),
  source: z.enum([
    "website",
    "referral",
    "social_media",
    "cold_call",
    "email",
    "oem",
    "other",
  ]),
  notes: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
  estimatedValue: z.coerce.number().min(0, "Enter valid amount"),
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
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
      addressCountry: "",
      location: "",
      requirementDetails: "",
      status: "new",
      source: "website",
      notes: "",
      priority: "low",
      estimatedValue: 0,
      followUpDate: "",
  
    },
  })

  const onSubmit = async (data: any) => {
    try {
      toast.loading("Creating lead...")

      // Map form values to backend structure
      const {
        customerName,
        contactPerson,
        email,
        phoneNumber,
        altEmail,
        altPhoneNumber,
        addressStreet,
        addressCity,
        addressState,
        addressZipCode,
        addressCountry,
        location,
        requirementDetails,
        status,
        source,
        notes,
        priority,
        estimatedValue,
        followUpDate,
      } = data

      const address = {
        street: addressStreet,
        city: addressCity,
        state: addressState,
        zipCode: addressZipCode,
        country: addressCountry,
      }

      await axios.post(
        "https://crm-backend-b8ys.onrender.com/api/leads",
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
          followUpDate: followUpDate ? followUpDate : undefined,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )

      toast.dismiss()
      toast.success("Lead created successfully ✅")
      router.push("/leads")
    } catch (error) {
      toast.dismiss()
      toast.error("Something went wrong ❌")
      console.log(error)
    }
  }

  return (
    <div className="max-w-8xl py-8 px-4 mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-semibold">Create Lead</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                {/* Address Fields: street/city/state/zip/country */}
                <FormField
                  control={form.control}
                  name="addressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressZipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="400001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="India" {...field} />
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

              
                {/* SOURCE */}
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="block w-full rounded-md border border-input bg-background px-2 py-2"
                        >
                          {SOURCE_LIST.map(({ label, value }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* STATUS: select */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="block w-full rounded-md border border-input bg-background px-2 py-2"
                        >
                          {STATUS_LIST.map(({ label, value }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PRIORITY */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="block w-full rounded-md border border-input bg-background px-2 py-2"
                        >
                          {PRIORITY_LIST.map(({ label, value }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
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
                          value={
                            field.value === undefined ||
                            field.value === null ||
                            field.value === ""
                              ? ""
                              : String(field.value)
                          }
                          onChange={(e) => {
                            const val = e.target.value
                            field.onChange(val === "" ? "" : Number(val))
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
        </CardContent>
      </Card>
    </div>
  )
}
