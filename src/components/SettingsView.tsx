import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Settings,
  Lock,
  User,
  BellRing,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function SettingsView() {
  const { admin, updateAdminProfile, isLoading } = useApp();

  const [name, setName] = useState(admin?.name || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Simulated System configurations
  const [lateThreshold, setLateThreshold] = useState("09:05");
  const [workingHoursLimit, setWorkingHoursLimit] = useState("8.0");
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [enableAuditLogs, setEnableAuditLogs] = useState(true);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (password && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      const payload: any = { name, email };
      if (password) payload.password = password;

      const success = await updateAdminProfile(name, email, password || undefined);
      if (success) {
        setSuccessMsg("Admin Profile details updated successfully.");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg("Failed to update admin profile.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Settings Panel</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Update credentials, toggle triggers, and customize shift guidelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: System Toggles card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Settings className="text-brand-orange" size={16} />
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">System Guidelines</h4>
          </div>

          <div className="space-y-4 text-xs font-medium">
            <div>
              <label className="text-slate-450 dark:text-slate-400 block mb-1">Standard Check-In Threshold</label>
              <input
                type="time"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-800 dark:text-white font-mono border-0 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Check-ins past this trigger will flag as Tardy/Late.</p>
            </div>

            <div>
              <label className="text-slate-450 dark:text-slate-400 block mb-1">Required Shift Duration</label>
              <input
                type="number"
                step="0.5"
                value={workingHoursLimit}
                onChange={(e) => setWorkingHoursLimit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-850 dark:text-white font-mono border-0 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Goal of target working hours per employee shift.</p>
            </div>

            {/* Sim Switch Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-50 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Enable Alert Sounds</span>
                <input
                  type="checkbox"
                  checked={enableAlerts}
                  onChange={(e) => setEnableAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-orange bg-gray-100 border-gray-300 rounded focus:ring-brand-orange"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trace Audit Logs</span>
                <input
                  type="checkbox"
                  checked={enableAuditLogs}
                  onChange={(e) => setEnableAuditLogs(e.target.checked)}
                  className="w-4 h-4 text-brand-orange bg-gray-100 border-gray-300 rounded focus:ring-brand-orange"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Admin Credentials Editor card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-5">
            <Lock className="text-brand-navy" size={16} />
            <h4 className="font-bold text-slate-800 dark:text-white text-sm font-sans">Modify Security Passphrase</h4>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-medium">
            {successMsg && (
              <p className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-md border border-emerald-100 dark:border-emerald-950/50">
                {successMsg}
              </p>
            )}

            {errorMsg && (
              <p className="text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-md border border-red-100 dark:border-red-950/50">
                {errorMsg}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-450 dark:text-slate-400 block mb-1">Admin Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-800 dark:text-white border-0 outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-450 dark:text-slate-400 block mb-1">Registered email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-800 dark:text-white border-0 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-slate-450 dark:text-slate-400 block mb-1">New password (optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to remain same"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-800 dark:text-white border-0 outline-hidden focus:ring-1 focus:ring-brand-orange font-mono"
                />
              </div>

              <div>
                <label className="text-slate-450 dark:text-slate-400 block mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter confirmation"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-slate-800 dark:text-white border-0 outline-hidden focus:ring-1 focus:ring-brand-orange font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs py-2 px-5 rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                Save Credentials Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
