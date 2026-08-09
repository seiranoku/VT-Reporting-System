"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AssessmentForm } from "@/components/assessment-form";
import { apiGet, apiSend } from "@/lib/api";
import type { AssessmentInput, Project } from "@/lib/types";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preselected = params.get("projectId");

    apiGet<Project[]>("/projects")
      .then((list) => {
        setProjects(list);
        if (preselected && list.some((p) => p.id === preselected)) {
          // AssessmentForm reads projects[0] by default; remount via key if needed.
          // Preselect is handled by putting matching project first.
          setProjects([
            list.find((p) => p.id === preselected)!,
            ...list.filter((p) => p.id !== preselected),
          ]);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load projects"),
      );
  }, []);

  async function handleCreate(values: AssessmentInput) {
    const assessment = await apiSend<{ id: string }>(
      "/assessments",
      "POST",
      values,
    );
    router.push(`/assessments/${assessment.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/assessments"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Assessments
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          New Assessment
        </h2>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!error && projects.length === 0 ? (
          <p className="text-sm text-foreground/70">
            Create a project first before adding an assessment.{" "}
            <Link href="/projects/new" className="text-accent hover:underline">
              New Project
            </Link>
          </p>
        ) : null}
        {projects.length > 0 ? (
          <AssessmentForm
            projects={projects}
            submitLabel="Create Assessment"
            onSubmit={handleCreate}
          />
        ) : null}
      </section>
    </div>
  );
}
