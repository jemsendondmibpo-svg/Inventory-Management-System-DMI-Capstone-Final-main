import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export interface Assignment {
  assignmentId: string;
  assetId?: string;
  assetName: string;
  assetSKU: string;
  assetCategory: string;
  assignedTo: string;
  department: string;
  workstation: string;
  seatNumber?: number | null;
  floor: string;
  status: "Available" | "Assigned" | "Under Maintenance" | "Defective";
  dateAssigned: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (a: Assignment) => Promise<void>;
  updateAssignment: (a: Assignment) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  getAssignment: (id: string) => Assignment | undefined;
  nextId: () => string;
  loading: boolean;
  error: string | null;
}

const AssignmentsContext = createContext<AssignmentsContextType | null>(null);

export function AssignmentsProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();

    // Set up real-time subscription for assignments updates
    const channel = supabase
      .channel("assignments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        (payload) => {
          console.log("Real-time assignment change detected:", payload);
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("assignments")
        .select(`
          *,
          assets (
            asset_name,
            sku,
            asset_type
          )
        `)
        .order("date_assigned", { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const mappedAssignments: Assignment[] = data.map((item: any) => ({
          assignmentId: item.assignment_id,
          assetId: item.asset_id || undefined,
          assetName: item.assets?.asset_name || "Unknown Asset",
          assetSKU: item.assets?.sku || "",
          assetCategory: item.assets?.asset_type || "Extra",
          assignedTo: item.assigned_to_name || "Unassigned",
          department: item.department || "N/A",
          workstation: item.workstation || "N/A",
          seatNumber: item.seat_number,
          floor: item.floor || "N/A",
          status: item.status as "Available" | "Assigned" | "Under Maintenance" | "Defective",
          dateAssigned: item.date_assigned || "",
          createdAt: item.created_at || "",
          updatedAt: item.updated_at || "",
        }));

        setAssignments(mappedAssignments);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const resolveAssetForAssignment = async (assetSKU: string) => {
    const { data: asset, error } = await supabase
      .from("assets")
      .select("asset_id, quantity, sku, status")
      .eq("sku", assetSKU)
      .single();

    if (error || !asset) {
      throw error || new Error("Asset not found");
    }

    return asset;
  };

  const countAssignedUnits = (
    assetId: string,
    assetSKU: string,
    excludedAssignmentId?: string
  ) =>
    assignments.filter(
      (assignment) =>
        assignment.assignmentId !== excludedAssignmentId &&
        assignment.status === "Assigned" &&
        (assignment.assetId === assetId || assignment.assetSKU === assetSKU)
    ).length;

  const ensureAssignableCapacity = async (
    assetSKU: string,
    excludedAssignmentId?: string
  ) => {
    const asset = await resolveAssetForAssignment(assetSKU);
    const assignedCount = countAssignedUnits(asset.asset_id, assetSKU, excludedAssignmentId);
    const totalQuantity = Number(asset.quantity || 0);

    if (asset.status === "Defective") {
      throw new Error("Defective assets cannot be assigned.");
    }

    if (asset.status === "Under Maintenance") {
      throw new Error("Assets under maintenance cannot be assigned.");
    }

    if (assignedCount >= totalQuantity) {
      throw new Error("All units of this asset are already assigned.");
    }

    return asset;
  };

  const addAssignment = async (a: Assignment) => {
    try {
      const asset = await resolveAssetForAssignment(a.assetSKU);

      if (a.status === "Assigned") {
        await ensureAssignableCapacity(a.assetSKU);
      }

      const { error: insertError } = await supabase
        .from("assignments")
        .insert([
          {
            asset_id: asset.asset_id,
            assigned_to_name: a.assignedTo,
            department: a.department,
            workstation: a.workstation,
            seat_number: a.seatNumber,
            floor: a.floor,
            status: a.status,
            date_assigned: a.dateAssigned,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchAssignments();

      toast.success("Assignment added successfully!");
    } catch (err) {
      console.error("Error adding assignment:", err);
      throw err;
    }
  };

  const updateAssignment = async (a: Assignment) => {
    try {
      const existingAssignment = assignments.find((item) => item.assignmentId === a.assignmentId);

      if (!existingAssignment) {
        throw new Error("Unable to locate the existing assignment record.");
      }

      const targetAssetSku = a.assetSKU || existingAssignment.assetSKU;
      const targetAsset = await resolveAssetForAssignment(targetAssetSku);

      if (a.status === "Assigned") {
        await ensureAssignableCapacity(targetAssetSku, a.assignmentId);
      }

      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          asset_id: targetAsset.asset_id,
          assigned_to_name: a.assignedTo,
          department: a.department,
          workstation: a.workstation,
          seat_number: a.seatNumber,
          floor: a.floor,
          status: a.status,
          date_assigned: a.dateAssigned,
        })
        .eq("assignment_id", a.assignmentId);

      if (updateError) throw updateError;

      await fetchAssignments();

      toast.success("Assignment updated successfully!");
    } catch (err) {
      console.error("Error updating assignment:", err);
      throw err;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("assignment_id", id);

      if (deleteError) throw deleteError;

      await fetchAssignments();

      toast.success("Assignment deleted successfully!");
    } catch (err) {
      console.error("Error deleting assignment:", err);
      throw err;
    }
  };

  const getAssignment = (id: string) => assignments.find((x) => x.assignmentId === id);

  const nextId = () => {
    const nums = assignments.map((a) => parseInt(a.assignmentId.replace("ASG-", ""), 10)).filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `ASG-${String(max + 1).padStart(3, "0")}`;
  };

  return (
    <AssignmentsContext.Provider value={{ assignments, addAssignment, updateAssignment, deleteAssignment, getAssignment, nextId, loading, error }}>
      {children}
    </AssignmentsContext.Provider>
  );
}

export function useAssignments() {
  const ctx = useContext(AssignmentsContext);
  if (!ctx) throw new Error("useAssignments must be used within AssignmentsProvider");
  return ctx;
}
