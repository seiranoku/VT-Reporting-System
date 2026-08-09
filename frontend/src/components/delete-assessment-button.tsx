"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiSend } from "@/lib/api";

type Props = {
  assessmentId: string;
  assessmentNumber: string;
  redirectTo?: string;
};

export function DeleteAssessmentButton({
  assessmentId,
  assessmentNumber,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete assessment "${assessmentNumber}"? Related findings will also be removed.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await apiSend(`/assessments/${assessmentId}`, "DELETE");
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
