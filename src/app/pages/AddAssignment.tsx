import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ArrowLeft,
  Save,
  UserCheck,
  AlertCircle,
  ClipboardCheck,
  Building2,
  MapPinned,
} from "lucide-react";
import { toast } from "sonner";
import { useAssignments } from "../context/AssignmentsContext";
import { useInventory } from "../context/InventoryContext";

const WORKSTATION_OPTIONS: Record<string, string[]> = {
  "IT Department": ["PROD 1", "PROD 2", "IT Room", "Conference Room", "Front Desk"],
  "HR Department": ["Front Desk", "Conference Room", "HR Room", "Production Area", "IT Room"],
};

const FLOOR_MAPPING: Record<string, string> = {
  "IT Department": "2nd Floor",
  "HR Department": "3rd Floor",
};

type AssignmentStatus = "Assigned" | "Available" | "Under Maintenance";

type FormData = {
  assetId: string;
  assignedTo: string;
  workstation: string;
  seatNumber: string;
  floor: string;
  status: AssignmentStatus;
  dateAssigned: string;
};

const SEAT_NUMBERS: Record<string, number[]> = {
  "PROD 1": [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
  "PROD 2": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 88, 89, 90, 91, 92, 93],
  "Conference Room": [94, 95, 96, 97, 98, 99],
  "IT Room": [100, 101, 102],
  "Front Desk": [103],
};

