import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Employee } from "../types";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Filter,
  X,
  Plus,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";

export default function EmployeesView() {
  const {
    employees,
    addEmployee,
    editEmployee,
    deleteEmployee,
    setSelectedEmployeeId,
    isLoading
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Add/Edit Modal toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salary, setSalary] = useState<number>(50000);
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [formError, setFormError] = useState("");

  const departments = ["Engineering", "Product Design", "Human Resources", "Marketing", "Finance", "Sales"];

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === "All" || emp.department === deptFilter;
    const matchesStatus = statusFilter === "All" || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("Engineering");
    setDesignation("");
    setJoiningDate(new Date().toISOString().split("T")[0]);
    setSalary(50000);
    setAddress("");
    setEmergencyContact("");
    setProfilePhoto("");
    setStatus("Active");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setDepartment(emp.department);
    setDesignation(emp.designation);
    setJoiningDate(emp.joining_date);
    setSalary(emp.salary);
    setAddress(emp.address);
    setEmergencyContact(emp.emergency_contact);
    setProfilePhoto(emp.profile_photo);
    setStatus(emp.status);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !designation) {
      setFormError("Detailed name, email and designation are required elements.");
      return;
    }

    const payload = {
      name,
      email,
      phone,
      department,
      designation,
      joining_date: joiningDate,
      salary: Number(salary),
      address,
      emergency_contact: emergencyContact,
      profile_photo: profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300",
      status,
    };

    let success = false;
    if (editingEmployee) {
      success = await editEmployee(editingEmployee.id, payload);
    } else {
      success = await addEmployee(payload);
    }

    if (success) {
      setIsModalOpen(false);
    } else {
      setFormError("Operation failed. Try testing unique emails.");
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete ${empName}? This will clear all active records.`)) {
      await deleteEmployee(id);
    }
  };

  // Convert profile photo base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Browser-based CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Employee ID",
      "Full Name",
      "Email Address",
      "Department",
      "Designation",
      "Status",
      "Salary",
      "Join Date",
      "Phone",
      "Address",
      "Emergency Contact"
    ];

    const rows = filteredEmployees.map((emp) => [
      emp.employee_id,
      `"${emp.name.replace(/"/g, '""')}"`,
      emp.email,
      emp.department,
      `"${emp.designation.replace(/"/g, '""')}"`,
      emp.status,
      emp.salary,
      emp.joining_date,
      emp.phone,
      `"${emp.address.replace(/"/g, '""')}"`,
      `"${emp.emergency_contact.replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Staff Directories</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total counted matches: {filteredEmployees.length} employees</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            id="btn-export-employees"
            onClick={handleExportCSV}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-add-employee"
            onClick={openAddModal}
            className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Query search and filter blocks */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            id="input-employee-search"
            type="text"
            placeholder="Search by name, email, employee ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-xs py-2.5 pl-10 pr-4 text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Dept filter */}
          <div className="flex items-center space-x-2 flex-1 md:flex-none">
            <Filter size={13} className="text-slate-400" />
            <select
              id="select-dept-filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-0 text-xs text-slate-700 dark:text-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-brand-orange"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-0 text-xs text-slate-700 dark:text-slate-200 rounded-lg p-2.5 outline-hidden focus:ring-1 focus:ring-brand-orange flex-1 md:flex-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid List view of Employees */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                <th className="p-4">Employee</th>
                <th className="p-4">Credentials</th>
                <th className="p-4">Department & Duty</th>
                <th className="p-4">Salary</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-xs"
                >
                  <td className="p-4 flex items-center space-x-3">
                    <img
                      src={emp.profile_photo}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-50"
                    />
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200">{emp.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employee_id}</p>
                    </div>
                  </td>
                  <td className="p-4 space-y-0.5">
                    <div className="text-slate-600 dark:text-slate-300 font-medium flex items-center"><Mail size={12} className="mr-1.5 text-slate-400" />{emp.email}</div>
                    <div className="text-slate-400 font-mono text-[11px] flex items-center"><Phone size={11} className="mr-1.5" />{emp.phone || "No phone"}</div>
                  </td>
                  <td className="p-4 space-y-0.5">
                    <span className="inline-block px-1.5 py-0.5 font-mono text-[10px] rounded-sm bg-brand-navy/10 dark:bg-brand-navy/35 text-brand-navy dark:text-slate-200">
                      {emp.department}
                    </span>
                    <div className="text-slate-500 font-medium text-[11px] mt-0.5">{emp.designation}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                    ${emp.salary.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`}></span>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      id={`btn-view-${emp.id}`}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex transition-colors cursor-pointer"
                      title="View Profile Details"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      id={`btn-edit-${emp.id}`}
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 bg-brand-orange/10 text-brand-orange rounded-md hover:bg-brand-orange/20 inline-flex transition-colors cursor-pointer"
                      title="Edit details"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      id={`btn-delete-${emp.id}`}
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-md hover:bg-red-100/65 dark:hover:bg-red-800/35 inline-flex transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 dark:text-slate-500 italic">
                    No matching employees found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Form MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                {editingEmployee ? "Update Employee Data Profile" : "Register a New Employee"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 text-xs rounded-lg border border-red-100 dark:border-red-950/50">
                  {formError}
                </div>
              )}

              {/* General grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                    placeholder="Enter corporate email"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Salary (Annual USD)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                  placeholder="Street name, City, Zip"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Emergency Contact Info</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border-0 p-2.5 rounded-lg text-slate-800 dark:text-white outline-hidden focus:ring-1 focus:ring-brand-orange"
                  placeholder="e.g. Spouse Name (+1 123-456-7890)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Profile Photograph</label>
                <div className="flex items-center space-x-3">
                  {profilePhoto && (
                    <img
                      src={profilePhoto}
                      alt="Uploaded preview"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-orange/10 file:text-brand-orange hover:file:bg-brand-orange/20 dark:file:bg-slate-800 dark:file:text-slate-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Accepts PNG/JPG. Standard format size compressed on-fly.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingEmployee ? "Save Adjustments" : "Register Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
