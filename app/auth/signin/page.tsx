"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="signin-shell">
      <div className="signin-card">
        <p className="al-sidebar-logo-tag">Op Edge AI</p>
        <h1 className="al-h1">Welcome back</h1>
        <p className="al-body" style={{ marginTop: "0.4rem", marginBottom: "1.5rem" }}>
          Sign in to manage your leads, sequences, CRM, and team.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label>
            <span className="al-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="al-input"
              placeholder="you@company.com"
              required
            />
          </label>
          <label>
            <span className="al-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="al-input"
              placeholder="••••••••"
              required
            />
          </label>
          {error && <p className="al-error">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "0.25rem" }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
