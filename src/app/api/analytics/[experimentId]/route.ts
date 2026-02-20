import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateConversionRate,
  calculateConfidenceInterval,
  calculateSignificance,
  calculateLift,
} from "@/lib/statistics";

export async function GET(
  _request: NextRequest,
  { params }: { params: { experimentId: string } }
) {
  const experiment = await prisma.experiment.findUnique({
    where: { id: params.experimentId },
    include: {
      app: true,
      variations: {
        include: {
          heatmapData: true,
        },
      },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  // Get visitor behavior data per variation
  const variationAnalytics = await Promise.all(
    experiment.variations.map(async (variation) => {
      // Get all visitors for this variation
      const visitors = await prisma.visitor.findMany({
        where: { variationId: variation.id },
      });

      const installers = visitors.filter((v) => v.isInstaller);
      const decisiveInstallers = installers.filter((v) => v.isDecisive === true);
      const exploratoryInstallers = installers.filter((v) => v.isDecisive === false);

      // Droppers - saw the page but didn't install
      const droppers = visitors.filter((v) => !v.isInstaller);
      const decisiveDroppers = droppers.filter(
        (v) => v.timeOnPage !== null && v.timeOnPage <= 7
      );
      const exploratoryDroppers = droppers.filter(
        (v) => v.timeOnPage !== null && v.timeOnPage > 7
      );

      // Get events for behavioral analysis
      const events = await prisma.event.findMany({
        where: { variationId: variation.id },
      });

      const galleryScrollEvents = events.filter(
        (e) => e.eventType === "gallery_scroll"
      );
      const pageScrollEvents = events.filter(
        (e) => e.eventType === "page_scroll"
      );
      const videoPlayEvents = events.filter(
        (e) => e.eventType === "video_play"
      );
      const videoPauseEvents = events.filter(
        (e) => e.eventType === "video_pause"
      );

      // Calculate average video watch time
      const avgVideoWatchTime =
        videoPauseEvents.length > 0
          ? videoPauseEvents.reduce((sum, e) => {
              const meta = e.metadata ? JSON.parse(e.metadata) : {};
              return sum + (meta.watchedSeconds || 0);
            }, 0) / videoPauseEvents.length
          : 0;

      // Calculate average time on page
      const avgTimeOnPage =
        visitors.length > 0
          ? visitors.reduce((sum, v) => sum + (v.timeOnPage || 0), 0) /
            visitors.filter((v) => v.timeOnPage !== null).length || 0
          : 0;

      const conversionRate = calculateConversionRate(
        variation.installs,
        variation.views
      );
      const confidenceInterval = calculateConfidenceInterval(
        variation.installs,
        variation.views,
        (experiment.confidenceLevel || 95) / 100
      );

      return {
        variationId: variation.id,
        variationName: variation.name,
        isControl: variation.isControl,
        views: variation.views,
        installs: variation.installs,
        conversionRate,
        confidenceInterval,
        visitors: visitors.length,
        installers: installers.length,
        decisiveInstallers: decisiveInstallers.length,
        exploratoryInstallers: exploratoryInstallers.length,
        droppers: droppers.length,
        decisiveDroppers: decisiveDroppers.length,
        exploratoryDroppers: exploratoryDroppers.length,
        avgTimeOnPage,
        galleryScrollEvents: galleryScrollEvents.length,
        pageScrollEvents: pageScrollEvents.length,
        videoPlays: videoPlayEvents.length,
        avgVideoWatchTime,
        heatmapPoints: variation.heatmapData.map((p) => ({
          x: p.x,
          y: p.y,
          elementType: p.elementType,
        })),
      };
    })
  );

  // Calculate significance between control and variants
  const control = variationAnalytics.find((v) => v.isControl);
  const comparisons = variationAnalytics
    .filter((v) => !v.isControl)
    .map((variant) => {
      if (!control) return { ...variant, significance: null, lift: 0 };
      const significance = calculateSignificance(
        control.installs,
        control.views,
        variant.installs,
        variant.views
      );
      const lift = calculateLift(control.conversionRate, variant.conversionRate);
      return { ...variant, significance, lift };
    });

  return NextResponse.json({
    experiment: {
      id: experiment.id,
      name: experiment.name,
      status: experiment.status,
      testingElement: experiment.testingElement,
      confidenceLevel: experiment.confidenceLevel,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      app: experiment.app,
    },
    control: control
      ? { ...control, significance: null, lift: 0 }
      : null,
    variants: comparisons,
    totalViews: variationAnalytics.reduce((s, v) => s + v.views, 0),
    totalInstalls: variationAnalytics.reduce((s, v) => s + v.installs, 0),
    overallConversionRate: calculateConversionRate(
      variationAnalytics.reduce((s, v) => s + v.installs, 0),
      variationAnalytics.reduce((s, v) => s + v.views, 0)
    ),
  });
}
