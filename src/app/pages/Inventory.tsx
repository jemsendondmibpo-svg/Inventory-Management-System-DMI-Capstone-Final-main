import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  Search,
  Boxes,
  AlertTriangle,
  CircleDollarSign,
  ShieldCheck,
  PackagePlus,
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useInventory, InventoryAsset } from "../context/InventoryContext";
import { useAuth } from "../context/AuthContext";
import { canManageInventory } from "../lib/access";

const CATEGORY_STYLES: Record<string, { light: string; dark: string }> = {
  "System Unit": {
    light: "bg-blue-100 text-blue-700",
    dark: "bg-blue-500/15 text-blue-300",
  },
  Monitor: {
    light: "bg-teal-100 text-teal-700",
    dark: "bg-teal-500/15 text-teal-300",
  },
  Keyboard: {
    light: "bg-purple-100 text-purple-700",
    dark: "bg-purple-500/15 text-purple-300",
  },
  Mouse: {
    light: "bg-green-100 text-green-700",
    dark: "bg-green-500/15 text-green-300",
  },
  Headset: {
    light: "bg-orange-100 text-orange-700",
    dark: "bg-orange-500/15 text-orange-300",
  },
  Webcam: {
    light: "bg-indigo-100 text-indigo-700",
    dark: "bg-indigo-500/15 text-indigo-300",
  },
  Extra: {
    light: "bg-gray-100 text-gray-600",
    dark: "bg-slate-700 text-slate-200",
  },
};

const ITEMS_PER_PAGE = 8;

const ASSET_TYPE_PREFIXES: Record<string, string> = {
  "System Unit": "SYS",
  Monitor: "MON",
  Keyboard: "KBD",
  Mouse: "MSE",
  Headset: "HDS",
  Webcam: "WCM",
  Extra: "EXT",
};

const BRAND_CODES: Record<string, string> = {
  Dell: "DL",
  HP: "HP",
  Logitech: "LG",
  Samsung: "SM",
  LG: "LG",
  Razer: "RZ",
  Jabra: "JB",
  Microsoft: "MS",
  Keychron: "KC",
  Apple: "AP",
  Acer: "AC",
  Asus: "AS",
};

function generateSKU(assetType: string, brand: string, id: number): string {
  const typeCode = ASSET_TYPE_PREFIXES[assetType] || "AST";
  const brandCode = BRAND_CODES[brand] || brand.slice(0, 2).toUpperCase();
  const num = String(id).padStart(3, "0");
  return `${typeCode}-${brandCode}-${num}`;
}

