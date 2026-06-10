import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Project } from "../types";
import {
  FolderKanban,
  Calendar,
  DollarSign,
  Plus,
  Users,
  Search,
  Briefcase,
  X,
  Trash2,
  ListFilter
} from "lucide-react";

export default function ProjectsView() {
  const {
    projects,
    employees,
    addProject,
    deleteProject,
    editProject,
    isLoading
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<number>(10000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [projectStatus, setProjectStatus] = useState<any>("Planning");

  const [modalError, setModalError] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !clientName) {
      setModalError("Project name and customer are required fields.");
      return;
    }

    const success = await addProject({
      project_name: projectName,
      client_name: clientName,
      description,
      budget: Number(budget),
      start_date: startDate,
      end_date: endDate,
      team_members: teamMembers,
      status: projectStatus,
    });

    if (success) {
      // clear
      setProjectName("");
      setClientName("");
      setDescription("");
      setBudget(10000);
      setTeamMembers([]);
      setProjectStatus("Planning");
      setModalError("");
      setShowAddModal(false);
    } else {
      setModalError("Failed to register project.");
    }
  };

  const handleMemberToggle = (id: string) => {
    if (teamMembers.includes(id)) {
      setTeamMembers(teamMembers.filter((m) => m !== id));
    } else {
      setTeamMembers([...teamMembers, id]);
    }
  };

  const getEmployeePhoto = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.profile_photo : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300";
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "N/A";
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project '${name}'?`)) {
      await deleteProject(id);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header controls of panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-sans">Projects Registry</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total matched trackers: {filteredProjects.length} projects</p>
        </div>
        <button
          id="btn-add-project-modal"
          onClick={() => setShowAddModal(true)}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Define New Project</span>
        </button>
      </div>

      {/* Query filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            id="input-projects-search"
            type="text"
            placeholder="Search by project name, client or description details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-xs py-2.5 pl-10 pr-4 text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <ListFilter size={13} className="text-slate-400" />
          <select
            id="select-project-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-0 text-xs text-slate-700 dark:text-slate-200 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-brand-orange flex-1 md:flex-none"
          >
            <option value="All">All statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Projects Grid card elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => (
          <div key={proj.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="p-5">
              {/* Head Status info */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-slate-400 font-mono tracking-wide font-semibold truncate max-w-[150px]">{proj.client_name}</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${
                    proj.status === "Completed"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                      : proj.status === "In Progress"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      : proj.status === "Overdue"
                      ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              {/* Title descriptions */}
              <h4 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{proj.project_name}</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">{proj.description}</p>

              {/* Milestones / Dates and Budget counters */}
              <div className="grid grid-cols-2 gap-4 mt-5 text-xs font-medium border-t border-b border-slate-50 dark:border-slate-800/60 py-3 mb-4">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Budget Alloc</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-slate-100 flex items-center">
                    <DollarSign size={13} className="text-slate-400 mr-0.5" />
                    {proj.budget.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Deadline</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-slate-100 flex items-center">
                    <Calendar size={13} className="text-slate-400 mr-1" />
                    {proj.end_date || "Continuous"}
                  </span>
                </div>
              </div>

              {/* Team members stack list */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block mb-2 font-semibold">Allocated Team ({proj.team_members.length})</span>
                <div className="flex items-center -space-x-2 overflow-hidden py-1">
                  {proj.team_members.map((id, idx) => (
                    <img
                      key={id}
                      src={getEmployeePhoto(id)}
                      alt={getEmployeeName(id)}
                      referrerPolicy="no-referrer"
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover bg-slate-100"
                      title={getEmployeeName(id)}
                    />
                  ))}
                  {proj.team_members.length === 0 && (
                    <span className="text-slate-400 text-xs font-serif italic">Unassigned roster.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800/60 flex justify-end space-x-1.5">
              <button
                id={`btn-del-proj-${proj.id}`}
                onClick={() => handleDeleteProject(proj.id, proj.project_name)}
                className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-colors cursor-pointer"
                title="Remove Project tracker"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <FolderKanban className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={36} />
            <p className="text-xs text-slate-400 italic">No project trackers match the query.</p>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Setup New Project Tracker</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 text-xs font-medium">
              {modalError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/25 text-red-500 rounded-md border border-red-100 dark:border-red-950/40 font-semibold mb-2">
                  {modalError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Android Customer Portal v3"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Client / Customer Label *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Apex Corporation"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Brief Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter scope details"
                  rows={3}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Annual Budget (USD)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Stage Status</label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 font-sans">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 font-sans">End Date / Deadline</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden"
                  />
                </div>
              </div>

              {/* Team selection block */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Allocate Team Members ({teamMembers.length})</label>
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-850/50 max-h-36 overflow-y-auto space-y-2">
                  {employees
                    .filter((e) => e.status === "Active")
                    .map((emp) => {
                      const isAlloc = teamMembers.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => handleMemberToggle(emp.id)}
                          className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                            isAlloc
                              ? "bg-brand-orange/10 border-brand-orange/30 dark:bg-brand-orange/15 dark:border-brand-orange/40"
                              : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800/50 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={emp.profile_photo}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{emp.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{emp.department}</span>
                        </div>
                      );
                    })}
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
                  Create Project Tasker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
