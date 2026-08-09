"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/assessments", label: "Assessments" },
  { href: "/findings", label: "Findings" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-sidebar text-sidebar-text">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white">
            VT Report
          </p>
          <p className="mt-1 text-xs text-sidebar-text/80">
            Vulnerability Test System
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-4 md:flex-col">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-white/10 text-sidebar-active"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
              VT Reporting System
            </h1>
            <p className="text-sm text-foreground/60">
              Burp Suite &amp; OWASP assessment workspace
            </p>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
