import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const RequireAuth = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-[#64748B]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export const roleHome = (role) => {
  if (role === "ADMIN") return "/admin";
  if (role === "ASSISTANT") return "/assistant";
  return "/student";
};