export default function AddAssignment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { addAssignment, updateAssignment, getAssignment, nextId, assignments } = useAssignments();
  const { inventory } = useInventory();

  const existing = id ? getAssignment(id) : undefined;

  const [selectedAsset, setSelectedAsset] = useState<typeof inventory[0] | null>(() => {
    if (existing) {
      return inventory.find((a) => a.sku === existing.assetSKU) || null;
    }
    return null;
  });

  const [formData, setFormData] = useState<FormData>({
    assetId: existing ? String(inventory.find((a) => a.sku === existing.assetSKU)?.id ?? "") : "",
    assignedTo: existing?.assignedTo === "Unassigned" ? "" : (existing?.assignedTo ?? ""),
    workstation: existing?.workstation ?? "",
    seatNumber: existing?.seatNumber ? String(existing.seatNumber) : "",
    floor: existing?.floor ?? "",
    status: existing?.status ?? "Assigned",
    dateAssigned: existing?.dateAssigned ?? new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (selectedAsset) {
      const department = selectedAsset.location;
      const defaultFloor = FLOOR_MAPPING[department] || "";
      setFormData((prev) => ({
        ...prev,
        floor: defaultFloor,
        workstation: prev.workstation || "",
        seatNumber: "",
      }));
    }
  }, [selectedAsset]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, seatNumber: "" }));
  }, [formData.workstation]);

  const handleAssetSelect = (assetId: string) => {
    const asset = inventory.find((a) => String(a.id) === assetId);
    setSelectedAsset(asset || null);
    setFormData((prev) => ({ ...prev, assetId, workstation: "", seatNumber: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAsset) {
      toast.error("Please select an asset.");
      return;
    }

    if (!formData.assignedTo.trim() || !formData.workstation) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const seatNum = formData.seatNumber.trim() ? parseInt(formData.seatNumber.trim(), 10) : null;

    if (formData.seatNumber.trim() && isNaN(seatNum as number)) {
      toast.error("Please enter a valid seat/PC number.");
      return;
    }

    if (seatNum && !isEditMode) {
      const conflict = assignments.find(
        (a) => a.seatNumber === seatNum && a.assignmentId !== id
      );
      if (conflict) {
        toast.error(`Seat ${seatNum} is already assigned to ${conflict.assignmentId}.`);
        return;
      }
    }

    const record = {
      assignmentId: isEditMode ? id! : nextId(),
      assetName: selectedAsset.assetName,
      assetSKU: selectedAsset.sku,
      assetCategory: selectedAsset.category,
      assignedTo: formData.assignedTo.trim(),
      department: selectedAsset.location,
      workstation: formData.workstation,
      seatNumber: seatNum,
      floor: formData.floor,
      status: formData.status,
      dateAssigned: formData.dateAssigned,
    };

    if (isEditMode) {
      updateAssignment(record);
      toast.success("Assignment updated successfully!");
    } else {
      addAssignment(record);
      toast.success("Assignment created successfully!");
    }

    navigate("/dashboard/assignments");
  };

  const fieldClass =
    "h-11 rounded-xl border border-slate-200 bg-white text-sm shadow-sm transition focus:border-[#B0BF00] focus:ring-4 focus:ring-[#B0BF00]/10";
  const selectClass =
    "h-11 rounded-xl border border-slate-200 bg-white text-sm shadow-sm";

  const workstationOptions = selectedAsset ? WORKSTATION_OPTIONS[selectedAsset.location] || [] : [];
  const showSeatNumberField = Boolean(selectedAsset && formData.workstation);
  const isHRDept = selectedAsset?.location === "HR Department";

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/assignments")}
          className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B0BF00]/10">
            <UserCheck className="h-5 w-5 text-[#B0BF00]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {isEditMode ? "Edit Asset Assignment" : "Create New Asset Assignment"}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode ? "Update assignment details" : "Assign an asset to a user and workstation"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="overflow-hidden rounded-[28px] border border-[#B0BF00]/15 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B0BF00]/20 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f8f00]">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Step 1
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">Select Asset from Inventory</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start with the asset record you want to deploy so the assignment details stay aligned with inventory data.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Asset *</Label>
              <Select value={formData.assetId} onValueChange={handleAssetSelect}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select asset from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((asset) => (
                    <SelectItem key={asset.id} value={String(asset.id)}>
                      {asset.assetName} ({asset.sku}) - {asset.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAsset && (
              <div className="rounded-3xl border border-sky-200 bg-sky-50/80 p-5">
                <div className="mb-3 flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
                  <p className="text-sm font-medium text-sky-900">Asset details auto-filled from inventory</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "SKU", value: selectedAsset.sku, mono: true },
                    { label: "Category", value: selectedAsset.category },
                    { label: "Brand", value: selectedAsset.brand },
                    { label: "Model", value: selectedAsset.model },
                    { label: "Serial Number", value: selectedAsset.serialNumber, mono: true },
                    { label: "Condition", value: selectedAsset.condition },
                    { label: "Department (from Inventory)", value: selectedAsset.location },
                    { label: "Unit Price", value: `PHP ${selectedAsset.price.toLocaleString()}` },
                  ].map((f) => (
                    <div key={f.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">{f.label}</p>
                      <p className={`text-sm text-sky-950 ${f.mono ? "font-mono" : ""} ${f.label.includes("Department") ? "font-semibold" : ""}`}>
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedAsset && (
          <div className="overflow-hidden rounded-[28px] border border-[#B0BF00]/15 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#B0BF00]/20 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7f8f00]">
                <Building2 className="h-3.5 w-3.5" />
                Step 2
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">Assignment Details</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Complete the assignee, workstation, and location details to create a clear assignment record.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 md:col-span-2">
                <Label className="text-xs font-medium text-slate-600">Assigned To (Full Name) *</Label>
                <Input
                  placeholder="e.g., Juan dela Cruz"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                  className={fieldClass}
                />
                <p className="text-xs italic text-slate-500">
                  Enter the employee&apos;s full name. No separate employee record is required first.
                </p>
              </div>

              <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <Label className="text-xs font-medium text-slate-600">Department</Label>
                <Input value={selectedAsset.location} readOnly className={`${fieldClass} cursor-not-allowed bg-gray-50`} />
                <p className="text-xs italic text-slate-500">Auto-filled from the asset location in inventory.</p>
              </div>

              <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <Label className="text-xs font-medium text-slate-600">Workstation *</Label>
                <Select value={formData.workstation} onValueChange={(v) => setFormData({ ...formData, workstation: v, seatNumber: "" })}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select workstation" />
                  </SelectTrigger>
                  <SelectContent>
                    {workstationOptions.map((ws) => (
                      <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs italic text-slate-500">
                  {selectedAsset.location === "IT Department"
                    ? "IT Department: PROD 1, PROD 2, IT Room, Conference Room, Front Desk"
                    : "HR Department workstations available"}
                </p>
              </div>

              {showSeatNumberField && (
                <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <Label className="text-xs font-medium text-slate-600">
                    {isHRDept ? "Seat Number" : "Seat Number / PC Number"}
                  </Label>
                  <Input
                    type="text"
                    placeholder={isHRDept ? "e.g., 1, 25, 42" : "e.g., 1, 25, PC-101"}
                    value={formData.seatNumber}
                    onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                    className={fieldClass}
                  />
                  <p className="text-xs italic text-slate-500">
                    Enter the seat or PC number for floor map reference if available.
                  </p>
                </div>
              )}

              <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <Label className="text-xs font-medium text-slate-600">Floor Area</Label>
                <Input value={formData.floor} readOnly className={`${fieldClass} cursor-not-allowed bg-gray-50`} />
                <p className="text-xs italic text-slate-500">
                  Auto-filled: {selectedAsset.location === "IT Department" ? "IT Dept -> 2nd Floor" : "HR Dept -> 3rd Floor"}
                </p>
              </div>

              <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <Label className="text-xs font-medium text-slate-600">Date Assigned</Label>
                <Input
                  type="date"
                  value={formData.dateAssigned}
                  onChange={(e) => setFormData({ ...formData, dateAssigned: e.target.value })}
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1.5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <Label className="text-xs font-medium text-slate-600">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as AssignmentStatus })}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {selectedAsset && (
          <div className="flex flex-col gap-3 pb-2 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B0BF00] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(176,191,0,0.28)] transition-colors hover:bg-[#9aaa00]"
            >
              <Save className="h-4 w-4" />
              {isEditMode ? "Update Assignment" : "Create Assignment"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/assignments")}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}

        {!selectedAsset && (
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10 text-center shadow-sm">
            <MapPinned className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Select an asset to continue</p>
            <p className="mt-1 text-xs text-slate-400">
              Choose an asset from the inventory to begin creating the assignment
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
