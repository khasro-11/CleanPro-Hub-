import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDashboardKpis } from "@/lib/dashboard/queries";
import { apiSuccess, apiError } from "@/types/api";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Nicht angemeldet."), { status: 401 });
  }

  const kpis = await getDashboardKpis();
  return NextResponse.json(apiSuccess(kpis));
}
