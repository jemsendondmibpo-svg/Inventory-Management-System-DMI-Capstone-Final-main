import { useState } from "react";
import { useTheme } from "next-themes";
import { Assignment } from "../context/AssignmentsContext";

interface Props {
  assignments: Assignment[];
  onSeatClick?: (assignment: Assignment | null, seatPosition: number) => void;
}

// ----- Status color logic -----
type SeatStatus = "assigned" | "available" | "undermaintenance" | "defective" | "unoccupied";

function getStatusFromAssignment(assignment: Assignment): SeatStatus {
  const s = assignment.status.toLowerCase();
  return s === "assigned"
    ? "assigned"
    : s === "under maintenance"
    ? "undermaintenance"
    : s === "defective"
    ? "defective"
    : s === "available"
    ? "available"
    : "unoccupied";
}

const SEAT_COLORS: Record<SeatStatus, string> = {
  assigned:         "bg-[#22c55e] text-white border-[#16a34a] shadow-sm",
  available:        "bg-[#3b82f6] text-white border-[#2563eb] shadow-sm",
  undermaintenance: "bg-[#f59e0b] text-white border-[#d97706] shadow-sm",
  defective:        "bg-[#e11d48] text-white border-[#be123c] shadow-sm",
  unoccupied:       "bg-slate-100 text-slate-400 border-dashed border-slate-300 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 dark:hover:border-slate-600",
};

// Extract just the numeric part from "ASG-001" → "001"
// REMOVED - Now using index-based numbering instead
// function getAsgShortId(assignmentId: string): string {
//   return assignmentId.replace("ASG-", "");
// }

interface SeatCellProps {
  assignment: Assignment;
  displayNumber: number; // Changed: Now we pass the sequential number
  isDark: boolean;
  onClick?: (asg: Assignment) => void;
}

function SeatCell({ assignment, displayNumber, isDark, onClick }: SeatCellProps) {
  const [hovered, setHovered] = useState(false);
  const status = getStatusFromAssignment(assignment);
  const colorClass = SEAT_COLORS[status];

  return (
    <div className="relative">
      <div
        className={`w-14 h-14 border rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg select-none ${colorClass}`}
        style={{ fontSize: "11px", fontWeight: 700 }}
        onClick={() => onClick?.(assignment)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={`#${displayNumber} – ${assignment.assignedTo}`}
      >
        {displayNumber}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[180px] rounded-lg px-3 py-2.5 shadow-xl pointer-events-none ${isDark ? "bg-slate-800 text-slate-100" : "bg-gray-900 text-white"}`}>
          <p className="text-xs font-bold text-[#B0BF00] mb-1">{assignment.assignmentId}</p>
          <p className={`text-[11px] ${isDark ? "text-slate-100" : "text-white"}`}>{assignment.assignedTo}</p>
          <p className={`text-[10px] mt-1 ${isDark ? "text-slate-300" : "text-gray-300"}`}>{assignment.assetName}</p>
          <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-gray-400"}`}>{assignment.assetCategory}</p>
          <div className={`mt-2 pt-2 border-t ${isDark ? "border-slate-700" : "border-gray-700"}`}>
            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-gray-400"}`}>Workstation: {assignment.workstation}</p>
            {assignment.seatNumber && (
              <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-gray-400"}`}>Seat/PC #: {assignment.seatNumber}</p>
            )}
          </div>
          <span
            className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-semibold ${
              status === "assigned"
                ? "bg-[#22c55e]"
                : status === "undermaintenance"
                ? "bg-[#f59e0b]"
                : status === "defective"
                ? "bg-[#e11d48]"
                : status === "available"
                ? "bg-[#3b82f6]"
                : "bg-gray-500"
            }`}
          >
            {assignment.status}
          </span>
          {/* Tooltip arrow */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${isDark ? "border-t-slate-800" : "border-t-gray-900"}`} />
        </div>
      )}
    </div>
  );
}

