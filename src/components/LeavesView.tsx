import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  CalendarCheck,
  Check,
  X,
  Plus,
  AlertCircle,
  Eye,
  Info
} from "lucide-react";

export default function LeavesView() {
  const {
    leaves,
    employees,
    updateLeaveStatus,
    addLeaveRequest,
    isLoading
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<"Casual" | "Sick" | "Paid">("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "N/A";
  };

  const getEmployeeIdCode = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.employee_id : "N/A";
  };

  const getEmployeeDept = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.department : "N/A";
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate) {
      setErrorText("Required fields are empty.");
      return;
    }

    const success = await addLeaveRequest({
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: "Pending",
    });

    if (success) {
      setEmployeeId("");
      setLeaveType("Casual");
      setStartDate("");
      setEndDate("");
      setReason("");
      setErrorText("");
      setShowAddModal(false);
    } else {
      setErrorText("Failed to log leave request.");
    }
  };

  const handleStatusChange = async (id: string, status: "Approved" | "Rejected") => {
    await updateLeaveStatus(id, status);
  };

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const processedLeaves = leaves.filter((l) => l.status !== "Pending");

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Leave Applications</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Approve, reject, and monitor leave logs.</p>
        </div>
        <button
          id="btn-add-leave-modal"
          onClick={() => setShowAddModal(true)}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>New Leave Log Request</span>
        </button>
      </div>

      {/* Grid of leave indicators balance limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">
            <CalendarCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Casual Leaves Limit</span>
            <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5">12 Days / Yr</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-650 dark:text-red-450 rounded-full">
            <CalendarCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Sick Leaves Limit</span>
            <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5">10 Days / Yr</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-450 rounded-full">
            <CalendarCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Paid Vacation Limit</span>
            <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5">15 Days / Yr</span>
          </div>
        </div>
      </div>

      {/* Main Leave Request queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending leave requests card list (Main focus) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Pending Approval Queue</h4>
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {pendingLeaves.length} Pending
            </span>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                id={`leave-row-${leave.id}`}
                className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/40 dark:bg-slate-850/10 text-xs font-medium space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Employee / Type */}
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-700 dark:text-slate-200">{getEmployeeName(leave.employee_id)}</h5>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {getEmployeeIdCode(leave.employee_id)} • {getEmployeeDept(leave.employee_id)}
                  </p>
                  <p className="text-[11px] text-slate-650 dark:text-slate-400 font-semibold pt-1">
                    Requested: <span className="text-brand-orange font-mono">{leave.start_date}</span> to <span className="text-brand-orange font-mono">{leave.end_date}</span>
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-1 font-sans flex items-center bg-white dark:bg-slate-800 p-1 rounded">
                    <Info size={11} className="mr-1 inline" />
                    Reason: {leave.reason || "No reason submitted"}
                  </p>
                </div>

                {/* Approve/Reject Controls container */}
                <div className="flex sm:flex-col items-end space-x-2 sm:space-x-0 sm:space-y-2 pt-2 sm:pt-0">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-yellow-50 text-yellow-600 dark:bg-yellow-900/10">
                    {leave.leave_type} Leave
                  </span>
                  
                  <div className="flex space-x-1">
                    <button
                      id={`btn-approve-leave-${leave.id}`}
                      onClick={() => handleStatusChange(leave.id, "Approved")}
                      className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100 rounded-md inline-flex cursor-pointer"
                      title="Approve Leave"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      id={`btn-reject-leave-${leave.id}`}
                      onClick={() => handleStatusChange(leave.id, "Rejected")}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/40 hover:bg-red-100 rounded-md inline-flex cursor-pointer"
                      title="Reject Leave"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pendingLeaves.length === 0 && (
              <p className="text-center py-10 text-slate-400 text-xs italic bg-slate-50/50 dark:bg-slate-850/5 border border-slate-100 dark:border-slate-800 rounded-lg">
                No leave logs require pending approval.
              </p>
            )}
          </div>
        </div>

        {/* Historic processed logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Processed History</h4>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 font-mono text-[11px]">
            {processedLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-3 border border-slate-100/50 dark:border-slate-800/80 rounded-lg bg-slate-5 font-semibold text-slate-500 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-sans truncate max-w-[130px]">{getEmployeeName(leave.employee_id)}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono uppercase ${
                      leave.status === "Approved"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10"
                        : "bg-red-50 text-red-500 dark:bg-red-900/10"
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{leave.leave_type} Leave • {leave.start_date}</p>
              </div>
            ))}
            {processedLeaves.length === 0 && (
              <p className="text-center py-10 text-slate-400 text-xs italic font-sans font-medium">No history logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Leaves creation modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Log Leave Application</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="p-6 space-y-4 text-xs font-medium">
              {errorText && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-md border border-red-100 dark:border-red-900/40 font-semibold mb-2">
                  {errorText}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Target Employee</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-850 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                >
                  <option value="">-- Choose active member --</option>
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 font-sans">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Paid">Paid Vacation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 text-sans">Detailed Leave Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Family medical emergency"
                  className="w-full bg-slate-50 dark:bg-slate-850 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-xs">
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
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg cursor-pointer"
                >
                  Log Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
