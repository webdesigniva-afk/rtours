import { AdminComingSoon } from "@/components/AdminComingSoon";

type AdminComingSoonPageProps = {
  searchParams?: Promise<{ section?: string }>;
};

export default async function AdminComingSoonPage({ searchParams }: AdminComingSoonPageProps) {
  const params = (await searchParams) ?? {};

  return <AdminComingSoon section={params.section} />;
}
