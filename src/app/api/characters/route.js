import { NextResponse } from "next/server";
import { readCharacterHistory } from "@/lib/character-history";

export const runtime = "nodejs";

export async function GET() {
  const characters = await readCharacterHistory();

  return NextResponse.json({
    characters: characters.map((item, index) => ({
      ...item,
      rank: index + 1,
    })),
    total: characters.length,
    source: "history",
  });
}
