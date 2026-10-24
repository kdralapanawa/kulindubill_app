import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { downloadBillsPdf, formatLKR, type Bill } from "@/lib/bills";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Bill Manager" },
      { name: "description", content: "View, search and export all submitted bills." },
      { property: "og:title", content: "Admin Dashboard | Bill Manager" },
      { property: "og:description", content: "View, search and export all submitted bills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) return;
      const { data } = await supabase.from("bills").select("*").order("created_at", { ascending: false });
      setBills((data as Bill[]) ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? bills.filter((b) => b.bill_title.toLowerCase().includes(s) || b.name.toLowerCase().includes(s)) : bills;
  }, [bills, q]);
  const total = filtered.reduce((s, b) => s + Number(b.amount), 0);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isAdmin === null) return <div className="container py-5">Loading...</div>;
  if (!isAdmin)
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Access denied. Admins only.</div>
        <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
      </div>
    );

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Admin Dashboard</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-success"
            disabled={pdfBusy || filtered.length === 0}
            onClick={async () => { setPdfBusy(true); await downloadBillsPdf(filtered); setPdfBusy(false); }}
          >
            {pdfBusy ? "Generating..." : "Download All Bills as PDF"}
          </button>
          <button className="btn btn-outline-secondary" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6"><div className="card text-bg-primary"><div className="card-body"><div className="small">Total Bills</div><div className="fs-3 fw-bold">{filtered.length}</div></div></div></div>
        <div className="col-sm-6"><div className="card text-bg-dark"><div className="card-body"><div className="small">Total Amount</div><div className="fs-3 fw-bold">{formatLKR(total)}</div></div></div></div>
      </div>

      <input className="form-control mb-3" placeholder="Search by bill title or name..." value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-light">
            <tr><th>#</th><th>Title</th><th>Name</th><th className="text-end">Amount</th><th>Date</th><th>Image</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">No bills found.</td></tr>}
            {filtered.map((b, i) => (
              <tr key={b.id}>
                <td>{i + 1}</td>
                <td>{b.bill_title}</td>
                <td>{b.name}</td>
                <td className="text-end">{formatLKR(b.amount)}</td>
                <td>{b.bill_date}</td>
                <td>
                  <img src={b.image_base64} alt={b.bill_title} className="img-thumbnail" style={{ width: 60, height: 60, objectFit: "cover", cursor: "pointer" }} onClick={() => setPreview(b.image_base64)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.6)" }} onClick={() => setPreview(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content"><div className="modal-body text-center"><img src={preview} alt="Bill" className="img-fluid" /></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
