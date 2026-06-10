import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Task } from "../types";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Calendar,
  User,
  Sliders,
  DollarSign,
  Play,
  Heart,
  ChevronRight,
  ArrowRight,
  Send,
  Loader
} from "lucide-react";

export default function TasksView() {
  const {
    tasks,
    employees,
    projects,
    addTask,
    editTask,
    addTaskComment,
    isLoading
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [assignedEmpId, setAssignedEmpId] = useState("");
  const [projectId, setProjectId] = useState("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  const [formError, setFormError] = useState("");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !assignedEmpId) {
      setFormError("Detailed title and assigned member are required.");
      return;
    }

    const success = await addTask({
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      due_date: taskDueDate,
      employee_id: assignedEmpId,
      project_id: projectId || null,
      status: "Pending",
      progress: 0,
    });

    if (success) {
      // clear
      setTaskTitle("");
      setTaskDesc("");
      setAssignedEmpId("");
      setProjectId("");
      setTaskDueDate("");
      setFormError("");
      setShowAddModal(false);
    } else {
      setFormError("Operation failed. Try choosing appropriate options.");
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText) return;

    const success = await addTaskComment(selectedTask.id, newCommentText);
    if (success) {
      // sync local view properties
      const updatedTaskObj = tasks.find((t) => t.id === selectedTask.id);
      if (updatedTaskObj) {
        setSelectedTask(updatedTaskObj);
      }
      setNewCommentText("");
    }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    await editTask(id, { progress });
    if (selectedTask && selectedTask.id === id) {
      const updated = { ...selectedTask, progress };
      if (progress === 100) updated.status = "Completed";
      setSelectedTask(updated);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    await editTask(id, { status });
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, status });
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "N/A";
  };

  const getEmployeePhoto = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.profile_photo : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300";
  };

  const getProjectName = (id: string | null) => {
    if (!id) return "No project";
    const proj = projects.find((p) => p.id === id);
    return proj ? proj.project_name : "General Operation";
  };

  // Filter lists
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tasks Desk</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage, assign, and comment on activities</p>
        </div>
        <button
          id="btn-add-task-drawer"
          onClick={() => setShowAddModal(true)}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>New Task Deployment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Filter and Task Listing */}
        <div className="lg:col-span-2 space-y-4">
          {/* Query bars */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2 text-slate-400" size={15} />
              <input
                id="input-tasks-search"
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-xs py-2 pl-9 pr-4 text-slate-850 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                id="select-tasks-priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-0 text-[11px] text-slate-700 dark:text-slate-300 rounded-lg p-2 outline-hidden"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                id="select-tasks-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-0 text-[11px] text-slate-700 dark:text-slate-300 rounded-lg p-2 outline-hidden"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                id={`task-item-${t.id}`}
                onClick={() => setSelectedTask(t)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-900 hover:shadow-xs flex items-center justify-between ${
                  selectedTask?.id === t.id
                    ? "border-brand-orange ring-1 ring-brand-orange/20"
                    : "border-slate-100 dark:border-slate-800"
                }`}
              >
                {/* Information cards */}
                <div className="space-y-1 w-2/3">
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span
                      className={`font-semibold uppercase tracking-wider font-mono ${
                        t.priority === "High"
                          ? "text-red-500"
                          : t.priority === "Medium"
                          ? "text-amber-500"
                          : "text-slate-400"
                      }`}
                    >
                      {t.priority} priority
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-400 font-mono italic max-w-[150px] truncate">{getProjectName(t.project_id)}</span>
                  </div>

                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">{t.title}</h4>
                  
                  {/* Progress segment */}
                  <div className="flex items-center space-x-2 mt-2 pt-1 w-full">
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1 flex overflow-hidden">
                      <div
                        className="bg-brand-orange h-1 transition-all"
                        style={{ width: `${t.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{t.progress}% Progress</span>
                  </div>
                </div>

                {/* Avatar and status right badges */}
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide uppercase ${
                      t.status === "Completed"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10"
                        : t.status === "In Progress"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/10"
                        : t.status === "Overdue"
                        ? "bg-red-50 text-red-600 dark:bg-red-900/10"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {t.status}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-mono">Comments: {t.comments.length}</span>
                    <img
                      src={getEmployeePhoto(t.employee_id)}
                      alt="Assigned"
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <p className="text-center py-12 text-slate-400 text-xs italic bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                No active tasks listed currently.
              </p>
            )}
          </div>
        </div>

        {/* Right Columns - Details / Timelines / Comments Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          {selectedTask ? (
            <div className="space-y-5 text-xs text-slate-600 dark:text-slate-350 font-medium">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{selectedTask.title}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Assigned: <span className="font-semibold text-slate-600 dark:text-slate-300">{getEmployeeName(selectedTask.employee_id)}</span></p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status & Progress slider controllers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono">Stage Status</span>
                  <select
                    id="select-task-status-updater"
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                    className="p-1.5 border-0 bg-slate-50 dark:bg-slate-800 font-bold text-[11px] rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase font-mono">
                    <span>Performance Slide</span>
                    <span className="font-bold text-brand-orange font-mono text-[11.5px]">{selectedTask.progress}%</span>
                  </div>
                  <input
                    id="input-task-progress-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedTask.progress}
                    onChange={(e) => handleUpdateProgress(selectedTask.id, Number(e.target.value))}
                    className="w-full accent-brand-orange cursor-ew-resize bg-slate-100 dark:bg-slate-800 h-1 rounded-lg"
                  />
                </div>
              </div>

              {/* Description metadata */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-1">Scope Details</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{selectedTask.description || "No description provided."}</p>
              </div>

              {/* Comments Roster */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-2.5">Team Messages ({selectedTask.comments.length})</span>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="p-2 border border-slate-100/60 dark:border-slate-800/80 rounded-lg bg-slate-50/50 dark:bg-slate-850/20 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">{comment.author}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-medium">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{comment.text}</p>
                    </div>
                  ))}
                  {selectedTask.comments.length === 0 && (
                    <p className="text-center py-3 text-slate-400 italic">No notes posted yet.</p>
                  )}
                </div>

                {/* Comment submitting form */}
                <form onSubmit={handleAddCommentSubmit} className="mt-3 flex items-center space-x-1">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Enter message text..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 p-2 text-xs rounded-lg text-slate-850 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg inline-flex cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>

              {/* General history tracking events */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-2">Audit Logs Tracker</span>
                <div className="space-y-2 max-h-32 overflow-y-auto pl-2 border-l border-slate-200 dark:border-slate-800">
                  {selectedTask.history?.map((h, i) => (
                    <div key={i} className="text-[11px] leading-snug">
                      <p className="text-slate-500 font-medium dark:text-slate-450">{h.action}</p>
                      <span className="text-[9px] text-slate-400 font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 h-full flex flex-col justify-center items-center">
              <Sliders size={30} className="text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs italic">Select any task entry to adjust properties or read comment timelists.</p>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Register New Operation</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs font-medium">
              {formError && (
                <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-md mb-2 font-semibold border border-red-100 dark:border-red-900/40">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Upgrade Web Client Security Filters"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Target Description Detail</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Insert brief activity timeline description"
                  rows={3}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Assigned Employee *</label>
                  <select
                    required
                    value={assignedEmpId}
                    onChange={(e) => setAssignedEmpId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-810 dark:text-white outline-hidden"
                  >
                    <option value="">-- Choose member --</option>
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
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 font-sans">Task Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Target Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  >
                    <option value="">-- No project (General) --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Priority Scale</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
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
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
