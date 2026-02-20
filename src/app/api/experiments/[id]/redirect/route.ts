import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/experiments/:id/redirect - Redirect visitor to a random variation
// This is the link you share via ads/Facebook to split traffic
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const experiment = await prisma.experiment.findUnique({
    where: { id: params.id },
    include: { variations: true },
  });

  if (!experiment || experiment.variations.length === 0) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  // Parse traffic split (e.g., "50/50" or "33/33/34")
  const splits = experiment.trafficSplit.split("/").map(Number);
  const total = splits.reduce((a, b) => a + b, 0);

  // Weighted random selection
  const random = Math.random() * total;
  let cumulative = 0;
  let selectedIdx = 0;

  for (let i = 0; i < splits.length; i++) {
    cumulative += splits[i];
    if (random <= cumulative) {
      selectedIdx = i;
      break;
    }
  }

  // Ensure index is within bounds
  selectedIdx = Math.min(selectedIdx, experiment.variations.length - 1);
  const selectedVariation = experiment.variations[selectedIdx];

  // Get the base URL
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Redirect to the preview page for the selected variation
  return NextResponse.redirect(
    `${baseUrl}/preview/${selectedVariation.id}`
  );
}
