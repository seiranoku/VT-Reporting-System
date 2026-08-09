"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ProjectScanForm,
  type ScanFormValues,
} from "@/components/project-scan-form";
import { ScanResultCard } from "@/components/scan-result-card";
import { apiSend } from "@/lib/api";
import { parseHeadersJson, resolveRequestBody } from "@/lib/scan";
import type { ScanStartResult } from "@/lib/types";

type StartScanPanelProps = {
  projectId: string;
  projectName: string;
  targetUrl: string;
  environment: string;
};

export function StartScanPanel({
  projectId,
  projectName,
  targetUrl,
  environment,
}: StartScanPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ScanStartResult | null>(null);

  async function handleStartScan(values: ScanFormValues) {
    const headers = parseHeadersJson(values.headersText);
    const scan = await apiSend<ScanStartResult>("/scans/start", "POST", {
      projectId,
      targetUrl: values.targetUrl,
      httpMethod: values.httpMethod,
      headers,
      body: resolveRequestBody(values.body),
      tester: values.tester,
    });
    setResult(scan);
    router.refresh();
  }

  if (result) {
    return <ScanResultCard result={result} />;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
      >
        Mulai Assessment
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Mulai Assessment otomatis
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          Tutup
        </button>
      </div>
      <ProjectScanForm
        mode="existing"
        initial={{
          name: projectName,
          targetUrl,
          environment,
        }}
        onStartScan={handleStartScan}
      />
    </div>
  );
}
