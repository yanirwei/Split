import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.type === "event") {
    const { variationId, visitorId, eventType, metadata, sessionDuration } = body;

    // Create event
    await prisma.event.create({
      data: {
        variationId,
        visitorId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sessionDuration,
      },
    });

    // Update variation counters
    if (eventType === "page_view") {
      await prisma.variation.update({
        where: { id: variationId },
        data: { views: { increment: 1 } },
      });
    } else if (eventType === "install_click") {
      await prisma.variation.update({
        where: { id: variationId },
        data: { installs: { increment: 1 } },
      });

      // Update or create visitor record
      const isDecisive = sessionDuration !== undefined && sessionDuration <= 7;
      const variation = await prisma.variation.findUnique({
        where: { id: variationId },
      });

      if (variation) {
        await prisma.visitor.upsert({
          where: { visitorToken: visitorId },
          update: {
            isInstaller: true,
            isDecisive,
            timeOnPage: sessionDuration,
          },
          create: {
            visitorToken: visitorId,
            experimentId: variation.experimentId,
            variationId,
            isInstaller: true,
            isDecisive,
            timeOnPage: sessionDuration,
            userAgent: request.headers.get("user-agent") || undefined,
            referrer: request.headers.get("referer") || undefined,
          },
        });
      }
    } else if (eventType === "page_view") {
      // Also create/update visitor for page views
      const variation = await prisma.variation.findUnique({
        where: { id: variationId },
      });
      if (variation) {
        await prisma.visitor.upsert({
          where: { visitorToken: visitorId },
          update: {},
          create: {
            visitorToken: visitorId,
            experimentId: variation.experimentId,
            variationId,
            userAgent: request.headers.get("user-agent") || undefined,
            referrer: request.headers.get("referer") || undefined,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  if (body.type === "heatmap") {
    const { variationId, visitorId, x, y, elementType } = body;

    await prisma.heatmapPoint.create({
      data: {
        variationId,
        visitorId,
        x,
        y,
        elementType,
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
}
