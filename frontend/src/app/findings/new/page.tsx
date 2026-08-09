"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FindingForm } from "@/components/finding-form";
import { apiGet, apiSend } from "@/lib/api";
import type {
  Assessment,
  FindingInput,
  OwaspCategory,
} from "@/lib/types";

function NewFindingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId") ?? "";
  const owaspCategoryId = searchParams.get("owaspCategoryId") ?? undefined;
  const owaspTestId = searchParams.get("owaspTestId") ?? undefined;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [categories, setCategories] = useState<OwaspCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setError("assessmentId query parameter is required");
      return;
    }

    Promise.all([
      apiGet<Assessment>(`/assessments/${assessmentId}`),
      apiGet<OwaspCategory[]>("/owasp/categories"),
    ])
      .then(([a, c]) => {
        setAssessment(a);
        setCategories(c);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [assessmentId]);

  async function handleCreate(values: FindingInput) {
    const finding = await apiSend<{ id: string }>("/findings", "POST", values);
    router.push(`/findings/${finding.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={assessmentId ? `/assessments/${assessmentId}` : "/findings"}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Back
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          Add Finding
        </h2>
        {assessment ? (
          <p className="mt-1 text-sm text-foreground/70">
            {assessment.assessmentNumber} · {assessment.methodology}
          </p>
        ) : null}
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!error && !assessment ? (
          <p className="text-sm text-foreground/60">Loading…</p>
        ) : null}
        {assessment ? (
          <FindingForm
            assessmentId={assessment.id}
            methodology={assessment.methodology}
            categories={categories}
            submitLabel="Create Finding"
            onSubmit={handleCreate}
            initial={{
              owaspCategoryId,
              owaspTestId,
            }}
          />
        ) : null}
      </section>
    </div>
  );
}

export default function NewFindingPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-foreground/60">Loading form…</p>
      }
    >
      <NewFindingContent />
    </Suspense>
  );
}
