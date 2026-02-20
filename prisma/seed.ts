import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.heatmapPoint.deleteMany();
  await prisma.event.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.variation.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.app.deleteMany();

  // ===== EXPERIMENT 1: iOS Icon Test =====
  const app1 = await prisma.app.create({
    data: {
      name: "FitTracker Pro",
      developer: "HealthApps Inc.",
      storeType: "ios",
      category: "Health & Fitness",
      rating: 4.7,
      reviewCount: 12500,
      appSize: "85 MB",
    },
  });

  const exp1 = await prisma.experiment.create({
    data: {
      name: "Icon A/B Test - Gradient vs Flat",
      description:
        "Testing whether a gradient icon or flat design icon drives more installs on iOS App Store",
      appId: app1.id,
      status: "running",
      testingElement: "icon",
      trafficSplit: "50/50",
      fbPixelId: "1234567890",
      targetSampleSize: 2000,
      confidenceLevel: 95.0,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  const control1 = await prisma.variation.create({
    data: {
      name: "Control (Current Icon)",
      isControl: true,
      experimentId: exp1.id,
      title: "FitTracker Pro",
      subtitle: "Your Personal Fitness Coach",
      description:
        "FitTracker Pro is the ultimate fitness companion. Track workouts, monitor progress, and achieve your health goals with personalized plans. Features include calorie tracking, exercise library with 500+ exercises, progress photos, and integration with Apple Health.",
      views: 1847,
      installs: 203,
    },
  });

  const variantA1 = await prisma.variation.create({
    data: {
      name: "Variant A (Gradient Icon)",
      isControl: false,
      experimentId: exp1.id,
      title: "FitTracker Pro",
      subtitle: "Your Personal Fitness Coach",
      description:
        "FitTracker Pro is the ultimate fitness companion. Track workouts, monitor progress, and achieve your health goals with personalized plans. Features include calorie tracking, exercise library with 500+ exercises, progress photos, and integration with Apple Health.",
      views: 1823,
      installs: 247,
    },
  });

  // Generate visitors and events for Experiment 1
  const variations1 = [
    { variation: control1, views: 1847, installs: 203 },
    { variation: variantA1, views: 1823, installs: 247 },
  ];

  for (const { variation, views, installs } of variations1) {
    // Create installer visitors
    for (let i = 0; i < installs; i++) {
      const timeOnPage = Math.random() < 0.4 ? Math.random() * 7 : 7 + Math.random() * 53;
      const visitorToken = `visitor-${variation.id}-install-${i}`;
      await prisma.visitor.create({
        data: {
          visitorToken,
          experimentId: exp1.id,
          variationId: variation.id,
          isInstaller: true,
          isDecisive: timeOnPage <= 7,
          timeOnPage,
          device: Math.random() < 0.7 ? "mobile" : "desktop",
          referrer: Math.random() < 0.6 ? "facebook.com" : "google.com",
        },
      });

      // Page view event
      await prisma.event.create({
        data: {
          variationId: variation.id,
          visitorId: visitorToken,
          eventType: "page_view",
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
        },
      });

      // Install click event
      await prisma.event.create({
        data: {
          variationId: variation.id,
          visitorId: visitorToken,
          eventType: "install_click",
          sessionDuration: timeOnPage,
          metadata: JSON.stringify({ sessionDuration: timeOnPage }),
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
        },
      });

      // Pixel fire event
      await prisma.event.create({
        data: {
          variationId: variation.id,
          visitorId: visitorToken,
          eventType: "pixel_fire",
          sessionDuration: timeOnPage,
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
        },
      });
    }

    // Create non-installer visitors (droppers)
    const droppers = views - installs;
    for (let i = 0; i < Math.min(droppers, 300); i++) {
      const timeOnPage = Math.random() < 0.35 ? Math.random() * 7 : 7 + Math.random() * 30;
      const visitorToken = `visitor-${variation.id}-drop-${i}`;
      await prisma.visitor.create({
        data: {
          visitorToken,
          experimentId: exp1.id,
          variationId: variation.id,
          isInstaller: false,
          isDecisive: timeOnPage <= 7,
          timeOnPage,
          device: Math.random() < 0.7 ? "mobile" : "desktop",
        },
      });

      await prisma.event.create({
        data: {
          variationId: variation.id,
          visitorId: visitorToken,
          eventType: "page_view",
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
        },
      });
    }

    // Gallery scroll events
    for (let i = 0; i < Math.floor(views * 0.45); i++) {
      await prisma.event.create({
        data: {
          variationId: variation.id,
          visitorId: `visitor-${variation.id}-scroll-${i}`,
          eventType: "gallery_scroll",
          metadata: JSON.stringify({ scrollPercent: Math.round(Math.random() * 100) }),
          sessionDuration: 3 + Math.random() * 20,
        },
      });
    }

    // Page scroll events
    for (let i = 0; i < Math.floor(views * 0.6); i++) {
      await prisma.event.create({
        data: {
          variationId: variation.id,
          visitorId: `visitor-${variation.id}-pscroll-${i}`,
          eventType: "page_scroll",
          metadata: JSON.stringify({ scrollPercent: Math.round(Math.random() * 100) }),
        },
      });
    }

    // Heatmap data - simulate clicks on different elements
    const elements = [
      { type: "get-button", xRange: [60, 90], yRange: [12, 18], weight: 35 },
      { type: "icon", xRange: [5, 30], yRange: [5, 15], weight: 20 },
      { type: "gallery", xRange: [5, 95], yRange: [30, 60], weight: 25 },
      { type: "rating", xRange: [5, 40], yRange: [20, 25], weight: 10 },
      { type: "description", xRange: [5, 95], yRange: [65, 80], weight: 5 },
      { type: "reviews-section", xRange: [5, 95], yRange: [80, 95], weight: 5 },
    ];

    let pointCount = 0;
    for (const el of elements) {
      const count = Math.floor((views * 0.3 * el.weight) / 100);
      for (let i = 0; i < count; i++) {
        await prisma.heatmapPoint.create({
          data: {
            variationId: variation.id,
            visitorId: `hm-${variation.id}-${pointCount++}`,
            x: el.xRange[0] + Math.random() * (el.xRange[1] - el.xRange[0]),
            y: el.yRange[0] + Math.random() * (el.yRange[1] - el.yRange[0]),
            elementType: el.type,
          },
        });
      }
    }
  }

  // ===== EXPERIMENT 2: Android Screenshots Test =====
  const app2 = await prisma.app.create({
    data: {
      name: "BudgetWise",
      developer: "FinTech Solutions",
      storeType: "android",
      category: "Finance",
      rating: 4.3,
      reviewCount: 8200,
      appSize: "42 MB",
    },
  });

  const exp2 = await prisma.experiment.create({
    data: {
      name: "Screenshot Style - Lifestyle vs Feature",
      description:
        "Testing lifestyle screenshots vs feature-focused screenshots on Google Play",
      appId: app2.id,
      status: "running",
      testingElement: "screenshots",
      trafficSplit: "50/50",
      targetSampleSize: 1500,
      confidenceLevel: 95.0,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.variation.create({
    data: {
      name: "Control (Feature Screenshots)",
      isControl: true,
      experimentId: exp2.id,
      title: "BudgetWise - Money Manager",
      shortDescription: "Track expenses and save money effortlessly",
      description:
        "BudgetWise helps you take control of your finances. Set budgets, track spending, and reach your savings goals. Features automatic categorization, bill reminders, and beautiful reports.",
      views: 956,
      installs: 82,
    },
  });

  await prisma.variation.create({
    data: {
      name: "Variant A (Lifestyle Screenshots)",
      isControl: false,
      experimentId: exp2.id,
      title: "BudgetWise - Money Manager",
      shortDescription: "Track expenses and save money effortlessly",
      description:
        "BudgetWise helps you take control of your finances. Set budgets, track spending, and reach your savings goals. Features automatic categorization, bill reminders, and beautiful reports.",
      views: 943,
      installs: 104,
    },
  });

  // ===== EXPERIMENT 3: Completed test =====
  const app3 = await prisma.app.create({
    data: {
      name: "MindfulMe",
      developer: "Wellness Labs",
      storeType: "ios",
      category: "Health & Fitness",
      rating: 4.8,
      reviewCount: 25000,
      appSize: "120 MB",
    },
  });

  await prisma.experiment.create({
    data: {
      name: "Video vs Static First Impression",
      description:
        "Completed test: Does an autoplay video or static screenshots drive more installs?",
      appId: app3.id,
      status: "completed",
      testingElement: "video",
      trafficSplit: "50/50",
      targetSampleSize: 3000,
      confidenceLevel: 95.0,
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      variations: {
        create: [
          {
            name: "Control (Static Screenshots)",
            isControl: true,
            title: "MindfulMe - Meditation & Sleep",
            subtitle: "Calm your mind, improve your sleep",
            views: 3120,
            installs: 312,
          },
          {
            name: "Variant A (Autoplay Video)",
            isControl: false,
            title: "MindfulMe - Meditation & Sleep",
            subtitle: "Calm your mind, improve your sleep",
            views: 3089,
            installs: 401,
          },
        ],
      },
    },
  });

  console.log("Seed complete!");
  console.log("Created 3 experiments:");
  console.log("  1. FitTracker Pro - Icon A/B Test (running, with full analytics data)");
  console.log("  2. BudgetWise - Screenshot Style Test (running)");
  console.log("  3. MindfulMe - Video vs Static (completed)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
