import Link from "next/link";
import { apiGet } from "@/lib/api";
import { severityClass, statusClass } from "@/lib/badges";
import type { Finding } from "@/lib/types";
import { DeleteFindingButton } from "@/components/delete-finding-button";

export default async function FindingsPage() {
  let findings: Finding[] = [];
  let loadError: string | null = null;

  try {
    findings = await apiGet<Finding[]>("/findings");
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load findings";
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Findings
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          All vulnerabilities recorded across assessments.
        </p>
      </section>

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {!loadError && findings.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground/70">
            No findings yet. Open an assessment and add a finding.
          </p>
          <Link
            href="/assessments"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Go to Assessments
          </Link>
        </section>
      ) : null}

      {findings.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background/80 text-xs tracking-wide text-foreground/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/findings/${f.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {f.title}
                    </Link>
                    {f.owaspCategory ? (
                      <p className="mt-0.5 text-xs text-foreground/55">
                        {f.owaspCategory.code} {f.owaspCategory.name}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {f.assessment ? (
                      <Link
                        href={`/assessments/${f.assessment.id}`}
                        className="hover:underline"
                      >
                        {f.assessment.assessmentNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${severityClass(f.severity)}`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(f.status)}`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/findings/${f.id}/edit`}
                        className="text-foreground/70 hover:text-foreground"
                      >
                        Edit
                      </Link>
                      <DeleteFindingButton
                        findingId={f.id}
                        findingTitle={f.title}
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
