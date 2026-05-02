import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "react-router-dom";

export const useAssignedLab = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [lab, setLab] = useState(null);
  useEffect(() => {
    if (!user) return;
    api.get("/labs").then((r) => {
      const found = id
        ? r.data.find((l) => l.id === Number(id))
        : r.data.find((l) => l.assistant_id === user.id);
      setLab(found || null);
    });
  }, [user, id]);
  return lab;
};