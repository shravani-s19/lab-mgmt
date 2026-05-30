import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState, Badge } from "@/components/ui-kit";
import { Search, MapPin, Users as UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentLabs() {
  const [labs, setLabs] = useState([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");

  useEffect(() => { api.get("/labs").then((r) => setLabs(r.data)); }, []);

  const departments = useMemo(() => Array.from(new Set(labs.map((l) => l.department).filter(Boolean))), [labs]);

  const filtered = labs.filter((l) =>
    (!q || l.name.toLowerCase().includes(q.toLowerCase()) || l.location.toLowerCase().includes(q.toLowerCase())) &&
    (!dept || l.department === dept)
  );

  return (
    <Layout>
      <PageHeader title="Browse Labs" subtitle="Find labs across departments and view available equipment" />
      <div className="crce-card p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input data-testid="lab-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search labs by name or location" className="crce-input !pl-10" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="crce-input md:w-60">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((lab) => (
          <Link to={`/student/labs/${lab.id}`} key={lab.id} className="crce-card p-6 block" data-testid={`student-lab-${lab.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display font-bold text-lg">{lab.name}</div>
                <Badge tone="blue">{lab.department || "General"}</Badge>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#64748B]">
              <div className="flex items-center gap-2"><MapPin size={14} /> {lab.location}</div>
              <div className="flex items-center gap-2"><UsersIcon size={14} /> Capacity {lab.capacity}</div>
            </div>
            <div className="mt-4 text-xs text-[#94A3B8]">Assistant: {lab.assistant_name || "Unassigned"}</div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="md:col-span-3"><EmptyState title="No labs found" hint="Try a different search or filter." /></div>}
      </div>
    </Layout>
  );
}
