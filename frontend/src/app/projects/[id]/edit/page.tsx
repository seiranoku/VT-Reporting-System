"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectForm } from "@/components/project-form";
import { apiGet, apiSend } from "@/lib/api";
import type { Project, ProjectInput } from "@/lib/types";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiGet<Project>(`/projects/${params.id}`)
      .then((data) => {
        if (!cancelled) setProject(data);
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

  async function handleUpdate(values: ProjectInput) {
    await apiSend(`/projects/${params.id}`, "PUT", values);
    router.push(`/projects/${params.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${params.id}`}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Back
        </Link>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          Edit Project
        </h2>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        {!error && !project ? (
          <p className="text-sm text-foreground/60">Loading…</p>
        ) : null}
        {project ? (
          <ProjectForm
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
            initial={{
              name: project.name,
              description: project.description ?? "",
              targetUrl: project.targetUrl,
              environment: project.environment,
            }}
          />
        ) : null}
      </section>
    </div>
  );
}
