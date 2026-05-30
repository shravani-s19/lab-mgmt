import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui-kit";

export default function StudentBorrowed() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/students/me/borrowed").then((r) => setItems(r.data)); }, []);

  return (
    <Layout>
      <PageHeader title="My Borrowed Items" subtitle="All your past and present equipment requests" />
      <div className="crce-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-[#64748B]">
              <th className="py-3 px-5">Equipment</th>
              <th className="py-3 px-5">Lab</th>
              <th className="py-3 px-5 text-right">Qty</th>
              <th className="py-3 px-5">Purpose</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Due</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => {
              const overdue = b.status === "ISSUED" && b.due_date && new Date(b.due_date) < new Date();
              return (
                <tr key={`${b.lab_id}-${b.id}`} className="border-t border-[#E2E8F0]" data-testid={`borrowed-${b.id}`}>
                  <td className="py-3 px-5 font-medium">{b.equipment_name}</td>
                  <td className="py-3 px-5 text-[#64748B]">{b.lab_name}</td>
                  <td className="py-3 px-5 text-right font-mono">{b.quantity}</td>
                  <td className="py-3 px-5 text-[#64748B] max-w-xs truncate">{b.purpose || "—"}</td>
                  <td className="py-3 px-5"><StatusBadge status={b.status} /></td>
                  <td className={`py-3 px-5 text-xs ${overdue ? "text-[#EF4444] font-bold" : "text-[#64748B]"}`}>
                    {b.due_date ? new Date(b.due_date).toLocaleDateString() : "—"}{overdue && " (overdue)"}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={6} className="py-10"><EmptyState title="Nothing borrowed yet" hint="Browse labs to request equipment." /></td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
