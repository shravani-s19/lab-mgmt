import { useAssignedLabs } from "@/lib/use-assigned-labs";
import Layout from "@/components/Layout";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AssistantLabs() {
  const labs = useAssignedLabs();
  const navigate = useNavigate();
  const { user } = useAuth();

  const basePath = user?.role === "INCHARGE" ? "/incharge" : "/assistant";

  return (
    <Layout>
      <PageHeader title="My Labs" subtitle="All labs assigned to you" />
      {labs.length === 0 ? (
        <EmptyState title="No labs assigned" hint="Ask an admin to assign you to a lab." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="crce-card p-5 cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`${basePath}/labs/${lab.id}`)}            >
              <div className="font-display font-bold text-lg">{lab.name}</div>
              <div className="text-sm text-[#64748B] mt-1">{lab.location}</div>
              <div className="text-sm text-[#64748B]">{lab.department || "General"}</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}