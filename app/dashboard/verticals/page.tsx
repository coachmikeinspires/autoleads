"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Vertical = {
  id: string;
  label: string;
  qKeywords: string | null;
  createdAt: string;
};

export default function VerticalPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [label, setLabel] = useState("");
  const [qKeywords, setQKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadVerticals() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verticals", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load verticals");
      }

      const data = (await res.json()) as Vertical[];
      setVerticals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verticals");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadVerticals();
  }, []);

  async function createVertical(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/verticals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), qKeywords: qKeywords.trim() || null }),
      });

      if (!res.ok) {
        throw new Error("Failed to create vertical");
      }

      setLabel("");
      setQKeywords("");
      await loadVerticals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vertical");
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="al-overline">Verticals</p>
                <h1 className="al-h1">Market segments</h1>
                <p className="al-body" style={{ marginTop: "0.25rem" }}>Organize prospecting by industry, persona, or search theme.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadVerticals()}
                className="btn-ghost"
              >
                Refresh
              </button>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
              <form className="al-inner" style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={createVertical}>
                <h2 className="al-h2">New vertical</h2>
                <label>
                  <span className="al-label">Label</span>
                  <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    className="al-input"
                    placeholder="SaaS founders"
                  />
                </label>
                <label>
                  <span className="al-label">Query keywords</span>
                  <input
                    value={qKeywords}
                    onChange={(event) => setQKeywords(event.target.value)}
                    className="al-input"
                    placeholder="founder, bootstrap, b2b saas"
                  />
                </label>
                {error ? <p className="al-error">{error}</p> : null}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: "100%" }}
                >
                  {isSubmitting ? "Creating..." : "Create vertical"}
                </button>
              </form>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="al-inner"><p className="al-body">Loading verticals…</p></div>
                ) : verticals.length === 0 ? (
                  <div className="al-inner-subtle"><p className="al-body">No verticals yet. Create one to scope syncing and outreach.</p></div>
                ) : (
                  verticals.map((vertical) => (
                    <div key={vertical.id} className="al-inner">
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                        <div>
                          <h2 className="al-h2">{vertical.label}</h2>
                          <p className="al-body" style={{ marginTop: "0.35rem" }}>{vertical.qKeywords || "No search keywords configured"}</p>
                        </div>
                        <span className="al-muted" style={{ whiteSpace: "nowrap" }}>
                          {new Date(vertical.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
