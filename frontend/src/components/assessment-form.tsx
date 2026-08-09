"use client";

import { FormEvent, useState } from "react";
import type {
  AssessmentInput,
  AssessmentStatus,
  Methodology,
  Project,
} from "@/lib/types";

type Props = {
  projects: Project[];
  initial?: Partial<AssessmentInput>;
  lockProject?: boolean;
  submitLabel: string;
  onSubmit: (values: AssessmentInput) => Promise<void>;
};

export function AssessmentForm({
  projects,
  initial,
  lockProject = false,
  submitLabel,
  onSubmit,
}: Props) {
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? projects[0]?.id ?? "",
  );
  const [assessmentNumber, setAssessmentNumber] = useState(
    initial?.assessmentNumber ?? "",
  );
  const [methodology, setMethodology] = useState<Methodology>(
    initial?.methodology ?? "BURP",
  );
  const [tester, setTester] = useState(initial?.tester ?? "");
  const [startDate, setStartDate] = useState(
    initial?.startDate?.slice(0, 10) ?? "",
  );
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<AssessmentStatus>(
    initial?.status ?? "DRAFT",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        projectId,
        assessmentNumber: assessmentNumber.trim(),
        methodology,
        tester: tester.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description.trim() || undefined,
        status,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save assessment",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Field label="Project" htmlFor="projectId">
        <select
          id="projectId"
          required
          disabled={lockProject}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="field-input"
        >
          {projects.length === 0 ? (
            <option value="">No projects available</option>
          ) : null}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Assessment Number" htmlFor="assessmentNumber">
        <input
          id="assessmentNumber"
          required
          value={assessmentNumber}
          onChange={(e) => setAssessmentNumber(e.target.value)}
          className="field-input"
          placeholder="VT-2026-001"
        />
      </Field>

      <Field label="Methodology" htmlFor="methodology">
        <select
          id="methodology"
          required
          value={methodology}
          onChange={(e) => setMethodology(e.target.value as Methodology)}
          className="field-input"
        >
          <option value="BURP">BURP</option>
          <option value="OWASP">OWASP</option>
        </select>
      </Field>

      <Field label="Tester" htmlFor="tester">
        <input
          id="tester"
          required
          value={tester}
          onChange={(e) => setTester(e.target.value)}
          className="field-input"
          placeholder="Security Team"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start Date" htmlFor="startDate">
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="End Date" htmlFor="endDate">
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="field-input"
          />
        </Field>
      </div>

      <Field label="Status" htmlFor="status">
        <select
          id="status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as AssessmentStatus)}
          className="field-input"
        >
          <option value="DRAFT">DRAFT</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input"
          placeholder="Optional notes"
        />
      </Field>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving || !projectId}
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
