"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, apiSend, apiUpload } from "@/lib/api";
import type { Evidence } from "@/lib/types";

type Props = {
  findingId: string;
  evidences: Evidence[];
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidencePanel({ findingId, evidences }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file first");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("findingId", findingId);
      formData.append("file", file);
      await apiUpload("/evidences", formData);
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`Delete evidence "${name}"?`);
    if (!confirmed) return;

    try {
      await apiSend(`/evidences/${id}`, "DELETE");
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Evidence
      </h3>
      <p className="mt-1 text-sm text-foreground/60">
        Screenshots, request/response dumps, logs, or documents (max ~10MB).
      </p>

      <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="evidence-file"
            className="mb-1 block text-sm font-medium text-foreground/80"
          >
            Upload file
          </label>
          <input
            id="evidence-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="field-input"
          />
        </div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {evidences.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">No evidence uploaded yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {evidences.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <a
                  href={`${API_URL}/api/evidences/${item.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  {item.fileName}
                </a>
                <p className="text-xs text-foreground/55">
                  {item.mimeType} · {formatBytes(item.fileSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id, item.fileName)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