export default function Inventory() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const { inventory, addAsset, updateAsset, deleteAsset, loading } = useInventory();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [filterAssetStatus, setFilterAssetStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<InventoryAsset | null>(null);
  const [viewTarget, setViewTarget] = useState<InventoryAsset | null>(null);
  const [editTarget, setEditTarget] = useState<InventoryAsset | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const canEditInventory = user ? canManageInventory(user.role) : false;
  const isDark = resolvedTheme === "dark";

  // Form state
  const [formData, setFormData] = useState({
    assetType: "",
    brand: "",
    model: "",
    serialNumber: "",
    quantity: "",
    minQuantity: "",
    price: "",
    assetStatus: "",
    condition: "",
    purchaseDate: "",
    location: "",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0BF00] mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const filtered = inventory.filter((asset) => {
    // Search logic
    const q = search.toLowerCase();
    const matchSearch = !search ||
      asset.assetName.toLowerCase().includes(q) ||
      asset.sku.toLowerCase().includes(q) ||
      asset.brand.toLowerCase().includes(q) ||
      asset.model.toLowerCase().includes(q) ||
      asset.serialNumber.toLowerCase().includes(q) ||
      asset.category.toLowerCase().includes(q) ||
      asset.location.toLowerCase().includes(q) ||
      asset.locationCode.toLowerCase().includes(q);
    
    // Filter logic
    const catOk = filterCategory === "all" || asset.category === filterCategory;
    const stockStatusOk = filterStockStatus === "all" || asset.stockStatus === filterStockStatus;
    const assetStatusOk = filterAssetStatus === "all" || asset.assetStatus === filterAssetStatus;
    const purchaseDateValue = asset.purchaseDate ? new Date(asset.purchaseDate) : null;
    const startDateValue = filterStartDate ? new Date(filterStartDate) : null;
    const endDateValue = filterEndDate ? new Date(filterEndDate) : null;
    if (purchaseDateValue) {
      purchaseDateValue.setHours(0, 0, 0, 0);
    }
    if (startDateValue) {
      startDateValue.setHours(0, 0, 0, 0);
    }
    if (endDateValue) {
      endDateValue.setHours(23, 59, 59, 999);
    }
    const dateOk =
      (!startDateValue || !purchaseDateValue || purchaseDateValue >= startDateValue) &&
      (!endDateValue || !purchaseDateValue || purchaseDateValue <= endDateValue);
    
    return matchSearch && catOk && stockStatusOk && assetStatusOk && dateOk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!canEditInventory) {
      toast.error("You have view-only access to Inventory.");
      return;
    }
    if (!deleteTarget) return;
    try {
      await deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleOpenAddModal = () => {
    if (!canEditInventory) {
      toast.error("You have view-only access to Inventory.");
      return;
    }
    setFormData({
      assetType: "",
      brand: "",
      model: "",
      serialNumber: "",
      quantity: "",
      minQuantity: "",
      price: "",
      assetStatus: "",
      condition: "",
      purchaseDate: "",
      location: "",
    });
    setAddModalOpen(true);
    setEditTarget(null);
  };

  const handleOpenEditModal = (asset: InventoryAsset) => {
    if (!canEditInventory) {
      toast.error("You have view-only access to Inventory.");
      return;
    }
    setFormData({
      assetType: asset.category,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      quantity: String(asset.quantity),
      minQuantity: String(asset.minQuantity),
      price: String(asset.price),
      assetStatus: asset.assetStatus,
      condition: asset.condition,
      purchaseDate: asset.purchaseDate,
      location: `${asset.location} (${asset.locationCode})`,
    });
    setEditTarget(asset);
    setAddModalOpen(true);
    setViewTarget(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditInventory) {
      toast.error("You have view-only access to Inventory.");
      return;
    }

    const assetType = formData.assetType.trim();

    if (!assetType || !formData.brand || !formData.model) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Parse location
    const locationMatch = formData.location.match(/^(.+?)\s*\(([^)]+)\)$/);
    const location = locationMatch ? locationMatch[1] : formData.location;
    const locationCode = locationMatch ? locationMatch[2] : "";

    // Calculate stock status based on quantity
    let stockStatus: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock";
    const qty = Number(formData.quantity) || 0;
    const minQty = Number(formData.minQuantity) || 0;
    if (qty === 0) {
      stockStatus = "Out of Stock";
    } else if (qty <= minQty) {
      stockStatus = "Low Stock";
    }

    try {
      if (editTarget) {
        // Update existing asset
        await updateAsset({
          ...editTarget,
          assetName: `${formData.brand} ${formData.model}`,
          category: assetType,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber,
          quantity: qty,
          minQuantity: minQty,
          price: Number(formData.price) || 0,
          stockStatus: stockStatus,
          assetStatus: formData.assetStatus as "Available" | "Assigned" | "Under Maintenance" | "Defective",
          condition: formData.condition,
          purchaseDate: formData.purchaseDate,
          location,
          locationCode,
        });
      } else {
        // Add new asset - generate SKU
        const nextId = Math.max(...inventory.map((a) => {
          const match = a.sku.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        }), 0) + 1;
        
        const sku = generateSKU(assetType, formData.brand, nextId);

        await addAsset({
          assetName: `${formData.brand} ${formData.model}`,
          sku: sku,
          category: assetType,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber,
          quantity: qty,
          minQuantity: minQty,
          price: Number(formData.price) || 0,
          stockStatus: stockStatus,
          assetStatus: formData.assetStatus as "Available" | "Assigned" | "Under Maintenance" | "Defective",
          condition: formData.condition,
          purchaseDate: formData.purchaseDate,
          location,
          locationCode,
        });
      }

      setAddModalOpen(false);
      setEditTarget(null);
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const getStockStatusStyle = (status: string) => {
    switch (status) {
      case "In Stock":
        return "text-green-600";
      case "Low Stock":
        return "text-orange-500";
      case "Out of Stock":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStockStatusDot = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500";
      case "Low Stock":
        return "bg-orange-400";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getAssetStatusStyle = (status: string) => {
    switch (status) {
      case "Available":
        return isDark ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-green-100 text-green-700 border-green-200";
      case "Assigned":
        return isDark ? "bg-sky-500/15 text-sky-300 border-sky-500/20" : "bg-blue-100 text-blue-700 border-blue-200";
      case "Under Maintenance":
        return isDark ? "bg-amber-500/15 text-amber-300 border-amber-500/20" : "bg-orange-100 text-orange-700 border-orange-200";
      case "Defective":
        return isDark ? "bg-rose-500/15 text-rose-300 border-rose-500/20" : "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryStyle = (category: string) => {
    const style = CATEGORY_STYLES[category];
    if (!style) {
      return isDark ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-600";
    }
    return isDark ? style.dark : style.light;
  };

  const categories = Array.from(
    new Set(
      [
        "System Unit",
        "Monitor",
        "Keyboard",
        "Mouse",
        "Headset",
        "Webcam",
        ...inventory
          .map((asset) => asset.category?.trim())
          .filter((category): category is string => Boolean(category && category !== "Extra")),
      ],
    ),
  );

  const fieldClass =
    "h-11 rounded-xl border border-slate-200 bg-white text-sm shadow-sm transition focus:border-[#B0BF00] focus:ring-4 focus:ring-[#B0BF00]/10";
  const totalInventoryValue = inventory.reduce((sum, asset) => sum + asset.price * asset.quantity, 0);
  const lowStockCount = inventory.filter((asset) => asset.stockStatus !== "In Stock").length;
  const availableCount = inventory.filter((asset) => asset.assetStatus === "Available").length;
  const statCards = [
    {
      title: "Asset Types",
      value: inventory.length,
      description: "Tracked assets in the inventory list",
      icon: Boxes,
      accent: "from-lime-100 via-white to-lime-50",
      iconClass: "text-[#93a300]",
    },
    {
      title: "Attention Needed",
      value: lowStockCount,
      description: "Items low in stock or out of stock",
      icon: AlertTriangle,
      accent: "from-orange-100 via-white to-amber-50",
      iconClass: "text-orange-500",
    },
    {
      title: "Inventory Value",
      value: `PHP ${totalInventoryValue.toLocaleString()}`,
      description: "Estimated value based on quantity and unit price",
      icon: CircleDollarSign,
      accent: "from-emerald-100 via-white to-emerald-50",
      iconClass: "text-emerald-600",
    },
    {
      title: "Available Assets",
      value: availableCount,
      description: "Ready for assignment or deployment",
      icon: ShieldCheck,
      accent: "from-sky-100 via-white to-sky-50",
      iconClass: "text-sky-600",
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`overflow-hidden rounded-3xl border p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {card.title}
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

      {/* Stock List Card */}
      <div className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#B0BF00]/15 bg-white"}`}>
        {/* Stock List Header */}
        <div className={`border-b px-4 py-5 md:px-6 md:py-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? "border-slate-700 bg-slate-800 text-[#d8e56b]" : "border-[#B0BF00]/20 bg-slate-50 text-[#7f8f00]"}`}>
                <Boxes className="h-3.5 w-3.5" />
                Inventory Module
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Inventory Assets
              </h3>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Search */}
            <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm sm:w-64">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filter
                {(filterCategory !== "all" || filterStockStatus !== "all" || filterAssetStatus !== "all" || filterStartDate || filterEndDate) && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-[#B0BF00]" />
                )}
              </button>

            {/* Add Asset Button */}
            {canEditInventory && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B0BF00] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(176,191,0,0.28)] transition-colors hover:bg-[#9aaa00]"
              >
                <PackagePlus className="h-4 w-4" />
                <span>Add New Asset</span>
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-4 md:gap-4 md:px-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Types</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Stock:</span>
              <select
                value={filterStockStatus}
                onChange={(e) => { setFilterStockStatus(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Stock</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Asset Status:</span>
              <select
                value={filterAssetStatus}
                onChange={(e) => { setFilterAssetStatus(e.target.value); setCurrentPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Defective">Defective</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Start Date:</span>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                className="h-10 w-40 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#B0BF00]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">End Date:</span>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                className="h-10 w-40 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-[#B0BF00]"
              />
            </div>
            {(filterCategory !== "all" || filterStockStatus !== "all" || filterAssetStatus !== "all" || filterStartDate || filterEndDate) && (
                <button
                onClick={() => { setFilterCategory("all"); setFilterStockStatus("all"); setFilterAssetStatus("all"); setFilterStartDate(""); setFilterEndDate(""); setCurrentPage(1); }}
                className="text-xs font-medium text-[#8fa100] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
                <tr className={`${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-slate-50"} border-b`}>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Asset Name
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Asset Status
                </th>
                <th className="text-right px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-100"}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400 italic">
                    No assets found.
                  </td>
                </tr>
              ) : (
                paginated.map((asset) => (
                  <tr
                    key={asset.id}
                    className={`transition-colors ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                  >
                    {/* Asset Name */}
                    <td className="px-6 py-3.5">
                      <div>
                        <span className="text-sm font-medium text-gray-800 block">
                          {asset.assetName}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          <span
                            className={`text-[11px] ${
                              (asset.location === "HR Department" && asset.locationCode === "MMS") ||
                              (asset.location === "IT Department" && asset.locationCode === "JMS")
                                ? isDark
                                  ? "text-white"
                                  : "text-slate-800"
                                : "text-indigo-600"
                            }`}
                          >
                            {asset.location} ({asset.locationCode})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400 font-mono">{asset.sku}</span>
                    </td>

                    {/* Category Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          getCategoryStyle(asset.category)
                        }`}
                      >
                        {asset.category}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-800 block">
                        {asset.quantity}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Min: {asset.minQuantity}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700">
                        ₱{asset.price.toLocaleString()}
                      </span>
                    </td>

                    {/* Stock Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStockStatusStyle(asset.stockStatus)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getStockStatusDot(asset.stockStatus)}`} />
                        {asset.stockStatus}
                      </span>
                    </td>

                    {/* Asset Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${getAssetStatusStyle(asset.assetStatus)}`}
                      >
                        {asset.assetStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewTarget(asset)}
                          className={`rounded-lg p-1.5 transition-colors ${isDark ? "text-slate-500 hover:bg-blue-500/10 hover:text-blue-300" : "text-gray-400 hover:bg-blue-50 hover:text-blue-500"}`}
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEditInventory && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(asset)}
                              className={`rounded-lg p-1.5 transition-colors ${isDark ? "text-slate-500 hover:bg-[#B0BF00]/15 hover:text-[#d8e56b]" : "text-gray-400 hover:bg-[#B0BF00]/10 hover:text-[#B0BF00]"}`}
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(asset)}
                              className={`rounded-lg p-1.5 transition-colors ${isDark ? "text-slate-500 hover:bg-red-500/10 hover:text-red-300" : "text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <div className={`flex items-center justify-between px-6 py-3 border-t ${isDark ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white"}`}>
          <p className="text-xs text-gray-500 font-medium">
            Showing {paginated.length} of {filtered.length} assets
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </button>
            <span className="text-xs text-gray-500 px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-800">
                "{deleteTarget?.assetName}"
              </span>{" "}
              from inventory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Asset Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewTarget?.assetName}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 py-2">
              {/* Asset Name & SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Asset Name</p>
                  <p className="text-sm text-gray-800">{viewTarget.assetName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">SKU</p>
                  <p className="text-sm text-gray-800 font-mono">{viewTarget.sku}</p>
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Brand</p>
                  <p className="text-sm text-gray-800">{viewTarget.brand}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Model</p>
                  <p className="text-sm text-gray-800">{viewTarget.model}</p>
                </div>
              </div>

              {/* Category & Serial Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Category</p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      getCategoryStyle(viewTarget.category)
                    }`}
                  >
                    {viewTarget.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Serial Number</p>
                  <p className="text-sm text-gray-800 font-mono">{viewTarget.serialNumber}</p>
                </div>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Quantity</p>
                  <p className="text-sm text-gray-800">
                    {viewTarget.quantity}{" "}
                    <span className="text-xs text-gray-400">(Min: {viewTarget.minQuantity})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Unit Price</p>
                  <p className="text-sm text-gray-800">₱{viewTarget.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Stock Status & Asset Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Stock Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStockStatusStyle(viewTarget.stockStatus)}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${getStockStatusDot(viewTarget.stockStatus)}`} />
                    {viewTarget.stockStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Asset Status</p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${getAssetStatusStyle(viewTarget.assetStatus)}`}
                  >
                    {viewTarget.assetStatus}
                  </span>
                </div>
              </div>

              {/* Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Condition</p>
                  <p className="text-sm text-gray-800">{viewTarget.condition}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Purchase Date</p>
                  <p className="text-sm text-gray-800">
                    {viewTarget.purchaseDate ? new Date(viewTarget.purchaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }) : "—"}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  <p className="text-sm text-indigo-600">
                    {viewTarget.location} ({viewTarget.locationCode})
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            {canEditInventory && (
              <Button
                size="sm"
                className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white"
                onClick={() => {
                  if (viewTarget) {
                    handleOpenEditModal(viewTarget);
                  }
                }}
              >
                Edit Asset
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Asset Dialog */}
      <Dialog
        open={addModalOpen}
        onOpenChange={(open) => {
          if (!canEditInventory) return;
          setAddModalOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/80 bg-white p-0 shadow-[0_32px_80px_rgba(15,23,42,0.18)] sm:max-w-3xl">
          <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-[#f7fad8] via-white to-[#eef3c2] px-6 py-5 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#B0BF00]/20 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f8f00]">
              <PackagePlus className="h-3.5 w-3.5" />
              Asset Form
            </div>
            <DialogTitle className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {editTarget ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {editTarget
                ? "Update the asset details below to keep the inventory accurate and assignment-ready."
                : "Provide the key asset details below to create a complete and presentable inventory record."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-5 px-6 py-6">
            {/* Asset Information */}
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Asset Information
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Define the basic identifying details for this inventory item.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Asset Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Asset Type *</Label>
                  <Input
                    list="inventory-category-options"
                    placeholder="Type or pick a category"
                    value={formData.assetType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assetType: e.target.value }))}
                    required
                    className={fieldClass}
                  />
                  <datalist id="inventory-category-options">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <p className="text-xs italic text-slate-500">
                    You can type a new category or choose one from the suggestions.
                  </p>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Brand *</Label>
                  <Input
                    placeholder="e.g., Dell, HP, Logitech"
                    value={formData.brand}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    required
                    className={fieldClass}
                  />
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Model *</Label>
                  <Input
                    placeholder="e.g., OptiPlex 7090"
                    value={formData.model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                    required
                    className={fieldClass}
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Serial Number</Label>
                  <Input
                    placeholder="e.g., DL-SU-78321"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Stock & Pricing */}
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Stock And Pricing
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Capture the quantity thresholds and current pricing information.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Quantity *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                    min="0"
                    className={fieldClass}
                  />
                </div>

                {/* Min Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Minimum Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minQuantity: e.target.value }))}
                    min="0"
                    className={fieldClass}
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Unit Price (PHP)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    min="0"
                    step="0.01"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Status & Condition */}
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Status And Condition
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Set the asset availability, condition, and lifecycle details.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Asset Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Asset Status *</Label>
                  <Select
                    value={formData.assetStatus}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, assetStatus: value }))}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Defective">Defective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Purchase Date</Label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Location
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Assign the department or storage location where this asset belongs.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Department (JMS)">IT Department (JMS)</SelectItem>
                    <SelectItem value="HR Department (MMS)">HR Department (MMS)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-slate-500">
                  Select the department location where this asset will be stored or managed.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <DialogFooter className="gap-3 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 rounded-xl border-slate-200 px-5 text-slate-600"
                onClick={() => { setAddModalOpen(false); setEditTarget(null); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-11 rounded-xl bg-[#B0BF00] px-5 text-white hover:bg-[#9aaa00]"
              >
                {editTarget ? "Update Asset" : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
