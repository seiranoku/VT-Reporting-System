import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Project } from "@/lib/types";
import { DeleteProjectButton } from "@/components/delete-project-button";

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let loadError: string | null = null;

  try {
    projects = await apiGet<Project[]>("/projects");
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load projects";
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Projects
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Applications under vulnerability testing.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          New Project
        </Link>
      </section>

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {!loadError && projects.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground/70">No projects yet.</p>
          <Link
            href="/projects/new"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Create the first project
          </Link>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background/80 text-xs tracking-wide text-foreground/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Target URL</th>
                <th className="px-4 py-3 font-medium">Environment</th>
                <th className="px-4 py-3 font-medium">Assessments</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {project.name}
                    </Link>
                    {project.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-foreground/55">
                        {project.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    <a
                      href={project.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {project.targetUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">{project.environment}</td>
                  <td className="px-4 py-3">
                    {project._count?.assessments ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="text-foreground/70 hover:text-foreground"
                      >
                        Edit
                      </Link>
                      <DeleteProjectButton
                        projectId={project.id}
                        projectName={project.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
