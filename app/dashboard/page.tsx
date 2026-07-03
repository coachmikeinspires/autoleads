import Sidebar from "@/components/Sidebar";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const orgId = session?.user?.orgId;

  const [org, leadCount, sequenceCount, crmCount, recentLeadCount, recentLeads, sequenceSummaries, enrollmentCount, emailSendCount] = await Promise.all([
    prisma.org.findUnique({ where: { id: orgId } }),
    prisma.lead.count({ where: { orgId } }),
    prisma.emailSequence.count({ where: { orgId } }),
    prisma.crmConnection.count({ where: { orgId } }),
    prisma.lead.count({
      where: {
        orgId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.lead.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.emailSequence.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    }),
    prisma.sequenceEnrollment.count({
      where: {
        lead: {
          orgId,
        },
      },
    }),
    prisma.emailSend.count({
      where: {
        enrollment: {
          lead: {
            orgId,
          },
        },
      },
    }),
  ]);

  const stats = [
    { label: "Leads captured", value: leadCount.toLocaleString() },
    { label: "Sequences active", value: sequenceCount.toLocaleString() },
    { label: "CRM syncs", value: crmCount.toLocaleString() },
    { label: "New leads (30d)", value: recentLeadCount.toLocaleString() },
  ];

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

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">

          <div className="al-card">
            <div className="al-page-header">
              <div>
                <p className="al-overline">Dashboard</p>
                <h1 className="al-h1">Your growth command center</h1>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(31,207,224,0.28)", borderRadius: "9999px", padding: "0.45rem 1.1rem", background: "rgba(7,108,126,0.18)", fontSize: "0.78rem", color: "#8ff4ff", whiteSpace: "nowrap" }}>
                <span style={{ width: "0.42rem", height: "0.42rem", borderRadius: "50%", background: "var(--cyan)", display: "inline-block", boxShadow: "0 0 5px var(--cyan)" }} />
                Active: {org?.plan ?? "starter"}
              </div>
            </div>
            <div style={{ marginTop: "1.75rem", display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              {stats.map((stat) => (
                <div key={stat.label} className="al-stat">
                  <p className="al-stat-label">{stat.label}</p>
                  <p className="al-stat-value">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))" }}>

            <div className="al-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h2 className="al-h2">Recent leads</h2>
                <span className="al-muted">Updated now</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {recentLeads.length === 0 ? (
                  <div className="al-inner-subtle">
                    <p className="al-body">No leads yet. Add one from the leads page to start building your pipeline.</p>
                  </div>
                ) : (
                  recentLeads.map((lead) => {
                    const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";
                    const companyLine = [lead.title, lead.companyName].filter(Boolean).join(" · ") || lead.email || "—";
                    return (
                      <div key={lead.id} className="al-inner" style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                          <div>
                            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>{fullName}</p>
                            <p className="al-body" style={{ marginTop: "0.15rem" }}>{companyLine}</p>
                          </div>
                          <span className={`status-badge ${getStatusClass(lead.status)}`}>{lead.status}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="al-card">
              <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr 1fr", marginBottom: "1.5rem" }}>
                <div className="al-stat">
                  <p className="al-stat-label">Active enrollments</p>
                  <p className="al-stat-value">{enrollmentCount}</p>
                </div>
                <div className="al-stat">
                  <p className="al-stat-label">Emails sent</p>
                  <p className="al-stat-value">{emailSendCount}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h2 className="al-h2">Sequence performance</h2>
                <span className="al-muted">Last 7 days</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sequenceSummaries.length === 0 ? (
                  <div className="al-inner-subtle">
                    <p className="al-body">No sequences yet. Create one to start tracking workflow activity.</p>
                  </div>
                ) : (
                  sequenceSummaries.map((sequence) => (
                    <div key={sequence.id} className="al-inner" style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                        <div>
                          <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>{sequence.name}</p>
                          <p className="al-body" style={{ marginTop: "0.15rem" }}>
                            {sequence._count.enrollments} enrollments · {sequence._count.steps} steps
                          </p>
                        </div>
                        <span className={`status-badge ${getStatusClass(sequence.status)}`}>{sequence.status}</span>
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
