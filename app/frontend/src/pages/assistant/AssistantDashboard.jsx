import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, StatCard, EmptyState } from "@/components/ui-kit";
import { useAssignedLab } from "@/lib/use-assigned-lab";

export default function AssistantDashboard() {
  const lab = useAssignedLab();
  const [equipment, setEquipment] = useState([]);
  const [reqs, setReqs] = useState([]);

  useEffect(() => {
    if (!lab) return;
    api.get(`/labs/${lab.id}/equipment`).then((r) => setEquipment(r.data));
    api.get(`/labs/${lab.id}/requests`).then((r) => setReqs(r.data));
  }, [lab]);

  if (!lab) {
    return (
      <Layout>
        <PageHeader title="Assistant Dashboard" />
        <EmptyState title="No lab assigned" hint="Ask an admin to assign you to a lab to start managing equipment." />
      </Layout>
    );
  }

  const totalUnits = equipment.reduce((a, e) => a + e.total_qty, 0);
  const issuedUnits = equipment.reduce((a, e) => a + (e.total_qty - e.available_qty), 0);
  const pending = reqs.filter((r) => r.status === "PENDING").length;
  const issued = reqs.filter((r) => r.status === "ISSUED").length;

  return (
    <Layout>
      <PageHeader title={lab.name} subtitle={`${lab.location} · ${lab.department || "General"}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard testId="asst-stat-equipment" label="Equipment Items" value={equipment.length} color="blue" />
        <StatCard testId="asst-stat-units" label="Total Units" value={totalUnits} hint={`${issuedUnits} issued`} color="green" />
        <StatCard testId="asst-stat-pending" label="Pending Requests" value={pending} color="amber" />
        <StatCard testId="asst-stat-issued" label="Currently Issued" value={issued} color="red" />
      </div>

      <div className="mt-8 crce-card p-6">
        <div className="font-display font-bold text-lg mb-4">Recent Requests</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#64748B] border-b border-[#E2E8F0]">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Equipment</th>
                <th className="py-2 pr-4 text-right">Qty</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {reqs.slice(0, 6).map((r) => (
                <tr key={r.id} className="border-b border-[#F1F5F9]">
                  <td className="py-2 pr-4">{r.student_name}</td>
                  <td className="py-2 pr-4">{r.equipment_name}</td>
                  <td className="py-2 pr-4 text-right font-mono">{r.quantity}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                </tr>
              ))}
              {reqs.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-[#64748B]">No requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
