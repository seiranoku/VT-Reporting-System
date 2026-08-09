import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, apiGet } from "@/lib/api";
import { severityClass, statusClass } from "@/lib/badges";
import type { Assessment, OwaspChecklistCategory } from "@/lib/types";
import { DeleteAssessmentButton } from "@/components/delete-assessment-button";
import { OwaspChecklist } from "@/components/owasp-checklist";

type FindingSummary = {
  id: string;
  title: string;
  severity: string;
  status: string;
  confidence: string | null;
};

type AssessmentDetail = Assessment & {
  findings: FindingSummary[];
  project: {
    id: string;
    name: string;
    targetUrl: string;
    environment: string;
    description: string | null;
  };
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AssessmentDetailPage({ params }: Props) {
  const { id } = await params;

  let assessment: AssessmentDetail;
  try {
    assessment = await apiGet<AssessmentDetail>(`/assessments/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const isBurp = assessment.methodology === "BURP";
  let owaspCategories: OwaspChecklistCategory[] = [];

  if (!isBurp) {
    try {
      const checklist = await apiGet<{
        categories: OwaspChecklistCategory[];
      }>(`/owasp/checklist/${assessment.id}`);
      owaspCategories = checklist.categories;
    } catch {
      owaspCategories = [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/assessments"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            ← Assessments
          </Link>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
            {assessment.assessmentNumber}
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            {assessment.methodology} · {assessment.project.name} ·{" "}
            {assessment.status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/assessments/${assessment.id}/edit`}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-background"
          >
            Edit
          </Link>
          <DeleteAssessmentButton
            assessmentId={assessment.id}
            assessmentNumber={assessment.assessmentNumber}
            redirectTo="/assessments"
          />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Assessment Information
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Methodology" value={assessment.methodology} />
          <Info label="Project" value={assessment.project.name} />
          <Info label="Tester" value={assessment.tester} />
          <Info label="Status" value={assessment.status} />
          <Info
            label="Start Date"
            value={
              assessment.startDate
                ? new Date(assessment.startDate).toLocaleDateString()
                : "—"
            }
          />
          <Info
            label="End Date"
            value={
              assessment.endDate
                ? new Date(assessment.endDate).toLocaleDateString()
                : "—"
            }
          />
          <Info label="Target" value={assessment.project.targetUrl} />
          <Info label="Environment" value={assessment.project.environment} />
          <Info
            label="Description"
            value={assessment.description || "—"}
            className="sm:col-span-2 lg:col-span-3"
          />
        </div>
      </section>

      {!isBurp ? (
        <OwaspChecklist
          assessmentId={assessment.id}
          categories={owaspCategories}
        />
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {isBurp ? "Burp Suite Assessment" : "Findings"}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {isBurp
                ? "Findings from external Burp Suite testing."
                : "Findings linked to OWASP test failures."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/findings/new?assessmentId=${assessment.id}`}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-background"
            >
              + Add Finding
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/reports/${assessment.id}/pdf`}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              PDF
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/reports/${assessment.id}/excel`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-background"
            >
              Excel
            </a>
          </div>
        </div>

        {assessment.findings.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">
            No findings yet.{" "}
            <Link
              href={`/findings/new?assessmentId=${assessment.id}`}
              className="text-accent hover:underline"
            >
              Add the first finding
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {assessment.findings.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <Link
                  href={`/findings/${f.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {f.title}
                </Link>
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${severityClass(f.severity)}`}
                  >
                    {f.severity}
                  </span>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(f.status)}`}
                  >
                    {f.status}
                  </span>
                </span>
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
