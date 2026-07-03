"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Lead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  title: string | null;
  companyName: string | null;
  status: string;
  createdAt: string;
  verticalId?: string | null;
  vertical?: {
    id: string;
    label: string;
  } | null;
};

type Vertical = {
  id: string;
  label: string;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  title: "",
  companyName: "",
  verticalId: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const getStatusClass = (status: string) => {
    const normalized = status.toLowerCase();

    if (["active", "new", "completed", "success"].includes(normalized)) {
      return "status-active";
    }

    if (["running", "in_progress", "processing"].includes(normalized)) {
      return "status-running";
    }

    if (["failed", "error", "canceled"].includes(normalized)) {
      return "status-failed";
    }

    return "status-draft";
  };

  async function loadVerticals() {
    const res = await fetch("/api/verticals", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load verticals");
    }

    const data = (await res.json()) as Vertical[];
    setVerticals(data);
  }

  async function loadLeads() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load leads");
      }

      const data = (await res.json()) as Lead[];
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadLeads(), loadVerticals()]).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          verticalId: form.verticalId || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create lead");
      }

      setForm(emptyForm);
      await loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  const newLeadCount = leads.filter((lead) => lead.status === "new").length;

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="al-overline">Leads</p>
                <h1 className="al-h1">Lead pipeline</h1>
                <p className="al-body" style={{ marginTop: "0.25rem" }}>
                  Manage captured leads and add prospects directly to your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadLeads()}
                className="btn-ghost"
              >
                Refresh
              </button>
            </div>
            <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
              <div className="al-inner">
                <div className="flex items-center justify-between">
                  <h2 className="al-h2">New lead</h2>
                  <span className="al-muted">{leads.length} total</span>
                </div>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <label className="block">
                      First name
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, firstName: event.target.value }))
                        }
                        className="al-input"
                      />
                    </label>
                    <label className="block">
                      Last name
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, lastName: event.target.value }))
                        }
                        className="al-input"
                      />
                    </label>
                  </div>
                  <label className="block">
                    Email
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="al-input"
                    />
                  </label>
                  <label className="block">
                    Company
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, companyName: event.target.value }))
                      }
                      className="al-input"
                    />
                  </label>
                  <label className="block">
                    Title
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="al-input"
                    />
                  </label>
                  <label className="block">
                    Vertical
                    <select
                      value={form.verticalId}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, verticalId: event.target.value }))
                      }
                      className="al-input"
                    >
                      <option value="">No vertical</option>
                      {verticals.map((vertical) => (
                        <option key={vertical.id} value={vertical.id}>{vertical.label}</option>
                      ))}
                    </select>
                  </label>
                  {error ? <p className="al-error">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ width: "100%" }}
                  >
                    {isSubmitting ? "Saving..." : "Create lead"}
                  </button>
                </form>
              </div>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="al-stat">
                    <p className="al-stat-label">Total leads</p>
                    <p className="al-stat-value">{leads.length}</p>
                  </div>
                  <div className="al-stat">
                    <p className="al-stat-label">New</p>
                    <p className="al-stat-value">{newLeadCount}</p>
                  </div>
                  <div className="al-stat">
                    <p className="al-stat-label">Most recent</p>
                    <p className="al-stat-value-sm">
                      {leads[0]?.createdAt ? new Date(leads[0].createdAt).toLocaleDateString() : "No leads yet"}
                    </p>
                  </div>
                </div>
                <div className="al-table-wrap">
                  <table className="al-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Title</th>
                        <th>Vertical</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td className="al-td-muted" colSpan={6}>
                            Loading leads…
                          </td>
                        </tr>
                      ) : leads.length === 0 ? (
                        <tr>
                          <td className="al-td-muted" colSpan={6}>
                            No leads yet. Create your first lead from the form.
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => {
                          const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";

                          return (
                            <tr key={lead.id}>
                              <td className="al-td-primary">{fullName}</td>
                              <td className="al-td-muted">{lead.companyName || "—"}</td>
                              <td className="al-td-muted">{lead.title || "—"}</td>
                              <td className="al-td-muted">{lead.vertical?.label || "—"}</td>
                              <td className="al-td-muted">{lead.email || "—"}</td>
                              <td>
                                <span className={`status-badge ${getStatusClass(lead.status)}`}>
                                  {lead.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