export default function FloorMapIT({ assignments, onSeatClick }: Props) {
  const [selectedInfo, setSelectedInfo] = useState<Assignment | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleClick = (asg: Assignment) => {
    setSelectedInfo(asg);
    onSeatClick?.(asg, asg.seatNumber || 0);
  };

  // Define all workstation areas
  const WORKSTATION_AREAS = {
    "PROD 2": {
      label: "PROD 2",
      color: "bg-[#1a7a4a]",
      workstationNames: ["PROD 2", "Production 2", "PROD2"],
    },
    "PROD 1": {
      label: "PROD 1",
      color: "bg-[#1a7a4a]",
      workstationNames: ["PROD 1", "Production 1", "PROD1"],
    },
    "Conference Room": {
      label: "CONFERENCE ROOM",
      color: "bg-[#1a5a7a]",
      workstationNames: ["Conference Room", "Conference", "Meeting Room"],
    },
    "IT Room": {
      label: "IT ROOM",
      color: "bg-[#2d4a7a]",
      workstationNames: ["IT Room", "IT", "IT Department"],
    },
    "Front Desk": {
      label: "FRONT DESK",
      color: "bg-[#B0BF00]",
      workstationNames: ["Front Desk", "Reception", "Lobby"],
    },
  };

  // Get assignments for each workstation area based on workstation name
  // Sort by date assigned (oldest first) and assign sequential numbers
  const getWorkstationAssignments = (areaKey: string) => {
    const area = WORKSTATION_AREAS[areaKey as keyof typeof WORKSTATION_AREAS];
    
    // Filter assignments that match this workstation area
    const filtered = assignments.filter((asg) => {
      // Match by workstation name (case-insensitive)
      return area.workstationNames.some(
        name => asg.workstation.toLowerCase().trim() === name.toLowerCase().trim() ||
                asg.workstation.toLowerCase().includes(name.toLowerCase())
      );
    });
    
    // Sort by date assigned (oldest first)
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.dateAssigned || 0).getTime();
      const dateB = new Date(b.dateAssigned || 0).getTime();
      return dateA - dateB;
    });
    
    // Assign sequential display numbers (1, 2, 3, ...)
    return sorted.map((asg, index) => ({
      assignment: asg,
      displayNumber: index + 1,
    }));
  };

  // Helper to get the display number for a specific assignment
  const getDisplayNumberForAssignment = (assignment: Assignment): number => {
    // Find the assignment in all workstation areas
    for (const areaKey of Object.keys(WORKSTATION_AREAS)) {
      const areaAssignments = getWorkstationAssignments(areaKey);
      const found = areaAssignments.find(item => item.assignment.assignmentId === assignment.assignmentId);
      if (found) {
        return found.displayNumber;
      }
    }
    return 0;
  };

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center">
        <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-gray-500"}`}>Legend:</span>
        {[
          { label: "Assigned", cls: "bg-[#22c55e]", text: "text-white" },
          { label: "Available", cls: "bg-[#3b82f6]", text: "text-white" },
          { label: "Under Maintenance", cls: "bg-[#f59e0b]", text: "text-white" },
          { label: "Defective", cls: "bg-[#e11d48]", text: "text-white" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded text-[8px] flex items-center justify-center font-bold ${l.cls} ${l.text}`}>
              {l.label === "Assigned" ? "1" : ""}
            </div>
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Floor Plan Layout */}
      <div className={`rounded-xl p-5 overflow-x-auto ${isDark ? "bg-slate-950 border border-slate-800" : "bg-[#f4f6f8] border border-gray-200"}`}>
        <div className="min-w-[800px] space-y-6">
          
          {/* Top Row: PROD 2 and PROD 1 */}
          <div className="grid grid-cols-2 gap-6">
            {/* PROD 2 */}
            <div className={`rounded-xl border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
              <div className={`${WORKSTATION_AREAS["PROD 2"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["PROD 2"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("PROD 2").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} isDark={isDark} onClick={handleClick} />
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  {getWorkstationAssignments("PROD 2").length} assignments
                </p>
              </div>
            </div>

            {/* PROD 1 */}
            <div className={`rounded-xl border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
              <div className={`${WORKSTATION_AREAS["PROD 1"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["PROD 1"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("PROD 1").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} isDark={isDark} onClick={handleClick} />
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  {getWorkstationAssignments("PROD 1").length} assignments
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Conference Room, IT Room, Front Desk */}
          <div className="grid grid-cols-3 gap-6">
            {/* Conference Room */}
            <div className={`rounded-xl border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
              <div className={`${WORKSTATION_AREAS["Conference Room"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["Conference Room"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[80px]">
                {getWorkstationAssignments("Conference Room").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} isDark={isDark} onClick={handleClick} />
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  {getWorkstationAssignments("Conference Room").length} assignments
                </p>
              </div>
            </div>

            {/* IT Room */}
            <div className={`rounded-xl border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
              <div className={`${WORKSTATION_AREAS["IT Room"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["IT Room"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[80px]">
                {getWorkstationAssignments("IT Room").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} isDark={isDark} onClick={handleClick} />
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  {getWorkstationAssignments("IT Room").length} assignments
                </p>
              </div>
            </div>

            {/* Front Desk */}
            <div className={`rounded-xl border p-4 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
              <div className={`${WORKSTATION_AREAS["Front Desk"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["Front Desk"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[80px]">
                {getWorkstationAssignments("Front Desk").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} isDark={isDark} onClick={handleClick} />
                ))}
              </div>
              <div className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  {getWorkstationAssignments("Front Desk").length} assignments
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected assignment detail panel */}
      {selectedInfo && (
        <div className={`rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white border border-gray-200"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm ${
                    SEAT_COLORS[getStatusFromAssignment(selectedInfo)]
                  }`}
                >
                  {getDisplayNumberForAssignment(selectedInfo)}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-gray-800"}`}>
                    {selectedInfo.assignmentId} — {selectedInfo.workstation}
                  </p>
                  <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>Seat Position #{selectedInfo.seatNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {[
                  { label: "Assignment ID", value: selectedInfo.assignmentId },
                  { label: "Assigned To", value: selectedInfo.assignedTo },
                  { label: "Asset", value: selectedInfo.assetName },
                  { label: "Category", value: selectedInfo.assetCategory },
                  { label: "Department", value: selectedInfo.department },
                  { label: "Workstation", value: selectedInfo.workstation },
                  { label: "Floor", value: selectedInfo.floor },
                  { label: "Date Assigned", value: selectedInfo.dateAssigned },
                ].map((f) => (
                  <div key={f.label}>
                    <p className={`text-[10px] mb-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>{f.label}</p>
                    <p className={`text-xs font-medium ${isDark ? "text-slate-200" : "text-gray-700"}`}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedInfo(null)}
              className={`text-xl leading-none flex-shrink-0 ${isDark ? "text-slate-500 hover:text-slate-300" : "text-gray-400 hover:text-gray-600"}`}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
