import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui-kit";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#64748B"];

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/analytics").then((r) => setData(r.data)); }, []);

  const barData = (data?.per_lab || []).map((l) => ({
    name: l.lab_name, Budget: l.budget, Spend: Math.round(l.spend),
  }));
  const issuedData = (data?.per_lab || []).map((l) => ({
    name: l.lab_name, Issued: l.issued_units, Available: l.total_units - l.issued_units,
  }));
  const userPie = data ? Object.entries(data.users).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <Layout>
      <PageHeader title="Analytics" subtitle="Budget allocation, equipment utilization & user breakdown" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="crce-card p-6">
          <div className="font-display font-bold mb-3">Budget vs Spend (per Lab)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Budget" fill="#2563EB" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Spend" fill="#22C55E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="crce-card p-6">
          <div className="font-display font-bold mb-3">Equipment Utilization</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={issuedData} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Issued" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Available" stackId="a" fill="#22C55E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="crce-card p-6">
          <div className="font-display font-bold mb-3">User Roles</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={userPie} dataKey="value" nameKey="name" outerRadius={100} label>
                {userPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="crce-card p-6">
          <div className="font-display font-bold mb-3">Totals</div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-[#E2E8F0] py-2"><span>Labs</span><span className="font-bold">{data?.totals.labs}</span></li>
            <li className="flex justify-between border-b border-[#E2E8F0] py-2"><span>Equipment Units</span><span className="font-bold">{data?.totals.equipment_units}</span></li>
            <li className="flex justify-between border-b border-[#E2E8F0] py-2"><span>Issued</span><span className="font-bold">{data?.totals.issued_units}</span></li>
            <li className="flex justify-between py-2"><span>Pending Requests</span><span className="font-bold">{data?.totals.pending_requests}</span></li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
