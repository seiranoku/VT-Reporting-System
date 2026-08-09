import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Assessment } from "@/lib/types";

const PUBLIC_API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default async function ReportsPage() {
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
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Reports
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          Generate Burp Suite or OWASP PDF reports from completed assessments.
        </p>
      </section>

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {!loadError && assessments.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground/70">
            No assessments available for reporting.
          </p>
          <Link
            href="/assessments/new"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Create an assessment
          </Link>
        </section>
      ) : null}

      {assessments.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background/80 text-xs tracking-wide text-foreground/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Methodology</th>
                <th className="px-4 py-3 font-medium">Findings</th>
                <th className="px-4 py-3 font-medium">Report</th>
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
                  <td className="px-4 py-3">{a.methodology}</td>
                  <td className="px-4 py-3">{a._count?.findings ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`${PUBLIC_API}/api/reports/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground/70 hover:text-foreground"
                      >
                        Preview
                      </a>
                      <a
                        href={`${PUBLIC_API}/api/reports/${a.id}/pdf`}
                        className="font-medium text-accent hover:underline"
                      >
                        Download PDF
                      </a>
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
