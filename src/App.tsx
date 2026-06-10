import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import EmployeesView from "./components/EmployeesView";
import EmployeeDetailsView from "./components/EmployeeDetailsView";
import AttendanceView from "./components/AttendanceView";
import ProjectsView from "./components/ProjectsView";
import TasksView from "./components/TasksView";
import LeavesView from "./components/LeavesView";
import ReportsView from "./components/ReportsView";
import NotificationsView from "./components/NotificationsView";
import SettingsView from "./components/SettingsView";
import { ShieldCheck, Mail, Lock, Key, LayoutGrid, Calendar, HelpCircle } from "lucide-react";

function DashboardContent() {
  const { token, admin, selectedEmployeeId, setSelectedEmployeeId, theme, error } = useApp();
  const [activeTab, setActiveTabTab] = useState("dashboard");

  // Format Current Date representation
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");

  const setActiveTab = (tab: string) => {
    // If drilling down into subpanels, clear simple selectors
    if (tab !== "employees") {
      setSelectedEmployeeId(null);
    }
    setActiveTabTab(tab);
  };

  useEffect(() => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDateFormatted(d.toLocaleDateString("en-US", options));
  }, []);

  // Sync state if selectedEmployeeId is set, show employee dossier
  const renderActiveView = () => {
    if (selectedEmployeeId) {
      return <EmployeeDetailsView />;
    }

    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "employees":
        return <EmployeesView />;
      case "attendance":
        return <AttendanceView />;
      case "projects":
        return <ProjectsView />;
      case "tasks":
        return <TasksView />;
      case "leaves":
        return <LeavesView />;
      case "reports":
        return <ReportsView />;
      case "notifications":
        return <NotificationsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // If no auth token, render high-end Login Interface
  if (!token) {
    return <AdminLoginGate />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Navigation sidebar */}
      <Sidebar activeTab={selectedEmployeeId ? "employees" : activeTab} setActiveTab={setActiveTab} />

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-2">
            <Calendar className="text-brand-orange" size={16} />
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              {currentDateFormatted || "Wednesday, June 10, 2026"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Simple notification bell trigger */}
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-500 dark:text-slate-400 font-mono font-medium">
              System IP: 127.0.0.1
            </span>
          </div>
        </header>

        {/* Content canvas container */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/80">
          <div className="max-w-7xl mx-auto pb-10">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Administrative Login Screen
function AdminLoginGate() {
  const { login, isLoading } = useApp();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [localError, setLocalError] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setLocalError("Please populate both email and password inputs.");
      return;
    }
    setLocalError("");
    
    const success = await login(emailInput, passwordInput);
    if (!success) {
      setLocalError("Credentials verification failed. Review demo helper guidelines.");
    }
  };

  const autofillCredentials = (email: string, pass: string) => {
    setEmailInput(email);
    setPasswordInput(pass);
    setLocalError("");
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Brand visual header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-brand-orange/10 text-brand-orange p-3 rounded-2xl border border-brand-orange/20 mb-1">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold font-sans text-white tracking-tight">TeamFlow Admin Engine</h2>
          <p className="text-xs text-slate-400">Secure entry access for HR Administrators & Analysts</p>
        </div>

        {forgotPasswordStep ? (
          <div className="space-y-4 text-xs font-medium text-slate-400">
            <h3 className="text-sm font-bold text-white">Reset credentials key?</h3>
            <p className="leading-relaxed">To comply with local security protocols, administrative password recoveries must be authorized via physical master recovery keys. Please refer to system installation paperwork or credentials logs.</p>
            <div className="p-3 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-lg">
              <span className="font-bold">Alternative:</span> Use preset accounts displayed in the quick-start credential helper panel below.
            </div>
            <button
              onClick={() => setForgotPasswordStep(false)}
              className="font-bold text-brand-orange hover:underline hover:text-brand-orange-hover cursor-pointer text-center block w-full text-xs"
            >
              Return to standard log-in
            </button>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold text-slate-350">
            {localError && (
              <p className="p-3 rounded-lg text-red-500 bg-red-950/20 border border-red-900/40 text-[11px] leading-relaxed">
                {localError}
              </p>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Administrative Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={14} />
                <input
                  id="login-email-field"
                  type="email"
                  required
                  placeholder="admin@teamflow.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-white outline-hidden focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400">Passphrase</label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordStep(true)}
                  className="text-brand-orange hover:underline text-[10px] cursor-pointer font-bold"
                >
                  Forgot secret password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={14} />
                <input
                  id="login-password-field"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-white outline-hidden focus:border-brand-orange font-mono"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold p-3 rounded-lg cursor-pointer text-xs uppercase tracking-wider transition-colors"
            >
              {isLoading ? "Validating Session..." : "Secure Sign In"}
            </button>
          </form>
        )}

        {/* Demo Fast credentials helper box */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[10px]">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Demo Accounts Quick Fill</span>
          
          {/* Main customized super admin account requested by user */}
          <button
            onClick={() => autofillCredentials("startupvlsp2026@gmail.com", "manivasu")}
            className="w-full p-2.5 border border-brand-orange/30 bg-brand-orange/5 hover:bg-brand-orange/10 rounded-lg text-left transition-colors font-medium cursor-pointer mb-2 block"
          >
            <span className="font-bold block text-brand-orange">👑 Active VLSP Super Admin</span>
            <span className="text-slate-350">Email: startupvlsp2026@gmail.com • Pass: manivasu</span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-slate-350">
            <button
              onClick={() => autofillCredentials("admin@teamflow.com", "password123")}
              className="p-2 border border-slate-800 bg-slate-900/30 hover:bg-slate-800 rounded text-left transition-colors font-medium cursor-pointer"
            >
              <span className="font-bold block text-white">Super Admin</span>
              <span>admin@teamflow.com</span>
            </button>
            <button
              onClick={() => autofillCredentials("elena@teamflow.com", "admin123")}
              className="p-2 border border-slate-800 bg-slate-900/30 hover:bg-slate-800 rounded text-left transition-colors font-medium cursor-pointer"
            >
              <span className="font-bold block text-white">Project Admin</span>
              <span>elena@teamflow.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
