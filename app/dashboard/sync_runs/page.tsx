"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type SyncRun = {
  id: string;
  verticalId: string | null;
  requestedCount: number;
  insertedCount: number;
  skippedCount: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
};

type Vertical = {
  id: string;
  label: string;
};

export default function SyncRunsPage(){
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [selectedVertical, setSelectedVertical] = useState("");
  const [requestedCount, setRequestedCount] = useState("50");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
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

  async function load(){
    setIsLoading(true);
    setError(null);

    try {
      const [runsRes, verticalsRes] = await Promise.all([
        fetch('/api/sync_runs', { cache: 'no-store' }),
        fetch('/api/verticals', { cache: 'no-store' }),
      ]);

      if (!runsRes.ok || !verticalsRes.ok) {
        throw new Error('Failed to load sync data');
      }

      setRuns(await runsRes.json());
      setVerticals(await verticalsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(()=>{ void load(); },[]);

  async function startSync(){
    if (!selectedVertical) {
      setError('Select a vertical before starting a sync');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch('/api/sync_runs', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ verticalId: selectedVertical, requestedCount: Number(requestedCount) || 50 })
      });

      if (!res.ok) {
        throw new Error('Failed to start sync');
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sync');
    } finally {
      setIsStarting(false);
    }
  }

  async function updateStatus(runId: string, status: string){
    await fetch(`/api/sync_runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status })
    });
    await load();
  }

  const verticalMap = new Map(verticals.map((vertical) => [vertical.id, vertical.label]));

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <div className="al-page-header">
              <div>
                <p className="al-overline">Sync Runs</p>
                <h1 className="al-h1">Lead imports</h1>
                <p className="al-body" style={{ marginTop: "0.25rem" }}>Launch and monitor sourcing runs for each vertical.</p>
              </div>
              <button type="button" onClick={() => void load()} className="btn-ghost">Refresh</button>
            </div>

            <div className="al-inner" style={{ marginTop: "1.75rem" }}>
              <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr auto auto" }}>
                <select
                  value={selectedVertical}
                  onChange={(event) => setSelectedVertical(event.target.value)}
                  className="al-input"
                  style={{ marginTop: 0 }}
                >
                  <option value="">Select vertical</option>
                  {verticals.map((vertical) => (
                    <option key={vertical.id} value={vertical.id}>{vertical.label}</option>
                  ))}
                </select>
                <input
                  value={requestedCount}
                  onChange={(event) => setRequestedCount(event.target.value)}
                  className="al-input"
                  style={{ marginTop: 0, width: "120px" }}
                  inputMode="numeric"
                  placeholder="Count"
                />
                <button type="button" onClick={() => void startSync()} disabled={isStarting} className="btn-primary">
                  {isStarting ? "Starting…" : "Start sync"}
                </button>
              </div>
              {error ? <p className="al-error" style={{ marginTop: "0.75rem" }}>{error}</p> : null}
            </div>

            <div className="al-table-wrap" style={{ marginTop: "1.5rem" }}>
              <table className="al-table">
                <thead>
                  <tr>
                    <th>Vertical</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Inserted</th>
                    <th>Started</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="al-td-muted">Loading sync runs…</td></tr>
                  ) : runs.length === 0 ? (
                    <tr><td colSpan={6} className="al-td-muted">No sync runs yet. Start one to ingest leads for a vertical.</td></tr>
                  ) : (
                    runs.map((run) => (
                      <tr key={run.id}>
                        <td className="al-td-primary">{run.verticalId ? verticalMap.get(run.verticalId) || "Unknown" : "Unassigned"}</td>
                        <td><span className={`status-badge ${getStatusClass(run.status)}`}>{run.status}</span></td>
                        <td className="al-td-muted">{run.requestedCount}</td>
                        <td className="al-td-muted">{run.insertedCount}</td>
                        <td className="al-td-muted">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</td>
                        <td>
                          {run.status === "running" ? (
                            <button type="button" onClick={() => void updateStatus(run.id, "completed")} className="btn-ghost" style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem" }}>
                              Mark done
                            </button>
                          ) : (
                            <span className="al-muted">Complete</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
