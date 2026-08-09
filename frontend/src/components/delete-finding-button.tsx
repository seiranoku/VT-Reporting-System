"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiSend } from "@/lib/api";

type Props = {
  findingId: string;
  findingTitle: string;
  redirectTo?: string;
};

export function DeleteFindingButton({
  findingId,
  findingTitle,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete finding "${findingTitle}"? Related evidence will also be removed.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await apiSend(`/findings/${findingId}`, "DELETE");
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
