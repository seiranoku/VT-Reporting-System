import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, apiGet } from "@/lib/api";
import { severityClass, statusClass } from "@/lib/badges";
import type { Evidence, Finding } from "@/lib/types";
import { DeleteFindingButton } from "@/components/delete-finding-button";
import { EvidencePanel } from "@/components/evidence-panel";

type FindingDetail = Finding & {
  evidences?: Evidence[];
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FindingDetailPage({ params }: Props) {
  const { id } = await params;

  let finding: FindingDetail;
  try {
    finding = await apiGet<FindingDetail>(`/findings/${id}`);
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
            href="/findings"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            ← Findings
          </Link>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
            {finding.title}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${severityClass(finding.severity)}`}
            >
              {finding.severity}
            </span>
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(finding.status)}`}
            >
              {finding.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/findings/${finding.id}/edit`}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-background"
          >
            Edit
          </Link>
          <DeleteFindingButton
            findingId={finding.id}
            findingTitle={finding.title}
            redirectTo={
              finding.assessment
                ? `/assessments/${finding.assessment.id}`
                : "/findings"
            }
          />
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
        <Info
          label="Assessment"
          value={finding.assessment?.assessmentNumber ?? "—"}
        />
        <Info
          label="Methodology"
          value={finding.assessment?.methodology ?? "—"}
        />
        {finding.owaspCategory ? (
          <Info
            label="OWASP Category"
            value={`${finding.owaspCategory.code} — ${finding.owaspCategory.name}`}
            className="sm:col-span-2"
          />
        ) : null}
        <Info label="Confidence" value={finding.confidence ?? "—"} />
        <Info label="HTTP Method" value={finding.httpMethod ?? "—"} />
        <Info
          label="Affected URL"
          value={finding.affectedUrl ?? "—"}
          className="sm:col-span-2"
        />
        <Info label="Parameter" value={finding.parameter ?? "—"} />
        <Info
          label="Evidence count"
          value={String(
            finding.evidences?.length ?? finding._count?.evidences ?? 0,
          )}
        />
        <Info
          label="Description"
          value={finding.description || "—"}
          className="sm:col-span-2"
        />
        <Info
          label="Impact"
          value={finding.impact || "—"}
          className="sm:col-span-2"
        />
        <Info
          label="Recommendation"
          value={finding.recommendation || "—"}
          className="sm:col-span-2"
        />
        <Info
          label="Reference"
          value={finding.reference || "—"}
          className="sm:col-span-2"
        />
      </section>

      <EvidencePanel
        findingId={finding.id}
        evidences={finding.evidences ?? []}
      />

      {finding.assessment ? (
        <p className="text-sm">
          <Link
            href={`/assessments/${finding.assessment.id}`}
            className="text-accent hover:underline"
          >
            ← Back to assessment
          </Link>
        </p>
      ) : null}
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
      <p className="mt-1 text-sm break-words whitespace-pre-wrap">{value}</p>
    </div>
  );
}
