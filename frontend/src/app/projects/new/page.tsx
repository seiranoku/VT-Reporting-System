"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ProjectScanForm,
  type ScanFormValues,
} from "@/components/project-scan-form";
import { ScanResultCard } from "@/components/scan-result-card";
import { apiSend } from "@/lib/api";
import type { ProjectInput, ScanStartResult } from "@/lib/types";
import { parseHeadersJson, resolveRequestBody } from "@/lib/scan";

export default function NewProjectPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScanStartResult | null>(null);

  async function handleCreateOnly(values: ProjectInput) {
    const project = await apiSend<{ id: string }>("/projects", "POST", values);
    router.push(`/projects/${project.id}`);
    router.refresh();
  }

  async function handleStartScan(values: ScanFormValues) {
    const headers = parseHeadersJson(values.headersText);
    const scan = await apiSend<ScanStartResult>("/scans/start", "POST", {
      name: values.name,
      description: values.description,
      targetUrl: values.targetUrl,
      environment: values.environment,
      httpMethod: values.httpMethod,
      headers,
      body: resolveRequestBody(values.body),
      tester: values.tester,
    });
    setResult(scan);
    router.refresh();
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Scan selesai
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Assessment Burp &amp; OWASP dibuat otomatis dari hasil probe.
          </p>
        </div>

        <ScanResultCard result={result} />

        <Link
          href={`/projects/${result.project.id}`}
          className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Buka Project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Projects
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          New Project
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          Isi API endpoint, lalu Mulai Assessment — hasil pengecekan mengisi
          Burp &amp; OWASP otomatis.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <ProjectScanForm
          onSaveOnly={handleCreateOnly}
          onStartScan={handleStartScan}
        />
      </section>
    </div>
  );
}
