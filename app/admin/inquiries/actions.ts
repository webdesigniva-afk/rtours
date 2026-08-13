"use server";

import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";

const allowedStatuses = new Set(["new", "contacted", "offer_sent", "option", "booked", "lost"]);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateInquiryStatus(formData: FormData) {
  const inquiryId = readString(formData, "inquiry_id");
  const status = readString(formData, "status");
  const note = readString(formData, "note");
  const lostReason = readString(formData, "lost_reason");

  if (!inquiryId || !allowedStatuses.has(status)) return;

  const current = await dbQuery<{ status: string }>("select status from inquiries where id = $1 limit 1", [inquiryId]);
  const previousStatus = current.rows[0]?.status ?? null;

  await dbQuery(
    `
      update inquiries
      set
        status = $1,
        lost_reason = case when $1 = 'lost' then nullif($3, '') else lost_reason end,
        last_contacted_at = case when $1 in ('contacted', 'offer_sent', 'option', 'booked') then now() else last_contacted_at end,
        status_updated_at = now()
      where id = $2
    `,
    [status, inquiryId, lostReason]
  );

  if (previousStatus !== status || note) {
    await dbQuery(
      "insert into inquiry_status_history (inquiry_id, previous_status, next_status, note) values ($1, $2, $3, nullif($4, ''))",
      [inquiryId, previousStatus, status, note]
    );
  }

  revalidatePath("/admin/inquiries");
}

export async function updateInquiryWork(formData: FormData) {
  const inquiryId = readString(formData, "inquiry_id");
  const assignedToName = readString(formData, "assigned_to_name");
  const nextActionAt = readString(formData, "next_action_at");
  const internalNote = readString(formData, "internal_note");

  if (!inquiryId) return;

  await dbQuery(
    `
      update inquiries
      set
        assigned_to_name = nullif($2, ''),
        next_action_at = nullif($3, '')::timestamptz,
        internal_note = nullif($4, '')
      where id = $1
    `,
    [inquiryId, assignedToName, nextActionAt, internalNote]
  );

  revalidatePath("/admin/inquiries");
}
