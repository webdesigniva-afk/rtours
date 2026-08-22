import { NextResponse, type NextRequest } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

export async function POST(request: NextRequest) {
  let payload: { email?: unknown; source?: unknown };

  try {
    payload = (await request.json()) as { email?: unknown; source?: unknown };
  } catch {
    return NextResponse.json({ message: "Невалидна заявка." }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const source = typeof payload.source === "string" && payload.source.trim() ? payload.source.trim().slice(0, 80) : "website";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ message: "Моля, въведете валиден имейл адрес." }, { status: 400 });
  }

  try {
    await dbQuery(
      `
        insert into newsletter_subscribers (email, source, status, created_at, updated_at)
        values ($1, $2, 'active', now(), now())
        on conflict (email)
        do update set
          status = 'active',
          source = excluded.source,
          updated_at = now()
      `,
      [email, source]
    );
  } catch (error) {
    if (getErrorCode(error) === "42P01") {
      return NextResponse.json(
        { message: "Newsletter таблицата още не е създадена. Формата е готова за свързване." },
        { status: 503 }
      );
    }

    console.error("Newsletter subscription failed", error);
    return NextResponse.json({ message: "Не успяхме да запишем абонамента. Опитайте отново." }, { status: 500 });
  }

  return NextResponse.json({ message: "Благодарим! Абонаментът е записан." });
}
