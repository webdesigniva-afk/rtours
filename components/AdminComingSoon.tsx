import { AdminWorkspace } from "@/components/AdminWorkspace";

type AdminComingSoonProps = {
  section?: string;
};

export function AdminComingSoon({ section }: AdminComingSoonProps) {
  return (
    <AdminWorkspace active="coming-soon">
      <section className="admin-coming-soon" aria-label={section ? `${section} предстои разработване` : "Предстои разработване"}>
        <img src="/brand/logo.png" alt="RedTours" />
        <h1>{section || "Админ секция"}</h1>
        <p>Предстои разработване</p>
      </section>
    </AdminWorkspace>
  );
}
