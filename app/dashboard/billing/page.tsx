import Sidebar from "@/components/Sidebar";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const session = await getAuthSession();
  const org = await prisma.org.findUnique({ where: { id: session?.user?.orgId } });

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <div className="al-page-header">
              <div>
                <p className="al-overline">Billing</p>
                <h1 className="al-h1">Subscription plan</h1>
              </div>
              <span className={`status-badge ${org?.planStatus === "active" ? "status-active" : "status-draft"}`}>
                {org?.planStatus ?? "trialing"}
              </span>
            </div>
            <div style={{ marginTop: "1.75rem", display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
              <div className="al-inner">
                <p className="al-stat-label">Current plan</p>
                <p className="al-stat-value" style={{ textTransform: "capitalize" }}>{org?.plan ?? "starter"}</p>
                <p className="al-body" style={{ marginTop: "1rem" }}>
                  {org?.stripeSubscriptionId
                    ? "Your workspace is linked to an active subscription."
                    : "No Stripe subscription attached. Configure Stripe keys to enable billing."}
                </p>
              </div>
              <div className="al-inner">
                <p className="al-overline">Organization details</p>
                <div style={{ marginTop: "1rem" }}>
                  <div className="al-data-row"><span className="al-data-key">Name</span><span className="al-data-val">{org?.name ?? "—"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Created</span><span className="al-data-val">{org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Stripe customer</span><span className="al-data-val" style={{ fontSize: "0.78rem" }}>{org?.stripeCustomerId ?? "Not connected"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Stripe subscription</span><span className="al-data-val" style={{ fontSize: "0.78rem" }}>{org?.stripeSubscriptionId ?? "Not connected"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
