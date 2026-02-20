import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/variations/:id - Get variation with experiment and app data
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const variation = await prisma.variation.findUnique({
    where: { id: params.id },
    include: {
      experiment: {
        include: {
          app: true,
        },
      },
    },
  });

  if (!variation) {
    return NextResponse.json({ error: "Variation not found" }, { status: 404 });
  }

  return NextResponse.json(variation);
}

// PATCH /api/variations/:id - Update variation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const variation = await prisma.variation.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription }),
      ...(body.iconUrl !== undefined && { iconUrl: body.iconUrl }),
      ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
      ...(body.screenshotUrls !== undefined && {
        screenshotUrls: JSON.stringify(body.screenshotUrls),
      }),
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.reviewCount !== undefined && { reviewCount: body.reviewCount }),
      ...(body.appSize !== undefined && { appSize: body.appSize }),
    },
  });

  return NextResponse.json(variation);
}
