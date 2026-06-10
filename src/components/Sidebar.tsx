import React from "react";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  CheckSquare,
  FileSpreadsheet,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { admin, logout, theme, setTheme, notifications, leaves } = useApp();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const pendingLeavesCount = leaves.filter((l) => l.status === "Pending").length;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "leaves", label: "Leaves", icon: UserCheck, badge: pendingLeavesCount },
    { id: "reports", label: "Reports", icon: FileSpreadsheet },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-brand-navy text-white flex flex-col h-full border-r border-brand-navy-hover">
      {/* Brand Header */}
      <div className="p-6 border-b border-brand-navy-hover flex items-center space-x-3">
        <div className="bg-brand-orange p-2 rounded-lg text-white font-bold">
          <ShieldCheck size={22} id="btn-brand-logo" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">TeamFlow</h1>
          <p className="text-xs text-slate-300 font-mono">Admin Engine</p>
        </div>
      </div>

      {/* Auth Admin Box */}
      <div className="p-4 mx-4 my-3 bg-brand-navy-hover rounded-xl border border-brand-navy-hover flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center font-bold text-slate-100 text-sm">
          {admin?.name ? admin.name.split(" ").map((n) => n[0]).join("") : "AD"}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-medium text-slate-100 truncate">{admin?.name || "Administrator"}</h4>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-brand-orange font-mono font-bold capitalize">
            {admin?.role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 py-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? "bg-brand-orange text-white shadow-xs"
                  : "text-slate-200 hover:bg-brand-navy-hover hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={18} className={isActive ? "text-white" : "text-brand-orange"} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className="bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle & Sign Out Footer */}
      <div className="p-4 border-t border-brand-navy-hover space-y-2">
        <div className="flex items-center justify-between px-3 py-1.5 bg-brand-navy-hover rounded-lg">
          <span className="text-xs text-slate-300 font-medium">Appearance</span>
          <button
            id="btn-sidebar-theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-1.5 rounded-md hover:bg-brand-orange text-slate-100 hover:text-white transition-colors cursor-pointer"
            title="Toggle theme mode"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <button
          id="btn-sidebar-logout"
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-300 hover:bg-white/10 hover:text-red-200 rounded-lg transition-colors font-medium mt-1 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}
