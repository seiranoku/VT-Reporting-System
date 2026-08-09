"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FindingForm } from "@/components/finding-form";
import { apiGet, apiSend } from "@/lib/api";
import type { Finding, FindingInput, OwaspCategory } from "@/lib/types";

export default function EditFindingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [categories, setCategories] = useState<OwaspCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiGet<Finding>(`/findings/${params.id}`),
      apiGet<OwaspCategory[]>("/owasp/categories"),
    ])
      .then(([f, c]) => {
        if (!cancelled) {
          setFinding(f);
          setCategories(c);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleUpdate(values: FindingInput) {
    const { assessmentId: _assessmentId, ...rest } = values;
    await apiSend(`/findings/${params.id}`, "PUT", rest);
    router.push(`/findings/${params.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/findings/${params.id}`}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Back
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          Edit Finding
        </h2>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!error && !finding ? (
          <p className="text-sm text-foreground/60">Loading…</p>
        ) : null}
        {finding?.assessment ? (
          <FindingForm
            assessmentId={finding.assessmentId}
            methodology={finding.assessment.methodology}
            categories={categories}
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
            initial={{
              assessmentId: finding.assessmentId,
              title: finding.title,
              severity: finding.severity,
              confidence: finding.confidence ?? undefined,
              affectedUrl: finding.affectedUrl ?? "",
              httpMethod: finding.httpMethod ?? "",
              parameter: finding.parameter ?? "",
              description: finding.description ?? "",
              impact: finding.impact ?? "",
              recommendation: finding.recommendation ?? "",
              reference: finding.reference ?? "",
              status: finding.status,
              owaspCategoryId: finding.owaspCategoryId ?? "",
            }}
          />
        ) : null}
      </section>
    </div>
  );
}
