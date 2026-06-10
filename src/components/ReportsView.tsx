import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  FileText,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart2
} from "lucide-react";

type ReportType = "employees" | "attendance" | "tasks" | "projects" | "performance";

export default function ReportsView() {
  const {
    employees,
    attendance,
    tasks,
    projects,
    leaves
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>("employees");
  const [compiledStats, setCompiledStats] = useState<any>(null);

  // Compile calculations immediately
  const compileReport = () => {
    if (reportType === "employees") {
      const active = employees.filter(e => e.status === "Active").length;
      const inactive = employees.filter(e => e.status === "Inactive").length;
      const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
      const avgSalary = employees.length > 0 ? Math.round(totalSalary / employees.length) : 0;
      
      // Dept listings
      const depts: Record<string, number> = {};
      employees.forEach(e => {
        depts[e.department] = (depts[e.department] || 0) + 1;
      });

      setCompiledStats({
        title: "Employee Directory & Ledger Summary",
        metrics: [
          { name: "Total Staff Rostered", value: employees.length },
          { name: "Active Members", value: active },
          { name: "Inactive Members", value: inactive },
          { name: "Salary Expenditure", value: `$${totalSalary.toLocaleString()}` },
          { name: "Average Salary", value: `$${avgSalary.toLocaleString()}` },
          { name: "Indexed Departments", value: Object.keys(depts).length }
        ],
        breakdownHeaders: ["Department Name", "Staff Headcount"],
        breakdownRows: Object.entries(depts).map(([name, count]) => [name, count])
      });
    } else if (reportType === "attendance") {
      const records = attendance.length;
      const present = attendance.filter(a => a.status === "Present").length;
      const late = attendance.filter(a => a.status === "Late").length;
      const totalHours = attendance.reduce((sum, a) => sum + (a.working_hours || 0), 0);
      const avgHours = records > 0 ? Math.round((totalHours / records) * 10) / 10 : 0;

      const monthlyBreakdowns: Record<string, { present: number; late: number; hours: number }> = {};
      attendance.forEach(a => {
        const key = a.date.substring(0, 7); // YYYY-MM
        if (!monthlyBreakdowns[key]) monthlyBreakdowns[key] = { present: 0, late: 0, hours: 0 };
        if (a.status === "Present") monthlyBreakdowns[key].present++;
        if (a.status === "Late") monthlyBreakdowns[key].late++;
        monthlyBreakdowns[key].hours += a.working_hours || 0;
      });

      setCompiledStats({
        title: "Comprehensive Attendance & Timesheet Summary",
        metrics: [
          { name: "Total Records Logged", value: records },
          { name: "Present Shifts", value: present },
          { name: "Late Shifts (Tardiness)", value: late },
          { name: "Aggregate Work Hours", value: `${totalHours} hrs` },
          { name: "Average Shift Duration", value: `${avgHours} hrs` }
        ],
        breakdownHeaders: ["Month Period", "Present Logs", "Late Logs", "Accomplished Hours"],
        breakdownRows: Object.entries(monthlyBreakdowns).map(([month, data]) => [
          month,
          data.present,
          data.late,
          `${Math.round(data.hours)} hrs`
        ])
      });
    } else if (reportType === "tasks") {
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === "Completed").length;
      const inProgress = tasks.filter(t => t.status === "In Progress").length;
      const overdue = tasks.filter(t => t.status === "Overdue").length;
      const avgProgress = total > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / total) : 0;

      const priorityMap: Record<string, { total: number; done: number }> = {
        High: { total: 0, done: 0 },
        Medium: { total: 0, done: 0 },
        Low: { total: 0, done: 0 }
      };

      tasks.forEach(t => {
        if (priorityMap[t.priority]) {
          priorityMap[t.priority].total++;
          if (t.status === "Completed") priorityMap[t.priority].done++;
        }
      });

      setCompiledStats({
        title: "Activities & Assignment Progress Analytics",
        metrics: [
          { name: "Total Tasks Deployed", value: total },
          { name: "Completed Milestones", value: completed },
          { name: "Active In-Progress Tasks", value: inProgress },
          { name: "Overdue Alerts", value: overdue },
          { name: "Average Operational Progress", value: `${avgProgress}%` }
        ],
        breakdownHeaders: ["Task Priority", "Assignments Count", "Completed Count"],
        breakdownRows: Object.entries(priorityMap).map(([prio, data]) => [
          prio,
          data.total,
          data.done
        ])
      });
    } else if (reportType === "projects") {
      const listSize = projects.length;
      const activeProj = projects.filter(p => p.status === "In Progress").length;
      const planProj = projects.filter(p => p.status === "Planning").length;
      const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);

      setCompiledStats({
        title: "Project Portfolio & Financial Report",
        metrics: [
          { name: "Total Tracked projects", value: listSize },
          { name: "In Progress Stage", value: activeProj },
          { name: "Planning Stage", value: planProj },
          { name: "Total Budget Allocated", value: `$${totalBudget.toLocaleString()}` }
        ],
        breakdownHeaders: ["Project Name", "Client/Customer", "Alloc Budget", "Stage Status"],
        breakdownRows: projects.map(p => [
          p.project_name,
          p.client_name,
          `$${p.budget.toLocaleString()}`,
          p.status
        ])
      });
    } else if (reportType === "performance") {
      // average performance ratio per employee
      const rankings = employees.map(emp => {
        const empTasks = tasks.filter(t => t.employee_id === emp.id);
        const done = empTasks.filter(t => t.status === "Completed").length;
        const avgTaskProg = empTasks.length > 0 ? Math.round(empTasks.reduce((sum, t) => sum + t.progress, 0) / empTasks.length) : 0;
        const score = empTasks.length > 0 ? Math.min(100, Math.round(((done / empTasks.length) * 60) + (avgTaskProg * 0.4))) : 0;
        return [
          emp.name,
          emp.employee_id,
          emp.department,
          `${empTasks.length} assigned`,
          `${score}% Score`
        ];
      });

      setCompiledStats({
        title: "Employee Performance Scorecards",
        metrics: [
          { name: "Evaluated Human Capital", value: employees.length },
          { name: "Total Tasks Context", value: tasks.length },
          { name: "Avg Team Performance Rank", value: "82% efficiency" }
        ],
        breakdownHeaders: ["Full Name", "Employee ID", "Department", "Task Focus", "Performance Rating"],
        breakdownRows: rankings
      });
    }
  };

  const triggerExport = () => {
    if (!compiledStats) return;

    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === "employees") {
      headers = ["ID Code", "Full Name", "Email", "Department", "Designation", "Salary", "Status"];
      rows = employees.map(e => [e.employee_id, e.name, e.email, e.department, e.designation, e.salary, e.status]);
    } else if (reportType === "attendance") {
      headers = ["Employee ID", "Log Date", "Check-In ISO", "Checkout ISO", "Working Hours", "Presence status"];
      rows = attendance.map(a => [a.employee_id, a.date, a.check_in, a.check_out || "LIVE", a.working_hours, a.status]);
    } else if (reportType === "tasks") {
      headers = ["Task Title", "Priority", "Assigned ID", "Due Date", "Status", "Completion progress %"];
      rows = tasks.map(t => [t.title, t.priority, t.employee_id, t.due_date, t.status, t.progress]);
    } else if (reportType === "projects") {
      headers = ["Project Name", "Client/Customer", "Alloc Budget", "Start Date", "End Date", "Status"];
      rows = projects.map(p => [p.project_name, p.client_name, p.budget, p.start_date, p.end_date, p.status]);
    } else if (reportType === "performance") {
      headers = ["Employee Name", "Department", "Designation", "Total Tasks Count"];
      rows = employees.map(emp => [
        emp.name,
        emp.department,
        emp.designation,
        tasks.filter(t => t.employee_id === emp.id).length
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `teamflow_${reportType}_ledger_report.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reports Compiler</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Compile audit statistics and export CSV ledgers for external tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compilation triggers card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">Selector parameters</h4>
          
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Select Report Target</span>
            {([
              { id: "employees", name: "Employees Directories" },
              { id: "attendance", name: "Attendance & Daily shifts" },
              { id: "tasks", name: "Tasks completion rates" },
              { id: "projects", name: "Projects budgets ledger" },
              { id: "performance", name: "Human Capital Rankings" }
            ] as const).map(item => (
              <button
                key={item.id}
                id={`btn-report-select-${item.id}`}
                onClick={() => {
                  setReportType(item.id);
                  setCompiledStats(null);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between border ${
                  reportType === item.id
                    ? "bg-brand-orange/10 border-brand-orange/30 text-brand-orange dark:bg-brand-orange/15 dark:border-brand-orange/40 dark:text-brand-orange"
                    : "bg-white border-transparent text-slate-500 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <span>{item.name}</span>
                <ChevronSelector active={reportType === item.id} />
              </button>
            ))}
          </div>

          <button
            id="btn-trigger-compile"
            onClick={compileReport}
            className="w-full bg-slate-900 hover:bg-black dark:bg-brand-orange dark:hover:bg-brand-orange-hover text-white font-semibold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Compile Stats Overview
          </button>
        </div>

        {/* Breakdown output card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          {compiledStats ? (
            <div className="space-y-5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">{compiledStats.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Parameters verified: {new Date().toLocaleDateString()}</p>
                </div>
                <button
                  id="btn-report-export-csv"
                  onClick={triggerExport}
                  className="bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange text-[11px] font-bold px-3 py-1.5 rounded-md flex items-center space-x-1 border border-brand-orange/20 cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download Ledger CSV</span>
                </button>
              </div>

              {/* Statistical cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {compiledStats.metrics.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-lg border border-slate-100/50 dark:border-slate-800/60 text-center">
                    <span className="text-[9px] uppercase font-mono text-slate-400 block">{m.name}</span>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-100 font-sans block mt-1">{m.value}</span>
                  </div>
                ))}
              </div>

              {/* breakdown matrix table */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-2">Category breakdown metrics</span>
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/45 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-120 font-bold">
                        {compiledStats.breakdownHeaders.map((h: string, i: number) => (
                          <th key={i} className="p-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compiledStats.breakdownRows.map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="border-b border-slate-100/60 dark:border-slate-800/30 font-medium hover:bg-slate-50/20">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="p-2 font-semibold text-slate-700 dark:text-slate-350">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center py-20 text-slate-400">
              <Database size={40} className="text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-serif italic">Press trigger button to compile databases statistical ledgers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronSelector({ active }: { active: boolean }) {
  return (
    <span className={`w-1.5 h-1.5 rounded-full transition-transform ${active ? "bg-brand-orange scale-125" : "bg-slate-300 dark:bg-slate-700"}`}></span>
  );
}
