export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  createdAt: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joining_date: string;
  salary: number;
  address: string;
  emergency_contact: string;
  profile_photo: string;
  status: "Active" | "Inactive";
}

export interface Attendance {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string | null;
  date: string;
  working_hours: number;
  status: "Present" | "Late" | "Absent" | "Half Day";
}

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  description: string;
  start_date: string;
  end_date: string;
  team_members: string[]; // employee_ids
  budget: number;
  status: "Planning" | "In Progress" | "Completed" | "On Hold" | "Overdue";
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  employee_id: string; // assigned employee ID
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  due_date: string;
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
  progress: number; // 0 to 100
  attachments: string[];
  comments: Comment[];
  history: Array<{ timestamp: string; action: string }>;
}

export interface Leave {
  id: string;
  employee_id: string;
  leave_type: "Casual" | "Sick" | "Paid";
  start_date: string;
  end_date: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

export interface ActivityLog {
  id: string;
  employee_id: string | null;
  admin_name: string | null;
  action: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  type: "info" | "warning" | "success" | "alert";
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}
