import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui-kit";
import { useAssignedLab } from "@/lib/use-assigned-lab";

export default function AssistantRequests() {
  const lab = useAssignedLab();
  const [reqs, setReqs] = useState([]);
  const load = () => lab && api.get(`/labs/${lab.id}/requests`).then((r) => setReqs(r.data));
  useEffect(() => { load(); }, [lab]);

  const act = async (rid, action) => {
    try {
      await api.put(`/labs/${lab.id}/requests/${rid}/${action}`);
      load();
    } catch (e) { window.alert(e?.response?.data?.detail || "Failed"); }
  };

  if (!lab) return <Layout><PageHeader title="Requests" /><EmptyState title="No lab assigned" /></Layout>;

  return (
    <Layout>
      <PageHeader title="Equipment Requests" subtitle={`Approve, reject, and process returns for ${lab.name}`} />
      <div className="crce-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-[#64748B]">
              <th className="py-3 px-5">Student</th>
              <th className="py-3 px-5">Equipment</th>
              <th className="py-3 px-5 text-right">Qty</th>
              <th className="py-3 px-5">Purpose</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Due</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reqs.map((r) => (
              <tr key={r.id} className="border-t border-[#E2E8F0]" data-testid={`req-row-${r.id}`}>
                <td className="py-3 px-5">
                  <div className="font-medium">{r.student_name}</div>
                  <div className="text-xs text-[#64748B]">{r.student_email}</div>
                </td>
                <td className="py-3 px-5">{r.equipment_name}</td>
                <td className="py-3 px-5 text-right font-mono">{r.quantity}</td>
                <td className="py-3 px-5 max-w-xs truncate text-[#64748B]">{r.purpose || "—"}</td>
                <td className="py-3 px-5"><StatusBadge status={r.status} /></td>
                <td className="py-3 px-5 text-xs text-[#64748B]">{r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</td>
                <td className="py-3 px-5 text-right">
                  <div className="flex gap-1.5 justify-end">
                    {r.status === "PENDING" && (
                      <>
                        <button data-testid={`approve-${r.id}`} onClick={() => act(r.id, "approve")} className="crce-btn-primary !py-1.5 !px-3 text-xs">Approve</button>
                        <button data-testid={`reject-${r.id}`} onClick={() => act(r.id, "reject")} className="crce-btn-danger !py-1.5 !px-3 text-xs">Reject</button>
                      </>
                    )}
                    {r.status === "ISSUED" && (
                      <button data-testid={`return-${r.id}`} onClick={() => act(r.id, "return")} className="crce-btn-secondary !py-1.5 !px-3 text-xs">Mark Returned</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reqs.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-[#64748B]">No requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
