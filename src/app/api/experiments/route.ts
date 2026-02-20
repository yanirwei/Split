import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/experiments - List all experiments
export async function GET() {
  const experiments = await prisma.experiment.findMany({
    include: {
      app: true,
      variations: {
        select: {
          id: true,
          name: true,
          isControl: true,
          views: true,
          installs: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(experiments);
}

// POST /api/experiments - Create a new experiment
export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    name,
    description,
    testingElement,
    trafficSplit,
    fbPixelId,
    targetSampleSize,
    confidenceLevel,
    // App fields
    appName,
    developer,
    storeType,
    category,
    rating,
    reviewCount,
    appSize,
    // Variations
    variations,
  } = body;

  // Create app first
  const app = await prisma.app.create({
    data: {
      name: appName,
      developer,
      storeType,
      category,
      rating: rating || 4.5,
      reviewCount: reviewCount || 0,
      appSize,
    },
  });

  // Create experiment with variations
  const experiment = await prisma.experiment.create({
    data: {
      name,
      description,
      appId: app.id,
      testingElement,
      trafficSplit: trafficSplit || "50/50",
      fbPixelId,
      targetSampleSize: targetSampleSize || 1000,
      confidenceLevel: confidenceLevel || 95.0,
      variations: {
        create: variations.map(
          (
            v: {
              name: string;
              isControl: boolean;
              title?: string;
              subtitle?: string;
              description?: string;
              shortDescription?: string;
              iconUrl?: string;
              videoUrl?: string;
              screenshotUrls?: string[];
              rating?: number;
              reviewCount?: number;
              appSize?: string;
            },
            idx: number
          ) => ({
            name: v.name || (idx === 0 ? "Control" : `Variant ${String.fromCharCode(65 + idx - 1)}`),
            isControl: v.isControl ?? idx === 0,
            title: v.title || appName,
            subtitle: v.subtitle,
            description: v.description,
            shortDescription: v.shortDescription,
            iconUrl: v.iconUrl,
            videoUrl: v.videoUrl,
            screenshotUrls: v.screenshotUrls ? JSON.stringify(v.screenshotUrls) : undefined,
            rating: v.rating,
            reviewCount: v.reviewCount,
            appSize: v.appSize,
          })
        ),
      },
    },
    include: {
      app: true,
      variations: true,
    },
  });

  return NextResponse.json(experiment, { status: 201 });
}
