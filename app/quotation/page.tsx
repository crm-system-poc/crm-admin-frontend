"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/quotations", { withCredentials: true })
      setQuotations(response.data)
    } catch (err) {
      toast.error("Failed to load quotations ❌")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quotations</h1>
        <Button onClick={fetchQuotations}>Refresh</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading quotations...</p>
      ) : quotations.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No quotations found.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{q.customerName || "-"}</TableCell>
                  <TableCell>{q.email}</TableCell>
                  <TableCell>{q.phoneNumber}</TableCell>
                  <TableCell>{q.projectTitle}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.status || "Pending"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">₹ {q.estimatedValue || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
