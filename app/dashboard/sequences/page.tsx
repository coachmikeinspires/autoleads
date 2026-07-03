"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Sequence = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function loadSequences() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/email_sequences", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load sequences");
      }

      const data = (await res.json()) as Sequence[];
      setSequences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sequences");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSequences();
  }, []);

  async function createSequence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/email_sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to create sequence");
      }

      setName("");
      await loadSequences();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sequence");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <div className="al-page-header">
              <div>
                <p className="al-overline">Sequences</p>
                <h1 className="al-h1">Email workflows</h1>
              </div>
              <button type="button" onClick={() => void loadSequences()} className="btn-ghost">
                Refresh
              </button>
            </div>
            <form className="al-inner" style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }} onSubmit={createSequence}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Sequence name"
                className="al-input"
                style={{ flex: 1, minWidth: "200px", marginTop: 0 }}
              />
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Creating..." : "Create sequence"}
              </button>
            </form>
            {error ? <p className="al-error" style={{ marginTop: "0.75rem" }}>{error}</p> : null}
            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {isLoading ? (
                <div className="al-inner"><p className="al-body">Loading sequences…</p></div>
              ) : sequences.length === 0 ? (
                <div className="al-inner-subtle"><p className="al-body">No sequences yet. Create one to start building outreach workflows.</p></div>
              ) : (
                sequences.map((sequence) => (
                  <div key={sequence.id} className="al-inner" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                      <div>
                        <Link href={`/dashboard/sequences/${sequence.id}`} style={{ fontWeight: 600, color: "var(--cyan)", fontSize: "1rem", textDecoration: "none" }}>
                          {sequence.name}
                        </Link>
                        <p className="al-body" style={{ marginTop: "0.25rem" }}>
                          Created {new Date(sequence.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`status-badge ${getStatusClass(sequence.status)}`}>
                        {sequence.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
