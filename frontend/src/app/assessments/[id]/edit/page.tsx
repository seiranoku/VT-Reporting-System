"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AssessmentForm } from "@/components/assessment-form";
import { apiGet, apiSend } from "@/lib/api";
import type { Assessment, AssessmentInput, Project } from "@/lib/types";

export default function EditAssessmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiGet<Assessment>(`/assessments/${params.id}`),
      apiGet<Project[]>("/projects"),
    ])
      .then(([a, p]) => {
        if (!cancelled) {
          setAssessment(a);
          setProjects(p);
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

  async function handleUpdate(values: AssessmentInput) {
    const { projectId: _projectId, ...rest } = values;
    await apiSend(`/assessments/${params.id}`, "PUT", rest);
    router.push(`/assessments/${params.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/assessments/${params.id}`}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Back
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          Edit Assessment
        </h2>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!error && !assessment ? (
          <p className="text-sm text-foreground/60">Loading…</p>
        ) : null}
        {assessment && projects.length > 0 ? (
          <AssessmentForm
            projects={projects}
            lockProject
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
            initial={{
              projectId: assessment.projectId,
              assessmentNumber: assessment.assessmentNumber,
              methodology: assessment.methodology,
              tester: assessment.tester,
              startDate: assessment.startDate ?? undefined,
              endDate: assessment.endDate ?? undefined,
              description: assessment.description ?? "",
              status: assessment.status,
            }}
          />
        ) : null}
      </section>
    </div>
  );
}
