"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { apiSend } from "@/lib/api";
import type { ProjectInput } from "@/lib/types";

export default function NewProjectPage() {
  const router = useRouter();

  async function handleCreate(values: ProjectInput) {
    const project = await apiSend<{ id: string }>("/projects", "POST", values);
    router.push(`/projects/${project.id}`);
    router.refresh();
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
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <ProjectForm submitLabel="Create Project" onSubmit={handleCreate} />
      </section>
    </div>
  );
}
