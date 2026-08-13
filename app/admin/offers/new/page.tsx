import { redirect } from "next/navigation";
import { createBlankAdminOffer } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const slug = await createBlankAdminOffer();
  redirect(`/admin/offers/${slug}?tab=offer&new=1`);
}
