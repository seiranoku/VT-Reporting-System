import Link from "next/link";
import type { ScanStartResult } from "@/lib/types";

export function ScanResultCard({ result }: { result: ScanStartResult }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Project" value={result.project.name} />
        <Info
          label="Probe"
          value={
            result.probe.error
              ? result.probe.error
              : `HTTP ${result.probe.statusCode ?? "n/a"} · ${result.probe.durationMs}ms`
          }
        />
        <Info
          label="Burp"
          value={`${result.burpAssessment.assessmentNumber} · ${result.burpAssessment.findingsCreated} findings`}
        />
        <Info
          label="OWASP"
          value={`${result.owaspAssessment.assessmentNumber} · ${result.owaspAssessment.testsCreated} tests · ${result.owaspAssessment.findingsCreated} findings`}
        />
      </div>
      <p className="text-sm text-foreground/70">
        Ringkasan cek: {result.summary.checksRun} dijalankan ·{" "}
        {result.summary.fail} fail · {result.summary.pass} pass ·{" "}
        {result.summary.notTested} not tested. Temuan otomatis perlu direview
        manual sebelum laporan final.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/assessments/${result.burpAssessment.id}`}
          className="font-medium text-accent hover:underline"
        >
          Burp Assessment
        </Link>
        <Link
          href={`/assessments/${result.owaspAssessment.id}`}
          className="font-medium text-accent hover:underline"
        >
          OWASP Assessment
        </Link>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-foreground/50 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm break-words">{value}</p>
    </div>
  );
}
