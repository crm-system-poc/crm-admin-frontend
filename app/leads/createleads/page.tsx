"use client"

import axios from "axios"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const FormSchema = z.object({
  customerName: z.string().min(2, "Required"),
  contactPerson: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(10, "Invalid phone"),
  projectTitle: z.string().min(2, "Required"),
  requirementDetails: z.string().min(5, "Required"),
  estimatedValue: z.coerce.number().min(1, "Enter valid amount"),
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
      projectTitle: "",
      requirementDetails: "",
      estimatedValue: 0,
    },
  })

  const onSubmit = async (data: any) => {
    try {
      toast.loading("Creating lead...")
      await axios.post("http://localhost:8080/api/leads", data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })
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
    <div className="max-w-6xl mx-auto p-6 space-y-6 border rounded-md mt-10">
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
              name="projectTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Website Development" {...field} />
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
                    <Input type="number" placeholder="50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          {/* Full width field */}
          <FormField
            control={form.control}
            name="requirementDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirement Details</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Need corporate website with 10 pages" {...field} />
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
