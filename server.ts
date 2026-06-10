import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  db,
  seedAdminsIfEmpty,
  Admin,
  Employee,
  Attendance,
  Project,
  Task,
  Leave,
  ActivityLog,
  SystemNotification,
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
} from "./server-db";


const PORT = 3000;

// Operation Types as defined by the Firebase Skill guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

// Error Handler helper as mandated by Skill Guidelines
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, req?: Request) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: (req as any)?.admin?.id || null,
      email: (req as any)?.admin?.email || null,
    }
  };
  console.error('[Firestore Error Handled]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Simple middleware to parse token-based auth
async function getAuthenticatedAdmin(req: Request): Promise<Admin | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  if (!token.startsWith("token-")) return null;

  const adminId = token.replace("token-", "");
  try {
    const adminDoc = await getDoc(doc(db, "admins", adminId));
    if (!adminDoc.exists()) return null;
    return adminDoc.data() as Admin;
  } catch (error) {
    return null;
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: "Unauthorized access: admin verification failed." });
  }
  (req as any).admin = admin;
  next();
}

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Seed default admin accounts if clean installation
  await seedAdminsIfEmpty();

  // Helper logger
  const logActivity = async (action: string, employeeIdValue: string | null = null, adminNameValue: string | null = null) => {
    try {
      const id = "log-" + Math.random().toString(36).substr(2, 9);
      const newLog: ActivityLog = {
        id,
        employee_id: employeeIdValue,
        admin_name: adminNameValue,
        action,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, "activity_logs", id), newLog);
    } catch (e) {
      console.error("Failed to persist log trace in Firestore:", e);
    }
  };

  const throwNotification = async (type: "info" | "warning" | "success" | "alert", title: string, message: string) => {
    try {
      const id = "notif-" + Math.random().toString(36).substr(2, 9);
      const newNotif: SystemNotification = {
        id,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        is_read: false,
      };
      await setDoc(doc(db, "notifications", id), newNotif);
    } catch (e) {
      console.error("Failed to persist notification in Firestore:", e);
    }
  };

  // --- API ROUTES OVER RIDE ---

  // Auth
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required fields." });
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const q = query(collection(db, "admins"), where("email", "==", trimmedEmail));
      const querySnapshot = await getDocs(q);
      let matchedAdmin: Admin | null = null;
      
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data() as Admin;
        if (item.passwordHash === trimmedPassword || item.passwordHash === password) {
          matchedAdmin = item;
        }
      });

      if (!matchedAdmin) {
        return res.status(401).json({ error: "Invalid credentials. Please try again." });
      }

      res.json({
        token: `token-${matchedAdmin.id}`,
        admin: {
          id: matchedAdmin.id,
          name: matchedAdmin.name,
          email: matchedAdmin.email,
          role: matchedAdmin.role,
          createdAt: matchedAdmin.createdAt,
        },
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "admins", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: "No active session." });
    }
    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  });

  // Update admin Profile
  app.put("/api/auth/update", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { name, email, password } = req.body;

    try {
      const adminRef = doc(db, "admins", admin.id);
      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (password) updates.passwordHash = password;

      await updateDoc(adminRef, updates);
      await logActivity(`Admin profile updated (ID: ${admin.id})`, null, name || admin.name);

      res.json({
        message: "Profile updated successfully.",
        admin: {
          id: admin.id,
          name: name || admin.name,
          email: email || admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `admins/${admin.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // EMPLOYEES CRUD
  app.get("/api/employees", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "employees"));
      const employees = snapshot.docs.map(docSnap => docSnap.data());
      res.json(employees);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "employees", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.get("/api/employees/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const employeeDoc = await getDoc(doc(db, "employees", req.params.id));
      if (!employeeDoc.exists()) {
        return res.status(404).json({ error: "Employee not found." });
      }
      res.json(employeeDoc.data());
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, `employees/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.post("/api/employees", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const {
      name,
      email,
      phone,
      department,
      designation,
      joining_date,
      salary,
      address,
      emergency_contact,
      profile_photo,
      status,
    } = req.body;

    if (!name || !email || !department || !designation) {
      return res.status(400).json({ error: "Name, email, department and designation are required." });
    }

    try {
      // Check duplicate matching email
      const q = query(collection(db, "employees"), where("email", "==", email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return res.status(400).json({ error: "An employee with this email already exists." });
      }

      // Generate incremental readable custom employee_id
      const totalSnap = await getDocs(collection(db, "employees"));
      const count = totalSnap.size + 1;
      const padding = count < 10 ? "00" : count < 100 ? "0" : "";
      const employee_id = `EMP-${padding}${count}`;

      const id = "emp-" + Math.random().toString(36).substr(2, 9);
      const newEmployee: Employee = {
        id,
        employee_id,
        name,
        email,
        phone: phone || "",
        department,
        designation,
        joining_date: joining_date || new Date().toISOString().split("T")[0],
        salary: Number(salary) || 0,
        address: address || "",
        emergency_contact: emergency_contact || "",
        profile_photo: profile_photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300",
        status: status || "Active",
      };

      await setDoc(doc(db, "employees", id), newEmployee);

      await logActivity(`Registered new employee ${name} (${employee_id})`, newEmployee.id, admin.name);
      await throwNotification("success", "New Employee Registered", `${name} (${employee_id}) has been added to ${department}.`);

      res.status(201).json(newEmployee);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, "employees", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/employees/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "employees", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Employee not found." });
      }

      const original = snap.data() as Employee;
      const updated = { ...original, ...req.body };

      if (req.body.salary !== undefined) {
        updated.salary = Number(req.body.salary);
      }

      await setDoc(docRef, updated);

      await logActivity(`Updated details for employee ${updated.name} (${updated.employee_id})`, updated.id, admin.name);
      res.json(updated);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `employees/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.delete("/api/employees/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "employees", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Employee not found." });
      }

      const employee = snap.data() as Employee;
      await deleteDoc(docRef);

      await logActivity(`Deleted employee entry: ${employee.name} (${employee.employee_id})`, null, admin.name);
      await throwNotification("warning", "Employee Entry Deleted", `${employee.name} (${employee.employee_id}) has been removed.`);

      res.json({ message: "Employee deleted successfully." });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `employees/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // ATTENDANCE CRUD & CONTROL
  app.get("/api/attendance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "attendance"));
      const logs = snapshot.docs.map(docSnap => docSnap.data());
      res.json(logs);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "attendance", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.post("/api/attendance", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { employee_id, check_in, check_out, date, status } = req.body;

    if (!employee_id || !date) {
      return res.status(400).json({ error: "Employee and date are required." });
    }

    try {
      const empSnap = await getDoc(doc(db, "employees", employee_id));
      if (!empSnap.exists()) {
        return res.status(404).json({ error: "Employee not found." });
      }
      const employee = empSnap.data() as Employee;

      // Check duplicates
      const q = query(collection(db, "attendance"), where("employee_id", "==", employee_id), where("date", "==", date));
      const dupSnap = await getDocs(q);
      if (!dupSnap.empty) {
        return res.status(400).json({ error: "Attendance for this individual on this date already exists." });
      }

      let hours = 0;
      if (check_in && check_out) {
        const diffMs = Math.abs(new Date(check_out).getTime() - new Date(check_in).getTime());
        hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }

      let derivedStatus = status || "Present";
      if (check_in && !status) {
        const timeStr = new Date(check_in).toISOString().split("T")[1];
        if (timeStr && timeStr > "09:05:00") {
          derivedStatus = "Late";
        }
      }

      const id = "att-" + Math.random().toString(36).substr(2, 9);
      const newAttendance: Attendance = {
        id,
        employee_id,
        check_in: check_in || new Date().toISOString(),
        check_out: check_out || null,
        date,
        working_hours: hours,
        status: derivedStatus,
      };

      await setDoc(doc(db, "attendance", id), newAttendance);

      await logActivity(`Logged manual attendance for ${employee.name} (${date})`, employee_id, admin.name);
      res.status(201).json(newAttendance);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, "attendance", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/attendance/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "attendance", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Attendance record not found." });
      }

      const original = snap.data() as Attendance;
      const updated = { ...original, ...req.body };

      if (updated.check_in && updated.check_out) {
        const diffMs = Math.abs(new Date(updated.check_out).getTime() - new Date(updated.check_in).getTime());
        updated.working_hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }

      await setDoc(docRef, updated);

      const empSnap = await getDoc(doc(db, "employees", updated.employee_id));
      const employee = empSnap.exists() ? (empSnap.data() as Employee) : null;
      await logActivity(`Updated attendance record for ${employee ? employee.name : "Employee"} [${updated.date}]`, updated.employee_id, admin.name);

      res.json(updated);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `attendance/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // Simulated live clock-in / clock-out device
  app.post("/api/attendance/simulate-clock", requireAdmin, async (req: Request, res: Response) => {
    const { employee_id, action } = req.body;
    if (!employee_id || !action) {
      return res.status(400).json({ error: "employee_id and action description are required." });
    }

    try {
      const empSnap = await getDoc(doc(db, "employees", employee_id));
      if (!empSnap.exists()) {
        return res.status(404).json({ error: "Employee matching ID structure is not found." });
      }
      const employee = empSnap.data() as Employee;

      const todayStr = new Date().toISOString().split("T")[0];

      if (action === "check_in") {
        const q = query(collection(db, "attendance"), where("employee_id", "==", employee_id), where("date", "==", todayStr));
        const checkSnaps = await getDocs(q);
        if (!checkSnaps.empty) {
          return res.status(400).json({ error: "This employee is already checked in for today." });
        }

        const now = new Date();
        let status: "Present" | "Late" = "Present";
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        if (currentHour > 9 || (currentHour === 9 && currentMin > 5)) {
          status = "Late";
        }

        const id = "att-" + Math.random().toString(36).substr(2, 9);
        const newAtt: Attendance = {
          id,
          employee_id,
          check_in: now.toISOString(),
          check_out: null,
          date: todayStr,
          working_hours: 0,
          status,
        };

        await setDoc(doc(db, "attendance", id), newAtt);
        await logActivity(`${employee.name} checked in (Status: ${status})`, employee_id);
        await throwNotification("info", "Attendance Clock-In", `${employee.name} is now online and active (${status}).`);
        return res.json(newAtt);
      } else {
        const q = query(collection(db, "attendance"), where("employee_id", "==", employee_id), where("date", "==", todayStr));
        const checkSnaps = await getDocs(q);
        if (checkSnaps.empty) {
          return res.status(400).json({ error: "No active check-in trace found for today. Check-in first." });
        }

        const attDoc = checkSnaps.docs[0];
        const attData = attDoc.data() as Attendance;

        const now = new Date();
        const checkInTime = new Date(attData.check_in);
        const diffMs = Math.abs(now.getTime() - checkInTime.getTime());
        const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

        const updated = {
          ...attData,
          check_out: now.toISOString(),
          working_hours: hours,
        };

        await setDoc(doc(db, "attendance", attDoc.id), updated);

        await logActivity(`${employee.name} checked out (Working hours: ${hours} hrs)`, employee_id);
        await throwNotification("info", "Attendance Clock-Out", `${employee.name} clocked out. Working hours logged: ${hours} hrs.`);
        return res.json(updated);
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, "attendance", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // PROJECTS CRUD
  app.get("/api/projects", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "projects"));
      const projects = snapshot.docs.map(docSnap => docSnap.data());
      res.json(projects);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "projects", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.post("/api/projects", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { project_name, client_name, description, start_date, end_date, team_members, budget, status } = req.body;

    if (!project_name || !client_name) {
      return res.status(400).json({ error: "Project name and customer / client label are required." });
    }

    try {
      const id = "proj-" + Math.random().toString(36).substr(2, 9);
      const newProject: Project = {
        id,
        project_name,
        client_name,
        description: description || "",
        start_date: start_date || new Date().toISOString().split("T")[0],
        end_date: end_date || "",
        team_members: Array.isArray(team_members) ? team_members : [],
        budget: Number(budget) || 0,
        status: status || "Planning",
      };

      await setDoc(doc(db, "projects", id), newProject);

      await logActivity(`Created project '${project_name}' for core client ${client_name}`, null, admin.name);
      await throwNotification("info", "New Project Created", `'${project_name}' has been defined under Planning.`);

      res.status(201).json(newProject);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, "projects", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "projects", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Project not found." });
      }

      const original = snap.data() as Project;
      const updated = { ...original, ...req.body };

      if (req.body.budget !== undefined) {
        updated.budget = Number(req.body.budget);
      }

      await setDoc(docRef, updated);

      await logActivity(`Updated properties for project '${updated.project_name}'`, null, admin.name);
      res.json(updated);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `projects/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.delete("/api/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "projects", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Project not found." });
      }

      const project = snap.data() as Project;
      await deleteDoc(docRef);

      // Decouple associated tasks
      const tasksSnap = await getDocs(collection(db, "tasks"));
      for (const tDoc of tasksSnap.docs) {
        const t = tDoc.data() as Task;
        if (t.project_id === req.params.id) {
          await updateDoc(doc(db, "tasks", tDoc.id), { project_id: null });
        }
      }

      await logActivity(`Archived/Deleted project '${project.project_name}'`, null, admin.name);
      res.json({ message: "Project deleted successfully." });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `projects/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // TASKS MANAGEMENT CRUD
  app.get("/api/tasks", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "tasks"));
      const tasks = snapshot.docs.map(docSnap => docSnap.data());
      res.json(tasks);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "tasks", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.post("/api/tasks", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { project_id, employee_id, title, description, priority, due_date, status, progress } = req.body;

    if (!title || !employee_id) {
      return res.status(400).json({ error: "Task title and assigned employee are required fields." });
    }

    try {
      const empSnap = await getDoc(doc(db, "employees", employee_id));
      const employee = empSnap.exists() ? (empSnap.data() as Employee) : null;

      const id = "task-" + Math.random().toString(36).substr(2, 9);
      const newTask: Task = {
        id,
        project_id: project_id || null,
        employee_id,
        title,
        description: description || "",
        priority: priority || "Medium",
        due_date: due_date || "",
        status: status || "Pending",
        progress: Number(progress) || 0,
        attachments: [],
        comments: [],
        history: [
          { timestamp: new Date().toISOString(), action: `Task created and assigned to ${employee ? employee.name : "individual"}` }
        ],
      };

      await setDoc(doc(db, "tasks", id), newTask);

      await logActivity(`Task '${title}' assigned to ${employee ? employee.name : "individual"}`, employee_id, admin.name);
      await throwNotification("info", "New Task Assigned", `'${title}' is now assigned in system tasks list.`);

      res.status(201).json(newTask);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, "tasks", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/tasks/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "tasks", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Task not found." });
      }

      const original = snap.data() as Task;
      const prevStatus = original.status;
      const prevProgress = original.progress;
      
      const updated = { ...original, ...req.body };

      if (req.body.progress !== undefined) {
        updated.progress = Number(req.body.progress);
        if (updated.progress === 100) {
          updated.status = "Completed";
        }
      }

      if (!updated.history) updated.history = [];
      if (prevStatus !== updated.status) {
        updated.history.push({
          timestamp: new Date().toISOString(),
          action: `Status updated from '${prevStatus}' to '${updated.status}'`
        });
        if (updated.status === "Completed") {
          await throwNotification("success", "Task Completed", `Goal reached: standard task '${updated.title}' has been finished.`);
        }
      } else if (prevProgress !== updated.progress) {
        updated.history.push({
          timestamp: new Date().toISOString(),
          action: `Progress ratio updated to ${updated.progress}%`
        });
      }

      await setDoc(docRef, updated);
      res.json(updated);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `tasks/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // Task comments
  app.post("/api/tasks/:id/comments", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Comment text cannot be empty." });
    }

    try {
      const docRef = doc(db, "tasks", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Task code not found." });
      }

      const original = snap.data() as Task;
      const newComment = {
        id: "comment-" + Math.random().toString(36).substr(2, 9),
        author: admin.name,
        text,
        timestamp: new Date().toISOString(),
      };

      const originalComments = Array.isArray(original.comments) ? original.comments : [];
      const originalHistory = Array.isArray(original.history) ? original.history : [];

      const updated = {
        ...original,
        comments: [...originalComments, newComment],
        history: [...originalHistory, {
          timestamp: new Date().toISOString(),
          action: `Admin ${admin.name} posted a comment.`
        }]
      };

      await setDoc(docRef, updated);
      res.status(201).json(newComment);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `tasks/${req.params.id}/comments`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.delete("/api/tasks/:id", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    try {
      const docRef = doc(db, "tasks", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Task not found." });
      }

      const task = snap.data() as Task;
      await deleteDoc(docRef);

      await logActivity(`Task deleted: '${task.title}'`, null, admin.name);
      res.json({ message: "Task removed safely." });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `tasks/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // LEAVES API
  app.get("/api/leaves", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "leaves"));
      const leaves = snapshot.docs.map(docSnap => docSnap.data());
      res.json(leaves);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "leaves", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.post("/api/leaves", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { employee_id, leave_type, start_date, end_date, reason, status } = req.body;

    if (!employee_id || !leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: "Required: employee_id, leave_type, start_date and end_date" });
    }

    try {
      const empSnap = await getDoc(doc(db, "employees", employee_id));
      if (!empSnap.exists()) {
        return res.status(404).json({ error: "Employee not found." });
      }
      const employee = empSnap.data() as Employee;

      const id = "leave-" + Math.random().toString(36).substr(2, 9);
      const newLeave: Leave = {
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        status: status || "Pending",
        reason: reason || "",
      };

      await setDoc(doc(db, "leaves", id), newLeave);

      await logActivity(`Logged leave request for ${employee.name} (${start_date} to ${end_date})`, employee_id, admin.name);
      
      if (newLeave.status === "Pending") {
        await throwNotification("info", "New Leave Application", `${employee.name} requested leave for ${leave_type}.`);
      }

      res.status(201).json(newLeave);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, "leaves", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/leaves/:id/status", requireAdmin, async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    const { status } = req.body;
    if (!status || !["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status parameters provided." });
    }

    try {
      const docRef = doc(db, "leaves", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return res.status(404).json({ error: "Leave log not found." });
      }

      const original = snap.data() as Leave;
      const updated = { ...original, status };

      await setDoc(docRef, updated);

      const empSnap = await getDoc(doc(db, "employees", updated.employee_id));
      const emp = empSnap.exists() ? (empSnap.data() as Employee) : null;
      await logActivity(`Leave status updated to (${status}) for ${emp ? emp.name : "Employee"}`, updated.employee_id, admin.name);
      await throwNotification("info", "Leave Status Updated", `${emp ? emp.name : "Employee"}'s leave request has been marked as ${status}.`);

      res.json(updated);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `leaves/${req.params.id}/status`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // ACTIVITY LOGS
  app.get("/api/logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "activity_logs"));
      const logs = snapshot.docs.map(docSnap => docSnap.data() as ActivityLog);
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(logs.slice(0, 200));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "activity_logs", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // SYSTEM NOTIFICATIONS
  app.get("/api/notifications", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "notifications"));
      const notifs = snapshot.docs.map(docSnap => docSnap.data() as SystemNotification);
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(notifs);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, "notifications", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/notifications/:id/read", requireAdmin, async (req: Request, res: Response) => {
    try {
      const docRef = doc(db, "notifications", req.params.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { is_read: true });
      }
      res.json({ success: true });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${req.params.id}`, req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  app.put("/api/notifications/read-all", requireAdmin, async (req: Request, res: Response) => {
    try {
      const snapshot = await getDocs(collection(db, "notifications"));
      for (const notifDoc of snapshot.docs) {
        const item = notifDoc.data() as SystemNotification;
        if (!item.is_read) {
          await updateDoc(doc(db, "notifications", notifDoc.id), { is_read: true });
        }
      }
      res.json({ success: true });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, "notifications/read-all", req);
      } catch (err: any) {
        res.status(550).json({ error: err.message });
      }
    }
  });

  // --- DEV & SPA FALLBACK SETUP ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Team Server] Booted. Listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Server launch failed", err);
});
