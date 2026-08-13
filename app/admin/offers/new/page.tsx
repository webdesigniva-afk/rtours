import { redirect } from "next/navigation";
import { createBlankAdminOffer } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const offerId = await createBlankAdminOffer();
  redirect(`/admin/offers/${offerId}?tab=offer&new=1`);
}
