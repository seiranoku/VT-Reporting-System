"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/api";
import type {
  OwaspChecklistCategory,
  OwaspTest,
  OwaspTestResult,
} from "@/lib/types";

type Props = {
  assessmentId: string;
  categories: OwaspChecklistCategory[];
};

function resultClass(result: string) {
  switch (result) {
    case "PASS":
      return "bg-emerald-100 text-emerald-800";
    case "FAIL":
      return "bg-red-100 text-red-800";
    case "NOT_APPLICABLE":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function resultLabel(result: string) {
  if (result === "NOT_APPLICABLE") return "N/A";
  if (result === "NOT_TESTED") return "Not Tested";
  return result;
}

export function OwaspChecklist({ assessmentId, categories }: Props) {
  const [openId, setOpenId] = useState<string | null>(
    categories[0]?.id ?? null,
  );

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        OWASP Top 10
      </h3>
      <p className="mt-1 text-sm text-foreground/60">
        Open a category to add tests and record PASS / FAIL results.
      </p>

      <div className="mt-4 space-y-2">
        {categories.map((category) => {
          const open = openId === category.id;
          const failCount = category.tests.filter((t) => t.result === "FAIL")
            .length;

          return (
            <div
              key={category.id}
              className="overflow-hidden rounded-md border border-border"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : category.id)}
                className="flex w-full items-center justify-between gap-3 bg-background/60 px-4 py-3 text-left hover:bg-background"
              >
                <span className="text-sm font-medium">
                  {category.code} — {category.name}
                </span>
                <span className="text-xs text-foreground/55">
                  {category.tests.length} test
                  {category.tests.length === 1 ? "" : "s"}
                  {failCount > 0 ? ` · ${failCount} FAIL` : ""}
                  {open ? " ▾" : " ▸"}
                </span>
              </button>

              {open ? (
                <div className="space-y-4 border-t border-border p-4">
                  <CategoryTests
                    assessmentId={assessmentId}
                    category={category}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoryTests({
  assessmentId,
  category,
}: {
  assessmentId: string;
  category: OwaspChecklistCategory;
}) {
  const router = useRouter();
  const [testCase, setTestCase] = useState("");
  const [testObjective, setTestObjective] = useState("");
  const [result, setResult] = useState<OwaspTestResult>("NOT_TESTED");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await apiSend("/owasp/tests", "POST", {
        assessmentId,
        categoryId: category.id,
        testCase: testCase.trim(),
        testObjective: testObjective.trim() || undefined,
        result,
      });
      setTestCase("");
      setTestObjective("");
      setResult("NOT_TESTED");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add test");
    } finally {
      setSaving(false);
    }
  }

  async function updateResult(test: OwaspTest, next: OwaspTestResult) {
    try {
      await apiSend(`/owasp/tests/${test.id}`, "PUT", { result: next });
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function removeTest(test: OwaspTest) {
    const confirmed = window.confirm(`Delete test "${test.testCase}"?`);
    if (!confirmed) return;

    try {
      await apiSend(`/owasp/tests/${test.id}`, "DELETE");
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <>
      {category.tests.length === 0 ? (
        <p className="text-sm text-foreground/60">No tests yet for this category.</p>
      ) : (
        <ul className="space-y-3">
          {category.tests.map((test, index) => (
            <li
              key={test.id}
              className="rounded-md border border-border bg-background/40 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    Test {index + 1}: {test.testCase}
                  </p>
                  {test.testObjective ? (
                    <p className="mt-1 text-xs text-foreground/60">
                      {test.testObjective}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${resultClass(test.result)}`}
                >
                  {resultLabel(test.result)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={test.result}
                  onChange={(e) =>
                    updateResult(test, e.target.value as OwaspTestResult)
                  }
                  className="field-input max-w-[180px]"
                >
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="NOT_APPLICABLE">N/A</option>
                  <option value="NOT_TESTED">NOT_TESTED</option>
                </select>

                {test.result === "FAIL" ? (
                  <Link
                    href={`/findings/new?assessmentId=${assessmentId}&owaspCategoryId=${category.id}&owaspTestId=${test.id}`}
                    className="rounded-md border border-border px-3 py-2 text-xs hover:bg-surface"
                  >
                    + Create Finding
                  </Link>
                ) : null}

                {test.findings && test.findings.length > 0
                  ? test.findings.map((f) => (
                      <Link
                        key={f.id}
                        href={`/findings/${f.id}`}
                        className="text-xs text-accent hover:underline"
                      >
                        Finding: {f.title}
                      </Link>
                    ))
                  : null}

                <button
                  type="button"
                  onClick={() => removeTest(test)}
                  className="ml-auto text-xs text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-md border border-dashed border-border p-3"
      >
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Add Test
        </p>
        <input
          required
          value={testCase}
          onChange={(e) => setTestCase(e.target.value)}
          className="field-input"
          placeholder="Test case"
        />
        <input
          value={testObjective}
          onChange={(e) => setTestObjective(e.target.value)}
          className="field-input"
          placeholder="Test objective (optional)"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as OwaspTestResult)}
            className="field-input max-w-[180px]"
          >
            <option value="NOT_TESTED">NOT_TESTED</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
            <option value="NOT_APPLICABLE">N/A</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? "Adding…" : "+ Add Test"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </>
  );
}
