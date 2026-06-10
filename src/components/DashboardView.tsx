import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Play,
  Activity,
  Award
} from "lucide-react";

export default function DashboardView() {
  const {
    employees,
    attendance,
    projects,
    tasks,
    logs,
    leaves,
    simulateClock,
    isLoading
  } = useApp();

  const [simEmployeeId, setSimEmployeeId] = useState("");
  const [simAction, setSimAction] = useState<"check_in" | "check_out">("check_in");
  const [simSuccess, setSimSuccess] = useState(false);
  const [simError, setSimError] = useState("");

  // -- STATS CALCULATIONS --
  const totalEmployees = employees.length;
  const activeEmployeesResult = employees.filter((e) => e.status === "Active").length;
  const inactiveEmployeesResult = employees.filter((e) => e.status === "Inactive").length;

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const overdueTasks = tasks.filter((t) => t.status === "Overdue" || (t.status !== "Completed" && new Date(t.due_date) < new Date())).length;

  // Today's attendance registry
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = attendance.filter((a) => a.date === todayStr);

  const presentToday = todayRecords.filter((a) => a.status === "Present").length;
  const lateToday = todayRecords.filter((a) => a.status === "Late").length;
  const leaveToday = leaves.filter((l) => {
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    const today = new Date(todayStr);
    return l.status === "Approved" && today >= start && today <= end;
  }).length;
  const absentToday = Math.max(0, activeEmployeesResult - (presentToday + lateToday + leaveToday));

  // Productivity metrics per employee
  // Calculate each employee's completed tasks, average task progress, and log count to generate a Performance Ranking Score
  const performanceRankings = employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.employee_id === emp.id);
    const completedCount = empTasks.filter((t) => t.status === "Completed").length;
    const avgProgress = empTasks.length > 0
      ? Math.round(empTasks.reduce((acc, t) => acc + t.progress, 0) / empTasks.length)
      : 0;
    
    // Simple Productivity multiplier
    const rate = empTasks.length > 0 ? (completedCount / empTasks.length) * 100 : 0;
    const productivityScore = Math.min(100, Math.round((rate * 0.6) + (avgProgress * 0.4)));

    return {
      name: emp.name,
      tasksAssigned: empTasks.length,
      tasksCompleted: completedCount,
      progress: avgProgress,
      score: productivityScore,
      department: emp.department
    };
  }).sort((a, b) => b.score - a.score);

  // -- CHART DATAS --

  // 1. Task Status Chart
  const taskStatusData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "In Progress", value: inProgressTasks, color: "#113075" },
    { name: "Pending", value: pendingTasks, color: "#F28A02" },
    { name: "Overdue", value: overdueTasks, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // 2. Attendance Chart today
  const attendancePieData = [
    { name: "Present", value: presentToday, color: "#10b981" },
    { name: "Late Arrival", value: lateToday, color: "#F28A02" },
    { name: "Approved Leave", value: leaveToday, color: "#113075" },
    { name: "Absent", value: absentToday, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // 3. Monthly Productivity Curve (Simulated analytics for the past 6 units/months)
  const monthlyProductivityData = [
    { month: "Jan", completedTasks: 18, efficiency: 72 },
    { month: "Feb", completedTasks: 25, efficiency: 81 },
    { month: "Mar", completedTasks: 32, efficiency: 78 },
    { month: "Apr", completedTasks: 30, efficiency: 84 },
    { month: "May", completedTasks: 44, efficiency: 89 },
    { month: "Jun", completedTasks: completedTasks + 20, efficiency: Math.round(performanceRankings.reduce((sum, r) => sum + r.score, 0) / (performanceRankings.length || 1)) },
  ];

  // 4. Employee Rankings Chart Data (top 5)
  const employeePerformanceChartData = performanceRankings.slice(0, 5).map(p => ({
    name: p.name.split(" ")[0],
    Score: p.score,
    Tasks: p.tasksCompleted
  }));

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmployeeId) {
      setSimError("Please pick an employee to simulate.");
      return;
    }
    setSimError("");
    setSimSuccess(false);
    const success = await simulateClock(simEmployeeId, simAction);
    if (success) {
      setSimSuccess(true);
      setTimeout(() => setSimSuccess(false), 3000);
    } else {
      setSimError("Simulation failed. Check if employee is already checked in/out.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Hub Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time status updates of team production, clock-in registries, and performance scores.
          </p>
        </div>
        <div className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-mono border border-slate-200/50 dark:border-slate-700/50">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Grid STATS panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs transition-transform hover:translate-y-[-2px] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Employees Status</span>
            <span className="text-2xl font-bold font-sans text-slate-800 dark:text-white select-all block mt-1">{totalEmployees} Total</span>
            <span className="text-xs text-emerald-500 font-medium inline-flex items-center mt-1">
              {activeEmployeesResult} Active <span className="mx-1 text-slate-300">•</span> {inactiveEmployeesResult} Inactive
            </span>
          </div>
          <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-full">
            <Users size={22} />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs transition-transform hover:translate-y-[-2px] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Projects</span>
            <span className="text-2xl font-bold font-sans text-slate-800 dark:text-white block mt-1">{totalProjects} Live</span>
            <span className="text-xs text-brand-orange font-medium inline-flex items-center mt-1">
              Active tracks in timeline
            </span>
          </div>
          <div className="p-3 bg-brand-navy/10 text-brand-navy rounded-full">
            <Briefcase size={22} />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs transition-transform hover:translate-y-[-2px] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Tasks</span>
            <span className="text-2xl font-bold font-sans text-slate-800 dark:text-white block mt-1">{totalTasks} Total</span>
            <span className="text-xs text-emerald-500 font-medium inline-flex items-center mt-1">
              {completedTasks} Done ({Math.round((completedTasks / (totalTasks || 1)) * 100)}%)
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs transition-transform hover:translate-y-[-2px] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Today's Attendance</span>
            <span className="text-2xl font-bold font-sans text-slate-800 dark:text-white block mt-1">
              {presentToday + lateToday} Active
            </span>
            <span className="text-xs text-amber-500 font-medium inline-flex items-center mt-1">
              {lateToday} Tardy <span className="mx-1 text-slate-300">•</span> {leaveToday} Leave
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core line and productivity chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Monthly Productivity Graph</h3>
              <p className="text-xs text-slate-400">Dynamic tracking of team completions & score efficiencies</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-block w-3 h-3 bg-brand-orange rounded-sm"></span>
              <span>Completions</span>
              <span className="inline-block w-3 h-3 bg-brand-navy rounded-sm"></span>
              <span>Efficiency %</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#F28A02" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="#F28A02" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#113075" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="#113075" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }} />
                <Area type="monotone" dataKey="completedTasks" name="Completed Tasks" stroke="#F28A02" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompletions)" />
                <Area type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#113075" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEfficiency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task status Distribution donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Tasks Progress Ratio</h3>
          <p className="text-xs text-slate-400 mb-4">Task completion structure of all departments</p>
          <div className="h-56 relative flex items-center justify-center">
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 font-serif">No task stats defined.</div>
            )}
            <div className="absolute flex flex-col items-center justify-center select-none pointer-events-none">
              <span className="text-3xl font-bold text-slate-800 dark:text-white font-sans">{totalTasks}</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Active Tasks</span>
            </div>
          </div>
          {/* Pie Legends */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {taskStatusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-500 font-medium truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Pie Map */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Today's Attendance Ratio</h3>
          <p className="text-xs text-slate-400 mb-4">Daily staff presence checklist</p>
          
          <div className="h-56 relative flex items-center justify-center">
            {attendancePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 flex flex-col justify-center items-center">
                <span>All checked out or absent logs today.</span>
              </div>
            )}
            <div className="absolute flex flex-col items-center justify-center select-none pointer-events-none">
              <span className="text-2xl font-bold text-emerald-500 font-sans">
                {Math.round(((presentToday + lateToday) / (activeEmployeesResult || 1)) * 100)}%
              </span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Presence Ratio</span>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>Present On-Time:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">{presentToday}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></span>Late Entries:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">{lateToday}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>Approved Leave:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold">{leaveToday}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>Unexcused Absence:</span>
              <span className="font-mono text-red-500 font-semibold">{absentToday}</span>
            </div>
          </div>
        </div>

        {/* Employee Performance Rankings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Key Performance Rankings</h3>
              <p className="text-xs text-slate-400">Score of task progress & successful delivery</p>
            </div>
            <Award className="text-amber-500" size={20} />
          </div>

          <div className="space-y-4 my-4 max-h-[290px] overflow-y-auto pr-1">
            {performanceRankings.slice(0, 4).map((p, index) => {
              const bgColors = ["bg-amber-100 text-amber-700 border-amber-200", "bg-slate-100 text-slate-700 border-slate-200", "bg-yellow-100 text-yellow-800 border-yellow-200", "bg-slate-50 text-slate-600 border-slate-100"];
              const rankColor = bgColors[index] || "bg-slate-50 text-slate-500";
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${rankColor}`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono italic">{p.department} • {p.tasksCompleted}/{p.tasksAssigned} Tasks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans block">{p.score}%</span>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-500 font-mono font-bold">score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Attendance Clock simulation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Simulated Clocking Device</h3>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Emulates employee biometric punches to drive real time attendance panels.</p>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Select Live Member</label>
              <select
                id="select-sim-employee"
                value={simEmployeeId}
                onChange={(e) => setSimEmployeeId(e.target.value)}
                className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white p-2.5 rounded-lg outline-hidden focus:ring-1 focus:ring-brand-orange"
              >
                <option value="">-- Choose active employee --</option>
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Action Trigger</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-sim-action-checkin"
                  onClick={() => setSimAction("check_in")}
                  className={`text-xs py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                    simAction === "check_in"
                      ? "bg-brand-orange/15 text-brand-orange border-brand-orange/35"
                      : "bg-slate-50/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Clock In (Check-In)
                </button>
                <button
                  type="button"
                  id="btn-sim-action-checkout"
                  onClick={() => setSimAction("check_out")}
                  className={`text-xs py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                    simAction === "check_out"
                      ? "bg-brand-navy/15 text-brand-navy border-brand-navy/35"
                      : "bg-slate-50/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Clock Out (Checkout)
                </button>
              </div>
            </div>

            {simError && (
              <p className="text-[11px] text-red-500 font-medium bg-red-50 dark:bg-red-950/20 p-2 rounded-md border border-red-100 dark:border-red-900/50">
                {simError}
              </p>
            )}

            {simSuccess && (
              <p className="text-[11px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-md border border-emerald-110 dark:border-emerald-900/50">
                Success! Device punch registered in database.
              </p>
            )}

            <button
              type="submit"
              id="btn-trigger-simulator"
              disabled={isLoading}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Play size={14} className="fill-current" />
              <span>Register Biometric Punch</span>
            </button>
          </form>
        </div>
      </div>

      {/* Recent Activity logs row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-xl shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Live Activity Monitor</h3>
            <p className="text-xs text-slate-400">Security audit timestamps of operations & automated checks</p>
          </div>
          <Activity size={18} className="text-brand-orange" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/70 text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                <th className="pb-2.5">Activity Detail</th>
                <th className="pb-2.5">Triggered By</th>
                <th className="pb-2.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 5).map((log, index) => {
                const actorName = log.admin_name
                  ? `${log.admin_name} (Admin)`
                  : employees.find((e) => e.id === log.employee_id)?.name || "System Device";
                return (
                  <tr
                    key={index}
                    className="border-b border-slate-100/50 dark:border-slate-800/30 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                  >
                    <td className="py-2.5 font-medium pr-4">{log.action}</td>
                    <td className="py-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {actorName}
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}{" "}
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-slate-400 text-xs italic">
                    No logged track traces yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
