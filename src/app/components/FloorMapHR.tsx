import { useState } from "react";
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
  unoccupied:       "bg-white text-gray-300 border-dashed border-gray-300 hover:border-gray-400",
};

interface SeatCellProps {
  assignment: Assignment;
  displayNumber: number;
  onClick?: (asg: Assignment) => void;
}

function SeatCell({ assignment, displayNumber, onClick }: SeatCellProps) {
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 min-w-[180px] bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl pointer-events-none">
          <p className="text-xs font-bold text-[#B0BF00] mb-1">{assignment.assignmentId}</p>
          <p className="text-[11px] text-white">{assignment.assignedTo}</p>
          <p className="text-[10px] text-gray-300 mt-1">{assignment.assetName}</p>
          <p className="text-[10px] text-gray-400">{assignment.assetCategory}</p>
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-[10px] text-gray-400">Workstation: {assignment.workstation}</p>
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
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default function FloorMapHR({ assignments, onSeatClick }: Props) {
  const [selectedInfo, setSelectedInfo] = useState<Assignment | null>(null);

  const handleClick = (asg: Assignment) => {
    setSelectedInfo(asg);
    onSeatClick?.(asg, 0);
  };

  // Define all HR workstation areas
  const WORKSTATION_AREAS = {
    "Front Desk": {
      label: "FRONT DESK",
      color: "bg-[#B0BF00]",
      workstationNames: ["Front Desk", "Reception", "Lobby"],
    },
    "Conference Room": {
      label: "CONFERENCE ROOM",
      color: "bg-[#1a5a7a]",
      workstationNames: ["Conference Room", "Conference", "Meeting Room"],
    },
    "HR Room": {
      label: "HR ROOM",
      color: "bg-[#9333ea]",
      workstationNames: ["HR Room", "HR Office", "Human Resources"],
    },
    "IT Room": {
      label: "IT ROOM",
      color: "bg-[#2d4a7a]",
      workstationNames: ["IT Room", "IT", "IT Department"],
    },
    "Production Area": {
      label: "PRODUCTION AREA",
      color: "bg-[#1a7a4a]",
      workstationNames: ["Production Area", "Production", "Work Area"],
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
        <span className="text-xs font-semibold text-gray-500">Legend:</span>
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
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Floor Plan Layout */}
      <div className="bg-[#f4f6f8] border border-gray-200 rounded-xl p-5 overflow-x-auto">
        <div className="min-w-[980px] space-y-6">
          
          {/* Top Row: Front Desk and Conference Room */}
          <div className="grid grid-cols-2 gap-6">
            {/* Front Desk */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`${WORKSTATION_AREAS["Front Desk"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["Front Desk"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("Front Desk").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} onClick={handleClick} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  {getWorkstationAssignments("Front Desk").length} assignments
                </p>
              </div>
            </div>

            {/* Conference Room */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`${WORKSTATION_AREAS["Conference Room"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["Conference Room"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("Conference Room").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} onClick={handleClick} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  {getWorkstationAssignments("Conference Room").length} assignments
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: HR Room, IT Room, Production Area */}
          <div className="grid grid-cols-3 gap-6">
            {/* HR Room */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`${WORKSTATION_AREAS["HR Room"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["HR Room"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("HR Room").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} onClick={handleClick} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  {getWorkstationAssignments("HR Room").length} assignments
                </p>
              </div>
            </div>

            {/* IT Room */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`${WORKSTATION_AREAS["IT Room"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["IT Room"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("IT Room").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} onClick={handleClick} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  {getWorkstationAssignments("IT Room").length} assignments
                </p>
              </div>
            </div>

            {/* Production Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className={`${WORKSTATION_AREAS["Production Area"].color} text-white text-xs font-bold rounded-lg px-3 py-2 mb-3 text-center`}>
                {WORKSTATION_AREAS["Production Area"].label}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[120px]">
                {getWorkstationAssignments("Production Area").map((item) => (
                  <SeatCell key={item.assignment.assignmentId} assignment={item.assignment} displayNumber={item.displayNumber} onClick={handleClick} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">
                  {getWorkstationAssignments("Production Area").length} assignments
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected assignment detail panel */}
      {selectedInfo && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedInfo.assignmentId} — {selectedInfo.workstation}
                  </p>
                  <p className="text-[10px] text-gray-400">HR Department Assignment</p>
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
                    <p className="text-[10px] text-gray-400 mb-0.5">{f.label}</p>
                    <p className="text-xs font-medium text-gray-700">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedInfo(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
