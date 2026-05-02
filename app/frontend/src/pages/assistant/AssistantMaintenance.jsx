import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui-kit";
import { useAssignedLab } from "@/lib/use-assigned-lab";

export default function AssistantMaintenance() {
  const lab = useAssignedLab();
  const [items, setItems] = useState([]);
  const load = () => lab && api.get(`/labs/${lab.id}/maintenance`).then((r) => setItems(r.data));
  useEffect(() => { load(); }, [lab]);

  const complete = async (mid) => {
    await api.put(`/labs/${lab.id}/maintenance/${mid}/complete`); load();
  };

  if (!lab) return <Layout><PageHeader title="Maintenance" /><EmptyState title="No lab assigned" /></Layout>;

  return (
    <Layout>
      <PageHeader title="Maintenance Log" subtitle={`Track repairs and servicing for ${lab.name}`} />
      <div className="crce-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-[#64748B]">
              <th className="py-3 px-5">Equipment</th>
              <th className="py-3 px-5">Description</th>
              <th className="py-3 px-5 text-right">Cost</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Started</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-[#E2E8F0]" data-testid={`maint-row-${m.id}`}>
                <td className="py-3 px-5 font-medium">{m.equipment_name}</td>
                <td className="py-3 px-5 text-[#64748B]">{m.description}</td>
                <td className="py-3 px-5 text-right font-mono">₹{m.cost}</td>
                <td className="py-3 px-5"><StatusBadge status={m.status} /></td>
                <td className="py-3 px-5 text-xs text-[#64748B]">{m.started_at}</td>
                <td className="py-3 px-5 text-right">
                  {m.status === "IN_PROGRESS" && (
                    <button data-testid={`complete-${m.id}`} onClick={() => complete(m.id)} className="crce-btn-primary !py-1.5 !px-3 text-xs">Complete</button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-[#64748B]">No maintenance records.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
