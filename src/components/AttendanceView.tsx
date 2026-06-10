import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Attendance } from "../types";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  UserCheck,
  Award
} from "lucide-react";

export default function AttendanceView() {
  const {
    attendance,
    employees,
    addEmployee, // We can log manual days
    isLoading,
    refreshAllData
  } = useApp();

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [manualStatus, setManualStatus] = useState<"Present" | "Late" | "Absent" | "Half Day">("Present");

  const [modalError, setModalError] = useState("");

  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setModalError("Please specify which team member you want to log.");
      return;
    }
    setModalError("");

    const checkInISO = new Date(`${manualDate}T${checkIn}:00Z`).toISOString();
    const checkOutISO = checkOut ? new Date(`${manualDate}T${checkOut}:00Z`).toISOString() : null;

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`
        },
        body: JSON.stringify({
          employee_id: selectedEmpId,
          check_in: checkInISO,
          check_out: checkOutISO,
          date: manualDate,
          status: manualStatus
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed logging manual row.");
      }

      await refreshAllData();
      setShowAddModal(false);
    } catch (e: any) {
      setModalError(e.message);
    }
  };

  // Resolve employee info from record
  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "Unknown Employee";
  };

  const getEmployeeIdCode = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.employee_id : "N/A";
  };

  const getEmployeeDept = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.department : "N/A";
  };

  // Filter attendance records
  const filteredAttendance = attendance.filter((att) => {
    const empName = getEmployeeName(att.employee_id).toLowerCase();
    const empCode = getEmployeeIdCode(att.employee_id).toLowerCase();
    
    const matchesSearch =
      empName.includes(searchQuery.toLowerCase()) ||
      empCode.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || att.status === statusFilter;
    const matchesDate = !dateFilter || att.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Logs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total matched: {filteredAttendance.length} attendance rows</p>
        </div>
        <button
          id="btn-log-attendance-modal"
          onClick={() => setShowAddModal(true)}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Manual Log Adjustment</span>
        </button>
      </div>

      {/* Query filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            id="input-attendance-search"
            type="text"
            placeholder="Search by Employee ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-xs py-2.5 pl-10 pr-4 text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Target Date query */}
          <div className="flex items-center space-x-2 flex-1 md:flex-none">
            <Calendar size={13} className="text-slate-400" />
            <input
              id="input-attendance-date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-0 text-xs text-slate-700 dark:text-slate-400 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-brand-orange font-mono"
            />
          </div>

          {/* Status type selection */}
          <select
            id="select-attendance-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-0 text-xs text-slate-700 dark:text-slate-250 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-brand-orange flex-1 md:flex-none"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late Entry</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                <th className="p-4">Employee Details</th>
                <th className="p-4">Target Date</th>
                <th className="p-4">Check-In Punch</th>
                <th className="p-4">Checkout Punch</th>
                <th className="p-4">Work Duration</th>
                <th className="p-4 text-right">Biometric Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((att) => (
                <tr
                  key={att.id}
                  className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-xs"
                >
                  <td className="p-4">
                    <h5 className="font-bold text-slate-700 dark:text-slate-200">{getEmployeeName(att.employee_id)}</h5>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {getEmployeeIdCode(att.employee_id)} • {getEmployeeDept(att.employee_id)}
                    </p>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold">
                    {att.date}
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11.5px]">
                    {new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11.5px]">
                    {att.check_out ? (
                      new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      <span className="text-amber-500 font-semibold italic flex items-center">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping mr-1.5 inline-block"></span>
                        Active Shift
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-200 font-bold">
                    {att.working_hours ? `${att.working_hours} hrs` : "0.0 hrs"}
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        att.status === "Present"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                          : att.status === "Late"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                          : "bg-red-50 text-red-600 dark:bg-red-950/20"
                      }`}
                    >
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 dark:text-slate-500 italic">
                    No matching check-in records found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual log modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Register Manual Attendance Log</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAttendanceSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="text-[11px] p-2.5 rounded-md text-red-500 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/40">
                  {modalError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Assigned Employee</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                >
                  <option value="">-- Click to select --</option>
                  {employees
                    .filter((e) => e.status === "Active")
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.employee_id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Selected Date</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Check-in Time</label>
                  <input
                    type="time"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Checkout Time</label>
                  <input
                    type="time"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 font-sans">Presence Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late Arrival</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg cursor-pointer font-bold"
                >
                  Register Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
