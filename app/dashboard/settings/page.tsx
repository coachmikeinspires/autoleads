import Sidebar from "@/components/Sidebar";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage(){
  const session = await getAuthSession();
  const org = await prisma.org.findUnique({ where: { id: session?.user?.orgId } });

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <p className="al-overline">Settings</p>
            <h1 className="al-h1">Workspace settings</h1>
            <p className="al-body" style={{ marginTop: "0.4rem" }}>Review the current account, organization, and environment state.</p>

            <div style={{ marginTop: "1.75rem", display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
              <div className="al-inner">
                <p className="al-overline">User</p>
                <div style={{ marginTop: "1rem" }}>
                  <div className="al-data-row"><span className="al-data-key">Email</span><span className="al-data-val">{session?.user?.email ?? "—"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Role</span><span className="al-data-val">{session?.user?.role ?? "—"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Org ID</span><span className="al-data-val" style={{ fontSize: "0.78rem" }}>{session?.user?.orgId ?? "—"}</span></div>
                </div>
              </div>
              <div className="al-inner">
                <p className="al-overline">Organization</p>
                <div style={{ marginTop: "1rem" }}>
                  <div className="al-data-row"><span className="al-data-key">Name</span><span className="al-data-val">{org?.name ?? "—"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Plan</span><span className="al-data-val">{org?.plan ?? "starter"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Status</span><span className="al-data-val">{org?.planStatus ?? "trialing"}</span></div>
                  <div className="al-data-row"><span className="al-data-key">Created</span><span className="al-data-val">{org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
