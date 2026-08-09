import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, apiGet } from "@/lib/api";
import type { Project } from "@/lib/types";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { StartScanPanel } from "@/components/start-scan-panel";

type AssessmentSummary = {
  id: string;
  assessmentNumber: string;
  methodology: string;
  status: string;
  tester: string;
};

type ProjectDetail = Project & {
  assessments: AssessmentSummary[];
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  let project: ProjectDetail;
  try {
    project = await apiGet<ProjectDetail>(`/projects/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/projects"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            ← Projects
          </Link>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
            {project.name}
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            {project.environment} · {project.targetUrl}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.id}/edit`}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-background"
          >
            Edit
          </Link>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            redirectTo="/projects"
          />
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
        <Info label="Target URL" value={project.targetUrl} />
        <Info label="Environment" value={project.environment} />
        <Info
          label="Description"
          value={project.description || "—"}
          className="sm:col-span-2"
        />
        <Info
          label="Created"
          value={new Date(project.createdAt).toLocaleString()}
        />
        <Info
          label="Assessments"
          value={String(project._count?.assessments ?? project.assessments.length)}
        />
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <StartScanPanel
          projectId={project.id}
          projectName={project.name}
          targetUrl={project.targetUrl}
          environment={project.environment}
        />
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Assessments
          </h3>
          <Link
            href={`/assessments/new?projectId=${project.id}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            + New Assessment (manual)
          </Link>
        </div>
        {project.assessments.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">No assessments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {project.assessments.map((a) => (
              <li key={a.id} className="flex justify-between py-2 text-sm">
                <Link
                  href={`/assessments/${a.id}`}
                  className="text-accent hover:underline"
                >
                  {a.assessmentNumber} · {a.methodology}
                </Link>
                <span className="text-foreground/60">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Info({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs tracking-wide text-foreground/50 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm break-words">{value}</p>
    </div>
  );
}
