"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import IOSStorePage from "@/components/store/IOSStorePage";
import AndroidStorePage from "@/components/store/AndroidStorePage";

interface VariationData {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  iconUrl?: string;
  videoUrl?: string;
  screenshotUrls?: string;
  rating?: number;
  reviewCount?: number;
  appSize?: string;
  experiment: {
    id: string;
    fbPixelId?: string;
    app: {
      name: string;
      developer: string;
      storeType: string;
      category?: string;
      rating?: number;
      reviewCount?: number;
      appSize?: string;
    };
  };
}

export default function PreviewPage() {
  const params = useParams();
  const variationId = params.variationId as string;
  const [variation, setVariation] = useState<VariationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/variations/${variationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Variation not found");
        return res.json();
      })
      .then(setVariation)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [variationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !variation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{error || "Not found"}</p>
      </div>
    );
  }

  const app = variation.experiment.app;
  const screenshots = variation.screenshotUrls
    ? JSON.parse(variation.screenshotUrls)
    : [];

  if (app.storeType === "ios") {
    return (
      <IOSStorePage
        variationId={variation.id}
        title={variation.title || app.name}
        subtitle={variation.subtitle}
        developer={app.developer}
        iconUrl={variation.iconUrl}
        rating={variation.rating || app.rating || 4.5}
        reviewCount={variation.reviewCount || app.reviewCount || 0}
        appSize={variation.appSize || app.appSize}
        screenshotUrls={screenshots}
        videoUrl={variation.videoUrl}
        description={variation.description}
        category={app.category}
        fbPixelId={variation.experiment.fbPixelId || undefined}
      />
    );
  }

  return (
    <AndroidStorePage
      variationId={variation.id}
      title={variation.title || app.name}
      developer={app.developer}
      iconUrl={variation.iconUrl}
      rating={variation.rating || app.rating || 4.5}
      reviewCount={variation.reviewCount || app.reviewCount || 0}
      appSize={variation.appSize || app.appSize}
      screenshotUrls={screenshots}
      shortDescription={variation.shortDescription}
      description={variation.description}
      category={app.category}
      fbPixelId={variation.experiment.fbPixelId || undefined}
    />
  );
}
