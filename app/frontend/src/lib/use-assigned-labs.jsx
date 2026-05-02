import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const useAssignedLabs = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  useEffect(() => {
    if (!user) return;
    api.get("/labs").then((r) => {
      const found = r.data.filter((l) => l.assistant_id === user.id);
      setLabs(found);
    });
  }, [user]);
  return labs;
};