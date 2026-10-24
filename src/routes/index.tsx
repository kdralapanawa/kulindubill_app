import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { fileToBase64Jpeg } from "@/lib/bills";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Submit a Bill | Bill Manager" },
      { name: "description", content: "Submit your bill with title, name, amount in LKR, date and image." },
      { property: "og:title", content: "Submit a Bill | Bill Manager" },
      { property: "og:description", content: "Submit your bill with title, name, amount in LKR, date and image." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UserPanel,
});

const schema = z.object({
  bill_title: z.string().trim().min(1, "Bill title is required").max(150),
  name: z.string().trim().min(1, "Name is required").max(100),
  amount: z.coerce.number().positive("Amount must be greater than 0").max(1e10),
  bill_date: z.string().min(1, "Date is required"),
});

function UserPanel() {
  const [form, setForm] = useState({ bill_title: "", name: "", amount: "", bill_date: "" });
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "danger"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setStatus({ type: "danger", msg: parsed.error.issues[0]?.message ?? "Invalid input" });
    if (!file || !file.type.startsWith("image/")) return setStatus({ type: "danger", msg: "Please choose a bill image." });
    setSaving(true);
    try {
      const image_base64 = await fileToBase64Jpeg(file);
      const { error } = await supabase.from("bills").insert({ ...parsed.data, image_base64 });
      if (error) throw error;
      setStatus({ type: "success", msg: "Bill saved successfully!" });
      setForm({ bill_title: "", name: "", amount: "", bill_date: "" });
      setFile(null);
      setFileKey((k) => k + 1);
    } catch (err) {
      setStatus({ type: "danger", msg: "Could not save the bill: " + (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container py-5" style={{ maxWidth: 600 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Submit a Bill</h1>
        <Link to="/auth" className="btn btn-outline-secondary btn-sm">Admin Login</Link>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          {status && <div className={`alert alert-${status.type}`}>{status.msg}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Bill Title</label>
              <input className="form-control" value={form.bill_title} onChange={set("bill_title")} maxLength={150} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name} onChange={set("name")} maxLength={100} required />
            </div>
            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label">Amount (LKR)</label>
                <input type="number" min="0.01" step="0.01" className="form-control" value={form.amount} onChange={set("amount")} required />
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.bill_date} onChange={set("bill_date")} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Bill Image</label>
              <input key={fileKey} type="file" accept="image/*" className="form-control" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            </div>
            <button className="btn btn-primary w-100" disabled={saving}>
              {saving ? "Saving..." : "Save Bill"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
