import React from "react";
import { useApp } from "../context/AppContext";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Heart
} from "lucide-react";

export default function EmployeeDetailsView() {
  const {
    selectedEmployeeId,
    setSelectedEmployeeId,
    employees,
    attendance,
    tasks,
    leaves,
    logs
  } = useApp();

  const employee = employees.find((e) => e.id === selectedEmployeeId);

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
        <p className="text-sm text-slate-500">Employee dossier not found or has been deleted.</p>
        <button
          onClick={() => setSelectedEmployeeId(null)}
          className="mt-4 bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-medium"
        >
          Return to Employees Directories
        </button>
      </div>
    );
  }

  // Employee contextual records
  const empAttendance = attendance.filter((a) => a.employee_id === employee.id).sort((a, b) => b.date.localeCompare(a.date));
  const empTasks = tasks.filter((t) => t.employee_id === employee.id);
  const empLeaves = leaves.filter((l) => l.employee_id === employee.id);
  const empLogs = logs.filter((log) => log.employee_id === employee.id);

  // Stats Counters
  const completedCount = empTasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = empTasks.filter((t) => t.status === "In Progress").length;
  const pendingCount = empTasks.filter((t) => t.status === "Pending").length;

  const totalHrs = empAttendance.reduce((sum, a) => sum + (a.working_hours || 0), 0);
  const lateCount = empAttendance.filter((a) => a.status === "Late").length;

  return (
    <div className="space-y-6">
      {/* Back button and profile cover */}
      <button
        onClick={() => setSelectedEmployeeId(null)}
        className="flex items-center space-x-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer font-semibold"
      >
        <ArrowLeft size={14} />
        <span>Back to Directory</span>
      </button>

      {/* Header Profile card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Cover banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative"></div>
        
        <div className="px-6 pb-6 relative flex flex-col md:flex-row md:items-end justify-between -mt-12 space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-3 md:space-y-0 md:space-x-4">
            <img
              src={employee.profile_photo}
              alt={employee.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-xl object-cover border-4 border-white dark:border-slate-950 shadow-md bg-slate-100"
            />
            <div className="text-center md:text-left pb-1">
              <span className="inline-block px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider font-mono mb-1.5">
                {employee.status}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{employee.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{employee.designation} • {employee.department}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-lg text-center min-w-[70px]">
              <span className="text-slate-400 text-[9px] uppercase font-mono block">Joined</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-[11px] mt-0.5 block">{employee.joining_date}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-lg text-center min-w-[70px]">
              <span className="text-slate-400 text-[9px] uppercase font-mono block">Salary</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mt-0.5 block">${employee.salary.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Dossies Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-xs">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
              Contact & Details
            </h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                <Mail size={14} className="text-slate-400" />
                <span className="select-all">{employee.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                <Phone size={14} className="text-slate-400" />
                <span>{employee.phone || "No telephone provided"}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                <MapPin size={14} className="text-slate-400" />
                <span>{employee.address || "No physical address registered"}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                <Calendar size={14} className="text-slate-400" />
                <span>ID Code: <span className="font-mono font-bold text-slate-500">{employee.employee_id}</span></span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg mt-5 border border-slate-100 dark:border-slate-800/60 text-xs">
              <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1.5">
                <Heart size={13} className="mr-1.5 text-red-500" />
                <span>Emergency Contact Card</span>
              </h5>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {employee.emergency_contact || "No emergency records defined."}
              </p>
            </div>
          </div>

          {/* Productivity Stats card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Production Statistics
            </h4>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Tasks Completed</span>
                <span className="text-xl font-bold font-sans text-emerald-500 mt-1 block">{completedCount}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Working Hrs Total</span>
                <span className="text-xl font-bold font-sans text-blue-500 mt-1 block">{totalHrs}h</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Tardiness Logged</span>
                <span className="text-xl font-bold font-sans text-amber-500 mt-1 block">{lateCount}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Leaves Used</span>
                <span className="text-xl font-bold font-sans text-indigo-500 mt-1 block">{empLeaves.filter(l => l.status === "Approved").length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Navigation and logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks progress logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-xs">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
              Assigned Tasks Timeline
            </h4>
            
            <div className="space-y-4">
              {empTasks.map((t) => (
                <div key={t.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/40 dark:bg-slate-850/20 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-bold text-slate-700 dark:text-slate-200">{t.title}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Due: {t.due_date} • Priority: <span className="font-semibold text-amber-600 font-mono">{t.priority}</span></p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono uppercase ${
                        t.status === "Completed"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                          : t.status === "In Progress"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20"
                          : t.status === "Overdue"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/20"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Completion Bar</span>
                      <span>{t.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${t.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {empTasks.length === 0 && (
                <p className="text-center py-6 text-slate-400 text-xs italic">
                  No active operations assigned to this team member.
                </p>
              )}
            </div>
          </div>

          {/* Attendance and activity logs for details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-xs">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
              Check-In History Details
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Clock In</th>
                    <th className="pb-2">Clock Out</th>
                    <th className="pb-2">Log Hours</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {empAttendance.slice(0, 10).map((att) => (
                    <tr key={att.id} className="border-b border-slate-100/50 dark:border-slate-800/10 text-slate-600 dark:text-slate-300">
                      <td className="py-2.5 font-bold">{att.date}</td>
                      <td className="py-2.5 font-mono text-[11px]">{new Date(att.check_in).toLocaleTimeString()}</td>
                      <td className="py-2.5 font-mono text-[11px]">{att.check_out ? new Date(att.check_out).toLocaleTimeString() : <span className="text-amber-500 italic">Live Active</span>}</td>
                      <td className="py-2.5 font-mono font-semibold">{att.working_hours} hrs</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            att.status === "Present"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {empAttendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 italic">
                        No biometric logging details located.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
