import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Monitor,
  Cpu,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  ArrowRight,
  CheckCircle,
  Clock,
  UserPlus,
  Wrench,
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAssignments } from "../context/AssignmentsContext";
import { useAuth } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";

const categoryColors: Record<string, string> = {
  "System Unit": "#3b82f6",
  Monitor: "#14b8a6",
  Keyboard: "#a855f7",
  Mouse: "#22c55e",
  Headset: "#f97316",
  Webcam: "#6366f1",
  Extra: "#94a3b8",
};

const categoryIcons: Record<string, React.ElementType> = {
  "System Unit": Cpu,
  Monitor: Monitor,
  Keyboard: Keyboard,
  Mouse: Mouse,
  Headset: Headphones,
  Webcam: Camera,
  Extra: Package,
};

type ActivityItem = {
  id: string;
  action: string;
  description: string;
  assignedTo: string;
  timestamp: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  date: Date;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { inventory, loading: inventoryLoading } = useInventory();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (inventoryLoading || assignmentsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-[#B0BF00]"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalItems = inventory.length;
  const totalAssets = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const inStock = inventory.filter((i) => i.stockStatus === "In Stock").length;
  const lowStock = inventory.filter((i) => i.stockStatus === "Low Stock").length;
  const outOfStock = inventory.filter((i) => i.stockStatus === "Out of Stock").length;
  const totalValue = inventory.reduce((s, i) => s + i.price * i.quantity, 0);

  const monthlyData = (() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString("en-US", { month: "short" }),
        items: 0,
      };
    });

    inventory.forEach((item) => {
      const recordDate = new Date(item.createdAt || item.purchaseDate);
      if (Number.isNaN(recordDate.getTime())) return;

      const bucket = buckets.find(
        (entry) =>
          entry.key === `${recordDate.getFullYear()}-${recordDate.getMonth()}`
      );

      if (bucket) {
        bucket.items += item.quantity;
      }
    });

    return buckets.map(({ month, items }) => ({ month, items }));
  })();
  const monthlyTrendMax = Math.max(...monthlyData.map((point) => point.items), 0);
  const monthlyTrendDomainMax = Math.max(10, Math.ceil(monthlyTrendMax / 10) * 10);

  const statCards = [
    {
      label: "Total Items",
      value: totalItems,
      description: "Tracked asset records in inventory",
      icon: Boxes,
      accent: "from-lime-100 via-white to-lime-50",
      iconClass: "text-[#93a300]",
      badge: null,
    },
    {
      label: "Low Stock",
      value: lowStock,
      description: "Items nearing minimum threshold",
      icon: AlertTriangle,
      accent: "from-amber-100 via-white to-orange-50",
      iconClass: "text-amber-500",
      badge: "Needs Attention",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      description: "Assets that require urgent restock",
      icon: XCircle,
      accent: "from-rose-100 via-white to-red-50",
      iconClass: "text-rose-500",
      badge: "Urgent Restock",
    },
    {
      label: "Inventory Value",
      value: `PHP ${totalValue.toLocaleString()}`,
      description: "Estimated value across all inventory",
      icon: TrendingUp,
      accent: "from-emerald-100 via-white to-emerald-50",
      iconClass: "text-emerald-600",
      badge: null,
    },
  ];

  const catGroups: Record<string, { inStock: number; total: number }> = {};
  inventory.forEach((item) => {
    const assetType = item.category || "Other";
    if (!catGroups[assetType]) catGroups[assetType] = { inStock: 0, total: 0 };
    catGroups[assetType].total += item.quantity;
    if (item.stockStatus === "In Stock") catGroups[assetType].inStock += item.quantity;
  });

  const donutData = Object.entries(catGroups).map(([name, v], index) => ({
    name,
    value: v.total,
    color: categoryColors[name] || "#94a3b8",
    id: `${name}-${index}`,
  }));

  const alerts = inventory.filter((i) => i.stockStatus !== "In Stock");

  const recentActivity = (() => {
    const activities: ActivityItem[] = [];

    const recentAssignments = [...assignments]
      .sort((a, b) => new Date(b.dateAssigned || 0).getTime() - new Date(a.dateAssigned || 0).getTime())
      .slice(0, 5);

    recentAssignments.forEach((assignment) => {
      if (assignment.status === "Assigned") {
        activities.push({
          id: `assign-${assignment.assignmentId}`,
          action: "New Assignment",
          description: assignment.assetName,
          assignedTo: assignment.assignedTo,
          timestamp: formatTimestamp(assignment.dateAssigned),
          icon: UserPlus,
          iconBg: isDark ? "bg-emerald-500/15" : "bg-green-50",
          iconColor: isDark ? "text-emerald-300" : "text-green-500",
          date: new Date(assignment.dateAssigned || 0),
        });
      } else if (assignment.status === "Under Maintenance") {
        activities.push({
          id: `maint-${assignment.assignmentId}`,
          action: "Maintenance Scheduled",
          description: assignment.assetName,
          assignedTo: assignment.assignedTo,
          timestamp: formatTimestamp(assignment.dateAssigned),
          icon: Wrench,
          iconBg: isDark ? "bg-sky-500/15" : "bg-blue-50",
          iconColor: isDark ? "text-sky-300" : "text-blue-500",
          date: new Date(assignment.dateAssigned || 0),
        });
      }
    });

    const lowStockItems = inventory
      .filter((item) => item.stockStatus === "Low Stock" || item.stockStatus === "Out of Stock")
      .slice(0, 3);

    lowStockItems.forEach((item) => {
      activities.push({
        id: `stock-${item.id}`,
        action: item.stockStatus === "Out of Stock" ? "Stock Alert" : "Stock Updated",
        description: item.assetName,
        assignedTo: item.stockStatus === "Out of Stock" ? "Out of stock" : "Low stock alert",
        timestamp: "Recently",
        icon: item.stockStatus === "Out of Stock" ? XCircle : AlertTriangle,
        iconBg:
          item.stockStatus === "Out of Stock"
            ? isDark
              ? "bg-red-500/15"
              : "bg-red-50"
            : isDark
              ? "bg-amber-500/15"
              : "bg-amber-50",
        iconColor:
          item.stockStatus === "Out of Stock"
            ? isDark
              ? "text-red-300"
              : "text-red-500"
            : isDark
              ? "text-amber-300"
              : "text-amber-500",
        date: new Date(),
      });
    });

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  })();

  function formatTimestamp(dateString?: string): string {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  const totalCategoryUnits = donutData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
        <div className={`px-5 py-6 md:px-6 md:py-7 ${isDark ? "bg-slate-900" : "bg-white"}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? "border-slate-700 bg-slate-800 text-[#d8e56b]" : "border-[#B0BF00]/20 bg-slate-50 text-[#7f8f00]"}`}>
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard Overview
              </div>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7f8f00]">
                Welcome back, {firstName}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500 md:text-base">
                {currentDateTime.toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Inventory and Assignment Snapshot
              </h2>
              <p className="mt-2 text-sm text-slate-600 md:text-base">
                Here's the latest overview for your {user?.role || "team"} dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={`rounded-2xl border px-4 py-3 shadow-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Units</p>
                <p className={`mt-2 text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{totalAssets}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 shadow-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>In Stock</p>
                <p className="mt-2 text-xl font-bold text-emerald-600">{inStock}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 shadow-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Assignments</p>
                <p className="mt-2 text-xl font-bold text-sky-600">{assignments.length}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 shadow-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Alerts</p>
                <p className="mt-2 text-xl font-bold text-amber-600">{alerts.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`overflow-hidden rounded-3xl border p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-2xl border p-3 shadow-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                  <Icon className={`h-5 w-5 ${card.iconClass}`} />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{card.description}</p>
              {card.badge && (
                <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  {card.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-5 py-5 md:px-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Stock by Category</h3>
                <p className="mt-1 text-sm text-slate-500">See how inventory units are distributed across asset types.</p>
              </div>
              <div className={`rounded-2xl p-3 ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((d, idx) => (
                      <Cell key={`cell-${d.name}-${idx}`} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-28 mb-16 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Total Units</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalCategoryUnits}</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 px-2">
                {donutData.map((d, i) => (
                  <div key={`legend-${d.name}-${i}`} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="truncate text-[11px] text-slate-600">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-5 py-5 md:px-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Inventory Trend</h3>
                <p className="mt-1 text-sm text-slate-500">Monthly quantity movement based on actual inventory record dates.</p>
              </div>
              <div className={`rounded-2xl p-3 ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barSize={28}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  domain={[0, monthlyTrendDomainMax]}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                  cursor={{ fill: "rgba(176,191,0,0.08)" }}
                />
                <Bar dataKey="items" fill="#B0BF00" radius={[8, 8, 0, 0]} name="Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-5 py-5 md:px-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Stock Alerts</h3>
                <p className="mt-1 text-sm text-slate-500">Track items that are low in stock or already depleted.</p>
              </div>
              <button
                onClick={() => navigate("/dashboard/inventory")}
                className="inline-flex items-center gap-1 rounded-full border border-[#B0BF00]/20 bg-[#B0BF00]/10 px-3 py-1.5 text-xs font-semibold text-[#8fa100] transition hover:bg-[#B0BF00]/15"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="p-5 md:p-6">
            {alerts.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-400" />
                <p className="text-sm text-slate-500">All items are well stocked.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{item.assetName}</p>
                      <p className="truncate font-mono text-[11px] text-slate-400">{item.sku}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={`hidden text-xs sm:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}>Qty: {item.quantity}</span>
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                          item.stockStatus === "Out of Stock"
                            ? isDark
                              ? "bg-red-500/15 text-red-300"
                              : "bg-red-50 text-red-500"
                            : isDark
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-amber-50 text-amber-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.stockStatus === "Out of Stock"
                              ? isDark
                                ? "bg-red-300"
                                : "bg-red-400"
                              : isDark
                                ? "bg-amber-300"
                                : "bg-amber-400"
                          }`}
                        />
                        <span className="hidden sm:inline">{item.stockStatus}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-5 py-5 md:px-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Type Overview</h3>
                <p className="mt-1 text-sm text-slate-500">Compare the unit share of each inventory type.</p>
              </div>
              <div className={`rounded-2xl p-3 ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="space-y-3 p-5 md:p-6">
            {donutData.map((d, i) => {
              const Icon = categoryIcons[d.name] || Package;
              const pct = totalCategoryUnits > 0 ? Math.round((d.value / totalCategoryUnits) * 100) : 0;
              return (
                <div key={i} className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${d.color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: d.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700">{d.name}</span>
                        <span className="text-[11px] text-slate-400">{d.value} units</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-5 py-5 md:px-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              <p className="mt-1 text-sm text-slate-500">Latest assignment and stock-related updates from the system.</p>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>Last 48 hours</span>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-5 md:p-6">
          {recentActivity.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-all hover:border-[#B0BF00]/30 hover:shadow-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
              >
                <div className={`${activity.iconBg} ${activity.iconColor} rounded-xl p-2.5 flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{activity.action}</p>
                    <span className="flex-shrink-0 text-[11px] text-slate-400">{activity.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-700">{activity.description}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{activity.assignedTo}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
