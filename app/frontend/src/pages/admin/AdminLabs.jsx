import { useEffect, useState } from "react";
import { api, API } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, Badge, EmptyState } from "@/components/ui-kit";
import { Plus, Trash2, MapPin, Wallet, Users as UsersIcon } from "lucide-react";


export default function AdminLabs() {
  const [labs, setLabs] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", capacity: 30, budget: 100000, department: "", assistant_id: "", incharge_id: "" });
  const [err, setErr] = useState("");

  const load = async () => {
    const [a, b] = await Promise.all([api.get("/labs"), api.get("/admin/assistants")]);
    setLabs(a.data); setAssistants(b.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api.post("/admin/labs", { 
        ...form, 
        assistant_id: form.assistant_id ? Number(form.assistant_id) : null,
        incharge_id: form.incharge_id ? Number(form.incharge_id) : null
      });
      setShowForm(false);
      setForm({ name: "", location: "", capacity: 30, budget: 100000, department: "", assistant_id: "", incharge_id: "" });
      load();
    } catch (e) { setErr(e?.response?.data?.detail || "Failed to create lab"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this lab and its database?")) return;
    await api.delete(`/admin/labs/${id}`); load();
  };

const assign = async (lab) => {
  const inchargeUsers = assistants.filter(a => a.role === "INCHARGE");
  const options = inchargeUsers.map(a => `${a.id}: ${a.name}`).join("\n") || "No incharge users found";
  const aid = window.prompt(
    `Assistant ID to assign:\n(Assistants: ${assistants.filter(a=>a.role==="ASSISTANT").map(a=>`${a.id}:${a.name}`).join(", ")})`,
    lab.assistant_id || ""
  );
  if (!aid) return;
  await api.put(`/admin/labs/${lab.id}/assign-assistant`, { assistant_id: Number(aid) });
  load();
};

const assignIncharge = async (lab) => {
  const inchargeList = assistants.filter(a => a.role === "INCHARGE");
  const aid = window.prompt(
    `Incharge ID to assign:\n(Incharge users: ${inchargeList.map(a=>`${a.id}:${a.name}`).join(", ")})`,
    lab.incharge_id || ""
  );
  if (!aid) return;
  await api.put(`/admin/labs/${lab.id}/assign-incharge`, { incharge_id: Number(aid) });
  load();
};

  const setBudget = async (lab) => {
    const v = window.prompt("New budget (₹):", lab.budget);
    if (v === null) return;
    await api.put(`/admin/labs/${lab.id}/budget`, { budget: Number(v) });
    load();
  };

  const importRegistry = async (lab) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.xlsx,.xls";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(`/admin/labs/${lab.id}/import-registry`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      window.alert(`Successfully imported ${res.data.imported} equipment items!`);
      load();
    } catch (e) {
      window.alert(e?.response?.data?.detail || "Import failed");
    }
  };
  input.click();
};

const exportRegistry = async (lab) => {
  const token = localStorage.getItem("crce_token");
  const res = await fetch(`${API}/admin/labs/${lab.id}/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) { window.alert("Export failed"); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lab.name}_registry.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

return (
    <Layout>
      <PageHeader
        title="Labs"
        subtitle="Create labs, assign assistants, and configure budgets"
        action={<button data-testid="create-lab-btn" onClick={() => setShowForm((v) => !v)} className="crce-btn-primary"><Plus size={16} />New Lab</button>}
      />

      {showForm && (
        <form onSubmit={submit} className="crce-card p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 crce-fade-up">
          <div><label className="crce-label">Name</label><input data-testid="lab-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Location</label><input data-testid="lab-location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Capacity</label><input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="crce-input" /></div>
          <div><label className="crce-label">Budget (₹)</label><input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} className="crce-input" /></div>
          <div><label className="crce-label">Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="crce-input" /></div>
          <div>
            <label className="crce-label">Lab Assistant (optional)</label>
            <select value={form.assistant_id} onChange={(e) => setForm({ ...form, assistant_id: e.target.value })} className="crce-input">
              <option value="">— None —</option>
              {assistants.filter(a => a.role === "ASSISTANT").map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="crce-label">Lab Incharge (optional)</label>
            <select value={form.incharge_id} onChange={(e) => setForm({ ...form, incharge_id: e.target.value })} className="crce-input">
              <option value="">— None —</option>
              {assistants.filter(a => a.role === "INCHARGE").map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
          </div>
          {err && <div className="md:col-span-2 text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="crce-btn-secondary">Cancel</button>
            <button data-testid="lab-submit" type="submit" className="crce-btn-primary">Create Lab</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {labs.map((lab) => (
          <div key={lab.id} className="crce-card p-6" data-testid={`lab-card-${lab.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display font-bold text-lg">{lab.name}</div>
                <Badge tone="blue">{lab.department || "General"}</Badge>
              </div>
              <button onClick={() => remove(lab.id)} className="text-[#94A3B8] hover:text-[#EF4444]" title="Delete"><Trash2 size={16} /></button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#64748B]">
              <div className="flex items-center gap-2"><MapPin size={14} /> {lab.location}</div>
              <div className="flex items-center gap-2"><UsersIcon size={14} /> Capacity {lab.capacity}</div>
              <div className="flex items-center gap-2"><Wallet size={14} /> ₹{lab.budget?.toLocaleString()}</div>
              <div className="text-xs font-mono text-[#94A3B8]">{lab.db_name}</div>
            </div>
            <div className="mt-4 space-y-2 text-sm border-t border-[#F1F5F9] pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#64748B] text-xs">Lab Incharge</div>
                  <div className="font-medium">{lab.incharge_name || <span className="text-[#94A3B8]">Not set</span>}</div>
                </div>
                <div>
                  <div className="text-[#64748B] text-xs">Assistant</div>
                  <div className="font-medium">{lab.assistant_name || <span className="text-[#94A3B8]">Unassigned</span>}</div>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setBudget(lab)} className="crce-btn-secondary !py-1.5 !px-3 text-xs">Budget</button>
                <button onClick={() => importRegistry(lab)} className="crce-btn-secondary !py-1.5 !px-3 text-xs">Import</button>
                <button onClick={() => exportRegistry(lab)} className="crce-btn-secondary !py-1.5 !px-3 text-xs">Export</button>
                <button onClick={() => assign(lab)} className="crce-btn-secondary !py-1.5 !px-3 text-xs">Set Assistant</button>
                <button onClick={() => assignIncharge(lab)} className="crce-btn-secondary !py-1.5 !px-3 text-xs">Set Incharge</button>
              </div>
            </div>
          </div>
        ))}
        {labs.length === 0 && <div className="md:col-span-3"><EmptyState title="No labs yet" hint="Click 'New Lab' to create your first lab." /></div>}
      </div>
    </Layout>
  );
}