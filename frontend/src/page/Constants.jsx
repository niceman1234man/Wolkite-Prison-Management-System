// API Endpoints
export const API_BASE_URL = "http://localhost:5000/api"; // Replace with your backend API URL

export const API_ENDPOINTS = {
  PRISONERS: {
    GET_ALL: "/prisoner/getall-prisoners",
    CREATE: "/prisoner/new-prisoner",
    UPDATE: "/prisoner/update-prisoner",
    DELETE: "/prisoner/delete-prisoner",
  },
  TRANSFERS: {
    GET_ALL: "/transfer/getall-transfers",
    CREATE: "/transfer/new-transfer",
    UPDATE: "/transfer/update-transfer",
    DELETE: "/transfer/delete-transfer",
  },
  DASHBOARD: {
    GET_DATA: "/dashboard/data",
  },
  NOTIFICATIONS: {
    GET_ALL: "/notifications/getall-notifications",
    DISMISS: "/notifications/dismiss-notification",
  },
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
  },
};

// User Roles
export const ROLES = {
  ADMIN: "admin",
  SECURITY_STAFF: "security_staff",
  CLERK: "clerk",
};

// Transfer Statuses
export const TRANSFER_STATUSES = {
  PENDING: "Pending",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

// Parole Eligibility
export const PAROLE_ELIGIBILITY = {
  YES: "true",
  NO: "false",
};

// Gender Options
export const GENDER_OPTIONS = {
  MALE: "male",
  FEMALE: "female",
};

// Notification Types
export const NOTIFICATION_TYPES = {
  URGENT: "urgent",
  TRANSFER: "transfer",
  GENERAL: "general",
};

// Default Values
export const DEFAULT_VALUES = {
  PRISONER: {
    GENDER: GENDER_OPTIONS.MALE,
    RISK_LEVEL: RISK_LEVELS.LOW,
    PAROLE_ELIGIBILITY: PAROLE_ELIGIBILITY.NO,
  },
  TRANSFER: {
    STATUS: TRANSFER_STATUSES.PENDING,
  },
};

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
};

// Time Constants
export const TIME_CONSTANTS = {
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_MINUTE: 60,
  MILLISECONDS_IN_SECOND: 1000,
};

// Urgent Case Threshold (in milliseconds)
export const URGENT_CASE_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours