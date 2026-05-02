import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RequireAuth, roleHome } from "@/lib/route-guards";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLabs from "@/pages/admin/AdminLabs";
import AdminUsers from "@/pages/admin/AdminUsers";
import Analytics from "@/pages/admin/Analytics";
import AssistantDashboard from "@/pages/assistant/AssistantDashboard";
import AssistantEquipment from "@/pages/assistant/AssistantEquipment";
import AssistantRequests from "@/pages/assistant/AssistantRequests";
import AssistantMaintenance from "@/pages/assistant/AssistantMaintenance";
import AssistantLabs from "@/pages/assistant/AssistantLabs";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentLabs from "@/pages/student/StudentLabs";
import StudentLabDetail from "@/pages/student/StudentLabDetail";
import StudentBorrowed from "@/pages/student/StudentBorrowed";
import Landing from "@/pages/Landing";

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-[#64748B]">Loading…</div>;
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  return <Landing />;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<RootRedirect />} />

            <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><AdminDashboard /></RequireAuth>} />
            <Route path="/admin/labs" element={<RequireAuth roles={["ADMIN"]}><AdminLabs /></RequireAuth>} />
            <Route path="/admin/users" element={<RequireAuth roles={["ADMIN"]}><AdminUsers /></RequireAuth>} />
            <Route path="/admin/analytics" element={<RequireAuth roles={["ADMIN"]}><Analytics /></RequireAuth>} />

            <Route path="/assistant" element={<RequireAuth roles={["ASSISTANT"]}><AssistantLabs /></RequireAuth>} />
            <Route path="/assistant/labs" element={<RequireAuth roles={["ASSISTANT"]}><AssistantLabs /></RequireAuth>} />
            <Route path="/assistant/labs/:id" element={<RequireAuth roles={["ASSISTANT"]}><AssistantDashboard /></RequireAuth>} />
            <Route path="/assistant/labs/:id/equipment" element={<RequireAuth roles={["ASSISTANT"]}><AssistantEquipment /></RequireAuth>} />
            <Route path="/assistant/labs/:id/requests" element={<RequireAuth roles={["ASSISTANT"]}><AssistantRequests /></RequireAuth>} />
            <Route path="/assistant/labs/:id/maintenance" element={<RequireAuth roles={["ASSISTANT"]}><AssistantMaintenance /></RequireAuth>} />

            <Route path="/student" element={<RequireAuth roles={["STUDENT"]}><StudentDashboard /></RequireAuth>} />
            <Route path="/student/labs" element={<RequireAuth roles={["STUDENT"]}><StudentLabs /></RequireAuth>} />
            <Route path="/student/labs/:id" element={<RequireAuth roles={["STUDENT"]}><StudentLabDetail /></RequireAuth>} />
            <Route path="/student/borrowed" element={<RequireAuth roles={["STUDENT"]}><StudentBorrowed /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
