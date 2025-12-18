"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  ShoppingBag,
  IndianRupee,
  Layers,
  Activity,
  BarChart3,
  AlarmClock,
  CalendarClock,
  Crown,
  CheckCircle2,
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

/* -------------------------------- COLORS -------------------------------- */

const COLORS = [
  "#ec4899",
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#14b8a6",
  "#a855f7",
];

/* -------------------------- CHART HELPERS -------------------------- */

const hasChartData = (data: any[], key?: string) => {
  if (!Array.isArray(data) || data.length === 0) return false;
  if (!key) return true;
  return data.some((d) => Number(d?.[key]) > 0);
};

const EmptyChart = ({ text = "No data available yet" }: { text?: string }) => (
  <div className="h-full flex items-center justify-center text-sm text-gray-400">
    {text}
  </div>
);

/* ----------------------------- TOOLTIP ---------------------------------- */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload?.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* =============================== HOME =================================== */

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [licenses, setLicenses] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ------------------------- FETCH DASHBOARD DATA ------------------------ */
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [leadsResp, quotationsResp, purchaseOrdersResp, licenseDataResp] =
          await Promise.allSettled([
            api.get("/api/leads/stats"),
            api.get("/api/quotations/stats"),
            api.get("/api/purchase-orders/stats"),
            api.get("/api/reports/expiring-licenses"),
          ]);

        const leads = leadsResp.value.data.data;
        const quotations = quotationsResp.value.data.data;
        const purchaseOrders = purchaseOrdersResp.value.data.data;
        const licenseData = licenseDataResp.value.data.data;

        setStats({
          leads: leads,
          quotations: quotations,
          purchaseOrders: purchaseOrders,
        });

        setLicenses(licenseData);
      } catch (err) {
        setStats(null);
        setLicenses(null);
        // This is necessary for the rewrite: Set loading to false even if error
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-10 text-xl">Loading dashboard…</div>;
  }

  // Defensive guards before rendering UI to avoid map()-on-undefined crash

  // Check: Must have stats and licenses and basic summary properties, else error
  // if (
  //   !stats ||
  //   !stats.leads ||
  //   !stats.quotations ||
  //   !stats.purchaseOrders ||
  //   !licenses ||
  //   !licenses.summary
  // ) {
  //   return (
  //     <div className="p-10 text-red-600">
  //       Cannot read properties of undefined (reading &apos;map&apos;)
  //     </div>
  //   );
  // }

  /* ------------------------------ KPI DATA ------------------------------- */

  // Safe fallback for pie/trend data: always arrays
  const leadTrend =
    Array.isArray(stats?.leads?.trendData) && stats.leads.trendData.length > 0
      ? stats.leads.trendData
      : [];

  const quotationTrend =
    Array.isArray(stats?.quotations?.trendData) &&
    stats.quotations.trendData.length > 0
      ? stats.quotations.trendData
      : [];

  console.log(leadTrend);
  // const quotationTrend = Array.isArray(stats?.quotations?.trendData)
  //   ? stats.quotations.trendData
  //   : [];

  const leadStatusPie = Array.isArray(stats?.leads?.byStatus)
    ? stats.leads.byStatus?.map((s: any, i: number) => ({
        name: s.status || s._id || String(i + 1),
        value: s.count || 0,
        fill: COLORS[i % COLORS.length],
      }))
    : [];

  const priorityPie = Array.isArray(stats?.leads?.byPriority)
    ? stats.leads.byPriority?.map((p: any, i: number) => ({
        name: p.priority,
        value: p.count,
        fill: COLORS[i % COLORS.length],
      }))
    : [];

  const quotationStatusPie = [
    { name: "Pending", value: stats?.quotations?.totalPending },
    { name: "Approved", value: stats?.quotations?.totalApproved },
    { name: "Rejected", value: stats?.quotations?.totalRejected },
    { name: "Expired", value: stats?.quotations?.totalExpired },
  ]?.map((s, i) => ({
    ...s,
    fill: COLORS[i % COLORS.length],
  }));

  // console.log("Leads Trend:", stats.leads.trendData);
  // console.log("Quotation Trend:", stats.qutation);
  // console.log("PO Stats:", stats?.purchaseOrders);


  /* ================================ UI ================================= */

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ---------------------------- HEADER ----------------------------- */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-600" />
            Dashboard
          </h1>

          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{stats?.purchaseOrders?.financials?.totalAmountSum?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ----------------------------- KPIs ------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard
            title="Total Leads"
            value={stats?.leads?.totalLeads}
            icon={<Users />}
          />
          <KpiCard
            title="Quotations"
            value={stats?.quotations?.totalQuotations || 0}
            icon={<FileText />}
          />
          <KpiCard
            title="Purchase Orders"
            value={stats?.purchaseOrders?.totalPOs || 0}
            icon={<ShoppingBag />}
          />
          <KpiCard
            title="PO Value"
            value={`₹${stats?.purchaseOrders?.financials?.totalAmountSum?.toLocaleString() || 0}`}
            icon={<IndianRupee />}
          />
        </div>

        <Separator />

        {/* ------------------------- LICENSE CARDS -------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LicenseCard
            title="Expired Licenses"
            value={licenses?.summary?.totalExpired}
            icon={<AlarmClock />}
            color="pink"
            onClick={() => router.push("/licenses/expiring?filter=expired&range=monthly")}
          />
          <LicenseCard
            title="Expiring Soon"
            value={licenses?.summary?.totalExpiringSoon}
            icon={<CalendarClock />}
            color="yellow"
            onClick={() => router.push("/licenses/expiring?filter=expiring-soon&range=monthly")}
          />
          <LicenseCard
            title="Total Licenses"
            value={licenses?.summary?.totalLicenses}
            icon={<Crown />}
            color="blue"
            onClick={() => router.push("/licenses/expiring?filter=all&range=monthly")}
          />
        </div>

        <Separator />

        {/* ---------------------------- CHARTS ------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieCard title="Lead Status" data={leadStatusPie} />
          <PieCard title="Priority Distribution" data={priorityPie} />
          <PieCard title="Quotation Status" data={quotationStatusPie} />

          <LineCard title="Leads Trend" data={leadTrend} dataKey="leads" />

          <LineCard
            title="Quotation Trend"
            data={quotationTrend}
            dataKey="quotations"
          />

          <BarCard title="Revenue Trend" data={leadTrend} dataKey="revenue" />
        </div>
      </div>
    </div>
  );
}

/* ============================ COMPONENTS ================================ */

const KpiCard = ({ title, value, icon }: any) => (
  <div className="bg-white rounded-xl p-6 shadow">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="text-indigo-600">{icon}</div>
    </div>
  </div>
);

const LicenseCard = ({ title, value, icon, color, onClick }: any) => (
  <Card onClick={onClick} className={`cursor-pointer bg-${color}-100`}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

const PieCard = ({ title, data }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>

    <CardContent className="h-64">
      {hasChartData(data) ? (
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" label>
              {data?.map((e: any, i: number) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart text="No records yet" />
      )}
    </CardContent>
  </Card>
);

const LineCard = ({ title, data, dataKey }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>

    <CardContent className="h-64">
      {hasChartData(data, dataKey) ? (
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart text="Trend will appear once data is added" />
      )}
    </CardContent>
  </Card>
);

const BarCard = ({ title, data, dataKey }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>

    <CardContent className="h-64">
      {hasChartData(data, dataKey) ? (
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill="#ec4899" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart text="Revenue will show after orders" />
      )}
    </CardContent>
  </Card>
);
