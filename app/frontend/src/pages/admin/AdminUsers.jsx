import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import { PageHeader, Badge } from "@/components/ui-kit";
import { UserPlus } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "" });
  const [err, setErr] = useState("");

  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api.post("/admin/create-assistant", form);
      setShow(false); setForm({ name: "", email: "", password: "", department: "" }); load();
    } catch (e) { setErr(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <Layout>
      <PageHeader
        title="Users & Assistants"
        subtitle="Manage students and create new lab assistant accounts"
        action={<button data-testid="create-assistant-btn" onClick={() => setShow((v) => !v)} className="crce-btn-primary"><UserPlus size={16} />New Assistant</button>}
      />

      {show && (
        <form onSubmit={submit} className="crce-card p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 crce-fade-up">
          <div><label className="crce-label">Full Name</label><input data-testid="asst-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Email</label><input data-testid="asst-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Password</label><input data-testid="asst-password" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="crce-input" /></div>
          <div><label className="crce-label">Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="crce-input" /></div>
          {err && <div className="md:col-span-2 text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShow(false)} className="crce-btn-secondary">Cancel</button>
            <button data-testid="asst-submit" type="submit" className="crce-btn-primary">Create Assistant</button>
          </div>
        </form>
      )}

      <div className="crce-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-left text-[#64748B]">
              <th className="py-3 px-5">Name</th>
              <th className="py-3 px-5">Email</th>
              <th className="py-3 px-5">Role</th>
              <th className="py-3 px-5">Department</th>
              <th className="py-3 px-5">Roll No</th>
              <th className="py-3 px-5">Year</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#E2E8F0]" data-testid={`user-row-${u.id}`}>
                <td className="py-3 px-5 font-medium">{u.name}</td>
                <td className="py-3 px-5 text-[#64748B]">{u.email}</td>
                <td className="py-3 px-5"><Badge tone={u.role === "ADMIN" ? "blue" : u.role === "ASSISTANT" ? "green" : "amber"}>{u.role}</Badge></td>
                <td className="py-3 px-5">{u.department || "—"}</td>
                <td className="py-3 px-5">{u.roll_no || "—"}</td>
                <td className="py-3 px-5">{u.year || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
