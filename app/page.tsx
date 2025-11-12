"use client";

import { useEffect, useState } from "react";
import { AppBar } from "@/components/appbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  IndianRupee,
  BarChart3,
  LineChart as LucideLineChart,
  BarChartBig,
  ArrowRight,
  Timer,
  Layers,
  Crown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [apiStats, setApiStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const leadsTrend = [
    { month: "Jan", leads: 14 },
    { month: "Feb", leads: 28 },
    { month: "Mar", leads: 37 },
    { month: "Apr", leads: 50 },
    { month: "May", leads: 42 },
  ];

  const revenueData = [
    { month: "Jan", amount: 60000 },
    { month: "Feb", amount: 85000 },
    { month: "Mar", amount: 120000 },
    { month: "Apr", amount: 90000 },
    { month: "May", amount: 140000 },
  ];

  const recentLeads = [
    { name: "Sarah Smith", company: "XYZ Pvt Ltd", stage: "Proposal Sent" },
    { name: "Manish Patel", company: "SoftWeb", stage: "Negotiation" },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:8080/api/leads/stats", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const json = await res.json();
        if (json.success) {
          setApiStats(json.data);
        } else {
          setError("Failed to load data");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helper function to safely get totalValue (handles null)
  function getTotalValue(value: any) {
    if (typeof value === "number") {
      return value.toLocaleString();
    } else if (value == null) {
      return "--";
    }
    // If it's some non-number (defensive)
    return String(value);
  }

  // Helper for safely rendering "byStatus" totalValue
  function getStatusTotalValue(s: any) {
    if (s && typeof s.totalValue === "number") {
      return s.totalValue.toLocaleString();
    } else if (s && s.totalValue == null) {
      return "--";
    } else {
      return "";
    }
  }

  return (
    <>
      <div className="p-6 rounded-md mt-16 bg-white  shadow border border-gray-200  space-y-10 via-white to-pink-100 min-h-screen">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-snug flex items-center gap-3 ">
              <Layers className="w-8 h-8 text-pink-700" />
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base pt-1">
              Your <b>CRM</b> insights at a glance — manage, track, and grow!
            </p>
          </div>
      
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-100 shadow-lg group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Users className="w-16 h-16 text-pink-200 group-hover:text-pink-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <Users className="w-5 h-5 text-pink-500" /> Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-pink-700">
                {loading ? (
                  <span className="animate-pulse text-pink-400">...</span>
                ) : (
                  apiStats?.totalLeads ?? "--"
                )}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100 shadow-lg group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <IndianRupee className="w-16 h-16 text-green-200 group-hover:text-green-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <IndianRupee className="w-5 h-5 text-green-600" /> Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black text-green-700">
                {loading ? (
                  <span className="animate-pulse text-green-400">...</span>
                ) : (
                  <>
                    ₹{" "}
                    {getTotalValue(apiStats?.totalValue)}
                  </>
                )}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100 shadow-lg group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <CheckCircle2 className="w-16 h-16 text-blue-200 group-hover:text-blue-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Statuses
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {loading ? (
                <span className="animate-pulse text-blue-400">Loading...</span>
              ) : Array.isArray(apiStats?.byStatus) && apiStats.byStatus.length ? (
                apiStats.byStatus.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <Timer className="w-4 h-4 text-blue-400" />
                    <span className="capitalize">{s?._id}</span>:
                    <span className="font-bold">{s?.count ?? "--"}</span>
                    <span className="text-xs">
                      (<IndianRupee className="inline w-3 h-3" />
                      {getStatusTotalValue(s)})
                    </span>
                  </div>
                ))
              ) : (
                "No data"
              )}
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100 shadow-lg group hover:scale-[1.025] transition hover:shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <Crown className="w-16 h-16 text-yellow-200 group-hover:text-yellow-100 transition" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-semibold">
                <Crown className="w-5 h-5 text-yellow-600" />
                Priorities
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {loading ? (
                <span className="animate-pulse text-yellow-400">Loading...</span>
              ) : Array.isArray(apiStats?.byPriority) && apiStats.byPriority.length ? (
                apiStats.byPriority.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="capitalize">{p?._id}</span>:{" "}
                    <span className="font-bold">{p?.count ?? "--"}</span>
                  </div>
                ))
              ) : (
                "No data"
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Separator />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leads Trend Chart */}
          <Card className="rounded-xl border border-gray-100 bg-white shadow-lg hover:shadow-xl transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
                <LucideLineChart className="text-pink-600 h-6 w-6" /> Leads Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsTrend}>
                  <CartesianGrid strokeDasharray="8 6" stroke="#ec489980" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#ec4899"
                    strokeWidth={4}
                    dot={{ stroke: "#fff", fill: "#ec4899", strokeWidth: 3, r: 6 }}
                    activeDot={{ fill: "#be185d", r: 9 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="rounded-xl border border-gray-100 bg-white shadow-lg hover:shadow-xl transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
                <BarChartBig className="text-pink-600 h-6 w-6" /> Revenue (Monthly)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="8 6" stroke="#ec489980" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#ec4899" radius={[10, 10, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads Section */}
        <Separator />
        <Card className="rounded-xl border border-gray-100 bg-white shadow-lg hover:shadow-xl transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-pink-700">
              <Users className="w-5 h-5 text-pink-600" />
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-pink-100">
              {recentLeads.map((lead, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 px-1 hover:bg-pink-50 transition rounded-xl group"
                >
                  <div>
                    <p className="font-semibold flex items-center gap-2 text-pink-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> {lead.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 bg-pink-100 text-pink-700 border border-pink-200">
                      <Timer className="inline w-4 h-4 mr-1 text-pink-500" />
                      {lead.stage}
                    </Badge>
                    <ArrowRight className="h-5 w-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
