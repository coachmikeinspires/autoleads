"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Sequence = {
  id: string;
  name: string;
  status: string;
};

type Step = {
  id: string;
  stepNumber: number;
  subject: string | null;
  body: string | null;
  delayDays: number;
};

type Lead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  companyName: string | null;
};

type Enrollment = {
  id: string;
  status: string;
  currentStep: number;
  enrolledAt: string;
  lead: Lead;
};

export default function SequenceDetailPage(){
  const params = useParams();
  const id = params.id as string;
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stepNum, setStepNum] = useState(1);
  const [stepSubject, setStepSubject] = useState("");
  const [stepBody, setStepBody] = useState("");
  const [stepDelay, setStepDelay] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState("");

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

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [sequenceRes, stepsRes, enrollmentsRes, leadsRes] = await Promise.all([
        fetch(`/api/email_sequences/${id}`, { cache: "no-store" }),
        fetch(`/api/sequence_steps?sequenceId=${id}`, { cache: "no-store" }),
        fetch(`/api/sequence_enrollments?sequenceId=${id}`, { cache: "no-store" }),
        fetch(`/api/leads`, { cache: "no-store" }),
      ]);

      if (!sequenceRes.ok || !stepsRes.ok || !enrollmentsRes.ok || !leadsRes.ok) {
        throw new Error("Failed to load sequence details");
      }

      setSequence(await sequenceRes.json());
      const stepsData = (await stepsRes.json()) as Step[];
      setSteps(stepsData);
      setStepNum(stepsData.length + 1 || 1);
      setEnrollments(await enrollmentsRes.json());
      setLeads(await leadsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sequence details");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableLeads = leads.filter((lead) => !enrollments.some((enrollment) => enrollment.lead.id === lead.id));

  useEffect(() => {
    if (!selectedLeadId && availableLeads.length > 0) {
      setSelectedLeadId(availableLeads[0].id);
    }
  }, [availableLeads, selectedLeadId]);

  async function addStep(event: React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setError(null);

    const res = await fetch('/api/sequence_steps', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ sequenceId: id, stepNumber: stepNum, subject: stepSubject, body: stepBody, delayDays: stepDelay }),
    });

    if (!res.ok) {
      setError('Failed to add step');
      return;
    }

    setStepSubject('');
    setStepBody('');
    setStepDelay(0);
    await load();
  }

  async function addEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLeadId) {
      setError('Select a lead to enroll');
      return;
    }

    setError(null);

    const res = await fetch('/api/sequence_enrollments', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ leadId: selectedLeadId, sequenceId: id }),
    });

    if (!res.ok) {
      setError('Failed to enroll lead');
      return;
    }

    setSelectedLeadId('');
    await load();
  }

  return (
    <div className="al-shell">
      <div className="al-grid">
        <Sidebar />
        <section className="al-main">
          <div className="al-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p className="al-overline">Sequence</p>
                <h1 className="al-h1">{sequence?.name || "Loading sequence…"}</h1>
                <p className="al-body" style={{ marginTop: "0.25rem" }}>Manage steps and enroll leads into this workflow.</p>
              </div>
              <span className={`status-badge ${getStatusClass(sequence?.status || "draft")}`}>
                {sequence?.status || "loading"}
              </span>
            </div>

            {error ? <p className="al-error" style={{ marginTop: "1rem" }}>{error}</p> : null}

            <div style={{ marginTop: "1.75rem", display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
              <form className="al-inner" style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={addStep}>
                <h2 className="al-h2">Add step</h2>
                <label>
                  <span className="al-label">Step number</span>
                  <input type="number" min={1} value={stepNum} onChange={(e) => setStepNum(+e.target.value)} className="al-input" />
                </label>
                <label>
                  <span className="al-label">Subject</span>
                  <input value={stepSubject} onChange={(e) => setStepSubject(e.target.value)} className="al-input" placeholder="Email subject" />
                </label>
                <label>
                  <span className="al-label">Body</span>
                  <textarea value={stepBody} onChange={(e) => setStepBody(e.target.value)} className="al-input" style={{ minHeight: "8rem", resize: "vertical" }} placeholder="Email body" />
                </label>
                <label>
                  <span className="al-label">Delay (days)</span>
                  <input type="number" min={0} value={stepDelay} onChange={(e) => setStepDelay(+e.target.value)} className="al-input" />
                </label>
                <button type="submit" className="btn-primary" style={{ width: "100%" }}>Add step</button>
              </form>

              <form className="al-inner" style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={addEnrollment}>
                <h2 className="al-h2">Enroll lead</h2>
                <label>
                  <span className="al-label">Lead</span>
                  <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} className="al-input">
                    <option value="">Select a lead</option>
                    {availableLeads.map((lead) => {
                      const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || "Unnamed lead";
                      return <option key={lead.id} value={lead.id}>{fullName}</option>;
                    })}
                  </select>
                </label>
                <button type="submit" className="btn-primary" style={{ width: "100%" }}>Enroll lead</button>
                <p className="al-body">{availableLeads.length} leads available for enrollment.</p>
              </form>
            </div>

            <div style={{ marginTop: "1.5rem", display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
              <div className="al-inner">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 className="al-h2">Steps</h2>
                  <span className="al-muted">{steps.length} total</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {isLoading ? (
                    <p className="al-body">Loading steps…</p>
                  ) : steps.length === 0 ? (
                    <p className="al-body">No steps yet. Add the first email step for this sequence.</p>
                  ) : (
                    steps.map((step) => (
                      <div key={step.id} style={{ borderRadius: "0.875rem", border: "1px solid rgba(30,71,103,0.55)", padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                          <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>Step {step.stepNumber}: {step.subject || "Untitled step"}</p>
                          <span className="al-muted">{step.delayDays}d delay</span>
                        </div>
                        <p className="al-body" style={{ marginTop: "0.35rem" }}>{step.body || "No body set yet."}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="al-inner">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 className="al-h2">Enrollments</h2>
                  <span className="al-muted">{enrollments.length} active</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {isLoading ? (
                    <p className="al-body">Loading enrollments…</p>
                  ) : enrollments.length === 0 ? (
                    <p className="al-body">No enrolled leads yet. Add one from the form above.</p>
                  ) : (
                    enrollments.map((enrollment) => {
                      const fullName = [enrollment.lead.firstName, enrollment.lead.lastName].filter(Boolean).join(" ") || enrollment.lead.email || "Unnamed lead";
                      const secondary = enrollment.lead.companyName || enrollment.lead.email || "—";
                      return (
                        <div key={enrollment.id} style={{ borderRadius: "0.875rem", border: "1px solid rgba(30,71,103,0.55)", padding: "0.875rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                            <div>
                              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>{fullName}</p>
                              <p className="al-body" style={{ marginTop: "0.15rem" }}>{secondary}</p>
                            </div>
                            <span className={`status-badge ${getStatusClass(enrollment.status)}`}>{enrollment.status}</span>
                          </div>
                          <p className="al-muted" style={{ marginTop: "0.5rem" }}>Step {enrollment.currentStep} · Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
