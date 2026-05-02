import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui-kit";
import { ArrowLeft } from "lucide-react";

export default function StudentLabDetail() {
  const { id } = useParams();
  const [lab, setLab] = useState(null);
  const [items, setItems] = useState([]);
  const [requesting, setRequesting] = useState(null);
  const [qty, setQty] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    api.get(`/labs/${id}`).then((r) => setLab(r.data));
    api.get(`/labs/${id}/equipment`).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); }, [id]);

  const submit = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      await api.post(`/labs/${id}/requests`, {
        equipment_id: requesting.id, quantity: Number(qty), purpose,
      });
      setMsg("Request submitted ✓");
      setRequesting(null); setQty(1); setPurpose("");
      load();
    } catch (e) { setMsg(e?.response?.data?.detail || "Failed"); }
  };

  if (!lab) return <Layout><PageHeader title="Lab" /></Layout>;

  return (
    <Layout>
      <Link to="/student/labs" className="text-sm text-[#64748B] hover:text-[#2563EB] inline-flex items-center gap-1 mb-2"><ArrowLeft size={14} /> Back to labs</Link>
      <PageHeader title={lab.name} subtitle={`${lab.location} · ${lab.department || "General"} · Assistant: ${lab.assistant_name || "Unassigned"}`} />

      {msg && <div data-testid="request-msg" className="mb-4 text-sm bg-blue-50 border border-blue-200 text-[#2563EB] rounded-lg px-3 py-2">{msg}</div>}

      {requesting && (
        <form onSubmit={submit} className="crce-card p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 crce-fade-up">
          <div className="md:col-span-2 font-display font-bold">Request: {requesting.name}</div>
          <div><label className="crce-label">Quantity</label><input data-testid="req-qty" type="number" min={1} max={requesting.available_qty} value={qty} onChange={(e) => setQty(e.target.value)} className="crce-input" /></div>
          <div><label className="crce-label">Purpose</label><input data-testid="req-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="crce-input" /></div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setRequesting(null)} className="crce-btn-secondary">Cancel</button>
            <button data-testid="req-submit" type="submit" className="crce-btn-primary">Submit Request</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => {
          const issued = it.total_qty - it.available_qty;
          const pct = it.total_qty ? (issued / it.total_qty) * 100 : 0;
          const barColor = it.status === "MAINTENANCE" ? "bg-[#F59E0B]" : issued > 0 ? "bg-[#EF4444]" : "bg-[#22C55E]";
          const disabled = it.available_qty === 0 || it.status !== "AVAILABLE";
          return (
            <div key={it.id} className="crce-card p-5" data-testid={`stu-eq-${it.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display font-bold text-lg">{it.name}</div>
                  <div className="text-xs text-[#64748B]">{it.category}</div>
                </div>
                <StatusBadge status={it.status} />
              </div>
              {it.description && <p className="text-sm text-[#64748B] mt-2">{it.description}</p>}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#64748B] mb-1">
                  <span>{it.available_qty} available</span>
                  <span>Total {it.total_qty}</span>
                </div>
                <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className={barColor} style={{ width: `${pct}%`, height: "100%", transition: "width 300ms" }} />
                </div>
              </div>
              <button
                data-testid={`request-btn-${it.id}`}
                disabled={disabled}
                onClick={() => { setRequesting(it); setQty(1); }}
                className="crce-btn-primary w-full mt-4"
              >
                {disabled ? "Unavailable" : "Request Equipment"}
              </button>
            </div>
          );
        })}
        {items.length === 0 && <div className="md:col-span-3"><EmptyState title="No equipment" hint="Check back later." /></div>}
      </div>
    </Layout>
  );
}
