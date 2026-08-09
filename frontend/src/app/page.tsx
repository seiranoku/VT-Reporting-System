import Link from "next/link";
import { apiGet } from "@/lib/api";
import { severityClass } from "@/lib/badges";

type DashboardSummary = {
  totalProjects: number;
  totalAssessments: number;
  totalFindings: number;
  severity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFORMATIONAL: number;
  };
  assessmentsByMethodology: {
    BURP: number;
    OWASP: number;
  };
};

async function getApiHealth(): Promise<{
  status: string;
  database?: string;
  error?: string;
}> {
  const apiUrl =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { status: "error", error: `HTTP ${response.status}` };
    }
    return response.json();
  } catch {
    return {
      status: "error",
      error: "API unreachable — start backend / Docker Compose",
    };
  }
}

export default async function HomePage() {
  const health = await getApiHealth();
  const healthy = health.status === "ok";

  let summary: DashboardSummary | null = null;
  let loadError: string | null = null;

  try {
    summary = await apiGet<DashboardSummary>("/dashboard");
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load dashboard";
  }

  const severityItems = summary
    ? ([
        ["CRITICAL", summary.severity.CRITICAL],
        ["HIGH", summary.severity.HIGH],
        ["MEDIUM", summary.severity.MEDIUM],
        ["LOW", summary.severity.LOW],
        ["INFORMATIONAL", summary.severity.INFORMATIONAL],
      ] as const)
    : [];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          Overview of projects, assessments, and findings.
        </p>
      </section>

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Project" value={summary.totalProjects} href="/projects" />
            <Stat
              label="Total Assessment"
              value={summary.totalAssessments}
              href="/assessments"
            />
            <Stat
              label="Total Finding"
              value={summary.totalFindings}
              href="/findings"
            />
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-xs tracking-wide text-foreground/50 uppercase">
                API Status
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  healthy ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {healthy ? "Online" : "Offline"}
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                {healthy
                  ? `Database: ${health.database ?? "unknown"}`
                  : health.error}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Findings by Severity
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {severityItems.map(([label, count]) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium ${severityClass(label)}`}
                  >
                    {label}
                    <span className="rounded bg-black/10 px-1.5 py-0.5">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Assessments by Methodology
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-sky-50 px-4 py-3">
                  <p className="text-xs tracking-wide text-sky-700 uppercase">
                    Burp Suite
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-sky-900">
                    {summary.assessmentsByMethodology.BURP}
                  </p>
                </div>
                <div className="rounded-md bg-violet-50 px-4 py-3">
                  <p className="text-xs tracking-wide text-violet-700 uppercase">
                    OWASP
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-violet-900">
                    {summary.assessmentsByMethodology.OWASP}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40"
    >
      <p className="text-xs tracking-wide text-foreground/50 uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Link>
  );
}
