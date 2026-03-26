import { useState } from "react";
import { useTheme } from "next-themes";
import { Edit, Trash2, Plus, Monitor, Keyboard, Mouse, Headphones, Camera, Cpu, Package } from "lucide-react";
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
import { useInventory } from "../context/InventoryContext";

interface ItemCategory {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeStyle: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: string;
  editable: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "System Unit": Cpu,
  "Monitor": Monitor,
  "Keyboard": Keyboard,
  "Mouse": Mouse,
  "Headset": Headphones,
  "Webcam": Camera,
  "Extra": Package,
};

const CATEGORY_COLORS: Record<string, { iconBg: string; iconColor: string; badgeStyle: string }> = {
  "System Unit": { iconBg: "bg-blue-50", iconColor: "text-blue-500", badgeStyle: "bg-blue-100 text-blue-700" },
  "Monitor": { iconBg: "bg-teal-50", iconColor: "text-teal-500", badgeStyle: "bg-teal-100 text-teal-700" },
  "Keyboard": { iconBg: "bg-purple-50", iconColor: "text-purple-500", badgeStyle: "bg-purple-100 text-purple-700" },
  "Mouse": { iconBg: "bg-green-50", iconColor: "text-green-500", badgeStyle: "bg-green-100 text-green-700" },
  "Headset": { iconBg: "bg-orange-50", iconColor: "text-orange-500", badgeStyle: "bg-orange-100 text-orange-700" },
  "Webcam": { iconBg: "bg-indigo-50", iconColor: "text-indigo-500", badgeStyle: "bg-indigo-100 text-indigo-700" },
  "Extra": { iconBg: "bg-gray-50", iconColor: "text-gray-500", badgeStyle: "bg-gray-100 text-gray-600" },
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "System Unit": "Desktop computers and tower PCs used at BPO workstations.",
  "Monitor": "Display screens for agent and team leader workstations.",
  "Keyboard": "Input keyboards for daily agent use across all floors.",
  "Mouse": "Optical and wireless mice assigned to each workstation.",
  "Headset": "Noise-cancelling headsets essential for call center agents.",
  "Webcam": "HD webcams for video conferencing and virtual meetings.",
  "Extra": "Miscellaneous IT accessories, cables, adapters, and spare parts.",
};

export default function Categories() {
  const { resolvedTheme } = useTheme();
  const { inventory, loading } = useInventory();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemCategory | null>(null);
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const isDark = resolvedTheme === "dark";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0BF00] mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Calculate categories from real inventory data
  const categories: ItemCategory[] = Object.entries(
    inventory.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) {
        acc[cat] = { inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
      }
      
      if (item.stockStatus === "In Stock") {
        acc[cat].inStock += item.quantity;
      } else if (item.stockStatus === "Low Stock") {
        acc[cat].lowStock += item.quantity;
      } else if (item.stockStatus === "Out of Stock") {
        acc[cat].outOfStock += item.quantity;
      }
      
      acc[cat].totalValue += item.price * item.quantity;
      return acc;
    }, {} as Record<string, { inStock: number; lowStock: number; outOfStock: number; totalValue: number }>)
  ).map(([name, stats], index) => {
    const palette = CATEGORY_COLORS[name] || {
      iconBg: "bg-gray-50",
      iconColor: "text-gray-500",
      badgeStyle: "bg-gray-100 text-gray-600",
    };

    return ({
    id: index + 1,
    name,
    description: CATEGORY_DESCRIPTIONS[name] || "Category description",
    icon: CATEGORY_ICONS[name] || Package,
    iconBg: isDark
      ? palette.iconBg
          .replace("50", "500/15")
          .replace("gray-50", "slate-700")
      : palette.iconBg,
    iconColor: isDark
      ? palette.iconColor
          .replace("500", "300")
          .replace("gray-500", "text-slate-200")
      : palette.iconColor,
    badgeStyle: isDark
      ? palette.badgeStyle
          .replace("100", "500/15")
          .replace("700", "300")
          .replace("gray-100", "bg-slate-700")
          .replace("gray-600", "text-slate-200")
      : palette.badgeStyle,
    inStock: stats.inStock,
    lowStock: stats.lowStock,
    outOfStock: stats.outOfStock,
    totalValue: `₱${stats.totalValue.toLocaleString()}`,
    editable: name === "Extra", // Only Extra category is editable
  })});

  const totalItems = categories.reduce((s, c) => s + c.inStock + c.lowStock + c.outOfStock, 0);
  const totalInStock = categories.reduce((s, c) => s + c.inStock, 0);
  const totalAlerts = categories.reduce((s, c) => s + c.lowStock + c.outOfStock, 0);

  const handleAdd = () => {
    if (!newCat.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    toast.info("Adding custom categories is not supported in this version. Categories are managed through inventory items.");
    setNewCat({ name: "", description: "" });
    setAddOpen(false);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    toast.info("Category editing is not supported in this version. Categories are automatically managed based on inventory.");
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.error("Cannot delete categories. Categories are automatically managed based on inventory items.");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Categories", value: categories.length, color: "text-gray-800" },
          { label: "Total Items In Stock", value: totalInStock, color: "text-green-600" },
          { label: "Low / Out of Stock", value: totalAlerts, color: "text-red-500" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 px-5 py-4 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Item Categories</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {categories.length} categories · {totalItems} total items tracked
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B0BF00] hover:bg-[#9aaa00] text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const total = cat.inStock + cat.lowStock + cat.outOfStock;
          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className={`${cat.iconBg} ${cat.iconColor} p-2.5 rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${cat.badgeStyle}`}
                >
                  {total} items
                </span>
              </div>

              {/* Name & desc */}
              <h4 className="text-sm font-semibold text-gray-800">{cat.name}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cat.description}</p>

              {/* Stock breakdown */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-gray-500">{cat.inStock} in stock</span>
                </div>
                {cat.lowStock > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span className="text-[10px] text-gray-500">{cat.lowStock} low</span>
                  </div>
                )}
                {cat.outOfStock > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-[10px] text-gray-500">{cat.outOfStock} out</span>
                  </div>
                )}
              </div>

              {/* Total value */}
              <div className="mt-2 text-xs text-gray-400">
                Total value: <span className="font-semibold text-gray-600">{cat.totalValue}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B0BF00] rounded-full transition-all"
                  style={{ width: total > 0 ? `${(cat.inStock / total) * 100}%` : "0%" }}
                />
              </div>

              {/* Actions (only editable custom categories) */}
              {cat.editable && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setEditTarget({ ...cat })}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#B0BF00] transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setNewCat({ name: "", description: "" }); }}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a custom item category for your inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Category Name *</Label>
              <Input
                placeholder="e.g., UPS / Battery Backup"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="h-9 text-sm rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="Brief description..."
                value={newCat.description}
                onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                className="h-9 text-sm rounded-lg border-gray-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white" onClick={handleAdd}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Category Name</Label>
                <Input
                  value={editTarget.name}
                  onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                  className="h-9 text-sm rounded-lg border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                  value={editTarget.description}
                  onChange={(e) => setEditTarget({ ...editTarget, description: e.target.value })}
                  className="h-9 text-sm rounded-lg border-gray-200"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button size="sm" className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white" onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Delete <span className="font-semibold text-gray-800">"{deleteTarget?.name}"</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
