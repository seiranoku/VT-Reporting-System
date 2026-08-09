import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Assessment } from "@/lib/types";
import { DeleteAssessmentButton } from "@/components/delete-assessment-button";

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function methodologyClass(methodology: string) {
  return methodology === "BURP"
    ? "bg-sky-100 text-sky-800"
    : "bg-violet-100 text-violet-800";
}

export default async function AssessmentsPage() {
  let assessments: Assessment[] = [];
  let loadError: string | null = null;

  try {
    assessments = await apiGet<Assessment[]>("/assessments");
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load assessments";
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Assessments
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Burp Suite and OWASP vulnerability test assessments.
          </p>
        </div>
        <Link
          href="/assessments/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          New Assessment
        </Link>
      </section>

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {!loadError && assessments.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground/70">No assessments yet.</p>
          <Link
            href="/assessments/new"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Create the first assessment
          </Link>
        </section>
      ) : null}

      {assessments.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background/80 text-xs tracking-wide text-foreground/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Methodology</th>
                <th className="px-4 py-3 font-medium">Tester</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Findings</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {a.assessmentNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{a.project?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${methodologyClass(a.methodology)}`}
                    >
                      {a.methodology}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.tester}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(a.status)}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a._count?.findings ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/assessments/${a.id}/edit`}
                        className="text-foreground/70 hover:text-foreground"
                      >
                        Edit
                      </Link>
                      <DeleteAssessmentButton
                        assessmentId={a.id}
                        assessmentNumber={a.assessmentNumber}
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
