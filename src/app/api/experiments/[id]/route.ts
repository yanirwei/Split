import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/experiments/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const experiment = await prisma.experiment.findUnique({
    where: { id: params.id },
    include: {
      app: true,
      variations: {
        include: {
          events: {
            orderBy: { timestamp: "desc" },
          },
          heatmapData: true,
        },
      },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  return NextResponse.json(experiment);
}

// PATCH /api/experiments/:id - Update experiment (e.g., start/pause/stop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const experiment = await prisma.experiment.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.status === "running" && { startDate: new Date() }),
      ...(body.status === "completed" && { endDate: new Date() }),
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.fbPixelId !== undefined && { fbPixelId: body.fbPixelId }),
    },
    include: {
      app: true,
      variations: true,
    },
  });

  return NextResponse.json(experiment);
}

// DELETE /api/experiments/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.experiment.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
}
