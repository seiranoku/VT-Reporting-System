"use client";

import { FormEvent, useState } from "react";
import type { ProjectInput } from "@/lib/types";

type ProjectFormProps = {
  initial?: Partial<ProjectInput>;
  submitLabel: string;
  onSubmit: (values: ProjectInput) => Promise<void>;
};

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
}: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [targetUrl, setTargetUrl] = useState(initial?.targetUrl ?? "");
  const [environment, setEnvironment] = useState(
    initial?.environment ?? "Development",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        targetUrl: targetUrl.trim(),
        environment: environment.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Field label="Name" htmlFor="name">
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-input"
          placeholder="SIMPEG"
        />
      </Field>

      <Field label="Target URL" htmlFor="targetUrl">
        <input
          id="targetUrl"
          required
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="field-input"
          placeholder="https://simpeg.example.go.id"
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
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input"
          placeholder="Optional project notes"
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
