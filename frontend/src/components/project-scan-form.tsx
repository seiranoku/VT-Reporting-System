"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ProjectInput } from "@/lib/types";

export type ScanFormValues = ProjectInput & {
  httpMethod: string;
  headersText: string;
  body: string;
  tester: string;
};

type ProjectScanFormProps = {
  initial?: Partial<ScanFormValues>;
  mode?: "create" | "existing";
  onSaveOnly?: (values: ProjectInput) => Promise<void>;
  onStartScan: (values: ScanFormValues) => Promise<void>;
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

export function ProjectScanForm({
  initial,
  mode = "create",
  onSaveOnly,
  onStartScan,
}: ProjectScanFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [targetUrl, setTargetUrl] = useState(initial?.targetUrl ?? "");
  const [environment, setEnvironment] = useState(
    initial?.environment ?? "Development",
  );
  const [httpMethod, setHttpMethod] = useState(initial?.httpMethod ?? "GET");
  const [headersText, setHeadersText] = useState(
    initial?.headersText ??
      '{\n  "Content-Type": "application/json"\n}',
  );
  const [body, setBody] = useState(initial?.body ?? "{\n  \n}");
  const [tester, setTester] = useState(initial?.tester ?? "Auto Scanner");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);

  const needsBody = useMemo(
    () => ["POST", "PUT", "PATCH"].includes(httpMethod),
    [httpMethod],
  );

  function projectValues(): ProjectInput {
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      targetUrl: targetUrl.trim(),
      environment: environment.trim(),
    };
  }

  function scanValues(): ScanFormValues {
    return {
      ...projectValues(),
      httpMethod,
      headersText,
      body: needsBody ? body : body.trim() ? body : "",
      tester: tester.trim() || "Auto Scanner",
    };
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!onSaveOnly) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSaveOnly(projectValues());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
      setSaving(false);
    }
  }

  async function handleScan(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setScanning(true);
    try {
      await onStartScan(scanValues());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setScanning(false);
    }
  }

  return (
    <form className="max-w-2xl space-y-5" onSubmit={handleScan}>
      {mode === "create" ? (
        <>
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="Data Service - Post Pengajuan"
            />
          </Field>

          <Field label="Environment" htmlFor="environment">
            <select
              id="environment"
              required
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="field-input"
            >
              <option value="Development">Development</option>
              <option value="Staging">Staging</option>
              <option value="Production">Production</option>
            </select>
          </Field>

          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input"
              placeholder="Optional notes"
            />
          </Field>
        </>
      ) : null}

      <div className="rounded-md border border-border bg-background/60 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">API endpoint to test</h3>
          <p className="mt-1 text-xs text-foreground/60">
            Isi URL, method, header, dan body. Tekan Mulai untuk probe otomatis
            dan mengisi Assessment Burp &amp; OWASP.
          </p>
        </div>

        <Field label="API URL" htmlFor="targetUrl">
          <input
            id="targetUrl"
            required
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="field-input font-mono text-[13px]"
            placeholder="https://api.example.com/v1/pengajuan"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="HTTP Method" htmlFor="httpMethod">
            <select
              id="httpMethod"
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="field-input"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tester" htmlFor="tester">
            <input
              id="tester"
              value={tester}
              onChange={(e) => setTester(e.target.value)}
              className="field-input"
              placeholder="Auto Scanner"
            />
          </Field>
        </div>

        <Field label="Headers (JSON object)" htmlFor="headersText">
          <textarea
            id="headersText"
            rows={4}
            value={headersText}
            onChange={(e) => setHeadersText(e.target.value)}
            className="field-input font-mono text-[13px]"
            spellCheck={false}
          />
        </Field>

        <Field
          label={`Request body${needsBody ? "" : " (optional)"}`}
          htmlFor="body"
        >
          <textarea
            id="body"
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="field-input font-mono text-[13px]"
            spellCheck={false}
            placeholder='{"field":"value"}'
          />
        </Field>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={scanning || saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {scanning ? "Memindai…" : "Mulai Assessment"}
        </button>

        {onSaveOnly ? (
          <button
            type="button"
            disabled={scanning || saving}
            onClick={handleSave}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:bg-background disabled:opacity-60"
          >
            {saving ? "Saving…" : mode === "create" ? "Simpan Project saja" : "Simpan URL"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-foreground/80"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
