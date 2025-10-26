"use client";

import { useParams } from "next/navigation";
import { LookupsPage } from "@/features/admin/lookups/LookupsPage";

export default function LookupsAdminPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;

  if (!projectId) {
    return (
      <main className="container">
        <div className="card">
          <p>Missing project context.</p>
        </div>
      </main>
    );
  }

  return <LookupsPage projectId={projectId} />;
}
