"use client";

import { FormEvent, useState } from "react";
import type {
  Confidence,
  FindingInput,
  FindingStatus,
  Methodology,
  OwaspCategory,
  Severity,
} from "@/lib/types";

type Props = {
  assessmentId: string;
  methodology: Methodology;
  categories: OwaspCategory[];
  initial?: Partial<FindingInput>;
  submitLabel: string;
  onSubmit: (values: FindingInput) => Promise<void>;
};

export function FindingForm({
  assessmentId,
  methodology,
  categories,
  initial,
  submitLabel,
  onSubmit,
}: Props) {
  const isOwasp = methodology === "OWASP";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [severity, setSeverity] = useState<Severity>(
    initial?.severity ?? "MEDIUM",
  );
  const [confidence, setConfidence] = useState<Confidence | "">(
    initial?.confidence ?? (isOwasp ? "" : "FIRM"),
  );
  const [affectedUrl, setAffectedUrl] = useState(initial?.affectedUrl ?? "");
  const [httpMethod, setHttpMethod] = useState(initial?.httpMethod ?? "");
  const [parameter, setParameter] = useState(initial?.parameter ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [impact, setImpact] = useState(initial?.impact ?? "");
  const [recommendation, setRecommendation] = useState(
    initial?.recommendation ?? "",
  );
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [status, setStatus] = useState<FindingStatus>(
    initial?.status ?? "OPEN",
  );
  const [owaspCategoryId, setOwaspCategoryId] = useState(
    initial?.owaspCategoryId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        assessmentId,
        title: title.trim(),
        severity,
        confidence: confidence || undefined,
        affectedUrl: affectedUrl.trim() || undefined,
        httpMethod: httpMethod.trim() || undefined,
        parameter: parameter.trim() || undefined,
        description: description.trim() || undefined,
        impact: impact.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
        reference: reference.trim() || undefined,
        status,
        owaspCategoryId: isOwasp ? owaspCategoryId : undefined,
        owaspTestId: isOwasp ? initial?.owaspTestId : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save finding");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <Field label="Title" htmlFor="title">
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field-input"
          placeholder="SQL Injection"
        />
      </Field>

      {isOwasp ? (
        <Field label="OWASP Category" htmlFor="owaspCategoryId">
          <select
            id="owaspCategoryId"
            required
            value={owaspCategoryId}
            onChange={(e) => setOwaspCategoryId(e.target.value)}
            className="field-input"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Severity" htmlFor="severity">
          <select
            id="severity"
            required
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity)}
            className="field-input"
          >
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFORMATIONAL">INFORMATIONAL</option>
          </select>
        </Field>

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as FindingStatus)}
            className="field-input"
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="FIXED">FIXED</option>
            <option value="RETEST">RETEST</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </Field>
      </div>

      {!isOwasp ? (
        <Field label="Confidence" htmlFor="confidence">
          <select
            id="confidence"
            value={confidence}
            onChange={(e) =>
              setConfidence(e.target.value as Confidence | "")
            }
            className="field-input"
          >
            <option value="">—</option>
            <option value="CERTAIN">CERTAIN</option>
            <option value="FIRM">FIRM</option>
            <option value="TENTATIVE">TENTATIVE</option>
          </select>
        </Field>
      ) : null}

      <Field label="Affected URL" htmlFor="affectedUrl">
        <input
          id="affectedUrl"
          value={affectedUrl}
          onChange={(e) => setAffectedUrl(e.target.value)}
          className="field-input"
          placeholder="https://example.local/login"
        />
      </Field>

      {!isOwasp ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="HTTP Method" htmlFor="httpMethod">
            <select
              id="httpMethod"
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="field-input"
            >
              <option value="">—</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </Field>
          <Field label="Parameter" htmlFor="parameter">
            <input
              id="parameter"
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
              className="field-input"
              placeholder="username"
            />
          </Field>
        </div>
      ) : null}

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Impact" htmlFor="impact">
        <textarea
          id="impact"
          rows={3}
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Recommendation" htmlFor="recommendation">
        <textarea
          id="recommendation"
          rows={3}
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="Reference" htmlFor="reference">
        <input
          id="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="field-input"
          placeholder="https://owasp.org/..."
        />
      </Field>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
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
