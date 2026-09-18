// GMRIT Academic Hub - Institutional Security Audit Service

const STORAGE_KEY = 'gmrit_audit_logs';

const initialAuditLogs = [
  {
    id: "aud_1001",
    timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
    formattedTime: "Yesterday, 01:14 PM",
    user: "System Administrator",
    role: "admin",
    userId: "ADM001",
    action: "System Initialization",
    resource: "/system/bootstrap",
    result: "Success",
    ipAddress: "10.12.0.1 (Data Center Gateway)",
    details: "RBAC security policies loaded. 3 default institutional roles verified."
  },
  {
    id: "aud_1002",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    formattedTime: "Yesterday, 09:15 AM",
    user: "System Administrator",
    role: "admin",
    userId: "ADM001",
    action: "Syllabus Upload",
    resource: "GMRIT_R20_CSE_ML_Unit3.pdf",
    result: "Success",
    ipAddress: "10.12.4.15 (Admin Block)",
    details: "Published revised R20 Machine Learning syllabus for CSE Department."
  },
  {
    id: "aud_1003",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    formattedTime: "Yesterday, 03:22 PM",
    user: "Dr. Priya Sharma",
    role: "faculty",
    userId: "FAC001",
    action: "Create Assessment",
    resource: "Machine Learning — Quiz 4",
    result: "Success",
    ipAddress: "10.12.18.42 (Faculty Lab 2)",
    details: "Published Quiz 4 (Classification Models) to Section CSE-A."
  },
  {
    id: "aud_1004",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    formattedTime: "Today, 10:14 AM",
    user: "Rahul Kumar",
    role: "student",
    userId: "STU001",
    action: "Assessment Submission",
    resource: "DBMS Assignment 3",
    result: "Success",
    ipAddress: "172.16.8.104 (Campus WiFi - Hostel B)",
    details: "Student completed and submitted Normalization assignment."
  },
  {
    id: "aud_1005",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    formattedTime: "Today, 01:08 PM",
    user: "System Administrator",
    role: "admin",
    userId: "ADM001",
    action: "RAG Configuration Modified",
    resource: "/admin/rag-settings",
    result: "Success",
    ipAddress: "10.12.4.15 (Admin Block)",
    details: "Adjusted vector similarity threshold to 0.78 and chunk size to 512."
  }
];

class AuditService {
  constructor() {
    this.logs = this.loadLogs();
  }

  loadLogs() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read audit logs from sessionStorage", e);
    }
    return [...initialAuditLogs];
  }

  saveLogs() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.warn("Could not persist audit logs to sessionStorage", e);
    }
  }

  logAction({ user, role, userId, action, resource, result = "Success", details = "", ipAddress = "10.12.4.88 (Intranet)" }) {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', Today';
    
    const entry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      formattedTime,
      user: user || "Anonymous User",
      role: role || "unknown",
      userId: userId || "UNAUTH",
      action,
      resource,
      result,
      ipAddress,
      details
    };

    // Prepend new entry
    this.logs.unshift(entry);
    if (this.logs.length > 200) {
      this.logs.pop();
    }
    this.saveLogs();
    return entry;
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [...initialAuditLogs];
    this.saveLogs();
    return this.logs;
  }
}

export const auditService = new AuditService();
export default auditService;
