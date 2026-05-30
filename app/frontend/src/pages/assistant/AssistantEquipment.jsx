import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui-kit";
import { Plus, Trash2, Edit, Wrench } from "lucide-react";
import { useAssignedLab } from "@/lib/use-assigned-lab";

export default function AssistantEquipment() {
  const lab = useAssignedLab();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", category: "general", description: "", total_qty: 1, cost: 0 });

  const load = () => lab && api.get(`/labs/${lab.id}/equipment`).then((r) => setItems(r.data));
  useEffect(() => { load(); }, [lab]);

  const submit = async (e) => {
    e.preventDefault();
    if (edit) {
      await api.put(`/labs/${lab.id}/equipment/${edit.id}`, form);
    } else {
      await api.post(`/labs/${lab.id}/equipment`, form);
    }
    setShow(false); setEdit(null);
    setForm({ name: "", category: "general", description: "", total_qty: 1, cost: 0, purchase_date: "", supplier_name: "", serial_no: "", remarks: ""});
    load();
  };

  const onEdit = (it) => {
    setEdit(it); setShow(true);
    setForm({
      name: it.name, category: it.category || "general", description: it.description || "",
      total_qty: it.total_qty, cost: it.cost, purchase_date: it.purchase_date || "",
      supplier_name: it.supplier_name || "",
      serial_no: it.serial_no || "",
      remarks: it.remarks || "",
    });
  };

  const onDelete = async (it) => {
    if (!window.confirm(`Delete ${it.name}?`)) return;
    await api.delete(`/labs/${lab.id}/equipment/${it.id}`); load();
  };

  const onMaintain = async (it) => {
    const desc = window.prompt("Maintenance description:");
    if (!desc) return;
    const costStr = window.prompt("Maintenance cost (₹):", "0");
    if (costStr === null) return;
    await api.post(`/labs/${lab.id}/maintenance`, { equipment_id: it.id, description: desc, cost: Number(costStr) || 0 });
    load();
  };

  if (!lab) return <Layout><PageHeader title="Equipment" /><EmptyState title="No lab assigned" /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Equipment"
        subtitle={`Manage inventory for ${lab.name}`}
        action={<button data-testid="add-equipment-btn" onClick={() => { setShow(true); setEdit(null); setForm({ name: "", category: "general", description: "", total_qty: 1, cost: 0 }); }} className="crce-btn-primary"><Plus size={16} />Add Equipment</button>}
      />

      {show && (
        <form onSubmit={submit} className="crce-card p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 crce-fade-up">
          <div className="md:col-span-2"><label className="crce-label">Name</label><input data-testid="eq-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Total Qty</label><input data-testid="eq-qty" type="number" min={1} value={form.total_qty} onChange={(e) => setForm({ ...form, total_qty: Number(e.target.value) })} className="crce-input" /></div>
          <div><label className="crce-label">Cost (₹/unit)</label><input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="crce-input" /></div>
          <div className="md:col-span-2"><label className="crce-label">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Purchase Date</label><input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Supplier Name</label><input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Serial Number</label><input value={form.serial_no} onChange={(e) => setForm({ ...form, serial_no: e.target.value })} className="crce-input" /></div>
          <div className="md:col-span-2"><label className="crce-label">Remarks</label><input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="crce-input" /></div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => { setShow(false); setEdit(null); }} className="crce-btn-secondary">Cancel</button>
            <button data-testid="eq-submit" type="submit" className="crce-btn-primary">{edit ? "Save" : "Add"}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => {
          const issued = it.total_qty - it.available_qty;
          const pct = it.total_qty ? (issued / it.total_qty) * 100 : 0;
          const barColor = it.status === "MAINTENANCE" ? "bg-[#F59E0B]" : issued > 0 ? "bg-[#EF4444]" : "bg-[#22C55E]";
          return (
            <div key={it.id} className="crce-card p-5" data-testid={`eq-card-${it.id}`}>
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
                  <span>{it.available_qty} available · {issued} issued</span>
                  <span>Total {it.total_qty}</span>
                </div>
                <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className={barColor} style={{ width: `${pct}%`, height: "100%", transition: "width 300ms" }} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => onEdit(it)} className="crce-btn-secondary !py-1.5 !px-3 text-xs"><Edit size={14} />Edit</button>
                <button onClick={() => onMaintain(it)} className="crce-btn-secondary !py-1.5 !px-3 text-xs"><Wrench size={14} />Maintain</button>
                <button onClick={() => onDelete(it)} className="crce-btn-danger !py-1.5 !px-3 text-xs"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="md:col-span-3"><EmptyState title="No equipment" hint="Click 'Add Equipment' to start." /></div>}
      </div>
    </Layout>
  );
}
