import React from "react";
import { useApp } from "../context/AppContext";
import {
  Bell,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  BellRing
} from "lucide-react";

export default function NotificationsView() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    isLoading
  } = useApp();

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
  };

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System notifications</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total counted logs: {notifications.length}</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            id="btn-notifications-read-all"
            onClick={handleMarkAll}
            className="bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Check size={14} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs max-w-4xl space-y-3">
        {notifications.map((notif) => {
          const Icon = getIcon(notif.type);
          const iconColor = getIconColor(notif.type);
          return (
            <div
              key={notif.id}
              id={`notif-card-${notif.id}`}
              className={`p-4 rounded-xl border transition-colors flex items-start justify-between text-xs font-medium ${
                notif.is_read
                  ? "bg-slate-50/20 dark:bg-slate-850/10 border-slate-100/50 dark:border-slate-800/50"
                  : "bg-blue-50/20 dark:bg-blue-900/5 border-blue-100/50 dark:border-blue-800/50"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-2 rounded-full ${iconColor} inline-flex mt-0.5`}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{notif.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">{notif.message}</p>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-2 block">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  id={`btn-read-notif-${notif.id}`}
                  onClick={() => handleRead(notif.id)}
                  className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-md transition-colors cursor-pointer"
                  title="Mark read"
                >
                  <Check size={13} />
                </button>
              )}
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <BellRing className="mx-auto text-slate-300 dark:text-slate-700 mb-2 animate-bounce" size={32} />
            <p className="text-xs italic">All clean! No system notifications generated.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getIcon(type: "info" | "warning" | "success" | "alert") {
  switch (type) {
    case "warning":
      return AlertTriangle;
    case "success":
      return CheckCircle2;
    case "alert":
      return Bell;
    default:
      return Info;
  }
}

function getIconColor(type: "info" | "warning" | "success" | "alert") {
  switch (type) {
    case "warning":
      return "bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400";
    case "success":
      return "bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-450";
    case "alert":
      return "bg-amber-50 text-amber-655 dark:bg-amber-950/20 dark:text-amber-400";
    default:
      return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400";
  }
}
