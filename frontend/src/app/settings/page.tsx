import { apiGet } from "@/lib/api";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

export default async function SettingsPage() {
  let logs: AuditLog[] = [];
  let loadError: string | null = null;

  try {
    logs = await apiGet<AuditLog[]>("/audit-logs?limit=30");
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load audit logs";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Settings
        </h2>
        <p className="mt-2 text-sm text-foreground/70">
          Authentication with roles (ADMIN / TESTER / VIEWER) can be enabled
          later. For this MVP the API is open on the local Docker network.
        </p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wide text-foreground/50 uppercase">
              API
            </dt>
            <dd className="mt-1">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-foreground/50 uppercase">
              Swagger
            </dt>
            <dd className="mt-1">
              <a
                className="text-accent hover:underline"
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/docs`}
                target="_blank"
                rel="noreferrer"
              >
                Open API docs
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-foreground/50 uppercase">
              Evidence storage
            </dt>
            <dd className="mt-1">/storage/evidence (Docker volume)</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-foreground/50 uppercase">
              Roles (planned)
            </dt>
            <dd className="mt-1">ADMIN · TESTER · VIEWER</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Audit Log
        </h3>
        <p className="mt-1 text-sm text-foreground/60">
          Recent create / update / delete actions.
        </p>

        {loadError ? (
          <p className="mt-4 text-sm text-red-700">{loadError}</p>
        ) : null}

        {!loadError && logs.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">No audit entries yet.</p>
        ) : null}

        {logs.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
                <tr>
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 pr-4 font-medium">Entity</th>
                  <th className="py-2 font-medium">Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap text-foreground/70">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-medium">{log.action}</td>
                    <td className="py-2 pr-4">{log.entity}</td>
                    <td className="py-2 font-mono text-xs text-foreground/60">
                      {log.entityId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
