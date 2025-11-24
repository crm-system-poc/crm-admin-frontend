import ProtectedRoute from "@/components/ProtectedPage";
import LeadsPage from "./LeadsPage";

export default function LeadsProtected() {
  return (
    <ProtectedRoute module="manageLeads" action="read">
      <LeadsPage />
    </ProtectedRoute>
  );
}
