export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'user' | 'admin';
  companyId: number;
}

export interface Company {
  id: number;
  name: string;
  rccm: string;
  sector: string;
}

export interface MeResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  companyId: number;
  company: Company;
  subscription: Subscription | null;
}

export interface Site {
  id: number;
  name: string;
  type: string;
  address: string;
  surface: number | null;
  description: string;
  assessment_count: number;
  created_at: string;
  country?: string | null;
}

export type AssessmentStatus = 'draft' | 'in_progress' | 'completed';

export interface Assessment {
  id: number;
  name: string;
  year: number;
  approach: string;
  status: AssessmentStatus;
  total_co2eq: number | null;
  scope1_co2eq: number | null;
  scope2_co2eq: number | null;
  scope3_co2eq: number | null;
  site_name: string;
  site_type: string;
  created_at: string;
}

export interface EmissionEntry {
  id: number;
  assessment_id: number;
  category: string;
  subcategory: string;
  factor_name: string;
  quantity: number;
  unit: string;
  factor_value: number;
  total_co2eq: number;
  scope: 1 | 2 | 3;
  ghg_category: string;
  iso_category: string;
  description: string;
  month: number;
  year: number;
}

export interface Subscription {
  id: number;
  plan: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentRef: string | null;
  phonePayment: string | null;
  status: 'active' | 'expired';
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export type CertificationStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'audit_done'
  | 'certified'
  | 'rejected';

export interface Notification {
  id: number;
  type: string;          // cert_request | cert_assigned | cert_validated | cert_rejected | cert_comment | ...
  title: string;
  message: string;
  link: string | null;   // e.g. /dashboard/certifications
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

export interface CertificationDocument {
  id: number;
  docType: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Certification {
  id: number;
  assessmentId: number;
  assessmentName: string;
  assessmentYear: number;
  siteName: string;
  totalCo2eq: number;
  scope1: number;
  scope2: number;
  scope3: number;
  status: CertificationStatus;
  expertName: string | null;
  expertEmail: string | null;
  certifiedAt: string | null;
  certificateNumber: string | null;
  rejectionReason: string | null;
  inspectionDate: string | null;
  // New audit-scheduling fields (synced with web)
  auditScheduledDate: string | null;
  auditLocation: string | null;
  inspectionConfirmed: boolean;
  inspectionProposedDate: string | null;
  inspectionProposedBy: 'admin' | 'expert' | null;
  // Generated expert report PDF URL (for download once audit_done / certified)
  expertReportPdfUrl: string | null;
  // Documents uploaded by company to support the certification request
  documents: CertificationDocument[];
  companyMessage: string | null;
  requestedAt: string;
}

export interface AuditDocument {
  id: number;
  assessment_id: number;
  emission_factor_id: string;
  year: number;
  month: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ReportSummary {
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
}

export interface Report {
  assessment: Assessment & {
    site_address: string;
    company_name: string;
    sector: string;
    logo_url?: string | null;
  };
  summary: ReportSummary;
  byCategory: Record<string, number>;
  topEmitters?: { name: string; total: number; scope: number }[];
  byMonth?: { month: number; label: string; total: number; scope1: number; scope2: number; scope3: number }[];
}
