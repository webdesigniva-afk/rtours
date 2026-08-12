import { AdminOffersClient } from "./AdminOffersClient";
import { listAdminOfferItems } from "@/lib/adminOfferRepository";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const offers = await listAdminOfferItems().catch(() => []);

  return <AdminOffersClient initialOffers={offers} />;
}
