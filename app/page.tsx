"use client"

import { AppBar } from "@/components/appbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Users,
  CheckCircle,
  IndianRupee,
  ChartLine,
  ChartBar,
  ArrowRight
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function Home() {
  const stats = [
    { label: "Total Leads", value: 248, icon: Users, color: "text-pink-600" },
    { label: "Active Deals", value: 37, icon: TrendingUp, color: "text-blue-600" },
    { label: "Closed Deals", value: 18, icon: CheckCircle, color: "text-green-600" },
    { label: "Revenue", value: "₹ 4,85,000", icon: IndianRupee, color: "text-yellow-600" },
  ]

  const leadsTrend = [
    { month: "Jan", leads: 14 }, { month: "Feb", leads: 28 },
    { month: "Mar", leads: 37 }, { month: "Apr", leads: 50 },
    { month: "May", leads: 42 },
  ]

  const revenueData = [
    { month: "Jan", amount: 60000 }, { month: "Feb", amount: 85000 },
    { month: "Mar", amount: 120000 }, { month: "Apr", amount: 90000 },
    { month: "May", amount: 140000 },
  ]

  const recentLeads = [
    { name: "John Doe", company: "ABC Corp", stage: "Follow-up" },
    { name: "Sarah Smith", company: "XYZ Pvt Ltd", stage: "Proposal Sent" },
    { name: "Manish Patel", company: "SoftWeb", stage: "Negotiation" },
  ]

  return (
    <>
      <div className="p-6 space-y-10">

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your CRM insights at a glance</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={index}
                className="rounded-xl border border-pink-200/40 shadow-sm hover:shadow-md transition-all"
              >
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent className="text-3xl font-semibold">{stat.value}</CardContent>
              </Card>
            )
          })}
        </div>

        <Separator />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Leads Trend Chart */}
          <Card className="rounded-xl border shadow-sm hover:shadow-md transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine className="text-pink-600 h-5 w-5" /> Leads Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="leads" stroke="#ec4899" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="rounded-xl border shadow-sm hover:shadow-md transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="text-pink-600 h-5 w-5" /> Revenue (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Recent Leads */}
        <Card className="rounded-xl border shadow-sm hover:shadow-md transition">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentLeads.map((lead, index) => (
                <div key={index} className="flex items-center justify-between py-4 hover:bg-muted/40 px-2 rounded-lg transition">
                  <div>
                    <p className="font-semibold">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {lead.stage}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  )
}
