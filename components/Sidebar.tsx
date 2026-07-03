"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/verticals", label: "Verticals" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/sequences", label: "Sequences" },
  { href: "/dashboard/sync_runs", label: "Sync Runs" },
  { href: "/dashboard/crm", label: "CRM" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="al-sidebar">
      <div className="al-sidebar-brand">
        <p className="al-sidebar-logo-tag">Op Edge AI</p>
        <span className="al-sidebar-logo-name">AutoLeads</span>
        <p className="al-sidebar-logo-sub">Revenue automation cockpit</p>
      </div>

      <div className="al-sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`al-nav-link${isActive(item.href) ? " active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="al-sidebar-session">
        <p className="al-overline" style={{ fontSize: "0.6rem" }}>Session</p>
        <SignOutButton />
      </div>
    </nav>
  );
}
