import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Admin,
  Employee,
  Attendance,
  Project,
  Task,
  Leave,
  ActivityLog,
  SystemNotification
} from "../types";

interface AppContextType {
  token: string | null;
  admin: Admin | null;
  employees: Employee[];
  attendance: Attendance[];
  projects: Project[];
  tasks: Task[];
  leaves: Leave[];
  logs: ActivityLog[];
  notifications: SystemNotification[];
  isLoading: boolean;
  error: string | null;
  theme: "light" | "dark";
  selectedEmployeeId: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateAdminProfile: (name: string, email: string, password?: string) => Promise<boolean>;
  refreshAllData: () => Promise<void>;
  
  // CRUD actions
  addEmployee: (emp: Omit<Employee, "id" | "employee_id">) => Promise<boolean>;
  editEmployee: (id: string, emp: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  
  addProject: (proj: Omit<Project, "id">) => Promise<boolean>;
  editProject: (id: string, proj: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  
  addTask: (task: Omit<Task, "id" | "comments" | "attachments" | "history">) => Promise<boolean>;
  editTask: (id: string, task: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  addTaskComment: (taskId: string, text: string) => Promise<boolean>;
  
  updateLeaveStatus: (id: string, status: "Approved" | "Rejected") => Promise<boolean>;
  addLeaveRequest: (leave: Omit<Leave, "id">) => Promise<boolean>;
  
  simulateClock: (employee_id: string, action: "check_in" | "check_out") => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  
  setTheme: (t: "light" | "dark") => void;
  setSelectedEmployeeId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">((localStorage.getItem("theme") as "light" | "dark") || "light");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Sync dark class on mount
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Fetch request helper
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! Status: ${res.status}`);
    }
    return res.json();
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setAdmin(data.admin);
      return true;
    } catch (e: any) {
      setError(e.message || "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setAdmin(null);
    setEmployees([]);
    setAttendance([]);
    setProjects([]);
    setTasks([]);
    setLeaves([]);
    setLogs([]);
    setNotifications([]);
  };

  const updateAdminProfile = async (name: string, email: string, password?: string): Promise<boolean> => {
    try {
      setError(null);
      const data = await apiFetch("/api/auth/update", {
        method: "PUT",
        body: JSON.stringify({ name, email, password }),
      });
      setAdmin(data.admin);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const refreshAllData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [empData, attData, projData, taskData, leaveData, logData, notifData, meData] = await Promise.all([
        apiFetch("/api/employees"),
        apiFetch("/api/attendance"),
        apiFetch("/api/projects"),
        apiFetch("/api/tasks"),
        apiFetch("/api/leaves"),
        apiFetch("/api/logs"),
        apiFetch("/api/notifications"),
        apiFetch("/api/auth/me").catch(() => null),
      ]);

      if (meData?.admin) {
        setAdmin(meData.admin);
      }
      setEmployees(empData);
      setAttendance(attData);
      setProjects(projData);
      setTasks(taskData);
      setLeaves(leaveData);
      setLogs(logData);
      setNotifications(notifData);
    } catch (e: any) {
      console.error("Error refreshing dashboard state", e);
      if (e.message?.includes("Unauthorized")) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshAllData();
    }
  }, [token]);

  // Employee CRUDs
  const addEmployee = async (emp: Omit<Employee, "id" | "employee_id">): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify(emp),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const editEmployee = async (id: string, emp: Partial<Employee>): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(emp),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      if (selectedEmployeeId === id) {
        setSelectedEmployeeId(null);
      }
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  // Projects CRM
  const addProject = async (proj: Omit<Project, "id">): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(proj),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const editProject = async (id: string, proj: Partial<Project>): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(proj),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  // Tasks CRM
  const addTask = async (task: Omit<Task, "id" | "comments" | "attachments" | "history">): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const editTask = async (id: string, task: Partial<Task>): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(task),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const addTaskComment = async (taskId: string, text: string): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  // Leaves management
  const updateLeaveStatus = async (id: string, status: "Approved" | "Rejected"): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/leaves/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const addLeaveRequest = async (leave: Omit<Leave, "id">): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch("/api/leaves", {
        method: "POST",
        body: JSON.stringify(leave),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  // Logs / Simulations
  const simulateClock = async (employee_id: string, action: "check_in" | "check_out"): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch("/api/attendance/simulate-clock", {
        method: "POST",
        body: JSON.stringify({ employee_id, action }),
      });
      await refreshAllData();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  // Notifications
  const markNotificationRead = async (id: string): Promise<void> => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    try {
      await apiFetch("/api/notifications/read-all", {
        method: "PUT",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        token,
        admin,
        employees,
        attendance,
        projects,
        tasks,
        leaves,
        logs,
        notifications,
        isLoading,
        error,
        theme,
        selectedEmployeeId,
        login,
        logout,
        updateAdminProfile,
        refreshAllData,
        addEmployee,
        editEmployee,
        deleteEmployee,
        addProject,
        editProject,
        deleteProject,
        addTask,
        editTask,
        deleteTask,
        addTaskComment,
        updateLeaveStatus,
        addLeaveRequest,
        simulateClock,
        markNotificationRead,
        markAllNotificationsRead,
        setTheme,
        setSelectedEmployeeId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used inside an AppProvider wrapper.");
  }
  return context;
}
