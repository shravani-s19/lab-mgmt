import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { StatCard, PageHeader, Badge } from "@/components/ui-kit";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/analytics").then((r) => setData(r.data)); }, []);

  return (
    <Layout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of all labs, users, and resource allocation"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard testId="stat-labs" label="Total Labs" value={data?.totals.labs ?? "—"} color="blue" />
        <StatCard testId="stat-equipment" label="Equipment Units" value={data?.totals.equipment_units ?? "—"} color="green" hint={`${data?.totals.issued_units ?? 0} issued`} />
        <StatCard testId="stat-pending" label="Pending Requests" value={data?.totals.pending_requests ?? "—"} color="amber" />
        <StatCard testId="stat-students" label="Students" value={data?.users?.STUDENT ?? 0} color="slate" hint={`${data?.users?.ASSISTANT ?? 0} assistants`} />
      </div>

      <div className="mt-8 crce-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-bold text-lg">Lab Performance</div>
            <div className="text-sm text-[#64748B]">Budget vs spend, units issued</div>
          </div>
          <Link to="/admin/labs" className="crce-btn-secondary !py-2 !px-4 text-sm">Manage labs</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#64748B] border-b border-[#E2E8F0]">
                <th className="py-3 pr-4">Lab</th>
                <th className="py-3 pr-4 text-right">Budget</th>
                <th className="py-3 pr-4 text-right">Spend</th>
                <th className="py-3 pr-4 text-right">Items</th>
                <th className="py-3 pr-4 text-right">Issued</th>
                <th className="py-3 pr-4 text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {(data?.per_lab || []).map((l) => (
                <tr key={l.lab_id} className="border-b border-[#F1F5F9]" data-testid={`lab-row-${l.lab_id}`}>
                  <td className="py-3 pr-4 font-medium">{l.lab_name}</td>
                  <td className="py-3 pr-4 text-right font-mono">₹{l.budget?.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right font-mono">₹{Math.round(l.spend).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right">{l.equipment_count}</td>
                  <td className="py-3 pr-4 text-right">{l.issued_units}/{l.total_units}</td>
                  <td className="py-3 pr-4 text-right"><Badge tone={l.pending_requests ? "amber" : "slate"}>{l.pending_requests}</Badge></td>
                </tr>
              ))}
              {(!data || data.per_lab.length === 0) && (
                <tr><td colSpan={6} className="py-6 text-center text-[#64748B]">No labs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
