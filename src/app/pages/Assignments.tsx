import { useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Map,
  List,
  ClipboardList,
  ShieldCheck,
  Wrench,
  MapPinned,
  PackagePlus,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useAssignments } from "../context/AssignmentsContext";
import { useInventory } from "../context/InventoryContext";
import FloorMapIT from "../components/FloorMapIT";
import FloorMapHR from "../components/FloorMapHR";
import { useAuth } from "../context/AuthContext";
import { canManageAssignments } from "../lib/access";

const ITEMS_PER_PAGE = 6;

export default function Assignments() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { assignments, deleteAssignment } = useAssignments();
  const { inventory } = useInventory();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<typeof assignments[0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<typeof assignments[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "available" | "map">("list");
  const [selectedDepartment, setSelectedDepartment] = useState<"IT Department" | "HR Department">("IT Department");
  const canEditAssignments = user ? canManageAssignments(user.role) : false;
  const isDark = resolvedTheme === "dark";

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Assigned":
        return isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-green-100 text-green-700";
      case "Available":
        return isDark ? "bg-sky-500/15 text-sky-300" : "bg-blue-100 text-blue-700";
      case "Under Maintenance":
        return isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700";
      case "Defective":
        return isDark ? "bg-rose-500/15 text-rose-300" : "bg-rose-100 text-rose-700";
      default:
        return isDark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700";
    }
  };

  const filtered = assignments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.assignmentId.toLowerCase().includes(q) ||
      a.assetName.toLowerCase().includes(q) ||
      a.assetSKU.toLowerCase().includes(q) ||
      a.assignedTo.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.workstation.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const assignableAssets = inventory
    .map((asset) => {
      const assignedCount = assignments.filter(
        (assignment) =>
          assignment.status === "Assigned" &&
          (assignment.assetId === asset.id || assignment.assetSKU === asset.sku)
      ).length;
      const maintenanceCount = assignments.filter(
        (assignment) =>
          assignment.status === "Under Maintenance" &&
          (assignment.assetId === asset.id || assignment.assetSKU === asset.sku)
      ).length;
      const totalQuantity = asset.quantity;
      const remainingQuantity = Math.max(0, totalQuantity - assignedCount);

      return {
        ...asset,
        assignedCount,
        maintenanceCount,
        totalQuantity,
        remainingQuantity,
      };
    })
    .filter((asset) => {
      const q = search.toLowerCase();
      const matchesSearch =
      asset.assetName.toLowerCase().includes(q) ||
        asset.sku.toLowerCase().includes(q) ||
        asset.category.toLowerCase().includes(q) ||
        asset.location.toLowerCase().includes(q);

      return (
        matchesSearch &&
        asset.assetStatus === "Available" &&
        asset.assignedCount < asset.totalQuantity
      );
    })
    .sort((left, right) => left.remainingQuantity - right.remainingQuantity);

  const assignableTotalPages = Math.max(1, Math.ceil(assignableAssets.length / ITEMS_PER_PAGE));
  const paginatedAssignableAssets = assignableAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!canEditAssignments) {
      toast.error("You have view-only access to Assignments.");
      return;
    }
    if (!deleteTarget) return;
    try {
      await deleteAssignment(deleteTarget.assignmentId);
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete the assignment right now.";
      toast.error(message);
    }
  };

  const summaryCards = [
    {
      label: "Total Assignments",
      value: assignments.length,
      description: "All assignment records currently tracked",
      icon: ClipboardList,
      accent: "from-lime-100 via-white to-lime-50",
      iconClass: "text-[#93a300]",
    },
    {
      label: "Assigned",
      value: assignments.filter((a) => a.status === "Assigned").length,
      description: "Assets actively deployed to staff",
      icon: UserCheck,
      accent: "from-emerald-100 via-white to-emerald-50",
      iconClass: "text-emerald-600",
    },
    {
      label: "Assignable",
      value: assignableAssets.length,
      description: "Assets that still have units available for assignment",
      icon: ShieldCheck,
      accent: "from-sky-100 via-white to-sky-50",
      iconClass: "text-sky-600",
    },
    {
      label: "Under Maintenance",
      value: assignments.filter((a) => a.status === "Under Maintenance").length,
      description: "Assets temporarily unavailable",
      icon: Wrench,
      accent: "from-amber-100 via-white to-orange-50",
      iconClass: "text-amber-600",
    },
    {
      label: "Defective",
      value: assignments.filter((a) => a.status === "Defective").length,
      description: "Assets marked as defective in assignment tracking",
      icon: Trash2,
      accent: "from-rose-100 via-white to-rose-50",
      iconClass: "text-rose-600",
    },
  ];

  const itAssignments = assignments.filter((a) => a.department === "IT Department");
  const hrAssignments = assignments.filter((a) => a.department === "HR Department");

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => {
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
            </div>
          );
        })}
      </div>

      <div className={`inline-flex w-full items-center gap-1 overflow-x-auto rounded-2xl border p-1 shadow-sm sm:w-fit ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "list" ? "bg-[#B0BF00] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Assignment List</span>
          <span className="sm:hidden">List</span>
        </button>
        <button
          onClick={() => { setActiveTab("available"); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "available" ? "bg-[#B0BF00] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span className="hidden sm:inline">Assignable Assets</span>
          <span className="sm:hidden">Assign</span>
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "map" ? "bg-[#B0BF00] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Map className="h-4 w-4" />
          <span className="hidden sm:inline">Floor Map</span>
          <span className="sm:hidden">Map</span>
        </button>
      </div>

      {activeTab === "list" && (
        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-4 py-5 md:px-6 md:py-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? "border-slate-700 bg-slate-800 text-[#d8e56b]" : "border-[#B0BF00]/20 bg-slate-50 text-[#7f8f00]"}`}>
                  <ClipboardList className="h-3.5 w-3.5" />
                  Assignments Module
                </div>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  Asset Assignments
                </h3>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm sm:w-60">
                  <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-[#B0BF00] shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Available">Available</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Defective">Defective</option>
                </select>

                {canEditAssignments && (
                  <button
                    onClick={() => navigate("/dashboard/add-assignment")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B0BF00] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(176,191,0,0.28)] transition-colors hover:bg-[#9aaa00]"
                  >
                    <PackagePlus className="h-4 w-4" />
                    New Assignment
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-slate-50"} border-b`}>
                  {["ID", "Asset", "Assigned To", "Department", "Workstation / Seat", "Floor", "Status", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${
                          i === 7 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-100"}`}>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400 italic">
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((assignment) => (
                    <tr key={assignment.assignmentId} className={`transition-colors ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-gray-400">{assignment.assignmentId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#B0BF00]/10">
                            <UserCheck className="h-3.5 w-3.5 text-[#B0BF00]" />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-800">{assignment.assetName}</span>
                            <span className="text-[10px] font-mono text-gray-400">{assignment.assetSKU}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm ${!assignment.assignedTo || assignment.assignedTo === "Unassigned" ? "italic text-gray-400" : "text-gray-700"}`}>
                          {assignment.assignedTo || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-600">{assignment.department}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="text-xs text-gray-600">{assignment.workstation}</span>
                          {assignment.seatNumber && (
                            <span className="ml-1.5 rounded bg-[#B0BF00]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#8a9200]">
                              #{assignment.seatNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500">{assignment.floor}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusStyle(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewTarget(assignment)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#B0BF00]/10 hover:text-[#B0BF00]"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canEditAssignments && (
                            <>
                              <button
                                onClick={() => navigate(`/dashboard/edit-assignment/${assignment.assignmentId}`)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(assignment)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={`flex items-center justify-between border-t px-6 py-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white"}`}>
            <p className="text-xs font-medium text-[#B0BF00]">
              Showing {paginated.length} of {filtered.length} assignments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </button>
              <span className="px-1 text-xs text-gray-500">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "available" && (
        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`border-b px-4 py-5 md:px-6 md:py-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? "border-slate-700 bg-slate-800 text-[#d8e56b]" : "border-[#B0BF00]/20 bg-slate-50 text-[#7f8f00]"}`}>
                  <Boxes className="h-3.5 w-3.5" />
                  Inventory Availability
                </div>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  Assignable Assets From Inventory
                </h3>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm sm:w-72">
                  <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assignable assets..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>

                {canEditAssignments && (
                  <button
                    onClick={() => navigate("/dashboard/add-assignment")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B0BF00] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(176,191,0,0.28)] transition-colors hover:bg-[#9aaa00]"
                  >
                    <PackagePlus className="h-4 w-4" />
                    New Assignment
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-slate-50"} border-b`}>
                  {["Asset", "Category", "Location", "Quantity", "Assigned", "Stock", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${
                          i === 6 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-100"}`}>
                {paginatedAssignableAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400 italic">
                      No assignable inventory assets found.
                    </td>
                  </tr>
                ) : (
                  paginatedAssignableAssets.map((asset) => (
                    <tr key={asset.id} className={`transition-colors ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#B0BF00]/10">
                            <Boxes className="h-3.5 w-3.5 text-[#B0BF00]" />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-800">{asset.assetName}</span>
                            <span className="text-[10px] font-mono text-gray-400">{asset.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{asset.category}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{asset.location}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full bg-[#B0BF00]/10 px-2.5 py-1 text-xs font-semibold text-[#7f8f00]">
                          {asset.totalQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {asset.assignedCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-600">
                            Remaining: {asset.remainingQuantity}
                          </span>
                          <span className={`w-fit rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusStyle(asset.assetStatus)}`}>
                            {asset.assetStatus}
                          </span>
                          {asset.maintenanceCount > 0 && (
                            <span className="text-[10px] font-medium text-amber-700">
                              Under Maintenance: {asset.maintenanceCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {canEditAssignments ? (
                            <button
                              onClick={() =>
                                navigate(`/dashboard/add-assignment?assetId=${encodeURIComponent(asset.id)}`)
                              }
                              className="inline-flex items-center gap-1 rounded-xl bg-[#B0BF00] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#9aaa00]"
                              title="Create assignment"
                            >
                              Assign
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">View only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={`flex items-center justify-between border-t px-6 py-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white"}`}>
            <p className="text-xs font-medium text-[#B0BF00]">
              Showing {paginatedAssignableAssets.length} of {assignableAssets.length} assignable assets
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </button>
              <span className="px-1 text-xs text-gray-500">{currentPage} / {assignableTotalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(assignableTotalPages, p + 1))}
                disabled={currentPage === assignableTotalPages}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
          <div className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex-1">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? "border-slate-700 bg-slate-800 text-[#d8e56b]" : "border-[#B0BF00]/20 bg-slate-50 text-[#7f8f00]"}`}>
                <MapPinned className="h-3.5 w-3.5" />
                Assignment Map
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                {selectedDepartment} Floor Map - {selectedDepartment === "IT Department" ? "2nd Floor" : "3rd Floor"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as "IT Department" | "HR Department")}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-[#B0BF00] shadow-sm"
              >
                <option value="IT Department">IT Department</option>
                <option value="HR Department">HR Department</option>
              </select>

              {canEditAssignments && (
                <button
                  onClick={() => navigate("/dashboard/add-assignment")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#B0BF00] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(176,191,0,0.28)] transition-colors hover:bg-[#9aaa00] whitespace-nowrap"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Assignment</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {selectedDepartment === "IT Department" ? (
              <FloorMapIT assignments={itAssignments} />
            ) : (
              <FloorMapHR assignments={hrAssignments} />
            )}
          </div>
        </div>
      )}

      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              {viewTarget?.assignmentId} - {viewTarget?.assetSKU}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 py-1">
              {[
                { label: "Asset", value: viewTarget.assetName },
                { label: "Category", value: viewTarget.assetCategory },
                { label: "Assigned To", value: viewTarget.assignedTo },
                { label: "Department", value: viewTarget.department },
                { label: "Workstation", value: viewTarget.workstation + (viewTarget.seatNumber ? ` (Seat ${viewTarget.seatNumber})` : "") },
                { label: "Floor", value: viewTarget.floor },
                { label: "Date Assigned", value: viewTarget.dateAssigned },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{f.label}</span>
                  <span className="font-medium text-gray-800">{f.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusStyle(viewTarget.status)}`}>
                  {viewTarget.status}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>Close</Button>
            {canEditAssignments && (
              <Button
                size="sm"
                className="bg-[#B0BF00] text-white hover:bg-[#9aaa00]"
                onClick={() => {
                  navigate(`/dashboard/edit-assignment/${viewTarget?.assignmentId}`);
                  setViewTarget(null);
                }}
              >
                <Edit className="mr-1 h-3.5 w-3.5" />
                Edit Assignment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Delete assignment <span className="font-semibold text-gray-800">"{deleteTarget?.assignmentId}"</span> for{" "}
              <span className="font-semibold text-gray-800">{deleteTarget?.assetName}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
