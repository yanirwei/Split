"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { trackEvent, trackHeatmapClick, getOrCreateVisitorId, initFacebookPixel, fireFacebookEvent } from "@/lib/tracking";

interface IOSStorePageProps {
  variationId: string;
  title: string;
  subtitle?: string;
  developer: string;
  iconUrl?: string;
  rating: number;
  reviewCount: number;
  appSize?: string;
  screenshotUrls?: string[];
  videoUrl?: string;
  description?: string;
  category?: string;
  fbPixelId?: string;
}

export default function IOSStorePage({
  variationId,
  title,
  subtitle,
  developer,
  iconUrl,
  rating,
  reviewCount,
  appSize,
  screenshotUrls = [],
  videoUrl,
  description,
  category,
  fbPixelId,
}: IOSStorePageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visitorId, setVisitorId] = useState("");
  const [pageLoadTime] = useState(Date.now());
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [videoWatchTime, setVideoWatchTime] = useState(0);

  useEffect(() => {
    const vid = getOrCreateVisitorId();
    setVisitorId(vid);

    // Init Facebook Pixel if provided
    if (fbPixelId) {
      initFacebookPixel(fbPixelId);
    }

    // Track page view
    trackEvent({
      variationId,
      visitorId: vid,
      eventType: "page_view",
    });
  }, [variationId, fbPixelId]);

  // Track page scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent % 25 === 0 && scrollPercent > 0) {
        trackEvent({
          variationId,
          visitorId,
          eventType: "page_scroll",
          metadata: { scrollPercent },
          sessionDuration: (Date.now() - pageLoadTime) / 1000,
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variationId, visitorId, pageLoadTime]);

  // Track video watch time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const interval = setInterval(() => {
      if (!video.paused) {
        setVideoWatchTime((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!pageRef.current) return;
      const rect = pageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const target = e.target as HTMLElement;
      trackHeatmapClick({
        variationId,
        visitorId,
        x,
        y,
        elementType: target.dataset.trackElement || target.tagName.toLowerCase(),
      });
    },
    [variationId, visitorId]
  );

  const handleInstallClick = () => {
    const sessionDuration = (Date.now() - pageLoadTime) / 1000;
    trackEvent({
      variationId,
      visitorId,
      eventType: "install_click",
      metadata: { sessionDuration },
      sessionDuration,
    });

    // Fire Facebook Pixel event
    if (fbPixelId) {
      fireFacebookEvent("Lead", { content_name: title, value: 1 });
    }

    // Track pixel fire
    trackEvent({
      variationId,
      visitorId,
      eventType: "pixel_fire",
      metadata: { sessionDuration, action: "install" },
      sessionDuration,
    });
  };

  const handleGalleryScroll = () => {
    if (!galleryRef.current) return;
    const scrollLeft = galleryRef.current.scrollLeft;
    const maxScroll = galleryRef.current.scrollWidth - galleryRef.current.clientWidth;
    const scrollPercent = maxScroll > 0 ? Math.round((scrollLeft / maxScroll) * 100) : 0;
    trackEvent({
      variationId,
      visitorId,
      eventType: "gallery_scroll",
      metadata: { scrollPercent },
      sessionDuration: (Date.now() - pageLoadTime) / 1000,
    });
  };

  const handleVideoPlay = () => {
    trackEvent({
      variationId,
      visitorId,
      eventType: "video_play",
      sessionDuration: (Date.now() - pageLoadTime) / 1000,
    });
  };

  const handleVideoPause = () => {
    trackEvent({
      variationId,
      visitorId,
      eventType: "video_pause",
      metadata: { watchedSeconds: videoWatchTime },
      sessionDuration: (Date.now() - pageLoadTime) / 1000,
    });
  };

  const renderStars = (r: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-4 h-4 ${i <= Math.round(r) ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div
      ref={pageRef}
      onClick={handleClick}
      className="max-w-[430px] mx-auto bg-white min-h-screen font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]"
    >
      {/* iOS Status Bar */}
      <div className="bg-white px-6 pt-3 pb-1 flex justify-between items-center text-sm font-semibold">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      {/* Header area */}
      <div className="px-5 py-4">
        <div className="flex gap-4">
          {/* App Icon */}
          <div
            data-track-element="icon"
            className="w-[120px] h-[120px] rounded-[26px] overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 shadow-lg"
          >
            {iconUrl ? (
              <img src={iconUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {title.charAt(0)}
              </div>
            )}
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight" data-track-element="title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5" data-track-element="subtitle">
                {subtitle}
              </p>
            )}
            <p className="text-sm text-store-blue mt-1" data-track-element="developer">
              {developer}
            </p>
            <button
              onClick={handleInstallClick}
              data-track-element="get-button"
              className="mt-3 bg-store-blue text-white font-bold text-base px-8 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
            >
              GET
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 py-3 border-t border-b border-gray-200">
        <div className="flex justify-between text-center">
          <div data-track-element="rating">
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-bold text-gray-700">{rating.toFixed(1)}</span>
              <div className="flex">{renderStars(rating)}</div>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{formatReviewCount(reviewCount)} Ratings</p>
          </div>
          {category && (
            <div className="border-l border-gray-200 px-4" data-track-element="category">
              <p className="text-lg font-bold text-gray-700">#{Math.floor(Math.random() * 20) + 1}</p>
              <p className="text-xs text-gray-500 mt-0.5">{category}</p>
            </div>
          )}
          <div className="border-l border-gray-200 px-4" data-track-element="age">
            <p className="text-lg font-bold text-gray-700">4+</p>
            <p className="text-xs text-gray-500 mt-0.5">Age</p>
          </div>
          {appSize && (
            <div className="border-l border-gray-200 px-4" data-track-element="size">
              <p className="text-lg font-bold text-gray-700">{appSize}</p>
              <p className="text-xs text-gray-500 mt-0.5">Size</p>
            </div>
          )}
        </div>
      </div>

      {/* Screenshots/Video Gallery */}
      <div className="py-4">
        <div
          ref={galleryRef}
          onScroll={handleGalleryScroll}
          className="flex gap-3 overflow-x-auto px-5 scrollbar-hide"
          data-track-element="gallery"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Video (autoplays on iOS) */}
          {videoUrl && (
            <div className="flex-shrink-0 w-[230px] h-[420px] rounded-2xl overflow-hidden bg-gray-100">
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                className="w-full h-full object-cover"
                data-track-element="video"
              />
            </div>
          )}
          {/* Screenshots */}
          {screenshotUrls.map((url, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[230px] h-[420px] rounded-2xl overflow-hidden bg-gray-100"
              data-track-element={`screenshot-${idx}`}
            >
              <img
                src={url}
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Placeholder screenshots if none provided */}
          {screenshotUrls.length === 0 && !videoUrl && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[230px] h-[420px] rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center"
                >
                  <span className="text-gray-400 text-sm">Screenshot {i}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-4 border-t border-gray-200" data-track-element="description">
        <div className={`text-sm text-gray-700 leading-relaxed ${!showFullDescription ? "line-clamp-3" : ""}`}>
          {description || "No description available."}
        </div>
        {description && description.length > 150 && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-store-blue text-sm font-medium mt-1"
          >
            {showFullDescription ? "less" : "more"}
          </button>
        )}
      </div>

      {/* Reviews section */}
      <div className="px-5 py-4 border-t border-gray-200" data-track-element="reviews">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-gray-900">Ratings & Reviews</h3>
          <span className="text-store-blue text-sm font-medium">See All</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">{rating.toFixed(1)}</p>
            <p className="text-sm text-gray-500">out of 5</p>
          </div>
          <div className="flex-1 space-y-1 pt-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: star }).map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full"
                    style={{
                      width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{formatReviewCount(reviewCount)} Ratings</p>
      </div>
    </div>
  );
}
