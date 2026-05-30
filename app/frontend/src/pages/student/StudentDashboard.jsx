import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/ui-kit";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const [borrowed, setBorrowed] = useState([]);
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    api.get("/students/me/borrowed").then((r) => setBorrowed(r.data));
    api.get("/labs").then((r) => setLabs(r.data));
  }, []);

  const active = borrowed.filter((b) => b.status === "ISSUED");
  const pending = borrowed.filter((b) => b.status === "PENDING");
  const overdue = active.filter((b) => b.due_date && new Date(b.due_date) < new Date());

  return (
    <Layout>
      <PageHeader
        title="Student Dashboard"
        subtitle="Browse labs, request equipment, and track your borrowed items"
        action={<Link to="/student/labs" className="crce-btn-primary">Browse Labs</Link>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard testId="stu-stat-active" label="Currently Borrowed" value={active.length} color="blue" />
        <StatCard testId="stu-stat-pending" label="Pending Requests" value={pending.length} color="amber" />
        <StatCard testId="stu-stat-overdue" label="Overdue" value={overdue.length} color="red" />
        <StatCard testId="stu-stat-labs" label="Available Labs" value={labs.length} color="green" />
      </div>

      <div className="mt-8 crce-card p-6">
        <div className="font-display font-bold text-lg mb-4">Recent Activity</div>
        {borrowed.length === 0 ? (
          <EmptyState title="No activity yet" hint="Browse labs and request your first piece of equipment." />
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {borrowed.slice(0, 6).map((b) => (
              <li key={`${b.lab_id}-${b.id}`} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.equipment_name} <span className="text-xs text-[#64748B]">×{b.quantity}</span></div>
                  <div className="text-xs text-[#64748B]">{b.lab_name} · {b.requested_at}</div>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
