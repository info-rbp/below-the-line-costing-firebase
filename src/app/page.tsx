import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1>Below the Line Costing</h1>
        <p>
          Use the wizard to create a project, capture milestones, labour, materials, and payment plans. You can review
          saved projects from the detail page.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
          <Link className="button-primary" href="/wizard">
            Launch wizard
          </Link>
        </div>
      </div>
      <div className="card">
        <h2>Existing project</h2>
        <p>
          Already have a project ID? Paste it in the URL like <code>/projects/&lt;projectId&gt;</code> to view details and
          manage lookups.
        </p>
      </div>
    </main>
  );
}
