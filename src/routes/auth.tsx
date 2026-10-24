import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login | Bill Manager" },
      { name: "description", content: "Sign in to the Bill Manager admin dashboard." },
      { property: "og:title", content: "Admin Login | Bill Manager" },
      { property: "og:description", content: "Sign in to the Bill Manager admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError("Invalid email or password.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h1 className="h3 mb-4 text-center">Admin Login</h1>
      <div className="card shadow-sm">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary w-100" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
          </form>
        </div>
      </div>
      <p className="text-center mt-3"><Link to="/">← Back to bill form</Link></p>
    </div>
  );
}
