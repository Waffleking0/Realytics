/**
 * /api/deals — CRUD for server-side saved deals (authenticated users).
 * GET    → list all deals for the session user
 * POST   → save a deal
 * DELETE → remove a deal by id
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

// GET /api/deals
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deals = await prisma.savedDeal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, label: true, propertyType: true,
      inputs: true, results: true, dealScore: true, createdAt: true,
    },
  });

  return NextResponse.json({ deals });
}

// POST /api/deals
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { label, propertyType, inputs, results } = body;

  if (!label || !propertyType || !inputs || !results) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const dealScore = (results as any)?.dealScore?.score ?? null;

  const deal = await prisma.savedDeal.create({
    data: { userId, label, propertyType, inputs, results, dealScore },
  });

  return NextResponse.json({ success: true, deal });
}

// DELETE /api/deals?id=<dealId>
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing deal id." }, { status: 400 });

  // Ensure deal belongs to the user before deleting
  const deal = await prisma.savedDeal.findFirst({ where: { id, userId } });
  if (!deal) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.savedDeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
