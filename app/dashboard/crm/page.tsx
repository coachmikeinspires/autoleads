"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Connection = {
  id: string;
  provider: string;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
};

export default function CrmPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadConnections() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm_connections", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load CRM connections");
      }

      const data = (await res.json()) as Connection[];
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CRM connections");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadConnections();
  }, []);

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <div className="al-page-header">
              <div>
                <p className="al-overline">CRM</p>
                <h1 className="al-h1">Connected providers</h1>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => void loadConnections()} className="btn-ghost">Refresh</button>
                <a href="/api/crm_connections/connect?provider=hubspot" className="btn-primary">Connect HubSpot</a>
              </div>
            </div>
            <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {error ? <p className="al-error">{error}</p> : null}
              {isLoading ? (
                <div className="al-inner"><p className="al-body">Loading CRM connections…</p></div>
              ) : connections.length === 0 ? (
                <div className="al-inner-subtle">
                  <p className="al-body">No CRM providers connected yet. Start with HubSpot to sync contacts into leads.</p>
                </div>
              ) : (
                connections.map((connection) => (
                  <div key={connection.id} className="al-inner" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                      <div>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem", textTransform: "capitalize" }}>{connection.provider}</p>
                        <p className="al-body" style={{ marginTop: "0.25rem" }}>
                          {connection.connectedAt
                            ? `Connected ${new Date(connection.connectedAt).toLocaleString()}`
                            : "Connected, awaiting first sync"}
                        </p>
                        <p className="al-muted" style={{ marginTop: "0.15rem" }}>
                          {connection.tokenExpiresAt
                            ? `Token expires ${new Date(connection.tokenExpiresAt).toLocaleDateString()}`
                            : "No expiry recorded"}
                        </p>
                      </div>
                      <span className="status-badge status-active">Active</span>
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
