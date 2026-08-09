import { Confidence, Severity } from '@prisma/client';

export type ProbeRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

export type ProbeResponse = {
  ok: boolean;
  statusCode: number | null;
  statusText: string | null;
  headers: Record<string, string>;
  bodySnippet: string;
  durationMs: number;
  error: string | null;
  finalUrl: string;
  redirected: boolean;
};

export type ScanFindingDraft = {
  title: string;
  severity: Severity;
  confidence: Confidence;
  owaspCode: string;
  affectedUrl: string;
  httpMethod: string;
  parameter?: string;
  description: string;
  impact: string;
  recommendation: string;
  reference?: string;
  testCase: string;
  testObjective: string;
  testProcedure: string;
  result: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'NOT_TESTED';
  notes?: string;
};

export type ScanCheckResult = {
  id: string;
  name: string;
  finding?: ScanFindingDraft;
  owaspOnly?: Omit<ScanFindingDraft, 'severity' | 'confidence' | 'title'> & {
    title: string;
    result: ScanFindingDraft['result'];
  };
};
