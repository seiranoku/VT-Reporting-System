"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiSend } from "@/lib/api";

type Props = {
  projectId: string;
  projectName: string;
  redirectTo?: string;
};

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete project "${projectName}"? Related assessments will also be removed.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await apiSend(`/projects/${projectId}`, "DELETE");
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="text-red-600 hover:text-red-700 disabled:opacity-60"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}
