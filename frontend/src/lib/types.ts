export type Project = {
  id: string;
  name: string;
  description: string | null;
  targetUrl: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assessments: number;
  };
};

export type ProjectInput = {
  name: string;
  description?: string;
  targetUrl: string;
  environment: string;
};

export type Methodology = "BURP" | "OWASP";
export type AssessmentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED";

export type Assessment = {
  id: string;
  projectId: string;
  assessmentNumber: string;
  methodology: Methodology;
  tester: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    targetUrl: string;
    environment: string;
  };
  _count?: {
    findings: number;
    owaspTests: number;
  };
};

export type AssessmentInput = {
  projectId: string;
  assessmentNumber: string;
  methodology: Methodology;
  tester: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: AssessmentStatus;
};

export type Severity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFORMATIONAL";

export type Confidence = "CERTAIN" | "FIRM" | "TENTATIVE";

export type FindingStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "FIXED"
  | "RETEST"
  | "CLOSED";

export type OwaspCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type Finding = {
  id: string;
  assessmentId: string;
  owaspCategoryId: string | null;
  owaspTestId: string | null;
  title: string;
  severity: Severity;
  confidence: Confidence | null;
  affectedUrl: string | null;
  httpMethod: string | null;
  parameter: string | null;
  description: string | null;
  impact: string | null;
  recommendation: string | null;
  reference: string | null;
  status: FindingStatus;
  cvssScore: number | null;
  cvssVector: string | null;
  createdAt: string;
  updatedAt: string;
  assessment?: {
    id: string;
    assessmentNumber: string;
    methodology: Methodology;
    project?: { id: string; name: string };
  };
  owaspCategory?: { id: string; code: string; name: string } | null;
  _count?: { evidences: number };
};

export type FindingInput = {
  assessmentId: string;
  title: string;
  severity: Severity;
  confidence?: Confidence;
  affectedUrl?: string;
  httpMethod?: string;
  parameter?: string;
  description?: string;
  impact?: string;
  recommendation?: string;
  reference?: string;
  status?: FindingStatus;
  owaspCategoryId?: string;
  owaspTestId?: string;
  cvssScore?: number;
  cvssVector?: string;
};

export type Evidence = {
  id: string;
  findingId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
};

export type OwaspTestResult =
  | "PASS"
  | "FAIL"
  | "NOT_APPLICABLE"
  | "NOT_TESTED";

export type OwaspTest = {
  id: string;
  assessmentId: string;
  categoryId: string;
  testCase: string;
  testObjective: string | null;
  testProcedure: string | null;
  result: OwaspTestResult;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; code: string; name: string; sortOrder: number };
  findings?: { id: string; title: string; severity: string; status: string }[];
};

export type OwaspChecklistCategory = OwaspCategory & {
  tests: OwaspTest[];
};
