import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit
} from "firebase/firestore";

// Read Firebase Config securely from relative workspace root or environment variables (for platforms like Render)
let firebaseConfig: any = null;
const configPath = path.join(process.cwd(), "firebase-applet-config.json");

if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} else if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (e) {
    console.error("Failed to parse process.env.FIREBASE_CONFIG", e);
  }
} else if (process.env.FIREBASE_API_KEY) {
  firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-9357ddb4-1620-40c7-a3c5-93491b660fe8"
  };
}

if (!firebaseConfig) {
  console.warn("WARNING: Firebase Config not found! Please provide it in 'firebase-applet-config.json' or ENVIRONMENT VARIABLES.");
  firebaseConfig = {
    apiKey: "placeholder",
    authDomain: "placeholder",
    projectId: "placeholder",
    appId: "placeholder",
    firestoreDatabaseId: "ai-studio-9357ddb4-1620-40c7-a3c5-93491b660fe8"
  };
}

// Initialize Web Firebase App
const app = initializeApp(firebaseConfig);

// Export Firestore database with explicit custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "ai-studio-9357ddb4-1620-40c7-a3c5-93491b660fe8");

// Test Firestore database connectivity on startup as mandated
async function testConnection() {
  try {
    const docRef = doc(db, "test", "connection");
    await getDoc(docRef);
    console.log("[Firebase Status] Connection of Firestore initialized successfully (Web Mode).");
  } catch (error) {
    console.log("[Firebase Status] Initial validation check done:", error);
  }
}
testConnection();

// --- TYPE INTERFACES EXPORTED ---

export interface Admin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
  check_in: string; // ISO DateTime
  check_out: string | null; // ISO DateTime or null
  date: string; // YYYY-MM-DD
  working_hours: number;
  status: "Present" | "Late" | "Absent" | "Half Day";
}

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
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
  due_date: string; // YYYY-MM-DD
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
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

export interface ActivityLog {
  id: string;
  employee_id: string | null;
  admin_name: string | null;
  action: string;
  timestamp: string; // ISO
}

export interface SystemNotification {
  id: string;
  type: "info" | "warning" | "success" | "alert";
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

// Admins seed state
const DEFAULT_ADMINS: Admin[] = [
  {
    id: "admin-1",
    name: "Alex Rivera",
    email: "admin@teamflow.com",
    passwordHash: "password123", // default password
    role: "super_admin",
    createdAt: "2026-01-10T12:00:00Z",
  },
  {
    id: "admin-2",
    name: "Elena Rostova",
    email: "elena@teamflow.com",
    passwordHash: "admin123",
    role: "admin",
    createdAt: "2026-02-15T09:30:00Z",
  },
  {
    id: "admin-3",
    name: "Startup VLSP Admin",
    email: "startupvlsp2026@gmail.com",
    passwordHash: "manivasu",
    role: "super_admin",
    createdAt: "2026-06-10T10:48:00Z",
  }
];

// Helper to seed root admin accounts if database empty in the Cloud
export async function seedAdminsIfEmpty(): Promise<void> {
  try {
    for (const admin of DEFAULT_ADMINS) {
      const adminDocRef = doc(db, "admins", admin.id);
      const docSnap = await getDoc(adminDocRef);
      if (!docSnap.exists()) {
        console.log(`[Firebase Status] Seeding administrative profile for ${admin.email}...`);
        await setDoc(adminDocRef, admin);
      }
    }
    console.log("[Firebase Status] Admin profiles initialization verified (Web Mode).");
  } catch (e) {
    console.error("[Firebase Status] SEED FAILED. Check credentials or connection rules.", e);
  }
}

// Re-export standard query constraints and functions directly
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit
};
