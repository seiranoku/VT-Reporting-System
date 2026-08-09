import type {
  Methodology,
  Severity,
  FindingStatus,
  Confidence,
  OwaspTestResult,
} from '@prisma/client';

export type ReportAssessmentData = {
  id: string;
  assessmentNumber: string;
  methodology: Methodology;
  tester: string;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  status: string;
  project: {
    id: string;
    name: string;
    targetUrl: string;
    environment: string;
    description: string | null;
  };
  findings: Array<{
    id: string;
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
    owaspCategory: { code: string; name: string } | null;
    evidences: Array<{
      id: string;
      fileName: string;
      filePath: string;
      mimeType: string;
    }>;
  }>;
  owaspCategories: Array<{
    id: string;
    code: string;
    name: string;
    sortOrder: number;
  }>;
  owaspTests: Array<{
    id: string;
    categoryId: string;
    testCase: string;
    result: OwaspTestResult;
  }>;
};
