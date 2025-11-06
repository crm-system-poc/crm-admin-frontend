"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Home() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:8080/api/leads/customer/ABCCorporation",
        { withCredentials: true }
      );
      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="p-6">
      <h2 className="scroll-m-20 mb-6 text-3xl font-semibold tracking-tight">
        Leads
      </h2>

      <div className="mb-4">
        <Button onClick={fetchLeads}>Refresh</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leads...</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leads found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {leads.map((lead: any) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.id}</TableCell>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.company}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
