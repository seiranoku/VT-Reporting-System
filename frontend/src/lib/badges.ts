export function severityClass(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-700 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MEDIUM":
      return "bg-amber-400 text-amber-950";
    case "LOW":
      return "bg-sky-200 text-sky-900";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export function statusClass(status: string): string {
  switch (status) {
    case "FIXED":
    case "CLOSED":
      return "bg-emerald-100 text-emerald-800";
    case "IN_PROGRESS":
    case "RETEST":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
